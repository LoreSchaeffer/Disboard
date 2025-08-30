import styles from "./Titlebar.module.css";
import TitlebarButton from "./TitlebarButton";
import {forwardRef, PropsWithChildren, ReactNode, useImperativeHandle, useState} from "react";
import {useWindowContext} from "../../context/WindowContext";

export type TitlebarProps = PropsWithChildren & {
    title?: string;
};

export type TitlebarRef = {
    setTitle: (title: string) => void;
    setChildren: (children: ReactNode | ReactNode[]) => void;
};

export const Titlebar = forwardRef<TitlebarRef, TitlebarProps>(
    (props, ref) => {
        const {
            title = 'Disboard',
            children
        } = props;

        const {resizable} = useWindowContext();

        const [t, setT] = useState<string>(title);
        const [c, setC] = useState<ReactNode | ReactNode[]>(children || []);

        useImperativeHandle(ref, () => ({
            setTitle: (title: string) => setT(title),
            setChildren: (children: ReactNode | ReactNode[]) => setC(children)
        }));

        return (
            <div className={styles.titlebar}>
                <div className={styles.leftData}>
                    <h1 className={styles.windowTitle}>{t}</h1>
                    {c}
                </div>
                <TitlebarButton onClick={() => window.electron.minimize()} icon="minimize"/>
                {resizable &&
                    <TitlebarButton onClick={() => window.electron.maximize()} icon="maximize"/>}
                <TitlebarButton onClick={() => window.electron.close()} icon="close" hoverColor="var(--red)"/>
            </div>
        );
    }
);