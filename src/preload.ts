import { contextBridge, ipcRenderer } from "electron";
import {Settings} from "./utils/store/settings";

contextBridge.exposeInMainWorld('electron', {
    /* === FROM MAIN PROCESS === */
    // All Windows
    handleReady: (channel: string, func: (...args: any[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handleSettings: (channel: string, func: (...args: any[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    handleProfiles: (channel: string, func: (...args: any[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(...args)),

    /* === TO MAIN PROCESS === */
    // Navbar
    minimize: (winId : number) => ipcRenderer.send('minimize', winId),
    maximize: (winId : number) => ipcRenderer.send('maximize', winId),
    close: (winId : number) => ipcRenderer.send('close', winId),

    // Store
    getSettings: () => ipcRenderer.invoke('get_settings'),
    getProfiles: () => ipcRenderer.invoke('get_profiles'),
    saveSettings: (settings: Settings) => ipcRenderer.send('save_settings', settings),

    // Audio
    search: (query: string) => ipcRenderer.invoke('search', query),
});

/* === FROM MAIN PROCESS === */
// All windows
// handleParent: (callback) => ipcRenderer.on('parent', callback),

// Main window
// handleButtonUpdate: (callback) => ipcRenderer.on('button_update', callback),
// handlePlayNow: (callback) => ipcRenderer.on('play_now', callback),
// handleMediaPlayPause: (callback) => ipcRenderer.on('media_play_pause', callback),
// handleMediaStop: (callback) => ipcRenderer.on('media_stop', callback),
// handleMediaNext: (callback) => ipcRenderer.on('media_next', callback),
// handleMediaPrev: (callback) => ipcRenderer.on('media_prev', callback),

// Buttons windows
// handleButton: (callback) => ipcRenderer.on('button', callback),

// // Media selector windows
// handleCallback: (callback) => ipcRenderer.on('callback', callback),

/* === TO MAIN PROCESS === */

// Windows
// openBrowser: (url) => ipcRenderer.send('open_browser', url),
// openMediaSelector: (profile, row, col, winId, callback) => ipcRenderer.send('open_media_selector', profile, row, col, winId, callback),
// openFileMediaSelector: () => ipcRenderer.invoke('open_file_media_selector'),
// openButtonSettings: (profile, row, col) => ipcRenderer.send('open_button_settings', profile, row, col),
// openPlayNowWindow: () => ipcRenderer.send('open_play_now_window'),

// Settings
// getSoundboardSettings: () => ipcRenderer.invoke('get_soundboard_settings'),
// setSoundboardSize: (profile, rows, cols) => ipcRenderer.send('set_soundboard_size', profile, rows, cols),
// setVolume: (volume) => ipcRenderer.send('set_volume', volume),
// setMediaOutput: (device) => ipcRenderer.send('set_media_output', device),
// setActiveProfile: (profile) => ipcRenderer.invoke('set_active_profile', profile),
// setLoop: (loop) => ipcRenderer.send('set_loop', loop),
// setFontSize: (size) => ipcRenderer.send('set_font_size', size),

// Profiles
// getProfiles: () => ipcRenderer.invoke('get_profiles'),
// createProfile: (name) => ipcRenderer.invoke('create_profile', name),
// renameProfile: (id, name) => ipcRenderer.invoke('rename_profile', id, name),
// deleteProfile: (id) => ipcRenderer.invoke('delete_profile', id),
// importProfile: () => ipcRenderer.invoke('import_profile'),
// exportProfile: (id) => ipcRenderer.send('export_profile', id),

// Buttons
// getButtons: (profile) => ipcRenderer.invoke('get_buttons', profile),
// getButton: (profile, row, col) => ipcRenderer.invoke('get_button', profile, row, col),
// getTrack: (profile, row, col) => ipcRenderer.invoke('get_track', profile, row, col),
// setButton: (profile, button, winId) => ipcRenderer.send('set_button', profile, button, winId),
// swapButtons: (profile, row1, col1, row2, col2) => ipcRenderer.invoke('swap_buttons', profile, row1, col1, row2, col2),
// deleteButton: (profile, row, col) => ipcRenderer.send('delete_button', profile, row, col),
// mediaSelectorButton: (profile, button, parent, callback) => ipcRenderer.send('media_selector_button', profile, button, parent, callback),
// refreshUrl: (profile, row, col) => ipcRenderer.send('refresh_url', profile, row, col),

// Misc
// playNow: (track) => ipcRenderer.send('play_now', track),
// getStreamUrl: (uri) => ipcRenderer.invoke('get_stream_url', uri),