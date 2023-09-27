console.log('Background script running');

let enabledTabs = new Set();

chrome.action.onClicked.addListener((tab) => {
  if (enabledTabs.has(tab.id)) {
    enabledTabs.delete(tab.id);
    // Send message to content script to remove the panel
    chrome.tabs.sendMessage(tab.id, {action: 'disable'});
  } else {
    enabledTabs.add(tab.id);
    // Send message to content script to add the panel
    chrome.tabs.sendMessage(tab.id, {action: 'enable'});
  }
});

// function runCommand(command) {
//     new Function(command)();
// }

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === 'executeCode') {
//         // Find the active tab to execute the script in
//         chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
//             const tab = tabs[0];
//             chrome.scripting.executeScript({
//                 target: {tabId: tab.id},
//                 func: runCommand,
//                 args: [request.code]
//             }, (result) => {
//                 if (chrome.runtime.lastError) {
//                     console.error(chrome.runtime.lastError);
//                 }
//             });
//         });
//     }
//     // ... handle other actions
//   });
  