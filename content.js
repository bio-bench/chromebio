// Function to detect sequence type
function detectSequenceType(sequence) {
  const dnaRegex = /^[ATCGatcg]+$/;
  const proteinRegex = /^[ACDEFGHIKLMNPQRSTVWYacdefghiklmnpqrstvwy]+$/;

  if (dnaRegex.test(sequence)) {
    return "dna";
  } else if (proteinRegex.test(sequence)) {
    return "protein";
  } else {
    return null;
  }
}

// document.addEventListener("mouseup", () => {
//   const selection = window.getSelection().toString().trim();
//   const sequenceType = detectSequenceType(selection);
// 
//   chrome.runtime.sendMessage({ action: "updateContextMenu", type: sequenceType }, (response) => {
//     console.log("Response from background:", response);
//   });
// });

