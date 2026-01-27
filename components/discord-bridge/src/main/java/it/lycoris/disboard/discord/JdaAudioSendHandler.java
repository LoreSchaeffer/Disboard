package it.lycoris.disboard.discord;

import net.dv8tion.jda.api.audio.AudioSendHandler;

import java.nio.ByteBuffer;
import java.util.concurrent.ConcurrentLinkedQueue;

public class JdaAudioSendHandler implements AudioSendHandler {
    private final ConcurrentLinkedQueue<byte[]> queue = new ConcurrentLinkedQueue<>();

    public void addAudioPacket(byte[] data) {
        queue.offer(data);
        if (queue.size() > 10) queue.poll(); // Prevent excessive queue size (200ms)
    }

    @Override
    public boolean canProvide() {
        return !queue.isEmpty();
    }

    @Override
    public ByteBuffer provide20MsAudio() {
        byte[] data = queue.poll();
        return data == null ? null : ByteBuffer.wrap(data);
    }

    @Override
    public boolean isOpus() {
        return false;
    }
}
