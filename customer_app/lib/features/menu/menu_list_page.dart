import 'package:flutter/material.dart';
import '../../auth_service.dart';
import '../../core/format.dart';
import '../../shared/menu_image.dart';
import 'menu_detail_page.dart';
import 'menu_model.dart';
import 'menu_service.dart';

class MenuListPage extends StatefulWidget {
  const MenuListPage({super.key});

  @override
  State<MenuListPage> createState() => _MenuListPageState();
}

class _MenuListPageState extends State<MenuListPage> {
  final MenuService _service = MenuService();
  String? _selectedCategoryId; // null = semua kategori

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Menu Katering'),
        actions: [
          IconButton(
            tooltip: 'Keluar',
            icon: const Icon(Icons.logout),
            onPressed: () => AuthService().logout(),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildCategoryFilter(),
          Expanded(child: _buildMenuGrid()),
        ],
      ),
    );
  }

  Widget _buildCategoryFilter() {
    return StreamBuilder<List<Category>>(
      stream: _service.categories(),
      builder: (context, snap) {
        final categories = snap.data ?? [];
        return SizedBox(
          height: 56,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: const Text('Semua'),
                  selected: _selectedCategoryId == null,
                  onSelected: (_) => setState(() => _selectedCategoryId = null),
                ),
              ),
              for (final c in categories)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(c.name),
                    selected: _selectedCategoryId == c.id,
                    onSelected: (_) =>
                        setState(() => _selectedCategoryId = c.id),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMenuGrid() {
    return StreamBuilder<List<Menu>>(
      stream: _service.menus(),
      builder: (context, snap) {
        if (snap.hasError) {
          return Center(child: Text('Gagal memuat menu: ${snap.error}'));
        }
        if (!snap.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final all = snap.data!;
        final menus = _selectedCategoryId == null
            ? all
            : all.where((m) => m.categoryId == _selectedCategoryId).toList();

        if (menus.isEmpty) {
          return const Center(child: Text('Belum ada menu.'));
        }

        return GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
            maxCrossAxisExtent: 260,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 0.75,
          ),
          itemCount: menus.length,
          itemBuilder: (context, i) => _MenuCard(
            menu: menus[i],
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => MenuDetailPage(menu: menus[i]),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _MenuCard extends StatelessWidget {
  final Menu menu;
  final VoidCallback onTap;

  const _MenuCard({required this.menu, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      elevation: 1,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  MenuImage(url: menu.imageUrl),
                  if (!menu.isAvailable)
                    Container(
                      color: Colors.black54,
                      alignment: Alignment.center,
                      child: const Text(
                        'Tidak tersedia',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    menu.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    formatRupiah(menu.price),
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}