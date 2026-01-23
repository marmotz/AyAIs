# AiLine - Pitch

## Concept

Application desktop cross-plateforme (Windows, Mac, Linux) avec raccourci global OS configurable pour afficher/masquer l'application.

Intègre un navigateur interne permettant d'afficher les sites des IA du marché.

UI : Icônes latérales (aux couleurs de chaque IA) + contenu du site à droite.

Permet d'accéder rapidement aux différentes apps d'IA (ChatGPT, Gemini, Claude, Mistral, etc.) et de switcher facilement entre elles.

## Objectif

Avoir l'IA toujours à portée de main.

## Modèle

Gratuit et open source.

## Stack technique

- Electron
- Angular
- PrimeNG
- TailwindCSS

## UI / Architecture

- Multiview: barre de navigation latérale à gauche avec des icônes colorées pour chaque IA; à droite, le site chargé selon l'icône sélectionnée.
- Persistance des sessions navigateur intégrée et possibilités de bascule rapide entre IA via l'interface.

## IA supportées (MVP)

- ChatGPT
- Claude
- Gemini

(Autres : DeepSeek, Perplexity, etc. à ajouter après)

## MVP - Fonctionnalités

- Raccourci global OS configurable
- Multiview avec barre de navigation latérale et contenu IA chargé à droite (bascule rapide entre IA via icônes)
- Navigateur intégré avec sessions persistantes (cookies)
- Fenêtre standard redimensionnable et déplaçable
- Thème : light, dark, auto (selon système)
- Lancement au démarrage configurable
- Pas de features supplémentaires (history, bookmarks, etc.) - les IA gèrent déjà leur propre historique
