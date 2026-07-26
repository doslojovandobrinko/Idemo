/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Trash2, MapPin, Clock, Car, Euro, Globe, Phone, Zap, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Recommendation } from '../types';
import { TRANSLATIONS } from '../constants';
import { getLocalizedValue, formatCategory } from '../lib/utils';
import { triggerHaptic, CONCIERGE_T } from '../App';
import { LazyImage } from './LazyImage';
import { safeStorage } from '../lib/safeStorage';
import { getInquiryByRecommendationId, getVisitorCredential, removeVisitorCredential, removeInquiryRecordV2 } from '../lib/inquiryStorage';
import { submitInquiry, fetchInquiryStatus, fetchActiveProposal, confirmProposal, declineProposal, requestAlternativeProposal } from '../lib/inquiryService';

const MONTH_NAMES: Record<string, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  sr: ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  zh: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
};

const WEEKDAY_NAMES: Record<string, string[]> = {
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  sr: ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'],
  de: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  es: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  zh: ['日', '一', '二', '三', '四', '五', '六']
};

const CALENDAR_TR: Record<string, {
  google_title: string;
  google_desc: string;
  apple_title: string;
  apple_desc: string;
  help_text: string;
}> = {
  en: {
    google_title: "Google Calendar",
    google_desc: "Direct sync for Android, Chrome, and Gmail.",
    apple_title: "iCalendar / ICS File",
    apple_desc: "Universal file for Apple Calendar (iPhone/Mac) and Outlook.",
    help_text: "Choose how you want to add this event:"
  },
  sr: {
    google_title: "Google Kalendar",
    google_desc: "Direktna sinhronizacija za Android i Gmail.",
    apple_title: "iCalendar / ICS Fajl",
    apple_desc: "Univerzalni fajl za Apple Kalendar (iPhone/Mac) i Outlook.",
    help_text: "Izaberite način dodavanja događaja:"
  },
  de: {
    google_title: "Google Kalender",
    google_desc: "Direkte Synchronisation für Android und Gmail.",
    apple_title: "iCalendar / ICS Datei",
    apple_desc: "Universelle Datei für Apple Kalender (iPhone/Mac) und Outlook.",
    help_text: "Wählen Sie eine Option:"
  },
  es: {
    google_title: "Google Calendar",
    google_desc: "Sincronización directa para Android y Gmail.",
    apple_title: "iCalendar / Archivo ICS",
    apple_desc: "Archivo universal para Apple Calendar y Outlook.",
    help_text: "Elija cómo agregar el evento:"
  },
  ru: {
    google_title: "Google Календарь",
    google_desc: "Прямая синхронизация для Android и Gmail.",
    apple_title: "iCalendar / Файл ICS",
    apple_desc: "Файл для Apple Календаря (iPhone/Mac) и Outlook.",
    help_text: "Выберите способ синхронизации:"
  },
  zh: {
    google_title: "谷歌日历 (Google Calendar)",
    google_desc: "适用于安卓系统 (Android)、Chrome 及 Gmail 一键同步。",
    apple_title: "iCalendar / ICS 文件",
    apple_desc: "通用日历文件，完美支持苹果设备 (iPhone/Mac) 及 Outlook。",
    help_text: "请选择同步选项："
  }
};

const PLAN_CARD_TR: Record<string, {
  set_date: string;
  add_to_calendar: string;
  reschedule: string;
  reschedule_item: string;
  cancel: string;
  save: string;
}> = {
  en: {
    set_date: "Set Date",
    add_to_calendar: "Add to Calendar",
    reschedule: "Set Date",
    reschedule_item: "Set Date",
    cancel: "Cancel",
    save: "Save"
  },
  sr: {
    set_date: "Постави датум",
    add_to_calendar: "Kalendar",
    reschedule: "Постави датум",
    reschedule_item: "Постави датум",
    cancel: "Откажи",
    save: "Сачувај"
  },
  es: {
    set_date: "Fijar fecha",
    add_to_calendar: "Al calendario",
    reschedule: "Fijar fecha",
    reschedule_item: "Fijar fecha",
    cancel: "Cancelar",
    save: "Guardar"
  },
  de: {
    set_date: "Datum festlegen",
    add_to_calendar: "In Kalender",
    reschedule: "Datum festlegen",
    reschedule_item: "Datum festlegen",
    cancel: "Abbrechen",
    save: "Speichern"
  },
  ru: {
    set_date: "Выбрать дату",
    add_to_calendar: "В календарь",
    reschedule: "Выбрать дату",
    reschedule_item: "Выбрать дату",
    cancel: "Отмена",
    save: "Сохранить"
  },
  zh: {
    set_date: "选择日期",
    add_to_calendar: "加回历",
    reschedule: "选择日期",
    reschedule_item: "选择日期",
    cancel: "取消",
    save: "保存"
  }
};

const ARRANGE_TR: Record<string, any> = {
  en: {
    arrange_this: "ARRANGE",
    request_arrangement: "Request Arrangement",
    preferred_time: "Preferred Time",
    personal_notes: "Personal Notes",
    notes_placeholder: "e.g., Party size, dietary bounds, language needs...",
    assistance_requested: "Assistance Requested",
    under_review: "Under Review",
    arrangement_confirmed: "Arrangement Confirmed",
    inquiry_reference: "Inquiry Reference",
    regarding: "Regarding",
    time_placeholder: "e.g., 14:00, Morning, Evening...",
  },
  sr: {
    arrange_this: "ARRANGE",
    request_arrangement: "Zatraži ugovaranje",
    preferred_time: "Željeno vreme",
    personal_notes: "Lične zabeleške",
    notes_placeholder: "npr. Broj osoba, dijetetska ograničenja, jezik...",
    assistance_requested: "Zahtevana asistencija",
    under_review: "Pod revizijom",
    arrangement_confirmed: "Ugovaranje potvrđeno",
    inquiry_reference: "Referenca upita",
    regarding: "Povodom",
    time_placeholder: "npr. 14:00, prepodne, veče...",
  },
  es: {
    arrange_this: "ARRANGE",
    request_arrangement: "Solicitar arreglo",
    preferred_time: "Hora preferida",
    personal_notes: "Notas personales",
    notes_placeholder: "Ej. Número de personas, restricciones, idioma...",
    assistance_requested: "Asistencia solicitada",
    under_review: "Bajo revisión",
    arrangement_confirmed: "Arreglo confirmado",
    inquiry_reference: "Referencia de la solicitud",
    regarding: "Respecto a",
    time_placeholder: "Ej. 14:00, mañana, tarde...",
  },
  de: {
    arrange_this: "ARRANGE",
    request_arrangement: "Termin anfragen",
    preferred_time: "Bevorzugte Uhrzeit",
    personal_notes: "Eigene Anmerkungen",
    notes_placeholder: "z.B. Personenanzahl, Diät, Sprache...",
    assistance_requested: "Unterstützung angefragt",
    under_review: "Wird geprüft",
    arrangement_confirmed: "Termin bestätigt",
    inquiry_reference: "Anfrage-Referenz",
    regarding: "Betrifft",
    time_placeholder: "z.B. 14:00 Uhr, Vormittag, Abend...",
  },
  ru: {
    arrange_this: "ARRANGE",
    request_arrangement: "Запросить организацию",
    preferred_time: "Удобное время",
    personal_notes: "Личные заметки",
    notes_placeholder: "например, размер группы, диета, язык...",
    assistance_requested: "Запрошена помощь",
    under_review: "На рассмотрении",
    arrangement_confirmed: "Организация подтверждена",
    inquiry_reference: "Номер запроса",
    regarding: "По поводу",
    time_placeholder: "например, 14:00, утро, вечер...",
  },
  zh: {
    arrange_this: "ARRANGE",
    request_arrangement: "申请专属安排",
    preferred_time: "首选时间",
    personal_notes: "专属备注",
    notes_placeholder: "例如：人数、饮食限制、语言需求等...",
    assistance_requested: "已申请服务",
    under_review: "正在审核中",
    arrangement_confirmed: "安排已确认",
    inquiry_reference: "查询参考号",
    regarding: "关于项目",
    time_placeholder: "例如：14:00、上午、晚上...",
  }
};

