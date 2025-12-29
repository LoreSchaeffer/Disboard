import styles from "./ContextMenu.module.css";
import ContextMenuItem, {ContextMenuItemData} from "./ContextMenuItem"
import {useContextMenuPosition} from "../../hooks/useContextMenuPosition";
import {createPortal} from "react-dom";
import {useEffect} from "react";
import {Position} from "../../types/common";

type ContextMenuProps = {
    pos: Position;
    items: ContextMenuItemData[];
    onClose: () => void;
    isRoot?: boolean;
    parentRect?: DOMRect | null;
}

const ContextMenu = ({
                         pos,
                         items,
                         onClose,
                         isRoot = false,
                         parentRect
                     }: ContextMenuProps) => {
    const {menuRef, position} = useContextMenuPosition(pos, true, !isRoot, parentRect);

    useEffect(() => {
        if (!isRoot) return;

        const handleInteraction = (e: Event) => {
            if (e.type === 'keydown') {
                const kEvent = e as KeyboardEvent;
                if (kEvent.key === 'Escape') {
                    onClose();
                }
                return;
            }

            if (e.type === 'mousedown') {
                const mEvent = e as MouseEvent;
                const target = mEvent.target as HTMLElement;
                if (target.closest('[data-context-menu="true"]')) {
                    return;
                }
                onClose();
                return;
            }

            onClose();
        };

        document.addEventListener("mousedown", handleInteraction);
        document.addEventListener("keydown", handleInteraction);
        window.addEventListener("scroll", handleInteraction, {capture: true});
        window.addEventListener("resize", handleInteraction);
        // window.addEventListener("blur", handleInteraction);

        return () => {
            document.removeEventListener("mousedown", handleInteraction);
            document.removeEventListener("keydown", handleInteraction);
            window.removeEventListener("scroll", handleInteraction, {capture: true});
            window.removeEventListener("resize", handleInteraction);
            // window.removeEventListener("blur", handleInteraction);
        };
    }, [isRoot, onClose]);

    const content = (
        <div
            ref={menuRef}
            className={styles.contextMenu}
            data-context-menu="true"
            style={{
                top: position.y,
                left: position.x
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            <ul>
                {items.map((item, index) => (
                    <ContextMenuItem
                        key={index}
                        item={item}
                        onCloseRoot={onClose}
                    />
                ))}
            </ul>
        </div>
    );

    return createPortal(content, document.body);
}

export default ContextMenu;