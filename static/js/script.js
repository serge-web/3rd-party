// Helper class for utility functions
class Helpers {   
  constructor() {
    this.queryParameters = {
      wargame: 'wargame',
      access: 'access',
      host: 'host',
    };
  };
  
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
  };

  // Helper function to check if all query parameters exist in a URL
  checkQueryParametersExist(url) {
    const parsedUrl = new URL(url);
    const { queryParameters } = this;
    return (
      parsedUrl.searchParams.has(queryParameters.wargame) &&
      parsedUrl.searchParams.has(queryParameters.access) &&
      parsedUrl.searchParams.has(queryParameters.host)
    );
  };

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
  };

  // Helper function to display validation messages
  displayValidationMessage(element, message, color) {
    element.textContent = message;
    element.style.color = color;
  };
};

// Define a WargameApp class to encapsulate the application logic
class WargameApp extends Helpers {
  constructor() {
    super();

    // DOM elements
    this.wargameUrl = document.getElementById('wargame_url');
    this.recentMessage = document.getElementById('recent_message');
    this.lastLog = document.createElement('span');
    this.loader = document.getElementsByClassName("loading");
    this.lastMessage = document.createElement('span');
    this.sendUserMessage = document.createElement('span');
    this.connectButton = document.querySelector('button[type="submit"]');
    this.jsonData = document.getElementById('json_data');
    this.disconnectButton = document.getElementById('disconnectButton');
    this.validationResult = document.getElementById('validationResult');
    this.para = document.createElement('h2');
    this.customMessage = [];
    this.intervalId = null;

    // API endpoints
    this.latestLogsEndpoint = '/message-latest/';
    this.connectEndpoint = '/connect/';
    this.submitMessageEndpoint = '/send_message';

    // Default disconnect URL
    this.disconnectURL = '?wargame=&access=';

    // Active Wargame URL
    this.activeWargameURL = '';
 
    // Set initial values for wargame_url and jsonData
    this.wargameUrl.value = this.createNewURL(window.location.href);
    this.setupEventListeners();
  };

  // Event listeners setup
  setupEventListeners() {
    const messageButton = document.getElementById('sendMessage');
    const clearMessageButton = document.getElementById('clearMessage');
    
    messageButton.addEventListener('click', this.sendMessage.bind(this));
    clearMessageButton.addEventListener('click', () => this.jsonData.value = '');
    this.disconnectButton.addEventListener('click', this.disconnectWargame.bind(this));
    this.connectButton.addEventListener('click', this.connectWargame.bind(this));
    window.addEventListener('DOMContentLoaded', this.initializeOnDOMLoad.bind(this));
  };
   
  async initializeOnDOMLoad(e) {
    const existingWargameUrl = this.createNewURL(window.location.href);
    if (!existingWargameUrl) return
    this.connectWargame(e)
  };

