# PerHue Mobile Application Client

## Overview
PerHue Mobile is the official cross-platform mobile client for the PerHue personal color analysis ecosystem. Designed to deliver an immersive and responsive user experience, the application provides users with AI-powered color detection, interactive color testing, virtual try-on environments, and a comprehensive portal to connect with professional styling consultants. The application is built using React Native and TypeScript, ensuring a highly maintainable, type-safe, and modular codebase.

## Key Features
* **AI-Driven Color Assessment:** Utilizes the device's native camera capabilities to capture high-quality images for automated personal color palette identification via the integrated backend.
* **Interactive Color Testing:** Features dedicated on-image testing modules allowing users to visualize and analyze tonal variations dynamically.
* **Capsule Wardrobe and Palette Management:** Allows users to view, manage, and retrieve customized personal color palettes and capsule wardrobe collections synced in real time.
* **Consultant Booking and Review Network:** Provides an interface for users to browse expert profiles, request detailed personal color analyses, and view historical consultation reports.
* **Cross-Platform Push Notifications:** Integrated with Firebase Cloud Messaging (FCM) to handle transactional alerts, subscription reminders, and real-time expert evaluation status updates.
* **Secure Enterprise Authentication:** Multi-option authentication architecture supporting standard email/password contexts alongside secure Google OAuth social logins.
* **Commercial Tier and Payment Operations:** Comprehensive support for viewing premium service tiers, service packages, and executing payment workflows linked directly to commercial gateways.

## Technology Stack
* **Core Framework:** React Native 
* **Programming Language:** TypeScript (Type-safe compilation and strict interface modeling)
* **Navigation Architecture:** React Navigation (Native stack and tab-based navigation flows)
* **Network Integration:** Axios-based central API client handling automated JWT interceptors and refresh tokens
* **Push Notifications:** Firebase Cloud Messaging (FCM) Client SDK
* **State Management:** React Context API (Managing global authentication state and user sessions)

---

## Directory Structure
```text
├── src/
│   ├── api/                 # Centralized HTTP clients, authentication contexts, and endpoints
│   │   ├── config/          # Third-party configuration files (Google Auth, etc.)
│   │   └── apiClient.ts     # Core API connector configuration with request interceptors
│   ├── components/          # Reusable structural and presenting UI components
│   ├── navigation/          # Route definitions, including Auth and Main application stacks
│   ├── screens/             # High-level feature layouts
│   │   ├── auth/            # Login, registration, and credential recovery interfaces
│   │   ├── CameraScreen.tsx # Device camera interface for image procurement
│   │   └── ...              # Functional dashboards (Capsule, History, Payments, Expert details)
│   ├── services/            # Native device services, background tasks, and FCM handlers
│   └── types/               # TypeScript interface configurations and operational domain schemas
├── App.tsx                  # Application bootstrap layer and global context providers
├── app.json                 # Native application configuration and asset definitions
└── tsconfig.json            # TypeScript compile configurations
