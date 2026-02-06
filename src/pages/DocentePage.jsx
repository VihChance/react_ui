import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Form,
    ListGroup,
    Alert,
} from "react-bootstrap";

export default function DocentePage() {
    const [docente, setDocente] = useState(null);
    const [ucs, setUCs] = useState([]);
    const [ucSelecionada, setUcSelecionada] = useState(null);

    const [exercicios, setExercicios] = useState([]);
    const [novoTitulo, setNovoTitulo] = useState("");

    // 👇 NOVO – gestão de fases
    const [exSelecionado, setExSelecionado] = useState(null);
    const [fases, setFases] = useState([]);
    const [novoTituloFase, setNovoTituloFase] = useState("");
    const [novaOrdemFase, setNovaOrdemFase] = useState("");

    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [dashboard, setDashboard] = useState(null);
    const [notaEdicao, setNotaEdicao] = useState({});


    const loadUCs = async () => {
        setErro("");
        try {
            const r = await apiFetch("/api/ucs"); // DOCENTE vê só as suas UCs
            const data = await r.json();
            setUCs(data);
        } catch {
            setErro("Erro ao carregar UCs");
        }
    };

    const loadExerciciosDaUC = async (ucId) => {
        setErro("");
        setSucesso("");
        try {
            const r = await apiFetch(`/api/exercicios/uc/${ucId}`);
            const data = await r.json();
            setExercicios(data);
        } catch {
            setErro("Erro ao carregar exercícios da UC");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const r1 = await apiFetch("/api/docentes/me");
                const docenteData = await r1.json();
                setDocente(docenteData);

                await loadUCs();
            } catch {
                setErro("Erro ao carregar dados iniciais");
            }
        };

        fetchData();
    }, []);



    const selecionarUC = async (uc) => {
        setErro("");
        setSucesso("");

        // clicou de novo ⇒ limpar seleção (toggle)
        if (ucSelecionada && ucSelecionada.id === uc.id) {
            setUcSelecionada(null);
            setExercicios([]);
            setNovoTitulo("");
            setExSelecionado(null);
            setFases([]);
            return;
        }

        // seleciona e carrega exercícios
        setUcSelecionada(uc);
        setExercicios([]);
        setNovoTitulo("");
        setExSelecionado(null);
        setFases([]);

        await loadExerciciosDaUC(uc.id);
    };

    const criarExercicio = async () => {
        setErro("");
        setSucesso("");

        if (!ucSelecionada) {
            setErro("Selecione uma unidade curricular primeiro.");
            return;
        }
        if (!novoTitulo.trim()) {
            setErro("Introduza um título para o exercício.");
            return;
        }

        try {
            const r = await apiFetch("/api/exercicios", {
                method: "POST",
                body: JSON.stringify({
                    ucId: ucSelecionada.id,
                    titulo: novoTitulo,
                }),
            });

            if (!r.ok) {
                const msg = await r.text();
                throw new Error(msg || "Erro ao criar exercício.");
            }

            setNovoTitulo("");
            setSucesso("Exercício criado com sucesso.");
            await loadExerciciosDaUC(ucSelecionada.id);
        } catch (e) {
            setErro(e.message);
        }
    };

    // selecionar um exercício para gerir fases
    const selecionarExercicio = async (ex) => {
        setErro("");
        setSucesso("");

        // toggle: se clicar de novo no mesmo exercício, desmarca
        if (exSelecionado && exSelecionado.id === ex.id) {
            setExSelecionado(null);
            setFases([]);
            setNovoTituloFase("");
            setNovaOrdemFase("");
            setDashboard(null);
            return;
        }

        setExSelecionado(ex);
        setFases([]);
        setNovoTituloFase("");
        setNovaOrdemFase("");
        setDashboard(null);

        try {
            const r = await apiFetch(`/api/fases/exercicio/${ex.id}`);
            const lista = await r.json();
            setFases(lista);

            await carregarDashboard(ex.id);
        } catch {
            setErro("Erro ao carregar fases do exercício.");
        }
    };

    // criar fase para o exercício selecionado
    const criarFase = async () => {
        setErro("");
        setSucesso("");

        if (!exSelecionado) {
            setErro("Selecione um exercício para criar fases.");
            return;
        }
        if (!novoTituloFase.trim()) {
            setErro("Introduza um título para a fase.");
            return;
        }
        if (!novaOrdemFase) {
            setErro("Introduza a ordem (número) da fase.");
            return;
        }

        try {
            const r = await apiFetch("/api/fases", {
                method: "POST",
                body: JSON.stringify({
                    exercicioId: exSelecionado.id,
                    titulo: novoTituloFase,
                    ordem: Number(novaOrdemFase),
                }),
            });

            if (!r.ok) {
                const msg = await r.text();
                throw new Error(msg || "Erro ao criar fase.");
            }

            setNovoTituloFase("");
            setNovaOrdemFase("");
            setSucesso("Fase criada com sucesso.");

            const r2 = await apiFetch(`/api/fases/exercicio/${exSelecionado.id}`);
            setFases(await r2.json());
        } catch (e) {
            setErro(e.message || "Erro ao criar fase.");
        }
    };


    const carregarDashboard = async (exercicioId) => {
        try {
            const r = await apiFetch(`/api/dashboard/${exercicioId}`);
            if (!r.ok) {
                throw new Error("Erro ao carregar progresso dos estudantes.");
            }
            const data = await r.json();
            setDashboard(data);   // data.exercicio + data.progresso
        } catch (e) {
            setErro(e.message);
            setDashboard(null);
        }
    };

    const atribuirNota = async (participacaoId) => {
        try {
            const valor = notaEdicao[participacaoId];

            if (valor === undefined || valor === "") {
                setErro("Introduza uma nota antes de guardar.");
                return;
            }

            const notaNumerica = Number(valor);
            if (Number.isNaN(notaNumerica)) {
                setErro("A nota tem de ser um número.");
                return;
            }

            // Exemplo: escala 0–20, ajusta se for outra
            if (notaNumerica < 0 || notaNumerica > 20) {
                setErro("A nota deve estar entre 0 e 20.");
                return;
            }

            setErro("");

            const r = await apiFetch(
                `/api/participacoes/${participacaoId}/atribuir-nota?nota=${notaNumerica}`,
                { method: "PUT" }
            );

            if (!r.ok) {
                const msg = await r.text();
                throw new Error(msg || "Erro ao atribuir nota.");
            }

            const dto = await r.json(); // ParticipacaoDTO com nota e terminado=true

            // Atualiza o dashboard local (nota + estado terminado)
            setDashboard((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    progresso: prev.progresso.map((linha) =>
                        linha.participacaoId === participacaoId
                            ? {
                                ...linha,
                                nota: dto.nota,
                                terminado: dto.terminado,
                            }
                            : linha
                    ),
                };
            });

            // limpa o input dessa participação
            setNotaEdicao((prev) => {
                const copia = { ...prev };
                delete copia[participacaoId];
                return copia;
            });
        } catch (e) {
            setErro(e.message);
        }
    };



    return (
        <Container className="mt-4">
            <h2>Área do Docente</h2>

            {erro && <Alert variant="danger" className="mt-3">{erro}</Alert>}
            {sucesso && <Alert variant="success" className="mt-3">{sucesso}</Alert>}

            <Card className="mb-4 mt-3">
                <Card.Body>
                    <Card.Title>Bem-vindo, {docente?.nome}</Card.Title>
                </Card.Body>
            </Card>

            <Row>
                {/* Coluna das UCs */}
                <Col md={4}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Minhas UCs</Card.Title>
                            <ListGroup>
                                {ucs.map((uc) => (
                                    <ListGroup.Item
                                        key={uc.id}
                                        className="d-flex justify-content-between align-items-center"
                                        active={ucSelecionada?.id === uc.id}
                                    >
                                        <span>{uc.nome}</span>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => selecionarUC(uc)}
                                        >
                                            {ucSelecionada?.id === uc.id ? "Esconder" : "Ver exercícios"}
                                        </Button>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Coluna de exercícios da UC selecionada */}
                <Col md={8}>
                    {ucSelecionada ? (
                        <Card className="mb-4">
                            <Card.Body>
                                <Card.Title>
                                    Exercícios de {ucSelecionada.nome}
                                </Card.Title>

                                {/* Criar novo exercício */}
                                <h6 className="mt-3">Criar novo exercício</h6>
                                <Form
                                    className="mb-3"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        criarExercicio();
                                    }}
                                >
                                    <Form.Group className="mb-3">
                                        <Form.Control
                                            placeholder="Título do exercício"
                                            value={novoTitulo}
                                            onChange={(e) => setNovoTitulo(e.target.value)}
                                        />
                                    </Form.Group>
                                    <Button type="submit" variant="primary">
                                        Criar exercício
                                    </Button>
                                </Form>

                                {/* Lista de exercícios */}
                                <h6 className="mt-4">Lista de exercícios</h6>
                                {exercicios.length === 0 ? (
                                    <p>Esta UC ainda não tem exercícios.</p>
                                ) : (
                                    <ListGroup className="mb-4">
                                        {exercicios.map((ex) => (
                                            <ListGroup.Item
                                                key={ex.id}
                                                className="d-flex justify-content-between align-items-center"
                                                active={exSelecionado?.id === ex.id}
                                            >
                                                <span>{ex.titulo}</span>
                                                <Button
                                                    size="sm"
                                                    variant="outline-secondary"
                                                    onClick={() => selecionarExercicio(ex)}
                                                >
                                                    {exSelecionado?.id === ex.id
                                                        ? "Esconder fases"
                                                        : "Gerir fases"}
                                                </Button>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}

                                {/* Gestão de fases do exercício selecionado */}
                                {exSelecionado && (
                                    <>
                                        <h5 className="mt-3">
                                            Fases do exercício: {exSelecionado.titulo}
                                        </h5>

                                        <ListGroup as="ol" numbered className="mb-3">
                                            {fases.length === 0 && (
                                                <ListGroup.Item>
                                                    Ainda não existem fases para este exercício.
                                                </ListGroup.Item>
                                            )}
                                            {fases.map((f) => (
                                                <ListGroup.Item as="li" key={f.id}>
                                                    [{f.ordem}] {f.titulo}
                                                </ListGroup.Item>
                                                ))}
                                        </ListGroup>


                                        <h6>Criar nova fase</h6>
                                        <Form
                                            className="mb-3"
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                criarFase();
                                            }}
                                        >
                                            <Form.Group className="mb-2">
                                                <Form.Label>Título da fase</Form.Label>
                                                <Form.Control
                                                    placeholder=""
                                                    value={novoTituloFase}
                                                    onChange={(e) =>
                                                        setNovoTituloFase(e.target.value)
                                                    }
                                                />
                                            </Form.Group>
                                            <Form.Group className="mb-2">
                                                <Form.Label>Ordem</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    min="1"
                                                    placeholder=""
                                                    value={novaOrdemFase}
                                                    onChange={(e) =>
                                                        setNovaOrdemFase(e.target.value)
                                                    }
                                                />
                                            </Form.Group>
                                            <Button type="submit" variant="success">
                                                Adicionar fase
                                            </Button>
                                        </Form>
                                    </>
                                )}

                                {/* Dashboard de progresso dos estudantes */}
                                {dashboard && (
                                    <>
                                        <h5 className="mt-4">
                                            Progresso dos estudantes ({dashboard.exercicio})
                                        </h5>

                                        <div className="table-responsive">
                                            <table className="table align-middle">
                                                <thead>
                                                <tr>
                                                    <th>Aluno</th>
                                                    <th style={{ width: "35%" }}>Progresso</th>
                                                    <th>Fase atual</th>
                                                    <th>Nota</th>
                                                    <th>Estado</th>
                                                    <th>Chamou docente?</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {dashboard.progresso && dashboard.progresso.length > 0 ? (
                                                    dashboard.progresso.map((p, idx) => (
                                                        <tr key={idx}>
                                                            <td>{p.aluno}</td>

                                                            {/* Barra de progresso */}
                                                            <td>
                                                                <div className="progress">
                                                                    <div
                                                                        className={
                                                                            "progress-bar " +
                                                                            (p.terminado
                                                                                ? "bg-success"
                                                                                : "bg-info")
                                                                        }
                                                                        role="progressbar"
                                                                        style={{ width: `${p.percentagem}%` }}
                                                                        aria-valuenow={p.percentagem}
                                                                        aria-valuemin="0"
                                                                        aria-valuemax="100"
                                                                    >
                                                                        {p.percentagem}%
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Em que passo vai */}
                                                            <td>
                                                                {p.totalFases === 0
                                                                    ? "Sem fases"
                                                                    : p.terminado
                                                                        ? `Concluído (${p.fasesConcluidas}/${p.totalFases})`
                                                                        : `Fase ${p.faseAtual} de ${p.totalFases}`}
                                                            </td>

                                                            <td style={{ minWidth: "180px" }}>
                                                                {p.nota != null ? (
                                                                    // Se já tem nota, apenas mostra
                                                                    <strong>{p.nota}</strong>
                                                                ) : (
                                                                    // Se ainda não tem nota, deixa o docente escrever e guardar
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <Form.Control
                                                                            size="sm"
                                                                            type="number"
                                                                            step="0.1"
                                                                            min="0"
                                                                            max="20"
                                                                            placeholder="Nota"
                                                                            value={notaEdicao[p.participacaoId] ?? ""}
                                                                            onChange={(e) =>
                                                                                setNotaEdicao((prev) => ({
                                                                                    ...prev,
                                                                                    [p.participacaoId]: e.target.value,
                                                                                }))
                                                                            }
                                                                        />
                                                                        <Button
                                                                            size="sm"
                                                                            variant="success"
                                                                            onClick={() => atribuirNota(p.participacaoId)}
                                                                        >
                                                                            Guardar
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </td>


                                                            <td>{p.terminado ? "Terminado" : "Em progresso"}</td>
                                                            <td>{p.chamado ? "Sim" : "Não"}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6}>
                                                            Ainda não há participações neste exercício.
                                                        </td>
                                                    </tr>
                                                )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    ) : (
                        <p>Selecione uma UC para ver os exercícios.</p>
                    )}
                </Col>

            </Row>
        </Container>
    );
}
