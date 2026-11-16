import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { Calendar, Clock, User, XCircle, AlertCircle, RefreshCw, IndianRupee, Stethoscope } from 'lucide-react';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments/mine');
      setAppointments(res.data);
    } catch (err) {
      setError('Failed to fetch your appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (aptId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    setCancellingId(aptId);
    try {
      await api.patch(`/appointments/${aptId}/status`, { status: 'cancelled' });
      // Update local state
      setAppointments(appointments.map(apt => 
        apt.id === aptId ? { ...apt, status: 'cancelled' } : apt
      ));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel appointment.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-teal-600" />
            <span>My Booked Appointments</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track your upcoming consultations, view status updates, and manage bookings.
          </p>
        </div>

        <Link
          to="/doctors"
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center space-x-1.5"
        >
          <Stethoscope className="w-4 h-4" />
          <span>Book New Doctor</span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-slate-200/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto my-12 border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-lg text-slate-800">No Appointments Booked Yet</h3>
          <p className="text-xs text-slate-500">
            You don't have any scheduled appointments. Browse available doctors to book your first appointment.
          </p>
          <Link
            to="/doctors"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors shadow-md shadow-teal-500/20"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Find a Doctor</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="glass-card p-6 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-teal-500/40 transition-all"
            >
              
              {/* Doctor & Appointment info */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-lg text-slate-900">{apt.doctor_name}</span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                    {apt.doctor_specialization}
                  </span>
                  <StatusBadge status={apt.status} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span className="font-semibold text-slate-900">{apt.date}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span className="font-semibold text-slate-900">{apt.time}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <IndianRupee className="w-4 h-4 text-teal-600" />
                    <span>Fee: <strong className="text-slate-900">₹{apt.doctor_fee}</strong></span>
                  </div>
                </div>

                <p className="text-xs text-slate-600">
                  <strong className="text-slate-800">Reason:</strong> {apt.reason}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6">
                {(apt.status === 'pending' || apt.status === 'confirmed') && (
                  <button
                    onClick={() => handleCancel(apt.id)}
                    disabled={cancellingId === apt.id}
                    className="w-full md:w-auto px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center justify-center space-x-1"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{cancellingId === apt.id ? 'Cancelling...' : 'Cancel Appointment'}</span>
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default MyAppointments;
