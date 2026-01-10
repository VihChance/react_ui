import { useEffect, useState } from "react";

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

    // carregar aluno 1 ao abrir
    useEffect(() => {
        fetch("/api/alunos/1")
            .then((r) => r.json())
            .then(setAluno)
            .catch((err) => setErro("Erro a carregar aluno: " + err));
    }, []);

    const loadUCs = async () => {
        setErro("");
        const r = await fetch("/api/ucs");
        const data = await r.json();
        setUcs(data);
    };

    const listarExerciciosDaUC = async (ucId) => {
        const r = await fetch(`/api/exercicios/uc/${ucId}`);
        const data = await r.json();
        setExercicios(data);
    };

    const selecionarUC = async (uc) => {
        setErro("");
        setUcSelecionada(uc);

        // limpar seleção anterior
        setExSelecionado(null);
        setFases([]);
        setParticipacao(null);

        await listarExerciciosDaUC(uc.id);
    };

    const criarExercicio = async () => {
        setErro("");
        if (!ucSelecionada) return setErro("Seleciona uma UC primeiro.");
        if (!tituloExercicio.trim()) return setErro("Escreve um título para o exercício.");

        const r = await fetch("/api/exercicios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ucId: ucSelecionada.id, titulo: tituloExercicio }),
        });

        if (!r.ok) return setErro("Erro a criar exercício.");
        setTituloExercicio("");
        await listarExerciciosDaUC(ucSelecionada.id); // requisito (3): aparece logo
    };

    const carregarFasesDoExercicio = async (exercicioId) => {
        const r = await fetch(`/api/fases/exercicio/${exercicioId}`);
        if (!r.ok) {
            setFases([]);
            return;
        }
        const data = await r.json();
        setFases(data);
    };

    // “Entrar no exercício” => cria participação
    const entrarNoExercicio = async (ex) => {
        setErro("");
        if (!aluno) return setErro("Aluno ainda não carregou.");

        setExSelecionado(ex);
        setParticipacao(null);
        setFases([]);

        // 1) carregar fases
        await carregarFasesDoExercicio(ex.id);

        // 2) criar participação
        const r = await fetch("/api/participacoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ alunoId: aluno.id, exercicioId: ex.id }),
        });

        // Se der erro (duplicado ou outro), mostramos a mensagem
        if (!r.ok) {
            // tenta ler texto/JSON do erro (depende do teu backend)
            setErro("Não foi possível criar participação (talvez já exista).");
            return;
        }

        const data = await r.json();
        setParticipacao(data);
    };

    const concluirFase = async (faseId) => {
        setErro("");
        if (!participacao) return setErro("Não existe participação. Entra no exercício primeiro.");

        const r = await fetch(
            `/api/participacoes/${participacao.id}/fase/${faseId}/concluir`,
            { method: "POST" }
        );

        if (!r.ok) return setErro("Erro ao concluir fase.");

        // atualizar localmente: acrescentar faseId às fasesCompletas
        setParticipacao((p) => {
            const atual = p?.fasesCompletas ?? [];
            if (atual.includes(faseId)) return p;
            return { ...p, fasesCompletas: [...atual, faseId] };
        });
    };

    const chamarDocente = async () => {
        setErro("");
        if (!participacao) return setErro("Não existe participação. Entra no exercício primeiro.");

        const r = await fetch(`/api/participacoes/${participacao.id}/chamar-docente`, {
            method: "POST",
        });

        if (!r.ok) return setErro("Erro ao chamar docente.");

        setParticipacao((p) => ({ ...p, chamado: true }));
    };

    const faseConcluida = (faseId) => {
        return (participacao?.fasesCompletas ?? []).includes(faseId);
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Checkpoint System (Teste)</h2>

            {erro && (
                <div style={{ padding: 10, marginBottom: 10, border: "1px solid red" }}>
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

            {/* --- UCs ---------------------------------------------------- */}
            <h3>UCs</h3>

            <ul className="uc-list">
                {ucs.map((uc) => (
                    <li
                        key={uc.id}
                        className={ucSelecionada?.id === uc.id ? "uc-selected" : ""}
                    >
                        {uc.nome} (id={uc.id})

                        <button onClick={() => selecionarUC(uc)}>
                            Selecionar
                        </button>

                        <button
                            onClick={() => criarExercicio(uc.id, "Exercício 1")}
                            disabled={ucSelecionada?.id !== uc.id}
                        >
                            Criar Exercício
                        </button>
                    </li>

                ))}
            </ul>


            <h3>Criar Exercício (Docente) a partir da UC</h3>
            <div>
                <div>
                    UC selecionada:{" "}
                    {ucSelecionada ? `${ucSelecionada.nome} (id=${ucSelecionada.id})` : "nenhuma"}
                </div>
                <input
                    placeholder="Título do exercício..."
                    value={tituloExercicio}
                    onChange={(e) => setTituloExercicio(e.target.value)}
                />
                <button onClick={criarExercicio}>Criar</button>
            </div>

            <h3>Exercícios da UC</h3>
            <ul>
                {exercicios.map((e) => (
                    <li key={e.id}>
                        {e.titulo} (id={e.id}){" "}
                        <button onClick={() => entrarNoExercicio(e)}>Entrar (Aluno)</button>
                    </li>
                ))}
            </ul>

            <hr />

            <h3>Exercício selecionado</h3>
            {exSelecionado ? (
                <div>
                    <div>
                        <b>{exSelecionado.titulo}</b> (id={exSelecionado.id})
                    </div>

                    <h4>Participação</h4>
                    {participacao ? (
                        <div>
                            <div>participacaoId: {participacao.id}</div>
                            <div>chamado: {String(participacao.chamado)}</div>
                            <div>terminado: {String(participacao.terminado)}</div>
                            <div>fasesCompletas: {(participacao.fasesCompletas ?? []).join(", ")}</div>

                            <button onClick={chamarDocente}>Chamar Docente</button>
                        </div>
                    ) : (
                        <div>Participação ainda não criada (ou falhou).</div>
                    )}

                    <h4>Fases</h4>
                    {fases.length === 0 ? (
                        <div>Este exercício ainda não tem fases.</div>
                    ) : (
                        <ol>
                            {fases.map((f) => (
                                <li key={f.id}>
                                    <b>[{f.ordem}]</b> {f.titulo}{" "}
                                    {faseConcluida(f.id) ? (
                                        <span>✅ Concluída</span>
                                    ) : (
                                        <button onClick={() => concluirFase(f.id)}>Concluir fase</button>
                                    )}
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            ) : (
                <div>Nenhum exercício selecionado.</div>
            )}
        </div>
    );
}
