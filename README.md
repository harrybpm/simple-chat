# Chat Sederhana

Web chat publik satu ruangan. Siapa pun yang membuka alamatnya bisa menulis pesan,
dan semua pesan tampil berurutan sesuai waktu. Pesan disimpan di SQLite (`chat.db`)
memakai modul bawaan Node, jadi tidak perlu `npm install`.

Butuh Node.js 22.13 atau lebih baru.

## Jalankan di komputer sendiri

```
npm start
```

Lalu buka http://localhost:3000.

## Deploy ke Railway (disarankan)

1. Upload folder ini ke repo GitHub.
2. Di Railway: New Project -> Deploy from GitHub repo -> pilih repo ini.
3. Di service yang terbentuk, buka tab Settings -> Volumes -> Add Volume,
   mount path: `/data`.
4. Tab Variables -> tambah `DATA_DIR` = `/data`.
5. Settings -> Networking -> Generate Domain. Alamat itu yang dibagikan.

Pilih region Southeast Asia (Singapore) supaya dekat ke Jepang dan Indonesia.

## Variabel lingkungan

| Nama       | Default          | Keterangan                                      |
|------------|------------------|-------------------------------------------------|
| `PORT`     | `3000`           | Port server. Layanan hosting biasanya mengisi sendiri. |
| `DATA_DIR` | folder project   | Lokasi file `chat.db`. Arahkan ke disk persisten saat deploy. |
