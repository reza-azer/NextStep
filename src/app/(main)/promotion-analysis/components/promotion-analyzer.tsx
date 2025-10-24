'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getPromotionSuggestions } from '@/app/actions';
import type { SuggestPromotionCandidatesInput, SuggestPromotionCandidatesOutput } from '@/ai/flows/promotion-candidate-suggestions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Bot, Loader2, Sparkles, Trash2, UserPlus } from 'lucide-react';

type EmployeeForAnalysis = SuggestPromotionCandidatesInput['employeeData'][0];

const analysisEmployeeSchema = z.object({
  name: z.string().min(2, "Name is required."),
  yearsOfService: z.coerce.number().min(0, "Years of service must be a non-negative number."),
  salaryIncreaseFrequency: z.coerce.number().min(0, "Frequency must be a non-negative number."),
  otherRelevantCriteria: z.string().optional(),
});

export function PromotionAnalyzer() {
  const [employees, setEmployees] = useState<EmployeeForAnalysis[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestPromotionCandidatesOutput | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(analysisEmployeeSchema),
    defaultValues: {
      name: '',
      yearsOfService: 0,
      salaryIncreaseFrequency: 0,
      otherRelevantCriteria: '',
    },
  });

  const addEmployeeForAnalysis = (data: z.infer<typeof analysisEmployeeSchema>) => {
    setEmployees(prev => [...prev, data]);
    form.reset();
  };
  
  const removeEmployee = (index: number) => {
    setEmployees(prev => prev.filter((_, i) => i !== index));
  };

  const handleGetSuggestions = () => {
    if (employees.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "Please add at least one employee to analyze.",
      });
      return;
    }
    startTransition(async () => {
      setSuggestions(null);
      const result = await getPromotionSuggestions({
        employeeData: employees,
        numberOfSuggestions: 3,
      });
      if (result.success) {
        setSuggestions(result.data);
      } else {
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: result.error,
        });
      }
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2"><UserPlus /> Add Employee for Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(addEmployeeForAnalysis)} className="space-y-4">
                <FormField name="name" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} placeholder="e.g., Jane Smith" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="yearsOfService" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Years of Service</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="salaryIncreaseFrequency" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Salary Increases (last 3 years)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="otherRelevantCriteria" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Other Criteria (Optional)</FormLabel><FormControl><Textarea {...field} placeholder="e.g., Led successful project, excellent peer reviews..." /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit">Add to List</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <h3 className="font-headline text-lg mb-4">Employees to Analyze ({employees.length})</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Y.O.S</TableHead>
                <TableHead>Increases</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No employees added yet.</TableCell></TableRow>
              ) : (
                employees.map((emp, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>{emp.yearsOfService}</TableCell>
                    <TableCell>{emp.salaryIncreaseFrequency}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => removeEmployee(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div>
        <Button onClick={handleGetSuggestions} disabled={isPending || employees.length === 0} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
          Get AI Suggestions
        </Button>

        <div className="mt-6">
          {!suggestions && !isPending && (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4 border-2 border-dashed rounded-lg bg-card/50">
              <Bot className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="font-headline text-xl font-semibold">Awaiting Analysis</h3>
              <p className="text-muted-foreground mt-1 max-w-xs mx-auto">Add employees and click the button to see AI-powered promotion suggestions.</p>
            </div>
          )}
          {isPending && (
             <div className="flex flex-col items-center justify-center text-center py-16 px-4 border-2 border-dashed rounded-lg bg-card/50">
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
              <h3 className="font-headline text-xl font-semibold">Analyzing...</h3>
              <p className="text-muted-foreground mt-1">Our AI is crunching the numbers. This may take a moment.</p>
            </div>
          )}
          {suggestions && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2"><Sparkles className="text-primary"/>Top Promotion Candidates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suggestions.candidates.map((candidate, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-background">
                      <p className="font-bold text-primary font-headline text-base">{index + 1}. {candidate.name}</p>
                      <p className="text-sm text-muted-foreground mt-1 italic">"{candidate.reason}"</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
