'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Employee } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { addYears } from 'date-fns';

const STORAGE_KEY = 'kgb-assistant-employees';

export function useEmployeeData() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        setEmployees(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Gagal memuat data pegawai dari localStorage', error);
      toast({
        variant: "destructive",
        title: "Galat",
        description: "Tidak dapat memuat data. Mungkin data rusak.",
      });
    }
    setIsInitialized(true);
  }, []);

  const updateStorage = (data: Employee[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Gagal menyimpan data pegawai ke localStorage', error);
      toast({
        variant: "destructive",
        title: "Galat",
        description: "Tidak dapat menyimpan data ke penyimpanan lokal.",
      });
    }
  };

  const setInitialData = useCallback((data: Employee[]) => {
    setEmployees(data);
    updateStorage(data);
  }, []);

  const addEmployee = useCallback((employee: Omit<Employee, 'id'>) => {
    setEmployees(prev => {
      const newEmployee = { ...employee, id: crypto.randomUUID() };
      const updatedEmployees = [...prev, newEmployee];
      updateStorage(updatedEmployees);
      return updatedEmployees;
    });
  }, []);

  const updateEmployee = useCallback((updatedEmployee: Employee) => {
    setEmployees(prev => {
      const updatedEmployees = prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e);
      updateStorage(updatedEmployees);
      return updatedEmployees;
    });
  }, []);

  const deleteEmployee = useCallback((employeeId: string) => {
    setEmployees(prev => {
      const updatedEmployees = prev.filter(e => e.id !== employeeId);
      updateStorage(updatedEmployees);
      return updatedEmployees;
    });
  }, []);

  const bulkUpdateEmployees = useCallback((ids: string[], data: Partial<Omit<Employee, 'id'>>) => {
    setEmployees(prev => {
      const updatedEmployees = prev.map(e => ids.includes(e.id) ? { ...e, ...data } : e);
      updateStorage(updatedEmployees);
      return updatedEmployees;
    });
  }, []);

  const bulkDeleteEmployees = useCallback((ids: string[]) => {
    setEmployees(prev => {
      const updatedEmployees = prev.filter(e => !ids.includes(e.id));
      updateStorage(updatedEmployees);
      return updatedEmployees;
    });
  }, []);

  const importEmployees = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const newEmployees: Employee[] = JSON.parse(json);
        if (Array.isArray(newEmployees) && newEmployees.every(e => e.id && e.name && e.position && e.nip && e.lastKGBDate)) {
          setInitialData(newEmployees);
          toast({
            title: "Sukses",
            description: `Berhasil mengimpor ${newEmployees.length} data pegawai.`,
          });
        } else {
          throw new Error("Format file tidak valid.");
        }
      } catch (error) {
        console.error('Gagal mengimpor data', error);
        toast({
          variant: "destructive",
          title: "Impor Gagal",
          description: "File yang dipilih bukan file JSON data pegawai yang valid.",
        });
      }
    };
    reader.readAsText(file);
  }, [setInitialData]);

  const exportEmployees = useCallback(() => {
    if (employees.length === 0) {
      toast({
        variant: "destructive",
        title: "Ekspor Gagal",
        description: "Tidak ada data pegawai untuk diekspor.",
      });
      return;
    }
    const dataStr = JSON.stringify(employees, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `kgb-data-export-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
        title: "Sukses",
        description: "Data pegawai berhasil diekspor.",
    });
  }, [employees]);

  const exportEmployeesToXLSX = useCallback((startYear: number, endYear: number) => {
     if (employees.length === 0) {
      toast({
        variant: "destructive",
        title: "Ekspor Gagal",
        description: "Tidak ada data pegawai untuk diekspor.",
      });
      return;
    }

    const monthNames = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    const headers = ["No", "NIP", "NAMA", ...years.map(String), "JABATAN"];
    
    const data = employees.map((employee, index) => {
      const row: (string | number)[] = [index + 1, employee.nip, employee.name];
      const kgbDates: Date[] = [];
      let currentKGB = new Date(employee.lastKGBDate);

      // Find all KGB dates within the range
      while (currentKGB.getFullYear() <= endYear) {
        if(currentKGB.getFullYear() >= startYear) {
          kgbDates.push(new Date(currentKGB.getTime()));
        }
        currentKGB = addYears(currentKGB, 2);
      }
      
      // Populate year columns
      years.forEach(year => {
        const kgbInYear = kgbDates.find(d => d.getFullYear() === year);
        row.push(kgbInYear ? monthNames[kgbInYear.getMonth()] : '0');
      });

      row.push(employee.position);
      return row;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data KGB Pegawai");

    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `kgb-report-${startYear}-${endYear}-${date}.xlsx`);
    
    toast({
      title: "Sukses",
      description: `Laporan KGB untuk tahun ${startYear}-${endYear} berhasil diekspor.`,
    });

  }, [employees]);
  
  return {
    employees,
    isInitialized,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    importEmployees,
    exportEmployees,
    setInitialData,
    bulkUpdateEmployees,
    bulkDeleteEmployees,
    exportEmployeesToXLSX,
  };
}
