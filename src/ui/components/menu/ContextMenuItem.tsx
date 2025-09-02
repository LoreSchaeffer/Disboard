import styles from "./ContextMenuItem.module.css";
import SvgIcon, {IconType} from "../SvgIcon";
import React, {MouseEvent} from "react";
import {useWindowContext} from "../../context/WindowContext";
import {ContextMenuProps} from "./ContextMenu";

export type MenuItemProps = {
    type?: "normal" | "separator" | "primary" | "danger";
    text?: string;
    icon?: IconType;
    className?: string;
    onClick?: () => void;
    submenu?: ContextMenuProps | null;
    showSubmenu?: (e: HTMLElement) => void;
    hideSubmenu?: () => void;
    disabled?: boolean;
};

const ContextMenuItem: React.FC<MenuItemProps> = (
    {
        className,
        type = "normal",
        text = "",
        icon,
        onClick,
        submenu = null,
        showSubmenu,
        hideSubmenu,
        disabled = false,
    }) => {
    const {setContextMenu} = useWindowContext();

    if (type === "separator") {
        return <li className={`${styles.contextMenuItem} ${styles.separator} ${className || ""}`}/>;
    }

    const click = (e: MouseEvent) => {
        e.stopPropagation();
        if (!disabled && onClick) onClick();
        setContextMenu(null);
    };

    const onEnter = (e: MouseEvent) => {
        if (disabled || !submenu) return;
        showSubmenu?.(e.target as HTMLElement);
    };

    const onLeave = () => {
        if (disabled || !submenu) return;
        hideSubmenu?.();
    };

    return (
        <li
            className={`${styles.contextMenuItem} ${type !== "normal" ? styles[type] : ""} ${disabled ? styles.disabled : ""} ${className || ""}`}
            onClick={click}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
        >
            {icon && <SvgIcon icon={icon} className={styles.icon} size={"15px"}/>}
            <span className={styles.text}>{text}</span>
            {submenu && <SvgIcon icon="chevron_right" className={styles.chevron} size={"14px"}/>}
        </li>
    );
};

export default ContextMenuItem;