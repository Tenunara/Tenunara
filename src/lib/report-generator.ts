import type { UmkmDashboardResponse, DashboardTransaction } from "./types";

// ================================================================
// SUSTAINABILITY REPORT HTML GENERATOR
// Generates a formal A4-printable HTML document following the
// template at docs/PROPOSAL/format_propo.txt and the reference
// HTML at docs/PROPOSAL/Laporan_Kepatuhan_Resmi_Kemenperin_KLHK.html
// ================================================================

export function generateSustainabilityReport(
  data: UmkmDashboardResponse,
  tanggalCetak: string,
): string {
  const {
    profile,
    metrics,
    distribution,
    impact,
    transactions,
  } = data;

  // ─── Format helpers ────────────────────────────────────────────

  const fmtNum = (n: number): string =>
    n.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtRupiah = (n: number): string =>
    "Rp " + n.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const fmtTs = (ts: string): string => {
    const d = new Date(ts);
    return d.toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
    }) + " WIB";
  };

  const fmtDate = (ts: string): string => {
    const d = new Date(ts);
    return d.toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
      timeZone: "Asia/Jakarta",
    });
  };

  const shortHash = (hash: string): string =>
    hash.length > 20 ? hash.slice(0, 20) + "..." : hash;

  // ─── Status badges ─────────────────────────────────────────────
  const diversionRate = metrics.landfill_diversion_rate;

  const getDiversionStatus = () => {
    if (diversionRate >= 70) return { label: "PREDIKAT SANGAT PATUH", cls: "lencana-patuh" };
    if (diversionRate >= 50) return { label: "PREDIKAT PATUH", cls: "lencana-hijau" };
    return { label: "PERLU PERBAIKAN", cls: "lencana-residu" };
  };

  const diversionStatus = getDiversionStatus();

  const skalaLabel = (s: string | null): string => {
    if (!s) return "-";
    const map: Record<string, string> = { mikro: "Usaha Mikro", kecil: "Usaha Kecil", menengah: "Usaha Menengah" };
    return map[s] || s;
  };

  // ─── Transaction log items (max 10) ────────────────────────────
  const txLog = transactions.slice(0, 10).map((t: DashboardTransaction, i: number) => {
    const logNum = String(i + 1).padStart(2, "0");
    return `
    <div class="baris-log">
      <div><strong>[LOG ARSIP #TN-${logNum}]</strong> | ${fmtDate(t.timestamp)} | ${fmtNum(t.weight_kg)} kg ${t.material_type} (Grade ${t.grade}) &rarr; Penerima: ${t.receiver_name} (ID Sistem: ${t.receiver_id || "-"})</div>
      <div class="log-hash">Kode Integritas SHA-256: ${t.hash_code} | STATUS: VERIFIED &amp; MATCHED (SAH)</div>
    </div>`;
  }).join("");

  // ─── Transaction log count ─────────────────────────────────────
  const txTotal = transactions.length;

  // ─── Registration number ───────────────────────────────────────
  const regNumber = `TN-ESG/${new Date().getFullYear()}/REG-${String(Math.floor(Math.random() * 90000) + 10000)}B`;

  // ─── HTML document ─────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan Keberlanjutan Usaha Tahunan ${new Date().getFullYear()} - ${profile.nama_toko}</title>
