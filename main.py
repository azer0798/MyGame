import os
import asyncio
import threading
from flask import Flask, jsonify
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler
import yt_dlp

# --- نظام منع الإيقاف (Keep Alive) ---
app = Flask('')

@app.route('/')
def home():
    return jsonify({"status": "active", "message": "البوت يعمل بكفاءة عالية!"})

def run_flask():
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)

def start_keep_alive():
    threading.Thread(target=run_flask, daemon=True).start()

# --- إعدادات التحميل المتقدمة ---
def get_ydl_options(format_type='video', quality='best'):
    base_options = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
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
    else:  # video
        if quality == 'highest':
            format_spec = 'bestvideo+bestaudio/best'
        elif quality == 'lowest':
            format_spec = 'worstvideo+worstaudio/worst'
        else:  # best default
            format_spec = 'best'
            
        base_options.update({
            'format': format_spec,
            'merge_output_format': 'mp4',
            'outtmpl': 'downloads/video/%(title)s_%(id)s.%(ext)s',
        })
    
    return base_options

async def get_video_info(url):
    """جلب معلومات الفيديو بدون تحميل"""
    ydl_opts = {'quiet': True, 'extract_flat': False}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = await asyncio.to_thread(ydl.extract_info, url, download=False)
        return info

def sync_download(url, format_type, quality):
    """تحميل متزامن مع الخيارات المحددة"""
    ydl_opts = get_ydl_options(format_type, quality)
    
    # إنشاء المجلدات إذا لم توجد
    if format_type == 'audio':
        os.makedirs('downloads/audio', exist_ok=True)
    else:
        os.makedirs('downloads/video', exist_ok=True)
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        
        if format_type == 'audio':
            # اسم ملف الصوت
            filename = ydl.prepare_filename(info).replace('.webm', '.mp3').replace('.m4a', '.mp3')
        else:
            filename = ydl.prepare_filename(info)
        
        return filename, info