  // Handle disconnecting from the wargame
  async disconnectWargame(event) {
    event.preventDefault();

    const resetUI = () => {
      this.para.remove();
      this.sendUserMessage.remove();
      this.lastLog.remove();
      this.lastMessage.remove();
      this.wargameUrl.value = '';
      this.activeWargameURL = '';
      this.connectButton.style.display = 'inline';
      this.disconnectButton.style.display = 'none';
      this.wargameUrl.disabled = false;
      this.connectButton.disabled = false;
      window.history.pushState({}, '', '/');
    };
  
    try {
      const response = await this.sendRequestToServer(this.disconnectURL, this.connectEndpoint);
      const { msg, data } = response;
  
      if (data.length === 0 && msg) {
        const container = document.querySelector('.container');
        if (container) {
          container.style.display = 'none';
        }

        this.stopMessagePolling();
        resetUI();
        this.displayValidationMessage(this.validationResult, 'disconnected', 'green');
      } else {
        console.error('Failed to disconnect.');
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };

  // Handle connecting to the wargame
  async connectWargame(event) {
    event.preventDefault();
    const wargameUrl = this.wargameUrl.value.trim();

    if (!wargameUrl) return this.displayValidationMessage(this.validationResult,'Please enter a valid URL', 'red');
    await this.connectToWargame(wargameUrl)
  };

  // Function to connect to the wargame
  async connectToWargame(wargameUrl) {
    this.connectButton.disabled = true;
    this.wargameUrl.disabled = true;
    this.loader[0].style.display = 'flex' 
    try {
      const result = await this.sendRequestToServer(wargameUrl, this.connectEndpoint);
      const { data, custom_message, msg } = result;

      if (data === null) return  this.displayValidationMessage(this.validationResult, 'enter right ', 'red');
        if (msg && data.length !== 0 && data !== null) {
          const requestData = {
            host: data.host,
            wargame: data.wargame,
          };

          await this.startMessagePolling(requestData, this.latestLogsEndpoint, 10000);
          this.customMessage = custom_message;
          this.jsonData.placeholder = 'type the text';

          this.para.innerText = `Connected user: ${data.name}`;
          document.getElementById('connected_user').appendChild(this.para);
          this.wargameUrl.style.background = 'white';
  
          const historyURL = `/?wargame=${data.wargame}&access=${data.access}&host=${data.host}`
          window.history.pushState({}, '', historyURL);

          this.activeWargameURL = wargameUrl;
        } else {
          this.loader[0].style.display = 'none' 
          this.connectButton.disabled = false;
          this.wargameUrl.disabled = false;
          this.displayValidationMessage(this.validationResult, 'Invalid response from the server', 'red');
        }
    } catch (error) {
        this.loader[0].style.display = 'none' 
        this.displayValidationMessage(this.validationResult, error.message, 'red');
        this.connectButton.disabled = false;
        this.wargameUrl.disabled = false;
      }
  };
  
  LatestLog(log) {
    const mostRecentActivityType = log.activityType.aType;
    this.lastLog.innerText = `Recent Log: ${mostRecentActivityType}`;
    this.recentMessage.appendChild(this.lastLog);
  };

  LatestMessage(message) {
    const roleName = message.details.from.roleName;
    const content = message.message.content;
    this.lastMessage.innerText =  `Recent message - ${roleName}: ${content} `;
    this.recentMessage.appendChild(this.lastMessage);
  };

  // Handle sending a user message
  async sendMessage(e) {
    e.preventDefault();
  
    if (!this.activeWargameURL) {
      this.displayValidationMessage(this.validationResult, 'Please join the wargame to send a message.', 'red');
      return;
    }
  
    try {
      const details = { ...this.customMessage.details, timestamp: new Date().toISOString() };
      const customMessage = {
        ...this.customMessage,
        _id: new Date().toISOString(),
        message: { content: this.jsonData.value },
        details: details
      };
  
      const parsedUrl = new URL(this.activeWargameURL);
      const wargameParam = parsedUrl.searchParams.get(this.queryParameters.wargame);
      const base = `${parsedUrl.protocol}//${parsedUrl.host}`;
  
      const messageData = {
        data: JSON.stringify(customMessage),
        wargame: wargameParam,
        host: base,
      };
  
      const response = await this.sendRequestToServer(messageData, this.submitMessageEndpoint);
  
      if (response.msg) {
        this.LatestMessage(response.data);
        this.jsonData.value = ''
      }
    } catch (error) {
      if (error.message === "Invalid JSON format") {
        this.displayValidationMessage(this.validationResult, error.message, 'red');
      } else {
        console.error('Error sending message:', error);
      }
    }
  };

  // Update the latest log message
  updateLatestMessage(requestData, latestLogsEndpoint) {
    this.sendRequestToServer(requestData, latestLogsEndpoint).then((res) => {
      const {latestLog, latestMessage} = res;

      if (!this.activeWargameURL) { 
        res.abort()
        return 
      }

      this.LatestLog(latestLog);
      this.LatestMessage(latestMessage);

      this.loader[0].style.display = 'none' 
      document.getElementsByClassName("container")[0].style.display = 'block';
      this.connectButton.style.display = 'none';
      this.disconnectButton.style.display = 'inline';
      this.displayValidationMessage(this.validationResult, 'Connected successfully', 'green');

    });
  };

  // Start polling for log updates
  startMessagePolling(requestData, latestLogsEndpoint, intervalTime) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.updateLatestMessage(requestData, latestLogsEndpoint);

    this.intervalId = setInterval(() => {
      this.updateLatestMessage(requestData, latestLogsEndpoint);
    }, intervalTime);
  };

  // Stop polling for log updates
  stopMessagePolling() {
    clearInterval(this.intervalId);
    this.intervalId = null;
  };
};

// Create an instance of the WargameApp class and initialize the application
const app = new WargameApp();
