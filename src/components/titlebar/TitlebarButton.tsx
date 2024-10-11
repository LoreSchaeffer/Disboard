import React from "react";
import './TitlebarButton.css';
import {IconType} from "../../ui/icons";
import SvgIcon from "../generic/SvgIcon";

interface TitlebarButtonProps {
    id?: string;
    icon: IconType;
    hoverColor?: string;
    onClick?: () => void;
}

const TitlebarButton = ({id, icon, hoverColor, onClick} : TitlebarButtonProps) => {
    return (
        <div id={id ? id : icon} className="titlebar-button" onClick={onClick} style={{ '--hover-color': hoverColor} as React.CSSProperties}>
            <SvgIcon icon={icon} color={'var(--text-disabled)'} size="24px"/>
        </div>
    );
}

export default TitlebarButton;