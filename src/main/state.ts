import {BrowserWindow} from "electron";
import {WindowData, WindowOptions} from "../types/window";
import {MusicApi} from "./utils/music-api";
import {DiscordBridge} from "./components/discord-bridge";

class StateManager {
    public mainWindow: BrowserWindow | undefined;
    public musicApi: MusicApi | null = null;

    public discordBridge: DiscordBridge | null = null;

    // Window management maps
    public winOptions = new Map<number, WindowOptions>();
    public winData = new Map<number, WindowData<unknown>>();
}

export const state = new StateManager();