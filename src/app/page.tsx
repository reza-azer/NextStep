'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileJson, Sparkles, PlusCircle, FileSpreadsheet, Newspaper, BarChart, FileUp, Wrench } from "lucide-react";
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
            const trimmedHeader = header.trim().toLowerCase();
            return variations.some(variation => trimmedHeader.includes(variation));
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
    const [step, setStep] = useState('main'); // main -> kgb_start -> kgb_new
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
                const workbook = XLSX.read(data, { type: 'binary', cellDates: true, dateNF: 'yyyy-mm-dd' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, {header: 1});

                if(jsonData.length < 2) {
                    throw new Error("Spreadsheet kosong atau tidak memiliki baris data.");
                }
                
                let headers: (string | null | undefined)[] = jsonData[0];
                if (file.name.endsWith('.csv')) {
                    // For CSV, split the first row by semicolon if it's a single string
                    if (typeof headers[0] === 'string' && headers[0].includes(';')) {
                        headers = headers[0].split(';');
                    }
                }
                const dataRows = jsonData.slice(1).map(row => {
                     if (file.name.endsWith('.csv')) {
                        if (typeof row[0] === 'string' && row[0].includes(';')) {
                           return row[0].split(';');
                        }
                     }
                     return row;
                });


                const nameHeader = findHeader(headers, nameVariations);
                const positionHeader = findHeader(headers, positionVariations);
                const nipHeader = findHeader(headers, nipVariations);
                
                if (!nameHeader || !nipHeader || !positionHeader) {
                    let missingColumns = [];
                    if (!nameHeader) missingColumns.push("NAMA");
                    if (!positionHeader) missingColumns.push("JABATAN");
                    if (!nipHeader) missingColumns.push("NIP");
                    throw new Error(`Pemetaan kolom gagal. Kolom yang dibutuhkan tidak ada: ${missingColumns.join(', ')}. Silakan periksa header file Anda.`);
                }
                
                const nameIndex = headers.indexOf(nameHeader);
                const positionIndex = headers.indexOf(positionHeader);
                const nipIndex = headers.indexOf(nipHeader);

                const yearColumns = headers.map((h, i) => ({ header: h, index: i }))
                    .filter(col => typeof col.header === 'string' && /^\d{4}$/.test(col.header.trim()))
                    .sort((a, b) => parseInt(a.header!.trim()) - parseInt(b.header!.trim()));

                if (yearColumns.length === 0) {
                     throw new Error("Tidak ditemukan kolom tahun (misalnya, 2023, 2024) di header.");
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
                     throw new Error("Tidak ada data pegawai valid yang dapat di-parse. Periksa kolom tahun dan nilai bulan.");
                }

                setInitialData(employees);
                toast({ title: 'Impor Berhasil', description: `${employees.length} pegawai diimpor dari ${file.name}.` });
                router.push('/dashboard');

            } catch (error: any) {
                console.error(error);
                toast({ variant: 'destructive', title: 'Impor Gagal', description: error.message || 'Tidak dapat mengurai file spreadsheet.' });
            }
        };
        
        reader.readAsBinaryString(file);
    };

    const renderStep = () => {
        switch (step) {
            case 'kgb_new':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button onClick={() => router.push('/dashboard')} className="text-left">
                            <Card className="hover:bg-accent/50 hover:border-primary transition-all">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <PlusCircle className="w-8 h-8 text-primary" />
                                        <div>
                                            <CardTitle className="font-headline">Input Manual</CardTitle>
                                            <CardDescription>Tambah data pegawai satu per satu melalui formulir.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        </button>
                        <button onClick={() => spreadsheetInputRef.current?.click()} className="text-left">
                            <Card className="hover:bg-accent/50 hover:border-primary transition-all">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <FileUp className="w-8 h-8 text-primary" />
                                        <div>
                                            <CardTitle className="font-headline">Impor dari Excel/CSV</CardTitle>
                                            <CardDescription>Unggah file .xlsx atau .csv untuk impor massal.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        </button>
                    </div>
                );
            case 'kgb_start':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <button onClick={() => setStep('kgb_new')} className="text-left">
                             <Card className="hover:bg-accent/50 hover:border-primary transition-all">
                                 <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <Sparkles className="w-8 h-8 text-primary" />
                                        <div>
                                             <CardTitle className="font-headline">Buat Data Baru</CardTitle>
                                             <CardDescription>Mulai dari awal dengan menambahkan data pegawai baru.</CardDescription>
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
                                            <CardTitle className="font-headline">Impor Data yang Ada</CardTitle>
                                            <CardDescription>Muat data dari file .json yang diekspor sebelumnya.</CardDescription>
                                        </div>
                                     </div>
                                 </CardHeader>
                             </Card>
                         </button>
                    </div>
                );
            case 'main':
            default:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <button onClick={() => setStep('kgb_start')} className="text-left">
                             <Card className="hover:bg-accent/50 hover:border-primary transition-all">
                                 <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <Newspaper className="w-8 h-8 text-primary" />
                                        <div>
                                             <CardTitle className="font-headline">KGB Manager</CardTitle>
                                             <CardDescription>Kelola dan lacak Kenaikan Gaji Berkala pegawai.</CardDescription>
                                        </div>
                                    </div>
                                 </CardHeader>
                             </Card>
                         </button>
                         <div className="text-left cursor-not-allowed">
                             <Card className="bg-muted/50 border-dashed">
                                 <CardHeader>
                                     <div className="flex items-center gap-4 text-muted-foreground">
                                        <BarChart className="w-8 h-8" />
                                        <div>
                                            <CardTitle className="font-headline flex items-center">
                                                Kenaikan Pangkat 
                                                <span className="text-xs font-normal ml-2 py-0.5 px-1.5 bg-background rounded-full">Segera Hadir</span>
                                            </CardTitle>
                                            <CardDescription>Analisis dan proyeksikan kelayakan kenaikan pangkat.</CardDescription>
                                        </div>
                                     </div>
                                 </CardHeader>
                             </Card>
                         </div>
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
                    <p className="text-muted-foreground text-lg mt-2">Selamat datang! Bagaimana Anda ingin memulai?</p>
                </div>
                {renderStep()}
                 {step !== 'main' && (
                    <div className="mt-8 text-center">
                        <Button variant="link" onClick={() => setStep(step === 'kgb_new' ? 'kgb_start' : 'main')}>
                            &larr; Kembali
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

    