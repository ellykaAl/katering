import 'package:flutter/foundation.dart';
import '../menu/menu_model.dart';

class CartItem {
  final Menu menu;
  int quantity;

  CartItem({required this.menu, required this.quantity});

  int get subtotal => menu.price * quantity;
}

/// Keranjang belanja. Satu objek dipakai bersama di seluruh aplikasi.
/// Isinya tersimpan di memori, jadi hilang kalau aplikasi ditutup.
class CartService extends ChangeNotifier {
  CartService._();
  static final CartService instance = CartService._();

  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);

  bool get isEmpty => _items.isEmpty;

  int get totalPortions =>
      _items.fold(0, (sum, item) => sum + item.quantity);

  int get totalAmount =>
      _items.fold(0, (sum, item) => sum + item.subtotal);

  void add(Menu menu, int quantity) {
    final index = _items.indexWhere((i) => i.menu.id == menu.id);
    if (index >= 0) {
      _items[index].quantity += quantity;
    } else {
      _items.add(CartItem(menu: menu, quantity: quantity));
    }
    notifyListeners();
  }

  void setQuantity(String menuId, int quantity) {
    final index = _items.indexWhere((i) => i.menu.id == menuId);
    if (index < 0) return;
    _items[index].quantity = quantity;
    notifyListeners();
  }

  void remove(String menuId) {
    _items.removeWhere((i) => i.menu.id == menuId);
    notifyListeners();
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }
}