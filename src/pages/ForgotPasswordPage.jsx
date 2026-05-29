import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageModal from '../components/MessageModal';
import PasswordInput from '../components/PasswordInput';
import PhoneInput from '../components/PhoneInput';
import ThemeToggle from '../components/ThemeToggle';
import UnidadeComboBox from '../components/UnidadeComboBox';
import { getBaseUrl } from '../utils/apiConfig';
import { aplicarErrosCampos, extrairErro, extrairMensagem } from '../utils/apiUtils';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [data, setData] = useState({ username: '', unidadeOrganizacionalId: '', code: '', senha: '', confirmaSenha: '', codigoAcessoId: '' });
    const [erro, setErro] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleForgot = async (e) => {
        e.preventDefault();
        setErro('');
        setFieldErrors({});
        try {
            const res = await fetch(`${getBaseUrl()}/v1/auth/forgot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: data.username,
                    unidadeOrganizacionalId: data.unidadeOrganizacionalId === '' ? null : data.unidadeOrganizacionalId
                })
            });
            if (res.ok) setStep(2);
            else if (res.status === 400) await aplicarErrosCampos(res, setFieldErrors, setErro);
            else setErro(await extrairErro(res));
        } catch (error) { console.error(error); }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setErro('');

        try {
            const res = await fetch(`${getBaseUrl()}/v1/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: data.code })
            });

            if (res.ok) {
                const result = await res.json();
                setData(prev => ({ ...prev, codigoAcessoId: result.codigoAcessoId || result.codigoResetId || '' }));
                setStep(3);
            } else if (res.status === 400) {
                await aplicarErrosCampos(res, setFieldErrors, setErro);
            } else {
                setErro(await extrairErro(res));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setErro('');
        setFieldErrors({});

        try {
            const res = await fetch(`${getBaseUrl()}/v1/auth/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigoAcessoId: data.codigoAcessoId, senha: data.senha, confirmaSenha: data.confirmaSenha })
            });
            if (res.ok) {
                const mensagem = await extrairMensagem(res);
                setSuccessMessage(mensagem);
                if (mensagem) setShowSuccessModal(true);
            }
            else if (res.status === 400) await aplicarErrosCampos(res, setFieldErrors, setErro);
            else setErro(await extrairErro(res));
        } catch (error) { console.error(error); }
    };

    return (
        <>
            <ThemeToggle />
            <div className="container">
                <div className="auth-page">
                    <div className="card auth-card">
                        <h2 className="auth-title">Recuperar Acesso</h2>


                        {step === 1 && (
                            <form onSubmit={handleForgot} noValidate>
                                <PhoneInput
                                    value={data.username}
                                    onChange={e => setData({ ...data, username: e.target.value })}
                                    error={!!fieldErrors.Username}
                                    errorMessage={fieldErrors.Username}
                                />
                                <UnidadeComboBox
                                    value={data.unidadeOrganizacionalId}
                                    onChange={val => setData({ ...data, unidadeOrganizacionalId: val })}
                                    error={!!fieldErrors.UnidadeOrganizacionalId}
                                    errorMessage={fieldErrors.UnidadeOrganizacionalId}
                                />
                                <button type="submit" className="button button-full mt-1">Enviar Código</button>
                                <button type="button" className="button button-outline button-full mt-1" onClick={() => navigate('/login')}>Cancelar</button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleVerifyCode} noValidate>
                                <div className="mb-1">
                                    <label>Código Enviado</label>
                                    <input
                                        type="text"
                                        value={data.code}
                                        onChange={e => setData({ ...data, code: e.target.value })}
                                        className={`w-full no-field-margin ${erro ? 'is-invalid' : ''}`}
                                    />
                                </div>
                                <button type="submit" className="button w-full">Verificar</button>
                            </form>
                        )}

                        {step === 3 && (
                            <form onSubmit={handleReset} noValidate>
                                <PasswordInput
                                    label="Nova Senha"
                                    value={data.senha}
                                    onChange={e => setData({ ...data, senha: e.target.value })}
                                    error={!!fieldErrors.Senha}
                                    errorMessage={fieldErrors.Senha}
                                />
                                <PasswordInput
                                    label="Confirmar Nova Senha"
                                    value={data.confirmaSenha}
                                    onChange={e => setData({ ...data, confirmaSenha: e.target.value })}
                                    error={!!fieldErrors.ConfirmaSenha}
                                    errorMessage={fieldErrors.ConfirmaSenha}
                                />
                                <button type="submit" className="button button-full mt-1">Redefinir Senha</button>
                            </form>
                        )}
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