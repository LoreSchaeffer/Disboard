import './Player.css';
import TrackInfo from "./TrackInfo";
import {usePlayer} from "../../utils/playerContext";
import {useData} from "../../utils/windowContext";
import PlayerButton from "./PlayerButton";
import ProgressBar from "../generic/ProgressBar";
import React, {useEffect, useRef, useState} from "react";
import {IconType} from "../../utils/icons";
import {formatTime} from "../../utils/utils";
import {Song} from "../../utils/store/profiles";
import {SettingsData} from "../../utils/store/settings";
import {MenuItemProps} from "../menu/ContextMenuItem";
import {ContextMenuProps} from "../menu/ContextMenu";
import InputField from "../generic/forms/InputField";
import Spinner from "../generic/forms/Spinner";

function getVolumeIcon(volume: number) {
    if (volume < 15) return 'volume_low';
    else if (volume < 50) return 'volume_medium';
    else return 'volume_high';
}

const Player = () => {
    const {mainPlayer, settings, setSettings, winId, setContextMenu, activeProfile, profiles} = useData();
    const {setSong, setDuration, queue, setQueue} = usePlayer();
    const [stopDisabled, setStopDisabled] = useState(true);
    const [previousDisabled, setPreviousDisabled] = useState(true);
    const [skipDisabled, setSkipDisabled] = useState(true);
    const [playStatus, setPlayStatus] = useState({disabled: true, icon: 'play_circle'} as { disabled: boolean, icon: IconType });
    const [progressBarStatus, setProgressBarStatus] = useState({disabled: true, currentTime: 0, totalTime: 100, val: 0} as { disabled: boolean, currentTime: number, totalTime: number, val: number });
    const [repeatStatus, setRepeatStatus] = useState({fill: 'var(--text-disabled)', icon: 'repeat'} as { fill: string, icon: IconType });
    const [volumeStatus, setVolumeStatus] = useState({volume: 0, muted: false, icon: 'volume_high'} as { volume: number, muted: boolean, icon: IconType });
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>();
    const [settingsPosition, setSettingsPosition] = useState({x: window.innerWidth, y: window.innerHeight});
    const [settingsVisible, setSettingsVisible] = useState(false);
    const mediaOutputBtnRef = useRef<HTMLSpanElement>(null);
    const settingsBtnRef = useRef<HTMLSpanElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        (window as any).electron.handlePlayNow('play_now', (song: Song) => {
            mainPlayer.playNow(song);
        });

        navigator.mediaDevices.enumerateDevices().then((devices) => {
            const ad = [] as MediaDeviceInfo[];

            devices.forEach((device) => {
                if (device.kind !== 'audiooutput' || device.deviceId === 'default' || device.deviceId === 'communications') return;
                ad.push(device);
            });

            setAudioDevices(ad);
        });
    }, []);

    useEffect(() => {
        setVolumeStatus({volume: settings.volume, muted: false, icon: getVolumeIcon(settings.volume)});
        setRepeatStatus({fill: settings.loop === 'none' ? 'var(--text-disabled)' : 'var(--text-primary)', icon: settings.loop === 'one' ? 'repeat_one' : 'repeat'});
    }, [settings]);

    useEffect(() => {
        if (queue.length === 0) {
            setPreviousDisabled(true);
            setSkipDisabled(true);
        } else {
            setPreviousDisabled(false);
            setSkipDisabled(false);
            if (!mainPlayer.isPlayerPlaying()) {
                setPlayStatus((prev) => {
                    return {...prev, disabled: false};
                });
            }
        }
    }, [queue, setQueue]);

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

    useEffect(() => {
        const handleClickOutsideSettings = (e:MouseEvent) => {
            if (!settingsVisible && settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
                setSettingsVisible(false);
                setSettingsPosition({x: window.innerWidth, y: window.innerHeight});
            }
        }

        document.addEventListener('mousedown', handleClickOutsideSettings);

        return () => {
            document.removeEventListener('mousedown', handleClickOutsideSettings);
        }
    }, [setSettingsVisible]);

    const handlePlay = () => {
        mainPlayer.playPause();
    }

    const handleVolumeChange = (_oldValue: number, newValue: number) => {
        setSettings((prev) => {
            const newSettings = {...prev, volume: newValue} as SettingsData;
            (window as any).electron.saveSettings(newSettings);
            return newSettings;
        });
    };

    const formatProgressVal = (val: number) => {
        return formatTime(val);
    };

    const handleRepeatMode = () => {
        if (mainPlayer.getLoopMode() === 'none') mainPlayer.loop('all');
        else if (mainPlayer.getLoopMode() === 'all') mainPlayer.loop('one');
        else mainPlayer.loop('none');

        setSettings((prev) => {
            const newSettings = {...prev, loop: mainPlayer.getLoopMode()} as SettingsData;
            (window as any).electron.saveSettings(newSettings);
            return newSettings;
        });
    };

    const handleSeek = (_oldValue: number, newValue: number) => {
        mainPlayer.seekTo(newValue);
        setProgressBarStatus((prev) => {
            return {...prev, val: newValue};
        });
    };

    const handleSearch = () => {
        (window as any).electron.openMediaSelectorWin(null, null, winId);
    };

    const handleShowQueue = () => {
        console.log('Show queue');
    };

    const handleShowMediaOutput = () => {
        const selectDevice = (deviceId: string) => {
            setSettings((prev) => {
                const newSettings = {...prev, output_device: deviceId} as SettingsData;
                (window as any).electron.saveSettings(newSettings);
                return newSettings;
            });
        }

        const testPlayback = () => {
            mainPlayer.pause();
            const audio = new Audio();
            (audio as any).setSinkId(settings.output_device).then(() => {
                audio.volume = settings.volume / 100;
                audio.src = '/test.mp3';
                audio.load();
                audio.play();
            }).catch(console.error);
        }

        const contextMenu = audioDevices.map((device) => {
            return {
                text: device.label,
                onClick: () => selectDevice(device.deviceId),
                icon: device.deviceId === settings.output_device ? 'radio_button_checked' : 'radio_button',
                type: device.deviceId === settings.output_device ? 'primary' : 'normal'
            } as MenuItemProps;
        });

        contextMenu.push({
            type: 'separator'
        });

        contextMenu.push({
            text: 'Test Playback',
            icon: 'play',
            onClick: testPlayback
        });

        const rect = mediaOutputBtnRef.current.getBoundingClientRect();

        setContextMenu({
            x: rect.left - 30,
            y: rect.top - 10,
            xAnchor: 'right',
            yAnchor: 'bottom',
            items: contextMenu,
            style: {
                minWidth: '400px'
            }
        } as ContextMenuProps);
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
        if (settingsRef.current && settingsBtnRef.current) {
            const settingsBtnRect = settingsBtnRef.current.getBoundingClientRect();
            const settingsRect = settingsRef.current.getBoundingClientRect();

            const newX = settingsBtnRect.right - 10 - settingsRect.width;
            const newY = settingsBtnRect.bottom - 47 - settingsRect.height;

            setSettingsPosition({x: newX, y: newY});
            setSettingsVisible(true);
        }
    }

    const handleProfileRename = (e: React.ChangeEvent<HTMLInputElement>) => {
        const profile = activeProfile;
        profile.name = e.target.value;
        (window as any).electron.saveProfile(profile);
    }

    const handleRowsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const profile = activeProfile;
        profile.rows = Number(e.target.value);
        (window as any).electron.saveProfile(profile);
    }

    const handleColsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const profile = activeProfile;
        profile.cols = Number(e.target.value);
        (window as any).electron.saveProfile(profile);
    }

    return (
        <>
            <div className="player">
                <TrackInfo/>
                <div className="player-controls">
                    <div className="player-buttons">
                        <PlayerButton icon="stop" disabled={stopDisabled} onClick={() => mainPlayer.stop()}/>
                        <PlayerButton icon="previous" disabled={previousDisabled} onClick={() => mainPlayer.previous()}/>
                        <PlayerButton icon={playStatus.icon} size="44px" disabled={playStatus.disabled} onClick={handlePlay}/>
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
                            displayFunction={formatProgressVal}
                            onChange={handleSeek}
                        />
                        <span className="progress-time total-time" style={{display: mainPlayer.isPlayerPlaying() ? 'block' : 'none'}}>{formatTime(progressBarStatus.totalTime)}</span>
                    </div>
                </div>
                <div className={"player-secondary-controls"}>
                    <PlayerButton icon="search" onClick={handleSearch}/>
                    <PlayerButton icon="queue" onClick={handleShowQueue}/>
                    <PlayerButton ref={mediaOutputBtnRef} icon="media_output" onClick={handleShowMediaOutput}/>
                    <PlayerButton icon={volumeStatus.icon} onClick={handleVolumeClick}/>
                    <ProgressBar className="player-volume" min={0} max={100} val={settings.volume} seek={true} onChange={handleVolumeChange}/>
                    <PlayerButton ref={settingsBtnRef} icon="settings" onClick={handleSettings}/>
                </div>
            </div>
            <div ref={settingsRef} className={"settings"} style={{
                top: settingsPosition.y,
                left: settingsPosition.x,
                opacity: settingsVisible ? 1 : 0
            }}>
                <span className={"title"}>Profile settings</span>
                <div className={"row"}>
                    <label>Name</label>
                    <InputField value={activeProfile.name} onChange={handleProfileRename}/>
                </div>
                <div className={"row"}>
                    <label>Rows</label>
                    <Spinner min={1} value={activeProfile.rows} onChange={handleRowsChange}/>
                </div>
                <div className={"row"}>
                    <label>Cols</label>
                    <Spinner min={1} value={activeProfile.cols} onChange={handleColsChange}/>
                </div>
            </div>
        </>
    );
}

export default Player;