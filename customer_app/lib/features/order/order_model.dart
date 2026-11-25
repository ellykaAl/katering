import 'package:cloud_firestore/cloud_firestore.dart';

DateTime? _toDate(dynamic value) {
  return value is Timestamp ? value.toDate() : null;
}

class OrderItem {
  final String menuId;
  final String name;
  final int price;
  final int quantity;
  final int subtotal;

  const OrderItem({
    required this.menuId,
    required this.name,
    required this.price,
    required this.quantity,
    required this.subtotal,
  });

  factory OrderItem.fromMap(Map<String, dynamic> m) {
    return OrderItem(
      menuId: m['menuId'] ?? '',
      name: m['name'] ?? '',
      price: (m['price'] as num?)?.toInt() ?? 0,
      quantity: (m['quantity'] as num?)?.toInt() ?? 0,
      subtotal: (m['subtotal'] as num?)?.toInt() ?? 0,
    );
  }
}

class OrderModel {
  final String id;
  final String orderNumber;
  final String customerId;
  final String recipientName;
  final String recipientPhone;
  final String address;
  final String notes;
  final DateTime deliveryDate;
  final String deliveryTimeSlot;
  final List<OrderItem> items;
  final int totalPortions;
  final int totalAmount;
  final String status;
  final DateTime? createdAt;

  const OrderModel({
    required this.id,
    required this.orderNumber,
    required this.customerId,
    required this.recipientName,
    required this.recipientPhone,
    required this.address,
    required this.notes,
    required this.deliveryDate,
    required this.deliveryTimeSlot,
    required this.items,
    required this.totalPortions,
    required this.totalAmount,
    required this.status,
    required this.createdAt,
  });

  factory OrderModel.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data() ?? {};
    final rawItems = (d['items'] as List?) ?? [];

    return OrderModel(
      id: doc.id,
      orderNumber: d['orderNumber'] ?? '',
      customerId: d['customerId'] ?? '',
      recipientName: d['recipientName'] ?? '',
      recipientPhone: d['recipientPhone'] ?? '',
      address: d['address'] ?? '',
      notes: d['notes'] ?? '',
      deliveryDate: _toDate(d['deliveryDate']) ?? DateTime.now(),
      deliveryTimeSlot: d['deliveryTimeSlot'] ?? '',
      items: rawItems
          .map((e) => OrderItem.fromMap(Map<String, dynamic>.from(e as Map)))
          .toList(),
      totalPortions: (d['totalPortions'] as num?)?.toInt() ?? 0,
      totalAmount: (d['totalAmount'] as num?)?.toInt() ?? 0,
      status: d['status'] ?? '',
      createdAt: _toDate(d['createdAt']),
    );
  }
}

class StatusLog {
  final String fromStatus;
  final String toStatus;
  final String note;
  final DateTime? changedAt;

  const StatusLog({
    required this.fromStatus,
    required this.toStatus,
    required this.note,
    required this.changedAt,
  });

  factory StatusLog.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data() ?? {};
    return StatusLog(
      fromStatus: d['fromStatus'] ?? '',
      toStatus: d['toStatus'] ?? '',
      note: d['note'] ?? '',
      changedAt: _toDate(d['changedAt']),
    );
  }
}

class PaymentInfo {
  final String orderId;
  final String status;
  final String senderName;
  final String proofBase64;
  final String rejectionNote;
  final int amount;
  final DateTime? submittedAt;

  const PaymentInfo({
    required this.orderId,
    required this.status,
    required this.senderName,
    required this.proofBase64,
    required this.rejectionNote,
    required this.amount,
    required this.submittedAt,
  });

  factory PaymentInfo.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data() ?? {};
    return PaymentInfo(
      orderId: doc.id,
      status: d['status'] ?? '',
      senderName: d['senderName'] ?? '',
      proofBase64: d['proofBase64'] ?? '',
      rejectionNote: d['rejectionNote'] ?? '',
      amount: (d['amount'] as num?)?.toInt() ?? 0,
      submittedAt: _toDate(d['submittedAt']),
    );
  }
}

class PaymentSettings {
  final String bankName;
  final String accountNumber;
  final String accountHolder;

  const PaymentSettings({
    required this.bankName,
    required this.accountNumber,
    required this.accountHolder,
  });

  factory PaymentSettings.fromMap(Map<String, dynamic> d) {
    return PaymentSettings(
      bankName: d['bankName'] ?? '',
      accountNumber: d['accountNumber'] ?? '',
      accountHolder: d['accountHolder'] ?? '',
    );
  }
}