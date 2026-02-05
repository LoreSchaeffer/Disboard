import styles from "./Soundboard.module.css";
import React, {MouseEvent, useState} from "react";
import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import DraggableButton from "./DraggableButton";
import {useWindow} from "../../context/WindowContext";
import {usePlayer} from "../../context/PlayerContext";
import {useContextMenu} from "../../context/ContextMenuContext";
import {ContextMenuItemData} from "../context_menu/ContextMenuItem";
import {PiBroomBold, PiCopyBold, PiFileBold, PiGearSixBold, PiPlayFill, PiPlaylistBold, PiStopBold, PiStopFill, PiTrashBold} from "react-icons/pi";
import {FaRegPaste} from "react-icons/fa6";
import {BtnStyle, SbBtn} from "../../../types/data";
import {generateButtonId, playerTrackFromBtn} from "../../utils/utils";
import {useNavigation} from "../../context/NavigationContext";
import {useProfiles} from "../../context/ProfilesProvider";

const Soundboard = () => {
    const {settings} = useWindow();
    const {activeProfile} = useProfiles();
    const {showContextMenu} = useContextMenu();
    const {player, previewPlayer} = usePlayer();
    const {navigate} = useNavigation();

    const [copiedButton, setCopiedButton] = useState<SbBtn | null>(null);
    const [copiedStyle, setCopiedStyle] = useState<BtnStyle | null>(null);

    const rows = activeProfile?.rows || 8;
    const cols = activeProfile?.cols || 10;

    const onClick = (_: MouseEvent, button: SbBtn) => {
        if (!button || !button.track) return
        player.playNow(playerTrackFromBtn(button));
    }

    const onContextMenu = (event: MouseEvent, button: SbBtn, row: number, col: number) => {
        const playPreview = () => {
            if (!button || !button.track) return;
            previewPlayer.playNow(playerTrackFromBtn(button));
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

            window.electron.updateButton(activeProfile.id, generateButtonId(row, col), {...copiedButton, row: row, col: col});
        }

        const pasteStyle = () => {
            if (!copiedStyle) return;
            window.electron.updateButton(activeProfile.id, generateButtonId(row, col), {...button, style: {...copiedStyle}});
        }

        const clearStyle = () => {
            window.electron.updateButton(activeProfile.id, generateButtonId(row, col), {...button, style: null});
        }

        const deleteButton = () => {
            if (!button) return;

            if (settings && !settings.confirmButtonDeletion) {
                window.electron.deleteButton(activeProfile.id, generateButtonId(row, col));
            } else {
                navigate('delete_confirmation', {
                    replace: false,
                    data:
                        {
                            resource: 'button',
                            id: generateButtonId(button.row, button.col),
                            onConfirm: () => window.electron.deleteButton(activeProfile.id, generateButtonId(row, col))
                        }
                });
            }
        }

        const isButtonNotSet = !button || !button.track;

        const getItems = (): ContextMenuItemData[] => {
            const items: ContextMenuItemData[] = [];

            if (button && button.track) {
                items.push(
                    {
                        label: 'Play Now',
                        icon: <PiPlayFill/>,
                        onClick: () => {
                            if (button.track) player.playNow(playerTrackFromBtn(button));
                        },
                        disabled: isButtonNotSet
                    },
                    {
                        label: 'Add to playlist',
                        icon: <PiPlaylistBold/>,
                        onClick: () => {
                            if (button.track) player.addToQueue(playerTrackFromBtn(button));
                        },
                        disabled: isButtonNotSet
                    }
                );
            }

            if (button && button.track) {
                items.push({
                    label: previewPlayer.getStatus().playing ? 'Stop Preview' : 'Preview',
                    icon: previewPlayer.getStatus().playing ? <PiStopFill/> : <PiPlayFill/>,
                    onClick: () => previewPlayer.getStatus().playing ? stopPreview() : playPreview()
                });
            } else if (previewPlayer.getStatus().playing) {
                items.push({
                    label: 'Stop Preview',
                    icon: <PiStopBold/>,
                    onClick: () => stopPreview()
                });
            }

            if (items.length > 0) items.push({separator: true});

            items.push(
                {
                    label: 'Chose track',
                    icon: <PiFileBold/>,
                    onClick: () => window.electron.openWindow('media_selector', {
                        action: 'update_button',
                        profileId: activeProfile.id,
                        buttonId: generateButtonId(row, col)
                    })
                }
            );

            if (button && button.track) {
                items.push(
                    {
                        label: 'Settings',
                        icon: <PiGearSixBold/>,
                        onClick: () => window.electron.openWindow('button_settings', {
                            profileId: activeProfile.id,
                            buttonId: generateButtonId(row, col)
                        })
                    },
                    {separator: true},
                    {
                        label: 'Copy button',
                        icon: <PiCopyBold/>,
                        onClick: () => copyButton(),
                        disabled: isButtonNotSet
                    }
                );
            }

            if ((!button || !button.track) && copiedButton) {
                items.push(
                    {separator: true},
                    {
                        label: 'Paste button',
                        icon: <FaRegPaste/>,
                        onClick: () => pasteButton(),
                        disabled: !copiedButton
                    }
                );
            } else if (button && button.track) {
                items.push(
                    {
                        label: 'Paste button',
                        icon: <FaRegPaste/>,
                        onClick: () => pasteButton(),
                        disabled: !copiedButton
                    }
                );
            }

            if (button && button.track) {
                items.push(
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
            }

            return items;
        }

        showContextMenu({items: getItems(), event: event});
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

        if (fromButton) window.electron.updateButton(activeProfile.id, fromButton.id, {row: fromButton.row, col: fromButton.col});
        if (toButton) window.electron.updateButton(activeProfile.id, toButton.id, {row: toButton.row, col: toButton.col});
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
                        const button: SbBtn = activeProfile.buttons.find(b => b.row === row && b.col === col) || null;
                        const hasTrack = button && button.track;
                        const isDownloading = hasTrack && button.track.downloading;

                        return (
                            <DraggableButton
                                key={`btn-${row}-${col}`}
                                row={row}
                                col={col}
                                button={button || undefined}
                                onClick={hasTrack && !isDownloading ? onClick : undefined}
                                onContextMenu={!isDownloading || !hasTrack ? onContextMenu : undefined}
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