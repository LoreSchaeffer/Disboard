package it.lycoris.disboard.discord.exceptions;

public class NotConnectedException extends DiscordException {
    public NotConnectedException() {
        super("Not connected");
    }
}
