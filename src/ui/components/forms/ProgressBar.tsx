import styles from './ProgressBar.module.css';
import React, {useCallback, useEffect, useRef, useState} from "react";

type ProgressBarProps = {
    className?: string;
    min?: number;
    max?: number;
    val?: number;
    seek?: boolean;
    showProgress?: boolean;
    disabled?: boolean;
    onChange?: (oldValue: number, newValue: number) => void;
    onDragEnd?: (value: number) => void;
    displayFunction?: (value: number) => string;
}

const ProgressBar = (
    {
        className,
        min = 0,
        max = 100,
        val = 0,
        seek = false,
        showProgress = true,
        disabled = false,
        onChange,
        onDragEnd,
        displayFunction = (value: number) => value.toString()
    }: ProgressBarProps) => {
    const [localValue, setLocalValue] = useState<number>(val);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const valueRef = useRef<number>(val);

    useEffect(() => {
        if (!isDragging) {
            const safeValue = Math.min(max, Math.max(min, val));
            setLocalValue(safeValue);
            valueRef.current = safeValue;
        }
    }, [val, isDragging, min, max]);

    const calculateValue = useCallback((clientX: number) => {
        if (!progressBarRef.current) return min;

        const rect = progressBarRef.current.getBoundingClientRect();
        const percentage = (clientX - rect.left) / rect.width;
        let newValue = min + percentage * (max - min);
        newValue = Math.round(Math.min(max, Math.max(min, newValue)));

        return newValue;
    }, [min, max]);

    const updateProgress = useCallback((newValue: number) => {
        const oldValue = valueRef.current;

        if (oldValue !== newValue) {
            setLocalValue(newValue);
            valueRef.current = newValue;
            if (onChange) onChange(oldValue, newValue);
        }
    }, [onChange]);

    useEffect(() => {
        if (!isDragging || disabled) return;

        const handleMove = (e: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            const newValue = calculateValue(clientX);
            updateProgress(newValue);
        };

        const handleUp = () => {
            setIsDragging(false);
            if (onDragEnd) onDragEnd(valueRef.current);
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', handleMove);
        document.addEventListener('mouseup', handleUp);
        document.addEventListener('touchend', handleUp);

        return () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.removeEventListener('touchend', handleUp);
        };
    }, [isDragging, disabled, calculateValue, updateProgress, onDragEnd]);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled || !seek) return;

        setIsDragging(true);

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const newValue = calculateValue(clientX);
        updateProgress(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled || !seek) return;

        let step = (max - min) / 100;
        step = Math.max(1, Math.round(step));

        let newValue = localValue;

        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowDown':
                newValue = Math.max(min, localValue - step);
                break;
            case 'ArrowRight':
            case 'ArrowUp':
                newValue = Math.min(max, localValue + step);
                break;
            case 'Home':
                newValue = min;
                break;
            case 'End':
                newValue = max;
                break;
            default:
                return;
        }

        e.preventDefault();
        updateProgress(newValue);
        if (onDragEnd) onDragEnd(newValue);
    };

    const percentage = ((localValue - min) / (max - min)) * 100;

    return (
        <div
            className={`${styles.progressBar} ${disabled ? styles.disabled : ''} ${className || ''}`}
            style={{
                cursor: seek && !disabled ? 'pointer' : 'default',
                touchAction: 'none'
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            onKeyDown={handleKeyDown}
            ref={progressBarRef}
            role={seek ? "slider" : "progressbar"}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={localValue}
            aria-disabled={disabled}
            tabIndex={seek && !disabled ? 0 : -1}
        >
            <div
                className={styles.progress}
                style={{width: `${percentage}%`}}
            />

            {seek && !disabled && (
                <div
                    className={styles.cursor}
                    style={{left: `calc(${percentage}% - var(--height, 10px))`}}
                />
            )}

            {showProgress && seek && !disabled && (
                <span
                    className={styles.cursorProgress}
                    style={{
                        left: `calc(${percentage}% - 16px)`,
                        opacity: isDragging ? 1 : 0,
                        pointerEvents: 'none'
                    }}
                >
                    {displayFunction(localValue)}
                </span>
            )}
        </div>
    );
}

export default ProgressBar;