# --- أزرار الاختيار ---
async def show_quality_menu(update: Update, url, is_audio=False):
    keyboard = []
    
    if not is_audio:
        keyboard = [
            [InlineKeyboardButton("🎥 أفضل جودة (4K/1080p)", callback_data=f"video_highest_{url}")],
            [InlineKeyboardButton("📱 جودة متوسطة (720p)", callback_data=f"video_best_{url}")],
            [InlineKeyboardButton("📱 جودة منخفضة (480p)", callback_data=f"video_lowest_{url}")],
            [InlineKeyboardButton("🎵 تحميل صوت فقط (MP3)", callback_data=f"audio_best_{url}")]
        ]
    else:
        keyboard = [
            [InlineKeyboardButton("🎵 جودة عالية (MP3 320kbps)", callback_data=f"audio_high_{url}")],
            [InlineKeyboardButton("🎵 جودة متوسطة (MP3 192kbps)", callback_data=f"audio_best_{url}")],
            [InlineKeyboardButton("🎵 جودة منخفضة (MP3 128kbps)", callback_data=f"audio_low_{url}")]
        ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.callback_query:
        await update.callback_query.message.edit_text(
            "🎬 اختر جودة التحميل:",
            reply_markup=reply_markup
        )
    else:
        await update.message.reply_text(
            "🎬 اختر جودة التحميل:",
            reply_markup=reply_markup
        )

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome_text = """
🎬 **مرحباً بك في بوت تحميل الفيديوهات المتقدم!**

📌 **الميزات:**
• تحميل من يوتيوب، انستغرام، تيك توك، فيسبوك
• اختيار جودة التحميل (4K - 1080p - 720p)
• تحميل الصوت فقط بصيغة MP3
• معالجة متعددة لعدة مستخدمين بنفس الوقت
• دعم القوائم التشغيل

📖 **كيفية الاستخدام:**
1️⃣ أرسل رابط الفيديو
2️⃣ اختر الجودة المناسبة
3️⃣ انتظر التحميل والإرسال

🎯 **أمثلة:**
• فيديو عالي الجودة: أرسل الرابط واختر "أفضل جودة"
• فيديو للجوال: اختر "جودة متوسطة"
• أغنية فقط: اختر "صوت فقط"

⚡ **البوت يعمل بسرعة فائقة!**
"""
    await update.message.reply_text(welcome_text, parse_mode='Markdown')

async def handle_url(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text.strip()
    
    # التحقق من صحة الرابط
    if not (url.startswith('http://') or url.startswith('https://')):
        await update.message.reply_text("❌ الرجاء إرسال رابط صحيح يبدأ بـ http:// أو https://")
        return
    
    status_msg = await update.message.reply_text("🔍 **جاري تحليل الرابط...**", parse_mode='Markdown')
    
    try:
        # جلب معلومات الفيديو
        info = await get_video_info(url)
        
        # عرض معلومات الفيديو
        title = info.get('title', 'غير معروف')[:50]
        duration = info.get('duration', 0)
        duration_str = f"{duration // 60}:{duration % 60:02d}" if duration else "غير معروف"
        
        info_text = f"""
📹 **المعلومات:**
**العنوان:** {title}
**المدة:** {duration_str}
**المنصة:** {info.get('extractor', 'غير معروف')}

⬇️ اختر جودة التحميل:
        """
        
        await status_msg.delete()
        
        # حفظ الرابط في السياق
        context.user_data['last_url'] = url
        await show_quality_menu(update, url)
        
    except Exception as e:
        await status_msg.edit_text(f"❌ حدث خطأ في تحليل الرابط:\n`{str(e)}`", parse_mode='Markdown')

async def handle_quality_selection(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    data = query.data.split('_')
    format_type = data[0]  # video or audio
    quality = data[1]      # highest, best, lowest, high, low
    url = '_'.join(data[2:])  # الرابط الأصلي
    
    # إعادة بناء الرابط إذا كان به شرطات
    if not url.startswith('http'):
        # استرجاع الرابط من السياق
        url = context.user_data.get('last_url', url)
    
    await query.message.edit_text(f"⏳ **جاري التحميل...**\nالنوع: {'🎵 صوت' if format_type == 'audio' else '🎬 فيديو'}\nالجودة: {quality}", parse_mode='Markdown')
    
    try:
        # تحميل الفيديو/الصوت
        file_path, info = await asyncio.to_thread(sync_download, url, format_type, quality)
        
        # إرسال الملف
        if format_type == 'audio':
            with open(file_path, 'rb') as audio:
                await query.message.reply_audio(
                    audio=audio,
                    title=info.get('title', 'Audio'),
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
        
        # تنظيف الملفات
        if os.path.exists(file_path):
            os.remove(file_path)
        
        await query.message.edit_text("✅ **اكتمل التحميل!** أرسل رابط آخر للتحميل.", parse_mode='Markdown')
        
    except Exception as e:
        await query.message.edit_text(f"❌ **حدث خطأ:**\n`{str(e)}`\n\n⚠️ قد يكون الرابط غير مدعوم أو هناك مشكلة في الاتصال.", parse_mode='Markdown')

# --- أوامر إضافية ---
async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    help_text = """
📚 **الأوامر المتاحة:**

/start - عرض الترحيب
/help - عرض هذه المساعدة
/about - معلومات عن البوت
/support - للدعم والاقتراحات

💡 **نصائح:**
• يمكنك إرسال روابط قوائم تشغيل (يوتيوب)
• للتحميل السريع، اختر "جودة متوسطة"
• الصوت فقط يأتي بصيغة MP3
    """
    await update.message.reply_text(help_text)

async def about(update: Update, context: ContextTypes.DEFAULT_TYPE):
    about_text = """
🤖 **عن البوت:**
النسخة: 2.0.0
المكتبات: yt-dlp, python-telegram-bot

⚙️ **المميزات التقنية:**
• معالجة متعددة للمستخدمين
• نظام منع الإيقاف 24/7
• تحميل سريع ومباشر

👨‍💻 **المطور:** @YourUsername
    """
    await update.message.reply_text(about_text, parse_mode='Markdown')

# --- الإعداد الأساسي ---
load_dotenv()
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

def main():
    # إنشاء المجلدات
    os.makedirs('downloads/video', exist_ok=True)
    os.makedirs('downloads/audio', exist_ok=True)
    
    if not TOKEN:
        print("❌ خطأ: لم يتم العثور على TOKEN. تأكد من وجود ملف .env")
        return
    
    # تشغيل نظام منع الإيقاف
    start_keep_alive()
    
    # إنشاء التطبيق
    application = Application.builder().token(TOKEN).concurrent_updates(True).build()
    
    # إضافة المعالجات
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("about", about))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_url))
    application.add_handler(CallbackQueryHandler(handle_quality_selection))
    
    print("✅ البوت يعمل الآن بنظام المعالجة المتعددة...")
    print("📱 جرب إرسال رابط فيديو!")
    
    # تشغيل البوت
    application.run_polling()

if __name__ == '__main__':
    main()
