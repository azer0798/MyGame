import os
import asyncio
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import yt_dlp

# تحميل المتغيرات من ملف .env
load_dotenv()
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

# إعدادات yt-dlp للتحميل بأفضل جودة
YDL_OPTIONS = {
    'format': 'best',
    'noplaylist': True,
    'quiet': True,
    'outtmpl': 'downloads/%(title)s.%(ext)s',
}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("أهلاً بك! أرسل لي رابط الفيديو من أي موقع وسأقوم بتحميله لك.")

async def download_video(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text
    status_msg = await update.message.reply_text("جاري معالجة الرابط، يرجى الانتظار... ⏳")

    try:
        # إنشاء مجلد للتحميلات إذا لم يكن موجوداً
        if not os.path.exists('downloads'):
            os.makedirs('downloads')

        with yt_dlp.YoutubeDL(YDL_OPTIONS) as ydl:
            # استخراج معلومات الفيديو والتحميل
            info = ydl.extract_info(url, download=True)
            video_file = ydl.prepare_filename(info)

        # إرسال الفيديو للمستخدم
        await update.message.reply_video(video=open(video_file, 'rb'), caption=f"تم التحميل بنجاح: {info.get('title')}")
        
        # حذف الملف من السيرفر بعد الإرسال لتوفير المساحة
        os.remove(video_file)
        await status_msg.delete()

    except Exception as e:
        await status_msg.edit_text(f"عذراً، حدث خطأ أثناء التحميل: {str(e)}")

def main():
    if not TOKEN:
        print("خطأ: لم يتم العثور على TELEGRAM_BOT_TOKEN في ملف .env")
        return

    # بناء التطبيق
    application = Application.builder().token(TOKEN).build()

    # إضافة الأوامر والمستقبلات
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, download_video))

    print("البوت يعمل الآن...")
    application.run_polling()

if __name__ == '__main__':
    main()
