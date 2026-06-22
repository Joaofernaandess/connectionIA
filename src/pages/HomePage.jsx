import { useMemo, useState } from 'react';
import MessageModal from '../components/MessageModal';
import AppHeader from '../components/layout/AppHeader';
import LogoutModal from '../components/layout/LogoutModal';
import Sidebar from '../components/layout/Sidebar';
import { useProfileForm } from '../hooks/useProfileForm';
import { usePwaInstall } from '../hooks/usePwaInstall';
import AuthenticatedRoutes from '../routes/AuthenticatedRoutes';
import { getUserFromToken } from '../utils/authUser';

export default function HomePage({ token, onLogout }) {
    const usuario = useMemo(() => getUserFromToken(token), [token]);
    const {
        erro,
        sucesso,
        fieldErrors,
        formData,
        setFormData,
        handleUpdateData,
        handleCancelProfile,
        clearMessages
    } = useProfileForm({ token, usuario });
    const pwaInstall = usePwaInstall();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    return (
        <div className="app-shell">
            <input type="checkbox" id="menu-toggle" className="sidebar-checkbox" />

            <AppHeader />
            <Sidebar
                isAdmin={usuario.isAdmin}
                isInstalled={pwaInstall.isInstalled}
                onInstallClick={pwaInstall.install}
                onLogoutClick={() => setShowLogoutModal(true)}
            />

            <main className="container app-main">
                <AuthenticatedRoutes
                    fieldErrors={fieldErrors}
                    formData={formData}
                    isAdmin={usuario.isAdmin}
                    onCancelProfile={handleCancelProfile}
                    onChangeProfile={setFormData}
                    onSubmitProfile={handleUpdateData}
                    token={token}
                    unidadeOrganizacionalId={formData.unidadeOrganizacionalId}
                    usuarioId={usuario.usuarioId}
                />
            </main>

            {showLogoutModal && (
                <LogoutModal
                    onCancel={() => setShowLogoutModal(false)}
                    onConfirm={onLogout}
                />
            )}

            {(erro || sucesso) && (
                <MessageModal
                    type={erro ? 'error' : 'success'}
                    message={erro || sucesso}
                    onClose={clearMessages}
                    autoClose={8000}
                />
            )}
        </div>
    );
}