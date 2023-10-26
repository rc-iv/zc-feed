export type Trade = {
    timestamp: string;
    buyer: string;
    channelId: string;
    transactionType: string;
    ethAmount: string;
    shareQuantity: string;
    transactionHash: string;
  };

export type Trader = {
  address: string;
  netWorth?: string;
  nftValue?: string;
  appValue?: string;
  chainChatValue?: string;
}

export interface ProductAsset {
  balanceUSD: number;
}

export interface Product {
  assets: ProductAsset[];
}

export interface AppData {
  key?: string;
  address?: string;
  appId?: string;
  appName?: string;
  appImage?: string;
  network?: string;
  updatedAt?: string;
  balanceUSD: number;
  products: Product[];
}

export type ZapperResponse = AppData[];