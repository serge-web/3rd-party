from flask import Flask
from flask_socketio import SocketIO
from routes import home, connect, messages
app = Flask(__name__)
app.config.from_object('config')
socketio = SocketIO(app)

@socketio.on('message')
def message_handler(data):
    messages.handle_message(socketio, data) 

blueprints = [home.bp, connect.bp, messages.bp]
for blueprint in blueprints:
    app.register_blueprint(blueprint)

if __name__ == '__main__':
    socketio.run(app, debug=True) 
