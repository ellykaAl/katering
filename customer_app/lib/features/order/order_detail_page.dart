import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../core/format.dart';
import '../../shared/status_chip.dart';
import 'order_model.dart';
import 'order_repository.dart';
import 'payment_section.dart';

class OrderDetailPage extends StatefulWidget {
  final String orderId;

  const OrderDetailPage({super.key, required this.orderId});

  @override
  State<OrderDetailPage> createState() => _OrderDetailPageState();
}

class _OrderDetailPageState extends State<OrderDetailPage> {
  final OrderRepository _repo = OrderRepository();
  late final Stream<OrderModel?> _orderStream;
  late final Stream<List<StatusLog>> _logStream;

  @override
  void initState() {
    super.initState();
    _orderStream = _repo.order(widget.orderId);
    _logStream = _repo.statusLogs(widget.orderId);
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<OrderModel?>(
      stream: _orderStream,
      builder: (context, snap) {
        if (snap.hasError) {
          return Scaffold(
            appBar: AppBar(title: const Text('Detail Pesanan')),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text('Gagal memuat pesanan: ${snap.error}'),
              ),
            ),
          );
        }
        if (snap.connectionState == ConnectionState.waiting) {
          return Scaffold(
            appBar: AppBar(title: const Text('Detail Pesanan')),
            body: const Center(child: CircularProgressIndicator()),
          );
        }

        final order = snap.data;
        if (order == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Detail Pesanan')),
            body: const Center(child: Text('Pesanan tidak ditemukan.')),
          );
        }

        return Scaffold(
          appBar: AppBar(title: Text(order.orderNumber)),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 640),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHeader(order),
                    const SizedBox(height: 12),
                    PaymentSection(order: order),
                    const SizedBox(height: 12),
                    _buildProgress(order),
                    const SizedBox(height: 12),
                    _buildDelivery(order),
                    const SizedBox(height: 12),
                    _buildItems(order),
                    const SizedBox(height: 12),
                    _buildHistory(order),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader(OrderModel order) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Nomor pesanan',
                      style: TextStyle(color: Colors.black54)),
                  SelectableText(
                    order.orderNumber,
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
            StatusChip(status: order.status),
          ],
        ),
      ),
    );
  }

  Widget _buildProgress(OrderModel order) {
    if (order.status == kStatusDibatalkan) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.red.shade50,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          'Pesanan ini dibatalkan.',
          style: TextStyle(
              color: Colors.red.shade800, fontWeight: FontWeight.w600),
        ),
      );
    }

    final current = kStatusFlow.indexOf(order.status);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Progres pesanan',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            for (var i = 0; i < kStatusFlow.length; i++)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Icon(
                      i <= current
                          ? Icons.check_circle
                          : Icons.radio_button_unchecked,
                      size: 20,
                      color: i <= current
                          ? Theme.of(context).colorScheme.primary
                          : Colors.black26,
                    ),
                    const SizedBox(width: 10),
                    Text(
                      kStatusFlow[i],
                      style: TextStyle(
                        fontWeight:
                            i == current ? FontWeight.bold : FontWeight.normal,
                        color: i > current ? Colors.black45 : null,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDelivery(OrderModel order) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Pengiriman', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            _line('Tanggal', formatTanggal(order.deliveryDate)),
            _line('Jam', order.deliveryTimeSlot),
            _line('Penerima', order.recipientName),
            _line('Telepon', order.recipientPhone),
            _line('Alamat', order.address),
            if (order.notes.isNotEmpty) _line('Catatan', order.notes),
          ],
        ),
      ),
    );
  }

  Widget _buildItems(OrderModel order) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Rincian pesanan',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            for (final item in order.items)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                          '${item.name}\n${item.quantity} x ${formatRupiah(item.price)}'),
                    ),
                    Text(formatRupiah(item.subtotal)),
                  ],
                ),
              ),
            const Divider(height: 24),
            Row(
              children: [
                Expanded(
                  child: Text('Total (${order.totalPortions} porsi)',
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                ),
                Text(
                  formatRupiah(order.totalAmount),
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistory(OrderModel order) {
    return StreamBuilder<List<StatusLog>>(
      stream: _logStream,
      builder: (context, snap) {
        final logs = snap.data ?? <StatusLog>[];

        final entries = <_HistoryEntry>[
          if (order.createdAt != null)
            _HistoryEntry('Pesanan dibuat', order.createdAt, ''),
          for (final l in logs) _HistoryEntry(l.toStatus, l.changedAt, l.note),
        ];

        if (entries.isEmpty) return const SizedBox.shrink();

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Riwayat status',
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                for (final e in entries)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(e.title,
                            style:
                                const TextStyle(fontWeight: FontWeight.w600)),
                        if (e.time != null)
                          Text(formatTanggalWaktu(e.time!),
                              style: const TextStyle(
                                  color: Colors.black54, fontSize: 12)),
                        if (e.note.isNotEmpty)
                          Text(e.note,
                              style: const TextStyle(
                                  color: Colors.black54, fontSize: 12)),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _line(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(label, style: const TextStyle(color: Colors.black54)),
          ),
          Expanded(
            flex: 3,
            child: Text(value,
                textAlign: TextAlign.right,
                style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

class _HistoryEntry {
  final String title;
  final DateTime? time;
  final String note;

  _HistoryEntry(this.title, this.time, this.note);
}