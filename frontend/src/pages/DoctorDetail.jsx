import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { UserCheck, Award, Calendar, Clock, IndianRupee, Phone, Mail, FileText, ArrowRight, ArrowLeft } from 'lucide-react';

const DoctorDetail = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await api.get(`/doctors/${id}`);
        setDoctor(res.data);
      } catch (err) {
        setError('Doctor profile not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="h-72 bg-slate-200/50 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Doctor Not Found</h3>
        <p className="text-xs text-slate-500">The requested doctor profile does not exist.</p>
        <Link to="/doctors" className="inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Doctors</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Back Button */}
      <Link to="/doctors" className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Doctors Directory</span>
      </Link>

      {/* Main Profile Card */}
      <div className="glass-panel rounded-3xl p-8 border border-slate-200 shadow-xl space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-md">
              <UserCheck className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{doctor.name}</h1>
              <span className="inline-block mt-1.5 px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg border border-teal-200/80">
                {doctor.specialization}
              </span>
              <p className="text-xs text-slate-500 mt-1 font-medium">{doctor.qualification}</p>
            </div>
          </div>

          <Link
            to={`/book/${doctor.id}`}
            className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-teal-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <span>Book Appointment</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Doctor Specifications Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Award className="w-3.5 h-3.5 text-teal-600" />
              <span>Experience</span>
            </span>
            <p className="font-bold text-slate-900 text-base">{doctor.experience_years} Years</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <IndianRupee className="w-3.5 h-3.5 text-teal-600" />
              <span>Consultation Fee</span>
            </span>
            <p className="font-bold text-slate-900 text-base">₹{doctor.fee}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>Working Days</span>
            </span>
            <p className="font-bold text-teal-800 text-xs sm:text-sm truncate">{doctor.available_days}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>Working Hours</span>
            </span>
            <p className="font-bold text-slate-800 text-xs sm:text-sm">{doctor.available_from} - {doctor.available_to}</p>
          </div>
        </div>

        {/* Biography & Contact Info */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>Doctor Bio & Overview</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
            {doctor.bio || "No specific bio information provided for this medical practitioner."}
          </p>
        </div>

      </div>
    </div>
  );
};

export default DoctorDetail;
