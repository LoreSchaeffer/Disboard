import './Select.css';
import {useEffect, useRef, useState} from "react";
import SvgIcon from "../SvgIcon";
import {IconType} from "../../../ui/icons";

type SelectOption = {
    value: string;
    label: string;
    selected?: boolean;
};

type SelectProps = {
    className?: string;
    options: SelectOption[];
    disabled?: boolean;
    onChange?: (value: string) => void;
};

const Select = ({className, options, disabled, onChange}: SelectProps) => {
    const selectRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [selected, setSelected] = useState<SelectOption | null>(null);
    const [chevron, setChevron] = useState<IconType>('chevron_down');
    const [position, setPosition] = useState({x: 0, y: 0, min_width: 0});
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (options && options.length > 0) {
            const selectedOption = options.find(o => o.selected);
            if (selectedOption) setSelected(selectedOption);
            else setSelected(options[0]);
        }
    }, [options]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                selectRef.current && !selectRef.current.contains(e.target as Node)) setVisible(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (visible) setChevron('chevron_up');
        else setChevron('chevron_down');
    }, [visible]);

    useEffect(() => {
        if (visible && disabled) setVisible(false);
    }, [disabled]);

    const onDropdown = () => {
        if (disabled) return;
        if (visible) {
            setVisible(false);
        } else {
            if (selectRef) {
                const selectRect = selectRef.current.getBoundingClientRect();
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                let newX = selectRect.left;
                let newY = selectRect.bottom + 4;

                if (position.x + selectRect.width > windowWidth) newX = position.x - selectRect.width;
                if (position.y + selectRect.height > windowHeight) newY = position.y - selectRect.height;

                setPosition({x: newX, y: newY, min_width: selectRect.width});
                setVisible(true);
            }
        }
    };

    const select = (value: string) => {
        const option = options.find(o => o.value === value);
        if (option) {
            setSelected(option);
            setVisible(false);
            if (onChange) onChange(value);
        }
    };

    return (
        <>
            <div ref={selectRef} className={`select${className ? ' ' + className : ''}${disabled ? ' disabled' : ''}`} onClick={onDropdown}>
                <span className={'selected-option'}>{selected ? selected.label : 'Select an option'}</span>
                <SvgIcon icon={chevron} size={'9pt'}/>
            </div>
            {options && (
                <div ref={dropdownRef} className={'select-dropdown'} style={{display: visible ? 'flex' : 'none', top: position.y, left: position.x, minWidth: position.min_width}}>
                    {options.map((option, index) => (
                        <div key={index} className={`select-option${selected === option ? ' selected' : ''}`} onClick={() => select(option.value)}>
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </>
    )
};

export default Select;