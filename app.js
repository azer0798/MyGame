const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// خدمة الملفات الثابتة
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// دالة حساب العمر
function calculateAge(birthDate) {
    const today = new Date();
    
    if (isNaN(birthDate.getTime())) return null;
    if (birthDate > today) return null;
    
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    
    if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
    }
    
    if (months < 0) {
        years--;
        months += 12;
    }
    
    const totalDays = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = years * 12 + months;
    const totalHours = totalDays * 24;
    const totalMinutes = totalHours * 60;
    const totalSeconds = totalMinutes * 60;
    
    let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    const daysUntilBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
    
    return {
        years, months, days,
        totalMonths, totalWeeks, totalDays,
        totalHours, totalMinutes, totalSeconds,
        daysUntilBirthday
    };
}

// الصفحة الرئيسية
app.get('/', (req, res) => {
    const defaultDate = new Date('1999-12-22');
    const ageData = calculateAge(defaultDate);
    
    res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
        <title>حاسبة العمر المتجاوبة - احسب عمرك بدقة</title>
        <meta name="description" content="أداة مجانية لحساب العمر بدقة مع تصميم متجاوب يعمل على جميع الأجهزة">
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link rel="stylesheet" href="/style.css">
    </head>
    <body>
        <div class="container">
            <!-- إعلان علوي -->
            <div class="ad-container">
                <div class="ad-label">إعلان</div>
                <div class="ad-content">
                    <i class="fas fa-ad"></i> مساحة إعلانية
                </div>
            </div>
            
            <h1 class="main-title">
                <i class="fas fa-calculator"></i> 
                حاسبة العمر
            </h1>
            
            <!-- بطاقة الإدخال -->
            <div class="card">
                <h2>
                    <i class="fas fa-calendar-alt"></i>
                    أدخل تاريخ ميلادك
                </h2>
                
                <form action="/calculate" method="POST" class="age-form">
                    <div class="form-group">
                        <label>
                            <i class="fas fa-birthday-cake"></i>
                            تاريخ الميلاد:
                        </label>
                        <input type="date" 
                               id="birthday" 
                               name="birthday" 
                               value="1999-12-22" 
                               required 
                               class="date-input"
                               max="${new Date().toISOString().split('T')[0]}">
                    </div>
                    
                    <button type="submit" class="btn-calculate">
                        <i class="fas fa-sync-alt"></i>
                        <span>احسب عمري</span>
                    </button>
                </form>
            </div>
            
            <!-- بطاقة النتائج -->
            <div class="card">
                <h2>
                    <i class="fas fa-chart-line"></i>
                    عمرك بالتفصيل
                </h2>
                
                <!-- العرض الرئيسي -->
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
                    <span>عيد ميلادك القادم بعد</span>
                    <strong>${ageData.daysUntilBirthday}</strong>
                    <span>يوم</span>
                </div>
            </div>
            
            <!-- إعلان سفلي -->
            <div class="ad-container">
                <div class="ad-label">إعلان</div>
                <div class="ad-content">
                    <i class="fas fa-ad"></i> مساحة إعلانية
                </div>
            </div>
            
            <!-- روابط سريعة -->
            <div class="footer-links">
                <a href="/">
                    <i class="fas fa-home"></i>
                    الرئيسية
                </a>
                <a href="/privacy">
                    <i class="fas fa-shield-alt"></i>
                    الخصوصية
                </a>
                <a href="/about">
                    <i class="fas fa-info-circle"></i>
                    من نحن
                </a>
                <a href="/contact">
                    <i class="fas fa-envelope"></i>
                    اتصل بنا
                </a>
            </div>
        </div>
    </body>
    </html>
    `);
});

// مسار حساب العمر
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
    
    res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
        <title>نتيجتك - حاسبة العمر</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link rel="stylesheet" href="/style.css">
    </head>
    <body>
        <div class="container">
            <!-- إعلان علوي -->
            <div class="ad-container">
                <div class="ad-label">إعلان</div>
                <div class="ad-content">
                    <i class="fas fa-ad"></i> مساحة إعلانية
                </div>
            </div>
            
            <h1 class="main-title">
                <i class="fas fa-check-circle"></i> 
                نتيجتك
            </h1>
            
            <!-- بطاقة الإدخال للحساب الجديد -->
            <div class="card">
                <h2>
                    <i class="fas fa-calendar-alt"></i>
                    حساب جديد
                </h2>
                
                <form action="/calculate" method="POST" class="age-form">
                    <div class="form-group">
                        <label>
                            <i class="fas fa-birthday-cake"></i>
                            تاريخ الميلاد:
                        </label>
                        <input type="date" 
                               name="birthday" 
                               value="${birthdayStr}" 
                               required 
                               class="date-input"
                               max="${new Date().toISOString().split('T')[0]}">
                    </div>
                    
                    <button type="submit" class="btn-calculate">
                        <i class="fas fa-redo-alt"></i>
                        <span>احسب من جديد</span>
                    </button>
                </form>
            </div>
            
            <!-- بطاقة النتائج -->
            <div class="card">
                <h2>
                    <i class="fas fa-chart-line"></i>
                    عمرك بالتفصيل
                </h2>
                
                <!-- العرض الرئيسي -->
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
                    <span>عيد ميلادك القادم بعد</span>
                    <strong>${ageData.daysUntilBirthday}</strong>
                    <span>يوم</span>
                </div>
            </div>
            
            <!-- إعلان سفلي -->
            <div class="ad-container">
                <div class="ad-label">إعلان</div>
                <div class="ad-content">
                    <i class="fas fa-ad"></i> مساحة إعلانية
                </div>
            </div>
            
            <!-- روابط سريعة -->
            <div class="footer-links">
                <a href="/">
                    <i class="fas fa-home"></i>
                    الرئيسية
                </a>
                <a href="/privacy">
                    <i class="fas fa-shield-alt"></i>
                    الخصوصية
                </a>
                <a href="/about">
                    <i class="fas fa-info-circle"></i>
                    من نحن
                </a>
                <a href="/contact">
                    <i class="fas fa-envelope"></i>
                    اتصل بنا
                </a>
            </div>
        </div>
    </body>
    </html>
    `);
});

