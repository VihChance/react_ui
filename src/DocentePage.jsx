import { useEffect, useState } from "react";
import { apiFetch } from "./api.js";

export default function DocentePage() {
    const [docente, setDocente] = useState(null);
    const [ucs, setUCs] = useState([]);
    const [ucNome, setUcNome] = useState("");
    const [erro, setErro] = useState("");

    const loadUCs = async () => {
        setErro("");
        try {
            const r = await apiFetch("/api/ucs");
            const data = await r.json();
            setUCs(data);
        } catch {
            setErro("Erro ao carregar UCs");
        }
    };


    useEffect(() => {
        const fetchData = async () => {
            try {
                const r1 = await apiFetch("/api/docentes/me");
                const docenteData = await r1.json();
                setDocente(docenteData);

                const r2 = await apiFetch("/api/ucs");
                const ucsData = await r2.json();
                setUCs(ucsData);
            } catch {
                setErro("Erro ao carregar dados iniciais");
            }
        };

        fetchData();
    }, []);




    const criarUC = async () => {
        setErro("");
        if (!ucNome.trim()) return setErro("Digite o nome da UC");

        const r = await apiFetch("/api/ucs", {
            method: "POST",
            body: JSON.stringify({ nome: ucNome }),
        });

        if (!r.ok) return setErro("Erro ao criar UC");

        setUcNome("");
        await loadUCs();
    };

    return (
        <div className="app-container">
            <h2>Área do Docente</h2>

            {erro && <div className="error-box">{erro}</div>}

            <div className="section">
                <h3>Bem-vindo, {docente?.nome}</h3>
            </div>

            <div className="section">
                <h3>Criar nova UC</h3>
                <input
                    placeholder="Nome da UC"
                    value={ucNome}
                    onChange={(e) => setUcNome(e.target.value)}
                />
                <button onClick={criarUC}>Criar</button>
            </div>

            <div className="section">
                <h3>Minhas UCs</h3>
                <ul>
                    {ucs.map((uc) => (
                        <li key={uc.id}>
                            {uc.nome} (id: {uc.id})
                            {/* Aqui depois pode adicionar botão de ver alunos, progresso, etc */}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
