## 📘 Product Requirements Document (PRD) – *NextStep v1.0*

### 🧭 1. **Tujuan Produk**
Membantu pengguna (HR atau admin pegawai) memantau dan mengelola data KGB pegawai secara lokal, tanpa login, dengan fitur pengingat otomatis berdasarkan tanggal KGB terakhir.

---

### 👥 2. **Target Pengguna**
- HR/Admin instansi kecil/menengah
- Pengguna individu yang ingin tracking KGB tanpa sistem backend
- Pengguna yang butuh portabilitas data antar device

---

### 🧩 3. **Fitur Utama**

#### A. **Landing Page**
- Pilihan: `Buat Baru` atau `Kelola yang Sudah Ada`
- Jika “Kelola” → upload file JSON
- Jika “Buat Baru” → pilih “Input Manual” atau “Import XLSX”

#### B. **Input Data Pegawai**
- **Manual Form**: Nama, NIP, Tanggal KGB Terakhir
- **Import XLSX**: Parsing file Excel ke struktur data internal
- Validasi: Format tanggal, duplikasi NIP

#### C. **Penyimpanan Lokal**
- Data disimpan di `localStorage` atau `IndexedDB`
- Tidak ada login atau backend
- Opsi export data ke file `.json`

#### D. **Pengingat KGB**
- Logic: Tanggal KGB terakhir + 1 tahun
- Alert muncul jika <30 hari dari tanggal KGB berikutnya
- Tampilkan di dashboard atau modal

#### E. **Export & Import**
- Export data ke `.json`
- Import `.json` untuk restore data di device lain

---

### 🧠 4. **Logika Bisnis**

```ts
function isKGBDue(tanggalKGBTerakhir: string): boolean {
  const today = new Date();
  const lastKGB = new Date(tanggalKGBTerakhir);
  const nextKGB = new Date(lastKGB.setFullYear(lastKGB.getFullYear() + 1));
  const diffDays = (nextKGB.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 30;
}
```

---

### 🖼️ 5. **UI/UX Requirements**

| Halaman         | Komponen Utama                          | Interaksi                                                                 |
|------------------|------------------------------------------|---------------------------------------------------------------------------|
| Landing          | Pilihan Buat/Kelola                      | Navigasi ke input/import/upload                                           |
| Input Manual     | Form pegawai                             | Validasi, tambah data, simpan lokal                                       |
| Import XLSX      | Upload file                              | Parsing, preview, simpan lokal                                            |
| Dashboard        | Tabel pegawai + status KGB               | Highlight pegawai yang mendekati KGB                                      |
| Export/Import    | Tombol download/upload JSON              | Portabilitas data                                                         |

---

### 📦 6. **Teknologi & Stack**

- **Frontend**: Next.js + React + Tailwind CSS
- **State Management**: React Context / Zustand
- **Storage**: localStorage / IndexedDB
- **File Handling**: `xlsx` untuk parsing Excel, `FileSaver.js` untuk export JSON

---

### 🧪 7. **Testing & Validasi**

- Validasi input: format tanggal, duplikasi NIP
- Simulasi alert KGB dengan data dummy
- Test import/export JSON lintas browser

---

### 🚀 8. **Roadmap Fitur Tambahan (Opsional)**
- Reminder kenaikan jabatan
- Tracking pelatihan pegawai
- Evaluasi kinerja
- Sinkronisasi cloud (opsional, jika demand tinggi)


Powered by firebase studio
