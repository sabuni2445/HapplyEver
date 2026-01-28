/**
 * Formats partner names for display on wedding cards
 * Handles various formats like "Sebrina & Anji", "Sebrina and Anji", "Sebrina, Anji", "sebrina and anji", etc.
 * Returns names in uppercase joined by " & "
 * Examples:
 * - "sebrina and anji" → "SEBRINA & ANJI"
 * - "Sebrina & Anji" → "SEBRINA & ANJI"
 * - "sebrina, anji" → "SEBRINA & ANJI"
 * - "Sebrina Anji" → "SEBRINA & ANJI"
 */
export const formatPartnerNames = (partnersName) => {
  if (!partnersName || !partnersName.trim()) return "WEDDING INVITATION";
  
  // Try splitting by common separators (in order of preference)
  const separators = [
    /\s*&\s*/,           // "Sebrina & Anji"
    /\s+and\s+/i,        // "sebrina and anji" (case-insensitive)
    /,\s*/,              // "Sebrina, Anji"
    /\s+/,               // "Sebrina Anji" (space)
  ];
  
  let names = [partnersName.trim()];
  let splitFound = false;
  
  // Try each separator
  for (const separator of separators) {
    if (separator.test(names[0])) {
      names = names[0].split(separator)
        .map(n => n.trim())
        .filter(n => n.length > 0);
      splitFound = names.length > 1;
      if (splitFound) break;
    }
  }
  
  // Remove duplicates, trim, and filter empty
  const uniqueNames = [...new Set(names.map(n => n.trim()).filter(n => n))];
  
  // If we couldn't split or only have one name, check if it's actually two words
  if (!splitFound && uniqueNames.length === 1 && uniqueNames[0].includes(' ')) {
    // Split by space and take first two words as potential names
    const words = uniqueNames[0].split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 2) {
      uniqueNames[0] = words[0];
      uniqueNames[1] = words.slice(1).join(' ');
    }
  }
  
  // Format each name to uppercase and join with " & "
  const formatted = uniqueNames
    .map(name => name.toUpperCase().trim())
    .filter(name => name.length > 0)
    .join(" & ");
  
  return formatted || partnersName.toUpperCase().trim();
};

