import {icons, IconType} from "../../ui/icons";


interface IconProps {
    className?: string;
    icon: IconType;
    color?: string;
    size?: string;
}

const SvgIcon = ({className, icon, color, size}: IconProps) => {
    if (size == null) size = '24px';
    if (color == null) color = '#ffffff';

    const iconPath = icons[icon];

    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 -960 960 960" fill={color}>
            <path d={iconPath}/>
        </svg>
    );
}

export default SvgIcon;