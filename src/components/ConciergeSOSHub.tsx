import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  PhoneCall,
  MapPin,
  Clock,
  Car,
  Compass,
  Building,
  CreditCard,
  Check,
  Copy,
  ChevronDown,
  Info,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { triggerHaptic } from "../App";

interface EmbassyData {
  name: Record<string, string>;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  emergencyPhone: string;
}

const EMBASSIES: Record<string, EmbassyData> = {
  de: {
    name: {
      en: "Embassy of the Federal Republic of Germany",
      sr: "Ambasada Savezne Republike Nemačke",
      de: "Botschaft der Bundesrepublik Deutschland",
      es: "Embajada de la República Federal de Alemania",
      ru: "Посольство Федеративной Республики Германия",
      zh: "德意志联邦共和国大使馆",
    },
    address: "Kneza Miloša 74-76, Beograd",
    lat: 44.8018,
    lng: 20.4578,
    phone: "+381 11 3064000",
    emergencyPhone: "+381 63 214363",
  },
  es: {
    name: {
      en: "Embassy of the Kingdom of Spain",
      sr: "Ambasada Kraljevine Španije",
      de: "Botschaft des Königreichs Spanien",
      es: "Embajada del Reino de España",
      ru: "Посольство Королевства Испания",
      zh: "西班牙王国大使馆",
    },
    address: "Prote Mateje 45, Beograd",
    lat: 44.8039,
    lng: 20.4705,
    phone: "+381 11 3440231",
    emergencyPhone: "+381 63 285032",
  },
  us: {
    name: {
      en: "Embassy of the United States of America",
      sr: "Ambasada Sjedinjenih Američkih Država",
      de: "Botschaft der Vereinigten Staaten von Amerika",
      es: "Embajada de los Estados Unidos",
      ru: "Посольство Соединенных Штатов Америки",
      zh: "美利坚合众国大使馆",
    },
    address: "Bulevar kneza Aleksandra Karađorđevića 92, Beograd",
    lat: 44.7702,
    lng: 20.4539,
    phone: "+381 11 7064000",
    emergencyPhone: "+381 11 7064000",
  },
  cn: {
    name: {
      en: "Embassy of the People's Republic of China",
      sr: "Ambasada Narodne Republike Kine",
      de: "Botschaft der Volksrepublik China",
      es: "Embajada de la República Popular China",
      ru: "Посольство Китайской Народной Республики",
      zh: "中华人民共和国大使馆",
    },
    address: "Užička 25, Beograd",
    lat: 44.7865,
    lng: 20.4529,
    phone: "+381 11 3695000",
    emergencyPhone: "+381 63 435555",
  },
  ru: {
    name: {
      en: "Embassy of the Russian Federation",
      sr: "Ambasada Ruske Federacije",
      de: "Botschaft der Russischen Föderation",
      es: "Embajada de la Federación de Rusia",
      ru: "Посольство Российской Федерации",
      zh: "俄罗斯联邦大使馆",
    },
    address: "Deligradska 32, Beograd",
    lat: 44.8011,
    lng: 20.4647,
    phone: "+381 11 3611090",
    emergencyPhone: "+381 63 385034",
  },
  uk: {
    name: {
      en: "Embassy of the United Kingdom",
      sr: "Ambasada Ujedinjenog Kraljevstva",
      de: "Botschaft des Vereinigten Königreichs",
      es: "Embajada del Reino Unido",
      ru: "Посольство Великобритании",
      zh: "英国大使馆",
    },
    address: "Resavska 46, Beograd",
    lat: 44.8058,
    lng: 20.4665,
    phone: "+381 11 3060900",
    emergencyPhone: "+381 62 214902",
  },
};

