import os
import asyncio
import threading
import requests
from flask import Flask
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import yt_dlp

# --- نظام منع الإيقاف (Keep Alive) ---
app = Flask('')
@app.route('/')
def home(): return "البوت نشط ويعالج عدة طلبات!"

def run_flask():
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)

def start_keep_alive():
    threading.Thread(target=run_flask, daemon=True).start()

# --- إعدادات التحميل الاحترافية ---
# قمنا بإضافة نظام الترقيم العشوائي لأسماء الملفات لتجنب تداخل ملفات المستخدمين
YDL_OPTIONS = {
    'format': 'best',
    'noplaylist': True,
    'quiet': True,
    'outtmpl': 'downloads/%(id)s_%(timestamp)s.%(ext)s', # اسم ملف فريد لكل عملية
}

# دالة التحميل (Blocking function)
def sync_download(url):
    with yt_dlp.YoutubeDL(YDL_OPTIONS) as ydl:
        info = ydl.extract_info(url, download=True)
        return ydl.prepare_filename(info)

async def download_video(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text
    user_id = update.effective_user.id
    status = await update.message.reply_text("⏳ جاري بدء التحميل... يمكنك إرسال روابط أخرى!")

    try:
        # تشغيل التحميل في خيط منفصل (Thread) لعدم تعطيل البوت عن المستخدمين الآخرين
        loop = asyncio.get_event_loop()
        file_path = await loop.run_in_executor(None, sync_download, url)

        # إرسال الفيديو (هذه العملية غير متزامنة ولا تعطل البوت)
        with open(file_path, 'rb') as video:
            await update.message.reply_video(video=video, caption="✅ تم التحميل بنجاح!")
        
        # تنظيف الملفات فوراً
        if os.path.exists(file_path):
            os.remove(file_path)
        await status.delete()

    except Exception as e:
        await status.edit_text(f"❌ حدث خطأ: {str(e)}")

# --- الإعداد الأساسي ---
load_dotenv()
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

def main():
    if not os.path.exists('downloads'): os.makedirs('downloads')
    start_keep_alive()

    # تشغيل البوت بنظام القوى القصوى
    application = Application.builder().token(TOKEN).concurrent_updates(True).build()
    
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, download_video))

    print("البوت يعمل الآن بنظام المعالجة المتعددة...")
    application.run_polling()

if __name__ == '__main__':
    main()
