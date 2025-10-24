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
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Edit, Trash2, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import type { Employee } from '@/lib/types';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

interface BulkActionsProps {
  selectedIds: string[];
  selectedCount: number;
  onBulkUpdate: (ids: string[], data: Partial<Omit<Employee, 'id'>>) => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

const positionSchema = z.object({
  position: z.string().min(2, "Jabatan harus memiliki setidaknya 2 karakter."),
});

const dateSchema = z.object({
  lastKGBDate: z.date({ required_error: "Tanggal KGB terakhir wajib diisi." }),
});

export function BulkActions({ 
  selectedIds,
  selectedCount, 
  onBulkUpdate, 
  onBulkDelete,
  onClearSelection 
}: BulkActionsProps) {
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);

  const positionForm = useForm<{ position: string }>({
    resolver: zodResolver(positionSchema),
    defaultValues: { position: '' },
  });

  const dateForm = useForm<{ lastKGBDate: Date }>({
    resolver: zodResolver(dateSchema),
  });
  
  const handlePositionSubmit = (data: { position: string }) => {
    onBulkUpdate(selectedIds, { position: data.position });
    toast({ title: 'Pembaruan Massal Berhasil', description: `Jabatan diperbarui untuk ${selectedCount} pegawai.` });
    setPositionDialogOpen(false);
    onClearSelection();
  };

  const handleDateSubmit = (data: { lastKGBDate: Date }) => {
    onBulkUpdate(selectedIds, { lastKGBDate: data.lastKGBDate.toISOString() });
    toast({ title: 'Pembaruan Massal Berhasil', description: `Tanggal KGB terakhir diperbarui untuk ${selectedCount} pegawai.` });
    setDateDialogOpen(false);
    onClearSelection();
  };
  
  const handleDelete = () => {
    onBulkDelete();
    toast({ title: 'Penghapusan Massal Berhasil', description: `${selectedCount} pegawai telah dihapus.`, variant: 'destructive'});
    onClearSelection();
  }

  return (
    <div className="flex items-center gap-2 border border-dashed p-2 rounded-lg">
       <span className="text-sm font-medium pl-2">{selectedCount} dipilih</span>
       
        <Dialog open={positionDialogOpen} onOpenChange={setPositionDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" /> Edit Jabatan
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Jabatan Massal</DialogTitle>
                    <DialogDescription>Perbarui jabatan untuk {selectedCount} pegawai yang dipilih.</DialogDescription>
                </DialogHeader>
                <Form {...positionForm}>
                    <form onSubmit={positionForm.handleSubmit(handlePositionSubmit)} className="space-y-4 py-4">
                         <FormField
                            control={positionForm.control}
                            name="position"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jabatan Baru</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Staff" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <HoverBorderGradient as="button" type="submit" containerClassName="rounded-md w-full sm:w-auto" className="bg-background text-foreground w-full sm:w-auto">
                                <span>Perbarui Jabatan</span>
                            </HoverBorderGradient>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        
        <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" /> Edit KGB Terakhir
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Tanggal KGB Terakhir Massal</DialogTitle>
                    <DialogDescription>Perbarui tanggal KGB terakhir untuk {selectedCount} pegawai yang dipilih.</DialogDescription>
                </DialogHeader>
                <Form {...dateForm}>
                    <form onSubmit={dateForm.handleSubmit(handleDateSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={dateForm.control}
                            name="lastKGBDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Tanggal KGB Terakhir Baru</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                        >
                                        {field.value ? format(field.value, "PPP") : (<span>Pilih tanggal</span>)}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        captionLayout="dropdown-buttons"
                                        fromYear={new Date().getFullYear() - 10}
                                        toYear={new Date().getFullYear() + 10}
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                             <HoverBorderGradient as="button" type="submit" containerClassName="rounded-md w-full sm:w-auto" className="bg-background text-foreground w-full sm:w-auto">
                                <span>Perbarui Tanggal</span>
                            </HoverBorderGradient>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" /> Hapus Semua
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Ini akan menghapus secara permanen {selectedCount} data pegawai yang dipilih.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        Hapus
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Button variant="ghost" size="icon" onClick={onClearSelection} className="ml-auto">
            <X className="h-4 w-4" />
            <span className="sr-only">Hapus pilihan</span>
        </Button>
    </div>
  );
}
