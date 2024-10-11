import './Player.css';
import TrackInfo from "./TrackInfo";
import {playerContext} from "../../ui/playerContext";
import {useData} from "../../ui/context";
import PlayerButton from "./PlayerButton";
import ProgressBar from "../generic/ProgressBar";
import {Song} from "../../utils/store/profiles";
import {useEffect} from "react";

const Player = () => {
    const {track, setTrack} = playerContext();
    const {settings} = useData();

    useEffect(() => {
        setTrack({
            title: 'From Peak to Peak',
            uri: 'https://www.youtube.com/watch?v=jAefHr3AVL0',
            duration: 278000,
            thumbnail: 'https://i.ytimg.com/vi/jAefHr3AVL0/hq720.jpg?sqp=-oaymwEcCOgCEMoBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCFUXaG4KkustF24JfkWqoStHFlPQ',
        } as Song);
    }, [setTrack]);

    const handleVolumeChange = (oldValue: number, newValue: number) => {
        console.log('Volume changed from', oldValue, 'to', newValue);
        settings.volume = newValue;
        (window as any).electron.saveSettings(settings);
    }

    return (
        <div className="player">
            <TrackInfo/>
            <div className="player-controls">
                <div className="player-buttons">
                    <PlayerButton icon="stop" disabled={true}/>
                    <PlayerButton icon="previous" disabled={true}/>
                    <PlayerButton icon="play_circle" size="44px" disabled={true}/>
                    <PlayerButton icon="skip" disabled={true}/>
                    <PlayerButton icon="repeat"/>
                </div>
                <div className="player-progress-group">
                    <span className="progress-time current-time">0:00</span>
                    <ProgressBar seek={true} disabled={true}/>
                    <span className="progress-time total-time">3:50</span>
                </div>
            </div>
            <div className={"player-secondary-controls"}>
                <PlayerButton icon="search"/>
                <PlayerButton icon="queue"/>
                <PlayerButton icon="media_output"/>
                <PlayerButton icon="volume_high"/>
                <ProgressBar className="player-volume" min={0} max={100} val={settings.volume} seek={true} onChange={handleVolumeChange}/>
                <PlayerButton icon="settings"/>
            </div>
        </div>
    );
}

export default Player;