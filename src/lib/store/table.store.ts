import {create} from 'zustand';
import {Table} from '@/types';
import {tableService} from '@/lib/api/services/table.service';
import {toast} from '@/lib/toast';

interface TableState {
  tables: Table[];
  loading: boolean;
  error: string | null;
  fetchTables: () => Promise<void>;
  addTable: (table: Omit<Table, 'id'>) => Promise<void>;
  deleteTable: (id: number) => Promise<void>;
  updateTableStatus: (id: number, status: Table['status']) => Promise<void>;
  mergeTables: (tableIds: number[]) => Promise<void>;
  splitTable: (tableId: number, capacity: number) => Promise<Table>;
  assignOrder: (tableId: number, orderId: number) => Promise<void>;
  clearTable: (id: number) => Promise<void>;
}

/**
 * Store for managing restaurant tables
 *
 * This store handles:
 * - Fetching tables from the API
 * - Adding, updating, and deleting tables
 * - Managing table status (available, occupied, reserved, cleaning)
 * - Merging and splitting tables
 * - Assigning orders to tables
 * - Clearing tables after use
 */
export const useTableStore = create<TableState>((set, get) => ({
  tables: [],
  loading: false,
  error: null,

  fetchTables: async () => {
    try {
      set({ loading: true, error: null });

      // Fetch from API directly (no caching)
      const tables = await tableService.getTables();
      set({ tables });
    } catch (err) {
      console.error('Error fetching tables:', err);
      const errorMessage = 'Failed to fetch tables';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  addTable: async (table) => {
    try {
      set({ loading: true, error: null });

      // Call API but don't update state - let WebSocket handle it
      await tableService.createTable(table);

      // Just show success message
      toast.success('Table added successfully');
    } catch (err) {
      console.error('Error adding table:', err);
      const errorMessage = 'Failed to add table';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  deleteTable: async (id) => {
    try {
      set({ loading: true, error: null });
      await tableService.deleteTable(id);
      set(state => ({
        tables: state.tables.filter(table => table.id !== id),
      }));
      toast.success('Table deleted successfully');
    } catch (err) {
      console.error('Error deleting table:', err);
      const errorMessage = 'Failed to delete table';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  updateTableStatus: async (id, status) => {
    try {
      // Store the original table for potential rollback
      const originalTable = get().tables.find(t => t.id === id);
      if (!originalTable) {
        throw new Error('Table not found');
      }

      // Optimistically update UI
      set(state => ({
        tables: state.tables.map(table =>
            table.id === id ? { ...table, status } : table
        ),
      }));

      // Actual API call
      const updatedTable = await tableService.updateTable(id, { status });

      // Update with server response
      set(state => ({
        tables: state.tables.map(table =>
            table.id === id ? updatedTable : table
        ),
      }));

      // toast.success(`Table status updated to ${status}`);
    } catch (err) {
      console.error('Error updating table status:', err);

      // Revert on error
      const originalTable = get().tables.find(t => t.id === id);
      if (originalTable) {
        set(state => ({
          tables: state.tables.map(table =>
              table.id === id ? { ...table, status: originalTable.status } : table
          ),
          error: 'Failed to update table status',
        }));

        toast.error('Failed to update table status', {
          description: 'The table status has been reverted',
        });
      }
    }
  },

  mergeTables: async (tableIds) => {
    try {
      set({ loading: true, error: null });

      const mainTable = get().tables.find(t => t.id === tableIds[0]);
      if (!mainTable) {
        throw new Error('Main table not found');
      }

      const totalCapacity = tableIds.reduce((sum, id) => {
        const table = get().tables.find(t => t.id === id);
        return sum + (table?.capacity || 0);
      }, 0);

      // Store original tables for potential rollback
      const originalTables = get().tables.filter(t => tableIds.includes(t.id));

      // Optimistically update UI
      set(state => ({
        tables: state.tables.map(table => {
          if (table.id === mainTable.id) {
            return {
              ...table,
              capacity: totalCapacity,
              mergedWith: tableIds.slice(1)
            };
          } else if (tableIds.slice(1).includes(table.id)) {
            return {
              ...table,
              status: 'occupied',
              mergedWith: [mainTable.id]
            };
          }
          return table;
        }),
      }));

      try {
        // Actual API calls
        await tableService.updateTable(mainTable.id, {
          capacity: totalCapacity,
          mergedWith: tableIds.slice(1),
        });

        await Promise.all(
            tableIds.slice(1).map(id =>
                tableService.updateTable(id, {
                  status: 'occupied',
                  mergedWith: [mainTable.id],
                })
            )
        );

        // Fetch updated tables from server to ensure consistency
        await get().fetchTables();

        toast.success('Tables merged successfully');
      } catch (apiError) {
        console.error('Error in API calls during merge:', apiError);

        // Revert optimistic update on API error
        set(state => ({
          tables: state.tables.map(table => {
            const originalTable = originalTables.find(t => t.id === table.id);
            return originalTable ? originalTable : table;
          }),
          error: 'Failed to merge tables'
        }));

        toast.error('Failed to merge tables', {
          description: 'The operation has been reverted',
        });
      }
    } catch (err) {
      console.error('Error merging tables:', err);
      const errorMessage = 'Failed to merge tables';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  splitTable: async (tableId, capacity) => {
    try {
      set({ loading: true, error: null });
      const table = get().tables.find(t => t.id === tableId);
      if (!table) throw new Error('Table not found');

      const newTableData = {
        table_number: Math.max(...get().tables.map(t => t.table_number)) + 1,
        capacity,
        status: 'available' as const,
        splitFrom: tableId,
      };

      const [updatedTable, newTable] = await Promise.all([
        tableService.updateTable(tableId, {
          capacity: table.capacity - capacity,
        }),
        tableService.createTable(newTableData),
      ]);

      set(state => ({
        tables: [
          ...state.tables.map(t =>
              t.id === tableId ? updatedTable : t
          ),
          newTable,
        ],
      }));

      toast.success('Table split successfully');
      return newTable;
    } catch (err) {
      console.error('Error splitting table:', err);
      const errorMessage = 'Failed to split table';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  assignOrder: async (tableId, orderId) => {
    try {
      set({ loading: true, error: null });
      const updatedTable = await tableService.updateTable(tableId, {
        status: 'occupied',
        currentOrderId: orderId,
      });
      set(state => ({
        tables: state.tables.map(table =>
            table.id === tableId ? updatedTable : table
        ),
      }));
      toast.success('Order assigned to table');
    } catch (err) {
      console.error('Error assigning order to table:', err);
      const errorMessage = 'Failed to assign order to table';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  clearTable: async (id) => {
    try {
      set({ loading: true, error: null });
      const updatedTable = await tableService.updateTable(id, {
        status: 'cleaning',
        currentOrderId: undefined,
        mergedWith: undefined,
        splitFrom: undefined,
      });
      set(state => ({
        tables: state.tables.map(table =>
            table.id === id ? updatedTable : table
        ),
      }));
      toast.success('Table cleared successfully');
    } catch (err) {
      console.error('Error clearing table:', err);
      const errorMessage = 'Failed to clear table';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },
}));
