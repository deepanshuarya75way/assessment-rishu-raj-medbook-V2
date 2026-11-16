import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Bot, X, Send, Sparkles, UserCheck, Calendar, AlertTriangle, ChevronRight, RefreshCw } from 'lucide-react';

const QUICK_CHIPS = [
  "I have a severe headache",
  "I have chest pain & palpitations",
  "I have skin rash and itching",
  "How do I book an appointment?",
  "What can you do?"
];

// Persistent state across route changes in SPA session
let globalMessages = [
  {
    sender: 'ai',
    text: "Hello! I am MedBook AI. Describe your symptoms (e.g., 'I have a headache' or 'I have skin rash') and I will help match you with the right specialist!",
    doctors: [],
    suggestedSpec: null,
    isEmergency: false,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(globalMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage.trim();
    if (!text || isTyping) return;

    const userMsg = {
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    globalMessages = newMsgs;
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await api.post('/assistant/chat', { message: text });
      const aiReply = res.data;

      const aiMsg = {
        sender: 'ai',
        text: aiReply.reply,
        suggestedSpec: aiReply.suggested_specialization,
        doctors: aiReply.doctors || [],
        isEmergency: aiReply.reply.includes("EMERGENCY WARNING"),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const updatedMsgs = [...newMsgs, aiMsg];
      setMessages(updatedMsgs);
      globalMessages = updatedMsgs;
    } catch (err) {
      console.error("Chat assistant error:", err);
      const errorMsg = {
        sender: 'ai',
        text: "Sorry, I am having trouble reaching the assistant server. Please check backend connection.",
        doctors: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...newMsgs, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 border border-teal-500/30"
          title="Open AI Symptom Assistant"
        >
          <div className="w-9 h-9 rounded-full medical-gradient flex items-center justify-center text-white shadow-md">
            <Bot className="w-5 h-5 animate-pulse-subtle" />
          </div>
          <span className="font-semibold text-sm pr-2 hidden sm:inline">AI Health Assistant</span>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-500"></span>
          </span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[540px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Modal Header */}
          <div className="medical-gradient text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base flex items-center space-x-1.5">
                  <span>MedBook AI Assistant</span>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                </h3>
                <p className="text-xs text-teal-100 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                  <span>Rule-Based Symptom Matcher</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl hover:bg-white/20 text-white/90 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 chat-scrollbar bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'medical-gradient text-white rounded-br-none'
                      : msg.isEmergency
                      ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-none font-medium'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
                  }`}
                >
                  {msg.isEmergency && (
                    <div className="flex items-center space-x-1 text-red-600 font-bold mb-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>EMERGENCY ALERT</span>
                    </div>
                  )}
                  
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>

                {/* AI Doctor Recommendations inside chat */}
                {msg.sender === 'ai' && msg.doctors && msg.doctors.length > 0 && (
                  <div className="w-full mt-3 bg-white p-3 rounded-2xl border border-teal-100 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-teal-800 border-b border-teal-50 pb-1.5">
                      <span>Available {msg.suggestedSpec}s:</span>
                      <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">Top Recommendations</span>
                    </div>
                    
                    <div className="space-y-2">
                      {msg.doctors.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <div>
                            <p className="font-bold text-slate-900">{doc.name}</p>
                            <p className="text-[10px] text-slate-500">{doc.experience_years} yrs exp • ₹{doc.fee}</p>
                          </div>
                          <Link
                            to={`/book/${doc.id}`}
                            onClick={() => setIsOpen(false)}
                            className="py-1 px-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center space-x-1 shadow-2xs"
                          >
                            <span>Book Now</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2 bg-white p-3 rounded-2xl border border-slate-200 w-24">
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick-reply chips */}
          <div className="px-3 py-2 bg-slate-100 border-t border-slate-200/60 overflow-x-auto flex space-x-1.5 no-scrollbar">
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                disabled={isTyping}
                className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-teal-50 hover:text-teal-700 border border-slate-200 text-[11px] font-medium text-slate-600 rounded-full transition-colors flex-shrink-0 shadow-2xs"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Describe your symptoms (e.g. chest pain, headache)..."
              disabled={isTyping}
              className="flex-1 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="p-2.5 medical-gradient text-white rounded-xl disabled:opacity-50 hover:opacity-95 shadow-md shadow-teal-500/20 transition-all flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};

export default ChatWidget;
