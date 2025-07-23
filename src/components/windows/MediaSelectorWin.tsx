import './MediaSelectorWin.css';
import Window from "./Window";
import React, {ChangeEvent, useEffect, useState} from "react";
import {useButton} from "../../ui/buttonContext";
import {useData} from "../../ui/windowContext";
import {SbButton, Song} from "../../utils/store/profiles";
import Button from "../generic/Button";
import InputField from "../generic/forms/InputField";
import Separator from "../generic/Separator";
import {formatTime, getBiggestThumbnail, isRemoteUrl, isYouTubeUrl} from "../../ui/utils";
import SvgIcon from "../generic/SvgIcon";
import {YouTubeVideo} from "play-dl";
import OpenDialogReturnValue = Electron.OpenDialogReturnValue;

const ButtonSettingsWin = () => {
        const {settings, winId, winParent, previewPlayer} = useData();
        const {button, hasButton} = useButton();
        const [uriField, setUriField] = useState('');
        const [searchField, setSearchField] = useState('');
        const [searchResults, setSearchResults] = useState<YouTubeVideo[]>(undefined);
        const [selectedResult, setSelectedResult] = useState<YouTubeVideo | null>(null);
        const [playing, setPlaying] = useState<YouTubeVideo | null>(null);

        useEffect(() => {
            const handleStop = () => setPlaying(null);

            previewPlayer.addEventListener('stop', handleStop);

            return () => {
                previewPlayer.removeEventListener('stop', handleStop);
            }
        }, [previewPlayer]);

        useEffect(() => {
            if (button) {
                setUriField(button.song?.original_url);
            }
        }, []);

        const openMediaSelector = () => {
            (window as any).electron.openFileMediaSelector().then((response: OpenDialogReturnValue) => {
                if (response.canceled) return;
                setUriField(response.filePaths[0]);
            });
        }

        const handleSearchFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
            setSearchField(e.target.value);
        }

        const handleUriFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
            setUriField(e.target.value);
        }

        const search = () => {
            setSelectedResult(null);
            if (isYouTubeUrl(searchField)) {
                (window as any).electron.getVideo(searchField)
                    .then((result: YouTubeVideo) => setSearchResults([result]));
            } else {
                (window as any).electron.search(searchField)
                    .then((results: YouTubeVideo[]) => setSearchResults(results));
            }
        }

        const openUrl = (url: string) => {
            (window as any).electron.openLink(url);
        }

        const preview = async (e: React.MouseEvent, result: YouTubeVideo) => {
            e.stopPropagation();

            if (playing) {
                previewPlayer.stop();
                return;
            }

            const url = await (window as any).electron.getStream(result.url);
            if (!url) return;

            (window as any).electron.pause();
            previewPlayer.playNow({
                title: result.title,
                uri: url
            } as Song);

            setPlaying(result);
        }

        const selectResult = (result: YouTubeVideo) => {
            setSelectedResult(result);
            setUriField(result.url);
        }

        const closeWindow = () => {
            (window as any).electron.close(winId);
        };

        const save = async () => {
            let song;
            if (selectedResult) {
                song = {
                    title: selectedResult.title,
                    source: 'youtube',
                    id: selectedResult.id,
                    original_url: selectedResult.url,
                    uri: null,
                    duration: selectedResult.durationInSec * 1000,
                    thumbnail: getBiggestThumbnail(selectedResult).url
                } as Song;
            } else {
                if (isYouTubeUrl(uriField)) {
                    const video = await (window as any).electron.getVideo(uriField);
                    song = {
                        title: video.title,
                        source: 'youtube',
                        id: video.id,
                        original_url: video.url,
                        uri: null,
                        duration: video.durationInSec * 1000,
                        thumbnail: getBiggestThumbnail(video).url
                    } as Song;
                } else if (isRemoteUrl(uriField)) {
                    song = {
                        title: uriField,
                        source: 'remote',
                        original_url: uriField,
                        uri: null,
                        duration: null,
                        thumbnail: null
                    }
                } else {
                    const sep = await (window as any).electron.getFileSeparator();
                    song = {
                        title: uriField.split(sep).slice(-1)[0].split('.')[0],
                        source: 'local',
                        original_url: uriField,
                        uri: uriField,
                        duration: null,
                        thumbnail: null
                    }
                }
            }

            if (!hasButton) {
                (window as any).electron.playNow(song);
            } else {
                if (winParent === 1) {
                    const btn: SbButton = button;
                    btn.song = song as Song;
                    btn.title = song.title;

                    (window as any).electron.saveButton(settings.active_profile, btn);
                } else {
                    (window as any).electron.returnSong(song, winId);
                }
            }

            (window as any).electron.close(winId);
        };

        const displaySearchResults = () => {
            if (searchResults === undefined) {
                return <span className={"placeholder"}>Perform a search to see the results...</span>;
            } else if (searchResults.length === 0) {
                return <span className={"placeholder"}>Your search did not yield any results.</span>;
            } else {
                return searchResults.map((result: YouTubeVideo) => {
                    return (
                        <div className={`result${selectedResult != null && selectedResult.id === result.id ? " active" : ""}`} key={result.id} onClick={() => selectResult(result)}>
                            <div className={"result-thumbnail"} style={{backgroundImage: `url(${getBiggestThumbnail(result).url}`}}></div>
                            <div className={"result-info"}>
                                <span className={"result-title"}>{result.title}</span>
                                <span className={"result-url"} onClick={() => openUrl(result.url)}>{result.url}</span>
                            </div>
                            <span className={"result-duration"}>{formatTime(result.durationInSec * 1000)}</span>
                            <SvgIcon icon={playing != null && playing.id === result.id ? 'pause' : 'play'} className={"preview-button"} size={"20px"} onClick={(e: React.MouseEvent) => preview(e, result)}/>
                        </div>
                    );
                });
            }
        }

        if (hasButton && button === undefined) {
            return <Window/>
        } else {
            return (
                <Window titlebar={hasButton ? <span className={"subtitle"}>{hasButton ? `Button ${button.row}.${button.col}` : 'Button'}</span> : undefined}>
                    <div className={"row"}>
                        <label>File or Url</label>
                        <InputField type={"text"} value={uriField} onChange={handleUriFieldChange}/>
                        <Button icon={"folder_open"} className={'primary'} onClick={openMediaSelector}>Open</Button>
                    </div>
                    <Separator/>
                    <div className={"row"}>
                        <label>Search</label>
                        <InputField type={"text"} placeholder={"Title or content"} autoFocus={true} onChange={handleSearchFieldChange} onSubmit={search}/>
                        <Button icon={"search"} className={'primary'} onClick={search}>Search</Button>
                    </div>
                    <div className={"results-container"}>
                        {displaySearchResults()}
                    </div>
                    <div className={"buttons"}>
                        <Button icon={"close"} className={"danger"} onClick={closeWindow}>{hasButton ? "Discard" : "Close"}</Button>
                        <Button icon={hasButton ? "save" : "play"} className={"success"} disabled={uriField == null || uriField.trim() === ''} onClick={save}>{hasButton ? "Save" : "Play"}</Button>
                    </div>
                </Window>
            );
        }
    }
;

export default ButtonSettingsWin;