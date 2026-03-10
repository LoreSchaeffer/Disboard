import styles from "./Titlebar.module.css";
import TitlebarButton from "./TitlebarButton";
import React, {PropsWithChildren} from "react";
import {useWindow} from "../../context/WindowContext";
import {PiArrowSquareOutBold, PiGearSixFill, PiListBold, PiMinusBold, PiSquareBold, PiXBold} from "react-icons/pi";
import {StackEntry, useNavigation} from "../../context/NavigationContext";
import {ContentPos} from "../../context/TitlebarContext";
import {clsx} from "clsx";
import {ContextMenuItemData} from "../context_menu/ContextMenuItem";
import {useContextMenu} from "../../context/ContextMenuContext";

export type TitlebarProps = PropsWithChildren<{
    title?: string;
    contentPos?: ContentPos;
}>;

const isBoard = (visibleStack: StackEntry[]): boolean => {
    return visibleStack.some(s => s.route === 'music_board' || s.route === 'sfx_board' || s.route === 'ambient_board');
}

const Titlebar = ({title, contentPos = 'default', children}: TitlebarProps) => {
    const {resizable, data} = useWindow();
    const {navigate, visibleStack} = useNavigation();
    const {showContextMenu} = useContextMenu();

    const handleMenuClick = async (event: React.MouseEvent) => {
        const musicBoardOpen = await window.electron.window.isBoardOpen('music');
        const sfxBoardOpen = await window.electron.window.isBoardOpen('sfx');
        const ambientBoardOpen = await window.electron.window.isBoardOpen('ambient');

        const items: ContextMenuItemData[] = [
            {
                label: 'Music Board',
                icon: <PiArrowSquareOutBold/>,
                disabled: data.boardType === 'music' || musicBoardOpen,
                onClick: () => window.electron.window.open('music_board'),
            },
            {
                label: 'SFX Board',
                icon: <PiArrowSquareOutBold/>,
                disabled: data.boardType === 'sfx' || sfxBoardOpen,
                onClick: () => window.electron.window.open('sfx_board'),
            },
            {
                label: 'Ambient Board',
                icon: <PiArrowSquareOutBold/>,
                disabled: data.boardType === 'ambient' || ambientBoardOpen,
                onClick: () => window.electron.window.open('ambient_board'),
            },
            {separator: true},
            {
                label: 'Settings',
                icon: <PiGearSixFill/>,
                onClick: () => navigate('settings', {replace: false}),
            }
        ];

        const rect = (event.target as HTMLElement).getBoundingClientRect();

        showContextMenu({
            items: items,
            customPos: {x: rect.left, y: rect.bottom + 5},
        });
    }

    return (
        <div className={styles.titlebar}>
            {isBoard(visibleStack) && (
                <TitlebarButton
                    onClick={handleMenuClick}
                    icon={PiListBold}
                />
            )}
            <h1 className={styles.windowTitle}>{title}</h1>

            <div className={clsx(
                styles.injectedContent,
                contentPos === 'centered' && styles.centered
            )}>
                {children}
            </div>

            <div className={styles.windowControls}>
                <TitlebarButton
                    onClick={() => window.electron.window.minimize()}
                    icon={PiMinusBold}
                />
                {resizable && (
                    <TitlebarButton
                        onClick={() => window.electron.window.maximize()}
                        icon={PiSquareBold}
                    />
                )}
                <TitlebarButton
                    onClick={() => window.electron.window.close()}
                    icon={PiXBold}
                    color={'red'}
                    className={styles.last}
                />
            </div>
        </div>
    );
};

export default Titlebar;