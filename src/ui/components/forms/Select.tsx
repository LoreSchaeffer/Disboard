import {CSSProperties, ReactNode, useEffect, useRef, useState} from "react";
import styles from './Select.module.css';
import {clsx} from "clsx";
import {PiCaretDownBold} from "react-icons/pi";
import {Background} from "../../types/common";

export type Option = {
    label: string;
    value: string | number;
};

type SelectProps = {
    value?: string | number;
    options: Option[];
    placeholder?: string;
    icon?: ReactNode;
    error?: string;
    background?: Background;
    className?: string;
    style?: CSSProperties;
    disabled?: boolean;
    onChange?: (value: string | number) => void;
}

const Select = ({
                    value,
                    onChange,
                    options,
                    placeholder = "Select...",
                    icon,
                    error,
                    background = 'primary',
                    className,
                    style,
                    disabled = false
                }: SelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string | number) => {
        if (disabled) return;
        onChange?.(optionValue);
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div
            className={clsx(styles.selectContainer, className)}
            style={style}
            ref={containerRef}
        >
            <div
                className={clsx(
                    styles.trigger,
                    styles[background],
                    isOpen && styles.open,
                    error && styles.error,
                    disabled && styles.disabled
                )}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className={styles.leftContent}>
                    {icon && <span className={styles.leftIcon}>{icon}</span>}

                    <span className={clsx(styles.valueText, !selectedOption && styles.placeholder)}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>

                <span className={styles.chevron}><PiCaretDownBold/></span>
            </div>

            {isOpen && (
                <div className={styles.dropdownMenu}>
                    {options.length > 0 ? (
                        options.map((option) => (
                            <div
                                key={option.value}
                                className={clsx(
                                    styles.option,
                                    option.value === value && styles.selected
                                )}
                                onClick={() => handleSelect(option.value)}
                            >
                                {option.label}
                            </div>
                        ))
                    ) : (
                        <div className={styles.emptyMessage}>No options</div>
                    )}
                </div>
            )}

            {error && (
                <div className={styles.errorMessage}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default Select;