import './Spinner.css';
import React, {useEffect} from "react";
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
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
                     defaultValue = 0,
                     onChange
                 }: SpinnerProps) => {

    const [internalValue, setInternalValue] = React.useState<number>(defaultValue);

    useEffect(() => {
        setInternalValue(defaultValue || 0);
    }, [defaultValue]);

    const changeValue = (amount: number) => {
        if (disabled || readonly) return;

        let newValue = internalValue + (step * amount);

        if (max !== undefined && newValue > max) newValue = max;
        if (min !== undefined && newValue < min) newValue = min;

        setInternalValue(newValue);

        if (onChange) {
            const event = {
                target: {value: newValue.toString()}
            } as React.ChangeEvent<HTMLInputElement>;

            onChange(event);
        }
    };

    return (
        <div className={"input spinner"}>
            <SvgIcon className={"spinner-icon spinner-subtract"} icon={"subtract"} size={"18px"} onClick={() => changeValue(-1)}/>
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
                value={internalValue}
                defaultValue={defaultValue}
                onChange={(e) => {
                    const newValue = Number(e.target.value);
                    setInternalValue(newValue);
                    if (onChange) onChange(e);
                }}/>
            <SvgIcon className={"spinner-icon spinner-add"} icon={"add"} size={"18px"} onClick={() => changeValue(1)}/>
        </div>
    );
};

export default Spinner;