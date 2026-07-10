export interface BrandDB{
    _id: string;
    name: string;
    logo?: string;
    description?: string;
    createdAt?: number;
    updatedAt?: number;
    isDeleted?: boolean;
}

export interface Brand {
    uuid: string;
    name: string;
    logo?: string;
    description?: string;
}

export interface BrandCreate {
    name: string;
    logo?: string;
    description?: string;
}

export interface BrandUpdate {
    name?: string;
    logo?: string;
    description?: string;
}

export function mapBrandDBToBrand(brandDB: BrandDB): Brand {
    return {
        uuid: brandDB._id,
        name: brandDB.name,
        logo: brandDB.logo,
        description: brandDB.description,
    }
}