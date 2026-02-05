import {useLayoutEffect, useRef, useState} from "react";
import {Position} from "../types/common";

export const GAP = 2;

export const useContextMenuPosition = (anchorPoint: Position, isOpen: boolean, isSubmenu: boolean, parentRect?: DOMRect | null) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<Position>(anchorPoint);

    useLayoutEffect(() => {
        if (!isOpen || !menuRef.current) return;

        const menuRect = menuRef.current.getBoundingClientRect();
        const {innerWidth, innerHeight} = window;

        let finalX = anchorPoint.x;
        let finalY = anchorPoint.y;

        if (isSubmenu) {
            if (finalX + menuRect.width > innerWidth) {
                if (parentRect) finalX = parentRect.left - menuRect.width - GAP;
                else finalX = innerWidth - menuRect.width - GAP;
            }
        } else {
            if (finalX + menuRect.width > innerWidth) finalX = innerWidth - menuRect.width - GAP;
        }

        if (finalY + menuRect.height > innerHeight) finalY = innerHeight - menuRect.height - GAP;

        finalX = Math.max(0, finalX);
        finalY = Math.max(0, finalY);

        setPosition((prev) => {
            if (prev.x === finalX && prev.y === finalY) return prev;
            return {x: finalX, y: finalY};
        });
    }, [isOpen, anchorPoint, isSubmenu, parentRect]);

    return {menuRef, position};
};