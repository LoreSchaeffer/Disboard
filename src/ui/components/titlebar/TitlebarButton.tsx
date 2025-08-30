import styles from "./TitlebarButton.module.css";
import React, {MouseEvent} from "react";
import SvgIcon, {IconType} from "../SvgIcon";
interface TitlebarButtonProps {
    icon: IconType;
    hoverColor?: string;
    onClick?: () => void;
}

const TitlebarButton = ({icon, hoverColor = 'var(--background-tertiary-hover)', onClick}: TitlebarButtonProps) => {

    const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
        (e.target as HTMLDivElement).style.backgroundColor = hoverColor;
    }

    const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
        (e.target as HTMLDivElement).style.backgroundColor = 'transparent';
    }

    return (
        <div
            className={styles.titlebarButton}
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <SvgIcon icon={icon} color={'var(--text-disabled)'} size="24px"/>
        </div>
    );
}

export default TitlebarButton;