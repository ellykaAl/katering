import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'chat_model.dart';

/// Kesalahan yang pesannya boleh langsung ditampilkan ke pelanggan.
class ChatException implements Exception {
  final String message;
  ChatException(this.message);

  @override
  String toString() => message;
}

/// Seluruh akses chat ada di kelas ini. Kalau nanti ingin pindah ke layanan
/// chat lain, cukup ganti isi kelas ini.
class ChatService {
  ChatService._();
  static final ChatService instance = ChatService._();

  static const int maxLength = 1000;

  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String? _cachedUid;
  String? _cachedName;

  DocumentReference<Map<String, dynamic>> _chatRef(String uid) =>
      _db.collection('chats').doc(uid);

  /// Pesan percakapan, terbaru di urutan pertama.
  Stream<List<ChatMessage>> messages() {
    final uid = _auth.currentUser?.uid;
    if (uid == null) return Stream.value(<ChatMessage>[]);

    return _chatRef(uid)
        .collection('messages')
        .orderBy('createdAt', descending: true)
        .limit(200)
        .snapshots()
        .map((snap) => snap.docs.map(ChatMessage.fromDoc).toList());
  }

  /// Jumlah pesan dari penjual yang belum dibaca.
  Stream<int> unreadCount() {
    final uid = _auth.currentUser?.uid;
    if (uid == null) return Stream.value(0);

    return _chatRef(uid).snapshots().map(
          (doc) => (doc.data()?['unreadForCustomer'] as num?)?.toInt() ?? 0,
        );
  }

  Future<String> _customerName(String uid) async {
    if (_cachedUid == uid && _cachedName != null) return _cachedName!;

    final doc = await _db.collection('users').doc(uid).get();
    final name = (doc.data()?['name'] as String?)?.trim();

    _cachedUid = uid;
    _cachedName = (name == null || name.isEmpty) ? 'Pelanggan' : name;
    return _cachedName!;
  }

  Future<void> sendMessage(String text) async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) {
      throw ChatException('Kamu harus login untuk mengirim pesan.');
    }

    final clean = text.trim();
    if (clean.isEmpty) return;
    if (clean.length > maxLength) {
      throw ChatException('Pesan terlalu panjang (maksimal $maxLength karakter).');
    }

    try {
      final name = await _customerName(uid);
      final chatRef = _chatRef(uid);
      final messageRef = chatRef.collection('messages').doc();
      final preview =
          clean.length > 120 ? '${clean.substring(0, 120)}…' : clean;

      final batch = _db.batch();

      batch.set(messageRef, {
        'text': clean,
        'senderId': uid,
        'senderRole': 'customer',
        'createdAt': FieldValue.serverTimestamp(),
      });

      batch.set(
        chatRef,
        {
          'customerId': uid,
          'customerName': name,
          'lastMessage': preview,
          'lastSender': 'customer',
          'lastMessageAt': FieldValue.serverTimestamp(),
          'unreadForAdmin': FieldValue.increment(1),
          'updatedAt': FieldValue.serverTimestamp(),
        },
        SetOptions(merge: true),
      );

      await batch.commit();
    } on FirebaseException catch (e) {
      if (e.code == 'permission-denied') {
        throw ChatException(
            'Pesan ditolak oleh aturan keamanan. Pastikan Security Rules terbaru sudah di-Publish.');
      }
      throw ChatException('Gagal mengirim pesan: ${e.message ?? e.code}');
    }
  }

  /// Menandai semua pesan dari penjual sebagai sudah dibaca.
  Future<void> markRead() async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) return;

    try {
      await _chatRef(uid).update({'unreadForCustomer': 0});
    } catch (_) {
      // Percakapan belum ada atau gagal: tidak masalah.
    }
  }
}