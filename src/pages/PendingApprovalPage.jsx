import { useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

export default function PendingApprovalPage({ message }) {
    const navigate = useNavigate();
    const location = useLocation();
    const pendingMessage = location.state?.message || message || 'Seu cadastro foi enviado e está aguardando aprovação.';

    return (
        <>
            <div className="container">
                <div className="auth-page">
                    <ThemeToggle fixo={false} />
                    <div className="card auth-card text-center">
                        {pendingMessage && (
                            <p className="pending-description">
                                {pendingMessage}
                            </p>
                        )}

                        <button
                            type="button"
                            className="button button-outline button-full"
                            onClick={() => navigate('/login', { replace: true })}
                        >
                            Entendi
                        </button>

                    </div>
                </div>
            </div>
        </>
    );
}