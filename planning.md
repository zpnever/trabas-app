Product Requirements Document (PRD): TRABAS (Travel Bebas)
Versi: 1.1
Status: Optimized for Vibe Coding & AI-Driven Development
Tech Stack: Next.js 16 (App Router), Tailwind CSS, Gemini 1.5 Flash, Supabase.

1. Ringkasan Eksekutif
   TRABAS adalah asisten perjalanan pintar berbasis web yang mendigitalisasi manajemen perjalanan. Fokus utama platform ini adalah menghilangkan planning fatigue dengan menggunakan Dynamic Route Optimization yang ditenagai oleh AI untuk menyusun itinerary, menghitung anggaran, dan memfasilitasi pemesanan tiket wisata dalam satu klik.
2. Latar Belakang Bisnis (Revisi Laporan)
   Masalah: Wisatawan sering merasa lelah menyusun jadwal, kecewa karena tempat tutup, atau rute tidak efisien (bolak-balik).
   Solusi: "Single-Click Trip Solution" — platform yang mengelola logistik (tiket) dan logika (itinerary) secara bersamaan.
   Visi: Menjadi platform navigasi dan manajemen perjalanan paling intuitif di dunia.
3. Analisis Strategis (Context for AI)
   3.1. Analisis SWOT
   Strengths: Algoritma optimasi budget, itinerary otomatis yang terintegrasi langsung dengan e-ticketing.
   Weaknesses: Ketergantungan pada API Maps/Pihak ketiga.
   Opportunities: Tren Solo Traveling dan dukungan pemerintah terhadap Smart Tourism.
   Threats: Dominasi pemain besar (Traveloka/Tiket.com) dan fluktuasi harga vendor.
   3.2. Value Proposition Canvas (VPC)
   Pain Relievers: Integrasi jam operasional wisata (mencegah kunjungan sia-sia), kalkulasi biaya bensin/makan otomatis, fitur reroute instan saat macet.
   Gain Creators: Rekomendasi "Hidden Gem" berbasis komunitas, fitur Export Itinerary (PDF/Gambar) satu klik.
4. Segmentasi & Target Pasar (STP)
   Segmentasi: Gen Z dan Keluarga Muda (Digital Savvy, Budget-Conscious).
   Targeting: Fokus pada micro-trips (1-3 hari) yang membutuhkan efisiensi tinggi.
   Positioning: "Arsitek Perjalanan Pribadi Anda."
5. Fitur Utama & Spesifikasi Teknis
   5.1. AI Itinerary Engine (Gemini 1.5 Flash)
   Fungsi: Menghasilkan jadwal perjalanan yang logis berdasarkan preferensi.
   Prompting Context: AI harus mempertimbangkan koordinat lokasi, jam buka-tutup, dan estimasi biaya per orang.
   Tech: Integrasi Gemini API via Next.js Server Actions.
   5.2. Pre-Order & E-Ticketing
   Fungsi: Pembelian paket tiket seluruh destinasi dalam satu keranjang belanja.
   Output: QR Code digital yang dapat di-scan di lokasi mitra.
   5.3. Dashboard Budget Planner
   Fungsi: Visualisasi real-time sisa anggaran pengguna.
   Fitur: Peringatan "Over-budget" dan saran alternatif destinasi yang lebih murah.
6. Arsitektur Teknis (Next.js 16)
   Frontend: React Server Components (RSC) untuk rendering cepat, Tailwind CSS untuk UI responsif.
   Backend: Next.js Route Handlers (API) untuk komunikasi dengan Gemini dan Database.
   Database: Supabase (PostgreSQL) untuk menyimpan data destinasi, tiket, dan user profile.
   Caching Strategy: Sistem caching pintar untuk data harga tiket guna mengurangi latensi API pihak ketiga.
7. Struktur Data (Schema)
   Destinations: id, name, type (Hidden Gem/Popular), coordinates, entry_fee, operating_hours.
   Trips: id, user_id, city, date_range, budget_limit, ai_generated_json.
   Tickets: id, trip_id, status (Active/Used), qr_code_hash.
8. Strategi Marketing (Marketing Mix 4P)
   Product: Inti pada Route Optimization dan Budget Planner.
   Price: Model Freemium (Free dengan iklan, Premium dengan fitur Export PDF & Diskon Mitra).
   Place: Web-App (Mobile Responsive).
   Promotion: Konten SEO "Itinerary Hemat" dan kolaborasi dengan vlogger pariwisata.
9. Indikator Keberhasilan (KPI)
   Kecepatan AI: Generate itinerary dalam < 5 detik.
   Akurasi Budget: Selisih antara estimasi AI dan pengeluaran asli < 10%.
   User Retention: Jumlah pengguna yang kembali merencanakan perjalanan kedua.
10. Roadmap Pengembangan
    Sprint 1: UI/UX Landing Page & Form Input Preferensi.
    Sprint 2: Integrasi Gemini Flash (Logic Generation).
    Sprint 3: Database Destinasi & Sistem Checkout Simulasi.
    Sprint 4: Fitur Export Itinerary & Dashboard Mobile.
