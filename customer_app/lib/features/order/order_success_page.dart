import 'package:flutter/material.dart';
import '../../core/format.dart';
import 'orders_page.dart';

class OrderSuccessPage extends StatelessWidget {
  final String orderNumber;
  final int totalAmount;
  final DateTime deliveryDate;
  final String slotLabel;

  const OrderSuccessPage({
    super.key,
    required this.orderNumber,
    required this.totalAmount,
    required this.deliveryDate,
    required this.slotLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pesanan Dibuat'),
        automaticallyImplyLeading: false,
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check_circle,
                    size: 80, color: Theme.of(context).colorScheme.primary),
                const SizedBox(height: 16),
                Text('Pesanan berhasil dibuat',
                    style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 24),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        _row('Nomor pesanan', orderNumber),
                        _row('Tanggal kirim', formatTanggal(deliveryDate)),
                        _row('Jam kirim', slotLabel),
                        _row('Total', formatRupiah(totalAmount)),
                        _row('Status', 'Menunggu Pembayaran'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Langkah berikutnya: buka pesananmu, transfer sesuai total, lalu unggah bukti pembayaran.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.black54),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const OrdersPage()),
                    ),
                    child: const Text('Lihat Pesanan & Bayar'),
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () =>
                        Navigator.of(context).popUntil((r) => r.isFirst),
                    child: const Text('Kembali ke Menu'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(label, style: const TextStyle(color: Colors.black54)),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}