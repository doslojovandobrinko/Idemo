/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  KeyRound, CheckCircle2, Globe, Phone, MapPin, Sparkles, Lock, Unlock, X, 
  AlertCircle, Gift, Map as MapIcon, Search, Filter, CheckCircle, Award,
  ShieldCheck, Plus, Send, Check, Users, MessageCircle, Eye, ChevronRight, Briefcase, Loader2, Calendar, XCircle, Trash2, Camera,
  FolderArchive, ChevronDown, Zap, UserCheck, MessageSquare, Compass, Package, Layers, Image as ImageIcon
} from 'lucide-react';
import { compilePackageCollage } from '../lib/collageCompiler';
import { 
  getPartnerProposalsByPartnerId, 
  savePartnerRecommendationProposal, 
  PartnerRecommendationProposal,
  ProposalType 
} from '../lib/partnerProposalService';
import { PARTNERS } from '../data/partners';
import { Partner } from '../types';
import { safeStorage } from '../lib/safeStorage';
import IdemoLogo from './IdemoLogo';
import { routeOutboundAction } from '../lib/outboundRouter';
import { 
  loginPartner, 
  logoutPartner, 
  fetchAuthenticatedPartnerProfile,
  AuthenticatedPartnerProfile,
  fetchPartnerOpportunities, 
  acceptPartnerOpportunity, 
  declinePartnerOpportunity, 
  proposePartnerAlternative,
  viewPartnerOpportunity,
  acceptPartnerCounterOffer,
  declinePartnerCounterOffer,
  withdrawPartnerOpportunity,
  changePartnerPin,
  OpportunityItem,
  getPartnerProfileContent,
  savePartnerProfileDraft,
  submitPartnerProfile,
  withdrawPartnerProfileContent,
  authorizePhotoUpload,
  uploadPhotoToSignedUrl,
  updatePartnerProfessionalContact
} from '../lib/partnerService';
import { partnerSessionStorage } from '../lib/partnerSessionStorage';
import { loadAuthoritativeCommunityEvents } from '../lib/communityFeedService';
import { 
  getAllInquiriesV2, 
  saveInquiryRecordV2, 
  updateInquiryCachedProposalV2, 
  updateInquiryServerStatusV2, 
  removeSeenProposal,
  getConfirmedArrangementByServerId,
  saveConfirmedArrangementV2
} from '../lib/inquiryStorage';
import { CachedProposalRecord, InquiryRecordV2, ConfirmedArrangementRecord } from '../types';
import { 
  checkPartnerHasUnseenInquiries, 
  markPartnerInquiriesAsSeen, 
  getPartnerSeenMessageCount, 
  markPartnerMessagesAsSeen 
} from '../lib/partnerBadgeStorage';
import { loadRecommendations } from '../lib/recommendationsLoader';

// Static Lookup for IDEMO Recommendations
const RECOMMENDATIONS_LOOKUP = [
  { id: '1', title: 'Uvac Meanders', category: 'Nature' },
  { id: '2', title: 'Manasija Monastery', category: 'History' },
  { id: '3', title: 'Belgrade Splavovi', category: 'Clubbing' },
  { id: '4', title: 'Vrnjačka Banja', category: 'Wellbeing' },
  { id: '5', title: 'Zasavica Reserve', category: 'Nature' },
  { id: '6', title: 'Sremski Karlovci', category: 'Gastronomy' },
  { id: '7', title: 'Nikola Tesla Museum', category: 'History' },
  { id: '8', title: 'Zlakusa Pottery', category: 'Culture' },
  { id: '9', title: 'Sand Wines Subotica', category: 'Gastronomy' },
  { id: '10', title: 'Rakija Bar Belgrade', category: 'Gastronomy' },
  { id: '11', title: 'Zarić Distillery', category: 'Gastronomy' }
];

