import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'firebase_options.dart';
import 'auth_gate.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  await initializeDateFormatting('id_ID');
  runApp(const KateringApp());
}

class KateringApp extends StatelessWidget {
  const KateringApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Katering',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF8FA98B), // hijau sage
        scaffoldBackgroundColor: const Color(0xFFFAF6EE), // krem
        useMaterial3: true,
      ),
      home: const AuthGate(),
    );
  }
}