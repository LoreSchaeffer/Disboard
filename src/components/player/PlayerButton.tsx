import './PlayerButton.css';
import {IconType} from "../../ui/icons";
import SvgIcon from "../generic/SvgIcon";

interface PlayerButtonProps {
    icon: IconType;
    size?: string;
    disabled?: boolean;
    onClick?: () => void;
}

const PlayerButton = ({icon, size, disabled, onClick}: PlayerButtonProps) => {
    if (disabled == null) disabled = false;
    if (size == null) size = '26px';

    return (
        <span className={`player-button${disabled ? ' disabled' : ''}`} onClick={disabled ? undefined : onClick} style={{width: size, height: size}}>
            <SvgIcon icon={icon} size={size} color="var(--text-primary)"/>
        </span>
    );
}

export default PlayerButton;