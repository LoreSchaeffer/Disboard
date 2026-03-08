import styles from './GridBtnSettingsWin.module.css';
import React, {useEffect, useMemo, useState} from "react";
import {useWindow} from "../context/WindowContext";
import Spinner from "../components/misc/Spinner";
import {useTitlebar} from "../context/TitlebarContext";
import Input from "../components/forms/Input";
import {PiArrowCounterClockwiseBold, PiFloppyDiskBold, PiPlayFill, PiStopFill, PiXBold} from "react-icons/pi";
import Button from "../components/misc/Button";
import SoundboardButton from "../components/soundboard/grid/GridButton";
import Separator from "../components/misc/Separator";
import Select from "../components/forms/Select";
import Row from "../components/layout/Row";
import Col from "../components/layout/Col";
import {clsx} from "clsx";
import Toggle from "../components/forms/Toggle";
import {hexToHsl, hslToHex} from "../utils/utils";
import {Time} from "../utils/time";
import {usePlayer} from "../context/PlayerContext";
import ResettableColorPicker from "../components/forms/color_picker/ResettableColorPicker";
import {BoardType, BtnStyle, CropOptions, DeepPartial, EndTimeType, GridBtn, GridBtnWinData, PlayerTrack, SbGridBtn, SbGridProfile, TimeUnit} from "../../types";
import {validateName} from "../../shared/validation";
import {useProfiles} from "../context/ProfilesProvider";

const timeUnitOptions: { value: TimeUnit, label: string }[] = [
    {value: 's', label: 'Seconds'},
    {value: 'ms', label: 'Milliseconds'},
    {value: 'm', label: 'Minutes'}
]

const timeEndTypeOptions: { value: EndTimeType, label: string }[] = [
    {value: 'after', label: 'After'},
    {value: 'at', label: 'At'}
]

