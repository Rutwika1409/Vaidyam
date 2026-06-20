import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  PenTool,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Languages,
} from 'lucide-react';
import SpecialistBadge from '../components/SpecialistBadge';
import toast from 'react-hot-toast';

const langMap = {
  en: 'en-IN',
  te: 'te-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
};

const languagesList = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', label: 'Malayalam (മലയാളം)' },
];

export default function SymptomAnalyzer() {
  const { language: userLang } = useUser();
  const navigate = useNavigate();
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'voice'
  const [symptoms, setSymptoms] = useState('');
  const [selectedLang, setSelectedLang] = useState(userLang || 'en');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('Tap to speak');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const autoSubmitTimerRef = useRef(null);
  const latestSymptomsRef = useRef('');

  // Keep latestSymptomsRef in sync with the state variable
  useEffect(() => {
    latestSymptomsRef.current = symptoms;
  }, [symptoms]);

  useEffect(() => {
    if (userLang) {
      setSelectedLang(userLang);
    }
  }, [userLang]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
      }
    };
  }, []);

  const handleModeChange = (mode) => {
    setInputMode(mode);
    setResult(null);
    setSymptoms('');
    setTranscript('');
    setIsRecording(false);
    latestSymptomsRef.current = '';
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
  };

  // ─── SPEECH RECOGNITION SETUP ───
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Web Speech API is not supported in this browser. Please use Text Input.');
      return;
    }

    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
    }

    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.lang = langMap[selectedLang] || 'en-IN';
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart = () => {
      setIsRecording(true);
      setVoiceStatus('Listening...');
      setTranscript('');
      setSymptoms('');
      latestSymptomsRef.current = '';
    };

    rec.onresult = (event) => {
      let currentResult = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentResult += event.results[i][0].transcript;
      }
      setTranscript(currentResult);
      setSymptoms(currentResult);
      latestSymptomsRef.current = currentResult;
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setVoiceStatus('Speech recognition error. Tap to retry.');
    };

    rec.onend = () => {
      setIsRecording(false);
      setVoiceStatus('Processing your voice...');

      // Auto-submit after 1.5s of speech end
      autoSubmitTimerRef.current = setTimeout(() => {
        setVoiceStatus('Tap to speak');
        triggerAnalysis(latestSymptomsRef.current);
      }, 1500);
    };

    try {
      rec.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
    setIsRecording(false);
  };

  const triggerAnalysis = async (textToAnalyze) => {
    const text = (textToAnalyze || '').trim();
    if (!text || text.length < 3) {
      toast.error('Please describe your symptoms first (at least 3 characters).');
      return;
    }

    setAnalyzing(true);
    setResult(null);
    try {
      const res = await api.post('/api/reports/symptoms/check', {
        symptoms: text,
        language: selectedLang,
      });
      setResult(res.data);
      toast.success('Analysis complete!');
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Failed to analyze symptoms. Please try again.';
      toast.error(detail);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* ─── HERO HEADER ─── */}
      <div className="text-center py-4">
        <h2 className="text-3xl md:text-4xl font-display font-extrabold text-gradient">
          What are you feeling?
        </h2>
        <p className="text-[#8A9BC4] text-sm md:text-base mt-2 max-w-lg mx-auto leading-relaxed">
          Describe your symptoms in your preferred language, and vAIdyam will immediately guide you to the right medical specialist.
        </p>
      </div>

      {/* ─── INPUT MODE TOGGLE ─── */}
      <div className="flex justify-center">
        <div className="flex bg-navy-surface p-1 rounded-xl border border-[#ffffff07] w-full max-w-sm">
          <button
            onClick={() => handleModeChange('text')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
              inputMode === 'text'
                ? 'bg-teal text-black shadow-[0_0_12px_var(--teal-glow)]'
                : 'text-[#8A9BC4] hover:text-[#EEF2FF]'
            }`}
          >
            <PenTool size={14} />
            <span>Text Input</span>
          </button>
          <button
            onClick={() => handleModeChange('voice')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
              inputMode === 'voice'
                ? 'bg-teal text-black shadow-[0_0_12px_var(--teal-glow)]'
                : 'text-[#8A9BC4] hover:text-[#EEF2FF]'
            }`}
          >
            <Mic size={14} />
            <span>Voice Input</span>
          </button>
        </div>
      </div>

      {/* ─── INPUT PANEL ─── */}
      <div className="premium-card p-6 md:p-8 relative">
        {/* Glowing background accent */}
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-teal/5 filter blur-3xl pointer-events-none"></div>

        {inputMode === 'text' ? (
          /* TEXT INPUT MODE */
          <div className="space-y-6">
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe what you are feeling... e.g. I have a sharp pain in my upper abdomen, bloating, and nausea since last night."
              className="w-full min-h-[140px] bg-navy-elevated/40 border border-[#ffffff07] rounded-xl p-4 text-[#EEF2FF] placeholder-[#5A6A8E] text-base focus:outline-none focus:border-teal transition-all resize-none"
            ></textarea>

            {/* Language Chips */}
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-[#8A9BC4] uppercase tracking-wider">
                Language
              </span>
              <div className="flex flex-wrap gap-2">
                {languagesList.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLang(lang.code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedLang === lang.code
                        ? 'bg-teal text-black border-teal shadow-[0_0_8px_var(--teal-glow)]'
                        : 'bg-navy-elevated/20 text-[#8A9BC4] border-[#ffffff07] hover:text-[#EEF2FF] hover:bg-navy-elevated/40'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => triggerAnalysis(symptoms)}
              disabled={analyzing}
              className="w-full teal-btn flex items-center justify-center py-3.5 space-x-2 text-sm"
            >
              {analyzing ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></span>
                  <span>Analyzing Symptoms...</span>
                </>
              ) : (
                <>
                  <span>Analyze Symptoms</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        ) : (
          /* VOICE INPUT MODE */
          <div className="flex flex-col items-center py-6 space-y-6">
            {/* Concentric recording pulse rings */}
            <div className="relative flex items-center justify-center h-32 w-32">
              {isRecording && (
                <>
                  <div className="absolute inset-0 rounded-full bg-teal/10 ring-pulse-1"></div>
                  <div className="absolute inset-0 rounded-full bg-teal/15 ring-pulse-2"></div>
                  <div className="absolute inset-0 rounded-full bg-teal/20 ring-pulse-3"></div>
                </>
              )}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`z-10 h-[88px] w-[88px] rounded-full flex items-center justify-center border-2 transition-all ${
                  isRecording
                    ? 'bg-teal text-black border-teal shadow-[0_0_30px_#00C9A7]'
                    : 'bg-navy-surface text-teal border-teal/40 hover:border-teal'
                }`}
              >
                <Mic size={32} className={isRecording ? 'animate-pulse' : ''} />
              </button>
            </div>

            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-[#EEF2FF]">{voiceStatus}</p>
              <p className="text-xs text-[#8A9BC4]">
                Language: <span className="text-teal font-bold">{languagesList.find(l => l.code === selectedLang)?.label}</span> (Adjust language above if needed)
              </p>
            </div>

            {/* Transcript Preview Box */}
            <div className="w-full max-w-lg bg-navy-elevated/30 border border-[#ffffff05] rounded-xl p-4 min-h-[80px] flex items-center justify-center text-center">
              {transcript || symptoms ? (
                <p className="text-sm text-[#EEF2FF] italic">"{transcript || symptoms}"</p>
              ) : (
                <p className="text-xs text-[#5A6A8E]">Speak now to record symptoms...</p>
              )}
            </div>

            {/* Quick Language Selector (within Voice Tab) */}
            <div className="flex items-center space-x-2 bg-navy-elevated/20 p-1.5 rounded-lg border border-[#ffffff05]">
              <Languages size={14} className="text-[#8A9BC4] ml-1" />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#8A9BC4] outline-none pr-2"
              >
                {languagesList.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ─── RESULTS PANEL (Animated) ─── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Specialist Card */}
            <div className="premium-card p-8 border-l-4 border-teal flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-teal/5 filter blur-3xl pointer-events-none"></div>

              <div className="flex items-center space-x-5">
                <div className="p-4 bg-teal/10 rounded-2xl">
                  <SpecialistBadge specialist={result.specialist} />
                </div>
                <div>
                  <span className="text-xs font-bold text-teal uppercase tracking-widest block mb-1">
                    Recommended Specialist
                  </span>
                  <h3 className="text-2xl md:text-3xl font-display font-extrabold text-gradient leading-none">
                    {result.specialist}
                  </h3>
                  <p className="text-sm text-[#8A9BC4] mt-3 max-w-xl leading-relaxed">
                    {result.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/dashboard/doctors?specialization=${result.specialist}`)}
                className="teal-btn text-xs font-bold flex items-center space-x-2 whitespace-nowrap self-stretch md:self-center justify-center"
              >
                <UserCheck size={14} />
                <span>Find {result.specialist}s</span>
              </button>
            </div>

            {/* Disclaimer & Advisory */}
            <div className="bg-[#FFD166]/5 border border-[#FFD166]/20 rounded-xl p-4 flex items-start space-x-3 text-xs text-[#FFD166]">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase tracking-wide mb-0.5">Disclaimer</span>
                <p className="opacity-90">{result.disclaimer}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
