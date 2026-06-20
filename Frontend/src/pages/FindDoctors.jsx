import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../lib/api';
import {
  Search,
  MapPin,
  Building,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  Send,
  User,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import DoctorAvatar from '../components/DoctorAvatar';
import SpecialistBadge from '../components/SpecialistBadge';
import SkeletonCard from '../components/SkeletonCard';
import toast from 'react-hot-toast';

// Coordinate lookup map for Indian cities and specific sub-localities
const CITY_COORDS = {
  // Hyderabad Sub-regions
  "gachibowli": [17.4401, 78.3489],
  "somajiguda": [17.4265, 78.4590],
  "jubilee hills": [17.4325, 78.4070],
  "banjara hills": [17.4176, 78.4348],
  "secunderabad": [17.4399, 78.4983],
  "bogulkunta": [17.3888, 78.4842],
  "panjagutta": [17.4267, 78.4533],
  "nampally": [17.3876, 78.4691],
  "ibrahimpatnam": [17.1895, 78.6499],
  
  // Warangal Sub-regions
  "subedari": [18.0121, 79.5480],
  "hanamkonda": [18.0121, 79.5636],
  
  // Vijayawada Sub-regions
  "mahanadu road": [16.5165, 80.6625],
  "sri ramachandra nagar": [16.5028, 80.6698],
  
  // Visakhapatnam Sub-regions
  "mvp colony": [17.7423, 83.3327],
  "arilova": [17.7709, 83.3283],
  
  // Karimnagar Sub-regions
  "kothirampur": [18.4345, 79.1170],
  "mukarampura": [18.4385, 79.1305],

  // Cities
  hyderabad: [17.3850, 78.4867],
  mumbai: [19.0760, 72.8777],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  chennai: [13.0827, 80.2707],
  delhi: [28.6139, 77.2090],
  ahmedabad: [23.0225, 72.5714],
  kolkata: [22.5726, 88.3639],
  pune: [18.5204, 73.8567],
  jaipur: [26.9124, 75.7873],
  vijayawada: [16.5062, 80.6480],
  visakhapatnam: [17.6868, 83.2185],
  warangal: [18.0000, 79.5800],
  guntur: [16.3067, 80.4365],
  kurnool: [15.8281, 78.0373],
  tirupati: [13.6288, 79.4192],
  nizamabad: [18.6725, 78.0941],
  karimnagar: [18.4386, 79.1288],
  khammam: [17.2473, 80.1514],
  nellore: [14.4426, 79.9865],
  kakinada: [16.9891, 82.2475],
  anantapur: [14.6819, 77.6006],
  kadapa: [14.4673, 78.8242],
  rajahmundry: [17.0005, 81.8040],
  eluru: [16.7107, 81.1035],
  ongole: [15.5057, 80.0499],
  chittoor: [13.2172, 79.1003],
  vizianagaram: [18.1167, 83.4167],
  machilipatnam: [16.1800, 81.1300],
  tenali: [16.2435, 80.6416],
  mangaluru: [12.9141, 74.8560],
  mysuru: [12.2958, 76.6394],
  hubli: [15.3647, 75.1240],
  kochi: [9.9312, 76.2673]
};

// Haversine formula to compute distance in km
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

export default function FindDoctors() {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const specParam = searchParams.get('specialization');

  // Filter states
  const [specialistsTypes, setSpecialistsTypes] = useState([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState(specParam || '');
  const [cityInput, setCityInput] = useState('');
  const [stateInput, setStateInput] = useState('');

  // Name search state
  const [nameInput, setNameInput] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [requestSendingId, setRequestSendingId] = useState(null);

  // Geolocation states
  const [userCoords, setUserCoords] = useState(null);
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'experience' | 'distance' | 'recommend'
  const [locLoading, setLocLoading] = useState(false);

  // Function to request geolocation from the browser
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        toast.success('Successfully retrieved your current location!');
        setLocLoading(false);
        setSortBy('distance');
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Unable to retrieve location. Please allow location access.');
        setLocLoading(false);
      }
    );
  };

  // Fetch specialist types on mount
  useEffect(() => {
    const fetchSpecialistTypes = async () => {
      try {
        const res = await api.get('/api/doctors/specialists/list');
        setSpecialistsTypes(res.data.specialists || []);
      } catch (err) {
        console.error('Failed to load specialists list:', err);
      }
    };
    fetchSpecialistTypes();
  }, []);

  // Sync route query parameter changes
  useEffect(() => {
    if (specParam) {
      setSelectedSpecialist(specParam);
    }
  }, [specParam]);

  // Main fetch query function
  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSpecialist) params.specialization = selectedSpecialist;
      if (cityInput) params.city = cityInput;
      if (stateInput) params.state = stateInput;

      const res = await api.get('/api/doctors/', { params });
      setDoctors(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve doctors list.');
    } finally {
      setLoading(false);
    }
  }, [selectedSpecialist, cityInput, stateInput]);

  // Run initial fetch on load or when specialization parameters update
  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialist]);

  // Debounced Name Search Logic
  useEffect(() => {
    if (!nameInput.trim()) {
      if (nameInput === '') {
        fetchDoctors();
      }
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/doctors/search/${nameInput}`);
        setDoctors(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [nameInput, fetchDoctors]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  const sendConsultationRequest = async (doctor) => {
    if (!user?.id) return;
    setRequestSendingId(doctor.id);
    try {
      await api.post('/api/notifications/request-doctor', {
        user_id: user.id,
        doctor_id: doctor.id,
        report_id: null,
      });
      toast.success(`Request sent! Dr. ${doctor.full_name} will be notified via email.`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to send request: ${err.response?.data?.detail || 'Unknown error'}`);
    } finally {
      setRequestSendingId(null);
    }
  };

  const toggleCardExpansion = (cardId) => {
    if (expandedCardId === cardId) {
      setExpandedCardId(null);
    } else {
      setExpandedCardId(cardId);
    }
  };

  // Compute processed list of doctors with distance and sorting/recommendation scoring
  const processedDoctors = React.useMemo(() => {
    let list = doctors.map((doc) => {
      let distance = null;
      const cityLower = doc.city ? doc.city.toLowerCase().trim() : '';

      let matchedCity = null;
      // Sort keys by length descending so longer/more specific names (e.g. 'gachibowli') match before general city names (e.g. 'hyderabad')
      const sortedCityKeys = Object.keys(CITY_COORDS).sort((a, b) => b.length - a.length);
      for (const city of sortedCityKeys) {
        if (cityLower.includes(city)) {
          matchedCity = city;
          break;
        }
      }

      if (userCoords && (matchedCity || CITY_COORDS[cityLower])) {
        const docCoords = CITY_COORDS[matchedCity || cityLower];
        distance = getDistance(
          userCoords.latitude,
          userCoords.longitude,
          docCoords[0],
          docCoords[1]
        );
      }

      // Smart recommendation score: experience heavily weighted, and distance reduces it.
      let recommendScore = (doc.experience_years || 0);
      if (distance !== null) {
        // Boost score for closer distance, penalty for far distance (within 100km gets a boost)
        recommendScore = (doc.experience_years || 0) * 1.5 + Math.max(0, 100 - distance) * 0.5;
      } else {
        recommendScore = (doc.experience_years || 0) * 1.5;
      }

      return { ...doc, distance, recommendScore };
    });

    if (sortBy === 'experience') {
      list.sort((a, b) => (b.experience_years || 0) - (a.experience_years || 0));
    } else if (sortBy === 'distance') {
      list.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else if (sortBy === 'recommend') {
      list.sort((a, b) => b.recommendScore - a.recommendScore);
    } else {
      // default: alphabetical by name
      list.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    }

    return list;
  }, [doctors, userCoords, sortBy]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Horizontal Filter Bar (Sticky below Header) ─── */}
      <div className="sticky top-16 z-30 bg-navy/80 backdrop-blur-md py-3 border-b border-[#ffffff05]">
        <form
          onSubmit={handleSearchSubmit}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-navy-surface p-3 rounded-xl border border-[#ffffff07]"
        >
          {/* 1. Specialization Selection */}
          <div>
            <select
              value={selectedSpecialist}
              onChange={(e) => setSelectedSpecialist(e.target.value)}
              className="w-full bg-navy-elevated/80 border border-[#ffffff05] rounded-lg px-3 py-2.5 text-sm text-[#EEF2FF] focus:outline-none focus:border-teal transition-all"
            >
              <option value="">All Specializations</option>
              {specialistsTypes.map((type, idx) => (
                <option key={idx} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* 2. City Filter Input */}
          <div>
            <input
              type="text"
              placeholder="Filter by city..."
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              className="w-full bg-navy-elevated/80 border border-[#ffffff05] rounded-lg px-3 py-2.5 text-sm text-[#EEF2FF] placeholder-[#5A6A8E] focus:outline-none focus:border-teal transition-all"
            />
          </div>

          {/* 3. State Filter Input */}
          <div>
            <input
              type="text"
              placeholder="Filter by state..."
              value={stateInput}
              onChange={(e) => setStateInput(e.target.value)}
              className="w-full bg-navy-elevated/80 border border-[#ffffff05] rounded-lg px-3 py-2.5 text-sm text-[#EEF2FF] placeholder-[#5A6A8E] focus:outline-none focus:border-teal transition-all"
            />
          </div>

          {/* 4. Submission Search Trigger */}
          <button
            type="submit"
            className="w-full bg-teal hover:bg-teal-dim text-black font-semibold text-sm rounded-lg py-2.5 shadow-[0_0_10px_var(--teal-glow)] transition-all flex items-center justify-center space-x-2"
          >
            <Search size={16} />
            <span>Search Doctors</span>
          </button>
        </form>
      </div>

      {/* ─── Name Search input (Debounced) ─── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 text-[#5A6A8E] h-4 w-4" />
        <input
          type="text"
          placeholder="Search by doctor name..."
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          className="w-full bg-navy-surface border border-[#ffffff07] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#EEF2FF] placeholder-[#5A6A8E] focus:outline-none focus:border-teal transition-all"
        />
      </div>

      {/* ─── Location & Recommendation controls ─── */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-navy-surface p-4 rounded-xl border border-[#ffffff07]">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={requestUserLocation}
            disabled={locLoading}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
              userCoords
                ? 'bg-teal/10 border-teal/30 text-teal'
                : 'bg-navy-elevated hover:bg-[#ffffff05] border-[#ffffff05] text-[#EEF2FF]'
            }`}
          >
            <MapPin size={14} className={locLoading ? "animate-bounce" : ""} />
            <span>{locLoading ? 'Detecting Location...' : userCoords ? 'Location Allowed ✓' : 'Use Live Location'}</span>
          </button>
          {userCoords && (
            <span className="text-[10px] text-teal/70 font-mono">
              ({userCoords.latitude.toFixed(4)}, {userCoords.longitude.toFixed(4)})
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-[#8A9BC4] whitespace-nowrap">Sort & Recommend:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-navy-elevated/85 border border-[#ffffff05] rounded-lg px-3 py-2 text-xs text-[#EEF2FF] focus:outline-none focus:border-teal transition-all cursor-pointer"
          >
            <option value="default">Default (Name)</option>
            <option value="experience">Experience (Highest First)</option>
            <option value="distance" disabled={!userCoords}>Distance (Nearest First)</option>
            <option value="recommend">Smart Recommendation ⭐</option>
          </select>
        </div>
      </div>

      {/* ─── DOCTORS GRID VIEW ─── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : processedDoctors.length === 0 ? (
        <div className="premium-card p-12 text-center flex flex-col items-center justify-center min-h-[260px]">
          <Building className="h-10 w-10 text-[#5A6A8E] mb-3" />
          <h4 className="font-semibold text-[#EEF2FF]">No doctors found</h4>
          <p className="text-xs text-[#8A9BC4] mt-1">
            No active specialists match these search filters. Try refining your criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedDoctors.map((doctor, idx) => {
            const isExpanded = expandedCardId === doctor.id;
            const isBestRecommend = sortBy === 'recommend' && idx === 0;
            return (
              <div
                key={doctor.id}
                className={`premium-card p-5 transition-all duration-300 flex flex-col justify-between ${
                  isBestRecommend 
                    ? 'border-teal/50 shadow-[0_0_20px_rgba(0,201,167,0.12)] ring-1 ring-teal/20 scale-[1.01]' 
                    : 'hover:border-teal/20'
                }`}
              >
                <div className="space-y-4">
                  {/* Top line profile summary */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3.5">
                      <DoctorAvatar name={doctor.full_name} size="md" />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-base font-semibold text-[#EEF2FF] leading-snug">
                            {doctor.full_name}
                          </h4>
                          {isBestRecommend && (
                            <span className="bg-teal text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(0,201,167,0.4)] whitespace-nowrap">
                              ⭐ Top Match
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          <SpecialistBadge specialist={doctor.specialization} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body details list */}
                  <div className="space-y-2 text-xs text-[#8A9BC4]">
                    {doctor.hospital_name && (
                      <div className="flex items-center space-x-2">
                        <Building size={14} className="text-[#5A6A8E]" />
                        <span className="truncate">{doctor.hospital_name}</span>
                      </div>
                    )}
                    {(doctor.city || doctor.state) && (
                      <div className="flex items-center space-x-2">
                        <MapPin size={14} className="text-[#5A6A8E]" />
                        <span>
                          {[doctor.city, doctor.state].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {doctor.experience_years && (
                      <div className="flex items-center space-x-2">
                        <GraduationCap size={14} className="text-[#5A6A8E]" />
                        <span>{doctor.experience_years} Years Experience</span>
                      </div>
                    )}
                    {doctor.distance !== null && (
                      <div className="flex items-center space-x-2 text-teal font-semibold">
                        <MapPin size={14} className="text-teal" />
                        <span>{doctor.distance.toFixed(1)} km away</span>
                      </div>
                    )}
                    {doctor.phone && !isExpanded && (
                      <div className="flex items-center space-x-2">
                        <Phone size={14} className="text-[#5A6A8E]" />
                        <span>{doctor.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Expanded Profile Detail Block */}
                  {isExpanded && (
                    <div className="bg-navy-elevated/40 border border-[#ffffff04] rounded-lg p-3 space-y-2 text-xs text-[#8A9BC4] animate-fade-in">
                      {doctor.email && (
                        <div className="flex items-center space-x-2">
                          <Mail size={14} className="text-teal/70" />
                          <span className="truncate">{doctor.email}</span>
                        </div>
                      )}
                      {doctor.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone size={14} className="text-teal/70" />
                          <span>{doctor.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Calendar size={14} className="text-teal/70" />
                        <span>Available for digital sharing</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Interactive buttons */}
                <div className="flex items-center space-x-2 mt-5 pt-3 border-t border-[#ffffff04]">
                  <button
                    onClick={() => toggleCardExpansion(doctor.id)}
                    className="flex-1 py-2 bg-navy-elevated hover:bg-navy-elevated/80 text-[#8A9BC4] hover:text-[#EEF2FF] rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1"
                  >
                    <span>{isExpanded ? 'Hide Details' : 'View Profile'}</span>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  <button
                    disabled={requestSendingId === doctor.id}
                    onClick={() => sendConsultationRequest(doctor)}
                    className="flex-1 py-2 bg-teal hover:bg-teal-dim text-black rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-[0_0_10px_var(--teal-glow)]"
                  >
                    {requestSendingId === doctor.id ? (
                      <>
                        <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-black border-t-transparent"></span>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send size={12} />
                        <span>Send Request</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
