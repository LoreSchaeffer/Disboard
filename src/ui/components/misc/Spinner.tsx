import styles from './Spinner.module.css';
import React from 'react';
import {clsx} from 'clsx';

type SpinnerProps = {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    light?: boolean;
};

const Spinner = ({className, size = 'md', light = false}: SpinnerProps) => {
    return (
        <div
            className={clsx(
                styles.spinner,
                styles[size],
                light && styles.light,
                className
            )}
            role="status"
            aria-label="Loading"
        />
    );
};

export default Spinner;