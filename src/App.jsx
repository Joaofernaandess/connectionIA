import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';

export default function App() {
    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [pendingMessage, setPendingMessage] = useState('');

    const handleLogin = (userToken) => {
        localStorage.setItem('token', userToken);
        setToken(userToken);
        navigate('/', { replace: true });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        navigate('/login', { replace: true });
    };

    const handlePendingApproval = (message) => {
        setPendingMessage(message);
        navigate('/pending-approval', { replace: true, state: { message } });
    };

    return (
        <AppRoutes
            token={token}
            pendingMessage={pendingMessage}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onPendingApproval={handlePendingApproval}
        />
    );
}