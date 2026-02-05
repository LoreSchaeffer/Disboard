import styles from './ResettableColorPicker.module.css';
import React from 'react';
import {PiArrowCounterClockwiseBold, PiXBold} from "react-icons/pi";
import ColorPicker from './ColorPicker';

type ResettableColorPickerProps = {
    value?: string | null;
    originalValue?: string;
    disabled?: boolean;
    onChange?: (val: string | null) => void;
    onReset?: () => void;
    onRemove?: () => void;
};

const ResettableColorPicker = ({
                                   value,
                                   originalValue,
                                   disabled = false,
                                   onChange,
                                   onReset,
                                   onRemove
                               }: ResettableColorPickerProps) => {
    const isModified = value !== undefined;
    const activeColor = value ?? originalValue ?? null;
    const hasColor = activeColor != null;

    return (
        <div className={styles.colorPickerBlock}>
            <ColorPicker
                value={activeColor}
                onChange={onChange}
                disabled={disabled}
            />

            {!disabled && (
                <div className={styles.icons}>
                    <PiArrowCounterClockwiseBold
                        className={styles.icon}
                        onClick={isModified ? onReset : undefined}
                        title={isModified ? 'Reset to original' : undefined}
                        style={{
                            opacity: isModified ? 1 : 0.5,
                            cursor: isModified ? 'pointer' : 'default',
                        }}
                    />
                    <PiXBold
                        className={styles.icon}
                        onClick={hasColor ? onRemove : undefined}
                        title={hasColor ? 'Remove value' : undefined}
                        style={{
                            opacity: hasColor ? 1 : 0.5,
                            cursor: hasColor ? 'pointer' : 'default'
                        }}
                    />
                </div>
            )}
        </div>
    )
}

export default ResettableColorPicker;