import styles from "./AudioSettingsPage.module.css";
import Row from "../layout/Row";
import Col from "../layout/Col";
import Select, {Option} from "../forms/Select";
import React, {useEffect, useRef, useState} from "react";
import {getAudioDevices} from "../../utils/utils";
import {useWindow} from "../../context/WindowContext";
import Button from "../misc/Button";
import {PiPlayFill} from "react-icons/pi";
import {usePlayer} from "../../context/PlayerContext";
import {PlayerTrack} from "../../../types";
import ProgressBar from "../forms/ProgressBar";

const TEST_SOUND: PlayerTrack = {
    id: 'test-sound',
    source: {
        type: 'url',
        src: './test.mp3'
    },
    title: 'Test Sound',
    duration: 0,
    board: undefined,
    directStream: true,
    volumeOverride: 80
}

const AudioSettingsPage = () => {
    const {settings} = useWindow();
    const {player, previewPlayer} = usePlayer();

    const [audioDevices, setAudioDevices] = useState<Option[]>([]);
    const [ready, setReady] = useState(false);

    const [mainOutput, setMainOutput] = useState<string>();
    const [previewOutput, setPreviewOutput] = useState<string>();
    const [previewVolume, setPreviewVolume] = useState<number>(settings.previewVolume || 50);

    const previewDebounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        getAudioDevices().then(devices => {
            const options = devices.map(device => ({
                value: device.deviceId,
                label: device.deviceId === 'default' ? 'Default' : device.label
            }));

            setAudioDevices(options);
            setMainOutput(settings.outputDevice || 'default');
            setPreviewOutput(settings.previewOutputDevice || 'default');
            setReady(true);
        });
    }, [settings.outputDevice]);

    const handleMainOutputChange = (value: string) => {
        setMainOutput(value);
        player.setOutputDevice(value);
        window.electron.settings.set({outputDevice: value});
    }

    const handlePreviewOutputChange = (value: string) => {
        setPreviewOutput(value);
        previewPlayer.setOutputDevice(value);
        window.electron.settings.set({previewOutputDevice: value});
    }

    const handlePreview = (deviceId: 'main' | 'preview') => {
        if (player.getStatus().playing) player.stop();
        if (previewPlayer.getStatus().playing) previewPlayer.stop();

        if (deviceId === 'main') player.playNow(TEST_SOUND);
        else previewPlayer.playNow(TEST_SOUND);
    }

    const changeVolume = (_: number, newValue: number) => {
        if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);

        setPreviewVolume(newValue);
        previewPlayer.setVolume(newValue);

        previewDebounceRef.current = setTimeout(() => {
            window.electron.settings.set({previewVolume: newValue});
        }, 500);
    }

    if (!ready) return null;

    return (
        <div className={styles.page}>
            <Row className={styles.row}>
                <Col size={3}>
                    <label>Main Output</label>
                </Col>
                <Col size={6}>
                    <Select
                        options={audioDevices}
                        placeholder={"Select Main Output Device..."}
                        onChange={handleMainOutputChange}
                        value={mainOutput}
                    />
                </Col>
                <Col size={2}>
                    <Button
                        icon={<PiPlayFill/>}
                        onClick={() => handlePreview('main')}
                    >
                        Preview
                    </Button>
                </Col>
            </Row>
            <Row className={styles.row}>
                <Col size={3}>
                    <label>Preview Output</label>
                </Col>
                <Col size={6}>
                    <Select
                        options={audioDevices}
                        placeholder={"Select Preview Output Device..."}
                        onChange={handlePreviewOutputChange}
                        value={previewOutput}
                    />
                </Col>
                <Col size={2}>
                    <Button
                        icon={<PiPlayFill/>}
                        onClick={() => handlePreview('preview')}
                    >
                        Preview
                    </Button>
                </Col>
            </Row>
            <Row className={styles.row}>
                <Col size={3}>
                    <label>Preview Volume</label>
                </Col>
                <Col size={6}>
                    <ProgressBar min={0} max={100} val={previewVolume} seekable onChange={changeVolume}/>
                </Col>
            </Row>
        </div>
    )
}

export default AudioSettingsPage;
