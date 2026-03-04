import styles from './NewProfileWin.module.css';
import {PiFloppyDiskBold, PiXBold} from "react-icons/pi";
import {useNavigation} from "../context/NavigationContext";
import Row from "../components/layout/Row";
import Col from "../components/layout/Col";
import Input from "../components/forms/Input";
import React, {useEffect, useState} from "react";
import Button from "../components/misc/Button";
import {clsx} from "clsx";
import {removeNameInvalidChars, validateName} from "../../shared/validation";
import {BoardType, SbAmbientProfile, SbGridProfile} from "../../types";

export type NewProfileData = {
    boardType: BoardType;
}

const NewProfileWin = () => {
    const {back, currentRoute} = useNavigation();
    const data = currentRoute?.data as NewProfileData | undefined;
    const boardType = data?.boardType;
    const [profileName, setProfileName] = useState<string>('');
    const [profileNameError, setProfileNameError] = useState<string | undefined>(undefined);
    const [rows, setRows] = useState<number>(8);
    const [cols, setCols] = useState<number>(10);
    const [profiles, setProfiles] = useState<SbGridProfile[] | SbAmbientProfile[] | undefined>(undefined);

    useEffect(() => {
        if (boardType === 'ambient') {
            // TODO To implement
            setProfiles([]);
        } else {
            window.electron.gridProfiles.getAll(boardType).then(setProfiles);
        }
    }, [boardType]);

    if (!data || !boardType || !profiles) return null;

    const handleProfileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = removeNameInvalidChars(e.target.value);
        setProfileName(value);

        const isNameTaken = profiles.some(p => p.name.toLowerCase() === value.toLowerCase());

        if (!validateName(value) || isNameTaken) setProfileNameError('This name is not valid or already exists');
        else setProfileNameError(undefined);
    }

    const handleSubmit = () => {
        if (profileNameError) return;

        if (boardType === 'ambient') {
            // TODO To implement
        } else {
            window.electron.gridProfiles.create(boardType, {
                name: profileName,
                rows: rows,
                cols: cols
            }).then(res => {
                if (res.success) back();
                else console.error('Failed to create profile:', res.error);
            });
        }
    }

    const isSubmitDisabled = profileNameError !== undefined || profileName.trim() === '';

    return (
        <div className={styles.wrapper}>
            <div className={styles.content}>
                <div className={styles.header}>
                    <PiXBold className={styles.closeBtn} onClick={back}/>
                    <span className={styles.title}>New Profile</span>
                </div>

                <div className={styles.form}>
                    <Row className={styles.row}>
                        <Col size={3}>
                            <label>Profile Name</label>
                        </Col>
                        <Col size={5}>
                            <Input
                                type={'text'}
                                value={profileName}
                                onChange={handleProfileNameChange}
                                placeholder={'Profile Name'}
                                error={profileNameError}
                                autoFocus
                            />
                        </Col>
                    </Row>
                    <Row className={styles.row}>
                        <Col size={3}>
                            <label>Rows</label>
                        </Col>
                        <Col size={3}>
                            <Input
                                type={'number'}
                                value={rows}
                                onChange={(e) => setRows(Number(e.target.value))}
                                min={1}
                                max={50}
                                placeholder={'Rows'}
                                spinner
                            />
                        </Col>
                    </Row>
                    <Row className={styles.row}>
                        <Col size={3}>
                            <label>Columns</label>
                        </Col>
                        <Col size={3}>
                            <Input
                                type={'number'}
                                value={cols}
                                onChange={(e) => setCols(Number(e.target.value))}
                                min={1}
                                max={50}
                                placeholder={'Columns'}
                                spinner
                            />
                        </Col>
                    </Row>
                </div>

                <div className={clsx('windowButtons', styles.buttons)}>
                    <Button
                        variant={'danger'}
                        icon={<PiXBold/>}
                        onClick={back}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={'success'}
                        icon={<PiFloppyDiskBold/>}
                        disabled={isSubmitDisabled}
                        onClick={handleSubmit}
                    >
                        Create
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NewProfileWin;