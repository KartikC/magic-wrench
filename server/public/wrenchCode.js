(function() { // Removing user info from feed items
const feedItems = document.querySelectorAll('.feed-shared-update-v2');
feedItems.forEach(item => {
  const actorContainer = item.querySelector('.update-components-actor');
  actorContainer.remove();
});

// Making content larger
const content = document.querySelectorAll('.update-components-update-v2__commentary, .update-components-article__title');
content.forEach(item => {
  item.classList.add('t-16', 't-black', 't-bold');
}); })();