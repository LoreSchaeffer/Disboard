import {remoteMain} from "../remote-main"
import {settingsStore} from "../../../storage/settings-store";

export const setupAuthRemoteHandlers = () => {

    remoteMain.handle('auth:identify', (event, username: string, password: string) => {
        const wsSettings = settingsStore.get('remoteServer');

        if (!wsSettings?.authEnabled) {
            event.ws.isAuthenticated = true;
            return {authenticated: true};
        }

        const validUser = !wsSettings.username || username === wsSettings.username;
        const validPass = !wsSettings.password || password === wsSettings.password;

        if (validUser && validPass) {
            event.ws.isAuthenticated = true;
            console.log('[RemoteServer] Client authenticated successfully.');
            return {authenticated: true};
        } else {
            setTimeout(() => {
                if (event.ws.readyState === event.ws.OPEN) event.ws.close(1008, 'invalid_credentials');
            }, 500);

            throw new Error('Invalid Credentials');
        }
    });
}