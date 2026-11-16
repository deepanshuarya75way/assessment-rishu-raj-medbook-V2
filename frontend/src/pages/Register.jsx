import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, User, Mail, Phone, Lock, Award, IndianRupee, Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

const SPECIALIZATIONS = [
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Orthopedic",
  "Pediatrician",
  "Gynecologist",
  "ENT Specialist",
  "General Physician",
  "Psychiatrist"
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Doctor-specific state
  const [specialization, setSpecialization] = useState(SPECIALIZATIONS[0]);
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [fee, setFee] = useState('');
  const [selectedDays, setSelectedDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [availableFrom, setAvailableFrom] = useState("09:00");
  const [availableTo, setAvailableTo] = useState("17:00");
  const [bio, setBio] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDayToggle = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (role === 'doctor') {
      if (!qualification.trim()) {
        setError('Qualification is required for doctors.');
        return;
      }
      if (!experienceYears || intValue(experienceYears) < 0) {
        setError('Valid experience in years is required.');
        return;
      }
      if (!fee || floatValue(fee) < 0) {
        setError('Valid consultation fee is required.');
        return;
      }
      if (selectedDays.length === 0) {
        setError('Please select at least one available working day.');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
        ...(role === 'doctor' && {
          specialization,
          qualification: qualification.trim(),
          experience_years: parseInt(experienceYears, 10),
          fee: parseFloat(fee),
          available_days: selectedDays.join(','),
          available_from: availableFrom,
          available_to: availableTo,
          bio: bio.trim()
        })
      };

      const data = await register(payload);
      if (role === 'doctor') {
        navigate('/dashboard');
      } else {
        navigate('/doctors');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const intValue = (val) => parseInt(val, 10);
  const floatValue = (val) => parseFloat(val);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6 glass-panel p-8 rounded-3xl shadow-xl border border-slate-200">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl medical-gradient mx-auto flex items-center justify-center text-white shadow-md">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create MedBook Account</h2>
          <p className="text-xs text-slate-500">Select your account type and fill in your details</p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setRole('patient')}
            className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              role === 'patient'
                ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            I am a Patient
          </button>
          <button
            type="button"
            onClick={() => setRole('doctor')}
            className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              role === 'doctor'
                ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            I am a Doctor
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Common Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'doctor' ? 'Dr. John Doe' : 'John Doe'}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password (min 6 chars) *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Doctor Specific Fields */}
          {role === 'doctor' && (
            <div className="space-y-4 pt-3 border-t border-slate-200">
              <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider">Doctor Professional Profile</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization *</label>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
                  >
                    {SPECIALIZATIONS.map((spec, i) => (
                      <option key={i} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification *</label>
                  <div className="relative">
                    <Award className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. MBBS, MD (Cardiology)"
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Experience (Years) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Fee (₹ INR) *</label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      required
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Working Days Checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Available Working Days *</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Working Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Available From *</label>
                  <input
                    type="time"
                    required
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Available To *</label>
                  <input
                    type="time"
                    required
                    value={availableTo}
                    onChange={(e) => setAvailableTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Short Professional Bio</label>
                <textarea
                  rows="2"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your medical practice experience..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
                />
              </div>

            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-xs sm:text-sm font-bold text-white medical-gradient rounded-xl hover:opacity-95 shadow-md shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-6"
          >
            {loading ? <span>Creating Account...</span> : <span>Register as {role === 'doctor' ? 'Doctor' : 'Patient'}</span>}
          </button>
        </form>

        <div className="text-center text-xs text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-teal-700 hover:text-teal-800 underline">
            Log in here
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
