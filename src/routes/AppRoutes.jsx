import { Navigate, Route, Routes } from 'react-router-dom';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import PendingApprovalPage from '../pages/PendingApprovalPage';
import RegisterPage from '../pages/RegisterPage';

export default function AppRoutes({
    token,
    pendingMessage,
    onLogin,
    onLogout,
    onPendingApproval
}) {
    return (
        <Routes>
            <Route
                path="/login"
                element={token ? <Navigate to="/" replace /> : <LoginPage onLogin={onLogin} onPendingApproval={onPendingApproval} />}
            />
            <Route
                path="/register"
                element={token ? <Navigate to="/" replace /> : <RegisterPage />}
            />
            <Route
                path="/forgot-password"
                element={token ? <Navigate to="/" replace /> : <ForgotPasswordPage />}
            />
            <Route
                path="/pending-approval"
                element={token ? <Navigate to="/" replace /> : <PendingApprovalPage message={pendingMessage} />}
            />
            <Route
                path="/*"
                element={token ? <HomePage token={token} onLogout={onLogout} /> : <Navigate to="/login" replace />}
            />
        </Routes>
    );
}
