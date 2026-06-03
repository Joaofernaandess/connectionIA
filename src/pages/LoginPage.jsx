import { useState } from 'react';
import { Link } from 'react-router-dom';
import MessageModal from '../components/MessageModal';
import PasswordInput from '../components/PasswordInput';
import PhoneInput from '../components/PhoneInput';
import ThemeToggle from '../components/ThemeToggle';
import UnidadeComboBox from '../components/UnidadeComboBox';
import { getBaseUrl } from '../utils/apiConfig';
import { aplicarErrosCampos, extrairErro } from '../utils/apiUtils';
import { encryptedJsonBody } from '../utils/payloadCrypto';

export default function LoginPage({ onLogin, onPendingApproval }) {
    const [formData, setFormData] = useState({ username: '', senha: '', unidadeOrganizacionalId: '' });
    const [erro, setErro] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        setFieldErrors({});

        const payload = {
            ...formData,
            unidadeOrganizacionalId: formData.unidadeOrganizacionalId === '' ? null : formData.unidadeOrganizacionalId
        };

        try {
            const response = await fetch(`${getBaseUrl()}/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: await encryptedJsonBody(payload)
            });

            if (response.ok) {
                const data = await response.json();
                onLogin(data.token);
            } else if (response.status === 400) {
                await aplicarErrosCampos(response, setFieldErrors, setErro);
            } else if (response.status === 403) {
                const mensagem = await extrairErro(response);
                if (mensagem && onPendingApproval) {
                    onPendingApproval(mensagem);
                } else if (mensagem) {
                    setErro(mensagem);
                }
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            <ThemeToggle />
            <div className="auth-page">
                <div className="card auth-card">
                    <h2 className="auth-title">Login</h2>
                    <form onSubmit={handleSubmit} noValidate>

                        <PhoneInput
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            error={!!fieldErrors.Username}
                            errorMessage={fieldErrors.Username}
                        />

                        <PasswordInput
                            label="Senha"
                            placeholder="******"
                            value={formData.senha}
                            onChange={e => setFormData({ ...formData, senha: e.target.value })}
                            error={!!fieldErrors.Senha}
                            errorMessage={fieldErrors.Senha}
                        />

                        <UnidadeComboBox
                            value={formData.unidadeOrganizacionalId}
                            onChange={val => setFormData({ ...formData, unidadeOrganizacionalId: val })}
                            error={!!fieldErrors.UnidadeOrganizacionalId}
                            errorMessage={fieldErrors.UnidadeOrganizacionalId}
                        />

                        <button type="submit" className="button button-full mt-1">Entrar</button>

                        <div className="auth-link-row">
                            <Link className="link-action" to="/register">Registrar</Link>
                            <Link className="link-action" to="/forgot-password">Esqueci a senha</Link>
                        </div>
                    </form>
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
        </>
    );
}