const ZONES = [
  {
    id: "red",
    name: {
      en: "Red Zone (Zone 1)",
      sr: "Crvena zona (Zona 1)",
      es: "Zona Roja",
      de: "Rote Zone",
      ru: "Красная зона",
      zh: "红色区域",
    },
    fee: "60 RSD / hr",
    duration: "Max 1 hr",
    sms: "9111",
  },
  {
    id: "yellow",
    name: {
      en: "Yellow Zone (Zone 2)",
      sr: "Žuta zona (Zona 2)",
      es: "Zona Amarilla",
      de: "Gelbe Zone",
      ru: "Желтая зона",
      zh: "黄色区域",
    },
    fee: "48 RSD / hr",
    duration: "Max 2 hr",
    sms: "9112",
  },
  {
    id: "green",
    name: {
      en: "Green Zone (Zone 3)",
      sr: "Zelena zona (Zona 3)",
      es: "Zona Verde",
      de: "Grüne Zone",
      ru: "Зеленая зона",
      zh: "绿色区域",
    },
    fee: "41 RSD / hr",
    duration: "Max 3 hr",
    sms: "9113",
  },
  {
    id: "blue",
    name: {
      en: "Blue Zone (No limit)",
      sr: "Plava zona (Bez limita)",
      es: "Zona Azul",
      de: "Blaue Zone",
      ru: "Синяя зона",
      zh: "蓝色区域",
    },
    fee: "31 RSD / hr",
    duration: "No limit",
    sms: "9119",
  },
];

