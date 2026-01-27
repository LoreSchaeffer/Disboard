package it.lycoris.disboard.discord.exceptions;

public class PermissionException extends DiscordException {
    public PermissionException() {
        super("Insufficient permissions");
    }
}
