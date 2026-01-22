import styles from './TrackInfo.module.css';
import React from "react";
import {PlayerTrack} from "../../../types/data";

type TrackInfoProps = {
    track: PlayerTrack
    className?: string
}

const TrackInfo = ({track, className}: TrackInfoProps) => {
    return (
        <div className={`${styles.trackInfo} ${className}`}>
            <img
                className={styles.image}
                src={track ? `music://images/${track.id}` : '/images/track.png'}
                alt={track.titleOverride || track.title || ''}
                onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = '/images/track.png';
                }}
            />
            <div className={styles.data}>
                <span className={styles.title}>{track.title}</span>
            </div>
        </div>
    );
}

export default TrackInfo;