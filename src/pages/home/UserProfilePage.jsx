import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ZeniteIcon from '../../components/ZeniteIcon';
import { getUserFromToken } from '../../utils/authUser';

export default function UserProfilePage ({ token, formData }) {
    const navigate = useNavigate();
    const usuario = useMemo(() => getUserFromToken(token), [token]);

    return (
        <div className="user-profile-page">
            <button className="back-button" onClick={() => navigate('/')}>
                <ZeniteIcon name="arrow-left" size={20} />
                Voltar
            </button>

            <div className="user-profile-card">
                <div className="user-profile-avatar">
                    <ZeniteIcon name="user" size={48} />
                </div>

                <div className="user-profile-info">
                    <div className="user-profile-field">
                        <span className="user-profile-label">Nome</span>
                        <span className="user-profile-value">{usuario.nome || '—'}</span>
                    </div>
                    <div className="user-profile-field">
                        <span className="user-profile-label">Username</span>
                        <span className="user-profile-value">{usuario.username || '—'}</span>
                    </div>
                    <div className="user-profile-field">
                        <span className="user-profile-label">Unidade Organizacional</span>
                        <span className="user-profile-value">
                            {formData?.unidadeOrganizacionalNome || '—'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}