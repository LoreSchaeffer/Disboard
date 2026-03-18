import {RemoteCommand} from "../remote-server";
import {getBoardType, sendCommandAck, sendError} from "../rsc-utils";
import {ambientBoardStore, getGridProfilesStore} from "../../storage/profiles-store";
import {settingsStore} from "../../storage/settings-store";
import {broadcastData} from "../broadcast";

export const switchProfileRSC: RemoteCommand = {
    op: 'SwitchProfile',
    handler: (ws, msg) => {
        const boardType = getBoardType(ws, msg);
        if (!boardType) return;

        const profileId: string = msg.profileId as string;
        if (!profileId) {
            sendError(ws, 'Missing field "profileId"');
            return;
        }

        if (boardType === 'music' || boardType === 'sfx') {
            const profiles = getGridProfilesStore(boardType).get('profiles');
            if (!profiles.find(p => p.id === profileId)) {
                sendError(ws, 'Invalid profileId');
                return;
            }
        } else {
            const profiles = ambientBoardStore.get('profiles');
            if (!profiles.find(p => p.id === profileId)) {
                sendError(ws, 'Invalid profileId');
                return;
            }
        }

        settingsStore.set(`${boardType}.activeProfile`, profileId);
        broadcastData('settings:changed', settingsStore.store);
        sendCommandAck(ws, 'SwitchProfile', true);
    }
}