# routes/logs.py
from flask import Blueprint, request, jsonify
import requests

bp = Blueprint('logs', __name__)

@bp.route("/logs-latest/", methods=["POST"])
def fetch_most_recent_message():
    try:
        # Get JSON data from the POST request
        request_data = request.get_json()

        if 'wargame' in request_data and 'host' in request_data:
            wargame = request_data['wargame']
            host = request_data['host']

            # Make a GET request to the external API
            response = requests.get(f"{host}/{wargame}/wargame-playerlogs/logs-latest")

            if response.status_code == 200:
                data = response.json()
                # Find the object with the largest activityTime
                largest_activity_time_object = max(data['data'], key=lambda x: x["activityTime"])
                print('largest_activity_time_object', largest_activity_time_object)
                return jsonify(largest_activity_time_object)
            else:
                return jsonify({"error": f"Request failed with status code {response.status_code}"})
        else:
            return jsonify({"error": "Missing 'wargame' or 'host' in the request data"})

    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)})
