import {RemoteCommand} from "../remote-server";
import {getBoardType} from "../rsc-utils";
import {ambientBoardStore, getGridProfilesStore} from "../../storage/profiles-store";
import {BoardType} from "../../../types";

export const getProfilesRSC: RemoteCommand = {
    op: 'GetProfiles',
    handler: (ws, msg) => {
        const boardType = getBoardType(ws, msg);
        if (!boardType) return;

        const profiles = (boardType == 'ambient')
            ? ambientBoardStore.get('profiles')
            : getGridProfilesStore(boardType as Exclude<BoardType, 'ambient'>).get('profiles');

        ws.send(JSON.stringify({
            op: 'ProfilesList',
            boardType,
            profiles
        }));
    }
}