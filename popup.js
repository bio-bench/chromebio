document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['action', 'sequence'], (result) => {
    if (result.action && result.sequence) {
      document.getElementById('title').innerText = result.action;
      document.getElementById('content').innerText = result.sequence;
    } else {
      document.getElementById('title').innerText = 'No action performed.';
      document.getElementById('content').innerText = 'No sequence available.';
    }
  });
});
