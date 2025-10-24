'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calculateKGB } from '@/lib/utils';
import { format } from 'date-fns';
import { Edit, Trash2, Users } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { AddEmployeeDialog } from './add-employee-dialog';
import { toast } from '@/hooks/use-toast';

interface EmployeeTableProps {
  employees: Employee[];
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

export function EmployeeTable({ employees, onUpdateEmployee, onDeleteEmployee }: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4 border-2 border-dashed rounded-lg bg-card/50">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="font-headline text-xl font-semibold">No Employees Yet</h3>
        <p className="text-muted-foreground mt-1">Click "Add Employee" to get started.</p>
      </div>
    );
  }

  const handleDelete = (id: string, name: string) => {
    onDeleteEmployee(id);
    toast({
      title: 'Employee Deleted',
      description: `${name} has been removed from the list.`,
      variant: 'destructive'
    });
  }

  const sortedEmployees = [...employees].sort((a, b) => {
    const { daysUntilNextKGB: daysA } = calculateKGB(a.lastKGBDate);
    const { daysUntilNextKGB: daysB } = calculateKGB(b.lastKGBDate);
    return daysA - daysB;
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Name</TableHead>
            <TableHead>NIP</TableHead>
            <TableHead>Last KGB</TableHead>
            <TableHead>Next KGB</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEmployees.map((employee) => {
            const { nextKGBDate, daysUntilNextKGB } = calculateKGB(employee.lastKGBDate);
            const isReminder = daysUntilNextKGB <= 30 && daysUntilNextKGB >= 0;

            return (
              <TableRow key={employee.id} className={isReminder ? 'bg-destructive/10' : ''}>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.nip}</TableCell>
                <TableCell>{format(new Date(employee.lastKGBDate), 'dd MMM yyyy')}</TableCell>
                <TableCell>{format(nextKGBDate, 'dd MMM yyyy')}</TableCell>
                <TableCell>
                  {isReminder ? (
                    <Badge variant="destructive">Reminder</Badge>
                  ) : (
                    <Badge variant="secondary">
                      {daysUntilNextKGB > 0 ? `${daysUntilNextKGB} days left` : 'Past due'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <AddEmployeeDialog employee={employee} onSave={onUpdateEmployee}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </AddEmployeeDialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the employee record for <span className="font-bold">{employee.name}</span>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(employee.id, employee.name)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
