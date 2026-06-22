import { Navigate, Route, Routes } from 'react-router-dom';
import CodeValidatePage from '../pages/CodeValidatePage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import PendingApprovalPage from '../pages/PendingApprovalPage';
import RegisterPage from '../pages/RegisterPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';

export default function AppRoutes({
    token,
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
                path="/code-validate"
                element={token ? <Navigate to="/" replace /> : <CodeValidatePage />}
            />
            <Route
                path="/reset-password"
                element={token ? <Navigate to="/" replace /> : <ResetPasswordPage />}
            />
            <Route
                path="/pending-approval"
                element={<Navigate to="/waiting-approval" replace />}
            />
            <Route
                path="/waiting-approval"
                element={token ? <Navigate to="/" replace /> : <PendingApprovalPage />}
            />
            <Route
                path="/*"
                element={token ? <HomePage token={token} onLogout={onLogout} /> : <Navigate to="/login" replace />}
            />
        </Routes>
    );
}