package it.lycoris.disboard.discord;

import club.minnced.discord.jdave.interop.JDaveSessionFactory;
import it.lycoris.disboard.discord.exceptions.*;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.JDABuilder;
import net.dv8tion.jda.api.audio.AudioModuleConfig;
import net.dv8tion.jda.api.audio.SpeakingMode;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.channel.concrete.VoiceChannel;
import net.dv8tion.jda.api.exceptions.DetachedEntityException;
import net.dv8tion.jda.api.exceptions.InsufficientPermissionException;
import net.dv8tion.jda.api.exceptions.InvalidTokenException;
import net.dv8tion.jda.api.managers.AudioManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

public class BotController {
    private static final Logger LOG = LoggerFactory.getLogger(BotController.class);
    private final JdaAudioSendHandler audioHandler;
    private JDA jda;
    private boolean connected = false;

    public BotController(JdaAudioSendHandler audioHandler) {
        this.audioHandler = audioHandler;
    }

    public void connect(String token) {
        if (token == null || token.isBlank()) throw new IllegalArgumentException("Token cannot be null of blank");

        if (jda != null) disconnect();

        try {
            jda = JDABuilder.createLight(token)
                    .setAudioModuleConfig(new AudioModuleConfig().withDaveSessionFactory(new JDaveSessionFactory()))
                    .setAutoReconnect(true)
                    .build();
        } catch (InvalidTokenException | IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid Token");
        }

        try {
            jda.awaitReady();
        } catch (InterruptedException e) {
            throw new DiscordException("Interrupted while waiting for JDA to be ready", e);
        } catch (IllegalStateException e) {
            throw new DiscordException("JDA shutdown while waiting to be ready", e);
        }

        connected = true;

        LOG.info("Bot logged in as {}", jda.getSelfUser().getAsTag());
    }

    public void disconnect() {
        if (jda == null) return;

        jda.shutdown();
        jda = null;
        connected = false;

        LOG.info("Bot has been disconnected.");
    }

    public void joinChannel(String guildId, String channelId) {
        if (guildId == null || guildId.isBlank())
            throw new IllegalArgumentException("Guild ID cannot be null or blank");
        if (channelId == null || channelId.isBlank())
            throw new IllegalArgumentException("Channel ID cannot be null or blank");

        if (jda == null) throw new NotConnectedException();

        Guild guild;
        try {
            guild = jda.getGuildById(guildId);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid Guild ID format", e);
        }

        if (guild == null) throw new NotFoundException("Guild", guildId);

        VoiceChannel channel;
        try {
            channel = guild.getVoiceChannelById(channelId);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid Channel ID format", e);
        } catch (DetachedEntityException ignored) {
            channel = null;
        }

        if (channel == null) throw new NotFoundException("Voice Channel", channelId);

        AudioManager audioManager;
        try {
            audioManager = guild.getAudioManager();
        } catch (IllegalStateException | DetachedEntityException e) {
            throw new VoiceException("Cannot access AudioManager for guild " + guildId, e);
        }

        audioManager.setSendingHandler(audioHandler);
        audioManager.setAutoReconnect(true);
        audioManager.setSelfDeafened(true);
        audioManager.setSpeakingMode(SpeakingMode.SOUNDSHARE);

        try {
            audioManager.openAudioConnection(channel);
        } catch (UnsupportedOperationException e) {
            throw new VoiceException("Audio is disabled", e);
        } catch (InsufficientPermissionException e) {
            throw new PermissionException();
        }

        LOG.info("Joined voice channel {} in guild {}.", channel.getName(), guild.getName());
    }

    public void leaveChannels() {
        if (jda == null) throw new NotConnectedException();

        for (Guild guild : jda.getGuilds()) {
            try {
                AudioManager audioManager = guild.getAudioManager();
                if (audioManager.isConnected()) {
                    audioManager.closeAudioConnection();
                    LOG.info("Left voice channel in guild {}.", guild.getName());
                }
            } catch (Exception e) {
                LOG.warn("Failed to leave voice channel in guild {}: {}", guild.getName(), e.getMessage());
            }
        }
    }

    public boolean isConnected() {
        return jda != null && jda.getStatus() == JDA.Status.CONNECTED && connected;
    }

    public List<Guild> getGuilds() {
        if (jda == null) throw new NotConnectedException();

        return jda.getGuilds();
    }

    public List<VoiceChannel> getChannels(String guildId) {
        if (jda == null) throw new NotConnectedException();

        if (guildId == null || guildId.isBlank())
            throw new IllegalArgumentException("Guild ID cannot be null or blank");

        Guild guild;
        try {
            guild = jda.getGuildById(guildId);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid Guild ID format", e);
        }

        if (guild == null) throw new NotFoundException("Guild", guildId);

        return guild.getVoiceChannels();
    }

    public boolean isConnectedToChannel(String guildId) {
        if (jda == null) throw new NotConnectedException();

        if (guildId == null || guildId.isBlank())
            throw new IllegalArgumentException("Guild ID cannot be null or blank");

        Guild guild;
        try {
            guild = jda.getGuildById(guildId);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid Guild ID format", e);
        }

        if (guild == null) throw new NotFoundException("Guild", guildId);

        AudioManager audioManager;
        try {
            audioManager = guild.getAudioManager();
        } catch (IllegalStateException | DetachedEntityException e) {
            throw new VoiceException("Cannot access AudioManager for guild " + guildId, e);
        }

        return audioManager.isConnected();
    }
}
