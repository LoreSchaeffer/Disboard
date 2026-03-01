import styles from './ColorPicker.module.css';
import {ChangeEvent, useEffect, useRef, useState} from "react";
import {Background} from "../../types/shared";
import {clsx} from "clsx";

type ColorPickerProps = {
    value?: string | null;
    background?: Background
    disabled?: boolean;
    onChange?: (value: string) => void;
}

const ColorPicker = (
    {
        value = null,
        background = 'primary',
        disabled = false,
        onChange
    }: ColorPickerProps) => {
    const [val, setVal] = useState(value);
    const colorInputRef = useRef<HTMLInputElement>(null);
    const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        setVal(value);
    }, [value]);

    useEffect(() => {
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, []);

    const showColorPicker = () => {
        if (disabled) return;
        colorInputRef.current?.click();
    }

    const handleColorChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;

        setVal(newVal);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(() => onChange?.(newVal), 50);
    };

    return (
        <div
            className={clsx(
                styles.colorPicker,
                styles[background],
                disabled && styles.disabled
            )}
            style={{backgroundColor: val || 'transparent'}}
            onClick={showColorPicker}
        >
            <input
                ref={colorInputRef}
                type={'color'}
                value={val || '#000000'}
                onChange={handleColorChange}
                disabled={disabled}
                style={{
                    opacity: 0,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    cursor: disabled ? 'default' : 'pointer',
                    border: 'none',
                    padding: 0,
                    margin: 0
            }}
            />
        </div>
    );
}

export default ColorPicker;