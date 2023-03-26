const baseTitle = "VirtualCurator // ";
const scrollText = " --- Welcome to the VirtualCurator app! Enjoy your experience. ";
let currentScrollPosition = 0;

function updateTitleScroll() {
  const visibleText = scrollText.substr(currentScrollPosition, 10);
  const newTitle = baseTitle + visibleText;

  // Increment the current scroll position and wrap around if it exceeds the length of the scrollText
  currentScrollPosition = (currentScrollPosition + 1) % scrollText.length;

  return newTitle;
}

const scrollInterval = 300; // Scroll speed in milliseconds
setInterval(() => {
  const newTitle = updateTitleScroll();
  postMessage(newTitle);
}, scrollInterval);
