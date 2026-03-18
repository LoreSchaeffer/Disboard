import {RemoteCommand} from "../remote-server";
import {sendMessage} from "../rsc-utils";

export const pingRSC: RemoteCommand = {
    op: 'Ping',
    handler: (ws) => sendMessage(ws, {op: 'Pong', timestamp: Date.now()})
}