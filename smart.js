document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['sequence'], (result) => {
    document.getElementById('sqBox').value = result.sequence;
    document.getElementById('smartForm').submit();
  });
});
