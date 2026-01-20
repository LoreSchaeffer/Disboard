import styles from "./Soundboard.module.css";
import React, {MouseEvent, useState} from "react";
import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import DraggableButton from "./DraggableButton";
import {useWindow} from "../../context/WindowContext";
import {usePlayer} from "../../context/PlayerContext";
import {useContextMenu} from "../../context/ContextMenuContext";
import {ContextMenuItemData} from "../context_menu/ContextMenuItem";
import {PiBroomBold, PiCopyBold, PiFileBold, PiGearSixBold, PiPlayBold, PiPlaylistBold, PiStopBold, PiTrashBold} from "react-icons/pi";
import {FaRegPaste} from "react-icons/fa6";
import {SbButton, SbButtonStyle} from "../../../types/data";

const Soundboard = () => {
    const {activeProfile} = useWindow();
    const {showContextMenu} = useContextMenu();
    const {player, previewPlayer} = usePlayer();

    const [copiedButton, setCopiedButton] = useState<SbButton | null>(null);
    const [copiedStyle, setCopiedStyle] = useState<SbButtonStyle | null>(null);

    const rows = activeProfile?.rows || 8;
    const cols = activeProfile?.cols || 10;

    const onClick = (_: MouseEvent, button: SbButton) => {
        if (!button || !button.track) return
        player.playNow({...button.track, title: button.title || button.track.title});
    }

    const onContextMenu = (event: MouseEvent, button: SbButton, row: number, col: number) => {
        const playPreview = () => {
            if (!button || !button.track) return;
            previewPlayer.playNow({...button.track, title: button.title || button.track.title});
        }

        const stopPreview = () => {
            if (!previewPlayer.getStatus().playing) return;
            previewPlayer.stop();
        }

        const copyButton = () => {
            if (!button || !button.track) return;
            setCopiedButton({...button});
        }

        const copyStyle = () => {
            if (!button || !button.style) return;
            setCopiedStyle({...button.style});
        }

        const pasteButton = () => {
            if (!copiedButton) return;

            window.electron.saveButton(activeProfile.id, {row: row, col: col, ...copiedButton});
        }

        const pasteStyle = () => {
            if (!copiedStyle) return;
            window.electron.saveButton(activeProfile.id, {...button, style: {...copiedStyle}});
        }

        const clearStyle = () => {
            window.electron.saveButton(activeProfile.id, {...button, style: undefined});
        }

        const deleteButton = () => {
            if (!button) return;
            window.electron.deleteButton(activeProfile.id, row, col);
        }

        const isButtonNotSet = !button || !button.track;

        const items: ContextMenuItemData[] = [
            {
                label: 'Play Now',
                icon: <PiPlayBold/>,
                onClick: () => player.playNow({...button.track, title: button.title || button.track.title}),
                disabled: isButtonNotSet
            },
            {
                label: 'Add to queue',
                icon: <PiPlaylistBold/>,
                onClick: () => player.addToQueue({...button.track, title: button.title || button.track.title}),
                disabled: isButtonNotSet
            }
        ];

        if (button && button.track) {
            items.push({
                label: previewPlayer.getStatus().playing ? 'Stop Preview' : 'Preview',
                icon: previewPlayer.getStatus().playing ? <PiPlayBold/> : <PiPlayBold/>,
                onClick: () => previewPlayer.getStatus().playing ? stopPreview() : playPreview()
            });
        } else if (previewPlayer.getStatus().playing) {
            items.push({
                label: 'Stop Preview',
                icon: <PiStopBold/>,
                onClick: () => stopPreview()
            });
        }

        items.push(
            {separator: true},
            {
                label: 'Chose track',
                icon: <PiFileBold/>,
                onClick: () => window.electron.openMediaSelectorWin(row, col)
            },
            {
                label: 'Settings',
                icon: <PiGearSixBold/>,
                onClick: () => window.electron.openButtonSettingsWin(row, col)
            },
            {separator: true},
            {
                label: 'Copy button',
                icon: <PiCopyBold/>,
                onClick: () => copyButton(),
                disabled: isButtonNotSet
            },
            {
                label: 'Paste button',
                icon: <FaRegPaste/>,
                onClick: () => pasteButton(),
                disabled: !copiedButton
            },
            {separator: true},
            {
                label: 'Copy style',
                icon: <PiCopyBold/>,
                onClick: () => copyStyle(),
                disabled: !button || !button.style
            },
            {
                label: 'Paste style',
                icon: <FaRegPaste/>,
                onClick: () => pasteStyle(),
                disabled: !copiedStyle
            },
            {
                label: 'Clear style',
                icon: <PiBroomBold/>,
                onClick: () => clearStyle(),
                disabled: isButtonNotSet || !button.style
            },
            {separator: true},
            {
                label: 'Clear',
                icon: <PiTrashBold/>,
                variant: 'danger',
                onClick: () => deleteButton(),
                disabled: isButtonNotSet
            }
        );

        showContextMenu({items: items, event: event});
    }

    const swapButtons = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
        const fromButton = activeProfile.buttons.find(b => b.row === fromRow && b.col === fromCol);
        const toButton = activeProfile.buttons.find(b => b.row === toRow && b.col === toCol);

        if (!fromButton && !toButton) return;

        if (fromButton && toButton) {
            [fromButton.row, fromButton.col, toButton.row, toButton.col] = [toButton.row, toButton.col, fromButton.row, fromButton.col];
        } else if (fromButton && !toButton) {
            fromButton.row = toRow;
            fromButton.col = toCol;
        } else if (toButton && !fromButton) {
            toButton.row = fromRow;
            toButton.col = fromCol;
        }

        window.electron.saveProfile(activeProfile);
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div
                className={styles.soundboard}
                style={{
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    gridTemplateColumns: `repeat(${cols}, 1fr)`
                }}
            >
                {Array.from({length: rows}).map((_, row) =>
                    Array.from({length: cols}).map((_, col) => {
                        const button = activeProfile.buttons.find(b => b.row === row && b.col === col) || null;
                        return (
                            <DraggableButton
                                key={`btn-${row}-${col}`}
                                row={row}
                                col={col}
                                button={button || undefined}
                                onClick={onClick}
                                onContextMenu={onContextMenu}
                                swapButtons={swapButtons}
                            />
                        );
                    })
                )}
            </div>
        </DndProvider>
    );
}

export default Soundboard;