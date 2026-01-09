import styles from './MediaSelectorWin.module.css';
import React, {useEffect, useMemo, useState} from "react";
import Button from "../misc/Button";
import {PiFloppyDiskBold, PiFolderOpenBold, PiGlobeBold, PiMagnifyingGlassBold, PiPlayBold, PiPlayFill, PiPlaylistBold, PiStopFill, PiXBold, PiYoutubeLogoFill} from "react-icons/pi";
import Separator from "../misc/Separator";
import {Track} from "../../../types/track";
import Input from "../forms/Input";
import {clsx} from "clsx";
import {formatTime, Time} from "../../utils/time";
import {YTSearchResult} from "../../../types/music-api";
import {usePlayer} from "../../context/PlayerContext";
import {getBestThumbnail} from "../../../utils/music-api";
import Col from "../layout/Col";
import Row from "../layout/Row";
import {useWindow} from "../../context/WindowContext";
import {MediaSelectorWindowData} from "../../../types/window";
import {MediaSelectorAction, TrackSource} from "../../../types/common";

const MediaSelectorWin = () => {
    const {data} = useWindow();
    const {previewPlayer, previewStatus} = usePlayer();
    const [action, setAction] = useState<MediaSelectorAction>(null);
    const [mode, setMode] = useState<TrackSource>('list');
    const [useMusicApi, setUseMusicApi] = useState<boolean>(false);
    const [selectedMedia, setSelectedMedia] = useState<YTSearchResult | string>(null);

    useEffect(() => {
        window.electron.useMusicApi().then(setUseMusicApi);
    }, []);

    useEffect(() => {
        if (!data || data.type !== 'media_selector') return;
        const winData = data.data as MediaSelectorWindowData;
        setAction(winData.action);
    }, [data]);

    const handleOnChange = (selected: YTSearchResult | string) => {
        setSelectedMedia(selected);
    }

    const playPausePreview = () => {
        if (previewStatus.playing) {
            previewPlayer.stop();
            return;
        }

        if (!selectedMedia) return;

        switch (mode) {
            case 'list':
                window.electron.getTrack(selectedMedia as string).then(track => {
                    if (track) previewPlayer.playNow(track);
                });
                break;
            case 'youtube': {
                const ytResult = selectedMedia as YTSearchResult;
                window.electron.getVideoStream(ytResult.id).then(res => {
                    if (res.success) {
                        const track: Track = {
                            id: `yt_${Date.now()}`,
                            title: ytResult.name,
                            duration: ytResult.duration,
                            source: {
                                type: 'youtube',
                                src: res.data.content
                            }
                        };
                        previewPlayer.playNow(track);
                    }
                });
                break;
            }
            case 'file': {
                const track: Track = {
                    id: `file_${Date.now()}`,
                    title: (selectedMedia as string).split('/').pop(),
                    duration: 0,
                    source: {
                        type: 'file',
                        src: selectedMedia as string
                    },
                };
                previewPlayer.playNow(track);
                break;
            }
            case 'url': {
                const track: Track = {
                    id: `url_${Date.now()}`,
                    title: selectedMedia as string,
                    duration: 0,
                    source: {
                        type: 'url',
                        src: selectedMedia as string
                    },
                };
                previewPlayer.playNow(track);
                break;
            }
        }
    }

    const canSubmit = useMemo(() => {
        if (!selectedMedia) return false;
        if (mode === 'youtube' && !(selectedMedia as YTSearchResult).id) return false;
        return !(mode !== 'youtube' && (selectedMedia as string).trim().length < 2);
    }, [selectedMedia, mode]);

    const handleSubmit = () => {
        if (!data || data.type !== 'media_selector') return;
        const winData = data.data as MediaSelectorWindowData;
        if (!canSubmit) return;

        if (action === 'play_now') {
            window.electron.playNow(mode, selectedMedia);
            window.electron.close();
        } else {
            window.electron.addTrack(mode, selectedMedia, winData.profileId, winData.buttonId).then((res) => {
                if (res.success) window.electron.close();
                else console.log('Failed to add track:', res.error);
            });
        }
    }

    return (
        <div className={'bordered'}>
            <div className={styles.tabBar}>
                <Button
                    variant={mode === 'list' ? 'primary' : 'secondary'}
                    icon={<PiPlaylistBold/>}
                    onClick={() => setMode('list')}
                >
                    List
                </Button>
                <Button
                    variant={mode === 'youtube' ? 'primary' : 'secondary'}
                    icon={<PiYoutubeLogoFill/>}
                    disabled={!useMusicApi}
                    onClick={() => setMode('youtube')}
                >
                    YouTube
                </Button>
                <Button
                    variant={mode === 'file' ? 'primary' : 'secondary'}
                    icon={<PiFolderOpenBold/>}
                    onClick={() => setMode('file')}
                >
                    File
                </Button>
                <Button
                    variant={mode === 'url' ? 'primary' : 'secondary'}
                    icon={<PiGlobeBold/>}
                    onClick={() => setMode('url')}
                >
                    URL
                </Button>
            </div>
            <Separator margin={'lg'}/>
            {mode === 'list' && <ListSelector onChange={handleOnChange}/>}
            {mode === 'youtube' && <YouTubeSelector onChange={handleOnChange}/>}
            {mode === 'file' && <FileSelector onChange={handleOnChange}/>}
            {mode === 'url' && <URLSelector onChange={handleOnChange}/>}

            <div className={'windowButtons'}>
                <Button
                    className={styles.previewBtn}
                    variant={'primary'}
                    icon={previewStatus.playing ? <PiStopFill/> : <PiPlayFill/>}
                    onClick={playPausePreview}
                >
                    {previewStatus.playing ? 'Stop' : 'Preview'}
                </Button>
                <Button
                    variant={'danger'}
                    icon={<PiXBold/>}
                    onClick={() => window.electron.close()}
                >
                    Cancel
                </Button>
                <Button
                    variant={'success'}
                    icon={action === 'play_now' ? <PiPlayBold/> : <PiFloppyDiskBold/>}
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                >
                    {action === 'play_now' ? 'Play Now' : 'Save'}
                </Button>
            </div>
        </div>
    )
};

