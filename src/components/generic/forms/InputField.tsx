import './InputField.css';
import React from "react";

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
                        onChange
                    }: InputFieldProps) => {
    return (
        <input
            className={`input input-field${className? ' ' + className : ''}`}
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
            value={value !== undefined ? value : undefined}
            defaultValue={value === undefined ? defaultValue : undefined}
            onChange={onChange}
        />
    );
};

export default InputField;