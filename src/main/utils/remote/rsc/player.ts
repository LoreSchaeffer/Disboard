import {remoteMain} from "../remote-main";
import {getBoardWin, isBoardOpen} from "../../../state";
import {BoardType} from "../../../../types";

export const setupPlayerRSHandlers = () => {
    remoteMain.on('player:play', () => {
        if (!isBoardOpen('music')) return;

        const board = getBoardWin('music');
        board.webContents.send('player:on_play');
    });

    remoteMain.on('player:pause', () => {
        if (!isBoardOpen('music')) return;

        const board = getBoardWin('music');
        board.webContents.send('player:on_pause');
    });

    remoteMain.on('player:next', () => {
        if (!isBoardOpen('music')) return;

        const board = getBoardWin('music');
        board.webContents.send('player:on_next');
    });

    remoteMain.on('player:previous', () => {
        if (!isBoardOpen('music')) return;

        const board = getBoardWin('music');
        board.webContents.send('player:on_previous');
    });

    remoteMain.on('player:stop', () => {
        if (!isBoardOpen('music')) return;

        const board = getBoardWin('music');
        board.webContents.send('player:on_stop');
    });

    remoteMain.on('player:play_button', (_, boardType: BoardType, id: string) => {
        if (!isBoardOpen(boardType)) return;

        getBoardWin(boardType).webContents.send('player:on_play_button', id);
    });

    remoteMain.on('player:stop_sfx', (_, id: string) => {
        if (!isBoardOpen('sfx')) return;
        getBoardWin('sfx').webContents.send('player:on_stop_sfx', id);
    });
}