'use client';

import React, { useState, useEffect } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Employee } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  position: z.string().min(2, "Position must be at least 2 characters."),
  nip: z.string().min(5, "NIP must be at least 5 characters."),
  lastKGBDate: z.date({
    required_error: "Last KGB date is required.",
  }),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface AddEmployeeDialogProps {
  children: React.ReactNode;
  employee?: Employee;
  onSave: (data: Omit<Employee, 'id'> | Employee) => void;
}

export function AddEmployeeDialog({ children, employee, onSave }: AddEmployeeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isEditMode = !!employee;

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: isEditMode
      ? { name: employee.name, position: employee.position, nip: employee.nip, lastKGBDate: new Date(employee.lastKGBDate) }
      : { name: '', position: '', nip: '' },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(isEditMode
        ? { name: employee.name, position: employee.position, nip: employee.nip, lastKGBDate: new Date(employee.lastKGBDate) }
        : { name: '', position: '', nip: '', lastKGBDate: new Date() });
    }
  }, [isOpen, form, employee, isEditMode]);

  function onSubmit(data: EmployeeFormValues) {
    const dataToSave = {
      ...data,
      lastKGBDate: data.lastKGBDate.toISOString(),
    };
    if (isEditMode) {
      onSave({ ...employee, ...dataToSave });
       toast({ title: 'Employee Updated', description: `${data.name}'s details have been saved.` });
    } else {
      onSave(dataToSave);
      toast({ title: 'Employee Added', description: `${data.name} has been added to the list.` });
    }
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditMode ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the employee's details below." : "Enter the details for the new employee."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jabatan / Position</FormLabel>
                  <FormControl>
                    <Input placeholder="Staff" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIP / Employee ID</FormLabel>
                  <FormControl>
                    <Input placeholder="199001012020121001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastKGBDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Last KGB Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
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
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
