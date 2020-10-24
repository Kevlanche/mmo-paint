
Small one-day project for a serverless "paint app" that syncs between clients with websockets.

## backend

Heavily based on https://github.com/aws-samples/simple-websockets-chat-app, but modified slightly.

Added a S3 bucket where pixel data is kept.
Modified lambdas to read from and write to said bucket

## frontend

Simple html+js (no dependencies) with a color palette and a canvas.
Connects to the websocket server in `backend` to keep its data in sync.

## pi

A java client that writes to the SenseHAT board on a raspberry pi when it receives data over the websocket.
