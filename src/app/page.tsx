'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileJson, Sparkles, PlusCircle, FileUp, Newspaper, BarChart, Github, Linkedin, Instagram } from "lucide-react";
import { useEmployeeData } from '@/hooks/use-employee-data';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import type { Employee } from '@/lib/types';
import Link from 'next/link';
import GradientText from '@/components/ui/gradient-text';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

const nameVariations = ['nama'];
const positionVariations = ['jabatan'];
const nipVariations = ['nip'];

const monthMap: { [key: string]: number } = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mei': 4, 'jun': 5,
    'jul': 6, 'agu': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'des': 11
};

function findHeader(headers: string[], variations: string[]): string | undefined {
    return headers.find(header => {
        const trimmedHeader = header.trim().toLowerCase();
        return variations.some(variation => trimmedHeader.includes(variation));
    });
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
                
                let rawHeaders: (string | number | null | undefined)[] = jsonData[0];
                if (file.name.endsWith('.csv') && typeof rawHeaders[0] === 'string' && rawHeaders[0].includes(';')) {
                    rawHeaders = rawHeaders[0].split(';');
                }
                const headers = rawHeaders.map(h => String(h || '').trim());

                const dataRows = jsonData.slice(1).map(row => {
                     if (file.name.endsWith('.csv') && typeof row[0] === 'string' && row[0].includes(';')) {
                        return row[0].split(';');
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
                
                const nameIndex = headers.findIndex(h => h.toLowerCase() === nameHeader.toLowerCase());
                const positionIndex = headers.findIndex(h => h.toLowerCase() === positionHeader.toLowerCase());
                const nipIndex = headers.findIndex(h => h.toLowerCase() === nipHeader.toLowerCase());
                
                const yearRegex = /\b(\d{4})\b/;
                const yearColumns = headers.map((h, i) => {
                    const match = h.match(yearRegex);
                    if (match) {
                        return { header: h, index: i, year: parseInt(match[1]) };
                    }
                    return null;
                }).filter((col): col is { header: string; index: number; year: number } => col !== null)
                  .sort((a, b) => a.year - b.year);


                if (yearColumns.length === 0) {
                     throw new Error("Tidak ditemukan kolom tahun (misalnya, 2023, 2024) di header.");
                }

                const employees: Employee[] = dataRows.map((row: any[]) => {
                    let lastKGBDate: string | null = null;
                    // Iterate backwards through year columns to find the latest valid month
                    for (let i = yearColumns.length - 1; i >= 0; i--) {
                        const yearCol = yearColumns[i];
                        const year = yearCol.year;
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
                        <HoverBorderGradient as="button" onClick={() => router.push('/dashboard')} containerClassName="rounded-lg w-full" className="w-full bg-background">
                             <div className="flex items-center gap-4 text-left p-4">
                                <PlusCircle className="w-8 h-8 text-primary" />
                                <div>
                                    <h3 className="font-headline text-foreground">Input Manual</h3>
                                    <p className="text-sm text-muted-foreground">Tambah data pegawai satu per satu melalui formulir.</p>
                                </div>
                            </div>
                        </HoverBorderGradient>
                         <HoverBorderGradient as="button" onClick={() => spreadsheetInputRef.current?.click()} containerClassName="rounded-lg w-full" className="w-full bg-background">
                             <div className="flex items-center gap-4 text-left p-4">
                                <FileUp className="w-8 h-8 text-primary" />
                                <div>
                                    <h3 className="font-headline text-foreground">Impor dari Excel/CSV</h3>
                                    <p className="text-sm text-muted-foreground">Unggah file .xlsx atau .csv untuk impor massal.</p>
                                </div>
                            </div>
                        </HoverBorderGradient>
                    </div>
                );
            case 'kgb_start':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <HoverBorderGradient as="button" onClick={() => setStep('kgb_new')} containerClassName="rounded-lg w-full" className="w-full bg-background">
                             <div className="flex items-center gap-4 text-left p-4">
                                <Sparkles className="w-8 h-8 text-primary" />
                                <div>
                                     <h3 className="font-headline text-foreground">Buat Data Baru</h3>
                                     <p className="text-sm text-muted-foreground">Mulai dari awal dengan menambahkan data pegawai baru.</p>
                                </div>
                            </div>
                         </HoverBorderGradient>
                         <HoverBorderGradient as="button" onClick={() => jsonInputRef.current?.click()} containerClassName="rounded-lg w-full" className="w-full bg-background">
                             <div className="flex items-center gap-4 text-left p-4">
                                <FileJson className="w-8 h_8 text-primary" />
                                <div>
                                    <h3 className="font-headline text-foreground">Impor Data yang Ada</h3>
                                    <p className="text-sm text-muted-foreground">Muat data dari file .json yang diekspor sebelumnya.</p>
                                </div>
                             </div>
                         </HoverBorderGradient>
                    </div>
                );
            case 'main':
            default:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <HoverBorderGradient as="button" onClick={() => setStep('kgb_start')} containerClassName="rounded-lg w-full" className="w-full bg-background">
                            <div className="flex items-center gap-4 text-left p-4">
                                <Newspaper className="w-8 h-8 text-primary" />
                                <div>
                                    <h3 className="font-headline text-foreground">KGB Manager</h3>
                                    <p className="text-sm text-muted-foreground">Kelola dan lacak Kenaikan Gaji Berkala pegawai.</p>
                                </div>
                            </div>
                        </HoverBorderGradient>
                         <div className="text-left p-0.5 rounded-lg border-dashed border bg-muted/50 cursor-not-allowed">
                            <div className="bg-background rounded-lg p-4 h-full">
                                <div className="flex items-center gap-4 text-muted-foreground">
                                <BarChart className="w-8 h-8" />
                                <div>
                                    <h3 className="font-headline flex items-center">
                                        Kenaikan Pangkat 
                                        <span className="text-xs font-normal ml-2 py-0.5 px-1.5 bg-muted rounded-full">Segera Hadir</span>
                                    </h3>
                                    <p className="text-sm">Analisis dan proyeksikan kelayakan kenaikan pangkat.</p>
                                </div>
                                </div>
                            </div>
                         </div>
                    </div>
                );
        }
    }

    return (
        <div className="flex flex-col items-center justify-between min-h-screen bg-background p-4">
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
            <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col justify-center">
                <div className="text-center mb-8">
                    <GradientText className="font-headline text-6xl font-bold">NextStep</GradientText>
                    <p className="text-muted-foreground text-lg mt-2">Built to help you act, not just react. Use it anywhere. No login. No limits.</p>
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
            <footer className="w-full text-center py-4">
                <div className="flex justify-center items-center gap-4 mb-2">
                    <Link href="https://www.instagram.com/rezafahalafi/" target="_blank" rel="noopener noreferrer">
                        <Instagram className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                    </Link>
                    <Link href="https://www.linkedin.com/in/rezafahalafi/" target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                    </Link>
                    <Link href="https://github.com/reza-azer" target="_blank" rel="noopener noreferrer">
                        <Github className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                    </Link>
                </div>
                <p className="text-sm text-muted-foreground">&copy; 2025 NextStep - created by fahalafi</p>
            </footer>
        </div>
    );

    
}

    