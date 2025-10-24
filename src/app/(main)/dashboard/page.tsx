'use client';

import { useEmployeeData } from '@/hooks/use-employee-data';
import { EmployeeTable } from './components/employee-table';
import { DataActions } from './components/data-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { 
    employees, 
    isInitialized, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    importEmployees,
    exportEmployees,
  } = useEmployeeData();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && employees.length === 0) {
        // This is a bit of a hack to check if we came from the welcome page flow.
        // A more robust solution might use query params or state management.
        const navigationEntries = performance.getEntriesByType("navigation");
        const fromWelcome = navigationEntries.length > 0 && (navigationEntries[0] as PerformanceNavigationTiming).type !== 'reload';
        
        if (!fromWelcome) {
             router.replace('/');
        }
    }
  }, [isInitialized, employees, router]);


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
        onImport={importEmployees}
        onExport={exportEmployees}
      />
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Employee List</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeTable 
            employees={employees}
            onUpdateEmployee={updateEmployee}
            onDeleteEmployee={deleteEmployee}
          />
        </CardContent>
      </Card>
    </div>
  );
}
