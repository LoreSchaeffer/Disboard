import {RemoteCommand} from "../remote-server";
import {getBoardType, sendCommandAck, sendError} from "../rsc-utils";
import {ambientBoardStore, getGridProfilesStore} from "../../storage/profiles-store";
import {settingsStore} from "../../storage/settings-store";
import {GridBtn} from "../../../types";
import {getBoardWin, isBoardOpen} from "../../state";


export const playButtonRSC: RemoteCommand = {
    op: 'PlayButton',
    handler: (ws, msg) => {
        const boardType = getBoardType(ws, msg);
        if (!boardType) return;

        if (!isBoardOpen(boardType)) {
            sendCommandAck(ws, 'PlayButton', false, `${boardType} board is not open`);
            return;
        }

        const buttonId = msg.buttonId as string;
        const row = msg.row as number;
        const col = msg.col as number;

        if (!buttonId && (row == null || col == null)) {
            sendError(ws, 'Missing fields "buttonId" or "row" and "col"');
            return;
        }

        if (!buttonId && row && col && boardType === 'ambient') {
            sendError(ws, 'Row and column selection is not supported for ambient boards. Please provide a buttonId.');
            return;
        }

        const activeProfile = boardType === 'ambient'
            ? ambientBoardStore.get('profiles').find(p => p.id === settingsStore.get('settings.ambient.activeProfile') || '')
            : getGridProfilesStore(boardType).get('profiles').find(p => p.id === settingsStore.get(`${boardType}.activeProfile`) || '');

        if (!activeProfile) {
            sendCommandAck(ws, 'PlayButton', false, 'Active profile not found');
            return;
        }

        const button = buttonId
            ? activeProfile.buttons.find(b => b.id === buttonId)
            : activeProfile.buttons.find((b: GridBtn) => b.row === row && b.col === col);

        if (!button) {
            sendCommandAck(ws, 'PlayButton', false, 'Button not found');
            return;
        }

        const board = getBoardWin(boardType);
        board.webContents.send('player:on_play_button', button.id);

        sendCommandAck(ws, 'PlayButton', true);
    }
}