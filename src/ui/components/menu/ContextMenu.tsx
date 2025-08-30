import styles from "./ContextMenu.module.css";
import MenuItem, {MenuItemProps} from "./MenuItem";
import React, {useEffect, useRef, useState} from "react";
import {useWindowContext} from "../../context/WindowContext";

export type ContextMenuProps = {
    x: number;
    y: number;
    xAnchor?: 'left' | 'right';
    yAnchor?: 'top' | 'bottom';
    items: MenuItemProps[];
    submenus?: Submenu[];
    style?: React.CSSProperties;
}

export type Submenu = {
    id: string;
    items: MenuItemProps[];
}

const ContextMenu = ({x, y, xAnchor = 'left', yAnchor = 'top', items, submenus, style}: ContextMenuProps) => {
    const {setContextMenu} = useWindowContext();
    const menuRef = useRef<HTMLDivElement | null>(null);
    const submenuRef = useRef<HTMLDivElement | null>(null);
    const submenuTimeoutRef = useRef<number | null>(null);

    const [position, setPosition] = useState({x, y});
    const [visible, setVisible] = useState(false);
    const [submenuList, setSubmenuList] = useState<Submenu[]>([]);
    const [activeSubmenu, setActiveSubmenu] = useState<Submenu | null>(null);
    const [submenuPosition, setSubmenuPosition] = useState({x: 0, y: 0});

    useEffect(() => {
        if (submenus) {
            setSubmenuList(submenus);
        }
    }, [submenus]);

    useEffect(() => {
        const updatePosition = () => {
            if (menuRef.current) {
                const menuRect = menuRef.current.getBoundingClientRect();
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                let newX = x;
                let newY = y;

                if (xAnchor === 'right') newX = x - menuRect.width;
                if (yAnchor === 'bottom') newY = y - menuRect.height;

                if (newX + menuRect.width > windowWidth) newX = windowWidth - menuRect.width;
                if (newY + menuRect.height > windowHeight) newY = windowHeight - menuRect.height;
                if (newX < 0) newX = 0;
                if (newY < 0) newY = 0;

                setPosition({x: newX, y: newY});
                setVisible(true);
            }
        }

        updatePosition();
    }, [x, y]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const clickedOutsideMenu = menuRef.current && !menuRef.current.contains(e.target as Node);
            const clickedInsideSubmenu = submenuRef.current && submenuRef.current.contains(e.target as Node);

            if (clickedOutsideMenu) {
                if (submenus && submenus.length > 0 && clickedInsideSubmenu) return;

                setContextMenu(null);
                setActiveSubmenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [setContextMenu]);

    const showSubmenu = (e: React.MouseEvent, submenuId: string, hovering: boolean) => {
        if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current);

        if (hovering) {
            const rect = e.currentTarget.getBoundingClientRect();
            let submenuX = rect.right;
            const submenuY = rect.top;

            if (xAnchor === 'right') submenuX = rect.left - menuRef.current.getBoundingClientRect().width;

            setSubmenuPosition({x: submenuX, y: submenuY});
            setActiveSubmenu(submenuList.find(submenu => submenu.id === submenuId) || null);
        } else {
            submenuTimeoutRef.current = window.setTimeout(() => setActiveSubmenu(null), 100);
        }
    };

    const keepShowingSubmenu = (e: React.MouseEvent, submenuId: string, hovering: boolean) => {
        if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current);

        if (hovering) {
            setActiveSubmenu(submenuList.find(submenu => submenu.id === submenuId) || null);
        } else {
            submenuTimeoutRef.current = window.setTimeout(() => setActiveSubmenu(null), 100);
        }
    }

    return (
        <>
            <div
                ref={menuRef}
                className={styles.contextMenu}
                style={{
                    ...style,
                    top: position.y + 'px',
                    left: position.x + 'px',
                    opacity: visible ? 1 : 0
                }}
            >
                <ul>
                    {items.map((item, index) => (
                        <MenuItem key={index} {...item} onHover={showSubmenu} />
                    ))}
                </ul>
            </div>
            {activeSubmenu && (
                <div
                    ref={submenuRef}
                    className={styles.contextMenu}
                    style={{
                        top: submenuPosition.y + 'px',
                        left: submenuPosition.x + 'px',
                        opacity: 1
                    }}
                    onMouseEnter={(e) => keepShowingSubmenu(e, activeSubmenu.id, true)}
                    onMouseLeave={(e) => keepShowingSubmenu(e, activeSubmenu.id, false)}
                >
                    <ul>
                        {activeSubmenu.items.map((item, index) => (
                            <MenuItem key={index} {...item} />
                        ))}
                    </ul>
                </div>
            )}
        </>
    )
        ;
}

export default ContextMenu;