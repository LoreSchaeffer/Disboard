import styles from './Input.module.css';
import {CSSProperties, forwardRef, InputHTMLAttributes, ReactNode, useImperativeHandle, useRef} from "react";
import {Background} from "../../types/common";
import {clsx} from "clsx";
import {PiMinusBold, PiPlusBold} from "react-icons/pi";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    icon?: ReactNode;
    iconSettings?: IconSettings;
    error?: string;
    spinner?: boolean;
    background?: Background;
}

type IconSettings = {
    onClick?: () => void;
    hoverColor?: string;
    customStyles?: CSSProperties;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
                                                            icon,
                                                            iconSettings,
                                                            error,
                                                            spinner = false,
                                                            background = 'primary',
                                                            type = 'text',
                                                            step = 1,
                                                            min,
                                                            max,
                                                            className,
                                                            ...props
                                                        }: InputProps, ref) => {
    const internalRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => internalRef.current as HTMLInputElement);

    const dispatchChangeEvent = (newValue: string) => {
        const input = internalRef.current;
        if (!input) return;

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
        )?.set;
        nativeInputValueSetter?.call(input, newValue);

        const event = new Event('change', {bubbles: true});
        input.dispatchEvent(event);
    };

    const handleIncrement = () => {
        if (!internalRef.current) return;

        const currentValue = parseFloat(internalRef.current.value) || 0;
        const stepValue = parseFloat(step.toString()) || 1;
        const newValue = currentValue + stepValue;

        if (max !== undefined && newValue > parseFloat(max.toString())) return;

        dispatchChangeEvent(String(newValue));
    };

    const handleDecrement = () => {
        if (!internalRef.current) return;

        const currentValue = parseFloat(internalRef.current.value) || 0;
        const stepValue = parseFloat(step.toString()) || 1;
        const newValue = currentValue - stepValue;

        if (min !== undefined && newValue < parseFloat(min.toString())) return;

        dispatchChangeEvent(String(newValue));
    };

    const inputType = spinner ? 'number' : type;

    return (
        <div className={clsx(styles.formInput, className)}>
            <div className={clsx(
                styles.inputWrapper,
                styles[background],
                error && styles.error,
                spinner && styles.spinnerMode
            )}>
                {spinner && (
                    <button
                        type="button"
                        className={styles.spinnerBtn}
                        onClick={handleDecrement}
                        tabIndex={-1}
                    >
                        <PiMinusBold/>
                    </button>
                )}

                <input
                    ref={internalRef}
                    type={inputType}
                    step={step}
                    min={min}
                    max={max}
                    className={clsx(
                        styles.input,
                        spinner ? styles.spinnerInput : styles.standardInput,
                    )}
                    {...props}
                />

                {spinner && (
                    <button
                        type="button"
                        className={styles.spinnerBtn}
                        onClick={handleIncrement}
                        tabIndex={-1}
                    >
                        <PiPlusBold/>
                    </button>
                )}

                {!spinner && icon && (
                    <span
                        className={clsx(styles.icon, iconSettings?.onClick && styles.clickable)}
                        onClick={iconSettings?.onClick}
                        style={iconSettings?.customStyles}
                    >
                        {icon}
                    </span>
                )}
            </div>
            {error && (
                <div className={styles.errorMessage}>
                    {error}
                </div>
            )}
        </div>
    );
});

export default Input;