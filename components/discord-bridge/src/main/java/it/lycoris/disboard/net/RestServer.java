package it.lycoris.disboard.net;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import it.lycoris.disboard.DiscordBridge;
import it.lycoris.disboard.discord.BotController;
import it.lycoris.disboard.discord.exceptions.DiscordException;
import it.lycoris.disboard.discord.exceptions.NotConnectedException;
import it.lycoris.disboard.discord.exceptions.NotFoundException;
import it.lycoris.disboard.net.dto.*;
import it.lycoris.disboard.net.exceptions.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.Executors;

public class RestServer {
    private static final Logger LOG = LoggerFactory.getLogger(RestServer.class);
    private final BotController bot;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private HttpServer server;

    public RestServer(BotController bot) {
        this.bot = bot;
    }

    public void start(int port) throws IOException {
        if (port < 1 || port > 65535) throw new IllegalArgumentException("Port must be between 1 and 65535");

        if (server != null) {
            LOG.info("Rest server already running, stopping existing server...");
            stop();
        }

        LOG.info("Starting REST server on port {}...", port);

        server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);

        server.createContext("/ping", (e) -> sendResponse(e, 200));
        server.createContext("/connect", (e) -> handlePost(e, this::handleConnect));
        server.createContext("/disconnect", (e) -> handlePost(e, this::handleDisconnect));
        server.createContext("/join", (e) -> handlePost(e, this::handleJoinChannel));
        server.createContext("/leave", (e) -> handlePost(e, this::handleLeaveChannels));
        server.createContext("/status", (e) -> handleGet(e, this::isConnected));
        server.createContext("/guilds", (e) -> handleGet(e, this::getGuilds));
        server.createContext("/channels", (e) -> handleGet(e, this::getVoiceChannels));
        server.createContext("/status/voice", (e) -> handleGet(e, this::isConnectedToChannel));
        server.createContext("/port/rest", (e) -> handlePost(e, this::handleChangeRestPort));
        server.createContext("/port/udp", (e) -> handlePost(e, this::handleChangeUdpPort));
        server.createContext("/", (e) -> sendResponse(e, 404));
        server.createContext("/*", (e) -> sendResponse(e, 404));

        server.setExecutor(Executors.newCachedThreadPool());
        server.start();

