'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useEmployeeData } from '@/hooks/use-employee-data';
import { EmployeeTable } from './components/employee-table';
import { DataActions } from './components/data-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { calculateKGB } from '@/lib/utils';
import { Search } from 'lucide-react';
import { BulkActions } from './components/bulk-actions';

type SortOption = 'closest' | 'furthest' | 'name-asc' | 'name-desc';
export type StatusUnit = 'days' | 'months' | 'years';


export default function DashboardPage() {
  const { 
    employees, 
    isInitialized, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    bulkUpdateEmployees,
    bulkDeleteEmployees,
    exportEmployees,
    exportEmployeesToXLSX
  } = useEmployeeData();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('closest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusUnit, setStatusUnit] = useState<StatusUnit>('days');


  const filteredAndSortedEmployees = useMemo(() => {
    const filtered = employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.nip.includes(searchTerm)
    );

    const sorted = [...filtered].sort((a, b) => {
      if (sortOption === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortOption === 'name-desc') {
        return b.name.localeCompare(a.name);
      }
      const { daysUntilNextKGB: daysA } = calculateKGB(a.lastKGBDate);
      const { daysUntilNextKGB: daysB } = calculateKGB(b.lastKGBDate);
      if (sortOption === 'closest') {
        return daysA - daysB;
      }
      // 'furthest'
      return daysB - daysA;
    });
    return sorted;
  }, [employees, searchTerm, sortOption]);
  
  const handleSelectionChange = useCallback((ids: string[]) => {
    const currentIds = new Set(filteredAndSortedEmployees.map(e => e.id));
    const newSelectedIds = ids.filter(id => currentIds.has(id));
    setSelectedIds(newSelectedIds);
  }, [filteredAndSortedEmployees]);

  // When search term changes, reset selection
  React.useEffect(() => {
    setSelectedIds([]);
  }, [searchTerm]);


  if (!isInitialized) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-2">
           <Skeleton className="h-10 w-40" />
           <div className="flex gap-2 ml-auto">
             <Skeleton className="h-10 w-32" />
             <Skeleton className="h-10 w-32" />
           </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <DataActions
        onAddEmployee={addEmployee}
        onExportJson={exportEmployees}
        onExportXlsx={exportEmployeesToXLSX}
        selectedIds={selectedIds}
      >
        <BulkActions 
          selectedIds={selectedIds}
          selectedCount={selectedIds.length}
          onBulkUpdate={bulkUpdateEmployees}
          onBulkDelete={() => {
            bulkDeleteEmployees(selectedIds);
            setSelectedIds([]);
          }}
          onClearSelection={() => setSelectedIds([])}
        />
      </DataActions>
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <CardTitle className="font-headline">Daftar Pegawai</CardTitle>
                    <CardDescription>
                      {searchTerm || selectedIds.length > 0
                        ? `Menampilkan ${filteredAndSortedEmployees.length} dari ${employees.length} pegawai.`
                        : `Total ${employees.length} pegawai.`
                      }
                    </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                          placeholder="Cari nama, jabatan, atau NIP..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full sm:w-64 pl-10"
                      />
                    </div>
                    <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                        <SelectTrigger className="w-full sm:w-[220px]">
                            <SelectValue placeholder="Urutkan berdasarkan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="closest">KGB Berikutnya (Terdekat)</SelectItem>
                            <SelectItem value="furthest">KGB Berikutnya (Terlama)</SelectItem>
                            <SelectItem value="name-asc">Nama (A-Z)</SelectItem>
                            <SelectItem value="name-desc">Nama (Z-A)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tampilan Status:</span>
                 <ToggleGroup 
                    type="single" 
                    value={statusUnit} 
                    onValueChange={(value) => {
                        if (value) setStatusUnit(value as StatusUnit)
                    }}
                    size="sm"
                >
                    <ToggleGroupItem value="days">Hari</ToggleGroupItem>
                    <ToggleGroupItem value="months">Bulan</ToggleGroupItem>
                    <ToggleGroupItem value="years">Tahun</ToggleGroupItem>
                </ToggleGroup>
            </div>
        </CardHeader>
        <CardContent>
          <EmployeeTable 
            employees={filteredAndSortedEmployees}
            onUpdateEmployee={updateEmployee}
            onDeleteEmployee={deleteEmployee}
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
            statusUnit={statusUnit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
