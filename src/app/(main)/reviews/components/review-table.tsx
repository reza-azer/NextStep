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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { calculateKGB } from '@/lib/utils';
import { format } from 'date-fns';
import type { Employee, KGBStatus } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


interface ReviewTableProps {
  employees: Employee[];
  onUpdateEmployee: (employee: Employee) => void;
}

const kgbStatuses: KGBStatus[] = [
  'Belum Diajukan',
  'Sudah Diajukan',
  'Proses',
  'Menunggu Konfirmasi',
  'Selesai',
];

const statusColors: Record<KGBStatus, string> = {
  'Belum Diajukan': 'bg-stone-500',
  'Sudah Diajukan': 'bg-blue-500',
  'Proses': 'bg-yellow-500',
  'Menunggu Konfirmasi': 'bg-orange-500',
  'Selesai': 'bg-green-500'
}


export function ReviewTable({ employees, onUpdateEmployee }: ReviewTableProps) {

  const handleStatusChange = (employee: Employee, newStatus: KGBStatus) => {
    onUpdateEmployee({ ...employee, kgbStatus: newStatus });
    toast({
      title: 'Status Diperbarui',
      description: `Status KGB untuk ${employee.name} telah diubah menjadi "${newStatus}".`,
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">No.</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>NIP</TableHead>
            <TableHead>KGB Berikutnya</TableHead>
            <TableHead>Sisa Waktu</TableHead>
            <TableHead className="w-[200px]">Status Pengajuan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee, index) => {
            const { nextKGBDate, daysUntilNextKGB } = calculateKGB(employee.lastKGBDate);

            return (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.nip}</TableCell>
                <TableCell>{format(nextKGBDate, 'dd MMM yyyy')}</TableCell>
                <TableCell>
                  <Badge variant="destructive">{`${daysUntilNextKGB} hari lagi`}</Badge>
                </TableCell>
                <TableCell>
                   <Select 
                      value={employee.kgbStatus} 
                      onValueChange={(value) => handleStatusChange(employee, value as KGBStatus)}
                    >
                    <SelectTrigger className={cn("w-full", statusColors[employee.kgbStatus], 'text-white font-bold')}>
                      <SelectValue placeholder="Ubah status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {kgbStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                             <span className={cn("h-2 w-2 rounded-full", statusColors[status])} />
                             {status}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
