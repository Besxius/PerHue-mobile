export interface PagingResponse<T> {
    items: T[];
    totalCount: number;
    pageSize: number;
    pageIndex: number;
    totalPages: number;
}