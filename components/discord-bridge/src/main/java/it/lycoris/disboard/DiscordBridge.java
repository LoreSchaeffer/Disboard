package it.lycoris.disboard;

import it.lycoris.disboard.data.AppConfig;
import it.lycoris.disboard.discord.BotController;
import it.lycoris.disboard.discord.JdaAudioSendHandler;
import it.lycoris.disboard.discord.exceptions.DiscordException;
import it.lycoris.disboard.net.RestServer;
import it.lycoris.disboard.net.UdpAudioSocket;
import joptsimple.OptionException;
import joptsimple.OptionParser;
import joptsimple.OptionSet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public class DiscordBridge {
    private static final Logger LOG = LoggerFactory.getLogger(DiscordBridge.class);
    private static final OptionParser OPTION_PARSER = new OptionParser() {
        {
            acceptsAll(List.of("?", "h", "help"), "Show this help message");
            acceptsAll(List.of("t", "token"), "Bot token").withRequiredArg().ofType(String.class);
            acceptsAll(List.of("g", "guild"), "Guild id").withRequiredArg().ofType(String.class);
            acceptsAll(List.of("c", "channel"), "Channel id").withRequiredArg().ofType(String.class);
            acceptsAll(List.of("r", "restPort"), "Port for REST server").withRequiredArg().ofType(Integer.class).defaultsTo(24454);
            acceptsAll(List.of("u", "udpPort"), "Port for UDP socket").withRequiredArg().ofType(Integer.class).defaultsTo(24455);
            acceptsAll(List.of("p", "parent"), "Parent process").withRequiredArg().ofType(Integer.class);
        }
    };
    private static DiscordBridge instance;

    private AppConfig config;
    private JdaAudioSendHandler audioSendHandler;
    private BotController bot;
    private RestServer restServer;
    private UdpAudioSocket udpAudioSocket;

    static void main(String[] args) {
        OptionSet options;

        try {
            options = OPTION_PARSER.parse(args);
        } catch (OptionException ignored) {
            showHelpMessageAndExit();
            return;
        }

        if (options == null || options.has("?")) {
            showHelpMessageAndExit();
            return;
        }

        AppConfig config = new AppConfig(
                (String) options.valueOf("token"),
                (String) options.valueOf("guild"),
                (String) options.valueOf("channel"),
                (int) options.valueOf("restPort"),
                (int) options.valueOf("udpPort"),
                options.has("parent") ? (Integer) options.valueOf("parent") : null
        );

        instance = new DiscordBridge(config);
        instance.start();
    }

    private static void showHelpMessageAndExit() {
        try {
            OPTION_PARSER.printHelpOn(System.out);
        } catch (Exception ignored) {
        }

        System.exit(0);
    }

    private DiscordBridge(AppConfig config) {
        this.config = config;
    }

    private void start() {
        LOG.info("Starting Discord Bridge...");

        if (config.parent() != null) startParentWatchdog();

        JdaAudioSendHandler audioHandler = new JdaAudioSendHandler();

        udpAudioSocket = new UdpAudioSocket(audioHandler);
        udpAudioSocket.start(config.udpPort());

        bot = new BotController(audioHandler);

        restServer = new RestServer(bot);

        try {
            restServer.start(config.restPort());
        } catch (IOException e) {
            LOG.error("Failed to start REST API server", e);
            System.exit(1);
        }

        if (config.token() != null) {
            LOG.info("Attempting to connect to Discord...");

            try {
                bot.connect(config.token());
            } catch (DiscordException | IllegalArgumentException e) {
                LOG.warn("Failed to connect to Discord", e);
            }

            if (bot.isConnected() && config.guildId() != null && config.channelId() != null) {
                try {
                    bot.joinChannel(config.guildId(), config.channelId());
                } catch (DiscordException | IllegalArgumentException e) {
                    LOG.warn("Failed to join voice channel", e);
                }
            }
        }
    }

    private void startParentWatchdog() {
        Thread watchdog = new Thread(() -> {
            LOG.info("Monitoring parent PID: {}", config.parent());

            while (true) {
                try {
                    Optional<ProcessHandle> parent = ProcessHandle.of(config.parent());
                    if (parent.isEmpty() || !parent.get().isAlive()) {
                        LOG.warn("Parent process {} died. Stopping Discord Bridge...", config.parent());
                        System.exit(0);
                    }

                    Thread.sleep(2000);
                } catch (InterruptedException e) {
                    break;
                } catch (Exception e) {
                    LOG.error("Error monitoring parent: {}", e.getMessage(), e);
                    System.exit(1);
                }
            }
        });

        watchdog.setDaemon(true);
        watchdog.setName("Parent-Watchdog");
        watchdog.start();
    }

    public static DiscordBridge getInstance() {
        if (instance == null) throw new IllegalStateException("DiscordBridge instance not initialized yet");
        return instance;
    }

    public AppConfig getConfig() {
        return config;
    }

    public UdpAudioSocket getUdpAudioSocket() {
        return udpAudioSocket;
    }
}
