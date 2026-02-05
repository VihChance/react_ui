// RotaPrivada.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";

export default function RotaPrivada({ roleEsperado, children }) {
    const { token, role } = useAuth();

    // Não está autenticado → vai para /login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Está autenticado mas não tem o papel certo
    if (role !== roleEsperado) {
        if (role === "ALUNO") {
            return <Navigate to="/aluno" replace />;
        }
        if (role === "DOCENTE") {
            return <Navigate to="/docente" replace />;
        }
        // Qualquer outro caso estranho:
        return <Navigate to="/login" replace />;
    }

    // Tudo OK → mostra o conteúdo protegido
    return children;
}
