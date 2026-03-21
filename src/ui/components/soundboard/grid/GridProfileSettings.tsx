import styles from './GridProfileSettings.module.css';
import Row from "../../layout/Row";
import Col from "../../layout/Col";
import {clsx} from "clsx";
import Input from "../../forms/Input";
import {useEffect, useRef, useState} from "react";
import {useClickOutside} from "../../../hooks/useClickOutside";
import {useAnimatedUnmount} from "../../../hooks/useAnimatedUnmount";
import {useProfiles} from "../../../context/ProfilesProvider";
import {validateName} from "../../../../shared/validation";
import {BoardType} from "../../../../types";

type ProfileSettingsProps = {
    show: boolean;
    onClose: () => void;
    mb?: string;
}

const GridProfileSettings = ({show, onClose, mb = '0px'}: ProfileSettingsProps) => {
    const {activeGridProfile, gridProfiles, boardType} = useProfiles();
    const {shouldRender, transitionProps} = useAnimatedUnmount(show);

    const [profileName, setProfileName] = useState<string>("");
    const [profileRows, setProfileRows] = useState<number>(8);
    const [profileCols, setProfileCols] = useState<number>(10);
    const [profileNameError, setProfileNameError] = useState<string | undefined>(undefined);

    const titleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const ref = useRef<HTMLDivElement>(null);
    useClickOutside(ref, () => {
        if (show) onClose();
    });

    useEffect(() => {
        if (activeGridProfile) {
            setProfileName(activeGridProfile.name);
            setProfileRows(activeGridProfile.rows);
            setProfileCols(activeGridProfile.cols);
            setProfileNameError(undefined);
        }
    }, [activeGridProfile]);

    const handleNameChange = (value: string) => {
        if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);

        if (!activeGridProfile) return;

        setProfileName(value);
        setProfileNameError(undefined);

        if (value.trim().length < 3 || value.trim().length > 32) {
            setProfileNameError("Name must be between 3 and 32 characters");
            return;
        }

        if (!validateName(value)) {
            setProfileNameError("Name contains invalid characters");
            return;
        }

        if (gridProfiles.filter(p => p.id !== activeGridProfile.id).find(p => p.name.toLowerCase() === value.trim().toLowerCase())) {
            setProfileNameError("A profile with this name already exists");
            return;
        }

        titleTimeoutRef.current = setTimeout(() => {
            window.electron.gridProfiles.update(boardType as Exclude<BoardType, 'ambient'>, activeGridProfile.id, {name: value});
        }, 500);
    }

    const handleRowsChange = (value: number) => {
        if (!activeGridProfile) return;
        setProfileRows(value);
        window.electron.gridProfiles.update(boardType as Exclude<BoardType, 'ambient'>, activeGridProfile.id, {rows: value});
    }

    const handleColsChange = (value: number) => {
        if (!activeGridProfile) return;
        setProfileCols(value);
        window.electron.gridProfiles.update(boardType as Exclude<BoardType, 'ambient'>, activeGridProfile.id, {cols: value});
    }

    if (!shouldRender) return null;

    return (
        <div
            ref={ref}
            className={clsx(styles.profileSettings, 'bordered')}
            {...transitionProps}
            style={{
                ...(transitionProps.style || {}),
                bottom: mb
            }}
        >
            <Row className={styles.margin}>
                <Col size={5}>
                    <label>Profile Name</label>
                </Col>
                <Col>
                    <Input
                        type={"text"}
                        value={profileName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder={"Profile name"}
                        error={profileNameError}
                    />
                </Col>
            </Row>

            <Row className={styles.margin}>
                <Col size={5}>
                    <label>Rows</label>
                </Col>
                <Col>
                    <Input
                        type={"number"}
                        value={profileRows}
                        onChange={(e) => handleRowsChange(Number(e.target.value))}
                        min={1}
                        max={50}
                        spinner
                    />
                </Col>
            </Row>

            <Row>
                <Col size={5}>
                    <label>Cols</label>
                </Col>
                <Col>
                    <Input
                        type={"number"}
                        value={profileCols}
                        onChange={(e) => handleColsChange(Number(e.target.value))}
                        min={1}
                        max={50}
                        spinner
                    />
                </Col>
            </Row>
        </div>
    )
}

export default GridProfileSettings;