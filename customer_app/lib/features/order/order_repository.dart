import 'dart:convert';
import 'dart:typed_data';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/constants.dart';
import 'order_model.dart';

/// Kesalahan yang pesannya boleh langsung ditampilkan ke pelanggan.
class PaymentException implements Exception {
  final String message;
  PaymentException(this.message);

  @override
  String toString() => message;
}

class OrderRepository {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Semua pesanan milik pelanggan yang sedang login, terbaru di atas.
  Stream<List<OrderModel>> myOrders() {
    final uid = _auth.currentUser?.uid;
    if (uid == null) return Stream.value(<OrderModel>[]);

    return _db
        .collection('orders')
        .where('customerId', isEqualTo: uid)
        .snapshots()
        .map((snap) {
      final list = snap.docs.map(OrderModel.fromDoc).toList();
      // Diurutkan di sini supaya tidak perlu membuat index Firestore.
      list.sort((a, b) {
        final ad = a.createdAt ?? DateTime.now();
        final bd = b.createdAt ?? DateTime.now();
        return bd.compareTo(ad);
      });
      return list;
    });
  }

  Stream<OrderModel?> order(String orderId) {
    return _db.collection('orders').doc(orderId).snapshots().map(
          (doc) => doc.exists ? OrderModel.fromDoc(doc) : null,
        );
  }

  Stream<List<StatusLog>> statusLogs(String orderId) {
    return _db
        .collection('orders')
        .doc(orderId)
        .collection('statusLogs')
        .snapshots()
        .map((snap) {
      final list = snap.docs.map(StatusLog.fromDoc).toList();
      list.sort((a, b) {
        final ad = a.changedAt ?? DateTime.now();
        final bd = b.changedAt ?? DateTime.now();
        return ad.compareTo(bd);
      });
      return list;
    });
  }

  Stream<PaymentInfo?> payment(String orderId) {
    return _db.collection('payments').doc(orderId).snapshots().map(
          (doc) => doc.exists ? PaymentInfo.fromDoc(doc) : null,
        );
  }

  /// Info rekening tujuan transfer. Null kalau belum diatur pemilik.
  Future<PaymentSettings?> paymentSettings() async {
    final doc = await _db.collection('settings').doc('payment').get();
    final data = doc.data();
    if (data == null) return null;
    return PaymentSettings.fromMap(data);
  }

  /// Menyimpan bukti bayar, mengubah status pesanan menjadi
  /// "Menunggu Verifikasi", dan mencatat log, dalam satu batch.
  Future<void> submitPaymentProof({
    required OrderModel order,
    required Uint8List bytes,
    required String mimeType,
    required String senderName,
  }) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw PaymentException('Kamu harus login.');
    }
    if (bytes.length > kMaxProofBytes) {
      throw PaymentException(
          'Ukuran foto terlalu besar (maksimal ${kMaxProofBytes ~/ 1024} KB).');
    }
    if (order.status != kStatusMenungguPembayaran) {
      throw PaymentException(
          'Bukti bayar hanya bisa dikirim saat status "Menunggu Pembayaran".');
    }

    final orderRef = _db.collection('orders').doc(order.id);
    final paymentRef = _db.collection('payments').doc(order.id);
    final logRef = orderRef.collection('statusLogs').doc();

    final batch = _db.batch();

    batch.set(paymentRef, {
      'orderId': order.id,
      'customerId': user.uid,
      'amount': order.totalAmount,
      'senderName': senderName,
      'proofBase64': base64Encode(bytes),
      'mimeType': mimeType,
      'status': kPayMenungguVerifikasi,
      'submittedAt': FieldValue.serverTimestamp(),
    });

    batch.update(orderRef, {
      'status': kStatusMenungguVerifikasi,
      'paymentSubmittedAt': FieldValue.serverTimestamp(),
    });

    batch.set(logRef, {
      'fromStatus': kStatusMenungguPembayaran,
      'toStatus': kStatusMenungguVerifikasi,
      'changedBy': user.uid,
      'changedAt': FieldValue.serverTimestamp(),
      'note': 'Pelanggan mengirim bukti pembayaran',
    });

    try {
      await batch.commit();
    } on FirebaseException catch (e) {
      if (e.code == 'permission-denied') {
        throw PaymentException(
            'Ditolak oleh aturan keamanan. Pastikan Security Rules terbaru sudah di-Publish.');
      }
      throw PaymentException('Gagal mengirim bukti bayar: ${e.message ?? e.code}');
    }
  }
}