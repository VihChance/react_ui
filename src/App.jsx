import { Routes, Route, Navigate } from "react-router-dom";
import { Container, Navbar, Nav, Button } from "react-bootstrap";
import { useAuth } from "./auth/AuthContext";
import Login from "./pages/Login";
import AlunoPage from "./pages/AlunoPage";
import DocentePage from "./pages/DocentePage";
import ExercicioPage from "./pages/ExercicioPage";
import RotaPrivada from "./RotaPrivada";

export default function App() {
    const { token, logout } = useAuth();

    return (
        <>
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand>Checkpoint System</Navbar.Brand>
                    {token && (
                        <Nav className="ms-auto">
                            <Button variant="outline-light" onClick={logout}>
                                Sair
                            </Button>
                        </Nav>
                    )}
                </Container>
            </Navbar>

            <Container className="mt-4">
                <Routes>
                    /* Raiz redireciona para /login */
                    <Route path="/" element={<Navigate to="/login" replace />} />

                    /* Login */
                    <Route path="/login" element={<Login />} />

                    /* Área do aluno */
                    <Route
                        path="/aluno"
                        element={
                            <RotaPrivada roleEsperado="ALUNO">
                                <AlunoPage />
                            </RotaPrivada>
                        }
                    />


                    <Route
                        path="/exercicios/:id"
                        element={
                            <RotaPrivada roleEsperado="ALUNO">
                                <ExercicioPage />
                            </RotaPrivada>
                        }
                    />

                    <Route
                        path="/docente"
                        element={
                            <RotaPrivada roleEsperado="DOCENTE">
                                <DocentePage />
                            </RotaPrivada>
                        }
                    />

                    /* Qualquer rota inválida */
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Container>
        </>
    );
}
