from flask import Flask, render_template, request, jsonify
from routes import home, connect, messages
app = Flask(__name__)
app.config.from_object('config')

blueprints = [home.bp, connect.bp, messages.bp]
for blueprint in blueprints:
    app.register_blueprint(blueprint)

if __name__ == '__main__':
    app.run(debug=True)
