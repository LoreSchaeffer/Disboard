import styles from './AvailablePlaylists.module.css';
import {useAnimatedUnmount} from "../../hooks/useAnimatedUnmount";
import {useClickOutside} from "../../hooks/useClickOutside";
import React, {useEffect, useRef, useState} from "react";
import {PlayerTrack, Playlist} from "../../../types";
import {useWindow} from "../../context/WindowContext";
import {usePlayer} from "../../context/PlayerContext";

type AvailablePlaylistsProps = {
    show: boolean;
    onClose: () => void;
}

const AvailablePlaylists = ({show, onClose}: AvailablePlaylistsProps) => {
    const {shouldRender, transitionProps} = useAnimatedUnmount(show);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);

    const playlistRef = useRef<HTMLDivElement>(null);
    useClickOutside(playlistRef, () => {
        if (show) onClose();
    });

    useEffect(() => {
        if (!show) return;

        window.electron.music.getPlaylists().then(res => {
            if (res.success) setPlaylists(res.data);
            else setPlaylists([]);
        });

    }, [show]);

    if (!shouldRender) return null;

    return (
        <div
            ref={playlistRef}
            {...transitionProps}
            className={styles.availablePlaylists}
        >
            <div
                className={styles.playlists}
            >
                {playlists.map(playlist => (
                    <PlaylistItem key={playlist.id} playlist={playlist} hide={onClose}/>
                ))}
            </div>
        </div>
    )
}

type PlaylistItemProps = {
    playlist: Playlist,
    hide: () => void;
}

const PlaylistItem = ({playlist, hide}: PlaylistItemProps) => {
    const {settings} = useWindow();
    const {player} = usePlayer();

    const play = () => {
        window.electron.music.getPlaylistTracks(playlist.id).then(res => {
                if (!res.success) {
                    console.error(`Failed to get tracks for playlist ${playlist.name}: ${res.error}`);
                    return;
                }

                const isPlaying = player.getState().playing;

                if (isPlaying) player.stop();
                player.clearQueue();

                const tracks = res.data.sort((a, b) => a.track_order - b.track_order).map(t => t.track);

                tracks.forEach(track => {
                    const playerTrack: PlayerTrack = {
                        id: track.id,
                        source: {
                            type: 'music_api',
                            src: `${settings.musicApi}/api/tracks/play/${track.id}`
                        },
                        title: track.title,
                        duration: track.duration,
                        board: 'music',
                        downloading: false,
                        directStream: true
                    }

                    player.addToQueue(playerTrack);
                });

                if (isPlaying) player.play();
            }
        ).finally(() => hide());
    }

    return (
        <div
            className={styles.playlist}
            onClick={play}
        >
            <img
                className={styles.playlistImage}
                src={playlist ? `${settings.musicApi}/api/playlists/cover/${playlist.id}` : './images/track.png'}
                alt={playlist.name || 'Unknown Title'}
                onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = './images/track.png';
                }}
            />
            <span className={styles.playlistTitle}>{playlist.name}</span>
            <span className={styles.playlistSize}>{playlist.size}</span>
        </div>
    )
}

export default AvailablePlaylists;