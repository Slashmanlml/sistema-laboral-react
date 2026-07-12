import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Sprout, Lock, Mail, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView = ({ onLoginSuccess }: LoginViewProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError(null);

      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) throw authError;

      if (onLoginSuccess) onLoginSuccess();
    } catch (err: unknown) {
      console.error('Error de autenticación:', err);
      const errorMsg = err instanceof Error ? err.message : 'Ocurrió un error al iniciar sesión.';
      if (errorMsg === 'Invalid login credentials') {
        setError('Correo electrónico o contraseña incorrectos.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden select-none"
      style={{
        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 30%, #a7f3d0 60%, #6ee7b7 100%)',
      }}
    >
      {/* Decorative background circles */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #059669 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }}
      />
      <div
        className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 70%)' }}
      />

      {/* Main Card with glassmorphism */}
      <div
        className="w-full max-w-md relative z-10 animate-fade-in"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.5) inset',
          padding: '40px',
        }}
      >
        {/* Header / Logo */}
        <div className="text-center space-y-4 mb-8">
          <div
            className="w-16 h-16 flex items-center justify-center mx-auto"
            style={{
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
              border: '2px solid #6ee7b7',
              borderRadius: '20px',
              boxShadow: '0 4px 15px rgba(5, 150, 105, 0.2)',
            }}
          >
            <Sprout size={32} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
              GrowManager
            </h1>
            <p className="text-sm mt-1 font-semibold" style={{ color: '#64748b' }}>
              Gestión profesional de cultivos
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="p-4 mb-5 flex items-start gap-3 animate-fade-in"
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '14px',
            }}
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
            <span className="text-sm font-semibold text-red-700">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#475569' }}>
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center" style={{ color: '#94a3b8' }}>
                <Mail size={17} />
              </span>
              <input
                type="email"
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 text-sm font-medium transition"
                style={{
                  background: 'rgba(248, 250, 252, 0.8)',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '14px',
                  color: '#0f172a',
                  outline: 'none',
                }}
                placeholder="ejemplo@correo.com"
                required
                onFocus={(e) => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.12)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#475569' }}>
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center" style={{ color: '#94a3b8' }}>
                <Lock size={17} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3.5 text-sm font-medium transition"
                style={{
                  background: 'rgba(248, 250, 252, 0.8)',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '14px',
                  color: '#0f172a',
                  outline: 'none',
                }}
                placeholder="••••••••"
                required
                onFocus={(e) => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.12)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center transition"
                style={{ color: '#94a3b8' }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-4 text-sm font-bold text-white transition-all duration-200"
            style={{
              background: loading ? '#6ee7b7' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              borderRadius: '14px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(5, 150, 105, 0.35)',
              transform: 'translateY(0)',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verificando...
              </span>
            ) : (
              'Ingresar al Panel'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(226,232,240,0.7)' }}>
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold" style={{ color: '#94a3b8' }}>
            <Shield size={12} className="text-emerald-400" />
            <span>Conexión segura SSL · Datos privados y encriptados</span>
          </div>
        </div>
      </div>

      {/* Bottom branding */}
      <p className="mt-6 text-xs font-medium z-10 relative" style={{ color: 'rgba(5, 150, 105, 0.7)' }}>
        GrowManager v1.0 · Sistema de Cultivo Controlado
      </p>
    </div>
  );
};
