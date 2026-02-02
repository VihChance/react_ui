import { Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";

export default function RotaPrivada({ roleEsperado, children }) {
    const { token, role } = useAuth();

    if (!token) return <Navigate to="/" />;
    if (role !== roleEsperado) return <Navigate to="/" />;
    return children;
}
