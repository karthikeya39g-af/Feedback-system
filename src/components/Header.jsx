import React from 'react';
import { useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
    const location = useLocation();
    const isDashboard = ['/hod', '/admin'].some(path => location.pathname.startsWith(path));
    const isLogin = location.pathname === '/login' || location.pathname === '/';

    return (
        <header className={`app-header ${isDashboard ? 'dashboard-header' : ''} ${isLogin ? 'login-mode' : ''}`}>
            <div className="header-content">
                <img src="/nnrglogo.png" alt="NNRG Logo" className="header-logo" />
                {/* Header text removed as it is included in the banner logo
                <div className="header-text">
                    <h1 className="dept-name">DEPARTMENT OF DATA SCIENCE</h1>
                    <h2 className="school-name">SCHOOL OF ENGINEERING</h2>
                </div>
                */}
            </div>
        </header>
    );
};

export default Header;
