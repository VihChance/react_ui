import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { Container, Row, Col, Card, Button, ListGroup, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function AlunoPage() {
    const [aluno, setAluno] = useState(null);
    const [ucs, setUcs] = useState([]);
    const [ucSelecionada, setUcSelecionada] = useState(null);
    const [exercicios, setExercicios] = useState([]);
    const [exSelecionado, setExSelecionado] = useState(null);
    const [fases, setFases] = useState([]);
    const [participacao, setParticipacao] = useState(null);
    const [participacoes, setParticipacoes] = useState([]);
    const [erro, setErro] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        apiFetch("/api/alunos/me")
            .then((r) => r.json())
            .then((dadosAluno) => {
                setAluno(dadosAluno);
                return apiFetch(`/api/participacoes/aluno/${dadosAluno.id}`);
            })
            .then((r) => r.json())
            .then(setParticipacoes)
            .catch(() => setErro("Erro ao carregar aluno ou participações"));

        apiFetch("/api/ucs/todas")
            .then((r) => r.json())
            .then(setUcs)
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

    // IDs de exercícios que já têm participação (string para evitar number vs string)
    const iniciadosIds = useMemo(() => {
        const ids = new Set();
        for (const p of participacoes || []) {
            const id = p?.exercicio?.id ?? p?.exercicioId; // cobre dois formatos
            if (id != null) ids.add(String(id));
        }
        return ids;
    }, [participacoes]);

    const entrarNoExercicio = async (ex) => {
        try {
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

            // Se já existe, buscar e usar a existente
            if (!r.ok) {
                if (r.status === 409) {
                    const lista = await apiFetch(`/api/participacoes/aluno/${aluno.id}`);
                    const todas = await lista.json();
                    const existente = todas.find(
                        (p) => String(p?.exercicio?.id ?? p?.exercicioId) === String(ex.id)
                    );
                    if (existente) {
                        setParticipacao(existente);
                        // 🔁 garante estado visual correto:
                        setParticipacoes((prev) => {
                            const jaTem = prev.some(
                                (p) => String(p?.exercicio?.id ?? p?.exercicioId) === String(ex.id)
                            );
                            return jaTem ? prev : [...prev, existente];
                        });
                        return;
                    }
                }
                const msg = await r.text();
                setErro(msg || "Erro ao entrar no exercício.");
                return;
            }

            const nova = await r.json();
            setParticipacao(nova);
            // ✅ adiciona a nova participação à lista para atualizar as listas
            setParticipacoes((prev) => {
                const jaTem = prev.some(
                    (p) =>
                        String(p?.exercicio?.id ?? p?.exercicioId) ===
                        String(nova?.exercicio?.id ?? nova?.exercicioId)
                );
                return jaTem ? prev : [...prev, nova];
            });
        } catch {
            setErro("Erro ao entrar no exercício.");
        }
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
        <Container className="mt-4">
            <h2 className="mb-4">Área do Aluno</h2>
            {erro && <Alert variant="danger">{erro}</Alert>}
            <h4 className="mb-3">Bem-vindo, {aluno?.nome}</h4>

            <Row>
                <Col md={4}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Unidades Curriculares</Card.Title>
                            <ListGroup>
                                {ucs.map((uc) => (
                                    <ListGroup.Item key={uc.id}>
                                        {uc.nome}
                                        <Button
                                            size="sm"
                                            className="float-end"
                                            onClick={() => selecionarUC(uc)}
                                        >
                                            Ver Exercícios
                                        </Button>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>

                {ucSelecionada && (
                    <Col md={8}>
                        <Card className="mb-4">
                            <Card.Body>
                                <Card.Title>Exercícios de {ucSelecionada.nome}</Card.Title>

                                <h6 className="mt-3">Já iniciados:</h6>
                                <ListGroup className="mb-4">
                                    {exercicios
                                        .filter((ex) => iniciadosIds.has(String(ex.id)))
                                        .map((ex) => (
                                            <ListGroup.Item
                                                key={ex.id}
                                                className="d-flex justify-content-between align-items-center"
                                            >
                                                <strong>{ex.titulo}</strong>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => navigate(`/exercicios/${ex.id}`)}
                                                >
                                                    Ver
                                                </Button>
                                            </ListGroup.Item>
                                        ))}
                                </ListGroup>

                                <h6 className="mt-3">Ainda não iniciados:</h6>
                                <ListGroup>
                                    {exercicios
                                        .filter((ex) => !iniciadosIds.has(String(ex.id)))
                                        .map((ex) => (
                                            <ListGroup.Item
                                                key={ex.id}
                                                className="d-flex justify-content-between align-items-center"
                                            >
                                                <strong>{ex.titulo}</strong>
                                                <Button
                                                    variant="primary"
                                                    onClick={() => entrarNoExercicio(ex)}
                                                >
                                                    Entrar
                                                </Button>
                                            </ListGroup.Item>
                                        ))}
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    </Col>
                )}
            </Row>

            {exSelecionado && (
                <Card className="mb-4">
                    <Card.Body>
                        <Card.Title>Fases de {exSelecionado.titulo}</Card.Title>
                        <ListGroup as="ol" numbered>
                            {fases.map((f) => (
                                <ListGroup.Item
                                    as="li"
                                    key={f.id}
                                    className="d-flex justify-content-between align-items-center"
                                >
                                    [{f.ordem}] {f.titulo}
                                    {faseConcluida(f.id) ? (
                                        <span>✅</span>
                                    ) : (
                                        <Button size="sm" onClick={() => concluirFase(f.id)}>
                                            Concluir
                                        </Button>
                                    )}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>

                        <Button variant="warning" className="mt-3" onClick={chamarDocente}>
                            Chamar Docente
                        </Button>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
}
