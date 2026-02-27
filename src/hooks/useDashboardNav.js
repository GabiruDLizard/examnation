import { useState } from 'react';

export function useDashboardNav(initialPage = 'overview') {
    const [activePage, setActivePage] = useState(initialPage);
    const [currentView, setCurrentView] = useState('main');
    const [selectedClass, setSelectedClass] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleNavClick = (page) => {
        setActivePage(page);
        setCurrentView('main');
        setSelectedClass(null);
        setMobileMenuOpen(false);
    };

    const handleClassClick = (classItem) => {
        setSelectedClass(classItem);
        setCurrentView('class-overview');
    };

    const handleBackToClasses = () => {
        setSelectedClass(null);
        setCurrentView('main');
    };

    const handleBackToOverview = () => setCurrentView('class-overview');
    const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);

    return {
        activePage, setActivePage,
        currentView, setCurrentView,
        selectedClass, setSelectedClass,
        mobileMenuOpen,
        handleNavClick,
        handleClassClick,
        handleBackToClasses,
        handleBackToOverview,
        toggleMobileMenu,
    };
}
