import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {tableService} from '@/lib/api/services/table.service';
import {Table} from '@/types';
import {toast} from '@/lib/toast';

export const useTable = () => {
  const queryClient = useQueryClient();

  // Query to get all tables
  const useTablesQuery = () => {
    return useQuery({
      queryKey: ['tables'],
      queryFn: () => tableService.getTables(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Mutation to create a table
  const createTableMutation = useMutation({
    mutationFn: (table: Omit<Table, 'id'>) => tableService.createTable(table),
    onSuccess: () => {
      // Invalidate tables query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table created successfully');
    },
    onError: (error) => {

      toast.error('Failed to create table');
    },
  });

  // Mutation to update a table
  const updateTableMutation = useMutation({
    mutationFn: ({ id, table }: { id: number; table: Partial<Table> }) => 
      tableService.updateTable(id, table),
    onSuccess: () => {
      // Invalidate tables query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table updated successfully');
    },
    onError: (error) => {

      toast.error('Failed to update table');
    },
  });

  // Mutation to delete a table
  const deleteTableMutation = useMutation({
    mutationFn: (id: number) => tableService.deleteTable(id),
    onSuccess: () => {
      // Invalidate tables query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table deleted successfully');
    },
    onError: (error) => {

      toast.error('Failed to delete table');
    },
  });

  return {
    // Queries
    useTablesQuery,
    
    // Mutations
    createTable: createTableMutation.mutate,
    isCreatingTable: createTableMutation.isPending,
    createTableError: createTableMutation.error,
    
    updateTable: updateTableMutation.mutate,
    isUpdatingTable: updateTableMutation.isPending,
    updateTableError: updateTableMutation.error,
    
    deleteTable: deleteTableMutation.mutate,
    isDeletingTable: deleteTableMutation.isPending,
    deleteTableError: deleteTableMutation.error,
  };
};