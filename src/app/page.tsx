'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileJson, FileUp, Sparkles, PlusCircle, FileSpreadsheet } from "lucide-react";
import { useEmployeeData } from '@/hooks/use-employee-data';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

export default function WelcomePage() {
    const [step, setStep] = useState('initial');
    const { importEmployees: importJson, setInitialData } = useEmployeeData();
    const router = useRouter();
    const jsonInputRef = useRef<HTMLInputElement>(null);
    const excelInputRef = useRef<HTMLInputElement>(null);

    const handleJsonFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            importJson(file);
            router.push('/dashboard');
        }
    };
    
    const handleExcelFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

                    const employees = jsonData.map(row => ({
                        id: row.id || crypto.randomUUID(),
                        name: row.name,
                        nip: String(row.nip),
                        lastKGBDate: new Date((row.lastKGBDate - (25567 + 1)) * 86400 * 1000).toISOString(),
                    }));
                    
                    setInitialData(employees);
                    toast({ title: 'Import Successful', description: `${employees.length} employees imported from Excel.` });
                    router.push('/dashboard');

                } catch (error) {
                    toast({ variant: 'destructive', title: 'Import Failed', description: 'Could not parse the Excel file.' });
                }
            };
            reader.readAsBinaryString(file);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'new':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button onClick={() => router.push('/dashboard')} className="text-left">
                            <Card className="hover:bg-accent/50 hover:border-primary transition-all">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <PlusCircle className="w-8 h-8 text-primary" />
                                        <div>
                                            <CardTitle className="font-headline">Manual Input</CardTitle>
                                            <CardDescription>Add employee data one by one through the form.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        </button>
                        <button onClick={() => excelInputRef.current?.click()} className="text-left">
                            <Card className="hover:bg-accent/50 hover:border-primary transition-all">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <FileSpreadsheet className="w-8 h-8 text-primary" />
                                        <div>
                                            <CardTitle className="font-headline">Import from Excel</CardTitle>
                                            <CardDescription>Upload an .xlsx file to bulk import employees.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        </button>
                    </div>
                );
            case 'initial':
            default:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <button onClick={() => setStep('new')} className="text-left">
                             <Card className="hover:bg-accent/50 hover:border-primary transition-all">
                                 <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <Sparkles className="w-8 h-8 text-primary" />
                                        <div>
                                             <CardTitle className="font-headline">Create New Data</CardTitle>
                                             <CardDescription>Start from scratch by adding new employee data.</CardDescription>
                                        </div>
                                    </div>
                                 </CardHeader>
                             </Card>
                         </button>
                         <button onClick={() => jsonInputRef.current?.click()} className="text-left">
                             <Card className="hover:bg-accent/50 hover:border-primary transition-all">
                                 <CardHeader>
                                     <div className="flex items-center gap-4">
                                        <FileJson className="w-8 h-8 text-primary" />
                                        <div>
                                            <CardTitle className="font-headline">Import Existing Data</CardTitle>
                                            <CardDescription>Load employee data from a previously exported .json file.</CardDescription>
                                        </div>
                                     </div>
                                 </CardHeader>
                             </Card>
                         </button>
                    </div>
                );
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <input
                type="file"
                ref={jsonInputRef}
                onChange={handleJsonFileChange}
                accept=".json"
                className="hidden"
            />
            <input
                type="file"
                ref={excelInputRef}
                onChange={handleExcelFileChange}
                accept=".xlsx"
                className="hidden"
            />
            <div className="w-full max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="font-headline text-4xl font-bold text-primary">KGB Assistant</h1>
                    <p className="text-muted-foreground text-lg mt-2">Welcome! How would you like to start?</p>
                </div>
                {renderStep()}
                 {step !== 'initial' && (
                    <div className="mt-8 text-center">
                        <Button variant="link" onClick={() => setStep('initial')}>
                            &larr; Back
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}