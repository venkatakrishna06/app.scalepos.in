// src/api/tables.ts
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {tableService} from '@/lib/api/services/table.service';
import {Table} from '@/types';

const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const CACHE_TIME = 1000 * 60 * 60; // 1 hour

export const useTables = () => {
    return useQuery({
        queryKey: ['tables'],
        queryFn: tableService.getTables,
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
    });
};

export const useCreateTable = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (table: Omit<Table, 'id'>) => tableService.createTable(table),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['tables']});
        },
    });
};

export const useUpdateTable = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({id, table}: { id: number, table: Partial<Table> }) => tableService.updateTable(id, table),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['tables']});
        },
    });
};

export const useDeleteTable = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => tableService.deleteTable(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['tables']});
        },
    });
};

export const useMergeTables = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (tableIds: number[]) => tableService.mergeTables(tableIds),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['tables']});
        },
    });
};

export const useSplitTable = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({id, capacity}: { id: number, capacity: number }) => tableService.splitTable(id, capacity),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['tables']});
        },
    });
};
