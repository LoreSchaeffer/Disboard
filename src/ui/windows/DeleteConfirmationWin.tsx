import styles from './DeleteConfirmationWin.module.css';
import {PiTrashBold, PiXBold} from "react-icons/pi";
import React, {ReactNode, useEffect, useState} from "react";
import {useNavigation} from "../context/NavigationContext";
import {clsx} from "clsx";
import Button from "../components/misc/Button";
import {BoardType, SbAmbientBtn, SbGridBtn} from "../../types";

export type ResourceType = 'profile' | 'button';

export type DeleteConfirmationData = {
    boardType: BoardType;
    resource: ResourceType;
    id: string;
    onConfirm?: () => void;
}

const stringsMap: Record<ResourceType, { header: string, message: (displayId: string) => ReactNode }> = {
    profile: {
        header: 'Delete Profile?',
        message: (displayId) => <>Are you sure you want to delete the profile <span className={styles.messageId}>{displayId}</span>?<br/>This action cannot be undone.</>
    },
    button: {
        header: 'Delete Button?',
        message: (displayId) => <>Are you sure you want to delete the button <span className={styles.messageId}>{displayId}</span>?<br/>This action cannot be undone.</>
    }
}

const DeleteConfirmationWin = () => {
    const {back, currentRoute} = useNavigation();
    const data: DeleteConfirmationData = currentRoute?.data as DeleteConfirmationData;
    const [displayName, setDisplayName] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!data) return;

        let isMounted = true;
        if (data.boardType === 'music' || data.boardType === 'sfx') {
            if (data.resource === 'profile') {
                window.electron.gridProfiles.get(data.boardType, data.id).then(profile => {
                    if (isMounted) setDisplayName(profile?.name || data.id);
                });
            } else if (data.resource === 'button') {
                window.electron.gridProfiles.getActive(data.boardType).then(profile => {
                    if (!profile) return;

                    const btn: SbGridBtn | undefined = profile.buttons.find(b => b.id === data.id);
                    if (!btn) return;

                    if (isMounted) {
                        const titleFallback = btn.title || btn.track?.title || 'Unknown Button';
                        setDisplayName(`${titleFallback} (${btn.row}-${btn.col})`);
                    }
                });
            }
        } else if (data.boardType === 'ambient') {
            if (data.resource === 'profile') {
                window.electron.ambientProfiles.get(data.id).then(profile => {
                    if (isMounted) setDisplayName(profile?.name || data.id);
                });
            } else if (data.resource === 'button') {
                window.electron.ambientProfiles.getActive().then(profile => {
                    if (!profile) return;

                    const btn: SbAmbientBtn | undefined = profile.buttons.find(b => b.id === data.id);
                    if (!btn) return;

                    if (isMounted) setDisplayName(btn.title || 'Unknown Button');
                })
            }
        }

        return () => {
            isMounted = false;
        };
    }, [data]);

    if (!data || !displayName) return null;

    return (
        <div className={styles.wrapper}>
            <div className={styles.content}>
                <div className={styles.header}>
                    <PiXBold className={styles.closeBtn} onClick={back}/>
                    <span className={styles.title}>{stringsMap[data.resource].header}</span>
                </div>

                <div className={styles.body}>
                    <span className={styles.message}>
                        {stringsMap[data.resource].message(displayName)}
                    </span>
                </div>

                <div className={clsx('windowButtons', styles.buttons)}>
                    <Button
                        variant={'primary'}
                        icon={<PiXBold/>}
                        onClick={back}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={'danger'}
                        icon={<PiTrashBold/>}
                        onClick={() => {
                            data.onConfirm?.();
                            back();
                        }}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default DeleteConfirmationWin;