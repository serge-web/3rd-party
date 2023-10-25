from flask import Blueprint, request, jsonify
import json
import requests

bp = Blueprint('messages', __name__)

# Helper function to validate JSON
def is_valid_json(json_string): 
    try:
        json.loads(json_string)
        return True
    except json.JSONDecodeError:
        return False

@bp.route("/validate_json", methods=["POST"])
def validate_json():
    data = request.get_json()
    json_string = data.get('json_string')
    if json_string:
        if is_valid_json(json_string):
            return jsonify({"valid": True})
        else:
            return jsonify({"valid": False})
    return jsonify({"valid": False})

@bp.route("/send_message", methods=["POST"])
def submit_message():
    try:
        data = request.get_json()
        wargame = data.get('wargame')
        message = data.get('data')
        host = data.get('host')
        validate_json_url = f"{request.host_url}/validate_json"

        if wargame is None:
            return jsonify({"error": "The 'wargame' field is required in the JSON data"}), 400

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
                    return jsonify(response_data), 200
                else:
                    return jsonify({"error": "Failed to send the message"}), response.status_code
            else:
                return jsonify({"error": "Invalid JSON format"}), 400
        else:
            return jsonify({"error": "Invalid JSON format"}), 400

    except json.JSONDecodeError:
        return jsonify({"error": "JSON decoding error"}), 400
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"HTTP request error: {e}"}), 500
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