type SelectorProps = {
    onChange?: (selected: YTSearchResult | string) => void;
}

const ListSelector = ({onChange}: SelectorProps) => {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [query, setQuery] = useState<string>('');
    const [selected, setSelected] = useState<string>(null);

    useEffect(() => {
        window.electron.getTracks().then(setTracks);
    }, []);

    const handleSelect = (trackId: string) => {
        setSelected(trackId);
        onChange?.(trackId);
    }

    const filteredTracks = useMemo(() => {
        if (!query) return tracks;

        const lowerQuery = query.toLowerCase();
        return tracks.filter(track => track.title.toLowerCase().includes(lowerQuery));
    }, [tracks, query]);

    return (
        <div>
            <Input
                type={'text'}
                icon={<PiMagnifyingGlassBold/>}
                placeholder={'Search...'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.mb}
            />

            <div className={styles.resultsContainer}>
                <div className={clsx(styles.results, filteredTracks.length === 0 && styles.noResults)}>
                    {filteredTracks.length === 0 && tracks.length === 0 && <span>No results</span>}
                    {filteredTracks.length === 0 && tracks.length > 0 && <span>No tracks match your search.</span>}
                    {filteredTracks.map(track => (
                        <div
                            key={track.id}
                            className={clsx(styles.result, selected === track.id && styles.active)}
                            onClick={() => handleSelect(track.id)}
                        >
                            <img
                                className={styles.resultThumbnail}
                                src={`music://images/${track.id}`}
                                alt={track.title || ''}
                                onError={(e) => {
                                    const img = e.currentTarget;
                                    img.onerror = null;
                                    img.src = '/images/track.png';
                                }}
                            />
                            <div className={styles.resultInfo}>
                                <span className={styles.resultTitle}>{track.title}</span>
                                <span className={styles.resultSource}>
                                    {track.source?.src || ''}
                                </span>
                            </div>
                            <span className={styles.resultDuration}>
                                {formatTime(new Time(track.duration || 0, 's'))}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const YouTubeSelector = ({onChange}: SelectorProps) => {
    const [query, setQuery] = useState<string>('');
    const [results, setResults] = useState<YTSearchResult[]>([]);
    const [searched, setSearched] = useState<boolean>(false);
    const [selected, setSelected] = useState<YTSearchResult>(null);

    const handleSelect = (result: YTSearchResult) => {
        setSelected(result);
        onChange?.(result);
    }

    return (
        <div>
            <Input
                type={'text'}
                icon={<PiMagnifyingGlassBold/>}
                placeholder={'Search...'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.mb}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        if (query.trim().length < 2) return;

                        setSearched(false);

                        window.electron.searchMusic(query).then(res => {
                            if (res.success) setResults(res.data);
                            else setResults([]);
                            setSearched(true);
                        });
                    }
                }}
            />

            <div className={styles.resultsContainer}>
                <div className={clsx(styles.results, results.length === 0 && styles.noResults)}>
                    {results.length === 0 && !searched && <span>Search something...</span>}
                    {results.length === 0 && searched && <span>No tracks match your search.</span>}
                    {results.map(result => (
                        <div
                            key={result.id}
                            className={clsx(styles.result, (selected != null && selected.id === result.id) && styles.active)}
                            onClick={() => handleSelect(result)}
                        >
                            <img
                                className={styles.resultThumbnail}
                                src={getBestThumbnail(result.thumbnails)}
                                alt={result.name || ''}
                                onError={(e) => {
                                    const img = e.currentTarget;
                                    img.onerror = null;
                                    img.src = '/images/track.png';
                                }}
                            />
                            <div className={styles.resultInfo}>
                                <span className={styles.resultTitle}>{result.name}</span>
                                <span className={styles.resultSource}>
                                    {result.url}
                                </span>
                            </div>
                            <span className={styles.resultDuration}>
                                {formatTime(new Time(result.duration || 0, 's'))}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const FileSelector = ({onChange}: SelectorProps) => {
    const [path, setPath] = useState<string>('');

    const handleChange = (newUrl: string) => {
        setPath(newUrl);
        onChange?.(newUrl);
    }

    const handleSearch = () => {
        window.electron.openFileMediaSelector().then(res => {
            if (res.success) handleChange(res.data);
            else handleChange('');
        });
    }

    return (
        <div>
            <Row stretch>
                <Col>
                    <Input
                        type={'text'}
                        placeholder={'File Path'}
                        value={path}
                        onChange={(e) => handleChange(e.target.value)}
                        className={styles.mb}
                    />
                </Col>
                <Col size={1}>
                    <Button
                        variant={'primary'}
                        icon={<PiFolderOpenBold/>}
                        style={{height: '30px'}}
                        onClick={handleSearch}
                    />
                </Col>
            </Row>
        </div>
    );
}

const URLSelector = ({onChange}: SelectorProps) => {
    const [url, setUrl] = useState<string>('');

    const handleChange = (newUrl: string) => {
        setUrl(newUrl);
        onChange?.(newUrl);
    }

    return (
        <div>
            <Input
                type={'url'}
                placeholder={'URL'}
                value={url}
                onChange={(e) => handleChange(e.target.value)}
                className={styles.mb}
            />
        </div>
    );
}

export default MediaSelectorWin;