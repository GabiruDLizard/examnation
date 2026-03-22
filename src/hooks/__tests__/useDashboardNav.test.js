import { renderHook, act } from '@testing-library/react';
import { useDashboardNav } from '../useDashboardNav';

describe('useDashboardNav', () => {
    describe('default state', () => {
        it('initialises with activePage="overview"', () => {
            const { result } = renderHook(() => useDashboardNav());
            expect(result.current.activePage).toBe('overview');
        });

        it('initialises with currentView="main"', () => {
            const { result } = renderHook(() => useDashboardNav());
            expect(result.current.currentView).toBe('main');
        });

        it('initialises with selectedClass=null', () => {
            const { result } = renderHook(() => useDashboardNav());
            expect(result.current.selectedClass).toBeNull();
        });

        it('initialises with mobileMenuOpen=false', () => {
            const { result } = renderHook(() => useDashboardNav());
            expect(result.current.mobileMenuOpen).toBe(false);
        });

        it('accepts a custom initialPage argument', () => {
            const { result } = renderHook(() => useDashboardNav('assignments'));
            expect(result.current.activePage).toBe('assignments');
        });
    });

    describe('handleNavClick', () => {
        it('sets activePage to the provided value', () => {
            const { result } = renderHook(() => useDashboardNav());
            act(() => result.current.handleNavClick('settings'));
            expect(result.current.activePage).toBe('settings');
        });

        it('resets currentView to "main"', () => {
            const { result } = renderHook(() => useDashboardNav());
            act(() => result.current.handleClassClick({ id: 1, name: 'Algebra' }));
            expect(result.current.currentView).toBe('class-overview');
            act(() => result.current.handleNavClick('overview'));
            expect(result.current.currentView).toBe('main');
        });

        it('clears selectedClass', () => {
            const { result } = renderHook(() => useDashboardNav());
            act(() => result.current.handleClassClick({ id: 1, name: 'Algebra' }));
            act(() => result.current.handleNavClick('overview'));
            expect(result.current.selectedClass).toBeNull();
        });

        it('closes the mobile menu', () => {
            const { result } = renderHook(() => useDashboardNav());
            act(() => result.current.toggleMobileMenu());
            expect(result.current.mobileMenuOpen).toBe(true);
            act(() => result.current.handleNavClick('overview'));
            expect(result.current.mobileMenuOpen).toBe(false);
        });
    });

    describe('handleClassClick', () => {
        it('sets selectedClass to the provided class item', () => {
            const { result } = renderHook(() => useDashboardNav());
            const cls = { id: 42, name: 'Physics' };
            act(() => result.current.handleClassClick(cls));
            expect(result.current.selectedClass).toEqual(cls);
        });

        it('sets currentView to "class-overview"', () => {
            const { result } = renderHook(() => useDashboardNav());
            act(() => result.current.handleClassClick({ id: 1, name: 'Chemistry' }));
            expect(result.current.currentView).toBe('class-overview');
        });
    });

    describe('handleBackToClasses', () => {
        it('clears selectedClass', () => {
            const { result } = renderHook(() => useDashboardNav());
            act(() => result.current.handleClassClick({ id: 1, name: 'Bio' }));
            act(() => result.current.handleBackToClasses());
            expect(result.current.selectedClass).toBeNull();
        });

        it('resets currentView to "main"', () => {
            const { result } = renderHook(() => useDashboardNav());
            act(() => result.current.handleClassClick({ id: 1, name: 'Bio' }));
            act(() => result.current.handleBackToClasses());
            expect(result.current.currentView).toBe('main');
        });
    });

    describe('handleBackToOverview', () => {
        it('sets currentView to "class-overview"', () => {
            const { result } = renderHook(() => useDashboardNav());
            act(() => result.current.setCurrentView('students'));
            act(() => result.current.handleBackToOverview());
            expect(result.current.currentView).toBe('class-overview');
        });
    });

    describe('toggleMobileMenu', () => {
        it('opens the menu from false to true', () => {
            const { result } = renderHook(() => useDashboardNav());
            act(() => result.current.toggleMobileMenu());
            expect(result.current.mobileMenuOpen).toBe(true);
        });

        it('closes the menu on second toggle', () => {
            const { result } = renderHook(() => useDashboardNav());
            act(() => result.current.toggleMobileMenu());
            act(() => result.current.toggleMobileMenu());
            expect(result.current.mobileMenuOpen).toBe(false);
        });

        it('returns to original value after even number of toggles', () => {
            const { result } = renderHook(() => useDashboardNav());
            for (let i = 0; i < 6; i++) act(() => result.current.toggleMobileMenu());
            expect(result.current.mobileMenuOpen).toBe(false);
        });
    });
});
