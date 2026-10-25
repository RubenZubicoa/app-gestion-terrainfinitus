export type ShippingCostList = {
  company: string;
  cost: number;
};

export type ShippingCostDB = {
  _id?: string;
  zone: string;
  costList: ShippingCostList[];
  createdAt?: number;
  updatedAt?: number;
  isDeleted?: boolean;
};

export interface ShippingCost {
  uuid: string;
  zone: string;
  costList: ShippingCostList[];
}

export interface ShippingCostCreate {
  zone: string;
  costList: ShippingCostList[];
}

export interface ShippingCostUpdate {
  zone?: string;
  costList?: ShippingCostList[];
}

export function mapShippingCostDBToShippingCost(shippingCostDB: ShippingCostDB): ShippingCost {
  return {
    uuid: shippingCostDB._id ?? '',
    zone: shippingCostDB.zone,
    costList: shippingCostDB.costList ?? [],
  };
}
