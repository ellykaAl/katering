import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Pengatur jumlah porsi: tombol -, angka, tombol +.
/// Ketuk angkanya untuk mengetik jumlah langsung.
class QuantityStepper extends StatelessWidget {
  final int value;
  final int min;
  final ValueChanged<int> onChanged;

  const QuantityStepper({
    super.key,
    required this.value,
    required this.min,
    required this.onChanged,
  });

  Future<void> _editManually(BuildContext context) async {
    final controller = TextEditingController(text: '$value');

    final result = await showDialog<int>(
      context: context,
      builder: (dialogContext) {
        String? error;
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Jumlah porsi'),
              content: TextField(
                controller: controller,
                autofocus: true,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: InputDecoration(
                  helperText: 'Minimal $min porsi',
                  errorText: error,
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  child: const Text('Batal'),
                ),
                FilledButton(
                  onPressed: () {
                    final v = int.tryParse(controller.text);
                    if (v == null || v < min) {
                      setDialogState(() => error = 'Minimal $min porsi');
                      return;
                    }
                    if (v > 1000) {
                      setDialogState(() => error = 'Maksimal 1000 porsi');
                      return;
                    }
                    Navigator.pop(dialogContext, v);
                  },
                  child: const Text('OK'),
                ),
              ],
            );
          },
        );
      },
    );

    if (result != null) onChanged(result);
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          tooltip: 'Kurangi',
          icon: const Icon(Icons.remove_circle_outline),
          onPressed: value > min ? () => onChanged(value - 1) : null,
        ),
        InkWell(
          onTap: () => _editManually(context),
          borderRadius: BorderRadius.circular(8),
          child: Container(
            constraints: const BoxConstraints(minWidth: 44),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            alignment: Alignment.center,
            child: Text(
              '$value',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ),
        ),
        IconButton(
          tooltip: 'Tambah',
          icon: const Icon(Icons.add_circle_outline),
          onPressed: value < 1000 ? () => onChanged(value + 1) : null,
        ),
      ],
    );
  }
}