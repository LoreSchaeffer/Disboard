import './ButtonSettingsWin.css';
import Window from "./Window";
import React, {ChangeEvent} from "react";
import {useButton} from "../../utils/buttonContext";
import {useData} from "../../utils/windowContext";
import InputField from "../generic/forms/InputField";
import Button from "../generic/Button";
import Select from "../generic/forms/Select";
import Separator from "../generic/Separator";
import ColorSetting from "../button_settings/ColorSetting";
import SoundboardButton from "../soundboard/SoundboardButton";
import {TimeUnit} from "../../utils/store/profiles";
import {Time} from "../../utils/time";

const ButtonSettingsWin = () => {
    const {activeProfile, winId} = useData();
    const {button, setButton} = useButton();

    const handleUriChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
    }

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => setButton((prev) => {
        return {...prev, title: e.target.value};
    });

    const handleStartTimeChange = (e: ChangeEvent<HTMLInputElement>) => setButton((prev) => {
        if (!button.song || !button.song.duration) return prev;

        const startTime = new Time(parseInt(e.target.value), button.song.start_time_unit || 's');

        if (startTime.isNegative()) {
            startTime.setTime(0);
        } else {
            if (startTime.toMs() > button.song.duration) {
                startTime.setTimeKeepUnit(new Time(button.song.duration, 'ms'));
            }

            if (button.song.end_time) {
                let endTime = new Time(button.song.end_time, button.song.end_time_unit || 's');

                if (button.song.end_time_type === 'at') {
                    if (startTime.toMs() > endTime.toMs()) {
                        startTime.setTimeKeepUnit(endTime);
                    }
                } else if (button.song.end_time_type === 'after') {
                    endTime = endTime.add(startTime);

                    if (endTime.toMs() > button.song.duration) {
                        startTime.setTimeKeepUnit(new Time(button.song.duration, 'ms').subtract(endTime));
                    }
                }
            }
        }

        return {
            ...prev, song: {
                ...prev.song,
                start_time: startTime.getTime(),
                start_time_unit: startTime.getTimeUnit()
            }
        };
    });

    const handleStartTimeUnitChange = (value: TimeUnit) => setButton((prev) => {
        if (!button.song || !button.song.duration) return prev;

        const startTime = new Time(button.song.start_time || 0, value);

        if (startTime.toMs() > button.song.duration) {
            startTime.setTimeKeepUnit(new Time(button.song.duration, 'ms'));
        }

        if (button.song.end_time) {
            let endTime = new Time(button.song.end_time, button.song.end_time_unit || 's');

            if (button.song.end_time_type === 'at') {
                if (startTime.toMs() > endTime.toMs()) {
                    startTime.setTimeKeepUnit(endTime);
                }
            } else if (button.song.end_time_type === 'after') {
                endTime = endTime.add(startTime);

                if (endTime.toMs() > button.song.duration) {
                    startTime.setTimeKeepUnit(new Time(button.song.duration, 'ms').subtract(endTime));
                }
            }
        }

        return {
            ...prev, song: {
                ...prev.song,
                start_time: startTime.getTime(),
                start_time_unit: startTime.getTimeUnit()
            }
        };
    });

    const handleEndTimeTypeChange = (value: string) => setButton((prev) => {
        if (!button.song || !button.song.duration) return prev;

        const endTime = new Time(button.song.end_time || 0, button.song.end_time_unit || 's');
        let endTimeToUpdate = null;

        if (value === 'at') {
            if (endTime.toMs() > button.song.duration) {
                endTime.setTimeKeepUnit(new Time(button.song.duration, 'ms'));
                endTimeToUpdate = endTime;
            }

            if (button.song.start_time) {
                const startTime = new Time(button.song.start_time, button.song.start_time_unit || 's');

                if (endTime.toMs() < startTime.toMs()) {
                    endTime.setTimeKeepUnit(startTime);
                    endTimeToUpdate = endTime;
                }
            }
        } else if (value === 'after') {
            const startTime = new Time(button.song.start_time || 0, button.song.start_time_unit || 's');
            const et = endTime.add(startTime);

            if (et.toMs() > button.song.duration) {
                endTime.setTimeKeepUnit(new Time(button.song.duration, 'ms').subtract(startTime));
                endTimeToUpdate = endTime;
            }
        }

        return {
            ...prev, song: {
                ...prev.song,
                end_time_type: value,
                end_time: endTimeToUpdate ? endTimeToUpdate.getTime() : button.song.end_time,
                end_time_unit: endTimeToUpdate ? endTimeToUpdate.getTimeUnit() : button.song.end_time_unit
            }
        };
    });

    const handleEndTimeChange = (e: ChangeEvent<HTMLInputElement>) => setButton((prev) => {
        if (!button.song || !button.song.duration) return prev;

        const endTime = new Time(parseInt(e.target.value), button.song.end_time_unit || 's');

        if (endTime.isNegative()) {
            endTime.setTime(0);
        } else {
            const endTimeType = button.song.end_time_type || 'after';

            if (endTimeType === 'at') {
                if (endTime.toMs() > button.song.duration) {
                    endTime.setTimeKeepUnit(new Time(button.song.duration, 'ms'));
                }

                if (button.song.start_time) {
                    const startTime = new Time(button.song.start_time, button.song.start_time_unit || 's');

                    if (endTime.toMs() < startTime.toMs()) {
                        endTime.setTimeKeepUnit(startTime);
                    }
                }
            } else if (endTimeType === 'after') {
                const startTime = new Time(button.song.start_time || 0, button.song.start_time_unit || 's');
                const et = endTime.add(startTime);

                if (et.toMs() > button.song.duration) {
                    endTime.setTimeKeepUnit(new Time(button.song.duration, 'ms').subtract(startTime));
                }
            }
        }

        return {
            ...prev, song: {
                ...prev.song,
                end_time: endTime.getTime(),
                end_time_unit: endTime.getTimeUnit(),
                end_time_type: button.song.end_time_type || 'after'
            }
        };
    });

    const handleEndTimeUnitChange = (value: TimeUnit) => setButton((prev) => {
        if (!button.song || !button.song.duration) return prev;

        const endTime = new Time(button.song.end_time || 0, value);

        const endTimeType = button.song.end_time_type || 'after';
        if (endTimeType === 'at') {
            if (endTime.toMs() > button.song.duration) {
                endTime.setTimeKeepUnit(new Time(button.song.duration, 'ms'));
            }

            if (button.song.start_time) {
                const startTime = new Time(button.song.start_time, button.song.start_time_unit || 's');

                if (endTime.toMs() < startTime.toMs()) {
                    endTime.setTimeKeepUnit(startTime);
                }
            }
        } else if (endTimeType === 'after') {
            const startTime = new Time(button.song.start_time || 0, button.song.start_time_unit || 's');
            const et = endTime.add(startTime);

            if (et.toMs() > button.song.duration) {
                endTime.setTimeKeepUnit(new Time(button.song.duration, 'ms').subtract(startTime));
            }
        }

        return {
            ...prev, song: {
                ...prev.song,
                end_time: endTime.getTime(),
                end_time_unit: endTime.getTimeUnit(),
                end_time_type: button.song.end_time_type || 'after'
            }
        };
    });

    const handleBackgroundColorChange = (color: string) => {
        if (button.style === undefined) {
            setButton((prev) => {
                return {...prev, style: {background_color: color}};
            });
        } else {
            setButton((prev) => {
                return {...prev, style: {...prev.style, background_color: color}};
            });
        }
    };

    const handleBackgroundColorHoverChange = (color: string) => {
        if (button.style === undefined) {
            setButton((prev) => {
                return {...prev, style: {background_color_hover: color}};
            });
        } else {
            setButton((prev) => {
                return {...prev, style: {...prev.style, background_color_hover: color}};
            });
        }
    };

    const handleTextColorChange = (color: string) => {
        if (button.style === undefined) {
            setButton((prev) => {
                return {...prev, style: {text_color: color}};
            });
        } else {
            setButton((prev) => {
                return {...prev, style: {...prev.style, text_color: color}};
            });
        }
    };

    const handleTextColorHoverChange = (color: string) => {
        if (button.style === undefined) {
            setButton((prev) => {
                return {...prev, style: {text_color_hover: color}};
            });
        } else {
            setButton((prev) => {
                return {...prev, style: {...prev.style, text_color_hover: color}};
            });
        }
    };

    const handleBorderColorChange = (color: string) => {
        if (button.style === undefined) {
            setButton((prev) => {
                return {...prev, style: {border_color: color}};
            });
        } else {
            setButton((prev) => {
                return {...prev, style: {...prev.style, border_color: color}};
            });
        }
    };

    const handleBorderColorHoverChange = (color: string) => {
        if (button.style === undefined) {
            setButton((prev) => {
                return {...prev, style: {border_color_hover: color}};
            });
        } else {
            setButton((prev) => {
                return {...prev, style: {...prev.style, border_color_hover: color}};
            });
        }
    };

    const openMediaSelectorWin = () => (window as any).electron.openMediaSelectorWin(button.row, button.col, winId);

    const closeWindow = () => (window as any).electron.close(winId);

    const saveButton = () => {
        if (!button.song) return;
        if (button.song.start_time === 0) {
            button.song.start_time = null;
            button.song.start_time_unit = null;
        }

        if (button.song.end_time === 0) {
            button.song.end_time_type = null;
            button.song.end_time = null;
            button.song.end_time_unit = null;
        }

        (window as any).electron.saveButton(activeProfile.id, button);
        (window as any).electron.close(winId);
    };

    if (button === undefined) {
        return <Window/>
    } else {
        return (
            <Window titlebar={<span className={"subtitle"}>Button {button?.row}.{button?.col}</span>}>
                <div className={"row"}>
                    <label>File or Url</label>
                    <InputField value={button.song?.original_url} placeholder={"File or Url"} readOnly={true} onChange={handleUriChange}/>
                    <Button icon={"edit"} className={'primary'} onClick={openMediaSelectorWin}>Edit</Button>
                </div>
                <Separator/>
                <div className={"row"}>
                    <label>Title</label>
                    <InputField value={button?.title} placeholder={"Title"} onChange={handleTitleChange}/>
                </div>
                <div className={"row"}>
                    <label>Track starts after</label>
                    <InputField
                        className={"number"}
                        value={button.song?.start_time ? button.song.start_time : 0}
                        type={"number"}
                        min={0}
                        max={button.song?.duration ? button.song.duration : undefined}
                        disabled={!button.song}
                        onChange={handleStartTimeChange}
                    />
                    <Select
                        options={[
                            {value: 's', label: 'Seconds', selected: button.song?.start_time_unit === 's'},
                            {value: 'ms', label: 'Milliseconds', selected: button.song?.start_time_unit === 'ms'},
                            {value: 'm', label: 'Minutes', selected: button.song?.start_time_unit === 'm'}
                        ]}
                        disabled={!button.song}
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
                        disabled={!button.song}
                        onChange={handleEndTimeTypeChange}
                    />
                    <InputField
                        className={"number"}
                        value={button.song?.end_time ? button.song.end_time : 0}
                        type={"number"}
                        min={0}
                        max={button.song?.duration ? button.song.duration : undefined}
                        disabled={!button.song}
                        onChange={handleEndTimeChange}
                    />
                    <Select
                        options={[
                            {value: 's', label: 'Seconds', selected: button.song?.start_time_unit === 's'},
                            {value: 'ms', label: 'Milliseconds', selected: button.song?.start_time_unit === 'ms'},
                            {value: 'm', label: 'Minutes', selected: button.song?.start_time_unit === 'm'}
                        ]}
                        disabled={!button.song}
                        onChange={handleEndTimeUnitChange}
                    />
                </div>
                <Separator/>
                <div className={"row col-container"}>
                    <div className={"col"}>
                        <ColorSetting
                            label={"Background color"}
                            color={button.style?.background_color}
                            onChange={handleBackgroundColorChange}
                        />
                        <ColorSetting
                            label={"Background hover color"}
                            color={button.style?.background_color_hover}
                            onChange={handleBackgroundColorHoverChange}
                        />
                        <ColorSetting
                            label={"Text color"}
                            color={button.style?.text_color}
                            onChange={handleTextColorChange}
                        />
                        <ColorSetting
                            label={"Text hover color"}
                            color={button.style?.text_color_hover}
                            onChange={handleTextColorHoverChange}
                        />
                        <ColorSetting
                            label={"Border color"}
                            color={button.style?.border_color}
                            onChange={handleBorderColorChange}
                        />
                        <ColorSetting
                            label={"Border hover color"}
                            color={button.style?.border_color_hover}
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
                    <Button icon={"save"} className={"success"} onClick={saveButton} disabled={!button.song}>Save</Button>
                </div>
            </Window>
        );
    }
};

export default ButtonSettingsWin;