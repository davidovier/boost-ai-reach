import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/lib/i18n';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguageContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
          aria-label="Change language"
        >
          <Languages className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">
            {SUPPORTED_LANGUAGES[language].nativeName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, { name, nativeName }]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code as SupportedLanguage)}
            className={`flex items-center justify-between ${
              language === code ? 'bg-accent' : ''
            }`}
          >
            <span>{nativeName}</span>
            {name !== nativeName && (
              <span className="text-sm text-muted-foreground ml-2">
                {name}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}