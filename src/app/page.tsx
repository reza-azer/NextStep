'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileJson, Sparkles, PlusCircle, FileSpreadsheet } from "lucide-react";
import { useEmployeeData } from '@/hooks/use-employee-data';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import type { Employee } from '@/lib/types';

const nameVariations = ['nama'];
const positionVariations = ['jabatan'];
const nipVariations = ['nip'];

const monthMap: { [key: string]: number } = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mei': 4, 'jun': 5,
    'jul': 6, 'agu': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'des': 11
};

function findHeader(headers: (string | null | undefined)[], variations: string[]): string | undefined {
    return headers.find(header => {
        if (typeof header === 'string') {
            return variations.includes(header.toLowerCase().trim());
        }
        return false;
    }) as string | undefined;
}

function parseDate(dateValue: any): string | null {
    if (!dateValue) return null;

    if (typeof dateValue === 'number' && dateValue > 1) {
        const date = XLSX.SSF.parse_date_code(dateValue);
        if (date) {
            return new Date(date.y, date.m - 1, date.d, date.H, date.M, date.S).toISOString();
        }
    }
    
    const d = new Date(dateValue);
    if (!isNaN(d.getTime())) {
        return d.toISOString();
    }

    return null;
}

export default function WelcomePage() {
    const [step, setStep] = useState('initial');
    const { importEmployees: importJson, setInitialData } = useEmployeeData();
    const router = useRouter();
    const jsonInputRef = useRef<HTMLInputElement>(null);
    const spreadsheetInputRef = useRef<HTMLInputElement>(null);

    const handleJsonFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            importJson(file);
            router.push('/dashboard');
        }
    };
    
    const handleSpreadsheetFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                let jsonData: any[];

                if (file.name.endsWith('.csv')) {
                    const text = data as string;
                    const lines = text.split(/\r?\n/);
                    jsonData = lines.map(line => line.split(';'));
                } else {
                    const workbook = XLSX.read(data, { type: 'binary', cellDates: true, dateNF: 'yyyy-mm-dd' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                }


                if(jsonData.length < 2) {
                    throw new Error("Spreadsheet is empty or has no data rows.");
                }
                
                const headers: (string | null | undefined)[] = jsonData[0];
                const dataRows = jsonData.slice(1);

                const nameHeader = findHeader(headers, nameVariations);
                const positionHeader = findHeader(headers, positionVariations);
                const nipHeader = findHeader(headers, nipVariations);
                
                if (!nameHeader || !nipHeader || !positionHeader) {
                    let missingColumns = [];
                    if (!nameHeader) missingColumns.push("NAMA");
                    if (!positionHeader) missingColumns.push("JABATAN");
                    if (!nipHeader) missingColumns.push("NIP");
                    throw new Error(`Column mapping failed. Missing required columns: ${missingColumns.join(', ')}. Please check your file headers.`);
                }
                
                const nameIndex = headers.indexOf(nameHeader);
                const positionIndex = headers.indexOf(positionHeader);
                const nipIndex = headers.indexOf(nipHeader);

                const yearColumns = headers.map((h, i) => ({ header: h, index: i }))
                    .filter(col => typeof col.header === 'string' && /^\d{4}$/.test(col.header.trim()))
                    .sort((a, b) => parseInt(a.header!.trim()) - parseInt(b.header!.trim()));

                if (yearColumns.length === 0) {
                     throw new Error("No year columns (e.g., 2023, 2024) found in the header.");
                }

                const employees: Employee[] = dataRows.map((row: any[]) => {
                    let lastKGBDate: string | null = null;
                    // Iterate backwards through year columns to find the latest valid month
                    for (let i = yearColumns.length - 1; i >= 0; i--) {
                        const yearCol = yearColumns[i];
                        const year = parseInt(yearCol.header!.trim());
                        const monthVal = row[yearCol.index];
                        
                        if (typeof monthVal === 'string' && monthVal.trim().length >= 3) {
                            const monthStr = monthVal.trim().toLowerCase().substring(0, 3);
                            if (monthStr in monthMap) {
                                const monthIndex = monthMap[monthStr];
                                lastKGBDate = new Date(year, monthIndex, 1).toISOString();
                                break; // Found the latest one, so we can stop
                            }
                        }
                    }

                    if (!lastKGBDate) {
                        return null;
                    }

                    return {
                        id: crypto.randomUUID(),
                        name: row[nameIndex],
                        position: row[positionIndex],
                        nip: String(row[nipIndex] || '').replace(/'/g, ''), // Clean NIP
                        lastKGBDate: lastKGBDate,
                    };
                }).filter((e): e is Employee => e !== null);
                
                if (employees.length === 0) {
                     throw new Error("No valid employee data could be parsed. Check year columns and month values.");
                }

                setInitialData(employees);
                toast({ title: 'Import Successful', description: `${employees.length} employees imported from ${file.name}.` });
                router.push('/dashboard');

            } catch (error: any) {
                console.error(error);
                toast({ variant: 'destructive', title: 'Import Failed', description: error.message || 'Could not parse the spreadsheet file.' });
            }
        };
        
        if (file.name.endsWith('.csv')) {
             reader.readAsText(file); // For CSV, read as text
        } else {
             reader.readAsBinaryString(file); // For XLSX
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
                        <button onClick={() => spreadsheetInputRef.current?.click()} className="text-left">
                            <Card className="hover:bg-accent/50 hover:border-primary transition-all">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <FileSpreadsheet className="w-8 h-8 text-primary" />
                                        <div>
                                            <CardTitle className="font-headline">Import from Excel/CSV</CardTitle>
                                            <CardDescription>Upload an .xlsx or .csv file to bulk import.</CardDescription>
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
                ref={spreadsheetInputRef}
                onChange={handleSpreadsheetFileChange}
                accept=".xlsx, .csv"
                className="hidden"
            />
            <div className="w-full max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="font-headline text-4xl font-bold text-primary">NextStep</h1>
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
