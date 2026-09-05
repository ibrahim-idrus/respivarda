# Respivarda - Sistem Monitoring Kualitas Udara dan Peringatan Proaktif Berbasis AI untuk Mengurangi Risiko ISPA

Sebuah sistem monitoring kualitas udara yang menggunakan IQAir API sebagai sumber data AQI utama dan memberikan langkah preventif untuk membantu pengguna mengurangi risiko gangguan kesehatan akibat paparan udara yang tidak sehat, khususnya ISPA. Sistem secara proaktif memantau indeks kualitas udara dan memberikan peringatan ketika nilai indeks telah melewati ambang batas (threshold) yang telah ditentukan. Serta memanfaatkan AI untuk menghasilkan insight dan rekomendasi langkah preventif yang disesuaikan dengan kondisi kualitas udara saat ini. Platform ini dapat diakses melalui website serta layanan bot Telegram, sehingga pengguna dapat menerima informasi, peringatan, dan rekomendasi secara cepat.

# Fitur
1. Peta Kualitas Udara
2. Rekomendasi Langkah Preventif
3. Sistem AI ProAktif

# Cara Kerja
Respivarda hadir pada platform website dan layanan chat seperti telegram sebagai solusi yang memiliki aksebilitas tinggi. Website berfungsi sebagai platform yang menampilkan berbagai kualitas udara dari berbagai penjuru dunia, sedangkan layanan chat telegram berfungsi sebagai bot ai preventif dan proaktif untuk memberikan rekomendasi kepada pengguna, pengguna akan dimintai persetujuan dan data pribadi untuk kebutuhan analisis dalam sistem, kemudian setalah bot respivarda menerima seluruh data yang dibutuhkan. Otomatis akan mengirim kualitas data udara di sekitar pengguna, dan akan memberikan alert jika mencapai treshold aqi us yang telah diterapkan pada sistem. Sehingga pengguna dapat melakukan langkah preventif untuk menghindari dan mengurangi risiko ISPA. 

# Teknologi Yang Digunakan
Respivarda menggunakan kombinasi teknologi API, Artificial Intelligence (AI), web application, chatbot, database, dan sistem notifikasi untuk membangun sistem monitoring kualitas udara yang proaktif. Sebagai berikut:
1. IQAir AirVisual API
Digunakan sebagai sumber utama data kualitas udara, seperti AQI (US), PM2.5, dan informasi lokasi.
3. Artificial Intelligence (AI)
AI digunakan untuk menganalisis kondisi kualitas udara dan menghasilkan insight serta rekomendasi langkah preventif yang disesuaikan dengan kondisi pengguna. juga digunakan untuk menginterpretasikan data AQI menjadi informasi yang lebih mudah dipahami pengguna. 
4. Backend API
5. Database
Database digunakan untuk menyimpan data yang diperlukan sistem, seperti profil pengguna, lokasi, riwayat kualitas udara, dan riwayat peringatan. Provider database yang digunakan yaitu postgresql.
6. Website / Web Application
   Website menjadi antarmuka utama untuk menampilkan informasi kualitas udara secara visual. Adapun teknologi website yang digunakan yaitu Next Typescript.
7. Telegram API Bot
8. Whatsapp API (to be continued)
9. Geolocation / Location Service
10. Notification & Scheduler System

# Cara menjalankan
Untuk menjalankan aplikasi ini diperlukan beberapa kredensial penting, diantaranya:
1. DATABASE_URL
2. TELEGRAM_BOT_USERNAME
3. TELEGRAM_URL
4. AIR_VISUAL_API_KEY
5. GEMINI_API_KEY
6. CRON_SECRET
7. ADMIN_*

Install dependensi dengan npm install (atau sesuaikan dengan package manager masing-masing). Sinkronkan skema database dengan npm run db:push untuk pengembangan, atau npm run db:migrate untuk produksi. Untuk pengembangan jalankan npm run dev, untuk produksi jalankan npm run build lalu npm start. Terakhir,

# Kebijakan Retensi Data

**Definisi pengguna nonaktif.** Pengguna dinyatakan nonaktif jika selama periode berjalan tidak ada satu pun aktivitas berikut: mengirim pesan ke bot Telegram (termasuk perintah maupun share location), membuka dashboard web dengan sesi terhubung, atau menerima pembaruan lokasi via cron fan-out. Aktivitas terakhir dicatat dari kolom `updatedAt` pada data pengguna.

**Batas simpan.**

- **Koordinat presisi penuh** (±1 meter, setara alamat rumah): didegradasi ke presisi kota (2 desimal, ±1 km) 90 hari setelah pengguna dinyatakan nonaktif. Degradasi, bukan penghapusan total, agar data historis kota tetap berguna tanpa bisa dilacak ke individu.
- **Riwayat penyakit, usia, dan profil kesehatan**: dihapus permanen 1 tahun setelah pengguna dinyatakan nonaktif.
- **Riwayat kualitas udara dan peringatan** (data agregat per kota, tanpa identitas pengguna): disimpan tanpa batas untuk keperluan statistik, evaluasi ambang, dan penelitian.
- **Log pengiriman notifikasi** (kapan pesan terkirim ke siapa): disimpan 6 bulan untuk audit dan penyelesaian sengketa, lalu dihapus permanen.
- **Data umpan balik (feedback)**: nama dan kontak pelapor dihapus 1 tahun setelah laporan berstatus resolved, isi laporan anonim dipertahankan.

**Hak pengguna.** Pengguna dapat meminta penghapusan seluruh datanya kapan pun dengan menghubungi admin. Permintaan dipenuhi maksimal 14 hari kerja. Implementasi penghapusan dan degradasi otomatis terjadwal menyusul; sampai saat itu penegakan dilakukan manual oleh admin.
