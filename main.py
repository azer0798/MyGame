import os
import asyncio
import threading
import re
import hashlib
from flask import Flask, jsonify
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler
import yt_dlp
import logging

# تفعيل التسجيل
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

app = Flask('')

@app.route('/')
def home():
    return jsonify({"status": "active", "message": "البوت يعمل"})

def run_flask():
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)

def start_keep_alive():
    threading.Thread(target=run_flask, daemon=True).start()

# --- دالة لتقصير اسم الملف ---
def sanitize_filename(title, max_length=50):
    """
    تنظيف وتقصير اسم الملف
    إزالة الرموز غير المسموحة وتقصير الطول
    """
    # إزالة الرموز غير المسموحة في أسماء الملفات
    title = re.sub(r'[<>:"/\\|?*]', '', title)
    # إزالة المسافات الزائدة
    title = re.sub(r'\s+', ' ', title).strip()
    # إزالة الكلمات المكررة والمشاهدات
    title = re.sub(r'\d+[\s,]*views?', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\d+[\s,]*reactions?', '', title, flags=re.IGNORECASE)
    
    # تقصير الطول إذا كان طويلاً
    if len(title) > max_length:
        # أخذ أول max_length حرف
        title = title[:max_length]
        # إزالة الكلمات غير المكتملة في النهاية
        last_space = title.rfind(' ')
        if last_space > max_length // 2:
            title = title[:last_space]
    
    return title

def generate_unique_filename(video_id, title, format_type='video'):
    """
    إنشاء اسم ملف فريد باستخدام ID الفيديو
    """
    # تنظيف العنوان
    clean_title = sanitize_filename(title, 40)
    
    # إذا كان العنوان فارغاً بعد التنظيف، استخدم ID الفيديو فقط
    if not clean_title:
        clean_title = video_id
    
    # إنشاء اسم فريد باستخدام video_id
    unique_id = hashlib.md5(f"{video_id}_{title}".encode()).hexdigest()[:8]
    
    if format_type == 'audio':
        filename = f"{clean_title}_{unique_id}.mp3"
    else:
        filename = f"{clean_title}_{unique_id}.mp4"
    
    # التأكد من أن الاسم الكامل (مع المسار) ليس طويلاً
    return filename

# --- إعدادات التحميل المحسنة ---
def get_ydl_options(format_type='video', quality='best', video_id=None, title=None):
    # إنشاء اسم ملف قصير
    if video_id and title:
        filename = generate_unique_filename(video_id, title, format_type)
    else:
        # اسم افتراضي
        filename = f"{format_type}_{hashlib.md5(os.urandom(32)).hexdigest()[:10]}"
    
    # تحديد المسار الكامل
    if format_type == 'audio':
        outtmpl = os.path.join('downloads', 'audio', filename)
    else:
        outtmpl = os.path.join('downloads', 'video', filename)
    
    base_options = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'socket_timeout': 30,
        'retries': 10,
        'fragment_retries': 10,
        'skip_unavailable_fragments': True,
        'outtmpl': outtmpl,  # استخدام المسار القصير
    }
    
    if format_type == 'audio':
        base_options.update({
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
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
        })
    
    return base_options

