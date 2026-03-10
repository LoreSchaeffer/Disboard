import {BoardType, StaticWinData, WindowOptions} from "../types";
import {MusicApi} from "./utils/music-api";
import {DiscordBot} from "./utils/discord-bot";

class StateManager {
    public musicApi: MusicApi | null = null;
    public discordBot: DiscordBot | null = null;

    public winOptions = new Map<number, WindowOptions>();
    public winStaticData = new Map<number, StaticWinData<unknown>>();
    public musicBoardId: number = null;
    public sfxBoardId: number = null;
    public ambientBoardId: number = null;
}

export const isBoardOpen = (boardType: BoardType): boolean => {
    switch (boardType) {
        case 'music':
            return state.musicBoardId !== null;
        case 'sfx':
            return state.sfxBoardId !== null;
        case 'ambient':
            return state.ambientBoardId !== null;
        default:
            return false;
    }
}

export const state = new StateManager();