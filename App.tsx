
import React, { useState, useEffect, useCallback } from 'react';
import { COLORS, LOGO_URL, TRANSLATIONS } from './constants';
import { VisitorInfo, PlantMemory, Language, VisitorType, PlantStatus } from './types';
import { generatePlantStory } from './services/geminiService';

// --- Components ---

const Button: React.FC<{ 
  onClick?: () => void; 
  className?: string; 
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, className = '', variant = 'primary', disabled, children }) => {
  const variants = {
    primary: `bg-[#2C4A24] text-white hover:bg-[#344E41] shadow-lg`,
    secondary: `bg-[#D1A980] text-[#2C4A24] hover:bg-[#c49a6f] shadow-md`,
    outline: `border-2 border-[#2C4A24] text-[#2C4A24] hover:bg-[#f0e8d9]`,
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-8 py-5 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Header: React.FC<{ 
  lang: Language; 
  onToggleLang: () => void;
  onGoHome: () => void;
  onGoLibrary: () => void;
}> = ({ lang, onToggleLang, onGoHome, onGoLibrary }) => (
  <header className="flex items-center justify-between px-6 py-4 sticky top-0 bg-[#F5EEE0]/95 backdrop-blur-xl z-50 border-b border-[#D1A980]/20 shadow-sm">
    <div className="flex items-center cursor-pointer" onClick={onGoHome}>
      {/* الشعار في الهيدر بدون أي نصوص إضافية */}
      <img 
        src={LOGO_URL} 
        alt="Logo" 
        className="h-16 w-auto object-contain logo-sharp" 
      />
    </div>
    <div className="flex items-center gap-3">
       <button 
        onClick={onGoLibrary}
        className="p-3 text-[#2C4A24] bg-white rounded-2xl shadow-sm border border-[#D1A980]/20 active:scale-90 transition-transform"
        title={TRANSLATIONS[lang].library}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </button>
      <button 
        onClick={onToggleLang}
        className="text-xs font-bold bg-[#2C4A24] text-[#F5EEE0] px-4 py-2.5 rounded-xl"
      >
        {lang === 'ar' ? 'EN' : 'عربي'}
      </button>
    </div>
  </header>
);

// --- Pages ---

const SplashPage: React.FC<{ onStart: () => void; lang: Language }> = ({ onStart, lang }) => {
  const t = TRANSLATIONS[lang];
  return (
    <div className="flex flex-col items-center justify-center min-h-[100vh] text-center p-8 bg-[#F5EEE0] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#4F6E43] opacity-20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#D1A980] opacity-20 rounded-full blur-3xl"></div>

      <div className="animate-fade-in flex flex-col items-center relative z-10 w-full mb-8">
        {/* الشعار المركزي كبير جداً وواضح */}
        <div className="relative mb-10 w-full flex justify-center px-4">
           <img 
            src={LOGO_URL} 
            alt="Mahkah Logo" 
            className="w-full max-w-[450px] h-auto object-contain logo-sharp drop-shadow-[0_8px_24px_rgba(44,74,36,0.15)] animate-pulse-slow"
           />
        </div>
        <h2 className="text-3xl font-bold text-[#2C4A24] mb-3 tracking-tight px-4 leading-tight">{t.slogan}</h2>
        <p className="text-lg text-[#D1A980] font-medium max-w-xs">{t.tagline}</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 mb-12 w-full max-w-sm relative z-10 px-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-5 bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-[#D1A980]/10">
            <div className="bg-[#4F6E43] text-white w-12 h-12 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 shadow-md text-xl">
              {i}
            </div>
            <p className="text-[#2C4A24] font-bold text-xl">
              {t[`step${i}` as keyof typeof t]}
            </p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-sm px-4 relative z-10">
        <Button onClick={onStart} variant="primary" className="w-full py-6 text-2xl shadow-2xl rounded-3xl">
          {t.start}
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${lang === 'ar' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Button>
      </div>
    </div>
  );
};

const SetupPage: React.FC<{ 
  onNext: (info: VisitorInfo) => void; 
  lang: Language;
}> = ({ onNext, lang }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<VisitorType>('tourist');
  const t = TRANSLATIONS[lang];

  return (
    <div className="p-8 max-md mx-auto min-h-[80vh] flex flex-col">
      <h2 className="text-3xl font-bold text-[#2C4A24] mb-10 leading-tight">{t.visitorType}</h2>
      
      <div className="space-y-8 flex-grow">
        <div>
          <label className="block text-sm font-bold text-[#4F6E43] mb-3 uppercase tracking-wider">{t.visitorName}</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border-2 border-[#D1A980]/20 rounded-2xl px-6 py-5 focus:border-[#2C4A24] outline-none transition-all text-lg font-medium shadow-sm"
            placeholder="..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[#4F6E43] mb-4 uppercase tracking-wider">{t.visitorType}</label>
          <div className="grid grid-cols-1 gap-3">
            {(['child', 'family', 'tourist'] as VisitorType[]).map(vType => (
              <button
                key={vType}
                onClick={() => setType(vType)}
                className={`py-5 px-6 rounded-2xl border-2 transition-all font-bold text-lg flex items-center justify-between ${
                  type === vType 
                  ? 'border-[#2C4A24] bg-[#2C4A24] text-white shadow-lg' 
                  : 'border-[#D1A980]/20 bg-white text-[#4F6E43]'
                }`}
              >
                <span>{t[`type${vType.charAt(0).toUpperCase() + vType.slice(1)}` as keyof typeof t]}</span>
                {type === vType && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button 
        onClick={() => name && onNext({ name, type, language: lang })}
        disabled={!name}
        className="mt-12 py-6 text-xl shadow-xl"
      >
        {t.next}
      </Button>
    </div>
  );
};

const UploadPage: React.FC<{ 
  onUpload: (b64: string) => void;
  lang: Language;
}> = ({ onUpload, lang }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const t = TRANSLATIONS[lang];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ضغط الصورة قبل العرض والإرسال
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // إنشاء canvas لضغط الصورة
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // تحديد حد أقصى للأبعاد (1200px)
          const maxSize = 1200;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // ضغط الصورة بجودة 0.8
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setPreview(compressedBase64);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto flex flex-col min-h-[80vh]">
      <h2 className="text-3xl font-bold text-[#2C4A24] mb-3">{t.uploadTitle}</h2>
      <p className="text-[#4F6E43] mb-10 text-lg leading-relaxed">{t.uploadHint}</p>

      <div className="relative flex-grow flex flex-col items-center justify-center">
        {preview ? (
          <div className="w-full aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white mb-10 relative">
            <img src={preview} alt="Plant" className="w-full h-full object-cover" />
            <button 
              onClick={() => setPreview(null)}
              className="absolute top-4 right-4 bg-black/50 text-white p-3 rounded-full backdrop-blur-md active:scale-90 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <label className="w-full aspect-[3/4] border-4 border-dashed border-[#D1A980] rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer bg-white/30 hover:bg-white/50 transition-all mb-10 active:scale-[0.98]">
            <div className="bg-[#D1A980]/20 p-8 rounded-full mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-[#2C4A24]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-[#2C4A24]">{t.uploadTitle}</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          </label>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {preview ? (
          <Button onClick={() => onUpload(preview)} variant="primary" className="py-6 text-xl shadow-lg">
            {t.createStory}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

const StoryPage: React.FC<{ 
  plant: Partial<PlantMemory>;
  lang: Language;
  onSave: (nickname: string) => void;
  onCancel: () => void;
}> = ({ plant, lang, onSave, onCancel }) => {
  const [nickname, setNickname] = useState(plant.plantNickname || '');
  const t = TRANSLATIONS[lang];

  return (
    <div className="p-8 max-w-md mx-auto pb-32">
      <div className="w-full aspect-[4/3] rounded-[2rem] overflow-hidden mb-8 shadow-2xl relative">
        <img src={plant.imageUrl} alt="Plant" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-6 left-6 right-6">
           <h2 className="text-3xl font-bold text-white mb-1 drop-shadow-md">{plant.title}</h2>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#D1A980]/20 mb-8">
        <div className="text-[#4F6E43] text-lg leading-relaxed space-y-5 whitespace-pre-wrap mb-10 italic">
          "{plant.story}"
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-[#F5EEE0] p-6 rounded-2xl border-l-4 border-[#2C4A24]">
            <p className="text-xs font-bold text-[#2C4A24] opacity-50 uppercase mb-2 tracking-widest">💡 سر زراعي</p>
            <p className="text-[#2C4A24] font-medium leading-snug">{plant.funFact}</p>
          </div>
          <div className="bg-[#D1A980]/10 p-6 rounded-2xl border-l-4 border-[#D1A980]">
            <p className="text-xs font-bold text-[#2C4A24] opacity-50 uppercase mb-2 tracking-widest">❓ سؤال لك</p>
            <p className="text-[#2C4A24] font-medium leading-snug">{plant.question}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#D1A980]/20 mb-10">
        <label className="block text-sm font-bold text-[#4F6E43] mb-3 uppercase tracking-wider">سمِّ هذه الذكرى (Nickname)</label>
        <input 
          type="text" 
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={plant.plantNickname || "مثلاً: شجرة الوفاء"}
          className="w-full bg-[#F5EEE0] border-2 border-transparent focus:border-[#D1A980] rounded-2xl px-6 py-5 outline-none font-bold text-xl text-[#2C4A24] transition-all"
        />
      </div>

      <div className="fixed bottom-8 left-8 right-8 max-w-md mx-auto">
        <Button onClick={() => onSave(nickname)} variant="primary" className="w-full py-6 text-xl shadow-2xl">
          {t.savePlant}
        </Button>
      </div>
    </div>
  );
};

const LibraryPage: React.FC<{ 
  plants: PlantMemory[]; 
  lang: Language; 
  onSelect: (p: PlantMemory) => void;
  onBack: () => void;
}> = ({ plants, lang, onSelect, onBack }) => {
  const t = TRANSLATIONS[lang];
  return (
    <div className="p-8 max-w-md mx-auto">
      <div className="flex items-center gap-5 mb-10">
        <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm border border-[#D1A980]/20 active:bg-[#D1A980]/10 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${lang === 'ar' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="text-3xl font-bold text-[#2C4A24]">{t.library}</h2>
      </div>

      {plants.length === 0 ? (
        <div className="text-center py-24 opacity-40">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-xl font-medium">{t.noPlants}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {plants.map(plant => (
            <div 
              key={plant.id} 
              onClick={() => onSelect(plant)}
              className="bg-white rounded-[2.5rem] overflow-hidden shadow-md border border-[#D1A980]/10 active:scale-[0.97] transition-all group"
            >
              <div className="h-56 w-full overflow-hidden relative">
                <img src={plant.imageUrl} alt={plant.plantNickname} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-4 right-4 bg-[#2C4A24] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                  {t[`status${plant.status.charAt(0).toUpperCase() + plant.status.slice(1)}` as keyof typeof t]}
                </div>
              </div>
              <div className="p-7">
                <h3 className="font-bold text-2xl text-[#2C4A24] mb-1">{plant.plantNickname}</h3>
                <p className="text-sm text-[#4F6E43] opacity-60 font-medium">{t.history}: {new Date(plant.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DetailPage: React.FC<{ 
  plant: PlantMemory; 
  lang: Language; 
  onBack: () => void;
  onUpdateStatus: (id: string, s: PlantStatus) => void;
}> = ({ plant, lang, onBack, onUpdateStatus }) => {
  const t = TRANSLATIONS[lang];
  const statuses: PlantStatus[] = ['seed', 'grow', 'bloom', 'fruit'];

  return (
    <div className="p-8 max-md mx-auto pb-32">
      <div className="flex items-center gap-5 mb-8">
        <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm border border-[#D1A980]/20 active:bg-[#D1A980]/10 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${lang === 'ar' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="text-3xl font-bold text-[#2C4A24] line-clamp-1">{plant.plantNickname}</h2>
      </div>

      <div className="w-full aspect-square rounded-[2.5rem] overflow-hidden mb-10 shadow-2xl border-4 border-white">
        <img src={plant.imageUrl} alt={plant.plantNickname} className="w-full h-full object-cover" />
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#D1A980]/20 mb-10">
        <h3 className="text-2xl font-bold text-[#2C4A24] mb-4">{plant.title}</h3>
        <p className="text-[#4F6E43] text-lg leading-relaxed whitespace-pre-wrap italic">"{plant.story}"</p>
      </div>

      <div className="mb-10 px-2">
        <h4 className="font-bold text-[#2C4A24] mb-8 flex items-center gap-3 text-xl">
          <div className="bg-[#2C4A24] p-2 rounded-lg text-white shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          {t.updateStatus}
        </h4>
        <div className="flex justify-between items-center relative px-4">
          <div className="absolute top-5 left-0 right-0 h-1.5 bg-[#D1A980]/20 -translate-y-1/2 z-0 rounded-full"></div>
          {statuses.map((s, idx) => {
            const isActive = plant.status === s;
            const isCompleted = statuses.indexOf(plant.status) >= idx;
            return (
              <button 
                key={s} 
                onClick={() => onUpdateStatus(plant.id, s)}
                className="relative z-10 flex flex-col items-center gap-3 active:scale-95 transition-transform"
              >
                <div className={`w-12 h-12 rounded-2xl border-4 flex items-center justify-center transition-all duration-500 ${
                  isActive ? 'bg-[#2C4A24] border-white scale-125 shadow-xl rotate-12' : isCompleted ? 'bg-[#4F6E43] border-white' : 'bg-[#D1A980]/30 border-[#F5EEE0]'
                }`}>
                  {isCompleted && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`text-xs font-bold whitespace-nowrap ${isActive ? 'text-[#2C4A24]' : 'text-[#4F6E43] opacity-40'}`}>
                  {t[`status${s.charAt(0).toUpperCase() + s.slice(1)}` as keyof typeof t]}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
};

// --- Main App Logic ---

type Screen = 'splash' | 'setup' | 'upload' | 'loading' | 'story' | 'library' | 'details';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('splash');
  const [lang, setLang] = useState<Language>('ar');
  const [visitor, setVisitor] = useState<VisitorInfo | null>(null);
  const [currentPlant, setCurrentPlant] = useState<Partial<PlantMemory> | null>(null);
  const [library, setLibrary] = useState<PlantMemory[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<PlantMemory | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('mahkah_library');
    if (saved) setLibrary(JSON.parse(saved));
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const saveToLibrary = (nickname: string) => {
    if (!currentPlant) return;
    const newPlant: PlantMemory = {
      ...currentPlant as any,
      id: Date.now().toString(),
      plantNickname: nickname || currentPlant.plantNickname,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'seed',
    };
    const updated = [newPlant, ...library];
    setLibrary(updated);
    localStorage.setItem('mahkah_library', JSON.stringify(updated));
    setScreen('library');
  };

  const updatePlantStatus = (id: string, s: PlantStatus) => {
    const updated = library.map(p => p.id === id ? { ...p, status: s, updatedAt: new Date().toISOString() } : p);
    setLibrary(updated);
    localStorage.setItem('mahkah_library', JSON.stringify(updated));
    if (selectedPlant?.id === id) {
      setSelectedPlant({ ...selectedPlant, status: s });
    }
  };

  const handleUpload = async (b64: string) => {
    if (!visitor) return;
    setScreen('loading');
    try {
      const res = await generatePlantStory(b64, visitor);
      setCurrentPlant({
        visitorName: visitor.name,
        visitorType: visitor.type,
        language: visitor.language,
        imageUrl: b64,
        title: res.title,
        story: res.story,
        // Fix: res.funFact should be res.fun_fact as per AIResponse type definition
        funFact: res.fun_fact,
        question: res.question,
        plantNickname: res.suggested_plant_name,
      });
      setScreen('story');
    } catch (error) {
      console.error('Story generation error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('مزدحمة');
      const isNotPlantError = errorMessage.includes('400') || errorMessage.includes('not_a_plant') || errorMessage.includes('لا تحتوي على نبتة');
      
      // عرض رسالة خطأ مفصلة
      let userMessage = '';
      
      if (isNotPlantError) {
        userMessage = lang === 'ar' 
          ? '🚫 عذراً، هذه الصورة لا تحتوي على نبتة!\n\n🌱 يرجى تصوير:\n• شجرة\n• زهرة\n• نبتة خضراء\n• أي نوع من النباتات'
          : '🚫 Sorry, this image does not contain a plant!\n\n🌱 Please photograph:\n• A tree\n• A flower\n• A green plant\n• Any type of vegetation';
      } else if (isRateLimitError) {
        userMessage = lang === 'ar' 
          ? '⏳ الخدمة مزدحمة حالياً بسبب عدد الزوار. يرجى الانتظار 10-20 ثانية والمحاولة مرة أخرى.' 
          : '⏳ Service is busy due to high traffic. Please wait 10-20 seconds and try again.';
      } else if (errorMessage.includes('500')) {
        userMessage = lang === 'ar'
          ? '❌ خطأ في الخادم. يرجى المحاولة مرة أخرى.'
          : '❌ Server error. Please try again.';
      } else if (errorMessage.includes('404')) {
        userMessage = lang === 'ar'
          ? '❌ الخدمة غير متاحة حالياً. يرجى التواصل مع الدعم.'
          : '❌ Service unavailable. Please contact support.';
      } else {
        userMessage = lang === 'ar' 
          ? 'حدث خطأ في استنطاق الحكاية. حاول مرة أخرى.'
          : 'Error generating story. Try again.';
      }
      
      alert(userMessage);
      setScreen('upload');
    }
  };

  return (
    <div className={`min-h-screen pb-10 bg-[#F5EEE0] text-[#2C4A24] ${lang === 'ar' ? 'arabic-text' : 'font-latin'}`}>
      {screen !== 'splash' && (
        <Header 
          lang={lang} 
          onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')} 
          onGoHome={() => setScreen('splash')}
          onGoLibrary={() => setScreen('library')}
        />
      )}

      <main className="animate-page-enter">
        {screen === 'splash' && <SplashPage onStart={() => setScreen('setup')} lang={lang} />}
        
        {screen === 'setup' && (
          <SetupPage 
            lang={lang} 
            onNext={(info) => {
              setVisitor(info);
              setScreen('upload');
            }} 
          />
        )}

        {screen === 'upload' && (
          <UploadPage 
            lang={lang} 
            onUpload={handleUpload} 
          />
        )}

        {screen === 'loading' && (
          <div className="flex flex-col items-center justify-center min-h-[75vh] p-8 text-center">
             <div className="relative mb-14">
                <div className="w-40 h-40 border-[16px] border-[#D1A980]/20 border-t-[#2C4A24] rounded-full animate-spin"></div>
                {/* شعار التحميل - واضح ومركزي */}
                <img 
                  src={LOGO_URL} 
                  alt="Loading" 
                  className="absolute inset-0 w-32 h-32 m-auto opacity-100 object-contain logo-sharp drop-shadow-sm" 
                />
             </div>
             <h2 className="text-2xl font-bold text-[#2C4A24] animate-pulse max-w-xs">{TRANSLATIONS[lang].loading}</h2>
          </div>
        )}

        {screen === 'story' && currentPlant && (
          <StoryPage 
            plant={currentPlant} 
            lang={lang} 
            onSave={saveToLibrary}
            onCancel={() => setScreen('upload')}
          />
        )}

        {screen === 'library' && (
          <LibraryPage 
            plants={library} 
            lang={lang} 
            onBack={() => setScreen('splash')}
            onSelect={(p) => {
              setSelectedPlant(p);
              setScreen('details');
            }}
          />
        )}

        {screen === 'details' && selectedPlant && (
          <DetailPage 
            plant={selectedPlant} 
            lang={lang} 
            onBack={() => setScreen('library')}
            onUpdateStatus={updatePlantStatus}
          />
        )}
      </main>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.04); opacity: 0.98; }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-page-enter {
          animation: fade-in 0.4s ease-out forwards;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
