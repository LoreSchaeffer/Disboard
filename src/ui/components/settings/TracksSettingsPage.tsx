import styles from "./TracksSettingsPage.module.css";
import React, {useEffect, useState} from "react";
import {Track} from "../../../types";
import {DataTable} from "../tables/DataTable";
import {usePlayer} from "../../context/PlayerContext";
import {PiCopyBold, PiFolderOpenFill, PiGlobeBold, PiPlayFill, PiTrash, PiYoutubeLogoFill} from "react-icons/pi";
import AudioWave from "../misc/AudioWave";
import {Time} from "../../utils/time";
import {clsx} from "clsx";
import {useNavigation} from "../../context/NavigationContext";
import {DeleteConfirmationData} from "../../windows/DeleteConfirmationWin";

const TracksSettingsPage = () => {
    const {previewPlayer} = usePlayer();
    const {navigate} = useNavigation();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [copiedBtn, setCopiedBtn] = useState<boolean>(false);

    useEffect(() => {
        window.electron.tracks.getAll().then((tracks) => {
            setTracks(tracks);
            setLoading(false);
        });

        const unsub = window.electron.tracks.onChanged(setTracks);

        return () => {
            unsub();
        };
    }, []);

    const handlePlayPause = (track: Track) => {
        if (previewPlayer.getCurrentTrack()?.id !== track.id) previewPlayer.playNow(track);
        else previewPlayer.stop();
    }

    const thumbnailRenderer = (track: Track) => {
        return (
            <div className={styles.thumbnailContainer}>
                <img
                    className={styles.thumbnail}
                    src={`disboard://thumbnail/${track.id}`}
                    alt={track.title || ''}
                    onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = './images/track.png';
                    }}
                    key={`thumbnail-${track.id}`}
                    onClick={() => handlePlayPause(track)}
                />
                {previewPlayer.getCurrentTrack()?.id !== track.id && (
                    <PiPlayFill
                        className={styles.thumbnailPlay}
                        onClick={() => handlePlayPause(track)}
                    />
                )}
                {previewPlayer.getCurrentTrack()?.id === track.id && (
                    <AudioWave
                        variant={'smooth'}
                        className={styles.thumbnailPlaying}
                        onClick={() => handlePlayPause(track)}
                    />
                )}
            </div>
        )
    }

    const titleRenderer = (track: Track) => {
        const handleClick = async () => {
            await navigator.clipboard.writeText(track.id);
            setCopiedBtn(true);
            setTimeout(() => setCopiedBtn(false), 500);
        }

        return (
            <div className={styles.titleContainer} onClick={handleClick}>
                <span className={clsx(styles.tableSpan, styles.clickable)}>{track.title}</span>
                <PiCopyBold className={clsx(styles.copyIcon, copiedBtn && styles.activeCopy)}/>
            </div>
        )
    }

    const sourceRenderer = (track: Track) => {
        switch (track.source.type) {
            case 'youtube':
                return <PiYoutubeLogoFill
                    className={clsx(styles.tableIcon, styles.youtubeIcon)}
                    onClick={() => window.electron.system.openLink(track.source.src)}
                />
            case 'file':
                return <PiFolderOpenFill
                    className={clsx(styles.tableIcon, styles.fileIcon)}
                    onClick={() => window.electron.system.openLink(track.source.src)}
                />
            case 'url':
                return <PiGlobeBold
                    className={clsx(styles.tableIcon, styles.urlIcon)}
                    onClick={() => window.electron.system.openLink(track.source.src)}
                />
        }
    }

    const actionsRenderer = (track: Track) => {
        return <PiTrash
            className={clsx(styles.tableIcon, styles.trashIcon)}
            onClick={() => navigate('delete_confirmation', {
                replace: false, data: {
                    boardType: 'music', // It's not important here
                    resource: 'track',
                    id: track.id,
                    onConfirm: () => window.electron.tracks.delete(track.id)
                } as DeleteConfirmationData
            })}
        />
    }

    return (
        <div className={styles.page}>
            <DataTable
                id={'tracks'}
                data={tracks}
                loading={loading}
                defSortBy={'title'}
                rowClassName={() => styles.trackRow}
                columns={[
                    {id: 'thumbnail', text: '', sortable: false, searchable: false, render: thumbnailRenderer},
                    {id: 'title', text: 'Title', sortable: true, searchable: true, render: titleRenderer},
                    {id: 'board', text: 'Board', sortable: true, searchable: false, render: (t) => <span className={styles.tableSpan}>{t.board.charAt(0).toUpperCase() + t.board.slice(1)}</span>},
                    {id: 'duration', text: 'Duration', sortable: true, searchable: false, render: (t) => <span className={styles.tableSpan}>{new Time(t.duration, 'ms').formatted()}</span>},
                    {id: 'source', text: 'Src', sortable: true, searchable: false, render: sourceRenderer},
                    {id: 'actions', text: '', sortable: false, searchable: false, render: actionsRenderer}
                ]}
            />
        </div>
    )
}

export default TracksSettingsPage;
