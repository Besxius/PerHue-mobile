# Hướng dẫn chạy project React Native (Yarn + Corepack + Android)

## 1️⃣ Cài đặt môi trường cơ bản

### 1.1 Node.js & Corepack

* Cài Node.js (>=16) từ [nodejs.org](https://nodejs.org/)
* Kích hoạt Corepack (quản lý Yarn/PNPM):

```powershell
corepack enable
corepack prepare yarn@stable --activate
```

* Kiểm tra phiên bản:

```powershell
node -v
yarn -v
corepack -v
```

---

### 1.2 Android Studio & SDK

* Tải Native Development Kit (NDK) từ [đây](https://dl.google.com/android/repository/android-ndk-r26b-windows.zip)
* Thêm `platform-tools` vào PATH để dùng ADB (tải [tại đây](https://developer.android.com/tools/releases/platform-tools?hl=vi)):

---

## 2️⃣ Clone project & cài dependencies

```powershell
git clone <repo-url>
cd <project-folder>
yarn install
```

---

## 3️⃣ Xử lý cache nếu gặp lỗi build

### 3.1 Xóa thư mục .gradle trong android/ và sau đó chạy:

```powershell
./gradlew clean
```

---


## 4️⃣ Chạy project

### 4.1 Start Metro bundler

```powershell
yarn start
```

### 4.2 Build & chạy Android

```powershell
yarn android
```

* Nếu lỗi `No matching client found for package name` → kiểm tra Firebase.
* Nếu lỗi `Could not move temporary workspace` → xóa `.gradle` (xem bước 3).