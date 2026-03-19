import styles from './Playlist.module.css';
import {useAnimatedUnmount} from "../../hooks/useAnimatedUnmount";
import {usePlayer} from "../../context/PlayerContext";
import {useClickOutside} from "../../hooks/useClickOutside";
import React, {useEffect, useRef} from "react";
import {PlayerTrack} from "../../../types";
import {clsx} from "clsx";
import {PiBroomBold, PiXBold} from "react-icons/pi";

type PlaylistProps = {
    show: boolean;
    onClose: () => void;
}

const Playlist = ({show, onClose}: PlaylistProps) => {
    const {shouldRender, transitionProps} = useAnimatedUnmount(show);
    const {player} = usePlayer();

    const playlistRef = useRef<HTMLDivElement>(null);
    useClickOutside(playlistRef, () => {
        if (show) onClose();
    });


    const tracksContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (show && shouldRender && tracksContainerRef.current) {
            const timer = setTimeout(() => {
                if (!tracksContainerRef.current) return;

                const activeIndex = player.getIndex();
                if (tracksContainerRef.current.children.length > activeIndex) {
                    const activeElement = tracksContainerRef.current.children[activeIndex] as HTMLElement;

                    if (activeElement) {
                        activeElement.scrollIntoView({
                            block: 'center',
                            behavior: 'smooth'
                        });
                    }
                }
            }, 50);

            return () => clearTimeout(timer);
        }
    }, [show, shouldRender, player]);

    if (!shouldRender) return null;

    return (
        <div
            ref={playlistRef}
            {...transitionProps}
            className={styles.playlist}
        >
            <div
                className={styles.clearButton}
                onClick={() => player.clearQueue()}
            >
                <PiBroomBold/>
                <span>Clear Playlist</span>
            </div>
            <div
                ref={tracksContainerRef}
                className={styles.tracks}
            >
                {player.getQueue().map((track, index) => (
                    <Track key={index} index={index} track={track}/>
                ))}
            </div>
        </div>
    )
}

type TrackProps = {
    index: number;
    track: PlayerTrack;
}

const Track = ({index, track}: TrackProps) => {
    const {player} = usePlayer();

    const isActive = player.getIndex() === index;
    const isPlaying = player.getState().playing;

    const handleClick = () => {
        if (!isActive) player.playFromQueue(index);
        else if (player.getState().paused) player.playPause();
        else if (!isPlaying) player.play();
    }

    const handleRemove = () => {
        player.removeFromQueue(index);
    }

    return (
        <div
            className={clsx(
                styles.track,
                player.getIndex() === index && player.getState().playing && styles.active
            )}
            onClick={handleClick}
        >
            <span className={styles.trackIndex}>{index + 1}</span>
            <img
                className={styles.trackImage}
                src={track ? `disboard://thumbnail/${track.id}` : './images/track.png'}
                alt={track.titleOverride || track.title || 'Unknown Title'}
                onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = './images/track.png';
                }}
            />
            <span className={styles.trackTitle}>{track.titleOverride || track.title || 'Unknown Title'}</span>
            <PiXBold
                className={styles.removeTrack}
                onClick={handleRemove}
            />
        </div>
    )
}

export default Playlist;