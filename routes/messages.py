from flask import Blueprint, request, jsonify
import json
import requests
from config import schema  

bp = Blueprint('messages', __name__)
bps = Blueprint('messages', __name__)
VALIDATE_JSON_URL = '/validate_json'

# Helper function to validate JSON
def is_valid_json(json_string): 
    print('json_string', json_string)
    try:
        json.loads(json_string)
        return True
    except json.JSONDecodeError:
        return False
    
@bp.route(VALIDATE_JSON_URL, methods=["POST"])
def validate_json():
    data = request.get_json()
    json_string = data.get('json_string')
    if json_string:
        if is_valid_json(json_string):
            return jsonify({"valid": True})
        else:
            return jsonify({"valid": False})
    return jsonify({"valid": False})

def handle_message(socketio, data):
    try:
        wargame = data.get('wargame')
        message = data.get('data')
        host = data.get('host')
        validate_json_url = f"{request.host_url}/{VALIDATE_JSON_URL}"
        # socketio.emit('message', message)
        if wargame is None:
          response = {"error": "The wargame field is required in the JSON data"}
          return socketio.emit('message', response)

        if is_valid_json(message):
            is_valid_json_response = requests.post(
                validate_json_url,
                json={"json_string": message}
            )
            if is_valid_json_response.json().get("valid", False):
                message_url = f"{host}/{wargame}"
             
                response = requests.put(message_url, message, headers={'Content-Type': 'application/json'})

                if response.status_code == 200:
                    response_data = response.json()
                    print('respons', response_data)
                    socketio.emit('message', response_data)
                else:
                    socketio.emit('message', {"error": "Failed to send the message"})
                    return
            else:
                socketio.emit('message', {"error": "Invalid JSON format"})
                return
        else:
            socketio.emit('message', {"error": "Invalid JSON format"})
            return
    except json.JSONDecodeError:
        return socketio.emit({"error": "JSON decoding error"})
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"HTTP request error: {e}"}), 500
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@bp.route("/message-latest/", methods=["POST"])
def fetch_most_recent_message():
    try:
        request_data = request.get_json()

        if 'wargame' not in request_data or 'host' not in request_data:
            return jsonify({"error": "Missing 'wargame' or 'host' in the request data"})

        wargame = request_data['wargame']
        host = request_data['host']

        # Make GET requests to the external APIs
        response = requests.get(f"{host}/{wargame}/wargame-playerlogs/logs-latest")
        response_wargame = requests.get(f"{host}/{wargame}")

        if response.status_code != 200 or response_wargame.status_code != 200:
            return jsonify({"error": f"Request failed with status code {response.status_code}"})

        wargame_data = response_wargame.json()
        logs_data = response.json()

        # Find the latest custom message
        latest_custom_message = next((message for message in reversed(wargame_data['data']) if
          message.get('messageType') == 'CustomMessage' and 'content' in message['message']), None)

        if not latest_custom_message:
            latest_custom_message = schema

        # Find the largest activity time object
        largest_activity_time_object = max(logs_data['data'], key=lambda x: x.get("activityTime", 0))
        return jsonify({"latestLog": largest_activity_time_object, "latestMessage": latest_custom_message})

    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)})
