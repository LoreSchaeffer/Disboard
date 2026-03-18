import {RemoteCommand} from "../remote-server";
import {getBoardType, sendCommandAck, sendError} from "../rsc-utils";
import {settingsStore} from "../../storage/settings-store";
import {broadcastData} from "../broadcast";
import {clamp} from "../../../shared/utils";

export const setVolumeRSC: RemoteCommand = {
    op: 'SetVolume',
    handler: (ws, msg) => {
        const boardType = getBoardType(ws, msg);
        if (!boardType) return;

        let volume: number = msg.volume as number;
        if (!volume) {
            sendError(ws, 'Missing field "volume"');
            return;
        }

        volume = clamp(Math.round(volume), 0, 100);

        settingsStore.set(`${boardType}.volume`, volume);
        broadcastData('settings:changed', settingsStore.store);
        sendCommandAck(ws, 'SetVolume', true);
    }
}