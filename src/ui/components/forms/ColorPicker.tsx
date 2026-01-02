import styles from './ColorPicker.module.css';
import {ChangeEvent, useEffect, useRef, useState} from "react";
import {validateHexColor} from "../../utils/utils";
import {Background} from "../../types/common";
import {clsx} from "clsx";

type ColorPickerProps = {
    value?: string;
    background?: Background
    disabled?: boolean;
    onChange?: (value: string) => void;
}

const ColorPicker = (
    {
        value = '#000000',
        background = 'primary',
        disabled = false,
        onChange
    }: ColorPickerProps) => {
    const [val, setVal] = useState(value || '#000000');
    const colorInputRef = useRef<HTMLInputElement>(null);
    const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        setVal(value || '#000000');
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
        if (!validateHexColor(newVal)) return;

        setVal(newVal);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(() => onChange?.(newVal), 10);
    };

    return (
        <div
            className={clsx(
                styles.colorPicker,
                styles[background],
                disabled && styles.disabled
            )}
            style={{backgroundColor: val}}
            onClick={showColorPicker}
        >
            <input
                ref={colorInputRef}
                type={'color'}
                value={val}
                onChange={handleColorChange}
                disabled={disabled}
                style={{display: 'none'}}
            />
        </div>
    );
}

export default ColorPicker;