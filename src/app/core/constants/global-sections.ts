import { NavSection } from '../models/the-lake/nav-section';

/** Secciones globales, independientes del proyecto activo. */
export const GLOBAL_SECTIONS: readonly NavSection[] = [
  {
    id: 'usuarios',
    label: 'Usuarios',
    path: '/usuarios',
    icon: 'users',
  },
  {
    id: 'clientes',
    label: 'Clientes',
    path: '/clientes',
    icon: 'document',
  },
] as const;
