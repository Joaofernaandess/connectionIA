import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageModal from '../components/MessageModal';
import PhoneInput from '../components/PhoneInput';
import ThemeToggle from '../components/ThemeToggle';
import UnidadeComboBox from '../components/UnidadeComboBox';
import { getBaseUrl } from '../utils/apiConfig';
import { aplicarErrosCampos, extrairErro, extrairMensagem } from '../utils/apiUtils';
import { encryptedJsonBody } from '../utils/payloadCrypto';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [data, setData] = useState({ username: '', unidadeOrganizacionalId: '' });
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const handleForgot = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');
        setFieldErrors({});

        try {
            const res = await fetch(`${getBaseUrl()}/v1/auth/forgot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: await encryptedJsonBody({
                    username: data.username,
                    unidadeOrganizacionalId: data.unidadeOrganizacionalId === '' ? null : data.unidadeOrganizacionalId
                })
            });

            if (res.ok) {
                const mensagem = await extrairMensagem(res);
                navigate('/code-validate', {
                    state: {
                        username: data.username,
                        unidadeOrganizacionalId: data.unidadeOrganizacionalId,
                        mensagem
                    }
                });
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
                        <h2 className="auth-title">Recuperar Acesso</h2>

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

            {sucesso && (
                <MessageModal
                    type="success"
                    message={sucesso}
                    onClose={() => setSucesso('')}
                    autoClose={8000}
                />
            )}
        </>
    );
}