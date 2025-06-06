import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage, Language } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Globe } from 'lucide-react';

// Flag components as SVG
const FlagUS = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 16" className={className}>
    <defs>
      <pattern id="stars" x="0" y="0" width="4" height="3" patternUnits="userSpaceOnUse">
        <rect width="4" height="3" fill="#002868"/>
        <circle cx="1" cy="1" r="0.3" fill="white"/>
        <circle cx="3" cy="2" r="0.3" fill="white"/>
      </pattern>
    </defs>
    <rect width="24" height="16" fill="#BF0A30"/>
    <rect width="24" height="1.23" y="1.23" fill="white"/>
    <rect width="24" height="1.23" y="3.69" fill="white"/>
    <rect width="24" height="1.23" y="6.15" fill="white"/>
    <rect width="24" height="1.23" y="8.62" fill="white"/>
    <rect width="24" height="1.23" y="11.08" fill="white"/>
    <rect width="24" height="1.23" y="13.54" fill="white"/>
    <rect width="9.6" height="8.61" fill="url(#stars)"/>
  </svg>
);

const FlagSA = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 16" className={className}>
    <rect width="24" height="16" fill="#006C35"/>
    <g transform="translate(12,8)">
      <text x="0" y="0" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="6" fontFamily="Arial">
        ﷽
      </text>
    </g>
    <g transform="translate(4,10)">
      <path d="M0,0 L2,0 L3,1 L2,2 L0,2 Z" fill="white"/>
      <circle cx="1" cy="3" r="0.5" fill="white"/>
    </g>
  </svg>
);

const FlagES = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 16" className={className}>
    <rect width="24" height="16" fill="#AA151B"/>
    <rect width="24" height="6.4" y="4.8" fill="#F1BF00"/>
  </svg>
);

const FlagFR = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 16" className={className}>
    <rect width="8" height="16" fill="#002395"/>
    <rect x="8" width="8" height="16" fill="white"/>
    <rect x="16" width="8" height="16" fill="#ED2939"/>
  </svg>
);

const FlagDE = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 16" className={className}>
    <rect width="24" height="5.33" fill="#000000"/>
    <rect width="24" height="5.33" y="5.33" fill="#DD0000"/>
    <rect width="24" height="5.33" y="10.67" fill="#FFCE00"/>
  </svg>
);

const FlagCN = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 16" className={className}>
    <rect width="24" height="16" fill="#DE2910"/>
    <g fill="#FFDE00">
      <polygon points="4,3 5,5 3,4 5,4 3,5" transform="scale(0.8)"/>
      <polygon points="8,2 8.5,3 7.5,2.5 8.5,2.5 7.5,3" transform="scale(0.6)"/>
      <polygon points="9,4 9.5,5 8.5,4.5 9.5,4.5 8.5,5" transform="scale(0.6)"/>
      <polygon points="9,6 9.5,7 8.5,6.5 9.5,6.5 8.5,7" transform="scale(0.6)"/>
      <polygon points="8,8 8.5,9 7.5,8.5 8.5,8.5 7.5,9" transform="scale(0.6)"/>
    </g>
  </svg>
);

// Language data with enhanced information
const languages = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: FlagUS,
    dir: 'ltr'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: FlagSA,
    dir: 'rtl'
  }
} as const;

interface AnimatedLanguageToggleProps {
  variant?: 'button' | 'dropdown' | 'compact';
  showNames?: boolean;
  className?: string;
}

