# routes/logs.py
from flask import Blueprint, request, jsonify
import requests
from datetime import datetime
bp = Blueprint('logs', __name__)

schema = {
    'details': {
        'channel': 'game-admin',
        'turnNumber': 4,
        'from': {
            'force': 'Blue',
            'forceColor': '#3dd0ff',
            'forceId': 'blue',
            'roleId': 'CO',
            'roleName': 'CO',
            'iconURL': 'http://localhost:8080/default_img/forceDefault.png',
        },
        'messageType': 'Chat',
        'timestamp': '2020-12-06T11:06:12.434Z',
    },
    'message': {
        'content': 'at the moment, there are no in-game messages.',
    },
    '_id': datetime.now().isoformat(),
    '_rev': None,
    'hasBeenRead': 'false',
    'isOpen': 'false',
    'messageType': 'CustomMessage',
}

@bp.route("/logs-latest/", methods=["POST"])
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
        # print('hello', latest_custom_message)
        # Find the largest activity time object
        largest_activity_time_object = max(logs_data['data'], key=lambda x: x.get("activityTime", 0))
        return jsonify({"latestLog": largest_activity_time_object, "latestMessage": latest_custom_message})

    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)})
