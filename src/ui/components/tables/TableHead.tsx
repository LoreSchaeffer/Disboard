import styles from './TableHead.module.css';
import {CSSProperties} from "react";
import {PiArrowDownBold, PiArrowUpBold} from "react-icons/pi";

type TableHeadProps = {
    id: string;
    text: string;
    sortable?: boolean;
    sort?: 'asc' | 'desc';
    style?: CSSProperties;
    onSort?: (id: string) => void;
}

const TableHead = ({
                       id,
                       text,
                       sortable = true,
                       sort,
                       style,
                       onSort
                   }: TableHeadProps) => {

    return (
        <>
            <th
                className={`${styles.th} ${sortable ? styles.sortable : ''}`}
                onClick={() => {
                    if (sortable) onSort?.(id);
                }}
                style={style}
            >
                <span>{text}</span>
                <span className={styles.sortIconWrapper}>
                    {sortable && sort === 'asc' && <PiArrowUpBold className={styles.sortIcon}/>}
                    {sortable && sort === 'desc' && <PiArrowDownBold className={styles.sortIcon}/>}
                </span>
            </th>
        </>
    )
}

export default TableHead;