//CONFIG
let currentEnv = "production"; // Change to "production" when deploying

const config = {
  development: {
    apiUrl: "http://localhost:3000"
  },
  production: {
    apiUrl: "https://airbender-server.vercel.app"
  }
};

let API_URL = config[currentEnv].apiUrl;

let isEnabled = false; // To keep track of the extension state
let jsCodeToExecute = null;
let shadowRoot;

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enable') {
    isEnabled = true;
    addPanel();
  } else if (request.action === 'disable') {
    isEnabled = false;
    removePanel();
  }
});

// Function to add the panel
async function addPanel() {
  if (!isEnabled) return; // Exit if the extension is disabled

  // Create a shadow root host
  const host = document.createElement('div');
  host.id = 'airbender-root';
  document.body.appendChild(host);

  // Set the shadow root
  shadowRoot = host.attachShadow({mode: 'closed'});

  // Styles for the shadow root, targeting specific classes or IDs
  const style = `
  <style>
    .container {
      background-color: #2e2e2e;
      color: #fff;
      font-family: 'Arial', sans-serif;
      padding: 20px;
      width: 250px;
      position: fixed;
      top: 0;
      right: 0;
      z-index: 9999;
    }
    #devModeToggle, label[for='devModeToggle'] {
      font-size: 12px; /* smaller font size */
      color: #ccc;  /* lighter color */
    }
    .container button, .container textarea {
      display: block;
      margin: 10px 0;
      padding: 10px;
      border-radius: 5px;
      box-sizing: border-box;
      width: 100%;
    }
    .container textarea {
      height: 100px;
      resize: none;
      background-color: #3a3a3a;
      color: #fff;
      border: 1px solid #555;
    }
    .container button {
      background-color: #3a3a3a;
      color: #fff;
      border: 1px solid #555;
    }
    .container button:hover {
      background-color: #4a4a4a;
    }
    #bookmarkletContainer {
      margin-top: 10px;
      padding-top: 10px;
    }
    a {
      color: #1e90ff;
    }
    a:hover {
      color: #63a4ff;
    }
    p {
      font-size: 14px;
    }
    #commandDisplayArea {
      white-space: pre-wrap !important;  /* Allows text to wrap */
      font-family: 'Courier New', monospace !important; /* Monospace font */
      font-size: 12px;  /* Smaller font size */
      word-break: break-all;  /* To prevent overflow */
      overflow-wrap: break-word;  /* Allows text to wrap onto the next line */
      max-width: 100%;  /* Maximum width */
      max-height: 100px;
      border: 1px solid #555;  /* Optional: for visual distinction */
      padding: 10px;  /* Optional: for padding */
      overflow-y: scroll !important;
    }
  </style>
`;

  // Create a container for your popup content
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="container">
      <textarea id="userInput" placeholder="Describe what you want to change on this site and then click the button to make it happen!"></textarea>
      <button id="generate">Generate Command</button>
      <div id="commandContainer" style="display:none;">
        <p>Received Command: </p>
        <div id="commandDisplayArea"></div>
      </div>
      <div id="bookmarkletContainer" style="display:none;">
        <p>Click the link below to apply your changes:</p>
        <a id="bookmarkletLink" href="#">Turn Wrench</a>
        <p><b>If it didn't work</b>, simply drag the link to your bookmarks and click it there. This is due to browser restrictions on injecting arbitrary code.</p>
      </div>
      <div id="savedCommandsList" style="display:none;">
        <p>Saved Commands:</p>
          <ul id="commandNamesList">
          </ul>
      </div>
      <label for="devModeToggle">
        <input type="checkbox" id="devModeToggle"> Enable Dev Mode
      </label>
    </div>
  `;
  


  // Attach the styles and the container to the shadow root
  shadowRoot.innerHTML = style;
  shadowRoot.appendChild(container);

  // Get the textarea element
  const userInput = shadowRoot.getElementById("userInput");

  // Listen for focus event on the textarea
  userInput.addEventListener("focus", function(event) {
    // Capture all keydown events when textarea is focused
    window.addEventListener("keydown", captureKeys);
  });

  // Listen for blur event on the textarea
  userInput.addEventListener("blur", function(event) {
    // Remove the keydown event listener when textarea loses focus
    window.removeEventListener("keydown", captureKeys);
  });

  const generateButton = shadowRoot.getElementById("generate");
  generateButton.addEventListener("click", fetchData);

  // New code to update API_URL
  const devModeToggle = shadowRoot.getElementById("devModeToggle");

  devModeToggle.addEventListener('change', function() {
    currentEnv = devModeToggle.checked ? "development" : "production";
    // Update API_URL dynamically
    API_URL = config[currentEnv].apiUrl;
  });

  try {
    const savedCommands = await fetchSavedCommands();
    console.log('Saved Commands:', savedCommands); // here
    const commandNamesList = shadowRoot.getElementById("commandNamesList");
    savedCommands.forEach(command => {
      console.log('Individual Command:', command); // here
      const listItem = document.createElement('li');
      listItem.textContent = command.name;
      listItem.dataset.code = command.jsCodeToExecute;  // Store the code in the dataset but don't display it
      commandNamesList.appendChild(listItem);
    });
    shadowRoot.getElementById("savedCommandsList").style.display = "block";
  } catch (error) {
    console.error("Failed to fetch saved commands:", error);
  }

  const commandNamesList = shadowRoot.getElementById("commandNamesList");
  commandNamesList.addEventListener("click", function(event) {
    if (event.target.tagName === 'LI') {
      jsCodeToExecute = event.target.dataset.code;
      updateUI(event.target.textContent, jsCodeToExecute);
    }
  });
  

}

// Function to remove the panel
function removePanel() {
  const host = document.getElementById('airbender-root');
  if (host) host.remove();
}

// Function to capture key events
function captureKeys(event) {
  // Stop the event from bubbling up and being captured by other elements
  event.stopPropagation();
}

async function fetchData() {
  const userInput = shadowRoot.getElementById("userInput").value;
  const commandDisplayArea = shadowRoot.getElementById("commandDisplayArea");

  try {
    console.log(`${API_URL}/api/processInput`);
    const response = await fetch(`${API_URL}/api/processInput`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInput: userInput,
        domInfo: captureDOMInfo(),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.command) {
        jsCodeToExecute = data.command;
        // Assuming you have a function fetchBookmarkletName() similar to what you had in popup.js
        const bookmarkletName = await fetchBookmarkletName(jsCodeToExecute);
        updateUI(bookmarkletName, jsCodeToExecute);

        if(data.finalPrompt) {
          const cleanURL = getCleanURL();
          //send userdata to server
          const userdata = {
            url: cleanURL,
            userPrompt: userInput,
            finalPrompt: data.finalPrompt,
            name: bookmarkletName,
            command: jsCodeToExecute,
          };

          sendDataToServer(userdata);
        } else {
          console.log("no final prompt recieved, no userdata sent.");
        }

      } else {
        commandDisplayArea.textContent = "No executable command received.";
      }
      
    } else {
      console.log('Server returned an error.');
      showErrorPopup(`Server returned an error: ${await response.text()}`);
    }

  } catch (error) {
    console.error('Failed to communicate with the server:', error);
    showErrorPopup(`Failed to communicate with the server: ${error}`);
  }
}

function captureDOMInfo() {
  const domInfo = {};

  // Current URL
  //domInfo.currentUrl = window.location.href;

  // Page Title
  domInfo.pageTitle = document.title;

  // IDs and Classes
  domInfo.ids = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
  domInfo.classes = Array.from(document.querySelectorAll('[class]')).flatMap(el => Array.from(el.classList));

  // Form Info
  const forms = document.querySelectorAll('form');
  domInfo.formNamesOrIds = Array.from(forms).map(form => form.name || form.id);

  // Button and Link Text
  const buttons = document.querySelectorAll('button');
  const links = document.querySelectorAll('a');
  domInfo.buttonTexts = Array.from(buttons).map(button => button.innerText.trim());
  domInfo.linkTexts = Array.from(links).map(link => link.innerText.trim());

  // Meta Tags
  //const metaTags = document.querySelectorAll('meta');
  //domInfo.metaContent = Array.from(metaTags).map(meta => ({name: meta.name, content: meta.content}));

  // Count of Elements by Tag
  //const tags = ['div', 'span', 'img', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  //domInfo.elementsByTag = {};
  //tags.forEach(tag => {
  //  domInfo.elementsByTag[tag] = document.querySelectorAll(tag).length;
  //});

  return domInfo;
}


async function fetchBookmarkletName(code) {
  try {
    const response = await fetch(`${API_URL}/api/nameWrench`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.name; // Assuming the API returns { name: 'Some Name' }
    } else {
      return "Unnamed";
    }
  } catch (error) {
    console.error('Failed to fetch bookmarklet name:', error);
    return "Unnamed";
  }
}

function updateUI(bookmarkletName, jsCodeToExecute) {
  // Remove existing error popup if any
  const existingErrorPopup = shadowRoot.getElementById('error-popup');
  if (existingErrorPopup) {
    existingErrorPopup.remove();
  }

  const commandDisplayArea = shadowRoot.getElementById("commandDisplayArea");
  commandDisplayArea.textContent = `${jsCodeToExecute}`;

  const bookmarkletCode = `javascript:${encodeURI(jsCodeToExecute)}`;
  shadowRoot.getElementById('bookmarkletLink').href = bookmarkletCode;

  // Update bookmarklet display
  shadowRoot.getElementById('bookmarkletLink').textContent = bookmarkletName;
  shadowRoot.getElementById('bookmarkletContainer').style.display = "block";
  shadowRoot.getElementById('commandContainer').style.display = "block";
}

function showErrorPopup(errorMessage) {
  const popup = document.createElement('div');
  popup.id = 'error-popup';
  popup.innerHTML = `
    <div style="background-color: red; color: white; padding: 20px; position: fixed; bottom: 0; right: 0; z-index: 10000;">
      Error: ${errorMessage}
    </div>
  `;
  shadowRoot.appendChild(popup);
}

// Function to send data to server
async function sendDataToServer(data) {
  try {
    const isDev = (currentEnv === "development"); // Set this flag based on the current environment
    const extendedData = { ...data, isDev: isDev }; // Add the isDev field to the data object

    const response = await fetch(`${API_URL}/api/updateTable`, { // Note that we use API_URL here
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Optionally include an authorization header
      },
      body: JSON.stringify(extendedData), // Send the extended data object
    });

    if (response.ok) {
      const jsonResponse = await response.json();
      // handle success
      console.log('userdata sent to server!')
    } else {
      // handle error
      console.log('userdata rejected by server!')
    }
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
}

function getCleanURL() {
  const url = new URL(window.location.href);
  let cleanURL = `${url.protocol}//${url.hostname}`;
  if (url.port) {
    cleanURL += `:${url.port}`;
  }
  return cleanURL;
}

async function fetchSavedCommands() {
  const cleanURL = getCleanURL();
  const response = await fetch(`${API_URL}/api/getCommands`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: cleanURL }),
  });

  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Failed to fetch commands");
  }
}




