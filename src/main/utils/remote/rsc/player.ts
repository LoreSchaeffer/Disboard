import {remoteMain} from "../remote-main";
import {getBoardWin, isBoardOpen} from "../../../state";
import {BoardType, RepeatMode} from "../../../../types";
import {clamp} from "../../../../shared/utils";

export const setupPlayerRSHandlers = () => {
    remoteMain.on('player:state', (_, boardType: BoardType) => {
        if (!isBoardOpen(boardType)) return null;

        const board = getBoardWin(boardType);
        return board.webContents.send('player:on_broadcast_state');
    });

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

    remoteMain.on('player:play_pause', () => {
        if (!isBoardOpen('music')) return;

        const board = getBoardWin('music');
        board.webContents.send('payer:on_play_pause');
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

    remoteMain.on('player:seek', (_, time: number) => {
        if (!isBoardOpen('music')) return;

        const board = getBoardWin('music');
        board.webContents.send('player:seek', time);
    });

    remoteMain.on('player:play_button', (_, boardType: BoardType, id: string) => {
        if (!isBoardOpen(boardType)) return;

        getBoardWin(boardType).webContents.send('player:on_play_button', id);
    });

    remoteMain.on('player:stop_sfx', (_, id?: string) => {
        if (!isBoardOpen('sfx')) return;
        getBoardWin('sfx').webContents.send('player:on_stop_sfx', id);
    });

    remoteMain.on('player:volume', (_, boardType: BoardType, volume: number) => {
        if (!isBoardOpen(boardType)) return;

        getBoardWin(boardType).webContents.send('player:on_volume_change', clamp(volume, 0, 100));
    });

    remoteMain.on('player:repeat_mode', (_, mode: RepeatMode) => {
        if (!isBoardOpen('music')) return;

        getBoardWin('music').webContents.send('player:on_repeat_mode_change', mode);
    });
}