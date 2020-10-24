package com.mycompany;

import java.net.URI;
import java.net.URISyntaxException;
import java.nio.ByteBuffer;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.drafts.Draft;
import org.java_websocket.drafts.Draft_6455;
import org.java_websocket.handshake.ServerHandshake;

public class App {

  private static final String DATA_URL = "https://mmopaint-data.s3.eu-central-1.amazonaws.com/px8x8";

  public static void main(String[] args) throws Exception {
    System.out.println("Hello World!");
    WebSocketClient client = new EmptyClient(new URI("wss://scuv0gmugl.execute-api.eu-central-1.amazonaws.com/Prod"));
		client.connect();
  }
}
