export async function abilityEstimate(difficulty, score, priorEstimate, examLength) {
    const theta = priorEstimate;
    const weight = [
        {difficulty: "Hard", value: 5},
        {difficulty: "Medium", value: 3},
        {difficulty: "Easy", value: 1}
    ];
    const numquestions = [
        {Length: 20, value: 0.3},
        {Length: 10, value: 0.4},
        {Length: 5, value: 0.5},
        {Length: 1, value: 0.6}
    ]
    const correctness = (score) ? 1 : 0;
    const difficultyMatch = weight.find(w => w.difficulty === difficulty);
    const difficultyValue = difficultyMatch ? difficultyMatch.value : 3; // default to Medium
    const rateMatch = numquestions.find(n => n.Length === examLength);
    const learningRate = rateMatch ? rateMatch.value : 0.4; // default to 10-question rate
    const newEstimate = theta + (learningRate * (correctness - (1 / (1 + Math.exp(difficultyValue + theta)))));
    return newEstimate;
}