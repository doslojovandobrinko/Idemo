/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { safeStorage } from './safeStorage';

const HISTORY_STORAGE_KEY = 'idemo_publication_history_v1';

interface PackageReleaseRecordLike {
  id: string;
  destinationId?: string;
  destinationName: string;
  packageVersion: string;
  publishedAt: string;
  releaseNotes: string;
  status: string;
}

export interface CommunityActivityEvent {
  id: string;
  timestamp?: number;
  type: 'NEW_REC' | 'UPDATED_REC' | 'NEW_PARTNER' | 'PACKAGE_RELEASE' | 'SEASONAL_NOTICE' | 'PARTNER_INVITATION' | 'IDEMO_SIGNATURE' | 'PARTNER_COLLABORATION';
  badge: Record<string, string>;
  title: Record<string, string>;
  description: Record<string, string>;
}

export interface AuthoritativeEventRow {
  event_id: string;
  event_type: string;
  occurred_at: string;
  entity_type: string;
  entity_id: string;
  destination_id?: string;
  title_en: string;
  title_sr: string;
  summary_en: string;
  summary_sr: string;
  safe_category: string;
}

const CANONICAL_EDITORIAL_ANNOUNCEMENTS: CommunityActivityEvent[] = [
  {
    id: 'editorial-herbal-tourism-invitation',
    type: 'PARTNER_INVITATION',
    badge: {
      sr: 'POZIV PARTNERIMA',
      en: 'INVITATION TO PARTNERS',
      de: 'EINLADUNG AN PARTNER',
      ru: 'ПРИГЛАШЕНИЕ ПАРТНЕРАМ',
      es: 'INVITACIÓN A SOCIOS',
      zh: '合作伙伴邀请'
    },
    title: {
      sr: 'Biljni turizam: nova inspiracija za vašu ponudu',
      en: 'Herbal tourism: fresh inspiration for your offering',
      de: 'Kräutertourismus: neue Inspiration für Ihr Angebot',
      ru: 'Травяной туризм: новое вдохновение для вашего предложения',
      es: 'Turismo botánico y herbolario: nueva inspiración para su oferta',
      zh: '草本植物旅游：为您打造特色体验的新灵感'
    },
    description: {
      sr: 'Tradicija poznavanja bilja ne poznaje granice. Inspirisani nasleđem Vase Pelagića i Jove Mijatovića, pozivamo vodiče, seoska domaćinstva i poznavaoce bilja da razmotre tematske šetnje, radionice pripreme čajeva i susrete sa lokalnim proizvođačima. Povežite prirodu, lokalno znanje i gostoprimstvo u autentično iskustvo koje nosi vaš pečat.',
      en: 'The tradition of botanical knowledge knows no borders. Inspired by the cultural heritage of Vasa Pelagić and Jovo Mijatović, we invite guides, rural households, and botanical experts to consider themed walks, tea-preparation workshops, and meetings with local producers. Connect nature, local knowledge, and hospitality into an authentic experience that bears your personal signature.',
      de: 'Die Tradition der Pflanzenkunde kennt keine Grenzen. Inspiriert vom kulturellen Erbe von Vasa Pelagić und Jovo Mijatović laden wir Guides, ländliche Gastgeber und Pflanzenkenner ein, Themenwanderungen, Tee-Workshops und Begegnungen mit lokalen Erzeugern zu entwickeln. Verbinden Sie Natur, lokales Wissen und Gastfreundschaft zu einem authentischen Erlebnis mit Ihrer persönlichen Handschrift.',
      ru: 'Традиция знания трав не знает границ. Вдохновляясь культурным наследием Васы Пелагича и Йово Миятовича, мы приглашаем гидов, сельские хозяйства и знатоков растений рассмотреть тематические прогулки, мастер-классы по приготовлению чая и встречи с местными производителями. Объедините природу, местные знания и гостеприимство в аутентичный опыт со своим авторским почерком.',
      es: 'La tradición del conocimiento de las plantas no conoce fronteras. Inspirados en el legado cultural de Vasa Pelagić y Jovo Mijatović, invitamos a guías, hogares rurales y conocedores de la botánica a considerar paseos temáticos, talleres de preparación de infusiones y encuentros con productores locales. Conecte la naturaleza, el saber local y la hospitalidad en una experiencia auténtica con su sello personal.',
      zh: '草本植物的传统知识无分国界。受 Vasa Pelagić 与 Jovo Mijatović 文化传承的启发，我们诚邀向导、乡村人家与植物行家构思主题漫步、茶饮制作工坊以及与当地生产者的交流活动。将自然、在地知识与热情好客融合成带有您个人印记的地道体验。'
    }
  },
  {
    id: 'editorial-idemo-signature-experience',
    type: 'IDEMO_SIGNATURE',
    badge: {
      sr: 'IDEMO SIGNATURE',
      en: 'IDEMO SIGNATURE',
      de: 'IDEMO SIGNATURE',
      ru: 'IDEMO SIGNATURE',
      es: 'IDEMO SIGNATURE',
      zh: 'IDEMO SIGNATURE'
    },
    title: {
      sr: 'Pretvorite svoje znanje u posebno iskustvo',
      en: 'Turn your expertise into a distinctive experience',
      de: 'Verwandeln Sie Ihr Wissen in ein besonderes Erlebnis',
      ru: 'Превратите свои знания в особенный опыт',
      es: 'Convierta su conocimiento en una experiencia especial',
      zh: '将您的专业知识转化为独特体验'
    },
    description: {
      sr: 'Šta biste posetiocu pokazali za nekoliko sati, jedan dan ili vikend? Osmislite doživljaj koji spaja vašu stručnost, lokalnu priču i pažljivo odabrane detalje — od lagane šetnje i domaćeg obroka do zanatske radionice. Navedite polazište, trajanje, jezike i šta je uključeno u ponudu.',
      en: 'What would you show a visitor in a few hours, a full day, or a weekend? Design an experience that blends your expertise, a local story, and thoughtfully chosen details — from an easygoing walk and a homemade meal to an artisan workshop. Specify the starting point, duration, languages, and what is included in the offer.',
      de: 'Was würden Sie einem Besucher in ein paar Stunden, an einem Tag oder an einem Wochenende zeigen? Gestalten Sie ein Erlebnis, das Ihre Fachkenntnis, eine lokale Geschichte und sorgfältig ausgewählte Details verbindet — vom entspannten Spaziergang über ein hausgemachtes Essen bis hin zum Handwerks-Workshop. Geben Sie Startpunkt, Dauer, Sprachen und enthaltene Leistungen an.',
      ru: 'Что бы вы показали гостю за несколько часов, один день или выходные? Создайте впечатление, объединяющее ваш опыт, местную историю и продуманные детали — от неспешной прогулки и домашнего обеда до ремесленной мастерской. Укажите место начала, продолжительность, языки и что включено в предложение.',
      es: '¿Qué le mostraría a un visitante en unas horas, un día o un fin de semana? Diseñe una vivencia que combine su experiencia, una historia local y detalles cuidadosamente seleccionados — desde un paseo tranquilo y una comida casera hasta un taller artesanal. Indique el punto de partida, la duración, los idiomas y qué incluye la propuesta.',
      zh: '如果有几个小时、一天或一个周末，您会带访客体验什么？设计一段融合您的专业特长、在地故事与精选细节的旅程——从轻松漫步、家常美食到手工技艺工坊。请注明出发地点、时长、服务语言以及包含的内容。'
    }
  },
  {
    id: 'editorial-partner-collaboration',
    type: 'PARTNER_COLLABORATION',
    badge: {
      sr: 'PARTNERSKA SARADNJA',
      en: 'PARTNER COLLABORATION',
      de: 'PARTNERKOOPERATION',
      ru: 'ПАРТНЕРСКОЕ СОТРУДНИЧЕСТВО',
      es: 'COLABORACIÓN CON SOCIOS',
      zh: '合作伙伴协作'
    },
    title: {
      sr: 'Još jedan put do posetilaca',
      en: 'Another pathway to visitors',
      de: 'Ein weiterer Weg zu Besuchern',
      ru: 'Еще один путь к гостям',
      es: 'Un camino más hacia los visitantes',
      zh: '连接访客的又一渠道'
    },
    description: {
      sr: 'IDEMO dopunjuje vaše postojeće kanale i povezuje vas sa posetiocima koji traže iskustva poput vaših. Učešće je besplatno i bez obaveza. Vi kontrolišete svoju ponudu, a komercijalne uslove i plaćanje dogovarate direktno sa posetiocem. Za početne pristupne podatke pišite na office@idemo.group.',
      en: 'IDEMO complements your existing channels and connects you with visitors looking for experiences like yours. Participation is free and without obligation. You control your offering, and you arrange commercial terms and payment directly with the visitor. For initial access credentials, write to office@idemo.group.',
      de: 'IDEMO ergänzt Ihre bestehenden Kanäle und verbindet Sie mit Besuchern, die nach Erlebnissen wie Ihren suchen. Die Teilnahme ist kostenlos und unverbindlich. Sie behalten die volle Kontrolle über Ihr Angebot und vereinbaren Konditionen sowie Zahlung direkt mit dem Besucher. Für erste Zugangsdaten schreiben Sie an office@idemo.group.',
      ru: 'IDEMO дополняет ваши существующие каналы и связывает вас с гостями, которые ищут именно такие впечатления. Участие бесплатное и без обязательств. Вы сами управляете своим предложением, а коммерческие условия и оплату согласовываете напрямую с гостем. Для получения начальных данных доступа напишите на office@idemo.group.',
      es: 'IDEMO complementa sus canales actuales y le conecta con visitantes que buscan experiencias como las suyas. La participación es gratuita y sin compromiso. Usted controla su oferta y acuerda las condiciones comerciales y el pago directamente con el visitante. Para obtener las credenciales iniciales de acceso, escriba a office@idemo.group.',
      zh: 'IDEMO 作为您现有渠道的补充，将您与寻找此类体验的访客连接起来。参与完全免费且无任何强制义务。您自主掌控服务内容，并与访客直接商定商务条款与付款方式。如需获取初始访问凭证，请致信 office@idemo.group。'
    }
  }
];

export const getFallbackCommunityEvents = (): CommunityActivityEvent[] => {
  return CANONICAL_EDITORIAL_ANNOUNCEMENTS.map((item) => ({
    ...item,
    badge: { ...item.badge },
    title: { ...item.title },
    description: { ...item.description }
  }));
};

export const loadAuthoritativeCommunityEvents = async (): Promise<CommunityActivityEvent[]> => {
  return getFallbackCommunityEvents();
};

