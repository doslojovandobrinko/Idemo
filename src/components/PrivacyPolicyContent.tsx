import React from 'react';

interface PrivacyPolicyContentProps {
  language: string;
}

export default function PrivacyPolicyContent({ language }: PrivacyPolicyContentProps) {
  const isSr = language === 'sr';
  const isZh = language === 'zh';
  const isEs = language === 'es';
  const isDe = language === 'de';
  const isRu = language === 'ru';

  if (isSr) {
    return (
      <div className="space-y-4 text-left font-sans text-brand-charcoal/80 leading-relaxed text-[11px]">
        <p className="text-[10px] text-accent-teal uppercase tracking-widest font-black">
          Poslednji put ažurirano: jun 2026.
        </p>

        <p className="font-semibold text-brand-charcoal text-[11.5px]">
          IDEMO Srbija („IDEMO“, „mi“, „naš“ ili „nas“) poštuje vašu privatnost i posvećen je zaštiti vaših podataka. IDEMO je dizajniran oko filozofije na prvom mestu privatnosti, pružajući preporuke za putovanja i vođenje u stilu konsijerža bez potrebe za korisničkim nalozima, registracijama ili ličnim profilima.
        </p>

        <div className="space-y-3 pt-2">
          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              1. Podaci koje prikupljamo
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>IDEMO ne zahteva registraciju korisnika ili kreiranje naloga.</li>
              <li>Aplikacija je dizajnirana da radi bez prikupljanja ličnih podataka kao što su imena, adrese e-pošte, brojevi telefona, akreditivi naloga ili informacije o plaćanju.</li>
              <li>Osim ako je izričito navedeno u ovoj Politici privatnosti, IDEMO ne prikuplja, prenosi, prodaje, iznajmljuje niti deli lične podatke.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              2. Usluge lokacije
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>Ako korisnik omogući, IDEMO može pristupiti lokaciji uređaja isključivo radi pružanja funkcija putovanja zasnovanih na lokaciji, proračuna udaljenosti, preporuka u blizini i pomoći u navigaciji.</li>
              <li>Informacije o lokaciji se obrađuju samo za funkcionalnost koju zahteva korisnik i ne prodaju se, ne iznajmljuju, ne dele niti se koriste u svrhe oglašavanja.</li>
              <li>IDEMO ne održava bazu podataka o lokacijama korisnika i ne gradi profile kretanja korisnika.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              3. Pristup kameri
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>IDEMO može zatražiti pristup kameri uređaja kako bi omogućio korisnicima da skeniraju QR kodove povezane sa lokacijama, događajima, atrakcijama ili sadržajem u vezi sa putovanjima.</li>
              <li>Pristup kameri se koristi samo kada to pokrene korisnik.</li>
              <li>Slike snimljene kamerom za skeniranje QR-a obrađuju se isključivo za traženu funkcionalnost i ne otpremaju se, ne čuvaju na IDEMO serverima niti dele sa trećim stranama.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              4. Lokalno skladište uređaja
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>Da bi se poboljšalo korisničko iskustvo, IDEMO može lokalno na uređaju korisnika da skladišti preferencije, izbore jezika, sačuvane preporuke, planove putovanja, podešavanja aplikacije i drugi sadržaj koji korisnik odabere.</li>
              <li>Ove informacije ostaju pod kontrolom korisnika i mogu se ukloniti u bilo kom trenutku brisanjem aplikacije ili brisanjem lokalnog uređaja ili skladišta pretraživača gde je primenjivo.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              5. Analitika
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>IDEMO ne koristi Google Analytics, Firebase Analytics, Meta Pixel, analitiku oglašavanja, sisteme za profilisanje ponašanja ili slične usluge praćenja trećih strana.</li>
              <li>Aplikacija može da generiše anonimne operativne informacije sačuvane lokalno na uređaju korisnika u svrhe funkcionalnosti, performansi, rešavanja problema ili poboljšanja korisničkog iskustva.</li>
              <li>Takve informacije se ne prenose nezavisnim provajderima analitike i ne koriste se za oglašavanje.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              6. Oglašavanje
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>IDEMO ne prikazuje oglase trećih strana.</li>
              <li>IDEMO ne učestvuje u reklamnim mrežama i ne koristi reklamne identifikatore u marketinške svrhe.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              7. Push obaveštenja
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>IDEMO ne šalje marketinška obaveštenja.</li>
              <li>Ako buduće verzije uvedu opciona obaveštenja, od korisnika će se tražiti dozvola putem operativnog sistema uređaja i mogu onemogućiti obaveštenja u bilo kom trenutku kroz podešavanja uređaja.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              8. Usluge trećih strana
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>Aplikacija može pružiti veze do veb lokacija trećih strana, mapa, platformi za rezervaciju, transportnih usluga, aplikacija za navigaciju, platformi društvenih medija ili drugih spoljnih usluga.</li>
              <li>IDEMO ne kontroliše i nije odgovoran za prakse privatnosti, sadržaj, sigurnost ili politike usluga trećih strana.</li>
              <li>Korisnici se podstiču da pregledaju politike privatnosti svih usluga trećih strana koje odluče da koriste.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              9. Deljenje podataka
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>IDEMO ne prodaje lične podatke.</li>
              <li>IDEMO ne deli lične podatke sa oglašivačima, brokerima podataka, marketinškim kompanijama ili reklamnim mrežama.</li>
              <li>Možemo otkriti informacije samo ako to zahteva važeći zakon, pravni postupak ili vladin zahtev.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              10. Međunarodni korisnici
            </h4>
            <p className="mt-1 text-[#5C5E54] pl-1">
              IDEMO-u mogu pristupiti korisnici širom sveta. Aplikacija je dizajnirana da minimizira prikupljanje podataka i radi bez kreiranja korisničkih naloga kad god je to moguće.
            </p>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              11. Privatnost dece
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>IDEMO je namenjen opštoj publici i svesno ne prikuplja lične podatke od dece.</li>
              <li>Ako saznamo da je dete dalo lične podatke na način koji nije u skladu sa važećim zakonom, preduzećemo razumne korake da uklonimo takve informacije.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              12. Izmene ove Politike privatnosti
            </h4>
            <p className="mt-1 text-[#5C5E54] pl-1">
              Ova Politika privatnosti se može periodično ažurirati. Sva ažuriranja će biti objavljena na ovoj stranici zajedno sa revidiranim datumom „Poslednji put ažurirano“. Nastavak korišćenja aplikacije nakon objavljivanja promena predstavlja prihvatanje ažurirane Politike privatnosti.
            </p>
          </div>

          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-border-main/50 space-y-1">
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              13. Kontakt
            </h4>
            <p className="text-[#5C5E54]">Ako imate pitanja u vezi sa ovom Politikom privatnosti, kontaktirajte:</p>
            <p className="text-[#5C5E54]">
              Email: <a href="mailto:idemoconsierge@gmail.com" className="text-accent-teal hover:underline font-bold">idemoconsierge@gmail.com</a>
            </p>
            <p className="text-[#5C5E54]">
              Sajt: <a href="https://www.2027expo.com" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:underline font-bold">https://www.2027expo.com</a>
            </p>
          </div>

          <div className="pt-2 border-t border-border-main/30 text-[10.5px] italic text-[#5C5E54] font-medium">
            <span className="font-bold text-brand-charcoal">Posvećenost privatnosti:</span> IDEMO je izgrađen oko principa minimalnog prikupljanja podataka, kontrole korisnika i rada na prvom mestu privatnosti. Gde god je to razumno moguće, informacije ostaju na uređaju korisnika i pod njegovom kontrolom.
          </div>
        </div>
      </div>
    );
  }

  if (isZh) {
    return (
      <div className="space-y-4 text-left font-sans text-brand-charcoal/80 leading-relaxed text-[11px]">
        <p className="text-[10px] text-accent-teal uppercase tracking-widest font-black">
          最后更新日期：2026年6月
        </p>

        <p className="font-semibold text-brand-charcoal text-[11.5px]">
          IDEMO 塞尔维亚（下称“IDEMO”、“我们”、“我们的”或“本司”）尊重并致力于保护您的隐私。IDEMO 秉承隐私至上的设计理念，在无需创建用户账户、注册或填写个人资料的情况下，为您提供量身定制的旅行推荐和专属管家式指导。
        </p>

        <div className="space-y-3 pt-2">
          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              一、我们收集的信息
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>IDEMO 不需要用户进行注册或创建账户。</li>
              <li>本应用在设计上完全无需收集可识别个人身份的信息，例如姓名、电子邮件地址、电话号码、账户凭据或支付信息。</li>
              <li>除非本隐私政策中明确说明，否则 IDEMO 绝不收集、传输、销售、出租或共享任何个人信息。</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              二、定位服务
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>如果用户启用了定位权限，IDEMO 仅在获取设备位置的情况下，为您提供基于位置的旅行功能、距离计算、周边推荐以及导航协助。</li>
              <li>位置信息仅用于处理用户所请求的功能，绝不用于销售、出租、共享或用于任何广告推广目的。</li>
              <li>IDEMO 不会维护用户位置的数据库，亦不会构建用户移动轨迹画像。</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              三、相机访问权限
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>IDEMO 可能会请求访问设备的相机，以便用户扫描与地点、活动、景点或旅行相关内容关联的二维码。</li>
              <li>相机访问仅在用户主动发起时使用。</li>
              <li>通过相机捕获的二维码扫描图像仅用于处理该功能，绝不会上传或存储到 IDEMO 服务器，亦不会与第三方共享。</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              四、本地设备存储
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>为了提升用户体验，IDEMO 可能会在用户的设备本地存储偏好设置、语言选择、已存推荐、旅行计划、应用设置以及其他用户自主选择的内容。</li>
              <li>此类信息完全在用户的控制之下，用户可以通过删除应用或清除本地设备/浏览器缓存随时予以移除。</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              五、数据分析
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>IDEMO 不使用 Google Analytics、Firebase Analytics、Meta Pixel、广告分析、行为特征分析系统或类似的第三方跟踪服务。</li>
              <li>应用可能会生成匿名的运行信息并存储在您的本地设备上，用于基础功能、性能优化、故障排查或提升用户体验的目的。</li>
              <li>此类信息绝不传输至第三方分析服务商，亦不用于广告目的。</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              六、广告宣传
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>IDEMO 不展示第三方广告。</li>
              <li>IDEMO 不参与任何广告联盟或网络，亦不以市场营销为目的使用广告标识符。</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              七、推送通知
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>IDEMO 不发送任何营销性质的推送通知。</li>
              <li>如果未来版本引入可选的通知功能，我们将通过设备的操作系统征求您的许可，并且您可以随时在设备设置中禁用所有通知。</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              八、第三方服务
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>本应用可能会提供指向第三方网站、地图、预订平台、交通运输服务、导航应用、社交媒体平台或其他外部服务的链接。</li>
              <li>IDEMO 无法控制，亦不对任何第三方服务的隐私保护、内容、安全性或政策承担任何责任。</li>
              <li>我们建议用户在选择访问任何第三方服务时，认真阅读其隐私政策。</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              九、数据共享
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>IDEMO 绝不销售个人信息。</li>
              <li>IDEMO 不与广告商、数据经纪商、营销公司或广告网络共享个人信息。</li>
              <li>我们仅在适用法律、法定程序或政府强制要求下才会披露相关信息。</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              十、国际用户
            </h4>
            <p className="mt-1 text-[#5C5E54] pl-1">
              全球用户均可访问 IDEMO。本应用旨在最大限度减少数据收集，并尽可能在无需创建用户账户的情况下运行。
            </p>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              十一、儿童隐私
            </h4>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
              <li>IDEMO 面向大众群体，不会刻意收集儿童的个人信息。</li>
              <li>如果我们发现儿童在不符合适用法律的情况下提供了个人信息，我们将采取合理步骤予以清除。</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              十二、本隐私政策的变更
            </h4>
            <p className="mt-1 text-[#5C5E54] pl-1">
              本隐私政策可能会定期更新。任何更新都将发布于本页面，并附带修订后的“最后更新日期”。在变更发布后继续使用本应用即视为接受更新后的隐私政策。
            </p>
          </div>

          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-border-main/50 space-y-1">
            <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
              十三、联系我们
            </h4>
            <p className="text-[#5C5E54]">如果您对本隐私政策有任何疑问，请随时联系：</p>
            <p className="text-[#5C5E54]">
              电子邮件：<a href="mailto:idemoconsierge@gmail.com" className="text-accent-teal hover:underline font-bold">idemoconsierge@gmail.com</a>
            </p>
            <p className="text-[#5C5E54]">
              官方网站：<a href="https://www.2027expo.com" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:underline font-bold">https://www.2027expo.com</a>
            </p>
          </div>

          <div className="pt-2 border-t border-border-main/30 text-[10.5px] italic text-[#5C5E54] font-medium">
            <span className="font-bold text-brand-charcoal">隐私承诺：</span> IDEMO 围绕极简数据收集、自主控制与隐私至上原则而建。在合理可行的情况下，所有信息均安全保留于用户本人的设备上，并完全由用户自主控制。
          </div>
        </div>
      </div>
    );
  }

  // Default / English (es, de, ru will also render this elegant English version as required)
  return (
    <div className="space-y-4 text-left font-sans text-brand-charcoal/80 leading-relaxed text-[11px]">
      <p className="text-[10px] text-accent-teal uppercase tracking-widest font-black">
        Last Updated: June 2026
      </p>

      <p className="font-semibold text-brand-charcoal text-[11.5px]">
        IDEMO Serbia (“IDEMO”, “we”, “our”, or “us”) respects your privacy and is committed to protecting your information. IDEMO is designed around a privacy-first philosophy, providing travel recommendations and concierge-style guidance without requiring user accounts, registrations, or personal profiles.
      </p>

      <div className="space-y-3 pt-2">
        <div>
          <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
            1. Information We Collect
          </h4>
          <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
            <li>IDEMO does not require user registration or account creation.</li>
            <li>The application is designed to operate without collecting personally identifiable information such as names, email addresses, phone numbers, account credentials, or payment information.</li>
            <li>Unless explicitly stated in this Privacy Policy, IDEMO does not collect, transmit, sell, rent, or share personal information.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
            2. Location Services
          </h4>
          <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
            <li>If enabled by the user, IDEMO may access the device’s location solely to provide location-based travel features, distance calculations, nearby recommendations, and navigation assistance.</li>
            <li>Location information is processed only for the functionality requested by the user and is not sold, rented, shared, or used for advertising purposes.</li>
            <li>IDEMO does not maintain a database of user locations and does not build user movement profiles.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
            3. Camera Access
          </h4>
          <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
            <li>IDEMO may request access to the device camera to allow users to scan QR codes associated with locations, events, attractions, or travel-related content.</li>
            <li>Camera access is used only when initiated by the user.</li>
            <li>Images captured through the camera for QR scanning are processed solely for the requested functionality and are not uploaded, stored on IDEMO servers, or shared with third parties.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
            4. Local Device Storage
          </h4>
          <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
            <li>To improve the user experience, IDEMO may store preferences, language selections, saved recommendations, My Event Planner data, application settings, and other user-selected content locally on the user’s device.</li>
            <li>This information remains under the user’s control and may be removed at any time by deleting the application or clearing local device or browser storage where applicable.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
            5. Analytics
          </h4>
          <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
            <li>IDEMO does not use Google Analytics, Firebase Analytics, Meta Pixel, advertising analytics, behavioral profiling systems, or similar third-party tracking services.</li>
            <li>The application may generate anonymous operational information stored locally on the user’s device for functionality, performance, troubleshooting, or user experience purposes.</li>
            <li>Such information is not transmitted to third-party analytics providers and is not used for advertising.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
            6. Advertising
          </h4>
          <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
            <li>IDEMO does not display third-party advertisements.</li>
            <li>IDEMO does not participate in advertising networks and does not use advertising identifiers for marketing purposes.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
            7. Push Notifications
          </h4>
          <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
            <li>IDEMO does not send marketing notifications.</li>
            <li>If future versions introduce optional notifications, users will be asked for permission through the device operating system and may disable notifications at any time through device settings.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
            8. Third-Party Services
          </h4>
          <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
            <li>The application may provide links to third-party websites, maps, booking platforms, transportation services, navigation applications, social media platforms, or other external services.</li>
            <li>IDEMO does not control and is not responsible for the privacy practices, content, security, or policies of third-party services.</li>
            <li>Users are encouraged to review the privacy policies of any third-party services they choose to access.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
            9. Data Sharing
          </h4>
          <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
            <li>IDEMO does not sell personal information.</li>
            <li>IDEMO does not share personal information with advertisers, data brokers, marketing companies, or advertising networks.</li>
            <li>We may disclose information only if required by applicable law, legal process, or governmental request.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
            10. International Users
          </h4>
          <p className="mt-1 text-[#5C5E54] pl-1">
            IDEMO may be accessed by users worldwide. The application is designed to minimize data collection and operate without creating user accounts whenever possible.
          </p>
        </div>

        <div>
          <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
            11. Children’s Privacy
          </h4>
          <ul className="list-disc pl-4 space-y-1 mt-1 text-[#5C5E54]">
            <li>IDEMO is intended for general audiences and does not knowingly collect personal information from children.</li>
            <li>If we become aware that personal information has been provided by a child in a manner inconsistent with applicable law, we will take reasonable steps to remove such information.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
            12. Changes to This Privacy Policy
          </h4>
          <p className="mt-1 text-[#5C5E54] pl-1">
            This Privacy Policy may be updated periodically. Any updates will be published on this page together with a revised “Last Updated” date. Continued use of the application following publication of changes constitutes acceptance of the updated Privacy Policy.
          </p>
        </div>

        <div className="bg-[#FAF9F5] p-3 rounded-xl border border-border-main/50 space-y-1">
          <h4 className="font-serif font-black text-brand-charcoal text-[11px] uppercase tracking-wide">
            13. Contact
          </h4>
          <p className="text-[#5C5E54]">If you have questions regarding this Privacy Policy, please contact:</p>
          <p className="text-[#5C5E54]">
            Email: <a href="mailto:idemoconsierge@gmail.com" className="text-accent-teal hover:underline font-bold">idemoconsierge@gmail.com</a>
          </p>
          <p className="text-[#5C5E54]">
            Website: <a href="https://www.2027expo.com" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:underline font-bold">https://www.2027expo.com</a>
          </p>
        </div>

        <div className="pt-2 border-t border-border-main/30 text-[10.5px] italic text-[#5C5E54] font-medium">
          <span className="font-bold text-brand-charcoal">Privacy Commitment:</span> IDEMO is built around the principles of minimal data collection, user control, and privacy-first operation. Wherever reasonably possible, information remains on the user’s device and under the user’s control.
        </div>
      </div>
    </div>
  );
}
