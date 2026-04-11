import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import useSessionManager from '../../hooks/useSessionManager';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });
    const location = useLocation();

    // Initialize session management (auto logout)
    useSessionManager();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    // Close sidebar on window resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        // On mobile, toggle mobile drawer
        if (window.innerWidth <= 1024) {
            setSidebarOpen(!sidebarOpen);
        } else {
            // On desktop, toggle collapse
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div className={`app-shell ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
                onClick={closeSidebar}
                style={{ pointerEvents: sidebarOpen ? 'auto' : 'none' }}
            />

            <Sidebar 
                isOpen={sidebarOpen} 
                onClose={closeSidebar} 
                isCollapsed={isCollapsed} 
                onToggle={toggleSidebar}
            />

            <div className={`main-content ${isCollapsed ? 'collapsed' : ''}`}>
                <Header onMenuClick={toggleSidebar} />
                <main className="page-container">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
