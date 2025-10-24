'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const currentYear = new Date().getFullYear();

const exportSchema = z.object({
  startYear: z.coerce.number().int().min(2000, "Tahun harus setelah 2000").max(currentYear + 20, `Tahun tidak boleh lebih dari ${currentYear + 20}`),
  endYear: z.coerce.number().int().min(2000, "Tahun harus setelah 2000").max(currentYear + 20, `Tahun tidak boleh lebih dari ${currentYear + 20}`),
}).refine(data => data.endYear >= data.startYear, {
  message: "Tahun akhir harus lebih besar atau sama dengan tahun mulai.",
  path: ["endYear"],
});

type ExportFormValues = z.infer<typeof exportSchema>;

interface ExportExcelDialogProps {
  children: React.ReactNode;
  onExport: (startYear: number, endYear: number) => void;
}

export function ExportExcelDialog({ children, onExport }: ExportExcelDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<ExportFormValues>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      startYear: currentYear,
      endYear: currentYear + 5,
    },
  });

  function onSubmit(data: ExportFormValues) {
    onExport(data.startYear, data.endYear);
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Ekspor ke XLSX</DialogTitle>
          <DialogDescription>
            Pilih rentang tahun untuk menghasilkan laporan KGB pegawai.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="startYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tahun Mulai</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder={String(currentYear)} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="endYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tahun Akhir</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder={String(currentYear + 5)} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Hasilkan Laporan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
