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

// ─── Difficulty-weighted topic mastery ───────────────────────────────────────
// Replaces per-topic IRT theta for topic mastery tracking.
// Correct answers on harder questions earn more mastery.
// Wrong answers on harder questions penalise more.
// A decaying learning rate means recent answers matter more than old ones.

const MASTERY_WEIGHTS = {
    'Very Easy': { correct: 0.5,  wrong: -0.25 },
    'Easy':      { correct: 1,    wrong: -0.5  },
    'Medium':    { correct: 2,    wrong: -1    },
    'Hard':      { correct: 3,    wrong: -2    },
    'Very Hard': { correct: 4,    wrong: -3    },
    1: { correct: 0.5, wrong: -0.25 },
    2: { correct: 1,   wrong: -0.5  },
    3: { correct: 2,   wrong: -1    },
    4: { correct: 3,   wrong: -2    },
    5: { correct: 4,   wrong: -3    },
};

const MAX_CORRECT_WEIGHT = 4; // Very Hard correct
const MAX_WRONG_PENALTY  = 3; // Very Hard wrong (abs)

/** Minimum questions answered before topic mastery is considered reliable. */
export const MASTERY_MIN_QUESTIONS = 3;

/**
 * Update a topic mastery score (0–100) given one new answer.
 *
 * @param {string|number} difficulty      - difficulty label or 1-5
 * @param {boolean}       isCorrect       - whether the student got it right
 * @param {number}        currentMastery  - current mastery score 0–100
 * @param {number}        questionsAnswered - how many questions answered on this topic so far
 * @returns {number} updated mastery, clamped to [0, 100]
 */
export function updateTopicMastery(difficulty, isCorrect, currentMastery, questionsAnswered) {
    const w = MASTERY_WEIGHTS[difficulty] ?? { correct: 2, wrong: -1 };

    // Target mastery this answer pulls toward
    const target = isCorrect
        ? 60 + (w.correct / MAX_CORRECT_WEIGHT) * 40   // 70 (Easy) → 100 (Very Hard)
        : 40 - (Math.abs(w.wrong) / MAX_WRONG_PENALTY) * 40; // 33 (Easy) → 0 (Very Hard)

    // Learning rate decays as evidence accumulates — recent answers carry more weight
    const alpha = Math.max(0.05, 1 / (1 + 0.3 * questionsAnswered));

    return Math.max(0, Math.min(100, currentMastery + alpha * (target - currentMastery)));
}
