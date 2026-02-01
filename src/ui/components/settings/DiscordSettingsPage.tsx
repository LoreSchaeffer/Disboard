import styles from "./DiscordSettingsPage.module.css";
import Row from "../layout/Row";
import Col from "../layout/Col";
import React, {useEffect, useRef, useState} from "react";
import {useWindow} from "../../context/WindowContext";
import Toggle from "../forms/Toggle";
import {useAnimatedUnmount} from "../../hooks/useAnimatedUnmount";
import Input from "../forms/Input";
import {PiEyeBold, PiEyeSlashBold} from "react-icons/pi";
import Select from "../forms/Select";

const DiscordSettingsPage = () => {
    const {settings} = useWindow();

    const [showSettings, setShowSettings] = useState<boolean>(settings.discord.enabled);
    const {shouldRender, transitionProps} = useAnimatedUnmount(showSettings);
    const [token, setToken] = useState<string>(settings.discord.token || '');
    const [tokenVisible, setTokenVisible] = useState<boolean>(false);

    const tokenTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (settings) {
            setShowSettings(settings.discord.enabled);
            setToken(settings.discord.token || '');
        }
    }, [settings]);

    const handleEnabled = (enabled: boolean) => {
        settings.discord.enabled = true;
        setShowSettings(enabled);
        window.electron.updateSettings({discord: {...settings.discord, enabled: enabled}});
    }

    const handleTokenChange = (value: string) => {
        if (tokenTimeoutRef.current) clearTimeout(tokenTimeoutRef.current);

        setToken(value);

        tokenTimeoutRef.current = setTimeout(() => {
            window.electron.updateSettings({discord: {...settings.discord, token: value}});
        }, 500);
    }

    return (
        <div className={styles.page}>
            <Row className={styles.row}>
                <Col size={3}>
                    <label>Enabled</label>
                </Col>
                <Col>
                    <Toggle
                        checked={settings.discord.enabled}
                        onChange={(e) => handleEnabled(e.target.checked)}
                    />
                </Col>
            </Row>

            {shouldRender && (
                <div
                    {...transitionProps}
                >
                    <Row className={styles.row}>
                        <Col size={3}>
                            <label>Bot Token</label>
                        </Col>
                        <Col size={6}>
                            <Input
                                type={tokenVisible ? 'text' : 'password'}
                                value={token}
                                onChange={e => handleTokenChange(e.target.value)}
                                placeholder={"Bot Token"}
                                icon={tokenVisible ? <PiEyeSlashBold/> : <PiEyeBold/>}
                                iconSettings={{
                                    onClick: () => setTokenVisible(prev => !prev)
                                }}
                            />
                        </Col>
                    </Row>
                    <Row style={{marginBottom: '10px'}}>
                        <Col size={6}>
                            <label>Guild</label>
                        </Col>
                        <Col size={6}>
                            <label>Channel</label>
                        </Col>
                    </Row>
                    <Row className={styles.row}>
                        <Col size={6}>
                            <Select options={[]}/>
                        </Col>
                        <Col size={6}>
                            <Select options={[]}/>
                        </Col>
                    </Row>
                </div>
            )}
        </div>
    )
}

export default DiscordSettingsPage;
