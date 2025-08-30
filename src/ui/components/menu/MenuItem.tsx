import styles from './MenuItem.module.css'
import SvgIcon, {IconType} from "../SvgIcon";
import {MouseEvent} from "react";
import {useWindowContext} from "../../context/WindowContext";

type ItemType = 'normal' | 'separator' | 'primary' | 'danger';

export type MenuItemProps = {
    className?: string;
    type?: ItemType;
    text?: string;
    icon?: IconType;
    onClick?: () => void;
    onHover?: (e: MouseEvent, submenuId: string, hovering: boolean) => void;
    submenu?: string;
    disabled?: boolean;
}

const MenuItem = ({
                      className,
                      type = 'normal',
                      text = '',
                      icon,
                      onClick,
                      onHover,
                      submenu = null,
                      disabled = false
                  }: MenuItemProps) => {
    const {setContextMenu} = useWindowContext();

    if (type === 'separator') {
        return (
            <li className={`context-menu-item separator${className ? ' ' + className : ''}`}/>
        );
    }

    const click = () => {
        if (!disabled && onClick) onClick();
        setContextMenu(null);
    }

    const onEnter = (e: MouseEvent) => {
        if (!disabled && onHover) onHover(e, submenu, true);
    }

    const onLeave = (e: MouseEvent) => {
        if (!disabled && onHover) onHover(e, '', false);
    }

    return (
        <li
            className={`${styles.contextMenuItem} ${type !== 'normal' ? type : ''} ${disabled ? 'disabled' : ''}`}
            onClick={click}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
        >
            {icon && <SvgIcon icon={icon} className={styles.icon} size={'15px'}/>}
            {text}
            {submenu && <SvgIcon icon="chevron_right" className={styles.chevron} size={'14px'}/>}
        </li>
    );
}

export default MenuItem;