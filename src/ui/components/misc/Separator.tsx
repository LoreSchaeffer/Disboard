import styles from './Separator.module.css';
import {clsx} from "clsx";
import {Background} from "../../types/common";

type SeparatorProps = {
    background?: Background;
    width?: number;
    margin?: 'sm' | 'md' | 'lg' | number;
}

const Separator = ({
                       background = 'primary',
                       width = 100,
                       margin = 'md'
                   }: SeparatorProps) => {

    const marginValue = typeof margin === 'number' ? margin :
        margin === 'sm' ? 8 :
            margin === 'md' ? 16 :
                margin === 'lg' ? 24 : 8;

    return (
        <div className={styles.separatorWrapper}>
            <div
                className={clsx(
                    styles.separator,
                    styles[background]
                )}
                style={{
                    width: `${width}%`,
                    margin: `${marginValue}px 0`
                }}
            >
            </div>
        </div>
    )
}

export default Separator;