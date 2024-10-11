import './ProgressBar.css';
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

const defDisplayFunction = (value: number) => value.toString();

const ProgressBar = ({className, min = 0, max = 100, val = 0, seek = false, showProgress = true, disabled = false, onChange, displayFunction = defDisplayFunction}: ProgressBarProps) => {
    const [value, setValue] = useState<number>(min);
    const [dragging, setDragging] = useState<boolean>(false);
    const progressBarRef = useRef<HTMLDivElement>(null);

    const updateValue = (e: MouseEvent | React.MouseEvent) => {
        if (!progressBarRef.current || disabled) return;

        const oldValue = value;
        const rect = progressBarRef.current.getBoundingClientRect();
        const newPercentage = ((e.clientX - rect.left) / rect.width) * 100;
        const newValue = Math.round(Math.min(max, Math.max(min, min + (newPercentage / 100) * (max - min))));
        setValue(newValue);

        if (onChange) onChange(oldValue, newValue);
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (disabled || !seek) return;
        setDragging(true);
        updateValue(e);
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragging || disabled) return;
        updateValue(e);
    }

    const handleMouseUp = () => {
        if (!dragging) return;
        setDragging(false);
    }

    useEffect(() => {
        setValue(val);
    }, [val]);

    useEffect(() => {
        if (dragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
    }, [dragging]);

    const percentage = ((value - min) / (max - min)) * 100;

    const style = {
        cursor: 'default'
    };

    if (seek && !disabled) {
        style.cursor = 'pointer';
    }

    const opacity = dragging ? 1 : 0;
    const displayValue = displayFunction(value);

    return (
        <div
            className={`${className ? className : ''} progress-bar${disabled ? ' disabled' : ''}`}
            style={style}
            onMouseDown={handleMouseDown}
            ref={progressBarRef}
        >
            <div className="progress" style={{width: `${percentage}%`}}/>
            {seek && !disabled && <div className="cursor" style={{left: `calc(${percentage}% - var(--height))`}}/>}
            {showProgress && seek && !disabled && <span className="cursor-progress" style={{left: `calc(${percentage}% - 16px)`, opacity: opacity}}>{displayValue}</span>}
        </div>
    );
}

export default ProgressBar;