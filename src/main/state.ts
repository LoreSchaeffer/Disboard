import {BoardType, StaticWinData, WindowOptions} from "../types";
import {MusicApi} from "./utils/music-api";
import {DiscordBot} from "./utils/discord-bot";
import {RemoteServer} from "./utils/remote/remote-server";
import {BrowserWindow} from "electron";

class StateManager {
    public musicApi: MusicApi | null = null;
    public discordBot: DiscordBot | null = null;
    public remoteServer: RemoteServer | null = null;

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

export const getBoardWin = (boardType: BoardType): BrowserWindow | null => {
    switch (boardType) {
        case 'music':
            if (state.musicBoardId !== null) return BrowserWindow.fromId(state.musicBoardId);
            break
        case 'sfx':
            if (state.sfxBoardId !== null) return BrowserWindow.fromId(state.sfxBoardId);
            break;
        case 'ambient':
            if (state.ambientBoardId !== null) return BrowserWindow.fromId(state.ambientBoardId);
            break;
    }

    return null;
}

export const state = new StateManager();