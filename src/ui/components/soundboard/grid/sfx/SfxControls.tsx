import styles from "./SfxControls.module.css";
import {useWindow} from "../../../../context/WindowContext";
import {usePlayer} from "../../../../context/PlayerContext";
import React, {useEffect, useState} from "react";
import {useProfiles} from "../../../../context/ProfilesContext";
import {GridMediaSelectorWin} from "../../../../../types";
import {PiMagnifyingGlassBold, PiPauseCircleFill, PiPlayCircleFill, PiSlidersHorizontalBold, PiSpeakerSimpleSlashBold, PiStopCircleFill} from "react-icons/pi";
import {getVolumeIcon} from "../../../../utils/utils";
import PlayerBtn from "../../../player/PlayerBtn";
import ProgressBar from "../../../forms/ProgressBar";

type SfxControlsProps = {
    showProfileSettings?: () => void;
}

const SfxControls = ({showProfileSettings}: SfxControlsProps) => {
    const {settings, updateSettingsAsync} = useWindow();
    const {boardType} = useProfiles();
    const {player, activeSfx} = usePlayer();

    const [volume, setVolume] = useState<number>(settings[boardType].volume);
    const [muted, setMuted] = useState<boolean>(false);

    useEffect(() => {
        setVolume(settings[boardType].volume);
    }, [settings[boardType].volume]);

    useEffect(() => {
        if (muted) player.setVolume(0);
        else player.setVolume(volume);
    }, [volume, muted, player]);

    if (boardType !== 'sfx') return null;

    const search = () => {
        window.electron.window.open('grid_media_selector', {boardType: boardType, action: 'play_now'} as GridMediaSelectorWin);
    };

    const changeVolume = (_: number, newValue: number) => {
        if (muted && newValue > 0) setMuted(false);
        setVolume(newValue);
        updateSettingsAsync({music: {volume: newValue}});
    };

    const toggleMute = () => {
        if (!muted) setMuted(true);
        else setMuted(false);
    };

    const VolumeIcon = muted ? PiSpeakerSimpleSlashBold : getVolumeIcon(volume);
    const activeSfxCount = Object.values(activeSfx).length;

    return (
        <div className={styles.controls}>
            <div className={styles.leftColumn}>
                {activeSfxCount > 0 && (
                    <span>Playing {activeSfxCount} SFX</span>
                )}
            </div>
            <div className={styles.centerColumn}>
                <PlayerBtn
                    icon={<PiStopCircleFill/>}
                    size={'large'}
                    disabled={activeSfxCount === 0}
                    onClick={() => player.stopAllSfx()}
                    title={'Stop All'}
                />
            </div>
            <div className={styles.rightColumn}>
                <PlayerBtn
                    icon={<PiMagnifyingGlassBold/>}
                    onClick={search}
                    title={'Search'}
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
    )
}

export default SfxControls;