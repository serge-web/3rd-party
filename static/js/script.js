// DOM elements
const form = document.querySelector('form');
const wargame_url = document.getElementById('wargame_url');
const recent_message = document.getElementById('recent_message');
const lastMessage = document.createElement('span');
const sendUserMessage = document.createElement('span');
const connected_user = document.getElementById('connected_user');
const connectButton = document.querySelector('button[type="submit"]');
const jsonData = document.getElementById('json_data');
const disconnectButton = document.getElementById('disconnectButton');
const validationResult = document.getElementById('validationResult');
const para = document.createElement('h2');
const messageButton = document.getElementById('sendMessage');

// API endpoints
const latestLogsEndpoint = '/logs-latest';
const connectEndpoint = '/connect/';
const submitMessageEndpoint = '/send_message';

// Default disconnect URL
const disconnectURL = '?wargame=&access=';

// Active Wargame URL
let activeWargameURL = '';

// Query parameters
const queryParameters = {
  wargame: 'wargame',
  access: 'access',
  host: 'host'
}

// JSON schema for sending messages
const schema = {
    "details": {
        "channel": "game-admin",
        "turnNumber": 4,
        "from": {
            "force": "Blue",
            "forceColor": "#3dd0ff",
            "forceId": "blue",
            "roleId": "CO",
            "roleName": "CO",
            "iconURL": "http://localhost:8080/default_img/forceDefault.png"
        },
        "messageType": "Chat",
        "timestamp":  "2020-12-06T11:06:12.434Z"
    },
    "message": {
        "content": 'hello'
    },
    "_id": new Date().toISOString(),
     "_rev":undefined,
    "hasBeenRead": 'false',
    "isOpen": 'false',
    "messageType": "CustomMessage"
}

