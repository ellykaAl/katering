import 'package:intl/intl.dart';

String formatRupiah(int amount) {
  return NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp',
    decimalDigits: 0,
  ).format(amount);
}

String formatTanggal(DateTime date) {
  return DateFormat('EEEE, d MMMM y', 'id_ID').format(date);
}

String formatTanggalWaktu(DateTime date) {
  return DateFormat('d MMM y, HH:mm', 'id_ID').format(date);
}