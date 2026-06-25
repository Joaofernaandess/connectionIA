import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import ZeniteIcon from '../components/ZeniteIcon';

export default function PendingApprovalPage() {
    const navigate = useNavigate();

    return (
        <>
            <div className="container">
                <div className="auth-page">
                    <ThemeToggle fixo={false} />
                    <div className="card auth-card pending-approval-card text-center">
                        <div className="pending-approval-icon">
                            <ZeniteIcon name="rocket" size={120} strokeWidth={1.6} />
                        </div>

                        <h1 className="pending-approval-title">Quase lá!</h1>

                        <p className="pending-approval-main">
                            Seu aplicativo está aguardando a aprovação final.
                        </p>

                        <p className="pending-approval-description">
                            Isso pode levar algumas horas.
                        </p>
                        <button
                            type="button"
                            className="button button-full pending-approval-action"
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