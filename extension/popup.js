let jsCodeToExecute = null;

document.addEventListener("DOMContentLoaded", function () {
  const generateButton = document.getElementById("generate");
  const commandDisplayArea = document.getElementById("commandDisplayArea");
  
  generateButton.addEventListener("click", fetchData);

  async function fetchData() {
    const userInput = document.getElementById("userInput").value;

    let domInfo = null;

    try {
      domInfo = await captureDomInfoFromActiveTab();
    } catch (error) {
      console.error("An error occurred while getting DOM info:", error);
    }

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
          // Fetch the bookmarklet name dynamically
          const bookmarkletName = await fetchBookmarkletName(jsCodeToExecute);
          updateUI(bookmarkletName);
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
});

// function executeCode() {
//   console.log(`trying to execute: ${jsCodeToExecute}`);
//   if (jsCodeToExecute) {
//     // Execute the script in the active tab
//     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//       const tab = tabs[0];
//       if (tab && tab.id) {
//         chrome.scripting.executeScript({
//           target: {tabId: tab.id},
//           function: new Function(jsCodeToExecute)
//         }).then((result) => {
//           console.log("Script executed successfully:", result);
//         }).catch((error) => {
//           console.error("Failed to execute script:", error);
//         });
//       } else {
//         console.error("No active tab found");
//       }
//     });
//   } else {
//     console.error("No JS code to execute");
//   }
// }

// function executeCode() {
//   console.log(`trying to execute: ${jsCodeToExecute}`);
//   if (jsCodeToExecute) {
//     // Execute the script in the active tab
//     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//       const tab = tabs[0];
//       if (tab && tab.id) {
//         chrome.scripting.executeScript({
//           target: {tabId: tab.id},
//           function: injectScript,
//           args: [jsCodeToExecute]
//         }).then((result) => {
//           console.log("Script injected successfully:", result);
//         }).catch((error) => {
//           console.error("Failed to inject script:", error);
//         });
//       } else {
//         console.error("No active tab found");
//       }
//     });
//   } else {
//     console.error("No JS code to execute");
//   }
// }

function executeCode() {
  // Assume `jsCodeToExecute` contains the arbitrary JS code.
  console.log(`trying to execute: ${jsCodeToExecute}`);
  if (jsCodeToExecute) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      let activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {action: "executeArbitraryCode", code: jsCodeToExecute});
    });
  } else {
    console.error("No JS code to execute");
  }
}


// A function to inject a script tag with JavaScript code into the DOM.
// This will be injected into the tab.
// function injectScript(codeToInject) {
//   const scriptElement = document.createElement('script');
//   scriptElement.textContent = codeToInject;
//   (document.head || document.documentElement).appendChild(scriptElement);
//   scriptElement.remove();
// }

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

function updateUI(bookmarkletName) {
  const commandDisplayArea = document.getElementById("commandDisplayArea");
  commandDisplayArea.textContent = `Received Command: ${jsCodeToExecute}`;

  const bookmarkletCode = `javascript:${encodeURI(jsCodeToExecute)}`;
  document.getElementById('bookmarkletLink').href = bookmarkletCode;
  
  // Update bookmarklet display
  document.getElementById('bookmarkletLink').textContent = bookmarkletName;
  document.getElementById('bookmarkletContainer').style.display = "block";
  document.getElementById('dragText').style.display = "block";
  document.getElementById('bookmarkletLink').style.display = "block";
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

// Function to capture DOM info asynchronously from the active tab
async function captureDomInfoFromActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const tab = tabs[0];
      if (tab && tab.id) {
        chrome.scripting.executeScript({
          target: {tabId: tab.id},
          function: function captureDOMInfo() {
            const selectors = [
              'button', 'a', 'input', 'textarea', 'select',
              'img'
            ];

            const domInfo = {};

            selectors.forEach(selector => {
              const elements = Array.from(document.querySelectorAll(selector));
              if (elements.length > 0) {
                domInfo[selector] = elements.map((element, index) => {
                  return {
                    id: element.id,
                    className: element.className
                  };
                });
              }
            });

            return domInfo;
          }
        }, (injectionResults) => {
          const domInfo = (injectionResults && injectionResults.length > 0) ? injectionResults[0].result : null;
          resolve(domInfo);
        });
      } else {
        reject("No active tab found");
      }
    });
  });
}
