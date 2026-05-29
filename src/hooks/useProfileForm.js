import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBaseUrl } from '../utils/apiConfig';
import { aplicarErrosCampos, extrairErro, extrairMensagem } from '../utils/apiUtils';

export const useProfileForm = ({ token, usuario }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nome: usuario.nome,
        username: usuario.username,
        senha: '',
        confirmaSenha: '',
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

        const payload = {
            nome: formData.nome
        };

        if (formData.senha || formData.confirmaSenha) {
            payload.senha = formData.senha;
            payload.confirmaSenha = formData.confirmaSenha;
        }

        try {
            const response = await fetch(`${getBaseUrl()}/v1/usuarios/${usuario.usuarioId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                if (mensagem) setSucesso(mensagem);
                setFormData(prev => ({ ...prev, senha: '', confirmaSenha: '' }));
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
        setFormData(prev => ({ ...prev, senha: '', confirmaSenha: '' }));
        navigate('/');
    };

    const clearMessages = () => {
        setErro('');
        setSucesso('');
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