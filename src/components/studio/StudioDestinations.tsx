import React, { useState } from 'react';
import { MapPin, Globe, CheckCircle2, PackageCheck, Plus, Sparkles, AlertCircle } from 'lucide-react';

interface DestinationItem {
  id: string;
  name: string;
  country: string;
  recommendationCount: number;
  packageVersion: string;
  status: 'Production' | 'Review' | 'Draft';
  lastPublishedAt: string;
  curator: string;
}

const INITIAL_DESTINATIONS: DestinationItem[] = [
  {
    id: 'serbia-canonical',
    name: 'Serbia (Canonical Package)',
    country: 'Serbia',
    recommendationCount: 113,
    packageVersion: 'v1.2.0',
    status: 'Production',
    lastPublishedAt: '2026-07-02T03:00:00Z',
    curator: 'EXPO AI Lead Curator'
  },
  {
    id: 'belgrade-capital',
    name: 'Belgrade',
    country: 'Serbia',
    recommendationCount: 68,
    packageVersion: 'v1.2.0',
    status: 'Production',
    lastPublishedAt: '2026-07-02T03:00:00Z',
    curator: 'Lead Curator Milan'
  },
  {
    id: 'novi-sad-culture',
    name: 'Novi Sad & Fruška Gora',
    country: 'Serbia',
    recommendationCount: 22,
    packageVersion: 'v1.1.0',
    status: 'Production',
    lastPublishedAt: '2026-06-25T12:00:00Z',
    curator: 'Vojvodina Curation Team'
  },
  {
    id: 'zlatibor-tara',
    name: 'Zlatibor & Tara National Park',
    country: 'Serbia',
    recommendationCount: 14,
    packageVersion: 'v1.0.2',
    status: 'Production',
    lastPublishedAt: '2026-06-20T10:00:00Z',
    curator: 'Western Serbia Scout'
  },
  {
    id: 'nis-south',
    name: 'Niš & Southern Heritage',
    country: 'Serbia',
    recommendationCount: 9,
    packageVersion: 'v0.9.0',
    status: 'Review',
    lastPublishedAt: 'Pending',
    curator: 'Southern Serbia Curation Desk'
  }
];

export function StudioDestinations() {
  const [destinations, setDestinations] = useState<DestinationItem[]>(INITIAL_DESTINATIONS);
  const [selectedDestId, setSelectedDestId] = useState<string>('serbia-canonical');

  const activeDest = destinations.find(d => d.id === selectedDestId) || destinations[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1E2E20] tracking-tight">
            Destinations Directory
          </h1>
          <p className="text-[#8C8A7D] text-xs sm:text-sm font-sans mt-0.5">
            Manage active travel destinations, package release statuses, and spatial scope.
          </p>
        </div>

        <button
          onClick={() => alert('Destination creation workflow is open in Studio Foundation.')}
          className="px-4 py-2.5 rounded-xl bg-[#23251E] hover:bg-[#32352B] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 self-start sm:self-auto"
        >
          <Plus size={14} className="text-[#C5A059]" />
          <span>Add Destination</span>
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Destinations List */}
        <div className="space-y-3">
          {destinations.map(dest => {
            const isSelected = dest.id === selectedDestId;
            return (
              <div
                key={dest.id}
                onClick={() => setSelectedDestId(dest.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-[#23251E] shadow-sm ring-1 ring-[#23251E]/10'
                    : 'bg-[#FAF9F5] border-[#E5E3DB] hover:border-[#23251E]/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className={isSelected ? 'text-[#8A1F1F]' : 'text-[#8C8A7D]'} />
                    <span className="font-serif font-bold text-[#1E2E20] text-sm">
                      {dest.name}
                    </span>
                  </div>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                    dest.status === 'Production'
                      ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]'
                      : 'bg-[#FFF8E1] text-[#F57F17] border border-[#FFE082]'
                  }`}>
                    {dest.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-mono text-[#8C8A7D]">
                  <span>{dest.recommendationCount} Recommendations</span>
                  <span>Pkg {dest.packageVersion}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Destination Details */}
        <div className="lg:col-span-2 bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8A7D] font-bold block">
                {activeDest.country}
              </span>
              <h2 className="font-serif text-xl font-bold text-[#1E2E20] mt-0.5">
                {activeDest.name}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#8C8A7D]">Curator:</span>
              <span className="text-xs font-mono font-bold text-[#1E2E20]">{activeDest.curator}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB]">
              <span className="text-[9.5px] font-mono uppercase font-bold text-[#8C8A7D] block">
                Catalog Items
              </span>
              <span className="text-2xl font-serif font-bold text-[#1E2E20] block mt-1">
                {activeDest.recommendationCount}
              </span>
              <span className="text-[10.5px] text-[#8C8A7D]">Curated experiences</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB]">
              <span className="text-[9.5px] font-mono uppercase font-bold text-[#8C8A7D] block">
                Active Package
              </span>
              <span className="text-2xl font-serif font-bold text-[#1E2E20] block mt-1">
                {activeDest.packageVersion}
              </span>
              <span className="text-[10.5px] text-[#2E7D32] font-mono">SHA-256 Verified</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB]">
              <span className="text-[9.5px] font-mono uppercase font-bold text-[#8C8A7D] block">
                Publication Date
              </span>
              <span className="text-sm font-mono font-bold text-[#1E2E20] block mt-2 truncate">
                {activeDest.lastPublishedAt !== 'Pending' ? new Date(activeDest.lastPublishedAt).toLocaleDateString() : 'Pending Release'}
              </span>
              <span className="text-[10.5px] text-[#8C8A7D]">UTC Server Timestamp</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DB] space-y-2">
            <h4 className="font-mono text-xs uppercase font-bold text-[#1E2E20]">
              Operational Guidelines
            </h4>
            <p className="text-xs text-[#8C8A7D] leading-relaxed">
              Every recommendation in this destination adheres strictly to the IDEMO Editorial Luxury Design Language and Privacy-First Local State Engine. Releases are published as immutable bundles signed by SHA-256 hashes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
