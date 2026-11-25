import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/constants.dart';
import '../../core/format.dart';
import '../../shared/status_chip.dart';
import 'order_model.dart';
import 'order_repository.dart';

/// Bagian pembayaran di halaman detail pesanan:
/// - saat "Menunggu Pembayaran": info rekening + form unggah bukti
/// - setelah itu: ringkasan status pembayaran dan bukti yang dikirim
class PaymentSection extends StatefulWidget {
  final OrderModel order;

  const PaymentSection({super.key, required this.order});

  @override
  State<PaymentSection> createState() => _PaymentSectionState();
}

class _PaymentSectionState extends State<PaymentSection> {
  final OrderRepository _repo = OrderRepository();
  final TextEditingController _senderName = TextEditingController();

  late final Stream<PaymentInfo?> _paymentStream;
  late final Future<PaymentSettings?> _settingsFuture;

  Uint8List? _bytes;
  String _mimeType = 'image/jpeg';
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _paymentStream = _repo.payment(widget.order.id);
    _settingsFuture = _repo.paymentSettings();
    _senderName.text = widget.order.recipientName;
  }

  @override
  void dispose() {
    _senderName.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final file = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        maxWidth: 1280,
        maxHeight: 1280,
        imageQuality: 70,
      );
      if (file == null) return;

      final bytes = await file.readAsBytes();
      if (bytes.length > kMaxProofBytes) {
        setState(() {
          _error =
              'Ukuran foto masih terlalu besar (maksimal ${kMaxProofBytes ~/ 1024} KB). '
              'Coba pakai screenshot bukti transfer atau foto lain.';
        });
        return;
      }

      setState(() {
        _bytes = bytes;
        _mimeType = file.mimeType ?? 'image/jpeg';
        _error = null;
      });
    } catch (e) {
      setState(() => _error = 'Gagal memilih foto: $e');
    }
  }

  Future<void> _submit() async {
    if (_senderName.text.trim().isEmpty) {
      setState(() => _error = 'Isi nama pengirim transfer.');
      return;
    }
    if (_bytes == null) {
      setState(() => _error = 'Pilih foto bukti transfer dulu.');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      await _repo.submitPaymentProof(
        order: widget.order,
        bytes: _bytes!,
        mimeType: _mimeType,
        senderName: _senderName.text.trim(),
      );
      if (!mounted) return;
      setState(() => _bytes = null);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Bukti pembayaran terkirim. Menunggu verifikasi.')),
      );
    } on PaymentException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'Terjadi kesalahan: $e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = widget.order;

    if (order.status == kStatusDibatalkan) {
      return const SizedBox.shrink();
    }

    return StreamBuilder<PaymentInfo?>(
      stream: _paymentStream,
      builder: (context, snap) {
        final payment = snap.data;

        if (order.status == kStatusMenungguPembayaran) {
          return _buildPayForm(payment);
        }
        return _buildSummary(payment);
      },
    );
  }

  // ---------- Form pembayaran ----------

  Widget _buildPayForm(PaymentInfo? payment) {
    final order = widget.order;
    final rejected = payment != null && payment.status == kPayDitolak;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Pembayaran', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            if (rejected) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  payment.rejectionNote.isEmpty
                      ? 'Bukti pembayaran sebelumnya ditolak. Silakan kirim ulang.'
                      : 'Bukti pembayaran ditolak: ${payment.rejectionNote}. Silakan kirim ulang.',
                  style: TextStyle(color: Colors.red.shade800),
                ),
              ),
              const SizedBox(height: 12),
            ],
            const Text('Transfer sejumlah:'),
            Text(
              formatRupiah(order.totalAmount),
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            FutureBuilder<PaymentSettings?>(
              future: _settingsFuture,
              builder: (context, snap) {
                if (snap.connectionState != ConnectionState.done) {
                  return const LinearProgressIndicator();
                }
                final s = snap.data;
                if (snap.hasError || s == null) {
                  return const Text(
                    'Informasi rekening belum diatur. Hubungi penjual untuk nomor rekening.',
                    style: TextStyle(color: Colors.black54),
                  );
                }
                return Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.04),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s.bankName,
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 2),
                      SelectableText(
                        s.accountNumber,
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      Text('a.n. ${s.accountHolder}'),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _senderName,
              enabled: !_submitting,
              decoration: const InputDecoration(
                labelText: 'Nama pengirim transfer',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _submitting ? null : _pickImage,
              icon: const Icon(Icons.upload_file),
              label: Text(_bytes == null
                  ? 'Pilih foto bukti transfer'
                  : 'Ganti foto (${(_bytes!.length / 1024).round()} KB)'),
            ),
            if (_bytes != null) ...[
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxHeight: 260),
                  child: Image.memory(_bytes!, fit: BoxFit.contain),
                ),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(_error!,
                    style: TextStyle(color: Colors.red.shade800)),
              ),
            ],
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: FilledButton(
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Kirim Bukti Pembayaran'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------- Ringkasan setelah bukti dikirim ----------

  Widget _buildSummary(PaymentInfo? payment) {
    if (payment == null) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text('Pembayaran',
                      style: Theme.of(context).textTheme.titleMedium),
                ),
                StatusChip(status: payment.status),
              ],
            ),
            const SizedBox(height: 12),
            _line('Nama pengirim', payment.senderName),
            _line('Jumlah', formatRupiah(payment.amount)),
            if (payment.submittedAt != null)
              _line('Dikirim', formatTanggalWaktu(payment.submittedAt!)),
            if (payment.proofBase64.isNotEmpty) ...[
              const SizedBox(height: 12),
              _ProofImage(base64Data: payment.proofBase64),
            ],
          ],
        ),
      ),
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

class _ProofImage extends StatelessWidget {
  final String base64Data;

  const _ProofImage({required this.base64Data});

  @override
  Widget build(BuildContext context) {
    try {
      final bytes = base64Decode(base64Data);
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxHeight: 300),
          child: Image.memory(
            bytes,
            fit: BoxFit.contain,
            gaplessPlayback: true,
          ),
        ),
      );
    } catch (_) {
      return const Text('Bukti pembayaran tidak dapat ditampilkan.',
          style: TextStyle(color: Colors.black54));
    }
  }
}