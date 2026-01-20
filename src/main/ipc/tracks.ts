import {ipcMain} from "electron";
import {Btn, PlayerTrack, Track, TrackSource} from "../../types/data";
import {IpcResponse} from "../../types/common";
import {YTSearchResult} from "../../types/music-api";
import {profilesStore, tracksStore} from "../utils/store";
import {broadcastProfiles, downloadTrack, getYoutubeStream} from "../utils";
import {getPosFromButtonId} from "../utils/data";
import {generateUUID} from "../utils/utils";
import {fetchTitle} from "../utils/ffmpeg";
import {state} from "../state";

export const setupTracksHandlers = () => {
    ipcMain.handle('get_tracks', (): Track[] => tracksStore.get('tracks'));

    ipcMain.handle('get_track', (_, trackId: string): Track | null => {
        const tracks = tracksStore.get('tracks');
        return tracks.find(t => t.id === trackId) || null;
    });

    ipcMain.handle('add_track', async (_, source: TrackSource, media: YTSearchResult | string, profileId: string, buttonId: string): Promise<IpcResponse<void>> => {
        if (!source || !media || !profileId || !buttonId) return {success: false, error: 'invalid_parameters'};
        if (source === 'youtube' && (typeof media !== 'object' || !('id' in media))) return {success: false, error: 'invalid_media'};
        if (source !== 'youtube' && (typeof media !== 'string' || (media as string).trim().length < 2)) return {success: false, error: 'invalid_media'};

        let track: Track;

        if (source === 'list') {
            track = tracksStore.get('tracks').find(t => t.id === media);
            if (!track) return {success: false, error: 'track_not_found'};
        } else {
            let uri = typeof media === 'string' ? media : null;

            if (source === 'youtube') {
                try {
                    const stream = await getYoutubeStream((media as YTSearchResult).id);
                    if (!stream) return {success: false, error: 'stream_not_found'};
                    uri = stream;
                } catch (e) {
                    return {success: false, error: e.message || 'unknown_error'};
                }
            }

            try {
                track = await downloadTrack(
                    uri,
                    {
                        type: source,
                        src: source === 'youtube' ? (media as YTSearchResult).url : (media as string)
                    },
                    source === 'youtube' ? (media as YTSearchResult).name : undefined
                );

                if (!track) throw new Error('download_failed');
            } catch (e) {
                return {success: false, error: e.message || 'download_error'};
            }
        }

        const profiles = profilesStore.get('profiles');
        const profileIdx = profiles.findIndex(p => p.id === profileId);
        if (profileIdx === -1) return {success: false, error: 'profile_not_found'};

        const profile = profiles[profileIdx];
        const buttonPos = getPosFromButtonId(buttonId);
        if (!buttonPos) return {success: false, error: 'invalid_button_id'};

        const existingButtonIdx = profile.buttons.findIndex(b => b.row === buttonPos.row && b.col === buttonPos.col);
        if (existingButtonIdx === -1) {
            profile.buttons.push({
                row: buttonPos.row,
                col: buttonPos.col,
                track: track.id
            } as Btn);
        } else {
            const existingButton = {...profile.buttons[existingButtonIdx]};
            existingButton.track = track.id;
            profile.buttons[existingButtonIdx] = existingButton;
        }

        profiles[profileIdx] = profile;
        profilesStore.set('profiles', profiles);
        broadcastProfiles(profiles);

        return {success: true};
    });

    ipcMain.on('play_now', async (_, source: TrackSource, media: YTSearchResult | string) => {
        if (!source || !media) return;
        if (source === 'youtube' && (typeof media !== 'object' || !('id' in media))) return;
        if (source !== 'youtube' && (typeof media !== 'string' || (media as string).trim().length < 2)) return;

        let track: PlayerTrack;

        if (source === 'list') {
            track = tracksStore.get('tracks').find(t => t.id === media);
            if (!track) return {success: false, error: 'track_not_found'};
        } else {
            let uri = typeof media === 'string' ? media : null;

            if (source === 'youtube') {
                try {
                    const stream = await getYoutubeStream((media as YTSearchResult).id);
                    if (!stream) return {success: false, error: 'stream_not_found'};
                    uri = stream;
                } catch (e) {
                    return {success: false, error: e.message || 'unknown_error'};
                }
            }

            track = {
                id: generateUUID(),
                source: {
                    type: source,
                    src: uri
                },
                title: source === 'youtube' ? (media as YTSearchResult).name : await fetchTitle(uri) || 'Unknown Title', // TODO Check for better methods
                duration: source === 'youtube' ? (media as YTSearchResult).duration * 1000 : 0,
                directStream: true
            }

            state.mainWindow.webContents.send('play_now', track);
        }
    });
};