export default function AnimatedLanguageToggle({ 
  variant = 'dropdown',
  showNames = true,
  className = ''
}: AnimatedLanguageToggleProps) {
  const { language, setLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages[language];
  const otherLanguage = languages[language === 'en' ? 'ar' : 'en'];

  const handleLanguageChange = async (newLanguage: Language) => {
    if (newLanguage === language) return;

    setIsAnimating(true);
    
    // Small delay for animation
    setTimeout(() => {
      setLanguage(newLanguage);
      setIsAnimating(false);
      setIsOpen(false);
    }, 150);
  };

  // Button variant - simple toggle between two languages
  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleLanguageChange(language === 'en' ? 'ar' : 'en')}
        className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${className}`}
        disabled={isAnimating}
      >
        <div className={`flex items-center gap-2 transition-transform duration-300 ${isAnimating ? 'scale-95' : 'scale-100'}`}>
          <div className="relative w-6 h-4">
            <currentLanguage.flag 
              className={`absolute inset-0 w-full h-full rounded transition-all duration-300 ${
                isAnimating ? 'opacity-0 rotate-12' : 'opacity-100 rotate-0'
              }`}
            />
          </div>
          {showNames && (
            <span className="text-sm font-medium">
              {currentLanguage.nativeName}
            </span>
          )}
        </div>
      </Button>
    );
  }

  // Compact variant - just the flag with minimal styling
  if (variant === 'compact') {
    return (
      <button
        onClick={() => handleLanguageChange(language === 'en' ? 'ar' : 'en')}
        className={`relative w-8 h-6 rounded overflow-hidden transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 ${className}`}
        disabled={isAnimating}
        title={`Switch to ${otherLanguage.nativeName}`}
      >
        <currentLanguage.flag 
          className={`absolute inset-0 w-full h-full transition-all duration-300 ${
            isAnimating ? 'opacity-0 scale-125 rotate-12' : 'opacity-100 scale-100 rotate-0'
          }`}
        />
      </button>
    );
  }

  // Dropdown variant - full dropdown with all languages
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${isRTL ? 'flex-row-reverse' : ''} ${className}`}
        >
          <div className={`flex items-center gap-2 transition-transform duration-300 ${isAnimating ? 'scale-95' : 'scale-100'}`}>
            <div className="relative w-6 h-4">
              <currentLanguage.flag 
                className={`absolute inset-0 w-full h-full rounded transition-all duration-300 shadow-sm ${
                  isAnimating ? 'opacity-0 rotate-12' : 'opacity-100 rotate-0'
                }`}
              />
            </div>
            {showNames && (
              <span className="text-sm font-medium">
                {currentLanguage.nativeName}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : 'rotate-0'
            }`} />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align={isRTL ? 'start' : 'end'} 
        className="w-48 p-1"
        sideOffset={5}
      >
        {Object.entries(languages).map(([code, lang]) => {
          const isSelected = language === code;
          const FlagComponent = lang.flag;
          
          return (
            <DropdownMenuItem
              key={code}
              onSelect={() => handleLanguageChange(code as Language)}
              className={`relative flex items-center gap-3 p-3 rounded-md transition-all duration-200 cursor-pointer ${
                isSelected 
                  ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                  : 'hover:bg-gray-50'
              } ${isRTL ? 'flex-row-reverse text-right' : ''}`}
            >
              <div className="relative w-6 h-4 shrink-0">
                <FlagComponent 
                  className={`w-full h-full rounded shadow-sm transition-all duration-300 ${
                    isSelected ? 'ring-2 ring-primary-300' : ''
                  }`}
                />
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                  {lang.nativeName}
                </span>
                <span className={`text-xs ${isSelected ? 'text-primary-600' : 'text-gray-500'}`}>
                  {lang.name}
                </span>
              </div>
              {isSelected && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </DropdownMenuItem>
          );
        })}
        
        <div className="border-t my-1 pt-2">
          <div className="px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
            <Globe className="h-3 w-3" />
            <span>{t('language.change_interface', 'Change interface language')}</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Additional contextual toggle for specific pages/sections
export function ContextualLanguageToggle({ 
  context,
  className = ''
}: { 
  context?: string;
  className?: string;
}) {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <div 
        className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Globe className="h-3 w-3" />
        <span>
          {context ? 
            t(`language.viewing_in_${language}`, `Viewing ${context} in ${languages[language].nativeName}`) :
            t(`language.interface_in_${language}`, `Interface in ${languages[language].nativeName}`)
          }
        </span>
      </div>
      
      {showTooltip && (
        <div className="absolute top-full left-0 mt-1 z-50">
          <AnimatedLanguageToggle variant="compact" showNames={false} />
        </div>
      )}
    </div>
  );
}