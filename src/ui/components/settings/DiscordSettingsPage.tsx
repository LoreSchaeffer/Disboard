import styles from "./DiscordSettingsPage.module.css";
import Row from "../layout/Row";
import Col from "../layout/Col";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {useWindow} from "../../context/WindowContext";
import Toggle from "../forms/Toggle";
import {useAnimatedUnmount} from "../../hooks/useAnimatedUnmount";
import Input from "../forms/Input";
import {PiCircleFill, PiEyeBold, PiEyeSlashBold} from "react-icons/pi";
import Select, {Option} from "../forms/Select";
import {DiscordStatus} from "../../../types/discord";

const DiscordSettingsPage = () => {
    const {settings} = useWindow();

    const [showSettings, setShowSettings] = useState<boolean>(settings.discord.enabled);
    const {shouldRender, transitionProps} = useAnimatedUnmount(showSettings);

    const [token, setToken] = useState<string>(settings.discord.token || '');
    const [tokenVisible, setTokenVisible] = useState<boolean>(false);
    const tokenTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [guilds, setGuilds] = useState<Option[]>([]);
    const [guild, setGuild] = useState<string>('');

    const [channels, setChannels] = useState<Option[]>([]);
    const [channel, setChannel] = useState<string>('');

    const [status, setStatus] = useState<DiscordStatus>({ready: false, connected: false});

    useEffect(() => {
        const fetchStatus = () => {
            window.electron.getDiscordStatus().then(setStatus);
        }

        const intervalId = setInterval(fetchStatus, 2000);
        fetchStatus();

        return () => {
            clearInterval(intervalId);
        }
    }, []);

    useEffect(() => {
        if (status.ready) window.electron.getDiscordGuilds().then(guilds => setGuilds(guilds.map(g => ({label: g.name, value: g.id}))));
    }, [status.ready]);

    useEffect(() => {
        if (settings) {
            setShowSettings(settings.discord.enabled);
            setToken(settings.discord.token || '');

            if (settings.discord.lastGuild && settings.discord.lastGuild !== guild) {
                setGuild(settings.discord.lastGuild);
                fetchChannels(settings.discord.lastGuild, settings.discord.lastChannel);
            }
        }
    }, [settings]);

    const fetchChannels = useCallback((guildId: string, preselectChannelId?: string) => {
        if (!guildId) {
            setChannels([]);
            setChannel('');
            return;
        }

        window.electron.getDiscordChannels(guildId).then(res => {
            const channelOptions = res.map(c => ({label: c.name, value: c.id}));
            setChannels(channelOptions);

            if (preselectChannelId) {
                const exists = channelOptions.some(c => c.value === preselectChannelId);
                setChannel(exists ? preselectChannelId : '');
            } else {
                setChannel('');
            }
        });
    }, []);

    const handleEnabled = (enabled: boolean) => {
        setShowSettings(enabled);
        window.electron.updateSettings({discord: {...settings.discord, enabled: enabled}});
    }

    const handleTokenChange = (value: string) => {
        if (tokenTimeoutRef.current) clearTimeout(tokenTimeoutRef.current);

        setToken(value);

        if (value === '') value = null;

        tokenTimeoutRef.current = setTimeout(() => {
            window.electron.updateSettings({discord: {...settings.discord, token: value}});
        }, 500);
    }

    const handleGuildChange = (value: string) => {
        if (value === guild) return;

        setGuild(value);
        setChannel('');
        setChannels([]);
        fetchChannels(value);

        if (value === '') value = null;

        window.electron.updateSettings({
            discord: {...settings.discord, lastGuild: value, lastChannel: null}
        });
    }

    const handleChannelChange = (value: string) => {
        setChannel(value);

        if (value === '') value = null;

        window.electron.updateSettings({discord: {...settings.discord, lastChannel: value}});
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
                <Col>
                    {shouldRender && (
                        <PiCircleFill
                            {...transitionProps}
                            style={{
                                color: status.ready ? (status.connected ? 'var(--green-50)' : 'var(--yellow-50)') : 'var(--red-50)',
                                marginLeft: 'auto'
                            }}
                            title={status.ready ? (status.connected ? 'Connected' : 'Not connected') : 'Not ready'}
                        />
                    )}
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
                            <Select
                                options={guilds}
                                value={guild}
                                onChange={val => handleGuildChange(val as string)}
                            />
                        </Col>
                        <Col size={6}>
                            <Select
                                options={channels}
                                value={channel}
                                onChange={val => handleChannelChange(val as string)}
                            />
                        </Col>
                    </Row>
                </div>
            )}
        </div>
    )
}

export default DiscordSettingsPage;
