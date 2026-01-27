package it.lycoris.disboard.data;

public final class AppConfig {
    private String token;
    private String guildId;
    private String channelId;
    private int restPort;
    private int udpPort;
    private Integer parent;

    public AppConfig(
            String token,
            String guildId,
            String channelId,
            int restPort,
            int udpPort,
            Integer parent
    ) {
        this.token = token;
        this.guildId = guildId;
        this.channelId = channelId;
        this.restPort = restPort;
        this.udpPort = udpPort;
        this.parent = parent;
    }

    public String token() {
        return token;
    }

    public AppConfig token(String token) {
        this.token = token;
        return this;
    }

    public String guildId() {
        return guildId;
    }

    public AppConfig guildId(String guildId) {
        this.guildId = guildId;
        return this;
    }

    public String channelId() {
        return channelId;
    }

    public AppConfig channelId(String channelId) {
        this.channelId = channelId;
        return this;
    }

    public int restPort() {
        return restPort;
    }

    public AppConfig restPort(int restPort) {
        this.restPort = restPort;
        return this;
    }

    public int udpPort() {
        return udpPort;
    }

    public AppConfig udpPort(int udpPort) {
        this.udpPort = udpPort;
        return this;
    }

    public Integer parent() {
        return parent;
    }
}
