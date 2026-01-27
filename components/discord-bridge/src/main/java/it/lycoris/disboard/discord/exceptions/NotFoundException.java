package it.lycoris.disboard.discord.exceptions;

public class NotFoundException extends DiscordException {

  public NotFoundException(String resource, String id) {
    super (resource + " with ID " + id + " not found.");
  }
}
