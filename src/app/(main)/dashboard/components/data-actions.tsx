'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, PlusCircle, FileSpreadsheet } from 'lucide-react';
import { AddEmployeeDialog } from './add-employee-dialog';
import type { Employee } from '@/lib/types';
import { ExportExcelDialog } from './export-excel-dialog';

interface DataActionsProps {
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onExportJson: () => void;
  onExportXlsx: (startYear: number, endYear: number) => void;
}

export function DataActions({ onAddEmployee, onExportJson, onExportXlsx }: DataActionsProps) {

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2">
        <AddEmployeeDialog onSave={onAddEmployee}>
          <Button>
            <PlusCircle />
            Tambah Pegawai
          </Button>
        </AddEmployeeDialog>
      <div className="flex gap-2 ml-auto">
        <ExportExcelDialog onExport={onExportXlsx}>
          <Button variant="outline">
            <FileSpreadsheet />
            Ekspor XLSX
          </Button>
        </ExportExcelDialog>
        <Button variant="outline" onClick={onExportJson}>
          <FileDown />
          Ekspor JSON
        </Button>
      </div>
    </div>
  );
}
