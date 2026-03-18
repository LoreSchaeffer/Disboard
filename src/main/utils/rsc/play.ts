import {RemoteCommand} from "../remote-server";
import {sendCommandAck} from "../rsc-utils";
import {getBoardWin, isBoardOpen} from "../../state";

export const playRSC: RemoteCommand = {
    op: 'Play',
    handler: (ws) => {
        if (!isBoardOpen('music')) {
            sendCommandAck(ws, 'Play', false, `music board is not open`);
            return;
        }

        const board = getBoardWin('music');
        board.webContents.send('player:on_play');

        sendCommandAck(ws, 'Play', true);
    }
}