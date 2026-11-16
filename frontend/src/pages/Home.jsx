import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import DoctorCard from '../components/DoctorCard';
import { 
  Stethoscope, Bot, CalendarCheck, Shield, Sparkles, ArrowRight, HeartPulse, 
  Activity, UserCheck, Heart, Baby, Ear, Smile, MessageSquare, CornerDownRight, Brain, Bone
} from 'lucide-react';

const SPECIALIZATION_CARDS = [
  { name: "Cardiologist", icon: <Heart className="w-6 h-6 text-red-500" />, desc: "Heart, blood pressure & arrhythmia care" },
  { name: "Dermatologist", icon: <Sparkles className="w-6 h-6 text-amber-500" />, desc: "Skin, acne, hair fall & allergy treatments" },
  { name: "Neurologist", icon: <Brain className="w-6 h-6 text-purple-500" />, desc: "Brain, migraine, nerve & seizure specialists" },
  { name: "Orthopedic", icon: <Bone className="w-6 h-6 text-amber-700" />, desc: "Bone, joint, back pain & fracture care" },
  { name: "Pediatrician", icon: <Baby className="w-6 h-6 text-sky-500" />, desc: "Child wellness, growth & vaccinations" },
  { name: "Gynecologist", icon: <HeartPulse className="w-6 h-6 text-rose-500" />, desc: "Women's health, pregnancy & PCOS management" },
  { name: "ENT Specialist", icon: <Ear className="w-6 h-6 text-teal-600" />, desc: "Ear, nose, sinus & throat treatments" },
  { name: "General Physician", icon: <Stethoscope className="w-6 h-6 text-indigo-500" />, desc: "Primary care, fever, flu & body checkups" },
  { name: "Psychiatrist", icon: <Smile className="w-6 h-6 text-emerald-500" />, desc: "Mental health, stress & anxiety support" }
];

const Home = () => {
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/doctors');
        setFeaturedDoctors(res.data.slice(0, 3));
      } catch (err) {
        console.error("Failed to load featured doctors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold shadow-2xs">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>AI-Powered Doctor Booking Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Instant Doctor Appointments with <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">AI Guidance</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Describe your symptoms to our rule-based AI assistant, get instant specialist recommendations, and book verified doctors in seconds.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                <Link
                  to="/doctors"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-white font-bold medical-gradient hover:opacity-95 shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Find & Book Doctors</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/register"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-slate-700 font-semibold bg-white hover:bg-slate-100 border border-slate-200 shadow-xs transition-all text-center"
                >
                  Join as Doctor
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/60 max-w-md mx-auto lg:mx-0">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-teal-600" />
                  <span className="text-xs font-semibold text-slate-700">Verified Doctors</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-teal-600" />
                  <span className="text-xs font-semibold text-slate-700">AI Symptom Triage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-teal-600" />
                  <span className="text-xs font-semibold text-slate-700">Instant Booking</span>
                </div>
              </div>
            </div>

            {/* Hero Card Graphic */}
            <div className="relative flex justify-center">
              <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-slate-200/80 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl medical-gradient flex items-center justify-center text-white">
                      <HeartPulse className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Smart Health Triage</h4>
                      <p className="text-xs text-slate-500">Live AI Matcher Active</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-full">
                    24/7 Available
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-700">
                    <p className="font-semibold text-teal-800 mb-1 flex items-center space-x-1">
                      <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                      <span>Patient Query:</span>
                    </p>
                    <p className="italic text-slate-600">"I have chest tightness and mild shortness of breath..."</p>
                  </div>

                  <div className="bg-teal-50/80 p-3.5 rounded-2xl border border-teal-100 text-xs text-teal-900 space-y-1">
                    <p className="font-bold text-teal-900 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>Recommended: Cardiologist</span>
                    </p>
                    <p className="text-[11px] text-teal-800">Matching top specialists with immediate consultation slots.</p>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-xs font-medium text-slate-500 flex items-center justify-center space-x-1">
                    <span>Try asking our AI Assistant using the floating bot icon!</span>
                    <CornerDownRight className="w-3.5 h-3.5 text-teal-600" />
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900">How MedBook Works</h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Book your doctor appointment in 3 simple steps without long wait times or phone calls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-6 rounded-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xl shadow-xs">
              <Bot className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">1. AI Symptom Check</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Describe how you feel to the MedBook assistant to get matched with the correct medical specialization.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-xl shadow-xs">
              <UserCheck className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">2. Select Your Doctor</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Browse qualified doctors, check their experience, consultation fees, and available working hours.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl shadow-xs">
              <CalendarCheck className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">3. Confirm Booking</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Select your preferred date & time slot. Receive real-time appointment updates from your doctor.
            </p>
          </div>
        </div>
      </section>

      {/* Specializations Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900">Explore Specializations</h2>
          <p className="text-slate-600 text-sm">
            Find doctors across top medical departments and specialties.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SPECIALIZATION_CARDS.map((spec, idx) => (
            <Link
              key={idx}
              to={`/doctors?specialization=${encodeURIComponent(spec.name)}`}
              className="glass-card p-5 rounded-2xl border border-slate-200/80 flex items-start space-x-4 hover:border-teal-500/50 group"
            >
              <div className="p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform flex items-center justify-center">
                {spec.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors text-base">
                  {spec.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{spec.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Doctors Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">Featured Specialists</h2>
            <p className="text-slate-600 text-sm mt-1">Book consultations with top rated doctors</p>
          </div>
          <Link
            to="/doctors"
            className="text-sm font-semibold text-teal-700 hover:text-teal-800 flex items-center space-x-1"
          >
            <span>View All Doctors</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 bg-slate-200/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredDoctors.map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default Home;
