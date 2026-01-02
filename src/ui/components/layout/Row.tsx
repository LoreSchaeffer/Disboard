import styles from './Row.module.css';
import {HTMLAttributes, PropsWithChildren} from "react";
import {clsx} from "clsx";

type RowProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
    stretch?: boolean;
}

const Row = ({stretch = false, className, children}: RowProps) => {
    return (
        <div className={clsx(styles.row, stretch && styles.stretch, className)}>
            {children}
        </div>
    )
}

export default Row;