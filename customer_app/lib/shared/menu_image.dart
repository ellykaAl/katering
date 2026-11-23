import 'package:flutter/material.dart';

class MenuImage extends StatelessWidget {
  final String url;
  final BoxFit fit;

  const MenuImage({super.key, required this.url, this.fit = BoxFit.cover});

  @override
  Widget build(BuildContext context) {
    final placeholder = Container(
      color: Colors.black12,
      alignment: Alignment.center,
      child: const Icon(Icons.restaurant, size: 40, color: Colors.black38),
    );

    if (url.isEmpty) return placeholder;

    return Image.network(
      url,
      fit: fit,
      width: double.infinity,
      height: double.infinity,
      errorBuilder: (context, error, stackTrace) => placeholder,
      loadingBuilder: (context, child, progress) {
        if (progress == null) return child;
        return const Center(child: CircularProgressIndicator(strokeWidth: 2));
      },
    );
  }
}