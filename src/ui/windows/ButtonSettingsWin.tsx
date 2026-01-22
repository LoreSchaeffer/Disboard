import styles from './ButtonSettingsWin.module.css';
import React, {useEffect, useMemo, useState} from "react";
import {BtnStyle, CropOptions, EndTimeType, SbBtn, SbProfile, TimeUnit} from "../../types/data";
import {useWindow} from "../context/WindowContext";
import {ButtonWindowData} from "../../types/window";
import Spinner from "../components/misc/Spinner";
import {useTitlebar} from "../context/TitlebarContext";
import Input from "../components/forms/Input";
import {PiArrowCounterClockwiseBold, PiFloppyDiskBold, PiPlayFill, PiStopFill, PiXBold} from "react-icons/pi";
import Button from "../components/misc/Button";
import SoundboardButton from "../components/soundboard/SoundboardButton";
import Separator from "../components/misc/Separator";
import Select from "../components/forms/Select";
import Row from "../components/layout/Row";
import Col from "../components/layout/Col";
import {clsx} from "clsx";
import Toggle from "../components/forms/Toggle";
import {generateButtonId, hexToHsl, hslToHex} from "../utils/utils";
import {Time} from "../utils/time";
import {usePlayer} from "../context/PlayerContext";
import {validateName} from "../../main/utils/validation";
import ResettableColorPicker from "../components/forms/color_picker/ResettableColorPicker";

const timeUnitOptions: { value: TimeUnit, label: string }[] = [
    {value: 's', label: 'Seconds'},
    {value: 'ms', label: 'Milliseconds'},
    {value: 'm', label: 'Minutes'}
]

const timeEndTypeOptions: { value: EndTimeType, label: string }[] = [
    {value: 'after', label: 'After'},
    {value: 'at', label: 'At'}
]

