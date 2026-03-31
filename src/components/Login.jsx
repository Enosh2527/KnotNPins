import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'admin123') { // Simple hardcoded password for now
      toast.success('Welcome back to Knot & Pins!');
      onLogin();
    } else {
      toast.error('Incorrect password!');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'url("https://images.unsplash.com/photo-1599643477874-192a2aeb6014?auto=format&fit=crop&q=80&w=2000") center/cover no-repeat', // Luxurious gold/jewelry related background
      padding: '1rem'
    }}>
      {/* Dark overlay for better contrast */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1
      }}></div>

      <div className="glass-panel" style={{
        position: 'relative',
        zIndex: 2,
        padding: '3rem 2rem',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #cfb53b, #d4af37)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem auto',
          boxShadow: '0 4px 15px rgba(207, 181, 59, 0.4)'
        }}>
          <h1 style={{ color: '#fff', fontSize: '2.5rem', margin: 0, lineHeight: 1 }}>K</h1>
        </div>
        
        <h2 style={{ marginBottom: '0.5rem', color: '#333' }}>Knot & Pins</h2>
        <p style={{ color: '#555', marginBottom: '2rem', fontSize: '0.95rem' }}>Business Management Portal</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label" style={{ color: '#333', fontWeight: 600 }}>Master Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(4px)'
              }}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{
            width: '100%', marginTop: '1rem', 
            background: 'linear-gradient(to right, #cfb53b, #b09a31)',
            boxShadow: '0 4px 15px rgba(207, 181, 59, 0.3)'
          }}>
            Secure Login
          </button>
        </form>
      </div>
    </div>
  );
}
