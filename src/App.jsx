import './App.css';
import { useState } from "react";
import AlunoPage from "./AlunoPage.jsx";
import DocentePage from "./DocentePage.jsx";
import Login from './autenticar/Login.jsx';

export default function App() {

    const [autenticado, setAutenticado] = useState(
        !!localStorage.getItem("token")
    );

    const [role, setRole] = useState(localStorage.getItem("role"));

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setAutenticado(false);
        setRole(null);
    };

    const handleLoginSuccess = () => {
        setAutenticado(true);
        setRole(localStorage.getItem("role")); // <- garante que atualiza a role
    };

    return (
        <div className="app-container">
            <h1>Checkpoint System</h1>

            {autenticado ? (
                <>
                    <button onClick={logout}>Sair</button>

                    {role === "ALUNO" && <AlunoPage />}
                    {role === "DOCENTE" && <DocentePage />}
                </>
            ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
            )}
        </div>
    );
}
