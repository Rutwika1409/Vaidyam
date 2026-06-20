import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../lib/api';
import {
  Bell,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  UserCheck,
  Stethoscope,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import DoctorAvatar from '../components/DoctorAvatar';
import SpecialistBadge from '../components/SpecialistBadge';
import SkeletonCard from '../components/SkeletonCard';
import toast from 'react-hot-toast';

export default function MyRequests() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [doctorCache, setDoctorCache] = useState({}); // id -> doctorDetails
  const [loading, setLoading] = useState(true);

  const fetchRequestsData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/notifications/user/${user.id}`);
      const list = res.data || [];
      setNotifications(list);

      // Collect unique doctor IDs that need to be resolved
      const docIds = [...new Set(list.map((n) => n.doctor_id).filter(Boolean))];
      
      // Fetch details for any doctor not already in cache
      const fetchPromises = docIds.map(async (id) => {
        if (doctorCache[id]) return;
        try {
          const docRes = await api.get(`/api/doctors/${id}`);
          return { id, data: docRes.data };
        } catch {
          return { id, data: { full_name: 'Unknown Doctor', specialization: 'Specialist' } };
        }
      });

      const resolved = await Promise.all(fetchPromises);
      const newCache = { ...doctorCache };
      resolved.forEach((item) => {
        if (item) {
          newCache[item.id] = item.data;
        }
      });
      setDoctorCache(newCache);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load consultation history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestsData();
  }, [user]);

  const deleteRequest = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this consultation request record?')) return;
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      toast.success('Request deleted.');
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete request record.');
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard type="list" />
        <SkeletonCard type="list" />
        <SkeletonCard type="list" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-[#ffffff05] pb-4">
        <div>
          <h2 className="text-xl font-bold font-display text-[#EEF2FF]">
            Consultation Request Queue
          </h2>
          <p className="text-xs text-[#8A9BC4] mt-1">
            Track external consultation request dispatches sent from your account.
          </p>
        </div>

        <button
          onClick={fetchRequestsData}
          className="p-2 bg-navy-elevated border border-[#ffffff07] hover:border-teal rounded-lg transition-all text-[#8A9BC4] hover:text-[#EEF2FF]"
          title="Refresh Queue"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="premium-card p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="p-4 bg-teal/5 rounded-full text-teal/40 mb-4 animate-pulse">
            <Stethoscope size={36} />
          </div>
          <h4 className="font-semibold text-sm text-[#EEF2FF]">No consultation requests yet</h4>
          <p className="text-xs text-[#8A9BC4] mt-1 max-w-xs mb-6">
            Search for local specialists and share clinical summaries directly from the find doctors board.
          </p>
          <button
            onClick={() => navigate('/dashboard/doctors')}
            className="teal-btn text-xs py-2.5 px-6 flex items-center space-x-2"
          >
            <span>Find a Doctor</span>
            <ChevronRight size={14} />
          </button>
        </div>
      ) : (
        /* Requests Timeline Log */
        <div className="relative border-l border-[#ffffff05] ml-4 md:ml-6 pl-6 space-y-6">
          {notifications.map((notif) => {
            const doctor = doctorCache[notif.doctor_id] || {
              full_name: 'Loading profile...',
              specialization: 'Specialist',
            };

            return (
              <div key={notif.id} className="relative group">
                {/* Timeline dot marker */}
                <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full bg-navy-surface border-2 border-teal group-hover:bg-teal transition-all duration-300"></div>

                <div className="premium-card p-5 hover:border-[#ffffff10] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <DoctorAvatar name={doctor.full_name} size="md" />

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-[#EEF2FF] truncate">
                          {doctor.full_name}
                        </h4>
                        <SpecialistBadge specialist={doctor.specialization} />
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-[#8A9BC4]">
                        <UserCheck size={14} className="text-[#5A6A8E]" />
                        <span>Consultation Request Dispatch</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        {/* Email status tag */}
                        {notif.email_sent ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={10} />
                            <span>Email sent ✓</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock size={10} />
                            <span>Email pending</span>
                          </span>
                        )}

                        {/* Report sharing indicator tag */}
                        {notif.report_id && (
                          <span
                            onClick={() => navigate(`/dashboard/reports/${notif.report_id}`)}
                            className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-all"
                          >
                            <FileText size={10} />
                            <span>Report Shared</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end space-x-4 pt-3 md:pt-0 border-t md:border-t-0 border-[#ffffff04]">
                    <div className="text-right">
                      <span className="block text-[10px] text-[#5A6A8E]">Request Date</span>
                      <span className="text-xs text-[#8A9BC4] font-medium">
                        {formatDate(notif.created_at)}
                      </span>
                    </div>

                    <button
                      onClick={() => deleteRequest(notif.id)}
                      className="p-2 text-[#8A9BC4] hover:text-[#FF5C5C] hover:bg-red-500/10 rounded-lg transition-all"
                      title="Delete Record"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
