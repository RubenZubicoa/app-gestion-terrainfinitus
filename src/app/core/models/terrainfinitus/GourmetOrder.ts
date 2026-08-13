export interface GourmetOrderDB {
    _id: string;
    userId: string;
    products: {
        productId: string;
        quantity: number;
        price: number;
    }[];
    totalPrice: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface GourmetOrder {
    uuid: string;
    userId: string;
    products: {
        productId: string;
        quantity: number;
        price: number;
    }[];
    totalPrice: number;
    status: string;
    createdAt?: string;
}

export type AddGourmetOrder = Omit<GourmetOrder, 'uuid' | 'createdAt' | 'updatedAt'>;
export type UpdateGourmetOrder = Omit<GourmetOrder, 'uuid' | 'createdAt' | 'updatedAt'>;

export function mapGourmetOrderDBToGourmetOrder(gourmetOrderDB: GourmetOrderDB): GourmetOrder {
    return {
        uuid: gourmetOrderDB._id,
        userId: gourmetOrderDB.userId,
        products: gourmetOrderDB.products,
        totalPrice: gourmetOrderDB.totalPrice,
        status: gourmetOrderDB.status,
        createdAt: gourmetOrderDB.createdAt
            ? new Date(gourmetOrderDB.createdAt).toISOString()
            : undefined,
    };
}
