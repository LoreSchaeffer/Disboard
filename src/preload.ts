import { contextBridge, ipcRenderer } from "electron";
import {Settings} from "./utils/store/settings";
import {Profile, SbButton, Song} from "./utils/store/profiles";

contextBridge.exposeInMainWorld('electron', {
    /* === FROM MAIN PROCESS === */
    // All Windows
    handleReady: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handleSettings: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handleProfiles: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),

    // SoundboardWin
    handlePlayNow: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handlePause: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handlePlay: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handleMediaPlayPause: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handleMediaStop: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handleMediaNext: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handleMediaPrev: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),

    // ButtonWin
    handleButton: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handleSong: (channel: string, func: (...args: unknown[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),

    /* === TO MAIN PROCESS === */
    // Navbar
    minimize: (winId : number) => ipcRenderer.send('minimize', winId),
    maximize: (winId : number) => ipcRenderer.send('maximize', winId),
    close: (winId : number) => ipcRenderer.send('close', winId),

    // Store
    saveSettings: (settings: Settings) => ipcRenderer.send('save_settings', settings),
    saveProfile: (profile: Profile) => ipcRenderer.send('save_profile', profile),
    saveButton: (profile: string, button: SbButton) => ipcRenderer.send('save_button', profile, button),

    // Profiles
    createProfile: (name: string, rows: number, cols: number) => ipcRenderer.invoke('create_profile', name, rows, cols),
    renameProfile: (id: string, name: string) => ipcRenderer.invoke('rename_profile', id, name),
    deleteProfile: (id: string) => ipcRenderer.invoke('delete_profile', id),
    importProfile: () => ipcRenderer.invoke('import_profile'),
    exportProfile: (id: string) => ipcRenderer.send('export_profile', id),
    exportProfiles: () => ipcRenderer.send('export_profiles'),

    // Windows
    openMediaSelectorWin: (row: number, col: number, winId: number) => ipcRenderer.send('open_media_selector_win', row, col, winId),
    openButtonSettingsWin: (row: number, col: number) => ipcRenderer.send('open_button_settings_win', row, col),

    // System
    openLink: (url: string) => ipcRenderer.send('open_link', url),
    openFileMediaSelector: () => ipcRenderer.invoke('open_file_media_selector'),

    // Audio
    search: (query: string) => ipcRenderer.invoke('search', query),
    getVideo: (url: string) => ipcRenderer.invoke('get_video', url),
    getStream: (url: string) => ipcRenderer.invoke('get_stream', url),
    playNow: (song: string) => ipcRenderer.invoke('play_now', song),
    pause: () => ipcRenderer.send('pause'),
    returnSong: (song: Song, winId: number) => ipcRenderer.send('return_song', song, winId),
});