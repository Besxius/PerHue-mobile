export interface PagingResponse<T> {
    items: T[];
    totalCount: number;
    pageSize: number;
    pageIndex: number;
    totalPages: number;
}

export interface ImageSource { uri: string; }

export interface BaseHistoryItem {
    id: number;
    title: string;
    subTitle: string;
    date: string;
    status: string;
    imageSources: ImageSource[];
    buttonText: string;
    isOrder: boolean;
    extraInfo?: string;
    isExpert: boolean;
    originalDate?: Date;
}