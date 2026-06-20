import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useUser } from '../context/UserContext';
import api from '../lib/api';
import {
  CloudUpload,
  FileText,
  FileImage,
  X,
  Sparkles,
  FileUp,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  Send,
  Trash2,
  ListFilter,
  Eye,
  RefreshCw,
  ArrowRight,
  Activity,
  ClipboardList,
  ShieldAlert,
  Apple,
} from 'lucide-react';
import SpecialistBadge from '../components/SpecialistBadge';
import EmergencyBadge from '../components/EmergencyBadge';
import DoctorAvatar from '../components/DoctorAvatar';
import toast from 'react-hot-toast';

const parseAiSummary = (aiSummary) => {
  if (!aiSummary) return null;

  const sections = {
    summary: '',
    findings: '',
    precautions: '',
    foods: '',
    emergency: ''
  };

  const lines = aiSummary.split('\n');
  let currentSection = 'summary';

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;

    // Detect section headers
    if (cleanLine.match(/^(###|\*\*|)?\s*1\.\s*(Summary|overall)/i)) {
      currentSection = 'summary';
      continue;
    }
    if (cleanLine.match(/^(###|\*\*|)?\s*2\.\s*(Findings|Parameters)/i)) {
      currentSection = 'findings';
      continue;
    }
    if (cleanLine.match(/^(###|\*\*|)?\s*3\.\s*(General\s+)?Precautions/i)) {
      currentSection = 'precautions';
      continue;
    }
    if (cleanLine.match(/^(###|\*\*|)?\s*4\.\s*(Foods|Diet|Nutrition)/i)) {
      currentSection = 'foods';
      continue;
    }
    if (cleanLine.match(/^(###|\*\*|)?\s*5\.\s*(Emergency|Warning)/i)) {
      currentSection = 'emergency';
      continue;
    }

    if (sections[currentSection]) {
      sections[currentSection] += '\n' + line;
    } else {
      sections[currentSection] = line;
    }
  }

  for (const key in sections) {
    sections[key] = sections[key].trim();
  }

  return sections;
};

export default function ReportAnalysis() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { id: routeReportId } = useParams();
  const [searchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'myreports'
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pollingReportId, setPollingReportId] = useState(null);
  const [pollingProgress, setPollingProgress] = useState(0);
  const [pollingStatusText, setPollingStatusText] = useState('');
  
  // Results view state
  const [activeReport, setActiveReport] = useState(null);
  const [ocrExpanded, setOcrExpanded] = useState(false);
  const [sharingModalOpen, setSharingModalOpen] = useState(false);
  const [doctorsList, setDoctorsList] = useState([]);
  const [doctorSearchText, setDoctorSearchText] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [sharingLoading, setSharingLoading] = useState(false);

  // My Reports list state
  const [reportsList, setReportsList] = useState([]);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [reportsOffset, setReportsOffset] = useState(0);
  const [listLoading, setListLoading] = useState(false);

  // Synchronize Tab state from direct URL routing
  useEffect(() => {
    if (routeReportId) {
      fetchSingleReport(routeReportId);
    }
  }, [routeReportId]);

  // Fetch report when accessed directly via URL
  const fetchSingleReport = async (reportId) => {
    try {
      setUploading(true);
      const res = await api.get(`/api/reports/${reportId}`);
      setActiveReport(res.data);
      setActiveTab('upload'); // show standard result board
    } catch (err) {
      console.error(err);
      toast.error('Failed to load the specified report.');
    } finally {
      setUploading(false);
    }
  };

  // ─── POLLING LOGIC ───
  const startPolling = useCallback((reportId) => {
    setPollingReportId(reportId);
    setPollingProgress(0);
    setPollingStatusText('Extracting text from your report...');
    
    let attempts = 0;
    const maxAttempts = 30; // 2 minutes max
    
    const interval = setInterval(async () => {
      attempts++;
      
      // Update simulated progress bar state
      if (attempts <= 5) {
        setPollingProgress(attempts * 6); // 0-30%
        setPollingStatusText('Extracting text from your report...');
      } else if (attempts <= 15) {
        setPollingProgress(30 + (attempts - 5) * 4); // 30-70%
        setPollingStatusText('AI analyzing medical values...');
      } else if (attempts <= 25) {
        setPollingProgress(70 + (attempts - 15) * 3); // 70-100%
        setPollingStatusText('Generating your health summary...');
      }

      try {
        const res = await api.get(`/api/reports/${reportId}`);
        const report = res.data;

        if (report.ai_summary && !report.ai_summary.includes('Processing… Please check back')) {
          clearInterval(interval);
          setPollingProgress(100);
          setPollingReportId(null);
          setActiveReport(report);
          toast.success('Report successfully analyzed!');
          // Redirect to path to allow bookmarkable analysis
          navigate(`/dashboard/reports/${reportId}`);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setPollingReportId(null);
        setUploading(false);
        toast.error('Analysis timed out. Please refresh or try again.');
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [navigate]);

  // ─── DROPZONE SETUP ───
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setActiveReport(null); // Clear previous results on fresh drop
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': [],
      'image/png': [],
      'image/jpeg': [],
      'image/jpg': [],
      'image/webp': [],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const uploadReport = async () => {
    if (!file || !user?.id) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/api/reports/upload/${user.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const { report_id } = res.data;
      startPolling(report_id);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Failed to upload report.';
      toast.error(detail);
      setUploading(false);
    }
  };

  // ─── FETCH USER REPORTS HISTORY ───
  const fetchReportsHistory = async (reset = false) => {
    if (!user?.id) return;
    setListLoading(true);
    const currentOffset = reset ? 0 : reportsOffset;
    try {
      const res = await api.get(`/api/reports/user/${user.id}?limit=20&offset=${currentOffset}`);
      if (reset) {
        setReportsList(res.data.reports);
      } else {
        setReportsList(prev => [...prev, ...res.data.reports]);
      }
      setReportsTotal(res.data.total);
      setReportsOffset(currentOffset + 20);
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve reports.');
    } finally {
      setListLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'myreports') {
      fetchReportsHistory(true);
    }
  };

  const loadMoreReports = () => {
    fetchReportsHistory(false);
  };

  const deleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This cannot be undone.')) return;
    try {
      await api.delete(`/api/reports/${reportId}`);
      toast.success('Report deleted successfully.');
      setReportsList(prev => prev.filter(r => r.id !== reportId));
      setReportsTotal(prev => prev - 1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete report.');
    }
  };

  // ─── DOCTOR SHARING ───
  const openSharingModal = async () => {
    setSharingModalOpen(true);
    try {
      const res = await api.get('/api/doctors/?limit=50');
      setDoctorsList(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load specialists list.');
    }
  };

  const handleSearchDoctors = async (val) => {
    setDoctorSearchText(val);
    if (!val.trim()) {
      const res = await api.get('/api/doctors/?limit=50');
      setDoctorsList(res.data);
      return;
    }
    try {
      const res = await api.get(`/api/doctors/search/${val}`);
      setDoctorsList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const shareReportWithDoctor = async () => {
    if (!selectedDoctorId || !activeReport?.id) return;
    setSharingLoading(true);
    try {
      await api.post('/api/notifications/request-doctor', {
        user_id: user.id,
        doctor_id: selectedDoctorId,
        report_id: activeReport.id,
      });
      const doc = doctorsList.find(d => d.id === selectedDoctorId);
      toast.success(`Request sent! Dr. ${doc?.full_name || 'Specialist'} will be notified via email.`);
      setSharingModalOpen(false);
      setSelectedDoctorId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to share report.');
    } finally {
      setSharingLoading(false);
    }
  };

  // Parse Emergency Lines dynamically
  const getEmergencyAlerts = (aiSummary) => {
    if (!aiSummary || !aiSummary.includes('🚨 EMERGENCY ALERT:')) return null;
    const parts = aiSummary.split('\n');
    const alerts = [];
    for (const part of parts) {
      if (part.startsWith('🚨') || part.includes('CRITICAL') || part.includes('EMERGENCY')) {
        alerts.push(part.replace(/🚨|EMERGENCY ALERT:|CRITICAL:/gi, '').trim());
      }
    }
    return alerts;
  };

  const renderSummaryText = (aiSummary) => {
    if (!aiSummary) return '';
    // Strip the emergency prefix lines to render a clean AI text summary
    const lines = aiSummary.split('\n');
    const cleanLines = lines.filter(
      l => !l.includes('🚨 EMERGENCY ALERT:') && !l.startsWith('🚨') && !l.includes(' Seek Medical Attention')
    );
    return cleanLines.join('\n').trim();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Tab select bar */}
      <div className="flex border-b border-[#ffffff07] mb-6">
        <button
          onClick={() => handleTabChange('upload')}
          className={`pb-3 text-sm font-semibold transition-all relative px-6 ${
            activeTab === 'upload' ? 'text-teal font-bold' : 'text-[#8A9BC4] hover:text-[#EEF2FF]'
          }`}
        >
          Upload New Report
          {activeTab === 'upload' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal rounded-full"></span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('myreports')}
          className={`pb-3 text-sm font-semibold transition-all relative px-6 ${
            activeTab === 'myreports' ? 'text-teal font-bold' : 'text-[#8A9BC4] hover:text-[#EEF2FF]'
          }`}
        >
          My Saved Reports ({reportsTotal})
          {activeTab === 'myreports' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal rounded-full"></span>
          )}
        </button>
      </div>

      {activeTab === 'upload' ? (
        /* UPLOAD TAB */
        <div className="space-y-6">
          {/* Dropzone Container */}
          {!activeReport && !pollingReportId && (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`premium-card p-12 border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? 'border-teal bg-teal/5 scale-[1.01] shadow-[0_0_20px_var(--teal-glow)]'
                    : 'border-[#ffffff0a] hover:border-teal/40 hover:bg-[#00C9A7]/2'
                }`}
              >
                <input {...getInputProps()} />
                <CloudUpload className="h-16 w-16 text-teal mb-4" />
                <h3 className="text-lg font-bold text-[#EEF2FF]">
                  Drag & drop your medical report here
                </h3>
                <p className="text-xs text-[#8A9BC4] mt-2 max-w-sm">
                  Supports PDF, PNG, JPG, or WEBP document files up to 10MB in size
                </p>
              </div>

              {/* Selected file preview */}
              {file && (
                <div className="premium-card p-4 bg-navy-elevated/20 flex items-center justify-between border border-[#ffffff05] rounded-xl animate-fade-in">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-teal/10 rounded-lg text-teal">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#EEF2FF]">{file.name}</h4>
                      <p className="text-[10px] text-[#8A9BC4]">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-1 rounded-full text-[#8A9BC4] hover:text-[#FF5C5C] hover:bg-[#ffffff05] transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {file && (
                <button onClick={uploadReport} className="w-full teal-btn py-3.5 text-sm flex items-center justify-center space-x-2">
                  <FileUp size={16} />
                  <span>Analyze Report</span>
                </button>
              )}
            </div>
          )}

          {/* Progress / Loading Panel during Polling */}
          {pollingReportId && (
            <div className="premium-card p-8 text-center space-y-6 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center">
                <RefreshCw size={36} className="text-teal animate-spin" />
              </div>
              <div className="space-y-2 w-full max-w-md">
                <p className="text-sm font-bold text-[#EEF2FF]">{pollingStatusText}</p>
                <div className="h-2 w-full bg-navy-elevated rounded-full overflow-hidden border border-[#ffffff07]">
                  <div
                    className="h-full bg-teal transition-all duration-500 rounded-full shadow-[0_0_10px_#00C9A7]"
                    style={{ width: `${pollingProgress}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-[#8A9BC4]">{pollingProgress}% Complete</p>
              </div>
            </div>
          )}

          {/* RESULTS DISPLAY BOARD */}
          {activeReport && (
            <div className="space-y-6 animate-fade-in">
              {/* Emergency Banner top of results */}
              {getEmergencyAlerts(activeReport.ai_summary) && (
                <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-5 space-y-4">
                  <div className="flex items-center space-x-3 text-red-400">
                    <AlertOctagon className="h-6 w-6" />
                    <h3 className="font-bold text-base">Critical Warnings Identified</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getEmergencyAlerts(activeReport.ai_summary).map((warning, i) => (
                      <div key={i} className="bg-red-950/20 border border-red-500/10 p-3 rounded-lg text-xs text-red-200">
                        • {warning}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => window.open('tel:102')}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all text-sm shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  >
                    Seek Medical Attention Immediately
                  </button>
                </div>
              )}

              {/* Main AI Summary Board */}
              <div className="premium-card p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#ffffff05] pb-5 gap-4">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal/10 text-teal border border-teal/20 uppercase">
                      {activeReport.report_type?.split('/')[1] || 'Document'}
                    </span>
                    <h3 className="text-xl font-bold font-display mt-2 text-[#EEF2FF]">
                      {activeReport.file_name}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={openSharingModal}
                      className="px-4 py-2 bg-teal text-black rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-[0_0_10px_var(--teal-glow)] hover:bg-teal-dim"
                    >
                      <Send size={12} />
                      <span>Send to Doctor</span>
                    </button>
                    <button
                      onClick={() => {
                        setFile(null);
                        setActiveReport(null);
                        navigate('/dashboard/reports');
                      }}
                      className="px-4 py-2 bg-navy-elevated border border-[#ffffff07] text-xs font-bold text-[#8A9BC4] hover:text-[#EEF2FF] rounded-lg transition-all"
                    >
                      Analyze Another
                    </button>
                  </div>
                </div>

                {/* AI Summary Text */}
                {(() => {
                  const parsed = parseAiSummary(activeReport.ai_summary);
                  const showStructured = parsed && (parsed.summary || parsed.findings || parsed.precautions || parsed.foods);
                  return showStructured ? (
                    <div className="space-y-6">
                      {/* 1. Summary Card */}
                      {parsed.summary && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-teal uppercase tracking-widest flex items-center space-x-1.5">
                            <Activity size={14} className="text-teal" />
                            <span>Summary of overall report</span>
                          </h4>
                          <div className="text-sm text-[#EEF2FF] leading-relaxed whitespace-pre-line bg-navy-elevated/20 p-5 rounded-xl border border-[#ffffff03]">
                            {parsed.summary}
                          </div>
                        </div>
                      )}

                      {/* 2. Findings Card */}
                      {parsed.findings && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-teal uppercase tracking-widest flex items-center space-x-1.5">
                            <ClipboardList size={14} className="text-teal" />
                            <span>Key Findings</span>
                          </h4>
                          <div className="text-sm text-[#8A9BC4] leading-relaxed whitespace-pre-line bg-navy-elevated/20 p-5 rounded-xl border border-[#ffffff03]">
                            {parsed.findings}
                          </div>
                        </div>
                      )}

                      {/* 3. Recommendations Grid (Precautions & Foods) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Precautions Box */}
                        {parsed.precautions && (
                          <div className="premium-card p-5 border-t-2 border-amber-500/50 space-y-3 bg-amber-500/5">
                            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center space-x-1.5">
                              <ShieldAlert size={14} />
                              <span>General Precautions & Maintenance</span>
                            </h4>
                            <div className="text-xs text-[#8A9BC4] leading-relaxed whitespace-pre-line">
                              {parsed.precautions}
                            </div>
                          </div>
                        )}

                        {/* Foods Box */}
                        {parsed.foods && (
                          <div className="premium-card p-5 border-t-2 border-emerald-500/50 space-y-3 bg-emerald-500/5">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center space-x-1.5">
                              <Apple size={14} />
                              <span>Recommended Foods & Diet</span>
                            </h4>
                            <div className="text-xs text-[#8A9BC4] leading-relaxed whitespace-pre-line">
                              {parsed.foods}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-teal uppercase tracking-widest flex items-center space-x-1">
                        <Sparkles size={14} />
                        <span>AI Diagnosis Summary</span>
                      </h4>
                      <div className="text-sm text-[#8A9BC4] leading-relaxed whitespace-pre-line bg-navy-elevated/20 p-5 rounded-xl border border-[#ffffff03]">
                        {renderSummaryText(activeReport.ai_summary)}
                      </div>
                    </div>
                  );
                })()}

                {/* Specialist Recommendation component */}
                {activeReport.specialist_recommendation && (
                  <div className="bg-teal/5 border border-teal/20 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <span className="text-xs text-[#8A9BC4]">Recommended Speciality</span>
                      <div className="mt-1">
                        <SpecialistBadge specialist={activeReport.specialist_recommendation} />
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/dashboard/doctors?specialization=${activeReport.specialist_recommendation}`)}
                      className="text-xs font-bold text-teal hover:underline flex items-center space-x-1.5"
                    >
                      <span>Find nearby {activeReport.specialist_recommendation} clinics</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                )}

                {/* OCR text accordion */}
                {activeReport.ocr_text && (
                  <div className="border-t border-[#ffffff05] pt-5">
                    <button
                      onClick={() => setOcrExpanded(!ocrExpanded)}
                      className="flex items-center justify-between w-full text-xs font-bold text-[#8A9BC4] uppercase tracking-wider hover:text-[#EEF2FF] transition-all"
                    >
                      <span>View Raw Report OCR Text</span>
                      {ocrExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {ocrExpanded && (
                      <div className="mt-4 bg-[#080D1A] border border-[#ffffff04] rounded-lg p-4 font-mono text-xs text-[#5A6A8E] max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {activeReport.ocr_text}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MY REPORTS TAB */
        <div className="space-y-4 animate-fade-in">
          {reportsList.length === 0 && !listLoading ? (
            <div className="premium-card p-12 text-center flex flex-col items-center justify-center">
              <FileText className="h-12 w-12 text-[#5A6A8E] mb-4" />
              <h4 className="font-semibold text-sm text-[#EEF2FF]">No reports found</h4>
              <p className="text-xs text-[#8A9BC4] mt-1 max-w-xs">
                Your uploaded clinical diagnostic reports will compile here for search indexing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportsList.map((report) => {
                const isPdf = report.report_type?.includes('pdf') || report.file_name?.endsWith('.pdf');
                const isEmergency = report.ai_summary?.includes('🚨 EMERGENCY ALERT');
                
                return (
                  <div
                    key={report.id}
                    className="premium-card p-5 hover:border-teal/30 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between min-w-0">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`p-2 rounded-lg ${isPdf ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {isPdf ? <FileText size={20} /> : <FileImage size={20} />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold truncate text-[#EEF2FF] max-w-[200px]">
                            {report.file_name}
                          </h4>
                          <p className="text-[10px] text-[#8A9BC4] mt-0.5">
                            Uploaded {new Date(report.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteReport(report.id)}
                        className="text-[#8A9BC4] hover:text-[#FF5C5C] p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#ffffff04]">
                      <div className="flex items-center space-x-2">
                        {isEmergency ? (
                          <EmergencyBadge />
                        ) : report.specialist_recommendation ? (
                          <SpecialistBadge specialist={report.specialist_recommendation} />
                        ) : (
                          <span className="text-[10px] text-[#5A6A8E]">No Recommendation</span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setActiveReport(report);
                          setActiveTab('upload');
                          navigate(`/dashboard/reports/${report.id}`);
                        }}
                        className="px-3 py-1 bg-teal text-black text-xs font-bold rounded hover:bg-teal-dim transition-all"
                      >
                        View Results
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Trigger */}
          {reportsList.length < reportsTotal && (
            <button
              onClick={loadMoreReports}
              disabled={listLoading}
              className="w-full py-3 bg-[#ffffff03] border border-[#ffffff07] hover:border-teal text-teal text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2"
            >
              {listLoading ? 'Loading...' : 'Load More Reports'}
            </button>
          )}
        </div>
      )}

      {/* ─── DOCTOR SHARING MODAL ─── */}
      {sharingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="premium-card bg-navy-elevated p-6 w-full max-w-lg border border-[#ffffff0a] shadow-2xl relative">
            <button
              onClick={() => {
                setSharingModalOpen(false);
                setSelectedDoctorId(null);
              }}
              className="absolute top-4 right-4 text-[#8A9BC4] hover:text-[#EEF2FF]"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold font-display text-[#EEF2FF] mb-4">
              Share Report with a Specialist
            </h3>

            {/* Search inputs */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3.5 text-[#5A6A8E] h-4 w-4" />
              <input
                type="text"
                placeholder="Search doctors by name or specialty..."
                value={doctorSearchText}
                onChange={(e) => handleSearchDoctors(e.target.value)}
                className="w-full bg-navy border border-[#ffffff07] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#EEF2FF] placeholder-[#5A6A8E] focus:outline-none focus:border-teal transition-all"
              />
            </div>

            {/* Doctor listing queue */}
            <div className="space-y-2 max-h-60 overflow-y-auto mb-6 pr-1">
              {doctorsList.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#5A6A8E]">No doctors found...</div>
              ) : (
                doctorsList.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctorId(doc.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedDoctorId === doc.id
                        ? 'bg-teal/10 border-teal'
                        : 'bg-navy/30 border-[#ffffff04] hover:bg-navy/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <DoctorAvatar name={doc.full_name} size="sm" />
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold truncate text-[#EEF2FF]">
                          {doc.full_name}
                        </h4>
                        <span className="text-[10px] text-teal font-medium uppercase">
                          {doc.specialization}
                        </span>
                        {doc.hospital_name && (
                          <p className="text-[10px] text-[#8A9BC4] truncate">{doc.hospital_name}</p>
                        )}
                      </div>
                    </div>

                    {selectedDoctorId === doc.id && (
                      <div className="h-5 w-5 bg-teal text-black rounded-full flex items-center justify-center">
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Confirm send row */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSharingModalOpen(false);
                  setSelectedDoctorId(null);
                }}
                className="flex-1 py-2.5 bg-navy border border-[#ffffff07] text-[#8A9BC4] rounded-lg text-xs font-bold hover:text-[#EEF2FF] transition-all"
              >
                Cancel
              </button>
              <button
                disabled={!selectedDoctorId || sharingLoading}
                onClick={shareReportWithDoctor}
                className="flex-1 py-2.5 bg-teal text-black rounded-lg text-xs font-bold hover:bg-teal-dim disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {sharingLoading ? 'Sharing...' : 'Confirm Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
