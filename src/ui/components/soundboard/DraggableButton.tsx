import React, {useRef} from "react";
import {useDrag, useDrop} from 'react-dnd';
import SoundboardButton, {SoundboardButtonProps} from "./SoundboardButton";

type DraggableButtonProps = SoundboardButtonProps & {
    swapButtons: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void;
};

type DragItem = {
    row: number;
    col: number;
    type: string;
    exists: boolean;
};

const ItemTypes = {
    BUTTON: 'button',
};

const DraggableButton = ({row, col, button, onClick, onContextMenu, swapButtons}: DraggableButtonProps) => {
    const ref = useRef<HTMLDivElement>(null);

    const [{isDragging}, drag] = useDrag({
        type: ItemTypes.BUTTON,
        item: {row, col, type: ItemTypes.BUTTON, exists: !!button},
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        })
    }, [row, col, button]);

    const [{isOver, canDrop}, drop] = useDrop({
        accept: ItemTypes.BUTTON,
        canDrop: (draggedItem: DragItem) => {
            if (draggedItem.row === row && draggedItem.col === col) return false;

            const sourceIsEmpty = !draggedItem.exists;
            const targetIsEmpty = !button;
            return !(sourceIsEmpty && targetIsEmpty);
        },
        drop: (draggedItem: DragItem) => swapButtons(draggedItem.row, draggedItem.col, row, col),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }, [row, col, button, swapButtons]);

    drag(drop(ref));

    return (
        <SoundboardButton
            ref={ref}
            row={row}
            col={col}
            button={button}
            isDragging={isDragging}
            isDropping={isOver && canDrop}
            onClick={onClick}
            onContextMenu={onContextMenu}
        />
    );
};

export default DraggableButton;