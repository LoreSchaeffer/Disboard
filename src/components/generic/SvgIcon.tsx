import {icons, IconType} from "../../ui/icons";
import React from "react";


interface IconProps {
    className?: string;
    icon: IconType;
    color?: string;
    size?: string;
    onClick?: (e: React.MouseEvent) => void;
}

const SvgIcon = ({className, icon, color = '#ffffff', size = '24px', onClick}: IconProps) => {
    const iconPath = icons[icon];

    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 -960 960 960" fill={color} onClick={onClick}>
            <path d={iconPath}/>
        </svg>
    );
}

export default SvgIcon;