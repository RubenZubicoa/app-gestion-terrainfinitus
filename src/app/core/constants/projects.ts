import { Project } from '../models/project';

export const PROJECTS: readonly Project[] = [
  {
    id: 'the-lake',
    name: 'THE LAKE',
    shortLabel: 'Lake',
    description: 'Plataforma THE LAKE',
    accentClass: 'project-the-lake',
    badgeClass: 'bg-sky-600 text-white',
  },
  {
    id: 'terrainfinitus',
    name: 'TERRAINFINITUS',
    shortLabel: 'Terrainfinitus',
    description: 'Plataforma TERRAINFINITUS',
    accentClass: 'project-terrainfinitus',
    badgeClass: 'bg-emerald-700 text-white',
  },
] as const;

export const DEFAULT_PROJECT_ID = PROJECTS[0].id;