// Helper function to check if a string is valid JSON
const isValidJSON = (jsonString) => {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to check if a text conforms to a specific format
const  isValidFormat = (text) => {
  // Define a regular expression pattern to match the format
  const pattern = /^\?wargame=[a-zA-Z0-9-]+&access=[a-zA-Z0-9-]+$/;

  return pattern.test(text);
}

// Helper function to extract the last segment from a URL
const extractLastSegmentFromUrl  = (url) => {
  const lastSlashIndex = url.lastIndexOf('/');
  if (lastSlashIndex !== -1) {
    return url.slice(lastSlashIndex + 1);
  } else {
    // Handle the case when there is no slash in the URL
    return url;
  }
};

// Helper function to check if all query parameters exist in a URL
const checkQueryParametersExist = (url) => {
  const parsedUrl = new URL(url);

  // Check if all three query parameters exist
  return (
    parsedUrl.searchParams.has(queryParameters.wargame) &&
    parsedUrl.searchParams.has(queryParameters.access) &&
    parsedUrl.searchParams.has(queryParameters.host)
  );
};

// Helper function to create a new URL based on query parameters
const createNewURL = (originalURL) => {
  if(checkQueryParametersExist(originalURL)) {
    const parsedUrl = new URL(originalURL);
    const newUrl = new URL(parsedUrl.searchParams.get(queryParameters.host));

    newUrl.searchParams.set(queryParameters.wargame, parsedUrl.searchParams.get(queryParameters.wargame));
    newUrl.searchParams.set(queryParameters.access, parsedUrl.searchParams.get(queryParameters.access));

    return newUrl.toString();
  } else {
     return  ''
  }
};

// Helper function to extract query parameters from a URL
const getURLParameters = (url) => {
  const searchParams = new URLSearchParams(url);
  const params = {};

  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  return params;
};

// Helper function to display validation messages
const displayValidationMessage = (message, color) => {
    validationResult.textContent = message;
    validationResult.style.color = color;
};

// Helper function to extract base URL, last segment, and wargame parameter from a URL
const extractLastSegmentAndBaseURL = (url) => {
  const parsedUrl = new URL(url);
  const wargameParam = parsedUrl.searchParams.get(queryParameters.wargame);
  const base = `${parsedUrl.protocol}//${parsedUrl.host}`;
  const lastSegment = extractLastSegmentFromUrl(url);
  return { base, lastSegment, wargameParam };
};

// Set initial values for wargame_url and jsonData
wargame_url.value = createNewURL(window.location.href);
jsonData.value = JSON.stringify(schema);

form.addEventListener('submit', function (event) {
  const wargameUrl = wargame_url.value.trim();
  const parts = wargameUrl.split('/');
  const textAfterLastSlash = parts[parts.length - 1];
  const isConforming = isValidFormat(textAfterLastSlash);

  if (!isConforming) {
    event.preventDefault();
    displayValidationMessage('Invalid URL format', 'red')
  }

});

const disconnectWargame = async (event) => {
    event.preventDefault();
  try {
    const response = await fetch(connectEndpoint + disconnectURL, {
      method: 'GET',
    });
    const result = await response.json();

    if (result.length === 0) {
      para.remove();
      sendUserMessage.remove();
      lastMessage.remove();

      wargame_url.disabled = false;
      wargame_url.value = '';
      activeWargameURL = '';

      window.history.pushState({}, '', `/`);
      connectButton.style.display = 'inline';
      disconnectButton.style.display = 'none';
    } else {
      console.error('Failed to disconnect.');
    }
  } catch (error) {
      console.error('An error occurred:', error);
    }
};

const connectWargame =  async (event) => {
  event.preventDefault(); // Prevent the default form submission behavior
  const wargameUrl = wargame_url.value.trim();

  if (!wargameUrl) return  displayValidationMessage('Please enter a valid URL', 'red')

  const { base, lastSegment, wargameParam } = extractLastSegmentAndBaseURL(wargameUrl);

  if (isValidFormat(lastSegment)) {
    connectButton.disabled = true;
    wargame_url.disabled = true;
    try {
      await get(`${connectEndpoint}${lastSegment}&host=${base}`)
          .then(async (result) => {
              const requestData = {
                host: base,
                wargame: wargameParam,
              };

              window.history.pushState({}, '', `${lastSegment}&host=${base}`);
              connectButton.disabled = false;
              wargame_url.disabled = false;
              if (result) {
                await sendRequestToServer(requestData, latestLogsEndpoint).then((res) => {
                  const mostRecentActivityType = res.activityType.aType;
                  lastMessage.innerText = `Recent Message: ${mostRecentActivityType}`;
                  recent_message.appendChild(lastMessage);
                });

                para.innerText = `Connected user: ${result.name}`;
                connected_user.appendChild(para);
                wargame_url.disabled = true;
                wargame_url.style.background = 'white';
                activeWargameURL = wargameUrl;
                connectButton.style.display = 'none';
                disconnectButton.style.display = 'inline';
                displayValidationMessage('Connected successfully', 'green');
              } else {
                displayValidationMessage('Invalid response from the server', 'red');
              }
          })
          .catch((error) => {
            connectButton.disabled = false;
            wargame_url.disabled = false;
            displayValidationMessage('Failed to connect', 'red');
            console.error('Error:', error);
          });
          } catch (error) {
            displayValidationMessage('An error occurred', 'red')
              console.error('Error:', error);
          }
      } else {
        displayValidationMessage('Invalid URL format', 'red')
      }
  };

const sendMessage = async (e) => {
  e.preventDefault();
  const displaySentMessage = (messageContent) => {
    sendUserMessage.innerText = `Send Message: ${messageContent}`;
    recent_message.appendChild(sendUserMessage);
  };

  if (!activeWargameURL) {
    return displayValidationMessage('Please join the wargame to send a message.', 'red')
  }

  if (!isValidJSON(jsonData.value)) {
     return displayValidationMessage('Please enter text in JSON format.', 'red');
  }

  // Extract base URL and wargame parameter
  const { base, wargameParam } = extractLastSegmentAndBaseURL(activeWargameURL);

  const messageData = {
    data: jsonData.value,
    wargame: wargameParam,
    host: base,
  };

  try {

    const response = await sendRequestToServer(messageData, submitMessageEndpoint);
    jsonData.value = '';

    if (response.msg) {
      const messageContent = response.data.message.content;

      displaySentMessage(messageContent);
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

disconnectButton.addEventListener('click', disconnectWargame);
connectButton.addEventListener('click', connectWargame);
messageButton.addEventListener('click', sendMessage);

const sendRequestToServer = (requestData, url) => {
  return new Promise((resolve, reject) => {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })
    .then((response) => {
      if (!response.ok) {
        reject(new Error(`HTTP error! Status: ${response.status}`));
        return;
      }
      return response.json();
    })
    .then((responseData) => {
      resolve(responseData);
    })
    .catch((error) => {
      reject(error);
    });
  });
};

function get(url) {
  return new Promise((resolve, reject) => {

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          resolve({ status: response.status });
          return;
        }
        return response.json();
      })
      .then((data) => {
        if (data.msg === 'ok') {
          resolve(data.data);
        } else {
          resolve({ status: 404 });
        }
      })
      .catch((error) => {
        console.warn('Server failed to respond', url, error);
        reject(error);
      });
  });
}



