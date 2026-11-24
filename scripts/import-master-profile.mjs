// Usage: node scripts/import-master-profile.mjs <master_profile.json> <out.json>
import { readFileSync, writeFileSync } from 'node:fs';

const [src, out] = process.argv.slice(2);
const m = JSON.parse(readFileSync(src, 'utf8'));

const toBullets = ({ description, ...rest }) => ({
  ...rest,
  bullets: (description ?? '').split('\n').map((l) => l.replace(/^-\s*/, '').trim()).filter(Boolean),
});
const dropEmpty = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== ''));

// phone is dropped deliberately (privacy): it must never reach the portfolio repo
const { phone, ...basic } = m.basic_info;
const work = m.work_experience.map((w) => {
  const mt = w.title.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  const type = mt ? mt[2] : /intern/i.test(w.title) ? 'Internship' : 'Full-time';
  return toBullets({ ...w, title: mt ? mt[1] : w.title, type });
});

writeFileSync(out, JSON.stringify({
  ...m,
  basic_info: dropEmpty(basic),
  education: m.education.map(toBullets),
  work_experience: work,
  org_experience: m.org_experience.map(toBullets),
  projects: m.projects.map((p) => dropEmpty(toBullets(p))),
  publications: m.publications.map((p) => dropEmpty(toBullets(p))),
  certificates: m.certificates.map(dropEmpty),
}, null, 2) + '\n');
