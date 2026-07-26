/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  KeyRound, 
  CheckCircle2, 
  Globe, 
  Phone, 
  MapPin, 
  Sparkles, 
  Lock, 
  Unlock, 
  ArrowRight, 
  X, 
  ChevronRight, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Partner, PARTNERS } from '../data/partners';
import { safeStorage } from '../lib/safeStorage';
import { triggerHaptic } from '../App';

const sha256 = async (text: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

interface PartnerCardProps {
  language: string;
}

export function PartnerCard({ language }: PartnerCardProps) {
  const [portalLang, setPortalLang] = useState<string>('sr');
  const isSr = portalLang === 'sr';
  const isZh = portalLang === 'zh';

  // Guest-facing translations for the Profile screen trigger button
  const tg = {
    portalTitle: language === 'sr' ? 'PARTNERSKI PORTAL' : language === 'zh' ? '合作伙伴尊享通道' : 'PARTNER PORTAL',
    triggerButton: language === 'sr' ? 'Pristup za partnere' : language === 'zh' ? '合作伙伴验证' : 'Partner Access',
    triggerSubtitle: language === 'sr' ? 'Unesite PIN za otključavanje privilegija' : language === 'zh' ? '输入专属 PIN 码解锁特定商户贵宾卡片' : 'Enter PIN to unlock bespoke venue cards'
  };

  const [pinInput, setPinInput] = useState('');
  const [activePartner, setActivePartner] = useState<Partner | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVoucherRedeemed, setIsVoucherRedeemed] = useState(false);
  const [redemptionCode, setRedemptionCode] = useState('');
  const [redemptionTime, setRedemptionTime] = useState('');

  const [newPasscode, setNewPasscode] = useState('');
  const [passcodeSuccess, setPasscodeSuccess] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  const handleUpdatePasscode = async () => {
    setPasscodeError('');
    setPasscodeSuccess('');
    const trimmed = newPasscode.trim();
    if (!/^\d{4}$/.test(trimmed)) {
      setPasscodeError(portalLang === 'sr' ? 'PIN mora biti tačno 4 cifre.' : portalLang === 'zh' ? '密码必须为 4 位数字。' : 'PIN must be exactly 4 digits.');
      triggerHaptic(6);
      return;
    }
    
    if (activePartner) {
      const hashed = await sha256(trimmed);
      activePartner.pinHash = hashed;
      safeStorage.setItem('idemo_active_partner_pinhash_v2', hashed);
      setPasscodeSuccess(portalLang === 'sr' ? 'PIN uspešno promenjen!' : portalLang === 'zh' ? '验证码修改成功！' : 'Passcode successfully updated!');
      setNewPasscode('');
      triggerHaptic([30, 20, 30]);
      setActivePartner({ ...activePartner, pinHash: hashed });
    }
  };

  // Translations for the Partner Portal
  const t = {
    portalTitle: isSr ? 'PARTNERSKI PORTAL' : isZh ? '合作伙伴尊享通道' : 'PARTNER PORTAL',
    portalDesc: isSr 
      ? 'Ekskluzivni pristup za IDEMO zvanične kustoske partnere i privilegovane klijente.' 
      : isZh 
      ? 'IDEMO 官方签约合作伙伴与特权贵宾的专属验证通道。' 
      : 'Exclusive access for IDEMO official curation partners and privileged guests.',
    enterPin: isSr ? 'UNESITE VAŠ PIN' : isZh ? '输入 4 位验证码' : 'ENTER ACCESS PIN',
    pinPlaceholder: '••••',
    verifyBtn: isSr ? 'AUTENTIFIKUJ SE' : isZh ? '验证并激活' : 'AUTHENTICATE',
    wrongPin: isSr ? 'Nevažeći PIN. Pokušajte ponovo.' : isZh ? '验证码不正确，请重试。' : 'Invalid PIN. Please try again.',
    activeBadge: isSr ? 'AKTIVAN PARTNER' : isZh ? '已验证合作伙伴' : 'ACTIVE PARTNER',
    partnerCuration: isSr ? 'IDEMO ZVANIČNA KUSTOSKA SELEKCIJA' : isZh ? 'IDEMO 官方特约精选' : 'OFFICIAL IDEMO CURATED VENUE',
    vipBenefit: isSr ? 'EKSKLUZIVNA PRIVILEGIJA' : isZh ? '独家贵宾礼遇' : 'EXCLUSIVE VIP BENEFIT',
    redeemBtn: isSr ? 'VALIDIRAJ & AKTIVIRAJ VAUČER' : isZh ? '核销并启用贵宾凭证' : 'VALIDATE & REDEEM VOUCHER',
    redeemedStatus: isSr ? 'VAUČER USPEŠNO ISKORIŠĆEN' : isZh ? '凭证核销成功' : 'VOUCHER REDEEMED',
    redemptionLabel: isSr ? 'KOD VALIDACIJE' : isZh ? '核销验证码' : 'VALIDATION CODE',
    timeLabel: isSr ? 'VREME TRANSAKCIJE' : isZh ? '操作时间' : 'TRANSACTION TIME',
    websiteLabel: isSr ? 'Posetite sajt' : isZh ? '访问官方网站' : 'Official Website',
    phoneLabel: isSr ? 'Pozovite konsijerža' : isZh ? '联络客服热线' : 'Concierge Phone',
    disconnectBtn: isSr ? 'ODJAVI PARTNERA' : isZh ? '退出伙伴安全会话' : 'DISCONNECT SESSION',
    closeBtn: isSr ? 'ZATVORI' : isZh ? '关闭' : 'CLOSE',
    triggerButton: isSr ? 'Pristup za partnere' : isZh ? '合作伙伴验证' : 'Partner Access',
    triggerSubtitle: isSr ? 'Unesite PIN za otključavanje privilegija' : isZh ? '输入专属 PIN 码解锁特定商户贵宾卡片' : 'Enter PIN to unlock bespoke venue cards',
    secWarning: isSr ? 'Zaštićena sesija' : isZh ? '安全防伪保护中' : 'Secure Device Session'
  };

  useEffect(() => {
    // Load existing active partner from safe storage
    const savedHash = safeStorage.getItem('idemo_active_partner_pinhash_v2');
    if (savedHash) {
      const match = PARTNERS.find(p => p.pinHash === savedHash);
      if (match) {
        setActivePartner(match);
        // Load redemption state if any
        const redeemed = safeStorage.getItem(`idemo_partner_redeemed_${match.id}`);
        if (redeemed) {
          setIsVoucherRedeemed(true);
          setRedemptionCode(safeStorage.getItem(`idemo_partner_redeem_code_${match.id}`) || '');
          setRedemptionTime(safeStorage.getItem(`idemo_partner_redeem_time_${match.id}`) || '');
        }
      }
    }
  }, []);

  const handleVerify = async () => {
    const trimmed = pinInput.trim();
    const hashed = await sha256(trimmed);
    const match = PARTNERS.find(p => p.pinHash === hashed);
    if (match) {
      triggerHaptic([30, 15, 45]);
      setActivePartner(match);
      safeStorage.setItem('idemo_active_partner_pinhash_v2', match.pinHash);
      setErrorMsg('');
      setPinInput('');
      
      // Load redemption state for newly logged partner
      const redeemed = safeStorage.getItem(`idemo_partner_redeemed_${match.id}`);
      if (redeemed) {
        setIsVoucherRedeemed(true);
        setRedemptionCode(safeStorage.getItem(`idemo_partner_redeem_code_${match.id}`) || '');
        setRedemptionTime(safeStorage.getItem(`idemo_partner_redeem_time_${match.id}`) || '');
      } else {
        setIsVoucherRedeemed(false);
        setRedemptionCode('');
        setRedemptionTime('');
      }
    } else {
      triggerHaptic([60, 40]);
      setErrorMsg(t.wrongPin);
    }
  };

  const handleRedeem = () => {
    if (!activePartner) return;
    triggerHaptic([40, 20, 80]);
    
    // Generate organic confirmation code and timestamp
    const randCode = `IDM-${activePartner.pinHash.substring(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowStr = new Date().toLocaleTimeString(portalLang === 'sr' ? 'sr-RS' : portalLang === 'zh' ? 'zh-CN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ` (${new Date().toLocaleDateString(portalLang === 'sr' ? 'sr-RS' : portalLang === 'zh' ? 'zh-CN' : 'en-US', { day: 'numeric', month: 'short' })})`;

    setIsVoucherRedeemed(true);
    setRedemptionCode(randCode);
    setRedemptionTime(nowStr);

    // Save states
    safeStorage.setItem(`idemo_partner_redeemed_${activePartner.id}`, 'true');
    safeStorage.setItem(`idemo_partner_redeem_code_${activePartner.id}`, randCode);
    safeStorage.setItem(`idemo_partner_redeem_time_${activePartner.id}`, nowStr);
  };

  const handleDisconnect = () => {
    triggerHaptic(50);
    safeStorage.removeItem('idemo_active_partner_pinhash_v2');
    setActivePartner(null);
    setIsVoucherRedeemed(false);
    setRedemptionCode('');
    setRedemptionTime('');
  };

  return (
    <div className="w-full">
      {/* Discreet Curation Trigger Button in general profile list */}
      <button
        onClick={() => {
          setIsModalOpen(true);
          triggerHaptic(10);
        }}
        className="w-full bg-white/60 hover:bg-white/90 border border-[#2D3025]/5 rounded-2xl p-4 flex items-center justify-between text-left transition-all cursor-pointer shadow-sm active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <KeyRound size={16} className="animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-widest text-[#2D3025]/40 font-black block leading-none">
              {tg.portalTitle}
            </span>
            <span className="text-xs font-extrabold text-brand-charcoal block">
              {activePartner ? (language === 'sr' ? activePartner.nameSr : language === 'zh' ? activePartner.nameZh : activePartner.nameEn) : tg.triggerButton}
            </span>
            <span className="text-[9px] text-[#2D3025]/50 block font-medium leading-none">
              {activePartner 
                ? (language === 'sr' ? 'Premium sesija je aktivna' : language === 'zh' ? '商户特权卡已激活' : 'Bespoke privileges unlocked')
                : tg.triggerSubtitle}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {activePartner ? (
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping mr-2" />
          ) : null}
          <ChevronRight size={14} className="text-[#2D3025]/30" />
        </div>
      </button>

      {/* Access Portal Modal overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 24, stiffness: 320 }}
              className="bg-[#FAF9F5] border-2 border-[#E3DFD5] w-full max-w-[400px] rounded-[32px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.25)] flex flex-col relative text-left"
            >
              {/* Top Bar */}
              <div className="px-6 pt-6 pb-2 flex items-center justify-between border-b border-[#2D3025]/5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#2D3025]/55 font-black font-mono">
                      {t.portalTitle}
                    </span>
                  </div>
                  {/* Language Selector for the local Serbian partners */}
                  <button 
                    onClick={() => {
                      setPortalLang(prev => prev === 'sr' ? 'en' : prev === 'en' ? 'zh' : 'sr');
                      triggerHaptic(5);
                    }}
                    className="text-[8px] font-mono font-black uppercase tracking-wider px-2.5 py-1 bg-brand-charcoal/5 hover:bg-brand-charcoal/10 rounded-md text-brand-charcoal/65 cursor-pointer leading-none flex items-center gap-1 border border-[#2D3025]/5"
                    title="Change partner portal language"
                  >
                    🌐 {portalLang.toUpperCase()}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    triggerHaptic(10);
                  }}
                  className="w-7 h-7 rounded-full bg-brand-charcoal/5 flex items-center justify-center text-brand-charcoal hover:bg-brand-charcoal/10 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Scrollable container for Content */}
              <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5">
                {!activePartner ? (
                  /* 1. STATE: Verification Required */
                  <div className="space-y-4 pt-1">
                    <div className="text-center space-y-2 pb-2">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 mx-auto flex items-center justify-center text-amber-600">
                        <Lock size={20} />
                      </div>
                      <h3 className="text-sm uppercase tracking-widest font-black text-brand-charcoal pt-1">
                        {isSr ? 'AUTENTIFIKACIJA' : isZh ? '合作伙伴验证' : 'VERIFICATION REQUIRED'}
                      </h3>
                      <p className="text-[11px] leading-relaxed text-[#2D3025]/60 px-2 font-medium">
                        {t.portalDesc}
                      </p>
                    </div>

                    {/* Numeric Pin Form Box */}
                    <div className="bg-white/80 rounded-2xl border border-[#2D3025]/10 p-4 space-y-3 shadow-inner">
                      <label className="text-[9px] uppercase tracking-widest text-[#2D3025]/40 font-black block text-center leading-none">
                        {t.enterPin}
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder={t.pinPlaceholder}
                        value={pinInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setPinInput(val);
                          if (val.length > 0) triggerHaptic(8);
                        }}
                        className="w-full text-center tracking-[0.5em] text-xl font-mono font-black h-12 bg-white/40 border border-[#2D3025]/15 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-brand-charcoal"
                      />
                      {errorMsg && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent-red justify-center">
                          <AlertCircle size={12} />
                          <span>{errorMsg}</span>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleVerify}
                      disabled={pinInput.length !== 4}
                      className={`w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        pinInput.length === 4
                          ? 'bg-brand-charcoal text-white hover:bg-brand-charcoal/90 shadow-sm'
                          : 'bg-brand-charcoal/10 text-brand-charcoal/30 cursor-not-allowed'
                      }`}
                    >
                      <Unlock size={14} />
                      <span>{t.verifyBtn}</span>
                    </button>
                    
                    {/* User note on pins for testing */}
                    <p className="text-[8px] text-[#2D3025]/35 font-mono text-center pt-2">
                      {isSr 
                        ? 'Zvanični partnerski PIN-ovi su u opsegu 2001-2030' 
                        : isZh 
                        ? '官方测试 PIN 验证码范围为 2001 至 2030' 
                        : 'Official curated partner PINs range from 2001 to 2030'}
                    </p>
                  </div>
                ) : (
                  /* 2. STATE: Active Verified Partner Card */
                  <div className="space-y-4">
                    {/* Partner Header Badge */}
                    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-700 font-mono">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>{t.activeBadge}</span>
                      </div>
                      <span className="text-[8px] font-mono text-[#2D3025]/45 uppercase font-bold bg-[#2D3025]/5 px-2 py-0.5 rounded">
                        ID: {activePartner.id}
                      </span>
                    </div>

                    {/* THE EDITORIAL PRESTIGE CARD */}
                    <div className="relative border-2 border-amber-500/30 bg-radial from-[#FDFCF7] to-[#FAF8F2] rounded-[24px] p-5 shadow-[0_12px_32px_rgba(212,175,55,0.08)] overflow-hidden space-y-4">
                      
                      {/* Subtle elegant background decoration */}
                      <div className="absolute right-[-10px] top-[-10px] opacity-5 pointer-events-none text-[#D4AF37]">
                        <Sparkles size={120} />
                      </div>

                      {/* Partner Identity */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-amber-600">
                          <Sparkles size={10} className="animate-spin" />
                          <span className="text-[8px] uppercase tracking-[0.25em] font-black font-mono leading-none">
                            {t.partnerCuration}
                          </span>
                        </div>
                        <h2 className="text-lg font-serif font-black text-brand-charcoal tracking-tight">
                          {portalLang === 'sr' ? activePartner.nameSr : portalLang === 'zh' ? activePartner.nameZh : activePartner.nameEn}
                        </h2>
                        <span className="inline-block text-[9px] uppercase tracking-widest font-black font-mono bg-amber-500/10 text-amber-800 px-2 py-0.5 rounded">
                          {activePartner.category}
                        </span>
                      </div>

                      {/* Curated Description */}
                      <p className="text-[11px] leading-relaxed text-[#2D3025]/75 font-medium border-t border-[#2D3025]/5 pt-3">
                        {portalLang === 'sr' ? activePartner.descriptionSr : portalLang === 'zh' ? activePartner.descriptionZh : activePartner.descriptionEn}
                      </p>

                      {/* VIP BENEFIT BOX */}
                      <div className="bg-[#FAF6EC] border border-amber-500/20 rounded-xl p-4 space-y-2 relative">
                        <div className="flex justify-between items-center leading-none">
                          <span className="text-[8.5px] uppercase tracking-[0.15em] text-amber-700 font-black">
                            {t.vipBenefit}
                          </span>
                          <span className="text-[8px] text-amber-500/70 font-mono font-bold">1X USE</span>
                        </div>
                        <p className="text-[12px] font-black leading-snug text-brand-charcoal">
                          {portalLang === 'sr' ? activePartner.specialOfferSr : portalLang === 'zh' ? activePartner.specialOfferZh : activePartner.specialOfferEn}
                        </p>
                      </div>

                      {/* Contacts and Location list */}
                      <div className="space-y-2 pt-1.5 text-[10.5px] font-medium text-[#2D3025]/75 border-t border-[#2D3025]/5">
                        <div className="flex items-start gap-2">
                          <MapPin size={12} className="text-amber-600 mt-0.5 flex-shrink-0" />
                          <span>{portalLang === 'sr' ? activePartner.locationSr : portalLang === 'zh' ? activePartner.locationZh : activePartner.locationEn}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-amber-600 flex-shrink-0" />
                          <a href={`tel:${activePartner.phone}`} className="hover:underline text-brand-charcoal font-semibold">
                            {activePartner.phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* REDEMPTION ACTION ENGINE */}
                    <div className="space-y-3">
                      {!isVoucherRedeemed ? (
                        <button
                          onClick={handleRedeem}
                          className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 size={15} />
                          <span>{t.redeemBtn}</span>
                        </button>
                      ) : (
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-3 shadow-inner">
                          <div className="flex items-center gap-2 text-emerald-600 justify-center">
                            <CheckCircle2 size={16} />
                            <span className="text-xs uppercase tracking-widest font-black leading-none">
                              {t.redeemedStatus}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 border-t border-emerald-500/10 pt-3 text-[10px] font-mono">
                            <div className="space-y-0.5">
                              <span className="text-[8px] text-[#2D3025]/40 font-bold block uppercase">
                                {t.redemptionLabel}
                              </span>
                              <span className="font-bold text-brand-charcoal block">
                                {redemptionCode}
                              </span>
                            </div>
                            <div className="space-y-0.5 text-right">
                              <span className="text-[8px] text-[#2D3025]/40 font-bold block uppercase">
                                {t.timeLabel}
                              </span>
                              <span className="text-brand-charcoal block leading-tight">
                                {redemptionTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Direct External Web Target */}
                      <div className="grid grid-cols-2 gap-2.5 pt-1.5">
                        <a
                          href={activePartner.website}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          rel="noopener noreferrer"
                          onClick={() => triggerHaptic(8)}
                          className="h-10 bg-white hover:bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 text-brand-charcoal transition-colors cursor-pointer"
                        >
                          <Globe size={12} className="text-amber-600" />
                          <span>{t.websiteLabel}</span>
                        </a>
                        <a
                          href={`tel:${activePartner.phone}`}
                          onClick={() => triggerHaptic(8)}
                          className="h-10 bg-white hover:bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 text-brand-charcoal transition-colors cursor-pointer"
                        >
                          <Phone size={12} className="text-amber-600" />
                          <span>{t.phoneLabel}</span>
                        </a>
                      </div>
                    </div>

                    {/* PASSWORD SUBSTITUTION CONTROL (REQUEST 4) */}
                    <div className="bg-[#FAF9F5] border border-[#2D3025]/10 rounded-2xl p-4.5 space-y-3">
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-mono uppercase tracking-widest font-black text-brand-charcoal">
                          {portalLang === 'sr' ? 'PERSONALIZUJ PIN KOD' : portalLang === 'zh' ? '个性化密码设置' : 'PERSONALIZED PASSCODE'}
                        </h4>
                        <p className="text-[9px] text-brand-charcoal/50 leading-normal">
                          {portalLang === 'sr' 
                            ? 'Zamenite podrazumevani PIN kod sa Vašim personalizovanim četvorocifrenim kodom.' 
                            : portalLang === 'zh' 
                            ? '将默认验证码替换为您自定义的 4 位数个性化安全密码。' 
                            : 'Substitute the default passcode for this card with a personalized 4-digit PIN.'}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={4}
                          value={newPasscode}
                          onChange={(e) => {
                            setPasscodeError('');
                            setPasscodeSuccess('');
                            setNewPasscode(e.target.value.replace(/\D/g, ''));
                          }}
                          placeholder="e.g. 1234"
                          className="flex-1 h-9 bg-white border border-[#2D3025]/10 rounded-xl px-3 text-xs font-mono text-center text-brand-charcoal placeholder-[#2D3025]/25 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        />
                        <button
                          onClick={handleUpdatePasscode}
                          className="px-4 h-9 bg-[#2D3025] hover:bg-[#1A1C16] text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          {portalLang === 'sr' ? 'Ažuriraj' : portalLang === 'zh' ? '保存设置' : 'Update'}
                        </button>
                      </div>

                      {passcodeError && (
                        <p className="text-[8.5px] font-semibold text-accent-red mt-1 font-mono">
                          ✕ {passcodeError}
                        </p>
                      )}
                      {passcodeSuccess && (
                        <p className="text-[8.5px] font-semibold text-emerald-700 mt-1 font-mono">
                          ✓ {passcodeSuccess}
                        </p>
                      )}
                    </div>

                    {/* Disconnect Sessions */}
                    <div className="border-t border-[#2D3025]/15 pt-4">
                      <button
                        onClick={handleDisconnect}
                        className="w-full h-10 bg-[#FAF9F5] hover:bg-[#F5F4EE] border border-accent-red/20 text-accent-red/85 hover:text-accent-red rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Lock size={12} />
                        <span>{t.disconnectBtn}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Secure Footer Badge */}
              <div className="bg-[#FAF9F5] border-t border-[#2D3025]/5 py-3 px-6 flex items-center justify-center gap-1.5 text-[8px] font-bold text-[#2D3025]/35 font-mono uppercase">
                <Unlock size={10} className="text-amber-500/70" />
                <span>{t.secWarning}</span>
                <span>•</span>
                <span>v2.0.0</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
