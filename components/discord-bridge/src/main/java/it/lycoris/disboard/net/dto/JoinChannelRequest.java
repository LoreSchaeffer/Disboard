package it.lycoris.disboard.net.dto;

public record JoinChannelRequest(
        String guild,
        String channel
) {
}
