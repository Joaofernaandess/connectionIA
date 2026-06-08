import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MessageModal from '../components/MessageModal';
import ThemeToggle from '../components/ThemeToggle';
import { getBaseUrl } from '../utils/apiConfig';
import { aplicarErrosCampos, extrairErro, extrairMensagem } from '../utils/apiUtils';
import { isCodeValidateJourney, isWaitingApprovalJourney } from '../utils/jornadaUsuario';
import { decryptEncryptedResponse, encryptedJsonBody, encryptedJsonBodyWithKey } from '../utils/payloadCrypto';

export default function CodeValidatePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const recoveryData = location.state || {};
    const isCadastro = isCodeValidateJourney(recoveryData.jornadaUsuario);
    const [code, setCode] = useState('');
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState(recoveryData.mensagem || '');
    const [fieldErrors, setFieldErrors] = useState({});
    const [cooldownReenvio, setCooldownReenvio] = useState(0);
    const codeError = fieldErrors.Code || fieldErrors.code || fieldErrors.Codigo || fieldErrors.codigo || '';

    useEffect(() => {
        if (!recoveryData.username || !recoveryData.unidadeOrganizacionalId) {
            navigate(isCadastro ? '/login' : '/forgot-password', { replace: true });
        }
    }, [isCadastro, navigate, recoveryData.unidadeOrganizacionalId, recoveryData.username]);

    useEffect(() => {
        if (cooldownReenvio <= 0) return undefined;

        const timer = setTimeout(() => {
            setCooldownReenvio(prev => Math.max(prev - 1, 0));
        }, 1000);

        return () => clearTimeout(timer);
    }, [cooldownReenvio]);

    const iniciarCooldownReenvio = () => {
        setCooldownReenvio(300);
    };

    const formatCooldown = (seconds) => {
        const minutos = Math.floor(seconds / 60).toString().padStart(2, '0');
        const segundos = (seconds % 60).toString().padStart(2, '0');

        return `${minutos}:${segundos}`;
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setErro('');
        setFieldErrors({});

        try {
            const encryptedRequest = await encryptedJsonBodyWithKey({
                code,
                username: recoveryData.username,
                unidadeOrganizacionalId: recoveryData.unidadeOrganizacionalId
            });
            const res = await fetch(`${getBaseUrl()}/v1/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: encryptedRequest.body
            });

            if (res.ok) {
                const result = await decryptEncryptedResponse(await res.json(), encryptedRequest.aesKey);
                const message = result.message || result.Message || '';
                const jornadaUsuario = result.jornadaUsuario || result.JornadaUsuario;
                const codigoAcessoId =
                    result.codigoAcessoId ||
                    result.codigoResetId ||
                    result.CodigoAcessoId ||
                    result.CodigoResetId ||
                    '';

                if (isWaitingApprovalJourney(jornadaUsuario)) {
                    navigate('/waiting-approval', {
                        replace: true,
                        state: { message }
                    });
                    return;
                }

                navigate('/reset-password', {
                    state: {
                        codigoAcessoId
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

    const handleReenviarCodigo = async () => {
        setErro('');
        setSucesso('');
        setFieldErrors({});

        try {
            const res = await fetch(`${getBaseUrl()}${isCadastro ? '/v1/auth/registration-code' : '/v1/auth/forgot'}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: await encryptedJsonBody({
                    username: recoveryData.username,
                    unidadeOrganizacionalId: recoveryData.unidadeOrganizacionalId
                })
            });

            if (res.ok) {
                const mensagem = await extrairMensagem(res);
                if (mensagem) setSucesso(mensagem);
                setCode('');
                iniciarCooldownReenvio();
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
                        <h2 className="auth-title">Validar Código</h2>

                        <form onSubmit={handleVerifyCode} noValidate>
                            <div className="mb-1">
                                <label>Código Enviado</label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={e => setCode(e.target.value)}
                                    className={`w-full no-field-margin ${codeError ? 'is-invalid' : ''}`}
                                />
                                {codeError && <small className="invalid-feedback d-block">{codeError}</small>}
                            </div>
                            <button type="submit" className="button button-full">Verificar</button>
                            <button
                                type="button"
                                className="button button-outline button-full mt-1"
                                onClick={handleReenviarCodigo}
                                disabled={cooldownReenvio > 0}
                            >
                                {cooldownReenvio > 0
                                    ? `Reenviar código em ${formatCooldown(cooldownReenvio)}`
                                    : 'Reenviar código'}
                            </button>
                            <button type="button" className="button button-outline button-full mt-1" onClick={() => navigate(isCadastro ? '/login' : '/forgot-password')}>Voltar</button>
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
