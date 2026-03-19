import {contextBridge, ipcRenderer, IpcRendererEvent} from "electron";
import {BroadcastChannelMap} from "./main/utils/broadcast";
import {
    AmbientBtn,
    AmbientProfile,
    BoardType,
    DeepPartial,
    DiscordData,
    DiscordStatus,
    GridBtn,
    GridPos,
    GridProfile,
    IpcResponse,
    MediaType,
    PlayerTrack,
    RemoteMessage,
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

type ListenerCallback<K extends keyof BroadcastChannelMap> = (...args: BroadcastChannelMap[K]) => void;

const createListener = <K extends keyof BroadcastChannelMap>(channel: K, callback: ListenerCallback<K>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscription = (_event: IpcRendererEvent, ...args: any[]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (callback as (...args: any[]) => void)(...args);
    };

    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
}

const windowApi = {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    getInfo: (): Promise<WindowInfo> => ipcRenderer.invoke('window:info'),
    open: (route: Route, args?: unknown) => ipcRenderer.send('window:open', route, args),
    isBoardOpen: (boardType: BoardType): Promise<boolean> => ipcRenderer.invoke('window:is_board_open', boardType),
}

const settingsApi = {
    get: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
    set: (settings: DeepPartial<Settings>) => ipcRenderer.send('settings:set', settings),

    onChanged: (func: (settings: Settings) => void) => createListener('settings:changed', func),
}

const gridProfilesApi = {
    getAll: (boardType: Exclude<BoardType, 'ambient'>): Promise<SbGridProfile[]> => ipcRenderer.invoke('grid_profiles:get_all', boardType),
    get: (boardType: Exclude<BoardType, 'ambient'>, id: string): Promise<SbGridProfile | null> => ipcRenderer.invoke('grid_profiles:get', boardType, id),
    getActive: (boardType: Exclude<BoardType, 'ambient'>): Promise<SbGridProfile | null> => ipcRenderer.invoke('grid_profiles:get_active', boardType),
    create: (boardType: Exclude<BoardType, 'ambient'>, profile: Partial<GridProfile>): Promise<IpcResponse<void>> => ipcRenderer.invoke('grid_profiles:create', boardType, profile),
    update: (boardType: Exclude<BoardType, 'ambient'>, id: string, profile: Partial<GridProfile>): Promise<IpcResponse<void>> => ipcRenderer.invoke('grid_profiles:update', boardType, id, profile),
    delete: (boardType: Exclude<BoardType, 'ambient'>, id: string): Promise<IpcResponse<void>> => ipcRenderer.invoke('grid_profiles:delete', boardType, id),
    import: (boardType: Exclude<BoardType, 'ambient'>) => ipcRenderer.send('grid_profiles:import', boardType),
    export: (boardType: Exclude<BoardType, 'ambient'>, id: string) => ipcRenderer.send('grid_profiles:export', boardType, id),
    exportAll: (boardType: Exclude<BoardType, 'ambient'>) => ipcRenderer.send('grid_profiles:export_all', boardType),

    onMusicChanged: (func: (profiles: SbGridProfile[]) => void) => createListener('grid_profiles:music:changed', func),
    onSfxChanged: (func: (profiles: SbGridProfile[]) => void) => createListener('grid_profiles:sfx:changed', func),

    buttons: {
        get: (boardType: Exclude<BoardType, 'ambient'>, profileId: string, buttonId: string): Promise<SbGridBtn | null> => ipcRenderer.invoke('grid_profiles:buttons:get', boardType, profileId, buttonId),
        update: (boardType: Exclude<BoardType, 'ambient'>, profileId: string, buttonId: string, updates: DeepPartial<GridBtn>): Promise<IpcResponse<void>> => ipcRenderer.invoke('grid_profiles:buttons:update', boardType, profileId, buttonId, updates),
        swap: (boardType: Exclude<BoardType, 'ambient'>, profileId: string, pos1: GridPos, pos2: GridPos): Promise<IpcResponse<void>> => ipcRenderer.invoke('grid_profiles:buttons:swap', boardType, profileId, pos1, pos2),
        updateTrack: (boardType: Exclude<BoardType, 'ambient'>, profileId: string, gridPos: GridPos, source: TrackSourceName, media: YTSearchResult | string, customTitle?: string): Promise<IpcResponse<void>> => ipcRenderer.invoke('grid_profiles:buttons:update_track', boardType, profileId, gridPos, source, media, customTitle),
        delete: (boardType: Exclude<BoardType, 'ambient'>, profileId: string, buttonId: string): Promise<IpcResponse<void>> => ipcRenderer.invoke('grid_profiles:buttons:delete', boardType, profileId, buttonId),
    }
}

const ambientProfilesApi = {
    getAll: (): Promise<SbAmbientProfile[]> => ipcRenderer.invoke('ambient_profiles:get_all'),
    get: (id: string): Promise<SbAmbientProfile | null> => ipcRenderer.invoke('ambient_profiles:get', id),
    getActive: (): Promise<SbAmbientProfile | null> => ipcRenderer.invoke('ambient_profiles:get_active'),
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
    getUsed: (): Promise<string[]> => ipcRenderer.invoke('tracks:get_used'),

    onChanged: (func: (tracks: Track[]) => void) => createListener('tracks:changed', func),
}

const systemApi = {
    openLink: (url: string) => ipcRenderer.send('system:open_link', url),
    openFileMediaSelector: (mediaType?: MediaType): Promise<IpcResponse<string>> => ipcRenderer.invoke('system:open_file_media_selector', mediaType),
    openFile: (path?: string) => ipcRenderer.send('system:open_file', path),
}

const musicApi = {
    useApi: (): Promise<boolean> => ipcRenderer.invoke('musicapi:use_api'),
    search: (query: string): Promise<IpcResponse<YTSearchResult[]>> => ipcRenderer.invoke('musicapi:search', query),
}

const discordApi = {
    sendAudioPacket: (playerId: string, buffer: ArrayBuffer) => ipcRenderer.send('discord:audio_packet', playerId, buffer),
    getStatus: (): Promise<DiscordStatus> => ipcRenderer.invoke('discord:status'),
    getGuilds: (): Promise<DiscordData[]> => ipcRenderer.invoke('discord:guilds'),
    getChannels: (guildId: string): Promise<DiscordData[]> => ipcRenderer.invoke('discord:channels', guildId),
}

const playerApi = {
    stopPreview: () => ipcRenderer.send('player:preview_stopped'),
    playNow: (boardType: Exclude<BoardType, 'ambient'>, source: TrackSourceName, media: YTSearchResult | string, customTitle?: string): Promise<IpcResponse<void>> => ipcRenderer.invoke('player:play_now', boardType, source, media, customTitle),

    onPreviewStopped: (func: () => void) => createListener('player:preview_stopped', func),
    onPlayNow: (func: (boardType: Exclude<BoardType, 'ambient'>, track: PlayerTrack) => void) => createListener('player:on_play_now', func),
    onPlayButton: (func: (buttonId: string) => void) => createListener('player:on_play_button', func),
    onStopButton: (func: (buttonId: string) => void) => createListener('player:on_stop_button', func),
    onPlay: (func: () => void) => createListener('player:on_play', func),
    onPause: (func: () => void) => createListener('player:on_pause', func),
    onStop: (func: () => void) => createListener('player:on_stop', func),
    onNext: (func: () => void) => createListener('player:on_next', func),
    onPrevious: (func: () => void) => createListener('player:on_previous', func),
}

const remoteServerApi = {
    broadcast: (payload: RemoteMessage) => ipcRenderer.send('remote-server:broadcast', payload),
}

const api = {
    window: windowApi,
    settings: settingsApi,
    gridProfiles: gridProfilesApi,
    ambientProfiles: ambientProfilesApi,
    tracks: tracksApi,
    system: systemApi,
    music: musicApi,
    discord: discordApi,
    player: playerApi,
    remoteServer: remoteServerApi,
};

contextBridge.exposeInMainWorld('electron', api);

export type ElectronAPI = typeof api;