        LOG.info("REST server started on port {}", port);
    }

    public void stop() {
        if (server == null) return;
        server.stop(0);
        LOG.info("REST server stopped");
    }


    private void sendResponse(HttpExchange exchange, int statusCode, Object responseBody) {
        try {
            byte[] bytes = responseBody != null ? objectMapper.writeValueAsBytes(responseBody) : null;
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
            exchange.sendResponseHeaders(statusCode, bytes != null ? bytes.length : 0);

            if (bytes != null) {
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.getResponseBody().close();
            }
        } catch (IOException e) {
            LOG.warn("Failed to send response", e);
        }
    }

    private void sendResponse(HttpExchange exchange, int statusCode) {
        sendResponse(exchange, statusCode, null);
    }

    private <T> T parseRequestBody(HttpExchange exchange, Class<T> clazz) throws ParseException {
        try {
            return objectMapper.readValue(exchange.getRequestBody(), clazz);
        } catch (Exception e) {
            throw new ParseException();
        }
    }

    private String getQueryValue(HttpExchange exchange, String key) {
        String query = exchange.getRequestURI().getQuery();
        if (query == null || query.isBlank()) return null;

        String[] pairs = query.split("&");
        for (String pair : pairs) {
            String[] keyValue = pair.split("=", 2);
            if (keyValue.length == 2 && keyValue[0].equals(key)) {
                try {
                    return URLDecoder.decode(keyValue[1], StandardCharsets.UTF_8);
                } catch (Exception e) {
                    return keyValue[1];
                }
            }
        }
        return null;
    }

    private boolean isAllowedMethod(HttpExchange exchange, String method) {
        return exchange.getRequestMethod().equalsIgnoreCase(method);
    }

    private void handlePost(HttpExchange exchange, HttpHandler handler) {
        if (!isAllowedMethod(exchange, "POST")) {
            sendResponse(exchange, 405);
            return;
        }

        try {
            handler.handle(exchange);
        } catch (Exception e) {
            sendResponse(exchange, 500);
        }
    }

    private void handleGet(HttpExchange exchange, HttpHandler handler) {
        if (!isAllowedMethod(exchange, "GET")) {
            sendResponse(exchange, 405);
            return;
        }

        try {
            handler.handle(exchange);
        } catch (Exception e) {
            sendResponse(exchange, 500);
        }
    }


    private void handleConnect(HttpExchange exchange) {
        ConnectRequest request;
        try {
            request = parseRequestBody(exchange, ConnectRequest.class);
        } catch (ParseException e) {
            sendResponse(exchange, 400, e.getMessage());
            return;
        }

        try {
            bot.connect(request.token());
            sendResponse(exchange, 200);
        } catch (IllegalArgumentException e) {
            sendResponse(exchange, 400, e.getMessage());
        } catch (DiscordException e) {
            sendResponse(exchange, 503, e.getMessage());
        }
    }

    private void handleDisconnect(HttpExchange exchange) {
        bot.disconnect();
        sendResponse(exchange, 200);
    }

    private void handleJoinChannel(HttpExchange exchange) {
        JoinChannelRequest request;
        try {
            request = parseRequestBody(exchange, JoinChannelRequest.class);
        } catch (ParseException e) {
            sendResponse(exchange, 400, e.getMessage());
            return;
        }

        try {
            bot.joinChannel(request.guild(), request.channel());
            sendResponse(exchange, 200);
        } catch (IllegalArgumentException e) {
            sendResponse(exchange, 400, e.getMessage());
        } catch (NotFoundException e) {
            sendResponse(exchange, 404, e.getMessage());
        } catch (DiscordException e) {
            sendResponse(exchange, 503, e.getMessage());
        }
    }

    private void handleLeaveChannels(HttpExchange exchange) {
        bot.leaveChannels();
        sendResponse(exchange, 200);
    }

    private void isConnected(HttpExchange exchange) {
        sendResponse(exchange, 200, new StatusResponse(bot.isConnected()));
    }

    private void getGuilds(HttpExchange exchange) {
        try {
            List<Guild> guilds = bot.getGuilds()
                    .stream()
                    .map(g -> new Guild(g.getId(), g.getName()))
                    .toList();
            sendResponse(exchange, 200, guilds);
        } catch (NotConnectedException e) {
            sendResponse(exchange, 503, e.getMessage());
        }
    }

    private void getVoiceChannels(HttpExchange exchange) {
        String guildId = getQueryValue(exchange, "guild");
        if (guildId == null) {
            sendResponse(exchange, 400, "Missing guild parameter");
            return;
        }

        try {
            List<VoiceChannel> channels = bot.getChannels(guildId)
                    .stream()
                    .map(c -> new VoiceChannel(c.getId(), c.getName()))
                    .toList();

            sendResponse(exchange, 200, channels);
        } catch (IllegalArgumentException | NotFoundException e) {
            sendResponse(exchange, 400, e.getMessage());
        } catch (DiscordException e) {
            sendResponse(exchange, 503, e.getMessage());
        }
    }

    private void isConnectedToChannel(HttpExchange exchange) {
        String guildId = getQueryValue(exchange, "guild");
        if (guildId == null) {
            sendResponse(exchange, 400, "Missing guild parameter");
            return;
        }

        try {
            boolean connected = bot.isConnectedToChannel(guildId);
            sendResponse(exchange, 200, new StatusResponse(connected));
        } catch (IllegalArgumentException | NotFoundException e) {
            sendResponse(exchange, 400, e.getMessage());
        } catch (DiscordException e) {
            sendResponse(exchange, 503, e.getMessage());
        }
    }

    private void handleChangeRestPort(HttpExchange exchange) {
        PortChangeRequest request;
        try {
            request = parseRequestBody(exchange, PortChangeRequest.class);
        } catch (ParseException e) {
            sendResponse(exchange, 400, e.getMessage());
            return;
        }

        if (request.port() < 1 || request.port() > 65535) {
            sendResponse(exchange, 400, "Port must be between 1 and 65535");
            return;
        }

        sendResponse(exchange, 200);

        new Thread(() -> {
            try {
                Thread.sleep(100);

                LOG.info("Restarting server on new port {}...", request.port());
                start(request.port());
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            } catch (IOException e) {
                LOG.error("Failed to restart server on new port {}", request.port(), e);
                System.exit(2);
            }
        }).start();
    }

    private void handleChangeUdpPort(HttpExchange exchange) {
        PortChangeRequest request;
        try {
            request = parseRequestBody(exchange, PortChangeRequest.class);
        } catch (ParseException e) {
            sendResponse(exchange, 400, e.getMessage());
            return;
        }

        if (request.port() < 1 || request.port() > 65535) {
            sendResponse(exchange, 400, "Port must be between 1 and 65535");
            return;
        }

        DiscordBridge bridge = DiscordBridge.getInstance();

        try {
            LOG.info("Changing UDP audio port to {}...", request.port());
            bridge.getUdpAudioSocket().start(request.port());
            sendResponse(exchange, 200);
        } catch (Exception e) {
            sendResponse(exchange, 500, "Failed to change UDP port: " + e.getMessage());
            bridge.getUdpAudioSocket().start(bridge.getConfig().udpPort());
        }
    }
}
