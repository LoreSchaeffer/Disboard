import styles from './TitlebarButton.module.css';
import React, {ElementType} from "react";
import {clsx} from "clsx";

interface TitlebarButtonProps {
    icon: ElementType;
    color?: 'default' | 'red';
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
}

const TitlebarButton = ({icon: Icon, color = 'default', className, disabled = false, onClick}: TitlebarButtonProps) => {
    return (
        <div
            className={clsx(
                styles.titlebarButton,
                color !== 'default' && styles[color],
                className,
                disabled && styles.disabled
            )}
            onClick={!disabled ? onClick : undefined}
        >
            <Icon className={styles.icon}/>
        </div>
    );
}

export default TitlebarButton;