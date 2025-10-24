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

const nameVariations = ['name', 'nama', 'nama lengkap'];
const positionVariations = ['position', 'jabatan'];
const nipVariations = ['nip', 'employee id', 'nomor induk pegawai'];
const dateVariations = ['lastkgbdate', 'last kgb date', 'tanggal kgb terakhir'];

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

    // Handle Excel date serial number
    if (typeof dateValue === 'number' && dateValue > 1) {
        // Excel serial date starts from 1 for 1900-01-01. XLSX library handles this.
        const date = XLSX.SSF.parse_date_code(dateValue);
        if (date) {
            return new Date(date.y, date.m - 1, date.d, date.H, date.M, date.S).toISOString();
        }
    }
    
    // Handle date string
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
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {header: 1});

                if(jsonData.length < 2) {
                    throw new Error("Spreadsheet is empty or has no data rows.");
                }
                
                const headers: (string | null | undefined)[] = jsonData[0];
                const dataRows = jsonData.slice(1);

                const nameHeader = findHeader(headers, nameVariations);
                const positionHeader = findHeader(headers, positionVariations);
                const nipHeader = findHeader(headers, nipVariations);
                const dateHeader = findHeader(headers, dateVariations);

                if (!nameHeader || !nipHeader || !dateHeader || !positionHeader) {
                    let missingColumns = [];
                    if (!nameHeader) missingColumns.push("Nama");
                    if (!positionHeader) missingColumns.push("Jabatan");
                    if (!nipHeader) missingColumns.push("NIP");
                    if (!dateHeader) missingColumns.push("Tanggal KGB Terakhir");
                    throw new Error(`Column mapping failed. Missing required columns: ${missingColumns.join(', ')}. Please check your file headers.`);
                }
                
                const nameIndex = headers.indexOf(nameHeader);
                const positionIndex = headers.indexOf(positionHeader);
                const nipIndex = headers.indexOf(nipHeader);
                const dateIndex = headers.indexOf(dateHeader);

                const employees: Employee[] = dataRows.map((row: any[]) => {
                    const lastKGBDate = parseDate(row[dateIndex]);
                    if (!lastKGBDate) {
                        return null;
                    }
                    return {
                        id: crypto.randomUUID(),
                        name: row[nameIndex],
                        position: row[positionIndex],
                        nip: String(row[nipIndex]),
                        lastKGBDate: lastKGBDate,
                    };
                }).filter((e): e is Employee => e !== null);
                
                if (employees.length === 0) {
                     throw new Error("No valid employee data could be parsed. Check date formats.");
                }

                setInitialData(employees);
                toast({ title: 'Import Successful', description: `${employees.length} employees imported from ${file.name}.` });
                router.push('/dashboard');

            } catch (error: any) {
                console.error(error);
                toast({ variant: 'destructive', title: 'Import Failed', description: error.message || 'Could not parse the spreadsheet file.' });
            }
        };
        reader.readAsBinaryString(file);
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
