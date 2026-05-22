import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import HomePage from './pages/HomePage';

export default function App() {
    const [currentPage, setCurrentPage] = useState('login');
    const [token, setToken] = useState(localStorage.getItem('token'));

    const handleLogin = (userToken) => {
        localStorage.setItem('token', userToken);
        setToken(userToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setCurrentPage('login');
    };

    if (!token) {
        if (currentPage === 'register') return <RegisterPage onNavigate={setCurrentPage} />;
        if (currentPage === 'forgot') return <ForgotPasswordPage onNavigate={setCurrentPage} />;
        if (currentPage === 'pending') return <PendingApprovalPage onNavigate={setCurrentPage} />;
        return <LoginPage onLogin={handleLogin} onNavigate={setCurrentPage} />;
    }

    return (
        <HomePage token={token} onLogout={handleLogout} />
    );
}