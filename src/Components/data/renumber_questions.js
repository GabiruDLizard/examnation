const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'generated_bgcs_questions_200_named.json');
const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Remove duplicates by "Question Text"
const seen = new Set();
const uniqueQuestions = questions.filter(q => {
  const key = q["Question Text"].trim();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// Renumber Question IDs
const renumbered = uniqueQuestions.map((q, idx) => ({
  ...q,
  "Question ID": idx + 1
}));

const outPath = path.join(__dirname, 'generated_bgcs_questions_200_named_deduped.json');
fs.writeFileSync(outPath, JSON.stringify(renumbered, null, 2));

console.log(`Done! ${renumbered.length} unique questions saved as generated_bgcs_questions_200_named_deduped.json`);