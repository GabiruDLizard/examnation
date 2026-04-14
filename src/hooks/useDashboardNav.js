import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function useDashboardNav(initialPage = 'overview') {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // selectedClass is still kept as state (needs the full object for rendering)
    // but we also sync classId to/from the URL
    const [selectedClass, setSelectedClassState] = useState(null);

    // ── Derive navigation state from URL ──────────────────────────────
    const params = new URLSearchParams(location.search);
    const activePage   = params.get('page')    || initialPage;
    const currentView  = params.get('view')    || 'main';
    const selectedClassId = params.get('classId') ? Number(params.get('classId')) : null;

    // When the URL loses classId (e.g. user pressed back), clear the class object
    useEffect(() => {
        if (!selectedClassId) setSelectedClassState(null);
    }, [selectedClassId]);

    // ── URL builders ──────────────────────────────────────────────────
    const buildSearch = (overrides) => {
        const p = new URLSearchParams(location.search);
        Object.entries(overrides).forEach(([k, v]) => {
            if (v == null) p.delete(k);
            else p.set(k, String(v));
        });
        const str = p.toString();
        return str ? '?' + str : '';
    };

    // ── Setters — push to history so back button works ────────────────

    const setActivePage = (page) => {
        navigate('?' + new URLSearchParams({ page }).toString());
        setSelectedClassState(null);
    };

    // setCurrentView uses replace:true — sub-view changes within a page
    // shouldn't each get their own back-button step
    const setCurrentView = (view) => {
        const search = buildSearch(view === 'main' ? { view: null } : { view });
        navigate(search || location.pathname, { replace: true });
    };

    const setSelectedClass = (cls) => {
        setSelectedClassState(cls);
        if (cls) {
            navigate(buildSearch({
                classId: cls.id ?? cls.classId,
                view: 'class-overview',
            }));
        } else {
            navigate(buildSearch({ classId: null, view: null }), { replace: true });
        }
    };

    // ── Compound handlers ─────────────────────────────────────────────

    const handleNavClick = (page) => {
        navigate('?' + new URLSearchParams({ page }).toString());
        setSelectedClassState(null);
        setMobileMenuOpen(false);
    };

    const handleClassClick = (classItem) => {
        setSelectedClassState(classItem);
        navigate(buildSearch({
            classId: classItem.id ?? classItem.classId,
            view: 'class-overview',
        }));
    };

    // Back handlers use navigate(-1) so the browser history is the source of truth
    const handleBackToClasses = () => navigate(-1);
    const handleBackToOverview = () => navigate(-1);

    const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);

    return {
        activePage,    setActivePage,
        currentView,   setCurrentView,
        selectedClass, setSelectedClass,
        selectedClassId,
        mobileMenuOpen,
        handleNavClick,
        handleClassClick,
        handleBackToClasses,
        handleBackToOverview,
        toggleMobileMenu,
    };
}
