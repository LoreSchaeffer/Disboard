import styles from './Player.module.css';
import TrackInfo from "./TrackInfo";
import PlayerButton from "./PlayerButton";
import ProgressBar from "../generic/ProgressBar";
import React, {ChangeEvent, useEffect, useRef, useState} from "react";
import {ContextMenuItemProps} from "../menu/ContextMenuItem";
import InputField from "../generic/forms/InputField";
import Spinner from "../generic/forms/Spinner";
import {useWindow} from "../../context/WindowContext";
import {usePlayer} from "../../context/PlayerContext";
import {IconType} from "../SvgIcon";
import {formatTime} from "../../utils/utils";
import {Track} from "../../../types/track";
import Row from "../Row";


const getVolumeIcon = (volume: number) => {
    if (volume < 15) return 'volume_low';
    else if (volume < 50) return 'volume_medium';
    else return 'volume_high';
}

const formatProgressVal = (val: number) => {
    return formatTime(val);
};

const Player = () => {
    const {settings, setSettings, setContextMenu, activeProfile} = useWindow();
    const {player, status, currentTrack, duration, currentTime, queue} = usePlayer();

    const [repeatStatus, setRepeatStatus] = useState<{ icon: IconType, fill: string }>({icon: 'repeat', fill: 'var(--text-disabled)'});
    const [volumeStatus, setVolumeStatus] = useState<{ volume: number, muted: boolean, icon: IconType, prevValue: number }>({volume: 0, muted: false, icon: 'volume_high', prevValue: 0});
    const [profileSettingsStatus, setProfileSettingsStatus] = useState<{ visible: boolean, x: number, y: number }>({visible: false, x: 0, y: 0});
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>();

    const profileSettingsRef = useRef<HTMLDivElement>(null);
    const profileSettingsBtnRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.electron.onPlayNow((track: Track) => {
            player.playNow(track);
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
        setVolumeStatus((prev) => ({volume: settings.volume, muted: prev.muted, icon: getVolumeIcon(settings.volume), prevValue: prev.prevValue != 0 ? prev.prevValue : settings.volume}));
        setRepeatStatus({fill: settings.repeat === 'none' ? 'var(--text-disabled)' : 'var(--text-primary)', icon: settings.repeat === 'one' ? 'repeat_one' : 'repeat'});
    }, [settings]);

    useEffect(() => {
        const onClickOutsideProfileSettings = (e: MouseEvent) => {
            if (!profileSettingsRef.current || !profileSettingsStatus.visible) return;

            if (!profileSettingsRef.current.contains(e.target as Node)) {
                setProfileSettingsStatus((prev) => ({...prev, visible: false}));
            }
        }

        const updateProfileSettingsPosition = () => {
            if (!profileSettingsRef.current || !profileSettingsBtnRef.current || !profileSettingsStatus.visible) return;

            setProfileSettingsPosition(profileSettingsBtnRef.current.getBoundingClientRect(), profileSettingsRef.current.getBoundingClientRect());
        }

        document.addEventListener('mousedown', onClickOutsideProfileSettings);
        window.addEventListener('resize', updateProfileSettingsPosition);

        return () => {
            document.removeEventListener('mousedown', onClickOutsideProfileSettings);
            window.removeEventListener('resize', updateProfileSettingsPosition);
        }
    }, [profileSettingsRef, profileSettingsBtnRef, profileSettingsStatus.visible]);


    const play = () => {
        player.playPause();
    }

    const changeRepeatMode = () => {
        if (player.getRepeatMode() === 'none') player.setRepeatMode('all');
        else if (player.getRepeatMode() === 'all') player.setRepeatMode('one');
        else player.setRepeatMode('none');

        setSettings({...settings, repeat: player.getRepeatMode()})
    };

    const seek = (_: number, newValue: number) => { // TODO Check if manual progress bar change is needed
        player.seek(newValue);
    };

    const search = () => {
        window.electron.openMediaSelectorWin(null, null);
    };

    const showQueue = () => {
        console.log('Show queue');
    };

    const showMediaOutputDevices = (e: React.MouseEvent) => {
        const selectDevice = (deviceId: string) => {
            setSettings({...settings, output_device: deviceId});
        }

        const testPlayback = () => {
            player.pause();
            const audio = new Audio();
            audio.setSinkId(settings.output_device).then(() => {
                audio.volume = settings.volume / 100;
                audio.src = '/test.mp3';
                audio.load();
                audio.play().catch(e => console.error('Error playing test sound:', e));
            }).catch(console.error);
        }

        const items = audioDevices.map((device) => {
            return {
                text: device.label,
                onClick: () => selectDevice(device.deviceId),
                icon: device.deviceId === settings.output_device ? 'radio_button_checked' : 'radio_button',
                type: device.deviceId === settings.output_device ? 'primary' : 'normal'
            };
        }) as ContextMenuItemProps[];

        items.push({
            type: 'separator'
        });

        items.push({
            text: 'Test Playback',
            icon: 'play',
            onClick: testPlayback
        });

        const rect = (e.target as HTMLElement).getBoundingClientRect();

        setContextMenu({
            x: rect.left - 10,
            y: rect.top - 10,
            xAnchor: 'right',
            yAnchor: 'bottom',
            items: items,
            style: {
                minWidth: '400px'
            }
        });
    };

    const changeVolume = (_: number, newValue: number) => {
        setVolumeStatus((prev) => ({...prev, volume: newValue, prevValue: newValue, icon: getVolumeIcon(newValue)}));
        setSettings({...settings, volume: newValue});
    };

    const changeVolumeWithBtn = () => {
        if (volumeStatus.muted) {
            setVolumeStatus((prev) => ({...prev, muted: false, volume: prev.prevValue, icon: getVolumeIcon(prev.prevValue)}));
            setSettings({...settings, volume: volumeStatus.prevValue});
        } else {
            setVolumeStatus((prev) => ({...prev, muted: true, prevValue: prev.volume, volume: 0, icon: 'volume_off'}));
            setSettings({...settings, volume: 0});
        }
    };

    const showProfileSettings = (e: React.MouseEvent) => {
        if (!profileSettingsRef.current) return;

        setProfileSettingsPosition((e.target as HTMLElement).getBoundingClientRect(), profileSettingsRef.current.getBoundingClientRect());
        setProfileSettingsStatus((prev) => ({...prev, visible: !prev.visible}));
    };

    const renameProfile = (e: ChangeEvent<HTMLInputElement>) => {
        const profile = activeProfile;
        profile.name = e.target.value;
        window.electron.saveProfile(profile);
    }

    const changeRowNum = (e: ChangeEvent<HTMLInputElement>) => {
        const profile = activeProfile;
        profile.rows = Number(e.target.value);
        window.electron.saveProfile(profile);
    }

    const changeColNum = (e: ChangeEvent<HTMLInputElement>) => {
        const profile = activeProfile;
        profile.cols = Number(e.target.value);
        window.electron.saveProfile(profile);
    }

    const setProfileSettingsPosition = (buttonRect: DOMRect, profileSettingsRect: DOMRect) => {
        setProfileSettingsStatus((prev) => ({
            ...prev,
            x: buttonRect.right - 10 - profileSettingsRect.width,
            y: buttonRect.bottom - 47 - profileSettingsRect.height
        }));
    }

    return (
        <>
            <div className={styles.player}>
                {status?.playing && <TrackInfo className={styles.trackInfo}/>}

                <div className={styles.playerControls}>
                    <div className={styles.playerButtons}>
                        <PlayerButton icon="stop" disabled={!status?.playing} onClick={() => player.stop()}/>
                        <PlayerButton icon="previous" disabled={!queue || queue.length == 0} onClick={() => player.previous()}/>
                        <PlayerButton icon={status?.playing && !status?.paused ? 'pause_circle' : 'play_circle'} size="44px" disabled={!currentTrack && (!queue || queue.length == 0)} onClick={play}/>
                        <PlayerButton icon="next" disabled={!queue || queue.length == 0} onClick={() => player.next()}/>
                        <PlayerButton icon={repeatStatus.icon} onClick={changeRepeatMode} fill={repeatStatus.fill}/>
                    </div>

                    <div className={styles.progressGroup}>
                        {status?.playing && <span className={styles.progressTime}>{formatTime(currentTime)}</span>}
                        <ProgressBar
                            className={styles.progressBar}
                            seek={true}
                            disabled={!status?.playing}
                            max={duration?.getTimeMs()}
                            val={currentTime}
                            displayFunction={formatProgressVal}
                            onChange={seek}
                        />
                        {status?.playing && <span className={styles.progressTime}>{formatTime(duration.getTimeMs())}</span>}
                    </div>
                </div>

                <div className={styles.rightControls}>
                    <PlayerButton icon="search" onClick={search}/>
                    <PlayerButton icon="queue" onClick={showQueue}/>
                    <PlayerButton icon="media_output" onClick={showMediaOutputDevices}/>
                    <PlayerButton icon={volumeStatus.icon} onClick={changeVolumeWithBtn}/>
                    <ProgressBar className={styles.volume} min={0} max={100} val={volumeStatus.volume} seek={true} onChange={changeVolume}/>
                    <PlayerButton ref={profileSettingsBtnRef} icon="settings" onClick={showProfileSettings}/>
                </div>
            </div>

            <div ref={profileSettingsRef}
                 className={styles.profileSettings}
                 style={{
                     top: profileSettingsStatus.y,
                     left: profileSettingsStatus.x,
                     opacity: profileSettingsStatus.visible ? 1 : 0,
                     pointerEvents: profileSettingsStatus.visible ? 'auto' : 'none'
                 }}
            >
                <span className={styles.title}>Profile settings</span>
                <Row justify="space-between">
                    <label>Name</label>
                    <InputField value={activeProfile.name} onChange={renameProfile}/>
                </Row>
                <Row justify="space-between">
                    <label>Rows</label>
                    <Spinner min={1} value={activeProfile.rows} onChange={changeRowNum}/>
                </Row>
                <Row justify="space-between">
                    <label>Cols</label>
                    <Spinner min={1} value={activeProfile.cols} onChange={changeColNum}/>
                </Row>
            </div>
        </>
    );
}

export default Player;