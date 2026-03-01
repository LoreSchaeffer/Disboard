import {contextBridge, ipcRenderer, IpcRendererEvent} from "electron";
import {BroadcastChannelMap} from "./main/utils/broadcast";
import {Route, Settings, WindowInfo} from "./types";

type ListenerCallback<K extends keyof BroadcastChannelMap> = BroadcastChannelMap[K] extends void ? () => void : (data: BroadcastChannelMap[K]) => void;

const createListener = <K extends keyof BroadcastChannelMap>(channel: K, callback: ListenerCallback<K>) => {
    const subscription = (_event: IpcRendererEvent, data: unknown) => {
        const safeCallback = callback as (payload?: unknown) => void;
        safeCallback(data);
    };

    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
}

const windowApi = {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    getInfo: (): Promise<WindowInfo> => ipcRenderer.invoke('window:info'),
    open: (route: Route, args?: unknown) => ipcRenderer.send('window:open', route, args),
}

const settingsApi = {
    get: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
    set: (settings: Partial<Settings>) => ipcRenderer.send('settings:set', settings),

    onChange: (func: (settings: Settings) => void) => createListener('settings:change', func),
}

const profilesApi = {
    getAll: (soundboardType: SoundboardWithProfile): Promise<SbProfile[]> => ipcRenderer.invoke('profiles:get_all', soundboardType),
    get: (soundboardType: SoundboardWithProfile, id: string): Promise<SbProfile | null> => ipcRenderer.invoke('profiles:get', soundboardType, id),
    create: (soundboardType: SoundboardWithProfile, profile: Partial<SbProfile>): Promise<IpcResponse<void>> => ipcRenderer.invoke('profiles:create', soundboardType, profile),
    update: (soundboardType: SoundboardWithProfile, id: string, profile: Partial<SbProfile>): Promise<IpcResponse<void>> => ipcRenderer.invoke('profiles:update', soundboardType, id, profile),
    delete: (soundboardType: SoundboardWithProfile, id: string): Promise<IpcResponse<void>> => ipcRenderer.invoke('profiles:delete', soundboardType, id),
    import: (soundboardType: SoundboardWithProfile) => ipcRenderer.send('profiles:import', soundboardType),
    export: (soundboardType: SoundboardWithProfile, id: string) => ipcRenderer.send('profiles:export', soundboardType, id),
    exportAll: (soundboardType: SoundboardWithProfile) => ipcRenderer.send('profiles:export_all', soundboardType),

    onChange: (func: (soundboardType: SoundboardWithProfile, profiles: SbProfile[] | SbSfxProfile[]) => void) => createListener('profiles:change', func),

    buttons: {
        get: (soundboardType: SoundboardWithProfile, profileId: string, buttonId: string): Promise<SbBtn | null> => ipcRenderer.invoke('profiles:buttons:get', soundboardType, profileId, buttonId),
        update: (soundboardType: SoundboardWithProfile, profileId: string, buttonId: string, updates: Partial<Btn>): Promise<IpcResponse<void>> => ipcRenderer.invoke('profiles:buttons:update', soundboardType, profileId, buttonId, updates),
        delete: (soundboardType: SoundboardWithProfile, profileId: string, buttonId: string): Promise<IpcResponse<void>> => ipcRenderer.invoke('profiles:buttons:delete', soundboardType, profileId, buttonId),
    }
}

const tracksApi = {
    getAll: (): Promise<Track[]> => ipcRenderer.invoke('tracks:get_all'),
    get: (id: string): Promise<Track | null> => ipcRenderer.invoke('tracks:get', id),
    add: (source: TrackSource, media: YTSearchResult | string, customTitle: string): Promise<IpcResponse<Track>> => ipcRenderer.invoke('tracks:add', source, media, customTitle),
    remove: (id: string): Promise<IpcResponse<void>> => ipcRenderer.invoke('tracks:remove', id),
    getVolatileTrack: (source: TrackSource, media: YTSearchResult | string): Promise<IpcResponse<PlayerTrack>> => ipcRenderer.invoke('tracks:get_volatile_track', source, media),

    onChange: (func: (tracks: Track[]) => void) => createListener('tracks:change', func),
}

const playerApi = {
    playNow: (track: PlayerTrack) => ipcRenderer.send('player:play_now', track),

    onPlayNow: (func: (track: PlayerTrack) => void) => createListener('player:play_now', func),
    onPause: (func: () => void) => createListener('player:pause', func),
    onPlay: (func: () => void) => createListener('player:play', func),
    onPlayPause: (func: () => void) => createListener('player:play_pause', func),
    onStop: (func: () => void) => createListener('player:stop', func),
    onNext: (func: () => void) => createListener('player:next', func),
    onPrev: (func: () => void) => createListener('player:prev', func),
}

const systemApi = {
    openLink: (url: string) => ipcRenderer.send('system:open_link', url),
    openFileMediaSelector: (mediaType?: MediaType): Promise<IpcResponse<string>> => ipcRenderer.invoke('system:open_file_media_selector', mediaType),
}

const musicApi = {
    useApi: (): Promise<boolean> => ipcRenderer.invoke('musicapi:use_api'),
    search: (query: string): Promise<IpcResponse<YTSearchResult[]>> => ipcRenderer.invoke('musicapi:search', query),
}

const discordApi = {
    sendAudioPacket: (buffer: ArrayBuffer) => ipcRenderer.send('discord:audio_packet', buffer),
    getStatus: (): Promise<DiscordStatus> => ipcRenderer.invoke('discord:status'),
    getGuilds: (): Promise<DiscordData[]> => ipcRenderer.invoke('discord:guilds'),
    getChannels: (guildId: string): Promise<DiscordData[]> => ipcRenderer.invoke('discord:channels', guildId),
}

const api = {
    window: windowApi,
    settings: settingsApi,
    profiles: profilesApi,
    tracks: tracksApi,
    player: playerApi,
    system: systemApi,
    music: musicApi,
    discord: discordApi
};

contextBridge.exposeInMainWorld('electron', api);

export type ElectronAPI = typeof api;