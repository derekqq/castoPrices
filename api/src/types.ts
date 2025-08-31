export interface Store {
  storeId: string;
  name: string;
  price: number;
  qty: number;
  discountInfo?: string;
  specialMark?: string;
}

export interface Product {
  ean: string;
  name: string;
  imageUrl: string;
  originalPrice: number;
  stores: Store[];
}
