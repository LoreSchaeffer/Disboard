import {ipcMain} from "electron";
import {Btn, PlayerTrack, Track, TrackSource} from "../../types/data";
import {IpcResponse} from "../../types/common";
import {YTSearchResult} from "../../types/music-api";
import {tracksStore} from "../utils/store";
import {getPosFromButtonId} from "../utils/data-converters";
import {generateUUID, getPlayerTrack} from "../utils/misc";
import {getBestThumbnail, getYoutubeStream} from "../utils/music-api";
import {broadcastProfiles, broadcastTracks} from "../utils/broadcast";
import {downloadTrack} from "../utils/downloads";

export const setupTracksHandlers = () => {
    ipcMain.handle('tracks:get_all', (): Track[] => tracksStore.get('tracks'));

    ipcMain.handle('tracks:get', (_, trackId: string): Track | null => {
        const tracks = tracksStore.get('tracks');
        return tracks.find(t => t.id === trackId) || null;
    });

    ipcMain.handle('tracks:add', (_, source: TrackSource, media: YTSearchResult | string, customTitle: string, profileId: string, buttonId: string): IpcResponse<void> => {
        if (!source || !media || !profileId || !buttonId) return {success: false, error: 'invalid_parameters'};
        if (source === 'youtube' && (typeof media !== 'object' || !('id' in media))) return {success: false, error: 'invalid_media'};
        if (source !== 'youtube' && (typeof media !== 'string' || (media as string).trim().length < 2)) return {success: false, error: 'invalid_media'};

        const initialProfiles = profilesStore.get('profiles');
        if (initialProfiles.findIndex(p => p.id === profileId) === -1) return {success: false, error: 'profile_not_found'};

        const buttonPos = getPosFromButtonId(buttonId);
        if (!buttonPos) return {success: false, error: 'invalid_button_id'};

        const updateButtonInStore = (modifier: (btn: Btn | undefined) => Btn | null) => {
            const currentProfiles = profilesStore.get('profiles');
            const pIdx = currentProfiles.findIndex(p => p.id === profileId);
            if (pIdx === -1) return;

            const profile = currentProfiles[pIdx];
            const btnIdx = profile.buttons.findIndex(b => b.row === buttonPos.row && b.col === buttonPos.col);

            const existingBtn = btnIdx !== -1 ? profile.buttons[btnIdx] : undefined;

            const newBtn = modifier(existingBtn);

            if (newBtn === null) {
                if (btnIdx !== -1) profile.buttons.splice(btnIdx, 1);
            } else {
                if (btnIdx !== -1) profile.buttons[btnIdx] = newBtn;
                else profile.buttons.push(newBtn);
            }

            currentProfiles[pIdx] = profile;
            profilesStore.set('profiles', currentProfiles);
            broadcastProfiles(currentProfiles);
        };

        if (source === 'list') {
            const track = tracksStore.get('tracks').find(t => t.id === media);
            if (!track) return {success: false, error: 'track_not_found'};

            updateButtonInStore(() => ({
                row: buttonPos.row,
                col: buttonPos.col,
                track: track.id
            } as Btn));

            return {success: true};
        }

        const downloadAsync = async () => {
            const trackId = generateUUID();
            let previousButtonState: Btn | undefined = undefined;

            updateButtonInStore((existing) => {
                previousButtonState = existing ? {...existing} : undefined;
                return {
                    row: buttonPos.row,
                    col: buttonPos.col,
                    track: trackId,
                    title: 'Importing...'
                } as Btn;
            });

            try {
                let uri = typeof media === 'string' ? media : null;

                if (source === 'youtube') {
                    const stream = await getYoutubeStream((media as YTSearchResult).id);
                    if (!stream) throw new Error('stream_not_found');
                    uri = stream;
                }

                const title = customTitle !== '' ? customTitle : (source === 'youtube' ? (media as YTSearchResult).name : undefined)

                const track = await downloadTrack(
                    trackId,
                    uri,
                    {
                        type: source,
                        src: source === 'youtube' ? (media as YTSearchResult).url : (media as string)
                    },
                    title,
                    source === 'youtube' ? getBestThumbnail((media as YTSearchResult).thumbnails) : undefined
                );

                if (!track) throw new Error('download_failed');

                console.log(`[Main] Track ${track.id} downloaded.`);
                updateButtonInStore((existing) => {
                    if (!existing) return null;
                    const finalBtn = {...existing};
                    finalBtn.track = track.id;
                    delete finalBtn.title;
                    return finalBtn;
                });

            } catch (e) {
                console.warn(`[Main] Failed to download track: ${e.message}`);

                updateButtonInStore(() => {
                    return previousButtonState || null;
                });
            }
        }

        downloadAsync();

        return {success: true};
    });

    ipcMain.handle('tracks:remove', (_, trackId: string): IpcResponse<void> => {
        const tracks = tracksStore.get('tracks');
        const trackIndex = tracks.findIndex(t => t.id === trackId);
        if (trackIndex === -1) return {success: false, error: 'track_not_found'};

        tracks.splice(trackIndex, 1);
        tracksStore.set('tracks', tracks);
        broadcastTracks(tracks);

        const profiles = profilesStore.get('profiles');
        let profilesChanged = false;

        for (const profile of profiles) {
            let buttonsChanged = false;
            for (let i = profile.buttons.length - 1; i >= 0; i--) {
                const btn: Btn = profile.buttons[i];
                if (btn.track === trackId) {
                    profile.buttons.splice(i, 1);
                    buttonsChanged = true;
                }
            }

            if (buttonsChanged) profilesChanged = true;
        }

        if (profilesChanged) {
            profilesStore.set('profiles', profiles);
            broadcastProfiles(profiles);
        }

        return {success: true};
    });

    ipcMain.handle('tracks:get_volatile', async (_, source: TrackSource, media: YTSearchResult | string): Promise<IpcResponse<PlayerTrack>> => {
        if (!source || !media) return {success: false, error: 'invalid_parameters'};
        if (source === 'youtube' && (typeof media !== 'object' || !('id' in media))) return {success: false, error: 'invalid_parameters'};
        if (source !== 'youtube' && (typeof media !== 'string' || (media as string).trim().length < 2)) return {success: false, error: 'invalid_parameters'};

        const track = await getPlayerTrack(source, media);
        if (!track) return {success: false, error: 'track_not_found'};
        return {success: true, data: track};
    });
};