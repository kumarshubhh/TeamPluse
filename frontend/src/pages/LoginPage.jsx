import Login from '../features/auth/Login.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  return <Login onLogin={login} />;
}

