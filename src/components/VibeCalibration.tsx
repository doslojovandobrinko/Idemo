/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sliders, Sparkles, ShieldAlert, Award, Compass, HeartCrack } from 'lucide-react';
import { Recommendation, Category } from '../types';
import { triggerHaptic } from '../App';

export interface VibeSettings {
  heritageVSmodern: number; // 1 (Heritage) to 5 (Modern)
  gourmetVSmuseum: number;   // 1 (Gourmet) to 5 (Museum)
  natureVSnightlife: number; // 1 (Nature) to 5 (Nightlife)
  classicsVSsecrets: number; // 1 (Classics) to 5 (Secrets)
  activeVSrelaxed: number;   // 1 (Active) to 5 (Relaxed)
}

export const DEFAULT_VIBE_SETTINGS: VibeSettings = {
  heritageVSmodern: 3,
  gourmetVSmuseum: 3,
  natureVSnightlife: 3,
  classicsVSsecrets: 4, // default to secret curations!
  activeVSrelaxed: 3
};

/**
 * Calculates a dynamic percentage match (50% - 99%) for a recommendation against user vibe sliders.
 * Employs deterministic and weighted comparison of categories & tags.
 */
export function calculateVibeMatch(rec: Recommendation, vibe: VibeSettings, ratings: Record<string, any> = {}): number {
  // Read calibrated coordinates directly from the curation
  const recX = typeof rec.coordinateX === 'number' ? rec.coordinateX : 0;
  const recY = typeof rec.coordinateY === 'number' ? rec.coordinateY : 0;

  // Convert VibeSettings sliders (range 1-5) to a target (X, Y) coordinate in range [-5, 5]
  // 1. X Axis (Emotional Preference): Relaxed vs Active, Nightlife vs Nature
  const relaxedActiveX = (3 - vibe.activeVSrelaxed) * 1.8; // 1 (Active) -> +3.6, 5 (Relaxed) -> -3.6
  const natureNightlifeX = (vibe.natureVSnightlife - 3) * 1.4; // 5 (Nightlife) -> +2.8, 1 (Nature) -> -2.8
  let targetX = (relaxedActiveX + natureNightlifeX) / 1.3;
  targetX = Math.min(5, Math.max(-5, targetX));

  // 2. Y Axis (Environment Preference): Nature vs Nightlife, Heritage vs Modern
  const natureNightlifeY = (vibe.natureVSnightlife - 3) * 2.0; // 5 (Nightlife/Urban) -> +4.0, 1 (Nature) -> -4.0
  const heritageModernY = (vibe.heritageVSmodern - 3) * 1.2; // 5 (Modern) -> +2.4, 1 (Heritage) -> -2.4
  const heritageOffset = 1.0; // Heritage historic city center offset (keeps it in urban/historical)
  let targetY = (natureNightlifeY + heritageModernY) / 1.4 + heritageOffset;
  targetY = Math.min(5, Math.max(-5, targetY));

  // Calculate Euclidean distance in Mood Orbit space
  const d = Math.hypot(targetX - recX, targetY - recY);

  // Map distance to a realistic high-fidelity match percentage (54% to 99%)
  // Maximum possible distance is Math.hypot(10, 10) ≈ 14.14
  let score = 100 - (d / 14.14) * 45;

  // Adjust score based on positive/negative device feelings (ratings)
  if (ratings && ratings[rec.id]) {
    const r = ratings[rec.id];
    if (r.vibe === 'like') score += 12;
    if (r.vibe === 'intrigue') score += 6;
    if (r.vibe === 'dislike') score -= 35;
  }

  // Cap value between 54% and 99% for high-fidelity premium realism
  return Math.min(99, Math.max(54, Math.round(score)));
}

