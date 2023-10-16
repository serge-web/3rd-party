
// Helper class for utility functions
class Helpers {

  constructor() {
    // Query parameters
    this.queryParameters = {
      wargame: 'wargame',
      access: 'access',
      host: 'host',
    };
  }

  // Function to format JSON and set it for a given input element
  formatAndSetJSON(element, json) {
    const formattedJSON = JSON.stringify(json, null, 4);
    element.placeholder = formattedJSON;
    element.value = formattedJSON;
  }
  
  // Helper function to check if a string is valid JSON
  isValidJSON(jsonString) {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // Helper function to check if a text conforms to a specific format
  isValidFormat(text) {
    const pattern = /^\?wargame=[a-zA-Z0-9-]+&access=[a-zA-Z0-9-]+$/;
    return pattern.test(text);
  }
  
  // Helper function to extract the last segment from a URL
  extractLastSegmentFromUrl(url) {
    const lastSlashIndex = url.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      return url.slice(lastSlashIndex + 1);
    } else {
      // Handle the case when there is no slash in the URL
      return url;
    }
  }
  
  // Helper function to check if all query parameters exist in a URL
  checkQueryParametersExist(url) {
    const parsedUrl = new URL(url);
    // Check if all three query parameters exist
    return (
      parsedUrl.searchParams.has(this.queryParameters.wargame) &&
      parsedUrl.searchParams.has(this.queryParameters.access) &&
      parsedUrl.searchParams.has(this.queryParameters.host)
    );
  }
  
  // Helper function to create a new URL based on query parameters
  createNewURL(originalURL) {
    if (this.checkQueryParametersExist(originalURL)) {
      const parsedUrl = new URL(originalURL);
      const newUrl = new URL(parsedUrl.searchParams.get(this.queryParameters.host));
      newUrl.searchParams.set(
        this.queryParameters.wargame,
        parsedUrl.searchParams.get(this.queryParameters.wargame)
      );
      newUrl.searchParams.set(
        this.queryParameters.access,
        parsedUrl.searchParams.get(this.queryParameters.access)
      );
      return newUrl.toString();
    } else {
      return '';
    }
  }
  
  // Helper function to display validation messages
  displayValidationMessage(element, message, color) {
    element.textContent = message;
    element.style.color = color;
  }
}

// APIHandler class for making API requests
class APIHandler {
  constructor() {
    this.latestLogsEndpoint = '/logs-latest';
    this.connectEndpoint = '/connect/';
    this.submitMessageEndpoint = '/send_message';
  }

  async get(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return { status: response.status };
      }
      const data = await response.json();
      if (data.msg === 'ok') {
        return data.data;
      } else {
        return { status: 404 };
      }
    } catch (error) {
      console.warn('Server failed to respond', url, error);
      throw error;
    }
  }

  async sendRequestToServer(requestData, url) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}

// Define a WargameApp class to encapsulate the application logic
class WargameApp {
  constructor() {
    // DOM elements
    this.apiHandler = new APIHandler();
    this.helpers = new Helpers();
    this.form = document.querySelector('form');
    this.wargameUrl = document.getElementById('wargame_url');
    this.recentMessage = document.getElementById('recent_message');
    this.lastMessage = document.createElement('span');
    this.sendUserMessage = document.createElement('span');
    this.connectedUser = document.getElementById('connected_user');
    this.connectButton = document.querySelector('button[type="submit"]');
    this.jsonData = document.getElementById('json_data');
    this.disconnectButton = document.getElementById('disconnectButton');
    this.validationResult = document.getElementById('validationResult');
    this.para = document.createElement('h2');
    this.messageButton = document.getElementById('sendMessage');
    this.intervalId = null;
    
    // API endpoints
    this.latestLogsEndpoint = '/logs-latest';
    this.connectEndpoint = '/connect/';
    this.submitMessageEndpoint = '/send_message';

    // Default disconnect URL
    this.disconnectURL = '?wargame=&access=';

    // Active Wargame URL
    this.activeWargameURL = '';
    // JSON schema for sending messages
    this.schema = {
      details: {
        channel: 'game-admin',
        turnNumber: 4,
        from: {
          force: 'Blue',
          forceColor: '#3dd0ff',
          forceId: 'blue',
          roleId: 'CO',
          roleName: 'CO',
          iconURL: 'http://localhost:8080/default_img/forceDefault.png',
        },
        messageType: 'Chat',
        timestamp: '2020-12-06T11:06:12.434Z',
      },
      message: {
        content: 'hello',
      },
      _id: new Date().toISOString(),
      _rev: undefined,
      hasBeenRead: 'false',
      isOpen: 'false',
      messageType: 'CustomMessage',
    };

    // Set initial values for wargame_url and jsonData
    this.wargameUrl.value = this.helpers.createNewURL(window.location.href);
    this.helpers.formatAndSetJSON(this.jsonData, this.schema);
    this.setupEventListeners();
  }

  // Event listeners setup
  setupEventListeners() {
    this.form.addEventListener('submit', this.submitForm.bind(this));
    this.disconnectButton.addEventListener('click', this.disconnectWargame.bind(this));
    this.connectButton.addEventListener('click', this.connectWargame.bind(this));
    this.messageButton.addEventListener('click', this.sendMessage.bind(this));
  }

  submitForm(event) {
    const wargameUrl = this.wargameUrl.value.trim();
    const parts = wargameUrl.split('/');
    const textAfterLastSlash = parts[parts.length - 1];
    const isConforming = this.helpers.isValidFormat(textAfterLastSlash);

    if (!isConforming) {
      event.preventDefault();
      this.helpers.displayValidationMessage('Invalid URL format', 'red');
    }
  }

