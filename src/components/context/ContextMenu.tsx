import './ContextMenu.css';
import MenuItem, {MenuItemProps} from "./MenuItem";
import React, {useEffect, useRef, useState} from "react";
import {useData} from "../../ui/context";

export interface ContextMenuProps {
    x: number;
    y: number;
    items: MenuItemProps[];
}

// TODO Submenus

const ContextMenu = ({x, y, items}: ContextMenuProps) => {
    const {setContextMenu} = useData();
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [position, setPosition] = useState({x, y});
    const [visible, setVisible] = useState(false);

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
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [setContextMenu]);

    return (
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
                    <MenuItem key={index} {...item} />
                ))}
            </ul>
        </div>
    );
}

export default ContextMenu;