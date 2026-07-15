import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { DEFAULT_PROJECT_ID, PROJECTS } from '../constants/projects';
import { ProjectId, Project } from '../models/the-lake/project';

const STORAGE_KEY = 'selected-project-id';

@Injectable({ providedIn: 'root' })
export class ProjectContextService {
  private readonly router = inject(Router);

  readonly projects = PROJECTS;

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
    void this.router.navigate(['/dashboard']);
  }

  private readStoredProjectId(): ProjectId {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored && this.projects.some((project) => project.id === stored)) {
      return stored as ProjectId;
    }

    return DEFAULT_PROJECT_ID;
  }
}
