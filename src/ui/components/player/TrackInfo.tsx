import styles from './TrackInfo.module.css';
import {usePlayer} from "../../context/PlayerContext";

type TrackInfoProps = {
    className?: string
}

const TrackInfo = ({className}: TrackInfoProps) => {
    const {currentTrack} = usePlayer();

    const display = currentTrack ? 'flex' : 'none';
    const thumbnail = `url("${currentTrack?.thumbnail || '/images/track.png'}")`;
    const title = currentTrack?.title || '';
    const src = currentTrack?.original_url || currentTrack?.uri || '';

    return (
        <div className={`${styles.trackInfo} ${className}`} style={{display: display}}>
            <div className={styles.trackThumbnail} style={{backgroundImage: thumbnail}}></div>
            <div className={styles.trackData}>
                <span className={styles.trackTitle}>{title}</span>
                <span className={styles.trackSrc}>{src}</span>
            </div>
        </div>
    );
}

export default TrackInfo;