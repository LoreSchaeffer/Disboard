import './InputField.css';
import React, {useEffect, useState} from "react";

type Type = 'text' | 'password' | 'number' | 'url';

type Autocomplete = 'off' | 'on';

type InputFieldProps = {
    className?: string;
    autoComplete?: Autocomplete;
    autoFocus?: boolean;
    disabled?: boolean;
    max?: number;
    min?: number;
    minLength?: number;
    name?: string;
    pattern?: string;
    placeholder?: string;
    readOnly?: boolean;
    step?: number;
    type?: Type;
    defaultValue?: string | number;
    value?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit?: (value: string | number) => void;
    setValue?: (value: string | number) => void;
};

const InputField = ({
                        className,
                        autoComplete = 'on',
                        autoFocus = false,
                        disabled = false,
                        max,
                        min,
                        minLength,
                        name,
                        pattern,
                        placeholder,
                        readOnly = false,
                        step = 1,
                        type = 'text',
                        defaultValue,
                        value,
                        onChange,
                        onSubmit,
                        setValue,
                    }: InputFieldProps) => {
    const [val, setVal] = useState<string | number>(value ?? defaultValue ?? '');
    const isControlled = value !== undefined;

    useEffect(() => {
        if (isControlled) setVal(value);
    }, [value, isControlled]);

    useEffect(() => {
        if (setValue) setValue(val);
    }, [val, setValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isControlled) setVal(e.target.value);
        if (onChange) onChange(e);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onSubmit) onSubmit(isControlled ? (value as string | number) : val);
    };

    return (
        <input
            className={`input input-field${className ? ' ' + className : ''}`}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            disabled={disabled}
            max={max}
            min={min}
            minLength={minLength}
            name={name}
            pattern={pattern}
            placeholder={placeholder}
            readOnly={readOnly}
            step={step}
            type={type}
            value={isControlled ? value : val}
            defaultValue={!isControlled ? defaultValue : undefined}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
        />
    );
};

export default InputField;