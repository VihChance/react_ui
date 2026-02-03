
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, ListGroup, Button, Alert } from "react-bootstrap";
import { apiFetch } from "../api";

export default function ExercicioPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [aluno, setAluno] = useState(null);
    const [fases, setFases] = useState([]);
    const [participacao, setParticipacao] = useState(null);
    const [erro, setErro] = useState("");
    const [tituloExercicio, setTituloExercicio] = useState("");

    // Carrega aluno, exercício, fases e participação
    useEffect(() => {
        let cancel = false;

        (async () => {
            try {
                const a = await apiFetch("/api/alunos/me").then((r) => r.json());
                if (cancel) return;
                setAluno(a);

                // título do exercício (se tiveres este endpoint no backend)
                try {
                    const ex = await apiFetch(`/api/exercicios/${id}`).then((r) => r.json());
                    if (!cancel) setTituloExercicio(ex?.titulo ?? "");
                } catch {
                    /* se não existir esse endpoint, ignora — manterá #id no título */
                }

                const f = await apiFetch(`/api/fases/exercicio/${id}`).then((r) => r.json());
                if (cancel) return;
                setFases(f);

                const parts = await apiFetch(`/api/participacoes/aluno/${a.id}`).then((r) =>
                    r.json()
                );
                if (cancel) return;
                const p = parts.find(
                    (pp) => String(pp?.exercicioId ?? pp?.exercicio?.id) === String(id)
                );
                setParticipacao(p || null);
            } catch {
                if (!cancel) setErro("Erro a carregar dados do exercício.");
            }
        })();

        return () => {
            cancel = true;
        };
    }, [id]);

    const faseConcluida = (faseId) =>
        (participacao?.fasesCompletas ?? []).includes(faseId);

    const entrar = async () => {
        try {
            const r = await apiFetch("/api/participacoes", {
                method: "POST",
                body: JSON.stringify({ alunoId: aluno.id, exercicioId: Number(id) }),
            });
            if (!r.ok) {
                const msg = await r.text();
                throw new Error(msg || "Não foi possível iniciar o exercício.");
            }
            const nova = await r.json();
            setParticipacao(nova);
        } catch (e) {
            setErro(e.message);
        }
    };

    const concluirFase = async (faseId) => {
        try {
            const r = await apiFetch(
                `/api/participacoes/${participacao.id}/fase/${faseId}/concluir`,
                { method: "POST" }
            );
            if (!r.ok) throw new Error("Erro ao concluir fase");
            setParticipacao((p) => ({
                ...p,
                fasesCompletas: [...(p?.fasesCompletas ?? []), faseId],
            }));
        } catch (e) {
            setErro(e.message);
        }
    };

    const chamarDocente = async () => {
        try {
            const r = await apiFetch(
                `/api/participacoes/${participacao.id}/chamar-docente`,
                { method: "POST" }
            );
            if (!r.ok) throw new Error("Erro ao chamar docente");
            setParticipacao((p) => ({ ...p, chamado: true }));
        } catch (e) {
            setErro(e.message);
        }
    };

    return (
        <Container className="mt-4">
            <h2>Exercício {tituloExercicio ? tituloExercicio : `#${id}`}</h2>
            {erro && <Alert variant="danger" className="mt-3">{erro}</Alert>}

            {!participacao ? (
                <Card className="mt-3">
                    <Card.Body>
                        <Card.Text>Este exercício ainda não foi iniciado.</Card.Text>
                        <Button onClick={entrar}>Entrar</Button>{" "}
                        <Button variant="secondary" onClick={() => navigate(-1)}>
                            Voltar
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <Card className="mt-3">
                    <Card.Body>
                        <Card.Title>Fases</Card.Title>
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

                        <Button
                            variant={participacao?.chamado ? "secondary" : "warning"}
                            className="mt-3"
                            onClick={chamarDocente}
                            disabled={participacao?.chamado}
                        >
                            {participacao?.chamado ? "Docente já chamado" : "Chamar Docente"}
                        </Button>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
}
