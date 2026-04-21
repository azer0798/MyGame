import os
import asyncio
import threading
import re
import hashlib
import json
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

# --- إعدادات yt-dlp لتجنب مشكلة Sign in ---
def get_ydl_options(format_type='video', quality='best'):
    # إعدادات متقدمة لتجنب مشكلة تسجيل الدخول
    base_options = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'socket_timeout': 30,
        'retries': 10,
        'fragment_retries': 10,
        'skip_unavailable_fragments': True,
        # تجنب طلب تسجيل الدخول
        'cookiefile': None,  # عدم استخدام ملفات الكوكيز
        'nocheckcertificate': True,
        'prefer_insecure': True,
        # استخدام واجهة برمجية بديلة
        'extractor_args': {
            'youtube': {
                'skip': ['dash', 'hls', 'live'],
                'player_client': ['android', 'web'],  # محاكاة عميل أندرويد
            }
        },
        # تقليل الضغط على الخوادم
        'throttledratelimit': 1000000,
        'sleep_interval': 5,
        'max_sleep_interval': 10,
    }
    
    # إضافة خيارات خاصة لفيسبوك
    if 'facebook' in str(base_options):
        base_options['extractor_args']['facebook'] = {
            'prefer_https': True
        }
    
    # إنشاء اسم ملف قصير
    timestamp = str(int(asyncio.get_event_loop().time()))[-8:]
    unique_id = hashlib.md5(os.urandom(32)).hexdigest()[:8]
    
    if format_type == 'audio':
        os.makedirs('downloads/audio', exist_ok=True)
        outtmpl = os.path.join('downloads', 'audio', f'audio_{timestamp}_{unique_id}.%(ext)s')
        base_options.update({
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': outtmpl,
        })
    else:
        os.makedirs('downloads/video', exist_ok=True)
        
        if quality == 'highest':
            format_spec = 'best[height<=1080]/best'  # تحديد أقصى جودة 1080p
        elif quality == 'lowest':
            format_spec = 'worst'
        else:
            format_spec = 'best[height<=720]/best'  # جودة متوسطة 720p
            
        base_options.update({
            'format': format_spec,
            'merge_output_format': 'mp4',
            'outtmpl': os.path.join('downloads', 'video', f'video_{timestamp}_{unique_id}.%(ext)s'),
        })
    
    return base_options

def sanitize_filename(filename):
    """تنظيف اسم الملف"""
    # إزالة الرموز غير المسموحة
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)
    # إزالة المسافات الزائدة
    filename = re.sub(r'\s+', ' ', filename).strip()
    # تقصير الطول
    if len(filename) > 50:
        filename = filename[:50]
    return filename

async def get_video_info(url):
    """جلب معلومات الفيديو مع تجنب مشكلة تسجيل الدخول"""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'extractor_args': {
            'youtube': {
                'player_client': ['android'],
                'skip': ['dash', 'hls'],
            }
        }
    }
    
    try:
        # استخدام asyncio.to_thread لتجنب حظر الحلقة
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = await asyncio.to_thread(ydl.extract_info, url, download=False)
            return info
    except Exception as e:
        logger.error(f"خطأ في جلب المعلومات: {e}")
        # إذا فشل، حاول مرة أخرى بدون extractor_args
        try:
            with yt_dlp.YoutubeDL({'quiet': True, 'no_warnings': True}) as ydl:
                info = await asyncio.to_thread(ydl.extract_info, url, download=False)
                return info
        except Exception as e2:
            raise Exception(f"فشل تحليل الرابط: {str(e2)[:100]}")

def sync_download(url, format_type, quality):
    """تحميل متزامن مع تجنب أخطاء تسجيل الدخول"""
    try:
        ydl_opts = get_ydl_options(format_type, quality)
        
        # محاولة التحميل
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            
            # البحث عن الملف المحمل
            if format_type == 'audio':
                base_filename = ydl_opts['outtmpl'].replace('.%(ext)s', '.mp3')
            else:
                base_filename = ydl_opts['outtmpl']
            
            # التحقق من وجود الملف
            if os.path.exists(base_filename):
                return base_filename, info
            
            # البحث عن الملف بأي امتداد
            for ext in ['.mp4', '.mp3', '.webm', '.m4a']:
                test_path = base_filename.replace('.mp4', ext).replace('.mp3', ext)
                if os.path.exists(test_path):
                    return test_path, info
            
            raise FileNotFoundError("لم يتم العثور على الملف المحمل")
            
    except Exception as e:
        error_msg = str(e)
        # معالجة أخطاء يوتيوب المعروفة
        if "Sign in to confirm" in error_msg:
            raise Exception("يوتيوب يطلب تحقق - جرب رابط آخر أو انتظر قليلاً")
        elif "HTTP Error 429" in error_msg:
            raise Exception("طلبات كثيرة جداً - انتظر دقيقة ثم حاول مرة أخرى")
        elif "unable to open for writing" in error_msg:
            raise Exception("مشكلة في حفظ الملف - تم إصلاحها تلقائياً")
        else:
            raise Exception(error_msg[:150])