const GridBtnSettingsWin = () => {
    const {data} = useWindow();
    const {boardType, gridProfiles} = useProfiles();
    const {previewPlayer, previewStatus} = usePlayer();
    const {setTitlebarContent} = useTitlebar();

    const [profile, setProfile] = useState<SbGridProfile | undefined>(undefined);
    const [button, setButton] = useState<SbGridBtn | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [newButton, setNewButton] = useState<DeepPartial<SbGridBtn>>({});

    useEffect(() => {
        if (!data || data.type !== 'grid_btn_settings') return;

        const {profileId, buttonId} = data.data as GridBtnWinData;

        if (!profileId || !buttonId) {
            setError('Profile id and Button id are mandatory!');
            setLoading(false);
            return;
        }

        setLoading(true);

        const prof = gridProfiles.find(p => p.id === profileId);
        if (!prof) {
            setError(`Profile ${profileId} not found!`);
            setLoading(false);
            return;
        }

        const btn = prof.buttons.find(b => b.id === buttonId);
        if (!btn) {
            setError(`Button ${buttonId} not found!`);
            setLoading(false);
            return;
        }

        setProfile(prof);
        setButton(btn);
        setNewButton({});
        setLoading(false);
    }, [data, gridProfiles]);

    useEffect(() => {
        if (!profile || !button) return;

        setTitlebarContent(
            <div className={styles.tbData}>
                <span className={styles.tbProfile}>{profile.name}</span>
                <span className={styles.tbButton}>{button.row} - {button.col}</span>
            </div>,
            'centered'
        );

        return () => setTitlebarContent(null);
    }, [profile, button]);

    const previewBtnData: SbGridBtn | null = useMemo(() => {
        if (!button) return null;

        const mergedStyle = {...(button.style || {}), ...(newButton.style || {})};
        const mergedCrop = {...(button.cropOptions || {}), ...(newButton.cropOptions || {})};

        const preview: SbGridBtn = {
            ...button,
            ...newButton,
            style: Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined,
            cropOptions: Object.keys(mergedCrop).length > 0 ? mergedCrop : undefined,
            track: undefined
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

    if (error || !profile || !button || !button.track) {
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

    const getValue = <K extends keyof SbGridBtn>(field: K): SbGridBtn[K] | undefined => {
        const newVal = newButton[field];
        return (newVal !== undefined ? newVal : button?.[field]) as SbGridBtn[K] | undefined;
    }

    const getCropValue = (field: keyof CropOptions): unknown => {
        const newVal = newButton.cropOptions?.[field];
        return newVal !== undefined ? newVal : button.cropOptions?.[field];
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
            const updated = {...prev};
            delete updated.title;
            return updated;
        });
    }

    const handleStartTimeChange = (inputValue: string) => {
        if (!button) return;

        const numericVal = Number(inputValue);

        if (inputValue === '' || numericVal === 0) {
            setNewButton(prev => {
                const currentCrop = prev.cropOptions || {};
                const newCropOptions = {...currentCrop};

                newCropOptions.startTime = null;
                newCropOptions.startTimeUnit = null;

                if (button.cropOptions?.startTime === undefined) {
                    delete newCropOptions.startTime;
                    delete newCropOptions.startTimeUnit;
                }

                const updatedBtn = {...prev};
                const hasKeys = Object.values(newCropOptions).some(v => v !== undefined);

                if (!hasKeys) delete updatedBtn.cropOptions;
                else updatedBtn.cropOptions = newCropOptions;

                return updatedBtn;
            });
            return;
        }

        if (isNaN(numericVal)) return;

        let value = numericVal;

        const track = newButton.track || button.track;
        if (track) {
            const startTime = new Time(value, getTimeUnit('startTimeUnit'));
            const trackDuration = new Time(track.duration, 'ms');
            if (startTime.isGraterThan(trackDuration)) {
                value = Math.floor(trackDuration.getTime(getTimeUnit('startTimeUnit')));
            }
        }

        if (getCropValue('endTime') !== undefined) {
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

        if (value <= 0) {
            handleStartTimeChange('');
            return;
        }

        setNewButton(prev => {
            const currentCrop = prev.cropOptions || {};
            const newCropOptions = {...currentCrop};

            if (value === button.cropOptions?.startTime) delete newCropOptions.startTime;
            else newCropOptions.startTime = value;

            if (!newCropOptions.startTimeUnit && !button.cropOptions?.startTimeUnit) newCropOptions.startTimeUnit = 's';

            const updatedBtn = {...prev};
            if (Object.keys(newCropOptions).length === 0) delete updatedBtn.cropOptions;
            else updatedBtn.cropOptions = newCropOptions;

            return updatedBtn;
        });
    }

    const handleEndTimeChange = (inputValue: string) => {
        if (!button) return;

        const numericVal = Number(inputValue);

        if (inputValue === '' || numericVal === 0) {
            setNewButton(prev => {
                const currentCrop = prev.cropOptions || {};
                const newCropOptions = {...currentCrop};

                newCropOptions.endTime = null;
                newCropOptions.endTimeUnit = null;
                newCropOptions.endTimeType = null;

                if (button.cropOptions?.endTime === undefined) {
                    delete newCropOptions.endTime;
                    delete newCropOptions.endTimeUnit;
                    delete newCropOptions.endTimeType;
                }

                const updatedBtn = {...prev};
                const hasKeys = Object.values(newCropOptions).some(v => v !== undefined);

                if (!hasKeys) delete updatedBtn.cropOptions;
                else updatedBtn.cropOptions = newCropOptions;

                return updatedBtn;
            });
            return;
        }

        if (isNaN(numericVal)) return;

        let value = numericVal;

        const track = newButton.track || button.track;
        if (track) {
            const endTime = new Time(value, getTimeUnit('endTimeUnit'));
            const trackDuration = new Time(track.duration, 'ms');
            const endTimeType = getCropValue('endTimeType') || 'after';
            const startVal = getCropValue('startTime') as number;
            const startTime = startVal !== undefined ? new Time(startVal, getTimeUnit('startTimeUnit')) : undefined;

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

        if (value <= 0) {
            handleEndTimeChange('');
            return;
        }

        setNewButton(prev => {
            const currentCrop = prev.cropOptions || {};
            const newCropOptions = {...currentCrop};

            if (value === button.cropOptions?.endTime) delete newCropOptions.endTime;
            else newCropOptions.endTime = value;

            if (!newCropOptions.endTimeUnit && !button.cropOptions?.endTimeUnit) newCropOptions.endTimeUnit = 's';
            if (!newCropOptions.endTimeType && !button.cropOptions?.endTimeType) newCropOptions.endTimeType = 'after';

            const updatedBtn = {...prev};
            if (Object.keys(newCropOptions).length === 0) delete updatedBtn.cropOptions;
            else updatedBtn.cropOptions = newCropOptions;

            return updatedBtn;
        });
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


    const isModified = (field: keyof SbGridBtn) => field in newButton;

    const isCropModified = (field: keyof CropOptions) => newButton.cropOptions && field in newButton.cropOptions;

    const canSubmit = () => {
        return button && profile;
    }


    const handleSubmit = () => {
        if (!canSubmit() || !profile || !button || !boardType) return;

        const payload: DeepPartial<SbGridBtn> = structuredClone(newButton);
        if (payload.track) delete payload.track;

        if (payload.cropOptions) {
            if (payload.cropOptions.startTime === null) payload.cropOptions.startTimeUnit = null;
            if (payload.cropOptions.endTime === null) {
                payload.cropOptions.endTimeUnit = null;
                payload.cropOptions.endTimeType = null;
            }
        }

        if (Object.keys(payload).length === 0) {
            window.electron.window.close();
            return;
        }

        window.electron.gridProfiles.buttons.update(boardType as Exclude<BoardType, 'ambient'>, profile.id, button.id, payload as GridBtn).then((res) => {
            if (res.success) window.electron.window.close();
            else console.error("[Settings] Error updating button:", res.error);
        });
    }

    const playPausePreview = () => {
        if (previewStatus.playing) {
            previewPlayer.stop();
        } else {
            if (!button) return;

            const playerTrack: PlayerTrack = {
                ...button.track,
                cropOptions: {
                    ...button?.cropOptions,
                    ...newButton?.cropOptions
                }
            }

            previewPlayer.playNow(playerTrack);
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
                            value={getCropValue('startTime') as number || ''}
                            onChange={(e) => handleStartTimeChange(e.target.value)}
                            min={0}
                            icon={<PiArrowCounterClockwiseBold/>}
                            iconSettings={{
                                onClick: () => handleStartTimeChange(button.cropOptions?.startTime?.toString() || ''),
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
                            value={getCropValue('endTime') as number || ''}
                            onChange={(e) => handleEndTimeChange(e.target.value)}
                            min={0}
                            icon={<PiArrowCounterClockwiseBold/>}
                            iconSettings={{
                                onClick: () => handleEndTimeChange(button.cropOptions?.endTime?.toString() || ''),
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
                    onClick={() => window.electron.window.close()}
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

export default GridBtnSettingsWin;