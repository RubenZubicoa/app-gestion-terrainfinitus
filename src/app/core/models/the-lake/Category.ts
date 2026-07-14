export type CategoryDB = {
    _id: string;
    label: string;
    description?: string;
    children?: CategoryDB[];
    createdAt?: number;
    updatedAt?: number;
    isDeleted?: boolean;
}

export interface Category {
    uuid: string;
    label: string;
    description?: string;
    children?: Category[];
}

export interface CategoryCreate {
    label: string;
    description?: string;
    children?: Category[];
}

export interface CategoryUpdate {
    label?: string;
    description?: string;
    children?: Category[];
}

export function mapCategoryDBToCategory(categoryDB: CategoryDB): Category {
    return {
        uuid: categoryDB._id,
        label: categoryDB.label,
        description: categoryDB.description,
        children: categoryDB.children?.map(mapCategoryDBToCategory),
    }
}