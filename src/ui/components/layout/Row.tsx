import styles from './Row.module.css';
import {HTMLAttributes, PropsWithChildren} from "react";
import {clsx} from "clsx";

const Row = ({className, children}:  PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => {
    return (
        <div className={clsx(styles.row, className)}>
            {children}
        </div>
    )
}

export default Row;