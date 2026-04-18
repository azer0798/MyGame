import os
import asyncio
import threading
import time
import signal
import sys
from flask import Flask, jsonify
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler
import yt_dlp
import logging

# تفعيل التسجيل لمراقبة الأخطاء
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# --- نظام منع الإيقاف المتقدم ---
app = Flask('')

@app.route('/')
def home():
    return jsonify({
        "status": "active",
        "message": "البوت يعمل بكفاءة عالية!",
        "uptime": time.time() - start_time
    })

@app.route('/health')
def health():
    return "OK", 200

def run_flask():
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port, threaded=True)

def start_keep_alive():
    threading.Thread(target=run_flask, daemon=True).start()

# --- إعدادات التحميل المحسنة لمنع الأعطال ---
def get_ydl_options(format_type='video', quality='best'):
    base_options = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'socket_timeout': 30,  # منع التوقف بسبب الشبكة
        'retries': 10,  # إعادة المحاولة عند الفشل
        'fragment_retries': 10,
        'skip_unavailable_fragments': True,
    }
    
    if format_type == 'audio':
        base_options.update({
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': 'downloads/audio/%(title)s_%(id)s.%(ext)s',
        })
    else:
        if quality == 'highest':
            format_spec = 'bestvideo+bestaudio/best'
        elif quality == 'lowest':
            format_spec = 'worstvideo+worstaudio/worst'
        else:
            format_spec = 'best'
            
        base_options.update({
            'format': format_spec,
            'merge_output_format': 'mp4',
            'outtmpl': 'downloads/video/%(title)s_%(id)s.%(ext)s',
        })
    
    return base_options

# --- وظائف التحميل مع إدارة الذاكرة ---
async def download_with_timeout(url, format_type, quality, timeout=120):
    """تحميل مع تحديد وقت أقصى"""
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(sync_download, url, format_type, quality),
            timeout=timeout
        )
    except asyncio.TimeoutError:
        raise Exception("انتهى وقت التحميل (أكثر من دقيقتين)")

def sync_download(url, format_type, quality):
    """تحميل متزامن مع تنظيف تلقائي"""
    ydl_opts = get_ydl_options(format_type, quality)
    
    if format_type == 'audio':
        os.makedirs('downloads/audio', exist_ok=True)
    else:
        os.makedirs('downloads/video', exist_ok=True)
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            
            if format_type == 'audio':
                filename = ydl.prepare_filename(info).replace('.webm', '.mp3').replace('.m4a', '.mp3')
            else:
                filename = ydl.prepare_filename(info)
            
            return filename, info
    except Exception as e:
        logger.error(f"خطأ في التحميل: {e}")
        raise

# --- معالجات البوت ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome_text = """
🎬 **مرحباً بك في بوت تحميل الفيديوهات!**

📌 **الميزات:**
• تحميل من يوتيوب، انستغرام، تيك توك، فيسبوك
• اختيار جودة التحميل
• تحميل الصوت فقط MP3
• سرعة عالية في التحميل

📖 **كيفية الاستخدام:**
1️⃣ أرسل رابط الفيديو
2️⃣ اختر الجودة المناسبة
3️⃣ انتظر التحميل والإرسال

