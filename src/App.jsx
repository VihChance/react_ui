// App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Container, Navbar, Nav, Button } from "react-bootstrap";
import { useAuth } from "./auth/AuthContext";
import Login from "./pages/Login";
import AlunoPage from "./pages/AlunoPage";
import DocentePage from "./pages/DocentePage";


function RotaPrivada({ roleEsperado, children }) {
    const { token, role } = useAuth();

    if (!token) return <Navigate to="/" />;
    if (role !== roleEsperado) return <Navigate to="/" />;
    return children;
}

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
                    <Route path="/" element={<Login />} />

                    <Route
                        path="/aluno"
                        element={
                            <RotaPrivada roleEsperado="ALUNO">
                                <AlunoPage />
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

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Container>
        </>
    );
}
