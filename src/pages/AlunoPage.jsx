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

    // 🚀 Carrega aluno, participações e UCs deste aluno
    useEffect(() => {
        (async () => {
            try {
                const alunoResp = await apiFetch("/api/alunos/me");
                const dadosAluno = await alunoResp.json();
                setAluno(dadosAluno);

                const [partsResp, ucsResp] = await Promise.all([
                    apiFetch(`/api/participacoes/aluno/${dadosAluno.id}`),
                    apiFetch("/api/ucs/minhas"),   // apenas UCs deste aluno
                ]);

                setParticipacoes(await partsResp.json());
                setUcs(await ucsResp.json());
            } catch {
                setErro("Erro ao carregar dados do aluno ou UCs");
            }
        })();
    }, []);

    // ⏱️ POLLING: sempre que houver UC selecionada, atualiza exercícios de X em X segundos
    useEffect(() => {
        if (!ucSelecionada) return;

        let cancelado = false;

        const carregarExercicios = async () => {
            try {
                const r = await apiFetch(`/api/exercicios/uc/${ucSelecionada.id}`);
                if (!r.ok) throw new Error();
                const data = await r.json();
                if (!cancelado) {
                    setExercicios(data);
                }
            } catch {
                if (!cancelado) {
                    setErro("Erro ao atualizar lista de exercícios.");
                }
            }
        };

        // carrega logo uma vez ao selecionar
        carregarExercicios();

        // depois cria o intervalo (por ex. 5 segundos)
        const intervalId = setInterval(carregarExercicios, 5000);

        // cleanup ao mudar de UC ou sair da página
        return () => {
            cancelado = true;
            clearInterval(intervalId);
        };
    }, [ucSelecionada]);

    // ➤ Selecionar UC (agora só trata de estado; o fetch fica no useEffect acima)
    const selecionarUC = (uc) => {
        setErro("");
        setUcSelecionada((anterior) =>
            anterior && anterior.id === uc.id ? null : uc
        );
        setExSelecionado(null);
        setFases([]);
        setParticipacao(null);
        setExercicios([]);
    };

    // IDs de exercícios que já têm participação
    const iniciadosIds = useMemo(() => {
        const ids = new Set();
        for (const p of participacoes || []) {
            const id = p?.exercicio?.id ?? p?.exercicioId;
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
                        (p) =>
                            String(p?.exercicio?.id ?? p?.exercicioId) === String(ex.id)
                    );
                    if (existente) {
                        setParticipacao(existente);
                        setParticipacoes((prev) => {
                            const jaTem = prev.some(
                                (p) =>
                                    String(p?.exercicio?.id ?? p?.exercicioId) ===
                                    String(ex.id)
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
        try {
            const r = await apiFetch(
                `/api/participacoes/${participacao.id}/fase/${faseId}/concluir`,
                { method: "POST" }
            );
            if (!r.ok) throw new Error("Erro ao concluir fase");

            const dto = await r.json();
            setParticipacao(dto);
        } catch (e) {
            setErro(e.message);
        }
    };

    const chamarDocente = async () => {
        try {
            const r = await apiFetch(
                `/api/participacoes/${participacao.id}/chamar-docente`,
                { method: "PUT" }
            );
            if (!r.ok) throw new Error("Erro ao chamar docente");

            const dto = await r.json();
            setParticipacao(dto);
        } catch (e) {
            setErro(e.message);
        }
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
                                    <ListGroup.Item
                                        key={uc.id}
                                        className="d-flex justify-content-between align-items-center"
                                        active={ucSelecionada?.id === uc.id}
                                    >
                                        {uc.nome}
                                        <Button
                                            size="sm"
                                            className="float-end"
                                            onClick={() => selecionarUC(uc)}
                                        >
                                            {ucSelecionada?.id === uc.id
                                                ? "Esconder"
                                                : "Ver Exercícios"}
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
                                                    onClick={() =>
                                                        navigate(`/exercicios/${ex.id}`)
                                                    }
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
                                        <span>✔</span>
                                    ) : (
                                        <Button size="sm" onClick={() => concluirFase(f.id)}>
                                            Concluir
                                        </Button>
                                    )}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>

                        <Button
                            variant={participacao?.chamado ? "secondary" : "warning"}
                            className="mt-3"
                            onClick={chamarDocente}
                            disabled={participacao?.chamado}
                        >
                            {participacao?.chamado
                                ? "Docente já chamado"
                                : "Chamar Docente"}
                        </Button>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
}
