import './MenuItem.css';
import {IconType} from "../../ui/icons";
import SvgIcon from "../generic/SvgIcon";
import {useData} from "../../ui/context";

type ItemType = 'normal' | 'separator' | 'primary' | 'danger';

export interface MenuItemProps {
    className?: string;
    type?: ItemType;
    text?: string;
    icon?: IconType;
    onClick?: () => void;
    subMenu?: string;
    disabled?: boolean;
}

const MenuItem = ({className, type = 'normal', text = '', icon, onClick, subMenu = null, disabled = false} : MenuItemProps) => {
    const {setContextMenu} = useData();

    if (type === 'separator') {
        return (
            <li className={`context-menu-item separator${className ? ' ' + className : ''}`}/>
        );
    }

    const click = () => {
        if (!disabled && onClick) onClick();
        setContextMenu(null);
    }

    let classes = '';
    if (type !== 'normal') classes += ' ' + type;
    if (disabled) classes += ' disabled';

    return (
        <li className={`context-menu-item${classes}`} onClick={click}>
            {icon && <SvgIcon icon={icon} className="context-menu-item-icon" size={'15px'}/>}
            {text}
            {subMenu && <SvgIcon icon="chevron_right" className="submenu-chevron" size={'14px'}/>}
        </li>
    );
}

export default MenuItem;