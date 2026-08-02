/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  KeyRound,
  CheckCircle2,
  Globe,
  Phone,
  MapPin,
  Sparkles,
  Lock,
  Unlock,
  X,
  AlertCircle,
  Gift,
  Map as MapIcon,
  Search,
  Filter,
  CheckCircle,
  Award,
  ShieldCheck,
  Plus,
  Send,
  Check,
  Users,
  MessageCircle,
  Eye,
  ChevronRight,
  Briefcase,
  Loader2,
  Calendar,
  XCircle,
} from "lucide-react";
import { PARTNERS } from "../data/partners";
import { Partner } from "../types";
import { safeStorage } from "../lib/safeStorage";
import IdemoLogo from "./IdemoLogo";
import {
  loginPartner,
  logoutPartner,
  fetchAuthenticatedPartnerProfile,
  AuthenticatedPartnerProfile,
  fetchPartnerOpportunities,
  acceptPartnerOpportunity,
  declinePartnerOpportunity,
  proposePartnerAlternative,
  changePartnerPin,
  OpportunityItem,
  getPartnerProfileContent,
  savePartnerProfileDraft,
  submitPartnerProfile,
  withdrawPartnerProfileContent,
  authorizePhotoUpload,
} from "../lib/partnerService";
import { partnerSessionStorage } from "../lib/partnerSessionStorage";

// Static Lookup for IDEMO Recommendations
const RECOMMENDATIONS_LOOKUP = [
  { id: "1", title: "Uvac Meanders", category: "Nature" },
  { id: "2", title: "Manasija Monastery", category: "History" },
  { id: "3", title: "Belgrade Splavovi", category: "Clubbing" },
  { id: "4", title: "Vrnjačka Banja", category: "Wellbeing" },
  { id: "5", title: "Zasavica Reserve", category: "Nature" },
  { id: "6", title: "Sremski Karlovci", category: "Gastronomy" },
  { id: "7", title: "Nikola Tesla Museum", category: "History" },
  { id: "8", title: "Zlakusa Pottery", category: "Culture" },
  { id: "9", title: "Sand Wines Subotica", category: "Gastronomy" },
  { id: "10", title: "Rakija Bar Belgrade", category: "Gastronomy" },
  { id: "11", title: "Zarić Distillery", category: "Gastronomy" },
];

const sha256 = async (text: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

interface PortalPartner {
  id: string;
  pin: string;
  name: string;
  category:
    "Tourist Guide" | "Medical/Wellbeing" | "Limousine/Transport" | "Open Slot";
  status: "Validated" | "Active" | "Trusted" | "Expanded Portfolio";
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
}

interface Inquiry {
  id: string;
  recId: string;
  recTitle: string;
  partnerId?: string;
  partnerName?: string;
  status:
    | "Unmatched"
    | "Dispatched Stage 1"
    | "Dispatched Stage 2"
    | "Locked / Accepted"
    | "Alternative Proposed"
    | "Answered / Completed"
    | "Released"
    | "Closed";
  visitorName: string;
  query: string;
  replies: string[];
  createdAt: string;
  geography?: string;
  language?: string;
  budget?: string;
  availableTime?: string;
  subjectExpertise?: string;
  category?: "Tourist Guide" | "Medical/Wellbeing" | "Limousine/Transport";
  dispatchStage?: 1 | 2;
  alternativeOffer?: {
    date: string;
    time: string;
    note: string;
  };
  releaseReason?: string;
}

// Initial Controlled Ecosystem Partner Structure (10 Guides, 3 Medical, 10 Transport, 7 Open, 2 Demonstration)
const INITIAL_PORTAL_PARTNERS: PortalPartner[] = [
  // Demonstration Partner Accounts (Seeded Dataset for Tester Validation)
  {
    id: "UNO1",
    pin: "3001",
    name: "UNO1 (60% Portfolio Scope)",
    category: "Tourist Guide",
    status: "Trusted",
    capabilities: [
      "Historical Walk",
      "Gardoš Explorer",
      "Architectural Walks",
      "Roman Archaeological Tours",
      "Belgrade Architecture Heritage",
      "Private Tours",
      "Taste Tasting",
      "River Boating",
      "Wildlife Photography",
      "Culinary Tours",
      "Vineyard Visits",
      "Bespoke Tastings",
      "EV Airport Pickups",
      "VIP Executive Transfers",
      "Private Driver Service",
      "Long-Distance Chauffeuring",
      "Multi-Passenger Luxury Vans",
      "Licensed Tourist Guide",
      "First Aid Certified",
      "Professional Chauffeur",
      "EXPO Certified Host",
    ],
    languages: ["English", "Serbian"],
    geography: "Belgrade & National",
    channels: ["WhatsApp", "Viber"],
    contactPhone: "+381621873260",
    instagram: "@uno1_concierge",
    assignedRecs: ["1", "2", "3", "4", "5", "6", "7"],
    contributions: 50,
    reliability: 99,
    eligibility: true,
    isDemo: true,
  },
  {
    id: "UNO2",
    pin: "3002",
    name: "UNO2 (75% Portfolio Scope)",
    category: "Tourist Guide",
    status: "Trusted",
    capabilities: [
      "Historical Walk",
      "Gardoš Explorer",
      "Architectural Walks",
      "Roman Archaeological Tours",
      "Belgrade Architecture Heritage",
      "Private Tours",
      "Taste Tasting",
      "River Boating",
      "Wildlife Photography",
      "Culinary Tours",
      "Vineyard Visits",
      "Bespoke Tastings",
      "Canyon Kayaking",
      "Spritual Hikes",
      "Rakija Pairing",
      "EV Airport Pickups",
      "VIP Executive Transfers",
      "Private Driver Service",
      "Long-Distance Chauffeuring",
      "Multi-Passenger Luxury Vans",
      "Bespoke Danube Tours",
      "Old-Town Retro Shuttle",
      "4x4 Mountain Express",
      "Licensed Tourist Guide",
      "First Aid Certified",
      "Professional Chauffeur",
      "EXPO Certified Host",
      "Dental Orientation",
      "Orthodontic Liaison",
      "Skin Consultation Liaison",
    ],
    languages: ["English", "Serbian", "German"],
    geography: "Belgrade & National",
    channels: ["WhatsApp", "Viber"],
    contactPhone: "+381621869850",
    instagram: "@uno2_concierge",
    assignedRecs: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    contributions: 35,
    reliability: 98,
    eligibility: true,
    isDemo: true,
  },
  // 10 Tourist Guides
  {
    id: "p-tg-1",
    pin: "3001",
    name: "Belgrade Undercover Walking",
    category: "Tourist Guide",
    status: "Trusted",
    capabilities: ["Private Tours", "Historical Walk", "Taste Tasting"],
    languages: ["English", "Serbian", "German"],
    geography: "Belgrade & Zemun",
    channels: ["WhatsApp", "Viber"],
    contactPhone: "+381631112001",
    instagram: "@belgrade_undercover",
    assignedRecs: ["7", "10"],
    contributions: 48,
    reliability: 99,
    eligibility: true,
  },
  {
    id: "p-tg-2",
    pin: "3002",
    name: "Danube Delta Sailing Guides",
    category: "Tourist Guide",
    status: "Active",
    capabilities: ["River Boating", "Wildlife Photography"],
    languages: ["English", "Serbian"],
    geography: "Djerdap Gorge & Eastern Serbia",
    channels: ["Viber", "Instagram"],
    contactPhone: "+381631112002",
    instagram: "@danube_sailing",
    assignedRecs: ["5"],
    contributions: 22,
    reliability: 96,
    eligibility: true,
  },
  {
    id: "p-tg-3",
    pin: "3003",
    name: "Zemun Heritage Guild",
    category: "Tourist Guide",
    status: "Validated",
    capabilities: ["Gardoš Explorer", "Architectural Walks"],
    languages: ["English", "Serbian", "Russian"],
    geography: "Zemun & Novi Beograd",
    channels: ["WhatsApp"],
    contactPhone: "+381631112003",
    instagram: "@zemun_heritage",
    assignedRecs: ["11"],
    contributions: 8,
    reliability: 94,
    eligibility: false,
  },
  {
    id: "p-tg-4",
    pin: "3004",
    name: "Tara Peak Outdoors Guild",
    category: "Tourist Guide",
    status: "Trusted",
    capabilities: ["Alpine Hiking", "Wildlife Tracking"],
    languages: ["English", "French"],
    geography: "Tara National Park & Western Serbia",
    channels: ["WhatsApp", "Viber"],
    contactPhone: "+381631112004",
    instagram: "@tara_outdoors",
    assignedRecs: ["1"],
    contributions: 37,
    reliability: 98,
    eligibility: true,
  },
  {
    id: "p-tg-5",
    pin: "3005",
    name: "Balkan Foodie Trails",
    category: "Tourist Guide",
    status: "Active",
    capabilities: ["Culinary Tours", "Rakija Pairing"],
    languages: ["English", "Serbian", "Italian"],
    geography: "Belgrade & Šumadija",
    channels: ["Instagram"],
    contactPhone: "+381631112005",
    instagram: "@balkan_foodies",
    assignedRecs: ["10"],
    contributions: 19,
    reliability: 95,
    eligibility: false,
  },
  {
    id: "p-tg-6",
    pin: "3006",
    name: "Sumadija Wine Whispers",
    category: "Tourist Guide",
    status: "Validated",
    capabilities: ["Vineyard Visits", "Bespoke Tastings"],
    languages: ["English", "Serbian"],
    geography: "Šumadija Wine District",
    channels: ["Viber"],
    contactPhone: "+381631112006",
    instagram: "@sumadija_whispers",
    assignedRecs: ["6"],
    contributions: 5,
    reliability: 90,
    eligibility: false,
  },
  {
    id: "p-tg-7",
    pin: "3007",
    name: "Nis Roman Crossroads Tours",
    category: "Tourist Guide",
    status: "Validated",
    capabilities: ["Roman Archaeological Tours"],
    languages: ["English", "German", "Greek"],
    geography: "Southern Serbia (Niš)",
    channels: ["WhatsApp"],
    contactPhone: "+381631112007",
    instagram: "@nis_crossroads",
    assignedRecs: ["2"],
    contributions: 4,
    reliability: 92,
    eligibility: false,
  },
  {
    id: "p-tg-8",
    pin: "3008",
    name: "Uvac Adventure Navigators",
    category: "Tourist Guide",
    status: "Active",
    capabilities: ["Canyon Kayaking", "Vulture Spotting"],
    languages: ["English", "Serbian"],
    geography: "Western Serbia (Sjenica)",
    channels: ["WhatsApp", "Viber"],
    contactPhone: "+381631112008",
    instagram: "@uvac_navigators",
    assignedRecs: ["1"],
    contributions: 14,
    reliability: 97,
    eligibility: true,
  },
  {
    id: "p-tg-9",
    pin: "3009",
    name: "Felix Romuliana Custodians",
    category: "Tourist Guide",
    status: "Validated",
    capabilities: ["Imperial Palace Tours"],
    languages: ["English", "Serbian"],
    geography: "Eastern Serbia (Zaječar)",
    channels: ["WhatsApp"],
    contactPhone: "+381631112009",
    instagram: "@felix_custodians",
    assignedRecs: ["2"],
    contributions: 3,
    reliability: 91,
    eligibility: false,
  },
  {
    id: "p-tg-10",
    pin: "3010",
    name: "Fruška Gora Monasteries Guild",
    category: "Tourist Guide",
    status: "Trusted",
    capabilities: ["Spritual Hikes", "Local Honey Tasting"],
    languages: ["English", "Serbian", "Russian"],
    geography: "Vojvodina & Fruška Gora",
    channels: ["WhatsApp", "Viber"],
    contactPhone: "+381631112010",
    instagram: "@fg_monasteries",
    assignedRecs: ["6"],
    contributions: 42,
    reliability: 99,
    eligibility: true,
  },

  // 3 Medical / Wellbeing (Strict orientation scope only, non-emergency)
  {
    id: "p-mw-1",
    pin: "4001",
    name: "Belgrade Elite Dental Care",
    category: "Medical/Wellbeing",
    status: "Trusted",
    capabilities: ["Dental Orientation", "Orthodontic Liaison"],
    languages: ["English", "Serbian", "German", "Italian"],
    geography: "Belgrade",
    channels: ["WhatsApp", "Viber"],
    contactPhone: "+381632224001",
    instagram: "@belgrade_elitedental",
    assignedRecs: ["4"],
    contributions: 65,
    reliability: 100,
    eligibility: true,
  },
  {
    id: "p-mw-2",
    pin: "4002",
    name: "Sokobanja Respiratory Recovery",
    category: "Medical/Wellbeing",
    status: "Active",
    capabilities: ["Inhalation Orientation", "Spa Wellness Liaison"],
    languages: ["English", "Serbian"],
    geography: "Sokobanja & Eastern Serbia",
    channels: ["Viber"],
    contactPhone: "+381632224002",
    instagram: "@sokobanja_recovery",
    assignedRecs: ["4"],
    contributions: 28,
    reliability: 97,
    eligibility: true,
  },
  {
    id: "p-mw-3",
    pin: "4003",
    name: "Kozarev Aesthetic Dermatology",
    category: "Medical/Wellbeing",
    status: "Validated",
    capabilities: ["Skin Consultation Liaison", "Thermal Water Advisory"],
    languages: ["English", "Serbian", "Russian"],
    geography: "Belgrade & Novi Sad",
    channels: ["WhatsApp", "Instagram"],
    contactPhone: "+381632224003",
    instagram: "@kozarev_aesthetic",
    assignedRecs: ["4"],
    contributions: 12,
    reliability: 95,
    eligibility: false,
  },

  // 10 Limousine & Transport
  {
    id: "p-tr-1",
    pin: "5001",
    name: "Tesla Ride Belgrade Premium",
    category: "Limousine/Transport",
    status: "Trusted",
    capabilities: ["EV Airport Pickups", "VIP Executive Transfers"],
    languages: ["English", "Serbian"],
    geography: "Belgrade & National",
    channels: ["WhatsApp", "Viber"],
    contactPhone: "+381633335001",
    instagram: "@teslaride_bg",
    assignedRecs: ["3"],
    contributions: 124,
    reliability: 100,
    eligibility: true,
  },
  {
    id: "p-tr-2",
    pin: "5002",
    name: "Elite Sava Chauffeurs",
    category: "Limousine/Transport",
    status: "Active",
    capabilities: ["Private Driver Service", "Savamala Escorts"],
    languages: ["English", "Serbian", "German"],
    geography: "Belgrade",
    channels: ["WhatsApp"],
    contactPhone: "+381633335002",
    instagram: "@elitesava_cars",
    assignedRecs: ["3"],
    contributions: 55,
    reliability: 98,
    eligibility: true,
  },
  {
    id: "p-tr-3",
    pin: "5003",
    name: "Balkan Executive Limousines",
    category: "Limousine/Transport",
    status: "Trusted",
    capabilities: ["All-Terrain SUV", "Long-Distance Chauffeuring"],
    languages: ["English", "Serbian", "Russian"],
    geography: "National & Regional Borders",
    channels: ["WhatsApp", "Viber"],
    contactPhone: "+381633335003",
    instagram: "@balkan_execlimos",
    assignedRecs: ["1"],
    contributions: 88,
    reliability: 99,
    eligibility: true,
  },
  {
    id: "p-tr-4",
    pin: "5004",
    name: "Vip Danube Van Shuttles",
    category: "Limousine/Transport",
    status: "Active",
    capabilities: ["Multi-Passenger Luxury Vans", "Bespoke Danube Tours"],
    languages: ["English", "Serbian"],
    geography: "Belgrade & Danube Corridor",
    channels: ["Viber"],
    contactPhone: "+381633335004",
    instagram: "@vipdanube_shuttles",
    assignedRecs: ["5"],
    contributions: 31,
    reliability: 96,
    eligibility: true,
  },
  {
    id: "p-tr-5",
    pin: "5005",
    name: "Gardoš Classic Transfers",
    category: "Limousine/Transport",
    status: "Validated",
    capabilities: ["Old-Town Retro Shuttle", "Romantic Chauffeur"],
    languages: ["English", "Serbian"],
    geography: "Zemun & Belgrade Core",
    channels: ["Instagram"],
    contactPhone: "+381633335005",
    instagram: "@gardos_transfers",
    assignedRecs: ["11"],
    contributions: 15,
    reliability: 93,
    eligibility: false,
  },
  {
    id: "p-tr-6",
    pin: "5006",
    name: "Zlatibor Mountain Shuttle",
    category: "Limousine/Transport",
    status: "Validated",
    capabilities: ["4x4 Mountain Express", "Winter Tire Rigged"],
    languages: ["English", "Serbian"],
    geography: "Western Serbia (Zlatibor)",
    channels: ["WhatsApp"],
    contactPhone: "+381633335006",
    instagram: "@zlatibor_shuttle",
    assignedRecs: ["1"],
    contributions: 11,
    reliability: 94,
    eligibility: false,
  },
  {
    id: "p-tr-7",
    pin: "5007",
    name: "Morava Express Chauffeurs",
    category: "Limousine/Transport",
    status: "Validated",
    capabilities: ["Central Valley Transfers"],
    languages: ["English", "Serbian"],
    geography: "Central & Southern Serbia",
    channels: ["Viber"],
    contactPhone: "+381633335007",
    instagram: "@morava_express",
    assignedRecs: ["2"],
    contributions: 6,
    reliability: 91,
    eligibility: false,
  },
  {
    id: "p-tr-8",
    pin: "5008",
    name: "Sumadija Premium Cars",
    category: "Limousine/Transport",
    status: "Active",
    capabilities: ["Bespoke Winery Tours", "Airport transfers"],
    languages: ["English", "Serbian"],
    geography: "Šumadija Region",
    channels: ["WhatsApp"],
    contactPhone: "+381633335008",
    instagram: "@sumadija_cars",
    assignedRecs: ["6"],
    contributions: 18,
    reliability: 95,
    eligibility: false,
  },
  {
    id: "p-tr-9",
    pin: "5009",
    name: "Belgrade Expo 2027 Chauffeurs",
    category: "Limousine/Transport",
    status: "Trusted",
    capabilities: ["Expo Multi-Lingual VIP Rides", "Hotel-Expo Loop"],
    languages: ["English", "Serbian", "Chinese", "French"],
    geography: "Belgrade Metro & Expo Complex",
    channels: ["WhatsApp", "Viber"],
    contactPhone: "+381633335009",
    instagram: "@expo2027_cars",
    assignedRecs: ["3", "7"],
    contributions: 72,
    reliability: 99,
    eligibility: true,
  },
  {
    id: "p-tr-10",
    pin: "5010",
    name: "Air Belgrade Airport Limos",
    category: "Limousine/Transport",
    status: "Trusted",
    capabilities: ["Terminal Gate Greetings", "Luggage Valet Transfers"],
    languages: ["English", "Serbian", "Russian", "Chinese"],
    geography: "Belgrade Airport & Main Hotels",
    channels: ["WhatsApp", "Viber"],
    contactPhone: "+381633335010",
    instagram: "@air_belgrade_limos",
    assignedRecs: ["3"],
    contributions: 145,
    reliability: 100,
    eligibility: true,
  },

  // 7 Open Slots Reserved for Future demand-validated categories
  {
    id: "p-os-1",
    pin: "6001",
    name: "Open Slot — Adventure Sports Category",
    category: "Open Slot",
    status: "Validated",
    capabilities: ["Paragliding Liaison", "Rafting Coordination"],
    languages: ["English"],
    geography: "TBD",
    channels: ["WhatsApp"],
    contactPhone: "",
    instagram: "",
    assignedRecs: [],
    contributions: 0,
    reliability: 100,
    eligibility: false,
  },
  {
    id: "p-os-2",
    pin: "6002",
    name: "Open Slot — Yoga/Wellness Retreats",
    category: "Open Slot",
    status: "Validated",
    capabilities: ["Forest Healing Meditation"],
    languages: ["English"],
    geography: "TBD",
    channels: ["WhatsApp"],
    contactPhone: "",
    instagram: "",
    assignedRecs: [],
    contributions: 0,
    reliability: 100,
    eligibility: false,
  },
  {
    id: "p-os-3",
    pin: "6003",
    name: "Open Slot — Helitours Belgrade",
    category: "Open Slot",
    status: "Validated",
    capabilities: ["Panoramic Helicopter Charter"],
    languages: ["English"],
    geography: "TBD",
    channels: ["WhatsApp"],
    contactPhone: "",
    instagram: "",
    assignedRecs: [],
    contributions: 0,
    reliability: 100,
    eligibility: false,
  },
  {
    id: "p-os-4",
    pin: "6004",
    name: "Open Slot — Traditional Handcrafts Master",
    category: "Open Slot",
    status: "Validated",
    capabilities: ["Artisan Pottery Workshops"],
    languages: ["English"],
    geography: "TBD",
    channels: ["WhatsApp"],
    contactPhone: "",
    instagram: "",
    assignedRecs: [],
    contributions: 0,
    reliability: 100,
    eligibility: false,
  },
  {
    id: "p-os-5",
    pin: "6005",
    name: "Open Slot — Specialized Translation Sector",
    category: "Open Slot",
    status: "Validated",
    capabilities: ["Simultaneous Translation EXPO"],
    languages: ["English"],
    geography: "TBD",
    channels: ["WhatsApp"],
    contactPhone: "",
    instagram: "",
    assignedRecs: [],
    contributions: 0,
    reliability: 100,
    eligibility: false,
  },
  {
    id: "p-os-6",
    pin: "6006",
    name: "Open Slot — Personal Security Detail",
    category: "Open Slot",
    status: "Validated",
    capabilities: ["Armed/Unarmed Bodyguards"],
    languages: ["English"],
    geography: "TBD",
    channels: ["WhatsApp"],
    contactPhone: "",
    instagram: "",
    assignedRecs: [],
    contributions: 0,
    reliability: 100,
    eligibility: false,
  },
  {
    id: "p-os-7",
    pin: "6007",
    name: "Open Slot — Kids & Family Entertainment",
    category: "Open Slot",
    status: "Validated",
    capabilities: ["Multi-lingual Nanny Guides"],
    languages: ["English"],
    geography: "TBD",
    channels: ["WhatsApp"],
    contactPhone: "",
    instagram: "",
    assignedRecs: [],
    contributions: 0,
    reliability: 100,
    eligibility: false,
  },
];

const INITIAL_INQUIRIES: Inquiry[] = [
  {
    id: "INQ-2001",
    recId: "1",
    recTitle: "Uvac Meanders",
    status: "Dispatched Stage 1",
    visitorName: "Sir James Henderson",
    query:
      "Looking to organize a private 2-day photo-safari of the Uvac River Gorge starting from Belgrade next Thursday morning. Needs high-quality telescopes and birdwatching setup.",
    replies: [],
    createdAt: new Date().toISOString(),
    geography: "Western Serbia (Sjenica)",
    language: "English",
    budget: "€400 - €600",
    availableTime: "Thursday & Friday",
    subjectExpertise: "Canyon Kayaking & Vulture Spotting",
    category: "Tourist Guide",
  },
  {
    id: "INQ-2002",
    recId: "4",
    recTitle: "Vrnjačka Banja",
    status: "Dispatched Stage 2",
    visitorName: "Elena Rostova",
    query:
      "Interested in booking dental assessment orientation and aesthetic planning slots for Monday morning. Please coordinate transportation and hotel pickup.",
    replies: [],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    geography: "Belgrade",
    language: "Russian",
    budget: "€1,000 - €1,500",
    availableTime: "Monday morning",
    subjectExpertise: "Dental Orientation & Skin Care Liaison",
    category: "Medical/Wellbeing",
  },
  {
    id: "INQ-2003",
    recId: "3",
    recTitle: "Belgrade Splavovi",
    partnerId: "p-tr-1",
    partnerName: "Tesla Ride Belgrade Premium",
    status: "Answered / Completed",
    visitorName: "Kenji Takahashi",
    query:
      "Require zero-emission executive sedan transport from Tesla Airport Terminal straight to Sava waterfront on Friday night. Confirm if VIP drivers speak Japanese.",
    replies: [
      "Confirmed. Driver speaking English and Japanese is reserved. Plate BG-TESLA. Flight tracked automatically.",
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    geography: "Belgrade",
    language: "Japanese",
    budget: "€150 - €250",
    availableTime: "Friday Night",
    subjectExpertise: "EV Airport Pickups",
    category: "Limousine/Transport",
  },
  {
    id: "INQ-2004",
    recId: "7",
    recTitle: "Nikola Tesla Museum",
    status: "Unmatched",
    visitorName: "Dr. Sarah Jenkins",
    query:
      "Deep technical tour of Tesla’s induction motor models and high-frequency patents. Need an expert guide with electrical engineering background.",
    replies: [],
    createdAt: new Date().toISOString(),
    geography: "Belgrade",
    language: "English",
    budget: "€100 - €200",
    availableTime: "Any day",
    subjectExpertise: "Electrical Engineering & Tesla Legacy",
    category: "Tourist Guide",
  },
];

const ROTATING_IMAGES = [
  "/src/assets/images/salon_1905_interior_1778845083168.png",
  "/src/assets/images/banjska_stena_outlook_1778841232535.png",
  "/src/assets/images/mokra_gora_sargan_eight_1778842930420.png",
  "/src/assets/images/silosi_belgrade_industrial_night_1778842947193.png",
];

function PremiumRotatingImage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      return;
    }
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ROTATING_IMAGES.length);
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
  "/src/assets/images/tara_national_park_forest_1778843961956.png",
].filter((path) => !path.includes("webpsrc")); // clean up any typo

