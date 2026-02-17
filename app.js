const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// خدمة الملفات الثابتة (CSS, JS)
app.use(express.static(__dirname));

// الصفحة الرئيسية - تعرض الصفحة مع بيانات افتراضية
app.get('/', (req, res) => {
  // دالة مساعدة لحساب العمر (سنكررها هنا للبساطة)
  function calculateAgeData(birthDate) {
    const today = new Date();
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
    
    // تاريخ هجري تجريبي (يمكنك تفعيل مكتبة moment-hijri لاحقاً)
    const hijriDate = "15 شعبان 1445"; 

    return { years, months, days, totalMonths, totalWeeks, totalDays, totalHours, totalMinutes, totalSeconds, daysUntilBirthday, hijriDate };
  }

  // بيانات افتراضية (1 يناير 1990)
  const defaultDate = new Date('1990-01-01');
  const ageData = calculateAgeData(defaultDate);

  // قالب HTML (مختصر للتوضيح)
  const html = `
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>حاسبة العمر الدقيقة</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <link rel="stylesheet" href="/style.css">
  </head>
  <body>
      <div class="container">
          <div class="ad-container ad-top"><div class="ad-label">إعلان</div><div class="ad-content">// كود AdSense //</div></div>
          
          <header class="main-header"><h1><i class="fas fa-calendar-alt"></i> حاسبة العمر</h1><p class="subtitle">أداة دقيقة لحساب عمرك مع تفاصيل شاملة</p></header>
          
          <!-- قسم الإدخال: نستخدم طريقة POST لإرسال البيانات للخادم -->
          <div class="input-section card">
              <h2><i class="fas fa-birthday-cake"></i> أدخل تاريخ ميلادك</h2>
              <form id="ageForm" method="POST" action="/calculate">
                  <div class="input-wrapper">
                      <label for="birthday">تاريخ الميلاد:</label>
                      <input type="date" id="birthday" name="birthday" class="date-input" required>
                  </div>
                  <button type="submit" class="calculate-btn"><i class="fas fa-calculator"></i> احسب عمري</button>
              </form>
              <div id="errorMessage" class="error-message" style="display: none;"></div>
          </div>
          
          <!-- قسم النتائج (يتم تحديثه عبر POST) -->
          <div id="resultsSection" class="results-section">
              <div class="age-card main-age card">
                  <div class="main-age-number" id="currentAge">
                      <span id="years">${ageData.years}</span> سنة 
                      <span id="months">${ageData.months}</span> شهر 
                      <span id="days">${ageData.days}</span> يوم
                  </div>
                  <div class="hijri-date" id="hijriDate"><i class="fas fa-moon"></i> <span>${ageData.hijriDate}</span></div>
              </div>
              
              <div class="details-grid">
                  <div class="detail-card"><span class="detail-label">الأشهر</span><span class="detail-value" id="totalMonths">${ageData.totalMonths}</span></div>
                  <div class="detail-card"><span class="detail-label">الأسابيع</span><span class="detail-value" id="totalWeeks">${ageData.totalWeeks.toLocaleString()}</span></div>
                  <div class="detail-card"><span class="detail-label">الأيام</span><span class="detail-value" id="totalDays">${ageData.totalDays.toLocaleString()}</span></div>
                  <div class="detail-card"><span class="detail-label">الساعات</span><span class="detail-value" id="totalHours">${ageData.totalHours.toLocaleString()}</span></div>
                  <div class="detail-card"><span class="detail-label">الدقائق</span><span class="detail-value" id="totalMinutes">${ageData.totalMinutes.toLocaleString()}</span></div>
                  <div class="detail-card"><span class="detail-label">الثواني</span><span class="detail-value" id="totalSeconds">${ageData.totalSeconds.toLocaleString()}</span></div>
              </div>
              
              <div class="birthday-card card">
                  <div class="birthday-content"><h3>عيد ميلادك القادم بعد:</h3><div class="days-count" id="daysUntilBirthday">${ageData.daysUntilBirthday}</div><div class="days-label">يوم</div></div>
              </div>
          </div>
          
          <div class="ad-container ad-bottom"><div class="ad-label">إعلان</div><div class="ad-content">// كود AdSense //</div></div>
      </div>
      <script src="/script.js"></script>
  </body>
  </html>
  `;
  res.send(html);
});

