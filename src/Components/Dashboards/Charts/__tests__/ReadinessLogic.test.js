import { abilityEstimate, thetaToReadiness } from '../ReadinessLogic';

describe('abilityEstimate', () => {
    describe('update direction', () => {
        it('increases theta when a medium question is answered correctly at theta=0', () => {
            expect(abilityEstimate('Medium', true, 0, 0)).toBeGreaterThan(0);
        });

        it('decreases theta when a medium question is answered incorrectly at theta=0', () => {
            expect(abilityEstimate('Medium', false, 0, 0)).toBeLessThan(0);
        });
    });

    describe('clamping', () => {
        it('clamps theta at +4 — correct answer at upper bound stays at +4', () => {
            expect(abilityEstimate('Very Easy', true, 4, 0)).toBe(4);
        });

        it('clamps theta at -4 — wrong answer at lower bound stays at -4', () => {
            expect(abilityEstimate('Very Hard', false, -4, 0)).toBe(-4);
        });

        it('never returns a value above 4', () => {
            expect(abilityEstimate('Very Easy', true, 3.9, 0)).toBeLessThanOrEqual(4);
        });

        it('never returns a value below -4', () => {
            expect(abilityEstimate('Very Hard', false, -3.9, 0)).toBeGreaterThanOrEqual(-4);
        });
    });

    describe('learning rate', () => {
        it('produces a larger update at questionIndex=0 than at questionIndex=10', () => {
            const deltaAt0 = Math.abs(abilityEstimate('Medium', true, 0, 0) - 0);
            const deltaAt10 = Math.abs(abilityEstimate('Medium', true, 0, 10) - 0);
            expect(deltaAt10).toBeLessThan(deltaAt0);
        });

        it('at questionIndex=0 applies a full learning rate of 1.0 — theta=0 + 0.5 = 0.5', () => {
            // learningRate=1, P=0.5 (theta=0, b=0), delta = 1*(1-0.5) = 0.5
            expect(abilityEstimate('Medium', true, 0, 0)).toBeCloseTo(0.5, 5);
        });

        it('at questionIndex=3 applies learningRate = 1/(1+0.25*3) ≈ 0.5714', () => {
            const expected = 0 + (1 / (1 + 0.25 * 3)) * 0.5;
            expect(abilityEstimate('Medium', true, 0, 3)).toBeCloseTo(expected, 5);
        });
    });

    describe('difficulty map', () => {
        it('accepts numeric difficulty 3 (≡ Medium) and gives same result as "Medium"', () => {
            expect(abilityEstimate(3, true, 0, 0)).toBeCloseTo(abilityEstimate('Medium', true, 0, 0), 10);
        });

        it('falls back to b=0 for an unrecognised difficulty label', () => {
            expect(abilityEstimate('Unknown', true, 0, 0)).toBeCloseTo(abilityEstimate('Medium', true, 0, 0), 10);
        });
    });
});

describe('thetaToReadiness', () => {
    it('maps theta=-4 to 0', () => expect(thetaToReadiness(-4)).toBe(0));
    it('maps theta=+4 to 100', () => expect(thetaToReadiness(4)).toBe(100));
    it('maps theta=0 to 50', () => expect(thetaToReadiness(0)).toBeCloseTo(50, 5));
    it('maps theta=-2 to 25', () => expect(thetaToReadiness(-2)).toBeCloseTo(25, 5));
    it('maps theta=+2 to 75', () => expect(thetaToReadiness(2)).toBeCloseTo(75, 5));
    it('clamps to 0 for theta below -4', () => expect(thetaToReadiness(-10)).toBe(0));
    it('clamps to 100 for theta above +4', () => expect(thetaToReadiness(10)).toBe(100));
});
