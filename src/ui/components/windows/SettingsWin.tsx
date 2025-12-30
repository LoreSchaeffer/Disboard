import {useNavigation} from "../../context/NavigationContext";

const SettingsWin = () => {
    const {back} = useNavigation();

    return (
        <div onClick={back}>Go Back!</div>
    )
}

export default SettingsWin;