// مسار POST لحساب العمر
app.post('/calculate', express.urlencoded({ extended: true }), (req, res) => {
  const birthdayStr = req.body.birthday;
  if (!birthdayStr) {
      return res.redirect('/?error=noDate');
  }

  const birthDate = new Date(birthdayStr);
  const today = new Date();

  if (birthDate > today) {
      return res.redirect('/?error=futureDate');
  }

  // إعادة استخدام منطق الحساب (من الأفضل وضعه في دالة منفصلة)
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
  
  // تاريخ هجري تجريبي - يمكن تحسينه لاحقاً
  const hijriDate = "15 شعبان 1445"; 

  // إعادة بناء الصفحة بالبيانات الجديدة (يمكن تحسينه بإرسال JSON واستخدام JavaScript)
  const html = `
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>نتيجة عمرك - حاسبة العمر</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <link rel="stylesheet" href="/style.css">
  </head>
  <body>
      <div class="container">
          <div class="ad-container ad-top"><div class="ad-label">إعلان</div><div class="ad-content">// كود AdSense //</div></div>
          
          <header class="main-header"><h1><i class="fas fa-calendar-alt"></i> حاسبة العمر</h1><p class="subtitle">نتيجة حساب عمرك</p></header>
          
          <div class="input-section card">
              <h2><i class="fas fa-birthday-cake"></i> أدخل تاريخ ميلاد آخر</h2>
              <form id="ageForm" method="POST" action="/calculate">
                  <div class="input-wrapper">
                      <label for="birthday">تاريخ الميلاد:</label>
                      <input type="date" id="birthday" name="birthday" class="date-input" value="${birthdayStr}" required>
                  </div>
                  <button type="submit" class="calculate-btn"><i class="fas fa-calculator"></i> احسب من جديد</button>
              </form>
          </div>
          
          <div class="results-section">
              <div class="age-card main-age card">
                  <div class="main-age-number">
                      <span>${years}</span> سنة <span>${months}</span> شهر <span>${days}</span> يوم
                  </div>
                  <div class="hijri-date"><i class="fas fa-moon"></i> <span>${hijriDate}</span></div>
              </div>
              
              <div class="details-grid">
                  <div class="detail-card"><span class="detail-label">الأشهر</span><span class="detail-value">${totalMonths}</span></div>
                  <div class="detail-card"><span class="detail-label">الأسابيع</span><span class="detail-value">${totalWeeks.toLocaleString()}</span></div>
                  <div class="detail-card"><span class="detail-label">الأيام</span><span class="detail-value">${totalDays.toLocaleString()}</span></div>
                  <div class="detail-card"><span class="detail-label">الساعات</span><span class="detail-value">${totalHours.toLocaleString()}</span></div>
                  <div class="detail-card"><span class="detail-label">الدقائق</span><span class="detail-value">${totalMinutes.toLocaleString()}</span></div>
                  <div class="detail-card"><span class="detail-label">الثواني</span><span class="detail-value">${totalSeconds.toLocaleString()}</span></div>
              </div>
              
              <div class="birthday-card card">
                  <div class="birthday-content"><h3>عيد ميلادك القادم بعد:</h3><div class="days-count">${daysUntilBirthday}</div><div class="days-label">يوم</div></div>
              </div>
          </div>
          
          <div class="ad-container ad-bottom"><div class="ad-label">إعلان</div><div class="ad-content">// كود AdSense //</div></div>
          <div class="quick-links"><a href="/"><i class="fas fa-home"></i> الصفحة الرئيسية</a></div>
      </div>
      <script src="/script.js"></script>
  </body>
  </html>
  `;
  res.send(html);
});

app.listen(port, () => {
  console.log(`الموقع يعمل على http://localhost:${port}`);
});
