import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Mail, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const isExpired = queryParams.get('expired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.user.role === 'doctor') {
        navigate('/dashboard');
      } else {
        navigate('/doctors');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-3xl shadow-xl border border-slate-200">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl medical-gradient mx-auto flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome to MedBook</h2>
          <p className="text-xs text-slate-500">Sign in to manage appointments & access healthcare</p>
        </div>

        {isExpired && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Your session has expired. Please log in again.</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-xs sm:text-sm font-bold text-white medical-gradient rounded-xl hover:opacity-95 shadow-md shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? <span>Logging in...</span> : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Assistant */}
        <div className="pt-4 border-t border-slate-200/60">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Demo Quick-Fill:</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => fillDemo('patient1@example.com', 'password123')}
              className="px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 font-medium text-[11px] text-left truncate"
            >
              Patient Demo
            </button>
            <button
              onClick={() => fillDemo('dr.ananya@medbook.com', 'doctorpassword')}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100 font-medium text-[11px] text-left truncate"
            >
              Doctor Demo
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-teal-700 hover:text-teal-800 underline">
            Register here
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
