// IRT difficulty map (b values) — same scale as theta (-4 to +4)
// 5-level scale gives better resolution without being confusing for teachers
const DIFFICULTY_B = {
    'Very Easy': -2.5,
    'Easy':      -1.25,
    'Medium':     0.0,
    'Hard':       1.25,
    'Very Hard':  2.5,
    // Legacy numeric values from old question form (1-5)
    1: -2.5,
    2: -1.25,
    3:  0.0,
    4:  1.25,
    5:  2.5,
};

/**
 * 1PL (Rasch) EAP theta update.
 *
 * @param {string|number} difficulty  - "Very Easy"|"Easy"|"Medium"|"Hard"|"Very Hard" or 1-5
 * @param {boolean}       isCorrect   - whether the student answered correctly
 * @param {number}        priorTheta  - current theta estimate
 * @param {number}        questionIndex - 0-based index of this question in the session
 * @returns {number} updated theta, clamped to [-4, 4]
 */
export function abilityEstimate(difficulty, isCorrect, priorTheta, questionIndex) {
    const b = DIFFICULTY_B[difficulty] ?? 0.0;

    // Probability of correct response under the 1PL model (correct sign)
    const P = 1 / (1 + Math.exp(-(priorTheta - b)));

    // Learning rate shrinks as evidence accumulates — avoids wild swings
    const learningRate = 1 / (1 + 0.25 * (questionIndex ?? 0));

    const newTheta = priorTheta + learningRate * ((isCorrect ? 1 : 0) - P);

    return Math.max(-4, Math.min(4, newTheta));
}

/**
 * Convert a theta value to a 0–100 readiness percentage.
 * Theta range -4 to +4 maps linearly to 0–100%.
 */
export function thetaToReadiness(theta) {
    return Math.max(0, Math.min(100, ((theta + 4) / 8) * 100));
}
