(function() { // Select all feed items
const feedItems = document.querySelectorAll('.feed-shared-update-v2');

// Iterate over each item and apply styles
feedItems.forEach(item => {
  // Make the item smaller
  item.style.transform = 'scale(0.8)';
  
  // Make all text neon
  const textElements = item.querySelectorAll('*');
  textElements.forEach(element => {
    element.style.textShadow = '0 0 5px #ff00ff';
  });
}); })();