const ButtonSettingsWin = () => {
    const {data} = useWindow();
    const {previewPlayer, previewStatus} = usePlayer();
    const {setTitlebarContent} = useTitlebar();

    const [profile, setProfile] = useState<SbProfile | undefined>(undefined);
    const [button, setButton] = useState<SbBtn | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [newButton, setNewButton] = useState<Partial<SbBtn>>({});

    useEffect(() => {
        if (!data || data.type !== 'button') return;

        const {profileId, buttonId} = data.data as ButtonWindowData;

        if (!profileId || !buttonId) {
            setError('Profile id of Button id missing.');
            setLoading(false);
            return;
        }

        setLoading(true);

        Promise.all([
            window.electron.getProfile(profileId),
            window.electron.getButton(profileId, buttonId)
        ]).then(([fetchedProfile, fetchedButton]) => {
            if (!fetchedProfile) throw new Error("Profile not found");
            if (!fetchedButton) throw new Error("Button not found");

            setProfile(fetchedProfile);
            setButton(fetchedButton);

            setNewButton({});

            setTitlebarContent(
                <div className={styles.tbData}>
                    <span className={styles.tbProfile}>{fetchedProfile.name}</span>
                    <span className={styles.tbButton}>{fetchedButton.row} - {fetchedButton.col}</span>
                </div>,
                'centered'
            );
        }).catch((err) => {
            console.error(err);
            setError(err.message || "An error occurred while fetching data.");
        }).finally(() => {
            setLoading(false);
        });
    }, [data]);


    // TODO To remove after tests (This is used only for debugging purposes)
    useEffect(() => {
        if (!newButton || loading) return;
        console.log(JSON.stringify(newButton));
    }, [newButton]);

    const previewBtnData: SbBtn | null = useMemo(() => {
        console.log('Calculating preview button data');

        if (!button) return null;

        const mergedStyle = {...(button.style || {}), ...(newButton.style || {})};
        const mergedCrop = {...(button.cropOptions || {}), ...(newButton.cropOptions || {})};

        const preview: SbBtn = {
            ...button,
            ...newButton,
            style: Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined,
            cropOptions: Object.keys(mergedCrop).length > 0 ? mergedCrop : undefined,
        };

        if (newButton.title === null) preview.title = button.track.title;

        return preview;
    }, [button, newButton]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
            }}>
                <Spinner size={'lg'}/>
            </div>
        );
    }

    if (error || !profile || !button) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
            }}>
                <span className={styles.errorMessage}>{error || "Unknown error"}</span>
            </div>
        );
    }

    const getValue = <K extends keyof SbBtn>(field: K): SbBtn[K] | undefined => {
        const newVal = newButton[field];
        return (newVal !== undefined ? newVal : button?.[field]) as SbBtn[K] | undefined;
    }

    const getCropValue = (field: keyof CropOptions): unknown => {
        return newButton.cropOptions?.[field] ?? button.cropOptions?.[field];
    }

    const getTimeUnit = (unitField: 'startTimeUnit' | 'endTimeUnit'): TimeUnit => {
        return (getCropValue(unitField) as TimeUnit) || 's';
    }

    const getUpdatedTimeValue = (currentValue: number | undefined, currentUnit: TimeUnit, newUnit: TimeUnit): number | undefined => {
        if (currentValue === undefined) return undefined;
        if (currentUnit === newUnit) return currentValue;
        return Math.floor(new Time(currentValue, currentUnit).getTime(newUnit));
    }


    const handleTitleChange = (value: string) => {
        if (!button) return;
        if (value.length > 0 && !validateName(value, true)) return;

        if (value.trim() === '') value = null;

        setNewButton(prev => {
            if (value === button.title) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const {title, ...rest} = prev;
                return rest;
            }
            return {...prev, title: value as string};
        });
    }

    const handleTitleReset = () => {
        setNewButton(prev => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {title, ...rest} = prev;
            return rest;
        });
    }


    const handleStartTimeChange = (value: number | undefined) => {
        if (!button) return;

        if (value !== undefined && value < 0) value = 0;
        if (value === 0) value = undefined;

        const track = newButton.track || button.track;
        if (track && value !== undefined) {
            const startTime = new Time(value, getTimeUnit('startTimeUnit'));
            const trackDuration = new Time(track.duration, 'ms');

            if (startTime.isGraterThan(trackDuration)) value = Math.floor(trackDuration.getTime(getTimeUnit('startTimeUnit')));
        }

        if (value !== undefined && getCropValue('endTime') !== undefined) {
            const endTimeType = getCropValue('endTimeType') || 'after';

            const startUnit = getTimeUnit('startTimeUnit');
            const endUnit = getTimeUnit('endTimeUnit');

            const startTime = new Time(value, startUnit);
            const endTime = new Time(getCropValue('endTime') as number, endUnit);

            if (endTimeType === 'at') {
                if (!startTime.isLessThan(endTime)) value = Math.floor(endTime.getTime(startUnit)) - 1;
            } else if (endTimeType === 'after') {
                if (track) {
                    const trackDuration = new Time(track.duration, 'ms');
                    startTime.add(endTime);

                    if (startTime.isGraterThan(trackDuration)) {
                        const clampedDuration = trackDuration.copy().subtract(endTime);
                        value = Math.floor(clampedDuration.getTime(startUnit));
                    }
                }
            }
        }

        if (value === button.cropOptions?.startTime) {
            setNewButton(prev => {
                const updated = {...prev};
                if (updated.cropOptions) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const {startTime, ...restCrop} = updated.cropOptions;
                    if (Object.keys(restCrop).length === 0) delete updated.cropOptions;
                    else updated.cropOptions = restCrop;
                }
                return updated;
            });
        } else {
            setNewButton(prev => {
                const currentCrop = prev.cropOptions || {};
                if (!currentCrop.startTimeUnit && !button?.cropOptions?.startTimeUnit) currentCrop.startTimeUnit = 's';

                return {
                    ...prev,
                    cropOptions: {
                        ...currentCrop,
                        startTime: value || null
                    }
                };
            });
        }
    }

    const handleEndTimeChange = (value: number | undefined) => {
        if (!button) return;

        if (value !== undefined && value < 0) value = 0;
        if (value === 0) value = undefined;

        const track = newButton.track || button.track;
        if (track && value !== undefined) {
            const endTime = new Time(value, getTimeUnit('endTimeUnit'));
            const trackDuration = new Time(track.duration, 'ms');

            const endTimeType = getCropValue('endTimeType') || 'after';
            const startVal = getCropValue('startTime') as number;
            const startTime = startVal ? new Time(startVal, getTimeUnit('startTimeUnit')) : undefined;

            if (endTimeType === 'at') {
                if (endTime.isGraterThan(trackDuration)) value = Math.floor(trackDuration.getTime(getTimeUnit('endTimeUnit')));
                if (startTime && !startTime.isLessThan(endTime)) value = Math.floor(startTime.getTime(getTimeUnit('endTimeUnit'))) + 1;
            } else if (endTimeType === 'after') {
                if (startTime) {
                    const tempStartTime = startTime.copy().add(endTime);
                    if (tempStartTime.isGraterThan(trackDuration)) {
                        const clampedDuration = trackDuration.copy().subtract(startTime);
                        value = Math.floor(clampedDuration.getTime(getTimeUnit('endTimeUnit')));
                    }
                } else {
                    if (endTime.isGraterThan(trackDuration)) value = Math.floor(trackDuration.getTime(getTimeUnit('endTimeUnit')));
                }
            }
        }

        if (value === button.cropOptions?.endTime) {
            setNewButton(prev => {
                const updated = {...prev};
                if (updated.cropOptions) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const {endTime, ...restCrop} = updated.cropOptions;
                    if (Object.keys(restCrop).length === 0) delete updated.cropOptions;
                    else updated.cropOptions = restCrop;
                }
                return updated;
            });
        } else {
            setNewButton(prev => {
                const currentCrop = prev.cropOptions || {};
                if (!currentCrop.endTimeUnit && !button?.cropOptions?.endTimeUnit) currentCrop.endTimeUnit = 's';
                return {
                    ...prev,
                    cropOptions: {
                        ...currentCrop,
                        endTime: value || null
                    }
                };
            });
        }
    }

    const handleStartTimeUnitChange = (value: TimeUnit) => {
        if (!button) return;

        const startTime = getCropValue('startTime') as number | undefined;
        if (startTime !== undefined) {
            const updatedStartTime = getUpdatedTimeValue(startTime, getTimeUnit('startTimeUnit'), value);

            setNewButton(prev => {
                const currentCrop = prev.cropOptions || {};
                return {
                    ...prev,
                    cropOptions: {
                        ...currentCrop,
                        startTime: updatedStartTime,
                        startTimeUnit: value
                    }
                };
            });
        } else {
            setNewButton(prev => {
                const currentCrop = prev.cropOptions || {};
                return {
                    ...prev,
                    cropOptions: {
                        ...currentCrop,
                        startTimeUnit: value
                    }
                };
            });
        }
    }

    const handleEndTimeUnitChange = (value: TimeUnit) => {
        if (!button) return;

        const endTime = getCropValue('endTime') as number | undefined;
        if (endTime !== undefined) {
            const updatedEndTime = getUpdatedTimeValue(endTime, getTimeUnit('endTimeUnit'), value);
            setNewButton(prev => {
                const currentCrop = prev.cropOptions || {};
                return {
                    ...prev,
                    cropOptions: {
                        ...currentCrop,
                        endTime: updatedEndTime,
                        endTimeUnit: value
                    }
                };
            });
        } else {
            setNewButton(prev => {
                const currentCrop = prev.cropOptions || {};
                return {
                    ...prev,
                    cropOptions: {
                        ...currentCrop,
                        endTimeUnit: value
                    }
                };
            });
        }
    }

    const handleEndTimeTypeChange = (newType: EndTimeType) => {
        if (!button) return;

        const currentType = getCropValue('endTimeType') as EndTimeType || 'after';
        if (currentType === newType) return;

        const startTimeVal = getCropValue('startTime') as number || 0;
        const startUnit = getTimeUnit('startTimeUnit');
        const endTimeVal = getCropValue('endTime') as number;
        const endUnit = getTimeUnit('endTimeUnit');

        let newEndTimeVal = endTimeVal;

        if (endTimeVal !== undefined) {
            const startMs = new Time(startTimeVal, startUnit).convertToMs();
            const endMs = new Time(endTimeVal, endUnit).convertToMs();

            if (newType === 'at') newEndTimeVal = Math.floor(startMs.add(endMs).getTime(endUnit));
            else newEndTimeVal = Math.floor(endMs.subtract(startMs).getTime(endUnit));
        }

        setNewButton(prev => {
            const currentCrop = prev.cropOptions || {};
            const updatedCrop = {
                ...currentCrop,
                endTimeType: newType,
                endTime: newEndTimeVal
            };

            if (newType === (button?.cropOptions?.endTimeType || 'after')) delete updatedCrop.endTimeType;
            if (newEndTimeVal === button?.cropOptions?.endTime) delete updatedCrop.endTime;

            const updatedBtn = {...prev};

            if (Object.keys(updatedCrop).length === 0) delete updatedBtn.cropOptions;
            else updatedBtn.cropOptions = updatedCrop;

            return updatedBtn;
        });
    }


    const handleStyleChange = (field: keyof BtnStyle, value: string | null) => {
        if (!button) return;

        const originalValue = button.style?.[field];

        setNewButton(prev => {
            const updatedStyle = {...(prev.style || {})};

            if (value === originalValue || (value === null && originalValue === undefined)) {
                delete updatedStyle[field];
            } else {
                // @ts-expect-error Assignment of null values to remove styles
                updatedStyle[field] = value;
            }

            const updatedButton = {...prev};
            if (Object.keys(updatedStyle).length === 0) delete updatedButton.style;
            else updatedButton.style = updatedStyle;

            return updatedButton;
        });
    }

    const handleStyleReset = (field: keyof BtnStyle) => {
        setNewButton(prev => {
            if (!prev.style) return prev;
            const updatedStyle = {...prev.style};

            delete updatedStyle[field];

            const updatedButton = {...prev};
            if (Object.keys(updatedStyle).length === 0) delete updatedButton.style;
            else updatedButton.style = updatedStyle;
            return updatedButton;
        });
    }


    const isModified = (field: keyof SbBtn) => field in newButton;

    const isCropModified = (field: keyof CropOptions) => newButton.cropOptions && field in newButton.cropOptions;

    const canSubmit = () => {
        return button && profile;
    }


    const handleSubmit = () => {
        if (!canSubmit()) return;

        const newButtonCopy = {...newButton};

        if (newButtonCopy.cropOptions) {
            const cropOptions = newButtonCopy.cropOptions;

            if (cropOptions.startTimeUnit && !cropOptions.startTime) delete cropOptions.startTimeUnit;
            if (cropOptions.endTimeUnit && !cropOptions.endTime) delete cropOptions.endTimeUnit;
            if (cropOptions.endTimeType && !cropOptions.endTime) delete cropOptions.endTimeType;

            if (Object.keys(cropOptions).length === 0) delete newButtonCopy.cropOptions;
            else newButtonCopy.cropOptions = cropOptions;
        }

        if (Object.keys(newButtonCopy).length === 0) {
            window.electron.close();
        } else if (profile && button) {
            window.electron.updateButton(profile.id, generateButtonId(button.row, button.col), newButtonCopy).then((res) => {
                if (res.success) window.electron.close();
                else console.error(res.error);
            });
        }
    }

    const playPausePreview = () => {
        if (previewStatus.playing) {
            previewPlayer.stop();
        } else {
            if (!button) return;
            previewPlayer.playNow(button.track);
        }
    }

    return (
        <div className={'bordered'}>
            <section id='basicSettings'>
                <Row>
                    <Col size={2}>
                        <label className={styles.label}>Title</label>
                    </Col>
                    <Col>
                        <Input
                            type={'text'}
                            value={getValue('title') ?? ''}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            icon={<PiArrowCounterClockwiseBold/>}
                            iconSettings={{
                                onClick: () => handleTitleReset(),
                                customStyles: {
                                    opacity: isModified('title') ? 1 : 0.5,
                                    cursor: isModified('title') ? 'pointer' : 'default'
                                }
                            }}
                            placeholder={"Title"}
                        />
                    </Col>
                </Row>
                <Separator/>
            </section>

            <section id='cropSettings'>
                <Row className={styles.space}>
                    <Col size={4}>
                        <label className={styles.label}>Track starts after</label>
                    </Col>
                    <Col size={3}>
                        <Input
                            type={'number'}
                            placeholder={'Time'}
                            value={getCropValue('startTime') as number ?? ''}
                            onChange={(e) => handleStartTimeChange(e.target.value === '' ? undefined : Number(e.target.value))}
                            min={0}
                            icon={<PiArrowCounterClockwiseBold/>}
                            iconSettings={{
                                onClick: () => handleStartTimeChange(button.cropOptions?.startTime),
                                customStyles: {
                                    opacity: isCropModified('startTime') ? 1 : 0.5,
                                    cursor: isCropModified('startTime') ? 'pointer' : 'default',
                                    pointerEvents: isCropModified('startTime') ? 'auto' : 'none'
                                }
                            }}
                        />
                    </Col>
                    <Col>
                        <Select
                            options={timeUnitOptions}
                            value={getTimeUnit('startTimeUnit') || 's'}
                            onChange={(val) => handleStartTimeUnitChange(val as TimeUnit)}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col size={2}>
                        <label className={styles.label}>Track ends</label>
                    </Col>
                    <Col size={3}>
                        <Select
                            options={timeEndTypeOptions}
                            value={getCropValue('endTimeType') as EndTimeType || 'after'}
                            onChange={(val) => handleEndTimeTypeChange(val as EndTimeType)}
                        />
                    </Col>
                    <Col size={3}>
                        <Input
                            type={'number'}
                            placeholder={'Time'}
                            value={getCropValue('endTime') as number ?? ''}
                            onChange={(e) => handleEndTimeChange(e.target.value === '' ? undefined : Number(e.target.value))}
                            min={0}
                            icon={<PiArrowCounterClockwiseBold/>}
                            iconSettings={{
                                onClick: () => handleEndTimeChange(button.cropOptions?.endTime),
                                customStyles: {
                                    opacity: isCropModified('endTime') ? 1 : 0.5,
                                    cursor: isCropModified('endTime') ? 'pointer' : 'default',
                                    pointerEvents: isCropModified('endTime') ? 'auto' : 'none'
                                }
                            }}
                        />
                    </Col>
                    <Col>
                        <Select
                            options={timeUnitOptions}
                            value={getTimeUnit('endTimeUnit')}
                            onChange={(val) => handleEndTimeUnitChange(val as TimeUnit)}
                        />
                    </Col>
                </Row>
                <Separator/>
            </section>

            <section id='styleSettings'>
                <label className={clsx(styles.label, styles.space)}>Customize button aspect:</label>

                <div className={styles.colorGrid}>
                    <label className={styles.label}></label>
                    <label className={styles.label}>Default</label>
                    <label className={styles.label}>Hover</label>
                    <label className={styles.label}>Active</label>
                    <label className={styles.label}>Auto</label>
                </div>

                <ColorPickerRow
                    label={'Text'}
                    propPrefix={'textColor'}
                    currentStyle={newButton.style}
                    originalStyle={button.style}
                    onChange={handleStyleChange}
                    onReset={handleStyleReset}
                />
                <ColorPickerRow
                    label={'Background'}
                    propPrefix={'backgroundColor'}
                    currentStyle={newButton.style}
                    originalStyle={button.style}
                    onChange={handleStyleChange}
                    onReset={handleStyleReset}
                />
                <ColorPickerRow
                    label={'Border'}
                    propPrefix={'borderColor'}
                    currentStyle={newButton.style}
                    originalStyle={button.style}
                    onChange={handleStyleChange}
                    onReset={handleStyleReset}
                />
            </section>

            <div className={styles.btnPreviewContainer}>
                <div className={styles.btnPreviewWrapper}>
                    <span className={styles.previewLabel}>Preview</span>
                    {previewBtnData && (
                        <SoundboardButton
                            row={previewBtnData.row || 0}
                            col={previewBtnData.col || 0}
                            button={previewBtnData}
                            className={styles.btnPreview}
                        />
                    )}
                </div>
            </div>

            <div className={'windowButtons'}>
                <Button
                    className={styles.previewBtn}
                    variant={'primary'}
                    icon={previewStatus.playing ? <PiStopFill/> : <PiPlayFill/>}
                    onClick={playPausePreview}
                >
                    {previewStatus.playing ? 'Stop' : 'Preview'}
                </Button>
                <Button
                    variant={'danger'}
                    icon={<PiXBold/>}
                    onClick={() => window.electron.close()}
                >
                    Discard
                </Button>
                <Button
                    variant={'success'}
                    icon={<PiFloppyDiskBold/>}
                    onClick={handleSubmit}
                    disabled={!canSubmit()}
                >
                    Save
                </Button>
            </div>
        </div>
    )
};


