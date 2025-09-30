const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'generated_bgcs_questions_200_named_deduped.json');
const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function getDifficulty(q) {
  const text = q["Question Text"].toLowerCase();
  const topic = q.Topic.toLowerCase();

  // Easy
  if (
    topic.includes('number properties') ||
    topic.includes('percentages') ||
    topic.includes('ratios') ||
    topic.includes('geometry (circles/area)') && !text.includes('prove') && !text.includes('complex') ||
    topic.includes('mensuration') && text.includes('rectangle') && !text.includes('volume') ||
    topic.includes('coordinate geometry') && !text.includes('prove') && !text.includes('complex') ||
    topic.includes('statistics') && (text.includes('mean') || text.includes('median')) && !text.includes('mode')
  ) return "Easy";

  // Hard
  if (
    topic.includes('trigonometry') ||
    topic.includes('quadratics') && (text.includes('complex') || text.includes('i') || text.includes('prove')) ||
    topic.includes('simultaneous') && text.includes('fraction') ||
    topic.includes('statistics') && text.includes('mode') ||
    topic.includes('probability') && text.includes('multiple events') ||
    text.includes('prove') ||
    text.includes('justify') ||
    text.includes('explain')
  ) return "Hard";

  // Medium (default)
  return "Medium";
}

const adjusted = questions.map(q => ({
  ...q,
  Difficulty: getDifficulty(q)
}));

const outPath = path.join(__dirname, 'generated_bgcs_questions_200_named_adjusted.json');
fs.writeFileSync(outPath, JSON.stringify(adjusted, null, 2));
console.log('Difficulties adjusted and saved as generated_bgcs_questions_200_named_adjusted.json');