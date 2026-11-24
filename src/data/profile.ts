import { z } from 'zod';
import data from './profile.json';

const bullets = z.array(z.string().min(1));
// link/repo and basic_info.portfolio are reserved for the owner to fill in later; not rendered yet.
const link = z.string().min(1).optional();

export const ProfileSchema = z.object({
  basic_info: z.object({
    name: z.string(), email: z.string(), location: z.string(), summary: z.string(),
    github: z.string(), linkedin: z.string(), portfolio: link,
    headline: z.string(), open_to: z.string(),
  }).strict(),
  skills: z.array(z.string()),
  education: z.array(z.object({
    institution: z.string(), degree: z.string(), duration: z.string(), bullets,
  }).strict()),
  work_experience: z.array(z.object({
    title: z.string(), company: z.string(), duration: z.string(),
    type: z.enum(['Apprenticeship', 'Contract', 'Internship', 'Part-time', 'Full-time']),
    tech: z.array(z.string()), bullets,
  }).strict()),
  org_experience: z.array(z.object({
    role: z.string(), organization: z.string(), duration: z.string(), bullets,
  }).strict()),
  projects: z.array(z.object({
    slug: z.string(), name: z.string(), cover: z.string(),
    technologies: z.array(z.string()), link, repo: link,
    case_study: z.object({
      summary: z.string(), role: z.string(), problem: z.string(),
      built: z.array(z.string()), result: z.string().optional(),
      architecture: z.string().optional(),
      links: z.array(z.object({ label: z.string(), url: z.string() }).strict()),
    }).strict(),
  }).strict()),
  publications: z.array(z.object({
    title: z.string(), publisher: z.string(), date: z.string(), link, bullets,
  }).strict()),
  certificates: z.array(z.object({
    name: z.string(), issuer: z.string(), date: z.string(), link,
    badge: z.string(), skills: z.array(z.string()),
  }).strict()),
}).strict();

export type Profile = z.infer<typeof ProfileSchema>;
export const parseProfile = (raw: unknown): Profile => ProfileSchema.parse(raw);
export const profile: Profile = parseProfile(data);
