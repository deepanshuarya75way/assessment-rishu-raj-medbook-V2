import React from 'react';
import { Stethoscope, Heart, PhoneCall, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl medical-gradient flex items-center justify-center text-white">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">MedBook</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              AI-Powered Online Doctor Appointment & Symptom Triage Platform. Connecting patients with trusted specialists seamlessly.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-teal-400 transition-colors">Home</Link></li>
              <li><Link to="/doctors" className="hover:text-teal-400 transition-colors">Find Doctors</Link></li>
              <li><Link to="/register" className="hover:text-teal-400 transition-colors">Register Account</Link></li>
              <li><Link to="/login" className="hover:text-teal-400 transition-colors">Log In</Link></li>
            </ul>
          </div>

          {/* Col 3: Specializations */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Specialists</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Cardiologist</li>
              <li>Dermatologist</li>
              <li>Neurologist</li>
              <li>Orthopedic</li>
              <li>General Physician</li>
            </ul>
          </div>

          {/* Col 4: Emergency Alert */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm">
              <PhoneCall className="w-4 h-4" />
              <span>Emergency Services</span>
            </div>
            <p className="text-xs text-slate-300">
              In case of life-threatening emergencies, call official national services immediately:
            </p>
            <div className="flex space-x-3 text-xs font-mono font-bold text-teal-400">
              <span className="bg-slate-900 px-2 py-1 rounded border border-slate-700">INDIA: 112 / 108</span>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-slate-800/80 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <p>© {new Date().getFullYear()} MedBook. Built for College Project Submission.</p>
          <div className="flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4 text-teal-500" />
            <span>Rule-Based AI Assistant & Secure JWT Portal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
