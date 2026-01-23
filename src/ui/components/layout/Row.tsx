import styles from './Row.module.css';
import {HTMLAttributes, PropsWithChildren} from "react";
import {clsx} from "clsx";

type RowProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
    stretch?: boolean;
    noGap?: boolean;
}

const Row = ({stretch = false, noGap, className, children}: RowProps) => {
    return (
        <div
            className={clsx(styles.row, stretch && styles.stretch, className)}
            style={noGap ? {gap: 'unset'}: undefined}
        >
            {children}
        </div>
    )
}

export default Row;