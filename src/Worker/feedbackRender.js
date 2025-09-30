import { MathJax } from 'better-react-mathjax';

export const renderFeedback = (feedback) => {
  // Split by LaTeX block delimiters (\[ ... \] and \( ... \))
  const regex = /(\\\[([\s\S]*?)\\\])|(\\\(([\s\S]*?)\\\))/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(feedback)) !== null) {
    // Add plain text before LaTeX
    if (match.index > lastIndex) {
      parts.push(feedback.slice(lastIndex, match.index));
    }
    // Add LaTeX block
    const latex = match[2] || match[4];
    if (latex) {
      parts.push(<MathJax key={match.index}>{`\\(${latex}\\)`}</MathJax>);
    }
    lastIndex = regex.lastIndex;
  }
  // Add any remaining plain text
  if (lastIndex < feedback.length) {
    parts.push(feedback.slice(lastIndex));
  }
  return parts;
};