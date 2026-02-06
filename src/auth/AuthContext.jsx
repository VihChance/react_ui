import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [token, setToken] = useState(sessionStorage.getItem('token'));
    const [role, setRole] = useState(sessionStorage.getItem('role'));

    const login = (token, role) => {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('role', role);
        setToken(token);
        setRole(role);
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');
        setToken(null);
        setRole(null);
    };

    return (
        <AuthContext.Provider value={{ token, role, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
