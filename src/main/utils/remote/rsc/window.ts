import {remoteMain} from "../remote-main";
import {BoardType} from "../../../../types";
import {isBoardOpen} from "../../../state";
import {createBoardWin} from "../../../windows";

export const setupWindowRSHandlers = () => {
    remoteMain.on('window:open_board', (_, boardType: BoardType) => {
        if (isBoardOpen(boardType)) return;
        createBoardWin(boardType);
    });
}