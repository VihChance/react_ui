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

                await loadUCs();
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
        <Container className="mt-4">
            <h2>Área do Docente</h2>

            {erro && <Alert variant="danger">{erro}</Alert>}

            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>Bem-vindo, {docente?.nome}</Card.Title>
                </Card.Body>
            </Card>

            <Row>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Criar nova UC</Card.Title>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Control
                                        placeholder="Nome da UC"
                                        value={ucNome}
                                        onChange={(e) => setUcNome(e.target.value)}
                                    />
                                </Form.Group>
                                <Button variant="primary" onClick={criarUC}>
                                    Criar
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Minhas UCs</Card.Title>
                            <ListGroup>
                                {ucs.map((uc) => (
                                    <ListGroup.Item key={uc.id}>
                                        {uc.nome} (id: {uc.id})
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
