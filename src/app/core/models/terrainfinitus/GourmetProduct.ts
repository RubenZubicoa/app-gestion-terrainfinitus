import { I18n } from './i18n';

export interface Product {
  _id: string;
  slug: string;
  key: string;
  category: string;
  sectionId: string;
  sortOrder: number;
  price: number;
  profesionalPrice: number;
  currency: string;
  image: string;
  imageUrl: string;
  sourceUrl: string;
  nameKey: string;
  descriptionKey: string;
  i18n: I18n;
  active: boolean;
  exportedAt: string;
}

export type GourmetProductCreate = Omit<Product, '_id' | 'exportedAt'> & {
  exportedAt?: string;
};

export type GourmetProductUpdate = Partial<Omit<Product, '_id'>>;
