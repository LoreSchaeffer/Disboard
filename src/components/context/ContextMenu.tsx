import './ContextMenu.css';
import MenuItem, {MenuItemProps} from "./MenuItem";
import React, {useEffect, useRef, useState} from "react";
import {useData} from "../../ui/context";

export interface ContextMenuProps {
    x: number;
    y: number;
    items: MenuItemProps[];
    submenus?: Submenu[];
}

export interface Submenu {
    id: string;
    items: MenuItemProps[];
}

const ContextMenu = ({x, y, items, submenus}: ContextMenuProps) => {
    const {setContextMenu} = useData();
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

                if (x + menuRect.width > windowWidth) newX = x - menuRect.width;
                if (y + menuRect.height > windowHeight) newY = y - menuRect.height;

                setPosition({x: newX, y: newY});
                setVisible(true);
            }
        }

        updatePosition();
    }, [x, y]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setContextMenu(null);
            if (submenuRef.current && !submenuRef.current.contains(e.target as Node)) setActiveSubmenu(null);
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
            setSubmenuPosition({x: rect.right, y: rect.top});
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
                className="context-menu"
                style={{
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
                    className="context-menu context-sumbenu"
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