import os
import time
import threading
import requests
from flask import Flask
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import yt_dlp

# --- إعداد خادم ويب بسيط ---
app = Flask('')

@app.route('/')
def home():
    return "البوت يعمل ونشط!"

def run_flask():
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)

# --- دالة التنشيط الذاتي (Self-Ping) ---
def ping_self():
    """هذه الدالة ترسل طلب للموقع نفسه كل 10 دقائق لمنع النوم"""
    # استبدل الرابط أدناه برابط موقعك على Render بعد نشره
    url = os.environ.get("RENDER_EXTERNAL_URL") 
    
    if not url:
        print("تحذير: لم يتم العثور على رابط الموقع في المتغيرات البيئية.")
        return

    while True:
        try:
            requests.get(url)
            print(f"تم إرسال نبضة تنشيط إلى: {url}")
        except Exception as e:
            print(f"خطأ في إرسال النبضة: {e}")
        
        time.sleep(600) # انتظر 10 دقائق (600 ثانية)

def start_keep_alive():
    # تشغيل خادم Flask في خيط منفصل
    threading.Thread(target=run_flask, daemon=True).start()
    # تشغيل دالة التنشيط الذاتي في خيط منفصل
    threading.Thread(target=ping_self, daemon=True).start()

# --- إعدادات البوت ---
load_dotenv()
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("أهلاً بك! أرسل الرابط وسأقوم بالتحميل.")

async def download_video(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text
    status = await update.message.reply_text("جاري المعالجة... ⏳")
    try:
        with yt_dlp.YoutubeDL({'format': 'best'}) as ydl:
            info = ydl.extract_info(url, download=True)
            file = ydl.prepare_filename(info)
        
        await update.message.reply_video(video=open(file, 'rb'))
        os.remove(file)
        await status.delete()
    except Exception as e:
        await status.edit_text(f"خطأ: {str(e)}")

def main():
    # تشغيل نظام منع الإيقاف
    start_keep_alive()

    app_telegram = Application.builder().token(TOKEN).build()
    app_telegram.add_handler(CommandHandler("start", start))
    app_telegram.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, download_video))

    print("البوت قيد التشغيل...")
    app_telegram.run_polling()

if __name__ == '__main__':
    main()
