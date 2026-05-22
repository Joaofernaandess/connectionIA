import React, { useState } from 'react';
import UnidadeComboBox from '../components/UnidadeComboBox';
import PasswordInput from '../components/PasswordInput';
import PhoneInput from '../components/PhoneInput';
import { extrairErro } from '../utils/apiUtils';
import ThemeToggle from '../components/ThemeToggle';

export default function ForgotPasswordPage({ onNavigate }) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({ username: '', unidadeOrganizacionalId: '', code: '', senha: '', confirmaSenha: '', codigoAcessoId: '' });
    const [erro, setErro] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const parseBackendErrors = async (res) => {
        const errorData = await res.json();
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
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        setErro('');
        setFieldErrors({});
        try {
            const res = await fetch('https://api.estoquecerto.zenitetecnologia.ia.br/v1/auth/forgot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: data.username,
                    unidadeOrganizacionalId: data.unidadeOrganizacionalId === '' ? null : data.unidadeOrganizacionalId
                })
            });
            if (res.ok) setStep(2);
            else if (res.status === 400) await parseBackendErrors(res);
            else setErro(await extrairErro(res));
        } catch (error) { setErro('Erro de conexão.'); }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setErro('');

        if (!data.code || data.code.trim() === '') {
            setErro('Por favor, informe o código recebido.');
            return;
        }

        try {
            const res = await fetch('https://api.estoquecerto.zenitetecnologia.ia.br/v1/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: data.code })
            });

            if (res.ok) {
                const result = await res.json();
                setData(prev => ({ ...prev, codigoAcessoId: result.codigoAcessoId }));
                setStep(3);
            } else if (res.status === 400) {
                await parseBackendErrors(res);
            } else {
                setErro(await extrairErro(res));
            }
        } catch (error) {
            setErro('Erro de conexão ao verificar o código.');
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setErro('');
        setFieldErrors({});
        if (data.senha !== data.confirmaSenha) {
            setFieldErrors({ ConfirmaSenha: 'As senhas não coincidem.' });
            return;
        }
        try {
            const res = await fetch('https://api.estoquecerto.zenitetecnologia.ia.br/v1/auth/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigoAcessoId: data.codigoAcessoId, senha: data.senha })
            });
            if (res.ok) setShowSuccessModal(true);
            else if (res.status === 400) await parseBackendErrors(res);
            else setErro(await extrairErro(res));
        } catch (error) { setErro('Erro de conexão.'); }
    };

    return (
        <>
            <ThemeToggle />
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                    <div className="card auth-card">
                        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Recuperar Acesso</h2>


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
                                <button type="submit" className="button" style={{ width: '100%', marginTop: '1rem' }}>Enviar Código</button>
                                <button type="button" className="button button-outline" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => onNavigate('login')}>Cancelar</button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleVerifyCode} noValidate>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Código Enviado</label>
                                    <input
                                        type="text"
                                        value={data.code}
                                        onChange={e => setData({ ...data, code: e.target.value })}
                                        style={{
                                            width: '100%',
                                            borderColor: erro ? '#E57373' : undefined,
                                            outlineColor: erro ? '#E57373' : undefined
                                        }}
                                    />
                                </div>
                                <button type="submit" className="button" style={{ width: '100%' }}>Verificar</button>
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
                                <button type="submit" className="button" style={{ width: '100%', marginTop: '1rem' }}>Redefinir Senha</button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {erro && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem', boxSizing: 'border-box'
                }}>
                    <div className="card" style={{
                        width: '100%', maxWidth: '400px',
                        height: 'fit-content', margin: 'auto',
                        backgroundColor: 'var(--zf-background-secondary)',
                        padding: '2.5rem', borderRadius: '15px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                    }}>
                        <h2 style={{ color: '#E57373', marginTop: 0, marginBottom: '1rem' }}>Atenção</h2>
                        <p style={{ color: 'var(--zf-text-main)', marginBottom: '2rem', fontSize: '1rem', lineHeight: '1.4' }}>
                            {erro}
                        </p>
                        <button type="button" className="button" style={{ width: '100%', margin: 0 }} onClick={() => setErro('')}>
                            Fechar
                        </button>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem', boxSizing: 'border-box'
                }}>
                    <div className="card" style={{
                        width: '100%', maxWidth: '400px',
                        height: 'fit-content', margin: 'auto',
                        backgroundColor: 'var(--zf-background-secondary)',
                        padding: '2.5rem', borderRadius: '15px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                    }}>
                        <h2 style={{ color: '#81C784', marginBottom: '1rem', marginTop: 0 }}>Senha Redefinida!</h2>
                        <p style={{ color: 'var(--zf-text-main)', marginBottom: '2rem', fontSize: '1rem', lineHeight: '1.4' }}>
                            Sua senha foi alterada com sucesso.<br />Você já pode acessar o sistema.
                        </p>
                        <button className="button" style={{ width: '100%', margin: 0 }} onClick={() => onNavigate('login')}>
                            Ir para Login
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}