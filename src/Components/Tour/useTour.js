import { useEffect } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import './tour.css';

const TOUR_KEY = (userId, role) => `examnation_tour_done_${role}_${userId}`;

export function isTourDone(userId, role) {
    return !!localStorage.getItem(TOUR_KEY(userId, role));
}

export function markTourDone(userId, role) {
    localStorage.setItem(TOUR_KEY(userId, role), '1');
}

/**
 * steps: array of { id, title, text, attachTo: { element: '.selector', on: 'bottom' } }
 * ready: optional boolean — tour only fires when true (use to wait for loading to finish)
 */
export function useTour(userId, role, steps, ready = true) {
    useEffect(() => {
        if (!userId || !ready || isTourDone(userId, role)) return;

        const tour = new Shepherd.Tour({
            useModalOverlay: true,
            defaultStepOptions: {
                cancelIcon: { enabled: true },
                classes: 'examnation-tour-step',
                scrollTo: { behavior: 'smooth', block: 'center' },
            },
        });

        steps.forEach((step, i) => {
            const isFirst = i === 0;
            const isLast = i === steps.length - 1;

            const buttons = isFirst
                ? [
                    {
                        text: 'Maybe Later',
                        action: () => { markTourDone(userId, role); tour.cancel(); },
                        classes: 'shepherd-btn-secondary',
                    },
                    {
                        text: 'Take the Tour',
                        action: tour.next,
                        classes: 'shepherd-btn-primary',
                    },
                ]
                : [
                    {
                        text: 'Back',
                        action: tour.back,
                        classes: 'shepherd-btn-secondary',
                    },
                    {
                        text: isLast ? 'Done' : 'Next',
                        action: isLast
                            ? () => { markTourDone(userId, role); tour.complete(); }
                            : tour.next,
                        classes: 'shepherd-btn-primary',
                    },
                ];

            tour.addStep({
                id: step.id,
                title: step.title,
                text: step.text,
                attachTo: step.attachTo,
                buttons,
                when: {
                    cancel: () => markTourDone(userId, role),
                },
            });
        });

        // Small delay so the DOM is fully painted after loading finishes
        const t = setTimeout(() => tour.start(), 400);
        return () => {
            clearTimeout(t);
            if (tour.isActive()) tour.cancel();
        };
    }, [userId, role, ready]);
}
