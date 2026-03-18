import {RemoteCommand} from "../remote-server";
import {getBoardType, sendCommandAck} from "../rsc-utils";
import {isBoardOpen} from "../../state";
import {createBoardWin} from "../../windows";

export const openBoardRSC: RemoteCommand = {
    op: 'OpenBoard',
    handler: (ws, msg) => {
        const boardType = getBoardType(ws, msg);
        if (!boardType) return;

        if (isBoardOpen(boardType)) {
            sendCommandAck(ws, 'OpenBoard', false, 'Already open');
        } else {
            createBoardWin(boardType);
            sendCommandAck(ws, 'OpenBoard', true);
        }
    }
}