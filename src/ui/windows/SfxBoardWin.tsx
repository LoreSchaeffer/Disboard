import React, {useState} from "react";
import GridSoundboard from "../components/soundboard/grid/GridSoundboard";
import GridProfileSettings from "../components/soundboard/grid/GridProfileSettings";
import SfxControls from "../components/soundboard/grid/sfx/SfxControls";
import BoardWin from "./BoardWin";

const SfxBoardWin = () => {
    const [profileSettingsOpen, setProfileSettingsOpen] = useState<boolean>(false);

    return (
        <BoardWin>
            <GridSoundboard gridHeight={'calc(100vh - var(--titlebar-height) - var(--sfx-controls-height) - 10px)'}/>
            <SfxControls showProfileSettings={() => setProfileSettingsOpen(true)}/>

            <GridProfileSettings
                show={profileSettingsOpen}
                onClose={() => setProfileSettingsOpen(false)}
                mb={'calc(var(--sfx-controls-height) + 10px)'}
            />
        </BoardWin>
    )
}

export default SfxBoardWin;