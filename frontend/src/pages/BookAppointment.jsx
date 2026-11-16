import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, FileText, ArrowLeft, CheckCircle2, AlertCircle, UserCheck, ShieldCheck } from 'lucide-react';

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const generate30MinSlots = (fromTimeStr, toTimeStr) => {
  const slots = [];
  if (!fromTimeStr || !toTimeStr) return slots;

  const [fromH, fromM] = fromTimeStr.split(':').map(Number);
  const [toH, toM] = toTimeStr.split(':').map(Number);

  let current = fromH * 60 + fromM;
  const end = toH * 60 + toM;

  while (current < end) {
    const hh = String(Math.floor(current / 60)).padStart(2, '0');
    const mm = String(current % 60).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
    current += 30;
  }

  return slots;
};

const BookAppointment = () => {
  const { doctorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(true);

  // Form states
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to tomorrow YYYY-MM-DD
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  
  const [weekdayWarning, setWeekdayWarning] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch Doctor info
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await api.get(`/doctors/${doctorId}`);
        setDoctor(res.data);
      } catch (err) {
        setError('Doctor not found.');
      } finally {
        setLoadingDoc(false);
      }
    };
    fetchDoctor();
  }, [doctorId]);

  // 2. Whenever date or doctor changes, validate weekday & fetch booked slots
  useEffect(() => {
    if (!doctor || !selectedDate) return;

    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayName = DAY_NAMES[dateObj.getDay()];
    const doctorDays = doctor.available_days.split(',').map((d) => d.trim());

    if (!doctorDays.includes(dayName)) {
      setWeekdayWarning(`Dr. ${doctor.name} is not available on ${dayName}s. Available days: ${doctor.available_days}`);
    } else {
      setWeekdayWarning('');
    }

    // Generate 30-min time slots
    const generated = generate30MinSlots(doctor.available_from, doctor.available_to);
    setAvailableSlots(generated);
    setSelectedTime('');

    // Fetch booked slots from backend
    const fetchBooked = async () => {
      try {
        const res = await api.get(`/appointments/booked-slots?doctor_id=${doctorId}&date=${selectedDate}`);
        setBookedSlots(res.data.booked_slots || []);
      } catch (err) {
        console.error("Failed to fetch booked slots:", err);
      }
    };
    fetchBooked();

  }, [doctor, selectedDate, doctorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (weekdayWarning) {
      setError(weekdayWarning);
      return;
    }

    if (!selectedTime) {
      setError('Please select an available time slot.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the consultation.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/appointments', {
        doctor_id: parseInt(doctorId, 10),
        date: selectedDate,
        time: selectedTime,
        reason: reason.trim()
      });

      setSuccessMsg('Appointment booked successfully!');
      setTimeout(() => {
        navigate('/my-appointments');
      }, 1200);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book appointment. Slot might be unavailable.');
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  if (loadingDoc) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="h-96 bg-slate-200/50 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Back button */}
      <Link to="/doctors" className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Doctors Directory</span>
      </Link>

      {/* Main Booking Card */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center space-x-4 border-b border-slate-200 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0 shadow-sm">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Book Consultation</span>
            <h1 className="text-2xl font-extrabold text-slate-900">{doctor?.name}</h1>
            <p className="text-xs text-slate-500">{doctor?.specialization} • ₹{doctor?.fee} Fee</p>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg} Redirecting to your appointments...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Date Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Select Appointment Date *</span>
            </label>
            <input
              type="date"
              min={todayStr}
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-64 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900 font-medium"
            />
            {weekdayWarning && (
              <p className="text-xs font-semibold text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{weekdayWarning}</span>
              </p>
            )}
          </div>

          {/* Time Slot Selection Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Select 30-Minute Time Slot *</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">Working hours: {doctor?.available_from} - {doctor?.available_to}</span>
            </label>

            {availableSlots.length === 0 ? (
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">No slots available for this doctor's schedule.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                {availableSlots.map((slotTime) => {
                  const isBooked = bookedSlots.includes(slotTime);
                  const isSelected = selectedTime === slotTime;

                  return (
                    <button
                      key={slotTime}
                      type="button"
                      disabled={isBooked || !!weekdayWarning}
                      onClick={() => setSelectedTime(slotTime)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                        isBooked
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                          : isSelected
                          ? 'medical-gradient text-white border-teal-600 shadow-sm scale-105'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-500 hover:bg-teal-50'
                      }`}
                    >
                      {slotTime}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Consultation Reason */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Reason for Consultation / Symptoms *</span>
            </label>
            <textarea
              rows="3"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe your symptoms or reason for visiting..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Booking Summary Box */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Booking Summary</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <p>Patient: <strong className="text-slate-900">{user?.name}</strong></p>
              <p>Doctor: <strong className="text-slate-900">{doctor?.name}</strong></p>
              <p>Date: <strong className="text-slate-900">{selectedDate || 'Not selected'}</strong></p>
              <p>Time: <strong className="text-slate-900">{selectedTime || 'Not selected'}</strong></p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !!weekdayWarning || !selectedTime}
            className="w-full py-3.5 px-4 text-sm font-bold text-white medical-gradient rounded-xl hover:opacity-95 shadow-md shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {submitting ? <span>Confirming Booking...</span> : <span>Confirm Appointment</span>}
          </button>
        </form>

      </div>
    </div>
  );
};

export default BookAppointment;