export interface PlanCardItem extends Recommendation {
  isAvailable?: boolean;
}

interface PlanCardProps {
  item: PlanCardItem;
  language: string;
  onRemove: (id: string) => void;
  onUpdateDate: (id: string, date: string) => void;
  onSelectRec?: (id: string) => void;
}

export default function PlanCard({ item, language, onRemove, onUpdateDate, onSelectRec }: PlanCardProps) {
  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];

  const [isExpanded, setIsExpanded] = React.useState(false);
  const [preferredTime, setPreferredTime] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [copiedChannel, setCopiedChannel] = React.useState<string | null>(null);

  const [visitorNameInput, setVisitorNameInput] = React.useState('');
  const [contactInfoInput, setContactInfoInput] = React.useState('');
  const [submissionError, setSubmissionError] = React.useState<string | null>(null);

  const [checkingStatus, setCheckingStatus] = React.useState(false);
  const [statusFeedback, setStatusFeedback] = React.useState<string | null>(null);
  const [activeProposal, setActiveProposal] = React.useState<any | null>(null);
  const [proposalReason, setProposalReason] = React.useState('');
  const [actionInProgress, setActionInProgress] = React.useState(false);

  const [inquiry, setInquiry] = React.useState<any>(() => {
    try {
      const existing = getInquiryByRecommendationId(item.id);
      if (existing) {
        return {
          itemId: item.id,
          serverInquiryId: existing.server_inquiry_id,
          status: "Assistance Requested",
          visitorStatusLabel: undefined,
          referenceCode: existing.public_reference_code || `IDEMO-REC${item.id}`,
          preferredTime: existing.preferred_time || '',
          notes: existing.visitor_notes || '',
          timestamp: existing.created_at,
          isAuthoritative: existing.is_server_authoritative,
        };
      }
      // Fallback check legacy V1 storage if V2 empty
      const savedInquiriesStr = safeStorage.getItem('idemo_inquiries_v1');
      if (savedInquiriesStr) {
        const savedInquiries = JSON.parse(savedInquiriesStr);
        return savedInquiries[item.id] || null;
      }
    } catch (e) {
      console.warn('Failed to load inquiry from storage:', e);
    }
    return null;
  });

  const handleRequestArrangement = async () => {
    triggerHaptic(15);
    setSubmitting(true);
    setSubmissionError(null);
    setProgress(25);

    const isEmail = contactInfoInput.includes('@');
    const res = await submitInquiry({
      recommendation: item,
      visitorName: visitorNameInput.trim() || 'Visitor',
      email: isEmail ? contactInfoInput.trim() : undefined,
      phoneNumber: !isEmail && contactInfoInput.trim().length > 0 ? contactInfoInput.trim() : '+381621873260',
      visitorNotes: notes.trim() || 'Arrangement request',
      preferredDate: item.scheduledDate ? item.scheduledDate.split('T')[0] : new Date().toISOString().split('T')[0],
      preferredTime: preferredTime.trim() || 'Anytime',
    });

    setProgress(100);
    setSubmitting(false);

    if (res.success && res.referenceCode) {
      setInquiry({
        itemId: item.id,
        serverInquiryId: res.inquiryId,
        status: "Assistance Requested",
        visitorStatusLabel: undefined,
        referenceCode: res.referenceCode,
        preferredTime: preferredTime,
        notes: notes,
        timestamp: new Date().toISOString(),
        isAuthoritative: true,
      });
    } else {
      setSubmissionError(res.error || 'Submission failed.');
    }
  };

  const handleCheckStatus = async () => {
    const serverId = inquiry?.serverInquiryId;
    if (!serverId) {
      setStatusFeedback(language === 'sr' ? 'Identifikator upita nije dostupan.' : 'Inquiry ID is not available.');
      return;
    }
    triggerHaptic(5);
    setCheckingStatus(true);
    setStatusFeedback(null);

    const [statusRes, proposalRes] = await Promise.all([
      fetchInquiryStatus(serverId),
      fetchActiveProposal(serverId),
    ]);

    setCheckingStatus(false);

    if (statusRes.success) {
      setInquiry((prev: any) => prev ? {
        ...prev,
        visitorStatusLabel: statusRes.visitor_status_label || statusRes.status,
      } : prev);
    }

    if (proposalRes.success && proposalRes.proposal_found) {
      setActiveProposal(proposalRes);
      setStatusFeedback(language === 'sr' ? 'Pristigla je ponuda partnera.' : 'A proposal from the partner is available.');
    } else {
      setActiveProposal(null);
      if (statusRes.success) {
        setStatusFeedback(language === 'sr' ? 'Status je osvežen. Čeka se odgovor partnera.' : 'Status updated. Awaiting partner response.');
      } else {
        setStatusFeedback(statusRes.error || (language === 'sr' ? 'Neuspešno osvežavanje statusa.' : 'Failed to update status.'));
      }
    }
  };

  const handleConfirmProposal = async () => {
    const serverId = inquiry?.serverInquiryId;
    if (!serverId || !activeProposal?.match_id) return;
    triggerHaptic(10);
    setActionInProgress(true);

    const res = await confirmProposal(serverId, activeProposal.match_id);
    setActionInProgress(false);

    if (res.success) {
      setInquiry((prev: any) => prev ? {
        ...prev,
        status: 'Arrangement Confirmed',
        visitorStatusLabel: language === 'sr' ? 'Potvrđeno sa partnerom' : 'Confirmed with Partner',
      } : prev);
      setActiveProposal(null);
      setStatusFeedback(language === 'sr' ? 'Ponuda je uspešno potvrđena!' : 'Proposal successfully confirmed!');
    } else {
      setStatusFeedback(res.error || 'Failed to confirm proposal.');
    }
  };

  const handleDeclineProposal = async () => {
    const serverId = inquiry?.serverInquiryId;
    if (!serverId || !activeProposal?.match_id) return;
    triggerHaptic(10);
    setActionInProgress(true);

    const res = await declineProposal(serverId, activeProposal.match_id, proposalReason);
    setActionInProgress(false);

    if (res.success) {
      removeInquiryRecordV2(serverId);
      setInquiry(null);
      setActiveProposal(null);
      setProposalReason('');
      setStatusFeedback(language === 'sr' ? 'Zahtev je otkazan.' : 'Inquiry request canceled.');
    } else {
      setStatusFeedback(res.error || 'Failed to decline proposal.');
    }
  };

  const handleRequestAlternative = async () => {
    const serverId = inquiry?.serverInquiryId;
    if (!serverId || !activeProposal?.match_id) return;
    triggerHaptic(10);
    setActionInProgress(true);

    const res = await requestAlternativeProposal(serverId, activeProposal.match_id, proposalReason);
    setActionInProgress(false);

    if (res.success) {
      setInquiry((prev: any) => prev ? {
        ...prev,
        status: 'Assistance Requested',
        visitorStatusLabel: language === 'sr' ? 'Zatražena alternativna ponuda' : 'Alternative Requested',
      } : prev);
      setActiveProposal(null);
      setProposalReason('');
      setStatusFeedback(language === 'sr' ? 'Zatražena je alternativa od partnera.' : 'Alternative option requested from partner.');
    } else {
      setStatusFeedback(res.error || 'Failed to request alternative.');
    }
  };

  const handleRemoveFromDevice = () => {
    const confirmMsg = language === 'sr'
      ? 'Ova radnja uklanja lokalni zapis i pristupni ključ sa ovog uređaja. Sam upit na serveru NEĆE biti otkazan. Da li ste sigurni?'
      : 'This removes the local record and access credential from this device. The inquiry on the server will NOT be canceled. Are you sure?';

    if (!window.confirm(confirmMsg)) {
      return;
    }

    triggerHaptic(10);
    const serverId = inquiry?.serverInquiryId;
    if (serverId) {
      removeVisitorCredential(serverId);
      removeInquiryRecordV2(serverId);
    }
    removeInquiryRecordV2(item.id);
    setInquiry(null);
    setActiveProposal(null);
    setStatusFeedback(null);
  };

  
  const [showCalendar, setShowCalendar] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => {
    return item.scheduledDate ? new Date(item.scheduledDate) : new Date();
  });
  
  const [viewYear, setViewYear] = React.useState(() => selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(() => selectedDate.getMonth()); // 0-11

  // Synchronize when item's scheduledDate changes
  React.useEffect(() => {
    if (item.scheduledDate) {
      const d = new Date(item.scheduledDate);
      setSelectedDate(d);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [item.scheduledDate]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday, etc.

  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const handleRescheduleClick = () => {
    triggerHaptic(10);
    setShowCalendar(true);
  };

  const handlePrevMonth = () => {
    triggerHaptic(5);
    setViewMonth(prev => {
      if (prev === 0) {
        setViewYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    triggerHaptic(5);
    setViewMonth(prev => {
      if (prev === 11) {
        setViewYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleDaySelect = (dayNum: number) => {
    triggerHaptic(8);
    const updated = new Date(viewYear, viewMonth, dayNum);
    setSelectedDate(updated);
  };

  const handleSaveDate = () => {
    triggerHaptic(15);
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;
    onUpdateDate(item.id, formatted);
    setShowCalendar(false);
  };

  const getDisplayDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const parts = dateStr.split('T')[0].split('-');
    const localeMap: Record<string, string> = {
      sr: 'sr-RS',
      ru: 'ru-RU',
      es: 'es-ES',
      de: 'de-DE',
      zh: 'zh-CN',
      en: 'en-US'
    };
    const currentLocale = localeMap[language] || 'en-US';
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString(currentLocale, { weekday: 'long', month: 'short', day: 'numeric' });
    }
    return new Date(dateStr).toLocaleDateString(currentLocale, { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <>
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="bg-white rounded-2xl p-4 shadow-tactile border border-border-main flex flex-col gap-3"
      >
      <div className="flex items-start gap-4">
        <LazyImage 
          src={item.image} 
          alt={getLocalizedValue(item, 'title', language)} 
          containerClassName="w-[51px] h-[51px] rounded-xl self-start"
          className="w-[51px] h-[51px] rounded-xl object-cover" 
        />
        <div className="flex-1 min-w-0">
          {item.isAvailable === false && (
            <span className="text-[8px] uppercase tracking-widest font-black text-[#B45309] bg-[#FEF3C7] border border-[#F59E0B]/30 px-2 py-0.5 rounded-full inline-block mb-1">
              {language === 'sr' ? 'Arhivirano / Nije dostupno' : 'Unavailable / Archived'}
            </span>
          )}
          <span className="text-[8px] uppercase tracking-widest text-[#2E7D32] font-black block mb-0.5">
            {formatCategory(item.category, t)}
          </span>
          <h4 
            onClick={() => {
              if (item.isAvailable !== false && onSelectRec) {
                onSelectRec(item.id);
              }
            }}
            className={`font-serif text-lg leading-tight text-brand-charcoal font-bold ${item.isAvailable !== false && onSelectRec ? 'cursor-pointer hover:underline' : ''}`}
          >
            {getLocalizedValue(item, 'title', language)}
          </h4>
          
          {(isExpanded || inquiry) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
              <span className="flex items-center gap-1 text-[9px] text-brand-charcoal/70 font-medium bg-[#F3F1ED] px-2 py-0.5 rounded leading-none select-none">
                <Clock size={9} className="text-[#2E7D32]" /> {item.duration}
              </span>
              {item.travelTime && (
                <span className="flex items-center gap-1 text-[9px] text-brand-charcoal/70 font-medium bg-[#F3F1ED] px-2 py-0.5 rounded leading-none select-none">
                  <Zap size={9} className="text-[#2E7D32]" /> {item.travelTime}
                </span>
              )}
              <span className="flex items-center gap-1 text-[9px] text-brand-charcoal/70 font-medium bg-[#F3F1ED] px-2 py-0.5 rounded leading-none select-none">
                <MapPin size={9} className="text-[#2E7D32]" /> {getLocalizedValue(item, 'location', language)}
              </span>
              {item.preferredTransport && (
                <span className="flex items-center gap-1 text-[9px] text-brand-charcoal/70 font-medium bg-[#F3F1ED] px-2 py-0.5 rounded leading-none select-none">
                  <Car size={9} className="text-[#2E7D32]" /> {item.preferredTransport}
                </span>
              )}
              {item.estimatedCost && (
                <span className="flex items-center gap-1 text-[9px] text-brand-charcoal/70 font-medium bg-[#F3F1ED] px-2 py-0.5 rounded leading-none select-none">
                  <Euro size={9} className="text-[#2E7D32]" /> {item.estimatedCost}
                </span>
              )}
            </div>
          )}

          {(isExpanded || inquiry) && (item.website || item.phone) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5 pt-2 border-t border-dashed border-brand-charcoal/10 text-[9px] text-brand-charcoal/80">
              {item.website && (
                <a 
                  href={item.website} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1 text-[#2E7D32] hover:underline font-semibold"
                >
                  <Globe size={9} /> {t.visit_website || 'Visit Website'}
                </a>
              )}
              {item.phone && (
                <span className="flex items-center gap-1 text-brand-charcoal/60">
                  <Phone size={9} /> {item.phone}
                </span>
              )}
            </div>
          )}
        </div>
        <button 
          onClick={() => onRemove(item.id)}
          className="p-1 text-brand-charcoal/20 hover:text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Date Row and Set Date Button */}
      <div className="flex items-center justify-between py-2.5 border-y border-brand-charcoal/10">
        <div className="flex items-center gap-2">
           <Calendar size={14} className="text-[#3E5037]" />
           <span className="text-xs text-[#3C3A2E] font-bold select-none">
             {item.scheduledDate ? getDisplayDate(item.scheduledDate) : (PLAN_CARD_TR[language] || PLAN_CARD_TR['en']).set_date}
           </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handleRescheduleClick}
            className="text-[12px] uppercase tracking-widest text-[#3E5037] font-black border border-brand-sage px-3 py-1.5 rounded-full cursor-pointer hover:bg-brand-sage/10 transition-colors active:scale-95"
          >
             {(PLAN_CARD_TR[language] || PLAN_CARD_TR['en']).reschedule}
          </button>
        </div>
      </div>

      {/* Localized Seasonal weather forecast modeling */}
      {(isExpanded || inquiry) && (() => {
        if (!item.scheduledDate) return null;
        
        // Match outdoor properties dynamically based on categories, titles, coordinates, and locale keywords
        const isOutdoor = (() => {
          const category = (item.category || '').toLowerCase();
          const locationText = (item.location || '').toLowerCase();
          const titleText = (item.title || '').toLowerCase();
          
          if (category.includes('nature') || (category.includes('clubbing') && locationText.includes('riverfront'))) {
            return true;
          }
          
          const outdoorKeywords = [
            'fortress', 'park', 'canyon', 'mountain', 'lake', 'river', 'gorge', 'wilderness', 
            'confluence', 'silosi', 'belgrade fortress', 'tara', 'uvac', 'tvrđava', 'dunav', 
            'danube', 'sava riverfront', 'savamala', 'gold gondola', 'kopaonik', 'waterfront',
            'viewpoint', 'hike'
          ];
          
          return outdoorKeywords.some(kw => titleText.includes(kw) || locationText.includes(kw));
        })();

        // Compile micro-climate calculations deterministically based on date, geography and language
        const dateObj = new Date(item.scheduledDate);
        if (isNaN(dateObj.getTime())) return null;
        
        const month = dateObj.getMonth();
        const locLow = (item.location || '').toLowerCase();
        const isBelgradeOrVojvodina = locLow.includes('belgrade') || locLow.includes('beograd') || locLow.includes('novi sad') || locLow.includes('fruška gora') || locLow.includes('pančevo') || locLow.includes('vojvodina');

        // Climate indicators mapping
        let climateObj: { tempText: string; condition: string; advice: string; color: string; icon: string } | null = null;
        
        if (!isOutdoor) {
          const indoorTr: Record<string, any> = {
            en: { tempText: "Climate-Controlled", condition: "Indoor Sanctuary", advice: "Fully protected from external elements. A perfect itinerary choice regardless of the season.", color: "bg-[#F6F5F2] border-[#E5E3DB] text-brand-charcoal/70", icon: "🏛️" },
            sr: { tempText: "Kontrolisana klima", condition: "Zatvoreni prostor", advice: "Potpuno zaštićeno od spoljašnjih uticaja. Savršen izvor aktivnosti bez obzira na godišnje doba.", color: "bg-[#F6F5F2] border-[#E5E3DB] text-brand-charcoal/70", icon: "🏛️" },
            de: { tempText: "Klimatisiert", condition: "Innenbereich", advice: "Von jeglicher Witterung geschützt. Eine perfekte Wahl für Ihre Reiseplanung zu jeder Jahreszeit.", color: "bg-[#F6F5F2] border-[#E5E3DB] text-brand-charcoal/70", icon: "🏛️" },
            es: { tempText: "Climatizado", condition: "Espacio Cubierto", advice: "Protegido por completo del clima exterior. Elección perfecta independientemente del mes.", color: "bg-[#F6F5F2] border-[#E5E3DB] text-brand-charcoal/70", icon: "🏛️" },
            ru: { tempText: "Контролируемый микроклимат", condition: "Крытое помещение", advice: "Объект полностью защищен от внешних условий. Замечательно подходит для любого сезона.", color: "bg-[#F6F5F2] border-[#E5E3DB] text-brand-charcoal/70", icon: "🏛️" },
            zh: { tempText: "室内恒温", condition: "室内场所", advice: "完全不受外界天气变化干扰。无论何时到访，均为极致惬意的全天候完美选择。", color: "bg-[#F6F5F2] border-[#E5E3DB] text-brand-charcoal/70", icon: "🏛️" }
          };
          climateObj = indoorTr[language] || indoorTr['en'];
        } else {
          // Freezing Winter Months
          if (month === 11 || month === 0 || month === 1) {
            const winterTr: Record<string, any> = {
              en: { tempText: "-2°C to 4°C", condition: "Winter Ice Advisory", advice: "Exposed path may have sleet or dense fog. Heavy thermal layers and rugged footwear recommended.", color: "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]", icon: "❄️" },
              sr: { tempText: "-2°C do 4°C", condition: "Zimski uslovi i mraz", advice: "Otvorene staze mogu biti zaleđene ili maglovite. Obavezni su termo slojevi i duboka nepromočiva obuća.", color: "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]", icon: "❄️" },
              de: { tempText: "-2°C bis 4°C", condition: "Winter-Frostwarnung", advice: "Erhöhte Frost- und Nebelgefahr auf Außenbühnen. Thermo-Schichten & absolut rutschfestes Schuhwerk ratsam.", color: "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]", icon: "❄️" },
              es: { tempText: "-2°C a 4°C", condition: "Aviso de Helada Invernal", advice: "Pistas y senderos expuestos pueden tener hielo o niebla densa. Capas térmicas gruesas aconsejadas.", color: "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]", icon: "❄️" },
              ru: { tempText: "-2°C до 4°C", condition: "Зимние заморозки", advice: "На открытом воздухе возможен гололед или густой туман. Рекомендуются теплые слои и высокая обувь.", color: "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]", icon: "❄️" },
              zh: { tempText: "-2°C 至 4°C", condition: "严寒与结冰预警", advice: "户外行道可能出现湿滑结冰或浓雾。请穿着高保暖防寒服以及防滑耐磨鞋。", color: "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]", icon: "❄️" }
            };
            climateObj = winterTr[language] || winterTr['en'];
          }
          // Chilly transition months showing Wind / Autumn chill
          else if (month === 2 || month === 10) {
            if (isBelgradeOrVojvodina) {
              const kosavaTr: Record<string, any> = {
                en: { tempText: "6°C to 13°C", condition: "Exposed Košava Gale Warning", advice: "Strong, gusty cold southeasterly Košava wind sweeps across riverfronts. Secure light baggage and wear windbreakers.", color: "bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]", icon: "💨" },
                sr: { tempText: "6°C do 13°C", condition: "Udari hladne Košave", advice: "Jak, hladan jugoistočni vetar (Košava) duva duž reka. Obavezna je vetrovka i izbegavanje kapa na otvorenom.", color: "bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]", icon: "💨" },
                de: { tempText: "6°C bis 13°C", condition: "Košava-Sturmwarnung", advice: "Starke, böige Kaltwinde aus Südosten peitschen über Flussufer. Windfeste Kleidung unbedingt erforderlich.", color: "bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]", icon: "💨" },
                es: { tempText: "6°C a 13°C", condition: "Vientos Fuertes Košava", advice: "Ráfagas secas e intensas del sureste soplan en la ribera del río. Use chubasquero o cortavientos firme.", color: "bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]", icon: "💨" },
                ru: { tempText: "6°C до 13°C", condition: "Холодные порывы ветра Кошава", advice: "Очень сильный, порывистый ветер с Дуная на открытых набережных. Рекомендуются ветрозащитные куртки.", color: "bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]", icon: "💨" },
                zh: { tempText: "6°C 至 13°C", condition: "Košava 强风防风警示", advice: "多瑙河与萨瓦河汇流区特有强风。阵风凛冽，体感寒冷，请务必穿着密闭型防风战衣。", color: "bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]", icon: "💨" }
              };
              climateObj = kosavaTr[language] || kosavaTr['en'];
            } else {
              const transitionalTr: Record<string, any> = {
                en: { tempText: "5°C to 12°C", condition: "Chilly Mountain Climate", advice: "Volatile mountain temperatures. Bring layers and high-quality boots; prepare for damp trails.", color: "bg-[#F1F5F9] border-[#E2E8F0] text-[#475569]", icon: "🌬️" },
                sr: { tempText: "5°C do 12°C", condition: "Sveže vreme u planinama", advice: "Brze promene temperature na planinskom vazduhu. Ponesite tople slojeve i čvrstu obuću za vlažne staze.", color: "bg-[#F1F5F9] border-[#E2E8F0] text-[#475569]", icon: "🌬️" },
                de: { tempText: "5°C bis 12°C", condition: "Berg-Klimawandel", advice: "Instabile Gebirgstemperaturen. Bringen Sie wärmende Schichten mit und stellen Sie sich auf feuchte Wege ein.", color: "bg-[#F1F5F9] border-[#E2E8F0] text-[#475569]", icon: "🌬️" },
                es: { tempText: "5°C a 12°C", condition: "Clima Frío de Altura", advice: "Cambios drásticos de temperatura. Póngase capas interiores térmicas y use calzado firme repelente al agua.", color: "bg-[#F1F5F9] border-[#E2E8F0] text-[#475569]", icon: "🌬️" },
                ru: { tempText: "5°C до 12°C", condition: "Переменная горная прохлада", advice: "Быстрая смена погоды на высотах. Рекомендуется брать с собой теплые кофты и непромокаемые ботинки.", color: "bg-[#F1F5F9] border-[#E2E8F0] text-[#475569]", icon: "🌬️" },
                zh: { tempText: "5°C 至 12°C", condition: "山区多变湿冷气候", advice: "林区与高地温度容易迅速下挫。建议携带多层可穿脱衣物，行道可能伴有薄泥。", color: "bg-[#F1F5F9] border-[#E2E8F0] text-[#475569]", icon: "🌬️" }
              };
              climateObj = transitionalTr[language] || transitionalTr['en'];
            }
          }
          // Peak Rainfall months (May & June are historically the wettest in Serbia, high convective showers)
          else if (month === 4 || month === 5) {
            const wetTr: Record<string, any> = {
              en: { tempText: "14°C to 24°C", condition: "High Thunderstorm Risk", advice: "May & June is Serbia's peak seasonal rainfall window. Suddden heavy afternoon local summer storm likely; please bring an umbrella.", color: "bg-[#EFF6FF] border-[#DBEAFE] text-[#1D4ED8]", icon: "⛈️" },
              sr: { tempText: "14°C do 24°C", condition: "Rizik od popodnevnih nepogoda", advice: "Maj i jun imaju najveću količinu padavina. Iznenadni i jaki pljuskovi sa grmljavinom su česti popodne; ponesite kišobran.", color: "bg-[#EFF6FF] border-[#DBEAFE] text-[#1D4ED8]", icon: "⛈️" },
              de: { tempText: "14°C bis 24°C", condition: "Erhöhte Gewitterwahrscheinlichkeit", advice: "Mai und Juni sind die nassesten Monate Serbiens. Plötzlicher Starkregen am Nachmittag ist üblich; Schirm empfehlenswert.", color: "bg-[#EFF6FF] border-[#DBEAFE] text-[#1D4ED8]", icon: "⛈️" },
              es: { tempText: "14°C a 24°C", condition: "Riesgo de Tormentas Estivales", advice: "Mayo y junio representan el máximo de precipitaciones en Serbia. Tormentas locales fuertes por la tarde; lleve paraguas.", color: "bg-[#EFF6FF] border-[#DBEAFE] text-[#1D4ED8]", icon: "⛈️" },
              ru: { tempText: "14°C до 24°C", condition: "Сезон гроз и ливней", advice: "Май и июнь — пик годовых осадков в Сербии. Вероятны внезапные сильные грозы во второй половине дня; захватите зонт.", color: "bg-[#EFF6FF] border-[#DBEAFE] text-[#1D4ED8]", icon: "⛈️" },
              zh: { tempText: "14°C 至 24°C", condition: "午后特大对流雷雨预警", advice: "5月与6月是塞尔维亚雨水最充沛的历史高峰。极易遭遇短时特大雷雨暴风，出行必携折叠伞。", color: "bg-[#EFF6FF] border-[#DBEAFE] text-[#1D4ED8]", icon: "⛈️" }
            };
            climateObj = wetTr[language] || wetTr['en'];
          }
          // Scorching Summer months
          else if (month === 6 || month === 7) {
            const hotTr: Record<string, any> = {
              en: { tempText: "30°C to 38°C+", condition: "Extreme Summer Heat Advisory", advice: "Intense midday Balkan sun. Avoid peak open solar exposure between 11:00 - 15:30. Apply sunscreen and maintain high hydration.", color: "bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B]", icon: "🥵" },
              sr: { tempText: "30°C do 38°C+", condition: "Ekstremno visoke temperature", advice: "Jako sunčevo zračenje i temperature. Izbegavajte direktnu izloženost suncu između 11:00 i 15:30. Nosite kapu i pijte dosta vode.", color: "bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B]", icon: "🥵" },
              de: { tempText: "30°C bis 38°C+", condition: "Extreme Sommerhitze-Warnung", advice: "Sehr starke UV-Belastung. Vermeiden Sie pralle Sonne zwischen 11:00 - 15:30 Uhr. Verwenden Sie Sonnenschutz & trinken ausreichend Wasser.", color: "bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B]", icon: "🥵" },
              es: { tempText: "30°C a 38°C+", condition: "Alerta por Ola de Calor", advice: "Sol y radiación balcánica alta. Se desaconseja caminar directamente al descubierto de 11:00 a 15:30. Use SPF alto y beba agua.", color: "bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B]", icon: "🥵" },
              ru: { tempText: "30°C до 38°C+", condition: "Предупреждение об аномальной жаре", advice: "Высокая солнечная активность. Избегайте прямых лучей с 11:00 до 15:30. Обязательны солнцезащитный крем и частая вода.", color: "bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B]", icon: "🥵" },
              zh: { tempText: "30°C 至 38°C+", condition: "极端夏季暴汗日灼预警", advice: "巴尔干夏季紫外线照射猛烈。请尽量规避 11:00 至 15:30 强日光暴晒，出游请抹防晒霜并及时充足补水。", color: "bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B]", icon: "🥵" }
            };
            climateObj = hotTr[language] || hotTr['en'];
          }
          // Golden Autumn (Indian Summer / Miholjsko Leto)
          else if (month === 8 || month === 9) {
            const autumnTr: Record<string, any> = {
              en: { tempText: "16°C to 23°C", condition: "Pleasant Golden Autumn", advice: "Stunning mild conditions ('Miholjsko Leto'). Excellent sky visibility and crisp local breeze. Ideal for open hikes and fortress exploration.", color: "bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]", icon: "🍂" },
              sr: { tempText: "16°C do 23°C", condition: "Predivno zlatno Miholjsko Leto", advice: "Izuzetno suvo i prijatno vreme sa blagim povetarcem. Savršeni panoramski vidikovci, idealno za tvrđave i izlete.", color: "bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]", icon: "🍂" },
              de: { tempText: "16°C bis 23°C", condition: "Perfektes Miholjsko Leto", advice: "Wunderbarer, trockener Altweibersommer. Spektakuläre Fernsicht auf Aussichtspunkten. Erstklassige Bedingungen für Wanderungen.", color: "bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]", icon: "🍂" },
              es: { tempText: "16°C a 23°C", condition: "Excelente 'Veranillo de San Miguel'", advice: "Brisa templada fantástica y cielos despejados. Época ideal para visitas de altura, fortalezas y caminatas largas sin agobio.", color: "bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]", icon: "🍂" },
              ru: { tempText: "16°C до 23°C", condition: "Превосходная золотая осень", advice: "Шикарные сухие и ясные дни бабьего лета. Идеальная видимость на высотах. Рекомендуется для долгих походов и крепостей.", color: "bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]", icon: "🍂" },
              zh: { tempText: "16°C 至 23°C", condition: "明亮宜人金秋（小阳春）", advice: "传统高能舒适期（Miholjsko Leto）。绝佳晴空能见度伴有清脆微风。极力推荐露天遗址观光与高峦徒步。", color: "bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]", icon: "🍂" }
            };
            climateObj = autumnTr[language] || autumnTr['en'];
          } else {
            // General Spring months
            const springTr: Record<string, any> = {
              en: { tempText: "11°C to 19°C", condition: "Vibrant Temperate Spring", advice: "Generally pleasing and dynamic weather. A light windproof outer jacket or hood is recommended.", color: "bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]", icon: "🌱" },
              sr: { tempText: "11°C do 19°C", condition: "Umereno prolećno vreme", advice: "Uglavnom prijatno i promenljivo vreme. Preporučuje se lagana vetrovka za prohladno veče.", color: "bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]", icon: "🌱" },
              de: { tempText: "11°C bis 19°C", condition: "Angenehmer Frühling", advice: "Sehr mildes, dynamisches Frühlingswetter. Eine leichte winddichte Jacke wird für die kühlen Abendstunden empfohlen.", color: "bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]", icon: "🌱" },
              es: { tempText: "11°C a 19°C", condition: "Primavera Templada", advice: "Clima templado cambiante y agradable. Un cortavientos ligero es ideal para las caminatas vespertinas.", color: "bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]", icon: "🌱" },
              ru: { tempText: "11°C до 19°C", condition: "Теплая весенняя погода", advice: "Обычно приятная весенняя атмосфера. Легкая плотная куртка будет кстати для вечерних прогулок.", color: "bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]", icon: "🌱" },
              zh: { tempText: "11°C 至 19°C", condition: "晴和温润初春", advice: "气候普遍多变温暖。随身常备薄款抗风防泼水风衣或连帽衫即是完美的户外穿搭方案。", color: "bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]", icon: "🌱" }
            };
            climateObj = springTr[language] || springTr['en'];
          }
        }

        if (!climateObj) return null;

        const forecastNotice: Record<string, string> = {
          en: "Please check the latest local forecast prior to departure.",
          sr: "Molimo proverite najnoviju vremensku prognozu pre polaska.",
          de: "Bitte prüfen Sie vor der Abreise die aktuelle Wettervorhersage.",
          es: "Por favor, consulte el pronóstico meteorológico actualizado antes de salir.",
          ru: "Пожалуйста, проверьте актуальный прогноз погоды перед выездом.",
          zh: "出行前请关注最新天气预报。"
        };

        const activeNotice = forecastNotice[language] || forecastNotice['en'];

        return (
          <div className={`p-3.5 rounded-xl border flex flex-col gap-1.5 transition-all duration-300 ${climateObj.color}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm select-none leading-none">{climateObj.icon}</span>
                <span className="text-[12px] font-black uppercase tracking-widest">{climateObj.condition}</span>
              </div>
              <span className="font-mono text-[12px] font-bold opacity-95 bg-white bg-opacity-60 px-2 py-0.5 rounded-full">{climateObj.tempText}</span>
            </div>
            <p className="text-[13px] leading-relaxed font-sans font-medium tracking-wide opacity-95">
              {climateObj.advice}
              <span className="font-bold block mt-1 opacity-95 text-[12px] italic border-t border-current/20 pt-1">
                ⚠️ {activeNotice}
              </span>
            </p>
          </div>
        );
      })()}

      {/* Arrange This / Request Arrangement Expanded Inputs */}
      {isExpanded && !submitting && !inquiry && (
        <div className="space-y-3 p-3.5 bg-brand-sage/5 rounded-xl border border-brand-sage/20">
          {/* Visitor Name & Contact Fields */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-[#5C5A4D] font-bold block">
                {language === 'sr' ? 'Ime i prezime' : language === 'zh' ? '姓名' : 'Visitor Name'}
              </label>
              <input
                type="text"
                value={visitorNameInput}
                onChange={(e) => setVisitorNameInput(e.target.value)}
                placeholder="e.g. Elena Vance"
                className="w-full px-3 py-2 text-xs bg-white border border-border-main rounded-xl focus:outline-none focus:border-accent-teal font-sans text-brand-charcoal transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-[#5C5A4D] font-bold block">
                {language === 'sr' ? 'Email ili telefon' : language === 'zh' ? '联系电邮/电话' : 'Email or Phone'}
              </label>
              <input
                type="text"
                value={contactInfoInput}
                onChange={(e) => setContactInfoInput(e.target.value)}
                placeholder="email@example.com / +381..."
                className="w-full px-3 py-2 text-xs bg-white border border-border-main rounded-xl focus:outline-none focus:border-accent-teal font-sans text-brand-charcoal transition-all"
              />
            </div>
          </div>

          {/* Preferred Time Field */}
          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-wider text-[#5C5A4D] font-bold block">
              {ARRANGE_TR[language]?.preferred_time || ARRANGE_TR['en'].preferred_time}
            </label>
            <input
              type="text"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              placeholder={ARRANGE_TR[language]?.time_placeholder || ARRANGE_TR['en'].time_placeholder}
              className="w-full px-3 py-2 text-xs bg-white border border-border-main rounded-xl focus:outline-none focus:border-accent-teal font-sans text-brand-charcoal transition-all"
            />
          </div>

          {/* Special Requests Textarea */}
          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-wider text-[#5C5A4D] font-bold block">
              {ARRANGE_TR[language]?.personal_notes || ARRANGE_TR['en'].personal_notes}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={ARRANGE_TR[language]?.notes_placeholder || ARRANGE_TR['en'].notes_placeholder}
              className="w-full p-3 text-xs bg-white border border-border-main rounded-xl focus:outline-none focus:border-accent-teal font-sans text-brand-charcoal transition-all placeholder:text-[#5C5A4D]/50"
            />
          </div>

          {/* Submission Error Banner */}
          {submissionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
              <p className="font-bold">
                {submissionError.startsWith('NO_DB_ID')
                  ? 'Online Concierge arrangements require a live database recommendation. Direct concierge contacts are available below.'
                  : submissionError}
              </p>
              <p className="text-[10px] text-red-600">
                You can contact our VIP Concierge team directly via WhatsApp or Instagram.
              </p>
            </div>
          )}

          {/* Inline Action Triggers */}
          <div className="grid grid-cols-2 gap-3.5 pt-1.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(5);
                setIsExpanded(false);
                setSubmissionError(null);
              }}
              className="h-10 rounded-xl border border-brand-charcoal/20 text-[10px] uppercase tracking-wider font-bold hover:bg-brand-charcoal/5 cursor-pointer transition-all"
            >
              {(PLAN_CARD_TR[language] || PLAN_CARD_TR['en']).cancel}
            </button>
            <button
              type="button"
              onClick={handleRequestArrangement}
              className="h-10 rounded-xl bg-brand-charcoal hover:bg-brand-charcoal/90 text-white text-[10px] uppercase tracking-widest font-black cursor-pointer shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <span>{ARRANGE_TR[language]?.request_arrangement || ARRANGE_TR['en'].request_arrangement}</span>
            </button>
          </div>
        </div>
      )}

      {/* Dispatching simulated state progress bar */}
      {submitting && (
        <div className="py-7 flex flex-col items-center justify-center text-center space-y-3.5 bg-brand-sage/5 rounded-xl border border-brand-sage/20 p-4">
          <div className="relative w-11 h-11 flex items-center justify-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="absolute inset-0 border-4 border-accent-teal/10 border-t-accent-teal rounded-full"
            />
            <span className="text-accent-teal text-base animate-bounce">🧭</span>
          </div>

          <div className="space-y-1 w-full">
            <h5 className="font-serif text-[11px] font-bold text-brand-charcoal">
              {language === 'sr' ? 'Slanje upita u toku...' : language === 'zh' ? '正在传送专属申请...' : 'Dispatching Arrangement Request...'}
            </h5>
            <div className="w-36 h-1 bg-[#EAE8DF] rounded-full overflow-hidden mx-auto">
              <div 
                className="h-full bg-accent-teal transition-all duration-100" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="text-[7.5px] font-mono tracking-wide text-brand-charcoal/50 min-h-[10px]">
            {progress < 35 
              ? 'Initializing premium proxy secure brokering...' 
              : progress < 70 
              ? 'Securing connection to designated Belgrade VIP hotline...' 
              : 'Registering referral broker handshake...'}
          </p>
        </div>
      )}

      {/* Persisted inquiry confirmed record status tracker */}
      {inquiry && (
        <div className="p-4 bg-[#F2F5F3] rounded-2xl border border-brand-sage/30 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[8px] uppercase tracking-widest font-black text-brand-charcoal/40">
                {language === 'sr' ? 'STATUS UPITA' : language === 'zh' ? '服务进度状态' : 'ARRANGEMENT STATUS'}
              </span>
              <div className="flex items-center gap-1.5 bg-[#E8EFE9] border border-brand-sage/40 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#3E5037]">
                  {inquiry.visitorStatusLabel || inquiry.status || (ARRANGE_TR[language]?.assistance_requested || ARRANGE_TR['en'].assistance_requested)}
                </span>
              </div>
            </div>
            
            {/* Steps Timeline visual feedback */}
            <div className="flex items-center justify-between px-1.5 pt-1">
              <div className="flex flex-col items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-[#3E5037] text-white flex items-center justify-center text-[9px] font-black">✓</div>
                <span className="text-[7.5px] font-black text-brand-charcoal uppercase leading-none">Requested</span>
              </div>
              <div className="h-0.5 flex-1 bg-brand-charcoal/10 mx-1 -translate-y-2" />
              <div className="flex flex-col items-center gap-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border ${activeProposal ? 'bg-[#3E5037] text-white border-[#3E5037]' : 'bg-white text-brand-charcoal/30 border-brand-charcoal/10'}`}>
                  {activeProposal ? '✓' : '2'}
                </div>
                <span className="text-[7.5px] font-bold text-brand-charcoal/30 uppercase leading-none">Review</span>
              </div>
              <div className="h-0.5 flex-1 bg-brand-charcoal/10 mx-1 -translate-y-2" />
              <div className="flex flex-col items-center gap-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border ${inquiry.status === 'Arrangement Confirmed' ? 'bg-[#3E5037] text-white border-[#3E5037]' : 'bg-white text-brand-charcoal/30 border-brand-charcoal/10'}`}>
                  {inquiry.status === 'Arrangement Confirmed' ? '✓' : '3'}
                </div>
                <span className="text-[7.5px] font-bold text-brand-charcoal/30 uppercase leading-none">Confirm</span>
              </div>
            </div>
          </div>

          {/* Reference Badge details */}
          <div className="p-3 bg-white rounded-xl border border-brand-sage/20 text-center font-mono space-y-1 shadow-sm select-all">
            <span className="text-[7px] uppercase tracking-[0.2em] font-mono text-[#8C8A7D] block">
              {ARRANGE_TR[language]?.inquiry_reference || ARRANGE_TR['en'].inquiry_reference}
            </span>
            <div className="text-xs font-black text-[#3E5037] tracking-tighter">
              {inquiry.referenceCode}
            </div>
            {inquiry.preferredTime && (
              <div className="text-[9px] text-brand-charcoal/70 font-sans mt-1">
                <span className="font-bold">{ARRANGE_TR[language]?.preferred_time || ARRANGE_TR['en'].preferred_time}:</span> {inquiry.preferredTime}
              </div>
            )}
            {inquiry.notes && (
              <div className="text-[9px] text-brand-charcoal/70 font-sans italic max-w-full truncate px-2">
                "{inquiry.notes}"
              </div>
            )}
          </div>

          {/* Live Status Refresh Trigger & Proposal Box */}
          {inquiry.serverInquiryId && getVisitorCredential(inquiry.serverInquiryId) && (
            <div className="space-y-2.5 pt-1 border-t border-brand-sage/20">
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={checkingStatus}
                className="w-full h-8 bg-[#3E5037]/10 hover:bg-[#3E5037]/20 text-[#3E5037] text-[9px] uppercase tracking-wider font-bold rounded-xl border border-[#3E5037]/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              >
                {checkingStatus ? (
                  <span className="animate-spin text-xs">⚙</span>
                ) : (
                  <span>{language === 'sr' ? 'PROVERI STATUS UPITA' : 'CHECK STATUS'}</span>
                )}
              </button>

              {statusFeedback && (
                <p className="text-[8.5px] font-medium text-[#3E5037] text-center bg-white/80 p-2 rounded-lg border border-brand-sage/30">
                  {statusFeedback}
                </p>
              )}

              {/* Active Proposal Card if available */}
              {activeProposal && activeProposal.proposal_found && (
                <div className="p-3 bg-white rounded-xl border-2 border-[#3E5037]/30 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-brand-charcoal/10 pb-1.5">
                    <span className="text-[8px] uppercase tracking-widest font-black text-[#3E5037]">
                      {language === 'sr' ? 'PONUDA PARTNERA' : 'PARTNER PROPOSAL'}
                    </span>
                    {activeProposal.response_type && (
                      <span className="text-[8px] font-bold text-brand-charcoal/60 uppercase">
                        {activeProposal.response_type}
                      </span>
                    )}
                  </div>

                  {activeProposal.message && (
                    <p className="text-[9.5px] text-brand-charcoal leading-relaxed font-sans bg-brand-sage/5 p-2 rounded-lg border border-brand-sage/10">
                      "{activeProposal.message}"
                    </p>
                  )}

                  {(activeProposal.proposed_start_at || activeProposal.proposed_end_at) && (
                    <div className="text-[8.5px] text-brand-charcoal/80 font-mono">
                      <span className="font-bold">{language === 'sr' ? 'Predloženo vreme:' : 'Proposed Time:'}</span>{' '}
                      {activeProposal.proposed_start_at ? new Date(activeProposal.proposed_start_at).toLocaleString() : ''}
                    </div>
                  )}

                  {/* Reason input for decline / alternative */}
                  <input
                    type="text"
                    placeholder={language === 'sr' ? 'Napomena (opciono)...' : 'Reason / Note (optional)...'}
                    value={proposalReason}
                    onChange={(e) => setProposalReason(e.target.value)}
                    className="w-full text-[9px] px-2.5 py-1.5 rounded-lg border border-brand-charcoal/15 bg-brand-cream/30 focus:outline-none focus:border-[#3E5037]"
                  />

                  {/* Proposal Action Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={handleConfirmProposal}
                      disabled={actionInProgress}
                      className="h-8 bg-[#3E5037] hover:bg-[#3E5037]/90 text-white text-[8px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      {language === 'sr' ? 'POTVRDI' : 'CONFIRM'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestAlternative}
                      disabled={actionInProgress}
                      className="h-8 bg-brand-charcoal/10 hover:bg-brand-charcoal/20 text-brand-charcoal text-[8px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      {language === 'sr' ? 'IZMENA' : 'ALTERNATIVE'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeclineProposal}
                      disabled={actionInProgress}
                      className="h-8 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[8px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      {language === 'sr' ? 'ODBIJ' : 'DECLINE'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-[8px] italic text-[#8C8A7D] text-center leading-normal">
            {CONCIERGE_T[language]?.warning || CONCIERGE_T['en'].warning}
          </p>

          {/* Direct channels gateways with copy buffer */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://wa.me/381621873260"
              onClick={() => {
                triggerHaptic(5);
                const textMessage = `Hello Concierge,

I would like to arrange a premium experience.

Inquiry Reference: ${inquiry.referenceCode}
Regarding: ${getLocalizedValue(item, 'title', language)}
Preferred Time: ${inquiry.preferredTime || 'Any time'}
Visitor Notes: ${inquiry.notes || 'None'}
Language: ${language === 'sr' ? 'Serbian' : language === 'zh' ? 'Chinese' : 'English'}`;
                
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(textMessage).catch(() => {});
                }
                setCopiedChannel('whatsapp');
                setTimeout(() => setCopiedChannel(null), 3000);
              }}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 border border-[#25D366]/30 bg-[#25D366]/5 hover:bg-[#25D366]/10 text-[#128C7E] transition-all cursor-pointer"
            >
              <span>{copiedChannel === 'whatsapp' ? 'COPIED!' : 'WHATSAPP'}</span>
            </a>
            <a
              href="https://instagram.com/idemo.app"
              onClick={() => {
                triggerHaptic(5);
                const textMessage = `Hello Concierge,

I would like to arrange a premium experience.

Inquiry Reference: ${inquiry.referenceCode}
Regarding: ${getLocalizedValue(item, 'title', language)}
Preferred Time: ${inquiry.preferredTime || 'Any time'}
Visitor Notes: ${inquiry.notes || 'None'}
Language: ${language === 'sr' ? 'Serbian' : language === 'zh' ? 'Chinese' : 'English'}`;

                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(textMessage).catch(() => {});
                }
                setCopiedChannel('instagram');
                setTimeout(() => setCopiedChannel(null), 3000);
              }}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 border border-[#E1306C]/30 bg-[#E1306C]/5 hover:bg-[#E1306C]/10 text-[#E1306C] transition-all cursor-pointer"
            >
              <span>{copiedChannel === 'instagram' ? 'COPIED!' : 'INSTAGRAM'}</span>
            </a>
          </div>

          {/* Remove from this device option */}
          <div className="pt-2 text-center border-t border-brand-sage/10">
            <button
              type="button"
              onClick={handleRemoveFromDevice}
              className="text-[8px] uppercase tracking-wider text-brand-charcoal/40 hover:text-red-600 underline cursor-pointer transition-colors"
            >
              {language === 'sr' ? 'Ukloni upit sa ovog uređaja' : 'Remove request from this device'}
            </button>
          </div>
        </div>
      )}


      {/* Default Arrange This entry CTA triggers */}
      {item.isAvailable === false ? (
        <div className="mt-1 pt-1">
          <div className="p-3 bg-[#FEF3C7]/40 border border-[#F59E0B]/30 rounded-xl text-center text-[10px] font-bold text-[#B45309]">
            {language === 'sr' ? 'Arhivirana lokacija — slanje upita onemogućeno.' : 'Archived recommendation — assistance request is disabled.'}
          </div>
        </div>
      ) : (!inquiry && !isExpanded && (
        <div className="mt-1 pt-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setIsExpanded(true);
            }}
            className="w-full h-11 bg-[#3E5037] hover:bg-[#3E5037]/90 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <span>{ARRANGE_TR[language]?.arrange_this || ARRANGE_TR['en'].arrange_this}</span>
          </button>
        </div>
      ))}
    </motion.div>

    <AnimatePresence>
      {showCalendar && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[250] flex items-center justify-center p-4"
          onClick={() => setShowCalendar(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 15 }}
            className="bg-[#FAF9F5] border border-[#E5E3DB] w-full max-w-sm rounded-[24px] p-5 shadow-2xl flex flex-col gap-4 text-brand-charcoal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-brand-charcoal/10 pb-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-[#3E5037]" />
                <h3 className="font-serif text-[16px] font-bold tracking-tight text-brand-charcoal">
                  {(PLAN_CARD_TR[language] || PLAN_CARD_TR['en']).reschedule_item}
                </h3>
              </div>
              <button 
                onClick={() => { triggerHaptic(5); setShowCalendar(false); }}
                className="w-7 h-7 rounded-full bg-brand-charcoal/5 flex items-center justify-center hover:bg-brand-charcoal/10 cursor-pointer transition-colors"
              >
                <X size={14} className="text-brand-charcoal" />
              </button>
            </div>

            {/* Month Selector */}
            <div className="flex items-center justify-between bg-white/50 border border-brand-charcoal/5 px-3 py-2 rounded-xl">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-brand-charcoal/5 cursor-pointer transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-serif font-bold text-sm select-none">
                {(MONTH_NAMES[language] || MONTH_NAMES['en'])[viewMonth]} {viewYear}
              </span>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-brand-charcoal/5 cursor-pointer transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekdays Grid */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] uppercase tracking-wider text-brand-charcoal/50">
              {(WEEKDAY_NAMES[language] || WEEKDAY_NAMES['en']).map((day, idx) => (
                <div key={idx} className="py-1">{day}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((dayNum, idx) => {
                if (dayNum === null) {
                  return <div key={`empty-${idx}`} className="p-2" />;
                }

                const isSelected = selectedDate.getDate() === dayNum && 
                                   selectedDate.getMonth() === viewMonth && 
                                   selectedDate.getFullYear() === viewYear;

                return (
                  <button
                    key={`day-${dayNum}`}
                    onClick={() => handleDaySelect(dayNum)}
                    className={`p-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center h-8 w-8 mx-auto ${
                      isSelected 
                        ? 'bg-[#3E5037] text-white shadow-md font-black scale-105' 
                        : 'hover:bg-brand-charcoal/5 text-brand-charcoal'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-brand-charcoal/10">
              <button
                onClick={() => { triggerHaptic(5); setShowCalendar(false); }}
                className="h-10 rounded-xl border border-brand-charcoal/20 text-xs uppercase tracking-wider font-bold hover:bg-brand-charcoal/5 cursor-pointer transition-colors"
              >
                {(PLAN_CARD_TR[language] || PLAN_CARD_TR['en']).cancel}
              </button>
              <button
                onClick={handleSaveDate}
                className="h-10 rounded-xl bg-[#3E5037] text-white text-xs uppercase tracking-wider font-bold hover:bg-[#3E5037]/90 cursor-pointer shadow-sm transition-colors"
              >
                {(PLAN_CARD_TR[language] || PLAN_CARD_TR['en']).save}
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
