import {Track} from "../../../../types";
import {tracksStore} from "../../../storage/tracks-store";
import {remoteMain} from "../remote-main";

export const setupTracksRSHandlers = () => {
    remoteMain.handle('tracks:get_all', (): Track[] => tracksStore.get('tracks'));

    remoteMain.handle('tracks:get', (_, trackId: string): Track | null => {
        const tracks = tracksStore.get('tracks');
        return tracks.find(t => t.id === trackId) || null;
    });
}