// صفحة الخصوصية
app.get('/privacy', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>سياسة الخصوصية</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link rel="stylesheet" href="/style.css">
    </head>
    <body>
        <div class="container">
            <div class="card">
                <h2><i class="fas fa-shield-alt"></i> سياسة الخصوصية</h2>
                <p>نحن نحترم خصوصيتك. لا نقوم بتخزين أي من التواريخ التي تدخلها في أداتنا.</p>
                <p>نستخدم ملفات تعريف الارتباط لتحسين تجربتك.</p>
                <div class="footer-links">
                    <a href="/"><i class="fas fa-home"></i> العودة</a>
                </div>
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>من نحن</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link rel="stylesheet" href="/style.css">
    </head>
    <body>
        <div class="container">
            <div class="card">
                <h2><i class="fas fa-users"></i> من نحن</h2>
                <p>نقدم أداة بسيطة ودقيقة لحساب العمر مع تصميم متجاوب يعمل على جميع الأجهزة.</p>
                <div class="footer-links">
                    <a href="/"><i class="fas fa-home"></i> العودة</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `);
});

// صفحة اتصل بنا
app.get('/contact', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>اتصل بنا</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link rel="stylesheet" href="/style.css">
    </head>
    <body>
        <div class="container">
            <div class="card">
                <h2><i class="fas fa-envelope"></i> اتصل بنا</h2>
                <p>للتواصل: example@email.com</p>
                <div class="footer-links">
                    <a href="/"><i class="fas fa-home"></i> العودة</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `);
});

// معالجة الأخطاء
app.use((req, res) => {
    res.status(404).send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>الصفحة غير موجودة</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link rel="stylesheet" href="/style.css">
    </head>
    <body>
        <div class="container">
            <div class="card">
                <h2><i class="fas fa-exclamation-triangle"></i> 404</h2>
                <p>الصفحة غير موجودة</p>
                <div class="footer-links">
                    <a href="/"><i class="fas fa-home"></i> الرئيسية</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `);
});

app.listen(port, () => {
    console.log(`✅ الموقع يعمل على http://localhost:${port}`);
    console.log(`✅ التصميم متجاوب مع جميع الشاشات`);
});
