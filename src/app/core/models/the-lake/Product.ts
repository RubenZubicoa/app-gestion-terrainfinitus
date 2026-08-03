import { Brand, BrandDB } from "./Brand";
import { Category, CategoryDB } from "./Category";


type ProductOption = {
    label: string;
    options: {
        id: string;
        label: string;
    }[];
};

export type ProductDB = {
    _id: string;
    brandId: BrandDB['_id'];
    name: string;
    description?: string;
    price: number;
    professionalPrice?: number | string | null;
    stock: number;
    categoryId: CategoryDB['_id'];
    images: string[];
    options?: ProductOption;
    isFeatured?: boolean | string;
    isInOffer?: boolean | string | null;
    offerPrice?: number | string | null;
    createdAt?: number;
    updatedAt?: number;
    isDeleted?: boolean;
}

export interface Product {
    uuid: string;
    brandId: Brand['uuid'];
    name: string;
    description?: string;
    price: number;
    professionalPrice?: number;
    stock: number;
    categoryId: Category['uuid'];
    images: string[];
    options?: ProductOption;
    isFeatured: boolean;
    isInOffer?: boolean;
    offerPrice?: number;
}

export interface ProductCreate {
    brandId: Brand['uuid'];
    name: string;
    description?: string;
    price: number;
    professionalPrice?: number;
    stock: number;
    categoryId: Category['uuid'];
    options?: ProductOption[];
    isFeatured: boolean;
    isInOffer?: boolean;
    offerPrice?: number;
}

export interface ProductUpdate {
    brandId?: string;
    name?: string;
    description?: string;
    price?: number;
    professionalPrice?: number | null;
    stock?: number;
    categoryId?: string;
    existingImages?: string[];
    options?: ProductOption;
    isFeatured?: boolean;
    isInOffer?: boolean | null;
    offerPrice?: number | null;
}

export type ProductWithQuantity = Product & {
    quantity: number;
}

function mapOfferFlag(value: unknown): boolean | undefined {
    if (value === true || value === 'true' || value === 1 || value === '1') {
        return true;
    }

    return undefined;
}

function mapOfferPrice(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '' || value === 'null') {
        return undefined;
    }

    const price = Number(value);
    return Number.isFinite(price) ? price : undefined;
}

export function mapProductDBToProduct(productDB: ProductDB): Product {
    const offerPrice = mapOfferPrice(productDB.offerPrice);
    const professionalPrice = mapOfferPrice(productDB.professionalPrice);
    const isInOffer =
        mapOfferFlag(productDB.isInOffer) === true || offerPrice !== undefined ? true : undefined;

    return {
        uuid: productDB._id,
        brandId: productDB.brandId,
        name: productDB.name,
        description: productDB.description,
        price: productDB.price,
        stock: productDB.stock,
        categoryId: productDB.categoryId,
        images: productDB.images,
        options: productDB.options,
        isFeatured: productDB.isFeatured === true || productDB.isFeatured === 'true',
        ...(professionalPrice !== undefined ? { professionalPrice } : {}),
        ...(isInOffer === true ? { isInOffer: true, offerPrice } : {}),
    }
}
