import React from 'react';

const SPECIALIST_MAP = {
  'General Physician':    { emoji: '👨‍⚕️', style: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  'Cardiologist':         { emoji: '❤️',  style: 'bg-red-500/10 text-red-400 border-red-500/20' },
  'Dermatologist':        { emoji: '🌿',  style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  'Ophthalmologist':      { emoji: '👁️',  style: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'ENT Specialist':       { emoji: '👂',  style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  'Orthopedic':           { emoji: '🦴',  style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  'Gastroenterologist':   { emoji: '🩺',  style: 'bg-emerald-600/10 text-emerald-500/20 border-emerald-600/20' },
  'Dentist':              { emoji: '🦷',  style: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  'Gynecologist':         { emoji: '🤰',  style: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  'Psychiatrist':         { emoji: '🧠',  style: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  'Neurologist':          { emoji: '⚡',  style: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  'Urologist':            { emoji: '💧',  style: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  'Endocrinologist':      { emoji: '🧪',  style: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  'Pulmonologist':        { emoji: '🫁',  style: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  'Oncologist':           { emoji: '🎗️',  style: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
};

export default function SpecialistBadge({ specialist }) {
  const norm = Object.keys(SPECIALIST_MAP).find(
    k => k.toLowerCase() === (specialist || '').trim().toLowerCase()
  ) || 'General Physician';

  const { emoji, style } = SPECIALIST_MAP[norm];

  return (
    <span className={`inline-flex items-center space-x-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}>
      <span>{emoji}</span>
      <span>{norm}</span>
    </span>
  );
}
export { SPECIALIST_MAP };
