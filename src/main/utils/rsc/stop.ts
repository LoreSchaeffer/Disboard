import {RemoteCommand} from "../remote-server";
import {sendCommandAck} from "../rsc-utils";
import {getBoardWin, isBoardOpen} from "../../state";

export const stopRSC: RemoteCommand = {
    op: 'Stop',
    handler: (ws) => {
        if (!isBoardOpen('music')) {
            sendCommandAck(ws, 'Stop', false, `music board is not open`);
            return;
        }

        const board = getBoardWin('music');
        board.webContents.send('player:on_stop');

        sendCommandAck(ws, 'Stop', true);
    }
}