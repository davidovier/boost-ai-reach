import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

const tabs = [
  { key: 'users', label: 'Users' },
  { key: 'usage', label: 'Usage' },
  { key: 'reports', label: 'Reports' },
  { key: 'dashboard', label: 'Dashboard Config' },
  { key: 'logs', label: 'Audit Logs' },
  { key: 'billing', label: 'Billing' },
];

export function AdminSubNav() {
  const [params, setParams] = useSearchParams();
  const active = params.get('tab') || 'users';

  const setActive = (key: string) => {
    params.set('tab', key);
    setParams(params, { replace: true });
  };

  return (
    <nav className="flex w-full overflow-x-auto rounded-lg border border-border bg-card p-1">
      <ul className="flex gap-1">
        {tabs.map((t) => (
          <li key={t.key}>
            <button
              onClick={() => setActive(t.key)}
              className={cn(
                'px-3 py-2 rounded-md text-sm transition-colors',
                active === t.key
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-muted-foreground'
              )}
              aria-current={active === t.key ? 'page' : undefined}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
