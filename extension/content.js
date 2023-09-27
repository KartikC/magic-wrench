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
function addPanel() {
  if (!isEnabled) return; // Exit if the extension is disabled


  // Create a shadow root host
  const host = document.createElement('div');
  host.id = 'your-extension-root';
  document.body.appendChild(host);

  // Set the shadow root
  shadowRoot = host.attachShadow({mode: 'closed'});

  // Create a container for your popup content
  const container = document.createElement('div');
  container.innerHTML = `
    <div style="position: fixed; top: 0; right: 0; z-index: 9999; width: 250px; background-color: #2e2e2e; color: #fff; padding: 20px;">
      <textarea id="userInput" placeholder="Enter your command" style="display: block; margin: 10px 0; padding: 10px; border-radius: 5px; box-sizing: border-box; width: 100%; height: 100px; resize: none; background-color: #3a3a3a; color: #fff; border: 1px solid #555;"></textarea>
      <button id="generate" style="display: block; margin: 10px 0; padding: 10px; border-radius: 5px; box-sizing: border-box; width: 100%; background-color: #3a3a3a; color: #fff; border: 1px solid #555;">Generate</button>
      <div id="commandDisplayArea"></div>
      <div id="bookmarkletContainer" style="display:none; border-top: 1px solid #555; margin-top: 20px; padding-top: 20px;">
        <p id="dragText" style="display:none;">Drag this to your bookmarks bar:</p>
        <a id="bookmarkletLink" href="#" style="display:none; color: #1e90ff;">Turn Wrench</a>
      </div>
    </div>
  `;
  // Attach the container to the shadow root
  shadowRoot.appendChild(container);

  // The rest of your JavaScript logic can be added here, adapted from popup.js
  // ...previous content script code...

  const generateButton = shadowRoot.getElementById("generate");
  generateButton.addEventListener("click", fetchData);
}

// Function to remove the panel
function removePanel() {
  const host = document.getElementById('your-extension-root');
  if (host) host.remove();
}

async function fetchData() {
  const userInput = shadowRoot.getElementById("userInput").value;
  const commandDisplayArea = shadowRoot.getElementById("commandDisplayArea");

  // Assuming you have a function captureDomInfoFromActiveTab() similar to what you had in popup.js
  const domInfo = captureDOMInfo();

  try {
    const response = await fetch('http://localhost:3000/process-input', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInput: userInput,
        domInfo: domInfo,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      jsCodeToExecute = extractJSCodeFromPrompt(data.command);
      
      if (jsCodeToExecute) {
        // Assuming you have a function fetchBookmarkletName() similar to what you had in popup.js
        const bookmarkletName = await fetchBookmarkletName(jsCodeToExecute);
        updateUI(bookmarkletName, jsCodeToExecute);
      } else {
        commandDisplayArea.textContent = "No executable command received.";
      }
      
    } else {
      console.log('Server returned an error.');
    }

  } catch (error) {
    console.error('Failed to communicate with the server:', error);
  }
}

function captureDOMInfo() {
  // Your logic here...
  // Since we're in the content script, you can access the DOM directly.
  return {};
}

function extractJSCodeFromPrompt(prompt) {
  // Regular expression to extract JavaScript code enclosed in triple backticks ```javascript ... ```
  const codeRegex = /```javascript([\s\S]*?)```/i;
  const match = prompt.match(codeRegex);

  if (match && match[1]) {
    // Wrapping the extracted code in an IIFE
    const wrappedCode = `(function() { ${match[1].trim()} })();`;
    return wrappedCode;
  } else {
    return null;
  }
}

async function fetchBookmarkletName(code) {
  try {
    const response = await fetch('http://localhost:3000/name-wrench', {
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
  const commandDisplayArea = shadowRoot.getElementById("commandDisplayArea");
  commandDisplayArea.textContent = `Received Command: ${jsCodeToExecute}`;

  const bookmarkletCode = `javascript:${encodeURI(jsCodeToExecute)}`;
  shadowRoot.getElementById('bookmarkletLink').href = bookmarkletCode;

  // Update bookmarklet display
  shadowRoot.getElementById('bookmarkletLink').textContent = bookmarkletName;
  shadowRoot.getElementById('bookmarkletContainer').style.display = "block";
  shadowRoot.getElementById('dragText').style.display = "block";
  shadowRoot.getElementById('bookmarkletLink').style.display = "block";
}
