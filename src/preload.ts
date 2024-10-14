import { contextBridge, ipcRenderer } from "electron";
import {Settings} from "./utils/store/settings";
import {SbButton} from "./utils/store/profiles";

contextBridge.exposeInMainWorld('electron', {
    /* === FROM MAIN PROCESS === */
    // All Windows
    handleReady: (channel: string, func: (...args: any[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handleSettings: (channel: string, func: (...args: any[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handleProfiles: (channel: string, func: (...args: any[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),

    // SoundboardWin
    handleButtonUpdate: (channel: string, func: (...args: any[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handlePlayNow: (channel: string, func: (...args: any[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handleMediaPlayPause: (channel: string, func: (...args: any[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handleMediaStop: (channel: string, func: (...args: any[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handleMediaNext: (channel: string, func: (...args: any[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handleMediaPrev: (channel: string, func: (...args: any[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),

    // ButtonWin
    handleButton: (channel: string, func: (...args: any[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),

    /* === TO MAIN PROCESS === */
    // Navbar
    minimize: (winId : number) => ipcRenderer.send('minimize', winId),
    maximize: (winId : number) => ipcRenderer.send('maximize', winId),
    close: (winId : number) => ipcRenderer.send('close', winId),

    // Store
    getSettings: () => ipcRenderer.invoke('get_settings'),
    getProfiles: () => ipcRenderer.invoke('get_profiles'),
    saveSettings: (settings: Settings) => ipcRenderer.send('save_settings', settings),
    saveButton: (profile: string, button: SbButton) => ipcRenderer.send('save_button', profile, button),

    // Windows
    openMediaSelectorWin: (row: number, col: number, winId: number) => ipcRenderer.send('open_media_selector_win', row, col, winId),
    openButtonSettingsWin: (row: number, col: number) => ipcRenderer.send('open_button_settings_win', row, col),
    openPlayNowWindowWin: () => ipcRenderer.send('open_play_now_win'),

    // System
    openBrowser: (url: string) => ipcRenderer.send('open_browser', url),
    openFileMediaSelector: () => ipcRenderer.invoke('open_file_media_selector'),

    // Profiles
    createProfile: (name: string, rows: number, cols: number) => ipcRenderer.invoke('create_profile', name, rows, cols),
    renameProfile: (id: string, name: string) => ipcRenderer.invoke('rename_profile', id, name),
    deleteProfile: (id: string) => ipcRenderer.invoke('delete_profile', id),
    importProfile: () => ipcRenderer.invoke('import_profile'),
    exportProfile: (id: string) => ipcRenderer.send('export_profile', id),

    // Audio
    search: (query: string) => ipcRenderer.invoke('search', query),
    playNow: (track: string) => ipcRenderer.invoke('play_now', track),
});

/* === FROM MAIN PROCESS === */
// // Media selector windows
// handleCallback: (callback) => ipcRenderer.on('callback', callback),

/* === TO MAIN PROCESS === */
// Buttons
// getButtons: (profile) => ipcRenderer.invoke('get_buttons', profile),
// getButton: (profile, row, col) => ipcRenderer.invoke('get_button', profile, row, col),
// getTrack: (profile, row, col) => ipcRenderer.invoke('get_track', profile, row, col),
// setButton: (profile, button, winId) => ipcRenderer.send('set_button', profile, button, winId),
// swapButtons: (profile, row1, col1, row2, col2) => ipcRenderer.invoke('swap_buttons', profile, row1, col1, row2, col2),
// deleteButton: (profile, row, col) => ipcRenderer.send('delete_button', profile, row, col),
// mediaSelectorButton: (profile, button, parent, callback) => ipcRenderer.send('media_selector_button', profile, button, parent, callback),
// refreshUrl: (profile, row, col) => ipcRenderer.send('refresh_url', profile, row, col),