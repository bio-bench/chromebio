chrome.runtime.onInstalled.addListener(() => {
  // Top-level menu
  chrome.contextMenus.create({
    id: "clean-sequence",
    title: "Clean Sequence",
    contexts: ["selection"]
  });

  // Nucleotide Analysis Menu
  chrome.contextMenus.create({
    id: "nucleotide-analysis",
    title: "Nucleotide Analysis",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "nucleotide-properties",
    parentId: "nucleotide-analysis",
    title: "Nucleotide Properties",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "transform-sequence",
    parentId: "nucleotide-analysis",
    title: "Reverse/Complement",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "blastn",
    parentId: "nucleotide-analysis",
    title: "Send to BLASTN",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "translate",
    parentId: "nucleotide-analysis",
    title: "Translate Sequence",
    contexts: ["selection"]
  });

  // Protein Analysis Menu
  chrome.contextMenus.create({
    id: "protein-analysis",
    title: "Protein Analysis",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "protein-properties",
    parentId: "protein-analysis",
    title: "Protein Properties",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "blastp",
    parentId: "protein-analysis",
    title: "Send to BLASTP",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "smart",
    parentId: "protein-analysis",
    title: "Send to SMART",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "pdb",
    parentId: "protein-analysis",
    title: "Send to PDB",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const action = info.menuItemId;
  const sequence = info.selectionText;
  const { fastaHeader, cleanedSequence } = cleanSequence(sequence);
  let data = {};

  if (action === "clean-sequence") {
    data = { action: "Cleaned Sequence", sequence: fastaHeader + cleanedSequence };
  } else if (action === 'transform-sequence') {
    const reversedSequence = reverseSequence(cleanedSequence);
    const complementSequence = getComplementSequence(cleanedSequence);
    const reverseComplementSequence = reverseComplement(cleanedSequence);
    data = { 
      action: "Transformed Sequences", 
      sequence: `Reversed Sequence:\n` + fastaHeader + `${reversedSequence}\n\n` + `Complement Sequence:\n`+ fastaHeader + `${complementSequence}\n\n` + `Reverse Complement Sequence:\n`+ fastaHeader + `${reverseComplementSequence}` 
    };
  } else if (action === "nucleotide-properties") {
    const gcContent = calculateGCContent(cleanedSequence);
    const atContent = calculateATContent(cleanedSequence);
    data = { action: "Nucleotide Properties", sequence: fastaHeader + `GC Content: ${gcContent}%\nAT Content: ${atContent}%` };
  } else if (action === "translate") {
    const translatedSequences = translateSequence(fastaHeader, cleanedSequence);
    data = { action: "Translated Sequences", sequence: translatedSequences };
  } else if (action === "protein-properties") {
    const properties = calculateProteinProperties(cleanedSequence);
    data = { action: "Protein Properties", sequence: fastaHeader + properties };
  } else if (action === "blastn") {
    const url = `https://blast.ncbi.nlm.nih.gov/Blast.cgi?PAGE_TYPE=BlastSearch&QUERY=${encodeURIComponent(cleanedSequence)}&PROGRAM=blastn`;
    chrome.tabs.create({ url });
    return;
  } else if (action === "blastp") {
    const url = `https://blast.ncbi.nlm.nih.gov/Blast.cgi?PAGE_TYPE=BlastSearch&QUERY=${encodeURIComponent(cleanedSequence)}&PROGRAM=blastp`;
    chrome.tabs.create({ url });
    return;
  } else if (action === "smart") {
    chrome.storage.local.set({ sequence: cleanedSequence }, () => {
      const url = chrome.runtime.getURL('smart.html');
      chrome.tabs.create({ url });
    });
    return;
  } else if (action === "pdb") {
    const encodedSequence = encodeURIComponent(cleanedSequence);
    const pdbRequest = `{"query":{"type":"group","logical_operator":"and","nodes":[{"type":"terminal","service":"sequence","parameters":{"evalue_cutoff":0.1,"identity_cutoff":0,"sequence_type":"protein","value":"${encodedSequence}"}}]},"return_type":"entry","request_options":{"paginate":{"start":0,"rows":25},"results_content_type":["experimental"],"sort":[{"sort_by":"score","direction":"desc"}],"scoring_strategy":"combined"},"request_info":{"query_id":"13a1794c57eb50e6f7108366f29d86fb"}}`;
    const encodedPdbRequest = encodeURIComponent(pdbRequest).replace(/%7B/g, '{').replace(/%7D/g, '}').replace(/%22/g, '"');
    const url = `https://www.rcsb.org/search?request=${encodedPdbRequest}`;
    chrome.tabs.create({ url });
    return;
  }

  chrome.storage.local.set({ action: data.action, sequence: data.sequence }, () => {
    const url = chrome.runtime.getURL('popup.html');
    chrome.tabs.create({ url });
  });
});

function cleanSequence(sequence) {
  let fastaHeader = "";
  if (sequence.startsWith(">")) {
    const lines = sequence.split("\n");
    fastaHeader = lines[0] + "\n";
    sequence = lines.slice(1).join("");
  }
  const cleanedSequence = sequence.replace(/[^A-Za-z]/g, "").toUpperCase();

  return { fastaHeader, cleanedSequence };
}

function reverseSequence(sequence) {
  return sequence.split('').reverse().join('');
}

function getComplementSequence(sequence) {
  const complement = { A: 'T', T: 'A', C: 'G', G: 'C', a: 't', t: 'a', c: 'g', g: 'c' };
  return sequence.split('').map(base => complement[base] || base).join('');
}

function reverseComplement(sequence) {
  return reverseSequence(getComplementSequence(sequence));
}

function calculateGCContent(sequence) {
  const gcCount = sequence.match(/[GCgc]/g)?.length || 0;
  return ((gcCount / sequence.length) * 100).toFixed(2);
}

function calculateATContent(sequence) {
  const atCount = sequence.match(/[ATat]/g)?.length || 0;
  return ((atCount / sequence.length) * 100).toFixed(2);
}

function translateSequence(fastaHeader, sequence) {
  const frames = [1, 2, 3, -1, -2, -3];
  const translations = frames.map(frame => ({
    frame: frame,
    sequence: translateFrame(sequence, frame)
  }));

  return translations.map(t => `Frame ${t.frame}:\n${fastaHeader}${t.sequence}`).join('\n\n');
}

function translateFrame(sequence, frame) {
  const codonTable = {
    "ATA": "I", "ATC": "I", "ATT": "I", "ATG": "M",
    "ACA": "T", "ACC": "T", "ACG": "T", "ACT": "T",
    "AAC": "N", "AAT": "N", "AAA": "K", "AAG": "K",
    "AGC": "S", "AGT": "S", "AGA": "R", "AGG": "R",
    "CTA": "L", "CTC": "L", "CTG": "L", "CTT": "L",
    "CCA": "P", "CCC": "P", "CCG": "P", "CCT": "P",
    "CAC": "H", "CAT": "H", "CAA": "Q", "CAG": "Q",
    "CGA": "R", "CGC": "R", "CGG": "R", "CGT": "R",
    "GTA": "V", "GTC": "V", "GTG": "V", "GTT": "V",
    "GCA": "A", "GCC": "A", "GCG": "A", "GCT": "A",
    "GAC": "D", "GAT": "D", "GAA": "E", "GAG": "E",
    "GGA": "G", "GGC": "G", "GGG": "G", "GGT": "G",
    "TCA": "S", "TCC": "S", "TCG": "S", "TCT": "S",
    "TTC": "F", "TTT": "F", "TTA": "L", "TTG": "L",
    "TAC": "Y", "TAT": "Y", "TAA": "_", "TAG": "_",
    "TGC": "C", "TGT": "C", "TGA": "_", "TGG": "W"
  };

  let protein = "";
  if (frame < 0) {
    sequence = reverseComplement(sequence);
    frame = Math.abs(frame);
  }
  for (let i = frame - 1; i < sequence.length - 2; i += 3) {
    const codon = sequence.substring(i, i + 3).toUpperCase();
    protein += codonTable[codon] || "?";
  }
  return protein;
}

function calculateProteinProperties(sequence) {
  const aaWeights = {
    A: 89.1, R: 174.2, N: 132.1, D: 133.1, C: 121.2,
    E: 147.1, Q: 146.2, G: 75.1, H: 155.2, I: 131.2,
    L: 131.2, K: 146.2, M: 149.2, F: 165.2, P: 115.1,
    S: 105.1, T: 119.1, W: 204.2, Y: 181.2, V: 117.1
  };

  const aaDistribution = {};
  let weight = 0;
  for (const aa of sequence) {
    const upperAA = aa.toUpperCase();
    weight += aaWeights[upperAA] || 0;
    aaDistribution[upperAA] = (aaDistribution[upperAA] || 0) + 1;
  }

  const isoelectricPoint = calculateIsoelectricPoint(aaDistribution, sequence.length);

  return `Molecular Weight: ${weight.toFixed(2)} Da\nIsoelectric Point: ${isoelectricPoint.toFixed(2)}\nAmino Acid Distribution: ${JSON.stringify(aaDistribution, null, 2)}`;
}

function calculateIsoelectricPoint(aaDistribution, length) {
  // Simplified method to estimate pI based on amino acid distribution.
  const pKValues = { A: 6.00, R: 10.76, N: 5.41, D: 2.77, C: 5.07, E: 3.22, Q: 5.65, G: 6.06, H: 7.59, I: 6.04, L: 6.04, K: 9.74, M: 5.74, F: 5.48, P: 6.30, S: 5.68, T: 5.60, W: 5.89, Y: 5.66, V: 6.02 };
  let total = 0;
  for (const aa in aaDistribution) {
    total += pKValues[aa] * aaDistribution[aa];
  }
  return total / length;
}
