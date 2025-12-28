import {contextBridge, ipcRenderer} from "electron";
import {Profile, SbButton, Settings} from "./types/storage";
import {Track} from "./types/track";
import {WindowInfo} from "./types/common";

const api = {
    /* === FROM MAIN PROCESS === */
    // All Windows
    onSettingsChanged: (func: (settings: Settings) => void) => {
        const sub = (_: unknown, val: Settings) => func(val);
        ipcRenderer.on('settings', sub);
        return () => ipcRenderer.removeListener('settings', sub);
    },
    onProfilesChanged: (func: (profiles: Profile[]) => void) => {
        const sub = (_: unknown, val: Profile[]) => func(val);
        ipcRenderer.on('profiles', sub);
        return () => ipcRenderer.removeListener('profiles', sub);
    },

    // SoundboardWin
    onPlayNow: (func: (track: Track) => void) => ipcRenderer.on('play_now', (_, track: Track) => func(track)),
    handlePause: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (_, ...args) => func(...args)),
    handlePlay: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (_, ...args) => func(...args)),
    handleMediaPlayPause: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (_, ...args) => func(...args)),
    handleMediaStop: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (_, ...args) => func(...args)),
    handleMediaNext: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (_, ...args) => func(...args)),
    handleMediaPrev: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (_, ...args) => func(...args)),

    // ButtonWin
    handleButton: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (_, ...args) => func(...args)),
    handleTrack: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (_, ...args) => func(...args)),

    /* === TO MAIN PROCESS === */
    // Window
    getWindow: (): Promise<WindowInfo> => ipcRenderer.invoke('get_window'),

    // Navbar
    minimize: () => ipcRenderer.send('minimize'),
    maximize: () => ipcRenderer.send('maximize'),
    close: () => ipcRenderer.send('close'),

    // Store
    getSettings: (): Promise<Settings> => ipcRenderer.invoke('get_settings'),
    saveSettings: (settings: Settings) => ipcRenderer.send('save_settings', settings),


    saveProfile: (profile: Profile) => ipcRenderer.send('save_profile', profile),
    saveButton: (profile: string, button: SbButton) => ipcRenderer.send('save_button', profile, button),
    deleteButton: (profile: string, row: number, col: number) => ipcRenderer.send('delete_button', profile, row, col),

    // Profiles
    getProfiles: (): Promise<Profile[]> => ipcRenderer.invoke('get_profiles'),


    createProfile: (name: string, rows: number, cols: number) => ipcRenderer.invoke('create_profile', name, rows, cols),
    deleteProfile: (id: string) => ipcRenderer.invoke('delete_profile', id),
    importProfile: () => ipcRenderer.invoke('import_profile'),
    exportProfile: (id: string) => ipcRenderer.send('export_profile', id),
    exportProfiles: () => ipcRenderer.send('export_profiles'),

    // Windows
    openMediaSelectorWin: (row: number, col: number,) => ipcRenderer.send('open_media_selector_win', row, col),
    openButtonSettingsWin: (row: number, col: number) => ipcRenderer.send('open_button_settings_win', row, col),
    openNewProfileWin: () => ipcRenderer.send('open_new_profile_win'),

    // System
    openLink: (url: string) => ipcRenderer.send('open_link', url),
    openFileMediaSelector: () => ipcRenderer.invoke('open_file_media_selector'),

    // Audio
    search: (query: string) => ipcRenderer.invoke('search', query),
    getVideo: (url: string) => ipcRenderer.invoke('get_video', url),
    getStream: (url: string) => ipcRenderer.invoke('get_stream', url),
    playNow: (track: string) => ipcRenderer.send('play_now', track),
    pause: () => ipcRenderer.send('pause'),
    returnTrack: (track: Track, winId: number) => ipcRenderer.send('return_track', track, winId),

    // Misc
    getFileSeparator: () => ipcRenderer.invoke('get_file_separator'),
}

contextBridge.exposeInMainWorld('electron', api);

export type ElectronAPI = typeof api;