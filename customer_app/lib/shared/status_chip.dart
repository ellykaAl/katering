import 'package:flutter/material.dart';
import '../core/constants.dart';

/// Label berwarna untuk status pesanan maupun status pembayaran.
class StatusChip extends StatelessWidget {
  final String status;

  const StatusChip({super.key, required this.status});

  Color get _color {
    switch (status) {
      case kStatusMenungguPembayaran:
        return Colors.orange.shade700;
      case kStatusMenungguVerifikasi:
        return Colors.blue.shade700;
      case kStatusDikonfirmasi:
      case kPayTerverifikasi:
        return Colors.teal.shade700;
      case kStatusDiproses:
        return Colors.indigo.shade600;
      case kStatusDikirim:
        return Colors.purple.shade600;
      case kStatusSelesai:
        return Colors.green.shade700;
      case kStatusDibatalkan:
      case kPayDitolak:
        return Colors.red.shade700;
      default:
        return Colors.grey.shade700;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _color;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}