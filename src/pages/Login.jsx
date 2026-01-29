import { useState } from 'react';
import { Form, Button, Card, Alert, Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('aluno@estg.pt');
    const [password, setPassword] = useState('1234');
    const [erro, setErro] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        setErro('');
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            setErro('Credenciais inválidas');
            return;
        }
        const { token } = await res.json();
        const { role } = JSON.parse(atob(token.split('.')[1]));
        login(token, role);
        navigate(role === 'ALUNO' ? '/aluno' : '/docente');
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6} lg={4}>
                    <Card>
                        <Card.Body>
                            <h3 className="text-center mb-4">Login</h3>
                            {erro && <Alert variant="danger">{erro}</Alert>}
                            <Form onSubmit={submit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Digite seu email"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Senha</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Digite sua senha"
                                    />
                                </Form.Group>

                                <Button type="submit" variant="primary" className="w-100">
                                    Entrar
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
