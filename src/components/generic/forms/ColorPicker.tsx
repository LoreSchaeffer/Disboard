import './ColorPicker.css';
import {ChangeEvent, useEffect, useRef, useState} from "react";
import {validateHexColor} from "../../../ui/utils";

type ColorPickerProps = {
    value?: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
}

const ColorPicker = ({value = '#000000', onChange, disabled = false}: ColorPickerProps) => {
    const colorInputRef = useRef<HTMLInputElement>(null);
    const [val, setVal] = useState(value || '#000000');

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
        <div className={`color-picker${disabled ? ' disabled' : ''}`} style={{backgroundColor: val}} onClick={showColorPicker}>
            <input ref={colorInputRef} type={'color'} value={val} onChange={handleColorChange} disabled={disabled} style={{display: 'none'}}/>
        </div>
    );
}

export default ColorPicker;