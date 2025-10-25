# Hướng dẫn tích hợp tính năng chuyển đổi ngôn ngữ

## Tổng quan
Tôi đã tích hợp tính năng chuyển đổi ngôn ngữ Tiếng Việt và Tiếng Anh vào ứng dụng PerHue Mobile App của bạn.

## Các thay đổi đã thực hiện:

### 1. Component LanguageSwitcher mới
- **File**: `components/LanguageSwitcher.js`
- **Chức năng**: Component hiển thị nút chuyển đổi ngôn ngữ với giao diện modal
- **Tính năng**:
  - Hiển thị cờ và mã ngôn ngữ hiện tại
  - Modal popup để chọn ngôn ngữ
  - Lưu lựa chọn ngôn ngữ vào AsyncStorage
  - Giao diện đẹp mắt với icon check cho ngôn ngữ đang chọn

### 2. Hook useLanguage
- **File**: `hooks/useLanguage.js`
- **Chức năng**: Hook để quản lý ngôn ngữ dễ dàng
- **API**:
  - `changeLanguage(languageCode)`: Thay đổi ngôn ngữ
  - `getCurrentLanguage()`: Lấy ngôn ngữ hiện tại
  - `isVietnamese()`: Kiểm tra có phải tiếng Việt
  - `isEnglish()`: Kiểm tra có phải tiếng Anh

### 3. Cập nhật cấu hình i18n
- **File**: `i18n.js`
- **Thay đổi**: 
  - Thêm AsyncStorage để lưu và tải ngôn ngữ đã chọn
  - Tự động khôi phục ngôn ngữ khi khởi động app

### 4. Cập nhật HamburgerMenu
- **File**: `components/HamburgerMenu.js`
- **Thay đổi**:
  - Thêm import LanguageSwitcher
  - Thêm section chuyển đổi ngôn ngữ ở cuối menu
  - Styling đẹp mắt với icon và label

### 5. Thêm key dịch mới
- **Files**: `locales/en.json`, `locales/vi.json`
- **Thêm các key**:
  - "Select Language" / "Chọn ngôn ngữ"
  - "Language" / "Ngôn ngữ"
  - "Settings" / "Cài đặt"
  - Và nhiều key khác cho giao diện

### 6. Cập nhật ApplicationRoot.js
- **File**: `ApplicationRoot.js`
- **Thay đổi**: Import i18n configuration ngay từ đầu

## Cách sử dụng:

### Cho người dùng cuối:
1. Mở hamburger menu (biểu tượng 3 gạch)
2. Cuộn xuống cuối menu
3. Nhấn vào section "Language" / "Ngôn ngữ"
4. Chọn ngôn ngữ mong muốn từ modal popup
5. Ngôn ngữ sẽ thay đổi ngay lập tức và được lưu lại

### Cho developer:
```javascript
// Sử dụng hook useLanguage
import useLanguage from '../hooks/useLanguage';

const MyComponent = () => {
  const { changeLanguage, currentLanguage, isVietnamese } = useLanguage();
  
  const switchToVietnamese = () => {
    changeLanguage('vi');
  };
  
  return (
    <View>
      <Text>Current language: {currentLanguage}</Text>
      {isVietnamese() ? <Text>Xin chào!</Text> : <Text>Hello!</Text>}
    </View>
  );
};
```

```javascript
// Sử dụng component LanguageSwitcher
import LanguageSwitcher from '../components/LanguageSwitcher';

const MyScreen = () => {
  return (
    <View>
      <LanguageSwitcher />
    </View>
  );
};
```

## Lưu ý cho newbie:

### 1. Cách thêm text cần dịch mới:
```javascript
// Trong component
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return <Text>{t('Your text key')}</Text>;
};
```

Sau đó thêm key vào file dịch:
```json
// locales/en.json
{
  "translation": {
    "Your text key": "Your English text"
  }
}

// locales/vi.json
{
  "translation": {
    "Your text key": "Văn bản tiếng Việt của bạn"
  }
}
```

### 2. Cấu trúc file dịch:
- Tất cả key dịch nằm trong object "translation"
- Key phải giống nhau trong cả 2 file en.json và vi.json
- Sử dụng cấu trúc flat (không nested) cho đơn giản

### 3. Best practices:
- Luôn sử dụng `t('key')` thay vì hard-code text
- Key nên có ý nghĩa rõ ràng và ngắn gọn
- Kiểm tra cả 2 ngôn ngữ sau khi thêm text mới

## Chạy thử nghiệm:

1. Khởi chạy ứng dụng:
```bash
npm start
# hoặc
yarn start
```

2. Chạy trên simulator/device:
```bash
npm run android
# hoặc
npm run ios
```

3. Kiểm tra tính năng:
- Mở hamburger menu
- Tìm phần "Language" ở cuối
- Thử chuyển đổi giữa tiếng Anh và tiếng Việt
- Kiểm tra xem text trong app có thay đổi không
- Thoát app và vào lại để kiểm tra ngôn ngữ có được lưu lại không

Tính năng đã sẵn sàng sử dụng! 🎉