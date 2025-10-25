'use client';

import React from 'react';
import { useEmployeeData } from '@/hooks/use-employee-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateKGB } from '@/lib/utils';
import { ReviewTable } from './components/review-table';
import { BellRing } from 'lucide-react';

export default function ReviewsPage() {
  const { 
    employees, 
    isInitialized, 
    updateEmployee,
  } = useEmployeeData();

  const employeesToReview = React.useMemo(() => {
    return employees
      .filter(e => {
        const { daysUntilNextKGB } = calculateKGB(e.lastKGBDate);
        return daysUntilNextKGB <= 90 && daysUntilNextKGB >= 0;
      })
      .sort((a, b) => {
        const { daysUntilNextKGB: daysA } = calculateKGB(a.lastKGBDate);
        const { daysUntilNextKGB: daysB } = calculateKGB(b.lastKGBDate);
        return daysA - daysB;
      });
  }, [employees]);


  if (!isInitialized) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
             <Skeleton className="h-8 w-48" />
             <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (employeesToReview.length === 0) {
    return (
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Tinjauan KGB</CardTitle>
          <CardDescription>Daftar pegawai yang memerlukan tinjauan kenaikan gaji berkala.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 border-2 border-dashed rounded-lg bg-card/50">
            <BellRing className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-headline text-xl font-semibold">Semua Sudah Beres!</h3>
            <p className="text-muted-foreground mt-1">Tidak ada pegawai yang memerlukan tinjauan KGB saat ini.</p>
          </div>
        </CardContent>
       </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Tinjauan KGB</CardTitle>
          <CardDescription>
            {`Menampilkan ${employeesToReview.length} pegawai yang KGB-nya akan jatuh tempo dalam 90 hari ke depan.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewTable
            employees={employeesToReview}
            onUpdateEmployee={updateEmployee}
          />
        </CardContent>
      </Card>
    </div>
  );
}
