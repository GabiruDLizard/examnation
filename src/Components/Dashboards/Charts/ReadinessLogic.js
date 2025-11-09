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
        {length: 1, value: 0.6}
    ]
    const correctness = (score) ? 1 : 0;
    const difficultyValue = weight.find(w => w.difficulty === difficulty).value;
    const learningRate = numquestions.find(n => n.Length === examLength).value;
    const newEstimate = theta + (learningRate * (correctness - (1 / (1 + Math.exp(difficultyValue + theta)))));
    console.log('New Estimate:', newEstimate);
    return newEstimate;
}