'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { calculateKGB } from '@/lib/utils';
import { format } from 'date-fns';
import { Edit, Trash2, Users } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { AddEmployeeDialog } from './add-employee-dialog';
import { toast } from '@/hooks/use-toast';
import type { StatusUnit } from '../page';

interface EmployeeTableProps {
  employees: Employee[];
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  statusUnit: StatusUnit;
}

export function EmployeeTable({ 
  employees, 
  onUpdateEmployee, 
  onDeleteEmployee,
  selectedIds,
  onSelectionChange,
  statusUnit
}: EmployeeTableProps) {

  const handleSelectAll = (checked: boolean) => {
    onSelectionChange(checked ? employees.map(e => e.id) : []);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelection = checked 
      ? [...selectedIds, id] 
      : selectedIds.filter(selectedId => selectedId !== id);
    onSelectionChange(newSelection);
  };

  const getStatusText = (days: number, months: number, years: number) => {
    if (days <= 0) return 'Lewat waktu';
    switch (statusUnit) {
      case 'years':
        return years > 0 ? `${years} tahun lagi` : months > 0 ? `${months} bulan lagi` : `${days} hari lagi`;
      case 'months':
        return months > 0 ? `${months} bulan lagi` : `${days} hari lagi`;
      case 'days':
      default:
        return `${days} hari lagi`;
    }
  };

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4 border-2 border-dashed rounded-lg bg-card/50">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="font-headline text-xl font-semibold">Pegawai Tidak Ditemukan</h3>
        <p className="text-muted-foreground mt-1">Coba sesuaikan pencarian Anda atau tambahkan pegawai baru.</p>
      </div>
    );
  }

  const handleDelete = (id: string, name: string) => {
    onDeleteEmployee(id);
    toast({
      title: 'Pegawai Dihapus',
      description: `${name} telah dihapus dari daftar.`,
      variant: 'destructive'
    });
  }
  
  const isAllSelected = selectedIds.length > 0 && selectedIds.length === employees.length;
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox 
                checked={isAllSelected || isSomeSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Pilih semua"
              />
            </TableHead>
            <TableHead className="w-[50px]">No.</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Jabatan</TableHead>
            <TableHead>NIP</TableHead>
            <TableHead>KGB Terakhir</TableHead>
            <TableHead>KGB Berikutnya</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right w-[120px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee, index) => {
            const { nextKGBDate, daysUntilNextKGB, monthsUntilNextKGB, yearsUntilNextKGB } = calculateKGB(employee.lastKGBDate);
            const isReminder = daysUntilNextKGB <= 30 && daysUntilNextKGB >= 0;
            const isSelected = selectedIds.includes(employee.id);

            return (
              <TableRow key={employee.id} data-state={isSelected ? "selected" : ""} className={isReminder ? 'bg-destructive/10' : ''}>
                <TableCell>
                  <Checkbox 
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectRow(employee.id, !!checked)}
                    aria-label={`Pilih ${employee.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>{employee.nip}</TableCell>
                <TableCell>{format(new Date(employee.lastKGBDate), 'dd MMM yyyy')}</TableCell>
                <TableCell>{format(nextKGBDate, 'dd MMM yyyy')}</TableCell>
                <TableCell>
                  {isReminder ? (
                    <Badge variant="destructive">Pengingat</Badge>
                  ) : (
                    <Badge variant="secondary">
                       {getStatusText(daysUntilNextKGB, monthsUntilNextKGB, yearsUntilNextKGB)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <AddEmployeeDialog employee={employee} onSave={onUpdateEmployee}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </AddEmployeeDialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Hapus</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak bisa dibatalkan. Ini akan menghapus data pegawai <span className="font-bold">{employee.name}</span> secara permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(employee.id, employee.name)} className="bg-destructive hover:bg-destructive/90">
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
