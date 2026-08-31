import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

replacement_inner = '''return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex-1 flex flex-col justify-between items-center py-2.5 xs:py-3.5 px-4 relative h-full overflow-hidden premium-paper select-none gap-y-2"
    >
      {/* 1. Top Section (Promotional Statement - Restored Original Styling Above Button) */}
      <div className="flex-shrink-0 flex flex-col justify-center items-center max-w-[340px] mx-auto w-full pt-0.5">
        <div className="text-center w-full flex flex-col justify-center items-center gap-y-0.5">
          <p className="font-sans text-[13.5px] xs:text-[15px] sm:text-[16.5px] text-[#800020] font-bold uppercase tracking-[0.06em] xs:tracking-[0.08em] text-center leading-[1.25] whitespace-nowrap">
            {t.serbia_subheadline_line1_l1}
          </p>
          <p className="font-sans text-[13.5px] xs:text-[15px] sm:text-[16.5px] text-[#800020] font-bold uppercase tracking-[0.06em] xs:tracking-[0.08em] text-center leading-[1.25] whitespace-nowrap">
            {t.serbia_subheadline_line1_l2}
          </p>
        </div>
      </div>

      {/* 2. Middle Section (Tactile IDEMO Button + Language Selector - Compact Vertical Footprint) */}
      <div className="flex-shrink flex flex-col justify-center items-center gap-y-2 xs:gap-y-2.5 my-auto w-full">
        {/* IDEMO Button (Hugging custom hero image or canonical SVG plaque, calibrated for 1-screen phone viewport) */}
        <div 
          className={`relative flex justify-center items-center ${
            USE_CUSTOM_HERO_IMAGE 
              ? "w-[160px] xs:w-[185px] sm:w-[210px] aspect-[2/3] max-h-[255px] xs:max-h-[285px] sm:max-h-[315px]" 
              : "w-[210px] h-[52px]"
          }`} 
          style={{ perspective: "1000px" }}
        >
          {/* 3D solid thickness plate base */}
          <div 
            className={`absolute inset-0 bg-[#C4C2B8] translate-y-[4px] xs:translate-y-[5px] border border-brand-charcoal/[0.04] pointer-events-none ${
              USE_CUSTOM_HERO_IMAGE
                ? "rounded-[18px] shadow-[0_4px_10px_rgba(35,37,30,0.12),0_1.5px_3px_rgba(35,37,30,0.06)]"
                : "rounded-[14px] shadow-[0_4px_8px_rgba(35,37,30,0.12),0_1px_2px_rgba(35,37,30,0.08)]"
            }`} 
          />
          
          <motion.div 
            onClick={handleStart}
            className={`relative w-full h-full cursor-pointer select-none bg-[#FAF9F5] flex items-center justify-center border border-brand-charcoal/[0.12] overflow-hidden ${
              USE_CUSTOM_HERO_IMAGE 
                ? "rounded-[18px] p-1.5 shadow-sm" 
                : "rounded-[14px] px-4"
            }`}
            initial={{ 
              y: 0,
              boxShadow: "0 1px 2px rgba(35,37,30,0.02), inset 0px 1.5px 1px rgba(255,255,255,0.95)"
            }}
            whileHover={{ 
              y: 1.5,
              boxShadow: "0 0.5px 1px rgba(35,37,30,0.01), inset 0px 1.5px 1px rgba(255,255,255,0.95)"
            }}
            whileTap={{ 
              y: 4,
              boxShadow: "inset 0px 2px 4px rgba(35,37,30,0.12)"
            }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            onMouseDown={() => triggerHaptic(8)}
            onTouchStart={() => triggerHaptic(8)}
            id="tactile-hero-logo"
          >
            {/* Premium Glass reflection glaze */}
            <div 
              className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none z-10 ${
                USE_CUSTOM_HERO_IMAGE ? "rounded-[18px]" : "rounded-[14px]"
              }`} 
            />
            
            {USE_CUSTOM_HERO_IMAGE ? (
              <img 
                src="/idemo_hero_custom.png" 
                alt="IDEMO" 
                className="w-full h-full object-contain select-none pointer-events-none rounded-[13px]"
                draggable={false}
              />
            ) : (
              <IdemoLogo 
                width="100%" 
                height="100%" 
                showBg={false}
                className="text-brand-charcoal select-none pointer-events-none" 
              />
            )}
          </motion.div>
        </div>

        {/* Language Selector (Recessed control directly below IDEMO Button) */}
        <div className="w-full max-w-[270px] px-2 z-50">
          <div className="flex justify-between p-[3px] bg-[#FAF9F5]/40 rounded-full border border-brand-charcoal/[0.08] shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
            {LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <motion.button
                  key={lang.code}
                  onClick={() => {
                    triggerHaptic(10);
                    setLanguage(lang.code);
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-1 py-1.5 rounded-full text-[10px] xs:text-[11px] font-bold uppercase tracking-wider transition-all duration-200 select-none cursor-pointer text-center relative ${
                    isSelected
                      ? 'bg-[#EAE8E0]/50 text-brand-charcoal shadow-[inset_0_1.5px_3.5px_rgba(35,37,30,0.13)] border border-brand-charcoal/[0.02] font-black'
                      : 'text-brand-charcoal/45 hover:text-brand-charcoal/75 bg-transparent border border-transparent'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                  id={`premium-lang-${lang.code}`}
                >
                  {/* Invisible padding expansion for touch target */}
                  <span className="absolute -inset-1 rounded-full bg-transparent" />
                  <span className="relative z-10">{lang.code}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Bottom Section (Disclaimer Card - Compact Height) */}
      <div className="flex-shrink-0 w-full max-w-[340px] mx-auto pt-0 pb-0.5">
        <div className="text-center space-y-0.5 bg-white/30 border border-border-main/8 rounded-[12px] py-2 px-3.5 shadow-[0_1.5px_8px_rgba(35,37,30,0.01)] backdrop-blur-xs flex flex-col items-center justify-center" id="refined-disclaimer-card">
          <p className="text-[10px] xs:text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand-charcoal/50 leading-tight">
            {t.disclaimer_1}
          </p>
          <div className="h-[1px] bg-border-main/10 my-0.5 w-1/5 mx-auto" />
          <p className="text-[9.5px] xs:text-[10px] uppercase tracking-[0.1em] text-brand-charcoal/50 leading-tight font-semibold">
            {t.disclaimer_2}
          </p>
          <div className="h-[1px] bg-border-main/10 my-0.5 w-1/5 mx-auto" />
          <button
            onClick={() => {
              triggerHaptic(10);
              setShowPrivacy(true);
            }}
            className="text-[9.5px] xs:text-[10px] uppercase tracking-[0.11em] text-accent-teal hover:text-accent-teal/85 transition-colors font-bold cursor-pointer underline decoration-dotted underline-offset-2"
          >
            {language === 'sr' ? 'Politika Privatnosti' : language === 'es' ? 'Política de Privacidad' : language === 'de' ? 'Datenschutzerklärung' : language === 'ru' ? 'Политика конфиденциальности' : language === 'zh' ? '隐私政策' : 'Privacy Policy'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showPrivacy'''

match = re.search(r'return\s*\(\s*<motion\.div[\s\S]*?<AnimatePresence>\s*\{showPrivacy', content)
if match:
    content = content[:match.start()] + replacement_inner + content[match.end():]
    with open("src/App.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("WelcomeScreen successfully updated!")
else:
    print("Match failed!")
