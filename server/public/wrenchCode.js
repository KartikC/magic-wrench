(function() { // Get all image elements on the page
const images = document.getElementsByTagName('img');

// Attach click event listener to each image
Array.from(images).forEach(image => {
  image.addEventListener('click', () => {
    // Create a new anchor element
    const link = document.createElement('a');
    
    // Set the download attribute to force download
    link.setAttribute('download', 'image');
    
    // Set the href attribute to the image source
    link.setAttribute('href', image.src);
    
    // Trigger the download
    link.click();
  });
}); })();