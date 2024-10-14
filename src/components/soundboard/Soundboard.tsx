import './Soundboard.css';

import {useData} from "../../ui/context";
import SoundboardButton from "./SoundboardButton";

const Soundboard = () => {
    const {activeProfile} = useData();

    const rows = activeProfile?.rows || 8;
    const cols = activeProfile?.cols || 10;
    const buttons = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            buttons.push(<SoundboardButton
                key={`btn-${row}-${col}`}
                row={row}
                col={col}
            />);
        }
    }

    return (
        <div className="soundboard" style={{
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gridTemplateColumns: `repeat(${cols}, 1fr)`
        }}>
            {buttons}
        </div>
    );
}

export default Soundboard;