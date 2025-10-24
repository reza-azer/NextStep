'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, PlusCircle, FileSpreadsheet } from 'lucide-react';
import { AddEmployeeDialog } from './add-employee-dialog';
import type { Employee } from '@/lib/types';
import { ExportExcelDialog } from './export-excel-dialog';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

interface DataActionsProps {
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onExportJson: () => void;
  onExportXlsx: (startYear: number, endYear: number) => void;
}

export function DataActions({ onAddEmployee, onExportJson, onExportXlsx }: DataActionsProps) {

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2">
      <AddEmployeeDialog onSave={onAddEmployee}>
        <HoverBorderGradient as="button" containerClassName="rounded-md" className="bg-background text-foreground">
          <PlusCircle />
          <span>Tambah Pegawai</span>
        </HoverBorderGradient>
      </AddEmployeeDialog>
      <div className="flex gap-2 ml-auto">
        <ExportExcelDialog onExport={onExportXlsx}>
           <HoverBorderGradient as="button" containerClassName="rounded-md" className="bg-background text-foreground">
            <FileSpreadsheet />
            <span>Ekspor XLSX</span>
          </HoverBorderGradient>
        </ExportExcelDialog>
         <HoverBorderGradient as="button" onClick={onExportJson} containerClassName="rounded-md" className="bg-background text-foreground">
          <FileDown />
          <span>Ekspor JSON</span>
        </HoverBorderGradient>
      </div>
    </div>
  );
}
