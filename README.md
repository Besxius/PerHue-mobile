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
* Giải nén NDK vào thư mục Android SDK (mặc định: `C:\Users\<username>\AppData\Local\Android\Sdk\ndk\26.1.10909125`) (nếu chưa có đường dẫn trên thì tạo mới)
* Thêm `platform-tools` vào PATH để dùng ADB (tải [tại đây](https://developer.android.com/tools/releases/platform-tools?hl=vi)):

---

## 2️⃣ Clone project & cài dependencies

```powershell
git clone <repo-url>
cd <project-folder>
yarn install
```

---

## 3️⃣ Run project

`Trước khi run project thì cần phải copy debug.keystore vào thư mục android/app (liên hệ dhung để lấy file này)`

### 3.1 Start Metro bundler

```powershell
yarn start
```

### 3.2 Build & chạy Android

```powershell
yarn android
```

* Nếu lỗi `No matching client found for package name` → kiểm tra Firebase.
* Nếu lỗi `Could not move temporary workspace` → xóa `.gradle` (xem bước 3).