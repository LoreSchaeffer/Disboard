package it.lycoris.disboard.net;

import it.lycoris.disboard.discord.JdaAudioSendHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.SocketException;

public class UdpAudioSocket {
    private static final Logger LOG = LoggerFactory.getLogger(UdpAudioSocket.class);
    private final JdaAudioSendHandler audioHandler;
    private final byte[] buffer = new byte[4096];
    private DatagramSocket socket;
    private Thread socketThread;
    private volatile boolean running = false;

    public UdpAudioSocket(JdaAudioSendHandler audioHandler) {
        this.audioHandler = audioHandler;
    }

    public synchronized void start(int port) {
        if (port < 1 || port > 65535) throw new IllegalArgumentException("Port must be between 1 and 65535");

        if (running) {
            LOG.info("UDP Audio socket already running, stopping existing socket...");
            stop();
        }

        LOG.info("Starting UDP Audio socket on port {}...", port);
        this.running = true;
        socketThread = new Thread(() -> run(port), "UdpAudioSocket");
        socketThread.start();
    }

    public synchronized void stop() {
        if (!running) return;
        running = false;

        if (socket != null && !socket.isClosed()) socket.close();

        if (socketThread != null) {
            try {
                socketThread.join(1000);
            } catch (InterruptedException e) {
                LOG.warn("Interrupted while waiting for UDP thread to stop");
                Thread.currentThread().interrupt();
            }
            socketThread = null;
        }

        LOG.info("UDP Audio socket stopped");
    }

    private void run(int port) {
        try {
            socket = new DatagramSocket(port);
            LOG.info("UDP Audio socket listening on port {}", port);

            while (running && !socket.isClosed()) {
                DatagramPacket packet = new DatagramPacket(buffer, buffer.length);

                socket.receive(packet);

                int len = packet.getLength();
                byte[] rawData = packet.getData();
                byte[] pcmData = new byte[len];

                for (int i = 0; i < len; i += 2) {
                    if (i + 1 < len) {
                        pcmData[i] = rawData[i + 1]; // High byte
                        pcmData[i + 1] = rawData[i]; // Low byte
                    }
                }

                audioHandler.addAudioPacket(pcmData);
            }
        } catch (SocketException e) {
            if (running) LOG.error("UDP socket error: ", e);
        } catch (Exception e) {
            LOG.error("UDP processing error: ", e);
        } finally {
            if (socket != null && !socket.isClosed()) socket.close();
        }
    }
}