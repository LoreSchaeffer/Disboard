// TODO not needed. This should be managed by the main process not the renderer
ipcMain.handle('tracks:add', (_, source: TrackSourceName, media: YTSearchResult | string, customTitle: string, profileId: string, buttonId: string): IpcResponse<void> => {
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