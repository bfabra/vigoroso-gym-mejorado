import React, { useState, useEffect } from 'react';
import { authService } from './services/api';
import LoginView from './components/auth/LoginView';
import TrainerDashboard from './components/trainer/TrainerDashboard';
import ParticipantDashboard from './components/participant/ParticipantDashboard';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Verificar si hay sesión activa
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setView(user.rol === 'participante' ? 'participant-dashboard' : 'trainer-dashboard');
    }
  }, []);

  const handleLogin = async (email, password, isParticipant = false) => {
    setLoading(true);
    setError('');

    try {
      let data;
      if (isParticipant) {
        data = await authService.loginParticipante(email, password);
        setCurrentUser(data.participante);
        setView('participant-dashboard');
      } else {
        data = await authService.loginUsuario(email, password);
        setCurrentUser(data.usuario);
        setView('trainer-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setView('login');
  };

  return (
    <div className="App">
      {view === 'login' && (
        <LoginView onLogin={handleLogin} loading={loading} error={error} />
      )}
      {view === 'trainer-dashboard' && (
        <TrainerDashboard user={currentUser} onLogout={handleLogout} setView={setView} />
      )}
      {view === 'participant-dashboard' && (
        <ParticipantDashboard user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
