import styles from './ButtonSettingsWin.module.css';
import React, {useEffect, useState} from "react";
import {BtnStyle, CropOptions, Profile, SbBtn, TimeUnit} from "../../types/data";
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
import ColorPicker from "../components/forms/ColorPicker";
import {clsx} from "clsx";
import Toggle from "../components/forms/Toggle";
import {generateButtonId, hexToHsl, hslToHex} from "../utils/utils";
import {Time} from "../utils/time";
import {usePlayer} from "../context/PlayerContext";
import {validateName} from "../../main/utils/validation";

type Errors = {
    [key: string]: string;
}

const timeOptions = [
    {value: 's', label: 'Seconds'},
    {value: 'ms', label: 'Milliseconds'},
    {value: 'm', label: 'Minutes'}
]

const ButtonSettingsWin = () => {
    const {data} = useWindow();
    const {previewPlayer, previewStatus} = usePlayer();
    const {setTitlebarContent} = useTitlebar();
    const [profile, setProfile] = useState<Profile | undefined>(undefined);
    const [button, setButton] = useState<SbBtn | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [errors, setErrors] = useState<Errors>({});
    const [newButton, setNewButton] = useState<Partial<SbBtn>>({});

    useEffect(() => {
        if (!data || data.type !== 'button') return;

        const {profileId, buttonId} = data.data as ButtonWindowData;

        if (!profileId || !buttonId) {
            setError("Profile id of Button id missing.");
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
            setErrors({});

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

    const performValidation = (currentPartial: Partial<SbBtn>) => {
        const fullButton = {...button, ...currentPartial} as SbBtn;
        const err: Errors = {};

        if (!fullButton.title) err.title = 'Title is required';
        else if (!validateName(fullButton.title)) err.title = 'Title contains invalid characters';

        setErrors(err);
        return Object.keys(err).length === 0;
    }

    const handleFieldChange = (field: keyof SbBtn, value: unknown) => {
        if (!button) return;

        const originalValue = button[field];
        const isOriginal = value === originalValue;

        setNewButton(prev => {
            const updated = {...prev};
            if (isOriginal) {
                delete updated[field];
            } else {
                // @ts-expect-error Ignored
                updated[field] = value;
            }
            performValidation(updated);
            return updated;
        });
    };

    const handleReset = (field: keyof SbBtn) => {
        setNewButton(prev => {
            const updated = {...prev};
            delete updated[field];
            performValidation(updated);
            return updated;
        });
    };

    const handleCropChange = (field: keyof CropOptions, value: unknown) => {
        if (!button) return;

        const getEffectiveValue = <K extends keyof CropOptions>(key: K): CropOptions[K] => {
            return newButton.cropOptions?.[key] ?? button.cropOptions?.[key];
        };

        setNewButton(prev => {
            const currentCrop = prev.cropOptions || {};
            const updates: Partial<CropOptions> = {...currentCrop};

            const trackDurationMs = button.track.duration || Infinity;
            const maxTime = Time.fromMs(trackDurationMs);

            if (field === 'startTimeUnit' || field === 'endTimeUnit') {
                const valueField = field === 'startTimeUnit' ? 'startTime' : 'endTime';
                const oldUnit = getEffectiveValue(field) as TimeUnit || 's';
                const newUnit = value as TimeUnit;

                const currentNumericValue = getEffectiveValue(valueField) as number | undefined;

                if (currentNumericValue !== undefined && currentNumericValue !== null) {
                    try {
                        const timeObj = new Time(currentNumericValue, oldUnit);
                        timeObj.convertToUnit(newUnit);
                        updates[field] = newUnit;
                        updates[valueField] = timeObj.getTime(newUnit);
                    } catch (e) {
                        console.error("Time conversion error", e);
                    }
                } else {
                    updates[field] = newUnit;
                }
            } else if (field === 'startTime' || field === 'endTime') {
                const numericValue = value === '' ? 0 : Number(value);
                let finalValue: number | null = numericValue === 0 ? null : numericValue;

                if (finalValue !== null) {
                    const unitField = field === 'startTime' ? 'startTimeUnit' : 'endTimeUnit';
                    const currentUnit = getEffectiveValue(unitField) as TimeUnit || 's';

                    try {
                        const timeObj = new Time(finalValue, currentUnit);

                        if (timeObj.isGraterThan(maxTime)) {
                            const clampedTime = maxTime.copy().convertToUnit(currentUnit);
                            finalValue = clampedTime.getTime(null);
                            timeObj.setTime(finalValue);
                        }

                        const endTimeType = getEffectiveValue('endTimeType');

                        if (endTimeType === 'at') {
                            if (field === 'startTime') {
                                const endVal = getEffectiveValue('endTime') as number;
                                const endUnit = getEffectiveValue('endTimeUnit') as TimeUnit || 's';

                                if (endVal) {
                                    const endTimeObj = new Time(endVal, endUnit);
                                    if (!timeObj.isLessThan(endTimeObj)) {
                                        const clampedStart = endTimeObj.copy().convertToUnit(currentUnit);
                                        finalValue = clampedStart.getTime(null);
                                    }
                                }
                            } else {
                                const startVal = getEffectiveValue('startTime') as number;
                                const startUnit = getEffectiveValue('startTimeUnit') as TimeUnit || 's';

                                if (startVal) {
                                    const startTimeObj = new Time(startVal, startUnit);
                                    if (!timeObj.isGraterThan(startTimeObj)) {
                                        const clampedEnd = startTimeObj.copy().convertToUnit(currentUnit);
                                        finalValue = clampedEnd.getTime(null);
                                    }
                                }
                            }
                        }

                    } catch (e) {
                        console.error("Errore validazione tempo", e);
                    }
                }

                updates[field] = finalValue;
            } else {
                // @ts-expect-error Ignored
                updates[field] = value;
            }

            const finalCropOptions: Partial<CropOptions> = {};

            (Object.keys(updates) as Array<keyof CropOptions>).forEach(key => {
                const newVal = updates[key];
                const originalVal = button.cropOptions?.[key];

                const isOriginal = newVal === originalVal;

                if (field === 'startTime' || field === 'endTime') {
                    if (newVal === null && !originalVal) return;
                }

                if (!isOriginal) {
                    // @ts-expect-error Ignored
                    finalCropOptions[key] = newVal;
                }
            });

            const updatedButton = {...prev};

            if (Object.keys(finalCropOptions).length === 0) {
                delete updatedButton.cropOptions;
            } else {
                updatedButton.cropOptions = finalCropOptions;
            }

            return updatedButton;
        });
    }

    const handleStyleChange = (field: keyof BtnStyle, value: string | null) => {
        if (!button) return;

        const originalValue = button.style?.[field];
        const isOriginal = value === originalValue;

        setNewButton(prev => {
            const currentStyle = prev.style || {};
            const updatedStyle = {...currentStyle};

            if (isOriginal && value !== null) delete updatedStyle[field];

            else if (value === null) {
                if (originalValue) {
                    // @ts-expect-error Ignored
                    updatedStyle[field] = null;
                } else {
                    delete updatedStyle[field];
                }
            } else {
                // @ts-expect-error Ignored
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
            const currentStyle = prev.style || {};
            const updatedStyle = {...currentStyle};

            delete updatedStyle[field];

            const updatedButton = {...prev};
            if (Object.keys(updatedStyle).length === 0) {
                delete updatedButton.style;
            } else {
                updatedButton.style = updatedStyle;
            }
            return updatedButton;
        });
    }

    const isModified = (field: keyof SbBtn) => field in newButton;

    const isCropModified = (field: keyof CropOptions) => newButton.cropOptions && field in newButton.cropOptions;

    const canSubmit = () => {
        return button && profile && Object.keys(errors).length === 0 && Object.keys(newButton).length > 0;
    }

    const handleSubmit = () => {
        if (!canSubmit()) return;

        window.electron.updateButton(profile.id, generateButtonId(button.row, button.col), newButton).then((res) => {
            if (res.success) window.electron.close();
            else console.log(res.error);
        })
    }

    const playPausePreview = () => {
        if (previewStatus.playing) {
            previewPlayer.stop();
        } else {
            if (!button) return;
            previewPlayer.playNow(button.track);
        }
    }

    const previewButtonObj: SbBtn | undefined = button ? {
        ...button,
        ...newButton,
        cropOptions: {...button.cropOptions, ...newButton.cropOptions},
        style: {...button.style, ...newButton.style}
    } : undefined;

    return (
        <div className={'bordered'}>
            <Row>
                <Col size={3}>
                    <label className={styles.label}>Title</label>
                </Col>
                <Col>
                    <Input
                        type={'text'}
                        value={newButton.title ?? button.title ?? ''}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        icon={<PiArrowCounterClockwiseBold/>}
                        iconSettings={{
                            onClick: () => handleReset('title'),
                            customStyles: {
                                opacity: isModified('title') ? 1 : 0.5,
                                cursor: isModified('title') ? 'pointer' : 'default'
                            }
                        }}
                        placeholder={"Title"}
                        error={errors.title}
                    />
                </Col>
                <Col size={3}>
                    <Button
                        variant={'primary'}
                        icon={previewStatus.playing ? <PiStopFill/> : <PiPlayFill/>}
                        onClick={playPausePreview}
                    >
                        {previewStatus.playing ? 'Stop' : 'Preview'}
                    </Button>
                </Col>
            </Row>

            <Separator/>

            <Row className={styles.space}>
                <Col size={4}>
                    <label className={styles.label}>Track starts after</label>
                </Col>
                <Col size={3}>
                    <Input
                        type={'number'}
                        placeholder={'Time'}
                        value={newButton.cropOptions?.startTime ?? button.cropOptions?.startTime ?? ''}
                        onChange={(e) => handleCropChange('startTime', e.target.value === '' ? undefined : Number(e.target.value))}
                        min={0}
                        icon={<PiArrowCounterClockwiseBold/>}
                        iconSettings={{
                            onClick: () => handleCropChange('startTime', button.cropOptions?.startTime),
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
                        options={timeOptions}
                        value={newButton.cropOptions?.startTimeUnit ?? button.cropOptions?.startTimeUnit ?? 's'}
                        onChange={(val) => handleCropChange('startTimeUnit', val)}
                    />
                </Col>
            </Row>

            <Row>
                <Col size={2}>
                    <label className={styles.label}>Track ends</label>
                </Col>
                <Col size={3}>
                    <Select
                        options={[{value: 'after', label: 'After'}, {value: 'at', label: 'At'}]}
                        value={newButton.cropOptions?.endTimeType ?? button.cropOptions?.endTimeType ?? 'after'}
                        onChange={(val) => handleCropChange('endTimeType', val)}
                    />
                </Col>
                <Col size={3}>
                    <Input
                        type={'number'}
                        placeholder={'Time'}
                        value={newButton.cropOptions?.endTime ?? button.cropOptions?.endTime ?? ''}
                        onChange={(e) => handleCropChange('endTime', e.target.value === '' ? undefined : Number(e.target.value))}
                        min={0}
                        icon={<PiArrowCounterClockwiseBold/>}
                        iconSettings={{
                            onClick: () => handleCropChange('endTime', button.cropOptions?.endTime),
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
                        options={timeOptions}
                        value={newButton.cropOptions?.endTimeUnit ?? button.cropOptions?.endTimeUnit ?? 's'}
                        onChange={(val) => handleCropChange('endTimeUnit', val)}
                    />
                </Col>
            </Row>

            <Separator/>

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
                propPrefix={'text_color'}
                currentStyle={newButton.style}
                originalStyle={button.style}
                onChange={handleStyleChange}
                onReset={handleStyleReset}
            />
            <ColorPickerRow
                label={'Background'}
                propPrefix={'background_color'}
                currentStyle={newButton.style}
                originalStyle={button.style}
                onChange={handleStyleChange}
                onReset={handleStyleReset}
            />
            <ColorPickerRow
                label={'Border'}
                propPrefix={'border_color'}
                currentStyle={newButton.style}
                originalStyle={button.style}
                onChange={handleStyleChange}
                onReset={handleStyleReset}
            />

            <div className={styles.btnPreviewContainer}>
                <div className={styles.btnPreviewWrapper}>
                    <span className={styles.previewLabel}>Preview</span>
                    {previewButtonObj && (
                        <SoundboardButton
                            row={previewButtonObj.row}
                            col={previewButtonObj.col}
                            button={previewButtonObj}
                            className={styles.btnPreview}
                        />
                    )}
                </div>
            </div>

            <div className={'windowButtons'}>
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
    propPrefix: 'text_color' | 'background_color' | 'border_color';
    currentStyle?: BtnStyle;
    originalStyle?: BtnStyle;
    onChange: (field: keyof BtnStyle, value: string) => void;
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
    const hoverKey = `${propPrefix}_hover` as keyof BtnStyle;
    const activeKey = `${propPrefix}_active` as keyof BtnStyle;

    const getHoverColor = (color: string) => {
        const hsl = hexToHsl(color);
        if (!hsl) return color;

        hsl.l = Math.min(100, hsl.l + 10);
        return hslToHex(hsl);
    }

    const getActiveColor = (color: string) => {
        const hsl = hexToHsl(color);
        if (!hsl) return color;

        hsl.l = Math.max(0, hsl.l - 10);
        return hslToHex(hsl);
    }

    const handleDefaultChange = (value: string) => {
        onChange(defaultKey, value);

        if (autoMode) {
            onChange(hoverKey, getHoverColor(value));
            onChange(activeKey, getActiveColor(value));
        }
    }

    const handleAutoToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setAutoMode(isChecked);

        if (isChecked) {
            const currentColor = (currentStyle?.[defaultKey] || originalStyle?.[defaultKey] || '#000000') as string;

            const newHover = getHoverColor(currentColor);
            const newActive = getActiveColor(currentColor);

            onChange(hoverKey, newHover);
            onChange(activeKey, newActive);
        }
    };

    return (
        <div className={styles.colorGrid}>
            <span className={styles.label}>{label}</span>

            <ColorPickerBlock
                value={currentStyle?.[defaultKey] as string}
                originalValue={originalStyle?.[defaultKey] as string}
                onChange={handleDefaultChange}
                onReset={() => onReset(defaultKey)}
                onRemove={() => onChange(defaultKey, null)}
            />

            <ColorPickerBlock
                value={currentStyle?.[hoverKey] as string}
                originalValue={originalStyle?.[hoverKey] as string}
                disabled={autoMode}
                onChange={(val) => onChange(hoverKey, val)}
                onReset={() => onReset(hoverKey)}
                onRemove={() => onChange(hoverKey, null)}
            />

            <ColorPickerBlock
                value={currentStyle?.[activeKey] as string}
                originalValue={originalStyle?.[activeKey] as string}
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

type ColorPickerBlockProps = {
    value?: string;
    originalValue?: string;
    disabled?: boolean;
    onChange: (value: string) => void;
    onReset: () => void;
    onRemove: () => void;
}

const ColorPickerBlock = ({
                              value,
                              originalValue,
                              disabled = false,
                              onChange,
                              onReset,
                              onRemove
                          }: ColorPickerBlockProps) => {
    const isRemoved = value === null;
    const isModified = value !== undefined;
    const displayValue = isRemoved ? '#000000' : (value ?? originalValue ?? '#000000');

    const canRemove = !!originalValue;

    return (
        <div className={styles.colorPickerBlock}>
            <ColorPicker
                value={displayValue}
                onChange={onChange}
                disabled={disabled}
            />
            {!disabled && (
                <div className={styles.colorPickerIcons}>
                    <PiArrowCounterClockwiseBold
                        className={styles.colorPickerIcon}
                        onClick={onReset}
                        title={'Reset to original'}
                        style={{
                            opacity: isModified ? 1 : 0.5,
                            cursor: isModified ? 'pointer' : 'default',
                            pointerEvents: isModified ? 'auto' : 'none'
                        }}
                    />

                    {canRemove && (
                        <PiXBold
                            className={styles.colorPickerIcon}
                            onClick={onRemove}
                            title={'Remove value'}
                            style={{
                                cursor: 'pointer',
                                opacity: isRemoved ? 0.5 : 1
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

export default ButtonSettingsWin;