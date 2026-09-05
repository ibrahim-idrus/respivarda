# Respivarda - Sistem Monitoring Kualitas Udara dan Peringatan Proaktif Berbasis AI untuk Mengurangi Risiko ISPA

Sebuah sistem monitoring kualitas udara yang menggunakan IQAir API sebagai sumber data AQI utama dan memberikan langkah preventif untuk membantu pengguna mengurangi risiko gangguan kesehatan akibat paparan udara yang tidak sehat, khususnya ISPA. Sistem secara proaktif memantau indeks kualitas udara dan memberikan peringatan ketika nilai indeks telah melewati ambang batas (threshold) yang telah ditentukan. Serta memanfaatkan AI untuk menghasilkan insight dan rekomendasi langkah preventif yang disesuaikan dengan kondisi kualitas udara saat ini. Platform ini dapat diakses melalui website serta layanan bot WhatsApp dan Telegram, sehingga pengguna dapat menerima informasi, peringatan, dan rekomendasi secara cepat.

# Fitur
1. Peta Kualitas Udara
2. Rekomendasi Langkah Preventif
3. Sistem AI ProAktif

# Cara Kerja
Respivarda hadir pada platform website dan layanan chat seperti telegram dan whatsapp sebagai solusi yang memiliki aksebilitas tinggi. Website berfungsi sebagai platform yang menampilkan berbagai kualitas udara dari berbagai penjuru dunia, sedangkan layanan chat telegram dan whatsapp berfungsi sebagai bot ai preventif dan proaktif untuk memberikan rekomendasi kepada pengguna, pengguna akan dimintai persetujuan dan data pribadi untuk kebutuhan analisis dalam sistem, kemudian setalah bot respivarda menerima seluruh data yang dibutuhkan. Otomatis akan mengirim kualitas data udara di sekitar pengguna, dan akan memberikan alert jika mencapai treshold aqi us yang telah diterapkan pada sistem. Sehingga pengguna dapat melakukan langkah preventif untuk menghindari dan mengurangi risiko ISPA. 

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
8. Telegram API Bot
9. Whatsapp API (to be continued)
10. Geolocation / Location Service
11. Notification & Scheduler System

# Cara menjalankan
Untuk menjalankan aplikasi ini diperlukan beberapa kredensial penting, diantaranya:
1. DATABASE_URL
2. TELEGRAM_BOT_USERNAME
3. TELEGRAM_URL
4. AIR_VISUAL_API_KEY

Setelah itu dapat menginstall package dengan command npm install jika menggunakan npm, jika menggunakan package manager lain bisa disesuaikan masing-masing
jika sudah selesai menginstall, maka cukup jalankan npm run build, dan setelah selesai build maka jalankan npm start.