export function VibeCalibrationDashboard({
  language,
  vibeSettings,
  onChangeVibeSettings,
  ratingsList = {}
}: {
  language: string;
  vibeSettings: VibeSettings;
  onChangeVibeSettings: (settings: VibeSettings) => void;
  ratingsList: Record<string, any>;
}) {
  const handleSliderChange = (key: keyof VibeSettings, val: number) => {
    const updated = { ...vibeSettings, [key]: val };
    onChangeVibeSettings(updated);
    triggerHaptic(8);
  };

  const hasRatings = Object.keys(ratingsList).length > 0;
  const totalLikes = Object.values(ratingsList).filter(r => r.vibe === 'like').length;
  const totalIntrigues = Object.values(ratingsList).filter(r => r.vibe === 'intrigue').length;
  const totalSkips = Object.values(ratingsList).filter(r => r.vibe === 'dislike').length;

  // Compute overall match profile
  let dominantProfile = { en: "Discerning Wanderer", sr: "Istraživač skrivenih čari", es: "Explorador Curioso", de: "Aufmerksamer Wanderer", ru: "Пытливый странник", zh: "深行探索者" };
  if (vibeSettings.natureVSnightlife > 3.8) {
    dominantProfile = { en: "Electric Hedonist", sr: "Energični hedonista", es: "Hedonista Eléctrico", de: "Dynamischer Genießer", ru: "Активный тусовщик", zh: "摩登享乐家" };
  } else if (vibeSettings.natureVSnightlife < 2.2) {
    dominantProfile = { en: "Serene Ecocamp Wanderer", sr: "Spokojni čuvar prirode", es: "Buscador de Paz", de: "Stiller Naturfreund", ru: "Ценитель покоя", zh: "静谧寻绿客" };
  } else if (vibeSettings.gourmetVSmuseum < 2.2) {
    dominantProfile = { en: "Gastronomic Curator", sr: "Gurmanski kustos", es: "Curador Gastronómico", de: "Feinschmecker-Profi", ru: "Гастро-кулинар", zh: "美食鉴赏家" };
  } else if (vibeSettings.heritageVSmodern < 2.2) {
    dominantProfile = { en: "Byzantine Antiquarian", sr: "Tragač vizantijske baštine", es: "Anticuario Bizantino", de: "Byzantinischer Antiquar", ru: "Византийский антиквар", zh: "拜占庭文史家" };
  }

  const translations: Record<string, any> = {
    en: {
      title: "Concierge Vibe Calibration",
      subtitle: "Fine-tune Belgrade's response to your inner style. Changes recalculate list affinity instantly.",
      heritage: "Historic Heritage",
      modern: "Modern Waterfront",
      gourmet: "Gourmet / Tastings",
      intellectual: "Historic Museums",
      nature: "Quiet Nature",
      nightlife: "High Energy Nightlife",
      classics: "Essential Landmarks",
      secrets: "Bespoke Secrets",
      active: "Active Exploration",
      relaxed: "Unwind & Relax",
      status_card: "Tailoring Integrity State",
      calibration_level: "Calibration Complete:",
      profile_match: "Dominant Persona Match:",
      device_memories: "Device Memories Cached:",
      feedback_stat: `${totalLikes} likes · ${totalIntrigues} interests · ${totalSkips} skips`,
      ideal_calibration: "Dynamic Concordance Active",
      high_calibration: "Calibrated",
      choose_preset: "Vibe Calibration Presets",
      preset_exec: "Executive Profile",
      preset_explorer: "Explorer Profile",
      preset_leisure: "Leisure Profile"
    },
    sr: {
      title: "Kalibracija stila i vibracije",
      subtitle: "Prilagodite odgovor Beograda vašem ličnom stilu. Promene trenutno menjaju afinitet preporuka.",
      heritage: "Istorijsko nasleđe",
      modern: "Moderna arhitektura",
      gourmet: "Gurmanluk i gastronomija",
      intellectual: "Muzeji i kultura",
      nature: "Spokojna priroda",
      nightlife: "Noćni život i klubovi",
      classics: "Klasične znamenitosti",
      secrets: "Skrivene tajne",
      active: "Aktivna avantura",
      relaxed: "Opušten ritam",
      status_card: "Integritet prilagođavanja",
      calibration_level: "Nivo kalibracije:",
      profile_match: "Dominantni stil posetioca:",
      device_memories: "Sačuvana sećanja:",
      feedback_stat: `${totalLikes} sačuvano · ${totalIntrigues} zanimljivo · ${totalSkips} preskočeno`,
      ideal_calibration: "Aktivno usklađivanje ritma",
      high_calibration: "Kalibrisano",
      choose_preset: "Brzi kalibracioni profili",
      preset_exec: "Poslovni delegat",
      preset_explorer: "Aktivni istraživač",
      preset_leisure: "Opušteni odmor"
    },
    es: {
      title: "Calibración de Estilo",
      subtitle: "Adapta la respuesta de Belgrado a tu ritmo. Cambios recalculan afinidades de inmediato.",
      heritage: "Patrimonio Histórico",
      modern: "Vanguardia Moderna",
      gourmet: "Gastronomía Exquisita",
      intellectual: "Museos e Historia",
      nature: "Naturaleza y Paz",
      nightlife: "Vida Nocturna",
      classics: "Lugares Esenciales",
      secrets: "Secretos de Autor",
      active: "Acción Dinámica",
      relaxed: "Ritmo Relajado",
      status_card: "Alineación de Concierge",
      calibration_level: "Calibración completada:",
      profile_match: "Perfil Dominante:",
      device_memories: "Preferencias Locales:",
      feedback_stat: `${totalLikes} me gusta · ${totalIntrigues} intereses · ${totalSkips} descartados`,
      ideal_calibration: "Ordenación activa",
      high_calibration: "Calibrado",
      choose_preset: "Ajustes rápidos de perfil",
      preset_exec: "Perfil Ejecutivo",
      preset_explorer: "Perfil Explorador",
      preset_leisure: "Paseo y Relax"
    },
    de: {
      title: "Präferenz-Feineinstellung",
      subtitle: "Stimmen Sie Belgrad auf Ihren Reisetyp ab. Schieberegler berechnen die Listenaffinität neu.",
      heritage: "Kupfer & Tradition",
      modern: "Moderne Uferpromenade",
      gourmet: "Kulinarik & Genuss",
      intellectual: "Museen & Geschichte",
      nature: "Ruhige Natur",
      nightlife: "Abendlicher Trubel",
      classics: "Berühmte Wahrzeichen",
      secrets: "Geheimtipps & Raritäten",
      active: "Aktiv & Entdeckerisch",
      relaxed: "Entspanntes Treibenlassen",
      status_card: "Concierge-Tailoring-Zustand",
      calibration_level: "Kalibrierungsgrad:",
      profile_match: "Passender Reisetyp:",
      device_memories: "Gespeicherte Signale:",
      feedback_stat: `${totalLikes} Likes · ${totalIntrigues} Vorgemerkt · ${totalSkips} Ignoriert`,
      ideal_calibration: "Anpassung aktiv",
      high_calibration: "Kalibriert",
      choose_preset: "Präferenz-Schnellwahl",
      preset_exec: "Business-Delegat",
      preset_explorer: "Aktiv-Entdecker",
      preset_leisure: "Genuss & Muße"
    },
    ru: {
      title: "Калибровка ваших предпочтений",
      subtitle: "Настройте ответ Белграда на ваш стиль путешествия. Изменения сразу меняют соответствие рекомендаций.",
      heritage: "Историческая самобытность",
      modern: "Современный мегаполис",
      gourmet: "Гастрономия и дегустации",
      intellectual: "Музейные сокровища",
      nature: "Первозданная природа",
      nightlife: "Ночная жизнь",
      classics: "Классические места",
      secrets: "Скрытые секреты",
      active: "Активное движение",
      relaxed: "Расслабление и покой",
      status_card: "Статус работы консьержа",
      calibration_level: "Точность подбора:",
      profile_match: "Тип путешественника:",
      device_memories: "Накопленные предпочтения:",
      feedback_stat: `${totalLikes} любимых · ${totalIntrigues} важных · ${totalSkips} скрытых`,
      ideal_calibration: "Согласование вкусов",
      high_calibration: "Откалибровано",
      choose_preset: "Быстрые профили настройки",
      preset_exec: "Бизнес-делегат",
      preset_explorer: "Активный исследователь",
      preset_leisure: "Спокойный отдых"
    },
    zh: {
      title: "管家专属特质校准",
      subtitle: "微调贝尔格莱德行程，使其完美贴合您的风范。调整滑杆即可实时重新计算偏好契合度。",
      heritage: "古老历史遗产",
      modern: "摩登时尚水岸",
      gourmet: "地道美食品鉴",
      intellectual: "历史文化博览",
      nature: "清幽原野风光",
      nightlife: "高能夜生活体验",
      classics: "标志必打卡地",
      secrets: "极其隐秘珍藏",
      active: "精彩深度探索",
      relaxed: "舒缓解压节奏",
      status_card: "智能校准状态",
      calibration_level: "智囊校准进度：",
      profile_match: "您的旅行家画像：",
      device_memories: "已记录的感官偏好：",
      feedback_stat: `${totalLikes} 喜欢 · ${totalIntrigues} 被吸引 · ${totalSkips} 跳过`,
      ideal_calibration: "专属偏好定制中",
      high_calibration: "校准完毕",
      choose_preset: "管家定制快速画像",
      preset_exec: "高端商务贵宾",
      preset_explorer: "极客深度探索",
      preset_leisure: "舒缓慢活闲趣"
    }
  };

  const l = translations[language] || translations['en'];

  // Calculate Calibration Progress percentage
  let ratingsWeight = Math.min(40, Object.keys(ratingsList).length * 8);
  // Calculate slider drift from center
  const drifts = Object.values(vibeSettings).map(v => Math.abs(v - 3));
  const sliderWeight = Math.min(60, drifts.reduce((acc, current) => acc + current * 4, 20));
  const calibrationLevel = Math.round(ratingsWeight + sliderWeight);

  const slidersMeta = [
    { key: 'heritageVSmodern' as keyof VibeSettings, left: l.heritage, right: l.modern },
    { key: 'gourmetVSmuseum' as keyof VibeSettings, left: l.gourmet, right: l.intellectual },
    { key: 'natureVSnightlife' as keyof VibeSettings, left: l.nature, right: l.nightlife },
    { key: 'classicsVSsecrets' as keyof VibeSettings, left: l.classics, right: l.secrets },
    { key: 'activeVSrelaxed' as keyof VibeSettings, left: l.active, right: l.relaxed }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#FAF9F5] border border-border-main/50 rounded-[28px] p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-accent-red" />
          <h4 className="text-[13.5px] uppercase tracking-[0.25em] text-brand-charcoal font-black">{l.title}</h4>
        </div>

        <p className="text-sm text-[#4C4E44] leading-relaxed font-sans italic font-medium">
          {l.subtitle}
        </p>

        {/* Quick Calibration Presets */}
        <div className="space-y-2.5 pb-2.5 border-b border-border-main/15">
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C8A7D] font-extrabold block">
            {l.choose_preset}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'exec', label: l.preset_exec, emoji: '💼', settings: { heritageVSmodern: 3, gourmetVSmuseum: 1, natureVSnightlife: 4, classicsVSsecrets: 3, activeVSrelaxed: 4 } },
              { id: 'explorer', label: l.preset_explorer, emoji: '🧭', settings: { heritageVSmodern: 2, gourmetVSmuseum: 5, natureVSnightlife: 1, classicsVSsecrets: 5, activeVSrelaxed: 1 } },
              { id: 'leisure', label: l.preset_leisure, emoji: '🍹', settings: { heritageVSmodern: 4, gourmetVSmuseum: 2, natureVSnightlife: 2, classicsVSsecrets: 4, activeVSrelaxed: 5 } }
            ].map(preset => {
              const isActive = Object.keys(preset.settings).every(
                key => vibeSettings[key as keyof VibeSettings] === preset.settings[key as keyof VibeSettings]
              );
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    onChangeVibeSettings(preset.settings);
                    triggerHaptic(15);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer min-h-[50px] ${
                    isActive 
                      ? 'bg-brand-charcoal text-white border-brand-charcoal font-black scale-102 shadow-sm'
                      : 'bg-white hover:bg-brand-pearl text-brand-charcoal border-[#E7E4DB] hover:border-brand-charcoal/30'
                  }`}
                >
                  <span className="text-lg mb-1">{preset.emoji}</span>
                  <span className="text-[10.5px] leading-tight font-extrabold tracking-tight uppercase">
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-5 pt-2">
          {slidersMeta.map((slide) => {
            const currentVal = vibeSettings[slide.key];
            return (
              <div key={slide.key} className="space-y-2.5">
                <div className="flex justify-between text-[13px] uppercase font-black tracking-widest text-[#4A4B37]">
                  <span className={currentVal <= 2 ? 'text-accent-red font-black' : ''}>{slide.left}</span>
                  <span className={currentVal >= 4 ? 'text-accent-red font-black' : ''}>{slide.right}</span>
                </div>
                <div className="relative flex items-center py-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={currentVal}
                    onChange={(e) => handleSliderChange(slide.key, parseInt(e.target.value))}
                    className="w-full h-2 bg-brand-pearl rounded-lg appearance-none cursor-pointer accent-brand-charcoal min-h-[44px]"
                  />
                  {/* Visual ticks */}
                  <div className="absolute top-0 left-0 w-full flex justify-between pointer-events-none px-1 py-4.5">
                    {[1, 2, 3, 4, 5].map((tick) => (
                      <div
                        key={tick}
                        className={`w-1.5 h-1.5 rounded-full ${
                          tick === currentVal ? 'bg-brand-charcoal' : 'bg-brand-charcoal/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-[#DDDCCF] rounded-[28px] p-6 space-y-4 shadow-tactile">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent-teal" />
          <h4 className="text-[13px] uppercase tracking-[0.2em] text-[#4C4B3D] font-black">{l.status_card}</h4>
        </div>

        <div className="space-y-4 pt-1">
          <div className="flex justify-between items-center text-base">
            <span className="font-bold text-brand-charcoal/70">{l.calibration_level}</span>
            <span className="font-serif font-black text-brand-charcoal flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent-teal animate-pulse" />
              {calibrationLevel}% {l.high_calibration}
            </span>
          </div>

          <div className="w-full bg-brand-pearl h-2.5 rounded-full overflow-hidden">
            <motion.div
              layout
              initial={{ width: '0%' }}
              animate={{ width: `${calibrationLevel}%` }}
              className="bg-accent-teal h-full rounded-full"
              transition={{ ease: 'easeOut', duration: 0.6 }}
            />
          </div>

          <div className="text-base flex flex-col gap-2.5 border-t border-border-main/10 pt-4">
            <div className="flex justify-between items-start">
              <span className="font-bold text-brand-charcoal/70">{l.profile_match}</span>
              <span className="font-black text-accent-red text-right max-w-[200px] font-serif">
                {dominantProfile[language as keyof typeof dominantProfile] || dominantProfile.en}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="font-bold text-brand-charcoal/70">{l.device_memories}</span>
              <span className="font-mono text-xs font-bold text-brand-charcoal/80">
                {hasRatings ? l.feedback_stat : l.ideal_calibration}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
