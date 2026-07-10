import { NavSection } from './nav-section';

export type ProjectId = 'the-lake' | 'terrainfinitus';

export interface Project {
  id: ProjectId;
  name: string;
  shortLabel: string;
  description: string;
  accentClass: string;
  badgeClass: string;
  sections: readonly NavSection[];
}
