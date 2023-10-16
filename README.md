# 3rd-party
Demonstrator of 3rd party access to Serge

Flask Application README
This README provides instructions on how to set up and run the Flask application.

Prerequisites
Before running the application, make sure you have the following installed on your system:

Python 3.x
Flask
Requests (a Python library for making HTTP requests) 

# Setup 

1. git clone <https://github.com/serge-web/3rd-party.git>
2. cd <3rd-party directory>

python -m venv venv
pip install -r requirements.txt
python app.py

The application should now be running locally. You should see output in the terminal indicating that the Flask development server is running.

# Accessing the Application
You can access the application in your web browser by navigating to http://localhost:5000.

# Quick Connection to Games & Roles & Host

For developers, there are convenient methods for directly connecting to specific wargames while registered as a particular user. This can be achieved using the wargame, access, and host URL parameters, as demonstrated below:

```base
http://localhost:5000/?wargame=wargame-l6nngxlk&access=umpire&host=http://localhost:8080

```

Alternatively, you can provide the URL of the wargame you want to connect to in the "Enter the Wargame URL" input field:

```base
http://localhost:8080/?wargame=wargame-l6nngxlk&access=umpire
```