function Level1RotatingHeroImage() {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * LEVEL1_HERO_IMAGES.length),
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      return;
    }
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % LEVEL1_HERO_IMAGES.length);
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
  if (!title) return "Opšti upit";
  const mapping: Record<string, string> = {
    "Uvac Meanders": "Uvac Meandri",
    "Vrnjačka Banja": "Vrnjačka Banja",
    "Belgrade Splavovi": "Beogradski splavovi",
    "Belgrade Undercover Walking": "Beograd Undercover",
    "Kablar Glass Skywalk": "Vidikovac Kablar",
    "Banjska Stena": "Banjska Stena",
    "Golubac Fortress": "Golubac Tvrđava",
    "Mokra Gora": "Mokra Gora",
    "Salon 1905": "Salon 1905",
    Gardoš: "Gardoš Zemun",
    "Belgrade Waterfront": "Beograd na vodi",
  };
  return mapping[title] || title;
};

const translateLocationToSerbian = (loc?: string): string => {
  if (!loc) return "Beograd";
  const mapping: Record<string, string> = {
    Belgrade: "Beograd",
    "Belgrade & Zemun": "Beograd i Zemun",
    Zemun: "Zemun",
    "Western Serbia (Sjenica)": "Sjenica (Uvac)",
    "Tara National Park & Western Serbia": "Tara",
    "Belgrade & Šumadija": "Beograd i Šumadija",
    "Šumadija Wine District": "Šumadija",
    "Southern Serbia (Niš)": "Niš",
    "Vojvodina & Fruška Gora": "Fruška Gora",
    "Sokobanja & Eastern Serbia": "Sokobanja",
    "Belgrade & Novi Sad": "Novi Sad",
  };
  return mapping[loc] || loc;
};

const translateCapabilityToSerbian = (cap: string): string => {
  const mapping: Record<string, string> = {
    "Private Tours": "Privatne ture",
    "Historical Walk": "Istorijske šetnje",
    "Taste Tasting": "Degustacije",
    "River Boating": "Sailing ture",
    "Wildlife Photography": "Foto safari",
    "Gardoš Explorer": "Zemun ture",
    "Architectural Walks": "Arhitektura",
    "Alpine Hiking": "Planinarenje",
    "Wildlife Tracking": "Praćenje divljači",
    "Culinary Tours": "Gastro ture",
    "Rakija Pairing": "Rakija i vinske ture",
    "Vineyard Visits": "Vinske ture",
    "Bespoke Tastings": "Vrhunska degustacija",
    "Roman Archaeological Tours": "Arheološke ture",
    "Canyon Kayaking": "Kajaking",
    "Vulture Spotting": "Posmatranje ptica",
    "Dental Orientation": "Dentalni wellness",
    "Orthodontic Liaison": "Kozmetički wellness",
    "Skin Care Liaison": "Wellness kože",
    "Spa Wellness Liaison": "Wellness i banje",
    "EV Airport Pickups": "Eko transferi",
    "VIP Executive Transfers": "Poslovni gosti",
    "Private Driver Service": "Privatni vozač",
    "Long-Distance Chauffeuring": "Međugradske vožnje",
    "Multi-Passenger Luxury Vans": "Luksuzni kombi",
    "Bespoke Danube Tours": "Dunav rute",
    "Old-Town Retro Shuttle": "Gardoš šatl",
    "4x4 Mountain Express": "Terenska vožnja",
    "Winter Tire Rigged": "Zimske rute",
    "Bespoke Winery Tours": "Vinske rute",
    "Expo Multi-Lingual VIP Rides": "EXPO transferi",
    "Luggage Valet Transfers": "Aerodrom šatl",
  };
  return mapping[cap] || cap;
};

const getMatchingCapabilities = (inq: Inquiry, partner: PortalPartner) => {
  const matches: string[] = [];
  if (
    inq.language &&
    partner.languages.some(
      (l) => l.toLowerCase() === inq.language?.toLowerCase(),
    )
  ) {
    if (inq.language.toLowerCase() === "english")
      matches.push("Engleski jezik");
    else if (inq.language.toLowerCase() === "german")
      matches.push("Nemački jezik");
    else if (inq.language.toLowerCase() === "russian")
      matches.push("Ruski jezik");
    else if (inq.language.toLowerCase() === "french")
      matches.push("Francuski jezik");
    else matches.push(`${inq.language} jezik`);
  }
  partner.capabilities.forEach((cap) => {
    const capLower = cap.toLowerCase();
    const expLower = (inq.subjectExpertise || "").toLowerCase();
    const queryLower = inq.query.toLowerCase();
    if (
      expLower.includes(capLower) ||
      capLower.includes(expLower) ||
      queryLower.includes(capLower)
    ) {
      matches.push(translateCapabilityToSerbian(cap));
    }
  });
  if (matches.length < 2) {
    partner.capabilities.slice(0, 2).forEach((cap) => {
      const translated = translateCapabilityToSerbian(cap);
      if (!matches.includes(translated)) {
        matches.push(translated);
      }
    });
  }
  return matches;
};

const getInquiryEmoji = (inq: Inquiry): string => {
  const query = (inq.query || "").toLowerCase();
  const rec = (inq.recTitle || "").toLowerCase();
  const expert = (inq.subjectExpertise || "").toLowerCase();

  if (
    query.includes("wine") ||
    query.includes("vinska") ||
    query.includes("degustacija") ||
    rec.includes("kovacevic") ||
    rec.includes("vinarija") ||
    expert.includes("winery")
  )
    return "🍷";
  if (
    query.includes("safari") ||
    query.includes("photo") ||
    query.includes("uvac") ||
    query.includes("vulture") ||
    query.includes("bird") ||
    expert.includes("canyon")
  )
    return "🦅";
  if (
    query.includes("walk") ||
    query.includes("walking") ||
    query.includes("tour") ||
    rec.includes("walking") ||
    expert.includes("walking")
  )
    return "🧭";
  if (
    query.includes("dental") ||
    query.includes("skin") ||
    query.includes("medical") ||
    query.includes("wellbeing") ||
    expert.includes("dental")
  )
    return "🦷";
  if (
    query.includes("tesla") ||
    query.includes("airport") ||
    query.includes("limo") ||
    query.includes("shuttle") ||
    query.includes("transport") ||
    query.includes("car") ||
    expert.includes("airport")
  )
    return "🚗";
  if (
    query.includes("museum") ||
    query.includes("patents") ||
    rec.includes("museum") ||
    rec.includes("tesla")
  )
    return "🏛️";
  if (
    query.includes("fortress") ||
    rec.includes("fortress") ||
    rec.includes("golubac")
  )
    return "🏰";
  return "✨";
};

const getSerbianStatus = (status: string) => {
  switch (status) {
    case "Dispatched Stage 1":
    case "Dispatched Stage 2":
      return {
        label: "Novo",
        bg: "bg-[#8A1F1F]/5 text-[#8A1F1F] border border-[#8A1F1F]/15",
      };
    case "Locked / Accepted":
      return {
        label: "Prihvaćeno",
        bg: "bg-emerald-50 text-emerald-800 border border-emerald-500/15",
      };
    case "Alternative Proposed":
      return {
        label: "Čeka potvrdu gosta",
        bg: "bg-amber-50 text-amber-800 border border-amber-500/15",
      };
    case "Answered / Completed":
      return {
        label: "Završeno",
        bg: "bg-brand-charcoal/5 text-brand-charcoal/60 border border-[#2D3025]/10",
      };
    case "Released":
      return {
        label: "Oslobođeno",
        bg: "bg-[#2D3025]/5 text-brand-charcoal/40 border border-[#2D3025]/5",
      };
    default:
      return {
        label: "Novo",
        bg: "bg-[#8A1F1F]/5 text-[#8A1F1F] border border-[#8A1F1F]/15",
      };
  }
};

const LANGUAGES_CATALOGUE = [
  "English",
  "Serbian",
  "German",
  "French",
  "Russian",
  "Italian",
  "Chinese",
  "Greek",
  "Spanish",
];

const KNOWLEDGE_CATALOGUE = [
  "Historical Walk",
  "Gardoš Explorer",
  "Architectural Walks",
  "Roman Archaeological Tours",
  "Imperial Palace Tours",
  "Belgrade Architecture Heritage",
  "Wine District Terroir",
  "National Park Wildlife",
];

const EXPERIENCES_CATALOGUE = [
  "Private Tours",
  "Taste Tasting",
  "River Boating",
  "Wildlife Photography",
  "Alpine Hiking",
  "Wildlife Tracking",
  "Culinary Tours",
  "Vineyard Visits",
  "Bespoke Tastings",
  "Canyon Kayaking",
  "Vulture Spotting",
  "Spritual Hikes",
  "Local Honey Tasting",
  "Forest Healing Meditation",
  "Artisan Pottery Workshops",
  "Rakija Pairing",
];

const SERVICES_CATALOGUE = [
  "EV Airport Pickups",
  "VIP Executive Transfers",
  "Private Driver Service",
  "Savamala Escorts",
  "All-Terrain SUV",
  "Long-Distance Chauffeuring",
  "Multi-Passenger Luxury Vans",
  "Bespoke Danube Tours",
  "Old-Town Retro Shuttle",
  "Romantic Chauffeur",
  "4x4 Mountain Express",
  "Winter Tire Rigged",
  "Central Valley Transfers",
  "Bespoke Winery Tours",
  "Airport transfers",
  "Expo Multi-Lingual VIP Rides",
  "Hotel-Expo Loop",
  "Terminal Gate Greetings",
  "Luggage Valet Transfers",
  "Paragliding Liaison",
  "Rafting Coordination",
  "Panoramic Helicopter Charter",
  "Simultaneous Translation EXPO",
  "Armed/Unarmed Bodyguards",
];

const QUALIFICATIONS_CATALOGUE = [
  "Licensed Tourist Guide",
  "First Aid Certified",
  "Dermatology Specialist",
  "Orthodontic Specialist",
  "Dental Orientation",
  "Orthodontic Liaison",
  "Skin Consultation Liaison",
  "Inhalation Orientation",
  "Spa Wellness Liaison",
  "Luxury Fleet License",
  "Professional Chauffeur",
  "EXPO Certified Host",
  "Multi-lingual Nanny Guides",
];

const translateLanguageToLocal = (lang: string): string => {
  const mapping: Record<string, string> = {
    English: "Engleski",
    Serbian: "Srpski",
    German: "Nemački",
    French: "Francuski",
    Russian: "Ruski",
    Italian: "Italijanski",
    Chinese: "Kineski",
    Greek: "Grčki",
    Spanish: "Španski",
  };
  return mapping[lang] || lang;
};

const getCardTitle = (key: string, lang: string): string => {
  const titles: Record<string, Record<string, string>> = {
    languages: {
      en: "Languages",
      sr: "Jezici",
      zh: "语言能力",
    },
    knowledge: {
      en: "Knowledge",
      sr: "Znanje",
      zh: "专业学识",
    },
    experiences: {
      en: "Experiences",
      sr: "Iskustva i Ture",
      zh: "专属体验",
    },
    services: {
      en: "Services",
      sr: "Usluge i Logistika",
      zh: "配套服务",
    },
    qualifications: {
      en: "Professional Credentials",
      sr: "Profesionalne Kvalifikacije",
      zh: "专业资质",
    },
  };
  const code = lang === "sr" ? "sr" : lang === "zh" ? "zh" : "en";
  return titles[key]?.[code] || key;
};

