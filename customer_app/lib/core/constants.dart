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

/// Status awal pesanan.
const String kStatusMenungguPembayaran = 'Menunggu Pembayaran';