type ColorPickerRowProps = {
    label: string;
    propPrefix: 'textColor' | 'backgroundColor' | 'borderColor';
    currentStyle?: BtnStyle;
    originalStyle?: BtnStyle;
    onChange: (field: keyof BtnStyle, value: string | null) => void;
    onReset: (field: keyof BtnStyle) => void;
}

const ColorPickerRow = ({
                            label,
                            propPrefix,
                            currentStyle,
                            originalStyle,
                            onChange,
                            onReset
                        }: ColorPickerRowProps) => {
    const [autoMode, setAutoMode] = useState<boolean>(false);

    const defaultKey = propPrefix as keyof BtnStyle;
    const hoverKey = `${propPrefix}Hover` as keyof BtnStyle;
    const activeKey = `${propPrefix}Active` as keyof BtnStyle;

    const getEffectiveValue = (key: keyof BtnStyle): string | null => (currentStyle?.[key] ?? originalStyle?.[key] ?? null) as string | null;

    const getHoverColor = (color: string | null) => {
        if (!color) return null;

        const hsl = hexToHsl(color);
        if (!hsl) return color;

        hsl.l = Math.min(100, hsl.l + 15);
        return hslToHex(hsl);
    }

    const getActiveColor = (color: string | null) => {
        if (!color) return null;

        const hsl = hexToHsl(color);
        if (!hsl) return color;

        hsl.l = Math.max(0, hsl.l - 15);
        return hslToHex(hsl);
    }

    const handleDefaultChange = (value: string | null) => {
        onChange(defaultKey, value);

        if (autoMode) {
            if (value) {
                onChange(hoverKey, getHoverColor(value));
                onChange(activeKey, getActiveColor(value));
            } else {
                onChange(hoverKey, null);
                onChange(activeKey, null);
            }
        }
    }

    const handleAutoToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setAutoMode(isChecked);

        if (isChecked) {
            const currentColor = getEffectiveValue(defaultKey);

            const newHover = getHoverColor(currentColor);
            const newActive = getActiveColor(currentColor);

            onChange(hoverKey, newHover);
            onChange(activeKey, newActive);
        }
    };

    return (
        <div className={styles.colorGrid}>
            <span className={styles.label}>{label}</span>

            <ResettableColorPicker
                value={currentStyle?.[defaultKey] as string | null}
                originalValue={originalStyle?.[defaultKey] as string | null}
                onChange={handleDefaultChange}
                onReset={() => handleDefaultChange(originalStyle?.[defaultKey] as string | null)}
                onRemove={() => handleDefaultChange(null)}
            />

            <ResettableColorPicker
                value={currentStyle?.[hoverKey] as string | null}
                originalValue={originalStyle?.[hoverKey] as string | null}
                disabled={autoMode}
                onChange={(val) => onChange(hoverKey, val)}
                onReset={() => onReset(hoverKey)}
                onRemove={() => onChange(hoverKey, null)}
            />

            <ResettableColorPicker
                value={currentStyle?.[activeKey] as string | null}
                originalValue={originalStyle?.[activeKey] as string | null}
                disabled={autoMode}
                onChange={(val) => onChange(activeKey, val)}
                onReset={() => onReset(activeKey)}
                onRemove={() => onChange(activeKey, null)}
            />

            <Toggle
                checked={autoMode}
                onChange={handleAutoToggle}
            />
        </div>
    )
}

export default ButtonSettingsWin;