  // Handle disconnecting from the wargame
  async disconnectWargame(event) {
    event.preventDefault();

    try {
      const response = await this.apiHandler.get(this.connectEndpoint + this.disconnectURL);

      if (response.length === 0) {
        const container = document.getElementsByClassName("container");
        container[0].style.display = 'none';
        
        this.para.remove();
        this.sendUserMessage.remove();
        this.lastMessage.remove();

        this.stopLogPolling();
        this.wargameUrl.disabled = false;
        this.wargameUrl.value = '';
        this.activeWargameURL = '';

        window.history.pushState({}, '', '/');
        this.connectButton.style.display = 'inline';
        this.disconnectButton.style.display = 'none';

        this.helpers.displayValidationMessage(this.validationResult, 'dissconnect sccsesful', 'red');
      } else {
        console.error('Failed to disconnect.');
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }

  // Handle connecting to the wargame
  async connectWargame(event) {
    event.preventDefault();
    const wargameUrl = this.wargameUrl.value.trim();

    if (!wargameUrl) return this.helpers.displayValidationMessage(this.validationResult,'Please enter a valid URL', 'red');

    const { base, lastSegment, wargameParam } = this.extractLastSegmentAndBaseURL(wargameUrl);

    if (this.helpers.isValidFormat(lastSegment)) {
      this.connectButton.disabled = true;
      this.wargameUrl.disabled = true;
      try {
        await this.connectToWargame(wargameUrl, base, lastSegment, wargameParam);
      } catch (error) {
        this.helpers.displayValidationMessage(this.validationResult, 'An error occurred', 'red');
        console.error('Error:', error);
      }
    } else {
      this.helpers.displayValidationMessage(this.validationResult, 'Invalid URL format', 'red');
    }
  }

  // Function to connect to the wargame
  async connectToWargame(wargameUrl, base, lastSegment, wargameParam) {
    const connectURL = `${this.connectEndpoint}${lastSegment}&host=${base}`;

    try {
      const result = await this.apiHandler.get(connectURL);
      const requestData = {
        host: base,
        wargame: wargameParam,
      };

      window.history.pushState({}, '', `${lastSegment}&host=${base}`);
      this.connectButton.disabled = false;
      this.wargameUrl.disabled = false;

      if (result) {
        const container = document.getElementsByClassName("container");
        // await this.getLastLogs(requestData, this.latestLogsEndpoint)
        await this.startLogPolling(requestData, this.latestLogsEndpoint, 10000);
        container[0].style.display = 'block'
        this.para.innerText = `Connected user: ${result.name}`;
        this.connectedUser.appendChild(this.para);
        this.wargameUrl.disabled = true;
        this.wargameUrl.style.background = 'white';
        
        this.activeWargameURL = wargameUrl;
        this.connectButton.style.display = 'none';
        this.disconnectButton.style.display = 'inline';
        this.helpers.displayValidationMessage(this.validationResult, 'Connected successfully', 'green');
      } else {
        this.helpers.displayValidationMessage(this.validationResult, 'Invalid response from the server', 'red');
      }
    } catch (error) {
      this.connectButton.disabled = false;
      this.wargameUrl.disabled = false;
      this.helpers.displayValidationMessage(this.validationResult, 'Failed to connect', 'red');
      console.error('Error:', error);
    }
  }

  // Handle sending a user message
  async sendMessage(e) {
    e.preventDefault();
    const displaySentMessage = (messageContent) => {
      this.sendUserMessage.innerText = `Send Message: ${messageContent}`;
      this.recentMessage.appendChild(this.sendUserMessage);
    };

    if (!this.activeWargameURL) {
      return this.helpers.displayValidationMessage(this.validationResult, 'Please join the wargame to send a message.', 'red');
    }

    if (!this.helpers.isValidJSON(this.jsonData.value)) {
      return this.helpers.displayValidationMessage(this.validationResult,'Please enter text in JSON format.', 'red');
    }

    const { base, wargameParam } = this.extractLastSegmentAndBaseURL(this.activeWargameURL);
    const messageData = {
      data: this.jsonData.value,
      wargame: wargameParam,
      host: base,
    };

    try {
      const response = await this.apiHandler.sendRequestToServer(messageData, this.submitMessageEndpoint);
      this.jsonData.value = '';

      if (response.msg) {
        const messageContent = response.data.message.content;
        displaySentMessage(messageContent);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  // Helper function to extract base URL, last segment, and wargame parameter from a URL
  extractLastSegmentAndBaseURL(url) {
    const parsedUrl = new URL(url);
    const wargameParam = parsedUrl.searchParams.get(this.helpers.queryParameters.wargame);
    const base = `${parsedUrl.protocol}//${parsedUrl.host}`;
    const lastSegment = this.helpers.extractLastSegmentFromUrl(url);
    return { base, lastSegment, wargameParam };
  }

  // Update the latest log message
  updateLatestLog(requestData, latestLogsEndpoint) {
    this.apiHandler.sendRequestToServer(requestData, latestLogsEndpoint).then((res) => {
      const mostRecentActivityType = res.activityType.aType;
      this.lastMessage.innerText = `Recent Message: ${mostRecentActivityType}`;
      this.recentMessage.appendChild(this.lastMessage);
    });
  }

  // Start polling for log updates
  startLogPolling(requestData, latestLogsEndpoint, intervalTime) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.updateLatestLog(requestData, latestLogsEndpoint);

    this.intervalId = setInterval(() => {
      this.updateLatestLog(requestData, latestLogsEndpoint);
    }, intervalTime);
  }

  // Stop polling for log updates
  stopLogPolling() {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }
}

// Create an instance of the WargameApp class and initialize the application
const app = new WargameApp();
