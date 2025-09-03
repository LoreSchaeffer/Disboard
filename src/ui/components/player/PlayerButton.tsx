import styles from './PlayerButton.module.css';
import {forwardRef, MouseEvent} from "react";
import SvgIcon, {IconType} from "../SvgIcon";

interface PlayerButtonProps {
    icon: IconType;
    size?: string;
    disabled?: boolean;
    onClick?: (e: MouseEvent) => void;
    fill?: string;
}

const PlayerButton = forwardRef<HTMLSpanElement, PlayerButtonProps>((
    {
        icon,
        size = '26px',
        disabled = false,
        onClick,
        fill = 'var(--text-primary)'
    }: PlayerButtonProps, ref) => {
    return (
        <span
            ref={ref}
            className={`${styles.playerButton} ${disabled ? styles.disabled : ''}`}
            onClick={disabled ? undefined : onClick}
            style={{width: size, height: size}}
        >
            <SvgIcon icon={icon} size={size} color={fill}/>
        </span>
    );
});

export default PlayerButton;