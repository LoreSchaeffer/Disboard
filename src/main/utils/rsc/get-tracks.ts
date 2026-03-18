import {RemoteCommand} from "../remote-server";
import {sendMessage} from "../rsc-utils";
import {tracksStore} from "../../storage/tracks-store";

export const getTracksRSC: RemoteCommand = {
    op: 'GetTracks',
    handler: (ws) => {
        sendMessage(ws, {
            op: 'TracksList',
            tracks: tracksStore.get('tracks')
        });
    }
};