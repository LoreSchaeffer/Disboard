import './TrackInfo.css';
import {playerContext} from "../../ui/playerContext";

const TrackInfo = () => {
    const {track} = playerContext();

    const display = track ? 'flex' : 'none';
    const thumbnail = track ? `url(${track.thumbnail})` : 'url("/images/track.png")';
    const title = track ? track.title : '';
    const src = track ? track.uri : '';

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