# routes/home.py
from flask import Blueprint, render_template, request
from urllib.parse import urlparse, urlencode
bp = Blueprint('home', __name__)

query_parameters = {
    'wargame': 'wargame',
    'access': 'access',
    'host': 'host',
}

# Helper function to check if all query parameters exist in a URL
def check_query_parameters_exist(url, query_parameters):
    parsed_url = urlparse(url)
    return all(param in parsed_url.query for param in query_parameters)

# Helper function to create a new URL based on query parameters
def create_new_url(original_url, query_parameters):
    if check_query_parameters_exist(original_url, query_parameters):
        parsed_url = urlparse(original_url)
        query_dict = dict(p.split('=') for p in parsed_url.query.split('&'))
        
        new_url = f'{query_dict[query_parameters["host"]]}/?{query_parameters["wargame"]}={query_dict[query_parameters["wargame"]]}&{query_parameters["access"]}={query_dict[query_parameters["access"]]}'
        
        return new_url
    else:
        return ''

@bp.route("/", methods=["GET"])
def home():
    wargame_url = ''
    request_url = request.url
    if check_query_parameters_exist(request.url, query_parameters):
      wargame_url = create_new_url(request.url, query_parameters)
      
    return render_template("index.html", wargame_url = wargame_url)
