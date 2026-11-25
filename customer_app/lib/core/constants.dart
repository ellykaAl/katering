class DeliverySlot {
  final String id;
  final String label;

  const DeliverySlot(this.id, this.label);
}

/// Pilihan jam pengiriman. Ubah di sini kalau jamnya berbeda.
const List<DeliverySlot> kDeliverySlots = [
  DeliverySlot('s1', '08.00 - 10.00'),
  DeliverySlot('s2', '10.00 - 12.00'),
  DeliverySlot('s3', '12.00 - 14.00'),
];

/// Pemesanan minimal H-berapa (2 = paling cepat 2 hari dari hari ini).
const int kMinDaysAhead = 2;

/// Kuota porsi per slot per hari, jika tidak diatur khusus di Firestore.
const int kDefaultMaxPortions = 100;

// ---------- Status pesanan ----------
const String kStatusMenungguPembayaran = 'Menunggu Pembayaran';
const String kStatusMenungguVerifikasi = 'Menunggu Verifikasi';
const String kStatusDikonfirmasi = 'Dikonfirmasi';
const String kStatusDiproses = 'Diproses';
const String kStatusDikirim = 'Dikirim';
const String kStatusSelesai = 'Selesai';
const String kStatusDibatalkan = 'Dibatalkan';

/// Urutan normal status pesanan (Dibatalkan berada di luar alur ini).
const List<String> kStatusFlow = [
  kStatusMenungguPembayaran,
  kStatusMenungguVerifikasi,
  kStatusDikonfirmasi,
  kStatusDiproses,
  kStatusDikirim,
  kStatusSelesai,
];

// ---------- Status pembayaran ----------
const String kPayMenungguVerifikasi = 'Menunggu Verifikasi';
const String kPayTerverifikasi = 'Terverifikasi';
const String kPayDitolak = 'Ditolak';

/// Ukuran maksimal foto bukti bayar (setelah dikompres).
const int kMaxProofBytes = 600 * 1024;