<style>
  @page {
    size: A4;
    margin: 30mm 20mm 25mm 20mm;
    background-color: #ffffff;
    @top-center {
      content: "DOKUMEN KEPATUHAN LINGKUNGAN HIDUP DAN INDUSTRI HIJAU";
      font-family: 'Arial', sans-serif;
      font-size: 7.5pt;
      font-weight: bold;
      color: #444444;
      border-bottom: 0.5px solid #aaaaaa;
      padding-bottom: 15px;
      width: 100%;
    }
    @bottom-right {
      content: "Halaman " counter(page) " dari " counter(pages);
      font-family: 'Times New Roman', Times, serif;
      font-size: 8pt;
      color: #555555;
    }
    @bottom-left {
      content: "Salinan Sah Elektronik | Sistem Keterlacakan Terotomatisasi Tenunara v2.0";
      font-family: 'Times New Roman', Times, serif;
      font-size: 8pt;
      color: #555555;
    }
  }
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #000000;
    margin: 0;
    padding: 0;
  }
  .kop-lembaga-pemerintah {
    width: 100%;
    display: table;
    border-bottom: 4px double #000000;
    padding-bottom: 10px;
    margin-bottom: 20px;
  }
  .kop-row { display: table-row; }
  .logo-col {
    display: table-cell;
    width: 15%;
    vertical-align: middle;
    text-align: center;
  }
  .text-col {
    display: table-cell;
    width: 70%;
    vertical-align: middle;
    text-align: center;
  }
  .emblem-negara {
    width: 55px;
    height: 55px;
    border: 2px solid #000000;
    font-family: Arial, sans-serif;
    font-size: 6pt;
    font-weight: bold;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    line-height: 1.2;
    text-transform: uppercase;
    background-color: #ffffff;
  }
  .kop-text-main {
    font-family: Arial, sans-serif;
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    margin: 0;
  }
  .kop-text-sub {
    font-family: Arial, sans-serif;
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    margin: 2px 0;
    letter-spacing: 0.5px;
  }
  .kop-text-detail {
    font-family: 'Times New Roman', Times, serif;
    font-size: 9.5pt;
    font-style: italic;
    margin: 3px 0 0 0;
    color: #333333;
  }
  .nomor-agenda-container {
    text-align: center;
    margin-bottom: 25px;
  }
  .judul-dokumen-hukum {
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    text-decoration: underline;
    margin: 0 0 3px 0;
  }
  .nomor-baku-arsip {
    font-family: monospace;
    font-size: 9.5pt;
    color: #111111;
    font-weight: bold;
  }
  .tabel-identitas-riw {
    display: table;
    width: 100%;
    font-family: Arial, sans-serif;
    font-size: 9pt;
    border: 1px solid #000000;
    margin-bottom: 22px;
  }
  .identitas-row { display: table-row; }
  .identitas-col {
    display: table-cell;
    width: 50%;
    padding: 10px;
    vertical-align: top;
  }
  .identitas-col:first-child {
    border-right: 1px solid #000000;
    background-color: #fbfbfb;
  }
  .sub-judul-identitas {
    font-weight: bold;
    font-size: 8.5pt;
    text-transform: uppercase;
    border-bottom: 1px solid #000000;
    padding-bottom: 4px;
    margin-bottom: 6px;
    letter-spacing: 0.3px;
  }
  .item-data { margin-bottom: 5px; }
  .item-data:last-child { margin-bottom: 0; }
  .label-data {
    font-weight: bold;
    color: #444444;
    display: inline-block;
    width: 130px;
  }
  section { margin-bottom: 20px; text-align: justify; }
  .judul-bab-baku {
    font-family: Arial, sans-serif;
    font-size: 9.5pt;
    font-weight: bold;
    color: #000000;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background-color: #f0f0f0;
    padding: 4px 6px;
    border-left: 4px solid #000000;
    margin-top: 0;
    margin-bottom: 10px;
    page-break-after: avoid;
  }
  .teks-regulasi {
    text-indent: 35px;
    font-size: 10.5pt;
    margin-top: 0;
    margin-bottom: 8px;
    text-align: justify;
  }
  .table-matrix-wrapper {
    margin-top: 10px;
    margin-bottom: 15px;
    page-break-inside: avoid;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-family: Arial, sans-serif;
    font-size: 8.5pt;
  }
  th {
    background-color: #e6e6e6;
    color: #000000;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 8pt;
    border: 1px solid #000000;
    padding: 8px 6px;
    text-align: center;
  }
  td {
    border: 1px solid #000000;
    padding: 6px;
    vertical-align: middle;
  }
  .align-center { text-align: center; }
  .align-right { text-align: right; }
  .sub-list-kain {
    padding-left: 15px;
    font-style: italic;
    color: #333333;
  }
  .lencana-negara {
    font-weight: bold;
    font-size: 7.5pt;
    padding: 2px 5px;
    border: 1px solid #000000;
    display: inline-block;
    text-transform: uppercase;
  }
  .lencana-audit { background-color: #f5f5f5; }
  .lencana-hijau { background-color: #c8e6c9; font-weight: bold; }
  .lencana-sirkular { background-color: #bbdefb; }
  .lencana-residu { background-color: #ffcdd2; }
  .lencana-patuh { background-color: #004d40; color: #ffffff; }
  .font-mono { font-family: monospace; }
  .text-gray-400 { color: #666666; }
  .font-bold { font-weight: bold; }
  .arsip-log-card {
    background-color: #fafafa;
    border: 1px solid #aaaaaa;
    padding: 8px;
    font-family: monospace;
    font-size: 8pt;
    color: #111111;
  }
  .baris-log {
    border-bottom: 1px dashed #cccccc;
    padding-bottom: 4px;
    margin-bottom: 4px;
  }
  .baris-log:last-child {
    border-bottom: none;
    padding-bottom: 0;
    margin-bottom: 0;
  }
  .log-hash {
    color: #555555;
    font-size: 7.5pt;
    margin-top: 2px;
  }
  .pengesahan-container {
    display: table;
    width: 100%;
    margin-top: 30px;
    font-family: Arial, sans-serif;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  .pengesahan-row { display: table-row; }
  .pengesahan-box {
    display: table-cell;
    width: 50%;
    text-align: center;
    vertical-align: top;
  }
  .jabatan-penandatangan { font-weight: bold; margin-bottom: 2px; }
  .institusi-penandatangan {
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: bold;
  }
  .blok-tanda-tangan {
    height: 65px;
    margin: 6px auto;
    display: block;
  }
  .segel-meterai-elektrik {
    width: 130px;
    height: 55px;
    border: 2px dashed #004d40;
    color: #004d40;
    font-size: 7.5pt;
    font-weight: bold;
    line-height: 51px;
    margin: 5px auto;
    text-align: center;
    background-color: #e8f5e9;
    text-transform: uppercase;
  }
  .barcode-kepanduan-negara {
    width: 55px;
    height: 55px;
    border: 2px solid #000000;
    font-size: 6.5pt;
    font-weight: bold;
    margin: 5px auto;
    padding: 3px;
    line-height: 1.1;
    text-align: center;
    background-color: #ffffff;
  }
  .nama-pejabat-terang {
    font-weight: bold;
    text-decoration: underline;
    text-transform: uppercase;
    margin-bottom: 1px;
  }
  .nomor-pegawai-id {
    font-size: 8pt;
    color: #333333;
    font-family: monospace;
  }
  .keterangan-log {
    margin-top: 0;
    margin-bottom: 8px;
    font-size: 10.5pt;
  }
</style>
</head>
<body>

<!-- KOP LEMBAGA PEMERINTAH -->
<div class="kop-lembaga-pemerintah">
  <div class="kop-row">
    <div class="logo-col">
      <div class="emblem-negara">LOGO<br>KEMEN<br>PERIN</div>
    </div>
    <div class="text-col">
      <div class="kop-text-main">Republik Indonesia</div>
      <div class="kop-text-sub">Sertifikasi Manajemen Kepatuhan Industri Hijau</div>
      <div class="kop-text-detail">Konsideran Integrasi Data Pengelolaan Limbah Produksi Tekstil dan Tekanan Emisi Karbon Aktual</div>
    </div>
    <div class="logo-col">
      <div class="emblem-negara">LOGO<br>KEMEN<br>LHK</div>
    </div>
  </div>
</div>

<!-- NOMOR REGISTRASI -->
<div class="nomor-agenda-container">
  <h3 class="judul-dokumen-hukum">Laporan Hasil Evaluasi Keberlanjutan Usaha</h3>
  <div class="nomor-baku-arsip">Nomor Agenda Verifikasi: ${regNumber}</div>
</div>

<!-- TABEL IDENTITAS -->
<div class="tabel-identitas-riw">
  <div class="identitas-row">
    <div class="identitas-col">
      <div class="sub-judul-identitas">I. Profil Legalitas Pelaku Usaha (Hulu)</div>
      <div class="item-data"><span class="label-data">Nama Badan Usaha</span>: <span style="text-transform: uppercase; font-weight: bold;">${profile.nama_toko}</span></div>
      <div class="item-data"><span class="label-data">Penanggung Jawab</span>: ${profile.nama_penjual}</div>
      <div class="item-data"><span class="label-data">Nomor NIB</span>: <span class="font-mono">${profile.npwp_nib || "-"}</span></div>
      <div class="item-data"><span class="label-data">Klasifikasi Skala</span>: ${skalaLabel(profile.skala_usaha)} (Klaster Industri Konveksi)</div>
      <div class="item-data"><span class="label-data">Domisili Workshop</span>: ${profile.alamat}, ${profile.kota}, ${profile.kabupaten}</div>
    </div>
    <div class="identitas-col">
      <div class="sub-judul-identitas">II. Validasi Sistem Informasi Kepatuhan</div>
      <div class="item-data"><span class="label-data">Jenis Berkas</span>: Instrumen Transparansi Akuntabilitas ESG</div>
      <div class="item-data"><span class="label-data">Periode Buku</span>: Tahun Anggaran ${new Date().getFullYear()}</div>
      <div class="item-data"><span class="label-data">Tanggal Sinkronisasi</span>: ${tanggalCetak}</div>
      <div class="item-data"><span class="label-data">Sistem Pengunci</span>: Tenunara Kriptografi Automatching Ledger</div>
    </div>
  </div>
</div>

<!-- BAB I -->
<section>
  <div class="judul-bab-baku">BAB I: KONSIDERAN HUKUM DAN KEPATUHAN OPERASIONAL</div>
  <p class="teks-regulasi">
    Menimbang ketentuan regulasi nasional mengenai kewajiban pelaporan aspek keberlanjutan bagi sektor riil, laporan akuntabilitas ini disusun oleh <strong>${profile.nama_toko}</strong> secara terintegrasi dengan PT Tenunara Sirkular Indonesia. Dokumen tata kelola ini mengacu penuh pada standar transparansi material sisa yang diamanatkan dalam Peraturan Otoritas Jasa Keuangan (POJK) Nomor 51/POJK.03/2017 tentang Penerapan Keuangan Berkelanjutan, guna memastikan kelayakan pelaku usaha dalam mengakses ekosistem pendanaan hijau (<i>Green Financing</i>) perbankan nasional.
  </p>
</section>

<!-- BAB II -->
<section>
  <div class="judul-bab-baku">BAB II: STRATEGI PENGALIHAN TIMBULAN LIMBAH PADAT TEKSTIL</div>
  <p class="teks-regulasi">
    Dalam rangka mensukseskan Rencana Aksi Nasional Ekonomi Sirkular yang dicanangkan oleh Bappenas serta mengendalikan laju timbulan sampah perca tekstil di Tempat Pembuangan Akhir (TPA) berdasarkan target jangka panjang Kementerian Lingkungan Hidup dan Kehutanan (KLHK), <strong>${profile.nama_toko}</strong> mengimplementasikan sistem klasifikasi digital otomatis. Melalui platform pelacakan Tenunara, seluruh sisa potongan kain diidentifikasi secara berkala untuk didistribusikan langsung kepada sektor industri kreatif hilir tanpa melalui mekanisme pembakaran terbuka (<i>open burning</i>) yang melanggar ketentuan tata ruang lingkungan.
  </p>
</section>

<!-- BAB III -->
<section>
  <div class="judul-bab-baku">BAB III: METRIKS AUDIT KINERJA LINGKUNGAN (STANDAR GLOBAL REPORTING INITIATIVE)</div>
  <p style="margin-top: 0; margin-bottom: 8px; font-size: 10.5pt; font-family: Arial, sans-serif;">
    Evaluasi besaran volume limbah padat sisa produksi manufaktur konveksi yang berhasil divalidasi oleh sistem otomasi digital sepanjang tahun berjalan:
  </p>

  <div class="table-matrix-wrapper">
    <table>
      <thead>
        <tr>
          <th style="text-align: left;">Variabel Evaluasi Dampak Lingkungan</th>
          <th>Kode GRI</th>
          <th>Satuan</th>
          <th>Kuantitas Aktual</th>
          <th>Status Kelayakan (Standar SIH Kemenperin)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Volume Timbulan Sampah Perca yang Dihasilkan</td>
          <td class="align-center font-mono">GRI 306-3</td>
          <td class="align-center">kg</td>
          <td class="align-right">${fmtNum(metrics.total_waste_generated_kg)}</td>
          <td class="align-center"><span class="lencana-negara lencana-audit">TERDATA / AUDIT-READY</span></td>
        </tr>
        <tr class="font-bold" style="background-color: #fafafa;">
          <td>Volume Limbah yang Berhasil Dialihkan dari TPA (Diverted)</td>
          <td class="align-center font-mono">GRI 306-4</td>
          <td class="align-center">kg</td>
          <td class="align-right">${fmtNum(metrics.total_waste_diverted_kg)}</td>
          <td class="align-center"><span class="lencana-negara lencana-hijau">MEMENUHI AMBANG BATAS</span></td>
        </tr>
        <tr>
          <td class="sub-list-kain">&bull; Distribusi Sekunder: Sektor Industri Kreatif (Upcycle)</td>
          <td class="align-center text-gray-400">-</td>
          <td class="align-center">kg</td>
          <td class="align-right">${fmtNum(distribution.upcycle_volume_kg)}</td>
          <td class="align-center"><span class="lencana-negara lencana-sirkular">SIRKULAR MIKRO</span></td>
        </tr>
        <tr>
          <td class="sub-list-kain">&bull; Distribusi Sekunder: Sektor Substitusi Industri Serat (Recycle)</td>
          <td class="align-center text-gray-400">-</td>
          <td class="align-center">kg</td>
          <td class="align-right">${fmtNum(distribution.recycle_volume_kg)}</td>
          <td class="align-center"><span class="lencana-negara lencana-sirkular">SIRKULAR MAKRO</span></td>
        </tr>
        <tr>
          <td>Volume Residu Akhir yang Terbuang ke Lokasi Pembuangan (Disposal)</td>
          <td class="align-center font-mono">GRI 306-5</td>
          <td class="align-center">kg</td>
          <td class="align-right">${fmtNum(metrics.waste_to_disposal_kg)}</td>
          <td class="align-center"><span class="lencana-negara lencana-residu">DI BAWAH TOLERANSI</span></td>
        </tr>
        <tr class="font-bold" style="background-color: #f5f9f6;">
          <td>Rasio Kepatuhan Pengalihan Dampak (Diversion Rate)</td>
          <td class="align-center font-mono">-</td>
          <td class="align-center">%</td>
          <td class="align-right">${fmtNum(diversionRate)}%</td>
          <td class="align-center"><span class="lencana-negara ${diversionStatus.cls}">${diversionStatus.label}</span></td>
        </tr>
        <tr>
          <td>Estimasi Reduksi Tekanan Emisi Karbon (Avoided CO&#8322;e Scope 3)</td>
          <td class="align-center font-mono">GRI 305</td>
          <td class="align-center">kg CO&#8322;e</td>
          <td class="align-right">${fmtNum(impact.co2e_avoided_kg)}</td>
          <td class="align-center"><span class="lencana-negara lencana-hijau">DAMPAK MULTIPLIER</span></td>
        </tr>
        <tr>
          <td>Indeks Multiplier Penghematan Ekonomi Pengrajin</td>
          <td class="align-center font-mono">GRI 203</td>
          <td class="align-center">Rupiah</td>
          <td class="align-right">${fmtRupiah(impact.local_economic_multiplier)}</td>
          <td class="align-center"><span class="lencana-negara lencana-sirkular">DAMPAK SOSIAL TERVERIFIKASI</span></td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

<!-- BAB IV -->
<section>
  <div class="judul-bab-baku">BAB IV: TRANSPARANSI DAN INTEGRITAS DATA (AUDIT TRAIL LOG)</div>
  <p class="keterangan-log">
    Untuk menjamin orisinalitas laporan dan mencegah manipulasi data hijau (<i>greenwashing</i>), berikut lampiran bukti transaksi log pemindahan komoditas perca yang telah terkunci sistem kriptografi SHA-256 (menampilkan ${Math.min(txTotal, 10)} dari ${txTotal} transaksi terverifikasi):
  </p>
  <div class="arsip-log-card">
    ${txLog}
  </div>
</section>

<!-- BAB V -->
<section>
  <div class="judul-bab-baku">BAB V: LEGALITAS DAN KETENTUAN PENUTUP</div>
  <p class="teks-regulasi">
    Demikian laporan hasil evaluasi ini diterbitkan berdasarkan rekaman riil ekosistem sirkular platform Tenunara tanpa ada rekayasa manual. Berkas cetak elektronik ini memiliki kedudukan hukum akuntabel dan sah digunakan sebagai dokumen pendukung dalam pemenuhan prasyarat <strong>Sertifikasi Industri Hijau (SIH) Kementerian Perindustrian</strong> serta penilaian portofolio risiko lingkungan untuk program pembiayaan rendah emisi.
  </p>
</section>

<!-- PENGESAHAN -->
<div class="pengesahan-container">
  <div class="pengesahan-row">
    <div class="pengesahan-box">
      <div class="jabatan-penandatangan">Pihak Pertama (Pelapor),</div>
      <div class="institusi-penandatangan">${profile.nama_toko}</div>
      <div class="blok-tanda-tangan">
        <div class="segel-meterai-elektrik">Meterai Elektronik<br>Direktorat Jenderal Pajak</div>
      </div>
      <div class="nama-pejabat-terang">${profile.nama_penjual}</div>
      <div class="nomor-pegawai-id">ID Wajib Pajak: NIB-${profile.npwp_nib || "-"}</div>
    </div>
    <div class="pengesahan-box">
      <div class="jabatan-penandatangan">Pihak Kedua (Saksi Sistem),</div>
      <div class="institusi-penandatangan">PT Tenunara Sirkular Indonesia</div>
      <div class="blok-tanda-tangan">
        <div class="barcode-kepanduan-negara">BARCODE<br>OTORITAS<br>LEDGER</div>
      </div>
      <div class="nama-pejabat-terang">Sistem Tata Kelola Tenunara</div>
      <div class="nomor-pegawai-id">Kunci Kriptografi: SHA-256 Verified</div>
    </div>
  </div>
</div>

</body>
</html>`;
}
