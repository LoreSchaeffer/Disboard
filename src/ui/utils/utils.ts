import {ElementType} from "react";
import {PiSpeakerHighBold, PiSpeakerLowBold, PiSpeakerNoneBold} from "react-icons/pi";

export const validateHexColor = (color: string): boolean => {
    return /^#[0-9A-F]{6}$/i.test(color) || /^#[0-9A-F]{3}$/i.test(color);
}

export const getAudioDevices = async (): Promise<MediaDeviceInfo[]> => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(d =>
        d.kind === 'audiooutput' &&
        d.label !== '' &&
        d.deviceId !== 'default' &&
        d.deviceId !== 'communications'
    );
}

export const getDefaultAudioDevice = async (): Promise<MediaDeviceInfo | undefined> => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.find(d => d.kind === 'audiooutput' && d.deviceId === 'default');
}

export const getVolumeIcon = (volume: number): ElementType => {
    if (volume < 15) return PiSpeakerNoneBold;
    if (volume < 50) return PiSpeakerLowBold;
    return PiSpeakerHighBold;
}