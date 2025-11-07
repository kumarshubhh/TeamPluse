import Signup from '../features/auth/Signup.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';

export default function SignupPage() {
  const { signup } = useAuth();
  return <Signup onSignup={signup} />;
}

