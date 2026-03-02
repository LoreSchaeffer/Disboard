import {contextBridge, ipcRenderer, IpcRendererEvent} from "electron";
import {BroadcastChannelMap} from "./main/utils/broadcast";
import {
    AmbientBtn,
    AmbientProfile,
    BoardType,
    DiscordData,
    DiscordStatus,
    GridBtn,
    GridProfile,
    IpcResponse,
    MediaType,
    PlayerTrack,
    Route,
    SbAmbientBtn,
    SbAmbientProfile,
    SbGridBtn,
    SbGridProfile,
    Settings,
    Track,
    TrackSourceName,
    WindowInfo,
    YTSearchResult
} from "./types";

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

    onChanged: (func: (settings: Settings) => void) => createListener('settings:changed', func),
}

const gridProfilesApi = {
    getAll: (boardType: BoardType): Promise<SbGridProfile[]> => ipcRenderer.invoke('grid_profiles:get_all', boardType),
    get: (boardType: BoardType, id: string): Promise<SbGridProfile | null> => ipcRenderer.invoke('grid_profiles:get', boardType, id),
    create: (boardType: BoardType, profile: Partial<GridProfile>): Promise<IpcResponse<void>> => ipcRenderer.invoke('grid_profiles:create', boardType, profile),
    update: (boardType: BoardType, id: string, profile: Partial<GridProfile>): Promise<IpcResponse<void>> => ipcRenderer.invoke('grid_profiles:update', boardType, id, profile),
    delete: (boardType: BoardType, id: string): Promise<IpcResponse<void>> => ipcRenderer.invoke('grid_profiles:delete', boardType, id),
    import: (boardType: BoardType) => ipcRenderer.send('grid_profiles:import', boardType),
    export: (boardType: BoardType, id: string) => ipcRenderer.send('grid_profiles:export', boardType, id),
    exportAll: (boardType: BoardType) => ipcRenderer.send('grid_profiles:export_all', boardType),

    onMusicChanged: (func: (profiles: SbGridProfile[]) => void) => createListener('grid_profiles:music:changed', func),
    onSfxChanged: (func: (profiles: SbGridProfile[]) => void) => createListener('grid_profiles:sfx:changed', func),

    buttons: {
        get: (boardType: BoardType, profileId: string, buttonId: string): Promise<SbGridBtn | null> => ipcRenderer.invoke('grid_profiles:buttons:get', boardType, profileId, buttonId),
        update: (boardType: BoardType, profileId: string, buttonId: string, updates: Partial<GridBtn>): Promise<IpcResponse<void>> => ipcRenderer.invoke('grid_profiles:buttons:update', boardType, profileId, buttonId, updates),
        delete: (boardType: BoardType, profileId: string, buttonId: string): Promise<IpcResponse<void>> => ipcRenderer.invoke('grid_profiles:buttons:delete', boardType, profileId, buttonId),
    }
}

const ambientProfilesApi = {
    getAll: (): Promise<SbAmbientProfile[]> => ipcRenderer.invoke('ambient_profiles:get_all'),
    get: (id: string): Promise<SbAmbientProfile | null> => ipcRenderer.invoke('ambient_profiles:get', id),
    create: (profile: Partial<AmbientProfile>): Promise<IpcResponse<void>> => ipcRenderer.invoke('ambient_profiles:create', profile),
    update: (id: string, profile: Partial<AmbientProfile>): Promise<IpcResponse<void>> => ipcRenderer.invoke('ambient_profiles:update', id, profile),
    delete: (id: string): Promise<IpcResponse<void>> => ipcRenderer.invoke('ambient_profiles:delete', id),
    import: () => ipcRenderer.send('ambient_profiles:import'),
    export: (id: string) => ipcRenderer.send('ambient_profiles:export', id),
    exportAll: () => ipcRenderer.send('ambient_profiles:export_all'),

    onChanged: (func: (profiles: SbAmbientProfile[]) => void) => createListener('ambient_profiles:changed', func),

    buttons: {
        get: (profileId: string, buttonId: string): Promise<SbAmbientBtn | null> => ipcRenderer.invoke('ambient_profiles:buttons:get', profileId, buttonId),
        update: (profileId: string, buttonId: string, updates: Partial<AmbientBtn>): Promise<IpcResponse<void>> => ipcRenderer.invoke('ambient_profiles:buttons:update', profileId, buttonId, updates),
        delete: (profileId: string, buttonId: string): Promise<IpcResponse<void>> => ipcRenderer.invoke('ambient_profiles:buttons:delete', profileId, buttonId),
    }
}

const tracksApi = {
    getAll: (): Promise<Track[]> => ipcRenderer.invoke('tracks:get_all'),
    get: (id: string): Promise<Track | null> => ipcRenderer.invoke('tracks:get', id),
    getVolatile: (source: TrackSourceName, media: YTSearchResult | string): Promise<IpcResponse<PlayerTrack>> => ipcRenderer.invoke('tracks:get_volatile', source, media),
    delete: (id: string): Promise<IpcResponse<void>> => ipcRenderer.invoke('tracks:delete', id),

    onChanged: (func: (tracks: Track[]) => void) => createListener('tracks:changed', func),
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
    gridProfiles: gridProfilesApi,
    ambientProfiles: ambientProfilesApi,
    tracks: tracksApi,
    system: systemApi,
    music: musicApi,
    discord: discordApi
};

contextBridge.exposeInMainWorld('electron', api);

export type ElectronAPI = typeof api;