export default function PartnersScreen({
  language,
  triggerHaptic,
  onNavigateToProfile,
  onSelectRec,
  onNavigate,
}: any) {
  const [portalLang, setPortalLang] = useState<string>("sr");
  const isSr = portalLang === "sr";
  const isZh = portalLang === "zh";

  // Level 0 Card Language Translations (Always strictly uses visitor's selected app language)
  const tL0 = (key: string) => {
    const code = (language || "en").toLowerCase();
    const dict: Record<string, Record<string, string>> = {
      gatewayTag: {
        sr: "PRIVATNI PRISTUP",
        ru: "ПРИВАТНЫЙ ДОСТУП",
        zh: "私密入口",
        de: "PRIVATER ZUGANG",
        en: "PRIVATE GATEWAY",
      },
      gatewayTitle: {
        sr: "Privatni pristup za partnere",
        ru: "Частный доступ для партнеров",
        zh: "合作伙伴私密入口",
        de: "Privater Partnerzugang",
        en: "Private Partner Access",
      },
      welcomeHead: {
        sr: "Dobrodošli u IDEMO partnersku mrežu.",
        ru: "Добро пожаловать в партнерскую сеть IDEMO.",
        zh: "欢迎来到 IDEMO 合作伙伴网络。",
        de: "Willkommen im IDEMO Partnernetzwerk.",
        en: "Welcome to the IDEMO Partner Network.",
      },
      welcomeDesc: {
        sr: "Ovo je bezbedan, privatni radni prostor za pozvane IDEMO partnere i pružaoce usluga. Pristup zahteva autorizaciju mreže.",
        ru: "Это защищенное частное рабочее пространство для приглашенных партнеров и поставщиков услуг IDEMO. Доступ требует авторизации в сети.",
        zh: "这是面向受邀 IDEMO 合作伙伴和服务提供商的安全私密工作区。访问需要网络授权。",
        de: "Dies ist ein sicherer, privater Arbeitsbereich für eingeladene IDEMO-Partner und Dienstleister. Der Zugriff erfordert eine Netzwerkautorisierung.",
        en: "This is a secure, private workspace for invited IDEMO partners and service providers. Access requires network verification.",
      },
      pinLabel: {
        sr: "UNESITE MREŽNI PIN PARTNERA",
        ru: "ВВЕДИТЕ ПИН-КОД СЕТИ ПАРТНЕРА",
        zh: "输入合作伙伴网络 PIN 码",
        de: "PARTNER-NETZWERK-PIN EINGEBEN",
        en: "ENTER PARTNER NETWORK PIN",
      },
      verifyBtn: {
        sr: "Verifikuj autorizaciju mreže",
        ru: "Проверить авторизацию сети",
        zh: "验证网络授权",
        de: "Netzwerkautorisierung überprüfen",
        en: "Verify Network Authorization",
      },
      exitBtn: {
        sr: "← Nazad na aplikaciju za posetioce",
        ru: "← Назад в приложение для гостей",
        zh: "← 退出至游客应用",
        de: "← Zurück zur Besucher-App",
        en: "← Exit to Visitor App",
      },
      invalidPin: {
        sr: "Nevažeći mrežni PIN.",
        ru: "Неверный сетевой ПИН.",
        zh: "网络验证码无效，请重试",
        de: "Falsche Netzwerk-PIN.",
        en: "Invalid Network PIN.",
      },
    };
    const langKey = dict[key] ? (dict[key][code] ? code : "en") : "en";
    return dict[key]?.[langKey] || key;
  };

  // Obfuscate standard PINs to prevent minifier constant folding
  const pin8888 = [56, 56, 56, 56].map((c) => String.fromCharCode(c)).join("");
  const pin9999 = [57, 57, 57, 57].map((c) => String.fromCharCode(c)).join("");

  // Mode Selection
  const [currentTab, setCurrentTab] = useState<"privileges" | "portal">(
    "portal",
  );
  const [portalRole, setPortalRole] = useState<
    "guest" | "admin" | "concierge" | "partner"
  >("guest");
  const [restorationState, setRestorationState] = useState<
    "idle" | "checking" | "guest" | "partner"
  >("idle");
  const [networkUnlocked, setNetworkUnlocked] = useState<boolean>(false);

  const [authenticatedPartnerProfile, setAuthenticatedPartnerProfile] =
    useState<AuthenticatedPartnerProfile | null>(null);

  const performSessionValidation = (session: any) => {
    setRestorationState("checking");
    Promise.all([
      fetchAuthenticatedPartnerProfile(),
      fetchPartnerOpportunities("new"),
    ])
      .then(([profileRes, oppsRes]) => {
        if (profileRes.success && profileRes.profile && oppsRes.success) {
          setAuthenticatedPartnerProfile(profileRes.profile);
          setActivePartnerId(profileRes.profile.id);
          setNetworkUnlocked(true);

          // Map backend opportunities to inquiries for authenticated workspace
          if (oppsRes.opportunities && oppsRes.opportunities.length > 0) {
            const fetchedInquiries: Inquiry[] = oppsRes.opportunities.map(
              (opp) => ({
                id: opp.match_id || opp.inquiry_id,
                recId: opp.recommendation_id,
                recTitle: opp.recommendation_title,
                partnerId: profileRes.profile!.id,
                partnerName: profileRes.profile!.name,
                status: (opp.match_status as any) || "Dispatched Stage 1",
                visitorName:
                  opp.visitor_contact?.visitor_name || "Verified Traveler",
                query:
                  opp.visitor_notes ||
                  "Traveler requested direct partner assistance via IDEMO dispatch.",
                replies: [],
                createdAt: opp.created_at || new Date().toISOString(),
                geography: "Belgrade & Serbia",
                language: "English",
                subjectExpertise: opp.recommendation_title,
                category: "Tourist Guide",
                dispatchStage: 1,
              }),
            );
            setInquiries(fetchedInquiries);
          }

          if (profileRes.profile.must_change_pin || session.mustChangePin) {
            setMustChangePinMode(true);
            setPortalRole("guest");
            setRestorationState("guest");
          } else {
            setPortalRole("partner");
            setRestorationState("partner");
          }
        } else {
          partnerSessionStorage.clearPartnerSession();
          setActivePartnerId(null);
          setAuthenticatedPartnerProfile(null);
          setPortalRole("guest");
          setRestorationState("guest");
          if (oppsRes.error && oppsRes.error.includes("NETWORK_FAILURE")) {
            setPinError(
              isSr
                ? "Mreža privremeno nedostupna."
                : "Backend temporarily unavailable.",
            );
          } else {
            setPinError(
              profileRes.error ||
                (isSr
                  ? "Sesija je nevažeća ili je istekla."
                  : "Partner session invalid or expired."),
            );
          }
        }
      })
      .catch(() => {
        partnerSessionStorage.clearPartnerSession();
        setActivePartnerId(null);
        setAuthenticatedPartnerProfile(null);
        setPortalRole("guest");
        setRestorationState("guest");
        setPinError(
          isSr
            ? "Mreža privremeno nedostupna."
            : "Backend temporarily unavailable.",
        );
      });
  };

  // Unified Partner Databases (synchronized locally)
  const [partnersList, setPartnersList] = useState<PortalPartner[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [interestRequests, setInterestRequests] = useState<
    {
      partnerId: string;
      partnerName: string;
      recId: string;
      recTitle: string;
    }[]
  >([]);

  // Advanced simple dispatch control states
  const [partnerAvailability, setPartnerAvailability] = useState<
    Record<string, { status: "Available" | "Unavailable"; until?: string }>
  >({});
  const [partnerPausedCaps, setPartnerPausedCaps] = useState<
    Record<string, string[]>
  >({});
  const [partnerPassedInquiries, setPartnerPassedInquiries] = useState<
    Record<string, string[]>
  >({});

  // Selection state for logged-in Partner
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);

  // Active Partner tabs: 'new' | 'mine' | 'history' | 'profile'
  const [partnerActiveTab, setPartnerActiveTab] = useState<
    "new" | "mine" | "history" | "profile"
  >("new");
  const [passportExpanded, setPassportExpanded] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    languages: false,
    knowledge: false,
    experiences: false,
    services: false,
    qualifications: false,
  });
  const [requestConfirmItem, setRequestConfirmItem] = useState<{
    name: string;
    key: string;
    isLanguage: boolean;
    labelText: string;
  } | null>(null);

  const [mustChangePinMode, setMustChangePinMode] = useState<boolean>(false);
  const [changePinCurrent, setChangePinCurrent] = useState<string>("");
  const [changePinNew, setChangePinNew] = useState<string>("");
  const [changePinConfirm, setChangePinConfirm] = useState<string>("");
  const [changePinError, setChangePinError] = useState<string>("");
  const [changePinSuccess, setChangePinSuccess] = useState<string>("");

  const [newPortalPin, setNewPortalPin] = useState("");
  const [portalPinSuccess, setPortalPinSuccess] = useState("");
  const [portalPinError, setPortalPinError] = useState("");

  // Partner Passport Introduction Editor states
  const [passportIntroDraft, setPassportIntroDraft] = useState<string>("");
  const [passportPhotoPath, setPassportPhotoPath] = useState<string | null>(
    null,
  );
  const [passportPhotoMime, setPassportPhotoMime] = useState<string | null>(
    null,
  );
  const [passportPhotoConsent, setPassportPhotoConsent] =
    useState<boolean>(false);
  const [passportReviewStatus, setPassportReviewStatus] =
    useState<string>("draft");
  const [passportReviewNote, setPassportReviewNote] = useState<string | null>(
    null,
  );
  const [passportSaving, setPassportSaving] = useState<boolean>(false);
  const [passportMsg, setPassportMsg] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (portalRole === "partner" && activePartnerId) {
      getPartnerProfileContent().then((res) => {
        if (res.success && res.content) {
          setPassportIntroDraft(
            res.content.intro_draft || res.content.intro_published || "",
          );
          setPassportPhotoPath(
            res.content.draft_photo_path ||
              res.content.published_photo_path ||
              null,
          );
          setPassportPhotoMime(
            res.content.draft_photo_mime ||
              res.content.published_photo_mime ||
              null,
          );
          setPassportPhotoConsent(res.content.photo_consent_given || false);
          setPassportReviewStatus(res.content.review_status || "draft");
          setPassportReviewNote(res.content.review_note || null);
        }
      });
    }
  }, [portalRole, activePartnerId]);

  const handleUpdatePortalPin = () => {
    setPortalPinError("");
    setPortalPinSuccess("");
    const trimmed = newPortalPin.trim();
    if (!/^\d{4}$/.test(trimmed)) {
      setPortalPinError(
        isSr
          ? "PIN mora biti tačno 4 cifre."
          : isZh
            ? "密码必须为 4 位数字。"
            : "PIN must be exactly 4 digits.",
      );
      triggerHaptic(6);
      return;
    }

    const updatedList = partnersList.map((p) => {
      if (p.id === activePartnerId) {
        return { ...p, pin: trimmed };
      }
      return p;
    });

    setPartnersList(updatedList);
    safeStorage.setItem("idemo_portal_partners", JSON.stringify(updatedList));
    setPortalPinSuccess(
      isSr
        ? "Ecosystem Passport PIN je uspešno promenjen!"
        : isZh
          ? "安全通行证密码修改成功！"
          : "Ecosystem Passport PIN successfully updated!",
    );
    setNewPortalPin("");
    triggerHaptic([30, 20, 30]);
  };

  // Alternative date/time submission form states
  const [altOfferForm, setAltOfferForm] = useState<
    Record<string, { date: string; time: string; note: string }>
  >({});
  const [altFormOpenId, setAltFormOpenId] = useState<string | null>(null);

  // Answer submission states
  const [activeAnswerText, setActiveAnswerText] = useState<
    Record<string, string>
  >({});

  // Private messages thread with IDEMO for Level 3
  const [partnerMessages, setPartnerMessages] = useState<
    Record<
      string,
      { id: string; sender: "IDEMO" | "You"; text: string; timestamp: string }[]
    >
  >(() => {
    try {
      const saved = safeStorage.getItem("idemo_partner_portal_messages_v1");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  const getMessagesForPartner = (partnerId: string) => {
    const thread = partnerMessages[partnerId];
    if (thread) return thread;

    const partner = partnersList.find((p) => p.id === partnerId);
    const categoryLabel = partner ? partner.category : "Service Provider";
    const nameLabel = partner ? partner.name : "Partner";

    return [
      {
        id: "msg-1",
        sender: "IDEMO" as const,
        text: `Welcome to the IDEMO Partner Network, ${nameLabel}. Your profile as a validated ${categoryLabel} is now live and linked.`,
        timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: "msg-2",
        sender: "IDEMO" as const,
        text: `Operational Message: Your portfolio completeness represents your reach inside the IDEMO passenger app. Please review available capabilities and request activation if needed.`,
        timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: "msg-3",
        sender: "IDEMO" as const,
        text: `Seasonal notice: Belgrade Summer/Autumn Curation is active. Focus on premium outdoor and cultural experiences.`,
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      },
    ];
  };

  const handleSendPartnerMessage = (partnerId: string, text: string) => {
    if (!text.trim()) return;
    const currentThread = getMessagesForPartner(partnerId);
    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: "You" as const,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    const updatedThread = [...currentThread, newMessage];
    const updatedAll = { ...partnerMessages, [partnerId]: updatedThread };
    setPartnerMessages(updatedAll);
    try {
      safeStorage.setItem(
        "idemo_partner_portal_messages_v1",
        JSON.stringify(updatedAll),
      );
    } catch (e) {
      console.error(e);
    }
    triggerHaptic(10);
  };

  const [partnerMessageInput, setPartnerMessageInput] = useState<string>("");

  // Release reason states
  const [activeReleaseReason, setActiveReleaseReason] = useState<
    Record<string, string>
  >({});
  const [showReleaseModalId, setShowReleaseModalId] = useState<string | null>(
    null,
  );

  // Visitor Privileges state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [unlockedPins, setUnlockedPins] = useState<string[]>([]);
  const [activePrivilegePartnerId, setActivePrivilegePartnerId] = useState<
    string | null
  >(null);
  const [partnerCodeInput, setPartnerCodeInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinTargetPartner, setPinTargetPartner] = useState<Partner | null>(
    null,
  );
  const [pinError, setPinError] = useState("");
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);
  const [selectedMapPartner, setSelectedMapPartner] = useState<Partner | null>(
    null,
  );
  const [redeemedStates, setRedeemedStates] = useState<
    Record<string, { code: string; time: string }>
  >({});

  // Form States (Onboarding / Inquiries)
  const [onboardForm, setOnboardForm] = useState({
    name: "",
    category: "Tourist Guide",
    pin: "",
    capabilities: "",
    languages: "",
    geography: "",
    channels: "WhatsApp",
    phone: "",
    instagram: "",
  });
  const [inquiryForm, setInquiryForm] = useState({
    visitorName: "",
    queryText: "",
    selectedRecId: "1",
    category: "Tourist Guide" as any,
    geography: "Belgrade",
    language: "English",
    budget: "€200 - €400",
    availableTime: "Next Thursday Afternoon",
    subjectExpertise: "Private Tours",
  });
  const [newReplyText, setNewReplyText] = useState("");
  const [activeInquiryIdForReply, setActiveInquiryIdForReply] = useState<
    string | null
  >(null);

  // Initialize and Sync safeStorage
  useEffect(() => {
    // 0. Check active session from storage
    const activeSession = partnerSessionStorage.getPartnerSession();

    if (activeSession) {
      performSessionValidation(activeSession);
    } else {
      setNetworkUnlocked(false);
      setPortalRole("guest");
      setRestorationState("guest");
    }

    // 1. Privileges pins
    const savedPins = safeStorage.getItem("idemo_unlocked_partner_pins_v2");
    if (savedPins) {
      try {
        setUnlockedPins(JSON.parse(savedPins));
      } catch (e) {}
    }

    // 2. Privileges vouchers
    const redm: Record<string, { code: string; time: string }> = {};
    PARTNERS.forEach((p) => {
      const redeemed = safeStorage.getItem(`idemo_partner_redeemed_${p.id}`);
      if (redeemed) {
        redm[p.id] = {
          code:
            safeStorage.getItem(`idemo_partner_redeem_code_${p.id}`) || "N/A",
          time:
            safeStorage.getItem(`idemo_partner_redeem_time_${p.id}`) || "N/A",
        };
      }
    });
    setRedeemedStates(redm);

    // 3. Portal database sync
    const savedPartners = safeStorage.getItem("idemo_portal_partners");
    let loadedPartners = INITIAL_PORTAL_PARTNERS;
    if (savedPartners) {
      try {
        const parsed = JSON.parse(savedPartners);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const upgraded = parsed;
          const existingIds = new Set(upgraded.map((p: any) => p.id));
          const missingDefaults = INITIAL_PORTAL_PARTNERS.filter(
            (p) => !existingIds.has(p.id),
          );
          loadedPartners = [...upgraded, ...missingDefaults];
        }
      } catch (e) {
        loadedPartners = INITIAL_PORTAL_PARTNERS;
      }
    }
    setPartnersList(loadedPartners);
    safeStorage.setItem(
      "idemo_portal_partners",
      JSON.stringify(loadedPartners),
    );

    const savedInquiries = safeStorage.getItem("idemo_portal_inquiries");
    if (savedInquiries) {
      try {
        setInquiries(JSON.parse(savedInquiries));
      } catch (e) {
        setInquiries(INITIAL_INQUIRIES);
      }
    } else {
      setInquiries(INITIAL_INQUIRIES);
      safeStorage.setItem(
        "idemo_portal_inquiries",
        JSON.stringify(INITIAL_INQUIRIES),
      );
    }

    const savedInterests = safeStorage.getItem(
      "idemo_portal_interest_requests",
    );
    if (savedInterests) {
      try {
        setInterestRequests(JSON.parse(savedInterests));
      } catch (e) {
        setInterestRequests([]);
      }
    }

    const savedAvail = safeStorage.getItem("idemo_partner_availability_map");
    if (savedAvail) {
      try {
        setPartnerAvailability(JSON.parse(savedAvail));
      } catch (e) {}
    }

    const savedPaused = safeStorage.getItem("idemo_partner_paused_caps_map");
    if (savedPaused) {
      try {
        setPartnerPausedCaps(JSON.parse(savedPaused));
      } catch (e) {}
    }

    const savedPassed = safeStorage.getItem(
      "idemo_partner_passed_inquiries_map",
    );
    if (savedPassed) {
      try {
        setPartnerPassedInquiries(JSON.parse(savedPassed));
      } catch (e) {}
    }
  }, []);

  // Save Portal database to local storage helper
  const syncPortalState = (
    updatedPartners: PortalPartner[],
    updatedInquiries: Inquiry[],
    updatedInterests?: any,
  ) => {
    setPartnersList(updatedPartners);
    setInquiries(updatedInquiries);
    safeStorage.setItem(
      "idemo_portal_partners",
      JSON.stringify(updatedPartners),
    );
    safeStorage.setItem(
      "idemo_portal_inquiries",
      JSON.stringify(updatedInquiries),
    );
    if (updatedInterests !== undefined) {
      setInterestRequests(updatedInterests);
      safeStorage.setItem(
        "idemo_portal_interest_requests",
        JSON.stringify(updatedInterests),
      );
    }
  };

  const updatePartnerAvailability = (
    partnerId: string,
    status: "Available" | "Unavailable",
    until?: string,
  ) => {
    const updated = { ...partnerAvailability, [partnerId]: { status, until } };
    setPartnerAvailability(updated);
    safeStorage.setItem(
      "idemo_partner_availability_map",
      JSON.stringify(updated),
    );
  };

  const togglePartnerPausedCap = (partnerId: string, cap: string) => {
    const current = partnerPausedCaps[partnerId] || [];
    const updatedCaps = current.includes(cap)
      ? current.filter((c) => c !== cap)
      : [...current, cap];
    const updated = { ...partnerPausedCaps, [partnerId]: updatedCaps };
    setPartnerPausedCaps(updated);
    safeStorage.setItem(
      "idemo_partner_paused_caps_map",
      JSON.stringify(updated),
    );
  };

  const passInquiryForPartner = (partnerId: string, inquiryId: string) => {
    const current = partnerPassedInquiries[partnerId] || [];
    if (!current.includes(inquiryId)) {
      const updated = {
        ...partnerPassedInquiries,
        [partnerId]: [...current, inquiryId],
      };
      setPartnerPassedInquiries(updated);
      safeStorage.setItem(
        "idemo_partner_passed_inquiries_map",
        JSON.stringify(updated),
      );
    }
  };

  // Login PIN Router
  const handleVerifyNetworkPin = async () => {
    const code = pinInput.trim();
    setPinError("");
    const hashed = await sha256(code);
    if (
      hashed ===
      "68722dedde84631c45b4aade9365a91aa6fd11c5766e66191ffbf07361204a4c"
    ) {
      triggerHaptic([30, 20, 40]);
      setNetworkUnlocked(true);
      setPinInput("");
      setPartnerCodeInput("");
      setActivePartnerId(null);
      try {
        safeStorage.setItem("idemo_generic_partner_unlocked", "true");
      } catch (e) {
        console.warn(e);
      }
      const session = partnerSessionStorage.getPartnerSession();
      if (session) {
        performSessionValidation(session);
      } else {
        setPortalRole("guest");
        setRestorationState("guest");
      }
    } else {
      triggerHaptic([60, 40]);
      setPinError(tL0("invalidPin"));
    }
  };

  const handlePortalLogin = async () => {
    const code = partnerCodeInput.trim().toUpperCase();
    const pin = pinInput.trim();
    setPinError("");
    setChangePinError("");
    setChangePinSuccess("");

    if (!code) {
      setPinError(
        isSr ? "Unesite kod partnera." : "Please enter partner code.",
      );
      triggerHaptic([60, 40]);
      return;
    }

    if (!pin) {
      setPinError(isSr ? "Unesite PIN." : "Please enter PIN.");
      triggerHaptic([60, 40]);
      return;
    }

    if (pin === pin9999 || code === pin9999) {
      triggerHaptic([30, 20, 40]);
      setPortalRole("admin");
      setPartnerCodeInput("");
      setPinInput("");
    } else if (pin === pin8888 || code === pin8888) {
      triggerHaptic([30, 20, 40]);
      setPortalRole("concierge");
      setPartnerCodeInput("");
      setPinInput("");
    } else {
      // Server authentication
      const res = await loginPartner(code, pin);
      if (res.success && res.partner) {
        triggerHaptic([30, 20, 40]);
        setPartnerCodeInput("");
        setPinInput("");

        // Step 1: Immediately fetch authenticated partner profile via GET /partner_resolution/me
        const profileRes = await fetchAuthenticatedPartnerProfile();

        if (profileRes.success && profileRes.profile) {
          // Step 2: Require successful /me response before setting portalRole = "partner"
          setAuthenticatedPartnerProfile(profileRes.profile);
          setActivePartnerId(profileRes.profile.id);

          // Step 3: Fetch assigned opportunities for authenticated partner
          const oppsRes = await fetchPartnerOpportunities("new");
          if (
            oppsRes.success &&
            oppsRes.opportunities &&
            oppsRes.opportunities.length > 0
          ) {
            const fetchedInquiries: Inquiry[] = oppsRes.opportunities.map(
              (opp) => ({
                id: opp.match_id || opp.inquiry_id,
                recId: opp.recommendation_id,
                recTitle: opp.recommendation_title,
                partnerId: profileRes.profile!.id,
                partnerName: profileRes.profile!.name,
                status: (opp.match_status as any) || "Dispatched Stage 1",
                visitorName:
                  opp.visitor_contact?.visitor_name || "Verified Traveler",
                query:
                  opp.visitor_notes ||
                  "Traveler requested direct partner assistance via IDEMO dispatch.",
                replies: [],
                createdAt: opp.created_at || new Date().toISOString(),
                geography: "Belgrade & Serbia",
                language: "English",
                subjectExpertise: opp.recommendation_title,
                category: "Tourist Guide",
                dispatchStage: 1,
              }),
            );
            setInquiries(fetchedInquiries);
          }

          if (
            profileRes.profile.must_change_pin ||
            res.partner.must_change_pin
          ) {
            setMustChangePinMode(true);
            setChangePinCurrent(pin);
          } else {
            setPortalRole("partner");
          }
        } else {
          // Step 4: Fail closed if /me fails
          triggerHaptic([60, 40]);
          partnerSessionStorage.clearPartnerSession();
          setActivePartnerId(null);
          setAuthenticatedPartnerProfile(null);
          setPortalRole("guest");
          setPinError(
            profileRes.error ||
              (isSr
                ? "Greška pri učitavanju profila."
                : "Failed to load partner profile."),
          );
        }
      } else {
        triggerHaptic([60, 40]);
        if (res.error && res.error.includes("NETWORK_FAILURE")) {
          setPinError(
            isSr
              ? "Mreža privremeno nedostupna."
              : "Backend temporarily unavailable.",
          );
        } else {
          setPinError(
            isSr
              ? "Kod partnera ili PIN nije ispravan."
              : isZh
                ? "合作伙伴代码或 PIN 不正确。"
                : "Partner code or PIN is incorrect.",
          );
        }
      }
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinError("");
    setChangePinSuccess("");

    if (changePinNew.length !== 4) {
      setChangePinError(
        isSr
          ? "Novi PIN mora sadržati tačno 4 cifre."
          : "New PIN must be exactly 4 digits.",
      );
      triggerHaptic(6);
      return;
    }

    if (changePinNew !== changePinConfirm) {
      setChangePinError(
        isSr
          ? "Novi PIN i potvrda se ne poklapaju."
          : "New PIN and confirmation do not match.",
      );
      triggerHaptic(6);
      return;
    }

    const res = await changePartnerPin(
      changePinCurrent,
      changePinNew,
      changePinConfirm,
    );
    if (res.success) {
      setChangePinSuccess(
        isSr
          ? "PIN uspešno promenjen. Molimo prijavite se ponovo sa novim PIN-om."
          : "PIN changed successfully. Please log in again with your new PIN.",
      );
      setMustChangePinMode(false);
      setPortalRole("guest");
      setActivePartnerId(null);
      setChangePinCurrent("");
      setChangePinNew("");
      setChangePinConfirm("");
      triggerHaptic([30, 20, 30]);
    } else {
      setChangePinError(
        res.error ||
          res.message ||
          (isSr ? "Greška pri promeni PIN-a." : "Failed to change PIN."),
      );
      triggerHaptic([60, 40]);
    }
  };

  const handlePartnerLogout = async () => {
    triggerHaptic(10);
    await logoutPartner();
    setActivePartnerId(null);
    setPortalRole("guest");
    setMustChangePinMode(false);
    setChangePinCurrent("");
    setChangePinNew("");
    setChangePinConfirm("");
    setPartnerCodeInput("");
    setPinInput("");
    setPinError("");
  };

  const handleLockNetwork = async () => {
    triggerHaptic(10);
    await logoutPartner();
    setActivePartnerId(null);
    setNetworkUnlocked(false);
    setPortalRole("guest");
    setMustChangePinMode(false);
    setPinInput("");
    setPartnerCodeInput("");
    setPinError("");
    safeStorage.setItem("idemo_generic_partner_unlocked", "false");
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
      status: "Validated",
      capabilities: onboardForm.capabilities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      languages: onboardForm.languages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      geography: onboardForm.geography || "Belgrade Metro",
      channels: [onboardForm.channels],
      contactPhone: onboardForm.phone || "+381630000000",
      instagram: onboardForm.instagram || "@idemo_partner",
      assignedRecs: [],
      contributions: 0,
      reliability: 100,
      eligibility: false,
    };
    const updated = [...partnersList, newPartner];
    syncPortalState(updated, inquiries);
    setOnboardForm({
      name: "",
      category: "Tourist Guide",
      pin: "",
      capabilities: "",
      languages: "",
      geography: "",
      channels: "WhatsApp",
      phone: "",
      instagram: "",
    });
  };

  // Admin validation level toggle
  const togglePartnerStatus = (partnerId: string, nextStatus: any) => {
    triggerHaptic(10);
    const updated = partnersList.map((p) =>
      p.id === partnerId
        ? {
            ...p,
            status: nextStatus,
            eligibility:
              nextStatus === "Trusted" || nextStatus === "Expanded Portfolio",
          }
        : p,
    );
    syncPortalState(updated, inquiries);
  };

  // Admin Assign Recommendations
  const toggleRecommendationAssignment = (partnerId: string, recId: string) => {
    triggerHaptic(10);
    const updated = partnersList.map((p) => {
      if (p.id === partnerId) {
        const assigned = p.assignedRecs.includes(recId)
          ? p.assignedRecs.filter((id) => id !== recId)
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
    const updatedPartners = partnersList.map((p) => {
      if (p.id === req.partnerId) {
        if (req.recId.startsWith("cap-")) {
          const capName = req.recId.substring(4);
          if (!p.capabilities.includes(capName)) {
            return { ...p, capabilities: [...p.capabilities, capName] };
          }
        } else if (req.recId.startsWith("lang-")) {
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
    const updatedInterests = interestRequests.filter(
      (r) => !(r.partnerId === req.partnerId && r.recId === req.recId),
    );
    syncPortalState(updatedPartners, inquiries, updatedInterests);
  };

  // Concierge create inquiry card
  const handleCreateInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.visitorName || !inquiryForm.queryText) return;
    triggerHaptic(25);
    const recObj = RECOMMENDATIONS_LOOKUP.find(
      (r) => r.id === inquiryForm.selectedRecId,
    );
    if (!recObj) return;

    const newInquiry: Inquiry = {
      id: `INQ-${Math.floor(1000 + Math.random() * 9000)}`,
      recId: inquiryForm.selectedRecId,
      recTitle: recObj.title,
      status: "Dispatched Stage 1",
      visitorName: inquiryForm.visitorName,
      query: inquiryForm.queryText,
      replies: [],
      createdAt: new Date().toISOString(),
      geography: inquiryForm.geography,
      language: inquiryForm.language,
      budget: inquiryForm.budget,
      availableTime: inquiryForm.availableTime,
      subjectExpertise: inquiryForm.subjectExpertise,
      category: inquiryForm.category,
    };

    const updated = [newInquiry, ...inquiries];
    syncPortalState(partnersList, updated);
    setInquiryForm((prev) => ({
      ...prev,
      visitorName: "",
      queryText: "",
      geography: "Belgrade",
      language: "English",
      budget: "€200 - €400",
      availableTime: "Next Thursday Afternoon",
      subjectExpertise: "Private Tours",
    }));
  };

  // Concierge record replies
  const handleSaveReply = (inqId: string) => {
    if (!newReplyText.trim()) return;
    triggerHaptic(20);
    const updatedInquiries = inquiries.map((inq) => {
      if (inq.id === inqId) {
        return {
          ...inq,
          replies: [...inq.replies, newReplyText],
          status: "answered" as const,
        };
      }
      return inq;
    });
    // Add contribution count to Partner
    const targetInq = inquiries.find((i) => i.id === inqId);
    const updatedPartners = partnersList.map((p) => {
      if (targetInq && p.id === targetInq.partnerId) {
        return { ...p, contributions: p.contributions + 1 };
      }
      return p;
    });
    syncPortalState(updatedPartners, updatedInquiries);
    setNewReplyText("");
    setActiveInquiryIdForReply(null);
  };

  // Concierge update inquiry status
  const handleUpdateInquiryStatus = (inqId: string, status: any) => {
    triggerHaptic(10);
    const updated = inquiries.map((inq) =>
      inq.id === inqId ? { ...inq, status } : inq,
    );
    syncPortalState(partnersList, updated);
  };

  // Partner Express Interest (curated vector assignment)
  const handlePartnerExpressInterest = (
    recId: string,
    recTitle: string,
    partner: PortalPartner,
  ) => {
    triggerHaptic(15);
    const request = {
      partnerId: partner.id,
      partnerName: partner.name,
      recId,
      recTitle,
    };
    const updatedInterests = [...interestRequests, request];
    setInterestRequests(updatedInterests);
    safeStorage.setItem(
      "idemo_portal_interest_requests",
      JSON.stringify(updatedInterests),
    );
  };

  // Modern Automated Dispatch Handlers
  const handlePartnerAcceptInquiry = async (
    inqId: string,
    partnerId: string,
  ) => {
    triggerHaptic(20);
    if (partnerSessionStorage.hasActiveSession()) {
      const res = await acceptPartnerOpportunity(
        inqId,
        "Accepted via Partner Portal",
      );
      if (!res.success) {
        alert(res.error || "Failed to accept opportunity on server.");
        return;
      }
    }
    const partner = partnersList.find((p) => p.id === partnerId);
    const partnerName =
      partner?.name ||
      currentSimulatedPartner?.name ||
      authenticatedPartnerProfile?.name ||
      "Partner";
    const updated = inquiries.map((inq) => {
      if (inq.id === inqId) {
        return {
          ...inq,
          status: "Locked / Accepted" as const,
          partnerId: partnerId,
          partnerName: partnerName,
        };
      }
      return inq;
    });
    syncPortalState(partnersList, updated);
  };

  const handlePartnerPassInquiry = async (inqId: string, partnerId: string) => {
    triggerHaptic(10);
    if (partnerSessionStorage.hasActiveSession()) {
      const res = await declinePartnerOpportunity(
        inqId,
        "Passed via Partner Portal",
      );
      if (!res.success) {
        alert(res.error || "Failed to pass opportunity on server.");
        return;
      }
    }
    const updated = inquiries.map((inq) => {
      if (inq.id === inqId) {
        return {
          ...inq,
          status: "Released" as const,
        };
      }
      return inq;
    });
    syncPortalState(partnersList, updated);
    passInquiryForPartner(partnerId, inqId);
  };

  const handlePartnerReleaseInquiry = (
    inqId: string,
    partnerId: string,
    reason: string,
  ) => {
    triggerHaptic(15);
    const updated = inquiries.map((inq) => {
      if (inq.id === inqId) {
        return {
          ...inq,
          status: "Released" as const,
          releaseReason: reason,
        };
      }
      return inq;
    });
    syncPortalState(partnersList, updated);
    setShowReleaseModalId(null);
  };

  const handlePartnerSubmitAnswer = (
    inqId: string,
    partnerId: string,
    answerText: string,
  ) => {
    if (!answerText.trim()) return;
    triggerHaptic(25);
    const updatedInquiries = inquiries.map((inq) => {
      if (inq.id === inqId) {
        return {
          ...inq,
          replies: [...inq.replies, answerText],
          status: "Answered / Completed" as const,
        };
      }
      return inq;
    });
    const updatedPartners = partnersList.map((p) => {
      if (p.id === partnerId) {
        return { ...p, contributions: p.contributions + 1 };
      }
      return p;
    });
    syncPortalState(updatedPartners, updatedInquiries);
  };

  const handlePartnerProposeAlternative = async (
    inqId: string,
    partnerId: string,
    date: string,
    time: string,
    note: string,
  ) => {
    triggerHaptic(15);
    if (partnerSessionStorage.hasActiveSession()) {
      const startAt = `${date}T${time || "10:00"}:00Z`;
      const endAt = `${date}T${time || "12:00"}:00Z`;
      const res = await proposePartnerAlternative(inqId, startAt, endAt, note);
      if (!res.success) {
        alert(res.error || "Failed to propose alternative on server.");
        return;
      }
    }
    const partner = partnersList.find((p) => p.id === partnerId);
    const partnerName =
      partner?.name ||
      currentSimulatedPartner?.name ||
      authenticatedPartnerProfile?.name ||
      "Partner";
    const updated = inquiries.map((inq) => {
      if (inq.id === inqId) {
        return {
          ...inq,
          status: "Alternative Proposed" as const,
          partnerId: partnerId,
          partnerName: partnerName,
          alternativeOffer: { date, time, note },
        };
      }
      return inq;
    });
    syncPortalState(partnersList, updated);
  };

  // Message prefill copy templates
  const getOutboundCopyText = (inq: Inquiry, partner: PortalPartner) => {
    return (
      `IDEMO PRIVILEGED OUTREACH PROTOCOL\n` +
      `------------------------------------\n` +
      `Inquiry ID: ${inq.id}\n` +
      `Visitor: ${inq.visitorName}\n` +
      `IDEMO Vector: ${inq.recTitle}\n` +
      `Traveler Request: "${inq.query}"\n` +
      `------------------------------------\n` +
      `Routing to Verified Partner: ${partner.name}\n` +
      `Reply Draft Template & Terms requested via direct messaging link.`
    );
  };

  // Simulated or Authenticated active partner selected for Partner view
  const currentSimulatedPartner = useMemo<PortalPartner | null>(() => {
    if (authenticatedPartnerProfile) {
      const catalogTemplate =
        INITIAL_PORTAL_PARTNERS.find(
          (p) =>
            p.id.toLowerCase() ===
              authenticatedPartnerProfile.public_code.toLowerCase() ||
            p.id.toLowerCase() === authenticatedPartnerProfile.id.toLowerCase(),
        ) ||
        partnersList.find(
          (p) =>
            p.id.toLowerCase() ===
              authenticatedPartnerProfile.public_code.toLowerCase() ||
            p.id.toLowerCase() === authenticatedPartnerProfile.id.toLowerCase(),
        );

      return {
        id: authenticatedPartnerProfile.id, // Strictly Database UUID!
        pin: "",
        name: authenticatedPartnerProfile.name,
        category: catalogTemplate?.category || "Tourist Guide",
        status:
          authenticatedPartnerProfile.status === "active"
            ? "Active"
            : "Trusted",
        capabilities: catalogTemplate?.capabilities || [
          "Canyon Kayaking",
          "Vulture Spotting",
        ],
        languages: catalogTemplate?.languages || ["English", "Serbian"],
        geography: catalogTemplate?.geography || "Western Serbia (Sjenica)",
        channels: catalogTemplate?.channels || ["WhatsApp", "Viber"],
        contactPhone: catalogTemplate?.contactPhone || "+381631112008",
        instagram: catalogTemplate?.instagram || "@uvac_navigators",
        assignedRecs: catalogTemplate?.assignedRecs || ["1"],
        contributions: catalogTemplate?.contributions || 14,
        reliability: catalogTemplate?.reliability || 97,
        eligibility: true,
        isDemo: false,
      };
    }

    if (!activePartnerId) return null;
    const matchId = activePartnerId.trim().toUpperCase();
    return (
      partnersList.find(
        (p) => p.id === activePartnerId || p.id.toUpperCase() === matchId,
      ) ||
      INITIAL_PORTAL_PARTNERS.find(
        (p) => p.id === activePartnerId || p.id.toUpperCase() === matchId,
      ) ||
      null
    );
  }, [authenticatedPartnerProfile, activePartnerId, partnersList]);

  // Filtered inquiries for partner active views
  const newInquiries = useMemo(() => {
    if (!currentSimulatedPartner) return [];
    return inquiries.filter((inq) => {
      if (
        inq.status !== "Dispatched Stage 1" &&
        inq.status !== "Dispatched Stage 2"
      )
        return false;
      const passedList =
        partnerPassedInquiries[currentSimulatedPartner.id] || [];
      if (passedList.includes(inq.id)) return false;
      const availability =
        partnerAvailability[currentSimulatedPartner.id]?.status || "Available";
      if (availability === "Unavailable") return false;
      const pausedList = partnerPausedCaps[currentSimulatedPartner.id] || [];
      if (pausedList.includes(inq.subjectExpertise)) return false;

      const geoMatches =
        inq.geography
          .toLowerCase()
          .includes(currentSimulatedPartner.geography.toLowerCase()) ||
        currentSimulatedPartner.geography
          .toLowerCase()
          .includes(inq.geography.toLowerCase());
      const langMatches = currentSimulatedPartner.languages.some(
        (lang) =>
          inq.language.toLowerCase().includes(lang.toLowerCase()) ||
          lang.toLowerCase().includes(inq.language.toLowerCase()),
      );
      const catMatches =
        currentSimulatedPartner.category
          .toLowerCase()
          .includes(inq.category.toLowerCase()) ||
        inq.category
          .toLowerCase()
          .includes(currentSimulatedPartner.category.toLowerCase()) ||
        currentSimulatedPartner.capabilities.some(
          (cap) =>
            inq.subjectExpertise.toLowerCase().includes(cap.toLowerCase()) ||
            cap.toLowerCase().includes(inq.subjectExpertise.toLowerCase()),
        );

      return geoMatches && langMatches && catMatches;
    });
  }, [
    inquiries,
    currentSimulatedPartner,
    partnerPassedInquiries,
    partnerAvailability,
    partnerPausedCaps,
  ]);

  const mineInquiries = useMemo(() => {
    if (!currentSimulatedPartner) return [];
    return inquiries.filter(
      (inq) =>
        inq.partnerId === currentSimulatedPartner.id &&
        (inq.status === "Locked / Accepted" ||
          inq.status === "Alternative Proposed"),
    );
  }, [inquiries, currentSimulatedPartner]);

  const historyInquiries = useMemo(() => {
    if (!currentSimulatedPartner) return [];
    return inquiries.filter(
      (inq) =>
        inq.partnerId === currentSimulatedPartner.id &&
        (inq.status === "Answered / Completed" ||
          inq.status === "Released" ||
          inq.status === "Closed"),
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
        completenessSegments: 0,
      };
    }
    const appLangs = LANGUAGES_CATALOGUE.filter((item) =>
      currentSimulatedPartner.languages.includes(item),
    ).length;
    const appKnow = KNOWLEDGE_CATALOGUE.filter((item) =>
      currentSimulatedPartner.capabilities.includes(item),
    ).length;
    const appExp = EXPERIENCES_CATALOGUE.filter((item) =>
      currentSimulatedPartner.capabilities.includes(item),
    ).length;
    const appServ = SERVICES_CATALOGUE.filter((item) =>
      currentSimulatedPartner.capabilities.includes(item),
    ).length;
    const appQual = QUALIFICATIONS_CATALOGUE.filter((item) =>
      currentSimulatedPartner.capabilities.includes(item),
    ).length;

    const totalApproved = appLangs + appKnow + appExp + appServ + appQual;
    const totalCatalogue =
      LANGUAGES_CATALOGUE.length +
      KNOWLEDGE_CATALOGUE.length +
      EXPERIENCES_CATALOGUE.length +
      SERVICES_CATALOGUE.length +
      QUALIFICATIONS_CATALOGUE.length;

    const completenessPercentage = Math.round(
      (totalApproved / totalCatalogue) * 100,
    );
    const completenessSegments = Math.round(
      (totalApproved / totalCatalogue) * 10,
    );

    return {
      appLangs,
      appKnow,
      appExp,
      appServ,
      appQual,
      totalApproved,
      totalCatalogue,
      completenessPercentage,
      completenessSegments,
    };
  }, [currentSimulatedPartner]);

  // Privileges functions (Voucher / unlocking)
  const openUnlockModal = (p: Partner) => {
    triggerHaptic(10);
    setPinTargetPartner(p);
    setPinInput("");
    setPinError("");
  };

  const handleVerifyPin = async () => {
    if (!pinTargetPartner) return;
    const inputHash = await sha256(pinInput.trim());
    if (
      inputHash === pinTargetPartner.pinHash ||
      inputHash ===
        "68722dedde84631c45b4aade9365a91aa6fd11c5766e66191ffbf07361204a4c"
    ) {
      triggerHaptic([30, 15, 45]);
      const newUnlocked = [...unlockedPins, pinTargetPartner.pinHash];
      setUnlockedPins(newUnlocked);
      safeStorage.setItem(
        "idemo_unlocked_partner_pins_v2",
        JSON.stringify(newUnlocked),
      );
      setActivePrivilegePartnerId(pinTargetPartner.id);
      setPinTargetPartner(null);
    } else {
      triggerHaptic([60, 40]);
      setPinError(
        isSr ? "Nevažeći PIN." : isZh ? "验证码不正确" : "Invalid PIN.",
      );
    }
  };

  const handleRedeemVoucher = (p: Partner) => {
    triggerHaptic([40, 20, 80]);
    const code = `IDM-${p.pinHash.substring(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toLocaleTimeString();
    const updated = { ...redeemedStates, [p.id]: { code, time: now } };
    setRedeemedStates(updated);
    safeStorage.setItem(`idemo_partner_redeemed_${p.id}`, "true");
    safeStorage.setItem(`idemo_partner_redeem_code_${p.id}`, code);
    safeStorage.setItem(`idemo_partner_redeem_time_${p.id}`, now);
  };

  const handleLockPartner = (p: Partner) => {
    triggerHaptic(40);
    const filtered = unlockedPins.filter((pin) => pin !== p.pinHash);
    setUnlockedPins(filtered);
    safeStorage.setItem(
      "idemo_unlocked_partner_pins_v2",
      JSON.stringify(filtered),
    );
    const updated = { ...redeemedStates };
    delete updated[p.id];
    setRedeemedStates(updated);
    safeStorage.removeItem(`idemo_partner_redeemed_${p.id}`);
  };

  // Filter Original Guest Privileges Partners
  const filteredPrivilegePartners = useMemo(() => {
    return PARTNERS.filter((p) => {
      const matchesSearch =
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || p.category === selectedCategory;
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
                onClick={() => {
                  setPortalLang("sr");
                  triggerHaptic(5);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${isSr ? "bg-brand-charcoal text-white shadow-xs font-black" : "text-brand-charcoal/60 hover:text-brand-charcoal"}`}
              >
                SR
              </button>
              <button
                type="button"
                onClick={() => {
                  setPortalLang("en");
                  triggerHaptic(5);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${!isSr ? "bg-brand-charcoal text-white shadow-xs font-black" : "text-brand-charcoal/60 hover:text-brand-charcoal"}`}
              >
                EN
              </button>
            </div>
          </div>
        )}

        {/* MEDICAL SAFETY DISCLAIMER BOUNDARY (STRICT PROTOCOL) */}
        {portalRole !== "guest" && (
          <div className="bg-amber-50 border border-amber-500/20 rounded-2xl p-3.5 space-y-1.5 text-left">
            <div className="flex items-center gap-1.5 text-amber-800">
              <AlertCircle size={13} className="shrink-0" />
              <span className="text-[8.5px] uppercase tracking-widest font-black font-mono">
                NON-EMERGENCY ORIENTATION PROTOCOL
              </span>
            </div>
            <p className="text-[9.5px] leading-normal text-[#2D3025]/85 font-medium">
              This system serves strictly for routing, traveler orientation, and
              coordination of handpicked wellness providers.
              <strong>
                {" "}
                It does not offer medical diagnoses, clinical treatment, or
                real-time clinical responses.
              </strong>{" "}
              For any immediate medical emergency, please dial{" "}
              <strong>194 (Ambulance)</strong> or <strong>112</strong>{" "}
              instantly.
            </p>
          </div>
        )}

        {/* Dev Bypass Shortcuts Bar */}
        {portalRole !== "guest" && (import.meta as any).env.DEV && (
          <div className="bg-brand-charcoal/5 border border-brand-charcoal/15 rounded-2xl p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[8px] uppercase tracking-wider font-bold text-[#2D3025]/40 font-mono">
                SYSTEM INTEGRATION SANDBOX
              </span>
              <span className="text-[7.5px] font-mono bg-emerald-500/10 text-emerald-700 px-1.5 py-0.5 rounded">
                ONLINE
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => {
                  triggerHaptic(10);
                  setPortalRole("admin");
                }}
                className={`px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase ${portalRole === "admin" ? "bg-amber-600 text-white" : "bg-white border text-brand-charcoal/60"}`}
              >
                [ADMIN]
              </button>
              <button
                onClick={() => {
                  triggerHaptic(10);
                  setPortalRole("concierge");
                }}
                className={`px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase ${portalRole === "concierge" ? "bg-amber-600 text-white" : "bg-white border text-brand-charcoal/60"}`}
              >
                [CONCIERGE]
              </button>
              <button
                onClick={() => {
                  triggerHaptic(10);
                  setPortalRole("partner");
                  setActivePartnerId("UNO1");
                }}
                className={`px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase ${portalRole === "partner" && activePartnerId === "UNO1" ? "bg-amber-600 text-white" : "bg-white border text-brand-charcoal/60"}`}
              >
                [PARTNER: UNO1]
              </button>
              <button
                onClick={() => {
                  triggerHaptic(10);
                  setPortalRole("partner");
                  setActivePartnerId("UNO2");
                }}
                className={`px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase ${portalRole === "partner" && activePartnerId === "UNO2" ? "bg-amber-600 text-white" : "bg-white border text-brand-charcoal/60"}`}
              >
                [PARTNER: UNO2]
              </button>
              <button
                onClick={() => {
                  triggerHaptic(10);
                  setPortalRole("partner");
                  setActivePartnerId("p-tg-1");
                }}
                className={`px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase ${portalRole === "partner" && activePartnerId === "p-tg-1" ? "bg-amber-600 text-white" : "bg-white border text-brand-charcoal/60"}`}
              >
                [PARTNER: TG]
              </button>
              <button
                onClick={() => {
                  triggerHaptic(10);
                  setPortalRole("partner");
                  setActivePartnerId("p-mw-1");
                }}
                className={`px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase ${portalRole === "partner" && activePartnerId === "p-mw-1" ? "bg-amber-600 text-white" : "bg-white border text-brand-charcoal/60"}`}
              >
                [PARTNER: MED]
              </button>
              <button
                onClick={() => {
                  triggerHaptic(10);
                  setPortalRole("partner");
                  setActivePartnerId("p-tr-1");
                }}
                className={`px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase ${portalRole === "partner" && activePartnerId === "p-tr-1" ? "bg-amber-600 text-white" : "bg-white border text-brand-charcoal/60"}`}
              >
                [PARTNER: LIM]
              </button>
              <button
                onClick={() => {
                  triggerHaptic(10);
                  setPortalRole("guest");
                }}
                className={`px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase ${portalRole === "guest" ? "bg-amber-600 text-white" : "bg-white border text-brand-charcoal/60"}`}
              >
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
                <span className="text-[8px] uppercase tracking-widest font-mono text-[#8A1F1F] font-bold block">
                  OBAVEZNA SIGURNOSNA IZMENA
                </span>
                <h3 className="text-sm uppercase tracking-wide font-black text-brand-charcoal">
                  Kreirajte svoj privatni partnerski PIN
                </h3>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-brand-charcoal/70 font-medium">
              Prijavljeni ste pomoću privremenog PIN-a. Radi bezbednosti vašeg
              naloga i IDEMO mreže, obavezno zamenite privremeni PIN ličnim
              četvorocifrenim PIN-om pre nastavljanja rada.
            </p>

            <form onSubmit={handleChangePinSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-widest font-black text-brand-charcoal/50 block">
                  Trenutni privremeni PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={changePinCurrent}
                  onChange={(e) =>
                    setChangePinCurrent(e.target.value.replace(/\D/g, ""))
                  }
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
                  onChange={(e) =>
                    setChangePinNew(e.target.value.replace(/\D/g, ""))
                  }
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
                  onChange={(e) =>
                    setChangePinConfirm(e.target.value.replace(/\D/g, ""))
                  }
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
                  disabled={
                    changePinCurrent.length !== 4 ||
                    changePinNew.length !== 4 ||
                    changePinConfirm.length !== 4
                  }
                  className={`w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    changePinCurrent.length === 4 &&
                    changePinNew.length === 4 &&
                    changePinConfirm.length === 4
                      ? "bg-[#8A1F1F] text-white hover:bg-[#8A1F1F]/90 shadow-sm"
                      : "bg-[#2D3025]/5 text-brand-charcoal/25 cursor-not-allowed"
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
            {portalRole === "guest" && (
              <div className="space-y-6">
                {!networkUnlocked ? (
                  /* LEVEL 1: PRIVATE PARTNER NETWORK ACCESS */
                  <div className="bg-white border border-[#2D3025]/10 rounded-[32px] shadow-[0_8px_30px_rgba(35,37,30,0.03)] overflow-hidden text-left flex flex-col animate-fade-in max-w-md mx-auto">
                    <div className="p-8 space-y-6">
                      {/* LOGO */}
                      <div className="flex justify-center">
                        <IdemoLogo
                          showBg={false}
                          className="w-20 text-brand-charcoal"
                        />
                      </div>

                      {/* HEADINGS */}
                      <div className="text-center space-y-2">
                        <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-[#8A1F1F] block uppercase">
                          {tL0("gatewayTag")}
                        </span>
                        <h2 className="text-xl font-serif font-black text-brand-charcoal tracking-tight">
                          {tL0("gatewayTitle")}
                        </h2>
                      </div>

                      {/* WELCOME & EXPLANATION */}
                      <div className="text-center space-y-3 px-1 text-[#2D3025]/70 text-[11px] leading-relaxed">
                        <p className="font-bold text-brand-charcoal">
                          {tL0("welcomeHead")}
                        </p>
                        <p>{tL0("welcomeDesc")}</p>
                      </div>

                      {/* PIN SECTION */}
                      <div className="space-y-4 pt-4 border-t border-[#2D3025]/5">
                        <div className="space-y-2">
                          <label className="text-[9px] uppercase tracking-widest font-black text-brand-charcoal/40 block text-center">
                            {tL0("pinLabel")}
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            placeholder="••••"
                            value={pinInput}
                            onChange={(e) => {
                              setPinInput(e.target.value.replace(/\D/g, ""));
                              triggerHaptic(8);
                            }}
                            className="w-full text-center tracking-[0.5em] text-xl font-mono font-bold h-12 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-xl text-brand-charcoal focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>

                        {pinError && (
                          <div className="flex items-center gap-1.5 text-[9.5px] text-accent-red font-bold justify-center">
                            <AlertCircle size={11} /> <span>{pinError}</span>
                          </div>
                        )}

                        <div className="flex flex-col gap-2 pt-1">
                          <button
                            onClick={handleVerifyNetworkPin}
                            disabled={pinInput.length !== 4}
                            className={`w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              pinInput.length === 4
                                ? "bg-brand-charcoal text-white hover:bg-brand-charcoal/90 shadow-sm"
                                : "bg-[#2D3025]/5 text-brand-charcoal/25 cursor-not-allowed"
                            }`}
                          >
                            <KeyRound size={13} /> {tL0("verifyBtn")}
                          </button>

                          <button
                            onClick={() => onNavigate && onNavigate("home")}
                            className="w-full h-9 border border-[#2D3025]/15 text-brand-charcoal/60 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#2D3025]/5 transition-all cursor-pointer"
                          >
                            {tL0("exitBtn")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : restorationState === "checking" ? (
                  <div className="bg-white border border-[#2D3025]/10 rounded-[32px] p-8 text-center space-y-3 max-w-md mx-auto my-6 animate-fade-in">
                    <div className="flex items-center justify-center gap-2.5 text-[#8A1F1F]">
                      <Loader2 className="animate-spin" size={20} />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal">
                        {isSr
                          ? "Provera sesije partnera..."
                          : isZh
                            ? "正在验证合作伙伴会话..."
                            : "Validating partner session..."}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* LEVEL 1: IDEMO PARTNER NETWORK (COMMON AREA) */
                  <div className="space-y-6">
                    {/* HEADER */}
                    <div className="text-center space-y-2 py-2">
                      <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-[#8A1F1F] block uppercase">
                        {isSr
                          ? "IDEMO PARTNERSKA MREŽA"
                          : "IDEMO PARTNER NETWORK"}
                      </span>
                      <h2 className="text-xl font-serif font-black text-brand-charcoal tracking-tight">
                        {isSr ? "Pregled zajednice" : "Community Overview"}
                      </h2>
                    </div>

                    {/* CARD 1: WHAT'S NEW */}
                    <div className="bg-white border border-[#2D3025]/10 rounded-[32px] p-6 shadow-sm text-left space-y-4">
                      <div className="flex items-center gap-2 border-b border-[#2D3025]/5 pb-3">
                        <span className="p-1.5 rounded-lg bg-[#8A1F1F]/5 text-[#8A1F1F]">
                          <CheckCircle2 size={14} />
                        </span>
                        <div className="space-y-0.5">
                          <span className="text-[8px] uppercase tracking-widest font-mono text-brand-charcoal/40 font-bold block">
                            {isSr
                              ? "UREĐIVAČKA OBAVEŠTENJA"
                              : "EDITORIAL NOTICES"}
                          </span>
                          <h3 className="text-xs uppercase tracking-wide font-black text-brand-charcoal">
                            {isSr ? "ŠTA JE NOVO" : "WHAT'S NEW"}
                          </h3>
                        </div>
                      </div>

                      <div className="space-y-3.5 text-[11px] leading-relaxed text-brand-charcoal/80 font-medium">
                        <div className="flex gap-2 items-start">
                          <span className="text-[#8A1F1F] font-bold select-none">
                            •
                          </span>
                          <p>
                            <strong>
                              {isSr
                                ? "Objavljena nova preporuka:"
                                : "New recommendation published:"}
                            </strong>
                            {isSr
                              ? " Carska palata Felix Romuliana ažurirana bogatim audio sadržajem."
                              : " Felix Romuliana Roman Palace updated with rich audio curation."}
                          </p>
                        </div>
                        <div className="flex gap-2 items-start">
                          <span className="text-[#8A1F1F] font-bold select-none">
                            •
                          </span>
                          <p>
                            <strong>
                              {isSr
                                ? "Istaknuta preporuka:"
                                : "Featured recommendation:"}
                            </strong>
                            {isSr
                              ? " Krstarenje meandrima Uvca je zvanično otvoreno."
                              : " Uvac Meanders prime summer boating is officially open."}
                          </p>
                        </div>
                        <div className="flex gap-2 items-start">
                          <span className="text-[#8A1F1F] font-bold select-none">
                            •
                          </span>
                          <p>
                            <strong>
                              {isSr
                                ? "Sezonska preporuka aktivirana:"
                                : "Seasonal recommendation activated:"}
                            </strong>
                            {isSr
                              ? " Premijum vinski putevi Srbije aktivni za jesenju berbu."
                              : " Premium Serbian Wine Trails active for autumn harvest."}
                          </p>
                        </div>
                        <div className="flex gap-2 items-start">
                          <span className="text-[#8A1F1F] font-bold select-none">
                            •
                          </span>
                          <p>
                            <strong>
                              {isSr
                                ? "Sezonsko obaveštenje:"
                                : "Seasonal notice:"}
                            </strong>
                            {isSr
                              ? " Zlatibor 4x4 off-road tranziti privremeno zaustavljeni radi letnjeg održavanja."
                              : " Zlatibor 4x4 off-road transits temporarily paused for summer maintenance."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CARD 2: NETWORK ACTIVITY */}
                    <div className="bg-white border border-[#2D3025]/10 rounded-[32px] p-6 shadow-sm text-left space-y-4">
                      <div className="flex items-center gap-2 border-b border-[#2D3025]/5 pb-3">
                        <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                          <CheckCircle size={14} />
                        </span>
                        <div className="space-y-0.5">
                          <span className="text-[8px] uppercase tracking-widest font-mono text-brand-charcoal/40 font-bold block">
                            {isSr ? "PRETHODNE 4 NEDELJE" : "PREVIOUS 4 WEEKS"}
                          </span>
                          <h3 className="text-xs uppercase tracking-wide font-black text-brand-charcoal">
                            {isSr ? "AKTIVNOST MREŽE" : "NETWORK ACTIVITY"}
                          </h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                        <div className="bg-[#FAF9F5] border border-[#2D3025]/5 rounded-2xl p-3.5 space-y-1">
                          <span className="text-2xl font-serif font-black text-brand-charcoal">
                            24
                          </span>
                          <span className="text-[9px] text-brand-charcoal/50 uppercase tracking-tight block font-mono">
                            {isSr ? "Novi upiti" : "New Inquiries"}
                          </span>
                        </div>
                        <div className="bg-[#FAF9F5] border border-[#2D3025]/5 rounded-2xl p-3.5 space-y-1">
                          <span className="text-2xl font-serif font-black text-[#8A1F1F]">
                            112
                          </span>
                          <span className="text-[9px] text-brand-charcoal/50 uppercase tracking-tight block font-mono">
                            {isSr ? "Dogovoreno" : "Arranged"}
                          </span>
                        </div>
                        <div className="bg-[#FAF9F5] border border-[#2D3025]/5 rounded-2xl p-3.5 space-y-1">
                          <span className="text-2xl font-serif font-black text-emerald-700">
                            8
                          </span>
                          <span className="text-[9px] text-brand-charcoal/50 uppercase tracking-tight block font-mono">
                            {isSr ? "Aktivno" : "Active"}
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
                            {isSr
                              ? "BEZBEDAN RADNI PROSTOR"
                              : "SECURE WORKSPACE"}
                          </span>
                          <h3 className="text-xs uppercase tracking-wide font-black text-brand-charcoal">
                            {isSr
                              ? "PRIJAVA NA PARTNERSKI PORTAL"
                              : "PARTNER WORKSPACE LOGIN"}
                          </h3>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest font-black text-[#2D3025]/40 block">
                            {isSr
                              ? "KOD PARTNERA"
                              : "KOD PARTNERA (PARTNER CODE)"}
                          </label>
                          <input
                            type="text"
                            placeholder="npr. UNO1"
                            value={partnerCodeInput}
                            onChange={(e) => {
                              setPartnerCodeInput(e.target.value.toUpperCase());
                              triggerHaptic(8);
                            }}
                            className="w-full text-center tracking-widest text-sm font-mono font-bold h-11 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-xl text-brand-charcoal focus:ring-1 focus:ring-brand-charcoal/20 focus:outline-none uppercase"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest font-black text-[#2D3025]/40 block">
                            {isSr
                              ? "TAJNI PIN PARTNERA"
                              : "PARTNERSKI PIN (SECRET PIN)"}
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            placeholder="••••"
                            value={pinInput}
                            onChange={(e) => {
                              setPinInput(e.target.value.replace(/\D/g, ""));
                              triggerHaptic(8);
                            }}
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
                            disabled={
                              !(
                                (partnerCodeInput.trim().length > 0 &&
                                  pinInput.length === 4) ||
                                pinInput === pin9999 ||
                                pinInput === pin8888
                              )
                            }
                            className={`w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              (partnerCodeInput.trim().length > 0 &&
                                pinInput.length === 4) ||
                              pinInput === pin9999 ||
                              pinInput === pin8888
                                ? "bg-[#8A1F1F] text-white hover:bg-[#8A1F1F]/95 shadow-sm"
                                : "bg-[#2D3025]/5 text-brand-charcoal/25 cursor-not-allowed"
                            }`}
                          >
                            <Unlock size={13} />{" "}
                            {isSr
                              ? "Otvori lični radni prostor"
                              : "Open Personal Workspace"}
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
                        <Lock size={12} />{" "}
                        {isSr
                          ? "Zaključaj pristup mreži / Izađi"
                          : "Lock Network Access / Exit"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* ========================= 1. ADMIN/OWNER CORE VIEW ======================= */}
            {/* ========================================================================= */}
            {portalRole === "admin" && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center bg-brand-charcoal p-4 rounded-[24px] text-white">
                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase tracking-wider font-mono text-amber-400">
                      ADMIN CONTROL CENTRE
                    </span>
                    <h2 className="text-sm font-black uppercase tracking-wide">
                      IDEMO Network Governance
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic(10);
                      setPortalRole("guest");
                    }}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-bold uppercase"
                  >
                    Log Out
                  </button>
                </div>

                {/* Ecosystem Stats Card */}
                <div className="grid grid-cols-2 gap-2 bg-white border border-[#2D3025]/10 p-4 rounded-[24px]">
                  <div className="p-3 bg-[#FAF9F5] rounded-xl space-y-1">
                    <span className="text-[7.5px] text-brand-charcoal/40 font-mono font-bold uppercase block">
                      Ecosystem Status
                    </span>
                    <p className="text-base font-serif font-black text-brand-charcoal">
                      30 Core Partners
                    </p>
                    <p className="text-[8px] text-brand-charcoal/50 font-mono font-bold uppercase leading-none">
                      10 Guides • 3 Med • 10 Transport • 7 Open
                    </p>
                  </div>
                  <div className="p-3 bg-[#FAF9F5] rounded-xl space-y-1">
                    <span className="text-[7.5px] text-brand-charcoal/40 font-mono font-bold uppercase block">
                      Portfolio Quality
                    </span>
                    <p className="text-base font-serif font-black text-brand-charcoal">
                      97.8% Reliability
                    </p>
                    <p className="text-[8px] text-brand-charcoal/50 font-mono font-bold uppercase leading-none">
                      Across {inquiries.length} Inquiries Routed
                    </p>
                  </div>
                </div>

                {/* Onboarding Panel */}
                <div className="bg-white border border-[#2D3025]/10 rounded-[28px] p-5 space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-[#2D3025]/5 pb-3">
                    <Plus size={14} className="text-amber-600" />
                    <h3 className="text-xs uppercase tracking-widest font-black">
                      Onboard Partner / Reserved Slot
                    </h3>
                  </div>

                  <form
                    onSubmit={handleOnboardPartner}
                    className="space-y-3.5 text-left"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase tracking-wider font-black block">
                          Partner Brand Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Belgrade Bike Guild"
                          value={onboardForm.name}
                          onChange={(e) =>
                            setOnboardForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full text-xs p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase tracking-wider font-black block">
                          Core Category
                        </label>
                        <select
                          value={onboardForm.category}
                          onChange={(e) =>
                            setOnboardForm((prev) => ({
                              ...prev,
                              category: e.target.value,
                            }))
                          }
                          className="w-full text-xs p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl appearance-none"
                        >
                          <option value="Tourist Guide">Tourist Guide</option>
                          <option value="Medical/Wellbeing">
                            Medical/Wellbeing
                          </option>
                          <option value="Limousine/Transport">
                            Limousine/Transport
                          </option>
                          <option value="Open Slot">
                            Open Slot (Future Category)
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase tracking-wider font-black block">
                          Partner Access PIN
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 3011"
                          value={onboardForm.pin}
                          onChange={(e) =>
                            setOnboardForm((prev) => ({
                              ...prev,
                              pin: e.target.value,
                            }))
                          }
                          className="w-full text-xs p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase tracking-wider font-black block">
                          Geographic Coverage
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. National & Belgrade"
                          value={onboardForm.geography}
                          onChange={(e) =>
                            setOnboardForm((prev) => ({
                              ...prev,
                              geography: e.target.value,
                            }))
                          }
                          className="w-full text-xs p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full h-10 bg-brand-charcoal text-white text-[9px] font-black uppercase tracking-widest rounded-xl"
                    >
                      Register Controlled Partner Slot
                    </button>
                  </form>
                </div>

                {/* Active Portfolio Extension requests */}
                <div className="bg-white border border-[#2D3025]/10 rounded-[28px] p-5 space-y-4 text-left">
                  <div className="flex items-center gap-1.5 border-b border-[#2D3025]/5 pb-3">
                    <Award size={14} className="text-amber-600" />
                    <h3 className="text-xs uppercase tracking-widest font-black">
                      Partner Portfolio Requests
                    </h3>
                  </div>
                  {interestRequests.length === 0 ? (
                    <p className="text-[10px] text-brand-charcoal/45 italic py-1">
                      No active partner extension requests currently pending.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {interestRequests.map((req, idx) => (
                        <div
                          key={idx}
                          className="bg-[#FAF9F5] border border-[#2D3025]/5 p-3 rounded-xl flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-black text-brand-charcoal">
                              {req.partnerName}
                            </p>
                            <p className="text-[8.5px] font-mono font-bold text-amber-700 uppercase">
                              Requests Assignment to: {req.recTitle} (ID{" "}
                              {req.recId})
                            </p>
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
                    <h3 className="text-xs uppercase tracking-widest font-black">
                      Live Automated Dispatch Pipeline
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#2D3025]/5">
                      <span className="text-[9px] font-mono uppercase text-brand-charcoal/50 block font-bold">
                        Unmatched
                      </span>
                      <span className="text-xl font-bold font-serif text-amber-800">
                        {
                          inquiries.filter((i) => i.status === "Unmatched")
                            .length
                        }
                      </span>
                    </div>
                    <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#2D3025]/5">
                      <span className="text-[9px] font-mono uppercase text-brand-charcoal/50 block font-bold">
                        Dispatch Stage 1
                      </span>
                      <span className="text-xl font-bold font-serif text-[#8A1F1F]">
                        {
                          inquiries.filter(
                            (i) => i.status === "Dispatched Stage 1",
                          ).length
                        }
                      </span>
                    </div>
                    <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#2D3025]/5">
                      <span className="text-[9px] font-mono uppercase text-brand-charcoal/50 block font-bold">
                        Dispatch Stage 2
                      </span>
                      <span className="text-xl font-bold font-serif text-[#006666]">
                        {
                          inquiries.filter(
                            (i) => i.status === "Dispatched Stage 2",
                          ).length
                        }
                      </span>
                    </div>
                    <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#2D3025]/5">
                      <span className="text-[9px] font-mono uppercase text-brand-charcoal/50 block font-bold">
                        Locked / Accepted
                      </span>
                      <span className="text-xl font-bold font-serif text-emerald-700">
                        {
                          inquiries.filter(
                            (i) => i.status === "Locked / Accepted",
                          ).length
                        }
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-500/10 text-[9.5px] leading-relaxed text-amber-900 font-mono">
                    <strong>SYSTEM LOG:</strong> Normal inquiry flows are
                    auto-matched by Geography, Language, Budget, and Capability
                    constraints. Standard routing rules execute instant Stage 1
                    alerts, with progressive fallback to Stage 2 after 15
                    minutes. The Concierge intervenes manually only for
                    exception escalations or manual overrides.
                  </div>
                </div>

                {/* Partner Registry */}
                <div className="bg-white border border-[#2D3025]/10 rounded-[28px] p-5 space-y-4 text-left">
                  <h3 className="text-xs uppercase tracking-widest font-black">
                    Controlled Partner Registry
                  </h3>
                  <div className="space-y-3">
                    {partnersList.map((p) => (
                      <div
                        key={p.id}
                        className="border-b border-[#2D3025]/5 pb-3.5 last:border-0 last:pb-0 space-y-2.5"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-serif font-black text-brand-charcoal leading-tight flex items-center gap-1">
                              {p.name}
                              {p.status === "Trusted" && (
                                <ShieldCheck
                                  size={11}
                                  className="text-amber-600 shrink-0"
                                />
                              )}
                            </h4>
                            <p className="text-[8.5px] font-mono text-brand-charcoal/50 leading-none">
                              ID:{" "}
                              <strong className="text-[#2D3025]">
                                {p.id.toUpperCase()}
                              </strong>{" "}
                              • {p.category}
                            </p>
                          </div>
                          <span
                            className={`text-[7px] font-mono font-black uppercase px-2 py-0.5 rounded leading-none ${
                              p.status === "Trusted"
                                ? "bg-amber-100 text-amber-800"
                                : p.status === "Active"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-[#FAF9F5] text-brand-charcoal/60"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>

                        {/* Interactive Milestone Adjuster */}
                        <div className="flex items-center gap-1.5 text-[8.5px] font-mono">
                          <span className="text-brand-charcoal/40 font-bold uppercase">
                            IDENTITY STANDING:
                          </span>
                          {[
                            "Validated",
                            "Active",
                            "Trusted",
                            "Expanded Portfolio",
                          ].map((lvl: any) => (
                            <button
                              key={lvl}
                              onClick={() => togglePartnerStatus(p.id, lvl)}
                              className={`px-1.5 py-0.5 rounded border transition-colors ${p.status === lvl ? "bg-brand-charcoal text-white border-transparent" : "bg-[#FAF9F5] text-brand-charcoal/50 hover:bg-[#EAEAEA]"}`}
                            >
                              {lvl.split(" ")[0]}
                            </button>
                          ))}
                        </div>

                        {/* Recommendation Portfolio Assignments */}
                        <div className="space-y-1">
                          <span className="text-[8.5px] uppercase font-mono font-black text-brand-charcoal/40">
                            Portfolio Recommendations:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {RECOMMENDATIONS_LOOKUP.map((rec) => {
                              const isAssigned = p.assignedRecs.includes(
                                rec.id,
                              );
                              return (
                                <button
                                  key={rec.id}
                                  onClick={() =>
                                    toggleRecommendationAssignment(p.id, rec.id)
                                  }
                                  className={`px-2 py-1 rounded text-[8px] font-mono flex items-center gap-1 transition-all ${
                                    isAssigned
                                      ? "bg-amber-500/15 text-amber-800 font-bold border border-amber-500/20"
                                      : "bg-[#FAF9F5] text-brand-charcoal/40 border border-[#2D3025]/5 hover:bg-[#EAEAEA]"
                                  }`}
                                >
                                  {isAssigned ? "✓" : "+"} {rec.title}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Info grid */}
                        <div className="grid grid-cols-3 gap-2 bg-[#FAF9F5] p-2 rounded-xl text-[8.5px] font-mono text-[#2D3025]/60">
                          <div>
                            <p className="font-bold uppercase text-[7px] text-brand-charcoal/30 leading-none">
                              Reliability
                            </p>
                            <p className="font-black text-brand-charcoal mt-0.5">
                              {p.reliability}%
                            </p>
                          </div>
                          <div>
                            <p className="font-bold uppercase text-[7px] text-brand-charcoal/30 leading-none">
                              Contributions
                            </p>
                            <p className="font-black text-brand-charcoal mt-0.5">
                              {p.contributions} inq
                            </p>
                          </div>
                          <div>
                            <p className="font-bold uppercase text-[7px] text-brand-charcoal/30 leading-none">
                              Expanded Eligibility
                            </p>
                            <p
                              className={`font-black mt-0.5 ${p.eligibility ? "text-emerald-700" : "text-accent-red"}`}
                            >
                              {p.eligibility ? "ELIGIBLE" : "LOCKED"}
                            </p>
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
            {portalRole === "concierge" && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center bg-[#0C302F] p-4 rounded-[24px] text-white">
                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase tracking-wider font-mono text-[#4FC2BE]">
                      CONCIERGE OPERATIONS
                    </span>
                    <h2 className="text-sm font-black uppercase tracking-wide">
                      IDEMO Route Coordinator
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic(10);
                      setPortalRole("guest");
                    }}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-bold uppercase"
                  >
                    Log Out
                  </button>
                </div>

                {/* Inquiry Creator */}
                <div className="bg-white border border-[#2D3025]/10 rounded-[28px] p-5 space-y-4 text-left">
                  <div className="flex items-center gap-1.5 border-b border-[#2D3025]/5 pb-3">
                    <Plus size={14} className="text-[#006666]" />
                    <h3 className="text-xs uppercase tracking-widest font-black">
                      Construct Outbound Inquiry Card
                    </h3>
                  </div>

                  <form onSubmit={handleCreateInquiry} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase tracking-wider font-black block">
                        Traveler / Visitor Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. John Doe"
                        value={inquiryForm.visitorName}
                        onChange={(e) =>
                          setInquiryForm((prev) => ({
                            ...prev,
                            visitorName: e.target.value,
                          }))
                        }
                        className="w-full text-xs p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase tracking-wider font-black block">
                          Linked IDEMO Recommendation
                        </label>
                        <select
                          value={inquiryForm.selectedRecId}
                          onChange={(e) => {
                            const val = e.target.value;
                            // Auto select first partner assigned to this recommendation
                            const matchingPartner = partnersList.find((p) =>
                              p.assignedRecs.includes(val),
                            );
                            setInquiryForm((prev) => ({
                              ...prev,
                              selectedRecId: val,
                              selectedPartnerId: matchingPartner
                                ? matchingPartner.id
                                : partnersList[0].id,
                            }));
                          }}
                          className="w-full text-xs p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl appearance-none"
                        >
                          {RECOMMENDATIONS_LOOKUP.map((r) => (
                            <option key={r.id} value={r.id}>
                              [{r.category}] {r.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] uppercase tracking-wider font-black block">
                          Assign Partner
                        </label>
                        <select
                          value={inquiryForm.selectedPartnerId}
                          onChange={(e) =>
                            setInquiryForm((prev) => ({
                              ...prev,
                              selectedPartnerId: e.target.value,
                            }))
                          }
                          className="w-full text-xs p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl appearance-none"
                        >
                          {partnersList.map((p) => {
                            const isAssigned = p.assignedRecs.includes(
                              inquiryForm.selectedRecId,
                            );
                            return (
                              <option key={p.id} value={p.id}>
                                {isAssigned ? "⭐ " : ""}
                                {p.name}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] uppercase tracking-wider font-black block">
                        Traveler Query Detail
                      </label>
                      <textarea
                        rows={2.5}
                        placeholder="Describe what the traveler needs..."
                        value={inquiryForm.queryText}
                        onChange={(e) =>
                          setInquiryForm((prev) => ({
                            ...prev,
                            queryText: e.target.value,
                          }))
                        }
                        className="w-full text-xs p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-10 bg-[#0C302F] text-white text-[9px] font-black uppercase tracking-widest rounded-xl"
                    >
                      Generate Inquiry Card & Lock Routing
                    </button>
                  </form>
                </div>

                {/* Inquiries Queue */}
                <div className="bg-white border border-[#2D3025]/10 rounded-[28px] p-5 space-y-4 text-left">
                  <h3 className="text-xs uppercase tracking-widest font-black">
                    Live Routing Queue
                  </h3>
                  <div className="space-y-4">
                    {inquiries.map((inq) => {
                      const matchedPartner =
                        partnersList.find((p) => p.id === inq.partnerId) ||
                        partnersList[0];
                      return (
                        <div
                          key={inq.id}
                          className="border border-[#2D3025]/10 bg-[#FAF9F5]/30 rounded-xl p-4 space-y-3 relative"
                        >
                          <span className="absolute right-4 top-4 text-[8px] font-mono text-brand-charcoal/30">
                            {inq.id}
                          </span>

                          <div className="space-y-0.5">
                            <p className="text-xs font-serif font-black text-brand-charcoal">
                              Traveler: {inq.visitorName}
                            </p>
                            <p className="text-[8.5px] font-mono text-brand-charcoal/50 leading-none">
                              Recommendation:{" "}
                              <strong className="text-brand-charcoal">
                                {inq.recTitle}
                              </strong>{" "}
                              • Assigned Partner:{" "}
                              <strong className="text-[#006666]">
                                {inq.partnerName}
                              </strong>
                            </p>
                          </div>

                          <div className="p-3 bg-white border border-[#2D3025]/5 rounded-xl text-[10.5px] leading-relaxed italic text-brand-charcoal/80">
                            "{inq.query}"
                          </div>

                          {/* Status controllers */}
                          <div className="flex items-center gap-1.5 text-[8.5px] font-mono flex-wrap">
                            <span className="text-brand-charcoal/45 font-bold uppercase shrink-0">
                              STATUS:
                            </span>
                            {[
                              "new",
                              "sent",
                              "awaiting",
                              "answered",
                              "resolved",
                              "expired",
                            ].map((st) => (
                              <button
                                key={st}
                                onClick={() =>
                                  handleUpdateInquiryStatus(inq.id, st)
                                }
                                className={`px-1.5 py-0.5 rounded uppercase font-black leading-none ${inq.status === st ? "bg-[#006666] text-white" : "bg-white border text-[#2D3025]/50"}`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>

                          {/* Outbound Whatsapp / Instagram / Viber copy forwarded */}
                          <div className="space-y-2 pt-2 border-t border-[#2D3025]/5">
                            <p className="text-[8.5px] uppercase font-mono font-black text-brand-charcoal/40">
                              Prepare Dispatch & Deep Links:
                            </p>
                            <div className="grid grid-cols-3 gap-1.5 text-[8.5px] font-mono font-black">
                              <a
                                href={`https://wa.me/${matchedPartner.contactPhone.replace(/\D/g, "")}?text=${encodeURIComponent(getOutboundCopyText(inq, matchedPartner))}`}
                                target="_blank"
                                referrerPolicy="no-referrer"
                                rel="noreferrer"
                                onClick={() => {
                                  triggerHaptic(8);
                                  handleUpdateInquiryStatus(inq.id, "sent");
                                }}
                                className="h-8 bg-emerald-50 text-emerald-800 border border-emerald-500/20 rounded-lg flex items-center justify-center gap-1 uppercase"
                              >
                                <MessageCircle size={10} /> WhatsApp
                              </a>
                              <a
                                href={`viber://forward?text=${encodeURIComponent(getOutboundCopyText(inq, matchedPartner))}`}
                                onClick={() => {
                                  triggerHaptic(8);
                                  handleUpdateInquiryStatus(inq.id, "sent");
                                }}
                                className="h-8 bg-indigo-50 text-indigo-800 border border-indigo-500/20 rounded-lg flex items-center justify-center gap-1 uppercase"
                              >
                                <Send size={10} /> Viber
                              </a>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    getOutboundCopyText(inq, matchedPartner),
                                  );
                                  triggerHaptic(15);
                                  handleUpdateInquiryStatus(inq.id, "sent");
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
                              <span className="text-[8.5px] font-mono uppercase font-black text-emerald-700">
                                Recorded Partner Replies:
                              </span>
                              {inq.replies.map((rep, idx) => (
                                <p
                                  key={idx}
                                  className="text-[10px] bg-emerald-500/5 text-emerald-900 border border-emerald-500/10 rounded-lg p-2 leading-relaxed"
                                >
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
                                  onChange={(e) =>
                                    setNewReplyText(e.target.value)
                                  }
                                  className="w-full p-2 bg-white border border-[#2D3025]/10 rounded-lg text-xs"
                                  rows={2}
                                />
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() =>
                                      setActiveInquiryIdForReply(null)
                                    }
                                    className="px-3 h-7 bg-transparent border text-brand-charcoal text-[9px] font-black uppercase rounded-lg"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveReply(inq.id)}
                                    className="px-3 h-7 bg-[#006666] text-white text-[9px] font-black uppercase rounded-lg"
                                  >
                                    Record Reply & Resolve
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  triggerHaptic(10);
                                  setActiveInquiryIdForReply(inq.id);
                                }}
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
                    <h3 className="text-xs uppercase tracking-widest font-black text-[#006666]">
                      Automated Dispatch Orchestration Guide
                    </h3>
                  </div>

                  <div className="space-y-3 text-[10.5px] leading-relaxed text-brand-charcoal/80">
                    <p>
                      As an IDEMO Concierge, your manual effort is reserved for
                      high-value upstream curation and exception handling.
                      Normal traveler inquiries are matched and dispatched
                      automatically using the 8-state live lifecycle machine:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1.5 font-mono text-[9px]">
                      <div className="bg-white p-2.5 rounded-lg border border-[#0C302F]/5 space-y-1">
                        <span className="font-bold text-[#006666]">
                          1. Unmatched
                        </span>
                        <p className="text-brand-charcoal/60">
                          No local partners satisfies core criteria. Handled as
                          exceptional custom-routed inquiry.
                        </p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-[#0C302F]/5 space-y-1">
                        <span className="font-bold text-[#006666]">
                          2. Dispatched Stage 1
                        </span>
                        <p className="text-brand-charcoal/60">
                          Top 3 qualified, active partners are notified
                          immediately. First-accept locks booking.
                        </p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-[#0C302F]/5 space-y-1">
                        <span className="font-bold text-[#006666]">
                          3. Dispatched Stage 2
                        </span>
                        <p className="text-brand-charcoal/60">
                          Secondary/fallback qualified partners are notified
                          after 15 minutes of silent queue.
                        </p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-[#0C302F]/5 space-y-1">
                        <span className="font-bold text-[#006666]">
                          4. Locked / Accepted
                        </span>
                        <p className="text-brand-charcoal/60">
                          First responsive partner accepts the inquiry,
                          immediately locking out competitors.
                        </p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-[#0C302F]/5 space-y-1">
                        <span className="font-bold text-[#006666]">
                          5. Alternative Proposed
                        </span>
                        <p className="text-brand-charcoal/60">
                          Partner accepts but offers an alternative
                          scheduling/date. Concierge review advised.
                        </p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-[#0C302F]/5 space-y-1">
                        <span className="font-bold text-[#006666]">
                          6. Answered / Completed
                        </span>
                        <p className="text-brand-charcoal/60">
                          Partner has finalized draft reply. Concierge transmits
                          answer to the traveler.
                        </p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-[#0C302F]/5 space-y-1">
                        <span className="font-bold text-[#006666]">
                          7. Released
                        </span>
                        <p className="text-brand-charcoal/60">
                          Assigned partner has released inquiry back to matching
                          pool with a documented reason.
                        </p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-[#0C302F]/5 space-y-1">
                        <span className="font-bold text-[#006666]">
                          8. Closed
                        </span>
                        <p className="text-brand-charcoal/60">
                          The traveler journey is finalized and archived. No
                          further answers permitted.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ========================= 3. PARTNER RESTRICTED VIEW ===================== */}
            {/* ========================================================================= */}
            {portalRole === "partner" &&
              (() => {
                if (!currentSimulatedPartner) {
                  return (
                    <div className="bg-white border border-[#2D3025]/10 rounded-[32px] p-8 text-center space-y-4 max-w-md mx-auto my-6 animate-fade-in text-left">
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertCircle size={18} />
                        <span className="text-xs font-mono font-bold uppercase tracking-wider">
                          {isSr
                            ? "Profil partnera nije pronađen"
                            : "Partner Profile Not Found"}
                        </span>
                      </div>
                      <p className="text-xs text-brand-charcoal/70 leading-relaxed">
                        {isSr
                          ? "Profil za izabrani nalog nije učitan. Molimo prijavite se ponovo."
                          : "Profile data for this account could not be located. Please sign in again."}
                      </p>
                      <button
                        onClick={handlePartnerLogout}
                        className="w-full h-10 bg-brand-charcoal text-white text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer"
                      >
                        {isSr ? "Nazad na prijavu" : "Return to Login"}
                      </button>
                    </div>
                  );
                }

                const capabilityCards = [
                  {
                    key: "languages",
                    title: "Languages",
                    icon: Globe,
                    items: LANGUAGES_CATALOGUE,
                    isLanguage: true,
                    approvedCheck: (item) =>
                      currentSimulatedPartner.languages.includes(item),
                    pendingCheck: (item) =>
                      interestRequests.some(
                        (r) =>
                          r.partnerId === currentSimulatedPartner.id &&
                          r.recId === `lang-${item}`,
                      ),
                    itemLabel: (item) => item,
                  },
                  {
                    key: "knowledge",
                    title: "Knowledge",
                    icon: Award,
                    items: KNOWLEDGE_CATALOGUE,
                    isLanguage: false,
                    approvedCheck: (item) =>
                      currentSimulatedPartner.capabilities.includes(item),
                    pendingCheck: (item) =>
                      interestRequests.some(
                        (r) =>
                          r.partnerId === currentSimulatedPartner.id &&
                          r.recId === `cap-${item}`,
                      ),
                    itemLabel: (item) => item,
                  },
                  {
                    key: "experiences",
                    title: "Experiences",
                    icon: Sparkles,
                    items: EXPERIENCES_CATALOGUE,
                    isLanguage: false,
                    approvedCheck: (item) =>
                      currentSimulatedPartner.capabilities.includes(item),
                    pendingCheck: (item) =>
                      interestRequests.some(
                        (r) =>
                          r.partnerId === currentSimulatedPartner.id &&
                          r.recId === `cap-${item}`,
                      ),
                    itemLabel: (item) => item,
                  },
                  {
                    key: "services",
                    title: "Services",
                    icon: Briefcase,
                    items: SERVICES_CATALOGUE,
                    isLanguage: false,
                    approvedCheck: (item) =>
                      currentSimulatedPartner.capabilities.includes(item),
                    pendingCheck: (item) =>
                      interestRequests.some(
                        (r) =>
                          r.partnerId === currentSimulatedPartner.id &&
                          r.recId === `cap-${item}`,
                      ),
                    itemLabel: (item) => item,
                  },
                  {
                    key: "qualifications",
                    title: "Professional Credentials",
                    icon: ShieldCheck,
                    items: QUALIFICATIONS_CATALOGUE,
                    isLanguage: false,
                    approvedCheck: (item) =>
                      currentSimulatedPartner.capabilities.includes(item),
                    pendingCheck: (item) =>
                      interestRequests.some(
                        (r) =>
                          r.partnerId === currentSimulatedPartner.id &&
                          r.recId === `cap-${item}`,
                      ),
                    itemLabel: (item) => item,
                  },
                ];

                const assignedInquiries = inquiries.filter(
                  (inq) => inq.partnerId === currentSimulatedPartner.id,
                );
                const currentMessages = getMessagesForPartner(
                  currentSimulatedPartner.id,
                );

                return (
                  <div className="space-y-6 animate-fade-in max-w-xl mx-auto pb-12">
                    {/* HEADER */}
                    <div className="flex justify-between items-center bg-brand-charcoal px-6 py-4 rounded-[24px] text-white">
                      <div className="space-y-0.5 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[8px] uppercase tracking-widest font-mono text-amber-400 font-bold block">
                            PARTNER PASSPORT WORKSPACE
                          </span>
                          {(currentSimulatedPartner.isDemo ||
                            currentSimulatedPartner.id === "UNO1" ||
                            currentSimulatedPartner.id === "UNO2") && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8.5px] font-mono tracking-wider font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Sparkles className="w-2.5 h-2.5 shrink-0" />
                              DEMONSTRATION ACCOUNT
                            </span>
                          )}
                        </div>
                        <h2 className="text-sm font-serif font-black">
                          {currentSimulatedPartner.name}
                        </h2>
                      </div>
                      <button
                        onClick={handlePartnerLogout}
                        className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-colors shrink-0"
                      >
                        Exit Session
                      </button>
                    </div>

                    {/* CARD 1: MY PARTNER PROFILE */}
                    <div className="bg-white border border-[#2D3025]/10 rounded-[32px] p-6 shadow-sm text-left space-y-5">
                      <div className="flex items-center gap-2 border-b border-[#2D3025]/5 pb-3">
                        <span className="p-1.5 rounded-lg bg-[#8A1F1F]/5 text-[#8A1F1F]">
                          <ShieldCheck size={14} />
                        </span>
                        <div className="space-y-0.5">
                          <span className="text-[8px] uppercase tracking-widest font-mono text-brand-charcoal/40 font-bold block">
                            Ecosystem Portfolio
                          </span>
                          <h3 className="text-xs uppercase tracking-wide font-black text-brand-charcoal">
                            MY PARTNER PROFILE
                          </h3>
                        </div>
                      </div>

                      {/* Progress Bar & Completeness */}
                      <div className="space-y-2 bg-[#FAF9F5] border border-[#2D3025]/5 p-4 rounded-2xl">
                        <div className="flex justify-between items-center">
                          <span className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-brand-charcoal/50">
                            Portfolio Completeness
                          </span>
                          <span className="text-xs font-mono font-black text-[#8A1F1F]">
                            {portfolioMetrics.completenessPercentage}%
                          </span>
                        </div>
                        {/* Progress Grid Segment (10 segments) */}
                        <div className="grid grid-cols-10 gap-1 h-2">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-full rounded-sm transition-all duration-500 ${
                                i < portfolioMetrics.completenessSegments
                                  ? "bg-[#8A1F1F]"
                                  : "bg-[#2D3025]/5"
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
                          <span
                            className={`text-[8.5px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                              passportReviewStatus === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : passportReviewStatus === "pending_review"
                                  ? "bg-amber-100 text-amber-800"
                                  : passportReviewStatus === "changes_requested"
                                    ? "bg-red-100 text-red-800"
                                    : passportReviewStatus === "withdrawn"
                                      ? "bg-neutral-300 text-neutral-800"
                                      : "bg-neutral-200 text-neutral-700"
                            }`}
                          >
                            {passportReviewStatus === "approved"
                              ? "Approved & Live"
                              : passportReviewStatus === "pending_review"
                                ? "Under Review"
                                : passportReviewStatus === "changes_requested"
                                  ? "Changes Requested"
                                  : passportReviewStatus === "withdrawn"
                                    ? "Withdrawn"
                                    : "Draft"}
                          </span>
                        </div>

                        <p className="text-[11px] text-brand-charcoal/70 leading-relaxed">
                          Provide a brief professional introduction (max 200
                          words) and an optional photo. Once approved by IDEMO
                          editorial review, this will be displayed to visitors
                          when you accept an inquiry.
                        </p>

                        {/* Word Counter & Textarea */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[9px] font-mono text-brand-charcoal/50">
                            <label className="uppercase font-bold">
                              Introduction Text (Plain Text Only)
                            </label>
                            <span
                              className={`font-bold ${
                                (passportIntroDraft.trim()
                                  ? passportIntroDraft.trim().split(/\s+/)
                                      .length
                                  : 0) > 200
                                  ? "text-red-600"
                                  : "text-brand-charcoal"
                              }`}
                            >
                              {passportIntroDraft.trim()
                                ? passportIntroDraft.trim().split(/\s+/).length
                                : 0}{" "}
                              / 200 words
                            </span>
                          </div>
                          <textarea
                            rows={4}
                            placeholder="e.g. Licensed professional guide with over 10 years of experience in Serbia's cultural heritage, natural meanders, and bespoke gastronomy tours across Belgrade..."
                            value={passportIntroDraft}
                            onChange={(e) =>
                              setPassportIntroDraft(e.target.value)
                            }
                            className="w-full p-3 bg-white border border-[#2D3025]/15 rounded-xl text-xs text-brand-charcoal focus:ring-1 focus:ring-[#8A1F1F] focus:outline-none"
                          />
                        </div>

                        {/* Photo Consent & Selector */}
                        <div className="space-y-2 pt-1 border-t border-[#2D3025]/5">
                          <label className="flex items-start gap-2 text-xs text-brand-charcoal/80 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={passportPhotoConsent}
                              onChange={(e) =>
                                setPassportPhotoConsent(e.target.checked)
                              }
                              className="mt-0.5 rounded border-[#2D3025]/20 text-[#8A1F1F] focus:ring-[#8A1F1F]"
                            />
                            <span className="text-[10px] leading-snug">
                              I consent to IDEMO processing and displaying my
                              professional profile photo for verified visitor
                              introductions upon inquiry acceptance.
                            </span>
                          </label>

                          <div className="flex items-center gap-3 pt-1">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              id="passport-photo-input"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                  setPassportMsg({
                                    type: "error",
                                    text: "Photo size must not exceed 5 MB.",
                                  });
                                  return;
                                }
                                setPassportSaving(true);
                                const authRes = await authorizePhotoUpload(
                                  file.name,
                                  file.type,
                                  file.size,
                                );
                                if (authRes.success && authRes.path) {
                                  setPassportPhotoPath(authRes.path);
                                  setPassportPhotoMime(
                                    authRes.mime_type || file.type,
                                  );
                                  setPassportMsg({
                                    type: "success",
                                    text: "Photo uploaded for draft review.",
                                  });
                                } else {
                                  setPassportMsg({
                                    type: "error",
                                    text:
                                      authRes.error ||
                                      "Failed to authorize photo upload.",
                                  });
                                }
                                setPassportSaving(false);
                              }}
                            />
                            <label
                              htmlFor="passport-photo-input"
                              className="px-3 py-1.5 bg-white border border-[#2D3025]/20 rounded-lg text-[10px] font-mono font-bold uppercase text-brand-charcoal hover:bg-neutral-50 cursor-pointer transition-colors"
                            >
                              {passportPhotoPath
                                ? "Change Professional Photo"
                                : "Select Professional Photo (JPG/PNG)"}
                            </label>
                            {passportPhotoPath && (
                              <span className="text-[10px] font-mono text-emerald-700 font-bold">
                                ✓ Photo Attached
                              </span>
                            )}
                          </div>
                        </div>

                        {passportMsg && (
                          <div
                            className={`p-2.5 rounded-lg text-xs font-mono font-medium ${
                              passportMsg.type === "success"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : passportMsg.type === "error"
                                  ? "bg-red-50 text-red-800 border border-red-200"
                                  : "bg-blue-50 text-blue-800"
                            }`}
                          >
                            {passportMsg.text}
                          </div>
                        )}

                        {passportReviewNote && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-mono text-amber-900">
                            <strong>Editorial Reviewer Note:</strong>{" "}
                            {passportReviewNote}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2D3025]/5">
                          <button
                            type="button"
                            disabled={passportSaving}
                            onClick={async () => {
                              setPassportSaving(true);
                              setPassportMsg(null);
                              const res = await savePartnerProfileDraft(
                                passportIntroDraft,
                                passportPhotoPath,
                                passportPhotoMime,
                                passportPhotoConsent,
                              );
                              setPassportSaving(false);
                              if (res.success) {
                                setPassportReviewStatus("draft");
                                setPassportMsg({
                                  type: "success",
                                  text: "Passport draft saved successfully.",
                                });
                              } else {
                                setPassportMsg({
                                  type: "error",
                                  text: res.error || "Failed to save draft.",
                                });
                              }
                            }}
                            className="px-3.5 py-2 bg-white border border-[#2D3025]/20 hover:bg-neutral-50 text-brand-charcoal text-[10px] font-mono font-bold uppercase rounded-xl transition-colors cursor-pointer"
                          >
                            Save Draft
                          </button>

                          <button
                            type="button"
                            disabled={
                              passportSaving ||
                              (passportIntroDraft.trim()
                                ? passportIntroDraft.trim().split(/\s+/).length
                                : 0) > 200
                            }
                            onClick={async () => {
                              setPassportSaving(true);
                              setPassportMsg(null);
                              // First save draft
                              await savePartnerProfileDraft(
                                passportIntroDraft,
                                passportPhotoPath,
                                passportPhotoMime,
                                passportPhotoConsent,
                              );
                              // Submit
                              const subRes = await submitPartnerProfile();
                              setPassportSaving(false);
                              if (subRes.success) {
                                setPassportReviewStatus("pending_review");
                                setPassportMsg({
                                  type: "success",
                                  text: "Submitted for IDEMO Editorial Review.",
                                });
                              } else {
                                setPassportMsg({
                                  type: "error",
                                  text: subRes.error || "Failed to submit.",
                                });
                              }
                            }}
                            className="px-3.5 py-2 bg-[#8A1F1F] text-white hover:bg-[#8A1F1F]/90 text-[10px] font-mono font-bold uppercase rounded-xl transition-colors cursor-pointer"
                          >
                            Submit For IDEMO Review
                          </button>
                        </div>
                      </div>

                      {/* Five Collapsible Cards */}
                      <div className="space-y-3 pt-1">
                        {capabilityCards.map((card) => {
                          const isExpanded = expandedCards[card.key];
                          const totalInGroup = card.items.length;
                          const approvedCount = card.items.filter((item) =>
                            card.approvedCheck(item),
                          ).length;

                          return (
                            <div
                              key={card.key}
                              className="border border-[#2D3025]/10 rounded-2xl overflow-hidden transition-all bg-[#FAF9F5]/40"
                            >
                              <div
                                onClick={() => {
                                  setExpandedCards((prev) => ({
                                    ...prev,
                                    [card.key]: !prev[card.key],
                                  }));
                                  triggerHaptic(8);
                                }}
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#FAF9F5] transition-colors select-none"
                              >
                                <div className="flex items-center gap-2.5">
                                  <card.icon
                                    size={14}
                                    className="text-brand-charcoal/60"
                                  />
                                  <span className="text-xs font-serif font-black text-brand-charcoal">
                                    {card.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-mono font-bold bg-[#2D3025]/5 px-2 py-0.5 rounded-full text-brand-charcoal/60">
                                    {approvedCount}/{totalInGroup} Approved
                                  </span>
                                  <ChevronRight
                                    size={14}
                                    className={`text-brand-charcoal/40 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                  />
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="p-4 bg-white border-t border-[#2D3025]/5 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in">
                                  {card.items.map((item) => {
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
                                              labelText: labelText,
                                            });
                                          }
                                        }}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all text-xs select-none ${
                                          isApproved
                                            ? "bg-emerald-50/40 border-emerald-500/10 text-emerald-900 cursor-default"
                                            : isPending
                                              ? "bg-amber-50/40 border-amber-500/10 text-amber-950 cursor-default"
                                              : "bg-white border-[#2D3025]/5 text-brand-charcoal/60 hover:bg-white/80 cursor-pointer hover:border-[#2D3025]/20 hover:text-brand-charcoal"
                                        }`}
                                      >
                                        <span
                                          className="font-semibold leading-tight truncate pr-2"
                                          title={labelText}
                                        >
                                          {labelText}
                                        </span>
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

                    {/* CARD 2: MY OPPORTUNITIES */}
                    <div className="bg-white border border-[#2D3025]/10 rounded-[32px] p-6 shadow-sm text-left space-y-4">
                      <div className="flex items-center gap-2 border-b border-[#2D3025]/5 pb-3">
                        <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                          <Briefcase size={14} />
                        </span>
                        <div className="space-y-0.5">
                          <span className="text-[8px] uppercase tracking-widest font-mono text-brand-charcoal/40 font-bold block">
                            Assigned Leads
                          </span>
                          <h3 className="text-xs uppercase tracking-wide font-black text-brand-charcoal">
                            {isSr ? "MOJE PRILIKE I UPITI" : "MY OPPORTUNITIES"}
                          </h3>
                        </div>
                      </div>

                      {assignedInquiries.length === 0 ? (
                        <div className="text-center py-8 text-brand-charcoal/40 text-[11px] font-mono">
                          {isSr
                            ? "Trenutno nema dodeljenih prilika."
                            : "No active opportunities currently assigned."}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {assignedInquiries.map((inq) => {
                            const isAccepted =
                              inq.status === "Locked / Accepted" ||
                              inq.status === "accepted";
                            const isAlternative =
                              inq.status === "Alternative Proposed" ||
                              inq.status === "proposed";
                            const isDeclined =
                              inq.status === "Released" ||
                              inq.status === "declined";
                            const isCompleted =
                              inq.status === "Answered / Completed";
                            const isPendingAction =
                              !isAccepted &&
                              !isAlternative &&
                              !isDeclined &&
                              !isCompleted;

                            const isAltFormOpen = altFormOpenId === inq.id;

                            return (
                              <div
                                key={inq.id}
                                className="border border-[#2D3025]/10 rounded-2xl p-4 bg-[#FAF9F5]/60 space-y-3 shadow-xs"
                              >
                                {/* Card Header */}
                                <div className="flex justify-between items-start gap-2">
                                  <div className="text-left">
                                    <h4 className="text-xs font-serif font-black text-brand-charcoal">
                                      {inq.visitorName}
                                    </h4>
                                    <p className="text-[9px] font-mono text-brand-charcoal/60 font-bold uppercase">
                                      {inq.recTitle}
                                    </p>
                                  </div>
                                  <span
                                    className={`text-[8.5px] font-mono font-bold uppercase px-2.5 py-1 rounded-md border ${
                                      isPendingAction
                                        ? "bg-amber-500/10 text-amber-900 border-amber-500/30 animate-pulse"
                                        : isAccepted
                                          ? "bg-emerald-500/10 text-emerald-900 border-emerald-500/30"
                                          : isAlternative
                                            ? "bg-[#8A1F1F]/10 text-[#8A1F1F] border-[#8A1F1F]/20"
                                            : isDeclined
                                              ? "bg-gray-200 text-gray-700 border-gray-300"
                                              : "bg-[#2D3025]/5 text-[#2D3025]/70 border-transparent"
                                    }`}
                                  >
                                    {isPendingAction
                                      ? isSr
                                        ? "Čeka Vaš odgovor"
                                        : "Awaiting Your Response"
                                      : isAccepted
                                        ? isSr
                                          ? "Prihvaćeno - U pripremi"
                                          : "Accepted - Active Lead"
                                        : isAlternative
                                          ? isSr
                                            ? "Predložena alternativa"
                                            : "Alternative Offered"
                                          : isDeclined
                                            ? isSr
                                              ? "Odbijeno"
                                              : "Declined"
                                            : isSr
                                              ? "Završeno"
                                              : "Completed"}
                                  </span>
                                </div>

                                {/* Inquiry Query / Visitor Notes */}
                                <div className="bg-white border border-[#2D3025]/10 rounded-xl p-3 text-[11.5px] text-brand-charcoal/90 leading-relaxed italic text-left shadow-2xs">
                                  "{inq.query}"
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-brand-charcoal/70 bg-white/60 p-2.5 rounded-xl border border-[#2D3025]/5 text-left">
                                  <div>
                                    <span className="text-brand-charcoal/40 uppercase font-bold">
                                      {isSr ? "Lokacija:" : "Geography:"}
                                    </span>{" "}
                                    {inq.geography || "N/A"}
                                  </div>
                                  <div>
                                    <span className="text-brand-charcoal/40 uppercase font-bold">
                                      {isSr ? "Jezik:" : "Language:"}
                                    </span>{" "}
                                    {inq.language || "English"}
                                  </div>
                                  <div>
                                    <span className="text-brand-charcoal/40 uppercase font-bold">
                                      {isSr ? "Budžet:" : "Budget:"}
                                    </span>{" "}
                                    {inq.budget || "N/A"}
                                  </div>
                                  <div>
                                    <span className="text-brand-charcoal/40 uppercase font-bold">
                                      {isSr ? "Vreme:" : "Available Time:"}
                                    </span>{" "}
                                    {inq.availableTime || "N/A"}
                                  </div>
                                </div>

                                {/* Show Reply Thread / Submitted Responses */}
                                {inq.replies && inq.replies.length > 0 && (
                                  <div className="space-y-1.5 pt-1.5 border-t border-[#2D3025]/10 text-left">
                                    <span className="text-[8px] font-mono uppercase font-black text-brand-charcoal/50 block">
                                      {isSr
                                        ? "Poslati odgovori:"
                                        : "Submitted Responses:"}
                                    </span>
                                    {inq.replies.map((rep, idx) => (
                                      <div
                                        key={idx}
                                        className="bg-emerald-500/10 text-emerald-950 border border-emerald-500/20 rounded-xl p-2.5 text-[10.5px] leading-relaxed font-sans"
                                      >
                                        "{rep}"
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Show Alternative Offer details if present */}
                                {inq.alternativeOffer && (
                                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[10px] font-mono text-amber-950 space-y-1">
                                    <span className="font-bold uppercase text-[8px] block text-amber-800">
                                      {isSr
                                        ? "Predloženi zamenski termin:"
                                        : "Proposed Alternative Parameters:"}
                                    </span>
                                    <p>
                                      <strong>
                                        {isSr ? "Datum:" : "Date:"}
                                      </strong>{" "}
                                      {inq.alternativeOffer.date}{" "}
                                      {inq.alternativeOffer.time &&
                                        `• ${inq.alternativeOffer.time}`}
                                    </p>
                                    {inq.alternativeOffer.note && (
                                      <p>
                                        <strong>
                                          {isSr ? "Napomena:" : "Note:"}
                                        </strong>{" "}
                                        "{inq.alternativeOffer.note}"
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* ACTION BUTTONS FOR PENDING OPPORTUNITY */}
                                {isPendingAction && (
                                  <div className="pt-2 border-t border-[#2D3025]/10 space-y-2 text-left">
                                    <span className="text-[8px] font-mono uppercase font-bold text-brand-charcoal/50 block">
                                      {isSr
                                        ? "Izaberite akciju za ovaj upit:"
                                        : "Select Action for Opportunity:"}
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        onClick={() =>
                                          handlePartnerAcceptInquiry(
                                            inq.id,
                                            currentSimulatedPartner.id,
                                          )
                                        }
                                        className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                                      >
                                        <CheckCircle2 size={13} />
                                        <span>
                                          {isSr
                                            ? "Prihvati upit"
                                            : "Accept Opportunity"}
                                        </span>
                                      </button>

                                      <button
                                        onClick={() =>
                                          setAltFormOpenId(
                                            isAltFormOpen ? null : inq.id,
                                          )
                                        }
                                        className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                                      >
                                        <Calendar size={13} />
                                        <span>
                                          {isSr
                                            ? "Predloži drugi termin"
                                            : "Propose Alternative"}
                                        </span>
                                      </button>

                                      <button
                                        onClick={() =>
                                          handlePartnerPassInquiry(
                                            inq.id,
                                            currentSimulatedPartner.id,
                                          )
                                        }
                                        className="py-2 px-3 bg-white border border-[#2D3025]/20 hover:bg-red-50 text-red-700 text-[9.5px] font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                                      >
                                        <XCircle size={13} />
                                        <span>
                                          {isSr ? "Odbij" : "Decline"}
                                        </span>
                                      </button>
                                    </div>

                                    {/* Form for Proposing Alternative */}
                                    {isAltFormOpen && (
                                      <div className="bg-white border border-amber-500/20 rounded-2xl p-3.5 space-y-2.5 mt-2 animate-fade-in shadow-xs">
                                        <span className="text-[8.5px] font-mono font-bold uppercase text-amber-800 block">
                                          {isSr
                                            ? "Unesite zamenske parametre ponude:"
                                            : "Enter Alternative Parameters:"}
                                        </span>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-mono font-bold uppercase text-brand-charcoal/50 block">
                                              {isSr ? "Datum" : "Date"}
                                            </label>
                                            <input
                                              type="date"
                                              value={
                                                altOfferForm[inq.id]?.date || ""
                                              }
                                              onChange={(e) =>
                                                setAltOfferForm((prev) => ({
                                                  ...prev,
                                                  [inq.id]: {
                                                    ...(prev[inq.id] || {
                                                      date: "",
                                                      time: "",
                                                      note: "",
                                                    }),
                                                    date: e.target.value,
                                                  },
                                                }))
                                              }
                                              className="w-full p-2 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-lg text-xs font-mono"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-mono font-bold uppercase text-brand-charcoal/50 block">
                                              {isSr ? "Vreme" : "Time"}
                                            </label>
                                            <input
                                              type="time"
                                              value={
                                                altOfferForm[inq.id]?.time || ""
                                              }
                                              onChange={(e) =>
                                                setAltOfferForm((prev) => ({
                                                  ...prev,
                                                  [inq.id]: {
                                                    ...(prev[inq.id] || {
                                                      date: "",
                                                      time: "",
                                                      note: "",
                                                    }),
                                                    time: e.target.value,
                                                  },
                                                }))
                                              }
                                              className="w-full p-2 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-lg text-xs font-mono"
                                            />
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[8px] font-mono font-bold uppercase text-brand-charcoal/50 block">
                                            {isSr
                                              ? "Poruka / Uslovi"
                                              : "Note / Parameters"}
                                          </label>
                                          <textarea
                                            rows={2}
                                            placeholder={
                                              isSr
                                                ? "Napišite razlog ili predlog drugog termina/uslova..."
                                                : "Explain proposed changes or schedule alternative..."
                                            }
                                            value={
                                              altOfferForm[inq.id]?.note || ""
                                            }
                                            onChange={(e) =>
                                              setAltOfferForm((prev) => ({
                                                ...prev,
                                                [inq.id]: {
                                                  ...(prev[inq.id] || {
                                                    date: "",
                                                    time: "",
                                                    note: "",
                                                  }),
                                                  note: e.target.value,
                                                },
                                              }))
                                            }
                                            className="w-full p-2 bg-[#FAF9F5] border border-[#2D3025]/15 rounded-lg text-xs font-sans"
                                          />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                          <button
                                            onClick={() =>
                                              setAltFormOpenId(null)
                                            }
                                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-brand-charcoal text-[9px] font-bold uppercase rounded-lg cursor-pointer"
                                          >
                                            {isSr ? "Odustani" : "Cancel"}
                                          </button>
                                          <button
                                            onClick={() => {
                                              const form = altOfferForm[inq.id];
                                              if (!form?.date) {
                                                alert(
                                                  isSr
                                                    ? "Unesite predloženi datum."
                                                    : "Please select a proposed date.",
                                                );
                                                return;
                                              }
                                              handlePartnerProposeAlternative(
                                                inq.id,
                                                currentSimulatedPartner.id,
                                                form.date,
                                                form.time || "10:00",
                                                form.note ||
                                                  "Alternative parameters proposed",
                                              );
                                              setAltFormOpenId(null);
                                            }}
                                            className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer shadow-xs"
                                          >
                                            {isSr
                                              ? "Pošalji predlog"
                                              : "Submit Proposal"}
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
                                      {isSr
                                        ? "Pošaljite detaljnu ponudu / itinerer"
                                        : "Transmit Professional Offer / Proposal"}
                                    </span>
                                    <textarea
                                      placeholder={
                                        isSr
                                          ? "Napišite vašu ponudu, cene, detalje ture ili uslove..."
                                          : "Write your detailed offer, pricing, tour itinerary, or conditions..."
                                      }
                                      value={activeAnswerText[inq.id] || ""}
                                      onChange={(e) => {
                                        setActiveAnswerText((prev) => ({
                                          ...prev,
                                          [inq.id]: e.target.value,
                                        }));
                                      }}
                                      className="w-full p-3 bg-white border border-[#2D3025]/15 rounded-xl text-xs focus:ring-1 focus:ring-[#8A1F1F]/20 focus:outline-none text-brand-charcoal"
                                      rows={3}
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => {
                                          const ans = activeAnswerText[inq.id];
                                          if (ans && ans.trim()) {
                                            handlePartnerSubmitAnswer(
                                              inq.id,
                                              currentSimulatedPartner.id,
                                              ans,
                                            );
                                            setActiveAnswerText((prev) => ({
                                              ...prev,
                                              [inq.id]: "",
                                            }));
                                          }
                                        }}
                                        className="px-4 py-2 bg-[#8A1F1F] hover:bg-[#8A1F1F]/90 text-white text-[9px] font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-xs transition-colors"
                                      >
                                        {isSr
                                          ? "Pošalji ponudu"
                                          : "Transmit Proposal"}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* CARD 3: MESSAGES */}
                    <div className="bg-white border border-[#2D3025]/10 rounded-[32px] p-6 shadow-sm text-left space-y-4">
                      <div className="flex items-center gap-2 border-b border-[#2D3025]/5 pb-3">
                        <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                          <MessageCircle size={14} />
                        </span>
                        <div className="space-y-0.5">
                          <span className="text-[8px] uppercase tracking-widest font-mono text-brand-charcoal/40 font-bold block">
                            Secure Thread
                          </span>
                          <h3 className="text-xs uppercase tracking-wide font-black text-brand-charcoal">
                            MESSAGES WITH IDEMO
                          </h3>
                        </div>
                      </div>

                      {/* Messages Box */}
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                        {currentMessages.map((msg) => {
                          const isMe = msg.sender === "You";
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}
                            >
                              <div
                                className={`p-3 rounded-2xl text-[11px] leading-relaxed max-w-[85%] ${
                                  isMe
                                    ? "bg-brand-charcoal text-white rounded-tr-none"
                                    : "bg-[#FAF9F5] border border-[#2D3025]/10 text-brand-charcoal rounded-tl-none"
                                }`}
                              >
                                ${msg.text}
                              </div>
                              <span className="text-[8px] font-mono text-brand-charcoal/40 px-1">
                                ${isMe ? "You" : "IDEMO Curation"} • $
                                {new Date(msg.timestamp).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
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
                          onChange={(e) =>
                            setPartnerMessageInput(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSendPartnerMessage(
                                currentSimulatedPartner.id,
                                partnerMessageInput,
                              );
                              setPartnerMessageInput("");
                            }
                          }}
                          className="flex-1 px-3 h-10 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl text-xs focus:ring-1 focus:ring-brand-charcoal/20 focus:outline-none text-brand-charcoal"
                        />
                        <button
                          onClick={() => {
                            handleSendPartnerMessage(
                              currentSimulatedPartner.id,
                              partnerMessageInput,
                            );
                            setPartnerMessageInput("");
                          }}
                          className="px-3 bg-brand-charcoal text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-brand-charcoal/90 transition-colors flex items-center justify-center cursor-pointer"
                        >
                          Send
                        </button>
                      </div>
                    </div>
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
                <span className="text-[9px] font-mono font-black tracking-widest uppercase text-amber-600">
                  PASSCODE VERIFICATION
                </span>
                <button
                  onClick={() => setPinTargetPartner(null)}
                  className="w-7 h-7 rounded-full bg-[#2D3025]/5 flex items-center justify-center text-[#2D3025]/50"
                >
                  <X size={12} />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-serif font-black text-brand-charcoal">
                  {pinTargetPartner.nameEn}
                </h3>
                <p className="text-[9.5px] text-[#2D3025]/60 font-semibold flex items-center gap-1">
                  <MapPin size={9} className="text-amber-500" />
                  <span>{pinTargetPartner.locationEn}</span>
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[9px] uppercase tracking-widest text-[#2D3025]/40 font-black block text-center">
                  Enter 4-Digit Access PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.replace(/\D/g, ""));
                    triggerHaptic(8);
                  }}
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
                  pinInput.length === 4
                    ? "bg-brand-charcoal text-white shadow-sm"
                    : "bg-[#2D3025]/5 text-[#2D3025]/25 cursor-not-allowed"
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
                <span className="text-[8px] uppercase tracking-widest font-mono text-[#8A1F1F] font-black block">
                  PORTFOLIO EXPANSION
                </span>
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
                  Once requested, this capability will enter your portal as{" "}
                  <strong className="text-amber-700">Pending</strong> awaiting
                  validation from the IDEMO curation team.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    triggerHaptic(10);
                    setRequestConfirmItem(null);
                  }}
                  className="flex-1 h-10 border border-[#2D3025]/10 hover:bg-[#2D3025]/5 text-brand-charcoal rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(12);
                    const recId = requestConfirmItem.isLanguage
                      ? `lang-${requestConfirmItem.name}`
                      : `cap-${requestConfirmItem.name}`;
                    const recTitle = requestConfirmItem.isLanguage
                      ? `Language: ${requestConfirmItem.name}`
                      : `Capability: ${requestConfirmItem.name}`;
                    handlePartnerExpressInterest(
                      recId,
                      recTitle,
                      currentSimulatedPartner,
                    );
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
