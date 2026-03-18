import {RemoteCommand} from "../remote-server";
import {sendCommandAck} from "../rsc-utils";
import {getBoardWin, isBoardOpen} from "../../state";

export const nextRSC: RemoteCommand = {
    op: 'Next',
    handler: (ws) => {
        if (!isBoardOpen('music')) {
            sendCommandAck(ws, 'Next', false, `music board is not open`);
            return;
        }

        const board = getBoardWin('music');
        board.webContents.send('player:on_next');

        sendCommandAck(ws, 'Next', true);
    }
}