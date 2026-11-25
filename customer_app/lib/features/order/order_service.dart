import 'dart:math';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import '../../core/constants.dart';
import '../cart/cart_service.dart';

/// Kesalahan yang pesannya boleh langsung ditampilkan ke pelanggan.
class OrderException implements Exception {
  final String message;
  OrderException(this.message);

  @override
  String toString() => message;
}

class OrderResult {
  final String orderNumber;
  final int totalAmount;

  OrderResult({required this.orderNumber, required this.totalAmount});
}

class OrderService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  static String dateKey(DateTime d) => DateFormat('yyyy-MM-dd').format(d);

  /// Sisa kuota porsi untuk tiap slot pada tanggal tertentu.
  Future<Map<String, int>> remainingPortions(DateTime date) async {
    final key = dateKey(date);
    final result = <String, int>{};

    for (final slot in kDeliverySlots) {
      final snap =
          await _db.collection('deliverySlots').doc('${key}_${slot.id}').get();
      final data = snap.data() ?? {};
      final used = (data['usedPortions'] as num?)?.toInt() ?? 0;
      final max = (data['maxPortions'] as num?)?.toInt() ?? kDefaultMaxPortions;
      result[slot.id] = max - used;
    }
    return result;
  }

  String _generateOrderNumber(DateTime now) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    final rnd = Random.secure();
    final suffix =
        List.generate(4, (_) => chars[rnd.nextInt(chars.length)]).join();
    return 'KTR-${DateFormat('yyyyMMdd').format(now)}-$suffix';
  }

  Future<OrderResult> createOrder({
    required List<CartItem> items,
    required String recipientName,
    required String recipientPhone,
    required String address,
    required String notes,
    required DateTime deliveryDate,
    required DeliverySlot slot,
  }) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw OrderException('Kamu harus login untuk memesan.');
    }
    if (items.isEmpty) {
      throw OrderException('Keranjang masih kosong.');
    }

    final now = DateTime.now();
    final earliest = DateTime(now.year, now.month, now.day)
        .add(const Duration(days: kMinDaysAhead));
    final dateOnly =
        DateTime(deliveryDate.year, deliveryDate.month, deliveryDate.day);
    if (dateOnly.isBefore(earliest)) {
      throw OrderException(
          'Pemesanan minimal H-$kMinDaysAhead sebelum tanggal pengiriman.');
    }

    final key = dateKey(dateOnly);
    final slotRef = _db.collection('deliverySlots').doc('${key}_${slot.id}');
    final orderRef = _db.collection('orders').doc();
    final orderNumber = _generateOrderNumber(now);
    var finalTotal = 0;

    try {
      await _db.runTransaction((tx) async {
        // 1. Semua pembacaan harus dilakukan sebelum penulisan.
        final menuSnaps = <DocumentSnapshot<Map<String, dynamic>>>[];
        for (final item in items) {
          menuSnaps.add(await tx.get(_db.collection('menus').doc(item.menu.id)));
        }
        final slotSnap = await tx.get(slotRef);

        // 2. Validasi tiap menu memakai data terbaru dari Firestore.
        final orderItems = <Map<String, dynamic>>[];
        var total = 0;
        var portions = 0;

        for (var i = 0; i < items.length; i++) {
          final item = items[i];
          final snap = menuSnaps[i];

          if (!snap.exists) {
            throw OrderException(
                'Menu "${item.menu.name}" sudah tidak tersedia di katalog.');
          }
          final d = snap.data()!;
          final name = (d['name'] as String?) ?? item.menu.name;

          if (d['isAvailable'] != true) {
            throw OrderException('Menu "$name" sedang tidak tersedia.');
          }

          final minOrder = (d['minOrder'] as num?)?.toInt() ?? 1;
          if (item.quantity < minOrder) {
            throw OrderException('Minimal pemesanan "$name" adalah $minOrder porsi.');
          }

          final price = (d['price'] as num?)?.toInt() ?? 0;
          final subtotal = price * item.quantity;

          orderItems.add({
            'menuId': item.menu.id,
            'name': name,
            'price': price,
            'quantity': item.quantity,
            'subtotal': subtotal,
          });
          total += subtotal;
          portions += item.quantity;
        }

        // 3. Cek kuota slot pengiriman.
        final slotData = slotSnap.data() ?? {};
        final used = (slotData['usedPortions'] as num?)?.toInt() ?? 0;
        final max =
            (slotData['maxPortions'] as num?)?.toInt() ?? kDefaultMaxPortions;
        final remaining = max - used;

        if (portions > remaining) {
          throw OrderException(
              'Kuota slot ${slot.label} tinggal ${remaining < 0 ? 0 : remaining} porsi. '
              'Kurangi jumlah pesanan atau pilih slot/tanggal lain.');
        }

        // 4. Tulis kuota dan pesanan sekaligus.
        tx.set(
          slotRef,
          {'usedPortions': used + portions},
          SetOptions(merge: true),
        );

        tx.set(orderRef, {
          'orderNumber': orderNumber,
          'customerId': user.uid,
          'recipientName': recipientName,
          'recipientPhone': recipientPhone,
          'address': address,
          'notes': notes,
          'deliveryDate': Timestamp.fromDate(dateOnly),
          'deliveryDateKey': key,
          'deliverySlotId': slot.id,
          'deliveryTimeSlot': slot.label,
          'items': orderItems,
          'totalPortions': portions,
          'totalAmount': total,
          'status': kStatusMenungguPembayaran,
          'createdAt': FieldValue.serverTimestamp(),
        });

        finalTotal = total;
      });
    } on OrderException {
      rethrow;
    } on FirebaseException catch (e) {
      if (e.code == 'permission-denied') {
        throw OrderException(
            'Pesanan ditolak oleh aturan keamanan. Pastikan Security Rules terbaru sudah di-Publish.');
      }
      throw OrderException('Gagal menyimpan pesanan: ${e.message ?? e.code}');
    }

    return OrderResult(orderNumber: orderNumber, totalAmount: finalTotal);
  }
}