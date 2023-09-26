chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'executeArbitraryCode') {
      try {
        // CAUTION: Executing arbitrary code can be dangerous.
        eval(request.code);
      } catch (error) {
        console.error("Failed to execute arbitrary code:", error);
      }
    }
  });
  