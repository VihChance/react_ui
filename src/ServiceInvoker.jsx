import { useEffect, useState } from "react";
import { apiFetch } from "./api.js";

export default function ServiceInvoker() {
    const [aluno, setAluno] = useState(null);

    const [ucs, setUcs] = useState([]);
    const [ucSelecionada, setUcSelecionada] = useState(null);

    const [exercicios, setExercicios] = useState([]);
    const [exSelecionado, setExSelecionado] = useState(null);

    const [tituloExercicio, setTituloExercicio] = useState("");

    const [fases, setFases] = useState([]);
    const [participacao, setParticipacao] = useState(null);

    const [erro, setErro] = useState("");

    // 🔐 carregar aluno autenticado (via JWT)
    useEffect(() => {
        apiFetch("/api/alunos/me")
            .then((r) => {
                if (!r.ok) throw new Error("Não autorizado");
                return r.json();
            })
            .then(setAluno)
            .catch(() => setErro("Erro ao carregar aluno autenticado"));
    }, []);

    const loadUCs = async () => {
        setErro("");
        const r = await apiFetch("/api/ucs");
        const data = await r.json();
        setUcs(data);
    };

    const listarExerciciosDaUC = async (ucId) => {
        const r = await apiFetch(`/api/exercicios/uc/${ucId}`);
        const data = await r.json();
        setExercicios(data);
    };

    const selecionarUC = async (uc) => {
        setErro("");
        setUcSelecionada(uc);
        setExSelecionado(null);
        setFases([]);
        setParticipacao(null);

        await listarExerciciosDaUC(uc.id);
    };

    const criarExercicio = async () => {
        setErro("");
        if (!ucSelecionada) return setErro("Seleciona uma UC primeiro.");
        if (!tituloExercicio.trim()) return setErro("Escreve um título.");

        const r = await apiFetch("/api/exercicios", {
            method: "POST",
            body: JSON.stringify({
                ucId: ucSelecionada.id,
                titulo: tituloExercicio,
            }),
        });

        if (!r.ok) return setErro("Erro ao criar exercício.");

        setTituloExercicio("");
        await listarExerciciosDaUC(ucSelecionada.id);
    };

    const carregarFasesDoExercicio = async (exercicioId) => {
        const r = await apiFetch(`/api/fases/exercicio/${exercicioId}`);
        if (!r.ok) {
            setFases([]);
            return;
        }
        setFases(await r.json());
    };

    // 🎓 entrar no exercício (cria participação)
    const entrarNoExercicio = async (ex) => {
        setErro("");
        if (!aluno) return setErro("Aluno não carregado.");

        setExSelecionado(ex);
        setParticipacao(null);
        setFases([]);

        await carregarFasesDoExercicio(ex.id);

        const r = await apiFetch("/api/participacoes", {
            method: "POST",
            body: JSON.stringify({
                alunoId: aluno.id,
                exercicioId: ex.id,
            }),
        });

        if (!r.ok) {
            const msg = await r.text();
            setErro(msg || "Erro ao criar participação.");
            return;
        }

        setParticipacao(await r.json());
    };

    const concluirFase = async (faseId) => {
        setErro("");
        if (!participacao) return;

        const r = await apiFetch(
            `/api/participacoes/${participacao.id}/fase/${faseId}/concluir`,
            { method: "POST" }
        );

        if (!r.ok) return setErro("Erro ao concluir fase.");

        setParticipacao((p) => ({
            ...p,
            fasesCompletas: [...(p.fasesCompletas ?? []), faseId],
        }));
    };

    const chamarDocente = async () => {
        setErro("");
        if (!participacao) return;

        const r = await apiFetch(
            `/api/participacoes/${participacao.id}/chamar-docente`,
            { method: "POST" }
        );

        if (!r.ok) return setErro("Erro ao chamar docente.");

        setParticipacao((p) => ({ ...p, chamado: true }));
    };

    const faseConcluida = (faseId) =>
        (participacao?.fasesCompletas ?? []).includes(faseId);

    return (
        <div style={{ padding: 20 }}>
            <h2>Checkpoint System</h2>

            {erro && (
                <div style={{ border: "1px solid red", padding: 10 }}>
                    {erro}
                </div>
            )}

            <button onClick={loadUCs}>Carregar UCs</button>

            <h3>Aluno</h3>
            {aluno ? (
                <div>
                    <div>Nome: {aluno.nome}</div>
                    <div>ID: {aluno.id}</div>
                </div>
            ) : (
                <div>A carregar aluno...</div>
            )}

            <h3>UCs</h3>
            <ul className="uc-list">
                {ucs.map((uc) => (
                    <li key={uc.id}>
                        {uc.nome}
                        <button onClick={() => selecionarUC(uc)}>Selecionar</button>
                    </li>
                ))}
            </ul>

            <h3>Criar Exercício</h3>
            <input
                value={tituloExercicio}
                onChange={(e) => setTituloExercicio(e.target.value)}
            />
            <button onClick={criarExercicio}>Criar</button>

            <h3>Exercícios</h3>
            <ul>
                {exercicios.map((e) => (
                    <li key={e.id}>
                        {e.titulo}
                        <button onClick={() => entrarNoExercicio(e)}>Entrar</button>
                    </li>
                ))}
            </ul>

            {exSelecionado && (
                <>
                    <h3>Fases</h3>
                    <ol>
                        {fases.map((f) => (
                            <li key={f.id}>
                                {f.titulo}
                                {faseConcluida(f.id) ? " ✅" : (
                                    <button onClick={() => concluirFase(f.id)}>
                                        Concluir
                                    </button>
                                )}
                            </li>
                        ))}
                    </ol>

                    {participacao && (
                        <button onClick={chamarDocente}>
                            Chamar Docente
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
