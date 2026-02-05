import {BrowserWindow} from "electron";
import {WindowData, WindowOptions} from "../types/window";
import {MusicApi} from "./utils/music-api";
import {DiscordBot} from "./utils/discord-bot";

class StateManager {
    public mainWindow: BrowserWindow | undefined;
    public musicApi: MusicApi | null = null;
    public discordBot: DiscordBot | null = null;

    // Window management maps
    public winOptions = new Map<number, WindowOptions>();
    public winData = new Map<number, WindowData<unknown>>();
}

export const state = new StateManager();