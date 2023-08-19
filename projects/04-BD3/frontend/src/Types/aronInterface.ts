export interface AronApiResponse {
    code: number;
    errMsg: string | null;
    data: AronDataArray;
}

export interface AronDataItem {
    avatar: string;
    name: string;
    walletAddress: string;
}

export type AronDataArray = AronDataItem[];

export interface AxiosResponse<T> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: Record<string, any>;
    request: any;
}