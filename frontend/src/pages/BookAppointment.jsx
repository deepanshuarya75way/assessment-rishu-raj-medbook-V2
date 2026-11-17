import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, FileText, ArrowLeft, CheckCircle2, AlertCircle, UserCheck, ShieldCheck, Ban } from 'lucide-react';

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

// Helper to check if a 30-minute slot overlaps with a blackout time range
// slotStr is "HH:MM", blackoutStart and blackoutEnd are "HH:MM" (or empty/null for full day)
const isSlotBlackedOut = (slotStr, blackoutStart, blackoutEnd) => {
  if (!blackoutStart || !blackoutEnd) {
    // Full day blackout
    return true;
  }

  // Convert slot time, blackout start and blackout end to minutes from midnight for accurate comparison
  const [slotH, slotM] = slotStr.split(':').map(Number);
  const slotMinutes = slotH * 60 + slotM;

  const [startH, startM] = blackoutStart.split(':').map(Number);
  const startMinutes = startH * 60 + startM;

  const [endH, endM] = blackoutEnd.split(':').map(Number);
  const endMinutes = endH * 60 + endM;

  // Each slot represents 30 minutes: [slotMinutes, slotMinutes + 30)
  // Overlap condition: slotStart < blackoutEnd AND slotEnd > blackoutStart
  const slotEndMinutes = slotMinutes + 30;
  return slotMinutes < endMinutes && slotEndMinutes > startMinutes;
};

const BookAppointment = () => {
  const { doctorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(true);

  // Form states
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [doctorBlackouts, setDoctorBlackouts] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  
  const [weekdayWarning, setWeekdayWarning] = useState('');
  const [blackoutWarning, setBlackoutWarning] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch Doctor info and doctor's public blackout periods
  useEffect(() => {
    let isMounted = true;
    const fetchDoctorData = async () => {
      try {
        setLoadingDoc(true);
        // Fetch doctor info and public blackouts in parallel
        const [docRes, blackoutsRes] = await Promise.all([
          api.get(`/doctors/${doctorId}`),
          api.get(`/doctors/${doctorId}/blackouts`).catch(() => ({ data: [] }))
        ]);

        if (isMounted) {
          setDoctor(docRes.data);
          setDoctorBlackouts(blackoutsRes.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError('Doctor not found or failed to load information.');
        }
      } finally {
        if (isMounted) {
          setLoadingDoc(false);
        }
      }
    };
    fetchDoctorData();

    return () => {
      isMounted = false;
    };
  }, [doctorId]);

  // 2. Whenever date, doctor, or blackouts change, validate weekdays, blackouts & fetch booked slots
  useEffect(() => {
    if (!doctor || !selectedDate) return;

    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayName = DAY_NAMES[dateObj.getDay()];
    const doctorDays = doctor.available_days ? doctor.available_days.split(',').map((d) => d.trim()) : [];

    // Weekday validation
    if (doctorDays.length > 0 && !doctorDays.includes(dayName)) {
      setWeekdayWarning(`Dr. ${doctor.name} is not available on ${dayName}s. Available days: ${doctor.available_days}`);
    } else {
      setWeekdayWarning('');
    }

    // Blackout validation for selectedDate
    const matchingBlackout = doctorBlackouts.find(b => {
      return selectedDate >= b.start_date && selectedDate <= b.end_date;
    });

    if (matchingBlackout) {
      if (!matchingBlackout.start_time || !matchingBlackout.end_time) {
        setBlackoutWarning(`Dr. ${doctor.name} is on full-day leave (${matchingBlackout.category}: ${matchingBlackout.note || 'Unavailable'}).`);
      } else {
        setBlackoutWarning(`Partial blackout on this date (${matchingBlackout.category}: ${matchingBlackout.start_time} - ${matchingBlackout.end_time}).`);
      }
    } else {
      setBlackoutWarning('');
    }

    // Generate 30-min time slots
    const generated = generate30MinSlots(doctor.available_from, doctor.available_to);
    setAvailableSlots(generated);
    setSelectedTime('');

    // Fetch booked slots from backend
    let isMounted = true;
    const fetchBooked = async () => {
      try {
        const res = await api.get(`/appointments/booked-slots?doctor_id=${doctorId}&date=${selectedDate}`);
        if (isMounted) {
          setBookedSlots(res.data.booked_slots || []);
        }
      } catch (err) {
        console.error("Failed to fetch booked slots:", err);
      }
    };
    fetchBooked();

    return () => {
      isMounted = false;
    };

  }, [doctor, selectedDate, doctorId, doctorBlackouts]);

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

    // Double check if selected slot is blacked out
    const matchingBlackout = doctorBlackouts.find(b => selectedDate >= b.start_date && selectedDate <= b.end_date);
    if (matchingBlackout && isSlotBlackedOut(selectedTime, matchingBlackout.start_time, matchingBlackout.end_time)) {
      setError('Selected time slot falls within a doctor blackout period.');
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

  // Find matching blackout for slot evaluations
  const activeBlackoutForDate = doctorBlackouts.find(b => selectedDate >= b.start_date && selectedDate <= b.end_date);
  const isFullDayBlackout = activeBlackoutForDate && (!activeBlackoutForDate.start_time || !activeBlackoutForDate.end_time);

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
            {blackoutWarning && (
              <p className="text-xs font-semibold text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200/80 flex items-center space-x-1.5">
                <Ban className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{blackoutWarning}</span>
              </p>
            )}
            {isFullDayBlackout && (
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                No appointment slots available for this date. Please select another date.
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

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600 py-1">
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span>
                <span>Booked</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span>Unavailable / Blackout</span>
              </div>
            </div>

            {availableSlots.length === 0 ? (
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">No slots available for this doctor's schedule.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                {availableSlots.map((slotTime) => {
                  const isBooked = bookedSlots.includes(slotTime);
                  const isBlackedOut = activeBlackoutForDate && isSlotBlackedOut(slotTime, activeBlackoutForDate.start_time, activeBlackoutForDate.end_time);
                  
                  // If booking for today, also disable past slots
                  let isPastSlot = false;
                  if (selectedDate === todayStr) {
                    const [slotH, slotM] = slotTime.split(':').map(Number);
                    const now = new Date();
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();
                    const slotMinutes = slotH * 60 + slotM;
                    if (slotMinutes <= currentMinutes) {
                      isPastSlot = true;
                    }
                  }

                  const isDisabled = isBooked || isBlackedOut || isPastSlot || !!weekdayWarning || isFullDayBlackout;
                  const isSelected = selectedTime === slotTime;

                  return (
                    <button
                      key={slotTime}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setSelectedTime(slotTime)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                        isDisabled
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                          : isSelected
                          ? 'medical-gradient text-white border-teal-600 shadow-sm scale-105'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-500 hover:bg-teal-50'
                      }`}
                      title={isBlackedOut ? 'Blackout period' : isBooked ? 'Already booked' : isPastSlot ? 'Past time slot' : ''}
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
            disabled={submitting || !!weekdayWarning || !selectedTime || isFullDayBlackout}
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