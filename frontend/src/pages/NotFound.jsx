import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="text-center space-y-6 max-w-md glass-panel p-8 rounded-3xl border border-slate-200 shadow-xl">
        <div className="w-16 h-16 rounded-3xl medical-gradient mx-auto flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
          <Stethoscope className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-slate-800">Page Not Found</h2>
          <p className="text-xs text-slate-500">
            The page or medical resource you are looking for does not exist or has been moved.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-500/20"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
