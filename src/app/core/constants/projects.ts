import { Project } from "../models/the-lake/project";

export const PROJECTS: readonly Project[] = [
  {
    id: 'the-lake',
    name: 'THE LAKE',
    shortLabel: 'Lake',
    description: 'Plataforma THE LAKE',
    accentClass: 'project-the-lake',
    badgeClass: 'bg-sky-600 text-white',
    sections: [
      { id: 'dashboard', label: 'Inicio', path: '/dashboard', icon: 'home' },
      { id: 'productos', label: 'Productos', path: '/the-lake/productos', icon: 'box' },
      { id: 'categorias', label: 'Categorías', path: '/the-lake/categorias', icon: 'folder' },
      { id: 'marcas', label: 'Marcas', path: '/the-lake/marcas', icon: 'tag' },
      { id: 'pedidos', label: 'Pedidos', path: '/the-lake/pedidos', icon: 'cart' },
      { id: 'analisis', label: 'Análisis', path: '/the-lake/analisis', icon: 'chart' },
    ],
  },
  {
    id: 'terrainfinitus',
    name: 'TERRAINFINITUS',
    shortLabel: 'Terrainfinitus',
    description: 'Plataforma TERRAINFINITUS',
    accentClass: 'project-terrainfinitus',
    badgeClass: 'bg-emerald-700 text-white',
    sections: [
      { id: 'dashboard', label: 'Inicio', path: '/dashboard', icon: 'home' },
      { id: 'reservas', label: 'Reservas', path: '/reservas', icon: 'calendar' },
      { id: 'productos', label: 'Productos', path: '/productos', icon: 'box' },
      { id: 'categorias', label: 'Categorías', path: '/categorias', icon: 'folder' },
      { id: 'marcas', label: 'Marcas', path: '/marcas', icon: 'tag' },
      { id: 'pedidos', label: 'Pedidos', path: '/pedidos', icon: 'cart' },
    ],
  },
] as const;

export const DEFAULT_PROJECT_ID = PROJECTS[0].id;
