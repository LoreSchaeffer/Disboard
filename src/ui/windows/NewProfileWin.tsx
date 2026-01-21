import './NewProfileWin.css';
import Window from "./Window";
import InputField from "../generic/forms/InputField";
import React, {useState} from "react";
import Spinner from "../generic/forms/Spinner";
import Button from "../generic/Button";
import {useData} from "../../utils/windowContext";

const NewProfileWin = () => {
    const {winId} = useData();
    const [profileName, setProfileName] = useState<string>('');
    const [rows, setRows] = useState<number>(8);
    const [cols, setCols] = useState<number>(10);

    const handleProfileName = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value.length !== 0 && e.target.value.trim().length === 0) return;
        setProfileName(e.target.value);
        console.log(profileName);
    }

    const closeWindow = () => {
        (window as any).electron.close(winId);
    }

    const create = () => {
        (window as any).electron.createProfile(profileName, rows, cols);
        closeWindow();
    }

    return (
        <Window>
            <div className={"row"}>
                <label>Profile name</label>
                <InputField placeholder={"Profile name"} value={profileName} onChange={handleProfileName}/>
            </div>
            <div className={"row"}>
                <label>Rows</label>
                <Spinner value={rows} setValue={setRows} min={1} max={20}/>
            </div>
            <div className={"row"}>
                <label>Columns</label>
                <Spinner value={cols} setValue={setCols} min={1} max={20}/>
            </div>
            <div className={"buttons"}>
                <Button icon={"close"} className={"danger"} onClick={closeWindow}>Discard</Button>
                <Button icon={"add"} className={"success"} onClick={create} disabled={!profileName}>Create</Button>
            </div>
        </Window>
    );
};

export default NewProfileWin;