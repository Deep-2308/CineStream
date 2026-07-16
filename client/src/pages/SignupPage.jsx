import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/ui/Button.jsx';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signup(name, email, password);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-modal bg-surface p-8">
          <h1 className="mb-6 text-center text-2xl font-bold text-txt">Sign Up</h1>

          {error && (
            <div className="mb-4 rounded-card bg-primary/10 px-4 py-3 text-sm text-primary">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="signup-name" className="mb-1 block text-sm font-medium text-txt-muted">
                Name
              </label>
              <input
                id="signup-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-card border border-surface bg-background px-4 py-2 text-txt outline-none transition-colors focus:border-primary"
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-txt-muted">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-card border border-surface bg-background px-4 py-2 text-txt outline-none transition-colors focus:border-primary"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="mb-1 block text-sm font-medium text-txt-muted">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-card border border-surface bg-background px-4 py-2 text-txt outline-none transition-colors focus:border-primary"
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Sign Up'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-txt-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
