import './Spinner.css';
import React, {useEffect, useState} from "react";
import SvgIcon from "../SvgIcon";
import InputField from "./InputField";

type SpinnerProps = {
    autoFocus?: boolean;
    disabled?: boolean;
    max?: number;
    min?: number;
    name?: string;
    placeholder?: string;
    readonly?: boolean;
    step?: number;
    defaultValue?: number;
    value?: number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setValue?: (value: number) => void;
}

const Spinner = ({
                     autoFocus = false,
                     disabled = false,
                     max,
                     min,
                     name,
                     placeholder,
                     readonly = false,
                     step = 1,
                     defaultValue,
                     value,
                     onChange,
                     setValue,
                 }: SpinnerProps) => {
    const [val, setVal] = useState<number>(value ?? defaultValue ?? 0);
    const isControlled = value !== undefined;

    useEffect(() => {
        if (isControlled) setVal(value);
    }, [value, isControlled]);

    useEffect(() => {
        if (setValue) setValue(val);
    }, [val, setValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled || readonly) return;
        const newValue = Number(e.target.value);

        if (min !== undefined && newValue < min) setVal(min);
        else if (max !== undefined && newValue > max) setVal(max);
        else setVal(newValue);

        if (onChange) onChange(e);
    };

    const increment = () => {
        if (disabled || readonly) return;
        let newValue = val + step;

        if (max !== undefined && newValue > max) newValue = max;
        if (!isControlled) setVal(newValue);

        if (onChange) {
            const fakeEvent = {
                target: {
                    value: newValue.toString(),
                },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(fakeEvent);
        }
    };

    const decrement = () => {
        if (disabled || readonly) return;
        let newValue = val - step;

        if (min !== undefined && newValue < min) newValue = min;
        if (!isControlled) setVal(newValue);

        if (onChange) {
            const fakeEvent = {
                target: {
                    value: newValue.toString(),
                },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(fakeEvent);
        }
    };


    return (
        <div className={"input spinner"}>
            <SvgIcon className={"spinner-icon spinner-subtract"} icon={"subtract"} size={"18px"} onClick={decrement}/>
            <InputField
                autoComplete={'off'}
                autoFocus={autoFocus}
                disabled={disabled}
                max={max}
                min={min}
                name={name}
                placeholder={placeholder}
                readOnly={readonly}
                step={step}
                type={'number'}
                value={isControlled ? value : val}
                onChange={handleChange}/>
            <SvgIcon className={"spinner-icon spinner-add"} icon={"add"} size={"18px"} onClick={increment}/>
        </div>
    );
};

export default Spinner;