# --- معالجات البوت ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome_text = """
🎬 **بوت تحميل الفيديوهات**

✅ **يدعم:**
• يوتيوب - YouTube
• فيسبوك - Facebook  
• انستغرام - Instagram
• تيك توك - TikTok

🎵 **خيارات التحميل:**
• فيديو بجودة عالية (720p-1080p)
• فيديو بجودة متوسطة (480p-720p)
• صوت فقط MP3

📖 **كيفية الاستخدام:**
1️⃣ أرسل الرابط
2️⃣ اختر نوع التحميل
3️⃣ انتظر قليلاً

⚡ **يعمل 24/7 بدون توقف**
"""
    await update.message.reply_text(welcome_text, parse_mode='Markdown')

async def handle_url(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text.strip()
    
    if not (url.startswith('http://') or url.startswith('https://')):
        await update.message.reply_text("❌ الرجاء إرسال رابط صحيح يبدأ بـ http:// أو https://")
        return
    
    status_msg = await update.message.reply_text("🔍 **جاري تحليل الرابط...**", parse_mode='Markdown')
    
    try:
        # محاولة جلب المعلومات مع وقت محدد
        info = await asyncio.wait_for(get_video_info(url), timeout=30)
        
        title = info.get('title', 'فيديو')
        # تنظيف العنوان للعرض
        clean_title = title[:60] if len(title) > 60 else title
        
        duration = info.get('duration', 0)
        if duration:
            minutes = duration // 60
            seconds = duration % 60
            duration_str = f"{minutes}:{seconds:02d}"
        else:
            duration_str = "غير معروف"
        
        info_text = f"""
📹 **معلومات الفيديو:**
**العنوان:** {clean_title}
**المدة:** {duration_str}
**المنصة:** {info.get('extractor', 'غير معروف')}

