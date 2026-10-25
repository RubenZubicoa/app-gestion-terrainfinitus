export type NewsLetterSubscriptionDB = {
  _id?: string;
  email: string;
  createdAt?: number;
  updatedAt?: number;
  isDeleted?: boolean;
};

export interface NewsLetterSubscription {
  uuid: string;
  email: string;
  createdAt?: number;
}

export interface NewsLetterSubscriptionCreate {
  email: string;
}

export interface NewsLetterSubscriptionUpdate {
  email?: string;
}

export function mapNewsLetterSubscriptionDBToNewsLetterSubscription(
  subscriptionDB: NewsLetterSubscriptionDB,
): NewsLetterSubscription {
  return {
    uuid: subscriptionDB._id ?? '',
    email: subscriptionDB.email,
    createdAt: subscriptionDB.createdAt,
  };
}
