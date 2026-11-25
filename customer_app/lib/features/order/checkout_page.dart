import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../core/format.dart';
import '../cart/cart_service.dart';
import 'order_service.dart';
import 'order_success_page.dart';

class CheckoutPage extends StatefulWidget {
  const CheckoutPage({super.key});

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _address = TextEditingController();
  final _notes = TextEditingController();

  final CartService _cart = CartService.instance;
  final OrderService _orderService = OrderService();

  DateTime? _date;
  DeliverySlot? _slot;
  Map<String, int> _remaining = {};
  bool _loadingSlots = false;
  bool _submitting = false;
  String? _error;

  DateTime get _earliest {
    final n = DateTime.now();
    return DateTime(n.year, n.month, n.day)
        .add(const Duration(days: kMinDaysAhead));
  }

  @override
  void initState() {
    super.initState();
    _prefill();
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _address.dispose();
    _notes.dispose();
    super.dispose();
  }

  /// Mengisi nama dan telepon otomatis dari profil pelanggan.
  Future<void> _prefill() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    try {
      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .get();
      final d = doc.data();
      if (d == null || !mounted) return;
      setState(() {
        _name.text = (d['name'] as String?) ?? '';
        _phone.text = (d['phone'] as String?) ?? '';
      });
    } catch (_) {
      // Tidak masalah kalau gagal, pelanggan bisa mengetik sendiri.
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date ?? _earliest,
      firstDate: _earliest,
      lastDate: _earliest.add(const Duration(days: 60)),
      helpText: 'Pilih tanggal pengiriman',
    );
    if (picked == null) return;

    setState(() {
      _date = picked;
      _slot = null;
      _error = null;
      _loadingSlots = true;
    });

    try {
      final remaining = await _orderService.remainingPortions(picked);
      if (!mounted) return;
      setState(() {
        _remaining = remaining;
        _loadingSlots = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _remaining = {};
        _loadingSlots = false;
        _error = 'Gagal memuat kuota pengiriman. Coba pilih tanggal lagi.';
      });
    }
  }

  Future<void> _submit() async {
    final formOk = _formKey.currentState!.validate();
    if (_date == null || _slot == null) {
      setState(() => _error = 'Pilih tanggal dan jam pengiriman dulu.');
      return;
    }
    if (!formOk) return;

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final result = await _orderService.createOrder(
        items: _cart.items,
        recipientName: _name.text.trim(),
        recipientPhone: _phone.text.trim(),
        address: _address.text.trim(),
        notes: _notes.text.trim(),
        deliveryDate: _date!,
        slot: _slot!,
      );

      _cart.clear();
      if (!mounted) return;

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (_) => OrderSuccessPage(
            orderNumber: result.orderNumber,
            totalAmount: result.totalAmount,
            deliveryDate: _date!,
            slotLabel: _slot!.label,
          ),
        ),
        (route) => route.isFirst,
      );
    } on OrderException catch (e) {
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
    final totalPortions = _cart.totalPortions;

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _sectionTitle('Jadwal pengiriman'),
                  OutlinedButton.icon(
                    onPressed: _submitting ? null : _pickDate,
                    icon: const Icon(Icons.calendar_month),
                    label: Text(_date == null
                        ? 'Pilih tanggal (minimal H-$kMinDaysAhead)'
                        : formatTanggal(_date!)),
                  ),
                  const SizedBox(height: 12),
                  if (_date != null) ...[
                    const Text('Jam pengiriman'),
                    const SizedBox(height: 8),
                    if (_loadingSlots)
                      const Padding(
                        padding: EdgeInsets.all(8),
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    else
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          for (final slot in kDeliverySlots)
                            _slotChip(slot, totalPortions),
                        ],
                      ),
                  ],
                  const SizedBox(height: 24),
                  _sectionTitle('Data penerima'),
                  TextFormField(
                    controller: _name,
                    decoration: const InputDecoration(
                      labelText: 'Nama penerima',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty)
                        ? 'Nama wajib diisi'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _phone,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'No. telepon / WhatsApp',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) {
                      final cleaned =
                          (v ?? '').replaceAll(RegExp(r'[\s\-]'), '');
                      if (!RegExp(r'^\+?[0-9]{9,15}$').hasMatch(cleaned)) {
                        return 'Nomor telepon tidak valid';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _address,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Alamat pengiriman lengkap',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => (v == null || v.trim().length < 10)
                        ? 'Alamat minimal 10 karakter'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _notes,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Catatan (opsional)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 24),
                  _sectionTitle('Ringkasan pesanan'),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          for (final item in _cart.items)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Text(
                                        '${item.menu.name} x ${item.quantity}'),
                                  ),
                                  Text(formatRupiah(item.subtotal)),
                                ],
                              ),
                            ),
                          const Divider(height: 24),
                          Row(
                            children: [
                              Expanded(
                                child: Text('Total ($totalPortions porsi)',
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w600)),
                              ),
                              Text(
                                formatRupiah(_cart.totalAmount),
                                style: const TextStyle(
                                    fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Pembayaran dilakukan lewat transfer manual setelah pesanan dibuat.',
                    style: TextStyle(color: Colors.black54),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 16),
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
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: FilledButton(
                      onPressed: _submitting ? null : _submit,
                      child: _submitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Buat Pesanan'),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _sectionTitle(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(text, style: Theme.of(context).textTheme.titleMedium),
    );
  }

  Widget _slotChip(DeliverySlot slot, int totalPortions) {
    final remaining = _remaining[slot.id] ?? 0;
    final enough = remaining >= totalPortions;
    final text = remaining <= 0
        ? '${slot.label} (penuh)'
        : enough
            ? '${slot.label} (sisa $remaining porsi)'
            : '${slot.label} (sisa $remaining, kurang)';

    return ChoiceChip(
      label: Text(text),
      selected: _slot?.id == slot.id,
      onSelected: enough
          ? (_) => setState(() {
                _slot = slot;
                _error = null;
              })
          : null,
    );
  }
}