import './TrackInfo.css';
import {usePlayer} from "../../context/PlayerContext";

const TrackInfo = () => {
    const {player} = usePlayer();

    const track = player?.getCurrentTrack();

    const display = track ? 'flex' : 'none';
    const thumbnail = track ? `url(${track.thumbnail || 'url("/images/track.png")'})` : 'url("/images/track.png")';
    const title = track ? track.title : '';
    const src = track ? (track.original_url ? track.original_url : track.uri) : '';

    return (
        <div className="track-info" style={{display: display}}>
            <div className="track-thumbnail" style={{backgroundImage: thumbnail}}></div>
            <div className="track-data">
                <span className="track-title">{title}</span>
                <span className="track-src">{src}</span>
            </div>
        </div>
    );
}

export default TrackInfo;