import requests
from flask import Blueprint, request, jsonify

bp = Blueprint('messages', __name__)

@bp.route("/send_message", methods=["POST"])
def submit_message():
    try:
        # Retrieve JSON data from the request
        data = request.get_json()
        wargame = data.get('wargame')
        message = data.get('data')
        host = data.get('host')

        if wargame is None:
            return jsonify({"error": "The 'wargame' field is required in the JSON data"}), 400

        message_url = f"{host}/{wargame}"

        response = requests.put(message_url, message, headers={'Content-Type': 'application/json'})

        if response.status_code == 200:
            print('response', response.json())
            response_data = response.json()
            return jsonify(response_data), 200
        else:
            return jsonify({"error": "Failed to send the message"}), response.status_code

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