⚡ **البوت يعمل 24/7**
"""
    await update.message.reply_text(welcome_text, parse_mode='Markdown')

async def handle_url(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text.strip()
    
    if not (url.startswith('http://') or url.startswith('https://')):
        await update.message.reply_text("❌ الرجاء إرسال رابط صحيح")
        return
    
    # حفظ الرابط للاستخدام لاحقاً
    context.user_data['last_url'] = url
    
    # قائمة الاختيارات
    keyboard = [
        [InlineKeyboardButton("🎥 أفضل جودة (4K/1080p)", callback_data=f"video_highest_{url[:50]}")],
        [InlineKeyboardButton("📱 جودة متوسطة (720p)", callback_data=f"video_best_{url[:50]}")],
        [InlineKeyboardButton("🎵 تحميل صوت فقط (MP3)", callback_data=f"audio_best_{url[:50]}")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🎬 **اختر جودة التحميل:**",
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )

async def handle_quality_selection(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    data = query.data.split('_', 2)
    if len(data) < 3:
        await query.message.edit_text("❌ حدث خطأ، حاول مرة أخرى")
        return
    
    format_type = data[0]
    quality = data[1]
    url = data[2]
    
    await query.message.edit_text(f"⏳ **جاري التحميل...**\nقد يستغرق 30-60 ثانية", parse_mode='Markdown')
    
    try:
        # تحميل مع وقت محدد
        file_path, info = await download_with_timeout(url, format_type, quality, timeout=90)
        
        # إرسال الملف
        if format_type == 'audio':
            with open(file_path, 'rb') as audio:
                await query.message.reply_audio(
                    audio=audio,
                    title=info.get('title', 'Audio')[:50],
                    caption="✅ تم التحميل بنجاح!"
                )
        else:
            with open(file_path, 'rb') as video:
                await query.message.reply_video(
                    video=video,
                    caption=f"✅ تم التحميل بنجاح!",
                    supports_streaming=True
                )
        
        # تنظيف
        if os.path.exists(file_path):
            os.remove(file_path)
        
        await query.message.edit_text("✅ **اكتمل التحميل!** أرسل رابط آخر", parse_mode='Markdown')
        
    except asyncio.TimeoutError:
        await query.message.edit_text("❌ **انتهى الوقت!** الرابط طويل جداً أو بطيء", parse_mode='Markdown')
    except Exception as e:
        logger.error(f"خطأ: {e}")
        await query.message.edit_text(f"❌ **حدث خطأ:**\n`{str(e)[:100]}`", parse_mode='Markdown')

# --- نظام مراقبة وإعادة تشغيل تلقائي ---
start_time = time.time()
last_activity = time.time()

async def health_check():
    """مراقبة صحة البوت"""
    while True:
        await asyncio.sleep(30)
        global last_activity
        now = time.time()
        
        # إذا لم توجد نشاط لمدة 5 دقائق، سجل فقط
        if now - last_activity > 300:
            logger.warning("لا يوجد نشاط لمدة 5 دقائق")

def signal_handler(signum, frame):
    """معالج إشارات الإيقاف"""
    logger.info("استلام إشارة إيقاف، يتم الخروج بشكل آمن...")
    sys.exit(0)

# --- التشغيل الرئيسي مع إعادة تشغيل تلقائي ---
async def run_bot():
    """تشغيل البوت مع إعادة تشغيل تلقائي عند الفشل"""
    load_dotenv()
    TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
    
    if not TOKEN:
        logger.error("لم يتم العثور على TOKEN!")
        return
    
    # إنشاء المجلدات
    os.makedirs('downloads/video', exist_ok=True)
    os.makedirs('downloads/audio', exist_ok=True)
    
    # إنشاء التطبيق
    application = Application.builder().token(TOKEN).concurrent_updates(True).build()
    
    # إضافة المعالجات
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_url))
    application.add_handler(CallbackQueryHandler(handle_quality_selection))
    
    # بدء مراقبة الصحة
    asyncio.create_task(health_check())
    
    logger.info("✅ البوت يعمل الآن...")
    
    # تشغيل مع إعادة محاولة تلقائية
    while True:
        try:
            await application.initialize()
            await application.start()
            await application.updater.start_polling()
            
            # انتظر حتى يتوقف البوت
            while True:
                await asyncio.sleep(1)
                
        except Exception as e:
            logger.error(f"توقف البوت: {e}")
            logger.info("إعادة التشغيل خلال 5 ثوان...")
            await asyncio.sleep(5)
            continue

def main():
    # معالج الإشارات
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # تشغيل نظام منع الإيقاف
    start_keep_alive()
    
    # تشغيل البوت
    asyncio.run(run_bot())

if __name__ == '__main__':
    main()
