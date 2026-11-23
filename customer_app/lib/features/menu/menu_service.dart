import 'package:cloud_firestore/cloud_firestore.dart';
import 'menu_model.dart';

class MenuService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<List<Category>> categories() {
    return _db
        .collection('categories')
        .orderBy('name')
        .snapshots()
        .map((snapshot) => snapshot.docs.map(Category.fromDoc).toList());
  }

  Stream<List<Menu>> menus() {
    return _db
        .collection('menus')
        .orderBy('name')
        .snapshots()
        .map((snapshot) => snapshot.docs.map(Menu.fromDoc).toList());
  }
}