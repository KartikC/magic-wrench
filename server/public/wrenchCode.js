(function() { // Get all images
const images = document.getElementsByTagName('img');

// Loop through each image and flip it horizontally
for (let i = 0; i < images.length; i++) {
  images[i].style.transform = 'scaleX(-1)';
}

// Get all elements with text content
const textElements = document.querySelectorAll('*:not(script):not(link)');

// Loop through each element and make the text color green
for (let i = 0; i < textElements.length; i++) {
  textElements[i].style.color = 'green';
} })();