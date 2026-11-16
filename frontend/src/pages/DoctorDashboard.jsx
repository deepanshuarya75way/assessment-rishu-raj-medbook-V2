import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { LayoutDashboard, Clock, CheckCircle, XCircle, CheckCheck, IndianRupee, Phone, Mail, User, AlertCircle, RefreshCw, Filter } from 'lucide-react';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchDoctorAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments/doctor');
      setAppointments(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch appointment requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorAppointments();
  }, []);

  const handleUpdateStatus = async (aptId, newStatus) => {
    setActionLoadingId(aptId);
    try {
      await api.patch(`/appointments/${aptId}/status`, { status: newStatus });
      setAppointments(appointments.map(apt => 
        apt.id === aptId ? { ...apt, status: newStatus } : apt
      ));
    } catch (err) {
      alert(err.response?.data?.error || `Failed to update status to ${newStatus}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Calculate Dashboard Statistics
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const totalRevenue = appointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + (a.doctor_fee || 0), 0);

  // Filter Appointments
  const filteredAppointments = appointments.filter(a => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-3">
            <LayoutDashboard className="w-8 h-8 text-teal-600" />
            <span>Doctor Dashboard</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage incoming appointment requests, confirm patient slots, and track consultations for <strong className="text-slate-900">{user?.name}</strong>.
          </p>
        </div>

        <button
          onClick={fetchDoctorAppointments}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card p-5 rounded-2xl border border-amber-200/80 bg-amber-50/40 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Requests</p>
            <p className="text-3xl font-extrabold text-amber-900 mt-1">{pendingCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Confirmed Slots</p>
            <p className="text-3xl font-extrabold text-emerald-900 mt-1">{confirmedCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-sky-200/80 bg-sky-50/40 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-sky-700 uppercase tracking-wider">Completed Visits</p>
            <p className="text-3xl font-extrabold text-sky-900 mt-1">{completedCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center">
            <CheckCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-teal-200/80 bg-teal-50/40 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">Earned Revenue</p>
            <p className="text-3xl font-extrabold text-teal-900 mt-1">₹{totalRevenue}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex space-x-2 overflow-x-auto no-scrollbar">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab} ({tab === 'all' ? appointments.length : appointments.filter(a => a.status === tab).length})
            </button>
          ))}
        </div>
      </div>

      {/* Appointment Requests List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-slate-200/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-3 max-w-md mx-auto my-8 border border-slate-200">
          <Clock className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No Appointments under '{statusFilter}'</h3>
          <p className="text-xs text-slate-500">There are no appointments matching the selected status filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="glass-card p-6 rounded-2xl border border-slate-200/90 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-teal-500/40 transition-all"
            >
              
              {/* Patient Info */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
                    {apt.patient_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-900">{apt.patient_name}</h4>
                    <p className="text-xs text-slate-500 flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{apt.patient_phone}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{apt.patient_email}</span>
                      </span>
                    </p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p>Date: <strong className="text-slate-900">{apt.date}</strong></p>
                  <p>Time: <strong className="text-slate-900">{apt.time}</strong></p>
                  <p>Consultation Fee: <strong className="text-slate-900">₹{apt.doctor_fee}</strong></p>
                </div>

                <p className="text-xs text-slate-700 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                  <strong className="text-amber-900">Reason for visit:</strong> {apt.reason}
                </p>
              </div>

              {/* Doctor Action Controls */}
              <div className="flex flex-wrap lg:flex-col gap-2 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6 min-w-[160px]">
                
                {apt.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                    disabled={actionLoadingId === apt.id}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1 shadow-2xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirm Slot</span>
                  </button>
                )}

                {apt.status === 'confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus(apt.id, 'completed')}
                    disabled={actionLoadingId === apt.id}
                    className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1 shadow-2xs"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark Complete</span>
                  </button>
                )}

                {(apt.status === 'pending' || apt.status === 'confirmed') && (
                  <button
                    onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                    disabled={actionLoadingId === apt.id}
                    className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Request</span>
                  </button>
                )}

                {apt.status === 'completed' && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-center">
                    Visit Finished
                  </span>
                )}

                {apt.status === 'cancelled' && (
                  <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 text-center">
                    Cancelled
                  </span>
                )}

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default DoctorDashboard;
