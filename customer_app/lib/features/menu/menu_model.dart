import 'package:cloud_firestore/cloud_firestore.dart';

class Category {
  final String id;
  final String name;

  Category({required this.id, required this.name});

  factory Category.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data() ?? {};
    return Category(id: doc.id, name: d['name'] ?? '');
  }
}

class Menu {
  final String id;
  final String categoryId;
  final String name;
  final String description;
  final int price;
  final String imageUrl;
  final bool isAvailable;
  final int minOrder;

  Menu({
    required this.id,
    required this.categoryId,
    required this.name,
    required this.description,
    required this.price,
    required this.imageUrl,
    required this.isAvailable,
    required this.minOrder,
  });

  factory Menu.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data() ?? {};
    return Menu(
      id: doc.id,
      categoryId: d['categoryId'] ?? '',
      name: d['name'] ?? '',
      description: d['description'] ?? '',
      price: (d['price'] as num?)?.toInt() ?? 0,
      imageUrl: d['imageUrl'] ?? '',
      isAvailable: d['isAvailable'] ?? false,
      minOrder: (d['minOrder'] as num?)?.toInt() ?? 1,
    );
  }
}