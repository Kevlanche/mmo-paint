package com.mycompany;

import java.net.URI;
import java.net.URISyntaxException;
import java.nio.ByteBuffer;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.drafts.Draft;
import org.java_websocket.drafts.Draft_6455;
import org.java_websocket.handshake.ServerHandshake;

public class EmptyClient extends WebSocketClient {

  private GraphicsWriter gw;

	public EmptyClient(URI serverURI) throws Exception {
		super(serverURI);

    gw = new GraphicsWriter();
	}

	@Override
	public void onOpen(ServerHandshake handshakedata) {
		// send("{\"action\":\"sendmessage\", \"data\":\"wtf\",\"x\":\"1\",\"y\":\"1\",\"col\":\"0ff\"}");
		// System.out.println("new connection opened");
	}

	@Override
	public void onClose(int code, String reason, boolean remote) {
		System.out.println("closed with exit code " + code + " additional info: " + reason);
	}

	@Override
	public void onMessage(String message) {
    try {
      gw.open();
      for (int i = 0; i < message.length(); i += 3) {
        final int red = 16 * Integer.parseInt("" + message.charAt(i), 16);
        final int green = 16 * Integer.parseInt("" + message.charAt(i + 1), 16);
        final int blue = 16 * Integer.parseInt("" + message.charAt(i + 2), 16);
        gw.write(red, green, blue);
      }
      gw.close();
    } catch (Exception e) {
      e.printStackTrace();
    }

 		System.out.println("received message: " + message);
	}

	@Override
	public void onMessage(ByteBuffer message) {
		System.out.println("received ByteBuffer");
	}

	@Override
	public void onError(Exception ex) {
		System.err.println("an error occurred:" + ex);
	}

	// public static void main(String[] args) throws URISyntaxException {
	// 	WebSocketClient client = new EmptyClient(new URI("ws://localhost:8887"));
	// 	client.connect();
	// }
}
