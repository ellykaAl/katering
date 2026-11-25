import 'package:flutter/material.dart';
import 'cart_page.dart';
import 'cart_service.dart';

/// Ikon keranjang dengan angka jumlah jenis menu, untuk dipasang di AppBar.
class CartButton extends StatelessWidget {
  const CartButton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: CartService.instance,
      builder: (context, _) {
        final count = CartService.instance.items.length;
        return IconButton(
          tooltip: 'Keranjang',
          icon: Badge(
            isLabelVisible: count > 0,
            label: Text('$count'),
            child: const Icon(Icons.shopping_cart_outlined),
          ),
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const CartPage()),
          ),
        );
      },
    );
  }
}