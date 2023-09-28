console.log('Background script running');

let enabledTabs = new Set();

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, {action: 'toggle'}, (response) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    if (response.status === 'enabled') {
      enabledTabs.add(tab.id);
    } else if (response.status === 'disabled') {
      enabledTabs.delete(tab.id);
    }
  });
});
