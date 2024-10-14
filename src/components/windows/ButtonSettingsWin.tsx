import './ButtonSettingsWin.css';
import Window from "../Window";
import React, {ChangeEvent, useEffect, useState} from "react";
import {useButton} from "../../ui/buttonContext";
import {useData} from "../../ui/context";
import {SbButton} from "../../utils/store/profiles";
import InputField from "../generic/forms/InputField";
import Button from "../generic/Button";
import Select from "../generic/forms/Select";
import Separator from "../generic/Separator";
import ColorSetting from "../button_settings/ColorSetting";
import SoundboardButton from "../soundboard/SoundboardButton";

const ButtonSettingsWin = () => {
    const {activeProfile, winId} = useData();
    const {button, setButton} = useButton();
    const [buttonPos, setButtonPos] = useState({row: 0, col: 0});

    const configureButton = (row: number, col: number) => {
        let btn = activeProfile.buttons.find(b => b.row === row && b.col === col);
        if (!btn) {
            btn = {
                row: row,
                col: col,
                song: null
            } as SbButton;
        }
        setButton(btn);
    };

    useEffect(() => {
        (window as any).electron.handleButton('button', (row: number, col: number) => {
            if (activeProfile) configureButton(row, col);
            else setButtonPos({row, col});
        });
    }, []);

    useEffect(() => {
        if (activeProfile) configureButton(buttonPos.row, buttonPos.col);
    }, [activeProfile, buttonPos]);

    const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
        setButton({...button, title: e.target.value});
    };

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setButton({...button, title: e.target.value});
    };

    const handleStartTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
        setButton({...button, song: {...button.song, start_time: parseInt(e.target.value)}});
    };

    const handleStartTimeUnitChange = (value: string) => {
        setButton({...button, song: {...button.song, start_time_unit: value}});
    };

    const handleEndTimeTypeChange = (value: string) => {
        setButton({...button, song: {...button.song, end_time_type: value}});
    };

    const handleEndTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
        setButton({...button, song: {...button.song, end_time: parseInt(e.target.value)}});
    };

    const handleEndTimeUnitChange = (value: string) => {
        setButton({...button, song: {...button.song, end_time_unit: value}});
    };

    const handleBackgroundColorChange = (color: string) => {
        setButton({...button, background_color: color});
    };

    const handleBackgroundColorHoverChange = (color: string) => {
        setButton({...button, background_color_hover: color});
    };

    const handleTextColorChange = (color: string) => {
        setButton({...button, text_color: color});
    };

    const handleTextColorHoverChange = (color: string) => {
        setButton({...button, text_color_hover: color});
    };

    const handleBorderColorChange = (color: string) => {
        setButton({...button, border_color: color});
    };

    const handleBorderColorHoverChange = (color: string) => {
        setButton({...button, border_color_hover: color});
    };

    const openMediaSelectorWin = () => {
        (window as any).electron.openMediaSelectorWin(button.row, button.col, winId);
    };

    const closeWindow = () => {
        (window as any).electron.close(winId);
    };

    const saveButton = () => {
        (window as any).electron.saveButton(activeProfile.id, button);
        (window as any).electron.close(winId);
    };


    const titlebar = (
        <span className={"subtitle"}>Button {button?.row}.{button?.col}</span>
    );

    if (!activeProfile || button === undefined) {
        return <Window titlebar={titlebar}/>
    } else {
        return (
            <Window titlebar={titlebar}>
                <div className={"row"}>
                    <label>File or Url</label>
                    <InputField defaultValue={button.song?.original_url} placeholder={"File or Url"} onChange={handleUrlChange}/>
                    <Button icon={"edit"} className={'primary'} onClick={openMediaSelectorWin}>Edit</Button>
                </div>
                <Separator/>
                <div className={"row"}>
                    <label>Title</label>
                    <InputField defaultValue={button?.title} placeholder={"Title"} onChange={handleTitleChange}/>
                </div>
                <div className={"row"}>
                    <label>Track starts after</label>
                    <InputField
                        defaultValue={button.song?.start_time ? button.song.start_time : 0}
                        type={"number"}
                        min={0}
                        max={button.song?.duration ? button.song.duration : undefined}
                        onChange={handleStartTimeChange}
                    />
                    <Select
                        options={[
                            {value: 's', label: 'Seconds', selected: button.song?.start_time_unit === 's'},
                            {value: 'ms', label: 'Milliseconds', selected: button.song?.start_time_unit === 'ms'},
                            {value: 'm', label: 'Minutes', selected: button.song?.start_time_unit === 'm'}
                        ]}
                        onChange={handleStartTimeUnitChange}
                    />
                </div>
                <div className={"row"}>
                    <label>Track ends</label>
                    <Select
                        options={[
                            {value: 'after', label: 'After', selected: button.song?.end_time_type === 'after'},
                            {value: 'at', label: 'At', selected: button.song?.end_time_type === 'at'}
                        ]}
                        onChange={handleEndTimeTypeChange}
                    />
                    <InputField
                        defaultValue={button.song?.end_time ? button.song.end_time : 0}
                        type={"number"}
                        min={0}
                        max={button.song?.duration ? button.song.duration : undefined}
                        onChange={handleEndTimeChange}
                    />
                    <Select
                        options={[
                            {value: 's', label: 'Seconds', selected: button.song?.start_time_unit === 's'},
                            {value: 'ms', label: 'Milliseconds', selected: button.song?.start_time_unit === 'ms'},
                            {value: 'm', label: 'Minutes', selected: button.song?.start_time_unit === 'm'}
                        ]}
                        onChange={handleEndTimeUnitChange}
                    />
                </div>
                <Separator/>
                <div className={"row col-container"}>
                    <div className={"col"}>
                        <ColorSetting
                            label={"Background color"}
                            color={button.background_color}
                            onChange={handleBackgroundColorChange}
                        />
                        <ColorSetting
                            label={"Background hover color"}
                            color={button.background_color_hover}
                            onChange={handleBackgroundColorHoverChange}
                        />
                        <ColorSetting
                            label={"Text color"}
                            color={button.text_color}
                            onChange={handleTextColorChange}
                        />
                        <ColorSetting
                            label={"Text hover color"}
                            color={button.text_color_hover}
                            onChange={handleTextColorHoverChange}
                        />
                        <ColorSetting
                            label={"Border color"}
                            color={button.border_color}
                            onChange={handleBorderColorChange}
                        />
                        <ColorSetting
                            label={"Border hover color"}
                            color={button.border_color_hover}
                            onChange={handleBorderColorHoverChange}
                        />
                    </div>
                    <div className={"col"}>
                        <div className={"preview-container"}>
                            <SoundboardButton row={button.row} col={button.col} button={button}/>
                        </div>
                    </div>
                </div>
                <div className={"buttons"}>
                    <Button icon={"close"} className={"danger"} onClick={closeWindow}>Discard</Button>
                    <Button icon={"save"} className={"success"} onClick={saveButton}>Save</Button>
                </div>
            </Window>
        );
    }
};

export default ButtonSettingsWin;