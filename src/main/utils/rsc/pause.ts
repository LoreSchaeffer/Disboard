import {RemoteCommand} from "../remote-server";
import {sendCommandAck} from "../rsc-utils";
import {getBoardWin, isBoardOpen} from "../../state";

export const pauseRSC: RemoteCommand = {
    op: 'Pause',
    handler: (ws) => {
        if (!isBoardOpen('music')) {
            sendCommandAck(ws, 'Pause', false, `music board is not open`);
            return;
        }

        const board = getBoardWin('music');
        board.webContents.send('player:on_pause');

        sendCommandAck(ws, 'Pause', true);
    }
}