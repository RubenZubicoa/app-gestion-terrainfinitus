export type CategoryDB = {
  _id: string;
  label: string;
  description?: string;
  image?: string;
  children?: CategoryDB[];
  priority?: number | string | null;
  createdAt?: number;
  updatedAt?: number;
  isDeleted?: boolean;
};

export interface Category {
  uuid: string;
  label: string;
  description?: string;
  image?: string;
  children?: Category[];
  priority?: number;
}

export type CategoryChildPayload = {
  uuid?: string;
  label: string;
  description?: string;
  image?: string | File | null;
  priority?: number;
};

export interface CategoryCreate {
  label: string;
  description?: string;
  image?: File;
  children?: CategoryChildPayload[];
  priority?: number;
}

export interface CategoryUpdate {
  label?: string;
  description?: string;
  image?: File;
  children?: CategoryChildPayload[];
  priority?: number;
}

type CategorySource = CategoryDB & { uuid?: string };

function mapPriority(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function mapCategoryDBToCategory(categoryDB: CategorySource | null | undefined): Category {
  if (!categoryDB) {
    return { uuid: '', label: '' };
  }

  const priority = mapPriority(categoryDB.priority);

  return {
    uuid: categoryDB._id ?? categoryDB.uuid ?? '',
    label: categoryDB.label,
    description: categoryDB.description,
    image: categoryDB.image,
    ...(priority !== undefined ? { priority } : {}),
    children: categoryDB.children?.map((child) =>
      mapCategoryDBToCategory(child as CategorySource),
    ),
  };
}
