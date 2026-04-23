import styles from './TrackInfo.module.css';
import React from "react";
import {PlayerTrack} from "../../../types";
import {clsx} from "clsx";
import {getTrackCoverUrl} from "../../utils/utils";
import {useWindow} from "../../context/WindowContext";

type TrackInfoProps = {
    track: PlayerTrack
    className?: string
}

const TrackInfo = ({track, className}: TrackInfoProps) => {
    const {settings} = useWindow();

    return (
        <div className={clsx(styles.trackInfo, className)}>
            <img
                className={styles.image}
                src={getTrackCoverUrl(track, settings)}
                alt={track.titleOverride || track.title || 'Unknown Title'}
                onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = './images/track.png';
                }}
            />
            <div className={styles.data}>
                <span className={styles.title}>{track.titleOverride || track.title || 'Unknown Title'}</span>
            </div>
        </div>
    );
}

export default TrackInfo;