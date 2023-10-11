# app.py
from flask import Flask, render_template, request, jsonify
import requests
from routes import home, connect, logs, messages
app = Flask(__name__)
app.config.from_object('config')

json = {
    "details": {
        "channel": "game-admin",
        "turnNumber": 4,
        "from": {
            "force": "Blue",
            "forceColor": "#3dd0ff",
            "forceId": "blue",
            "roleId": "CO",
            "roleName": "CO",
            "iconURL": "http://localhost:8080/default_img/forceDefault.png"
        },
        "messageType": "Chat",
        "timestamp": "2020-12-06T11:06:12.434Zhhhhhhh"
    },
    "message": {
        "content": 'json_data'
    },
    "_id": "2020-12-06T11:06:12.434Z",
    # "_rev":,
    "hasBeenRead": 'false',
    "isOpen": 'false',
    "messageType": "CustomMessage"
}
# Define a route for the home page
app.register_blueprint(home.bp)
app.register_blueprint(connect.bp)
app.register_blueprint(logs.bp)
app.register_blueprint(messages.bp)

if __name__ == "__main__":
    app.run(debug=True)