let jsCodeToExecute = null;

const iframe = document.getElementById('sandbox');
window.addEventListener('message', function(event) {
  console.log('Eval output:', event.data);
});

document.addEventListener("DOMContentLoaded", function () {
  const executeButton = document.getElementById("execute");
  const runCommandButton = document.getElementById("runCommand");
  const commandDisplayArea = document.getElementById("commandDisplayArea");
  
  executeButton.addEventListener("click", fetchData);
  runCommandButton.addEventListener("click", executeCode);

  async function fetchData() {
    const userInput = document.getElementById("userInput").value;

    const domInfo = {
      numberOfButtons: document.querySelectorAll('button').length,
      numberOfImages: document.querySelectorAll('img').length,
    };

    console.log(domInfo);

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
        console.log(data.command); //raw command
        jsCodeToExecute = extractJSCodeFromPrompt(data.command);
        console.log(jsCodeToExecute); //extracted command
        
        if (jsCodeToExecute) {
          commandDisplayArea.textContent = `Received Command: ${jsCodeToExecute}`;
          runCommandButton.removeAttribute("disabled");
        } else {
          commandDisplayArea.textContent = "No executable command received.";
          runCommandButton.setAttribute("disabled", "disabled");
        }
        
      } else {
        console.log('Server returned an error.');
      }

    } catch (error) {
      console.error('Failed to communicate with the server:', error);
    }
  }
});

function executeCode() {
  console.log(`trying to execute: ${jsCodeToExecute}`);
  if (jsCodeToExecute) {
    // Execute the script in the active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const tab = tabs[0];
      if (tab && tab.id) {
        chrome.scripting.executeScript({
          target: {tabId: tab.id},
          function: new Function(jsCodeToExecute)
        }).then((result) => {
          console.log("Script executed successfully:", result);
        }).catch((error) => {
          console.error("Failed to execute script:", error);
        });
      } else {
        console.error("No active tab found");
      }
    });
  } else {
    console.error("No JS code to execute");
  }
}



function extractJSCodeFromPrompt(prompt) {
  // Regular expression to extract JavaScript code enclosed in triple backticks ```javascript ... ```
  const codeRegex = /```javascript([\s\S]*?)```/i;
  const match = prompt.match(codeRegex);

  if (match && match[1]) {
    return match[1].trim();
  } else {
    return null;
  }
}

