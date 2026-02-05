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
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

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
            return;
        }

        // seleciona e carrega exercícios
        setUcSelecionada(uc);
        setExercicios([]);
        setNovoTitulo("");
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

                                <h6 className="mt-4">Lista de exercícios</h6>
                                {exercicios.length === 0 ? (
                                    <p>Esta UC ainda não tem exercícios.</p>
                                ) : (
                                    <ListGroup>
                                        {exercicios.map((ex) => (
                                            <ListGroup.Item key={ex.id}>
                                                {ex.titulo}
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                            </Card.Body>
                        </Card>
                    ) : (
                        <p>Selecione uma unidade curricular para ver ou criar exercícios.</p>
                    )}
                </Col>
            </Row>
        </Container>
    );
}
