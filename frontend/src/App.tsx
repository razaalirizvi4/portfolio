import { useState, useEffect } from 'react';
import './App.css';
import BootSequence from './components/BootSequence';
import LoginScreen from './components/LoginScreen';
import Desktop from './components/Desktop';

type SystemState = 'BOOTING' | 'LOGIN' | 'DESKTOP';

function App() {
  const [systemState, setSystemState] = useState<SystemState>('BOOTING');

  useEffect(() => {
    // Check if user has already "logged in" for faster dev reloading
    const savedState = sessionStorage.getItem('systemState');
    if (savedState === 'DESKTOP') {
      // For now, let's always show boot for the "wow" factor
      // setSystemState('DESKTOP');
    }
  }, []);

  const handleBootComplete = () => {
    setSystemState('LOGIN');
  };

  const handleLogin = () => {
    setSystemState('DESKTOP');
    sessionStorage.setItem('systemState', 'DESKTOP');
  };

  return (
    <div className="app-container selection:bg-blue-500/30">
      {systemState === 'BOOTING' && (
        <BootSequence onComplete={handleBootComplete} />
      )}

      {systemState === 'LOGIN' && (
        <LoginScreen onLogin={handleLogin} />
      )}

      {systemState === 'DESKTOP' && (
        <Desktop />
      )}
    </div>
  );
}

export default App;
