'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.message || 'Login gagal.');
      setLoading(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <form className="panel auth-panel" onSubmit={handleSubmit}>
      <div className="panel-header">
        <span className="eyebrow">Masuk Admin</span>
        <h1>Login hanya untuk admin.</h1>
      </div>

      <label className="field">
        <span>Username</span>
        <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="admin" autoComplete="username" />
      </label>

      <label className="field">
        <span>Password</span>
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="••••••••" autoComplete="current-password" />
      </label>

      {error ? <p className="error-box">{error}</p> : null}

      <button className="button primary" type="submit" disabled={loading}>
        {loading ? 'Memproses...' : 'Masuk'}
      </button>

    </form>
  );
}
