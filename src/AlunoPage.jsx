import { useEffect, useState } from "react";
import { apiFetch } from "./api.js";

export default function AlunoPage() {
    const [aluno, setAluno] = useState(null);
    const [ucsDisponiveis, setUcsDisponiveis] = useState([]);
    const [ucSelecionada, setUcSelecionada] = useState(null);
    const [exercicios, setExercicios] = useState([]);
    const [exSelecionado, setExSelecionado] = useState(null);
    const [fases, setFases] = useState([]);
    const [participacao, setParticipacao] = useState(null);
    const [erro, setErro] = useState("");

    useEffect(() => {
        apiFetch("/api/alunos/me")
            .then((r) => r.json())
            .then(setAluno)
            .catch(() => setErro("Erro ao carregar aluno"));

        apiFetch("/api/ucs/todas")
            .then((r) => r.json())
            .then(setUcsDisponiveis)
            .catch(() => setErro("Erro ao carregar UCs"));
    }, []);

    const selecionarUC = async (uc) => {
        setErro("");
        setUcSelecionada(uc);
        setExSelecionado(null);
        setFases([]);
        setParticipacao(null);

        const r = await apiFetch(`/api/exercicios/uc/${uc.id}`);
        setExercicios(await r.json());
    };

    const entrarNoExercicio = async (ex) => {
        setErro("");
        setExSelecionado(ex);
        setFases([]);
        setParticipacao(null);

        const fasesResp = await apiFetch(`/api/fases/exercicio/${ex.id}`);
        setFases(await fasesResp.json());

        const r = await apiFetch("/api/participacoes", {
            method: "POST",
            body: JSON.stringify({ alunoId: aluno.id, exercicioId: ex.id }),
        });

        if (!r.ok) {
            const msg = await r.text();
            setErro(msg || "Erro ao entrar no exercício.");
            return;
        }

        setParticipacao(await r.json());
    };

    const concluirFase = async (faseId) => {
        const r = await apiFetch(
            `/api/participacoes/${participacao.id}/fase/${faseId}/concluir`,
            { method: "POST" }
        );

        if (!r.ok) return setErro("Erro ao concluir fase");

        setParticipacao((p) => ({
            ...p,
            fasesCompletas: [...(p?.fasesCompletas ?? []), faseId],
        }));
    };

    const chamarDocente = async () => {
        const r = await apiFetch(
            `/api/participacoes/${participacao.id}/chamar-docente`,
            { method: "POST" }
        );

        if (!r.ok) return setErro("Erro ao chamar docente");

        setParticipacao((p) => ({ ...p, chamado: true }));
    };

    const faseConcluida = (faseId) =>
        (participacao?.fasesCompletas ?? []).includes(faseId);

    return (
        <div className="app-container">
            <h2>Área do Aluno</h2>
            {erro && <div className="error-box">{erro}</div>}
            <h3>Bem-vindo, {aluno?.nome}</h3>

            <div className="section">
                <h3>Escolha uma Unidade Curricular</h3>
                <ul>
                    {ucsDisponiveis.map((uc) => (
                        <li key={uc.id}>
                            {uc.nome}{" "}
                            <button onClick={() => selecionarUC(uc)}>
                                Ver Exercícios
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {ucSelecionada && (
                <div className="section">
                    <h3>Exercícios de {ucSelecionada.nome}</h3>
                    <ul>
                        {exercicios.map((e) => (
                            <li key={e.id}>
                                {e.titulo}{" "}
                                <button onClick={() => entrarNoExercicio(e)}>
                                    Entrar
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {exSelecionado && (
                <div className="section">
                    <h4>Exercício: {exSelecionado.titulo}</h4>
                    <h4>Fases</h4>
                    <ol>
                        {fases.map((f) => (
                            <li key={f.id}>
                                [{f.ordem}] {f.titulo}{" "}
                                {faseConcluida(f.id) ? (
                                    <span>✅</span>
                                ) : (
                                    <button onClick={() => concluirFase(f.id)}>
                                        Concluir
                                    </button>
                                )}
                            </li>
                        ))}
                    </ol>
                    <button onClick={chamarDocente}>Chamar Docente</button>
                </div>
            )}
        </div>
    );
}
