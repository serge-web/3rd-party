from datetime import datetime

SECRET_KEY = 'sscascaccac'

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
