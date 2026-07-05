# Galih Drawing App

Aplikasi web sederhana untuk menggambar dengan brush lingkaran, menambahkan footer otomatis pada gambar, lalu mengirim hasilnya ke channel Telegram melalui Netlify Function.

## Fitur

- Form judul dengan default `tanpa judul`.
- Form nama penggambar dengan default `anonim`.
- Drawing canvas dengan satu tool: brush lingkaran.
- Ukuran brush bisa diubah.
- Warna brush bisa dipilih.
- Tombol submit untuk mengirim gambar ke channel Telegram.
- Footer otomatis masuk ke file gambar:
  - kiri bawah: judul dan `by: nama penggambar`
  - kanan bawah: `@galihjkdev`
- Token bot dan username channel disimpan di environment variable Netlify.

## Setup lokal

```bash
npm install
cp .env.example .env
```

Isi `.env`:

```bash
TELEGRAM_BOT_TOKEN=token_bot_kamu
TELEGRAM_CHANNEL_USERNAME=@galihjkdev
```

Jalankan via Netlify Dev agar function ikut aktif:

```bash
npm install -g netlify-cli
npm run netlify:dev
```

Buka:

```text
http://localhost:8888
```

## Deploy ke Netlify

1. Push project ini ke GitHub/GitLab/Bitbucket.
2. Buat site baru di Netlify dari repository tersebut.
3. Build command:

```bash
npm run build
```

4. Publish directory:

```text
dist
```

5. Functions directory:

```text
netlify/functions
```

6. Tambahkan environment variables di Netlify:

```bash
TELEGRAM_BOT_TOKEN=token_bot_kamu
TELEGRAM_CHANNEL_USERNAME=@galihjkdev
```

## Catatan Telegram

Bot Telegram harus menjadi admin di channel tujuan agar bisa memposting gambar.
`TELEGRAM_CHANNEL_USERNAME` boleh diisi `@galihjkdev` atau `galihjkdev`.
