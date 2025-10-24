'use client';

import React, { useState, useMemo } from 'react';
import { useEmployeeData } from '@/hooks/use-employee-data';
import { EmployeeTable } from './components/employee-table';
import { DataActions } from './components/data-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateKGB } from '@/lib/utils';
import type { Employee } from '@/lib/types';
import { Search } from 'lucide-react';

type SortOption = 'closest' | 'furthest';

export default function DashboardPage() {
  const { 
    employees, 
    isInitialized, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    exportEmployees,
  } = useEmployeeData();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('closest');

  const filteredAndSortedEmployees = useMemo(() => {
    const filtered = employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.nip.includes(searchTerm)
    );

    return [...filtered].sort((a, b) => {
      const { daysUntilNextKGB: daysA } = calculateKGB(a.lastKGBDate);
      const { daysUntilNextKGB: daysB } = calculateKGB(b.lastKGBDate);
      if (sortOption === 'closest') {
        return daysA - daysB;
      } else {
        return daysB - daysA;
      }
    });
  }, [employees, searchTerm, sortOption]);

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
        onExport={exportEmployees}
      />
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <CardTitle className="font-headline">Employee List</CardTitle>
                    <CardDescription>
                      {searchTerm
                        ? `Showing ${filteredAndSortedEmployees.length} of ${employees.length} employees.`
                        : `Total ${employees.length} employees.`
                      }
                    </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                          placeholder="Search by name, position, or NIP..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full sm:w-64 pl-10"
                      />
                    </div>
                    <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="closest">Next KGB (Closest)</SelectItem>
                            <SelectItem value="furthest">Next KGB (Furthest)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <EmployeeTable 
            employees={filteredAndSortedEmployees}
            onUpdateEmployee={updateEmployee}
            onDeleteEmployee={deleteEmployee}
          />
        </CardContent>
      </Card>
    </div>
  );
}
