import styles from './ContextMenuItem.module.css';
import {ReactElement, useEffect, useRef, useState} from "react";
import {GAP} from "../../hooks/useContextMenuPosition";
import {FaCaretRight} from "react-icons/fa6";
import ContextMenu from "./ContextMenu";
import {Variant} from "../../types/common";
import {clsx} from "clsx";

export type ContextMenuItemData = {
    label?: string,
    icon?: ReactElement,
    onClick?: () => void,
    disabled?: boolean
    variant?: Variant,
    separator?: boolean,
    children?: ContextMenuItemData[]
}

type ContextMenuItemProps = {
    item: ContextMenuItemData;
    onCloseRoot: () => void;
}

const HIDE_TIMEOUT = 200;

const ContextMenuItem = ({item, onCloseRoot}: ContextMenuItemProps) => {
    const [showSubmenu, setShowSubmenu] = useState<boolean>(false);
    const itemRef = useRef<HTMLLIElement>(null);
    const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        }
    }, []);

    if (item.separator) return <li className={clsx(styles.item, styles.separator)}/>;

    const handleClick = () => {
        if (item.disabled) return;
        item.onClick?.();
        onCloseRoot();
    }

    const handleMouseEnter = () => {
        if (item.disabled) return;

        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }

        setShowSubmenu(true);
    };

    const handleMouseLeave = () => {
        closeTimerRef.current = setTimeout(() => {
            setShowSubmenu(false);
        }, HIDE_TIMEOUT);
    };

    const getSubmenuPosition = () => {
        if (!itemRef.current) return {x: 0, y: 0};
        const rect = itemRef.current.getBoundingClientRect();
        return {
            x: rect.right + GAP,
            y: rect.top - GAP
        };
    };

    const currentRect = itemRef.current?.getBoundingClientRect() || null;

    return (
        <li
            ref={itemRef}
            className={clsx(styles.item, item.disabled && styles.disabled, item.variant && styles[item.variant])}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {item.icon && <span className={styles.icon}>{item.icon}</span>}
            <span style={{flex: 1}}>{item.label}</span>

            {item.children && <FaCaretRight/>}

            {item.children && showSubmenu && (
                <ContextMenu
                    isRoot={false}
                    pos={getSubmenuPosition()}
                    items={item.children}
                    onClose={onCloseRoot}
                    parentRect={currentRect}
                />
            )}
        </li>
    )
}

export default ContextMenuItem;