import styles from './ProfileSelector.module.css';
import {FaChevronUp} from "react-icons/fa";
import {FaChevronDown} from "react-icons/fa6";
import React, {useState} from "react";
import {useContextMenu} from "../../context/ContextMenuContext";
import {useNavigation} from "../../context/NavigationContext";
import {useProfiles} from "../../context/ProfilesProvider";
import {ContextMenuItemData} from "../context_menu/ContextMenuItem";
import {BoardType, SbAmbientProfile, SbGridProfile} from "../../../types";
import {IoMdRadioButtonOff, IoMdRadioButtonOn} from "react-icons/io";
import {PiArrowSquareInBold, PiArrowSquareOutBold, PiPlusBold, PiTrashBold} from "react-icons/pi";

const ProfileSelector = () => {
    const {boardType, activeGridProfile, activeAmbientProfile, gridProfiles, ambientProfiles} = useProfiles();
    const {showContextMenu} = useContextMenu();
    const {navigate} = useNavigation();

    const [profileSelectorOpen, setProfileSelectorOpen] = useState<boolean>(false);

    const createContextMenu = (boardType: BoardType, profiles: SbGridProfile[] | SbAmbientProfile[], activeProfile: SbGridProfile | SbAmbientProfile): ContextMenuItemData[] => {
        return profiles.map(p => ({
            label: p.name,
            icon: activeProfile.id === p.id ? <IoMdRadioButtonOn/> : <IoMdRadioButtonOff/>,
            variant: activeProfile.id === p.id ? 'primary' : undefined,
            children: [
                {
                    label: 'Export',
                    icon: <PiArrowSquareOutBold/>,
                    onClick: () => {
                        if (boardType === 'ambient') window.electron.ambientProfiles.export(p.id)
                        else window.electron.gridProfiles.export(boardType as Exclude<BoardType, 'ambient'>, p.id);
                    }
                },
                {separator: true},
                {
                    label: 'Delete',
                    icon: <PiTrashBold/>,
                    variant: 'danger',
                    onClick: () => {
                        navigate('delete_confirmation', {
                            replace: false,
                            data: {
                                boardType: boardType,
                                resource: 'profile',
                                id: p.id,
                                onConfirm: () => {
                                    if (boardType === 'ambient') window.electron.ambientProfiles.delete(p.id)
                                    else window.electron.gridProfiles.delete(boardType as Exclude<BoardType, 'ambient'>, p.id);
                                }
                            }
                        });
                    },
                }
            ],
            onClick: () => window.electron.settings.set({[boardType]: {activeProfile: p.id}})
        }));
    };

    const handleProfileSelectorClick = (event: React.MouseEvent) => {
        const items = createContextMenu(
            boardType,
            boardType === 'ambient' ? ambientProfiles : gridProfiles,
            boardType === 'ambient' ? activeAmbientProfile : activeGridProfile
        );

        const rect = (event.target as HTMLElement).getBoundingClientRect();

        const defProfileSelectorItems: ContextMenuItemData[] = [
            {separator: true},
            {
                label: 'New profile',
                icon: <PiPlusBold/>,
                onClick: () => navigate('new_profile', {replace: false}),
            },
            {separator: true},
            {
                label: 'Import profile',
                icon: <PiArrowSquareInBold/>,
                onClick: () => {
                    if (boardType === 'ambient') window.electron.ambientProfiles.import();
                    else window.electron.gridProfiles.import(boardType as Exclude<BoardType, 'ambient'>);
                },
            },
            {
                label: 'Export all',
                icon: <PiArrowSquareOutBold/>,
                onClick: () => {
                    if (boardType === 'music') window.electron.ambientProfiles.exportAll();
                    else window.electron.gridProfiles.exportAll(boardType as Exclude<BoardType, 'ambient'>);
                },
            }
        ];

        showContextMenu({
            items: [...items, ...defProfileSelectorItems],
            customPos: {x: rect.left, y: rect.bottom + 5},
            onShow: () => setProfileSelectorOpen(true),
            onHide: () => setProfileSelectorOpen(false),
        });
    }

    return (
        <span className={styles.profileSelector} onClick={handleProfileSelectorClick}>
            {(boardType === 'ambient' ? activeAmbientProfile?.name : activeGridProfile?.name) || 'Select profile'}
            {profileSelectorOpen ? <FaChevronUp/> : <FaChevronDown/>}
        </span>
    )
}

export default ProfileSelector;