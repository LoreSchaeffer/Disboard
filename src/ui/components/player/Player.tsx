import styles from './Player.module.css';
import TrackInfo from "./TrackInfo";
import PlayerBtn from "./PlayerBtn";
import React, {useEffect, useState} from "react";
import {useWindow} from "../../context/WindowContext";
import {usePlayer} from "../../context/PlayerContext";
import ProgressBar from "../forms/ProgressBar";
import {formatTime} from "../../utils/time";
import {PiMagnifyingGlassBold, PiPauseCircleFill, PiPlayCircleFill, PiPlaylistBold, PiRepeatBold, PiRepeatOnceBold, PiSkipBackFill, PiSkipForwardFill, PiSlidersHorizontalBold, PiSpeakerSimpleSlashBold, PiStopFill} from "react-icons/pi";
import {getVolumeIcon} from "../../utils/utils";
import {clsx} from "clsx";

type PlayerProps = {
    showProfileSettings?: () => void;
    showPlaylist?: () => void;
};

const Player = ({showProfileSettings, showPlaylist}: PlayerProps) => {
    const {settings, updateSettings} = useWindow();
    const {player, status, currentTrack, duration, currentTime, queue} = usePlayer();

    const [volume, setVolume] = useState<number>(settings.volume);
    const [muted, setMuted] = useState<boolean>(false);

    useEffect(() => {
        const unsubPlayNow = window.electron.onPlayNow((track) => player.playNow(track));
        const unsubPause = window.electron.onPause(() => player.pause());
        const unsubPlay = window.electron.onPlay(() => player.play());
        const unsubPlayPause = window.electron.onPlayPause(() => player.playPause());
        const unsubStop = window.electron.onStop(() => player.stop());
        const unsubNext = window.electron.onNext(() => player.next());
        const unsubPrev = window.electron.onPrev(() => player.previous());

        return () => {
            unsubPlayNow();
            unsubPause();
            unsubPlay();
            unsubPlayPause();
            unsubStop();
            unsubNext();
            unsubPrev();
        }
    }, []);

    useEffect(() => {
        setVolume(settings.volume);
    }, [settings.volume]);

    useEffect(() => {
        if (muted) player.setVolume(0);
        else player.setVolume(volume);
    }, [volume, muted, player]);

    const changeRepeatMode = () => {
        if (player.getRepeatMode() === 'none') player.setRepeatMode('all');
        else if (player.getRepeatMode() === 'all') player.setRepeatMode('one');
        else player.setRepeatMode('none');

        updateSettings({repeat: player.getRepeatMode()})
    };

    const search = () => {
        window.electron.openWindow('media_selector', {action: 'play_now'});
    };

    const changeVolume = (_: number, newValue: number) => {
        if (muted && newValue > 0) setMuted(false);
        setVolume(newValue);
        updateSettings({volume: newValue});
    };

    const toggleMute = () => {
        if (!muted) setMuted(true);
        else setMuted(false);
    };

    const queueExists = queue && queue.length > 0;
    const isFirstTrack = queueExists && currentTrack ? queue[0].id === currentTrack.id : false;
    const isLastTrack = queueExists && currentTrack ? queue[queue.length - 1].id === currentTrack.id : false;
    const repeatModeAll = settings.repeat === 'all';
    const VolumeIcon = muted ? PiSpeakerSimpleSlashBold : getVolumeIcon(volume);

    return (
        <>
            <div className={styles.player}>
                <div className={styles.leftColumn}>
                    {status?.playing && currentTrack && <TrackInfo track={currentTrack} className={styles.trackInfo}/>}
                </div>

                <div className={styles.centerColumn}>
                    <div className={styles.playerButtons}>
                        <PlayerBtn
                            icon={<PiStopFill/>}
                            disabled={!status?.playing}
                            onClick={() => player.stop()}
                            title={'Stop'}
                        />
                        <PlayerBtn
                            icon={<PiSkipBackFill/>}
                            disabled={!queueExists || (isFirstTrack && !repeatModeAll)}
                            onClick={() => player.previous()}
                            title={'Previous'}
                        />
                        <PlayerBtn
                            icon={status?.playing && !status?.paused ? <PiPauseCircleFill/> : <PiPlayCircleFill/>}
                            size={'large'}
                            disabled={!currentTrack && !queueExists}
                            onClick={() => player.playPause()}
                            title={status?.playing && !status?.paused ? 'Pause' : 'Play'}
                        />
                        <PlayerBtn
                            icon={<PiSkipForwardFill/>}
                            disabled={!queueExists || (isLastTrack && !repeatModeAll)}
                            onClick={() => player.next()}
                            title={'Next'}
                        />
                        <PlayerBtn
                            icon={settings.repeat === 'one' ? <PiRepeatOnceBold/> : <PiRepeatBold/>}
                            onClick={changeRepeatMode}
                            className={settings.repeat === 'none' ? styles.disabledBtn : undefined}
                            title={`Repeat: ${settings.repeat}`}
                        />
                    </div>

                    <div className={styles.progressGroup}>
                        <span className={clsx(styles.progressTime, !status.playing && styles.hidden)}>{currentTime.formatted() || '00:00'}</span>
                        <ProgressBar
                            className={styles.progressBar}
                            seekable
                            disabled={!status?.playing}
                            max={status.playing ? duration?.getTimeMs() : 99999999}
                            val={status.playing ? currentTime.getTimeMs() : 0}
                            displayFunction={formatTime}
                            onChange={(_, newValue) => player.seek(newValue)}
                        />
                        <span className={clsx(styles.progressTime, !status.playing && styles.hidden)}>{duration.formatted() || '00:00'}</span>
                    </div>
                </div>

                <div className={styles.rightColumn}>
                    <PlayerBtn
                        icon={<PiMagnifyingGlassBold/>}
                        onClick={search}
                        title={'Search'}
                    />
                    <PlayerBtn
                        icon={<PiPlaylistBold/>}
                        disabled={!queueExists}
                        title={queueExists ? 'Playlist' : undefined}
                        onClick={showPlaylist}
                    />
                    <PlayerBtn
                        icon={<PiSlidersHorizontalBold/>}
                        title={'Profile settings'}
                        onClick={showProfileSettings}
                    />

                    <div className={styles.volumeBlock}>
                        <PlayerBtn
                            icon={<VolumeIcon/>}
                            onClick={toggleMute}
                            title={muted ? 'Unmute' : 'Mute'}
                        />
                        <ProgressBar className={styles.volumeSlider} min={0} max={100} val={volume} seekable onChange={changeVolume}/>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Player;