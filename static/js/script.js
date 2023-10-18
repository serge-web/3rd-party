// Helper class for utility functions
class Helpers {
  constructor() {
    this.queryParameters = {
      wargame: 'wargame',
      access: 'access',
      host: 'host',
    };
  }

  // Helper function to check if all query parameters exist in a URL
  checkQueryParametersExist(url) {
    const parsedUrl = new URL(url);
    const { queryParameters } = this;
    return (
      parsedUrl.searchParams.has(queryParameters.wargame) &&
      parsedUrl.searchParams.has(queryParameters.access) &&
      parsedUrl.searchParams.has(queryParameters.host)
    );
  }

    // Helper function to create a new URL based on query parameters
  createNewURL(originalURL) {
    const { queryParameters } = this;
    if (this.checkQueryParametersExist(originalURL)) {
      const parsedUrl = new URL(originalURL);
      const newUrl = new URL(parsedUrl.searchParams.get(queryParameters.host));
      newUrl.searchParams.set(queryParameters.wargame, parsedUrl.searchParams.get(queryParameters.wargame));
      newUrl.searchParams.set(queryParameters.access, parsedUrl.searchParams.get(queryParameters.access));
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

  async sendRequestToServer(requestData, url) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.error) {
          throw new Error(errorData.error);
        } else {
          throw new Error('Client error! Status: 400');
        }
      }
      
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
    this.lastLog = document.createElement('span');
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
 
    // Set initial values for wargame_url and jsonData
    this.wargameUrl.value = this.helpers.createNewURL(window.location.href);
    this.setupEventListeners();
  }

  // Event listeners setup
  setupEventListeners() {
    this.disconnectButton.addEventListener('click', this.disconnectWargame.bind(this));
    this.connectButton.addEventListener('click', this.connectWargame.bind(this));
    this.messageButton.addEventListener('click', this.sendMessage.bind(this));
  }

  // Handle disconnecting from the wargame
  async disconnectWargame(event) {
    event.preventDefault();

    try {
      const response = await this.apiHandler.sendRequestToServer(this.disconnectURL, this.connectEndpoint);
      const { msg, data } = response
      
      if (data.length === 0 && msg) {
        const container = document.getElementsByClassName("container");
        container[0].style.display = 'none';
        
        this.para.remove();
        this.sendUserMessage.remove();
        this.lastLog.remove();

        this.stopMessagePolling();
        this.wargameUrl.disabled = false;
        this.wargameUrl.value = '';
        this.activeWargameURL = '';

        window.history.pushState({}, '', '/');
        this.connectButton.style.display = 'inline';
        this.disconnectButton.style.display = 'none';

        this.helpers.displayValidationMessage(this.validationResult, 'disconnected', 'green');
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
    await this.connectToWargame(wargameUrl)

  }

  // Function to connect to the wargame
  async connectToWargame(wargameUrl) {
    this.connectButton.disabled = true;
    this.wargameUrl.disabled = true;
    this.helpers.displayValidationMessage(this.validationResult, 'Load...', 'green');
    try {
      const result = await this.apiHandler.sendRequestToServer(wargameUrl, this.connectEndpoint);
      const { data, msg } = result
      if (data === null) return  this.helpers.displayValidationMessage(this.validationResult, 'enter right ', 'red')
        if (msg && data.length !== 0 && data !== null) {
          const requestData = {
            host: data.host,
            wargame: data.wargame,
          };

          await this.startMessagePolling(requestData, this.latestLogsEndpoint, 10000);
          this.para.innerText = `Connected user: ${data.name}`;
          this.connectedUser.appendChild(this.para);
          this.wargameUrl.style.background = 'white';
  
          const historyURL = `/?wargame=${data.wargame}&access=${data.roleId}&host=${data.host}`

          window.history.pushState({}, '', historyURL);
          this.connectButton.disabled = false;
          this.wargameUrl.disabled = false;
            
          this.activeWargameURL = wargameUrl;
     
        } else {
          this.connectButton.disabled = false;
          this.wargameUrl.disabled = false;
          this.helpers.displayValidationMessage(this.validationResult, 'Invalid response from the server', 'red');
        }
    } catch (error) {
        this.helpers.displayValidationMessage(this.validationResult, error.message, 'red');
        this.connectButton.disabled = false;
        this.wargameUrl.disabled = false;
      }
  }
  
  LatestLog(log) {
    const mostRecentActivityType = log.activityType.aType;
    this.lastLog.innerText = `Recent Log: ${mostRecentActivityType}`;
    this.recentMessage.appendChild(this.lastLog);
  }

  LatestMessage(message) {
    const roleName = message.details.from.roleName;
    const content = message.message.content;
    this.lastMessage.innerText =  `Recent message - ${roleName}: ${content} `;
    this.recentMessage.appendChild(this.lastMessage);
  }

  // Handle sending a user message
  async sendMessage(e) {
    e.preventDefault();

    if (!this.activeWargameURL) {
      return this.helpers.displayValidationMessage(this.validationResult, 'Please join the wargame to send a message.', 'red');
    }

    const parsedUrl = new URL(this.activeWargameURL);
    const wargameParam = parsedUrl.searchParams.get(this.helpers.queryParameters.wargame);
    const base = `${parsedUrl.protocol}//${parsedUrl.host}`;
    
    const messageData = {
      data: this.jsonData.value,
      wargame: wargameParam,
      host: base,
    };

    try {
      const response = await this.apiHandler.sendRequestToServer(messageData, this.submitMessageEndpoint);
      this.jsonData.value = '';

      if (response.msg) {
        this.LatestMessage(response.data)
      }
    } catch (error) {
      if(error.message === "Invalid JSON format") {
        this.helpers.displayValidationMessage(this.validationResult, error.message, 'red') 
      } else {
        console.error('Error sending message:', error);
      }
    }
  }

  // Update the latest log message
  updateLatestMessage(requestData, latestLogsEndpoint) {
    this.apiHandler.sendRequestToServer(requestData, latestLogsEndpoint).then((res) => {
      document.getElementsByClassName("container")[0].style.display = 'block'
      this.connectButton.style.display = 'none';
      this.disconnectButton.style.display = 'inline';

      const {latestLog, latestMessage} = res
      this.jsonData.placeholder = this.jsonData.value = JSON.stringify(latestMessage, null, 4);
      
      this.LatestLog(latestLog)
      this.LatestMessage(latestMessage)

      this.helpers.displayValidationMessage(this.validationResult, 'Connected successfully', 'green');
    });
  }

  // Start polling for log updates
  startMessagePolling(requestData, latestLogsEndpoint, intervalTime) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.updateLatestMessage(requestData, latestLogsEndpoint);

    this.intervalId = setInterval(() => {
      this.updateLatestMessage(requestData, latestLogsEndpoint);
    }, intervalTime);
  }

  // Stop polling for log updates
  stopMessagePolling() {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }
}

// Create an instance of the WargameApp class and initialize the application
const app = new WargameApp();
