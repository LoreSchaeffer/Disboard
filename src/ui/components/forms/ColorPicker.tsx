import styles from './ColorPicker.module.css';
import {ChangeEvent, useEffect, useRef, useState} from "react";
import {validateHexColor} from "../../utils/utils";

type ColorPickerProps = {
    value?: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
}

const ColorPicker = (
    {
        value = '#000000',
        onChange,
        disabled = false
    }: ColorPickerProps) => {
    const [val, setVal] = useState(value || '#000000');

    const colorInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (validateHexColor(val)) setVal(value);
        else setVal('#000000');
    }, [value]);

    const showColorPicker = () => {
        if (disabled) return;
        colorInputRef.current?.click();
    }

    const handleColorChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setVal(newVal);
        if (onChange) onChange(newVal);
    };

    return (
        <div
            className={`${styles.colorPicker} ${disabled ? 'disabled' : ''}`}
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