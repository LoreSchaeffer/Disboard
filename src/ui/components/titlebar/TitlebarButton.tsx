import styles from './TitlebarButton.module.css';
import React, {ElementType} from "react";

interface TitlebarButtonProps {
    icon: ElementType;
    color?: 'default' | 'red';
    className?: string;
    onClick?: () => void;
}

const TitlebarButton = ({icon: Icon, color = 'default', className, onClick}: TitlebarButtonProps) => {
    return (
        <div className={`${styles.titlebarButton} ${color !== 'default' ? styles[color] : ''} ${className || ''}`} onClick={onClick}>
            <Icon className={styles.icon}/>
        </div>
    );
}

export default TitlebarButton;