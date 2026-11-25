import 'package:flutter/material.dart';
import '../../core/format.dart';
import '../../shared/menu_image.dart';
import '../../shared/quantity_stepper.dart';
import '../cart/cart_button.dart';
import '../cart/cart_page.dart';
import '../cart/cart_service.dart';
import 'menu_model.dart';

class MenuDetailPage extends StatefulWidget {
  final Menu menu;

  const MenuDetailPage({super.key, required this.menu});

  @override
  State<MenuDetailPage> createState() => _MenuDetailPageState();
}

class _MenuDetailPageState extends State<MenuDetailPage> {
  late int _quantity;

  @override
  void initState() {
    super.initState();
    _quantity = widget.menu.minOrder < 1 ? 1 : widget.menu.minOrder;
  }

  void _addToCart() {
    final menu = widget.menu;
    CartService.instance.add(menu, _quantity);

    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: Text('${menu.name} ($_quantity porsi) masuk keranjang'),
        action: SnackBarAction(
          label: 'Lihat',
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const CartPage()),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final menu = widget.menu;
    final minQty = menu.minOrder < 1 ? 1 : menu.minOrder;

    return Scaffold(
      appBar: AppBar(
        title: Text(menu.name),
        actions: const [CartButton()],
      ),
      body: SingleChildScrollView(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AspectRatio(
                  aspectRatio: 4 / 3,
                  child: MenuImage(url: menu.imageUrl),
                ),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(menu.name,
                          style: Theme.of(context).textTheme.headlineSmall),
                      const SizedBox(height: 8),
                      Text(
                        formatRupiah(menu.price),
                        style:
                            Theme.of(context).textTheme.titleLarge?.copyWith(
                                  color: Theme.of(context).colorScheme.primary,
                                  fontWeight: FontWeight.bold,
                                ),
                      ),
                      const SizedBox(height: 12),
                      Chip(
                        label: Text(
                            menu.isAvailable ? 'Tersedia' : 'Tidak tersedia'),
                      ),
                      const SizedBox(height: 16),
                      Text(menu.description.isEmpty
                          ? 'Belum ada deskripsi.'
                          : menu.description),
                      const SizedBox(height: 16),
                      Text('Minimal pemesanan: $minQty porsi'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Colors.black12)),
          ),
          child: menu.isAvailable
              ? Row(
                  children: [
                    QuantityStepper(
                      value: _quantity,
                      min: minQty,
                      onChanged: (v) => setState(() => _quantity = v),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: FilledButton(
                        onPressed: _addToCart,
                        child: Text(
                            'Tambah • ${formatRupiah(menu.price * _quantity)}'),
                      ),
                    ),
                  ],
                )
              : const SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: null,
                    child: Text('Menu tidak tersedia'),
                  ),
                ),
        ),
      ),
    );
  }
}