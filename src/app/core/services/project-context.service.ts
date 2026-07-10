import { Injectable, computed, signal } from '@angular/core';

import { DEFAULT_PROJECT_ID, PROJECTS } from '../constants/projects';
import { Project, ProjectId } from '../models/project';

const STORAGE_KEY = 'selected-project-id';

@Injectable({ providedIn: 'root' })
export class ProjectContextService {
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

    this.selectedProjectId.set(projectId);
    localStorage.setItem(STORAGE_KEY, projectId);
  }

  private readStoredProjectId(): ProjectId {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored && this.projects.some((project) => project.id === stored)) {
      return stored as ProjectId;
    }

    return DEFAULT_PROJECT_ID;
  }
}
