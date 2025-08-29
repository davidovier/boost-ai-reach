import { Languages, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage, getLanguageDisplayName } from '@/lib/i18n';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguageContext();

  const handleLanguageChange = (newLanguage: SupportedLanguage) => {
    if (newLanguage !== language) {
      setLanguage(newLanguage);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border/20 transition-all duration-200"
          aria-label={`Current language: ${getLanguageDisplayName(language)}. Click to change language`}
        >
          <Languages className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only text-sm font-medium">
            {SUPPORTED_LANGUAGES[language]?.nativeName || 'English'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, { name, nativeName }]) => {
          const isSelected = language === code;
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => handleLanguageChange(code as SupportedLanguage)}
              className={`flex items-center justify-between cursor-pointer ${
                isSelected ? 'bg-accent text-accent-foreground' : ''
              }`}
              aria-selected={isSelected}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{nativeName}</span>
                {name !== nativeName && (
                  <span className="text-xs text-muted-foreground">
                    ({name})
                  </span>
                )}
              </div>
              {isSelected && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}