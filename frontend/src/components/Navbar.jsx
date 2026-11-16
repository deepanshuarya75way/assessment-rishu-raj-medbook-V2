import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, User, LogOut, Calendar, LayoutDashboard, Menu, X, Bot } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-xl medical-gradient flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
              <Stethoscope className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-700 to-cyan-600 bg-clip-text text-transparent tracking-tight">
              MedBook
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/doctors"
              className={`text-sm font-medium transition-colors ${
                isActive('/doctors') ? 'text-teal-600 font-semibold' : 'text-slate-600 hover:text-teal-600'
              }`}
            >
              Find Doctors
            </Link>

            {user?.role === 'patient' && (
              <Link
                to="/my-appointments"
                className={`flex items-center space-x-1.5 text-sm font-medium transition-colors ${
                  isActive('/my-appointments') ? 'text-teal-600 font-semibold' : 'text-slate-600 hover:text-teal-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>My Appointments</span>
              </Link>
            )}

            {user?.role === 'doctor' && (
              <Link
                to="/dashboard"
                className={`flex items-center space-x-1.5 text-sm font-medium transition-colors ${
                  isActive('/dashboard') ? 'text-teal-600 font-semibold' : 'text-slate-600 hover:text-teal-600'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Doctor Dashboard</span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center space-x-4 pl-4 border-l border-slate-200">
                <div className="flex items-center space-x-2 text-sm text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">
                  <User className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase tracking-wider font-bold">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 pl-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-700 hover:text-teal-600 px-3 py-2 rounded-lg transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white medical-gradient hover:opacity-95 px-4 py-2 rounded-xl shadow-md shadow-teal-500/20 transition-all hover:shadow-teal-500/30"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-teal-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-3">
          <Link
            to="/doctors"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Find Doctors
          </Link>
          {user?.role === 'patient' && (
            <Link
              to="/my-appointments"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              My Appointments
            </Link>
          )}
          {user?.role === 'doctor' && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Doctor Dashboard
            </Link>
          )}
          {user ? (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="px-3 text-sm text-slate-600">
                Logged in as <strong className="text-slate-900">{user.name}</strong> ({user.role})
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2 rounded-xl text-slate-700 border border-slate-200 font-medium"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2 rounded-xl text-white medical-gradient font-medium"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
