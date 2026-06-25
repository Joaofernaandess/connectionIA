import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBaseUrl } from '../utils/apiConfig';
import { aplicarErrosCampos, extrairErro, extrairMensagem } from '../utils/apiUtils';
import { encryptedJsonBody } from '../utils/payloadCrypto';

export const useProfileForm = ({ token, usuario }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nome: usuario.nome,
        username: usuario.username,
        unidadeOrganizacionalId: usuario.unidadeOrganizacionalId
    });
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const handleUpdateData = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');
        setFieldErrors({});

        const payload = { nome: formData.nome };

        try {
            const response = await fetch(`${getBaseUrl()}/v1/usuarios/${usuario.usuarioId}/nome`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: await encryptedJsonBody(payload)
            });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                if (mensagem) setSucesso(mensagem);
            } else if (response.status === 400) {
                await aplicarErrosCampos(response, setFieldErrors, setErro);
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCancelProfile = () => {
        setErro('');
        setSucesso('');
        setFieldErrors({});
        navigate('/');
    };

    const clearMessages = () => {
        const shouldNavigateHome = Boolean(sucesso);

        setErro('');
        setSucesso('');

        if (shouldNavigateHome) {
            navigate('/', { replace: true });
        }
    };

    return {
        erro,
        sucesso,
        fieldErrors,
        formData,
        setFormData,
        handleUpdateData,
        handleCancelProfile,
        clearMessages
    };
};