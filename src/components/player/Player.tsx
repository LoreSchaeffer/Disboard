import './Player.css';
import TrackInfo from "./TrackInfo";
import {usePlayer} from "../../ui/playerContext";
import {useData} from "../../ui/windowContext";
import PlayerButton from "./PlayerButton";
import ProgressBar from "../generic/ProgressBar";
import React, {useEffect, useState} from "react";
import {IconType} from "../../ui/icons";
import {formatTime} from "../../ui/utils";
import {Song} from "../../utils/store/profiles";

function getVolumeIcon(volume: number) {
    if (volume < 15) return 'volume_low';
    else if (volume < 50) return 'volume_medium';
    else return 'volume_high';
}

const Player = () => {
    const {mainPlayer, previewPlayer, settings, setSettings, winId} = useData();
    const {setSong, setDuration} = usePlayer();

    const [stopDisabled, setStopDisabled] = useState(true);
    const [previousDisabled, setPreviousDisabled] = useState(true);
    const [skipDisabled, setSkipDisabled] = useState(true);
    const [playStatus, setPlayStatus] = useState({disabled: true, icon: 'play_circle'} as { disabled: boolean, icon: IconType });
    const [progressBarStatus, setProgressBarStatus] = useState({disabled: true, currentTime: 0, totalTime: 100, val: 0} as { disabled: boolean, currentTime: number, totalTime: number, val: number });
    const [repeatStatus, setRepeatStatus] = useState({fill: 'var(--text-disabled)', icon: 'repeat'} as { fill: string, icon: IconType });
    const [volumeStatus, setVolumeStatus] = useState({volume: 0, muted: false, icon: 'volume_high'} as { volume: number, muted: boolean, icon: IconType });

    useEffect(() => {
        setVolumeStatus({volume: settings.volume, muted: false, icon: getVolumeIcon(settings.volume)});
        setRepeatStatus({fill: settings.loop === 'none' ? 'var(--text-disabled)' : 'var(--text-primary)', icon: settings.loop === 'one' ? 'repeat_one' : 'repeat'});
    }, [settings]);

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
            setProgressBarStatus({disabled: true, currentTime: 0, totalTime: 100, val: 0});
        };

        mainPlayer.addEventListener('play', handlePlay);
        mainPlayer.addEventListener('timeupdate', handleTimeUpdate);
        mainPlayer.addEventListener('pause', handlePause);
        mainPlayer.addEventListener('resume', handleResume);
        mainPlayer.addEventListener('stop', handleStop);
        mainPlayer.addEventListener('ended', handleEnd);

        return () => {
            mainPlayer.removeEventListener('play', handlePlay);
            mainPlayer.removeEventListener('timeupdate', handleTimeUpdate);
            mainPlayer.removeEventListener('pause', handlePause);
            mainPlayer.removeEventListener('resume', handleResume);
            mainPlayer.removeEventListener('stop', handleStop);
            mainPlayer.removeEventListener('ended', handleEnd);
        }
    }, [mainPlayer, setSong, setDuration]);

    const handleVolumeChange = (oldValue: number, newValue: number) => {
        setSettings((prev) => {
            return {...prev, volume: newValue};
        });

        setTimeout(() => (window as any).electron.saveSettings(settings), 50);
    };

    const handleShowProgress = (val: number) => {
        return formatTime(val);
    };

    const handleRepeatMode = () => {
        if (mainPlayer.getLoopMode() === 'none') mainPlayer.loop('all');
        else if (mainPlayer.getLoopMode() === 'all') mainPlayer.loop('one');
        else mainPlayer.loop('none');

        setSettings((prev) => {
            return {...prev, loop: mainPlayer.getLoopMode()};
        });

        setTimeout(() => (window as any).electron.saveSettings(settings), 100);
    };

    const handleSeek = (oldValue: number, newValue: number) => {
        mainPlayer.seekTo(newValue);
        setProgressBarStatus((prev) => {
            return {...prev, val: newValue};
        });
    };

    const handleSearch = () => {
        (window as any).electron.openMediaSelectorWin(null, null, winId);
    };

    const handleShowQueue = (e: React.MouseEvent) => {
        console.log('Show queue');
    };

    const handleShowMediaOutput = (e: React.MouseEvent) => {
        console.log('Show media output');
    };

    const handleVolumeClick = () => {
        if (volumeStatus.muted) {
            handleVolumeChange(0, volumeStatus.volume);
        } else {
            const vol = settings.volume;
            handleVolumeChange(vol, 0);
            setTimeout(() => setVolumeStatus({volume: vol, muted: true, icon: 'volume_off'}), 50);
        }
    };

    const handleSettings = () => {
        console.log('Show settings');
    }

    return (
        <div className="player">
            <TrackInfo/>
            <div className="player-controls">
                <div className="player-buttons">
                    <PlayerButton icon="stop" disabled={stopDisabled} onClick={() => mainPlayer.stop()}/>
                    <PlayerButton icon="previous" disabled={previousDisabled} onClick={() => mainPlayer.previous()}/>
                    <PlayerButton icon={playStatus.icon} size="44px" disabled={playStatus.disabled} onClick={() => mainPlayer.playPause()}/>
                    <PlayerButton icon="next" disabled={skipDisabled} onClick={() => mainPlayer.next()}/>
                    <PlayerButton icon={repeatStatus.icon} onClick={handleRepeatMode} fill={repeatStatus.fill}/>
                </div>
                <div className="player-progress-group">
                    <span className="progress-time current-time" style={{display: mainPlayer.isPlayerPlaying() ? 'block' : 'none'}}>{formatTime(progressBarStatus.val)}</span>
                    <ProgressBar
                        seek={true}
                        disabled={progressBarStatus.disabled}
                        max={progressBarStatus.totalTime}
                        val={progressBarStatus.val}
                        displayFunction={handleShowProgress}
                        onChange={handleSeek}
                    />
                    <span className="progress-time total-time" style={{display: mainPlayer.isPlayerPlaying() ? 'block' : 'none'}}>{formatTime(progressBarStatus.totalTime)}</span>
                </div>
            </div>
            <div className={"player-secondary-controls"}>
                <PlayerButton icon="search" onClick={handleSearch}/>
                <PlayerButton icon="queue" onClick={handleShowQueue}/>
                <PlayerButton icon="media_output" onClick={handleShowMediaOutput}/>
                <PlayerButton icon={volumeStatus.icon} onClick={handleVolumeClick}/>
                <ProgressBar className="player-volume" min={0} max={100} val={settings.volume} seek={true} onChange={handleVolumeChange}/>
                <PlayerButton icon="settings" onClick={handleSettings}/>
            </div>
        </div>
    );
}

export default Player;