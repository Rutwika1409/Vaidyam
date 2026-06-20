import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../lib/api';
import {
  FileText,
  UserCheck,
  Calendar,
  ArrowRight,
  PlusCircle,
  FileUp,
  Stethoscope,
  Bell,
  AlertOctagon,
  FileImage,
} from 'lucide-react';
import EmergencyBadge from '../components/EmergencyBadge';
import SkeletonCard from '../components/SkeletonCard';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ reportsCount: 0, doctorsCount: 0 });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emergencyReport, setEmergencyReport] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Get reports
        const reportsRes = await api.get(`/api/reports/user/${user.id}?limit=20`);
        const fetchedReports = reportsRes.data.reports || [];
        setReports(fetchedReports);
        setStats(prev => ({ ...prev, reportsCount: reportsRes.data.total || fetchedReports.length }));

        // Check for emergency alerts in the last 20 reports
        const emergency = fetchedReports.find(r => r.ai_summary && r.ai_summary.includes('🚨 EMERGENCY ALERT'));
        if (emergency) {
          setEmergencyReport(emergency);
        }

        // 2. Get doctors notifications count
        const notifRes = await api.get(`/api/notifications/user/${user.id}`);
        setStats(prev => ({ ...prev, doctorsCount: notifRes.data.length || 0 }));
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
        // Show silent error to keep clean UI
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const truncateString = (str, num = 30) => {
    if (!str) return '';
    if (str.length <= num) return str;
    return str.slice(0, num) + '...';
  };

  const getStatusBadge = (aiSummary) => {
    if (!aiSummary || aiSummary.includes('Processing…')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Analyzing...
        </span>
      );
    }
    if (aiSummary.includes('🚨 EMERGENCY ALERT')) {
      return <EmergencyBadge />;
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        Ready
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard type="stat" />
          <SkeletonCard type="stat" />
          <SkeletonCard type="stat" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <SkeletonCard type="list" />
            <SkeletonCard type="list" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <SkeletonCard type="list" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── EMERGENCY BANNER ─── */}
      {emergencyReport && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-start md:items-center space-x-3">
            <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-red-200 text-sm md:text-base">
                Critical Health Alert Detected
              </h3>
              <p className="text-red-400/80 text-xs md:text-sm mt-0.5">
                Emergency values found in report:{' '}
                <span className="font-semibold text-red-200">
                  {truncateString(emergencyReport.file_name, 25)}
                </span>{' '}
                · {formatDate(emergencyReport.uploaded_at)}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/dashboard/reports/${emergencyReport.id}`)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            <span>View Analysis</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ─── STAT CARDS GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Reports */}
        <div className="premium-card p-6 flex flex-col justify-between relative overflow-hidden group hover:border-teal/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8A9BC4]">
              Total Reports
            </span>
            <div className="p-2.5 bg-teal/10 rounded-full text-teal">
              <FileText size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-display font-extrabold text-gradient">
              {stats.reportsCount}
            </h4>
            <p className="text-xs text-[#5A6A8E] mt-1">Uploaded medical records</p>
          </div>
          {/* Subtle static bottom SVG sparkline */}
          <div className="absolute bottom-0 left-0 right-0 h-8 opacity-20 pointer-events-none">
            <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible">
              <path d="M0,15 Q15,5 30,12 T60,5 T90,15 L100,10" fill="none" stroke="var(--teal)" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 2: Doctors Contacted */}
        <div className="premium-card p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[#4F8EF7]/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8A9BC4]">
              Consultations Sent
            </span>
            <div className="p-2.5 bg-[#4F8EF7]/10 rounded-full text-[#4F8EF7]">
              <UserCheck size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-display font-extrabold text-gradient">
              {stats.doctorsCount}
            </h4>
            <p className="text-xs text-[#5A6A8E] mt-1">Doctor connections requested</p>
          </div>
          {/* Sparkline for Card 2 */}
          <div className="absolute bottom-0 left-0 right-0 h-8 opacity-20 pointer-events-none">
            <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible">
              <path d="M0,10 Q20,18 40,5 T80,15 L100,5" fill="none" stroke="var(--blue-soft)" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 3: Member Since */}
        <div className="premium-card p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[#FFD166]/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8A9BC4]">
              Member Since
            </span>
            <div className="p-2.5 bg-[#FFD166]/10 rounded-full text-[#FFD166]">
              <Calendar size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-xl font-display font-extrabold text-[#EEF2FF] truncate">
              {formatDate(user?.created_at)}
            </h4>
            <p className="text-xs text-[#5A6A8E] mt-2">vAIdyam account active</p>
          </div>
        </div>
      </div>

      {/* ─── MIDDLE ROW: 2 COLUMN SPLIT ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Recent Reports (60%) */}
        <div className="lg:col-span-3 premium-card p-6 flex flex-col min-h-[380px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-lg text-[#EEF2FF]">
              Recent Health Reports
            </h3>
            {reports.length > 0 && (
              <button
                onClick={() => navigate('/dashboard/reports')}
                className="text-xs text-teal hover:underline flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          {reports.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#ffffff05] rounded-xl text-center">
              <div className="p-4 bg-teal/5 rounded-full text-teal/40 mb-4">
                <FileUp size={36} />
              </div>
              <h4 className="font-semibold text-sm text-[#EEF2FF]">No health reports uploaded</h4>
              <p className="text-xs text-[#8A9BC4] mt-1 max-w-xs mb-6">
                Upload blood panels, prescriptions, or clinical notes for diagnostic OCR indexing.
              </p>
              <button
                onClick={() => navigate('/dashboard/reports')}
                className="teal-btn text-xs py-2.5 px-6 flex items-center space-x-2"
              >
                <PlusCircle size={14} />
                <span>Upload First Report</span>
              </button>
            </div>
          ) : (
            <div className="flex-grow space-y-3">
              {reports.slice(0, 5).map((report) => {
                const isPdf = report.report_type?.includes('pdf') || report.file_name?.endsWith('.pdf');
                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3.5 bg-navy-elevated/40 border border-[#ffffff04] rounded-xl hover:bg-navy-elevated/80 transition-all"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className={`p-2 rounded-lg ${isPdf ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {isPdf ? <FileText size={18} /> : <FileImage size={18} />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold truncate text-[#EEF2FF] max-w-[180px] md:max-w-[280px]">
                          {report.file_name}
                        </h4>
                        <p className="text-[11px] text-[#8A9BC4] mt-0.5">
                          {formatDate(report.uploaded_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {getStatusBadge(report.ai_summary)}
                      <button
                        onClick={() => navigate(`/dashboard/reports/${report.id}`)}
                        className="px-3 py-1.5 bg-[#ffffff03] hover:bg-teal hover:text-black border border-[#ffffff07] hover:border-teal rounded-lg text-xs font-semibold text-[#EEF2FF] transition-all"
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions (40%) */}
        <div className="lg:col-span-2 premium-card p-6 flex flex-col justify-between">
          <h3 className="font-display font-bold text-lg text-[#EEF2FF] mb-6">
            Quick Actions
          </h3>

          <div className="grid grid-cols-2 gap-4 flex-grow">
            {/* Action 1 */}
            <button
              onClick={() => navigate('/dashboard/symptoms')}
              className="premium-card p-5 bg-navy-elevated/30 hover:bg-teal/5 border border-[#ffffff04] hover:border-teal/20 rounded-xl flex flex-col items-center justify-center text-center transition-all group"
            >
              <div className="p-3 bg-teal/10 rounded-xl text-teal group-hover:scale-110 transition-transform">
                <Stethoscope size={24} />
              </div>
              <span className="mt-3 text-xs font-bold text-[#EEF2FF]">Analyze Symptoms</span>
              <span className="text-[10px] text-[#8A9BC4] mt-1">Multi-lingual voice bot</span>
            </button>

            {/* Action 2 */}
            <button
              onClick={() => navigate('/dashboard/reports')}
              className="premium-card p-5 bg-navy-elevated/30 hover:bg-teal/5 border border-[#ffffff04] hover:border-teal/20 rounded-xl flex flex-col items-center justify-center text-center transition-all group"
            >
              <div className="p-3 bg-teal/10 rounded-xl text-teal group-hover:scale-110 transition-transform">
                <FileUp size={24} />
              </div>
              <span className="mt-3 text-xs font-bold text-[#EEF2FF]">Upload Report</span>
              <span className="text-[10px] text-[#8A9BC4] mt-1">Scan clinical PDFs</span>
            </button>

            {/* Action 3 */}
            <button
              onClick={() => navigate('/dashboard/doctors')}
              className="premium-card p-5 bg-navy-elevated/30 hover:bg-[#4F8EF7]/5 border border-[#ffffff04] hover:border-[#4F8EF7]/20 rounded-xl flex flex-col items-center justify-center text-center transition-all group"
            >
              <div className="p-3 bg-[#4F8EF7]/10 rounded-xl text-[#4F8EF7] group-hover:scale-110 transition-transform">
                <UserCheck size={24} />
              </div>
              <span className="mt-3 text-xs font-bold text-[#EEF2FF]">Find Doctors</span>
              <span className="text-[10px] text-[#8A9BC4] mt-1">Search nearby clinics</span>
            </button>

            {/* Action 4 */}
            <button
              onClick={() => navigate('/dashboard/requests')}
              className="premium-card p-5 bg-navy-elevated/30 hover:bg-[#FFD166]/5 border border-[#ffffff04] hover:border-[#FFD166]/20 rounded-xl flex flex-col items-center justify-center text-center transition-all group"
            >
              <div className="p-3 bg-[#FFD166]/10 rounded-xl text-[#FFD166] group-hover:scale-110 transition-transform">
                <Bell size={24} />
              </div>
              <span className="mt-3 text-xs font-bold text-[#EEF2FF]">My Requests</span>
              <span className="text-[10px] text-[#8A9BC4] mt-1">Check request queue</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
