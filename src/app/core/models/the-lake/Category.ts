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

type CategorySource = CategoryDB & { uuid?: string };

export function mapCategoryDBToCategory(categoryDB: CategorySource): Category {
    return {
        uuid: categoryDB._id ?? categoryDB.uuid,
        label: categoryDB.label,
        description: categoryDB.description,
        children: categoryDB.children?.map((child) =>
            mapCategoryDBToCategory(child as CategorySource),
        ),
    };
}