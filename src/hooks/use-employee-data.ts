'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Employee } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

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
        // Simple validation, can be improved with Zod
        const newEmployees: Employee[] = JSON.parse(json);
        if (Array.isArray(newEmployees) && newEmployees.every(e => e.id && e.name && e.position && e.nip && e.lastKGBDate)) {
          setEmployees(newEmployees);
          updateStorage(newEmployees);
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
  }, []);

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
  };
}
