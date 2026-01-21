import {contextBridge, ipcRenderer} from "electron";
import {IpcResponse} from "./types/common";
import {Settings} from "./types/settings";
import {PlayerTrack, SbBtn, SbProfile, Track, TrackSource} from "./types/data";
import {WindowId, WindowInfo} from "./types/window";
import {YTSearchResult} from "./types/music-api";

const api = {
    /* === FROM MAIN PROCESS === */
    // All Windows
    onSettingsChanged: (func: (settings: Settings) => void) => {
        const sub = (_: unknown, val: Settings) => func(val);
        ipcRenderer.on('settings', sub);
        return () => ipcRenderer.removeListener('settings', sub);
    },
    onProfilesChanged: (func: (profiles: SbProfile[]) => void) => {
        const sub = (_: unknown, val: SbProfile[]) => func(val);
        ipcRenderer.on('profiles', sub);
        return () => ipcRenderer.removeListener('profiles', sub);
    },

    // Main Window
    onPlayNow: (func: (track: PlayerTrack) => void) => {
        const sub = (_: unknown, track: PlayerTrack) => func(track);
        ipcRenderer.on('play_now', sub);
        return () => ipcRenderer.removeListener('play_now', sub);
    },

    // SoundboardWin
    handlePause: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (_, ...args) => func(...args)),
    handlePlay: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (_, ...args) => func(...args)),
    handleMediaPlayPause: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (_, ...args) => func(...args)),
    handleMediaStop: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (_, ...args) => func(...args)),
    handleMediaNext: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (_, ...args) => func(...args)),
    handleMediaPrev: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (_, ...args) => func(...args)),

    // ButtonWin
    handleTrack: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (_, ...args) => func(...args)),

    /* === TO MAIN PROCESS === */
    // Window
    minimize: () => ipcRenderer.send('minimize'),
    maximize: () => ipcRenderer.send('maximize'),
    close: () => ipcRenderer.send('close'),
    getWindow: (): Promise<WindowInfo> => ipcRenderer.invoke('get_window'),
    openWindow: (winId: WindowId, args?: unknown) => ipcRenderer.send('open_window', winId, args),

    // Store
    getSettings: (): Promise<Settings> => ipcRenderer.invoke('get_settings'),
    updateSettings: (settings: Partial<Settings>) => ipcRenderer.send('update_settings', settings),

    // Profiles
    getProfiles: (): Promise<SbProfile[]> => ipcRenderer.invoke('get_profiles'),
    getProfile: (id: string): Promise<SbProfile | null> => ipcRenderer.invoke('get_profile', id),
    createProfile: (profile: Partial<SbProfile>): Promise<IpcResponse<void>> => ipcRenderer.invoke('create_profile', profile),
    updateProfile: (id: string, profile: Partial<SbProfile>): Promise<IpcResponse<void>> => ipcRenderer.invoke('update_profile', id, profile),
    deleteProfile: (id: string): Promise<IpcResponse<void>> => ipcRenderer.invoke('delete_profile', id),
    importProfile: () => ipcRenderer.send('import_profile'),
    exportProfile: (id: string) => ipcRenderer.send('export_profile', id),
    exportProfiles: () => ipcRenderer.send('export_profiles'),
    getButton: (profileId: string, buttonId: string): Promise<SbBtn | null> => ipcRenderer.invoke('get_button', profileId, buttonId),
    updateButton: (profileId: string, buttonId: string, updates: Partial<SbBtn>): Promise<IpcResponse<void>> => ipcRenderer.invoke('update_button', profileId, buttonId, updates),
    deleteButton: (profileId: string, buttonId: string): Promise<IpcResponse<void>> => ipcRenderer.invoke('delete_button', profileId, buttonId),

    // Tracks
    getTracks: (): Promise<Track[]> => ipcRenderer.invoke('get_tracks'),
    getTrack: (trackId: string): Promise<Track | null> => ipcRenderer.invoke('get_track', trackId),
    addTrack: (source: TrackSource, media: YTSearchResult | string, profileId: string, buttonId: string) => ipcRenderer.invoke('add_track', source, media, profileId, buttonId),
    playNow: (source: TrackSource, media: YTSearchResult | string) => ipcRenderer.send('play_now', source, media),
    getVolatileTrack: (source: TrackSource, media: YTSearchResult | string): Promise<IpcResponse<PlayerTrack>> => ipcRenderer.invoke('get_volatile_track', source, media),

    // System
    openLink: (url: string) => ipcRenderer.send('open_link', url),
    openFileMediaSelector: (): Promise<IpcResponse<string>> => ipcRenderer.invoke('open_file_media_selector'),

    // Music API
    useMusicApi: (): Promise<boolean> => ipcRenderer.invoke('use_music_api'),
    searchMusic: (query: string): Promise<IpcResponse<YTSearchResult[]>> => ipcRenderer.invoke('search_music', query),
    getVideoStream: (videoId: string): Promise<IpcResponse<string>> => ipcRenderer.invoke('get_video_stream', videoId),
}

contextBridge.exposeInMainWorld('electron', api);

export type ElectronAPI = typeof api;