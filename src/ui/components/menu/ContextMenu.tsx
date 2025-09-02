import styles from "./ContextMenu.module.css";
import ContextMenuItem, {MenuItemProps} from "./ContextMenuItem";
import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {useWindowContext} from "../../context/WindowContext";

export type ContextMenuProps = {
    x?: number;
    y?: number;
    xAnchor?: "left" | "right";
    yAnchor?: "top" | "bottom";
    show?: boolean;
    items: MenuItemProps[];
    style?: React.CSSProperties;
    parent?: number;
    onChildHover?: () => void;
    onChildLeave?: () => void;
};

export type ContextMenuRef = {
    element: HTMLDivElement | null;
    showMenu: (x: number, y: number) => void;
    hideMenu: () => void;
    didClickInside: (e: MouseEvent) => boolean;
};

const HIDE_TIMEOUT = 100;

const ContextMenu = forwardRef<ContextMenuRef, ContextMenuProps>((
        {
            x = 0,
            y = 0,
            xAnchor = "left",
            yAnchor = "top",
            show = false,
            items,
            style,
            parent,
            onChildHover,
            onChildLeave
        }: ContextMenuProps,
        ref
    ) => {
        const {setContextMenu} = useWindowContext();

        const [position, setPosition] = useState<{ x: number; y: number }>({x: x ?? 0, y: y ?? 0});
        const [visible, setVisible] = useState<boolean>(false);

        const menuRef = useRef<HTMLDivElement | null>(null);
        const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        const submenusRef = useRef<Record<number, ContextMenuRef | null>>({});

        useEffect(() => {
            const onClickOutside = (e: MouseEvent) => {
                if (didClickInside(e)) return;

                hideMenu();
            };

            document.addEventListener("mousedown", onClickOutside);

            return () => {
                document.removeEventListener("mousedown", onClickOutside);

                if (hideTimeoutRef.current) {
                    clearTimeout(hideTimeoutRef.current);
                    hideTimeoutRef.current = null;
                }
            }
        }, []);

        useEffect(() => {
            if (!menuRef.current || parent != null) {
                setPosition({x, y});
                return;
            }

            const menuRect = menuRef.current.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            let finalX = x ?? 0;
            let finalY = y ?? 0;

            if (xAnchor === "right") finalX = (x ?? 0) - menuRect.width;
            if (yAnchor === "bottom") finalY = (y ?? 0) - menuRect.height;

            if (finalX + menuRect.width > windowWidth) finalX = Math.max(0, windowWidth - menuRect.width);
            if (finalY + menuRect.height > windowHeight) finalY = Math.max(0, windowHeight - menuRect.height);
            if (finalX < 0) finalX = 0;
            if (finalY < 0) finalY = 0;

            setPosition({x: finalX, y: finalY});
            if (show) setVisible(true);
        }, [x, y, xAnchor, yAnchor, items]);

        const showSubmenu = (e: HTMLElement, index: number) => {
            const submenu = submenusRef.current[index];
            if (!submenu) return;

            const position = getSubmenuPosition(e, submenu);
            submenu.showMenu(position.x, position.y);
        }

        const hideSubmenu = (index: number) => {
            submenusRef.current[index]?.hideMenu();
        }

        const showMenu = (x: number, y: number) => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }

            if (x && y) setPosition({x, y});
            setVisible(true);
        }

        const hideMenu = () => {
            if (parent != null) {
                hideTimeoutRef.current = setTimeout(() => setVisible(false), HIDE_TIMEOUT);
            } else {
                setVisible(false);
                setContextMenu(null);
            }
        }

        const getSubmenuPosition = (e: HTMLElement, submenu: ContextMenuRef) => {
            if (!menuRef.current) return {x: 0, y: 0};

            const itemRect = e.getBoundingClientRect();
            const containerRect = menuRef.current.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            let finalX = containerRect.right + 2;
            let finalY = itemRect.top;

            const submenuRect = submenu.element.getBoundingClientRect();

            if (finalX + submenuRect.width > windowWidth) finalX = containerRect.left - submenuRect.width - 2;
            if (finalY + submenuRect.height > windowHeight) finalY = Math.max(0, windowHeight - submenuRect.height);

            if (finalX < 0) finalX = 0;
            if (finalY < 0) finalY = 0;

            return {x: finalX, y: finalY};
        }

        const onHover = () => {
            if (parent != null) onChildHover?.();

            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }
        }

        const onLeave = () => {
            if (parent != null) {
                onChildLeave?.();
                hideTimeoutRef.current = setTimeout(() => setVisible(false), HIDE_TIMEOUT);
            }
        }

        const handleChildHover = () => {
            if (parent == null) return;

            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }
        }

        const handleChildLeave = () => {
            if (parent == null) return;

            hideTimeoutRef.current = setTimeout(() => setVisible(false), HIDE_TIMEOUT);
        }

        const didClickInside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (menuRef.current && menuRef.current.contains(target)) return true;

            for (const submenu of Object.values(submenusRef.current)) {
                if (submenu && submenu.didClickInside(e)) return true;
            }

            return false;
        }

        useImperativeHandle(ref, () => ({
            element: menuRef.current,
            showMenu: showMenu,
            hideMenu: hideMenu,
            didClickInside: didClickInside
        }));

        return (
            <>
                <div
                    ref={(e) => {
                        menuRef.current = e;
                        if (typeof ref === "function") ref({element: e, showMenu, hideMenu, didClickInside});
                        else if (ref && typeof ref === "object") ref.current = {element: e, showMenu, hideMenu, didClickInside};
                    }}
                    className={styles.contextMenu}
                    style={{
                        ...style,
                        position: "fixed",
                        top: `${position.y}px`,
                        left: `${position.x}px`,
                        opacity: visible ? 1 : 0,
                        pointerEvents: visible ? "auto" : "none",
                    }}

                    onMouseEnter={onHover}
                    onMouseLeave={onLeave}
                >
                    <ul>
                        {items.map((item, index) => (
                            <ContextMenuItem
                                key={index}
                                {...item}
                                showSubmenu={(e) => showSubmenu(e, index)}
                                hideSubmenu={() => hideSubmenu(index)}
                            />
                        ))}
                    </ul>
                </div>

                {items.filter(item => item.submenu).map((item, index) => {
                    return (
                        <ContextMenu
                            ref={(e) => {
                                submenusRef.current[index] = e;
                            }}
                            key={index}
                            x={0}
                            y={0}
                            xAnchor={xAnchor}
                            yAnchor={yAnchor}
                            items={item.submenu.items}
                            style={item.submenu.style}
                            show={false}
                            parent={index}
                            onChildHover={handleChildHover}
                            onChildLeave={handleChildLeave}
                        />
                    )
                })}
            </>
        );
    }
);

export default ContextMenu;