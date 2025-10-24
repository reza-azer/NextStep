'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, PlusCircle } from 'lucide-react';
import { AddEmployeeDialog } from './add-employee-dialog';
import type { Employee } from '@/lib/types';

interface DataActionsProps {
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onExport: () => void;
  selectedIds: string[];
  children: React.ReactNode;
}

export function DataActions({ onAddEmployee, onExport, selectedIds, children }: DataActionsProps) {

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2">
      {selectedIds.length > 0 ? (
        children
      ) : (
        <AddEmployeeDialog onSave={onAddEmployee}>
          <Button>
            <PlusCircle />
            Add Employee
          </Button>
        </AddEmployeeDialog>
      )}
      <div className="flex gap-2 ml-auto">
        <Button variant="outline" onClick={onExport}>
          <FileDown />
          Export JSON
        </Button>
      </div>
    </div>
  );
}
