# Shot List — Karakter Scroll-Driven (frame sequence, bukan video)

## Cara kerjanya
- Semua gerakan = **gambar PNG/WebP transparan** (frame), bukan video.
- Posisi scroll menentukan frame ke berapa yang tampil di `<canvas>`.
- Scroll turun = frame maju. Scroll naik = frame mundur. Berhenti = karakter berhenti.
- Responsif: kode yang mengatur posisi dan skala (GSAP), frame cuma isi gambarnya. Satu set frame dipakai di desktop dan mobile (layout beda, frame sama).
- Total sekitar **60 frame unik**. Frame loop (jalan, meluncur, idle) dipakai berulang.

## Aturan wajib untuk SEMUA frame
1. Karakter sama persis: wajah, hijab dusty-pink, sweater krem, rok pink, gelas di tangan kiri (kecuali dicatat lain).
2. Background polos satu warna (hijau chroma `#00FF00` atau abu rata), tanpa bayangan lantai. Bayangan ditambah lewat kode.
3. Cahaya konsisten: utama dari kiri-atas, lembut, gaya Pixar 3D.
4. Ukuran kanvas per frame sama dalam satu grup. Kaki (atau pinggul untuk pose duduk) **di titik yang sama** di setiap frame supaya tidak bergetar.
5. Kamera lurus, tanpa zoom dan tanpa perspektif berubah. Zoom dikerjakan kode.
6. Resolusi: tinggi karakter minimal 1600px. Nanti diexport ke 2 ukuran (900px untuk mobile, 1400px untuk desktop), WebP/AVIF.
7. Penamaan: `grup-nama-pose-NN.png` (contoh: `s2-walk-03.png`).

Tips konsistensi: generate **satu sheet berisi 6–8 pose sekaligus** (grid) dengan gambar referensi karakter yang sama, lalu dipotong. Jauh lebih konsisten daripada generate satu-satu.

---

## S0 — Hero (sudah ada)
| File | Isi | Status |
|---|---|---|
| `base.png` | Bust menghadap depan, mata terpisah | ✅ ada |

## S1 — Scroll 1: Zoom out, bust → berdiri penuh
Zoom dikerjakan kode. Frame hanya perlu pose berdiri dan sedikit tanda hidup.
| Frame | Isi | Jumlah |
|---|---|---|
| `s1-stand-01` | Berdiri depan, memegang gelas (pose `walker-stand` sekarang) | ✅ ada |
| `s1-idle-01..04` | Napas pelan: bahu naik turun, kepala miring sedikit, kedip (loop) | 4 |
| `s1-wave-01..05` | Tangan kanan terangkat dan melambai (sesuai mockup frame 2), lalu turun | 5 |

## S2 — Scroll 2: Berjalan ke samping (kanan)
| Frame | Isi | Jumlah |
|---|---|---|
| `s2-turn-01..03` | Menghadap depan → 3/4 menghadap kanan | 3 |
| `s2-walk-01..08` | **Siklus jalan** menghadap kanan (3/4): contact kaki kanan, down, passing, up, contact kaki kiri, down, passing, up. Rok dan hijab ikut berayun. **Harus bisa loop mulus** (frame 08 menyambung ke frame 01). | 8 |
| `s2-turn-04..06` | 3/4 kanan → menghadap depan (berhenti, atau tetap 3/4 menghadap perosotan kalau lebih natural) | 3 |

Cara pakai: jarak yang ditempuh karakter menentukan frame jalan, jadi kakinya tidak "meluncur" di lantai.

## S3 — Scroll 3: Naik ke perosotan, meluncur turun
| Frame | Isi | Jumlah |
|---|---|---|
| `s3-walk-*` | Pakai ulang `s2-walk` (menuju perosotan) | 0 |
| `s3-prep-01..03` | Menekuk lutut, badan condong, ancang-ancang lompat | 3 |
| `s3-jump-01..05` | Take-off, naik, puncak (`walker-jump` sekarang bisa jadi frame puncak), mulai turun, bersiap mendarat | 5 |
| `s3-land-01..03` | Mendarat dan duduk di ujung atas perosotan: kontak, lutut menekuk, duduk | 3 |
| `s3-slide-01..06` | **Loop meluncur**, duduk (dari `walker-sit`): badan condong ke belakang, rok dan hijab tertiup, kedua tangan terangkat gembira, variasi kecil per frame | 6 |
| `s3-exit-01..03` | Ujung bawah: kaki ke depan, badan terangkat dari perosotan, lepas landas | 3 |
| `s3-air-01..03` | Di udara: puncak, mulai turun, bersiap mendarat (lompat turun) | 3 |

Perhatian: tiap frame duduk harus **titik pinggulnya sama** (bukan kaki), karena posisinya mengikuti jalur perosotan.

## S4 — Scroll 4: Mendarat dan berdiri lagi (section perkenalan)
| Frame | Isi | Jumlah |
|---|---|---|
| `s4-land-01..03` | Kontak kaki, jongkok meredam, lutut menekuk dalam | 3 |
| `s4-rise-01..04` | Berdiri naik pelan sampai tegak | 4 |
| `s4-settle-01..02` | Merapikan postur, menghadap depan | 2 |
| `s4-idle-*` | Pakai ulang `s1-idle` (napas) atau `s1-wave` | 0 |

---

## Ringkasan jumlah
| Grup | Frame baru |
|---|---|
| S1 | 9 |
| S2 | 14 |
| S3 | 23 |
| S4 | 9 |
| **Total** | **~55** (+ 4 yang sudah ada) |

## Prioritas bikin (kalau mau bertahap)
1. **S2 walk cycle (8 frame)**: ini yang paling menentukan kesan "hidup". Cobakan dulu untuk cek konsistensi wajah.
2. S3 loop meluncur (6 frame) dan transisi lompat/duduk.
3. S4 berdiri.
4. S1 napas/lambai terakhir (bonus).

## Responsif
- Desktop (≥900px): layout horizontal seperti sekarang.
- Mobile: frame yang sama, layout vertikal (perosotan miring atau di-crop). Butuh versi `slide-track` untuk portrait dan jalur baru di `slidePath.ts`.
- Frame dimuat bertahap per section (lanjutan dari `preload.ts`) supaya halaman awal ringan.
