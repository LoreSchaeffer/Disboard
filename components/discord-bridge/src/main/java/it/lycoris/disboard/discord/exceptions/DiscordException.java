package it.lycoris.disboard.discord.exceptions;

public class DiscordException extends RuntimeException {
    public DiscordException(String message, Throwable cause) {
        super(message, cause);
    }

    public DiscordException(String message) {
        super(message);
    }
}
