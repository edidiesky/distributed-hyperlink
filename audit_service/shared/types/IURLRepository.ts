import { IURL } from ".";

export interface IURLRepository {
  createURL: (
    data: Partial<IURL>,
  ) => Promise<IURL>;
  getALLURL: (
    query: Partial<IURL>,
    skip: number,
    limit: number
  ) => Promise<IURL[] | null>;
  getSingleURL: (URLId: string) => Promise<IURL | null>;
  updateURL: (
    data: Partial<IURL>,
    URLId: string
  ) => Promise<IURL | null>;
  deleteURL: (data: string) => Promise<void>;
}
