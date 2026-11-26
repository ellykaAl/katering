import 'package:flutter/material.dart';
import 'chat_page.dart';
import 'chat_service.dart';

/// Ikon chat dengan lencana jumlah pesan belum dibaca, untuk dipasang di AppBar.
class ChatButton extends StatefulWidget {
  const ChatButton({super.key});

  @override
  State<ChatButton> createState() => _ChatButtonState();
}

class _ChatButtonState extends State<ChatButton> {
  late final Stream<int> _unread;

  @override
  void initState() {
    super.initState();
    _unread = ChatService.instance.unreadCount();
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<int>(
      stream: _unread,
      builder: (context, snap) {
        final count = snap.data ?? 0;
        return IconButton(
          tooltip: 'Chat dengan penjual',
          icon: Badge(
            isLabelVisible: count > 0,
            label: Text('$count'),
            child: const Icon(Icons.chat_bubble_outline),
          ),
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const ChatPage()),
          ),
        );
      },
    );
  }
}