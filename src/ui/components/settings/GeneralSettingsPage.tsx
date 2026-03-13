import styles from "./GeneralSettingsPage.module.css";
import React, {ChangeEvent} from "react";
import Row from "../layout/Row";
import {useWindow} from "../../context/WindowContext";
import Col from "../layout/Col";
import {BoardType} from "../../../types";
import Input from "../forms/Input";

const GeneralSettingsPage = () => {
    const {settings} = useWindow();

    const handleSelectBoard = (boardType: BoardType, checked: boolean) => {
        if (!settings) return;

        const currentStartupBoards = settings.openOnStartup || [];
        if (!checked && currentStartupBoards.length === 1 && currentStartupBoards.includes(boardType)) return;

        let newStartupBoards = [...currentStartupBoards];

        if (checked) {
            if (!newStartupBoards.includes(boardType)) newStartupBoards.push(boardType);
        } else {
            newStartupBoards = newStartupBoards.filter(b => b !== boardType);
        }

        if (newStartupBoards.length > 0) window.electron.settings.set({openOnStartup: newStartupBoards});
    }

    return (
        <div className={styles.page}>
            <Row className={styles.row} stretch={true}>
                <Col size={3}>
                    <label>Open at startup</label>
                </Col>
                <Col>
                    <BoardSelector
                        boardType={'music'}
                        active={settings.openOnStartup.includes('music')}
                        onChange={(e) => handleSelectBoard('music', e.target.checked)}
                    />
                    <BoardSelector
                        boardType={'sfx'}
                        active={settings.openOnStartup.includes('sfx')}
                        onChange={(e) => handleSelectBoard('sfx', e.target.checked)}
                    />
                    <BoardSelector
                        boardType={'ambient'}
                        active={settings.openOnStartup.includes('ambient')}
                        onChange={(e) => handleSelectBoard('ambient', e.target.checked)}
                    />
                </Col>
            </Row>
            <Row className={styles.row}>
                <Col size={4}>
                    <label>Show images in buttons</label>
                </Col>
                <Col>
                    <Input
                        type={'checkbox'}
                        checked={settings.showImages}
                        onChange={(e) => window.electron.settings.set({showImages: e.target.checked})}
                    />
                </Col>
            </Row>
            <Row className={styles.row}>
                <Col size={4}>
                    <label>Debug</label>
                </Col>
                <Col>
                    <Input
                        type={'checkbox'}
                        checked={settings.debug}
                        onChange={(e) => window.electron.settings.set({debug: e.target.checked})}
                    />
                </Col>
            </Row>
        </div>
    )
}

const BoardSelector = ({boardType, active, onChange}: { boardType: BoardType, active: boolean, onChange: (e: ChangeEvent<HTMLInputElement>) => void }) => {

    return (
        <div className={styles.boardSelector}>
            <Input type={'checkbox'} checked={active} onChange={onChange}/>
            <label>{boardType.charAt(0).toUpperCase() + boardType.slice(1)} Board</label>
        </div>
    )
}

export default GeneralSettingsPage;
