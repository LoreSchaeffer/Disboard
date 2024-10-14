import './PlayerButton.css';
import {IconType} from "../../ui/icons";
import SvgIcon from "../generic/SvgIcon";
import {MouseEvent} from "react";

interface PlayerButtonProps {
    icon: IconType;
    size?: string;
    disabled?: boolean;
    onClick?: (e: MouseEvent) => void;
    fill?: string;
}

const PlayerButton = ({icon, size = '26px', disabled = false, onClick, fill = 'var(--text-primary)'}: PlayerButtonProps) => {
    return (
        <span className={`player-button${disabled ? ' disabled' : ''}`} onClick={disabled ? undefined : onClick} style={{width: size, height: size}}>
            <SvgIcon icon={icon} size={size} color={fill}/>
        </span>
    );
}

export default PlayerButton;