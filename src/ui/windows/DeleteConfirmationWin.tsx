import styles from './DeleteConfirmationWin.module.css';
import {PiTrashBold, PiXBold} from "react-icons/pi";
import React, {ReactNode} from "react";
import {useNavigation} from "../context/NavigationContext";
import {useWindow} from "../context/WindowContext";
import {clsx} from "clsx";
import Button from "../components/misc/Button";
import {SbBtn} from "../../types/data";
import {getPosFromButtonId} from "../utils/utils";

export type ResourceType = 'profile' | 'button';

export type DeleteConfirmationData = {
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
    const {activeProfile, profiles} = useWindow();
    const {back, currentPage} = useNavigation();
    const data: DeleteConfirmationData = currentPage?.data as DeleteConfirmationData;

    if (!data) return null;

    let displayName;
    switch (data.resource) {
        case 'profile':
            displayName = profiles.find(p => p.id === data.id)?.name || data.id;
            break;
        case 'button': {
            const btn: SbBtn = activeProfile?.buttons.find(b => b.id === data.id);
            const pos = getPosFromButtonId(data.id);

            if (btn) {
                displayName = (btn.title || btn.track.title) + ` (${pos.row}-${pos.col})`;
            } else {
                displayName = `Button ${pos.row}-${pos.col}`;
            }
            break;
        }
        default:
            displayName = undefined;
            break;
    }

    if (!displayName) return null;

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