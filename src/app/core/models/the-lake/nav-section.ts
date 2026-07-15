export type NavSectionIcon =
  | 'home'
  | 'box'
  | 'folder'
  | 'tag'
  | 'cart'
  | 'chart'
  | 'users'
  | 'calendar'
  | 'document'
  | 'settings';

export interface NavSection {
  id: string;
  label: string;
  path: string;
  icon: NavSectionIcon;
}
