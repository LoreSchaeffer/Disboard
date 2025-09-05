import styles from './ProgressBar.module.css';
import React, {useEffect, useRef, useState} from "react";

type ProgressBarProps = {
    className?: string;
    min?: number;
    max?: number;
    val?: number;
    seek?: boolean;
    showProgress?: boolean;
    disabled?: boolean;
    onChange?: (oldValue: number, newValue: number) => void;
    displayFunction?: (value: number) => string;
}

const ProgressBar = (
    {
        className, min = 0,
        max = 100,
        val = 0,
        seek = false,
        showProgress = true,
        disabled = false,
        onChange,
        displayFunction = (value: number) => value.toString()
    }: ProgressBarProps) => {
    const [value, setValue] = useState<number>(min);
    const [dragging, setDragging] = useState<boolean>(false);

    const progressBarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!dragging) setValue(val);
    }, [val, dragging]);

    useEffect(() => {
        if (dragging) {
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        } else {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }, [dragging]);

    const updateValue = (e: MouseEvent | React.MouseEvent) => {
        if (!progressBarRef.current || disabled) return;

        const oldValue = value;
        const rect = progressBarRef.current.getBoundingClientRect();
        const newPercentage = ((e.clientX - rect.left) / rect.width) * 100;
        const newValue = Math.round(Math.min(max, Math.max(min, min + (newPercentage / 100) * (max - min))));
        setValue(newValue);

        if (onChange) onChange(oldValue, newValue);
    }

    const onMouseDown = (e: React.MouseEvent) => {
        if (disabled || !seek) return;
        setDragging(true);
        updateValue(e);
    }

    const onMouseMove = (e: MouseEvent) => {
        if (!dragging || disabled) return;
        updateValue(e);
    }

    const onMouseUp = () => {
        if (!dragging) return;
        setDragging(false);
    }

    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div
            className={`${styles.progressBar} ${disabled ? styles.disabled : ''} ${className || ''}`}
            style={{
                cursor: seek && !disabled ? 'pointer' : 'default'
            }}
            onMouseDown={onMouseDown}
            ref={progressBarRef}
        >
            <div
                className={styles.progress}
                style={{
                    width: `${percentage}%`
                }}
            />
            {seek && !disabled && (
                <div
                    className={styles.cursor}
                    style={{
                        left: `calc(${percentage}% - var(--height))`
                    }}
                />
            )}
            {showProgress && seek && !disabled && (
                <span
                    className={styles.cursorProgress}
                    style={{
                        left: `calc(${percentage}% - 16px)`,
                        opacity: dragging ? 1 : 0
                    }}
                >
                    {displayFunction(value)}
                </span>
            )}
        </div>
    );
}

export default ProgressBar;