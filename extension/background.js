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
