export type CategoryDB = {
    _id: string;
    label: string;
    description?: string;
    image?: string;
    children?: CategoryDB[];
    createdAt?: number;
    updatedAt?: number;
    isDeleted?: boolean;
}

export interface Category {
    uuid: string;
    label: string;
    description?: string;
    image?: string;
    children?: Category[];
}

export type CategoryChildPayload = {
    uuid?: string;
    label: string;
    description?: string;
    image?: string | File | null;
};

export interface CategoryCreate {
    label: string;
    description?: string;
    image?: File;
    children?: CategoryChildPayload[];
}

export interface CategoryUpdate {
    label?: string;
    description?: string;
    image?: File;
    children?: CategoryChildPayload[];
}

type CategorySource = CategoryDB & { uuid?: string };

export function mapCategoryDBToCategory(categoryDB: CategorySource | null | undefined): Category {
    if (!categoryDB) {
        return { uuid: '', label: '' };
    }

    return {
        uuid: categoryDB._id ?? categoryDB.uuid ?? '',
        label: categoryDB.label,
        description: categoryDB.description,
        image: categoryDB.image,
        children: categoryDB.children?.map((child) =>
            mapCategoryDBToCategory(child as CategorySource),
        ),
    };
}