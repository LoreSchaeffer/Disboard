import styles from "./Titlebar.module.css";
import TitlebarButton from "./TitlebarButton";
import {PropsWithChildren} from "react";
import {useWindow} from "../../context/WindowContext";
import {PiListBold, PiMinusBold, PiSquareBold, PiXBold} from "react-icons/pi";
import {useNavigation} from "../../context/NavigationContext";
import {ContentPos} from "../../context/TitlebarContext";
import {clsx} from "clsx";

export type TitlebarProps = PropsWithChildren<{
    title?: string;
    contentPos?: ContentPos;
}>;

const Titlebar = ({title, contentPos = 'default', children}: TitlebarProps) => {
    const {resizable} = useWindow();
    const {navigate, isInStack, visibleStack} = useNavigation();

    return (
        <div className={styles.titlebar}>
            {visibleStack.find(s => s.page === 'main') && (
                <TitlebarButton
                    onClick={() => navigate('settings', {replace: false})}
                    disabled={isInStack('settings')}
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
                    onClick={() => window.electron.minimize()}
                    icon={PiMinusBold}
                />
                {resizable && (
                    <TitlebarButton
                        onClick={() => window.electron.maximize()}
                        icon={PiSquareBold}
                    />
                )}
                <TitlebarButton
                    onClick={() => window.electron.close()}
                    icon={PiXBold}
                    color={'red'}
                    className={styles.last}
                />
            </div>
        </div>
    );
};

export default Titlebar;