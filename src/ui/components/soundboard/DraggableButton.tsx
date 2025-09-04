import React, {useRef} from "react";
import {useDrag, useDrop} from 'react-dnd';
import SoundboardButton from "./SoundboardButton";
import {SbButton} from "../../../types/storage";

type DraggableButtonProps = {
    row: number;
    col: number;
    button?: SbButton;
    onClick: (e: React.MouseEvent, button: SbButton, row: number, col: number) => void;
    onContextMenu: (e: React.MouseEvent, btn: SbButton, row: number, col: number) => void;
    swapButtons: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void;
};

const ItemTypes = {
    BUTTON: 'button',
};

const DraggableButton = ({row, col, button, onClick, onContextMenu, swapButtons}: DraggableButtonProps) => {
    const ref = useRef<HTMLDivElement>(null);

    const [, drag] = useDrag({
        type: ItemTypes.BUTTON,
        item: {row, col},
    });

    const [, drop] = useDrop({
        accept: ItemTypes.BUTTON,
        drop: (item: { row: number; col: number }) => {
            swapButtons(item.row, item.col, row, col);
        },
    });

    drag(drop(ref));

    return (
        <SoundboardButton
            ref={ref}
            row={row}
            col={col}
            button={button}
            onClick={onClick}
            onContextMenu={onContextMenu}
        />
    );
};

export default DraggableButton;