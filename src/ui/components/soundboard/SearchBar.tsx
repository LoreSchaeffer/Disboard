import styles from './SearchBar.module.css';
import Input from "../forms/Input";
import {PiXBold} from "react-icons/pi";
import {KeyboardEvent} from "react";
import {useAnimatedUnmount} from "../../hooks/useAnimatedUnmount";
import {clsx} from "clsx";

type SearchBarProps = {
    show: boolean;
    position?: {x: 'left' | 'right', y: 'top' | 'bottom'};
    onClose?: () => void;
    onChange?: (value: string) => void;
}

const SearchBar = ({show, onClose, position = {x: 'right', y: 'top'}, onChange}: SearchBarProps) => {
    const {shouldRender, transitionProps} = useAnimatedUnmount(show, {
        duration: 200,
        type: 'Zoom'
    });

    if (!shouldRender) return null;

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.ctrlKey && e.key === 'f' || e.key === 'Escape') {
            e.preventDefault();
            onClose?.();
        }
    }

    return (
        <div className={styles.wrapper}>
            <div className={clsx(styles.searchBar, styles[position.x], styles[position.y])} {...transitionProps}>
                <Input
                    background={'primary'}
                    placeholder="Search buttons... (Ctrl+F)"
                    autoFocus={true}
                    icon={<PiXBold/>}
                    iconSettings={{
                        onClick: () => onClose?.()
                    }}
                    onKeyDown={handleKeyDown}
                    onChange={e => onChange?.(e.target.value)}
                />
            </div>
        </div>
    )
}

export default SearchBar;
