import { useState } from "react";
import "../styles/Login.css";


export default function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState("aluno@estg.pt");
    const [password, setPassword] = useState("1234");
    const [erro, setErro] = useState("");

    const fazerLogin = async () => {
        setErro("");

        const r = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!r.ok) {
            setErro("Email ou senha incorretos");
            return;
        }

        const data = await r.json();
        localStorage.setItem("token", data.token);


        const payload = parseJwt(data.token);
        localStorage.setItem("role", payload.role); // <- Guarda role

        onLoginSuccess(); // Redireciona para o app
    };

    const parseJwt = (token) => {
        try {
            const base64 = token.split('.')[1];
            return JSON.parse(atob(base64));
        } catch {
            return null;
        }
    };


    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Login</h2>

                {erro && <div className="login-error">{erro}</div>}

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button onClick={fazerLogin}>Entrar</button>

                <div className="login-links">
                    <a href="#">Esqueceu a senha?</a> • <a href="#">Criar conta</a>
                </div>
            </div>
        </div>
    );
}
