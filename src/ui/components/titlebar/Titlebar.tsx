import styles from "./Titlebar.module.css";
import TitlebarButton from "./TitlebarButton";
import {PropsWithChildren} from "react";
import {useWindow} from "../../context/WindowContext";
import {PiListBold, PiMinusBold, PiSquareBold, PiXBold} from "react-icons/pi";
import {useNavigation} from "../../context/NavigationContext";

export type TitlebarProps = PropsWithChildren<{
    title?: string;
}>;

const Titlebar = ({title, children}: TitlebarProps) => {
    const {resizable} = useWindow();
    const {navigate, visibleStack} = useNavigation();

    return (
        <div className={styles.titlebar}>
            <TitlebarButton
                onClick={() => navigate('settings', false)}
                disabled={visibleStack.indexOf('settings') !== -1}
                icon={PiListBold}
            />
            <div className={styles.leftData}>
                <h1 className={styles.windowTitle}>{title}</h1>
                <div className={styles.injectedContent}>
                    {children}
                </div>
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