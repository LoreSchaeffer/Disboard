import './TrackInfo.css';
import {usePlayer} from "../../ui/playerContext";

const TrackInfo = () => {
    const {song} = usePlayer();

    const display = song ? 'flex' : 'none';
    const thumbnail = song ? `url(${song.thumbnail})` : 'url("/images/track.png")';
    const title = song ? song.title : '';
    const src = song ? (song.original_url ? song.original_url : song.uri) : '';

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