'use client';

import React, { useState, useMemo } from 'react';
import { useEmployeeData } from '@/hooks/use-employee-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateKGB } from '@/lib/utils';
import { ReviewTable } from './components/review-table';
import { BellRing } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { KGBStatus } from '@/lib/types';

const kgbStatuses: (KGBStatus | 'all')[] = [
  'all',
  'Belum Diajukan',
  'Sudah Diajukan',
  'Proses',
  'Menunggu Konfirmasi',
  'Selesai',
];

export default function ReviewsPage() {
  const { 
    employees, 
    isInitialized, 
    updateEmployee,
  } = useEmployeeData();
  
  const [statusFilter, setStatusFilter] = useState<KGBStatus | 'all'>('all');
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);

  const employeesToReview = React.useMemo(() => {
    let filtered = employees
      .filter(e => {
        const { daysUntilNextKGB } = calculateKGB(e.lastKGBDate);
        return daysUntilNextKGB <= 90 && daysUntilNextKGB >= 0;
      });

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.kgbStatus === statusFilter);
    }
    
    if (hideCompleted) {
      filtered = filtered.filter(e => e.kgbStatus !== 'Selesai');
    }

    return filtered.sort((a, b) => {
      const { daysUntilNextKGB: daysA } = calculateKGB(a.lastKGBDate);
      const { daysUntilNextKGB: daysB } = calculateKGB(b.lastKGBDate);
      return daysA - daysB;
    });
  }, [employees, statusFilter, hideCompleted]);

  const originalCount = React.useMemo(() => {
     return employees.filter(e => {
        const { daysUntilNextKGB } = calculateKGB(e.lastKGBDate);
        return daysUntilNextKGB <= 90 && daysUntilNextKGB >= 0;
      }).length;
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
  
  if (originalCount === 0) {
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
            <p className="text-muted-foreground mt-1">Tidak ada pegawai yang memerlukan tinjauan KGB dalam 90 hari ke depan.</p>
          </div>
        </CardContent>
       </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
              <div>
                <CardTitle className="font-headline">Tinjauan KGB</CardTitle>
                <CardDescription>
                  {statusFilter !== 'all' || hideCompleted
                    ? `Menampilkan ${employeesToReview.length} dari ${originalCount} pegawai yang perlu ditinjau.`
                    : `Total ${originalCount} pegawai akan jatuh tempo KGB dalam 90 hari ke depan.`
                  }
                </CardDescription>
              </div>
               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as KGBStatus | 'all')}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Filter status" />
                      </SelectTrigger>
                      <SelectContent>
                         {kgbStatuses.map(status => (
                              <SelectItem key={status} value={status}>
                                  {status === 'all' ? 'Semua Status' : status}
                              </SelectItem>
                         ))}
                      </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2 pt-2 sm:pt-0">
                      <Checkbox id="hide-completed-reviews" checked={hideCompleted} onCheckedChange={(checked) => setHideCompleted(!!checked)} />
                      <Label htmlFor="hide-completed-reviews" className="text-sm font-medium whitespace-nowrap">Sembunyikan Selesai</Label>
                  </div>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          {employeesToReview.length > 0 ? (
            <ReviewTable
              employees={employeesToReview}
              onUpdateEmployee={updateEmployee}
            />
          ) : (
             <div className="flex flex-col items-center justify-center text-center py-16 px-4 border-2 border-dashed rounded-lg bg-card/50">
              <BellRing className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="font-headline text-xl font-semibold">Tidak Ada Hasil</h3>
              <p className="text-muted-foreground mt-1">Tidak ada pegawai yang cocok dengan filter yang Anda pilih.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
