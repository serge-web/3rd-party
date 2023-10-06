# app.py
from flask import Flask, render_template, request, jsonify
import requests
app = Flask(__name__)
app.config['SECRET_KEY'] = 'sscascaccac'

# Define a variable to store the wargame URL
wargame_url = ""

# serge server path
server_path = 'http://localhost:8080/'

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
@app.route("/", methods=["GET", "POST"])
def home():
    global wargame_url

    return render_template("index.html", wargame_url=wargame_url)

@app.route("/connect/", methods=["GET"])
def connect_wargame():
    global wargame_url  # Consider avoiding global variables if possible
    global json  # Consider avoiding global variables if possible
    # socketio.emit('message', json_data)
    wargame = request.args.get('wargame')
    access = request.args.get('access')
    if not wargame or not access:
        return jsonify([])

    try:
        response = requests.get(f"{server_path}{wargame}/last")
        response.raise_for_status()
        data = response.json()
        allForces = data['data'][0]['data']['forces']['forces']

        role = None
        for force in allForces:
            role = next((roleItem for roleItem in force['roles'] if roleItem['roleId'] == access), None)
            if role is not None:
                break

        return jsonify(role)
    except requests.exceptions.RequestException as e:
        # Handle request exceptions (e.g., connection error, timeouts)
        return jsonify({"error": str(e)})

    return jsonify([])

@app.route("/logs-latest/<string:wargame>", methods=["GET"])
def fetch_most_recent_message(wargame):
    try:
        # Make the GET request to the external API
        response = requests.get(f"{server_path}{wargame}/wargame-playerlogs/logs-latest")
        print('responses', response)
        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            data = response.json()
            return jsonify(data)
        else:
            return jsonify({"error": f"Request failed with status code {response.status_code}"})
    except requests.exceptions.RequestException as e:
        # Handle request exceptions (e.g., connection error, timeouts)
        return jsonify({"error": str(e)})

# Define a route to submit a new message to the wargame
@app.route("/submit_message", methods=["POST"])
def submit_message():
    # global wargame_url
    # global json

    # Retrieve JSON data from the form
    # json_data = request.form.get("json_data")
    # Send the JSON data to the wargame URL using POST request
    # if wargame_url:
     # response = requests.put(server_path + wargame_url, jsons)
    return jsonify({"status": "Message sent successfully"})


if __name__ == "__main__":
    app.run(debug=True)