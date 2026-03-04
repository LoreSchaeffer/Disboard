import styles from './TrackInfo.module.css';
import React from "react";
import {PlayerTrack} from "../../../types";
import {clsx} from "clsx";

type TrackInfoProps = {
    track: PlayerTrack
    className?: string
}

const TrackInfo = ({track, className}: TrackInfoProps) => {
    return (
        <div className={clsx(styles.trackInfo, className)}>
            <img
                className={styles.image}
                src={track ? `disboard://thumbnail/${track.id}` : '/images/track.png'}
                alt={track.titleOverride || track.title || 'Unknown Title'}
                onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = '/images/track.png';
                }}
            />
            <div className={styles.data}>
                <span className={styles.title}>{track.titleOverride || track.title || 'Unknown Title'}</span>
            </div>
        </div>
    );
}

export default TrackInfo;