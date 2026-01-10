import './App.css';
import ServiceInvoker from './ServiceInvoker.jsx';

export default function App() {
    return (
        <div className="app-container">
            <h1>Checkpoint System</h1>

            {/* ⬇ o componente que carrega dados do Spring */}
            <ServiceInvoker />
        </div>
    );
}
