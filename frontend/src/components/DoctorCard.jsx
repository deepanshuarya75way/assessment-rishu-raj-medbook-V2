import React from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Award, Calendar, Clock, IndianRupee, ArrowRight } from 'lucide-react';

const DoctorCard = ({ doctor, onBookClick }) => {
  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-200/80 flex flex-col justify-between h-full relative overflow-hidden group">
      {/* Decorative accent top bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 medical-gradient opacity-80 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Header: Avatar & Main Info */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <UserCheck className="w-7 h-7" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
              {doctor.name}
            </h3>
            <span className="inline-block px-2.5 py-0.5 mt-1 text-xs font-semibold rounded-md bg-teal-50 text-teal-700 border border-teal-200/60">
              {doctor.specialization}
            </span>
            <p className="text-xs text-slate-500 mt-1 truncate" title={doctor.qualification}>
              {doctor.qualification}
            </p>
          </div>
        </div>

        {/* Doctor Stats & Details */}
        <div className="space-y-2.5 text-xs text-slate-600 mb-6 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-500">
              <Award className="w-3.5 h-3.5 text-teal-600" />
              <span>Experience:</span>
            </span>
            <span className="font-semibold text-slate-800">{doctor.experience_years} years</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-500">
              <IndianRupee className="w-3.5 h-3.5 text-teal-600" />
              <span>Consultation Fee:</span>
            </span>
            <span className="font-bold text-slate-900 text-sm">₹{doctor.fee}</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
            <span className="flex items-center space-x-1.5 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>Days:</span>
            </span>
            <span className="font-medium text-teal-800 truncate max-w-[150px]">{doctor.available_days}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>Hours:</span>
            </span>
            <span className="font-medium text-slate-700">{doctor.available_from} - {doctor.available_to}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to={`/doctors/${doctor.id}`}
          className="w-full py-2.5 px-3 text-center text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          View Profile
        </Link>

        {onBookClick ? (
          <button
            onClick={() => onBookClick(doctor)}
            className="w-full py-2.5 px-3 text-center text-xs font-semibold rounded-xl text-white medical-gradient hover:opacity-95 shadow-xs transition-all flex items-center justify-center space-x-1"
          >
            <span>Book Now</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        ) : (
          <Link
            to={`/book/${doctor.id}`}
            className="w-full py-2.5 px-3 text-center text-xs font-semibold rounded-xl text-white medical-gradient hover:opacity-95 shadow-xs transition-all flex items-center justify-center space-x-1"
          >
            <span>Book Now</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default DoctorCard;
