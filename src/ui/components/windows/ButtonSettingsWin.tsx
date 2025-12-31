import styles from './ButtonSettingsWin.module.css';
import React, {useEffect, useState} from "react";
import {Profile, SbButton} from "../../../types/profiles";
import {useWindow} from "../../context/WindowContext";
import {ButtonWindowData} from "../../../types/window";
import Spinner from "../misc/Spinner";
import {useTitlebar} from "../../context/TitlebarContext";
import Input from "../forms/Input";
import {PiArrowCounterClockwiseBold, PiFloppyDiskBold, PiXBold} from "react-icons/pi";
import {validateButtonTitle} from "../../../utils/utils";
import Button from "../misc/Button";
import SoundboardButton from "../soundboard/SoundboardButton";
import Separator from "../misc/Separator";
import Select from "../forms/Select";
import Row from "../layout/Row";
import Col from "../layout/Col";

type Errors = {
    [key: string]: string;
}

const timeOptions = [
    {value: 's', label: 'Seconds'},
    {value: 'ms', label: 'Milliseconds'},
    {value: 'm', label: 'Minutes'}
]

const ButtonSettingsWin = () => {
    const {data} = useWindow();
    const {setTitlebarContent} = useTitlebar();
    const [profile, setProfile] = useState<Profile | undefined>(undefined);
    const [button, setButton] = useState<SbButton | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [errors, setErrors] = useState<Errors>({});
    const [newButton, setNewButton] = useState<Partial<SbButton>>({});

    useEffect(() => {
        if (!data || data.type !== 'button') return;

        const {profileId, buttonId} = data.data as ButtonWindowData;

        if (!profileId || !buttonId) {
            setError("Profile id of Button id missing.");
            setLoading(false);
            return;
        }

        setLoading(true);

        Promise.all([
            window.electron.getProfile(profileId),
            window.electron.getButton(profileId, buttonId)
        ]).then(([fetchedProfile, fetchedButton]) => {
            if (!fetchedProfile) throw new Error("Profile not found");
            if (!fetchedButton) throw new Error("Button not found");

            setProfile(fetchedProfile);
            setButton(fetchedButton);

            setTitlebarContent(
                <div className={styles.tbData}>
                    <span className={styles.tbProfile}>{fetchedProfile.name}</span>
                    <span className={styles.tbButton}>{fetchedButton.row} - {fetchedButton.col}</span>
                </div>,
                'centered'
            );
        }).catch((err) => {
            console.error(err);
            setError(err.message || "An error occurred while fetching data.");
        }).finally(() => {
            setLoading(false);
        });
    }, [data]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
            }}>
                <Spinner size={'lg'}/>
            </div>
        );
    }

    if (error || !profile || !button) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
            }}>
                <span className={styles.errorMessage}>{error || "Unknown error"}</span>
            </div>
        );
    }

    const performValidation = (btn: Partial<SbButton>): boolean => {
        const err: Errors = {};

        if (!btn.title && !button.title) err.title = 'Title is required';
        else if (btn.title && !validateButtonTitle(btn.title)) err.title = 'Title contains invalid characters';

        setErrors(err);
        return Object.keys(err).length === 0;
    }

    const handleTitleChange = (value: string) => {
        if (value === button.title) return;

        setNewButton(prev => {
            const updated = {...prev, title: value};
            performValidation(updated);
            return updated;
        });
    }

    const handleTitleReset = () => {
        setNewButton(prev => {
            const updated = {...prev};
            delete updated.title;
            performValidation(updated);
            return updated;
        });
    }

    return (
        <div className={'bordered'}>
            <Row>
                <Col size={4}>
                    <label>Title</label>
                </Col>
                <Col>
                    <Input
                        type={'text'}
                        value={newButton.title || button.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        icon={<PiArrowCounterClockwiseBold/>}
                        iconSettings={{
                            onClick: () => handleTitleReset(),
                            customStyles: {
                                opacity: 'title' in newButton ? 1 : 0.5,
                                cursor: 'title' in newButton ? 'pointer' : 'default'
                            }
                        }}
                        placeholder={"Title"}
                        error={errors.title}
                    />
                </Col>
            </Row>
            <Separator/>
            <Row className={styles.space}>
                <Col size={4}>
                    <label>Track starts after</label>
                </Col>
                <Col size={3}>
                    <Input
                        type={'number'}
                        placeholder={'Time'}
                        value={newButton.cropOptions?.startTime || button.cropOptions?.startTime || undefined}
                        min={0}
                    />
                </Col>
                <Col>
                    <Select
                        options={timeOptions}
                        value={newButton.cropOptions?.startTimeUnit || button.cropOptions?.startTimeUnit || 's'}
                    />
                </Col>
            </Row>
            <Row>
                <Col size={3}>
                    <label>Track ends</label>
                </Col>
                <Col size={3}>
                    <Select
                        options={[
                            {value: 'after', label: 'After'},
                            {value: 'at', label: 'At'}
                        ]}
                        value={newButton.cropOptions?.endTimeType || button.cropOptions?.endTimeType || 'after'}
                    />
                </Col>
                <Col size={2}>
                    <Input
                        type={'number'}
                        placeholder={'Time'}
                        value={newButton.cropOptions?.endTime || button.cropOptions?.endTime || undefined}
                        min={0}
                    />
                </Col>
                <Col>
                    <Select
                        options={timeOptions}
                        value={newButton.cropOptions?.endTimeUnit || button.cropOptions?.endTimeUnit || 's'}
                    />
                </Col>
            </Row>
            <Separator/>
            <div className={'row'}>
                <div className={'col-8'}>
                    <span>Test</span>
                </div>
                <div className={'col-4'}>
                    <SoundboardButton row={button.row} col={button.col} button={button}/>
                </div>
            </div>

            <div className={'windowButtons'}>
                <Button variant={'danger'} icon={<PiXBold/>}>Discard</Button>
                <Button variant={'success'} icon={<PiFloppyDiskBold/>}>Save</Button>
            </div>
        </div>
    )
};

export default ButtonSettingsWin;