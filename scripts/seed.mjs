import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.log('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Skipping seed.');
  process.exit(0);
}

const supabase = createClient(url, serviceKey);

async function ensurePlans() {
  const plans = [
    { name: 'free', price: 0, max_sites: 1, max_scans: 1, max_prompts: 1, max_competitors: 0 },
    { name: 'pro', price: 2900, max_sites: 3, max_scans: 4, max_prompts: 10, max_competitors: 1 },
    { name: 'growth', price: 9900, max_sites: 10, max_scans: 30, max_prompts: 50, max_competitors: 5 },
    { name: 'enterprise', price: 0, max_sites: 999, max_scans: 999, max_prompts: 999, max_competitors: 999 },
  ];

  for (const p of plans) {
    const { error } = await supabase.from('plans').upsert(p, { onConflict: 'name' });
    if (error) {
      console.error('Failed to upsert plan', p.name, error.message);
    } else {
      console.log('Ensured plan:', p.name);
    }
  }
}

(async () => {
  await ensurePlans();
  console.log('Seed complete.');
})();
