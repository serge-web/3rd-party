# routes/connect.py
from flask import Blueprint, request, jsonify
import requests
from datetime import datetime

bp = Blueprint('connect', __name__)
from urllib.parse import urlparse, parse_qs

# Define your query parameters
query_parameters = {
    'wargame': 'wargame',
    'access': 'access',
    'host': 'host',
}

def extract_last_segment_and_base_url(url, query_parameters):
    parsed_url = urlparse(url)
    query_params = parse_qs(parsed_url.query)

    wargame_param = query_params.get(query_parameters['wargame'], [None])[0]
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
    last_segment = query_params.get(query_parameters['access'], [None])[0]

    return {
        "host": base_url,
        "access": last_segment,
        "wargame": wargame_param
    }

def create_custom_message(force, role):
    details = {
      'channel': 'chat',
      'from': {
        'force': force['name'],
          'forceColor': force['color'],
          'roleId': role['roleId'],
          'roleName': role['name'],
          'iconURL': force.get('iconURL', '')
        },
      'messageType': 'Chat',
      'timestamp': datetime.utcnow().isoformat(),
      'turnNumber': 0
    }

    message = {
      'content': ''
    }

    custom_message = {
      '_id': datetime.utcnow().isoformat(),
      'messageType': 'CustomMessage',
      'details': details,
      'message': message,
      'isOpen': False,
      'hasBeenRead': False,
      '_rev': None
    }

    return custom_message

# Pass the json data as a function argument
@bp.route("/connect/", methods=["POST"])
def connect_wargame():
    data = request.get_json()
    params = extract_last_segment_and_base_url(data, query_parameters)
    wargame = params.get('wargame')
    access = params.get('access')
    host = params.get('host')

    if not (wargame and access and host):
        return jsonify({"msg": 'ok', "data": []})

    try:
        response = requests.get(f"{host}/{wargame}/last")
        response.raise_for_status()
        response_data = response.json()

        allForces = response_data.get('data', [])[0].get('data', {}).get('forces', {}).get('forces', [])
        role = None
        force = None

        for force in allForces:
            role = next((roleItem for roleItem in force.get('roles', []) if roleItem.get('roleId') == access), None)
            if role:
                break

        if not role or not force:
            return jsonify({"error": "There is no player matching the provided criteria"}), 400

        role['wargame'] = wargame
        role['host'] = host
        role['access'] = access
        
        custom_message = create_custom_message(force, role)
        response_data = {
            "msg": 'ok',
            "data": role,
            'custom_message': custom_message
        }

        return jsonify(response_data)

    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Failed to fetch data"}), 400

    return jsonify([])

