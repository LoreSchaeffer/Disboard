import styles from './NewProfileWin.module.css';
import {PiFloppyDiskBold, PiXBold} from "react-icons/pi";
import {useNavigation} from "../context/NavigationContext";
import Row from "../components/layout/Row";
import Col from "../components/layout/Col";
import Input from "../components/forms/Input";
import React, {useState} from "react";
import {removeNameInvalidChars} from "../../main/utils/validation";
import {validateName} from "../utils/validation";
import {useWindow} from "../context/WindowContext";
import Button from "../components/misc/Button";
import {clsx} from "clsx";

const NewProfileWin = () => {
    const {profiles} = useWindow();
    const {back} = useNavigation();
    const [profileName, setProfileName] = useState<string>('');
    const [profileNameError, setProfileNameError] = useState<string | undefined>(undefined);
    const [rows, setRows] = useState<number>(8);
    const [columns, setColumns] = useState<number>(10);

    const handleProfileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = removeNameInvalidChars(e.target.value);
        setProfileName(value);

        if (!validateName(value) || profiles.find(p => p.name.toLowerCase() === value.toLowerCase())) setProfileNameError('This name is not valid');
        else setProfileNameError(undefined);
    }

    const handleSubmit = () => {
        if (profileNameError) return;

        window.electron.createProfile({
            name: profileName,
            rows: rows,
            cols: columns
        }).then(res => {
            if (res.success) back();
            else console.error('Failed to create profile:', res.error);
        });
    }

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
                                value={columns}
                                onChange={(e) => setColumns(Number(e.target.value))}
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
                        disabled={profileNameError !== undefined}
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