import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import api from '../lib/api';
import {
  User,
  Languages,
  Trash2,
  Info,
  Check,
  Activity,
  AlertOctagon,
} from 'lucide-react';
import toast from 'react-hot-toast';

const languagesList = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
];

export default function Settings() {
  const { user, setUser, language, setLanguage } = useUser();
  const navigate = useNavigate();

  // Profile Form States
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Modal deletion triggers
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error('Name must be at least 2 characters.');
      return;
    }

    setUpdatingProfile(true);
    try {
      const res = await api.put(`/api/users/${user.id}`, {
        full_name: fullName.trim(),
        language: language,
      });

      setUser({
        ...user,
        full_name: res.data.full_name,
        language: res.data.language,
      });

      toast.success('Profile updated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleLanguageSelect = async (code) => {
    try {
      await setLanguage(code);
      toast.success('Language preference updated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update language.');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      // 1. Delete user from backend Supabase mapping
      await api.delete(`/api/users/${user.id}`);
      
      // 2. Clear Auth sessions
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Signout/delete log error:', err);
    } finally {
      // Clear localStorage and redirect regardless
      localStorage.clear();
      setUser(null);
      toast.success('Your vAIdyam account has been deleted.');
      navigate('/auth');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* ─── 1. PROFILE SECTION ─── */}
      <div className="premium-card p-6 md:p-8 space-y-5">
        <h3 className="font-display font-bold text-lg text-[#EEF2FF] flex items-center space-x-2 border-b border-[#ffffff05] pb-4">
          <User className="text-teal" size={20} />
          <span>Profile Information</span>
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8A9BC4] uppercase tracking-wider mb-2">
              Email Address (Read Only)
            </label>
            <input
              type="text"
              readOnly
              value={user?.email || ''}
              className="w-full bg-navy border border-[#ffffff03] rounded-lg px-4 py-2.5 text-sm text-[#5A6A8E] outline-none cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8A9BC4] uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-navy border border-[#ffffff07] rounded-lg px-4 py-2.5 text-sm text-[#EEF2FF] focus:outline-none focus:border-teal transition-all"
              placeholder="Enter your name"
            />
          </div>

          <button
            type="submit"
            disabled={updatingProfile}
            className="teal-btn text-xs py-2.5 px-6 flex items-center justify-center space-x-2"
          >
            {updatingProfile ? (
              <>
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-black border-t-transparent"></span>
                <span>Saving...</span>
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>

      {/* ─── 2. LANGUAGE PREFERENCE GRID ─── */}
      <div className="premium-card p-6 md:p-8 space-y-5">
        <h3 className="font-display font-bold text-lg text-[#EEF2FF] flex items-center space-x-2 border-b border-[#ffffff05] pb-4">
          <Languages className="text-teal" size={20} />
          <span>Language Preference</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {languagesList.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <div
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`premium-card p-4 flex items-center justify-between cursor-pointer border transition-all ${
                  isSelected
                    ? 'border-teal bg-teal/5 shadow-[0_0_12px_var(--teal-glow)]'
                    : 'border-[#ffffff04] bg-navy-elevated/20 hover:bg-navy-elevated/40'
                }`}
              >
                <div>
                  <h4 className="text-sm font-semibold text-[#EEF2FF]">{lang.name}</h4>
                  <span className="text-[10px] text-[#8A9BC4]">{lang.native}</span>
                </div>
                {isSelected && (
                  <div className="h-5 w-5 bg-teal text-black rounded-full flex items-center justify-center">
                    <Check size={12} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 3. ACCOUNT ACTIONS ─── */}
      <div className="premium-card p-6 md:p-8 border-l-4 border-red-500/80 space-y-4">
        <h3 className="font-display font-bold text-lg text-[#EEF2FF] flex items-center space-x-2 border-b border-[#ffffff05] pb-4">
          <Trash2 className="text-red-400" size={20} />
          <span>Account Controls</span>
        </h3>

        <p className="text-xs text-[#8A9BC4] leading-relaxed max-w-xl">
          Deleting your account will erase your profile information, historical medical OCR scan logs, and pending consultation requests permanently. This action is irreversible.
        </p>

        <button
          onClick={() => setDeleteModalOpen(true)}
          className="px-5 py-2.5 bg-transparent border border-red-500/40 hover:bg-red-500/10 text-red-400 text-xs font-bold rounded-lg transition-all"
        >
          Delete Account
        </button>
      </div>

      {/* ─── 4. ABOUT SECTION ─── */}
      <div className="premium-card p-6 md:p-8 bg-navy-elevated/10 border border-[#ffffff03] flex items-start space-x-4">
        <div className="p-2.5 bg-[#4F8EF7]/10 rounded-xl text-[#4F8EF7]">
          <Info size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="font-display font-bold text-[#EEF2FF] text-sm flex items-center space-x-2">
            <span>vAIdyam Healthcare Platform</span>
            <span className="text-[10px] bg-teal/10 text-teal px-2 py-0.5 rounded-full font-bold">
              v2.0
            </span>
          </h4>
          <p className="text-xs text-[#8A9BC4] leading-relaxed">
            FastAPI REST Server + Supabase Database + Groq Llama-3 AI Engine. Built for multilingual, high-fidelity healthcare diagnostics, OCR reading, and doctor consultation dispatching.
          </p>
        </div>
      </div>

      {/* ─── CONFIRM DELETE MODAL ─── */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="premium-card bg-navy-elevated p-6 w-full max-w-md border border-[#ffffff0a] shadow-2xl relative space-y-6">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertOctagon className="h-6 w-6" />
              <h3 className="text-base font-bold font-display">Confirm Account Deletion</h3>
            </div>

            <p className="text-xs text-[#8A9BC4] leading-relaxed">
              Are you absolutely sure you want to delete your vAIdyam account? All of your clinical files, AI summaries, and scheduled consultation requests will be removed from our database.
            </p>

            <div className="flex space-x-3">
              <button
                disabled={deleteLoading}
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2.5 bg-navy border border-[#ffffff07] text-[#8A9BC4] rounded-lg text-xs font-bold hover:text-[#EEF2FF] transition-all"
              >
                Cancel
              </button>
              <button
                disabled={deleteLoading}
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
