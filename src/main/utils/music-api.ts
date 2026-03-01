import axios, {AxiosError, AxiosInstance, InternalAxiosRequestConfig} from "axios";
import {ApiCredentials} from "../../types/settings";
import {YTSearchResult, YTStream} from "../../types/music-api";
import {net} from "electron";
import {state} from "../state";

type AuthResponse = {
    accessToken: string;
    expiresIn: number;
}

type FailedRequest = {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}

export class MusicApi {
    private readonly api: AxiosInstance;
    private credentials: ApiCredentials;

    private accessToken: string | null = null;
    private tokenExpiration: number | null = null;
    private isRefreshing: boolean = false;
    private failedQueue: FailedRequest[] = [];

    constructor(endpoint: string, credentials: ApiCredentials) {
        this.credentials = credentials;

        this.api = axios.create({
            baseURL: endpoint + '/api',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        this.setupInterceptors();
        this.authenticate().then(() => {
            console.log('[Main] MusicApi initialized and authenticated!');
        }).catch((e) => {
            console.error('[Main] Failed to initialize MusicApi:', e);
        });
    }

    public setCredentials(credentials: ApiCredentials) {
        this.credentials = credentials;
        this.accessToken = null;
        this.tokenExpiration = null;
        this.authenticate();
    }

    public setEndpoint(endpoint: string) {
        this.api.defaults.baseURL = endpoint + '/api';
        this.accessToken = null;
        this.tokenExpiration = null;
        this.authenticate();
    }

    public async search(query: string): Promise<YTSearchResult[]> {
        const res = await this.api.get<YTSearchResult[]>('/newpipe/search', {
            params: {
                query: query
            }
        });

        if (res.status < 200 || res.status >= 300) throw new Error(`Search request failed with status ${res.status}`);
        return res.data;
    }

    public async getStream(videoId: string): Promise<string> {
        const res = await this.api.get<YTStream>('/newpipe/stream', {
            params: {
                id: videoId
            }
        });

        if (res.status < 200 || res.status >= 300) throw new Error(`Get stream request failed with status ${res.status}`);
        return res.data?.content;
    }

    public getStreamProxy = (audioUrl: string): string => {
        return `${this.api.defaults.baseURL}/proxy/audio?url=${encodeURIComponent(audioUrl)}`;
    }

    public isAuthenticated(): boolean {
        return this.accessToken !== null;
    }

    private async authenticate(): Promise<string> {
        try {
            const response = await this.api.post<AuthResponse>('/auth/token', {
                clientId: this.credentials.clientId,
                clientSecret: this.credentials.clientSecret,
            });

            const {accessToken, expiresIn} = response.data;
            this.accessToken = accessToken;
            this.tokenExpiration = Date.now() + ((expiresIn - 10) * 1000);

            console.log('[Main] Music API authenticated successfully, token expires in', expiresIn, 'seconds');

            return accessToken;
        } catch (e) {
            console.error('Authentication failed:', e);
            throw e;
        }
    }

    private processQueue(error: unknown, token: string | null = null) {
        this.failedQueue.forEach(prom => {
            if (error) prom.reject(error);
            else prom.resolve(token!);
        });
        this.failedQueue = [];
    }

    private setupInterceptors() {
        this.api.interceptors.request.use(
            async (config) => {
                if (config.url?.includes('/auth/token')) return config;

                const currentTime = Date.now();
                if (!this.accessToken || (this.tokenExpiration && currentTime >= this.tokenExpiration)) {
                    if (!this.isRefreshing) {
                        this.isRefreshing = true;
                        try {
                            const newToken = await this.authenticate();
                            this.processQueue(null, newToken);
                            config.headers.Authorization = `Bearer ${newToken}`;
                        } catch (error) {
                            this.processQueue(error, null);
                            return Promise.reject(error);
                        } finally {
                            this.isRefreshing = false;
                        }
                    } else {
                        return new Promise<string>((resolve, reject) => {
                            this.failedQueue.push({resolve, reject});
                        }).then(token => {
                            config.headers.Authorization = `Bearer ${token}`;
                            return config;
                        });
                    }
                } else {
                    config.headers.Authorization = `Bearer ${this.accessToken}`;
                }

                return config;
            },
            (error) => Promise.reject(error)
        );

        this.api.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

                if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/token')) {
                    if (this.isRefreshing) {
                        return new Promise<string>((resolve, reject) => {
                            this.failedQueue.push({resolve, reject});
                        }).then(token => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            return this.api(originalRequest);
                        }).catch(err => Promise.reject(err));
                    }

                    originalRequest._retry = true;
                    this.isRefreshing = true;

                    try {
                        const newToken = await this.authenticate();
                        this.processQueue(null, newToken);
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return this.api(originalRequest);
                    } catch (authError) {
                        this.processQueue(authError, null);
                        return Promise.reject(authError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                return Promise.reject(error);
            }
        );
    }
}

export const getVideoId = (url: string): string | null => {
    const ytRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(ytRegex);
    return match ? match[1] : null;
}

export const getBestThumbnail = (thumbnails: ({url: string; width: number; height: number})[]): string | null => {
    if (thumbnails.length === 0) return null;
    const sorted = thumbnails.sort((a, b) => (b.width * b.height) - (a.width * a.height));
    return sorted[0].url;
}

const ytStreamCache = new Map<string, string>();

export const getYoutubeStream = async (videoId: string): Promise<string> => {
    const cachedStream = ytStreamCache.get(videoId);

    if (cachedStream) {
        try {
            const response = await net.fetch(cachedStream, {method: 'HEAD'});

            if (response.status >= 200 && response.status < 400) {
                return cachedStream;
            } else ytStreamCache.delete(videoId);
        } catch {
            ytStreamCache.delete(videoId);
        }
    }

    if (!state.musicApi) throw new Error('not_initialized');
    if (!state.musicApi.isAuthenticated()) throw new Error('not_authenticated');

    const result = await state.musicApi.getStream(videoId);
    ytStreamCache.set(videoId, result);

    return result;
}