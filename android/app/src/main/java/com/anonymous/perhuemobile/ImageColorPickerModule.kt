package com.anonymous.perhuemobile

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.facebook.react.bridge.*
import java.io.InputStream
import kotlin.math.floor
import kotlin.math.min

class ImageColorPickerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ImageColorPicker"
    }

    @ReactMethod
    fun getPixelColor(uriString: String, x: Double, y: Double, containerWidth: Double, containerHeight: Double, promise: Promise) {
        val reactContext = reactApplicationContext

        // Đảm bảo chạy logic tốn thời gian trên luồng background
        Thread {
            try {
                val uri = Uri.parse(uriString)
                val inputStream: InputStream? = reactContext.contentResolver.openInputStream(uri)
                val bitmap: Bitmap? = BitmapFactory.decodeStream(inputStream)

                if (bitmap == null) {
                    promise.reject("LOAD_FAILED", "Không thể tải hoặc giải mã ảnh từ URI.")
                    return@Thread
                }

                // --- BƯỚC 1: Xử lý Tọa độ (resizeMode: 'contain') ---

                val imageWidth = bitmap.width.toDouble()
                val imageHeight = bitmap.height.toDouble()

                val ratioX = containerWidth / imageWidth
                val ratioY = containerHeight / imageHeight
                val scaleFactor = min(ratioX, ratioY)

                val scaledWidth = imageWidth * scaleFactor
                val scaledHeight = imageHeight * scaleFactor

                val offsetX = (containerWidth - scaledWidth) / 2
                val offsetY = (containerHeight - scaledHeight) / 2

                val xOnImageContainer = x - offsetX
                val yOnImageContainer = y - offsetY

                if (xOnImageContainer < 0 || yOnImageContainer < 0 ||
                    xOnImageContainer > scaledWidth || yOnImageContainer > scaledHeight) {
                    promise.reject("OUT_OF_BOUNDS", "Tọa độ nằm ngoài phạm vi ảnh đã tải.")
                    bitmap.recycle()
                    return@Thread
                }

                // Tọa độ pixel trên ảnh gốc
                val pixelX = floor(xOnImageContainer / scaleFactor).toInt()
                val pixelY = floor(yOnImageContainer / scaleFactor).toInt()

                if (pixelX < 0 || pixelY < 0 || pixelX >= bitmap.width || pixelY >= bitmap.height) {
                    promise.reject("PIXEL_OUT_OF_BOUNDS", "Lỗi tính toán tọa độ pixel.")
                    bitmap.recycle()
                    return@Thread
                }

                // --- BƯỚC 2: Đọc màu Pixel ---
                val pixel = bitmap.getPixel(pixelX, pixelY)
                bitmap.recycle() // Giải phóng bộ nhớ

                val r = (pixel shr 16) and 0xff
                val g = (pixel shr 8) and 0xff
                val b = pixel and 0xff

                val hexColor = String.format("#%02x%02x%02x", r, g, b)
                promise.resolve(hexColor)

            } catch (e: Exception) {
                promise.reject("UNKNOWN_ERROR", "Lỗi không xác định khi đọc màu pixel: ${e.message}", e)
            }
        }.start()
    }
}