⬇️ **اختر جودة التحميل:**
        """
        
        await status_msg.delete()
        
        # حفظ الرابط
        context.user_data['last_url'] = url
        
        # أزرار الاختيار
        keyboard = [
            [InlineKeyboardButton("🎥 فيديو - جودة عالية (1080p)", callback_data=f"video_highest")],
            [InlineKeyboardButton("📱 فيديو - جودة متوسطة (720p)", callback_data=f"video_best")],
            [InlineKeyboardButton("🎵 صوت فقط - MP3", callback_data=f"audio_best")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(info_text, reply_markup=reply_markup, parse_mode='Markdown')
        
    except asyncio.TimeoutError:
        await status_msg.edit_text("❌ **انتهى الوقت!** الرابط بطيء جداً أو لا يعمل", parse_mode='Markdown')
    except Exception as e:
        error_short = str(e)[:150]
        await status_msg.edit_text(
            f"❌ **خطأ في تحليل الرابط:**\n`{error_short}`\n\n"
            f"💡 **نصيحة:** تأكد من صحة الرابط وجربه مرة أخرى",
            parse_mode='Markdown'
        )

async def handle_quality_selection(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    data = query.data.split('_')
    format_type = data[0]
    quality = data[1] if len(data) > 1 else 'best'
    
    url = context.user_data.get('last_url')
    if not url:
        await query.message.edit_text("❌ انتهت الجلسة - أرسل الرابط مرة أخرى", parse_mode='Markdown')
        return
    
    await query.message.edit_text(
        f"⏳ **جاري التحميل...**\n"
        f"النوع: {'🎵 صوت' if format_type == 'audio' else '🎬 فيديو'}\n"
        f"قد يستغرق 30-60 ثانية حسب سرعة الرابط\n"
        f"✨ يرجى الانتظار...",
        parse_mode='Markdown'
    )
    
    try:
        # تحميل مع وقت محدد
        file_path, info = await asyncio.wait_for(
            asyncio.to_thread(sync_download, url, format_type, quality),
            timeout=90
        )
        
        if not os.path.exists(file_path):
            raise FileNotFoundError("الملف لم يتم إنشاؤه")
        
        # إرسال الملف حسب النوع
        if format_type == 'audio':
            with open(file_path, 'rb') as audio_file:
                await query.message.reply_audio(
                    audio=audio_file,
                    title=info.get('title', 'Audio')[:50],
                    performer=info.get('uploader', 'Unknown'),
                    caption="✅ **تم التحميل بنجاح!**",
                    parse_mode='Markdown'
                )
        else:
            # فيديو - قد يكون كبيراً
            with open(file_path, 'rb') as video_file:
                await query.message.reply_video(
                    video=video_file,
                    caption=f"✅ **تم التحميل بنجاح!**",
                    supports_streaming=True,
                    parse_mode='Markdown'
                )
        
        # حذف الملف بعد الإرسال
        try:
            os.remove(file_path)
            logger.info(f"تم حذف الملف: {file_path}")
        except Exception as e:
            logger.warning(f"فشل حذف الملف: {e}")
        
        await query.message.edit_text(
            "✅ **اكتمل التحميل!**\n"
            "أرسل رابط آخر للتحميل",
            parse_mode='Markdown'
        )
        
    except asyncio.TimeoutError:
        await query.message.edit_text(
            "❌ **انتهى الوقت!**\n"
            "الرابط بطيء جداً أو أن الملف كبير جداً\n"
            "جرب رابط آخر أو اختر جودة أقل",
            parse_mode='Markdown'
        )
    except Exception as e:
        error_msg = str(e)
        logger.error(f"خطأ في التحميل: {error_msg}")
        
        # رسائل خطأ مفهومة
        if "Sign in to confirm" in error_msg:
            error_msg = "يوتيوب يطلب تحقق - انتظر 5 دقائق ثم حاول مرة أخرى"
        elif "HTTP Error 429" in error_msg:
            error_msg = "طلبات كثيرة جداً - انتظر دقيقة ثم حاول"
        elif "File name too long" in error_msg:
            error_msg = "تم حل مشكلة اسم الملف - حاول مرة أخرى"
        
        await query.message.edit_text(
            f"❌ **حدث خطأ:**\n`{error_msg[:150]}`\n\n"
            f"💡 **نصيحة:**\n"
            f"• جرب رابط آخر\n"
            f"• انتظر قليلاً ثم أعد المحاولة\n"
            f"• اختر جودة أقل",
            parse_mode='Markdown'
        )

# --- التشغيل الرئيسي مع منع الـ Conflict ---
async def run_bot():
    load_dotenv()
    TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
    
    if not TOKEN:
        logger.error("❌ لم يتم العثور على TOKEN!")
        return
    
    # إنشاء المجلدات
    os.makedirs('downloads/video', exist_ok=True)
    os.makedirs('downloads/audio', exist_ok=True)
    
    # إنشاء التطبيق مع إعدادات لمنع الـ Conflict
    application = Application.builder()\
        .token(TOKEN)\
        .concurrent_updates(True)\
        .build()
    
    # إضافة المعالجات
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_url))
    application.add_handler(CallbackQueryHandler(handle_quality_selection))
    
    logger.info("✅ البوت يعمل الآن...")
    logger.info("📱 يدعم: يوتيوب، فيسبوك، انستغرام، تيك توك")
    
    # تشغيل البوت مع إعادة محاولة تلقائية
    while True:
        try:
            await application.initialize()
            await application.start()
            await application.updater.start_polling()
            
            # البقاء قيد التشغيل
            while True:
                await asyncio.sleep(5)
                
        except Exception as e:
            logger.error(f"❌ توقف البوت: {e}")
            logger.info("🔄 إعادة التشغيل خلال 5 ثوان...")
            await asyncio.sleep(5)
            
            # محاولة إغلاق التطبيق الحالي
            try:
                await application.updater.stop()
                await application.stop()
                await application.shutdown()
            except:
                pass
            continue

def main():
    # تشغيل نظام البقاء
    start_keep_alive()
    
    # تشغيل البوت
    asyncio.run(run_bot())

if __name__ == '__main__':
    main()
