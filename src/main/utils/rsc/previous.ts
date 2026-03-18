import {RemoteCommand} from "../remote-server";
import {sendCommandAck} from "../rsc-utils";
import {getBoardWin, isBoardOpen} from "../../state";

export const previousRSC: RemoteCommand = {
    op: 'Previous',
    handler: (ws) => {
        if (!isBoardOpen('music')) {
            sendCommandAck(ws, 'Previous', false, `music board is not open`);
            return;
        }

        const board = getBoardWin('music');
        board.webContents.send('player:on_previous');

        sendCommandAck(ws, 'Previous', true);
    }
}