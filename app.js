const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// خدمة الملفات الثابتة - مهم جداً لتحميل CSS
app.use(express.static(__dirname));

// للتعامل مع بيانات النماذج
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// دالة حساب العمر (مركزية)
function calculateAge(birthDate) {
    const today = new Date();
    
    // التحقق من صحة التاريخ
    if (isNaN(birthDate.getTime())) return null;
    if (birthDate > today) return null;
    
    // حساب الفرق بالسنوات والأشهر والأيام
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    
    // تعديل القيم السالبة
    if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
    }
    
    if (months < 0) {
        years--;
        months += 12;
    }
    
    // حساب إجمالي الأيام
    const totalDays = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = years * 12 + months;
    const totalHours = totalDays * 24;
    const totalMinutes = totalHours * 60;
    const totalSeconds = totalMinutes * 60;
    
    // حساب عيد الميلاد القادم
    let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    const daysUntilBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
    
    // صياغة التاريخ بالعربية
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = birthDate.toLocaleDateString('ar-EG', options);
    
    return {
        years, months, days,
        totalMonths, totalWeeks, totalDays,
        totalHours, totalMinutes, totalSeconds,
        daysUntilBirthday,
        birthDate: formattedDate
    };
}

// الصفحة الرئيسية
app.get('/', (req, res) => {
    // تاريخ افتراضي للعرض الأول
    const defaultDate = new Date('1999-12-22');
    const ageData = calculateAge(defaultDate);
    
    // قالب HTML الكامل
    const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>حاسبة العمر الدقيقة</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link rel="stylesheet" href="/style.css">
        <style>
            /* تنسيقات إضافية للجدول */
            .stats-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .stats-table td {
                padding: 15px;
                text-align: center;
                border: 1px solid #e0e0e0;
            }
            .stats-table tr:first-child td {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-weight: bold;
            }
            .result-value {
                font-size: 24px;
                font-weight: 800;
                color: #2d3748;
            }
            .result-label {
                font-size: 14px;
                color: #718096;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- إعلان علوي -->
            <div class="ad-container">
                <div class="ad-label">إعلان</div>
                <div class="ad-content">// كود AdSense هنا //</div>
            </div>
            
            <h1 class="main-title"><i class="fas fa-calculator"></i> حاسبة العمر</h1>
            
            <!-- نموذج إدخال التاريخ -->
            <div class="card">
                <h2><i class="fas fa-calendar-alt"></i> تاريخ ميلادك</h2>
                <form action="/calculate" method="POST" class="age-form">
                    <div class="form-group">
                        <label for="birthday">تاريخ الميلاد:</label>
                        <input type="date" id="birthday" name="birthday" value="1999-12-22" required class="date-input">
                    </div>
                    <button type="submit" class="btn-calculate">
                        <i class="fas fa-sync-alt"></i> احسب من جديد
                    </button>
                </form>
            </div>
            
            <!-- عرض النتائج -->
            <div class="card">
                <h2><i class="fas fa-chart-line"></i> النتائج</h2>
                
                <!-- العمر الأساسي -->
                <div class="age-main-display">
                    <div class="age-item">
                        <span class="age-number">${ageData.years}</span>
                        <span class="age-label">سنة</span>
                    </div>
                    <div class="age-item">
                        <span class="age-number">${ageData.months}</span>
                        <span class="age-label">شهر</span>
                    </div>
                    <div class="age-item">
                        <span class="age-number">${ageData.days}</span>
                        <span class="age-label">يوم</span>
                    </div>
                </div>
                
                <!-- جدول الإحصائيات -->
                <table class="stats-table">
                    <tr>
                        <td>الثواني</td>
                        <td>الدقائق</td>
                        <td>الساعات</td>
                        <td>الأيام</td>
                        <td>الأسابيع</td>
                        <td>الأشهر</td>
                    </tr>
                    <tr>
                        <td class="result-value">${ageData.totalSeconds.toLocaleString()}</td>
                        <td class="result-value">${ageData.totalMinutes.toLocaleString()}</td>
                        <td class="result-value">${ageData.totalHours.toLocaleString()}</td>
                        <td class="result-value">${ageData.totalDays.toLocaleString()}</td>
                        <td class="result-value">${ageData.totalWeeks.toLocaleString()}</td>
                        <td class="result-value">${ageData.totalMonths.toLocaleString()}</td>
                    </tr>
                </table>
                
                <!-- عيد الميلاد القادم -->
                <div class="birthday-countdown">
                    <i class="fas fa-gift"></i>
                    <span>عيد ميلادك القادم بعد:</span>
                    <strong>${ageData.daysUntilBirthday}</strong>
                    <span>يوم</span>
                </div>
            </div>
            
            <!-- إعلان سفلي -->
            <div class="ad-container">
                <div class="ad-label">إعلان</div>
                <div class="ad-content">// كود AdSense هنا //</div>
            </div>
            
            <!-- روابط سريعة -->
            <div class="footer-links">
                <a href="/">الصفحة الرئيسية</a>
                <a href="/privacy">سياسة الخصوصية</a>
                <a href="/about">من نحن</a>
            </div>
        </div>
    </body>
    </html>
    `;
    res.send(html);
});

// مسار معالجة النموذج
app.post('/calculate', (req, res) => {
    const birthdayStr = req.body.birthday;
    
    if (!birthdayStr) {
        return res.redirect('/?error=empty');
    }
    
    const birthDate = new Date(birthdayStr);
    const ageData = calculateAge(birthDate);
    
    if (!ageData) {
        return res.redirect('/?error=invalid');
    }
    
    // عرض النتائج
    const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>نتيجة حساب العمر</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link rel="stylesheet" href="/style.css">
        <style>
            .stats-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .stats-table td {
                padding: 15px;
                text-align: center;
                border: 1px solid #e0e0e0;
            }
            .stats-table tr:first-child td {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-weight: bold;
            }
            .result-value {
                font-size: 24px;
                font-weight: 800;
                color: #2d3748;
            }
            .age-main-display {
                display: flex;
                justify-content: center;
                gap: 30px;
                margin: 30px 0;
            }
            .age-item {
                text-align: center;
            }
            .age-number {
                display: block;
                font-size: 48px;
                font-weight: 900;
                color: #667eea;
                line-height: 1.2;
            }
            .age-label {
                font-size: 18px;
                color: #718096;
            }
            .birthday-countdown {
                text-align: center;
                padding: 20px;
                background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
                border-radius: 10px;
                margin-top: 20px;
                font-size: 24px;
            }
            .birthday-countdown strong {
                font-size: 36px;
                margin: 0 10px;
                color: white;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="ad-container">
                <div class="ad-label">إعلان</div>
                <div class="ad-content">// كود AdSense هنا //</div>
            </div>
            
            <h1 class="main-title"><i class="fas fa-calculator"></i> نتيجة حساب عمرك</h1>
            
            <div class="card">
                <h2><i class="fas fa-calendar-alt"></i> تاريخ الميلاد: ${ageData.birthDate}</h2>
                
                <form action="/calculate" method="POST" class="age-form">
                    <div class="form-group">
                        <label for="birthday">أدخل تاريخ ميلاد آخر:</label>
                        <input type="date" id="birthday" name="birthday" value="${birthdayStr}" required class="date-input">
                    </div>
                    <button type="submit" class="btn-calculate">
                        <i class="fas fa-sync-alt"></i> احسب من جديد
                    </button>
                </form>
                
                <div class="age-main-display">
                    <div class="age-item">
                        <span class="age-number">${ageData.years}</span>
                        <span class="age-label">سنة</span>
                    </div>
                    <div class="age-item">
                        <span class="age-number">${ageData.months}</span>
                        <span class="age-label">شهر</span>
                    </div>
                    <div class="age-item">
                        <span class="age-number">${ageData.days}</span>
                        <span class="age-label">يوم</span>
                    </div>
                </div>
                
                <table class="stats-table">
                    <tr>
                        <td>الثواني</td>
                        <td>الدقائق</td>
                        <td>الساعات</td>
                        <td>الأيام</td>
                        <td>الأسابيع</td>
                        <td>الأشهر</td>
                    </tr>
                    <tr>
                        <td class="result-value">${ageData.totalSeconds.toLocaleString()}</td>
                        <td class="result-value">${ageData.totalMinutes.toLocaleString()}</td>
                        <td class="result-value">${ageData.totalHours.toLocaleString()}</td>
                        <td class="result-value">${ageData.totalDays.toLocaleString()}</td>
                        <td class="result-value">${ageData.totalWeeks.toLocaleString()}</td>
                        <td class="result-value">${ageData.totalMonths.toLocaleString()}</td>
                    </tr>
                </table>
                
                <div class="birthday-countdown">
                    <i class="fas fa-gift"></i>
                    عيد ميلادك القادم بعد 
                    <strong>${ageData.daysUntilBirthday}</strong>
                    يوم
                </div>
            </div>
            
            <div class="ad-container">
                <div class="ad-label">إعلان</div>
                <div class="ad-content">// كود AdSense هنا //</div>
            </div>
            
            <div class="footer-links">
                <a href="/"><i class="fas fa-home"></i> الصفحة الرئيسية</a>
                <a href="/privacy">سياسة الخصوصية</a>
                <a href="/about">من نحن</a>
            </div>
        </div>
    </body>
    </html>
    `;
    res.send(html);
});

// صفحة سياسة الخصوصية
app.get('/privacy', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <title>سياسة الخصوصية</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/style.css">
    </head>
    <body>
        <div class="container">
            <div class="card">
                <h1>سياسة الخصوصية</h1>
                <p>نحن نحترم خصوصيتك. لا نقوم بتخزين أي من التواريخ التي تدخلها.</p>
                <a href="/">العودة للرئيسية</a>
            </div>
        </div>
    </body>
    </html>
    `);
});

// صفحة من نحن
app.get('/about', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <title>من نحن</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/style.css">
    </head>
    <body>
        <div class="container">
            <div class="card">
                <h1>من نحن</h1>
                <p>نقدم أداة بسيطة ودقيقة لحساب العمر.</p>
                <a href="/">العودة للرئيسية</a>
            </div>
        </div>
    </body>
    </html>
    `);
});

app.listen(port, () => {
    console.log(`✅ الموقع يعمل على http://localhost:${port}`);
});