const sha256 = async (text: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

interface PortalPartner {
  id: string;
  pin: string;
  name: string;
  category: 'Tourist Guide' | 'Medical/Wellbeing' | 'Limousine/Transport' | 'Open Slot';
  status: 'Validated' | 'Active' | 'Trusted' | 'Expanded Portfolio';
  capabilities: string[];
  languages: string[];
  geography: string;
  channels: string[];
  contactPhone: string;
  instagram: string;
  assignedRecs: string[];
  contributions: number;
  reliability: number;
  eligibility: boolean;
  isDemo?: boolean;
  publicCode?: string;
  introduction?: string;
  photoUrl?: string;
}

interface Inquiry {
  id: string;
  matchId?: string;
  inquiryId?: string;
  recId: string;
  recTitle: string;
  partnerId?: string;
  partnerName?: string;
  status: string;
  matchStatus?: string;
  inquiryStatus?: string;
  rawMatchStatus?: string;
  visitorName: string;
  query: string;
  replies: string[];
  createdAt: string;
  requestedStartAt?: string;
  requestedEndAt?: string;
  counterProposal?: {
    proposedStartAt?: string;
    proposedEndAt?: string;
    notes?: string;
  };
  geography?: string;
  language?: string;
  budget?: string;
  availableTime?: string;
  subjectExpertise?: string;
  category?: 'Tourist Guide' | 'Medical/Wellbeing' | 'Limousine/Transport';
  dispatchStage?: 1 | 2;
  alternativeOffer?: {
    date: string;
    time: string;
    note: string;
  };
  releaseReason?: string;
  visitorConfirmed?: boolean;
  visitorConfirmedAt?: number;
}

// Initial Controlled Ecosystem Partner Structure (10 Guides, 3 Medical, 10 Transport, 7 Open, 2 Demonstration)
const INITIAL_PORTAL_PARTNERS: PortalPartner[] = [
  // Demonstration Partner Accounts (Seeded Dataset for Tester Validation)
  {
    id: 'UNO1',
    pin: '3001',
    name: 'UNO1 (60% Portfolio Scope)',
    publicCode: 'UNO1',
    introduction: 'I am a licensed local guide with strong knowledge of Belgrade, Serbian history, cultural heritage and traditional gastronomy. I enjoy helping visitors understand the stories behind the places they see and creating memorable experiences tailored to their interests.',
    category: 'Tourist Guide',
    status: 'Trusted',
    capabilities: [
      'Historical Walk', 'Gardoš Explorer', 'Architectural Walks', 'Roman Archaeological Tours', 'Belgrade Architecture Heritage',
      'Private Tours', 'Taste Tasting', 'River Boating', 'Wildlife Photography', 'Culinary Tours', 'Vineyard Visits', 'Bespoke Tastings',
      'EV Airport Pickups', 'VIP Executive Transfers', 'Private Driver Service', 'Long-Distance Chauffeuring', 'Multi-Passenger Luxury Vans',
      'Licensed Tourist Guide', 'First Aid Certified', 'Professional Chauffeur', 'EXPO Certified Host'
    ],
    languages: ['English', 'Serbian'],
    geography: 'Belgrade & National',
    channels: ['WhatsApp', 'Viber'],
    contactPhone: '+381621873260',
    instagram: '@uno1_concierge',
    assignedRecs: ['1', '2', '3', '4', '5', '6', '7'],
    contributions: 50,
    reliability: 99,
    eligibility: true,
    isDemo: true,
    photoUrl: '/assets/images/partners/uno_portrait.svg',
  },
  {
    id: 'UNO2',
    pin: '3002',
    name: 'UNO2 (75% Portfolio Scope)',
    publicCode: 'UNO2',
    introduction: 'I am a licensed local guide with strong knowledge of Belgrade, Serbian history, cultural heritage and traditional gastronomy. I enjoy helping visitors understand the stories behind the places they see and creating memorable experiences tailored to their interests.',
    category: 'Tourist Guide',
    status: 'Trusted',
    capabilities: [
      'Historical Walk', 'Gardoš Explorer', 'Architectural Walks', 'Roman Archaeological Tours', 'Belgrade Architecture Heritage',
      'Private Tours', 'Taste Tasting', 'River Boating', 'Wildlife Photography', 'Culinary Tours', 'Vineyard Visits', 'Bespoke Tastings', 'Canyon Kayaking', 'Spritual Hikes', 'Rakija Pairing',
      'EV Airport Pickups', 'VIP Executive Transfers', 'Private Driver Service', 'Long-Distance Chauffeuring', 'Multi-Passenger Luxury Vans', 'Bespoke Danube Tours', 'Old-Town Retro Shuttle', '4x4 Mountain Express',
      'Licensed Tourist Guide', 'First Aid Certified', 'Professional Chauffeur', 'EXPO Certified Host', 'Dental Orientation', 'Orthodontic Liaison', 'Skin Consultation Liaison'
    ],
    languages: ['English', 'Serbian', 'German'],
    geography: 'Belgrade & National',
    channels: ['WhatsApp', 'Viber'],
    contactPhone: '+381621869850',
    instagram: '@uno2_concierge',
    assignedRecs: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    contributions: 35,
    reliability: 98,
    eligibility: true,
    isDemo: true,
    photoUrl: '/assets/images/partners/uno_portrait.svg',
  },
  // 10 Tourist Guides
  { id: 'p-tg-1', pin: '3001', name: 'Belgrade Undercover Walking', category: 'Tourist Guide', status: 'Trusted', capabilities: ['Private Tours', 'Historical Walk', 'Taste Tasting'], languages: ['English', 'Serbian', 'German'], geography: 'Belgrade & Zemun', channels: ['WhatsApp', 'Viber'], contactPhone: '+381631112001', instagram: '@belgrade_undercover', assignedRecs: ['7', '10'], contributions: 48, reliability: 99, eligibility: true },
  { id: 'p-tg-2', pin: '3002', name: 'Danube Delta Sailing Guides', category: 'Tourist Guide', status: 'Active', capabilities: ['River Boating', 'Wildlife Photography'], languages: ['English', 'Serbian'], geography: 'Djerdap Gorge & Eastern Serbia', channels: ['Viber', 'Instagram'], contactPhone: '+381631112002', instagram: '@danube_sailing', assignedRecs: ['5'], contributions: 22, reliability: 96, eligibility: true },
  { id: 'p-tg-3', pin: '3003', name: 'Zemun Heritage Guild', category: 'Tourist Guide', status: 'Validated', capabilities: ['Gardoš Explorer', 'Architectural Walks'], languages: ['English', 'Serbian', 'Russian'], geography: 'Zemun & Novi Beograd', channels: ['WhatsApp'], contactPhone: '+381631112003', instagram: '@zemun_heritage', assignedRecs: ['11'], contributions: 8, reliability: 94, eligibility: false },
  { id: 'p-tg-4', pin: '3004', name: 'Tara Peak Outdoors Guild', category: 'Tourist Guide', status: 'Trusted', capabilities: ['Alpine Hiking', 'Wildlife Tracking'], languages: ['English', 'French'], geography: 'Tara National Park & Western Serbia', channels: ['WhatsApp', 'Viber'], contactPhone: '+381631112004', instagram: '@tara_outdoors', assignedRecs: ['1'], contributions: 37, reliability: 98, eligibility: true },
  { id: 'p-tg-5', pin: '3005', name: 'Balkan Foodie Trails', category: 'Tourist Guide', status: 'Active', capabilities: ['Culinary Tours', 'Rakija Pairing'], languages: ['English', 'Serbian', 'Italian'], geography: 'Belgrade & Šumadija', channels: ['Instagram'], contactPhone: '+381631112005', instagram: '@balkan_foodies', assignedRecs: ['10'], contributions: 19, reliability: 95, eligibility: false },
  { id: 'p-tg-6', pin: '3006', name: 'Sumadija Wine Whispers', category: 'Tourist Guide', status: 'Validated', capabilities: ['Vineyard Visits', 'Bespoke Tastings'], languages: ['English', 'Serbian'], geography: 'Šumadija Wine District', channels: ['Viber'], contactPhone: '+381631112006', instagram: '@sumadija_whispers', assignedRecs: ['6'], contributions: 5, reliability: 90, eligibility: false },
  { id: 'p-tg-7', pin: '3007', name: 'Nis Roman Crossroads Tours', category: 'Tourist Guide', status: 'Validated', capabilities: ['Roman Archaeological Tours'], languages: ['English', 'German', 'Greek'], geography: 'Southern Serbia (Niš)', channels: ['WhatsApp'], contactPhone: '+381631112007', instagram: '@nis_crossroads', assignedRecs: ['2'], contributions: 4, reliability: 92, eligibility: false },
  { id: 'p-tg-8', pin: '3008', name: 'Uvac Adventure Navigators', category: 'Tourist Guide', status: 'Active', capabilities: ['Canyon Kayaking', 'Vulture Spotting'], languages: ['English', 'Serbian'], geography: 'Western Serbia (Sjenica)', channels: ['WhatsApp', 'Viber'], contactPhone: '+381631112008', instagram: '@uvac_navigators', assignedRecs: ['1'], contributions: 14, reliability: 97, eligibility: true },
  { id: 'p-tg-9', pin: '3009', name: 'Felix Romuliana Custodians', category: 'Tourist Guide', status: 'Validated', capabilities: ['Imperial Palace Tours'], languages: ['English', 'Serbian'], geography: 'Eastern Serbia (Zaječar)', channels: ['WhatsApp'], contactPhone: '+381631112009', instagram: '@felix_custodians', assignedRecs: ['2'], contributions: 3, reliability: 91, eligibility: false },
  { id: 'p-tg-10', pin: '3010', name: 'Fruška Gora Monasteries Guild', category: 'Tourist Guide', status: 'Trusted', capabilities: ['Spritual Hikes', 'Local Honey Tasting'], languages: ['English', 'Serbian', 'Russian'], geography: 'Vojvodina & Fruška Gora', channels: ['WhatsApp', 'Viber'], contactPhone: '+381631112010', instagram: '@fg_monasteries', assignedRecs: ['6'], contributions: 42, reliability: 99, eligibility: true },

  // 3 Medical / Wellbeing (Strict orientation scope only, non-emergency)
  { id: 'p-mw-1', pin: '4001', name: 'Belgrade Elite Dental Care', category: 'Medical/Wellbeing', status: 'Trusted', capabilities: ['Dental Orientation', 'Orthodontic Liaison'], languages: ['English', 'Serbian', 'German', 'Italian'], geography: 'Belgrade', channels: ['WhatsApp', 'Viber'], contactPhone: '+381632224001', instagram: '@belgrade_elitedental', assignedRecs: ['4'], contributions: 65, reliability: 100, eligibility: true },
  { id: 'p-mw-2', pin: '4002', name: 'Sokobanja Respiratory Recovery', category: 'Medical/Wellbeing', status: 'Active', capabilities: ['Inhalation Orientation', 'Spa Wellness Liaison'], languages: ['English', 'Serbian'], geography: 'Sokobanja & Eastern Serbia', channels: ['Viber'], contactPhone: '+381632224002', instagram: '@sokobanja_recovery', assignedRecs: ['4'], contributions: 28, reliability: 97, eligibility: true },
  { id: 'p-mw-3', pin: '4003', name: 'Kozarev Aesthetic Dermatology', category: 'Medical/Wellbeing', status: 'Validated', capabilities: ['Skin Consultation Liaison', 'Thermal Water Advisory'], languages: ['English', 'Serbian', 'Russian'], geography: 'Belgrade & Novi Sad', channels: ['WhatsApp', 'Instagram'], contactPhone: '+381632224003', instagram: '@kozarev_aesthetic', assignedRecs: ['4'], contributions: 12, reliability: 95, eligibility: false },

  // 10 Limousine & Transport
  { id: 'p-tr-1', pin: '5001', name: 'Tesla Ride Belgrade Premium', category: 'Limousine/Transport', status: 'Trusted', capabilities: ['EV Airport Pickups', 'VIP Executive Transfers'], languages: ['English', 'Serbian'], geography: 'Belgrade & National', channels: ['WhatsApp', 'Viber'], contactPhone: '+381633335001', instagram: '@teslaride_bg', assignedRecs: ['3'], contributions: 124, reliability: 100, eligibility: true },
  { id: 'p-tr-2', pin: '5002', name: 'Elite Sava Chauffeurs', category: 'Limousine/Transport', status: 'Active', capabilities: ['Private Driver Service', 'Savamala Escorts'], languages: ['English', 'Serbian', 'German'], geography: 'Belgrade', channels: ['WhatsApp'], contactPhone: '+381633335002', instagram: '@elitesava_cars', assignedRecs: ['3'], contributions: 55, reliability: 98, eligibility: true },
  { id: 'p-tr-3', pin: '5003', name: 'Balkan Executive Limousines', category: 'Limousine/Transport', status: 'Trusted', capabilities: ['All-Terrain SUV', 'Long-Distance Chauffeuring'], languages: ['English', 'Serbian', 'Russian'], geography: 'National & Regional Borders', channels: ['WhatsApp', 'Viber'], contactPhone: '+381633335003', instagram: '@balkan_execlimos', assignedRecs: ['1'], contributions: 88, reliability: 99, eligibility: true },
  { id: 'p-tr-4', pin: '5004', name: 'Vip Danube Van Shuttles', category: 'Limousine/Transport', status: 'Active', capabilities: ['Multi-Passenger Luxury Vans', 'Bespoke Danube Tours'], languages: ['English', 'Serbian'], geography: 'Belgrade & Danube Corridor', channels: ['Viber'], contactPhone: '+381633335004', instagram: '@vipdanube_shuttles', assignedRecs: ['5'], contributions: 31, reliability: 96, eligibility: true },
  { id: 'p-tr-5', pin: '5005', name: 'Gardoš Classic Transfers', category: 'Limousine/Transport', status: 'Validated', capabilities: ['Old-Town Retro Shuttle', 'Romantic Chauffeur'], languages: ['English', 'Serbian'], geography: 'Zemun & Belgrade Core', channels: ['Instagram'], contactPhone: '+381633335005', instagram: '@gardos_transfers', assignedRecs: ['11'], contributions: 15, reliability: 93, eligibility: false },
  { id: 'p-tr-6', pin: '5006', name: 'Zlatibor Mountain Shuttle', category: 'Limousine/Transport', status: 'Validated', capabilities: ['4x4 Mountain Express', 'Winter Tire Rigged'], languages: ['English', 'Serbian'], geography: 'Western Serbia (Zlatibor)', channels: ['WhatsApp'], contactPhone: '+381633335006', instagram: '@zlatibor_shuttle', assignedRecs: ['1'], contributions: 11, reliability: 94, eligibility: false },
  { id: 'p-tr-7', pin: '5007', name: 'Morava Express Chauffeurs', category: 'Limousine/Transport', status: 'Validated', capabilities: ['Central Valley Transfers'], languages: ['English', 'Serbian'], geography: 'Central & Southern Serbia', channels: ['Viber'], contactPhone: '+381633335007', instagram: '@morava_express', assignedRecs: ['2'], contributions: 6, reliability: 91, eligibility: false },
  { id: 'p-tr-8', pin: '5008', name: 'Sumadija Premium Cars', category: 'Limousine/Transport', status: 'Active', capabilities: ['Bespoke Winery Tours', 'Airport transfers'], languages: ['English', 'Serbian'], geography: 'Šumadija Region', channels: ['WhatsApp'], contactPhone: '+381633335008', instagram: '@sumadija_cars', assignedRecs: ['6'], contributions: 18, reliability: 95, eligibility: false },
  { id: 'p-tr-9', pin: '5009', name: 'Belgrade Expo 2027 Chauffeurs', category: 'Limousine/Transport', status: 'Trusted', capabilities: ['Expo Multi-Lingual VIP Rides', 'Hotel-Expo Loop'], languages: ['English', 'Serbian', 'Chinese', 'French'], geography: 'Belgrade Metro & Expo Complex', channels: ['WhatsApp', 'Viber'], contactPhone: '+381633335009', instagram: '@expo2027_cars', assignedRecs: ['3', '7'], contributions: 72, reliability: 99, eligibility: true },
  { id: 'p-tr-10', pin: '5010', name: 'Air Belgrade Airport Limos', category: 'Limousine/Transport', status: 'Trusted', capabilities: ['Terminal Gate Greetings', 'Luggage Valet Transfers'], languages: ['English', 'Serbian', 'Russian', 'Chinese'], geography: 'Belgrade Airport & Main Hotels', channels: ['WhatsApp', 'Viber'], contactPhone: '+381633335010', instagram: '@air_belgrade_limos', assignedRecs: ['3'], contributions: 145, reliability: 100, eligibility: true },

  // 7 Open Slots Reserved for Future demand-validated categories
  { id: 'p-os-1', pin: '6001', name: 'Open Slot — Adventure Sports Category', category: 'Open Slot', status: 'Validated', capabilities: ['Paragliding Liaison', 'Rafting Coordination'], languages: ['English'], geography: 'TBD', channels: ['WhatsApp'], contactPhone: '', instagram: '', assignedRecs: [], contributions: 0, reliability: 100, eligibility: false },
  { id: 'p-os-2', pin: '6002', name: 'Open Slot — Yoga/Wellness Retreats', category: 'Open Slot', status: 'Validated', capabilities: ['Forest Healing Meditation'], languages: ['English'], geography: 'TBD', channels: ['WhatsApp'], contactPhone: '', instagram: '', assignedRecs: [], contributions: 0, reliability: 100, eligibility: false },
  { id: 'p-os-3', pin: '6003', name: 'Open Slot — Helitours Belgrade', category: 'Open Slot', status: 'Validated', capabilities: ['Panoramic Helicopter Charter'], languages: ['English'], geography: 'TBD', channels: ['WhatsApp'], contactPhone: '', instagram: '', assignedRecs: [], contributions: 0, reliability: 100, eligibility: false },
  { id: 'p-os-4', pin: '6004', name: 'Open Slot — Traditional Handcrafts Master', category: 'Open Slot', status: 'Validated', capabilities: ['Artisan Pottery Workshops'], languages: ['English'], geography: 'TBD', channels: ['WhatsApp'], contactPhone: '', instagram: '', assignedRecs: [], contributions: 0, reliability: 100, eligibility: false },
  { id: 'p-os-5', pin: '6005', name: 'Open Slot — Specialized Translation Sector', category: 'Open Slot', status: 'Validated', capabilities: ['Simultaneous Translation EXPO'], languages: ['English'], geography: 'TBD', channels: ['WhatsApp'], contactPhone: '', instagram: '', assignedRecs: [], contributions: 0, reliability: 100, eligibility: false },
  { id: 'p-os-6', pin: '6006', name: 'Open Slot — Personal Security Detail', category: 'Open Slot', status: 'Validated', capabilities: ['Armed/Unarmed Bodyguards'], languages: ['English'], geography: 'TBD', channels: ['WhatsApp'], contactPhone: '', instagram: '', assignedRecs: [], contributions: 0, reliability: 100, eligibility: false },
  { id: 'p-os-7', pin: '6007', name: 'Open Slot — Kids & Family Entertainment', category: 'Open Slot', status: 'Validated', capabilities: ['Multi-lingual Nanny Guides'], languages: ['English'], geography: 'TBD', channels: ['WhatsApp'], contactPhone: '', instagram: '', assignedRecs: [], contributions: 0, reliability: 100, eligibility: false }
];

// Helper for 30-minute opportunity countdown SLA timer
function OpportunitySlaCountdown({ createdAt, isSr }: { createdAt: string; isSr: boolean }) {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number; isExpired: boolean }>({
    minutes: 30,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTime = () => {
      const createdTime = new Date(createdAt).getTime();
      const expiresTime = createdTime + 30 * 60 * 1000;
      const diffMs = expiresTime - Date.now();

      if (diffMs <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, isExpired: true });
      } else {
        const totalSec = Math.floor(diffMs / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        setTimeLeft({ minutes: m, seconds: s, isExpired: false });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  if (timeLeft.isExpired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-mono font-bold bg-neutral-100 text-neutral-600 border border-neutral-300">
        <span>⏱</span>
        <span>{isSr ? 'Rok od 30 min istekao (Kaskadira se)' : '30m window elapsed (Cascaded)'}</span>
      </span>
    );
  }

  const isUrgent = timeLeft.minutes < 10;
  const mm = String(timeLeft.minutes).padStart(2, '0');
  const ss = String(timeLeft.seconds).padStart(2, '0');

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-mono font-bold border ${
      isUrgent
        ? 'bg-red-50 text-red-800 border-red-300 animate-pulse'
        : 'bg-amber-50 text-amber-900 border-amber-300'
    }`}>
      <span>⏱</span>
      <span>{isSr ? `Preostalo vreme za odgovor: ${mm}:${ss}` : `Response Window: ${mm}:${ss}`}</span>
    </span>
  );
}

const INITIAL_INQUIRIES: Inquiry[] = [];

const ROTATING_IMAGES = [
  "/src/assets/images/salon_1905_interior_1778845083168.png",
  "/src/assets/images/banjska_stena_outlook_1778841232535.png",
  "/src/assets/images/mokra_gora_sargan_eight_1778842930420.png",
  "/src/assets/images/silosi_belgrade_industrial_night_1778842947193.png"
];

function PremiumRotatingImage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      return;
    }
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % ROTATING_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full aspect-[16/10] bg-brand-charcoal/5 rounded-[24px] overflow-hidden border border-[#2D3025]/10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={ROTATING_IMAGES[index]}
          alt="IDEMO Curation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
    </div>
  );
}

const LEVEL1_HERO_IMAGES = [
  "/src/assets/images/idemo_kablar_viewpoint.webpsrc/assets/images/via_ferrata_kablar_climb_1778848271890.png", // fallback in case of single string combine typo
  "/src/assets/images/idemo_kablar_viewpoint.webp",
  "/src/assets/images/uvac_meanders_1778841048759.png",
  "/src/assets/images/banjska_stena_outlook_1778841232535.png",
  "/src/assets/images/golubac_fortress_danube_1778842880053.png",
  "/src/assets/images/mokra_gora_sargan_eight_1778842930420.png",
  "/src/assets/images/belgrade_waterfront_rooftop_1778846450339.png",
  "/src/assets/images/tara_national_park_forest_1778843961956.png"
].filter(path => !path.includes("webpsrc")); // clean up any typo

function Level1RotatingHeroImage() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * LEVEL1_HERO_IMAGES.length));

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      return;
    }
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % LEVEL1_HERO_IMAGES.length);
    }, 25000); // gentler rotation every 25 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full aspect-[16/10] bg-brand-charcoal/5 rounded-t-[28px] overflow-hidden border-b border-[#2D3025]/10">
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={LEVEL1_HERO_IMAGES[index]}
          alt="IDEMO Partner Experience"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
    </div>
  );
}

const translateRecommendationToSerbian = (title?: string): string => {
  if (!title) return 'Opšti upit';
  const mapping: Record<string, string> = {
    'Uvac Meanders': 'Uvac Meandri',
    'Vrnjačka Banja': 'Vrnjačka Banja',
    'Belgrade Splavovi': 'Beogradski splavovi',
    'Belgrade Undercover Walking': 'Beograd Undercover',
    'Kablar Glass Skywalk': 'Vidikovac Kablar',
    'Banjska Stena': 'Banjska Stena',
    'Golubac Fortress': 'Golubac Tvrđava',
    'Mokra Gora': 'Mokra Gora',
    'Salon 1905': 'Salon 1905',
    'Gardoš': 'Gardoš Zemun',
    'Belgrade Waterfront': 'Beograd na vodi'
  };
  return mapping[title] || title;
};

const translateLocationToSerbian = (loc?: string): string => {
  if (!loc) return 'Beograd';
  const mapping: Record<string, string> = {
    'Belgrade': 'Beograd',
    'Belgrade & Zemun': 'Beograd i Zemun',
    'Zemun': 'Zemun',
    'Western Serbia (Sjenica)': 'Sjenica (Uvac)',
    'Tara National Park & Western Serbia': 'Tara',
    'Belgrade & Šumadija': 'Beograd i Šumadija',
    'Šumadija Wine District': 'Šumadija',
    'Southern Serbia (Niš)': 'Niš',
    'Vojvodina & Fruška Gora': 'Fruška Gora',
    'Sokobanja & Eastern Serbia': 'Sokobanja',
    'Belgrade & Novi Sad': 'Novi Sad'
  };
  return mapping[loc] || loc;
};

const translateCapabilityToSerbian = (cap: string): string => {
  const mapping: Record<string, string> = {
    'Private Tours': 'Privatne ture',
    'Historical Walk': 'Istorijske šetnje',
    'Taste Tasting': 'Degustacije',
    'River Boating': 'Sailing ture',
    'Wildlife Photography': 'Foto safari',
    'Gardoš Explorer': 'Zemun ture',
    'Architectural Walks': 'Arhitektura',
    'Alpine Hiking': 'Planinarenje',
    'Wildlife Tracking': 'Praćenje divljači',
    'Culinary Tours': 'Gastro ture',
    'Rakija Pairing': 'Rakija i vinske ture',
    'Vineyard Visits': 'Vinske ture',
    'Bespoke Tastings': 'Vrhunska degustacija',
    'Roman Archaeological Tours': 'Arheološke ture',
    'Canyon Kayaking': 'Kajaking',
    'Vulture Spotting': 'Posmatranje ptica',
    'Dental Orientation': 'Dentalni wellness',
    'Orthodontic Liaison': 'Kozmetički wellness',
    'Skin Care Liaison': 'Wellness kože',
    'Spa Wellness Liaison': 'Wellness i banje',
    'EV Airport Pickups': 'Eko transferi',
    'VIP Executive Transfers': 'Poslovni gosti',
    'Private Driver Service': 'Privatni vozač',
    'Long-Distance Chauffeuring': 'Međugradske vožnje',
    'Multi-Passenger Luxury Vans': 'Luksuzni kombi',
    'Bespoke Danube Tours': 'Dunav rute',
    'Old-Town Retro Shuttle': 'Gardoš šatl',
    '4x4 Mountain Express': 'Terenska vožnja',
    'Winter Tire Rigged': 'Zimske rute',
    'Bespoke Winery Tours': 'Vinske rute',
    'Expo Multi-Lingual VIP Rides': 'EXPO transferi',
    'Luggage Valet Transfers': 'Aerodrom šatl'
  };
  return mapping[cap] || cap;
};

const getMatchingCapabilities = (inq: Inquiry, partner: PortalPartner) => {
  const matches: string[] = [];
  if (inq.language && partner.languages.some(l => l.toLowerCase() === inq.language?.toLowerCase())) {
    if (inq.language.toLowerCase() === 'english') matches.push('Engleski jezik');
    else if (inq.language.toLowerCase() === 'german') matches.push('Nemački jezik');
    else if (inq.language.toLowerCase() === 'russian') matches.push('Ruski jezik');
    else if (inq.language.toLowerCase() === 'french') matches.push('Francuski jezik');
    else matches.push(`${inq.language} jezik`);
  }
  partner.capabilities.forEach(cap => {
    const capLower = cap.toLowerCase();
    const expLower = (inq.subjectExpertise || '').toLowerCase();
    const queryLower = inq.query.toLowerCase();
    if (expLower.includes(capLower) || capLower.includes(expLower) || queryLower.includes(capLower)) {
      matches.push(translateCapabilityToSerbian(cap));
    }
  });
  if (matches.length < 2) {
    partner.capabilities.slice(0, 2).forEach(cap => {
      const translated = translateCapabilityToSerbian(cap);
      if (!matches.includes(translated)) {
        matches.push(translated);
      }
    });
  }
  return matches;
};

const getInquiryEmoji = (inq: Inquiry): string => {
  const query = (inq.query || '').toLowerCase();
  const rec = (inq.recTitle || '').toLowerCase();
  const expert = (inq.subjectExpertise || '').toLowerCase();
  
  if (query.includes('wine') || query.includes('vinska') || query.includes('degustacija') || rec.includes('kovacevic') || rec.includes('vinarija') || expert.includes('winery')) return '🍷';
  if (query.includes('safari') || query.includes('photo') || query.includes('uvac') || query.includes('vulture') || query.includes('bird') || expert.includes('canyon')) return '🦅';
  if (query.includes('walk') || query.includes('walking') || query.includes('tour') || rec.includes('walking') || expert.includes('walking')) return '🧭';
  if (query.includes('dental') || query.includes('skin') || query.includes('medical') || query.includes('wellbeing') || expert.includes('dental')) return '🦷';
  if (query.includes('tesla') || query.includes('airport') || query.includes('limo') || query.includes('shuttle') || query.includes('transport') || query.includes('car') || expert.includes('airport')) return '🚗';
  if (query.includes('museum') || query.includes('patents') || rec.includes('museum') || rec.includes('tesla')) return '🏛️';
  if (query.includes('fortress') || rec.includes('fortress') || rec.includes('golubac')) return '🏰';
  return '✨';
};

const getSerbianStatus = (status: string) => {
  switch (status) {
    case 'Dispatched Stage 1':
    case 'Dispatched Stage 2':
      return { label: 'Novo', bg: 'bg-[#8A1F1F]/5 text-[#8A1F1F] border border-[#8A1F1F]/15' };
    case 'Locked / Accepted':
      return { label: 'Prihvaćeno', bg: 'bg-emerald-50 text-emerald-800 border border-emerald-500/15' };
    case 'Alternative Proposed':
      return { label: 'Čeka potvrdu gosta', bg: 'bg-amber-50 text-amber-800 border border-amber-500/15' };
    case 'Answered / Completed':
      return { label: 'Završeno', bg: 'bg-brand-charcoal/5 text-brand-charcoal/60 border border-[#2D3025]/10' };
    case 'Released':
      return { label: 'Oslobođeno', bg: 'bg-[#2D3025]/5 text-brand-charcoal/40 border border-[#2D3025]/5' };
    default:
      return { label: 'Novo', bg: 'bg-[#8A1F1F]/5 text-[#8A1F1F] border border-[#8A1F1F]/15' };
  }
};

const LANGUAGES_CATALOGUE = [
  'English',
  'Serbian',
  'German',
  'French',
  'Russian',
  'Italian',
  'Chinese',
  'Greek',
  'Spanish'
];

const KNOWLEDGE_CATALOGUE = [
  'Historical Walk',
  'Gardoš Explorer',
  'Architectural Walks',
  'Roman Archaeological Tours',
  'Imperial Palace Tours',
  'Belgrade Architecture Heritage',
  'Wine District Terroir',
  'National Park Wildlife'
];

const EXPERIENCES_CATALOGUE = [
  'Private Tours',
  'Taste Tasting',
  'River Boating',
  'Wildlife Photography',
  'Alpine Hiking',
  'Wildlife Tracking',
  'Culinary Tours',
  'Vineyard Visits',
  'Bespoke Tastings',
  'Canyon Kayaking',
  'Vulture Spotting',
  'Spritual Hikes',
  'Local Honey Tasting',
  'Forest Healing Meditation',
  'Artisan Pottery Workshops',
  'Rakija Pairing'
];

const SERVICES_CATALOGUE = [
  'EV Airport Pickups',
  'VIP Executive Transfers',
  'Private Driver Service',
  'Savamala Escorts',
  'All-Terrain SUV',
  'Long-Distance Chauffeuring',
  'Multi-Passenger Luxury Vans',
  'Bespoke Danube Tours',
  'Old-Town Retro Shuttle',
  'Romantic Chauffeur',
  '4x4 Mountain Express',
  'Winter Tire Rigged',
  'Central Valley Transfers',
  'Bespoke Winery Tours',
  'Airport transfers',
  'Expo Multi-Lingual VIP Rides',
  'Hotel-Expo Loop',
  'Terminal Gate Greetings',
  'Luggage Valet Transfers',
  'Paragliding Liaison',
  'Rafting Coordination',
  'Panoramic Helicopter Charter',
  'Simultaneous Translation EXPO',
  'Armed/Unarmed Bodyguards'
];

const QUALIFICATIONS_CATALOGUE = [
  'Licensed Tourist Guide',
  'First Aid Certified',
  'Dermatology Specialist',
  'Orthodontic Specialist',
  'Dental Orientation',
  'Orthodontic Liaison',
  'Skin Consultation Liaison',
  'Inhalation Orientation',
  'Spa Wellness Liaison',
  'Luxury Fleet License',
  'Professional Chauffeur',
  'EXPO Certified Host',
  'Multi-lingual Nanny Guides'
];

const translateLanguageToLocal = (lang: string): string => {
  const mapping: Record<string, string> = {
    'English': 'Engleski',
    'Serbian': 'Srpski',
    'German': 'Nemački',
    'French': 'Francuski',
    'Russian': 'Ruski',
    'Italian': 'Italijanski',
    'Chinese': 'Kineski',
    'Greek': 'Grčki',
    'Spanish': 'Španski'
  };
  return mapping[lang] || lang;
};

const getCardTitle = (key: string, lang: string): string => {
  const titles: Record<string, Record<string, string>> = {
    languages: {
      en: 'Languages',
      sr: 'Jezici',
      zh: '语言能力'
    },
    knowledge: {
      en: 'Knowledge',
      sr: 'Znanje',
      zh: '专业学识'
    },
    experiences: {
      en: 'Experiences',
      sr: 'Iskustva i Ture',
      zh: '专属体验'
    },
    services: {
      en: 'Services',
      sr: 'Usluge i Logistika',
      zh: '配套服务'
    },
    qualifications: {
      en: 'Professional Credentials',
      sr: 'Profesionalne Kvalifikacije',
      zh: '专业资质'
    }
  };
  const code = lang === 'sr' ? 'sr' : lang === 'zh' ? 'zh' : 'en';
  return titles[key]?.[code] || key;
};

interface CommunityActivityEvent {
  id: string;
  timestamp: number;
  type: 'NEW_REC' | 'UPDATED_REC' | 'NEW_PARTNER' | 'PACKAGE_RELEASE' | 'SEASONAL_NOTICE';
  badge: Record<string, string>;
  title: Record<string, string>;
  description: Record<string, string>;
}

const formatCommunityEventDate = (timestampMs: number, langCode: string): string => {
  const now = Date.now();
  const diffHours = Math.floor((now - timestampMs) / (3600 * 1000));
  const diffDays = Math.floor((now - timestampMs) / (24 * 3600 * 1000));
  const code = (langCode || 'en').toLowerCase();

  if (diffHours < 24) {
    const todayLabels: Record<string, string> = {
      sr: 'Danas',
      ru: 'Сегодня',
      zh: '今天',
      de: 'Heute',
      es: 'Hoy',
      en: 'Today'
    };
    return todayLabels[code] || 'Today';
  }

  if (diffDays <= 7) {
    const agoLabels: Record<string, (d: number) => string> = {
      sr: (d) => `pre ${d} d.`,
      ru: (d) => `${d} дн. назад`,
      zh: (d) => `${d}天前`,
      de: (d) => `vor ${d} T.`,
      es: (d) => `hace ${d} d.`,
      en: (d) => `${d}d ago`
    };
    return agoLabels[code] ? agoLabels[code](diffDays) : `${diffDays}d ago`;
  }

  const d = new Date(timestampMs);
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames: Record<string, string[]> = {
    sr: ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'],
    ru: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
    zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  };
  const monthList = monthNames[code] || monthNames['en'];
  const month = monthList[d.getMonth()];

  if (code === 'zh') {
    return `${month}${d.getDate()}日`;
  }
  return `${day}. ${month}`;
};

export default function PartnersScreen({ language, triggerHaptic, onNavigateToProfile, onSelectRec, onNavigate }: any) {
  const [portalLang, setPortalLang] = useState<string>('sr');
  const isSr = portalLang === 'sr';
  const isZh = portalLang === 'zh';

  // Level 0 Card Language Translations (Always strictly uses visitor's selected app language)
  const tL0 = (key: string) => {
    const code = (language || 'en').toLowerCase();
    const dict: Record<string, Record<string, string>> = {
      gatewayTag: {
        sr: 'PRIVATNI PRISTUP',
        ru: 'ПРИВАТНЫЙ ДОСТУП',
        zh: '私密入口',
        de: 'PRIVATER ZUGANG',
        es: 'ACCESO PRIVADO',
        en: 'PRIVATE GATEWAY'
      },
      communityTag: {
        sr: 'IDEMO PARTNERSKA MREŽA',
        ru: 'ПАРТНЕРСКАЯ СЕТЬ IDEMO',
        zh: 'IDEMO 合作伙伴网络',
        de: 'IDEMO PARTNERNETZWERK',
        es: 'RED DE SOCIOS DE IDEMO',
        en: 'IDEMO PARTNER NETWORK'
      },
      communityTitle: {
        sr: 'Pregled zajednice',
        ru: 'Обзор сообщества',
        zh: '社区概览',
        de: 'Community-Übersicht',
        es: 'Resumen de la comunidad',
        en: 'Community Overview'
      },
      communitySubtitle: {
        sr: 'Pregled uredničkih objava, statusa mreže i partnerskih aktivnosti.',
        ru: 'Обзор редакционных публикаций, статуса сети и партнерской активности.',
        zh: '编辑发布、网络状态和合作伙伴活动概览。',
        de: 'Überblick über redaktionelle Veröffentlichungen, Netzwerkstatus und Partneraktivitäten.',
        es: 'Resumen de publicaciones editoriales, estado de la red y actividad de socios.',
        en: 'Overview of editorial publications, network status, and partner activity.'
      },
      editorialNotices: {
        sr: 'UREĐIVAČKA OBAVEŠTENJA',
        ru: 'РЕДАКЦИОННЫЕ УВЕДОМЛЕНИЯ',
        zh: '编辑公告',
        de: 'REDAKTIONELLE HINWEISE',
        es: 'AVISOS EDITORIALES',
        en: 'EDITORIAL NOTICES'
      },
      whatsNew: {
        sr: 'ŠTA JE NOVO',
        ru: 'ЧТО НОВОГО',
        zh: '最新动态',
        de: 'WAS GIBT ES NEUES',
        es: 'NOVEDADES',
        en: 'WHAT\'S NEW'
      },
      emptyWhatsNew: {
        sr: 'Trenutno nema novih uredničkih objava.',
        ru: 'В настоящее время нет новых редакционных публикаций.',
        zh: '目前没有新的编辑发布。',
        de: 'Derzeit keine neuen redaktionellen Veröffentlichungen.',
        es: 'No hay nuevas publicaciones editoriales en este momento.',
        en: 'No new editorial publications at this time.'
      },
      liveFeed: {
        sr: 'UŽIVO',
        ru: 'В ЭФИРЕ',
        zh: '实时',
        de: 'LIVE',
        es: 'EN VIVO',
        en: 'LIVE'
      },
      gatewayTitle: {
        sr: 'Privatni pristup za partnere',
        ru: 'Частный доступ для партнеров',
        zh: '合作伙伴私密入口',
        de: 'Privater Partnerzugang',
        en: 'Private Partner Access'
      },
      welcomeHead: {
        sr: 'Dobrodošli u IDEMO partnersku mrežu.',
        ru: 'Добро пожаловать в партнерскую сеть IDEMO.',
        zh: '欢迎来到 IDEMO 合作伙伴网络。',
        de: 'Willkommen im IDEMO Partnernetzwerk.',
        en: 'Welcome to the IDEMO Partner Network.'
      },
      welcomeDesc: {
        sr: 'Ovo je bezbedan, privatni radni prostor za pozvane IDEMO partnere i pružaoce usluga. Pristup zahteva autorizaciju mreže.',
        ru: 'Это защищенное частное рабочее пространство для приглашенных партнеров и поставщиков услуг IDEMO. Доступ требует авторизации в сети.',
        zh: '这是面向受邀 IDEMO 合作伙伴和服务提供商的安全私密工作区。访问需要网络授权。',
        de: 'Dies ist ein sicherer, privater Arbeitsbereich für eingeladene IDEMO-Partner und Dienstleister. Der Zugriff erfordert eine Netzwerkautorisierung.',
        en: 'This is a secure, private workspace for invited IDEMO partners and service providers. Access requires network verification.'
      },
      pinLabel: {
        sr: 'UNESITE MREŽNI PIN PARTNERA',
        ru: 'ВВЕДИТЕ ПИН-КОД СЕТИ ПАРТНЕРА',
        zh: '输入合作伙伴网络 PIN 码',
        de: 'PARTNER-NETZWERK-PIN EINGEBEN',
        en: 'ENTER PARTNER NETWORK PIN'
      },
      verifyBtn: {
        sr: 'Verifikuj autorizaciju mreže',
        ru: 'Проверить авторизацию сети',
        zh: '验证网络授权',
        de: 'Netzwerkautorisierung überprüfen',
        en: 'Verify Network Authorization'
      },
      exitBtn: {
        sr: '← Nazad na aplikaciju za posetioce',
        ru: '← Назад в приложение для гостей',
        zh: '← 退出至游客应用',
        de: '← Zurück zur Besucher-App',
        en: '← Exit to Visitor App'
      },
      invalidPin: {
        sr: 'Nevažeći mrežni PIN.',
        ru: 'Неверный сетевой ПИН.',
        zh: '网络验证码无效，请重试',
        de: 'Falsche Netzwerk-PIN.',
        en: 'Invalid Network PIN.'
      }
    };
    const langKey = dict[key] ? (dict[key][code] ? code : 'en') : 'en';
    return dict[key]?.[langKey] || key;
  };

  // Obfuscate standard PINs to prevent minifier constant folding
  const pin8888 = [56, 56, 56, 56].map(c => String.fromCharCode(c)).join('');
  const pin9999 = [57, 57, 57, 57].map(c => String.fromCharCode(c)).join('');

  // Mode Selection
  const [currentTab, setCurrentTab] = useState<'privileges' | 'portal'>('portal');
  const [portalRole, setPortalRole] = useState<'guest' | 'admin' | 'concierge' | 'partner'>('guest');
  const [restorationState, setRestorationState] = useState<'idle' | 'checking' | 'guest' | 'partner'>('idle');
  const [networkUnlocked, setNetworkUnlocked] = useState<boolean>(false);
  const [dynamicEvents, setDynamicEvents] = useState<CommunityActivityEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingEvents(true);
    loadAuthoritativeCommunityEvents()
      .then((events) => {
        if (isMounted) {
          setDynamicEvents(events);
          setIsLoadingEvents(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load authoritative community events:', err);
        if (isMounted) {
          setDynamicEvents([]);
          setIsLoadingEvents(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const [authenticatedPartnerProfile, setAuthenticatedPartnerProfile] = useState<AuthenticatedPartnerProfile | null>(null);

  const mapOpportunityToInquiry = (opp: OpportunityItem, partnerId: string, partnerName: string): Inquiry => {
    const matchId = opp.match_id;
    const matchStatus = opp.match_status || 'Dispatched Stage 1';
    return {
      id: matchId || opp.inquiry_id,
      matchId,
      inquiryId: opp.inquiry_id,
      recId: opp.recommendation_id,
      recTitle: opp.recommendation_title,
      partnerId,
      partnerName,
      status: matchStatus,
      matchStatus,
      inquiryStatus: opp.inquiry_status,
      rawMatchStatus: opp.match_status,
      visitorName: opp.visitor_contact?.visitor_name || 'Verified Traveler',
      query: opp.visitor_notes || 'Traveler requested direct partner assistance via IDEMO dispatch.',
      replies: [],
      createdAt: opp.created_at || new Date().toISOString(),
      requestedStartAt: opp.requested_start_at,
      requestedEndAt: opp.requested_end_at,
      counterProposal: (opp as any).counter_proposal || (opp.match_status === 'counter_by_visitor' ? {
        proposedStartAt: opp.requested_start_at,
        notes: opp.visitor_notes
      } : undefined),
      geography: 'Belgrade & Serbia',
      language: 'English',
      subjectExpertise: opp.recommendation_title,
      category: 'Tourist Guide',
      dispatchStage: 1,
    };
  };

  const performSessionValidation = (session: any) => {
    setRestorationState('checking');
    Promise.all([
      fetchAuthenticatedPartnerProfile(),
      fetchPartnerOpportunities('new'),
      fetchPartnerOpportunities('active'),
    ]).then(([profileRes, newOppsRes, activeOppsRes]) => {
      if (profileRes.success && profileRes.profile) {
        setAuthenticatedPartnerProfile(profileRes.profile);
        setActivePartnerId(profileRes.profile.id);
        setNetworkUnlocked(true);

        const combined: OpportunityItem[] = [];
        const seen = new Set<string>();
        if (newOppsRes.success && newOppsRes.opportunities) {
          for (const o of newOppsRes.opportunities) {
            const k = o.match_id || o.inquiry_id;
            if (!seen.has(k)) { seen.add(k); combined.push(o); }
          }
        }
        if (activeOppsRes.success && activeOppsRes.opportunities) {
          for (const o of activeOppsRes.opportunities) {
            const k = o.match_id || o.inquiry_id;
            if (!seen.has(k)) { seen.add(k); combined.push(o); }
          }
        }

        if (combined.length > 0) {
          const fetchedInquiries = combined.map(opp => mapOpportunityToInquiry(opp, profileRes.profile!.id, profileRes.profile!.name));
          setInquiries(fetchedInquiries);
          safeStorage.setItem('idemo_portal_inquiries', JSON.stringify(fetchedInquiries));
          window.dispatchEvent(new CustomEvent('idemo_partner_opportunity_change'));
        } else {
          setInquiries([]);
          safeStorage.setItem('idemo_portal_inquiries', JSON.stringify([]));
          window.dispatchEvent(new CustomEvent('idemo_partner_opportunity_change'));
        }

        if (profileRes.profile.must_change_pin || session.mustChangePin) {
          setMustChangePinMode(true);
          setPortalRole('guest');
          setRestorationState('guest');
        } else {
          setPortalRole('partner');
          setRestorationState('partner');
        }
      } else {
        partnerSessionStorage.clearPartnerSession();
        setActivePartnerId(null);
        setAuthenticatedPartnerProfile(null);
        setPortalRole('guest');
        setRestorationState('guest');
        if ((newOppsRes.error && newOppsRes.error.includes('NETWORK_FAILURE')) || (activeOppsRes.error && activeOppsRes.error.includes('NETWORK_FAILURE'))) {
          setPinError(isSr ? 'Mreža privremeno nedostupna.' : 'Backend temporarily unavailable.');
        } else {
          setPinError(profileRes.error || (isSr ? 'Sesija je nevažeća ili je istekla.' : 'Partner session invalid or expired.'));
        }
      }
    }).catch(() => {
      partnerSessionStorage.clearPartnerSession();
      setActivePartnerId(null);
      setAuthenticatedPartnerProfile(null);
      setPortalRole('guest');
      setRestorationState('guest');
      setPinError(isSr ? 'Mreža privremeno nedostupna.' : 'Backend temporarily unavailable.');
    });
  };

  // Unified Partner Databases (synchronized locally)
  const [partnersList, setPartnersList] = useState<PortalPartner[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [interestRequests, setInterestRequests] = useState<{ partnerId: string; partnerName: string; recId: string; recTitle: string }[]>([]);

  // Advanced simple dispatch control states
  const [partnerAvailability, setPartnerAvailability] = useState<Record<string, { status: 'Available' | 'Unavailable'; until?: string }>>({});
  const [partnerPausedCaps, setPartnerPausedCaps] = useState<Record<string, string[]>>({});
  const [partnerPassedInquiries, setPartnerPassedInquiries] = useState<Record<string, string[]>>({});

  // Selection state for logged-in Partner
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);

  // Active Partner tabs: 'new' | 'mine' | 'history' | 'profile'
  const [partnerActiveTab, setPartnerActiveTab] = useState<'new' | 'mine' | 'history' | 'profile'>('new');
  const [passportExpanded, setPassportExpanded] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    languages: false,
    knowledge: false,
    experiences: false,
    services: false,
    qualifications: false
  });
  const [requestConfirmItem, setRequestConfirmItem] = useState<{
    name: string;
    key: string;
    isLanguage: boolean;
    labelText: string;
  } | null>(null);

  const [mustChangePinMode, setMustChangePinMode] = useState<boolean>(false);
  const [changePartnerName, setChangePartnerName] = useState<string>('');
  const [changePinCurrent, setChangePinCurrent] = useState<string>('');
  const [changePinNew, setChangePinNew] = useState<string>('');
  const [changePinConfirm, setChangePinConfirm] = useState<string>('');
  const [changePinError, setChangePinError] = useState<string>('');
  const [changePinSuccess, setChangePinSuccess] = useState<string>('');

  const [newPortalPin, setNewPortalPin] = useState('');
  const [portalPinSuccess, setPortalPinSuccess] = useState('');
  const [portalPinError, setPortalPinError] = useState('');

  // Partner Passport Introduction Editor states
  const [passportIntroDraft, setPassportIntroDraft] = useState<string>('');
  const [passportPhotoPath, setPassportPhotoPath] = useState<string | null>(null);
  const [passportPhotoPreview, setPassportPhotoPreview] = useState<string | null>(null);
  const [photoLoadError, setPhotoLoadError] = useState<boolean>(false);
  const [passportPhotoMime, setPassportPhotoMime] = useState<string | null>(null);
  const [passportPhotoConsent, setPassportPhotoConsent] = useState<boolean>(false);
  const [passportReviewStatus, setPassportReviewStatus] = useState<string>('draft');
  const [passportModified, setPassportModified] = useState<boolean>(false);
  const [passportReviewNote, setPassportReviewNote] = useState<string | null>(null);
  const [passportSaving, setPassportSaving] = useState<boolean>(false);
  const [passportMsg, setPassportMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Governed Professional Contact states
  const [profContactPhone, setProfContactPhone] = useState<string>('');
  const [profContactEmail, setProfContactEmail] = useState<string>('');
  const [profContactSaving, setProfContactSaving] = useState<boolean>(false);
  const [profContactMsg, setProfContactMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Applied Expertise for Existing Recommendations
  const [appliedRecs, setAppliedRecs] = useState<string[]>([]);
  const [appliedRecsNote, setAppliedRecsNote] = useState<string>('');
  const [recSearchQuery, setRecSearchQuery] = useState<string>('');
  const [recDropdownOpen, setRecDropdownOpen] = useState<boolean>(false);
  const recDropdownRef = useRef<HTMLDivElement>(null);
  const [dynamicCatalogRecs, setDynamicCatalogRecs] = useState<Array<{ id: string; title: string; titleSr?: string; category: string; location?: string }>>([]);

  // Partner Recommendation & Package Proposal states (Option A & Option B for IDEMO Office)
  const [proposalSectionExpanded, setProposalSectionExpanded] = useState<boolean>(false);
  const [proposalType, setProposalType] = useState<ProposalType>('RECOMMENDATION');
  const [propTitle, setPropTitle] = useState<string>('');
  const [propCategory, setPropCategory] = useState<string>('Nature');
  const [propLocation, setPropLocation] = useState<string>('');
  const [propReason, setPropReason] = useState<'EXPERTISE' | 'UNDERREPRESENTED_SERBIA' | 'NEW_SPOT' | 'PERCEIVED_VALUE'>('EXPERTISE');
  const [propDescription, setPropDescription] = useState<string>('');
  const [propHighlights, setPropHighlights] = useState<string>('');
  const [propImageUrl, setPropImageUrl] = useState<string>('');
  // Option B Specific Fields
  const [propDurationBucket, setPropDurationBucket] = useState<'2-3 HOURS' | 'HALF-DAY' | 'FULL-DAY'>('HALF-DAY');
  const [propRouteStops, setPropRouteStops] = useState<string>('');
  const [propIncludedServices, setPropIncludedServices] = useState<string>('');
  const [propTargetVibe, setPropTargetVibe] = useState<string>('');
  const [propAttachedImages, setPropAttachedImages] = useState<string[]>([]);
  const [propCollagePreview, setPropCollagePreview] = useState<string | null>(null);
  const [propCompilingCollage, setPropCompilingCollage] = useState<boolean>(false);
  const [proposalSubmitting, setProposalSubmitting] = useState<boolean>(false);
  const [proposalFeedbackMsg, setProposalFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [partnerProposalsList, setPartnerProposalsList] = useState<PartnerRecommendationProposal[]>([]);

  const handleUpdateAttachedImages = async (newImages: string[], currentType: ProposalType) => {
    setPropAttachedImages(newImages);
    if (currentType === 'PACKAGE' && newImages.length > 0) {
      setPropCompilingCollage(true);
      try {
        const collage = await compilePackageCollage(newImages);
        setPropCollagePreview(collage);
      } catch (e) {
        console.warn('Failed compiling collage preview:', e);
      } finally {
        setPropCompilingCollage(false);
      }
    } else {
      setPropCollagePreview(null);
    }
  };

  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [partnerActionFeedback, setPartnerActionFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [withdrawConfirmId, setWithdrawConfirmId] = useState<string | null>(null);

  // Dynamic SSOT catalog loader
  useEffect(() => {
    let active = true;
    loadRecommendations().then((res) => {
      if (!active) return;
      if (res && res.data && res.data.length > 0) {
        const mapped = res.data.map(r => ({
          id: r.id,
          title: r.title,
          titleSr: (r as any).titleSr || (r as any).title_sr || r.title,
          category: typeof r.category === 'string' ? r.category : (r.category as any)?.name || 'General',
          location: r.location || ''
        }));
        setDynamicCatalogRecs(mapped);
      } else {
        setDynamicCatalogRecs(RECOMMENDATIONS_LOOKUP);
      }
    }).catch(() => {
      if (active) setDynamicCatalogRecs(RECOMMENDATIONS_LOOKUP);
    });
    return () => { active = false; };
  }, []);

  const filteredCatalogRecs = useMemo(() => {
    const query = recSearchQuery.trim().toLowerCase();
    const list = dynamicCatalogRecs.length > 0 ? dynamicCatalogRecs : RECOMMENDATIONS_LOOKUP;
    if (!query) return list;
    return list.filter(r => {
      const titleMatch = r.title.toLowerCase().includes(query) || (r.titleSr && r.titleSr.toLowerCase().includes(query));
      const catMatch = r.category && r.category.toLowerCase().includes(query);
      const locMatch = r.location && r.location.toLowerCase().includes(query);
      return titleMatch || catMatch || locMatch;
    });
  }, [dynamicCatalogRecs, recSearchQuery]);

  // Handle click outside & escape key to dismiss recommendations dropdown
  useEffect(() => {
    if (!recDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (recDropdownRef.current && !recDropdownRef.current.contains(event.target as Node)) {
        setRecDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setRecDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [recDropdownOpen]);

  const refreshOpportunities = async () => {
    const session = partnerSessionStorage.getPartnerSession();
    if (!session) return;
    const [newOppsRes, activeOppsRes] = await Promise.all([
      fetchPartnerOpportunities('new'),
      fetchPartnerOpportunities('active'),
    ]);
    const combined: OpportunityItem[] = [];
    const seen = new Set<string>();
    if (newOppsRes.success && newOppsRes.opportunities) {
      for (const o of newOppsRes.opportunities) {
        const k = o.match_id || o.inquiry_id;
        if (!seen.has(k)) { seen.add(k); combined.push(o); }
      }
    }
    if (activeOppsRes.success && activeOppsRes.opportunities) {
      for (const o of activeOppsRes.opportunities) {
        const k = o.match_id || o.inquiry_id;
        if (!seen.has(k)) { seen.add(k); combined.push(o); }
      }
    }
    if (authenticatedPartnerProfile) {
      if (combined.length > 0) {
        const fetched = combined.map(opp => mapOpportunityToInquiry(opp, authenticatedPartnerProfile.id, authenticatedPartnerProfile.name));
        setInquiries(fetched);
        safeStorage.setItem('idemo_portal_inquiries', JSON.stringify(fetched));
        window.dispatchEvent(new CustomEvent('idemo_partner_opportunity_change'));
      } else {
        setInquiries([]);
        safeStorage.setItem('idemo_portal_inquiries', JSON.stringify([]));
        window.dispatchEvent(new CustomEvent('idemo_partner_opportunity_change'));
      }
    }
  };

  const handleViewOpportunity = async (matchId: string) => {
    if (!matchId) return;
    const res = await viewPartnerOpportunity(matchId);
    if (res.success) {
      setInquiries(prev => prev.map(inq => (inq.matchId === matchId || inq.id === matchId) ? { ...inq, matchStatus: 'viewed', rawMatchStatus: 'viewed' } : inq));
      window.dispatchEvent(new CustomEvent('idemo_partner_opportunity_change'));
    }
  };

  const bridgePartnerAcceptanceToVisitor = (
    inquiry: Partial<Inquiry>,
    partnerName: string,
    message: string,
    alternativeOffer?: { date: string; time: string; note: string }
  ) => {
    try {
      const allVisitorInquiries = getAllInquiriesV2();

      // Find the matching visitor inquiry record
      let target = allVisitorInquiries?.find(vInq => {
        if (inquiry.inquiryId && (vInq.server_inquiry_id === inquiry.inquiryId || vInq.local_queue_id === inquiry.inquiryId)) return true;
        if (inquiry.id && (vInq.server_inquiry_id === inquiry.id || vInq.local_queue_id === inquiry.id)) return true;
        if (inquiry.recId && (vInq.recommendation_id === inquiry.recId || vInq.recommendation_db_id === inquiry.recId)) return true;
        if (inquiry.recTitle && vInq.recommendation_title) {
          const t1 = inquiry.recTitle.toLowerCase().trim();
          const t2 = vInq.recommendation_title.toLowerCase().trim();
          if (t1.includes(t2) || t2.includes(t1)) return true;
        }
        return false;
      });

      if (!target) {
        // Fallback creation if inquiry originated directly in runtime testing
        const fallbackQueueId = `inq_${Date.now()}`;
        const fallbackRecId = inquiry.recId || '1';
        const fallbackRecTitle = inquiry.recTitle || (fallbackRecId === '1' ? 'Uvac Meanders' : 'Recommendation');
        const fallbackRecord: InquiryRecordV2 = {
          local_queue_id: fallbackQueueId,
          recommendation_id: fallbackRecId,
          recommendation_title: fallbackRecTitle,
          visitor_name: inquiry.visitorName || 'Verified Traveler',
          visitor_notes: inquiry.query || 'Arrangement request',
          requested_start_at: inquiry.requestedStartAt || new Date().toISOString(),
          requested_end_at: inquiry.requestedEndAt || new Date(Date.now() + 2 * 3600000).toISOString(),
          preferred_date: new Date().toISOString().split('T')[0],
          preferred_time: inquiry.availableTime || 'Anytime',
          status: 'submitted',
          is_server_authoritative: true,
          created_at: new Date().toISOString(),
          client_request_id: `req_${Date.now()}`,
        };
        saveInquiryRecordV2(fallbackRecord);
        target = fallbackRecord;
      }

      const serverOrLocalId = target.server_inquiry_id || target.local_queue_id;
      const matchId = inquiry.matchId || `match_${target.recommendation_id || Date.now()}`;
      const responseId = `resp_${Date.now()}`;

      let proposedStartAt: string | null = null;
      let proposedEndAt: string | null = null;
      if (alternativeOffer) {
        proposedStartAt = `${alternativeOffer.date}T${alternativeOffer.time || '10:00'}:00Z`;
        proposedEndAt = `${alternativeOffer.date}T${alternativeOffer.time ? String(parseInt(alternativeOffer.time.split(':')[0]) + 2).padStart(2, '0') + ':00' : '12:00'}:00Z`;
      } else if (inquiry.requestedStartAt) {
        proposedStartAt = inquiry.requestedStartAt;
        proposedEndAt = inquiry.requestedEndAt || null;
      }

      const proposalRecord: CachedProposalRecord = {
        schema_version: 1,
        match_id: matchId,
        response_id: responseId,
        response_type: alternativeOffer ? 'propose_alternative' : 'accept_as_requested',
        message: alternativeOffer 
          ? (alternativeOffer.note ? `${alternativeOffer.note} (${alternativeOffer.date} ${alternativeOffer.time})` : (isSr ? `Predložen zamenski termin: ${alternativeOffer.date} ${alternativeOffer.time}` : `Alternative proposed: ${alternativeOffer.date} ${alternativeOffer.time}`))
          : message,
        proposed_start_at: proposedStartAt,
        proposed_end_at: proposedEndAt,
        cached_at: Date.now(),
      };

      // 1. Persist proposal to visitor storage
      updateInquiryCachedProposalV2(serverOrLocalId, proposalRecord);

      // 1b. Resolve partner contact channels and immediately populate confirmed arrangement
      const catalogPartner = INITIAL_PORTAL_PARTNERS.find(p =>
        (authenticatedPartnerProfile && (p.id.toLowerCase() === authenticatedPartnerProfile.public_code?.toLowerCase() || p.id.toLowerCase() === authenticatedPartnerProfile.id?.toLowerCase())) ||
        (currentSimulatedPartner && p.id.toLowerCase() === currentSimulatedPartner.id.toLowerCase()) ||
        p.name.toLowerCase() === partnerName.toLowerCase() ||
        p.id.toLowerCase() === 'uno1'
      );

      const contactPhone = authenticatedPartnerProfile?.published_contact_phone ||
        authenticatedPartnerProfile?.draft_contact_phone ||
        currentSimulatedPartner?.contactPhone ||
        catalogPartner?.contactPhone ||
        '+381 62 187 3260';

      const contactEmail = authenticatedPartnerProfile?.published_contact_email ||
        authenticatedPartnerProfile?.draft_contact_email ||
        'concierge@idemo.travel';

      // Resolve authentic photo from upload preview, storage snapshot, catalog, or canonical portrait
      const targetPartnerCode = (authenticatedPartnerProfile?.public_code || currentSimulatedPartner?.publicCode || currentSimulatedPartner?.id || catalogPartner?.id || 'UNO1').toUpperCase();
      let storedPassportPhoto: string | null = null;
      try {
        const storedPassportRaw = safeStorage.getItem(`idemo_partner_passport_${targetPartnerCode}`) ||
                                   safeStorage.getItem(`idemo_partner_passport_${targetPartnerCode.toLowerCase()}`);
        if (storedPassportRaw) {
          const parsedStored = JSON.parse(storedPassportRaw);
          const cand = parsedStored.photo_url || parsedStored.published_photo_path || parsedStored.draft_photo_path;
          if (cand && (cand.startsWith('/') || cand.startsWith('http://') || cand.startsWith('https://') || cand.startsWith('data:'))) {
            storedPassportPhoto = cand;
          }
        }
      } catch (e) {
        console.warn('Failed to resolve stored partner photo for arrangement:', e);
      }

      const defaultCanonicalPortrait = '/assets/images/partners/uno_portrait.svg';

      const resolvedPhotoUrl = 
        passportPhotoPreview || 
        activePhotoUrl || 
        storedPassportPhoto ||
        catalogPartner?.photoUrl || 
        defaultCanonicalPortrait;

      const arrangementRecord: ConfirmedArrangementRecord = {
        match_id: matchId,
        partner_name: partnerName,
        partner_code: authenticatedPartnerProfile?.public_code || currentSimulatedPartner?.publicCode || catalogPartner?.publicCode || 'UNO1',
        category: authenticatedPartnerProfile?.category || currentSimulatedPartner?.category || catalogPartner?.category || 'Tourist Guide',
        verification_status: 'IDEMO Verified Host',
        photo_url: resolvedPhotoUrl,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        introduction: authenticatedPartnerProfile?.bio || currentSimulatedPartner?.introduction || catalogPartner?.introduction || null,
        languages: authenticatedPartnerProfile?.languages || currentSimulatedPartner?.languages || catalogPartner?.languages || ['English', 'Serbian'],
        service_areas: currentSimulatedPartner?.geography ? [currentSimulatedPartner.geography] : ['Belgrade'],
        capabilities: currentSimulatedPartner?.capabilities || catalogPartner?.capabilities || ['Licensed Tourist Guide'],
        portfolio_items: [],
        confirmed_terms: proposalRecord.message,
        proposed_start_at: proposedStartAt,
        proposed_end_at: proposedEndAt,
        confirmed_at: Date.now(),
      };

      saveConfirmedArrangementV2(serverOrLocalId, arrangementRecord);

      // 2. Update visitor status label
      const statusLabel = isSr ? 'Upit prihvaćen — kontakt otključan' : 'Inquiry accepted — contact unlocked';
      updateInquiryServerStatusV2(serverOrLocalId, statusLabel);

      // 3. Mark proposal as unread so red dot turns ON immediately
      removeSeenProposal(serverOrLocalId);
      const sig = `${matchId}_${responseId}`;
      removeSeenProposal(sig);

      // 4. Dispatch events for instant UI update (<10ms)
      window.dispatchEvent(new CustomEvent('idemo_arrangement_confirmed', {
        detail: {
          inquiryId: serverOrLocalId,
          arrangement: arrangementRecord
        }
      }));
      window.dispatchEvent(new CustomEvent('idemo_proposal_state_change', {
        detail: {
          inquiryId: serverOrLocalId,
          proposal: proposalRecord
        }
      }));
      window.dispatchEvent(new CustomEvent('idemo_inquiry_updated'));
    } catch (err) {
      console.warn('Failed to bridge partner acceptance to visitor:', err);
    }
  };

  const handleAcceptCounter = async (matchId: string) => {
    setActionLoading(prev => ({ ...prev, [matchId]: true }));
    const res = await acceptPartnerCounterOffer(matchId);
    setActionLoading(prev => ({ ...prev, [matchId]: false }));
    if (res.success) {
      triggerHaptic(12);
      const targetInq = inquiries.find(inq => inq.matchId === matchId || inq.id === matchId);
      const partnerName = authenticatedPartnerProfile?.name || currentSimulatedPartner?.name || 'Partner';
      bridgePartnerAcceptanceToVisitor(targetInq || { matchId }, partnerName, isSr ? 'Prihvaćen predlog putnika' : 'Counter offer accepted');
      setInquiries(prev => prev.map(inq => (inq.matchId === matchId || inq.id === matchId) ? { ...inq, status: 'Locked / Accepted', matchStatus: 'responded' } : inq));
      setPartnerActionFeedback({
        type: 'success',
        message: isSr
          ? 'Predlog putnika uspešno prihvaćen! Zvanična ponuda je poslata u Planer (Crvena tačka aktivirana).'
          : 'Counter offer accepted! Proposal sent to traveler (Red dot activated).'
      });
      setTimeout(() => setPartnerActionFeedback(null), 7000);
      refreshOpportunities();
    } else {
      alert(res.error || 'Failed to accept counter proposal.');
    }
  };

  const handleDeclineCounter = async (matchId: string) => {
    setActionLoading(prev => ({ ...prev, [matchId]: true }));
    const res = await declinePartnerCounterOffer(matchId);
    setActionLoading(prev => ({ ...prev, [matchId]: false }));
    if (res.success) {
      triggerHaptic(8);
      setInquiries(prev => prev.map(inq => (inq.matchId === matchId || inq.id === matchId) ? { ...inq, status: 'Released', matchStatus: 'declined' } : inq));
      refreshOpportunities();
    } else {
      alert(res.error || 'Failed to decline counter proposal.');
    }
  };

  const handleExecuteWithdraw = async (matchId: string) => {
    setActionLoading(prev => ({ ...prev, [matchId]: true }));
    const res = await withdrawPartnerOpportunity(matchId, 'Partner withdrawn proposal');
    setActionLoading(prev => ({ ...prev, [matchId]: false }));
    setWithdrawConfirmId(null);
    if (res.success) {
      triggerHaptic(10);
      setInquiries(prev => prev.map(inq => (inq.matchId === matchId || inq.id === matchId) ? { ...inq, status: 'Released', matchStatus: 'withdrawn' } : inq));
      refreshOpportunities();
    } else {
      alert(res.error || 'Failed to withdraw proposal.');
    }
  };

  const prevPartnerIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const currentPartnerId = activePartnerId;

    // ONLY RESET DRAFT STATE WHEN PARTNER IDENTITY OR ROLE ACTUALLY SWITCHES
    if (prevPartnerIdRef.current !== currentPartnerId) {
      prevPartnerIdRef.current = currentPartnerId;
      setPassportIntroDraft('');
      setPassportPhotoPath(null);
      setPassportPhotoPreview(null);
      setPhotoLoadError(false);
      setPassportPhotoMime(null);
      setPassportPhotoConsent(false);
      setPassportReviewStatus('draft');
      setPassportModified(false);
      setPassportReviewNote(null);
      setPassportSaving(false);
      setPassportMsg(null);
      setProfContactSaving(false);
      setProfContactMsg(null);
      setAppliedRecs([]);
      setAppliedRecsNote('');
    }

    const loadStoredOrCanonical = () => {
      const currIdLower = currentPartnerId ? currentPartnerId.trim().toLowerCase() : '';
      const isUno = currIdLower.includes('uno1') || currIdLower.includes('uno2') || currIdLower.startsWith('a0000000-0000-0000-0000-00000000009');
      
      const storedRaw = safeStorage.getItem(`idemo_partner_passport_${(currentPartnerId || '').toUpperCase()}`) ||
                        safeStorage.getItem(`idemo_partner_passport_${(currentPartnerId || '').toLowerCase()}`);
      if (storedRaw) {
        try {
          const parsed = JSON.parse(storedRaw);
          if (parsed.intro_draft || parsed.intro_published) {
            setPassportIntroDraft(parsed.intro_draft || parsed.intro_published);
          }
          const photo = parsed.photo_url || parsed.published_photo_path || parsed.draft_photo_path || null;
          if (photo) {
            setPassportPhotoPath(photo);
            setPassportPhotoPreview(photo);
          }
          if (typeof parsed.photo_consent_given === 'boolean') {
            setPassportPhotoConsent(parsed.photo_consent_given);
          }
          if (parsed.review_status) {
            setPassportReviewStatus(parsed.review_status);
          }
          if (parsed.draft_contact_phone || parsed.published_contact_phone || parsed.contact_phone) {
            setProfContactPhone(parsed.draft_contact_phone || parsed.published_contact_phone || parsed.contact_phone || '');
          }
          if (parsed.draft_contact_email || parsed.published_contact_email || parsed.contact_email) {
            setProfContactEmail(parsed.draft_contact_email || parsed.published_contact_email || parsed.contact_email || '');
          }
          if (Array.isArray(parsed.applied_recs)) {
            setAppliedRecs(parsed.applied_recs);
          } else {
            setAppliedRecs([]);
          }
          if (parsed.applied_recs_note) {
            setAppliedRecsNote(parsed.applied_recs_note);
          } else {
            setAppliedRecsNote('');
          }
          setPassportModified(false);
          return;
        } catch (e) {
          console.warn('Failed parsing stored partner passport:', e);
        }
      }

      if (isUno) {
        setPassportIntroDraft('I am a licensed local guide with strong knowledge of Belgrade, Serbian history, cultural heritage and traditional gastronomy. I enjoy helping visitors understand the stories behind the places they see and creating memorable experiences tailored to their interests.');
        setPassportPhotoPath('/assets/images/partners/uno_portrait.svg');
        setPassportPhotoPreview('/assets/images/partners/uno_portrait.svg');
        setPassportPhotoConsent(true);
        setPassportReviewStatus('approved');
        setAppliedRecs(['1', '2', '3']);
      }
      setPassportModified(false);

      if (currentPartnerId) {
        setPartnerProposalsList(getPartnerProposalsByPartnerId(currentPartnerId));
      }
    };

    if (authenticatedPartnerProfile && (
      authenticatedPartnerProfile.id === currentPartnerId ||
      authenticatedPartnerProfile.public_code.toUpperCase() === currentPartnerId?.toUpperCase()
    )) {
      setProfContactPhone(authenticatedPartnerProfile.contact_phone || '');
      setProfContactEmail(authenticatedPartnerProfile.contact_email || '');
    } else if (prevPartnerIdRef.current !== currentPartnerId) {
      setProfContactPhone('');
      setProfContactEmail('');
    }

    if (portalRole === 'partner' && currentPartnerId) {
      getPartnerProfileContent().then((res) => {
        // Ignore stale async response if active partner switched or component unmounted
        if (isCancelled) {
          return;
        }

        if (res.success && res.content) {
          const resIdLower = res.partner_id ? res.partner_id.trim().toLowerCase() : '';
          const currIdLower = currentPartnerId ? currentPartnerId.trim().toLowerCase() : '';
          const authIdLower = authenticatedPartnerProfile?.id ? authenticatedPartnerProfile.id.trim().toLowerCase() : '';
          const authCodeLower = authenticatedPartnerProfile?.public_code ? authenticatedPartnerProfile.public_code.trim().toLowerCase() : '';

          const isResponseForCurrentPartner =
            !res.partner_id ||
            resIdLower === currIdLower ||
            (authIdLower && resIdLower === authIdLower) ||
            (authCodeLower && resIdLower === authCodeLower) ||
            (currIdLower === 'uno1' && (resIdLower.includes('uno1') || resIdLower.startsWith('a0000000-0000-0000-0000-000000000091'))) ||
            (currIdLower === 'uno2' && (resIdLower.includes('uno2') || resIdLower.startsWith('a0000000-0000-0000-0000-000000000092')));

          if (!isResponseForCurrentPartner) {
            return;
          }

          setPassportIntroDraft(res.content.intro_draft || res.content.intro_published || '');
          const resolvedPath = res.content.draft_photo_path || res.content.published_photo_path || null;
          setPassportPhotoPath(resolvedPath);
          const resolvedPreview = res.content.draft_photo_signed_url ||
                                  res.content.published_photo_signed_url ||
                                  (resolvedPath && (resolvedPath.startsWith('/') || resolvedPath.startsWith('http') || resolvedPath.startsWith('data:')) ? resolvedPath : null);
          setPassportPhotoPreview(resolvedPreview);
          setPassportPhotoMime(res.content.draft_photo_mime || res.content.published_photo_mime || null);
          setPassportPhotoConsent(res.content.photo_consent_given || false);
          setPassportReviewStatus(res.content.review_status || 'draft');
          setPassportReviewNote(res.content.review_note || null);

          if (res.content.draft_contact_phone || res.content.published_contact_phone) {
            setProfContactPhone(res.content.draft_contact_phone || res.content.published_contact_phone || '');
          }
          if (res.content.draft_contact_email || res.content.published_contact_email) {
            setProfContactEmail(res.content.draft_contact_email || res.content.published_contact_email || '');
          }
          setPassportModified(false);
        } else {
          loadStoredOrCanonical();
        }
      }).catch(() => {
        loadStoredOrCanonical();
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [portalRole, activePartnerId, authenticatedPartnerProfile]);

  const handleUpdatePortalPin = () => {
    setPortalPinError('');
    setPortalPinSuccess('');
    const trimmed = newPortalPin.trim();
    if (!/^\d{4}$/.test(trimmed)) {
      setPortalPinError(isSr ? 'PIN mora biti tačno 4 cifre.' : isZh ? '密码必须为 4 位数字。' : 'PIN must be exactly 4 digits.');
      triggerHaptic(6);
      return;
    }

    const updatedList = partnersList.map(p => {
      if (p.id === activePartnerId) {
        return { ...p, pin: trimmed };
      }
      return p;
    });

    setPartnersList(updatedList);
    safeStorage.setItem('idemo_portal_partners', JSON.stringify(updatedList));
    setPortalPinSuccess(isSr ? 'Ecosystem Passport PIN je uspešno promenjen!' : isZh ? '安全通行证密码修改成功！' : 'Ecosystem Passport PIN successfully updated!');
    setNewPortalPin('');
    triggerHaptic([30, 20, 30]);
  };

  // Alternative date/time submission form states
  const [altOfferForm, setAltOfferForm] = useState<Record<string, { date: string; time: string; note: string }>>({});
  const [altFormOpenId, setAltFormOpenId] = useState<string | null>(null);

  // Folder container state for handled / archived opportunities
  const [isPastFolderOpen, setIsPastFolderOpen] = useState<boolean>(false);

  // Partner Workspace navigation tab state (Zero-scroll design: defaults to opportunities)
  const [partnerWorkspaceTab, setPartnerWorkspaceTab] = useState<'opportunities' | 'profile' | 'messages'>('opportunities');

  // Answer submission states
  const [activeAnswerText, setActiveAnswerText] = useState<Record<string, string>>({});

  // Private messages thread with IDEMO for Level 3
  const [partnerMessages, setPartnerMessages] = useState<Record<string, { id: string; sender: 'IDEMO' | 'You'; text: string; timestamp: string }[]>>(() => {
    try {
      const saved = safeStorage.getItem('idemo_partner_portal_messages_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  const getMessagesForPartner = (partnerId: string) => {
    const thread = partnerMessages[partnerId];
    if (thread) return thread;

    const partner = partnersList.find(p => p.id === partnerId);
    const categoryLabel = partner ? partner.category : 'Service Provider';
    const nameLabel = partner ? partner.name : 'Partner';

    return [
      {
        id: 'msg-1',
        sender: 'IDEMO' as const,
        text: `Welcome to the IDEMO Partner Network, ${nameLabel}. Your profile as a validated ${categoryLabel} is now live and linked.`,
        timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'msg-2',
        sender: 'IDEMO' as const,
        text: `Operational Message: Your portfolio completeness represents your reach inside the IDEMO passenger app. Please review available capabilities and request activation if needed.`,
        timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'msg-3',
        sender: 'IDEMO' as const,
        text: `Seasonal notice: Belgrade Summer/Autumn Curation is active. Focus on premium outdoor and cultural experiences.`,
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
      }
    ];
  };

  const handleSendPartnerMessage = (partnerId: string, text: string) => {
    if (!text.trim()) return;
    const currentThread = getMessagesForPartner(partnerId);
    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: 'You' as const,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      recipient: 'office@idemo.group'
    };
    const updatedThread = [...currentThread, newMessage];
    const updatedAll = { ...partnerMessages, [partnerId]: updatedThread };
    setPartnerMessages(updatedAll);
    try {
      safeStorage.setItem('idemo_partner_portal_messages_v1', JSON.stringify(updatedAll));
    } catch (e) {
      console.error(e);
    }

    // Trigger direct mailto dispatch hook to office@idemo.group
    try {
      const pName = currentSimulatedPartner?.name || partnerId;
      const pCode = currentSimulatedPartner?.publicCode || partnerId;
      const subject = encodeURIComponent(`IDEMO Partner Message - ${pName} (${pCode})`);
      const body = encodeURIComponent(`Partner Message:\n\n${text.trim()}\n\n---\nPartner Name: ${pName}\nPartner Code: ${pCode}\nDispatched via IDEMO Partner Portal`);
      const mailtoUrl = `mailto:office@idemo.group?subject=${subject}&body=${body}`;
      
      // Safe fallback window open for email client
      const a = document.createElement('a');
      a.href = mailtoUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    } catch (e) {
      console.warn('Mailto dispatch notice:', e);
    }

    triggerHaptic(10);
  };

  const [partnerMessageInput, setPartnerMessageInput] = useState<string>('');

  // Release reason states
  const [activeReleaseReason, setActiveReleaseReason] = useState<Record<string, string>>({});
  const [showReleaseModalId, setShowReleaseModalId] = useState<string | null>(null);

  // Visitor Privileges state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [unlockedPins, setUnlockedPins] = useState<string[]>([]);
  const [activePrivilegePartnerId, setActivePrivilegePartnerId] = useState<string | null>(null);
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinTargetPartner, setPinTargetPartner] = useState<Partner | null>(null);
  const [pinError, setPinError] = useState('');
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);
  const [selectedMapPartner, setSelectedMapPartner] = useState<Partner | null>(null);
  const [redeemedStates, setRedeemedStates] = useState<Record<string, { code: string; time: string }>>({});

  // Form States (Onboarding / Inquiries)
  const [onboardForm, setOnboardForm] = useState({ name: '', category: 'Tourist Guide', pin: '', capabilities: '', languages: '', geography: '', channels: 'WhatsApp', phone: '', instagram: '' });
  const [inquiryForm, setInquiryForm] = useState({
    visitorName: '',
    queryText: '',
    selectedRecId: '1',
    category: 'Tourist Guide' as any,
    geography: 'Belgrade',
    language: 'English',
    budget: '€200 - €400',
    availableTime: 'Next Thursday Afternoon',
    subjectExpertise: 'Private Tours'
  });
  const [newReplyText, setNewReplyText] = useState('');
  const [activeInquiryIdForReply, setActiveInquiryIdForReply] = useState<string | null>(null);

  // Initialize and Sync safeStorage
  useEffect(() => {
    // 0. Check active session from storage
    const activeSession = partnerSessionStorage.getPartnerSession();

    if (activeSession) {
      performSessionValidation(activeSession);
    } else {
      setNetworkUnlocked(false);
      setPortalRole('guest');
      setRestorationState('guest');
    }

    // 1. Privileges pins
    const savedPins = safeStorage.getItem('idemo_unlocked_partner_pins_v2');
    if (savedPins) { try { setUnlockedPins(JSON.parse(savedPins)); } catch (e) {} }

    // 2. Privileges vouchers
    const redm: Record<string, { code: string; time: string }> = {};
    PARTNERS.forEach(p => {
      const redeemed = safeStorage.getItem(`idemo_partner_redeemed_${p.id}`);
      if (redeemed) {
        redm[p.id] = {
          code: safeStorage.getItem(`idemo_partner_redeem_code_${p.id}`) || 'N/A',
          time: safeStorage.getItem(`idemo_partner_redeem_time_${p.id}`) || 'N/A'
        };
      }
    });
    setRedeemedStates(redm);

    // 3. Portal database sync
    const savedPartners = safeStorage.getItem('idemo_portal_partners');
    let loadedPartners = INITIAL_PORTAL_PARTNERS;
    if (savedPartners) {
      try {
        const parsed = JSON.parse(savedPartners);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const upgraded = parsed;
          const existingIds = new Set(upgraded.map((p: any) => p.id));
          const missingDefaults = INITIAL_PORTAL_PARTNERS.filter(p => !existingIds.has(p.id));
          loadedPartners = [...upgraded, ...missingDefaults];
        }
      } catch (e) {
        loadedPartners = INITIAL_PORTAL_PARTNERS;
      }
    }
    setPartnersList(loadedPartners);
    safeStorage.setItem('idemo_portal_partners', JSON.stringify(loadedPartners));

    const hasCleanSlateV4 = safeStorage.getItem('idemo_portal_inquiries_v4_clean_all');
    if (!hasCleanSlateV4) {
      // Definitive clean slate: completely erase past test inquiries across all partner cards (UNO1, UNO2, and all partners)
      safeStorage.setItem('idemo_portal_inquiries', JSON.stringify([]));
      safeStorage.setItem('idemo_portal_inquiries_v4_clean_all', 'true');
      setInquiries([]);
    } else {
      const savedInquiries = safeStorage.getItem('idemo_portal_inquiries');
      if (savedInquiries) {
        try {
          const parsed = JSON.parse(savedInquiries);
          const cleaned = Array.isArray(parsed) ? parsed.filter((inq: any) => {
            const pId = String(inq.partnerId || '').toUpperCase();
            return !['INQ-2001', 'INQ-2002', 'INQ-2003', 'INQ-2004'].includes(inq.id) &&
              pId !== 'UNO1' &&
              pId !== 'UNO2';
          }) : [];
          setInquiries(cleaned);
          safeStorage.setItem('idemo_portal_inquiries', JSON.stringify(cleaned));
        } catch (e) {
          setInquiries([]);
          safeStorage.setItem('idemo_portal_inquiries', JSON.stringify([]));
        }
      } else {
        setInquiries([]);
        safeStorage.setItem('idemo_portal_inquiries', JSON.stringify([]));
      }
    }

    // Seamless runtime sync: integrate visitor inquiries from Planner
    try {
      const visitorInquiries = getAllInquiriesV2();
      if (visitorInquiries && visitorInquiries.length > 0) {
        setInquiries(prev => {
          const merged = [...prev];
          visitorInquiries.forEach(vInq => {
            const vId = vInq.server_inquiry_id || vInq.local_queue_id;
            const alreadyPresent = merged.find(m => m.id === vId || m.inquiryId === vId || (m.recId === vInq.recommendation_id && m.visitorName === vInq.visitor_name));
            const isConfirmed = (vInq as any).status === 'Arrangement Confirmed' || !!getConfirmedArrangementByServerId(vId);
            if (!alreadyPresent) {
              merged.unshift({
                id: vId,
                inquiryId: vInq.server_inquiry_id,
                recId: vInq.recommendation_id,
                recTitle: vInq.recommendation_title || (vInq.recommendation_id === '1' ? 'Uvac Meanders' : 'Recommendation'),
                visitorName: vInq.visitor_name || 'Verified Traveler',
                query: vInq.visitor_notes || 'Arrangement request for Uvac Meanders',
                status: isConfirmed ? 'Confirmed by Traveler' : vInq.cached_proposal ? 'Locked / Accepted' : 'Pending',
                visitorConfirmed: isConfirmed,
                visitorConfirmedAt: isConfirmed ? Date.now() : undefined,
                dateSubmitted: vInq.created_at || new Date().toISOString(),
                availableTime: vInq.preferred_time || 'Anytime',
                language: 'English',
                budget: 'Standard',
                geography: 'Uvac / Zlatar',
                replies: vInq.cached_proposal?.message ? [vInq.cached_proposal.message] : [],
                requestedStartAt: vInq.requested_start_at,
                requestedEndAt: vInq.requested_end_at,
              });
            } else if (isConfirmed && !alreadyPresent.visitorConfirmed) {
              alreadyPresent.visitorConfirmed = true;
              alreadyPresent.status = 'Confirmed by Traveler';
              alreadyPresent.visitorConfirmedAt = Date.now();
            }
          });
          return merged;
        });
      }
    } catch (e) {}

    // Live reactive listener for traveler proposal confirmation
    const handleVisitorConfirmed = (e: any) => {
      const detail = e.detail;
      if (detail) {
        setInquiries(prev => prev.map(inq => {
          const isMatch = inq.id === detail.inquiryId || inq.inquiryId === detail.inquiryId || inq.matchId === detail.matchId;
          if (isMatch) {
            return {
              ...inq,
              status: 'Confirmed by Traveler',
              visitorConfirmed: true,
              visitorConfirmedAt: detail.confirmedAt || Date.now(),
            };
          }
          return inq;
        }));
      }
    };
    window.addEventListener('idemo_proposal_confirmed_by_visitor', handleVisitorConfirmed);
    window.addEventListener('idemo_inquiry_updated', () => {
      const savedInquiries = safeStorage.getItem('idemo_portal_inquiries');
      if (savedInquiries) {
        try { setInquiries(JSON.parse(savedInquiries)); } catch (e) {}
      }
    });

    const savedInterests = safeStorage.getItem('idemo_portal_interest_requests');
    if (savedInterests) {
      try { setInterestRequests(JSON.parse(savedInterests)); } catch (e) { setInterestRequests([]); }
    }

    const savedAvail = safeStorage.getItem('idemo_partner_availability_map');
    if (savedAvail) { try { setPartnerAvailability(JSON.parse(savedAvail)); } catch (e) {} }

    const savedPaused = safeStorage.getItem('idemo_partner_paused_caps_map');
    if (savedPaused) { try { setPartnerPausedCaps(JSON.parse(savedPaused)); } catch (e) {} }

    const savedPassed = safeStorage.getItem('idemo_partner_passed_inquiries_map');
    if (savedPassed) { try { setPartnerPassedInquiries(JSON.parse(savedPassed)); } catch (e) {} }
  }, []);

  // Save Portal database to local storage helper
  const syncPortalState = (
    updatedPartners: PortalPartner[],
    updatedInquiries: Inquiry[],
    updatedInterests?: any
  ) => {
    setPartnersList(updatedPartners);
    setInquiries(updatedInquiries);
    safeStorage.setItem('idemo_portal_partners', JSON.stringify(updatedPartners));
    safeStorage.setItem('idemo_portal_inquiries', JSON.stringify(updatedInquiries));
    if (updatedInterests !== undefined) {
      setInterestRequests(updatedInterests);
      safeStorage.setItem('idemo_portal_interest_requests', JSON.stringify(updatedInterests));
    }
  };

  const updatePartnerAvailability = (partnerId: string, status: 'Available' | 'Unavailable', until?: string) => {
    const updated = { ...partnerAvailability, [partnerId]: { status, until } };
    setPartnerAvailability(updated);
    safeStorage.setItem('idemo_partner_availability_map', JSON.stringify(updated));
  };

  const togglePartnerPausedCap = (partnerId: string, cap: string) => {
    const current = partnerPausedCaps[partnerId] || [];
    const updatedCaps = current.includes(cap) ? current.filter(c => c !== cap) : [...current, cap];
    const updated = { ...partnerPausedCaps, [partnerId]: updatedCaps };
    setPartnerPausedCaps(updated);
    safeStorage.setItem('idemo_partner_paused_caps_map', JSON.stringify(updated));
  };

  const passInquiryForPartner = (partnerId: string, inquiryId: string) => {
    const current = partnerPassedInquiries[partnerId] || [];
    if (!current.includes(inquiryId)) {
      const updated = { ...partnerPassedInquiries, [partnerId]: [...current, inquiryId] };
      setPartnerPassedInquiries(updated);
      safeStorage.setItem('idemo_partner_passed_inquiries_map', JSON.stringify(updated));
    }
  };

  // Login PIN Router
  const handleVerifyNetworkPin = async () => {
    const code = pinInput.trim();
    setPinError('');
    const hashed = await sha256(code);
    if (hashed === '68722dedde84631c45b4aade9365a91aa6fd11c5766e66191ffbf07361204a4c') {
      triggerHaptic([30, 20, 40]);
      setNetworkUnlocked(true);
      setPinInput('');
      setPartnerCodeInput('');
      setActivePartnerId(null);
      try {
        safeStorage.setItem('idemo_generic_partner_unlocked', 'true');
      } catch (e) {
        console.warn(e);
      }
      const session = partnerSessionStorage.getPartnerSession();
      if (session) {
        performSessionValidation(session);
      } else {
        setPortalRole('guest');
        setRestorationState('guest');
      }
    } else {
      triggerHaptic([60, 40]);
      setPinError(tL0('invalidPin'));
    }
  };

  const handlePortalLogin = async () => {
    const code = partnerCodeInput.trim().toUpperCase();
    const pin = pinInput.trim();
    setPinError('');
    setChangePinError('');
    setChangePinSuccess('');

    if (!code) {
      setPinError(isSr ? 'Unesite kod partnera.' : 'Please enter partner code.');
      triggerHaptic([60, 40]);
      return;
    }

    if (!pin) {
      setPinError(isSr ? 'Unesite PIN.' : 'Please enter PIN.');
      triggerHaptic([60, 40]);
      return;
    }

    if (pin === pin9999 || code === pin9999) {
      triggerHaptic([30, 20, 40]);
      setPortalRole('admin');
      setPartnerCodeInput('');
      setPinInput('');
    } else if (pin === pin8888 || code === pin8888) {
      triggerHaptic([30, 20, 40]);
      setPortalRole('concierge');
      setPartnerCodeInput('');
      setPinInput('');
    } else {
      // Server authentication
      const res = await loginPartner(code, pin);
      if (res.success && res.partner) {
        triggerHaptic([30, 20, 40]);
        setPartnerCodeInput('');
        setPinInput('');

        // Step 1: Immediately fetch authenticated partner profile via GET /partner_resolution/me
        const profileRes = await fetchAuthenticatedPartnerProfile();

        if (profileRes.success && profileRes.profile) {
          // Step 2: Require successful /me response before setting portalRole = "partner"
          setAuthenticatedPartnerProfile(profileRes.profile);
          setActivePartnerId(profileRes.profile.id);

          // Step 3: Fetch assigned opportunities for authenticated partner
          const oppsRes = await fetchPartnerOpportunities('new');
          if (oppsRes.success && oppsRes.opportunities && oppsRes.opportunities.length > 0) {
            const fetchedInquiries: Inquiry[] = oppsRes.opportunities.map(opp => ({
              id: opp.match_id || opp.inquiry_id,
              recId: opp.recommendation_id,
              recTitle: opp.recommendation_title,
              partnerId: profileRes.profile!.id,
              partnerName: profileRes.profile!.name,
              status: (opp.match_status as any) || 'Dispatched Stage 1',
              visitorName: opp.visitor_contact?.visitor_name || 'Verified Traveler',
              query: opp.visitor_notes || 'Traveler requested direct partner assistance via IDEMO dispatch.',
              replies: [],
              createdAt: opp.created_at || new Date().toISOString(),
              geography: 'Belgrade & Serbia',
              language: 'English',
              subjectExpertise: opp.recommendation_title,
              category: 'Tourist Guide',
              dispatchStage: 1,
            }));
            setInquiries(fetchedInquiries);
            safeStorage.setItem('idemo_portal_inquiries', JSON.stringify(fetchedInquiries));
          } else {
            setInquiries([]);
            safeStorage.setItem('idemo_portal_inquiries', JSON.stringify([]));
          }

          if (profileRes.profile.must_change_pin || res.partner.must_change_pin) {
            setMustChangePinMode(true);
            setChangePinCurrent(pin);
          } else {
            setPortalRole('partner');
          }
        } else {
          // Step 4: Fail closed if /me fails
          triggerHaptic([60, 40]);
          partnerSessionStorage.clearPartnerSession();
          setActivePartnerId(null);
          setAuthenticatedPartnerProfile(null);
          setPortalRole('guest');
          setPinError(profileRes.error || (isSr ? 'Greška pri učitavanju profila.' : 'Failed to load partner profile.'));
        }
      } else {
        triggerHaptic([60, 40]);
        if (res.error && (res.error.includes('NETWORK_FAILURE') || res.error.includes('CONFIG_ERROR') || res.error.includes('Database connection URL missing'))) {
          setPinError(isSr ? 'Mreža ili konfiguracija baze nije dostupna.' : 'Backend or database configuration unavailable.');
        } else {
          setPinError(isSr ? 'Kod partnera ili PIN nije ispravan.' : isZh ? '合作伙伴代码或 PIN 不正确。' : 'Partner code or PIN is incorrect.');
        }
      }
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinError('');
    setChangePinSuccess('');

    if (changePartnerName.trim().length > 16) {
      setChangePinError(isSr ? 'Naziv partnera ne može biti duži od 16 karaktera.' : 'Partner name cannot exceed 16 characters.');
      triggerHaptic(6);
      return;
    }

    if (changePinNew.length !== 4) {
      setChangePinError(isSr ? 'Novi PIN mora sadržati tačno 4 cifre.' : 'New PIN must be exactly 4 digits.');
      triggerHaptic(6);
      return;
    }

    if (changePinNew !== changePinConfirm) {
      setChangePinError(isSr ? 'Novi PIN i potvrda se ne poklapaju.' : 'New PIN and confirmation do not match.');
      triggerHaptic(6);
      return;
    }

    const res = await changePartnerPin(changePinCurrent, changePinNew, changePinConfirm, changePartnerName.trim() || undefined);
    if (res.success) {
      setChangePinSuccess(isSr ? 'Podaci uspešno promenjeni. Molimo prijavite se ponovo sa novim PIN-om.' : 'Credentials successfully updated. Please log in again with your new PIN.');
      setMustChangePinMode(false);
      setPortalRole('guest');
      setActivePartnerId(null);
      setChangePartnerName('');
      setChangePinCurrent('');
      setChangePinNew('');
      setChangePinConfirm('');
      triggerHaptic([30, 20, 30]);
    } else {
      setChangePinError(res.error || res.message || (isSr ? 'Greška pri promeni podataka.' : 'Failed to update credentials.'));
      triggerHaptic([60, 40]);
    }
  };

  const handlePartnerLogout = async () => {
    triggerHaptic(10);
    await logoutPartner();
    setActivePartnerId(null);
    setPortalRole('guest');
    setMustChangePinMode(false);
    setChangePinCurrent('');
    setChangePinNew('');
    setChangePinConfirm('');
    setPartnerCodeInput('');
    setPinInput('');
    setPinError('');
  };

  const handleLockNetwork = async () => {
    triggerHaptic(10);
    await logoutPartner();
    setActivePartnerId(null);
    setNetworkUnlocked(false);
    setPortalRole('guest');
    setMustChangePinMode(false);
    setPinInput('');
    setPartnerCodeInput('');
    setPinError('');
    safeStorage.setItem('idemo_generic_partner_unlocked', 'false');
  };

  // Admin Onboarding
  const handleOnboardPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardForm.name) return;
    triggerHaptic(15);
    const newPartner: PortalPartner = {
      id: `p-custom-${Date.now()}`,
      pin: onboardForm.pin || String(Math.floor(1000 + Math.random() * 8000)),
      name: onboardForm.name,
      category: onboardForm.category as any,
      status: 'Validated',
      capabilities: onboardForm.capabilities.split(',').map(s => s.trim()).filter(Boolean),
      languages: onboardForm.languages.split(',').map(s => s.trim()).filter(Boolean),
      geography: onboardForm.geography || 'Belgrade Metro',
      channels: [onboardForm.channels],
      contactPhone: onboardForm.phone || '+381630000000',
      instagram: onboardForm.instagram || '@idemo_partner',
      assignedRecs: [],
      contributions: 0,
      reliability: 100,
      eligibility: false
    };
    const updated = [...partnersList, newPartner];
    syncPortalState(updated, inquiries);
    setOnboardForm({ name: '', category: 'Tourist Guide', pin: '', capabilities: '', languages: '', geography: '', channels: 'WhatsApp', phone: '', instagram: '' });
  };

  // Admin validation level toggle
  const togglePartnerStatus = (partnerId: string, nextStatus: any) => {
    triggerHaptic(10);
    const updated = partnersList.map(p => p.id === partnerId ? { ...p, status: nextStatus, eligibility: nextStatus === 'Trusted' || nextStatus === 'Expanded Portfolio' } : p);
    syncPortalState(updated, inquiries);
  };

  // Admin Assign Recommendations
  const toggleRecommendationAssignment = (partnerId: string, recId: string) => {
    triggerHaptic(10);
    const updated = partnersList.map(p => {
      if (p.id === partnerId) {
        const assigned = p.assignedRecs.includes(recId) 
          ? p.assignedRecs.filter(id => id !== recId)
          : [...p.assignedRecs, recId];
        return { ...p, assignedRecs: assigned };
      }
      return p;
    });
    syncPortalState(updated, inquiries);
  };

  // Admin Approve Opportunities requests
  const handleApproveInterest = (req: { partnerId: string; recId: string }) => {
    triggerHaptic(20);
    const updatedPartners = partnersList.map(p => {
      if (p.id === req.partnerId) {
        if (req.recId.startsWith('cap-')) {
          const capName = req.recId.substring(4);
          if (!p.capabilities.includes(capName)) {
            return { ...p, capabilities: [...p.capabilities, capName] };
          }
        } else if (req.recId.startsWith('lang-')) {
          const langName = req.recId.substring(5);
          if (!p.languages.includes(langName)) {
            return { ...p, languages: [...p.languages, langName] };
          }
        } else {
          if (!p.assignedRecs.includes(req.recId)) {
            return { ...p, assignedRecs: [...p.assignedRecs, req.recId] };
          }
        }
      }
      return p;
    });
    const updatedInterests = interestRequests.filter(r => !(r.partnerId === req.partnerId && r.recId === req.recId));
    syncPortalState(updatedPartners, inquiries, updatedInterests);
  };

  // Concierge create inquiry card
  const handleCreateInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.visitorName || !inquiryForm.queryText) return;
    triggerHaptic(25);
    const recObj = RECOMMENDATIONS_LOOKUP.find(r => r.id === inquiryForm.selectedRecId);
    if (!recObj) return;

    const newInquiry: Inquiry = {
      id: `INQ-${Math.floor(1000 + Math.random() * 9000)}`,
      recId: inquiryForm.selectedRecId,
      recTitle: recObj.title,
      status: 'Dispatched Stage 1',
      visitorName: inquiryForm.visitorName,
      query: inquiryForm.queryText,
      replies: [],
      createdAt: new Date().toISOString(),
      geography: inquiryForm.geography,
      language: inquiryForm.language,
      budget: inquiryForm.budget,
      availableTime: inquiryForm.availableTime,
      subjectExpertise: inquiryForm.subjectExpertise,
      category: inquiryForm.category
    };

    const updated = [newInquiry, ...inquiries];
    syncPortalState(partnersList, updated);
    setInquiryForm(prev => ({
      ...prev,
      visitorName: '',
      queryText: '',
      geography: 'Belgrade',
      language: 'English',
      budget: '€200 - €400',
      availableTime: 'Next Thursday Afternoon',
      subjectExpertise: 'Private Tours'
    }));
  };

  // Concierge record replies
  const handleSaveReply = (inqId: string) => {
    if (!newReplyText.trim()) return;
    triggerHaptic(20);
    const updatedInquiries = inquiries.map(inq => {
      if (inq.id === inqId) {
        return { ...inq, replies: [...inq.replies, newReplyText], status: 'answered' as const };
      }
      return inq;
    });
    // Add contribution count to Partner
    const targetInq = inquiries.find(i => i.id === inqId);
    const updatedPartners = partnersList.map(p => {
      if (targetInq && p.id === targetInq.partnerId) {
        return { ...p, contributions: p.contributions + 1 };
      }
      return p;
    });
    syncPortalState(updatedPartners, updatedInquiries);
    setNewReplyText('');
    setActiveInquiryIdForReply(null);
  };

  // Concierge update inquiry status
  const handleUpdateInquiryStatus = (inqId: string, status: any) => {
    triggerHaptic(10);
    const updated = inquiries.map(inq => inq.id === inqId ? { ...inq, status } : inq);
    syncPortalState(partnersList, updated);
  };

  // Partner Express Interest (curated vector assignment)
  const handlePartnerExpressInterest = (recId: string, recTitle: string, partner: PortalPartner) => {
    triggerHaptic(15);
    const request = { partnerId: partner.id, partnerName: partner.name, recId, recTitle };
    const updatedInterests = [...interestRequests, request];
    setInterestRequests(updatedInterests);
    safeStorage.setItem('idemo_portal_interest_requests', JSON.stringify(updatedInterests));
  };

  // Modern Automated Dispatch Handlers
  const handlePartnerAcceptInquiry = async (inqId: string, partnerId: string, customMessage?: string) => {
    triggerHaptic(20);
    const inqKey = inqId;
    setActionLoading(prev => ({ ...prev, [inqKey]: true }));

    const typedText = (customMessage !== undefined ? customMessage : activeAnswerText[inqId])?.trim();
    const defaultMsg = isSr ? 'Upit prihvaćen. Radujem se saradnji.' : 'Accepted via Partner Portal';
    const messageToPersist = typedText || defaultMsg;

    try {
      if (partnerSessionStorage.hasActiveSession()) {
        const res = await acceptPartnerOpportunity(inqId, messageToPersist);
        if (!res.success) {
          alert(res.error || 'Failed to accept opportunity on server.');
          return;
        }
      }
      const partner = partnersList.find(p => p.id === partnerId);
      const partnerName = partner?.name || currentSimulatedPartner?.name || authenticatedPartnerProfile?.name || 'Partner';
      const targetInq = inquiries.find(inq => inq.id === inqId || inq.matchId === inqId);

      const updated = inquiries.map(inq => {
        if (inq.id === inqId) {
          const existingReplies = inq.replies || [];
          const hasMsg = existingReplies.includes(messageToPersist);
          return {
            ...inq,
            status: 'Locked / Accepted' as const,
            partnerId: partnerId,
            partnerName: partnerName,
            replies: hasMsg ? existingReplies : [...existingReplies, messageToPersist],
          };
        }
        return inq;
      });
      syncPortalState(partnersList, updated);
      setActiveAnswerText(prev => ({ ...prev, [inqId]: '' }));

      // Bridge directly to visitor's Planner and trigger instant Red Dot
      bridgePartnerAcceptanceToVisitor(targetInq || { id: inqId, recId: targetInq?.recId }, partnerName, messageToPersist);
      setPartnerActionFeedback({
        type: 'success',
        message: isSr
          ? 'Upit uspešno prihvaćen! Zvanična ponuda je odmah poslata posetiocu u Moj Planer (Crvena tačka aktivirana). Status: Čeka se potvrda aranžmana.'
          : 'Opportunity accepted! Official proposal sent to traveler in My Planner (Red dot activated). Status: Awaiting traveler confirmation.'
      });
      setTimeout(() => setPartnerActionFeedback(null), 7000);
    } finally {
      setActionLoading(prev => ({ ...prev, [inqKey]: false }));
    }
  };

  const handlePartnerPassInquiry = async (inqId: string, partnerId: string) => {
    triggerHaptic(10);
    if (partnerSessionStorage.hasActiveSession()) {
      const res = await declinePartnerOpportunity(inqId, 'Passed via Partner Portal');
      if (!res.success) {
        alert(res.error || 'Failed to pass opportunity on server.');
        return;
      }
    }
    const updated = inquiries.map(inq => {
      if (inq.id === inqId) {
        return {
          ...inq,
          status: 'Released' as const,
        };
      }
      return inq;
    });
    syncPortalState(partnersList, updated);
    passInquiryForPartner(partnerId, inqId);
  };

  const handlePartnerReleaseInquiry = (inqId: string, partnerId: string, reason: string) => {
    triggerHaptic(15);
    const updated = inquiries.map(inq => {
      if (inq.id === inqId) {
        return {
          ...inq,
          status: 'Released' as const,
          releaseReason: reason
        };
      }
      return inq;
    });
    syncPortalState(partnersList, updated);
    setShowReleaseModalId(null);
  };

  const handlePartnerSubmitAnswer = async (inqId: string, partnerId: string, answerText: string) => {
    const trimmed = answerText.trim();
    if (!trimmed) return;
    triggerHaptic(25);

    const targetInquiry = inquiries.find(inq => inq.id === inqId);
    const isAlreadyAcceptedOnServer = targetInquiry && (
      targetInquiry.status === 'Locked / Accepted' ||
      targetInquiry.status === 'Answered / Completed' ||
      targetInquiry.status === 'Alternative Proposed'
    );

    if (partnerSessionStorage.hasActiveSession() && !isAlreadyAcceptedOnServer) {
      const res = await acceptPartnerOpportunity(inqId, trimmed);
      if (!res.success) {
        alert(res.error || 'Failed to accept opportunity on server.');
        return;
      }
    }

    const updatedInquiries = inquiries.map(inq => {
      if (inq.id === inqId) {
        return {
          ...inq,
          replies: [...(inq.replies || []), trimmed],
          status: 'Answered / Completed' as const
        };
      }
      return inq;
    });
    const updatedPartners = partnersList.map(p => {
      if (p.id === partnerId) {
        return { ...p, contributions: p.contributions + 1 };
      }
      return p;
    });
    syncPortalState(updatedPartners, updatedInquiries);
    setActiveAnswerText(prev => ({ ...prev, [inqId]: '' }));

    const partner = partnersList.find(p => p.id === partnerId);
    const partnerName = partner?.name || currentSimulatedPartner?.name || authenticatedPartnerProfile?.name || 'Partner';
    bridgePartnerAcceptanceToVisitor(targetInquiry || { id: inqId }, partnerName, trimmed);
    setPartnerActionFeedback({
      type: 'success',
      message: isSr
        ? 'Ponuda uspešno poslata posetiocu! Crvena tačka je aktivirana u Planeru.'
        : 'Proposal transmitted to traveler! Red dot activated in Planner.'
    });
    setTimeout(() => setPartnerActionFeedback(null), 7000);
  };

  const handlePartnerProposeAlternative = async (inqId: string, partnerId: string, date: string, time: string, note: string) => {
    triggerHaptic(15);
    if (partnerSessionStorage.hasActiveSession()) {
      const startAt = `${date}T${time || '10:00'}:00Z`;
      const endAt = `${date}T${time || '12:00'}:00Z`;
      const res = await proposePartnerAlternative(inqId, startAt, endAt, note);
      if (!res.success) {
        alert(res.error || 'Failed to propose alternative on server.');
        return;
      }
    }
    const partner = partnersList.find(p => p.id === partnerId);
    const partnerName = partner?.name || currentSimulatedPartner?.name || authenticatedPartnerProfile?.name || 'Partner';
    const targetInq = inquiries.find(inq => inq.id === inqId || inq.matchId === inqId);
    const updated = inquiries.map(inq => {
      if (inq.id === inqId) {
        return {
          ...inq,
          status: 'Alternative Proposed' as const,
          partnerId: partnerId,
          partnerName: partnerName,
          alternativeOffer: { date, time, note }
        };
      }
      return inq;
    });
    syncPortalState(partnersList, updated);

    bridgePartnerAcceptanceToVisitor(
      targetInq || { id: inqId },
      partnerName,
      note || `Alternative: ${date} ${time}`,
      { date, time, note }
    );
    setPartnerActionFeedback({
      type: 'success',
      message: isSr
        ? 'Alternativni termin poslat posetiocu! Crvena tačka je aktivirana u Planeru.'
        : 'Alternative proposed to traveler! Red dot activated in Planner.'
    });
    setTimeout(() => setPartnerActionFeedback(null), 7000);
  };

  // Dedicated clean board action for test leads (specifically UNO1 / UNO2 or active partner)
  const handleClearOpportunitiesForCurrentPartner = () => {
    if (!currentSimulatedPartner) return;
    const targetPartnerId = (currentSimulatedPartner.id || '').toLowerCase();
    const targetCode = (currentSimulatedPartner.publicCode || '').toLowerCase();
    const targetName = (currentSimulatedPartner.name || '').toLowerCase();
    
    // Purge opportunities matching the current partner
    const updated = inquiries.filter(inq => {
      const pId = (inq.partnerId || '').toLowerCase();
      const pName = (inq.partnerName || '').toLowerCase();
      return pId !== targetPartnerId && pId !== targetCode && pName !== targetName;
    });
    setInquiries(updated);
    safeStorage.setItem('idemo_portal_inquiries', JSON.stringify(updated));
    syncPortalState(partnersList, updated, interestRequests);
    window.dispatchEvent(new CustomEvent('idemo_partner_opportunity_change'));

    setPartnerActionFeedback({
      type: 'success',
      message: isSr
        ? `Sve prilike za ${currentSimulatedPartner.name} su uspešno obrisane. Čista tabla!`
        : `All opportunities for ${currentSimulatedPartner.name} have been erased. Clean board!`
    });
    setTimeout(() => setPartnerActionFeedback(null), 5000);
  };

  // Clear only handled / archived opportunities, preserving any active pending opportunities
  const handleClearArchivedOpportunities = () => {
    if (!currentSimulatedPartner) return;
    const targetPartnerId = (currentSimulatedPartner.id || '').toLowerCase();
    const targetCode = (currentSimulatedPartner.publicCode || '').toLowerCase();
    const targetName = (currentSimulatedPartner.name || '').toLowerCase();
    
    const updated = inquiries.filter(inq => {
      const pId = (inq.partnerId || '').toLowerCase();
      const pName = (inq.partnerName || '').toLowerCase();
      const isTargetPartner = pId === targetPartnerId || pId === targetCode || pName === targetName;
      if (!isTargetPartner) return true;
      
      const isConfirmedByVisitor = Boolean(
        inq.visitorConfirmed === true ||
        inq.status === 'Confirmed by Traveler' ||
        inq.status === 'Arrangement Confirmed' ||
        inq.status === 'selected' ||
        inq.matchStatus === 'selected' ||
        inq.rawMatchStatus === 'selected' ||
        inq.inquiryStatus === 'confirmed'
      );

      const isAccepted = !isConfirmedByVisitor && Boolean(
        inq.status === 'Locked / Accepted' ||
        inq.status === 'accepted' ||
        inq.status === 'responded' ||
        inq.matchStatus === 'responded' ||
        inq.rawMatchStatus === 'responded'
      );

      const isAlternative = Boolean(
        inq.status === 'Alternative Proposed' ||
        inq.status === 'proposed' ||
        inq.alternativeOffer
      );

      const isDeclined = Boolean(
        inq.status === 'Released' ||
        inq.status === 'declined' ||
        inq.status === 'expired' ||
        inq.status === 'not_selected' ||
        inq.status === 'withdrawn' ||
        inq.matchStatus === 'declined' ||
        inq.matchStatus === 'expired' ||
        inq.matchStatus === 'not_selected' ||
        inq.matchStatus === 'withdrawn' ||
        inq.rawMatchStatus === 'declined' ||
        inq.rawMatchStatus === 'expired'
      );

      const isCompleted = Boolean(
        inq.status === 'Answered / Completed' ||
        inq.status === 'completed' ||
        inq.status === 'closed' ||
        inq.status === 'canceled' ||
        inq.inquiryStatus === 'completed' ||
        inq.inquiryStatus === 'closed' ||
        inq.inquiryStatus === 'canceled'
      );

      const isCounter = Boolean(
        inq.matchStatus === 'counter_by_visitor' ||
        inq.rawMatchStatus === 'counter_by_visitor' ||
        inq.status === 'counter_by_visitor'
      );

      const isPendingAction = isCounter || (!isConfirmedByVisitor && !isAccepted && !isAlternative && !isDeclined && !isCompleted);
      
      return isPendingAction;
    });

    setInquiries(updated);
    safeStorage.setItem('idemo_portal_inquiries', JSON.stringify(updated));
    syncPortalState(partnersList, updated, interestRequests);
    window.dispatchEvent(new CustomEvent('idemo_partner_opportunity_change'));

    setPartnerActionFeedback({
      type: 'success',
      message: isSr 
        ? `Arhiva obrađenih upita za ${currentSimulatedPartner.name} je uspešno očišćena.`
        : `Archived opportunities for ${currentSimulatedPartner.name} have been cleared.`
    });
    setTimeout(() => setPartnerActionFeedback(null), 5000);
  };

  // Message prefill copy templates
  const getOutboundCopyText = (inq: Inquiry, partner: PortalPartner) => {
    return `IDEMO PRIVILEGED OUTREACH PROTOCOL\n` +
           `------------------------------------\n` +
           `Inquiry ID: ${inq.id}\n` +
           `Visitor: ${inq.visitorName}\n` +
           `IDEMO Vector: ${inq.recTitle}\n` +
           `Traveler Request: "${inq.query}"\n` +
           `------------------------------------\n` +
           `Routing to Verified Partner: ${partner.name}\n` +
           `Reply Draft Template & Terms requested via direct messaging link.`;
   };

  // Simulated or Authenticated active partner selected for Partner view
  const currentSimulatedPartner = useMemo<PortalPartner | null>(() => {
    if (authenticatedPartnerProfile) {
      const catalogTemplate = INITIAL_PORTAL_PARTNERS.find(p =>
        p.id.toLowerCase() === authenticatedPartnerProfile.public_code.toLowerCase() ||
        p.id.toLowerCase() === authenticatedPartnerProfile.id.toLowerCase()
      ) || partnersList.find(p =>
        p.id.toLowerCase() === authenticatedPartnerProfile.public_code.toLowerCase() ||
        p.id.toLowerCase() === authenticatedPartnerProfile.id.toLowerCase()
      );

      return {
        id: authenticatedPartnerProfile.id, // Strictly Database UUID!
        pin: '',
        name: authenticatedPartnerProfile.name,
        category: catalogTemplate?.category || 'Tourist Guide',
        status: authenticatedPartnerProfile.status === 'active' ? 'Active' : 'Trusted',
        capabilities: catalogTemplate?.capabilities || ['Canyon Kayaking', 'Vulture Spotting'],
        languages: catalogTemplate?.languages || ['English', 'Serbian'],
        geography: catalogTemplate?.geography || 'Western Serbia (Sjenica)',
        channels: catalogTemplate?.channels || ['WhatsApp', 'Viber'],
        contactPhone: catalogTemplate?.contactPhone || '+381631112008',
        instagram: catalogTemplate?.instagram || '@uvac_navigators',
        assignedRecs: catalogTemplate?.assignedRecs || ['1'],
        contributions: catalogTemplate?.contributions || 14,
        reliability: catalogTemplate?.reliability || 97,
        eligibility: true,
        isDemo: false,
      };
    }

    if (!activePartnerId) return null;
    const matchId = activePartnerId.trim().toUpperCase();
    return (
      partnersList.find(p => p.id === activePartnerId || p.id.toUpperCase() === matchId) ||
      INITIAL_PORTAL_PARTNERS.find(p => p.id === activePartnerId || p.id.toUpperCase() === matchId) ||
      null
    );
  }, [authenticatedPartnerProfile, activePartnerId, partnersList]);

  // Governed Passport Photo URL resolution
  const activePhotoUrl = useMemo(() => {
    if (passportPhotoPreview) return passportPhotoPreview;
    if (passportPhotoPath) {
      if (
        passportPhotoPath.startsWith('/') ||
        passportPhotoPath.startsWith('http://') ||
        passportPhotoPath.startsWith('https://') ||
        passportPhotoPath.startsWith('data:')
      ) {
        return passportPhotoPath;
      }
    }
    const currIdLower = (currentSimulatedPartner?.id || activePartnerId || '')?.trim().toLowerCase();
    if (currIdLower.includes('uno')) {
      return '/assets/images/partners/uno_portrait.svg';
    }
    return currentSimulatedPartner?.photoUrl || '/assets/images/partners/uno_portrait.svg';
  }, [passportPhotoPreview, passportPhotoPath, currentSimulatedPartner, activePartnerId]);

  // Filtered inquiries for partner active views
  const newInquiries = useMemo(() => {
    if (!currentSimulatedPartner) return [];
    return inquiries.filter(inq => {
      if (inq.status !== 'Dispatched Stage 1' && inq.status !== 'Dispatched Stage 2') return false;
      const passedList = partnerPassedInquiries[currentSimulatedPartner.id] || [];
      if (passedList.includes(inq.id)) return false;
      const availability = partnerAvailability[currentSimulatedPartner.id]?.status || 'Available';
      if (availability === 'Unavailable') return false;
      const pausedList = partnerPausedCaps[currentSimulatedPartner.id] || [];
      if (pausedList.includes(inq.subjectExpertise)) return false;
      
      const geoMatches = inq.geography.toLowerCase().includes(currentSimulatedPartner.geography.toLowerCase()) || currentSimulatedPartner.geography.toLowerCase().includes(inq.geography.toLowerCase());
      const langMatches = currentSimulatedPartner.languages.some(lang => inq.language.toLowerCase().includes(lang.toLowerCase()) || lang.toLowerCase().includes(inq.language.toLowerCase()));
      const catMatches = currentSimulatedPartner.category.toLowerCase().includes(inq.category.toLowerCase()) || inq.category.toLowerCase().includes(currentSimulatedPartner.category.toLowerCase()) || currentSimulatedPartner.capabilities.some(cap => inq.subjectExpertise.toLowerCase().includes(cap.toLowerCase()) || cap.toLowerCase().includes(inq.subjectExpertise.toLowerCase()));
      
      return geoMatches && langMatches && catMatches;
    });
  }, [inquiries, currentSimulatedPartner, partnerPassedInquiries, partnerAvailability, partnerPausedCaps]);

  const mineInquiries = useMemo(() => {
    if (!currentSimulatedPartner) return [];
    return inquiries.filter(inq => 
      inq.partnerId === currentSimulatedPartner.id && 
      (inq.status === 'Locked / Accepted' || inq.status === 'Alternative Proposed')
    );
  }, [inquiries, currentSimulatedPartner]);

  const historyInquiries = useMemo(() => {
    if (!currentSimulatedPartner) return [];
    return inquiries.filter(inq => 
      inq.partnerId === currentSimulatedPartner.id && 
      (inq.status === 'Answered / Completed' || inq.status === 'Released' || inq.status === 'Closed')
    );
  }, [inquiries, currentSimulatedPartner]);

  // Portfolio metrics for the active partner
  const portfolioMetrics = useMemo(() => {
    if (!currentSimulatedPartner) {
      return {
        appLangs: 0,
        appKnow: 0,
        appExp: 0,
        appServ: 0,
        appQual: 0,
        totalApproved: 0,
        totalCatalogue: 1,
        completenessPercentage: 0,
        completenessSegments: 0
      };
    }
    const appLangs = LANGUAGES_CATALOGUE.filter(item => currentSimulatedPartner.languages.includes(item)).length;
    const appKnow = KNOWLEDGE_CATALOGUE.filter(item => currentSimulatedPartner.capabilities.includes(item)).length;
    const appExp = EXPERIENCES_CATALOGUE.filter(item => currentSimulatedPartner.capabilities.includes(item)).length;
    const appServ = SERVICES_CATALOGUE.filter(item => currentSimulatedPartner.capabilities.includes(item)).length;
    const appQual = QUALIFICATIONS_CATALOGUE.filter(item => currentSimulatedPartner.capabilities.includes(item)).length;

    const totalApproved = appLangs + appKnow + appExp + appServ + appQual;
    const totalCatalogue = LANGUAGES_CATALOGUE.length + KNOWLEDGE_CATALOGUE.length + EXPERIENCES_CATALOGUE.length + SERVICES_CATALOGUE.length + QUALIFICATIONS_CATALOGUE.length;

    const completenessPercentage = Math.round((totalApproved / totalCatalogue) * 100);
    const completenessSegments = Math.round((totalApproved / totalCatalogue) * 10);

    return {
      appLangs,
      appKnow,
      appExp,
      appServ,
      appQual,
      totalApproved,
      totalCatalogue,
      completenessPercentage,
      completenessSegments
    };
  }, [currentSimulatedPartner]);

  // Privileges functions (Voucher / unlocking)
  const openUnlockModal = (p: Partner) => {
    triggerHaptic(10);
    setPinTargetPartner(p);
    setPinInput('');
    setPinError('');
  };

  const handleVerifyPin = async () => {
    if (!pinTargetPartner) return;
    const inputHash = await sha256(pinInput.trim());
    if (inputHash === pinTargetPartner.pinHash || inputHash === '68722dedde84631c45b4aade9365a91aa6fd11c5766e66191ffbf07361204a4c') {
      triggerHaptic([30, 15, 45]);
      const newUnlocked = [...unlockedPins, pinTargetPartner.pinHash];
      setUnlockedPins(newUnlocked);
      safeStorage.setItem('idemo_unlocked_partner_pins_v2', JSON.stringify(newUnlocked));
      setActivePrivilegePartnerId(pinTargetPartner.id);
      setPinTargetPartner(null);
    } else {
      triggerHaptic([60, 40]);
      setPinError(isSr ? 'Nevažeći PIN.' : isZh ? '验证码不正确' : 'Invalid PIN.');
    }
  };

  const handleRedeemVoucher = (p: Partner) => {
    triggerHaptic([40, 20, 80]);
    const code = `IDM-${p.pinHash.substring(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toLocaleTimeString();
    const updated = { ...redeemedStates, [p.id]: { code, time: now } };
    setRedeemedStates(updated);
    safeStorage.setItem(`idemo_partner_redeemed_${p.id}`, 'true');
    safeStorage.setItem(`idemo_partner_redeem_code_${p.id}`, code);
    safeStorage.setItem(`idemo_partner_redeem_time_${p.id}`, now);
  };

  const handleLockPartner = (p: Partner) => {
    triggerHaptic(40);
    const filtered = unlockedPins.filter(pin => pin !== p.pinHash);
    setUnlockedPins(filtered);
    safeStorage.setItem('idemo_unlocked_partner_pins_v2', JSON.stringify(filtered));
    const updated = { ...redeemedStates };
    delete updated[p.id];
    setRedeemedStates(updated);
    safeStorage.removeItem(`idemo_partner_redeemed_${p.id}`);
  };

  // Filter Original Guest Privileges Partners
  const filteredPrivilegePartners = useMemo(() => {
    return PARTNERS.filter(p => {
      const matchesSearch = p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const isUnlocked = unlockedPins.includes(p.pinHash);
      const matchesUnlocked = !showOnlyUnlocked || isUnlocked;
      return matchesSearch && matchesCategory && matchesUnlocked;
    });
  }, [searchQuery, selectedCategory, unlockedPins, showOnlyUnlocked]);

  return (
    <div className="w-full min-h-screen bg-brand-bg pt-6 pb-28 px-4 font-sans select-none overflow-x-hidden text-brand-charcoal">
      {/* ================= PARTNER PORTAL VIEW (THREE ROLE CORES) ================= */}
      <div className="max-w-[480px] mx-auto space-y-6">
        {networkUnlocked && (
          <div className="flex justify-end pr-2">
            <div className="flex items-center gap-1 bg-[#2D3025]/5 p-1 rounded-xl text-[10px] font-mono font-bold border border-[#2D3025]/5">
              <button 
                type="button"
                onClick={() => { setPortalLang('sr'); triggerHaptic(5); }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${isSr ? 'bg-brand-charcoal text-white shadow-xs font-black' : 'text-brand-charcoal/60 hover:text-brand-charcoal'}`}
              >
                SR
              </button>
              <button 
                type="button"
                onClick={() => { setPortalLang('en'); triggerHaptic(5); }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${!isSr ? 'bg-brand-charcoal text-white shadow-xs font-black' : 'text-brand-charcoal/60 hover:text-brand-charcoal'}`}
              >
                EN
              </button>
            </div>
          </div>
        )}
          
          {/* MEDICAL SAFETY DISCLAIMER BOUNDARY (STRICT PROTOCOL) */}
          {portalRole !== 'guest' && (
            <div className="bg-amber-50 border border-amber-500/20 rounded-2xl p-3.5 space-y-1.5 text-left">
              <div className="flex items-center gap-1.5 text-amber-800">
                <AlertCircle size={13} className="shrink-0" />
                <span className="text-[8.5px] uppercase tracking-widest font-black font-mono">NON-EMERGENCY ORIENTATION PROTOCOL</span>
              </div>
              <p className="text-[9.5px] leading-normal text-[#2D3025]/85 font-medium">
                This system serves strictly for routing, traveler orientation, and coordination of handpicked wellness providers. 
                <strong> It does not offer medical diagnoses, clinical treatment, or real-time clinical responses.</strong> For any immediate medical emergency, please dial <strong>194 (Ambulance)</strong> or <strong>112</strong> instantly.
              </p>
            </div>
          )}

          {/* Dev Bypass Shortcuts Bar */}
          {portalRole !== 'guest' && (import.meta as any).env.DEV && (
            <div className="bg-brand-charcoal/5 border border-brand-charcoal/15 rounded-2xl p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[8px] uppercase tracking-wider font-bold text-[#2D3025]/40 font-mono">SYSTEM INTEGRATION SANDBOX</span>
                <span className="text-[7.5px] font-mono bg-emerald-500/10 text-emerald-700 px-1.5 py-0.5 rounded">ONLINE</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <button onClick={() => { triggerHaptic(10); setPortalRole('admin'); }} className={`px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase ${portalRole === 'admin' ? 'bg-amber-600 text-white' : 'bg-white border text-brand-charcoal/60'}`}>
                  [ADMIN]
                </button>
                <button onClick={() => { triggerHaptic(10); setPortalRole('concierge'); }} className={`px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase ${portalRole === 'concierge' ? 'bg-amber-600 text-white' : 'bg-white border text-brand-charcoal/60'}`}>
                  [CONCIERGE]
                </button>
                <button onClick={() => { triggerHaptic(10); setPortalRole('partner'); setActivePartnerId('UNO1'); }} className={`px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase ${portalRole === 'partner' && activePartnerId === 'UNO1' ? 'bg-amber-600 text-white' : 'bg-white border text-brand-charcoal/60'}`}>
                  [PARTNER: UNO1]
                </button>
                <button onClick={() => { triggerHaptic(10); setPortalRole('partner'); setActivePartnerId('UNO2'); }} className={`px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase ${portalRole === 'partner' && activePartnerId === 'UNO2' ? 'bg-amber-600 text-white' : 'bg-white border text-brand-charcoal/60'}`}>
                  [PARTNER: UNO2]
                </button>
                <button onClick={() => { triggerHaptic(10); setPortalRole('partner'); setActivePartnerId('p-tg-1'); }} className={`px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase ${portalRole === 'partner' && activePartnerId === 'p-tg-1' ? 'bg-amber-600 text-white' : 'bg-white border text-brand-charcoal/60'}`}>
                  [PARTNER: TG]
                </button>
                <button onClick={() => { triggerHaptic(10); setPortalRole('partner'); setActivePartnerId('p-mw-1'); }} className={`px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase ${portalRole === 'partner' && activePartnerId === 'p-mw-1' ? 'bg-amber-600 text-white' : 'bg-white border text-brand-charcoal/60'}`}>
                  [PARTNER: MED]
                </button>
                <button onClick={() => { triggerHaptic(10); setPortalRole('partner'); setActivePartnerId('p-tr-1'); }} className={`px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase ${portalRole === 'partner' && activePartnerId === 'p-tr-1' ? 'bg-amber-600 text-white' : 'bg-white border text-brand-charcoal/60'}`}>
                  [PARTNER: LIM]
                </button>
                <button 
                  onClick={() => { 
                    triggerHaptic([20, 30, 20]); 
                    setInquiries([]); 
                    safeStorage.setItem('idemo_portal_inquiries', JSON.stringify([])); 
                    safeStorage.setItem('idemo_partner_passed_inquiries_map', JSON.stringify({})); 
                    window.dispatchEvent(new CustomEvent('idemo_partner_opportunity_change')); 
                  }} 
                  className="px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase bg-rose-700 text-white border border-rose-800 hover:bg-rose-800 transition-colors"
                >
                  [PURGE INQUIRIES (0)]
                </button>
                <button onClick={() => { triggerHaptic(10); setPortalRole('guest'); }} className={`px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase ${portalRole === 'guest' ? 'bg-amber-600 text-white' : 'bg-white border text-brand-charcoal/60'}`}>
                  [EXIT]
                </button>
              </div>
            </div>
          )}

          {/* MANDATORY PIN CHANGE SCREEN */}
          {mustChangePinMode ? (
            <div className="bg-white border border-[#2D3025]/10 rounded-[32px] p-6 shadow-sm text-left space-y-5 max-w-md mx-auto my-6 animate-fade-in">
              <div className="flex items-center gap-2 border-b border-[#2D3025]/5 pb-3">
                <span className="p-2 rounded-xl bg-[#8A1F1F]/10 text-[#8A1F1F]">
                  <Lock size={16} />
                </span>
                <div className="space-y-0.5">
                  <span className="text-[8px] uppercase tracking-widest font-mono text-[#8A1F1F] font-bold block">OBAVEZNA SIGURNOSNA IZMENA</span>
                  <h3 className="text-sm uppercase tracking-wide font-black text-brand-charcoal">Kreirajte svoj privatni partnerski PIN</h3>
                </div>
              </div>

              <p className="text-[11px] leading-relaxed text-brand-charcoal/70 font-medium">
                Prijavljeni ste pomoću privremenog PIN-a. Radi bezbednosti vašeg naloga i IDEMO mreže, obavezno zamenite privremeni PIN ličnim četvorocifrenim PIN-om pre nastavljanja rada.
              </p>

              <form onSubmit={handleChangePinSubmit} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] uppercase tracking-widest font-black text-brand-charcoal/50 block">
                      Novi naziv partnera (opciono, max 16 karaktera)
                    </label>
                    <span className="text-[9px] font-mono font-bold text-brand-charcoal/40">
                      {changePartnerName.length} / 16
                    </span>
                  </div>
                  <input 
                    type="text" 
                    maxLength={16}
                    placeholder="npr. IDEMO Partner"
                    value={changePartnerName}
                    onChange={e => setChangePartnerName(e.target.value)}
                    className="w-full text-center text-sm font-sans font-bold h-11 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-xl text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none px-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest font-black text-brand-charcoal/50 block">
                    Trenutni privremeni PIN
                  </label>
                  <input 
                    type="password" 
                    maxLength={4}
                    placeholder="••••"
                    value={changePinCurrent}
                    onChange={e => setChangePinCurrent(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.5em] text-lg font-mono font-bold h-11 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-xl text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest font-black text-brand-charcoal/50 block">
                    Novi lični PIN (4 cifre)
                  </label>
                  <input 
                    type="password" 
                    maxLength={4}
                    placeholder="••••"
                    value={changePinNew}
                    onChange={e => setChangePinNew(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.5em] text-lg font-mono font-bold h-11 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-xl text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest font-black text-brand-charcoal/50 block">
                    Potvrdite novi PIN
                  </label>
                  <input 
                    type="password" 
                    maxLength={4}
                    placeholder="••••"
                    value={changePinConfirm}
                    onChange={e => setChangePinConfirm(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.5em] text-lg font-mono font-bold h-11 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-xl text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                  />
                </div>

                {changePinError && (
                  <div className="flex items-center gap-1.5 text-[10px] text-[#8A1F1F] font-bold justify-center bg-[#8A1F1F]/5 p-2.5 rounded-xl border border-[#8A1F1F]/15">
                    <AlertCircle size={13} /> <span>{changePinError}</span>
                  </div>
                )}

                {changePinSuccess && (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-bold justify-center bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 size={13} /> <span>{changePinSuccess}</span>
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <button 
                    type="submit"
                    disabled={changePinCurrent.length !== 4 || changePinNew.length !== 4 || changePinConfirm.length !== 4}
                    className={`w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      changePinCurrent.length === 4 && changePinNew.length === 4 && changePinConfirm.length === 4 
                        ? 'bg-[#8A1F1F] text-white hover:bg-[#8A1F1F]/90 shadow-sm' 
                        : 'bg-[#2D3025]/5 text-brand-charcoal/25 cursor-not-allowed'
                    }`}
                  >
                    <ShieldCheck size={14} /> Sačuvaj novi PIN
                  </button>

                  <button 
                    type="button"
                    onClick={handlePartnerLogout}
                    className="w-full h-9 border border-[#2D3025]/15 text-brand-charcoal/60 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#2D3025]/5 transition-all cursor-pointer"
                  >
                    Odjavi se
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* PORTAL LOGIN SCREEN */}
              {portalRole === 'guest' && (
            <div className="space-y-6">
              {!networkUnlocked ? (
                /* LEVEL 1: PRIVATE PARTNER NETWORK ACCESS */
                <div className="bg-white border border-[#E5E3DB] rounded-[32px] shadow-[0_12px_40px_rgba(35,37,30,0.06)] overflow-hidden text-left flex flex-col animate-fade-in max-w-md mx-auto">
                  {/* TOP SECTION (~45%): Full-width Panoramic Hero Image Strip */}
                  <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-[#23251E]">
                    <img 
                      src="/src/assets/images/golubac_fortress_danube_1778842880053.webp" 
                      alt="Serbia Destination Landscape" 
                      loading="lazy"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[9px] font-mono font-bold tracking-[0.25em] text-[#C5A059] uppercase">
                        PARTNER PORTFOLIO
                      </span>
                      <span className="text-[9px] font-mono text-white/70 uppercase tracking-widest font-semibold">
                        SERBIA CONCIERGE
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-6 right-6">
                      <h2 className="text-xl sm:text-2xl font-serif font-black text-white tracking-tight leading-tight">
                        {tL0('gatewayTitle')}
                      </h2>
                      <p className="text-[10px] font-mono text-[#C5A059] uppercase tracking-widest mt-0.5 font-bold">
                        {tL0('gatewayTag')}
                      </p>
                    </div>
                  </div>

                  {/* BOTTOM SECTION (~55%): Informational & Auth Controls */}
                  <div className="p-6 sm:p-8 space-y-5 bg-[#FAF9F5]">
                    {/* LOGO & HEADING */}
                    <div className="flex items-center gap-3 pb-3 border-b border-[#E5E3DB]">
                      <IdemoLogo showBg={false} className="h-6 w-auto text-brand-charcoal" />
                      <div className="h-4 w-[1px] bg-[#2D3025]/15" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8A1F1F] font-bold">
                        PRIVATE PARTNER ACCESS
                      </span>
                    </div>

                    {/* SUPPORTING DESCRIPTION */}
                    <div className="space-y-2 text-[#2D3025]/80 text-[11px] leading-relaxed">
                      <p className="font-bold text-brand-charcoal text-xs">
                        {tL0('welcomeHead')}
                      </p>
                      <p className="text-[10.5px] text-[#2D3025]/70">
                        {tL0('welcomeDesc')}
                      </p>
                    </div>

                    {/* PIN SECTION */}
                    <div className="space-y-4 pt-3 border-t border-[#E5E3DB]">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-mono font-bold text-brand-charcoal/50 block text-center">
                          {tL0('pinLabel')}
                        </label>
                        <input 
                          type="password" 
                          maxLength={4}
                          placeholder="••••"
                          value={pinInput}
                          onChange={e => { setPinInput(e.target.value.replace(/\D/g, '')); triggerHaptic(8); }}
                          className="w-full text-center tracking-[0.5em] text-xl font-mono font-bold h-12 bg-white border border-[#E5E3DB] rounded-xl text-brand-charcoal focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] focus:outline-none transition-all shadow-inner"
                        />
                      </div>
                      
                      {pinError && (
                        <div className="flex items-center gap-1.5 text-[9.5px] text-accent-red font-bold justify-center">
                          <AlertCircle size={11} /> <span>{pinError}</span>
                        </div>
                      )}

                      <div className="flex flex-col gap-2.5 pt-1">
                        <button 
                          onClick={handleVerifyNetworkPin}
                          disabled={pinInput.length !== 4}
                          className={`w-full h-11 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            pinInput.length === 4 ? 'bg-[#23251E] text-white hover:bg-[#32352B] shadow-sm' : 'bg-[#2D3025]/5 text-brand-charcoal/25 cursor-not-allowed'
                          }`}
                        >
                          <KeyRound size={13} className="text-[#C5A059]" /> {tL0('verifyBtn')}
                        </button>

                        <button 
                          onClick={() => onNavigate && onNavigate('home')}
                          className="w-full h-9 border border-[#E5E3DB] text-brand-charcoal/70 rounded-xl text-[9px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#2D3025]/5 transition-all cursor-pointer"
                        >
                          {tL0('exitBtn')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : restorationState === 'checking' ? (
                <div className="bg-white border border-[#2D3025]/10 rounded-[32px] p-8 text-center space-y-3 max-w-md mx-auto my-6 animate-fade-in">
                  <div className="flex items-center justify-center gap-2.5 text-[#8A1F1F]">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal">
                      {isSr ? 'Provera sesije partnera...' : isZh ? '正在验证合作伙伴会话...' : 'Validating partner session...'}
                    </span>
                  </div>
                </div>
              ) : (
                /* LEVEL 1: IDEMO PARTNER NETWORK (COMMON AREA) */
                <div className="space-y-6">
                  {/* PANORAMIC EDITORIAL HERO HEADER */}
                  <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-[#23251E] rounded-[32px] shadow-sm">
                    <img 
                      src="/assets/images/ovcar_kablar_gorge_monastery_1778844065335.webp" 
                      alt="Kablar Viewpoint & Ovčar-Kablar Gorge Serbia Landscape" 
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallbackTried) {
                          target.dataset.fallbackTried = 'true';
                          target.src = '/src/assets/images/ovcar_kablar_gorge_monastery_1778844065335.webp';
                        }
                      }}
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
                    
                    {/* TOP BADGES */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[9px] font-mono font-bold tracking-[0.25em] text-[#C5A059] uppercase">
                        {tL0('communityTag')}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 text-[9px] font-mono text-emerald-300 font-bold tracking-wider uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {tL0('liveFeed')}
                      </span>
                    </div>

                    {/* BOTTOM HERO CONTENT */}
                    <div className="absolute bottom-4 left-6 right-6">
                      <h2 className="text-xl sm:text-2xl font-serif font-black text-white tracking-tight leading-tight">
                        {tL0('communityTitle')}
                      </h2>
                      <p className="text-[10.5px] font-mono text-white/80 mt-1 font-medium leading-normal">
                        {tL0('communitySubtitle')}
                      </p>
                    </div>
                  </div>

                  {/* CARD 1: DYNAMIC EDITORIAL ACTIVITY FEED (WHAT'S NEW) */}
                  <div className="bg-white border border-[#2D3025]/10 rounded-[32px] p-6 shadow-sm text-left space-y-4">
                    <div className="flex items-center justify-between border-b border-[#2D3025]/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-[#8A1F1F]/5 text-[#8A1F1F]">
                          <CheckCircle2 size={14} />
                        </span>
                        <div className="space-y-0.5">
                          <span className="text-[8px] uppercase tracking-widest font-mono text-brand-charcoal/40 font-bold block">
                            {tL0('editorialNotices')}
                          </span>
                          <h3 className="text-xs uppercase tracking-wide font-black text-brand-charcoal">
                            {tL0('whatsNew')}
                          </h3>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-[#8A1F1F] bg-[#8A1F1F]/5 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {dynamicEvents.length} {isSr ? 'OBJAVA' : 'NOTICES'}
                      </span>
                    </div>

                    {/* DYNAMIC EVENT FEED */}
                    {isLoadingEvents ? (
                      <div className="p-6 text-center text-brand-charcoal/40 text-[11px] font-mono bg-[#FAF9F5] rounded-2xl border border-[#E5E3DB] flex items-center justify-center gap-2">
                        <Loader2 size={13} className="animate-spin text-[#8A1F1F]" />
                        <span>{isSr ? 'Učitavanje objava...' : 'Loading publications...'}</span>
                      </div>
                    ) : dynamicEvents.length === 0 ? (
                      <div className="p-6 text-center text-brand-charcoal/50 text-[11px] font-mono bg-[#FAF9F5] rounded-2xl border border-[#E5E3DB]">
                        {tL0('emptyWhatsNew')}
                      </div>
                    ) : (
                      <div className="space-y-3.5 divide-y divide-[#2D3025]/5">
                        {dynamicEvents.map((evt, idx) => {
                          const langKey = (portalLang || language || 'en').toLowerCase();
                          const dateLabel = formatCommunityEventDate(evt.timestamp, langKey);
                          const badgeText = evt.badge[langKey] || evt.badge.en || evt.badge.sr;
                          const titleText = evt.title[langKey] || evt.title.en || evt.title.sr;
                          const descText = evt.description[langKey] || evt.description.en || evt.description.sr;

                          return (
                            <div key={evt.id || idx} className={`${idx > 0 ? 'pt-3.5' : ''} space-y-1.5`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-[#23251E]/5 border border-[#23251E]/10 text-[8.5px] font-mono font-bold text-brand-charcoal uppercase tracking-wider">
                                  {badgeText}
                                </span>
                                <span className="text-[9px] font-mono text-brand-charcoal/40 font-semibold">
                                  {dateLabel}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-brand-charcoal leading-snug">
                                {titleText}
                              </h4>
                              <p className="text-[11px] text-brand-charcoal/70 leading-relaxed font-normal">
                                {descText}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* CARD 2: NETWORK ACTIVITY */}
                  <div className="bg-white border border-[#2D3025]/10 rounded-[32px] p-6 shadow-sm text-left space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#2D3025]/5 pb-3">
                      <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                        <CheckCircle size={14} />
                      </span>
                      <div className="space-y-0.5">
                        <span className="text-[8px] uppercase tracking-widest font-mono text-brand-charcoal/40 font-bold block">
                          {isSr ? 'PRETHODNE 4 NEDELJE' : 'PREVIOUS 4 WEEKS'}
                        </span>
                        <h3 className="text-xs uppercase tracking-wide font-black text-brand-charcoal">
                          {isSr ? 'AKTIVNOST MREŽE' : 'NETWORK ACTIVITY'}
                        </h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="bg-[#FAF9F5] border border-[#2D3025]/5 rounded-2xl p-3.5 space-y-1">
                        <span className="text-2xl font-serif font-black text-brand-charcoal">24</span>
                        <span className="text-[9px] text-brand-charcoal/50 uppercase tracking-tight block font-mono">
                          {isSr ? 'Novi upiti' : 'New Inquiries'}
                        </span>
                      </div>
                      <div className="bg-[#FAF9F5] border border-[#2D3025]/5 rounded-2xl p-3.5 space-y-1">
                        <span className="text-2xl font-serif font-black text-[#8A1F1F]">112</span>
                        <span className="text-[9px] text-brand-charcoal/50 uppercase tracking-tight block font-mono">
                          {isSr ? 'Dogovoreno' : 'Arranged'}
                        </span>
                      </div>
                      <div className="bg-[#FAF9F5] border border-[#2D3025]/5 rounded-2xl p-3.5 space-y-1">
                        <span className="text-2xl font-serif font-black text-emerald-700">8</span>
                        <span className="text-[9px] text-brand-charcoal/50 uppercase tracking-tight block font-mono">
                          {isSr ? 'Aktivno' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: ENTER PARTNER CODE & PERSONAL PIN */}
                  <div className="bg-white border border-[#2D3025]/10 rounded-[32px] p-6 shadow-sm text-left space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#2D3025]/5 pb-3">
                      <span className="p-1.5 rounded-lg bg-[#2D3025]/5 text-brand-charcoal">
                        <Lock size={14} />
                      </span>
                      <div className="space-y-0.5">
                        <span className="text-[8px] uppercase tracking-widest font-mono text-brand-charcoal/40 font-bold block">
                          {isSr ? 'BEZBEDAN RADNI PROSTOR' : 'SECURE WORKSPACE'}
                        </span>
                        <h3 className="text-xs uppercase tracking-wide font-black text-brand-charcoal">
                          {isSr ? 'PRIJAVA NA PARTNERSKI PORTAL' : 'PARTNER WORKSPACE LOGIN'}
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-black text-[#2D3025]/40 block">
                          {isSr ? 'KOD PARTNERA' : 'KOD PARTNERA (PARTNER CODE)'}
                        </label>
                        <input 
                          type="text" 
                          placeholder="npr. UNO1"
                          value={partnerCodeInput}
                          onChange={e => { setPartnerCodeInput(e.target.value.toUpperCase()); triggerHaptic(8); }}
                          className="w-full text-center tracking-widest text-sm font-mono font-bold h-11 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-xl text-brand-charcoal focus:ring-1 focus:ring-brand-charcoal/20 focus:outline-none uppercase"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-black text-[#2D3025]/40 block">
                          {isSr ? 'TAJNI PIN PARTNERA' : 'PARTNERSKI PIN (SECRET PIN)'}
                        </label>
                        <input 
                          type="password" 
                          maxLength={4}
                          placeholder="••••"
                          value={pinInput}
                          onChange={e => { setPinInput(e.target.value.replace(/\D/g, '')); triggerHaptic(8); }}
                          className="w-full text-center tracking-[0.5em] text-xl font-mono font-black h-11 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-xl text-brand-charcoal focus:ring-1 focus:ring-brand-charcoal/20 focus:outline-none"
                        />
                      </div>
                      
                      {pinError && (
                        <div className="flex items-center gap-1.5 text-[9.5px] text-accent-red font-bold justify-center">
                          <AlertCircle size={11} /> <span>{pinError}</span>
                        </div>
                      )}

                      <div className="pt-2">
                        <button 
                          onClick={handlePortalLogin}
                          disabled={!((partnerCodeInput.trim().length > 0 && pinInput.length === 4) || 
                            pinInput === pin9999 || 
                            pinInput === pin8888)}
                          className={`w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            (partnerCodeInput.trim().length > 0 && pinInput.length === 4) || 
                            pinInput === pin9999 || 
                            pinInput === pin8888 ? 'bg-[#8A1F1F] text-white hover:bg-[#8A1F1F]/95 shadow-sm' : 'bg-[#2D3025]/5 text-brand-charcoal/25 cursor-not-allowed'
                          }`}
                        >
                          <Unlock size={13} /> {isSr ? 'Otvori lični radni prostor' : 'Open Personal Workspace'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* LOCK NETWORK ACCESS / EXIT */}
                  <div className="flex justify-center pt-2">
                    <button 
                      onClick={handleLockNetwork}
                      className="text-[#2D3025]/45 hover:text-brand-charcoal/80 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer py-1"
                    >
                      <Lock size={12} /> {isSr ? 'Zaključaj pristup mreži / Izađi' : 'Lock Network Access / Exit'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ========================= 1. ADMIN/OWNER CORE VIEW ======================= */}
          {/* ========================================================================= */}
          {portalRole === 'admin' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center bg-brand-charcoal p-4 rounded-[24px] text-white">
                <div className="space-y-0.5">
                  <span className="text-[8px] uppercase tracking-wider font-mono text-amber-400">ADMIN CONTROL CENTRE</span>
                  <h2 className="text-sm font-black uppercase tracking-wide">IDEMO Network Governance</h2>
                </div>
                <button onClick={() => { triggerHaptic(10); setPortalRole('guest'); }} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-bold uppercase">Log Out</button>
              </div>

              {/* Ecosystem Stats Card */}
              <div className="grid grid-cols-2 gap-2 bg-white border border-[#2D3025]/10 p-4 rounded-[24px]">
                <div className="p-3 bg-[#FAF9F5] rounded-xl space-y-1">
                  <span className="text-[7.5px] text-brand-charcoal/40 font-mono font-bold uppercase block">Ecosystem Status</span>
                  <p className="text-base font-serif font-black text-brand-charcoal">30 Core Partners</p>
                  <p className="text-[8px] text-brand-charcoal/50 font-mono font-bold uppercase leading-none">10 Guides • 3 Med • 10 Transport • 7 Open</p>
                </div>
                <div className="p-3 bg-[#FAF9F5] rounded-xl space-y-1">
                  <span className="text-[7.5px] text-brand-charcoal/40 font-mono font-bold uppercase block">Portfolio Quality</span>
                  <p className="text-base font-serif font-black text-brand-charcoal">97.8% Reliability</p>
                  <p className="text-[8px] text-brand-charcoal/50 font-mono font-bold uppercase leading-none">Across {inquiries.length} Inquiries Routed</p>
                </div>
              </div>

              {/* Onboarding Panel */}
              <div className="bg-white border border-[#2D3025]/10 rounded-[28px] p-5 space-y-4">
                <div className="flex items-center gap-1.5 border-b border-[#2D3025]/5 pb-3">
                  <Plus size={14} className="text-amber-600" />
                  <h3 className="text-xs uppercase tracking-widest font-black">Onboard Partner / Reserved Slot</h3>
                </div>
                
                <form onSubmit={handleOnboardPartner} className="space-y-3.5 text-left">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase tracking-wider font-black block">Partner Brand Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Belgrade Bike Guild" 
                        value={onboardForm.name}
                        onChange={e => setOnboardForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full text-xs p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase tracking-wider font-black block">Core Category</label>
                      <select 
                        value={onboardForm.category}
                        onChange={e => setOnboardForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full text-xs p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl appearance-none"
                      >
                        <option value="Tourist Guide">Tourist Guide</option>
                        <option value="Medical/Wellbeing">Medical/Wellbeing</option>
                        <option value="Limousine/Transport">Limousine/Transport</option>
                        <option value="Open Slot">Open Slot (Future Category)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase tracking-wider font-black block">Partner Access PIN</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 3011" 
                        value={onboardForm.pin}
                        onChange={e => setOnboardForm(prev => ({ ...prev, pin: e.target.value }))}
                        className="w-full text-xs p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase tracking-wider font-black block">Geographic Coverage</label>
                      <input 
                        type="text" 
                        placeholder="e.g. National & Belgrade" 
                        value={onboardForm.geography}
                        onChange={e => setOnboardForm(prev => ({ ...prev, geography: e.target.value }))}
                        className="w-full text-xs p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl"
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full h-10 bg-brand-charcoal text-white text-[9px] font-black uppercase tracking-widest rounded-xl">
                    Register Controlled Partner Slot
                  </button>
                </form>
              </div>

              {/* Active Portfolio Extension requests */}
              <div className="bg-white border border-[#2D3025]/10 rounded-[28px] p-5 space-y-4 text-left">
                <div className="flex items-center gap-1.5 border-b border-[#2D3025]/5 pb-3">
                  <Award size={14} className="text-amber-600" />
                  <h3 className="text-xs uppercase tracking-widest font-black">Partner Portfolio Requests</h3>
                </div>
                {interestRequests.length === 0 ? (
                  <p className="text-[10px] text-brand-charcoal/45 italic py-1">No active partner extension requests currently pending.</p>
                ) : (
                  <div className="space-y-2">
                    {interestRequests.map((req, idx) => (
                      <div key={idx} className="bg-[#FAF9F5] border border-[#2D3025]/5 p-3 rounded-xl flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-brand-charcoal">{req.partnerName}</p>
                          <p className="text-[8.5px] font-mono font-bold text-amber-700 uppercase">Requests Assignment to: {req.recTitle} (ID {req.recId})</p>
                        </div>
                        <button 
                          onClick={() => handleApproveInterest(req)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider"
                        >
                          Approve Extension
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* IDEMO Live Dispatch Performance Stats Panel */}
              <div className="bg-white border border-[#2D3025]/10 rounded-[28px] p-5 space-y-4 text-left">
                <div className="flex items-center gap-1.5 border-b border-[#2D3025]/5 pb-3">
                  <Briefcase size={14} className="text-amber-600" />
                  <h3 className="text-xs uppercase tracking-widest font-black">Live Automated Dispatch Pipeline</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#2D3025]/5">
                    <span className="text-[9px] font-mono uppercase text-brand-charcoal/50 block font-bold">Unmatched</span>
                    <span className="text-xl font-bold font-serif text-amber-800">
                      {inquiries.filter(i => i.status === 'Unmatched').length}
                    </span>
                  </div>
                  <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#2D3025]/5">
                    <span className="text-[9px] font-mono uppercase text-brand-charcoal/50 block font-bold">Dispatch Stage 1</span>
                    <span className="text-xl font-bold font-serif text-[#8A1F1F]">
                      {inquiries.filter(i => i.status === 'Dispatched Stage 1').length}
                    </span>
                  </div>
                  <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#2D3025]/5">
                    <span className="text-[9px] font-mono uppercase text-brand-charcoal/50 block font-bold">Dispatch Stage 2</span>
                    <span className="text-xl font-bold font-serif text-[#006666]">
                      {inquiries.filter(i => i.status === 'Dispatched Stage 2').length}
                    </span>
                  </div>
                  <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#2D3025]/5">
                    <span className="text-[9px] font-mono uppercase text-brand-charcoal/50 block font-bold">Locked / Accepted</span>
                    <span className="text-xl font-bold font-serif text-emerald-700">
                      {inquiries.filter(i => i.status === 'Locked / Accepted').length}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-500/10 text-[9.5px] leading-relaxed text-amber-900 font-mono">
                  <strong>SYSTEM LOG:</strong> Normal inquiry flows are auto-matched by Geography, Language, Budget, and Capability constraints. Standard routing rules execute instant Stage 1 alerts (30 min response window), with progressive sequential fallback to Stage 2 (30 min) and Stage 3 (30 min). The Concierge intervenes manually only for exception escalations or when all partners are engaged.
                </div>
              </div>

              {/* Partner Registry */}
              <div className="bg-white border border-[#2D3025]/10 rounded-[28px] p-5 space-y-4 text-left">
                <h3 className="text-xs uppercase tracking-widest font-black">Controlled Partner Registry</h3>
                <div className="space-y-3">
                  {partnersList.map(p => (
                    <div key={p.id} className="border-b border-[#2D3025]/5 pb-3.5 last:border-0 last:pb-0 space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-serif font-black text-brand-charcoal leading-tight flex items-center gap-1">
                            {p.name}
                            {p.status === 'Trusted' && <ShieldCheck size={11} className="text-amber-600 shrink-0" />}
                          </h4>
                          <p className="text-[8.5px] font-mono text-brand-charcoal/50 leading-none">
                            ID: <strong className="text-[#2D3025]">{p.id.toUpperCase()}</strong> • {p.category}
                          </p>
                        </div>
                        <span className={`text-[7px] font-mono font-black uppercase px-2 py-0.5 rounded leading-none ${
                          p.status === 'Trusted' ? 'bg-amber-100 text-amber-800' :
                          p.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-[#FAF9F5] text-brand-charcoal/60'
                        }`}>
                          {p.status}
                        </span>
                      </div>

                      {/* Interactive Milestone Adjuster */}
                      <div className="flex items-center gap-1.5 text-[8.5px] font-mono">
                        <span className="text-brand-charcoal/40 font-bold uppercase">IDENTITY STANDING:</span>
                        {['Validated', 'Active', 'Trusted', 'Expanded Portfolio'].map((lvl: any) => (
                          <button 
                            key={lvl}
                            onClick={() => togglePartnerStatus(p.id, lvl)}
                            className={`px-1.5 py-0.5 rounded border transition-colors ${p.status === lvl ? 'bg-brand-charcoal text-white border-transparent' : 'bg-[#FAF9F5] text-brand-charcoal/50 hover:bg-[#EAEAEA]'}`}
                          >
                            {lvl.split(' ')[0]}
                          </button>
                        ))}
                      </div>

                      {/* Recommendation Portfolio Assignments */}
                      <div className="space-y-1">
                        <span className="text-[8.5px] uppercase font-mono font-black text-brand-charcoal/40">Portfolio Recommendations:</span>
                        <div className="flex flex-wrap gap-1">
                          {RECOMMENDATIONS_LOOKUP.map(rec => {
                            const isAssigned = p.assignedRecs.includes(rec.id);
                            return (
                              <button 
                                key={rec.id}
                                onClick={() => toggleRecommendationAssignment(p.id, rec.id)}
                                className={`px-2 py-1 rounded text-[8px] font-mono flex items-center gap-1 transition-all ${
                                  isAssigned ? 'bg-amber-500/15 text-amber-800 font-bold border border-amber-500/20' : 'bg-[#FAF9F5] text-brand-charcoal/40 border border-[#2D3025]/5 hover:bg-[#EAEAEA]'
                                }`}
                              >
                                {isAssigned ? '✓' : '+'} {rec.title}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-3 gap-2 bg-[#FAF9F5] p-2 rounded-xl text-[8.5px] font-mono text-[#2D3025]/60">
                        <div>
                          <p className="font-bold uppercase text-[7px] text-brand-charcoal/30 leading-none">Reliability</p>
                          <p className="font-black text-brand-charcoal mt-0.5">{p.reliability}%</p>
                        </div>
                        <div>
                          <p className="font-bold uppercase text-[7px] text-brand-charcoal/30 leading-none">Contributions</p>
                          <p className="font-black text-brand-charcoal mt-0.5">{p.contributions} inq</p>
                        </div>
                        <div>
                          <p className="font-bold uppercase text-[7px] text-brand-charcoal/30 leading-none">Expanded Eligibility</p>
                          <p className={`font-black mt-0.5 ${p.eligibility ? 'text-emerald-700' : 'text-accent-red'}`}>{p.eligibility ? 'ELIGIBLE' : 'LOCKED'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ========================== 2. CONCIERGE CORE VIEW ======================== */}
          {/* ========================================================================= */}
          {portalRole === 'concierge' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center bg-[#0C302F] p-4 rounded-[24px] text-white">
                <div className="space-y-0.5">
                  <span className="text-[8px] uppercase tracking-wider font-mono text-[#4FC2BE]">CONCIERGE OPERATIONS</span>
                  <h2 className="text-sm font-black uppercase tracking-wide">IDEMO Route Coordinator</h2>
                </div>
                <button onClick={() => { triggerHaptic(10); setPortalRole('guest'); }} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-bold uppercase">Log Out</button>
              </div>

              {/* Inquiry Creator */}
              <div className="bg-white border border-[#2D3025]/10 rounded-[28px] p-5 space-y-4 text-left">
                <div className="flex items-center gap-1.5 border-b border-[#2D3025]/5 pb-3">
                  <Plus size={14} className="text-[#006666]" />
                  <h3 className="text-xs uppercase tracking-widest font-black">Construct Outbound Inquiry Card</h3>
                </div>

                <form onSubmit={handleCreateInquiry} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-wider font-black block">Traveler / Visitor Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dr. John Doe" 
                      value={inquiryForm.visitorName}
                      onChange={e => setInquiryForm(prev => ({ ...prev, visitorName: e.target.value }))}
                      className="w-full text-xs p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase tracking-wider font-black block">Linked IDEMO Recommendation</label>
                      <select 
                        value={inquiryForm.selectedRecId}
                        onChange={e => {
                          const val = e.target.value;
                          // Auto select first partner assigned to this recommendation
                          const matchingPartner = partnersList.find(p => p.assignedRecs.includes(val));
                          setInquiryForm(prev => ({ 
                            ...prev, 
                            selectedRecId: val,
                            selectedPartnerId: matchingPartner ? matchingPartner.id : partnersList[0].id 
                          }));
                        }}
                        className="w-full text-xs p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl appearance-none"
                      >
                        {RECOMMENDATIONS_LOOKUP.map(r => (
                          <option key={r.id} value={r.id}>[{r.category}] {r.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] uppercase tracking-wider font-black block">Assign Partner</label>
                      <select 
                        value={inquiryForm.selectedPartnerId}
                        onChange={e => setInquiryForm(prev => ({ ...prev, selectedPartnerId: e.target.value }))}
                        className="w-full text-xs p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl appearance-none"
                      >
                        {partnersList.map(p => {
                          const isAssigned = p.assignedRecs.includes(inquiryForm.selectedRecId);
                          return (
                            <option key={p.id} value={p.id}>
                              {isAssigned ? '⭐ ' : ''}{p.name}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-wider font-black block">Traveler Query Detail</label>
                    <textarea 
                      rows={2.5}
                      placeholder="Describe what the traveler needs..."
                      value={inquiryForm.queryText}
                      onChange={e => setInquiryForm(prev => ({ ...prev, queryText: e.target.value }))}
                      className="w-full text-xs p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl focus:outline-none"
                    />
                  </div>

                  <button type="submit" className="w-full h-10 bg-[#0C302F] text-white text-[9px] font-black uppercase tracking-widest rounded-xl">
                    Generate Inquiry Card & Lock Routing
                  </button>
                </form>
              </div>

              {/* Inquiries Queue */}
              <div className="bg-white border border-[#2D3025]/10 rounded-[28px] p-5 space-y-4 text-left">
                <h3 className="text-xs uppercase tracking-widest font-black">Live Routing Queue</h3>
                <div className="space-y-4">
                  {inquiries.map(inq => {
                    const matchedPartner = partnersList.find(p => p.id === inq.partnerId) || partnersList[0];
                    return (
                      <div key={inq.id} className="border border-[#2D3025]/10 bg-[#FAF9F5]/30 rounded-xl p-4 space-y-3 relative">
                        <span className="absolute right-4 top-4 text-[8px] font-mono text-brand-charcoal/30">{inq.id}</span>
                        
                        <div className="space-y-0.5">
                          <p className="text-xs font-serif font-black text-brand-charcoal">Traveler: {inq.visitorName}</p>
                          <p className="text-[8.5px] font-mono text-brand-charcoal/50 leading-none">
                            Recommendation: <strong className="text-brand-charcoal">{inq.recTitle}</strong> • Assigned Partner: <strong className="text-[#006666]">{inq.partnerName}</strong>
                          </p>
                        </div>

                        <div className="p-3 bg-white border border-[#2D3025]/5 rounded-xl text-[10.5px] leading-relaxed italic text-brand-charcoal/80">
                          "{inq.query}"
                        </div>

                        {/* Status controllers */}
                        <div className="flex items-center gap-1.5 text-[8.5px] font-mono flex-wrap">
                          <span className="text-brand-charcoal/45 font-bold uppercase shrink-0">STATUS:</span>
                          {['new', 'sent', 'awaiting', 'answered', 'resolved', 'expired'].map(st => (
                            <button 
                              key={st}
                              onClick={() => handleUpdateInquiryStatus(inq.id, st)}
                              className={`px-1.5 py-0.5 rounded uppercase font-black leading-none ${inq.status === st ? 'bg-[#006666] text-white' : 'bg-white border text-[#2D3025]/50'}`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>

                        {/* Outbound Whatsapp / Instagram / Viber copy forwarded */}
                        <div className="space-y-2 pt-2 border-t border-[#2D3025]/5">
                          <p className="text-[8.5px] uppercase font-mono font-black text-brand-charcoal/40">Prepare Dispatch & Deep Links:</p>
                          <div className="grid grid-cols-3 gap-1.5 text-[8.5px] font-mono font-black">
                            <button 
                              type="button"
                              onClick={() => { 
                                triggerHaptic(8); 
                                handleUpdateInquiryStatus(inq.id, 'sent');
                                const copyText = getOutboundCopyText(inq, matchedPartner);
                                const waUrl = `https://wa.me/${matchedPartner.contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(copyText)}`;
                                routeOutboundAction({
                                  url: waUrl,
                                  type: 'EXTERNAL_INTENT',
                                  fallbackData: { copyText }
                                });
                              }}
                              className="h-8 bg-emerald-50 text-emerald-800 border border-emerald-500/20 rounded-lg flex items-center justify-center gap-1 uppercase cursor-pointer"
                            >
                              <MessageCircle size={10} /> WhatsApp
                            </button>
                            <button 
                              type="button"
                              onClick={() => { 
                                triggerHaptic(8); 
                                handleUpdateInquiryStatus(inq.id, 'sent');
                                const copyText = getOutboundCopyText(inq, matchedPartner);
                                const viberUrl = `viber://forward?text=${encodeURIComponent(copyText)}`;
                                routeOutboundAction({
                                  url: viberUrl,
                                  type: 'EXTERNAL_INTENT',
                                  fallbackData: { copyText }
                                });
                              }}
                              className="h-8 bg-indigo-50 text-indigo-800 border border-indigo-500/20 rounded-lg flex items-center justify-center gap-1 uppercase cursor-pointer"
                            >
                              <Send size={10} /> Viber
                            </button>
                            <button 
                              onClick={() => { 
                                navigator.clipboard.writeText(getOutboundCopyText(inq, matchedPartner)); 
                                triggerHaptic(15); 
                                handleUpdateInquiryStatus(inq.id, 'sent');
                              }}
                              className="h-8 bg-amber-50 text-amber-800 border border-amber-500/20 rounded-lg flex items-center justify-center gap-1 uppercase"
                            >
                              <Check size={10} /> Copy Text
                            </button>
                          </div>
                        </div>

                        {/* Reply Recorder */}
                        {inq.replies.length > 0 && (
                          <div className="pt-2 border-t border-[#2D3025]/5 space-y-1">
                            <span className="text-[8.5px] font-mono uppercase font-black text-emerald-700">Recorded Partner Replies:</span>
                            {inq.replies.map((rep, idx) => (
                              <p key={idx} className="text-[10px] bg-emerald-500/5 text-emerald-900 border border-emerald-500/10 rounded-lg p-2 leading-relaxed">
                                "{rep}"
                              </p>
                            ))}
                          </div>
                        )}

                        <div className="pt-1.5 flex justify-end">
                          {activeInquiryIdForReply === inq.id ? (
                            <div className="w-full space-y-2 pt-2">
                              <textarea 
                                placeholder="Manually transcribe incoming WhatsApp/Viber response text..."
                                value={newReplyText}
                                onChange={e => setNewReplyText(e.target.value)}
                                className="w-full p-2 bg-white border border-[#2D3025]/10 rounded-lg text-xs"
                                rows={2}
                              />
                              <div className="flex justify-end gap-1.5">
                                <button onClick={() => setActiveInquiryIdForReply(null)} className="px-3 h-7 bg-transparent border text-brand-charcoal text-[9px] font-black uppercase rounded-lg">Cancel</button>
                                <button onClick={() => handleSaveReply(inq.id)} className="px-3 h-7 bg-[#006666] text-white text-[9px] font-black uppercase rounded-lg">Record Reply & Resolve</button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => { triggerHaptic(10); setActiveInquiryIdForReply(inq.id); }}
                              className="text-[9px] uppercase tracking-widest font-black text-[#006666] hover:underline flex items-center gap-1"
                            >
                              ✎ Record Incoming Response Manually
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Concierge Automated Dispatch System Guide */}
              <div className="bg-[#FAF9F5] border-2 border-[#0C302F]/10 rounded-[28px] p-5 space-y-4 text-left mt-6">
                <div className="flex items-center gap-1.5 border-b border-[#0C302F]/10 pb-3">
                  <Briefcase size={14} className="text-[#006666]" />
                  <h3 className="text-xs uppercase tracking-widest font-black text-[#006666]">Automated Dispatch Orchestration Guide</h3>
                </div>

                <div className="space-y-3 text-[10.5px] leading-relaxed text-brand-charcoal/80">
                  <p>
                    As an IDEMO Concierge, your manual effort is reserved for high-value upstream curation and exception handling. Normal traveler inquiries are matched and dispatched automatically using the 8-state live lifecycle machine:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1.5 font-mono text-[9px]">
                    <div className="bg-white p-2.5 rounded-lg border border-[#0C302F]/5 space-y-1">
                      <span className="font-bold text-[#006666]">1. Unmatched</span>
                      <p className="text-brand-charcoal/60">No local partners satisfies core criteria. Handled as exceptional custom-routed inquiry.</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-[#0C302F]/5 space-y-1">
                      <span className="font-bold text-[#006666]">2. Dispatched Stage 1</span>
                      <p className="text-brand-charcoal/60">Top 3 qualified, active partners are notified immediately. First-accept locks booking.</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-[#0C302F]/5 space-y-1">
                      <span className="font-bold text-[#006666]">3. Dispatched Stage 2</span>
                      <p className="text-brand-charcoal/60">Secondary/fallback qualified partners are notified sequentially after 30 minutes of silent queue per candidate.</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-[#0C302F]/5 space-y-1">
                      <span className="font-bold text-[#006666]">4. Locked / Accepted</span>
                      <p className="text-brand-charcoal/60">First responsive partner accepts the inquiry, immediately locking out competitors.</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-[#0C302F]/5 space-y-1">
                      <span className="font-bold text-[#006666]">5. Alternative Proposed</span>
                      <p className="text-brand-charcoal/60">Partner accepts but offers an alternative scheduling/date. Concierge review advised.</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-[#0C302F]/5 space-y-1">
                      <span className="font-bold text-[#006666]">6. Answered / Completed</span>
                      <p className="text-brand-charcoal/60">Partner has finalized draft reply. Concierge transmits answer to the traveler.</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-[#0C302F]/5 space-y-1">
                      <span className="font-bold text-[#006666]">7. Released</span>
                      <p className="text-brand-charcoal/60">Assigned partner has released inquiry back to matching pool with a documented reason.</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-[#0C302F]/5 space-y-1">
                      <span className="font-bold text-[#006666]">8. Closed</span>
                      <p className="text-brand-charcoal/60">The traveler journey is finalized and archived. No further answers permitted.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ========================= 3. PARTNER RESTRICTED VIEW ===================== */}
          {/* ========================================================================= */}
          {portalRole === 'partner' && (() => {
            if (!currentSimulatedPartner) {
              return (
                <div className="bg-white border border-[#2D3025]/10 rounded-[32px] p-8 text-center space-y-4 max-w-md mx-auto my-6 animate-fade-in text-left">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle size={18} />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">
                      {isSr ? 'Profil partnera nije pronađen' : 'Partner Profile Not Found'}
                    </span>
                  </div>
                  <p className="text-xs text-brand-charcoal/70 leading-relaxed">
                    {isSr ? 'Profil za izabrani nalog nije učitan. Molimo prijavite se ponovo.' : 'Profile data for this account could not be located. Please sign in again.'}
                  </p>
                  <button 
                    onClick={handlePartnerLogout}
                    className="w-full h-10 bg-brand-charcoal text-white text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer"
                  >
                    {isSr ? 'Nazad na prijavu' : 'Return to Login'}
                  </button>
                </div>
              );
            }

            const capabilityCards = [
              {
                key: 'languages',
                title: 'Languages',
                icon: Globe,
                items: LANGUAGES_CATALOGUE,
                isLanguage: true,
                approvedCheck: (item) => currentSimulatedPartner.languages.includes(item),
                pendingCheck: (item) => interestRequests.some(r => r.partnerId === currentSimulatedPartner.id && r.recId === `lang-${item}`),
                itemLabel: (item) => item
              },
              {
                key: 'knowledge',
                title: 'Knowledge',
                icon: Award,
                items: KNOWLEDGE_CATALOGUE,
                isLanguage: false,
                approvedCheck: (item) => currentSimulatedPartner.capabilities.includes(item),
                pendingCheck: (item) => interestRequests.some(r => r.partnerId === currentSimulatedPartner.id && r.recId === `cap-${item}`),
                itemLabel: (item) => item
              },
              {
                key: 'experiences',
                title: 'Experiences',
                icon: Sparkles,
                items: EXPERIENCES_CATALOGUE,
                isLanguage: false,
                approvedCheck: (item) => currentSimulatedPartner.capabilities.includes(item),
                pendingCheck: (item) => interestRequests.some(r => r.partnerId === currentSimulatedPartner.id && r.recId === `cap-${item}`),
                itemLabel: (item) => item
              },
              {
                key: 'services',
                title: 'Services',
                icon: Briefcase,
                items: SERVICES_CATALOGUE,
                isLanguage: false,
                approvedCheck: (item) => currentSimulatedPartner.capabilities.includes(item),
                pendingCheck: (item) => interestRequests.some(r => r.partnerId === currentSimulatedPartner.id && r.recId === `cap-${item}`),
                itemLabel: (item) => item
              },
              {
                key: 'qualifications',
                title: 'Professional Credentials',
                icon: ShieldCheck,
                items: QUALIFICATIONS_CATALOGUE,
                isLanguage: false,
                approvedCheck: (item) => currentSimulatedPartner.capabilities.includes(item),
                pendingCheck: (item) => interestRequests.some(r => r.partnerId === currentSimulatedPartner.id && r.recId === `cap-${item}`),
                itemLabel: (item) => item
              }
            ];

            const partnerIdLower = (currentSimulatedPartner.id || '').toLowerCase();
            const partnerCodeLower = (currentSimulatedPartner.publicCode || '').toLowerCase();
            const partnerNameLower = (currentSimulatedPartner.name || '').toLowerCase();

            const assignedInquiries = inquiries.filter(inq => {
              const pId = (inq.partnerId || '').toLowerCase();
              const pName = (inq.partnerName || '').toLowerCase();
              return pId === partnerIdLower || (partnerCodeLower && pId === partnerCodeLower) || pName === partnerNameLower;
            });

            const activeInquiries = assignedInquiries.filter(inq => {
              const isCounter = Boolean(
                inq.matchStatus === 'counter_by_visitor' ||
                inq.rawMatchStatus === 'counter_by_visitor' ||
                inq.status === 'counter_by_visitor'
              );

              const isConfirmedByVisitor = Boolean(
                inq.visitorConfirmed === true ||
                inq.status === 'Confirmed by Traveler' ||
                inq.status === 'Arrangement Confirmed' ||
                inq.status === 'selected' ||
                inq.matchStatus === 'selected' ||
                inq.rawMatchStatus === 'selected' ||
                inq.inquiryStatus === 'confirmed'
              );

              const isAccepted = !isConfirmedByVisitor && Boolean(
                inq.status === 'Locked / Accepted' ||
                inq.status === 'accepted' ||
                inq.status === 'responded' ||
                inq.matchStatus === 'responded' ||
                inq.rawMatchStatus === 'responded'
              );

              const isAlternative = Boolean(
                inq.status === 'Alternative Proposed' ||
                inq.status === 'proposed' ||
                inq.alternativeOffer
              );

              const isDeclined = Boolean(
                inq.status === 'Released' ||
                inq.status === 'declined' ||
                inq.status === 'expired' ||
                inq.status === 'not_selected' ||
                inq.status === 'withdrawn' ||
                inq.matchStatus === 'declined' ||
                inq.matchStatus === 'expired' ||
                inq.matchStatus === 'not_selected' ||
                inq.matchStatus === 'withdrawn' ||
                inq.rawMatchStatus === 'declined' ||
                inq.rawMatchStatus === 'expired'
              );

              const isCompleted = Boolean(
                inq.status === 'Answered / Completed' ||
                inq.status === 'completed' ||
                inq.status === 'closed' ||
                inq.status === 'canceled' ||
                inq.inquiryStatus === 'completed' ||
                inq.inquiryStatus === 'closed' ||
                inq.inquiryStatus === 'canceled'
              );

              return isCounter || (!isConfirmedByVisitor && !isAccepted && !isAlternative && !isDeclined && !isCompleted);
            });

            const pastInquiries = assignedInquiries.filter(inq => !activeInquiries.includes(inq));
            const currentMessages = getMessagesForPartner(currentSimulatedPartner.id);

            const activeInquiryIds = activeInquiries.map((inq: any) => inq.id || inq.inquiryId || inq.local_queue_id).filter(Boolean);
            const hasUnseenInquiries = checkPartnerHasUnseenInquiries(activeInquiryIds);
            const hasUnseenMessages = currentMessages.length > getPartnerSeenMessageCount(currentSimulatedPartner.id);

            const isPassportSubmitted = passportReviewStatus === 'pending_review';
            const showSubmittedGreen = isPassportSubmitted && !passportModified;

            return (
              <div className="space-y-6 animate-fade-in max-w-xl mx-auto pb-12">
                {/* HEADER */}
                <div className="flex justify-between items-center bg-brand-charcoal px-6 py-4 rounded-[24px] text-white">
                  <div className="space-y-0.5 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[8px] uppercase tracking-widest font-mono text-amber-400 font-bold block">PARTNER PASSPORT WORKSPACE</span>
                      {(currentSimulatedPartner.isDemo || currentSimulatedPartner.id === 'UNO1' || currentSimulatedPartner.id === 'UNO2') && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8.5px] font-mono tracking-wider font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Sparkles className="w-2.5 h-2.5 shrink-0" />
                          DEMONSTRATION ACCOUNT
                        </span>
                      )}
                    </div>
                    <h2 className="text-sm font-serif font-black">{currentSimulatedPartner.name}</h2>
                  </div>
                  <button 
                    onClick={handlePartnerLogout} 
                    className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-colors shrink-0"
                  >
                    Exit Session
                  </button>
                </div>

                {/* ZERO-SCROLL WORKSPACE SEGMENTED VIEW SWITCHER */}
                <div className="flex items-center bg-[#2D3025]/5 p-1.5 rounded-2xl gap-1 border border-[#2D3025]/10">
                  <button
                    type="button"
                    id="tab-partner-opportunities"
                    onClick={() => {
                      setPartnerWorkspaceTab('opportunities');
                      markPartnerInquiriesAsSeen(activeInquiryIds);
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new Event('idemo_partner_badge_change'));
                      }
                      triggerHaptic(8);
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
                      partnerWorkspaceTab === 'opportunities'
                        ? 'bg-brand-charcoal text-white shadow-xs'
                        : 'text-brand-charcoal/70 hover:text-brand-charcoal hover:bg-black/5'
                    }`}
                  >
                    <Zap size={14} className={partnerWorkspaceTab === 'opportunities' ? 'text-amber-400' : 'text-brand-charcoal/50'} />
                    <span className="relative flex items-center gap-1">
                      <span>{isSr ? 'Prilike i upiti' : 'Opportunities'}</span>
                      {hasUnseenInquiries && (
                        <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse shrink-0 shadow-xs" title={isSr ? 'Novi upit' : 'Unseen guest inquiry'} />
                      )}
                    </span>
                    {activeInquiries.length > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                        partnerWorkspaceTab === 'opportunities'
                          ? 'bg-amber-400 text-brand-charcoal'
                          : 'bg-amber-500/20 text-amber-900 border border-amber-500/30'
                      }`}>
                        {activeInquiries.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    id="tab-partner-profile"
                    onClick={() => {
                      setPartnerWorkspaceTab('profile');
                      triggerHaptic(8);
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      partnerWorkspaceTab === 'profile'
                        ? 'bg-brand-charcoal text-white shadow-xs'
                        : 'text-brand-charcoal/70 hover:text-brand-charcoal hover:bg-black/5'
                    }`}
                  >
                    <UserCheck size={14} className={partnerWorkspaceTab === 'profile' ? 'text-amber-400' : 'text-brand-charcoal/50'} />
                    <span>{isSr ? 'Profil i Pasoš' : 'Profile & Passport'}</span>
                  </button>

                  <button
                    type="button"
                    id="tab-partner-messages"
                    onClick={() => {
                      setPartnerWorkspaceTab('messages');
                      markPartnerMessagesAsSeen(currentSimulatedPartner.id, currentMessages.length);
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new Event('idemo_partner_badge_change'));
                      }
                      triggerHaptic(8);
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
                      partnerWorkspaceTab === 'messages'
                        ? 'bg-brand-charcoal text-white shadow-xs'
                        : 'text-brand-charcoal/70 hover:text-brand-charcoal hover:bg-black/5'
                    }`}
                  >
                    <MessageSquare size={14} className={partnerWorkspaceTab === 'messages' ? 'text-amber-400' : 'text-brand-charcoal/50'} />
                    <span className="relative flex items-center gap-1">
                      <span>{isSr ? 'Poruke' : 'Messages'}</span>
                      {hasUnseenMessages && (
                        <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse shrink-0 shadow-xs" title={isSr ? 'Nova poruka' : 'Unseen message'} />
                      )}
                    </span>
                    {currentMessages.length > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                        partnerWorkspaceTab === 'messages'
                          ? 'bg-amber-400 text-brand-charcoal'
                          : 'bg-brand-charcoal/10 text-brand-charcoal/70'
                      }`}>
                        {currentMessages.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* CARD 1: MY PARTNER PROFILE */}
                {partnerWorkspaceTab === 'profile' && (
                <div className="bg-white border border-[#2D3025]/10 rounded-[32px] p-6 shadow-sm text-left space-y-5">
                  <div className="flex items-center gap-2 border-b border-[#2D3025]/5 pb-3">
                    <span className="p-1.5 rounded-lg bg-[#8A1F1F]/5 text-[#8A1F1F]">
                      <ShieldCheck size={14} />
                    </span>
                    <div className="space-y-0.5">
                      <span className="text-[8px] uppercase tracking-widest font-mono text-brand-charcoal/40 font-bold block">Ecosystem Portfolio</span>
                      <h3 className="text-xs uppercase tracking-wide font-black text-brand-charcoal">MY PARTNER PROFILE</h3>
                    </div>
                  </div>

                  {/* Progress Bar & Completeness */}
                  <div className="space-y-2 bg-[#FAF9F5] border border-[#2D3025]/5 p-4 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <span className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-brand-charcoal/50">Portfolio Completeness</span>
                      <span className="text-xs font-mono font-black text-[#8A1F1F]">{portfolioMetrics.completenessPercentage}%</span>
                    </div>
                    {/* Progress Grid Segment (10 segments) */}
                    <div className="grid grid-cols-10 gap-1 h-2">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-full rounded-sm transition-all duration-500 ${
                            i < portfolioMetrics.completenessSegments ? 'bg-[#8A1F1F]' : 'bg-[#2D3025]/5'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* PARTNER PASSPORT INTRODUCTION & PHOTO EDITOR */}
                  <div className="border border-[#2D3025]/10 rounded-2xl p-4 bg-[#FAF9F5]/80 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#2D3025]/5 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#8A1F1F]" />
                        <h4 className="text-xs uppercase font-mono font-black tracking-wider text-brand-charcoal">
                          Professional Introduction & Passport Photo
                        </h4>
                      </div>
                      <span className={`text-[8.5px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        passportReviewStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        passportReviewStatus === 'pending_review' ? 'bg-amber-100 text-amber-800' :
                        passportReviewStatus === 'changes_requested' ? 'bg-red-100 text-red-800' :
                        passportReviewStatus === 'withdrawn' ? 'bg-neutral-300 text-neutral-800' : 'bg-neutral-200 text-neutral-700'
                      }`}>
                        {passportReviewStatus === 'approved' ? 'Approved & Live' :
                         passportReviewStatus === 'pending_review' ? 'Under Review' :
                         passportReviewStatus === 'changes_requested' ? 'Changes Requested' :
                         passportReviewStatus === 'withdrawn' ? 'Withdrawn' : 'Draft'}
                      </span>
                    </div>

                    <p className="text-[11px] text-brand-charcoal/70 leading-relaxed">
                      Provide a brief professional introduction (max 200 words) and an optional photo. Once approved by IDEMO editorial review, this will be displayed to visitors when you accept an inquiry.
                    </p>

                    {/* Word Counter & Textarea */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-mono text-brand-charcoal/50">
                        <label className="uppercase font-bold">Introduction Text (Plain Text Only)</label>
                        <span className={`font-bold ${
                          (passportIntroDraft.trim() ? passportIntroDraft.trim().split(/\s+/).length : 0) > 200 ? 'text-red-600' : 'text-brand-charcoal'
                        }`}>
                          {passportIntroDraft.trim() ? passportIntroDraft.trim().split(/\s+/).length : 0} / 200 words
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        placeholder="e.g. Licensed professional guide with over 10 years of experience in Serbia's cultural heritage, natural meanders, and bespoke gastronomy tours across Belgrade..."
                        value={passportIntroDraft}
                        onChange={(e) => {
                          setPassportIntroDraft(e.target.value);
                          setPassportModified(true);
                        }}
                        className="w-full p-3 bg-white border border-[#2D3025]/15 rounded-xl text-xs text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                      />
                    </div>

                    {/* Photo Preview, Consent & Selector */}
                    <div className="p-3 bg-[#FAF8F5] border border-[#2D3025]/10 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-brand-charcoal/70">
                          {isSr ? 'Fotografija profila (Pasoš partnera)' : 'Professional Portrait (Passport Photo)'}
                        </span>
                        {activePhotoUrl ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 size={11} />
                            {isSr ? 'Fotografija aktivna' : 'Photo Attached & Active'}
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono font-bold text-brand-charcoal/50 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
                            {isSr ? 'Nema fotografije' : 'No photo attached'}
                          </span>
                        )}
                      </div>

                      {/* Photo Visual Card */}
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#C5A059] shadow-sm bg-neutral-100 flex items-center justify-center shrink-0">
                          {activePhotoUrl && !photoLoadError ? (
                            <img
                              src={activePhotoUrl}
                              alt={currentSimulatedPartner?.name || 'Partner portrait'}
                              referrerPolicy="no-referrer"
                              onError={() => setPhotoLoadError(true)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-[#1A2E26]/5 text-brand-charcoal/40">
                              <Camera size={20} className="text-brand-charcoal/50" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <p className="text-[11px] leading-snug text-brand-charcoal/80 font-sans">
                            {isSr
                              ? 'Ova fotografija se prikazuje posetiocu u sekciji „Dozvolite da se predstavim“ nakon prihvatanja upita.'
                              : 'This portrait is displayed to travelers in the “Let me introduce myself” card alongside your intro text once an inquiry is confirmed.'}
                          </p>
                          <div className="flex items-center gap-2 pt-0.5">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              id="passport-photo-input"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                  setPassportMsg({ type: 'error', text: isSr ? 'Fotografija ne sme biti veća od 5 MB.' : 'Photo size must not exceed 5 MB.' });
                                  return;
                                }

                                // Instant visual preview
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const dataUrl = reader.result as string;
                                  setPassportPhotoPreview(dataUrl);
                                  setPhotoLoadError(false);
                                };
                                reader.readAsDataURL(file);

                                setPassportPhotoConsent(true);
                                const targetId = activePartnerId;
                                setPassportSaving(true);
                                setPassportMsg(null);

                                // 1. Request upload authorization
                                const authRes = await authorizePhotoUpload(file.name, file.type, file.size);
                                if (activePartnerId !== targetId) {
                                  setPassportSaving(false);
                                  return;
                                }

                                if (authRes.success && authRes.upload_url && authRes.path) {
                                  // 2. Execute binary upload to storage
                                  const uploadRes = await uploadPhotoToSignedUrl(authRes.upload_url, file);
                                  if (activePartnerId !== targetId) {
                                    setPassportSaving(false);
                                    return;
                                  }

                                  if (uploadRes.success) {
                                    setPassportPhotoPath(authRes.path);
                                    setPassportPhotoMime(authRes.mime_type || file.type);
                                    setPassportModified(true);
                                    setPassportMsg({ type: 'success', text: isSr ? 'Fotografija uspešno otpremljena.' : 'Photo uploaded successfully to partner storage.' });
                                    // Cache locally as well
                                    if (targetId) {
                                      try {
                                        const key = `idemo_partner_passport_${targetId.toUpperCase()}`;
                                        const existing = safeStorage.getItem(key);
                                        const parsed = existing ? JSON.parse(existing) : {};
                                        safeStorage.setItem(key, JSON.stringify({
                                          ...parsed,
                                          photo_url: authRes.path,
                                          draft_photo_path: authRes.path,
                                          published_photo_path: authRes.path,
                                          photo_consent_given: true,
                                        }));
                                      } catch (err) {
                                        console.warn('Storage sync error:', err);
                                      }
                                    }
                                  } else {
                                    setPassportMsg({ type: 'error', text: uploadRes.error || 'Failed to upload photo to storage.' });
                                  }
                                } else {
                                  // Offline / demo fallback with data URL
                                  reader.onload = () => {
                                    const dataUrl = reader.result as string;
                                    setPassportPhotoPath(dataUrl);
                                    setPassportPhotoMime(file.type);
                                    setPassportPhotoPreview(dataUrl);
                                    setPassportModified(true);
                                    setPassportMsg({
                                      type: 'success',
                                      text: isSr ? 'Fotografija uspešno ažurirana (lokalni pregled).' : 'Photo updated successfully (local preview).'
                                    });
                                    if (targetId) {
                                      try {
                                        const key = `idemo_partner_passport_${targetId.toUpperCase()}`;
                                        const existing = safeStorage.getItem(key);
                                        const parsed = existing ? JSON.parse(existing) : {};
                                        safeStorage.setItem(key, JSON.stringify({
                                          ...parsed,
                                          photo_url: dataUrl,
                                          draft_photo_path: dataUrl,
                                          photo_consent_given: true,
                                        }));
                                      } catch (err) {
                                        console.warn('Storage sync error:', err);
                                      }
                                    }
                                  };
                                }
                                setPassportSaving(false);
                              }}
                            />
                            <label
                              htmlFor="passport-photo-input"
                              className="px-3 py-1.5 bg-white border border-[#2D3025]/20 rounded-lg text-[10px] font-mono font-bold uppercase text-brand-charcoal hover:bg-neutral-50 cursor-pointer transition-colors shadow-xs"
                            >
                              {activePhotoUrl ? (isSr ? 'Promeni fotografiju' : 'Change Photo') : (isSr ? 'Izaberi fotografiju' : 'Select Photo')}
                            </label>

                            {activePhotoUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic(10);
                                  setPassportPhotoPath(null);
                                  setPassportPhotoPreview(null);
                                  setPhotoLoadError(false);
                                  setPassportModified(true);
                                  setPassportMsg({
                                    type: 'info',
                                    text: isSr ? 'Fotografija uklonjena iz pasoša.' : 'Photo removed from passport.'
                                  });
                                  if (activePartnerId) {
                                    try {
                                      const key = `idemo_partner_passport_${activePartnerId.toUpperCase()}`;
                                      const existing = safeStorage.getItem(key);
                                      if (existing) {
                                        const parsed = JSON.parse(existing);
                                        delete parsed.photo_url;
                                        delete parsed.draft_photo_path;
                                        delete parsed.published_photo_path;
                                        safeStorage.setItem(key, JSON.stringify(parsed));
                                      }
                                    } catch (err) {
                                      console.warn('Storage clear error:', err);
                                    }
                                  }
                                }}
                                className="px-2.5 py-1.5 text-[10px] font-mono font-bold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                {isSr ? 'Ukloni' : 'Remove'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Consent Checkbox */}
                      <label className="flex items-start gap-2 text-xs text-brand-charcoal/80 cursor-pointer pt-1 border-t border-[#2D3025]/5">
                        <input
                          type="checkbox"
                          checked={passportPhotoConsent}
                          onChange={(e) => {
                            setPassportPhotoConsent(e.target.checked);
                            setPassportModified(true);
                          }}
                          className="mt-0.5 rounded border-[#2D3025]/20 text-[#8A1F1F] focus:ring-[#8A1F1F]"
                        />
                        <span className="text-[10px] leading-snug">
                          {isSr
                            ? 'Dajem saglasnost da IDEMO obradi i prikaže moju profesionalnu profilnu fotografiju verifikovanim posetiocima nakon prihvatanja upita.'
                            : 'I consent to IDEMO processing and displaying my professional profile photo for verified visitor introductions upon inquiry acceptance.'}
                        </span>
                      </label>
                    </div>

                    {passportMsg && (
                      <div className={`p-2.5 rounded-lg text-xs font-mono font-medium ${
                        passportMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        passportMsg.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-blue-50 text-blue-800'
                      }`}>
                        {passportMsg.text}
                      </div>
                    )}

                    {passportReviewNote && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-mono text-amber-900">
                        <strong>Editorial Reviewer Note:</strong> {passportReviewNote}
                      </div>
                    )}

                    {/* GOVERNED PROFESSIONAL CONTACT DETAILS */}
                    <div className="border-t border-[#2D3025]/10 pt-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#8A1F1F]" />
                        <h5 className="text-[10px] uppercase font-mono font-bold text-brand-charcoal">
                          Governed Professional Contact Information
                        </h5>
                      </div>
                      <p className="text-[10.5px] text-brand-charcoal/70 leading-relaxed">
                        Optional direct professional contact details saved as draft for IDEMO review before visitor disclosure in My Travel Plan.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono uppercase font-bold text-brand-charcoal/60 mb-1">
                            Professional Phone Number
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. +381 64 1234567"
                            value={profContactPhone}
                            onChange={(e) => {
                              setProfContactPhone(e.target.value);
                              setPassportModified(true);
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-[#2D3025]/15 rounded-lg text-xs text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono uppercase font-bold text-brand-charcoal/60 mb-1">
                            Professional Email Address
                          </label>
                          <input
                            type="email"
                            placeholder="e.g. contact@serbiaguide.rs"
                            value={profContactEmail}
                            onChange={(e) => {
                              setProfContactEmail(e.target.value);
                              setPassportModified(true);
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-[#2D3025]/15 rounded-lg text-xs text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={async () => {
                            const targetId = activePartnerId;
                            setProfContactSaving(true);
                            setProfContactMsg(null);
                            const res = await updatePartnerProfessionalContact(profContactPhone || null, profContactEmail || null);
                            if (activePartnerId !== targetId) {
                              setProfContactSaving(false);
                              return;
                            }
                            // Always synchronize to SafeStorage first for offline-first data protection
                            if (targetId) {
                              try {
                                const key = `idemo_partner_passport_${targetId.toUpperCase()}`;
                                const existing = safeStorage.getItem(key);
                                const parsed = existing ? JSON.parse(existing) : {};
                                safeStorage.setItem(key, JSON.stringify({
                                  ...parsed,
                                  draft_contact_phone: profContactPhone || null,
                                  draft_contact_email: profContactEmail || null,
                                  contact_phone: profContactPhone || parsed.contact_phone || null,
                                  contact_email: profContactEmail || parsed.contact_email || null,
                                  updated_at: new Date().toISOString(),
                                }));
                              } catch (err) {
                                console.warn('Storage sync error:', err);
                              }
                            }

                            if (res.success) {
                              setProfContactMsg({ type: 'success', text: res.message || 'Professional contact details updated.' });
                            } else if (
                              res.error?.includes('disabled on this database version') ||
                              res.error?.includes('ENDPOINT_DISABLED') ||
                              res.message?.includes('disabled on this database version')
                            ) {
                              setProfContactMsg({
                                type: 'warning',
                                text: 'Saved locally in SafeStorage. Remote Supabase Edge Function deployment pending.',
                              });
                            } else {
                              setProfContactMsg({ type: 'error', text: res.error || 'Failed to update contact info.' });
                            }
                            setProfContactSaving(false);
                          }}
                          disabled={profContactSaving}
                          className="px-3 py-1.5 bg-[#2D3025] text-white rounded-lg text-[10px] font-mono font-bold uppercase hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {profContactSaving ? 'Saving...' : 'Save Professional Contact Info'}
                        </button>
                        {profContactMsg && (
                          <p className={`text-[10px] font-mono ${profContactMsg.type === 'success' ? 'text-emerald-700' : profContactMsg.type === 'warning' ? 'text-amber-700' : 'text-red-600'}`}>
                            {profContactMsg.text}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* APPLIED EXPERTISE FOR EXISTING RECOMMENDATIONS */}
                    <div className="p-3.5 bg-white border border-[#2D3025]/10 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-[#2D3025]/5 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={14} className="text-[#8A1F1F]" />
                          <span className="text-[10px] font-mono uppercase font-bold text-brand-charcoal">
                            {isSr ? 'Prijavljena ekspertiza za postojeće preporuke' : 'Applied Expertise for Existing Recommendations'}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-[#8A1F1F] bg-[#8A1F1F]/10 px-2 py-0.5 rounded-full">
                          {appliedRecs.length} {isSr ? 'odabrano' : 'selected'}
                        </span>
                      </div>

                      <p className="text-[10.5px] text-brand-charcoal/70 leading-relaxed">
                        {isSr
                          ? 'Izaberite postojeće IDEMO preporuke za koje posedujete licencu ili proverenu lokalnu ekspertizu. IDEMO Kancelarija i urednici verifikuju vaš zahtev pre aktivacije direktnog usmeravanja upita.'
                          : 'Select existing curated IDEMO recommendations where you possess licensing or verified local expertise. IDEMO Office and Curators will review and activate your direct routing priority upon verification.'}
                      </p>

                      {/* Searchable Multi-Select Component */}
                      <div className="space-y-2">
                        <div ref={recDropdownRef} className="relative">
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/40 pointer-events-none" />
                            <input
                              type="text"
                              placeholder={isSr ? 'Pretraži preporuke po nazivu, kategoriji ili regiji...' : 'Search recommendations by title, category, or region...'}
                              value={recSearchQuery}
                              onChange={(e) => {
                                setRecSearchQuery(e.target.value);
                                if (!recDropdownOpen) setRecDropdownOpen(true);
                              }}
                              onFocus={() => setRecDropdownOpen(true)}
                              className="w-full pl-8 pr-8 py-2 bg-[#FAF9F5] border border-[#2D3025]/15 focus:border-[#8A1F1F] rounded-xl text-xs font-sans text-brand-charcoal outline-none transition-colors"
                            />
                            {recSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setRecSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-charcoal/40 hover:text-brand-charcoal cursor-pointer"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>

                          {/* Dropdown Options */}
                          {recDropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-20 bg-transparent"
                                onClick={() => setRecDropdownOpen(false)}
                                aria-hidden="true"
                              />
                              <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-[#2D3025]/15 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-[#2D3025]/5">
                              <div className="p-2 bg-[#FAF9F5] border-b border-[#2D3025]/5 flex items-center justify-between text-[10px] font-mono text-brand-charcoal/60 sticky top-0 z-10 backdrop-blur-sm">
                                <span>{isSr ? 'Aktivni IDEMO katalog' : 'Active IDEMO Catalog'} ({filteredCatalogRecs.length})</span>
                                <button
                                  type="button"
                                  onClick={() => setRecDropdownOpen(false)}
                                  className="text-[#8A1F1F] hover:underline cursor-pointer font-bold px-1"
                                >
                                  {isSr ? 'Zatvori' : 'Close'}
                                </button>
                              </div>
                              {filteredCatalogRecs.length === 0 ? (
                                <div className="p-4 text-center text-xs font-mono text-brand-charcoal/50">
                                  {isSr ? 'Nema pronađenih preporuka' : 'No matching recommendations found'}
                                </div>
                              ) : (
                                filteredCatalogRecs.map((rec) => {
                                  const isSelected = appliedRecs.includes(rec.id);
                                  const isAlreadyAssigned = (currentSimulatedPartner?.assignedRecs || []).includes(rec.id);
                                  const displayTitle = isSr ? (rec.titleSr || rec.title) : rec.title;
                                  return (
                                    <div
                                      key={rec.id}
                                      onClick={() => {
                                        triggerHaptic(6);
                                        setPassportModified(true);
                                        setAppliedRecs(prev =>
                                          prev.includes(rec.id) ? prev.filter(id => id !== rec.id) : [...prev, rec.id]
                                        );
                                      }}
                                      className={`p-2.5 flex items-center justify-between gap-2 hover:bg-[#FAF9F5] cursor-pointer transition-colors ${
                                        isSelected ? 'bg-[#8A1F1F]/5' : ''
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                          isSelected ? 'bg-[#8A1F1F] border-[#8A1F1F] text-white' : 'border-[#2D3025]/30'
                                        }`}>
                                          {isSelected && <Check size={11} strokeWidth={3} />}
                                        </div>
                                        <div className="truncate">
                                          <span className="text-xs font-serif font-bold text-brand-charcoal block truncate">
                                            {displayTitle}
                                          </span>
                                          <span className="text-[10px] font-mono text-brand-charcoal/50 block truncate">
                                            {rec.category} {rec.location ? `• ${rec.location}` : ''}
                                          </span>
                                        </div>
                                      </div>
                                      {isAlreadyAssigned && (
                                        <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                                          {isSr ? 'Već aktivno' : 'Active'}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                              {/* Sticky footer with Done confirmation button */}
                              <div className="p-2.5 bg-[#FAF9F5] border-t border-[#2D3025]/10 flex items-center justify-between gap-2 sticky bottom-0 z-10">
                                <span className="text-[10px] font-mono text-brand-charcoal/70">
                                  {appliedRecs.length} {isSr ? 'odabrano' : 'selected'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setRecDropdownOpen(false)}
                                  className="px-3 py-1 bg-[#8A1F1F] text-white hover:bg-[#6D1818] rounded-lg text-xs font-serif font-bold transition-colors cursor-pointer shadow-sm"
                                >
                                  {isSr ? 'Gotovo / Zatvori' : 'Done / Close'}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                        {/* Selected Chips */}
                        {appliedRecs.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {appliedRecs.map((recId) => {
                              const matched = dynamicCatalogRecs.find(r => r.id === recId) || RECOMMENDATIONS_LOOKUP.find(r => r.id === recId);
                              const title = matched ? (isSr ? (matched.titleSr || matched.title) : matched.title) : `Spot #${recId}`;
                              return (
                                <span
                                  key={recId}
                                  className="inline-flex items-center gap-1.5 bg-[#FAF9F5] border border-[#2D3025]/15 text-brand-charcoal px-2.5 py-1 rounded-lg text-xs font-serif"
                                >
                                  <span className="font-medium truncate max-w-[170px]">{title}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      triggerHaptic(6);
                                      setPassportModified(true);
                                      setAppliedRecs(prev => prev.filter(id => id !== recId));
                                    }}
                                    className="text-brand-charcoal/40 hover:text-[#8A1F1F] cursor-pointer"
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Optional Expertise / Licensing Note */}
                        <div>
                          <label className="block text-[9px] font-mono uppercase font-bold text-brand-charcoal/60 mb-1">
                            {isSr ? 'Napomena o ekspertizi ili licenci (Opciono)' : 'Expertise or Licensing Details (Optional)'}
                          </label>
                          <input
                            type="text"
                            placeholder={isSr ? 'npr. Licencirani planinski vodič, Uvac & Tara od 2018.' : 'e.g., Licensed mountain guide, Uvac & Tara since 2018'}
                            value={appliedRecsNote}
                            onChange={(e) => {
                              setAppliedRecsNote(e.target.value);
                              setPassportModified(true);
                            }}
                            className="w-full px-3 py-1.5 bg-[#FAF9F5] border border-[#2D3025]/15 focus:border-[#8A1F1F] rounded-xl text-xs font-sans text-brand-charcoal outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2D3025]/5">
                      <button
                        type="button"
                        disabled={passportSaving}
                        onClick={async () => {
                          const targetId = activePartnerId;
                          setPassportSaving(true);
                          setPassportMsg(null);
                          const res = await savePartnerProfileDraft(
                            passportIntroDraft,
                            passportPhotoPath,
                            passportPhotoMime,
                            passportPhotoConsent,
                            profContactPhone || null,
                            profContactEmail || null,
                            undefined,
                            appliedRecs,
                            appliedRecsNote || null
                          );
                          if (activePartnerId !== targetId) {
                            setPassportSaving(false);
                            return;
                          }

                          // Resilient local snapshot sync
                          if (targetId) {
                            try {
                              const key = `idemo_partner_passport_${targetId.toUpperCase()}`;
                              const existing = safeStorage.getItem(key);
                              const parsed = existing ? JSON.parse(existing) : {};
                              safeStorage.setItem(key, JSON.stringify({
                                ...parsed,
                                intro_draft: passportIntroDraft,
                                photo_url: activePhotoUrl,
                                draft_photo_path: passportPhotoPath,
                                published_photo_path: passportPhotoPath,
                                photo_consent_given: passportPhotoConsent,
                                review_status: passportReviewStatus === 'approved' ? 'approved' : 'draft',
                                draft_contact_phone: profContactPhone || null,
                                draft_contact_email: profContactEmail || null,
                                contact_phone: profContactPhone || parsed.contact_phone || null,
                                contact_email: profContactEmail || parsed.contact_email || null,
                                applied_recs: appliedRecs,
                                applied_recs_note: appliedRecsNote || null,
                                updated_at: new Date().toISOString(),
                              }));
                            } catch (err) {
                              console.warn('Storage sync error:', err);
                            }
                          }

                          setPassportSaving(false);
                          if (res.success) {
                            setPassportReviewStatus('draft');
                            setPassportMsg({ type: 'success', text: isSr ? 'Nacrt pasoša uspešno sačuvan.' : 'Passport draft saved successfully.' });
                          } else if (res.error && res.error.includes('BACKEND_UNAVAILABLE')) {
                            setPassportReviewStatus('draft');
                            setPassportMsg({ type: 'success', text: isSr ? 'Nacrt pasoša sačuvan lokalno (Demo režim).' : 'Passport draft saved locally (Demo mode).' });
                          } else {
                            setPassportMsg({ type: 'error', text: res.error || (isSr ? 'Greška pri čuvanju nacrta.' : 'Failed to save draft.') });
                          }
                        }}
                        className="px-3.5 py-2 bg-white border border-[#2D3025]/20 hover:bg-neutral-50 text-brand-charcoal text-[10px] font-mono font-bold uppercase rounded-xl transition-colors cursor-pointer"
                      >
                        {isSr ? 'Sačuvaj nacrt' : 'Save Draft'}
                      </button>

                      <button
                        type="button"
                        disabled={passportSaving || (passportIntroDraft.trim() ? passportIntroDraft.trim().split(/\s+/).length : 0) > 200}
                        onClick={async () => {
                          const targetId = activePartnerId;
                          setPassportSaving(true);
                          setPassportMsg(null);
                          // First save draft
                          await savePartnerProfileDraft(
                            passportIntroDraft,
                            passportPhotoPath,
                            passportPhotoMime,
                            passportPhotoConsent,
                            profContactPhone || null,
                            profContactEmail || null,
                            undefined,
                            appliedRecs,
                            appliedRecsNote || null
                          );
                          if (activePartnerId !== targetId) {
                            setPassportSaving(false);
                            return;
                          }
                          // Submit
                          const subRes = await submitPartnerProfile();
                          if (activePartnerId !== targetId) {
                            setPassportSaving(false);
                            return;
                          }

                          // Resilient local snapshot sync
                          if (targetId) {
                            try {
                              const key = `idemo_partner_passport_${targetId.toUpperCase()}`;
                              const existing = safeStorage.getItem(key);
                              const parsed = existing ? JSON.parse(existing) : {};
                              safeStorage.setItem(key, JSON.stringify({
                                ...parsed,
                                intro_draft: passportIntroDraft,
                                photo_url: activePhotoUrl,
                                draft_photo_path: passportPhotoPath,
                                published_photo_path: passportPhotoPath,
                                photo_consent_given: passportPhotoConsent,
                                review_status: 'pending_review',
                                applied_recs: appliedRecs,
                                applied_recs_note: appliedRecsNote || null,
                              }));
                            } catch (err) {
                              console.warn('Storage sync error:', err);
                            }
                          }

                          setPassportSaving(false);
                          if (subRes.success) {
                            setPassportReviewStatus('pending_review');
                            setPassportModified(false);
                            setPassportMsg(null);
                          } else if (subRes.error && subRes.error.includes('BACKEND_UNAVAILABLE')) {
                            setPassportReviewStatus('pending_review');
                            setPassportModified(false);
                            setPassportMsg(null);
                          } else {
                            setPassportMsg({ type: 'error', text: subRes.error || (isSr ? 'Greška pri podnošenju.' : 'Failed to submit.') });
                          }
                        }}
                        className={`px-3.5 py-2 text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer shadow-xs ${
                          showSubmittedGreen
                            ? 'bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-600/40'
                            : 'bg-[#8A1F1F] hover:bg-[#8A1F1F]/90 text-white'
                        }`}
                      >
                        {passportSaving ? (
                          <span>{isSr ? 'Podnošenje na pregled...' : 'Submitting for review...'}</span>
                        ) : showSubmittedGreen ? (
                          <span className="flex items-center gap-1.5">
                            <span>✓</span>
                            <span>{isSr ? 'PODNETO na IDEMO pregled' : 'SUBMITTED For IDEMO Review'}</span>
                          </span>
                        ) : (
                          <span>{isSr ? 'Podnesi na IDEMO pregled' : 'Submit For IDEMO Review'}</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* PARTNER PROPOSAL DESK: OPTION A (RECOMMENDATION) & OPTION B (EXPERIENCE PACKAGE) */}
                  <div className="border border-[#2D3025]/10 rounded-2xl p-4 bg-[#FAF9F5]/90 space-y-4">
                    <div 
                      onClick={() => {
                        triggerHaptic(8);
                        setProposalSectionExpanded(prev => !prev);
                      }}
                      className="flex items-center justify-between cursor-pointer select-none border-b border-[#2D3025]/5 pb-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-[#8A1F1F]" />
                        <div>
                          <h4 className="text-xs uppercase font-mono font-black tracking-wider text-brand-charcoal">
                            {isSr ? 'Predloži novu IDEMO ponudu (IDEMO Kancelarija)' : 'Propose New IDEMO Offer (IDEMO Office)'}
                          </h4>
                          <p className="text-[10px] text-brand-charcoal/60 font-sans mt-0.5">
                            {isSr 
                              ? 'Opcija A (Preporuka) ili Opcija B (Paket tura) na bazi vaše lokalne ekspertize'
                              : 'Option A (Spot / Recommendation) or Option B (Signature Package) based on your expertise'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold bg-[#8A1F1F]/10 text-[#8A1F1F] px-2 py-0.5 rounded-full">
                          {partnerProposalsList.length} {isSr ? 'predloga' : 'proposals'}
                        </span>
                        <ChevronRight size={14} className={`text-brand-charcoal/40 transition-transform ${proposalSectionExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {proposalSectionExpanded ? (
                      <div className="space-y-4 pt-1 animate-fade-in">
                        {/* Option Selector Tabs */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-white border border-[#2D3025]/10 rounded-xl">
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic(6);
                              setProposalType('RECOMMENDATION');
                              setProposalFeedbackMsg(null);
                            }}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              proposalType === 'RECOMMENDATION'
                                ? 'bg-[#8A1F1F] text-white shadow-xs'
                                : 'text-brand-charcoal/70 hover:text-brand-charcoal hover:bg-neutral-50'
                            }`}
                          >
                            <Compass size={13} />
                            <span>{isSr ? 'Opcija A: Nova preporuka' : 'Option A: New Spot'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic(6);
                              setProposalType('PACKAGE');
                              setProposalFeedbackMsg(null);
                            }}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              proposalType === 'PACKAGE'
                                ? 'bg-[#8A1F1F] text-white shadow-xs'
                                : 'text-brand-charcoal/70 hover:text-brand-charcoal hover:bg-neutral-50'
                            }`}
                          >
                            <Package size={13} />
                            <span>{isSr ? 'Opcija B: Paket tura' : 'Option B: Day Package'}</span>
                          </button>
                        </div>

                        <p className="text-[11px] text-brand-charcoal/70 leading-relaxed">
                          {proposalType === 'RECOMMENDATION'
                            ? (isSr 
                                ? 'Predložite skriveni biser, vinariju, kulturni spomenik ili prirodnu lokaciju u Srbiji koja nedostaje u IDEMO bazi. IDEMO Kancelarija će evaluirati podatke, a urednik odobriti uključenje u bazu.'
                                : 'Propose a missing authentic spot, winery, cultural landmark, or nature sanctuary in Serbia. IDEMO Office evaluates suitability, and the Curator approves for catalog publication.')
                            : (isSr
                                ? 'Predložite vaš autentični paket tura ili organizovanu rutu (poludnevnu ili celodnevnu). Nakon odobrenja urednika, paket postaje vidljiv posetiocima, a upiti se automatski usmeravaju vama.'
                                : 'Propose a curated experience or day package with itinerary stops and services. Upon Curator approval, the package is published with inquiries automatically routed directly to you.')
                          }
                        </p>

                        {/* Common Field: Title */}
                        <div>
                          <label className="block text-[9px] font-mono uppercase font-bold text-brand-charcoal/60 mb-1">
                            {proposalType === 'RECOMMENDATION' 
                              ? (isSr ? 'Naziv lokacije / preporuke *' : 'Recommendation Title / Spot Name *')
                              : (isSr ? 'Naziv paketa / ture *' : 'Package / Experience Title *')}
                          </label>
                          <input
                            type="text"
                            placeholder={proposalType === 'RECOMMENDATION' ? 'npr. Manastir Gornjak i Mlavska klisura' : 'npr. Vinska i manastirska tura Fruške Gore'}
                            value={propTitle}
                            onChange={(e) => setPropTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-[#2D3025]/15 rounded-xl text-xs text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                          />
                        </div>

                        {/* Row: Category & Region/Location */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-mono uppercase font-bold text-brand-charcoal/60 mb-1">
                              {isSr ? 'Kategorija *' : 'Category / Theme *'}
                            </label>
                            <select
                              value={propCategory}
                              onChange={(e) => setPropCategory(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#2D3025]/15 rounded-xl text-xs text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                            >
                              <option value="Nature">{isSr ? 'Priroda & Eko' : 'Nature & Wilderness'}</option>
                              <option value="History">{isSr ? 'Istorija & Baština' : 'History & Heritage'}</option>
                              <option value="Gastronomy">{isSr ? 'Gastronomija & Vina' : 'Gastronomy & Wine'}</option>
                              <option value="Travel">{isSr ? 'Putovanje & Panorame' : 'Scenic Travel & Day Tours'}</option>
                              <option value="Wellbeing">{isSr ? 'Banje & Opuštanje' : 'Wellbeing & Spas'}</option>
                              <option value="Clubbing">{isSr ? 'Noćni život & Urbano' : 'Nightlife & Urban Culture'}</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[9px] font-mono uppercase font-bold text-brand-charcoal/60 mb-1">
                              {proposalType === 'RECOMMENDATION' 
                                ? (isSr ? 'Lokacija / Regija u Srbiji *' : 'Location / Region in Serbia *')
                                : (isSr ? 'Ruta / Početna tačka i pravac *' : 'Route / Starting Point & Region *')}
                            </label>
                            <input
                              type="text"
                              placeholder={proposalType === 'RECOMMENDATION' ? 'npr. Homoljske planine, Istočna Srbija' : 'npr. Beograd → Sremski Karlovci → Krušedol'}
                              value={propLocation}
                              onChange={(e) => setPropLocation(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#2D3025]/15 rounded-xl text-xs text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Option B Specific Fields */}
                        {proposalType === 'PACKAGE' && (
                          <div className="space-y-3 p-3 bg-white border border-[#2D3025]/10 rounded-xl">
                            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-brand-charcoal border-b border-[#2D3025]/5 pb-1.5">
                              <Layers size={13} className="text-[#8A1F1F]" />
                              <span>{isSr ? 'Specifikacija paketa i ruta' : 'Package Specification & Route Details'}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-mono uppercase font-bold text-brand-charcoal/60 mb-1">
                                  {isSr ? 'Trajanje ture *' : 'Duration Bucket *'}
                                </label>
                                <select
                                  value={propDurationBucket}
                                  onChange={(e) => setPropDurationBucket(e.target.value as any)}
                                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-lg text-xs text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                                >
                                  <option value="2-3 HOURS">{isSr ? 'Kratka tura (2–3 sata)' : 'Short Excursion (2–3 Hours)'}</option>
                                  <option value="HALF-DAY">{isSr ? 'Poludnevna tura (4–6 sati)' : 'Half-Day Experience (4–6 Hours)'}</option>
                                  <option value="FULL-DAY">{isSr ? 'Celodnevna tura (8+ sati)' : 'Full-Day Expedition (8+ Hours)'}</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[9px] font-mono uppercase font-bold text-brand-charcoal/60 mb-1">
                                  {isSr ? 'Ciljni senzibilitet / Vibe' : 'Target Traveler Vibe / Mood'}
                                </label>
                                <input
                                  type="text"
                                  placeholder="npr. Spokojna baština, degustacija vina, lagan ritam"
                                  value={propTargetVibe}
                                  onChange={(e) => setPropTargetVibe(e.target.value)}
                                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-lg text-xs text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] font-mono uppercase font-bold text-brand-charcoal/60 mb-1">
                                {isSr ? 'Stanice rute (odvojene zarezom) *' : 'Route Stops (comma separated) *'}
                              </label>
                              <input
                                type="text"
                                placeholder="npr. Manastir Krušedol, Vinarija Deurić, Vidikovac Grgeteg, Tradicionalni ručak"
                                value={propRouteStops}
                                onChange={(e) => setPropRouteStops(e.target.value)}
                                className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-lg text-xs text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-mono uppercase font-bold text-brand-charcoal/60 mb-1">
                                {isSr ? 'Uključene usluge partnera (šta obezbeđujete)' : 'Included Partner Services (what you provide)'}
                              </label>
                              <input
                                type="text"
                                placeholder="npr. Licencirani vodič na engleskom, Prevoz kombijem, Degustacija bermeta, Rezervacije"
                                value={propIncludedServices}
                                onChange={(e) => setPropIncludedServices(e.target.value)}
                                className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-lg text-xs text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {/* Proposal Reason / Expertise */}
                        <div>
                          <label className="block text-[9px] font-mono uppercase font-bold text-brand-charcoal/60 mb-1">
                            {isSr ? 'Osnova predloga / Stručnost *' : 'Basis of Proposal / Expertise *'}
                          </label>
                          <select
                            value={propReason}
                            onChange={(e) => setPropReason(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white border border-[#2D3025]/15 rounded-xl text-xs text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                          >
                            <option value="EXPERTISE">{isSr ? 'Stručnost partnera (Duboko lokalno poznavanje terena)' : 'Partner Expertise (Deep local mastery of terrain)'}</option>
                            <option value="UNDERREPRESENTED_SERBIA">{isSr ? 'Nedovoljno zastupljena regija Srbije (Nova destinacija)' : 'Underrepresented Region in Serbia (Expands coverage)'}</option>
                            <option value="NEW_SPOT">{isSr ? 'Novo / nedavno verifikovano autentično mesto' : 'New / recently verified authentic spot'}</option>
                            <option value="PERCEIVED_VALUE">{isSr ? 'Visoka dodata vrednost za inostrane posetioce' : 'High value experience for international visitors'}</option>
                          </select>
                        </div>

                        {/* Description Textarea */}
                        <div>
                          <label className="block text-[9px] font-mono uppercase font-bold text-brand-charcoal/60 mb-1">
                            {proposalType === 'RECOMMENDATION'
                              ? (isSr ? 'Opis i karakteristike lokacije *' : 'Grounded Description & Local Character *')
                              : (isSr ? 'Detaljan narativ i dinamika ture *' : 'Detailed Itinerary Narrative & Pacing *')}
                          </label>
                          <textarea
                            rows={3}
                            placeholder={proposalType === 'RECOMMENDATION' 
                              ? 'Autentičan opis mesta, istorijat, prirodne odlike i preporuka posetiocima...'
                              : 'Kako teče tura, šta posetioci doživljavaju na svakoj tački i zašto je ovo jedinstveno...'}
                            value={propDescription}
                            onChange={(e) => setPropDescription(e.target.value)}
                            className="w-full p-3 bg-white border border-[#2D3025]/15 rounded-xl text-xs text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                          />
                        </div>

                        {/* Highlights (Option A) */}
                        {proposalType === 'RECOMMENDATION' && (
                          <div>
                            <label className="block text-[9px] font-mono uppercase font-bold text-brand-charcoal/60 mb-1">
                              {isSr ? 'Ključne tačke / Izdvajamo (odvojeno zarezom)' : 'Key Highlights / Inclusions (comma separated)'}
                            </label>
                            <input
                              type="text"
                              placeholder="npr. Pećinska crkva, Izvorska voda, Panoramski pogled, Domaći sir"
                              value={propHighlights}
                              onChange={(e) => setPropHighlights(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#2D3025]/15 rounded-xl text-xs text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                            />
                          </div>
                        )}

                        {/* HIGH QUALITY IMAGE ATTACHMENTS & IDEMO OFFICE COLLAGE */}
                        <div className="p-3.5 bg-white border border-[#2D3025]/10 rounded-xl space-y-3">
                          <div className="flex items-center justify-between border-b border-[#2D3025]/5 pb-2">
                            <div className="flex items-center gap-1.5">
                              <Camera size={14} className="text-[#8A1F1F]" />
                              <span className="text-[10px] font-mono uppercase font-bold text-brand-charcoal">
                                {proposalType === 'RECOMMENDATION'
                                  ? (isSr ? 'Fotografija lokacije (Visoka rezolucija)' : 'Recommendation Photo (High Resolution)')
                                  : (isSr ? 'Fotografije paketa (Do 5 slika za IDEMO Kancelariju)' : 'Package Photos (Up to 5 images for IDEMO Office Collage)')}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono font-bold text-brand-charcoal/60 bg-neutral-100 px-2 py-0.5 rounded">
                              {propAttachedImages.length} / {proposalType === 'RECOMMENDATION' ? '1' : '5'} {isSr ? 'priloženo' : 'attached'}
                            </span>
                          </div>

                          <p className="text-[10.5px] text-brand-charcoal/70 leading-relaxed">
                            {proposalType === 'RECOMMENDATION'
                              ? (isSr
                                  ? 'Priložite kvalitetnu fotografiju lokacije. Urednik ima konačnu reč pri odobravanju.'
                                  : 'Attach a high-resolution photo of the spot. The Curator has the final say upon approval.')
                              : (isSr
                                  ? 'Priložite do 5 fotografija koje prikazuju stanice, pejzaže ili degustacije. IDEMO Kancelarija ih sklapa u jedinstveni kolaž za urednički pregled.'
                                  : 'Attach up to 5 photos showing stops, scenic views, or tastings. IDEMO Office compiles them into a single composite collage for Curator review.')
                            }
                          </p>

                          {/* File Input and URL Row */}
                          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              multiple={proposalType === 'PACKAGE'}
                              id="proposal-photo-input"
                              className="hidden"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length === 0) return;
                                const maxAllowed = proposalType === 'RECOMMENDATION' ? 1 : 5;
                                const remainingSlots = maxAllowed - propAttachedImages.length;
                                if (remainingSlots <= 0) return;

                                const toProcess = files.slice(0, remainingSlots);
                                const readers = toProcess.map(file => {
                                  return new Promise<string>((resolve) => {
                                    const reader = new FileReader();
                                    reader.onload = () => resolve(reader.result as string);
                                    reader.readAsDataURL(file);
                                  });
                                });

                                Promise.all(readers).then(newUrls => {
                                  const updated = proposalType === 'RECOMMENDATION' 
                                    ? [newUrls[0]] 
                                    : [...propAttachedImages, ...newUrls].slice(0, 5);
                                  handleUpdateAttachedImages(updated, proposalType);
                                });
                              }}
                            />

                            <label
                              htmlFor="proposal-photo-input"
                              className={`px-3 py-2 bg-white border border-[#2D3025]/20 hover:bg-neutral-50 rounded-lg text-[10px] font-mono font-bold uppercase text-brand-charcoal flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0 ${
                                propAttachedImages.length >= (proposalType === 'RECOMMENDATION' ? 1 : 5) ? 'opacity-50 pointer-events-none' : ''
                              }`}
                            >
                              <ImageIcon size={13} />
                              <span>{isSr ? 'Izaberi fotografije' : 'Upload Photos'}</span>
                            </label>

                            {/* Or direct URL input */}
                            <div className="flex-1 flex items-center gap-1">
                              <input
                                type="text"
                                placeholder={isSr ? 'ili nalepite URL slike...' : 'or paste image URL...'}
                                value={propImageUrl}
                                onChange={(e) => setPropImageUrl(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && propImageUrl.trim()) {
                                    e.preventDefault();
                                    const maxAllowed = proposalType === 'RECOMMENDATION' ? 1 : 5;
                                    if (propAttachedImages.length < maxAllowed) {
                                      const updated = [...propAttachedImages, propImageUrl.trim()].slice(0, maxAllowed);
                                      handleUpdateAttachedImages(updated, proposalType);
                                      setPropImageUrl('');
                                    }
                                  }
                                }}
                                className="flex-1 px-3 py-1.5 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-lg text-xs text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                              />
                              {propImageUrl.trim() && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const maxAllowed = proposalType === 'RECOMMENDATION' ? 1 : 5;
                                    if (propAttachedImages.length < maxAllowed) {
                                      const updated = [...propAttachedImages, propImageUrl.trim()].slice(0, maxAllowed);
                                      handleUpdateAttachedImages(updated, proposalType);
                                      setPropImageUrl('');
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-[#2D3025] text-white rounded-lg text-[10px] font-mono font-bold uppercase hover:bg-black transition-colors cursor-pointer"
                                >
                                  {isSr ? 'Dodaj' : 'Add'}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Thumbnails Gallery */}
                          {propAttachedImages.length > 0 && (
                            <div className="space-y-2 pt-1 border-t border-[#2D3025]/5">
                              <span className="text-[9px] font-mono uppercase font-bold text-brand-charcoal/60 block">
                                {isSr ? 'Izabrane fotografije:' : 'Attached Photos Gallery:'}
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {propAttachedImages.map((imgSrc, idx) => (
                                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#2D3025]/15 aspect-4/3 bg-neutral-100">
                                    <img
                                      src={imgSrc}
                                      alt={`Attachment ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerHaptic(6);
                                        const nextList = propAttachedImages.filter((_, i) => i !== idx);
                                        handleUpdateAttachedImages(nextList, proposalType);
                                      }}
                                      className="absolute top-1 right-1 p-1 bg-black/75 hover:bg-red-700 text-white rounded-full transition-colors cursor-pointer shadow-xs"
                                      title={isSr ? 'Ukloni' : 'Remove'}
                                    >
                                      <X size={10} />
                                    </button>
                                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-mono px-1 rounded">
                                      #{idx + 1}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Option B: IDEMO Office Synthesized Package Collage Preview */}
                          {proposalType === 'PACKAGE' && propAttachedImages.length > 0 && (
                            <div className="p-3 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-xl space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-brand-charcoal">
                                  <Sparkles size={12} className="text-[#8A1F1F]" />
                                  <span>{isSr ? 'IDEMO Kancelarija Sintetisani kolaž paketa (Pregled)' : 'IDEMO Office Synthesized Package Collage Preview'}</span>
                                </div>
                                <span className="text-[8.5px] font-mono text-brand-charcoal/60">
                                  {propCompilingCollage 
                                    ? (isSr ? 'Sklapanje kolaža...' : 'Compiling collage...') 
                                    : (isSr ? 'Kolaž spreman za urednika' : 'Collage ready for Curator review')}
                                </span>
                              </div>

                              <div className="relative rounded-lg overflow-hidden border border-[#2D3025]/20 bg-neutral-900 aspect-3/2 max-h-56 mx-auto flex items-center justify-center">
                                {propCollagePreview ? (
                                  <img
                                    src={propCollagePreview}
                                    alt="IDEMO Office Package Collage Preview"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="text-center p-4 text-white/60 text-xs font-mono">
                                    <Loader2 size={18} className="animate-spin mx-auto mb-1 text-[#C5A059]" />
                                    <span>{isSr ? 'Generisanje reprezentativnog kolaža...' : 'Generating composite package collage...'}</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-[9.5px] font-mono text-brand-charcoal/60 leading-tight">
                                {isSr
                                  ? 'Napomena: Urednik ima isključivo pravo da odobri, zameni ili prilagodi konačnu fotografiju pre objavljivanja (Ustav IDEMO, Princip 40).'
                                  : 'Note: The Curator maintains exclusive authority to approve, modify, or select the final published imagery (IDEMO Constitution, Principle 40).'}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Feedback message */}
                        {proposalFeedbackMsg && (
                          <div className={`p-3 rounded-xl text-xs font-mono font-medium ${
                            proposalFeedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                          }`}>
                            {proposalFeedbackMsg.text}
                          </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex items-center justify-end pt-2 border-t border-[#2D3025]/5">
                          <button
                            type="button"
                            disabled={proposalSubmitting || !propTitle.trim() || !propDescription.trim()}
                            onClick={async () => {
                              triggerHaptic(10);
                              if (!propTitle.trim() || !propDescription.trim()) {
                                setProposalFeedbackMsg({
                                  type: 'error',
                                  text: isSr ? 'Molimo popunite naziv i opis predloga.' : 'Please enter both title and description.'
                                });
                                return;
                              }

                              setProposalSubmitting(true);
                              setProposalFeedbackMsg(null);

                              const pName = currentSimulatedPartner?.name || authenticatedPartnerProfile?.legal_business_name || 'IDEMO Partner';
                              const pCode = currentSimulatedPartner?.pin || authenticatedPartnerProfile?.public_code || activePartnerId || 'UNO';
                              const pEmail = authenticatedPartnerProfile?.contact_email || currentSimulatedPartner?.contact || 'partner@idemo.internal';

                              const parsedHighlights = propHighlights
                                .split(',')
                                .map(s => s.trim())
                                .filter(Boolean);

                              const parsedStops = propRouteStops
                                .split(',')
                                .map(s => s.trim())
                                .filter(Boolean);

                              const parsedServices = propIncludedServices
                                .split(',')
                                .map(s => s.trim())
                                .filter(Boolean);

                              try {
                                const resolvedPrimaryImg = propCollagePreview || (propAttachedImages.length > 0 ? propAttachedImages[0] : propImageUrl.trim() || undefined);

                                const created = savePartnerRecommendationProposal({
                                  partnerId: activePartnerId || 'a0000000-0000-0000-0000-000000000091',
                                  partnerCode: pCode,
                                  partnerName: pName,
                                  partnerEmail: pEmail,
                                  proposalType,
                                  title: propTitle.trim(),
                                  category: propCategory,
                                  location: propLocation.trim() || (isSr ? 'Srbija' : 'Serbia'),
                                  proposalReason: propReason,
                                  description: propDescription.trim(),
                                  highlights: parsedHighlights.length > 0 ? parsedHighlights : undefined,
                                  imageUrl: resolvedPrimaryImg,
                                  images: propAttachedImages.length > 0 ? propAttachedImages : propImageUrl.trim() ? [propImageUrl.trim()] : undefined,
                                  collageImageUrl: propCollagePreview || undefined,
                                  durationBucket: proposalType === 'PACKAGE' ? propDurationBucket : undefined,
                                  routeStops: proposalType === 'PACKAGE' && parsedStops.length > 0 ? parsedStops : undefined,
                                  includedServices: proposalType === 'PACKAGE' && parsedServices.length > 0 ? parsedServices : undefined,
                                  targetVibe: proposalType === 'PACKAGE' && propTargetVibe.trim() ? propTargetVibe.trim() : undefined
                                });

                                // Refresh partner's list
                                const refreshedList = getPartnerProposalsByPartnerId(activePartnerId || pCode);
                                setPartnerProposalsList(refreshedList);

                                const score = created.agent007Evaluation?.suitabilityScore || 92;
                                setProposalFeedbackMsg({
                                  type: 'success',
                                  text: isSr
                                    ? `Predlog uspešno prosleđen! IDEMO Kancelarija je dodelila ocenu podobnosti ${score}/100. Predlog i priložene fotografije su upućeni IDEMO urednicima na pregled.`
                                    : `Proposal successfully submitted! IDEMO Office evaluated suitability score at ${score}/100. Photos and details queued for IDEMO Curator review.`
                                });

                                // Clear inputs
                                setPropTitle('');
                                setPropDescription('');
                                setPropHighlights('');
                                setPropRouteStops('');
                                setPropIncludedServices('');
                                setPropTargetVibe('');
                                setPropImageUrl('');
                                setPropAttachedImages([]);
                                setPropCollagePreview(null);
                              } catch (err: any) {
                                setProposalFeedbackMsg({
                                  type: 'error',
                                  text: err?.message || (isSr ? 'Greška pri slanju predloga.' : 'Failed to submit proposal.')
                                });
                              } finally {
                                setProposalSubmitting(false);
                              }
                            }}
                            className="px-4 py-2 bg-[#8A1F1F] text-white hover:bg-[#8A1F1F]/90 text-[10px] font-mono font-bold uppercase rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <Sparkles size={12} />
                            <span>
                              {proposalSubmitting 
                                ? (isSr ? 'Slanje...' : 'Submitting...') 
                                : (isSr ? 'Pošalji predlog IDEMO Kancelariji i urednicima' : 'Submit Proposal to IDEMO Office & Curators')}
                            </span>
                          </button>
                        </div>

                        {/* Recent Proposals List */}
                        {partnerProposalsList.length > 0 && (
                          <div className="pt-3 border-t border-[#2D3025]/10 space-y-2">
                            <span className="text-[9px] font-mono uppercase font-bold text-brand-charcoal/60 block">
                              {isSr ? 'Vaši dosadašnji predlozi:' : 'Your Submitted Proposals:'}
                            </span>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {partnerProposalsList.map((p) => {
                                const isApproved = p.status === 'CURATOR_APPROVED';
                                const isPkg = p.proposalType === 'PACKAGE';
                                return (
                                  <div key={p.id} className="p-2.5 bg-white border border-[#2D3025]/10 rounded-xl space-y-1 text-xs">
                                    <div className="flex items-center justify-between gap-1 flex-wrap">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                          isPkg ? 'bg-[#1E2E20] text-[#C5A059]' : 'bg-[#8A1F1F]/10 text-[#8A1F1F]'
                                        }`}>
                                          {isPkg ? 'Paket' : 'Preporuka'}
                                        </span>
                                        <span className="font-serif font-bold text-brand-charcoal truncate max-w-[180px]">
                                          {p.title}
                                        </span>
                                      </div>
                                      <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                                        isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                                      }`}>
                                        {isApproved ? (isSr ? '✓ Odobreno & Povezano' : '✓ Approved & Live') : (isSr ? 'Urednički pregled' : 'Pending Curator')}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-brand-charcoal/70 line-clamp-1">
                                      {p.location} • {p.description}
                                    </p>
                                    {p.agent007Evaluation && (
                                      <div className="flex items-center justify-between text-[9px] font-mono text-brand-charcoal/50 pt-0.5 border-t border-neutral-100">
                                        <span>IDEMO Office Score: {p.agent007Evaluation.suitabilityScore}/100</span>
                                        <span className="truncate max-w-[150px]">{p.agent007Evaluation.confidence} confidence</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-brand-charcoal/60 leading-relaxed cursor-pointer" onClick={() => setProposalSectionExpanded(true)}>
                        {isSr
                          ? 'Kliknite ovde da predložite novo mesto (Opcija A) ili vaš paket tura (Opcija B) za obradu IDEMO Kancelariji i odobrenje urednika.'
                          : 'Click here to propose a new spot (Option A) or your curated package (Option B) for IDEMO Office fact-checking and Curator approval.'}
                      </p>
                    )}
                  </div>

                  {/* Five Collapsible Cards */}
                  <div className="space-y-3 pt-1">
                    {capabilityCards.map(card => {
                      const isExpanded = expandedCards[card.key];
                      const totalInGroup = card.items.length;
                      const approvedCount = card.items.filter(item => card.approvedCheck(item)).length;

                      return (
                        <div key={card.key} className="border border-[#2D3025]/10 rounded-2xl overflow-hidden transition-all bg-[#FAF9F5]/40">
                          <div 
                            onClick={() => {
                              setExpandedCards(prev => ({ ...prev, [card.key]: !prev[card.key] }));
                              triggerHaptic(8);
                            }}
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#FAF9F5] transition-colors select-none"
                          >
                            <div className="flex items-center gap-2.5">
                              <card.icon size={14} className="text-brand-charcoal/60" />
                              <span className="text-xs font-serif font-black text-brand-charcoal">{card.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono font-bold bg-[#2D3025]/5 px-2 py-0.5 rounded-full text-brand-charcoal/60">
                                {approvedCount}/{totalInGroup} Approved
                              </span>
                              <ChevronRight size={14} className={`text-brand-charcoal/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-4 bg-white border-t border-[#2D3025]/5 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in">
                              {card.items.map(item => {
                                const isApproved = card.approvedCheck(item);
                                const isPending = card.pendingCheck(item);
                                const labelText = card.itemLabel(item);

                                return (
                                  <div
                                    key={item}
                                    onClick={() => {
                                      if (!isApproved && !isPending) {
                                        triggerHaptic(10);
                                        setRequestConfirmItem({
                                          name: item,
                                          key: card.key,
                                          isLanguage: card.isLanguage,
                                          labelText: labelText
                                        });
                                      }
                                    }}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all text-xs select-none ${
                                      isApproved
                                        ? 'bg-emerald-50/40 border-emerald-500/10 text-emerald-900 cursor-default'
                                        : isPending
                                        ? 'bg-amber-50/40 border-amber-500/10 text-amber-950 cursor-default'
                                        : 'bg-white border-[#2D3025]/5 text-brand-charcoal/60 hover:bg-white/80 cursor-pointer hover:border-[#2D3025]/20 hover:text-brand-charcoal'
                                    }`}
                                  >
                                    <span className="font-semibold leading-tight truncate pr-2" title={labelText}>{labelText}</span>
                                    <div className="flex items-center gap-1.5 shrink-0 pl-1">
                                      {isApproved ? (
                                        <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-700 bg-emerald-500/5 border border-emerald-500/15 px-2 py-0.5 rounded">
                                          ✓ Approved
                                        </span>
                                      ) : isPending ? (
                                        <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-amber-700 bg-amber-500/5 border border-amber-500/15 px-2 py-0.5 rounded animate-pulse">
                                          ⏳ Pending
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-brand-charcoal/40 bg-brand-charcoal/5 border border-brand-charcoal/5 px-2 py-0.5 rounded transition-colors duration-150">
                                          ○ Available
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                )}

                {/* CARD 2: MY OPPORTUNITIES */}
                {partnerWorkspaceTab === 'opportunities' && (() => {
                  const renderOpportunityCard = (inq: Inquiry, isArchived: boolean = false) => {
                    const isConfirmedByVisitor = Boolean(
                      inq.visitorConfirmed === true ||
                      inq.status === 'Confirmed by Traveler' ||
                      inq.status === 'Arrangement Confirmed' ||
                      inq.status === 'selected' ||
                      inq.matchStatus === 'selected' ||
                      inq.rawMatchStatus === 'selected' ||
                      inq.inquiryStatus === 'confirmed'
                    );

                    const isAccepted = !isConfirmedByVisitor && Boolean(
                      inq.status === 'Locked / Accepted' ||
                      inq.status === 'accepted' ||
                      inq.status === 'responded' ||
                      inq.matchStatus === 'responded' ||
                      inq.rawMatchStatus === 'responded'
                    );

                    const isAlternative = Boolean(
                      inq.status === 'Alternative Proposed' ||
                      inq.status === 'proposed' ||
                      inq.alternativeOffer
                    );

                    const isDeclined = Boolean(
                      inq.status === 'Released' ||
                      inq.status === 'declined' ||
                      inq.status === 'expired' ||
                      inq.status === 'not_selected' ||
                      inq.status === 'withdrawn' ||
                      inq.matchStatus === 'declined' ||
                      inq.matchStatus === 'expired' ||
                      inq.matchStatus === 'not_selected' ||
                      inq.matchStatus === 'withdrawn' ||
                      inq.rawMatchStatus === 'declined' ||
                      inq.rawMatchStatus === 'expired'
                    );

                    const isCompleted = Boolean(
                      inq.status === 'Answered / Completed' ||
                      inq.status === 'completed' ||
                      inq.status === 'closed' ||
                      inq.status === 'canceled' ||
                      inq.inquiryStatus === 'completed' ||
                      inq.inquiryStatus === 'closed' ||
                      inq.inquiryStatus === 'canceled'
                    );

                    const isCounter = Boolean(
                      inq.matchStatus === 'counter_by_visitor' ||
                      inq.rawMatchStatus === 'counter_by_visitor' ||
                      inq.status === 'counter_by_visitor'
                    );

                    const isPendingAction = isCounter || (!isConfirmedByVisitor && !isAccepted && !isAlternative && !isDeclined && !isCompleted);

                    const isAltFormOpen = altFormOpenId === inq.id;

                    return (
                      <div 
                        key={inq.id} 
                        onClick={() => {
                          if (inq.matchStatus === 'offered' || inq.rawMatchStatus === 'offered') {
                            handleViewOpportunity(inq.matchId || inq.id);
                          }
                        }}
                        className={`border rounded-2xl p-4 space-y-3 shadow-xs text-left ${
                          isArchived 
                            ? 'border-[#2D3025]/8 bg-[#FAF9F5]/40 opacity-95' 
                            : 'border-[#2D3025]/10 bg-[#FAF9F5]/60'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="text-left flex items-start gap-2">
                            {(inq.matchStatus === 'offered' || inq.rawMatchStatus === 'offered') && (
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewOpportunity(inq.matchId || inq.id);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-red-500/10 text-red-700 border border-red-500/20 cursor-pointer hover:bg-red-100 shrink-0 mt-0.5"
                                title="Unread opportunity"
                              >
                                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                <span>NEW</span>
                              </span>
                            )}
                            <div>
                              <h4 className="text-xs font-serif font-black text-brand-charcoal">{inq.visitorName}</h4>
                              <p className="text-[9px] font-mono text-brand-charcoal/60 font-bold uppercase">{inq.recTitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isArchived && (
                              <span className="text-[7.5px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-brand-charcoal/5 text-brand-charcoal/50 border border-brand-charcoal/10">
                                {isSr ? 'ARHIVA' : 'ARCHIVED'}
                              </span>
                            )}
                            <span className={`text-[8.5px] font-mono font-bold uppercase px-2.5 py-1 rounded-md border ${
                              isConfirmedByVisitor
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                                : isPendingAction
                                ? 'bg-amber-500/10 text-amber-900 border-amber-500/30 animate-pulse'
                                : isAccepted
                                ? 'bg-emerald-800 text-emerald-100 border-emerald-700 shadow-2xs'
                                : isAlternative
                                ? 'bg-[#8A1F1F]/10 text-[#8A1F1F] border-[#8A1F1F]/20'
                                : isDeclined
                                ? 'bg-gray-200 text-gray-700 border-gray-300'
                                : 'bg-[#2D3025]/5 text-[#2D3025]/70 border-transparent'
                            }`}>
                              {isConfirmedByVisitor
                                ? (isSr ? 'POTVRĐENO OD STRANE POSETIOCA' : 'PROPOSAL CONFIRMED BY TRAVELER')
                                : isPendingAction
                                ? (isSr ? 'Čeka Vaš odgovor' : 'Awaiting Your Response')
                                : isAccepted
                                ? (isSr ? 'UPIT PRIHVAĆEN' : 'INQUIRY ACCEPTED')
                                : isAlternative
                                ? (isSr ? 'Predložena alternativa' : 'Alternative Offered')
                                : isDeclined
                                ? (isSr ? 'Odbijeno' : 'Declined')
                                : (isSr ? 'Završeno' : 'Completed')}
                            </span>
                          </div>
                        </div>

                        {/* Inquiry Query / Visitor Notes */}
                        <div className="bg-white border border-[#2D3025]/10 rounded-xl p-3 text-[11.5px] text-brand-charcoal/90 leading-relaxed italic text-left shadow-2xs">
                          "{inq.query}"
                        </div>

                        {/* Proposal 1: 30-Minute Cascading Response Countdown for Pending Opportunities */}
                        {isPendingAction && !isArchived && inq.createdAt && (
                          <div className="flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-left">
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-amber-900 block">
                                {isSr ? 'IDEMO KASKADNI ODGOVOR (SLA)' : 'IDEMO CASCADING SLA'}
                              </span>
                              <p className="text-[9.5px] text-amber-950/80 font-sans leading-snug">
                                {isSr
                                  ? 'Nakon 30 minuta bez odgovora, upit se automatski i diskretno prosleđuje sledećem rangiranom partneru.'
                                  : 'If unanswered within 30 mins, inquiry automatically and discreetly cascades to next ranked partner.'}
                              </p>
                            </div>
                            <div className="shrink-0 pl-2">
                              <OpportunitySlaCountdown createdAt={inq.createdAt} isSr={isSr} />
                            </div>
                          </div>
                        )}

                        {/* Visitor Counter Proposal Section if present */}
                        {(inq.matchStatus === 'counter_by_visitor' || inq.rawMatchStatus === 'counter_by_visitor' || (inq.counterProposal && (inq.counterProposal.proposedStartAt || inq.counterProposal.notes))) && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-left">
                            <div className="flex items-center gap-1.5 text-amber-950 font-mono text-[9px] font-bold uppercase">
                              <Calendar size={13} className="text-amber-800 shrink-0" />
                              <span>{isSr ? 'Posetilac je predložio novi termin / uslove:' : 'Visitor Counter-Proposal:'}</span>
                            </div>
                            <div className="bg-white/90 p-2.5 rounded-lg text-xs font-sans text-brand-charcoal space-y-1 border border-amber-500/15">
                              {(inq.counterProposal?.proposedStartAt || inq.requestedStartAt) && (
                                <p className="font-mono text-[10.5px] font-black text-amber-950">
                                  <strong>{isSr ? 'Predloženi termin:' : 'Proposed Date/Time:'}</strong>{' '}
                                  {inq.counterProposal?.proposedStartAt || inq.requestedStartAt}
                                </p>
                              )}
                              {(inq.counterProposal?.notes || inq.query) && (
                                <p className="text-[11px] italic text-brand-charcoal/80">
                                  "{inq.counterProposal?.notes || inq.query}"
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptCounter(inq.matchId || inq.id);
                                }}
                                disabled={actionLoading[inq.id] || actionLoading[inq.matchId || '']}
                                className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                              >
                                <CheckCircle2 size={13} />
                                <span>{isSr ? 'Prihvati kontra-predlog' : 'Accept Counter-Proposal'}</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeclineCounter(inq.matchId || inq.id);
                                }}
                                disabled={actionLoading[inq.id] || actionLoading[inq.matchId || '']}
                                className="flex-1 py-2 px-3 bg-white border border-red-500/30 hover:bg-red-50 text-red-700 text-[9.5px] font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                              >
                                <XCircle size={13} />
                                <span>{isSr ? 'Odbij kontra-predlog' : 'Decline Counter-Proposal'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-brand-charcoal/70 bg-white/60 p-2.5 rounded-xl border border-[#2D3025]/5 text-left">
                          <div><span className="text-brand-charcoal/40 uppercase font-bold">{isSr ? 'Lokacija:' : 'Geography:'}</span> {inq.geography || 'N/A'}</div>
                          <div><span className="text-brand-charcoal/40 uppercase font-bold">{isSr ? 'Jezik:' : 'Language:'}</span> {inq.language || 'English'}</div>
                          <div><span className="text-brand-charcoal/40 uppercase font-bold">{isSr ? 'Budžet:' : 'Budget:'}</span> {inq.budget || 'N/A'}</div>
                          <div><span className="text-brand-charcoal/40 uppercase font-bold">{isSr ? 'Vreme:' : 'Available Time:'}</span> {inq.availableTime || 'N/A'}</div>
                        </div>

                        {/* Show Reply Thread / Submitted Responses */}
                        {inq.replies && inq.replies.length > 0 && (
                          <div className="space-y-1.5 pt-1.5 border-t border-[#2D3025]/10 text-left">
                            <span className="text-[8px] font-mono uppercase font-black text-brand-charcoal/50 block">
                              {isSr ? 'Poslati odgovori:' : 'Submitted Responses:'}
                            </span>
                            {inq.replies.map((rep, idx) => (
                              <div key={idx} className="bg-emerald-500/10 text-emerald-950 border border-emerald-500/20 rounded-xl p-2.5 text-[10.5px] leading-relaxed font-sans">
                                "{rep}"
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Show Alternative Offer details if present */}
                        {inq.alternativeOffer && (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[10px] font-mono text-amber-950 space-y-1">
                            <span className="font-bold uppercase text-[8px] block text-amber-800">
                              {isSr ? 'Predloženi zamenski termin:' : 'Proposed Alternative Parameters:'}
                            </span>
                            <p><strong>{isSr ? 'Datum:' : 'Date:'}</strong> {inq.alternativeOffer.date} {inq.alternativeOffer.time && `• ${inq.alternativeOffer.time}`}</p>
                            {inq.alternativeOffer.note && <p><strong>{isSr ? 'Napomena:' : 'Note:'}</strong> "{inq.alternativeOffer.note}"</p>}
                          </div>
                        )}

                        {/* Confirmed by Visitor Banner */}
                        {isConfirmedByVisitor && (
                          <div className="bg-emerald-600/15 border-2 border-emerald-600/30 rounded-xl p-3 text-left space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-mono text-[10.5px] font-black uppercase text-emerald-900">
                                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                                <span>{isSr ? 'POTVRĐENO OD STRANE POSETIOCA' : 'PROPOSAL CONFIRMED BY TRAVELER'}</span>
                              </div>
                              <span className="text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-700 text-white">
                                {isSr ? 'Aranžman zaključen' : 'Arrangement Locked'}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-emerald-950 font-sans leading-relaxed">
                              {isSr 
                                ? 'Posetilac je prihvatio vaše uslove i zvanično potvrdio aranžman! Možete pristupiti direktnoj realizaciji i kontaktu.' 
                                : 'The traveler has confirmed your terms and accepted the proposal! You may proceed with direct realization and contact.'}
                            </p>
                          </div>
                        )}

                        {/* Confirmed / Accepted Status Display */}
                        {isAccepted && !isConfirmedByVisitor && (
                          <div className="pt-2 border-t border-[#2D3025]/10 space-y-2 text-left">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 py-2.5 px-3.5 bg-[#142A1E] text-emerald-100 border border-emerald-700/60 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-default">
                                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-emerald-200">
                                  {isSr ? 'UPIT PRIHVAĆEN (INQUIRY ACCEPTED)' : 'INQUIRY ACCEPTED'}
                                </span>
                              </div>
                            </div>
                            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3 text-left space-y-1.5 shadow-2xs">
                              <div className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase text-emerald-800">
                                <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                                <span>{isSr ? 'Zvanična ponuda poslata posetiocu' : 'Official Proposal Dispatched'}</span>
                              </div>
                              <p className="text-[10.5px] text-emerald-950 font-sans leading-relaxed">
                                {isSr 
                                  ? 'Posetilac je odmah obavešten u sekciji Moj Planer (aktivirana je crvena tačka na dugmetu Planera). Čeka se da posetilac potvrdi aranžman ili zakaže termin.' 
                                  : 'The traveler was instantly notified in My Planner (red dot indicator active on Planner button). Awaiting traveler confirmation.'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* ACTION BUTTONS FOR PENDING OPPORTUNITY */}
                        {isPendingAction && (
                          <div className="pt-2 border-t border-[#2D3025]/10 space-y-2 text-left">
                            <div className="space-y-1">
                              <label className="text-[8px] font-mono uppercase font-bold text-brand-charcoal/50 block">
                                {isSr ? 'Poruka / Uslovi posetiocu (opciono):' : 'Message / Offer to Visitor (Optional):'}
                              </label>
                              <textarea
                                rows={2}
                                placeholder={isSr ? 'Npr. "Čekam Vas kod Hrama St. Save u 10:00h"...' : 'e.g. "I will meet you at St Sava at 10:00"...'}
                                value={activeAnswerText[inq.id] || ''}
                                onChange={e => {
                                  setActiveAnswerText(prev => ({ ...prev, [inq.id]: e.target.value }));
                                }}
                                className="w-full p-2.5 bg-white border border-[#2D3025]/15 rounded-xl text-xs font-sans text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F]/20 focus:outline-none"
                              />
                            </div>
                            <span className="text-[8px] font-mono uppercase font-bold text-brand-charcoal/50 block">
                              {isSr ? 'Izaberite akciju za ovaj upit:' : 'Select Action for Opportunity:'}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handlePartnerAcceptInquiry(inq.id, currentSimulatedPartner.id)}
                                disabled={actionLoading[inq.id]}
                                className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                              >
                                <CheckCircle2 size={13} className={actionLoading[inq.id] ? 'animate-spin' : ''} />
                                <span>
                                  {actionLoading[inq.id]
                                    ? (isSr ? 'Prihvatanje...' : 'Accepting...')
                                    : (isSr ? 'Prihvati upit' : 'Accept Opportunity')}
                                </span>
                              </button>

                              <button
                                onClick={() => setAltFormOpenId(isAltFormOpen ? null : inq.id)}
                                disabled={actionLoading[inq.id]}
                                className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                              >
                                <Calendar size={13} />
                                <span>{isSr ? 'Predloži drugi termin' : 'Propose Alternative'}</span>
                              </button>

                              <button
                                onClick={() => handlePartnerPassInquiry(inq.id, currentSimulatedPartner.id)}
                                disabled={actionLoading[inq.id]}
                                className="py-2 px-3 bg-white border border-[#2D3025]/20 hover:bg-red-50 disabled:opacity-60 text-red-700 text-[9.5px] font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <XCircle size={13} />
                                <span>{isSr ? 'Odbij' : 'Decline'}</span>
                              </button>
                            </div>

                            {/* Form for Proposing Alternative */}
                            {isAltFormOpen && (
                              <div className="bg-white border border-amber-500/20 rounded-2xl p-3.5 space-y-2.5 mt-2 animate-fade-in shadow-xs">
                                <span className="text-[8.5px] font-mono font-bold uppercase text-amber-800 block">
                                  {isSr ? 'Unesite zamenske parametre ponude:' : 'Enter Alternative Parameters:'}
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-mono font-bold uppercase text-brand-charcoal/50 block">
                                      {isSr ? 'Datum' : 'Date'}
                                    </label>
                                    <input
                                      type="date"
                                      value={altOfferForm[inq.id]?.date || ''}
                                      onChange={e => setAltOfferForm(prev => ({
                                        ...prev,
                                        [inq.id]: { ...(prev[inq.id] || { date: '', time: '', note: '' }), date: e.target.value }
                                      }))}
                                      className="w-full p-2 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-lg text-xs font-mono"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-mono font-bold uppercase text-brand-charcoal/50 block">
                                      {isSr ? 'Vreme' : 'Time'}
                                    </label>
                                    <input
                                      type="time"
                                      value={altOfferForm[inq.id]?.time || ''}
                                      onChange={e => setAltOfferForm(prev => ({
                                        ...prev,
                                        [inq.id]: { ...(prev[inq.id] || { date: '', time: '', note: '' }), time: e.target.value }
                                      }))}
                                      className="w-full p-2 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-lg text-xs font-mono"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-mono font-bold uppercase text-brand-charcoal/50 block">
                                    {isSr ? 'Poruka / Uslovi' : 'Note / Parameters'}
                                  </label>
                                  <textarea
                                    rows={2}
                                    placeholder={isSr ? 'Napišite razlog ili predlog drugog termina/uslova...' : 'Explain proposed changes or schedule alternative...'}
                                    value={altOfferForm[inq.id]?.note || ''}
                                    onChange={e => setAltOfferForm(prev => ({
                                      ...prev,
                                      [inq.id]: { ...(prev[inq.id] || { date: '', time: '', note: '' }), note: e.target.value }
                                    }))}
                                    className="w-full p-2 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-lg text-xs font-sans"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setAltFormOpenId(null)}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-brand-charcoal text-[9px] font-bold uppercase rounded-lg cursor-pointer"
                                  >
                                    {isSr ? 'Odustani' : 'Cancel'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      const form = altOfferForm[inq.id];
                                      if (!form?.date) {
                                        alert(isSr ? 'Unesite predloženi datum.' : 'Please select a proposed date.');
                                        return;
                                      }
                                      handlePartnerProposeAlternative(
                                        inq.id,
                                        currentSimulatedPartner.id,
                                        form.date,
                                        form.time || '10:00',
                                        form.note || 'Alternative parameters proposed'
                                      );
                                      setAltFormOpenId(null);
                                    }}
                                    className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer shadow-xs"
                                  >
                                    {isSr ? 'Pošalji predlog' : 'Submit Proposal'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Submit Final Response / Offer Form for Accepted or Alternative Leads */}
                        {(isAccepted || isAlternative) && (
                          <div className="space-y-2 pt-2 border-t border-[#2D3025]/10 text-left">
                            <span className="text-[8px] font-mono uppercase font-bold text-brand-charcoal/50 block">
                              {isSr ? 'Pošaljite detaljnu ponudu / itinerer' : 'Transmit Professional Offer / Proposal'}
                            </span>
                            <textarea 
                              placeholder={isSr ? 'Napišite vašu ponudu, cene, detalje ture ili uslove...' : 'Write your detailed offer, pricing, tour itinerary, or conditions...'}
                              value={activeAnswerText[inq.id] || ''}
                              onChange={e => {
                                setActiveAnswerText(prev => ({ ...prev, [inq.id]: e.target.value }));
                              }}
                              className="w-full p-3 bg-white border border-[#2D3025]/15 rounded-xl text-xs focus:ring-1 focus:ring-[#8A1F1F]/20 focus:outline-none text-brand-charcoal"
                              rows={3}
                            />
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => {
                                  const ans = activeAnswerText[inq.id];
                                  if (ans && ans.trim()) {
                                    handlePartnerSubmitAnswer(inq.id, currentSimulatedPartner.id, ans);
                                    setActiveAnswerText(prev => ({ ...prev, [inq.id]: '' }));
                                  }
                                }}
                                className="px-4 py-2 bg-[#8A1F1F] hover:bg-[#8A1F1F]/90 text-white text-[9px] font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-xs transition-colors"
                              >
                                {isSr ? 'Pošalji ponudu' : 'Transmit Proposal'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* WITHDRAW PROPOSAL ACTION FOR ACTIVE / PROPOSED OPPORTUNITIES */}
                        {(isAlternative || inq.matchStatus === 'responded' || inq.matchStatus === 'proposed' || inq.matchStatus === 'counter_by_visitor') && inq.status !== 'Released' && (
                          <div className="pt-2 border-t border-[#2D3025]/10 text-left">
                            {withdrawConfirmId === (inq.matchId || inq.id) ? (
                              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-left animate-fade-in">
                                <p className="text-[10px] font-medium text-red-950 leading-snug">
                                  {isSr 
                                    ? 'Povuci ponudu? Posetilac može biti povezan sa drugim odgovarajućim partnerom.' 
                                    : 'Withdraw this proposal? The visitor may be connected with another suitable partner.'}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExecuteWithdraw(inq.matchId || inq.id);
                                    }}
                                    disabled={actionLoading[inq.id] || actionLoading[inq.matchId || '']}
                                    className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                                  >
                                    {isSr ? 'DA, POVUCI PONUDU' : 'YES, WITHDRAW'}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setWithdrawConfirmId(null);
                                    }}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-brand-charcoal text-[9px] font-bold uppercase rounded-lg cursor-pointer"
                                  >
                                    {isSr ? 'ODUSTANI' : 'CANCEL'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-end">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setWithdrawConfirmId(inq.matchId || inq.id);
                                  }}
                                  className="text-[9px] font-mono font-bold uppercase text-red-700/70 hover:text-red-700 hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  <span>✕</span>
                                  <span>{isSr ? 'POVUCI PONUDU' : 'WITHDRAW PROPOSAL'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  };

                  return (
                    <div className="bg-white border border-[#2D3025]/10 rounded-[32px] p-6 shadow-sm text-left space-y-5">
                      <div className="flex items-center justify-between border-b border-[#2D3025]/5 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                            <Briefcase size={14} />
                          </span>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] uppercase tracking-widest font-mono text-brand-charcoal/40 font-bold block">Assigned Leads</span>
                              {activeInquiries.length > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold bg-amber-500/20 text-amber-900 border border-amber-500/30">
                                  {activeInquiries.length} {isSr ? 'aktivno' : 'active'}
                                </span>
                              )}
                            </div>
                            <h3 className="text-xs uppercase tracking-wide font-black text-brand-charcoal">
                              {isSr ? 'MOJE PRILIKE I UPITI' : 'MY OPPORTUNITIES'}
                            </h3>
                          </div>
                        </div>

                        {assignedInquiries.length > 0 && (
                          <button
                            type="button"
                            id="btn-clear-partner-opportunities"
                            onClick={handleClearOpportunitiesForCurrentPartner}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold text-red-700/80 hover:text-red-800 bg-red-50/80 hover:bg-red-100/80 border border-red-200/60 transition-colors cursor-pointer"
                            title={isSr ? 'Obriši sve prilike za ovog partnera (čista tabla)' : 'Clear all opportunities for this partner (clean board)'}
                          >
                            <Trash2 size={11} />
                            <span>{isSr ? 'Očisti sve' : 'Clean board'}</span>
                          </button>
                        )}
                      </div>

                      {partnerActionFeedback && (
                        <div className={`p-3 rounded-2xl border text-left text-xs space-y-1 flex items-start gap-2.5 animate-fade-in ${
                          partnerActionFeedback.type === 'success' 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                            : 'bg-amber-50 border-amber-300 text-amber-950'
                        }`}>
                          <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                          <div className="flex-1 text-[11px] leading-snug font-medium">
                            {partnerActionFeedback.message}
                          </div>
                        </div>
                      )}

                      {assignedInquiries.length === 0 ? (
                        <div className="text-center py-8 text-brand-charcoal/40 text-[11px] font-mono">
                          {isSr ? 'Trenutno nema dodeljenih prilika.' : 'No active opportunities currently assigned.'}
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {/* SECTION 1: ACTIVE OPPORTUNITIES */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-black uppercase tracking-wider text-brand-charcoal/70 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${activeInquiries.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'}`} />
                                <span>{isSr ? 'Aktivne prilike' : 'Active Opportunities'}</span>
                                <span className="text-brand-charcoal/40">({activeInquiries.length})</span>
                              </span>
                            </div>

                            {activeInquiries.length === 0 ? (
                              <div className="p-4 rounded-2xl bg-[#FAF9F5]/40 border border-[#2D3025]/5 text-center text-[10.5px] font-mono text-brand-charcoal/40">
                                {isSr ? 'Nema novih upita na čekanju. Sve prilike su obrađene.' : 'No pending opportunities. All inquiries have been handled.'}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {activeInquiries.map(inq => renderOpportunityCard(inq, false))}
                              </div>
                            )}
                          </div>

                          {/* SECTION 2: ARCHIVED / PAST OPPORTUNITIES FOLDER */}
                          {pastInquiries.length > 0 && (
                            <div className="pt-3 border-t border-[#2D3025]/10 space-y-3">
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  id="btn-toggle-past-opportunities-folder"
                                  onClick={() => setIsPastFolderOpen(prev => !prev)}
                                  className="flex items-center gap-2 text-left cursor-pointer group py-1"
                                >
                                  <span className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-gray-200 text-brand-charcoal/70 transition-colors">
                                    <FolderArchive size={14} />
                                  </span>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-mono font-black uppercase tracking-wider text-brand-charcoal">
                                        {isSr ? 'Arhiva obrađenih prilika' : 'Handled Opportunities Archive'}
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded-full text-[8.5px] font-mono font-bold bg-brand-charcoal/10 text-brand-charcoal/70">
                                        {pastInquiries.length}
                                      </span>
                                      <ChevronDown 
                                        size={14} 
                                        className={`text-brand-charcoal/60 transition-transform duration-200 ${isPastFolderOpen ? 'rotate-180' : ''}`} 
                                      />
                                    </div>
                                    <span className="text-[8.5px] font-mono text-brand-charcoal/40 block">
                                      {isPastFolderOpen 
                                        ? (isSr ? 'Kliknite da skupite folder' : 'Click to collapse folder') 
                                        : (isSr ? 'Prihvaćeni, predloženi i završeni upiti — kliknite da pregledate' : 'Accepted, proposed, or resolved inquiries — click to view')}
                                    </span>
                                  </div>
                                </button>

                                <button
                                  type="button"
                                  id="btn-clear-archived-opportunities"
                                  onClick={handleClearArchivedOpportunities}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8.5px] font-mono font-semibold text-brand-charcoal/50 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                  title={isSr ? 'Isprazni arhivu obrađenih upita' : 'Clear archived inquiries'}
                                >
                                  <Trash2 size={10} />
                                  <span>{isSr ? 'Očisti arhivu' : 'Clear archive'}</span>
                                </button>
                              </div>

                              {isPastFolderOpen && (
                                <div className="space-y-3 pl-1 border-l-2 border-brand-charcoal/10 animate-fade-in pt-1">
                                  {pastInquiries.map(inq => renderOpportunityCard(inq, true))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* CARD 3: MESSAGES */}
                {partnerWorkspaceTab === 'messages' && (
                <div className="bg-white border border-[#2D3025]/10 rounded-[32px] p-6 shadow-sm text-left space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#2D3025]/5 pb-3">
                    <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                      <MessageCircle size={14} />
                    </span>
                    <div className="space-y-0.5">
                      <span className="text-[8px] uppercase tracking-widest font-mono text-brand-charcoal/40 font-bold block">
                        Secure Thread • office@idemo.group
                      </span>
                      <h3 className="text-xs uppercase tracking-wide font-black text-brand-charcoal">MESSAGES WITH IDEMO</h3>
                    </div>
                  </div>

                  {/* Messages Box */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                    {currentMessages.map(msg => {
                      const isMe = msg.sender === 'You';
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
                          <div className={`p-3 rounded-2xl text-[11px] leading-relaxed max-w-[85%] ${
                            isMe 
                              ? 'bg-brand-charcoal text-white rounded-tr-none' 
                              : 'bg-[#FAF9F5] border border-[#2D3025]/10 text-brand-charcoal rounded-tl-none'
                          }`}>
                            {msg.text}
                          </div>
                          <span className="text-[8px] font-mono text-brand-charcoal/40 px-1">
                            {isMe ? 'You → office@idemo.group' : 'IDEMO Curation'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Send Message Input Form */}
                  <div className="flex gap-2 border-t border-[#2D3025]/5 pt-3">
                    <input 
                      type="text"
                      placeholder="Type secure reply to IDEMO team..."
                      value={partnerMessageInput}
                      onChange={e => setPartnerMessageInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleSendPartnerMessage(currentSimulatedPartner.id, partnerMessageInput);
                          setPartnerMessageInput('');
                        }
                      }}
                      className="flex-1 px-3 h-10 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl text-xs focus:ring-1 focus:ring-brand-charcoal/20 focus:outline-none text-brand-charcoal"
                    />
                    <button 
                      onClick={() => {
                        handleSendPartnerMessage(currentSimulatedPartner.id, partnerMessageInput);
                        setPartnerMessageInput('');
                      }}
                      className="px-3 bg-brand-charcoal text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-brand-charcoal/90 transition-colors flex items-center justify-center cursor-pointer"
                    >
                      Send
                    </button>
                  </div>
                </div>
                )}
              </div>
            );
          })()}
        </>
      )}
        </div>
      {/* 5. MODAL: PASSCODE VERIFICATION SYSTEM (Visitor View) */}
      <AnimatePresence>
        {pinTargetPartner && (
          <div className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-[#FAF9F5] border-2 border-[#E3DFD5] w-full max-w-[360px] rounded-[32px] overflow-hidden shadow-2xl p-6 relative flex flex-col text-left space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-black tracking-widest uppercase text-amber-600">PASSCODE VERIFICATION</span>
                <button onClick={() => setPinTargetPartner(null)} className="w-7 h-7 rounded-full bg-[#2D3025]/5 flex items-center justify-center text-[#2D3025]/50"><X size={12} /></button>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-serif font-black text-brand-charcoal">{pinTargetPartner.nameEn}</h3>
                <p className="text-[9.5px] text-[#2D3025]/60 font-semibold flex items-center gap-1">
                  <MapPin size={9} className="text-amber-500" />
                  <span>{pinTargetPartner.locationEn}</span>
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[9px] uppercase tracking-widest text-[#2D3025]/40 font-black block text-center">Enter 4-Digit Access PIN</label>
                <input 
                  type="password" 
                  maxLength={4}
                  placeholder="••••"
                  value={pinInput}
                  onChange={e => { setPinInput(e.target.value.replace(/\D/g, '')); triggerHaptic(8); }}
                  className="w-full text-center tracking-[0.5em] text-xl font-mono font-black h-12 bg-white border border-[#2D3025]/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-brand-charcoal"
                />
                
                {pinError && (
                  <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-accent-red justify-center pt-1">
                    <AlertCircle size={11} />
                    <span>{pinError}</span>
                  </div>
                )}
              </div>

              <button 
                onClick={handleVerifyPin}
                disabled={pinInput.length !== 4}
                className={`w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${
                  pinInput.length === 4 ? 'bg-brand-charcoal text-white shadow-sm' : 'bg-[#2D3025]/5 text-[#2D3025]/25 cursor-not-allowed'
                }`}
              >
                <Unlock size={12} />
                <span>Verify & Unlock</span>
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL: LIGHTWEIGHT PORTFOLIO REQUEST CONFIRMATION */}
      <AnimatePresence>
        {requestConfirmItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#2D3025]/10 w-full max-w-[340px] rounded-[32px] overflow-hidden shadow-2xl p-6 flex flex-col text-left space-y-5"
            >
              <div className="space-y-1">
                <span className="text-[8px] uppercase tracking-widest font-mono text-[#8A1F1F] font-black block">PORTFOLIO EXPANSION</span>
                <h3 className="text-sm font-serif font-black text-brand-charcoal leading-tight">
                  Request Capability Extension
                </h3>
              </div>

              <div className="space-y-2 bg-[#FAF9F5] border border-[#2D3025]/5 p-4 rounded-2xl">
                <p className="text-[9.5px] text-brand-charcoal/50 uppercase tracking-wider font-mono font-bold leading-none">
                  Requesting Approval For:
                </p>
                <p className="text-sm font-serif font-black text-[#8A1F1F]">
                  {requestConfirmItem.labelText}
                </p>
                <p className="text-[10px] text-brand-charcoal/60 leading-relaxed pt-1">
                  Once requested, this capability will enter your portal as <strong className="text-amber-700">Pending</strong> awaiting validation from the IDEMO curation team.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                  onClick={() => { triggerHaptic(10); setRequestConfirmItem(null); }}
                  className="flex-1 h-10 border border-[#2D3025]/10 hover:bg-[#2D3025]/5 text-brand-charcoal rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    triggerHaptic(12);
                    const recId = requestConfirmItem.isLanguage ? `lang-${requestConfirmItem.name}` : `cap-${requestConfirmItem.name}`;
                    const recTitle = requestConfirmItem.isLanguage ? `Language: ${requestConfirmItem.name}` : `Capability: ${requestConfirmItem.name}`;
                    handlePartnerExpressInterest(recId, recTitle, currentSimulatedPartner);
                    setRequestConfirmItem(null);
                  }}
                  className="flex-1 h-10 bg-[#8A1F1F] hover:bg-[#8A1F1F]/90 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center"
                >
                  Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
