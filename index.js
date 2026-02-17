const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// خدمة الملفات الثابتة (CSS, JS)
app.use(express.static(__dirname));

// الصفحة الرئيسية - نرسل HTML مباشرة مع دمج البيانات
app.get('/', (req, res) => {
  // منطق حساب العمر (مثال: تاريخ ميلاد 1990-01-01)
  const birthDate = new Date(1990, 0, 1); // 1 يناير 1990
  const today = new Date();
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();
  
  // تعديل القيم إذا كانت الأيام أو الأشهر سالبة
  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  // حساب الأيام حتى عيد الميلاد القادم
  let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  const daysUntilBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
  
  // حساب التفاصيل الإضافية
  const totalDays = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = years * 12 + months;
  
  // قالب HTML كامل مع دمج البيانات
  const html = `
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>حساب العمر بدقة - احسب عمرك بالهجري والميلادي</title>
      <meta name="description" content="أداة مجانية ودقيقة لحساب العمر باليوم والشهر والسنة، مع معرفة تاريخ ميلادك بالهجري والميلادي وتفاصيل عن عمرك وأيام عيد ميلادك القادمة.">
      <link rel="stylesheet" href="/style.css">
  </head>
  <body>
      <div class="container">
          <!-- إعلان علوي (ضع كود AdSense هنا) -->
          <div class="ad-top">إعلان علوي (AdSense)</div>
          
          <h1>حساب العمر باليوم والشهر والسنة</h1>
          
          <div class="age-result">
              <h2>عمرك الآن:</h2>
              <div class="age-number">
                  <span class="years">${years}</span> سنة 
                  <span class="months">${months}</span> شهر 
                  <span class="days">${days}</span> يوم
              </div>
          </div>
          
          <div class="birth-input">
              <label for="birthday">تاريخ الميلاد:</label>
              <input type="date" id="birthday" value="1990-01-01">
              <button onclick="calculateAge()">احسب</button>
          </div>
          
          <div class="details">
              <h3>تفاصيل إضافية:</h3>
              <div class="details-grid">
                  <div class="detail-item">
                      <span class="label">الأشهر:</span>
                      <span class="value" id="totalMonths">${totalMonths}</span>
                  </div>
                  <div class="detail-item">
                      <span class="label">الأسابيع:</span>
                      <span class="value" id="totalWeeks">${totalWeeks}</span>
                  </div>
                  <div class="detail-item">
                      <span class="label">الأيام:</span>
                      <span class="value" id="totalDays">${totalDays}</span>
                  </div>
              </div>
          </div>
          
          <div class="next-birthday">
              <h3>يفصلك عن عيد ميلادك القادم:</h3>
              <div class="days-count">${daysUntilBirthday} يوم</div>
          </div>
          
          <!-- إعلان سفلي -->
          <div class="ad-bottom">إعلان سفلي (AdSense)</div>
          
          <div class="explanation">
              <h3>كيف يتم حساب العمر؟</h3>
              <p>تعتمد أداتنا على الحساب الزمني الدقيق للفوارق بين تاريخ اليوم وتاريخ ميلادك، مع مراعاة السنوات الكبيسة وفوارق الأيام في الأشهر الميلادية. كما نوفر لك تحويلاً فورياً لتاريخ ميلادك إلى التقويم الهجري.</p>
          </div>
      </div>
      
      <script src="/script.js"></script>
  </body>
  </html>
  `;
  
  res.send(html);
});

// صفحة سياسة الخصوصية (لـ AdSense)
app.get('/privacy-policy', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>سياسة الخصوصية - حاسبة العمر</title>
      <link rel="stylesheet" href="/style.css">
  </head>
  <body>
      <div class="container">
          <h1>سياسة الخصوصية</h1>
          <p>نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. لا نقوم بتخزين أي من التواريخ التي تدخلها في أداتنا.</p>
          <p>نستخدم ملفات تعريف الارتباط (كوكيز) لتحسين تجربتك وعرض الإعلانات المناسبة عبر Google AdSense.</p>
          <p>للاتصال بنا: example@email.com</p>
          <a href="/">العودة للصفحة الرئيسية</a>
      </div>
  </body>
  </html>
  `;
  res.send(html);
});

// صفحة من نحن
app.get('/about-us', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>من نحن - حاسبة العمر</title>
      <link rel="stylesheet" href="/style.css">
  </head>
  <body>
      <div class="container">
          <h1>من نحن</h1>
          <p>نقدم أداة بسيطة ودقيقة لحساب العمر بالتقويم الميلادي والهجري. هدفنا تسهيل معرفة العمر وتفاصيله للجميع.</p>
          <a href="/">العودة للصفحة الرئيسية</a>
      </div>
  </body>
  </html>
  `;
  res.send(html);
});

app.listen(port, () => {
  console.log(`الموقع يعمل على http://localhost:${port}`);
});
