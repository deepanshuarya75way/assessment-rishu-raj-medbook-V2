import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import DoctorCard from '../components/DoctorCard';
import { Search, Filter, Stethoscope, RefreshCw, XCircle } from 'lucide-react';

const Doctors = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSpec = searchParams.get('specialization') || '';

  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState(initialSpec);
  const [loading, setLoading] = useState(true);

  // Fetch specializations list
  useEffect(() => {
    const fetchSpecs = async () => {
      try {
        const res = await api.get('/doctors/specializations');
        setSpecializations(res.data);
      } catch (err) {
        console.error("Failed to load specializations:", err);
      }
    };
    fetchSpecs();
  }, []);

  // Fetch doctors list when search query or specialization changes
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedSpec) params.append('specialization', selectedSpec);
        if (searchQuery) params.append('q', searchQuery);

        const res = await api.get(`/doctors?${params.toString()}`);
        setDoctors(res.data);
      } catch (err) {
        console.error("Failed to load doctors:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchDoctors();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedSpec]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedSpec('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-3">
          <Stethoscope className="w-8 h-8 text-teal-600" />
          <span>Find & Book Doctors</span>
        </h1>
        <p className="text-sm text-slate-600">
          Browse verified healthcare specialists, check working hours, and book instant appointments.
        </p>
      </div>

      {/* Search & Filter Control Bar */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-200/80 shadow-md flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-1/2">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doctor name, qualification, or symptoms..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
          />
        </div>

        {/* Specialization Filter Dropdown */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Filter className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <select
              value={selectedSpec}
              onChange={(e) => {
                setSelectedSpec(e.target.value);
                if (e.target.value) {
                  setSearchParams({ specialization: e.target.value });
                } else {
                  setSearchParams({});
                }
              }}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900 appearance-none"
            >
              <option value="">All Specializations</option>
              {specializations.map((spec, i) => (
                <option key={i} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {(searchQuery || selectedSpec) && (
            <button
              onClick={handleClearFilters}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors text-xs font-semibold flex items-center space-x-1 whitespace-nowrap"
              title="Clear Filters"
            >
              <XCircle className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>

      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 bg-slate-200/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto my-12 border border-slate-200">
          <Stethoscope className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-lg text-slate-800">No Doctors Found</h3>
          <p className="text-xs text-slate-500">
            We couldn't find any doctors matching your search criteria. Try clearing search filters or checking spelling.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors inline-flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}

    </div>
  );
};

export default Doctors;
