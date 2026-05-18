import React, { useState } from 'react';
import UnidadeComboBox from '../components/UnidadeComboBox';
import PasswordInput from '../components/PasswordInput';
import PhoneInput from '../components/PhoneInput';
import { extrairErro } from '../utils/apiUtils';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginPage({ onLogin, onNavigate }) {
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
            const response = await fetch('https://api.estoquecerto.zenitetecnologia.ia.br/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                onLogin(data.token);
            } else if (response.status === 400) {
                const errorData = await response.json();
                const mappedErrors = {};

                if (Array.isArray(errorData)) {
                    errorData.forEach(err => {
                        const fieldName = err.field || err.Field;
                        const errorMessage = err.error || err.Error;
                        if (fieldName) {
                            mappedErrors[fieldName] = errorMessage;
                        }
                    });
                }
                else if (errorData.errors) {
                    Object.keys(errorData.errors).forEach(key => {
                        const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
                        mappedErrors[fieldName] = errorData.errors[key][0];
                    });
                } else {
                    setErro("Verifique os campos obrigatórios.");
                }

                setFieldErrors(mappedErrors);
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
            }
        } catch (error) {
            setErro('Erro de conexão com o servidor.');
        }
    };

    return (
        <>
        <ThemeToggle />
        <div className="login-container"></div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="card auth-card">
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Login</h2>
                <form onSubmit={handleSubmit} noValidate>
                    {erro && <div className="alert alert-error">{erro}</div>}

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

                    <button type="submit" className="button" style={{ width: '100%', marginTop: '1rem' }}>Entrar</button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', fontSize: '0.95rem' }}>
                        <a style={{ cursor: 'pointer', color: 'var(--zf-accent)' }} onClick={() => onNavigate('register')}>Registrar</a>
                        <a style={{ cursor: 'pointer', color: 'var(--zf-accent)' }} onClick={() => onNavigate('forgot')}>Esqueci a senha</a>
                    </div>
                </form>
            </div>
        </div>
        </>
    );
}