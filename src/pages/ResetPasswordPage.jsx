import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MessageModal from '../components/MessageModal';
import PasswordInput from '../components/PasswordInput';
import ThemeToggle from '../components/ThemeToggle';
import { getBaseUrl } from '../utils/apiConfig';
import { aplicarErrosCampos, extrairErro, extrairMensagem } from '../utils/apiUtils';
import { encryptedJsonBody } from '../utils/payloadCrypto';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const codigoAcessoId = location.state?.codigoAcessoId || '';
    const [data, setData] = useState({ senha: '', confirmaSenha: '' });
    const [erro, setErro] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const senhaError = fieldErrors.Senha || fieldErrors.senha || '';
    const confirmaSenhaError = fieldErrors.ConfirmaSenha || fieldErrors.confirmaSenha || fieldErrors.Confirmasenha || fieldErrors.confirmasenha || '';

    useEffect(() => {
        if (!codigoAcessoId) {
            navigate('/forgot-password', { replace: true });
        }
    }, [codigoAcessoId, navigate]);

    const handleReset = async (e) => {
        e.preventDefault();
        setErro('');
        setFieldErrors({});

        try {
            const res = await fetch(`${getBaseUrl()}/v1/auth/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: await encryptedJsonBody({ codigoAcessoId, senha: data.senha, confirmaSenha: data.confirmaSenha })
            });

            if (res.ok) {
                const mensagem = await extrairMensagem(res);
                setSuccessMessage(mensagem);
                if (mensagem) setShowSuccessModal(true);
            } else if (res.status === 400) {
                await aplicarErrosCampos(res, setFieldErrors, setErro);
            } else {
                setErro(await extrairErro(res));
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            <div className="container">
                <div className="auth-page">
                    <ThemeToggle fixo={false} />
                    <div className="card auth-card">
                        <h2 className="auth-title">Redefinir Senha</h2>

                        <form onSubmit={handleReset} noValidate>
                            <PasswordInput
                                label="Nova Senha"
                                value={data.senha}
                                onChange={e => setData({ ...data, senha: e.target.value })}
                                error={!!senhaError}
                                errorMessage={senhaError}
                            />
                            <PasswordInput
                                label="Confirmar Nova Senha"
                                value={data.confirmaSenha}
                                onChange={e => setData({ ...data, confirmaSenha: e.target.value })}
                                error={!!confirmaSenhaError}
                                errorMessage={confirmaSenhaError}
                            />
                            <button type="submit" className="button button-full mt-1">Redefinir Senha</button>
                        </form>
                    </div>
                </div>
            </div>

            {erro && (
                <MessageModal
                    type="error"
                    message={erro}
                    onClose={() => setErro('')}
                    autoClose={8000}
                />
            )}

            {showSuccessModal && (
                <MessageModal
                    type="success"
                    message={successMessage}
                    onClose={() => navigate('/login')}
                    buttonLabel="Ir para Login"
                    autoClose={8000}
                />
            )}
        </>
    );
}