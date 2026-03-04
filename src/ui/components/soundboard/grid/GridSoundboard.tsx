import styles from "./GridSoundboard.module.css";
import React, {MouseEvent, useCallback, useMemo, useState} from "react";
import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import DraggableButton from "./DraggableButton";
import {useWindow} from "../../../context/WindowContext";
import {usePlayer} from "../../../context/PlayerContext";
import {useContextMenu} from "../../../context/ContextMenuContext";
import {ContextMenuItemData} from "../../context_menu/ContextMenuItem";
import {PiBroomBold, PiCopyBold, PiFileBold, PiGearSixBold, PiPlayFill, PiPlaylistBold, PiStopBold, PiStopFill, PiTrashBold} from "react-icons/pi";
import {FaRegPaste} from "react-icons/fa6";
import {playerTrackFromBtn} from "../../../utils/utils";
import {useNavigation} from "../../../context/NavigationContext";
import {useGridProfiles} from "../../../context/GridProfilesProvider";
import {BtnStyle, SbGridBtn} from "../../../../types";

const GridSoundboard = () => {
    const {settings} = useWindow();
    const {activeProfile, boardType} = useGridProfiles();
    const {showContextMenu} = useContextMenu();
    const {player, previewPlayer} = usePlayer();
    const {navigate} = useNavigation();

    const [copiedButton, setCopiedButton] = useState<SbGridBtn | null>(null);
    const [copiedStyle, setCopiedStyle] = useState<BtnStyle | null>(null);

    const rows = activeProfile?.rows || 8;
    const cols = activeProfile?.cols || 10;

    const buttonMap = useMemo(() => {
        const map = new Map<string, SbGridBtn>();
        if (!activeProfile?.buttons) return map;

        for (const btn of activeProfile.buttons) {
            map.set(`${btn.row}-${btn.col}`, btn);
        }
        return map;
    }, [activeProfile?.buttons]);

    const onClick = (_: MouseEvent, button: SbGridBtn) => {
        if (!button || !button.track) return
        player.playNow(playerTrackFromBtn(button));
    }

    const onContextMenu = useCallback((event: MouseEvent, targetButton: SbGridBtn, row: number, col: number) => {
        const btn = targetButton || {id: '', row, col};
        const isButtonNotSet = !btn.track && btn;

        const getItems = (): ContextMenuItemData[] => {
            const items: ContextMenuItemData[] = [];

            if (!isButtonNotSet) {
                items.push(
                    {
                        label: 'Play Now',
                        icon: <PiPlayFill/>,
                        onClick: () => player.playNow(playerTrackFromBtn(btn))
                    },
                    {
                        label: 'Add to playlist',
                        icon: <PiPlaylistBold/>,
                        onClick: () => player.addToQueue(playerTrackFromBtn(btn))
                    }
                );
            }

            const isPreviewing = previewPlayer.getStatus().playing;
            if (!isButtonNotSet) {
                items.push({
                    label: isPreviewing ? 'Stop Preview' : 'Preview',
                    icon: isPreviewing ? <PiStopFill/> : <PiPlayFill/>,
                    onClick: () => isPreviewing ? previewPlayer.stop() : previewPlayer.playNow(playerTrackFromBtn(btn))
                });
            } else if (isPreviewing) {
                items.push({
                    label: 'Stop Preview',
                    icon: <PiStopBold/>,
                    onClick: () => previewPlayer.stop()
                });
            }

            if (items.length > 0) items.push({separator: true});

            items.push({
                label: 'Choose track',
                icon: <PiFileBold/>,
                onClick: () => window.electron.window.open('grid_media_selector', {
                    action: 'update_button',
                    profileId: activeProfile.id,
                    buttonId: btn.id !== '' ? btn.id : undefined,
                    gridPos: {row: btn.row, col: btn.col},
                })
            });

            if (!isButtonNotSet) {
                items.push(
                    {
                        label: 'Settings',
                        icon: <PiGearSixBold/>,
                        onClick: () => window.electron.window.open('grid_btn_settings', {
                            profileId: activeProfile.id,
                            buttonId: btn.id
                        })
                    },
                    {separator: true},
                    {
                        label: 'Copy button',
                        icon: <PiCopyBold/>,
                        onClick: () => setCopiedButton({...btn})
                    }
                );
            }

            if (copiedButton) {
                items.push(
                    {separator: !isButtonNotSet},
                    {
                        label: 'Paste button',
                        icon: <FaRegPaste/>,
                        onClick: () => {
                            window.electron.gridProfiles.buttons.update(boardType, activeProfile.id, btn.id, {
                                row: btn.row,
                                col: btn.col,
                                track: copiedButton.track?.id
                            });
                        }
                    }
                );
            }

            if (!isButtonNotSet) {
                items.push(
                    {separator: true},
                    {
                        label: 'Copy style',
                        icon: <PiCopyBold/>,
                        onClick: () => {
                            if (btn.style) setCopiedStyle({...btn.style});
                        },
                        disabled: !btn.style
                    },
                    {
                        label: 'Paste style',
                        icon: <FaRegPaste/>,
                        onClick: () => window.electron.gridProfiles.buttons.update(boardType, activeProfile.id, btn.id, {style: {...copiedStyle}}),
                        disabled: !copiedStyle
                    },
                    {
                        label: 'Clear style',
                        icon: <PiBroomBold/>,
                        onClick: () => window.electron.gridProfiles.buttons.update(boardType, activeProfile.id, btn.id, {style: null}),
                        disabled: !btn.style
                    },
                    {separator: true},
                    {
                        label: 'Clear',
                        icon: <PiTrashBold/>,
                        variant: 'danger',
                        onClick: () => {
                            if (settings && !settings.confirmButtonDeletion) {
                                window.electron.gridProfiles.buttons.delete(boardType, activeProfile.id, btn.id);
                            } else {
                                navigate('delete_confirmation', {
                                    replace: false,
                                    data: {
                                        resource: 'button',
                                        id: btn.id,
                                        onConfirm: () => window.electron.gridProfiles.buttons.delete(boardType, activeProfile.id, btn.id)
                                    }
                                });
                            }
                        }
                    }
                );
            }

            return items;
        }

        showContextMenu({items: getItems(), event});
    }, [activeProfile?.id, boardType, copiedButton, copiedStyle, navigate, player, previewPlayer, settings, showContextMenu]);

    const swapButtons = useCallback((fromRow: number, fromCol: number, toRow: number, toCol: number) => {
        const fromButton = buttonMap.get(`${fromRow}-${fromCol}`);
        const toButton = buttonMap.get(`${toRow}-${toCol}`);

        if (!fromButton && !toButton) return;

        // TODO Check if this is not necessary
        // if (fromButton && toButton) {
        //     [fromButton.row, fromButton.col, toButton.row, toButton.col] = [toButton.row, toButton.col, fromButton.row, fromButton.col];
        // } else if (fromButton && !toButton) {
        //     fromButton.row = toRow;
        //     fromButton.col = toCol;
        // } else if (toButton && !fromButton) {
        //     toButton.row = fromRow;
        //     toButton.col = fromCol;
        // }

        window.electron.gridProfiles.buttons.swap(boardType, activeProfile.id, {row: fromRow, col: fromCol}, {row: toRow, col: toCol});
    }, [activeProfile?.id, boardType, buttonMap]);

    if (!activeProfile) return null;

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
                        const button = buttonMap.get(`${row}-${col}`);
                        const hasTrack = button && !!button.track;
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
                                zoom={settings?.zoom || 1}
                                showImages={settings?.showImages || true}
                            />
                        );
                    })
                )}
            </div>
        </DndProvider>
    );
}

export default GridSoundboard;