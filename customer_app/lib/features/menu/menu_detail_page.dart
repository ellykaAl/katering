import 'package:flutter/material.dart';
import '../../core/format.dart';
import '../../shared/menu_image.dart';
import 'menu_model.dart';

class MenuDetailPage extends StatelessWidget {
  final Menu menu;

  const MenuDetailPage({super.key, required this.menu});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(menu.name)),
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
                        style: Theme.of(context)
                            .textTheme
                            .titleLarge
                            ?.copyWith(
                              color: Theme.of(context).colorScheme.primary,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 12),
                      Chip(
                        label: Text(menu.isAvailable
                            ? 'Tersedia'
                            : 'Tidak tersedia'),
                      ),
                      const SizedBox(height: 16),
                      Text(menu.description.isEmpty
                          ? 'Belum ada deskripsi.'
                          : menu.description),
                      const SizedBox(height: 16),
                      Text('Minimal pemesanan: ${menu.minOrder} porsi'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}