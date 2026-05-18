import React, { useState } from 'react';
import UnidadeComboBox from '../components/UnidadeComboBox';
import PasswordInput from '../components/PasswordInput';
import PhoneInput from '../components/PhoneInput';
import { extrairErro } from '../utils/apiUtils';
import ThemeToggle from '../components/ThemeToggle';

export default function RegisterPage({ onNavigate }) {
    const [formData, setFormData] = useState({ nome: '', username: '', senha: '', unidadeOrganizacionalId: '' });
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');
        setFieldErrors({});

        const payload = {
            ...formData,
            unidadeOrganizacionalId: formData.unidadeOrganizacionalId === '' ? null : formData.unidadeOrganizacionalId
        };

        try {
            const response = await fetch('https://api.estoquecerto.zenitetecnologia.ia.br/v1/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setSucesso('Conta criada com sucesso! Redirecionando...');
                setTimeout(() => onNavigate('login'), 2000);
            } else if (response.status === 400) {
                const errorData = await response.json();
                const mappedErrors = {};

                if (Array.isArray(errorData)) {
                    errorData.forEach(err => {
                        const fieldName = err.field || err.Field;
                        if (fieldName) mappedErrors[fieldName] = err.error || err.Error;
                    });
                } else if (errorData.errors) {
                    Object.keys(errorData.errors).forEach(key => {
                        const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
                        mappedErrors[fieldName] = errorData.errors[key][0];
                    });
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
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                    <div className="card auth-card">
                        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Criar Conta</h2>
                        <form onSubmit={handleSubmit} noValidate>
                            {erro && <div className="alert alert-error">{erro}</div>}
                            {sucesso && <div className="alert alert-success">{sucesso}</div>}

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '1.1rem', color: fieldErrors.Nome ? '#ff4444' : 'inherit' }}>Nome Completo</label>
                                <input
                                    type="text"
                                    placeholder="Seu nome"
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    style={{ width: '100%', marginBottom: 0, borderColor: fieldErrors.Nome ? '#ff4444' : undefined }}
                                />
                                {fieldErrors.Nome && <small style={{ color: '#ff4444', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.Nome}</small>}
                            </div>

                            <PhoneInput
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                error={!!fieldErrors.Username}
                                errorMessage={fieldErrors.Username}
                            />

                            <PasswordInput
                                label="Senha"
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

                            <button type="submit" className="button" style={{ width: '100%', marginTop: '1rem' }}>Cadastrar</button>
                            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                                <a style={{ cursor: 'pointer', color: 'var(--zf-accent)' }} onClick={() => onNavigate('login')}>Já tenho uma conta</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}