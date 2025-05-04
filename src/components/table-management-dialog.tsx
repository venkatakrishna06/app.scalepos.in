import { useState } from 'react';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { useTableStore } from '@/lib/store';
import { Table } from '@/types';

interface TableManagementDialogProps {
  open: boolean;
  onClose: () => void;
  action: 'add' | 'merge' | 'split';
  selectedTable?: Table;
}

export function TableManagementDialog({
  open,
  onClose,
  action,
  selectedTable,
}: TableManagementDialogProps) {
  const { addTable, mergeTables, splitTable, tables } = useTableStore();
  const [capacity, setCapacity] = useState(4);
  const [selectedTables, setSelectedTables] = useState<number[]>([]);

  const handleAction = () => {
    switch (action) {
      case 'add':
        { const maxTableNumber = Math.max(...tables.map((t) => t.table_number), 0);
          addTable({
          table_number: maxTableNumber + 1,
          capacity,
          status: 'available',
        });
        break; }
      case 'merge':
        if (selectedTables.length > 1) {
          mergeTables(selectedTables);
        }
        break;
      case 'split':
        if (selectedTable && capacity > 0) {
          splitTable(selectedTable.id, capacity);
        }
        break;
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        action === 'add'
          ? 'Add New Table'
          : action === 'merge'
          ? 'Merge Tables'
          : 'Split Table'
      }
    >
      <div className="space-y-6">
        {action === 'add' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Capacity
            </label>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        )}

        {action === 'merge' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Tables to Merge
            </label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {tables
                .filter((t) => t.status === 'available')
                .map((table) => (
                  <Button
                    key={table.id}
                    variant={
                      selectedTables.includes(table.id) ? 'primary' : 'outline'
                    }
                    onClick={() =>
                      setSelectedTables((prev) =>
                        prev.includes(table.id)
                          ? prev.filter((id) => id !== table.id)
                          : [...prev, table.id]
                      )
                    }
                  >
                    Table {table.table_number}
                  </Button>
                ))}
            </div>
          </div>
        )}

        {action === 'split' && selectedTable && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Table Capacity
            </label>
            <input
              type="number"
              min="1"
              max={selectedTable.capacity - 1}
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAction}>
            {action === 'add'
              ? 'Add Table'
              : action === 'merge'
              ? 'Merge Tables'
              : 'Split Table'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}