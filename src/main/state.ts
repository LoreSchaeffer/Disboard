import {StaticWindowData, WindowOptions} from "../types";
import {MusicApi} from "./utils/music-api";
import {DiscordBot} from "./utils/discord-bot";

class StateManager {
    public musicApi: MusicApi | null = null;
    public discordBot: DiscordBot | null = null;

    public winOptions = new Map<number, WindowOptions>();
    public winStaticData = new Map<number, StaticWindowData<unknown>>();
}

export const state = new StateManager();