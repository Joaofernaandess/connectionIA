import { Navigate, Route, Routes } from 'react-router-dom';
import EspacoView from '../components/EspacoView';
import ItemEstoqueView from '../components/ItemEstoqueView';
import ValidarUsuariosView from '../components/ValidarUsuariosView';
import EspacoDetailPage from '../pages/espacos/EspacoDetailPage';
import NovoEspacoPage from '../pages/espacos/NovoEspacoPage';
import DashboardPage from '../pages/home/DashboardPage';
import InstallIosPage from '../pages/home/InstallIosPage';
import ProfilePage from '../pages/home/ProfilePage';
import ItemEstoqueDetailPage from '../pages/itemEstoque/ItemEstoqueDetailPage';
import NovoItemEstoquePage from '../pages/itemEstoque/NovoItemEstoquePage';

export default function AuthenticatedRoutes({
    fieldErrors,
    formData,
    isAdmin,
    onCancelProfile,
    onChangeProfile,
    onSubmitProfile,
    token,
    unidadeOrganizacionalId,
    usuarioId
}) {
    return (
        <Routes>
            <Route
                index
                element={
                    <DashboardPage
                        token={token}
                        unidadeOrganizacionalId={unidadeOrganizacionalId}
                    />
                }
            />
            <Route
                path="espacos/novo"
                element={<NovoEspacoPage token={token} unidadeOrganizacionalId={unidadeOrganizacionalId} />}
            />
            <Route
                path="espacos/:espacoId"
                element={<EspacoDetailPage token={token} unidadeOrganizacionalId={unidadeOrganizacionalId} />}
            />
            <Route
                path="espacos"
                element={<EspacoView token={token} unidadeOrganizacionalId={unidadeOrganizacionalId} />}
            />
            <Route
                path="itens-estoque/novo"
                element={<NovoItemEstoquePage token={token} unidadeOrganizacionalId={unidadeOrganizacionalId} />}
            />
            <Route
                path="itens-estoque/:itemEstoqueId"
                element={<ItemEstoqueDetailPage token={token} unidadeOrganizacionalId={unidadeOrganizacionalId} usuarioId={usuarioId} />}
            />
            <Route
                path="itens-estoque"
                element={<ItemEstoqueView token={token} unidadeOrganizacionalId={unidadeOrganizacionalId} usuarioId={usuarioId} />}
            />
            <Route
                path="aprovar-usuarios"
                element={isAdmin ? <ValidarUsuariosView token={token} /> : <Navigate to="/" replace />}
            />
            <Route path="instalar-ios" element={<InstallIosPage />} />
            <Route
                path="perfil"
                element={
                    <ProfilePage
                        fieldErrors={fieldErrors}
                        formData={formData}
                        onCancel={onCancelProfile}
                        onChange={onChangeProfile}
                        onSubmit={onSubmitProfile}
                    />
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}