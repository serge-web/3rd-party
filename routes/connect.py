# routes/connect.py
from flask import Blueprint, request, jsonify
import requests

bp = Blueprint('connect', __name__)

# Pass the json data as a function argument
@bp.route("/connect/", methods=["GET"])
def connect_wargame():

    wargame = request.args.get('wargame')
    access = request.args.get('access')
    host = request.args.get('host')
    if not wargame or not access:
        return jsonify([])

    try:
        response = requests.get(f"{host}/{wargame}/last")
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
        # error_message = str(e)
        return jsonify(None)

    return jsonify([])
