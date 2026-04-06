import os
import asyncio
import threading
import uuid
from flask import Flask
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import yt_dlp

# --- نظام منع الإيقاف (Keep Alive) ---
app = Flask('')
@app.route('/')
def home(): 
    return "البوت نشط ويعالج عدة طلبات!"

def run_flask():
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)

def start_keep_alive():
    threading.Thread(target=run_flask, daemon=True).start()

# --- إعدادات التحميل المحسنة ---
def get_ydl_options():
    """إنشاء خيارات جديدة لكل عملية تحميل لضمان تفرد الملف"""
    unique_id = str(uuid.uuid4())[:8]  # معرف فريد لكل عملية
    return {
        'format': 'best[ext=mp4]/best',  # تفضيل mp4
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
        'outtmpl': f'downloads/%(title)s_{unique_id}.%(ext)s',  # اسم فريد بالكامل
        'restrictfilenames': True,  # تجنب المشاكل في أسماء الملفات
    }

def sync_download(url, unique_id):
    """تحميل الفيديو مع معرف فريد"""
    ydl_opts = get_ydl_options()
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=True)
            # الحصول على مسار الملف المحمل فعلياً
            if 'entries' in info:  # قائمة تشغيل
                filename = ydl.prepare_filename(info['entries'][0])
            else:
                filename = ydl.prepare_filename(info)
            return filename
        except Exception as e:
            raise Exception(f"فشل التحميل: {str(e)}")

async def download_video(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text
    user_id = update.effective_user.id
    unique_id = str(uuid.uuid4())[:8]
    
    status_msg = await update.message.reply_text("⏳ جاري تحميل الفيديو... ⏳")

    try:
        # تشغيل التحميل في خيط منفصل
        loop = asyncio.get_event_loop()
        file_path = await loop.run_in_executor(None, sync_download, url, unique_id)

        # التأكد من وجود الملف
        if not os.path.exists(file_path):
            raise Exception("لم يتم العثور على الملف المحمل")

        # إرسال الفيديو مع شريط تقدم وهمي
        await status_msg.edit_text("📤 جاري رفع الفيديو إلى تيليجرام... قد يستغرق دقائق")
        
        # رفع الفيديو (مع إعادة المحاولة)
        max_retries = 3
        for attempt in range(max_retries):
            try:
                with open(file_path, 'rb') as video:
                    await update.message.reply_video(
                        video=video,
                        caption="✅ تم التحميل بنجاح!\nشكراً لاستخدام البوت 🎬",
                        supports_streaming=True
                    )
                break
            except Exception as upload_error:
                if attempt == max_retries - 1:
                    raise upload_error
                await asyncio.sleep(2)

        # حذف الملف فوراً بعد الرفع
        try:
            os.remove(file_path)
        except:
            pass

        await status_msg.delete()

    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        if "Private video" in error_msg:
            await status_msg.edit_text("❌ هذا الفيديو خاص ولا يمكن تحميله")
        elif "Video unavailable" in error_msg:
            await status_msg.edit_text("❌ الفيديو غير متوفر")
        else:
            await status_msg.edit_text(f"❌ خطأ في التحميل: {error_msg[:200]}")
    except Exception as e:
        await status_msg.edit_text(f"❌ حدث خطأ: {str(e)[:200]}")
        
        # محاولة تنظيف الملف في حالة الخطأ
        try:
            if 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
        except:
            pass

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome_msg = """
🎬 *مرحباً بك في بوت تحميل الفيديوهات!*

🎥 *الخصائص:*
• يدعم يوتيوب، انستقرام، تيك توك، تويتر
• تحميل سريع وجودة عالية
• يعمل مع عدة مستخدمين في نفس الوقت

📝 *الاستخدام:*
فقط أرسل الرابط وسأقوم بتحميل الفيديو لك!

💡 *ملاحظة:* يمكنك إرسال روابط متعددة وسيتم معالجتها بالترتيب
    """
    await update.message.reply_text(welcome_msg, parse_mode='Markdown')

def cleanup_old_files():
    """تنظيف الملفات القديمة (أكثر من ساعة)"""
    import time
    downloads_dir = 'downloads'
    if not os.path.exists(downloads_dir):
        return
    
    current_time = time.time()
    for filename in os.listdir(downloads_dir):
        file_path = os.path.join(downloads_dir, filename)
        try:
            # حذف الملفات الأقدم من ساعة
            if os.path.isfile(file_path) and (current_time - os.path.getctime(file_path)) > 3600:
                os.remove(file_path)
        except:
            pass

# --- الإعداد الأساسي ---
load_dotenv()
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

def main():
    # إنشاء مجلد التحميلات
    if not os.path.exists('downloads'): 
        os.makedirs('downloads')
    
    # تنظيف الملفات القديمة عند بدء التشغيل
    cleanup_old_files()
    
    # تشغيل نظام البقاء
    start_keep_alive()

    # تشغيل البوت مع دعم المعالجة المتوازية
    application = Application.builder()\
        .token(TOKEN)\
        .concurrent_updates(True)\
        .build()
    
    # إضافة المعالجات
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, download_video))

    print("✅ البوت يعمل الآن بنظام المعالجة المتعددة...")
    print(f"📁 مجلد التحميلات: {os.path.abspath('downloads')}")
    
    # تشغيل مهمة تنظيف دورية (كل ساعة)
    async def periodic_cleanup():
        while True:
            await asyncio.sleep(3600)
            cleanup_old_files()
    
    # تشغيل البوت
    application.run_polling()

if __name__ == '__main__':
    main()
