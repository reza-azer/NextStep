export type KGBStatus =
  | 'Belum Diajukan'
  | 'Sudah Diajukan'
  | 'Proses'
  | 'Menunggu Konfirmasi'
  | 'Selesai';


export interface Employee {
  id: string;
  name: string;
  position: string;
  nip: string;
  lastKGBDate: string; // ISO date string
  kgbStatus: KGBStatus;
}
