import './Player.css';
import TrackInfo from "./TrackInfo";
import {playerContext} from "../../ui/playerContext";
import {useData} from "../../ui/context";
import PlayerButton from "./PlayerButton";
import ProgressBar from "../generic/ProgressBar";
import {useEffect, useState} from "react";
import {IconType} from "../../ui/icons";
import {formatTime} from "../../ui/utils";
import {Song} from "../../utils/store/profiles";

const Player = () => {
    const {duration, setSong, setDuration} = playerContext();
    const {player} = useData();
    const {settings} = useData();

    const [stopDisabled, setStopDisabled] = useState(true);
    const [previousDisabled, setPreviousDisabled] = useState(true);
    const [skipDisabled, setSkipDisabled] = useState(true);
    const [playStatus, setPlayStatus] = useState({
        disabled: true,
        icon: 'play_circle'
    } as {
        disabled: boolean,
        icon: IconType
    });
    const [progressBarStatus, setProgressBarStatus] = useState({
        disabled: true,
        currentTime: 0,
        totalTime: 0,
        val: 0
    } as {
        disabled: boolean,
        currentTime: number,
        totalTime: number,
        val: number
    });

    useEffect(() => {
        const handlePlay = (song: Song, songDuration: number) => {
            setSong(song);
            setDuration(songDuration);
            setStopDisabled(false);
            setPlayStatus({disabled: false, icon: 'pause_circle'});
            setProgressBarStatus({disabled: false, currentTime: 0, totalTime: songDuration, val: 0});
        };

        const handleTimeUpdate = (time: number) => {
            setProgressBarStatus((prev) => {
                return {...prev, currentTime: time, val: time};
            });
        };

        const handlePause = () => {
            setPlayStatus({disabled: false, icon: 'play_circle'});
        };

        const handleResume = () => {
            setPlayStatus({disabled: false, icon: 'pause_circle'});
        };

        const handleStop = () => {
            resetPlayerState();
        };

        const handleEnd = () => {
            resetPlayerState();
        };

        const resetPlayerState = () => {
            setSong(null);
            setDuration(0);
            setStopDisabled(true);
            setPlayStatus({disabled: true, icon: 'play_circle'});
            setProgressBarStatus({disabled: true, currentTime: 0, totalTime: 0, val: 0});
        }

        player.addEventListener('play', handlePlay);
        player.addEventListener('timeupdate', handleTimeUpdate);
        player.addEventListener('pause', handlePause);
        player.addEventListener('resume', handleResume);
        player.addEventListener('stop', handleStop);
        player.addEventListener('ended', handleEnd);

        return () => {
            player.removeEventListener('play', handlePlay);
            player.removeEventListener('timeupdate', handleTimeUpdate);
            player.removeEventListener('pause', handlePause);
            player.removeEventListener('resume', handleResume);
            player.removeEventListener('stop', handleStop);
            player.removeEventListener('ended', handleEnd);
        }
    }, [player, setSong, setDuration]);

    const handleVolumeChange = (oldValue: number, newValue: number) => {
        player.setVolume(newValue);
        settings.volume = newValue;
        (window as any).electron.saveSettings(settings);
    }

    const handleShowProgress = (val: number) => {
        return formatTime(val);
    }

    return (
        <div className="player">
            <TrackInfo/>
            <div className="player-controls">
                <div className="player-buttons">
                    <PlayerButton icon="stop" disabled={stopDisabled}/>
                    <PlayerButton icon="previous" disabled={previousDisabled}/>
                    <PlayerButton icon={playStatus.icon} size="44px" disabled={playStatus.disabled}/>
                    <PlayerButton icon="skip" disabled={skipDisabled}/>
                    <PlayerButton icon="repeat"/>
                </div>
                <div className="player-progress-group">
                    <span className="progress-time current-time">{progressBarStatus.val}</span>
                    <ProgressBar seek={true} disabled={progressBarStatus.disabled} max={progressBarStatus.totalTime} val={progressBarStatus.val} displayFunction={handleShowProgress}/>
                    <span className="progress-time total-time">{duration}</span>
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