export function ConciergeSOSHub({ language }: { language: string }) {
  const [selectedEmbassy, setSelectedEmbassy] = useState<string>("de");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [plateNumber, setPlateNumber] = useState("");
  const [selectedZone, setSelectedZone] = useState("red");

  const content: Record<string, any> = {
    en: {
      title: "Concierge SOS & Travel Support",
      subtitle:
        "Crisis numbers, authenticated premium transport, parking tools and diplomatic support.",
      emergency_title: "Crisis & First Response",
      universal_rescue: "Universal Rescue",
      police: "Police Department",
      fire: "Fire Rescue Service",
      medical: "Medical Emergencies",
      road_assist: "Roadside Assistance (AMSS)",
      english_notice: "Operators support English and regional EXPO languages.",
      taxi_title: "Curated Licensed Fleets",
      taxi_tip:
        "Only use taxi stands with TX license plates. Avoid unsolicited drivers at exit gates.",
      taxi_button: "Direct Dial",
      embassy_title: "Diplomatic Concierge Referral",
      embassy_select: "Select Nationality",
      embassy_address: "Belgrade Address",
      embassy_phone: "Inquiries",
      embassy_sos: "24/7 Diplomatic Emergencies",
      parking_title: "Belgrade Smart Parking Assistant",
      parking_sub:
        "SMS to designated code based on area paint colors. Free after 9:00 PM and Sundays.",
      plate_label: "Enter License Plate (e.g., BG123XX)",
      copy_directive: "Tap to copy plate for SMS",
      copied: "Copied!",
      emergency_verified: "EXPO Verified Protocol",
      start_sms_payment: "Start SMS Payment",
      sms_helper:
        "Your phone will open Messages. Review and send the SMS yourself.",
      sms_fallback: "SMS not opening? Copy the details and send manually.",
    },
    sr: {
      title: "SOS i putna asistencija",
      subtitle:
        "Hitne službe, sertifikovani gradski prevoz, servis za parking i diplomatska predstavništva.",
      emergency_title: "Službe prvog odgovora",
      universal_rescue: "Jedinstveni broj za hitne slučajeve",
      police: "Policija",
      fire: "Vatrogasna služba",
      medical: "Hitna medicinska pomoć",
      road_assist: "Pomoć na putu (AMSS)",
      english_notice:
        "Operateri govore srpski, engleski i jezike zemalja učesnica EXPO.",
      taxi_title: "Sertifikovana taksi udruženja",
      taxi_tip:
        "Koristite isključivo vozila sa 'TX' na registarskim tablicama. Izbegavajte divlje taksiste.",
      taxi_button: "Pozovi odmah",
      embassy_title: "Diplomatska i konzularna predstavništva",
      embassy_select: "Izaberite državljanstvo",
      embassy_address: "Adresa u Beogradu",
      embassy_phone: "Kancelarija",
      embassy_sos: "Konzularni dežurni telefon",
      parking_title: "Pomoćnik za plaćanje parkinga",
      parking_sub:
        "Pošaljite SMS sa tablicama na određen broj u zavisnosti od boje zone na asfaltu.",
      plate_label: "Unesite registarske tablice (npr. BG123XX)",
      copy_directive: "Kopiraj tablice za slanje SMS-a",
      copied: "Kopirano!",
      emergency_verified: "Verifikovan EXPO protokol",
      start_sms_payment: "Započni plaćanje SMS-om",
      sms_helper:
        "Vaš telefon će otvoriti Poruke. Pregledajte i sami pošaljite SMS.",
      sms_fallback: "SMS se ne otvara? Kopirajte podatke i pošaljite ručno.",
    },
    es: {
      title: "Soporte de Viaje & SOS",
      subtitle:
        "Números de rescate, transporte de lujo avalado, asistente de parking y consulados.",
      emergency_title: "Servicios de Emergencia",
      universal_rescue: "Emergencia Universal",
      police: "Policía Nacional",
      fire: "Cuerpo de Bomberos",
      medical: "Urgencias Médicas",
      road_assist: "Asistencia en Carretera (AMSS)",
      english_notice:
        "Los operadores disponen de inglés y lenguas oficiales de la EXPO.",
      taxi_title: "Flotas de Taxis Certificadas",
      taxi_tip:
        "Haga uso de vehículos con placas certificadas 'TX'. Evite reclutas informales.",
      taxi_button: "Llamada Directa",
      embassy_title: "Oficinas Consulares",
      embassy_select: "Seleccionar Nacionalidad",
      embassy_address: "Dirección en Belgrado",
      embassy_phone: "Consultas Ordinarias",
      embassy_sos: "Emergencia Consular 24/7",
      parking_title: "Asistente de Aparcamiento Belgrado",
      parking_sub:
        "Envie un SMS con su patente según el color pintado en el suelo. Gratis tras las 21H.",
      plate_label: "Introduzca su Patente (ej: BG123XX)",
      copy_directive: "Copiar patente para componer SMS",
      copied: "¡Copiado!",
      emergency_verified: "Protocolo EXPO Verificado",
      start_sms_payment: "Iniciar Pago por SMS",
      sms_helper:
        "Se abrirá la aplicación de Mensajes. Revise y envíe el SMS usted mismo.",
      sms_fallback:
        "¿No se abre el SMS? Copie los detalles y envíelo manualmente.",
    },
    de: {
      title: "SOS & Reiseunterstützung",
      subtitle:
        "Notfallnummern, lizensierter Transport, Parkgebühr-Assistent und Botschaften.",
      emergency_title: "Krisen- & Notrufnummern",
      universal_rescue: "Euro-Notruf",
      police: "Polizei / Notruf",
      fire: "Feuerwehr",
      medical: "Rettungsdienst / Notarzt",
      road_assist: "Pannenhilfe (AMSS)",
      english_notice:
        "Die Mitarbeiter sprechen Serbisch, Englisch und wichtige Messesprachen.",
      taxi_title: "Sichere Taxi-Dienste",
      taxi_tip:
        "Nutzen Sie nur Fahrzeuge mit 'TX'-Kennzeichen am Ende. Niemals freie Fahrer ansprechen.",
      taxi_button: "Direkt anrufen",
      embassy_title: "Diplomatischer Notdienst",
      embassy_select: "Nationalität wählen",
      embassy_address: "Adresse in Belgrad",
      embassy_phone: "Sekretariat",
      embassy_sos: "24-Stunden-Bereitschaft",
      parking_title: "Belgrader Parkschein-Assistent",
      parking_sub:
        "Senden Sie Ihr Kennzeichen per SMS an den Zonen-Code. Kostenlos nach 21 Uhr.",
      plate_label: "Kennzeichen eingeben (z. B. BG123XX)",
      copy_directive: "Kopieren, um SMS zu senden",
      copied: "Kopiert!",
      emergency_verified: "EXPO-zertifiziertes Protokoll",
      start_sms_payment: "SMS-Zahlung starten",
      sms_helper:
        "Ihre Nachrichten-App wird geöffnet. Bitte prüfen und senden Sie die SMS selbst.",
      sms_fallback:
        "SMS öffnet sich nicht? Kopieren Sie die Daten und senden Sie manuell.",
    },
    ru: {
      title: "Центр помощи и SOS-консьерж",
      subtitle:
        "Телефоны спасения, сертифицированный транспорт, парковка и посольства.",
      emergency_title: "Экстренные службы",
      universal_rescue: "Единый телефон спасения",
      police: "Полиция Сербии",
      fire: "Пожарная служба",
      medical: "Скорая медицинская помощь",
      road_assist: "Помощь на дорогах (AMSS)",
      english_notice:
        "Операторы поддерживают сербский, английский и официальные языки ЭКСПО.",
      taxi_title: "Лицензированные службы такси",
      taxi_tip:
        "Выбирайте машины исключительно с буквами 'TX' на номерах во избежание обмана.",
      taxi_button: "Позвонить",
      embassy_title: "Дипломатическая поддержка",
      embassy_select: "Выберите гражданство",
      embassy_address: "Адрес в Белграде",
      embassy_phone: "Канцелярия",
      embassy_sos: "Круглосуточный телефон экстренной связи",
      parking_title: "Калькулятор парковки Белграда",
      parking_sub:
        "Отправьте SMS с госмером на номер зоны. Бесплатно после 21:00 и по воскресеньям.",
      plate_label: "Введите госномер машины (например, BG123XX)",
      copy_directive: "Скопировать госномер для SMS",
      copied: "Скопировано!",
      emergency_verified: "Подтверждено стандартами ЭКСПО",
      start_sms_payment: "Начать оплату по SMS",
      sms_helper:
        "Ваш телефон откроет приложение сообщений. Пожалуйста, проверьте и отправьте SMS самостоятельно.",
      sms_fallback:
        "SMS не открывается? Скопируйте данные и отправьте вручную.",
    },
    zh: {
      title: "尊享领事保护与应急支持",
      subtitle:
        "提供即时紧急联络、世博认证安全交通、离线停车助手和外交领保通道。",
      emergency_title: "紧急求救第一安全响应",
      universal_rescue: "通用紧急求助热线",
      police: "国家警察总署",
      fire: "消防救灾急救",
      medical: "突发医疗救护",
      road_assist: "AMSS道路紧急救援",
      english_notice: "接线员支持英语以及世博会官方代表国语言沟通。",
      taxi_title: "世博会认证正规出租车队",
      taxi_tip:
        "请务必选乘车牌尾号带有“TX”的正规车辆。严禁搭乘航站楼外的无证拉客车。",
      taxi_button: "一键呼叫",
      embassy_title: "各国驻塞尔维亚使领馆联络",
      embassy_select: "选择您的国籍 / 国别",
      embassy_address: "馆址详细地址",
      embassy_phone: "正常办公咨询电话",
      embassy_sos: "24小时领事保护与协助",
      parking_title: "贝尔格莱德市区智能停车帮手",
      parking_sub:
        "请输入完整车牌发至对应颜色代表的短信编码。工作日21点后及周日全天免费。",
      plate_label: "输入车牌号（如：BG123XX）",
      copy_directive: "点击复制车牌并发短信",
      copied: "已复制到剪贴板",
      emergency_verified: "世博会实名认证救助规范",
      start_sms_payment: "开始短信支付",
      sms_helper: "您的手机将打开短信应用。请核对并自行发送短信。",
      sms_fallback: "无法打开短信？请复制内容并手动发送。",
    },
  };

  const l = content[language] || content["en"];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    triggerHaptic(50);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleStartParking = (smsNumber: string, bodyText: string) => {
    triggerHaptic(12);

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const separator = isIOS ? "&" : "?";
    const smsUrl = `sms:${smsNumber}${separator}body=${encodeURIComponent(bodyText)}`;

    window.location.href = smsUrl;
  };

  const activeEmbassy = EMBASSIES[selectedEmbassy];

  return (
    <div className="bg-[#FAF9F5] border border-[#E7E4DB] rounded-[32px] p-6 space-y-6 shadow-sm text-left">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-accent-red" />
          <h4 className="text-[10px] uppercase tracking-[0.25em] text-brand-charcoal font-black">
            {l.title}
          </h4>
        </div>
        <span className="text-[7.5px] font-mono uppercase bg-accent-red/10 text-accent-red font-bold px-2.5 py-0.5 rounded-full">
          {l.emergency_verified}
        </span>
      </div>

      <p className="text-[11px] text-[#8C8A7D] leading-relaxed font-sans italic">
        {l.subtitle}
      </p>

      {/* 1. Official Emergency Contacts Grid */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-1.5">
          <Clock size={11} className="text-[#8C8A7D]" />
          <p className="text-[9px] uppercase tracking-widest text-[#8C8A7D] font-extrabold">
            {l.emergency_title}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Universal 112 */}
          <div className="bg-white border border-[#E7E4DB] hover:border-accent-red p-3.5 rounded-2xl flex items-center justify-between transition-all group">
            <div className="min-w-0">
              <p className="text-[10px] font-sans font-semibold text-brand-charcoal">
                {l.universal_rescue}
              </p>
              <p className="text-15px font-serif text-accent-red font-black tracking-tight">
                112
              </p>
            </div>
            <a
              href="tel:112"
              onClick={() => triggerHaptic(15)}
              className="w-8 h-8 rounded-xl bg-accent-red/5 hover:bg-accent-red/15 text-accent-red flex items-center justify-center shrink-0 transition-colors"
            >
              <PhoneCall size={12} />
            </a>
          </div>

          {/* Police 192 */}
          <div className="bg-white border border-[#E7E4DB] hover:border-accent-red p-3.5 rounded-2xl flex items-center justify-between transition-all group">
            <div className="min-w-0">
              <p className="text-[10px] font-sans font-semibold text-brand-charcoal">
                {l.police}
              </p>
              <p className="text-15px font-serif text-brand-charcoal font-bold tracking-tight">
                192
              </p>
            </div>
            <a
              href="tel:192"
              onClick={() => triggerHaptic(15)}
              className="w-8 h-8 rounded-xl bg-[#2D3025]/5 hover:bg-[#2D3025]/15 text-brand-charcoal flex items-center justify-center shrink-0 transition-colors"
            >
              <PhoneCall size={12} />
            </a>
          </div>

          {/* Fire 193 */}
          <div className="bg-white border border-[#E7E4DB] hover:border-accent-red p-3.5 rounded-2xl flex items-center justify-between transition-all group">
            <div className="min-w-0">
              <p className="text-[10px] font-sans font-semibold text-brand-charcoal">
                {l.fire}
              </p>
              <p className="text-15px font-serif text-brand-charcoal font-bold tracking-tight">
                193
              </p>
            </div>
            <a
              href="tel:193"
              onClick={() => triggerHaptic(15)}
              className="w-8 h-8 rounded-xl bg-[#2D3025]/5 hover:bg-[#2D3025]/15 text-brand-charcoal flex items-center justify-center shrink-0 transition-colors"
            >
              <PhoneCall size={12} />
            </a>
          </div>

          {/* Ambulance 194 */}
          <div className="bg-white border border-[#E7E4DB] hover:border-accent-red p-3.5 rounded-2xl flex items-center justify-between transition-all group">
            <div className="min-w-0">
              <p className="text-[10px] font-sans font-semibold text-brand-charcoal">
                {l.medical}
              </p>
              <p className="text-15px font-serif text-brand-charcoal font-bold tracking-tight">
                194
              </p>
            </div>
            <a
              href="tel:194"
              onClick={() => triggerHaptic(15)}
              className="w-8 h-8 rounded-xl bg-[#2D3025]/5 hover:bg-[#2D3025]/15 text-brand-charcoal flex items-center justify-center shrink-0 transition-colors"
            >
              <PhoneCall size={12} />
            </a>
          </div>

          {/* AMSS Road 1987 */}
          <div className="bg-white border border-[#E7E4DB] hover:border-accent-red p-3.5 rounded-2xl flex items-center justify-between transition-all group">
            <div className="min-w-0">
              <p className="text-[10px] font-sans font-semibold text-brand-charcoal">
                {l.road_assist}
              </p>
              <p className="text-15px font-serif text-brand-charcoal font-bold tracking-tight">
                1987
              </p>
            </div>
            <a
              href="tel:1987"
              onClick={() => triggerHaptic(15)}
              className="w-8 h-8 rounded-xl bg-[#2D3025]/5 hover:bg-[#2D3025]/15 text-brand-charcoal flex items-center justify-center shrink-0 transition-colors"
            >
              <PhoneCall size={12} />
            </a>
          </div>
        </div>

        <div className="bg-accent-red/5 border border-accent-red/10 rounded-xl p-3 flex items-start gap-2.5">
          <Info size={11} className="text-accent-red shrink-0 mt-0.5" />
          <p className="text-[10px] leading-normal text-brand-charcoal/80 font-medium">
            {l.english_notice}
          </p>
        </div>
      </div>

      {/* 2. Belgrade Smart Parking SMS Assistant */}
      <div className="pt-2 border-t border-[#F0EDE6] space-y-3">
        <div className="flex items-center gap-1.5">
          <Car size={11} className="text-[#8C8A7D]" />
          <p className="text-[9px] uppercase tracking-widest text-[#8C8A7D] font-extrabold">
            {l.parking_title}
          </p>
        </div>

        <div className="bg-white border border-[#E7E4DB] rounded-2xl p-4 space-y-4 shadow-xs">
          <p className="text-[11px] text-brand-charcoal/70 leading-normal font-sans">
            {l.parking_sub}
          </p>

          <div className="grid grid-cols-2 gap-1.5">
            {ZONES.map((zone) => {
              const belongs = selectedZone === zone.id;
              let zoneColorHex = "bg-slate-400";
              if (zone.id === "red") zoneColorHex = "bg-[#E53935]";
              if (zone.id === "yellow") zoneColorHex = "bg-[#FBC02D]";
              if (zone.id === "green") zoneColorHex = "bg-[#43A047]";
              if (zone.id === "blue") zoneColorHex = "bg-[#1E88E5]";

              return (
                <button
                  key={zone.id}
                  onClick={() => {
                    setSelectedZone(zone.id);
                    triggerHaptic(8);
                  }}
                  className={`p-2 rounded-xl text-left border flex items-center gap-2 cursor-pointer transition-all ${
                    belongs
                      ? "bg-[#FAF9F5] border-accent-teal ring-1 ring-accent-teal/20 text-brand-charcoal shadow-xs"
                      : "bg-white border-[#E7E4DB] text-brand-charcoal/50 hover:bg-[#FAF9F5]"
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${zoneColorHex} shrink-0`}
                  />
                  <div className="min-w-0">
                    <p className="text-[9.5px] font-bold truncate leading-none">
                      {zone.name[language] || zone.name.en}
                    </p>
                    <p className="text-[8px] text-[#8C8A7D] mt-0.5 leading-none">
                      {zone.fee} • {zone.duration}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <label className="text-[9.5px] uppercase font-black text-[#8C8A7D] tracking-wider block">
              {l.plate_label}
            </label>
            <input
              type="text"
              placeholder="BG123XX"
              value={plateNumber}
              onChange={(e) =>
                setPlateNumber(e.target.value.toUpperCase().replace(/\s+/g, ""))
              }
              className="w-full tracking-widest font-mono text-[13.5px] font-bold p-3 bg-[#FAF9F5] border border-[#E7E4DB] rounded-xl outline-none focus:border-accent-teal text-brand-charcoal placeholder-brand-charcoal/20"
            />
          </div>

          {plateNumber.length > 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 bg-[#FAF9F5] border border-dashed border-[#E7E4DB] p-3 rounded-xl justify-between">
                <div>
                  <p className="text-[8px] uppercase font-black tracking-widest text-[#8C8A7D] leading-none">
                    SMS Recipient Number
                  </p>
                  <p className="text-[13.5px] font-mono text-brand-charcoal font-black mt-0.5">
                    {ZONES.find((z) => z.id === selectedZone)?.sms}
                  </p>
                  <p className="text-[8px] uppercase font-black tracking-widest text-[#8C8A7D] mt-1.5 leading-none">
                    SMS Content Body
                  </p>
                  <p className="text-[13.5px] font-mono text-accent-red font-black mt-0.5">
                    {plateNumber}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(plateNumber, "sms")}
                  className={`py-2 px-3 rounded-lg border text-[8px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all outline-none ${
                    copiedText === "sms"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-inner"
                      : "bg-white border-[#E7E4DB] hover:bg-brand-pearl text-[#8C8A7D]"
                  }`}
                >
                  {copiedText === "sms" ? (
                    <Check size={11} />
                  ) : (
                    <Copy size={11} />
                  )}
                  <span>
                    {copiedText === "sms" ? l.copied : l.copy_directive}
                  </span>
                </button>
              </div>

              {/* Primary SMS Payment CTA Button */}
              <button
                type="button"
                onClick={() => {
                  const smsNumber =
                    ZONES.find((z) => z.id === selectedZone)?.sms || "9111";
                  handleStartParking(smsNumber, plateNumber);
                }}
                className="w-full py-3 px-4 bg-[#2D3025] hover:bg-[#2D3025]/90 text-white rounded-xl font-sans text-[11px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer border-none outline-none focus:ring-2 focus:ring-accent-teal/50"
              >
                <MessageSquare size={12} className="text-accent-teal" />
                <span>{l.start_sms_payment}</span>
              </button>

              {/* Informative text & fallback */}
              <div className="space-y-1 text-center px-1">
                <p className="text-[9px] text-brand-charcoal/75 leading-normal font-sans">
                  {l.sms_helper}
                </p>
                <p className="text-[8px] text-[#8C8A7D] leading-normal font-mono">
                  {l.sms_fallback}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Verified Premium Taxis & Fleets */}
      <div className="pt-2 border-t border-[#F0EDE6] space-y-3">
        <div className="flex items-center gap-1.5">
          <Car size={11} className="text-[#8C8A7D]" />
          <p className="text-[9px] uppercase tracking-widest text-[#8C8A7D] font-extrabold">
            {l.taxi_title}
          </p>
        </div>

        <div className="bg-white border border-[#E7E4DB] rounded-2xl p-4 space-y-3 shadow-xs">
          <p className="text-[10.5px] text-[#8C8A7D] leading-normal font-sans italic">
            {l.taxi_tip}
          </p>

          <div className="space-y-2">
            {/* Pink Taxi */}
            <div className="p-3 bg-[#FAF9F5] border border-[#E7E4DB] hover:border-[#D5D3C8] rounded-xl flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-sans font-bold text-brand-charcoal">
                  Pink Taxi Belgrade
                </p>
                <p className="text-[10px] text-[#8C8A7D] mt-0.5">
                  Fleet dial: 19803 / Viber available
                </p>
              </div>
              <a
                href="tel:19803"
                onClick={() => triggerHaptic(15)}
                className="py-1.5 px-3 rounded-lg bg-brand-charcoal text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all active:scale-95"
              >
                <PhoneCall size={9} />
                <span>{l.taxi_button}</span>
              </a>
            </div>

            {/* Naxis Taxi */}
            <div className="p-3 bg-[#FAF9F5] border border-[#E7E4DB] hover:border-[#D5D3C8] rounded-xl flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-sans font-bold text-brand-charcoal">
                  Naxis Taxi Belgrade
                </p>
                <p className="text-[10px] text-[#8C8A7D] mt-0.5">
                  Premium English: +381 11 6305555
                </p>
              </div>
              <a
                href="tel:+381116305555"
                onClick={() => triggerHaptic(15)}
                className="py-1.5 px-3 rounded-lg bg-brand-charcoal text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all active:scale-95"
              >
                <PhoneCall size={9} />
                <span>{l.taxi_button}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Diplomatic Referral Service */}
      <div className="pt-2 border-t border-[#F0EDE6] space-y-3">
        <div className="flex items-center gap-1.5">
          <Building size={11} className="text-[#8C8A7D]" />
          <p className="text-[9px] uppercase tracking-widest text-[#8C8A7D] font-extrabold">
            {l.embassy_title}
          </p>
        </div>

        <div className="bg-white border border-[#E7E4DB] rounded-2xl p-4 space-y-4 shadow-xs">
          <div className="space-y-1.5">
            <label className="text-[9.5px] uppercase font-black text-[#8C8A7D] tracking-wider block">
              {l.embassy_select}
            </label>
            <div className="relative">
              <select
                value={selectedEmbassy}
                onChange={(e) => {
                  setSelectedEmbassy(e.target.value);
                  triggerHaptic(7);
                }}
                className="w-full text-xs font-semibold p-3 pr-8 bg-[#FAF9F5] border border-[#E7E4DB] rounded-xl outline-none appearance-none cursor-pointer text-brand-charcoal"
              >
                <option value="de">🇩🇪 Germany (Deutschland)</option>
                <option value="es">🇪🇸 Spain (España)</option>
                <option value="us">🇺🇸 USA (United States)</option>
                <option value="cn">🇨🇳 China (中华人民共和国)</option>
                <option value="ru">🇷🇺 Russia (Россия)</option>
                <option value="uk">🇬🇧 United Kingdom (UK)</option>
              </select>
              <ChevronDown
                size={11}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal/40 pointer-events-none"
              />
            </div>
          </div>

          {activeEmbassy && (
            <div className="bg-[#FAF9F5] border border-[#E7E4DB] p-4 rounded-xl space-y-3.5 text-[11px]">
              <div>
                <p className="text-[8px] uppercase tracking-wider text-brand-charcoal/40 font-black leading-none">
                  {activeEmbassy.name[language] || activeEmbassy.name.en}
                </p>
                <p className="text-[10px] uppercase font-black text-brand-charcoal mt-2.5 leading-none">
                  {l.embassy_address}
                </p>
                <p className="font-semibold text-brand-charcoal/80 mt-1">
                  {activeEmbassy.address}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#F0EDE6]">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-black text-[#8C8A7D] leading-none">
                    {l.embassy_phone}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-medium text-brand-charcoal">
                      {activeEmbassy.phone}
                    </span>
                    <a
                      href={`tel:${activeEmbassy.phone.replace(/\s+/g, "")}`}
                      onClick={() => triggerHaptic(10)}
                      className="text-accent-teal hover:underline"
                    >
                      Call
                    </a>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-black text-accent-red leading-none">
                    {l.embassy_sos}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-accent-red">
                      {activeEmbassy.emergencyPhone}
                    </span>
                    <a
                      href={`tel:${activeEmbassy.emergencyPhone.replace(/\s+/g, "")}`}
                      onClick={() => triggerHaptic(15)}
                      className="text-accent-red hover:underline font-bold"
                    >
                      Call
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
