export type NewsLetterDB = {
  _id?: string;
  title: string;
  path: string;
  pathImage?: string;
  publishedAt?: number;
  createdAt?: number;
  updatedAt?: number;
  isDeleted?: boolean;
};

export interface NewsLetter {
  uuid: string;
  title: string;
  path: string;
  pathImage?: string;
  publishedAt?: number;
}

export interface NewsLetterCreate {
  title: string;
  path: File;
  pathImage?: File;
}

export interface NewsLetterUpdate {
  title?: string;
  path?: File;
  pathImage?: File;
}

export function mapNewsLetterDBToNewsLetter(newsLetterDB: NewsLetterDB): NewsLetter {
  return {
    uuid: newsLetterDB._id ?? '',
    title: newsLetterDB.title,
    path: newsLetterDB.path,
    pathImage: newsLetterDB.pathImage,
    publishedAt: newsLetterDB.publishedAt,
  };
}
