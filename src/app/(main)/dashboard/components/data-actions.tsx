'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, FileUp, PlusCircle } from 'lucide-react';
import { AddEmployeeDialog } from './add-employee-dialog';
import type { Employee } from '@/lib/types';

interface DataActionsProps {
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onImport: (file: File) => void;
  onExport: () => void;
}

export function DataActions({ onAddEmployee, onImport, onExport }: DataActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2">
      <AddEmployeeDialog onSave={onAddEmployee}>
        <Button>
          <PlusCircle />
          Add Employee
        </Button>
      </AddEmployeeDialog>
      <div className="flex gap-2 ml-auto">
        <Button variant="outline" onClick={handleImportClick}>
          <FileUp />
          Import JSON
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />
        <Button variant="outline" onClick={onExport}>
          <FileDown />
          Export JSON
        </Button>
      </div>
    </div>
  );
}
