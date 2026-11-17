import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { 
  LayoutDashboard, Clock, CheckCircle, XCircle, CheckCheck, IndianRupee, 
  Phone, Mail, User, AlertCircle, RefreshCw, Filter, Calendar as CalendarIcon, 
  Plus, Trash2, Edit2, ChevronLeft, ChevronRight, AlertTriangle, Briefcase, FileText, X 
} from 'lucide-react';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Blackout & Calendar States
  const [blackouts, setBlackouts] = useState([]);
  const [loadingBlackouts, setLoadingBlackouts] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlackout, setEditingBlackout] = useState(null);
  const [selectedDateForBlackout, setSelectedDateForBlackout] = useState('');
  
  // Blackout Form State
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    category: 'Leave',
    note: ''
  });

  // Clashes and Confirmation Dialog State
  const [clashingAppointments, setClashingAppointments] = useState([]);
  const [checkingClashesId, setCheckingClashesId] = useState(null);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [submittingBlackout, setSubmittingBlackout] = useState(false);

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

  const fetchBlackouts = async () => {
    setLoadingBlackouts(true);
    try {
      const res = await api.get('/blackouts');
      setBlackouts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch blackout periods:', err);
    } finally {
      setLoadingBlackouts(false);
    }
  };

  useEffect(() => {
    fetchDoctorAppointments();
    fetchBlackouts();
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

  // Calendar Helper Functions
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Open Add Blackout Modal (optionally with preselected date)
  const openAddModal = (dateStr = '') => {
    setEditingBlackout(null);
    const todayStr = dateStr || new Date().toISOString().split('T')[0];
    setFormData({
      start_date: todayStr,
      end_date: todayStr,
      start_time: '',
      end_time: '',
      category: 'Leave',
      note: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Blackout Modal
  const openEditModal = (blackout) => {
    setEditingBlackout(blackout);
    setFormData({
      start_date: blackout.start_date || '',
      end_date: blackout.end_date || '',
      start_time: blackout.start_time || '',
      end_time: blackout.end_time || '',
      category: blackout.category || 'Leave',
      note: blackout.note || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveBlackout = async (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) {
      alert('Start Date and End Date are required.');
      return;
    }

    setSubmittingBlackout(true);
    try {
      if (editingBlackout) {
        await api.put(`/blackouts/${editingBlackout.id}`, formData);
      } else {
        await api.post('/blackouts', formData);
      }
      setIsModalOpen(false);
      fetchBlackouts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save blackout period.');
    } finally {
      setSubmittingBlackout(false);
    }
  };

  const checkClashesBeforeDelete = async (blackoutId) => {
    setCheckingClashesId(blackoutId);
    try {
      const res = await api.get(`/blackouts/${blackoutId}/clashes`);
      setClashingAppointments(res.data || []);
      setDeleteModalId(blackoutId);
    } catch (err) {
      // If endpoint fails or returns empty, still allow deletion confirmation
      setClashingAppointments([]);
      setDeleteModalId(blackoutId);
    } finally {
      setCheckingClashesId(null);
    }
  };

  const confirmDeleteBlackout = async (blackoutId) => {
    try {
      await api.delete(`/blackouts/${blackoutId}`);
      setDeleteModalId(null);
      fetchBlackouts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete blackout period.');
    }
  };

  // Check if a specific calendar date is within any blackout period
  const getBlackoutForDate = (dateString) => {
    return blackouts.find(b => {
      return dateString >= b.start_date && dateString <= b.end_date;
    });
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      
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
          onClick={() => { fetchDoctorAppointments(); fetchBlackouts(); }}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5 shadow-2xs"
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

      {/* ========================================== */}
      {/* DEDICATED AVAILABILITY & BLACKOUT CALENDAR */}
      {/* ========================================== */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-teal-600" />
              <span>Availability & Blackout Calendar</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mark your leave, conferences, or off-hours to prevent patients from booking unavailable slots.
            </p>
          </div>

          <button
            onClick={() => openAddModal()}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Unavailable Period</span>
          </button>
        </div>

        {/* Calendar Navigation & Legend */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center space-x-3">
            <button 
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-200/70 rounded-xl text-slate-700 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-base font-extrabold text-slate-900 min-w-[160px] text-center">
              {monthNames[month]} {year}
            </h3>
            <button 
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-200/70 rounded-xl text-slate-700 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Color Indicators Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
              <span>Unavailable (Blackout)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span>
              <span>Confirmed Appt</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span>Pending Appt</span>
            </div>
          </div>
        </div>

        {/* Monthly Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="grid grid-cols-7 bg-slate-100 text-center text-xs font-bold text-slate-700 py-3 border-b border-slate-200">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px">
            {/* Empty slots for start of month */}
            {Array.from({ length: firstDay }).map((_, index) => (
              <div key={`empty-${index}`} className="bg-slate-50/50 min-h-[90px] p-2 text-slate-300"></div>
            ))}

            {/* Actual Days */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const dayNum = index + 1;
              const formattedMonth = String(month + 1).padStart(2, '0');
              const formattedDay = String(dayNum).padStart(2, '0');
              const dateString = `${year}-${formattedMonth}-${formattedDay}`;

              const blackout = getBlackoutForDate(dateString);
              const dayAppointments = appointments.filter(a => a.date === dateString && a.status !== 'cancelled');
              const hasConfirmed = dayAppointments.some(a => a.status === 'confirmed');
              const hasPending = dayAppointments.some(a => a.status === 'pending');

              return (
                <div 
                  key={dateString}
                  onClick={() => openAddModal(dateString)}
                  className={`bg-white min-h-[105px] p-2.5 flex flex-col justify-between cursor-pointer transition-all hover:bg-slate-50 relative group ${
                    blackout ? 'bg-rose-50/60 hover:bg-rose-50 border-t-2 border-rose-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center ${
                      blackout ? 'bg-rose-200 text-rose-900 font-extrabold' : 'text-slate-800'
                    }`}>
                      {dayNum}
                    </span>

                    {blackout && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded-md truncate max-w-[70px]" title={blackout.category}>
                        {blackout.category}
                      </span>
                    )}
                  </div>

                  {/* Indicators for Blackouts and Appointments */}
                  <div className="space-y-1 mt-1">
                    {blackout && (
                      <div className="text-[10px] font-semibold text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded truncate">
                        {blackout.start_time ? `${blackout.start_time} - ${blackout.end_time || 'End'}` : 'Full Day Off'}
                      </div>
                    )}

                    {dayAppointments.length > 0 && (
                      <div className="flex items-center space-x-1 text-[10px] font-bold">
                        {hasConfirmed && <span className="w-2 h-2 rounded-full bg-sky-500" title="Confirmed appointment"></span>}
                        {hasPending && <span className="w-2 h-2 rounded-full bg-amber-500" title="Pending appointment"></span>}
                        <span className="text-slate-600">{dayAppointments.length} apt{dayAppointments.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-teal-500/30 rounded pointer-events-none transition-all"></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Existing Blackout Periods List */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-teal-600" />
            <span>Configured Blackout Periods ({blackouts.length})</span>
          </h3>

          {loadingBlackouts ? (
            <div className="text-xs text-slate-500 py-4 text-center">Loading blackout periods...</div>
          ) : blackouts.length === 0 ? (
            <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl text-center border border-slate-200">
              No blackout periods configured. Click "Add Unavailable Period" to mark your leave or off-hours.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {blackouts.map((b) => (
                <div key={b.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-lg">
                        {b.category}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {b.start_date === b.end_date ? b.start_date : `${b.start_date} to ${b.end_date}`}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900">
                      {b.start_time && b.end_time ? `${b.start_time} - ${b.end_time}` : 'Full Day Unavailability'}
                    </p>

                    {b.note && (
                      <p className="text-xs text-slate-600 italic bg-white p-2 rounded-xl border border-slate-100">
                        "{b.note}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200/60">
                    <button
                      onClick={() => openEditModal(b)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors flex items-center space-x-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => checkClashesBeforeDelete(b.id)}
                      disabled={checkingClashesId === b.id}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition-colors flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{checkingClashesId === b.id ? 'Checking...' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* APPOINTMENT MANAGEMENT SECTION             */}
      {/* ========================================== */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Patient Appointments</h2>
            <p className="text-xs text-slate-500">Filter and manage appointment requests from patients.</p>
          </div>

          {/* Filter Tabs Bar */}
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
                      {apt.patient_name ? apt.patient_name.charAt(0) : 'P'}
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

      {/* ========================================== */}
      {/* MODAL: ADD / EDIT UNAVAILABLE PERIOD       */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-teal-600" />
                <span>{editingBlackout ? 'Edit Unavailable Period' : 'Add Unavailable Period'}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBlackout} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-teal-500 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-teal-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Start Time (Optional)</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-teal-500 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">End Time (Optional)</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-teal-500 bg-slate-50/50"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">Leaving times empty will mark the entire date range as a full-day blackout.</p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-teal-500 bg-slate-50/50"
                >
                  <option value="Leave">Leave</option>
                  <option value="Conference">Conference</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Note (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Attending annual medical conference in Delhi"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-teal-500 bg-slate-50/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBlackout}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {submittingBlackout ? 'Saving...' : editingBlackout ? 'Update Period' : 'Save Blackout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* CONFIRMATION DIALOG FOR DELETE & CLASHES   */}
      {/* ========================================== */}
      {deleteModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Blackout Period?</h3>
                <p className="text-xs text-slate-500">Are you sure you want to remove this unavailable period?</p>
              </div>
            </div>

            {clashingAppointments.length > 0 ? (
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 space-y-2">
                <p className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Warning: {clashingAppointments.length} appointment(s) clash with this blackout period!</span>
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1 text-[11px] text-amber-800">
                  {clashingAppointments.map(a => (
                    <div key={a.id} className="bg-white/80 p-2 rounded-lg border border-amber-100 flex justify-between">
                      <span>{a.patient_name}</span>
                      <span className="font-semibold">{a.date} at {a.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                No clashing appointments were found for this blackout period.
              </p>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeleteModalId(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteBlackout(deleteModalId)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorDashboard;