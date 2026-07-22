import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { DEFAULT_PROJECT_ID, PROJECTS } from '../constants/projects';
import { GLOBAL_SECTIONS } from '../constants/global-sections';
import { ProjectId, Project } from '../models/the-lake/project';
import { NavSection } from '../models/the-lake/nav-section';

const STORAGE_KEY = 'selected-project-id';

@Injectable({ providedIn: 'root' })
export class ProjectContextService {
  private readonly router = inject(Router);

  readonly projects = PROJECTS;
  readonly globalSections: readonly NavSection[] = GLOBAL_SECTIONS;

  private readonly selectedProjectId = signal<ProjectId>(this.readStoredProjectId());

  readonly selectedProject = computed<Project>(() => {
    const id = this.selectedProjectId();
    return this.projects.find((project) => project.id === id) ?? this.projects[0];
  });

  readonly selectedSections = computed(() => this.selectedProject().sections);

  selectProject(projectId: ProjectId): void {
    if (!this.projects.some((project) => project.id === projectId)) {
      return;
    }

    const previousId = this.selectedProjectId();

    if (previousId === projectId) {
      return;
    }

    this.selectedProjectId.set(projectId);
    localStorage.setItem(STORAGE_KEY, projectId);

    const currentUrl = this.router.url.split('?')[0];
    const isGlobalSection = this.globalSections.some((section) => currentUrl.startsWith(section.path));

    if (!isGlobalSection) {
      void this.router.navigate(['/dashboard']);
    }
  }

  private readStoredProjectId(): ProjectId {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored && this.projects.some((project) => project.id === stored)) {
      return stored as ProjectId;
    }

    return DEFAULT_PROJECT_ID;
  }
}
