import 'package:cloud_firestore/cloud_firestore.dart';

class ChatMessage {
  final String id;
  final String text;

  /// 'customer' atau 'admin'.
  final String senderRole;

  /// Null selama pesan belum dikonfirmasi server.
  final DateTime? createdAt;

  const ChatMessage({
    required this.id,
    required this.text,
    required this.senderRole,
    required this.createdAt,
  });

  bool get isMine => senderRole == 'customer';

  factory ChatMessage.fromDoc(QueryDocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data();
    final ts = d['createdAt'];
    return ChatMessage(
      id: doc.id,
      text: d['text'] ?? '',
      senderRole: d['senderRole'] ?? '',
      createdAt: ts is Timestamp ? ts.toDate() : null,
    );
  }
}