async def get_video_info(url):
    """جلب معلومات الفيديو"""
    ydl_opts = {
        'quiet': True, 
        'extract_flat': False,
        'no_warnings': True
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = await asyncio.to_thread(ydl.extract_info, url, download=False)
            return info
    except Exception as e:
        logger.error(f"خطأ في جلب المعلومات: {e}")
        raise

def sync_download(url, format_type, quality):
    """تحميل متزامن مع أسماء ملفات قصيرة"""
    # أولاً جلب المعلومات بدون تحميل للحصول على ID والعنوان
    ydl_opts_info = {'quiet': True, 'extract_flat': False, 'no_warnings': True}
    
    with yt_dlp.YoutubeDL(ydl_opts_info) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            video_id = info.get('id', 'unknown')
            title = info.get('title', 'video')
            
            # تنظيف العنوان من المشاهدات والأرقام
            title = re.sub(r'\d+[\s,]*views?', '', title, flags=re.IGNORECASE)
            title = re.sub(r'\d+[\s,]*reactions?', '', title, flags=re.IGNORECASE)
            title = title.strip()
            
            # إنشاء خيارات التحميل مع اسم ملف قصير
            ydl_opts = get_ydl_options(format_type, quality, video_id, title)
            
            # إنشاء المجلدات
            os.makedirs('downloads/video', exist_ok=True)
            os.makedirs('downloads/audio', exist_ok=True)
            
            # التحميل
            with yt_dlp.YoutubeDL(ydl_opts) as ydl_download:
                downloaded_info = ydl_download.extract_info(url, download=True)
                
                # الحصول على اسم الملف النهائي
                if format_type == 'audio':
                    filename = ydl_opts['outtmpl'].replace('.%(ext)s', '.mp3')
                else:
                    filename = ydl_opts['outtmpl']
                
                # التحقق من وجود الملف
                if os.path.exists(filename):
                    return filename, downloaded_info
                else:
                    # محاولة البحث عن الملف
                    for ext in ['.mp4', '.mp3', '.webm', '.m4a']:
                        test_path = filename.replace('.mp4', ext).replace('.mp3', ext)
                        if os.path.exists(test_path):
                            return test_path, downloaded_info
                    
                    raise FileNotFoundError(f"لم يتم العثور على الملف المحمل: {filename}")
                    
        except Exception as e:
            logger.error(f"خطأ في التحميل: {e}")
            raise

# --- معالجات البوت ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome_text = """
🎬 **بوت تحميل الفيديوهات**

📌 **يدعم:**
• يوتيوب - YouTube
• فيسبوك - Facebook
• انستغرام - Instagram
• تيك توك - TikTok

🎵 **يمكنك تحميل:**
• فيديو بجودات مختلفة
• صوت فقط MP3

📖 **الاستخدام:**
1️⃣ أرسل الرابط
2️⃣ اختر نوع التحميل
3️⃣ انتظر قليلاً

⚡ **التحميل سريع وآمن**
"""
    await update.message.reply_text(welcome_text, parse_mode='Markdown')

async def handle_url(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text.strip()
    
    # دعم روابط فيسبوك ويوتيوب
    if not (url.startswith('http://') or url.startswith('https://')):
        await update.message.reply_text("❌ الرجاء إرسال رابط صحيح")
        return
    
    status_msg = await update.message.reply_text("🔍 **جاري تحليل الرابط...**", parse_mode='Markdown')
    
    try:
        # جلب معلومات الفيديو
        info = await get_video_info(url)
        title = info.get('title', 'فيديو')
        duration = info.get('duration', 0)
        
        # تنظيف العنوان للعرض
        clean_title = sanitize_filename(title, 60)
        
        duration_str = f"{duration // 60}:{duration % 60:02d}" if duration else "غير معروف"
        
        info_text = f"""
📹 **المعلومات:**
**العنوان:** {clean_title}
**المدة:** {duration_str}
**المنصة:** {info.get('extractor', 'غير معروف')}

⬇️ **اختر نوع التحميل:**
        """
        
        await status_msg.delete()
        
        # حفظ الرابط في السياق
        context.user_data['last_url'] = url
        context.user_data['video_title'] = clean_title
        
        # قائمة الاختيارات
        keyboard = [
            [InlineKeyboardButton("🎥 فيديو - جودة عالية", callback_data=f"video_highest_{url[:50]}")],
            [InlineKeyboardButton("📱 فيديو - جودة متوسطة", callback_data=f"video_best_{url[:50]}")],
            [InlineKeyboardButton("🎵 صوت فقط (MP3)", callback_data=f"audio_best_{url[:50]}")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(info_text, reply_markup=reply_markup, parse_mode='Markdown')
        
    except Exception as e:
        await status_msg.edit_text(f"❌ **خطأ في تحليل الرابط:**\n`{str(e)[:150]}`", parse_mode='Markdown')

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
    
    # استرجاع الرابط الكامل إذا كان مختصراً
    if not url.startswith('http'):
        url = context.user_data.get('last_url', url)
    
    await query.message.edit_text(
        f"⏳ **جاري التحميل...**\n"
        f"النوع: {'🎵 صوت' if format_type == 'audio' else '🎬 فيديو'}\n"
        f"قد يستغرق 30-60 ثانية\n"
        f"✨ يتم استخدام أسماء ملفات قصيرة لتجنب الأخطاء",
        parse_mode='Markdown'
    )
    
    try:
        # تحميل الفيديو/الصوت
        file_path, info = await asyncio.to_thread(sync_download, url, format_type, quality)
        
        # التحقق من وجود الملف وحجمه
        if not os.path.exists(file_path):
            raise FileNotFoundError("الملف لم يتم إنشاؤه بنجاح")
        
        file_size = os.path.getsize(file_path) / (1024 * 1024)  # حجم الملف بالميجابايت
        
        if file_size > 50:
            await query.message.edit_text(f"⚠️ الملف كبير جداً ({file_size:.1f} MB) وقد يفشل الإرسال")
        
        # إرسال الملف
        if format_type == 'audio':
            with open(file_path, 'rb') as audio:
                await query.message.reply_audio(
                    audio=audio,
                    title=info.get('title', 'Audio')[:50],
                    performer=info.get('uploader', 'Unknown'),
                    caption="✅ **تم التحميل بنجاح!**",
                    parse_mode='Markdown'
                )
        else:
            with open(file_path, 'rb') as video:
                await query.message.reply_video(
                    video=video,
                    caption=f"✅ **تم التحميل بنجاح!**\n📹 {info.get('title', 'Video')[:50]}",
                    supports_streaming=True,
                    parse_mode='Markdown'
                )
        
        # تنظيف الملف
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"تم حذف الملف: {file_path}")
        except Exception as e:
            logger.warning(f"فشل حذف الملف: {e}")
        
        await query.message.edit_text("✅ **اكتمل التحميل!** أرسل رابط آخر", parse_mode='Markdown')
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"خطأ في التحميل: {error_msg}")
        
        # رسائل خطأ مفهومة
        if "File name too long" in error_msg:
            error_msg = "اسم الملف طويل جداً - تم التعامل معه تلقائياً، حاول مرة أخرى"
        elif "unable to open for writing" in error_msg:
            error_msg = "مشكلة في كتابة الملف - تم إصلاحها، حاول مجدداً"
        elif "timed out" in error_msg.lower():
            error_msg = "انتهى الوقت - الرابط بطيء جداً"
        
        await query.message.edit_text(
            f"❌ **حدث خطأ:**\n`{error_msg[:150]}`\n\n"
            f"💡 نصيحة: حاول استخدام رابط آخر أو انتظر قليلاً",
            parse_mode='Markdown'
        )

# --- التشغيل الرئيسي ---
async def run_bot():
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
    
    logger.info("✅ البوت يعمل الآن...")
    logger.info("يدعم: يوتيوب، فيسبوك، انستغرام، تيك توك")
    
    await application.initialize()
    await application.start()
    await application.updater.start_polling()
    
    # البقاء قيد التشغيل
    while True:
        await asyncio.sleep(1)

def main():
    start_keep_alive()
    asyncio.run(run_bot())

if __name__ == '__main__':
    main()
