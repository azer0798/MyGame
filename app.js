const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// خدمة الملفات الثابتة
app.use(express.static(__dirname));

// الصفحة الرئيسية - حاسبة العمر
app.get('/', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>حاسبة العمر الدقيقة - احسب عمرك بالهجري والميلادي مع تفاصيل كاملة</title>
      <meta name="description" content="أداة احترافية ومجانية لحساب العمر بدقة متناهية باليوم والشهر والسنة، مع تحويل التاريخ إلى الهجري، وحساب التفاصيل الدقيقة لعمرك والأيام المتبقية على عيد ميلادك.">
      <meta name="keywords" content="حساب العمر, عمر, تاريخ ميلاد, حاسبة, هجري, ميلادي, عيد ميلاد">
      <meta name="author" content="حاسبة العمر">
      <link rel="canonical" href="https://mygame-o27w.onrender.com/">
      
      <!-- Open Graph Tags للمشاركة على وسائل التواصل -->
      <meta property="og:title" content="حاسبة العمر الدقيقة">
      <meta property="og:description" content="احسب عمرك بدقة مع تفاصيل كاملة وتحويل التاريخ الهجري">
      <meta property="og:type" content="website">
      <meta property="og:url" content="https://mygame-o27w.onrender.com/">
      
      <!-- الخطوط العربية من Google Fonts -->
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
      
      <!-- Font Awesome للأيقونات -->
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      
      <link rel="stylesheet" href="/style.css">
      
      <!-- البيانات المنظمة (Schema Markup) لتحسين SEO -->
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "حاسبة العمر الدقيقة",
        "description": "أداة احترافية لحساب العمر بالهجري والميلادي مع تفاصيل كاملة",
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "All",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "SAR"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "ratingCount": "1250"
        }
      }
      </script>
  </head>
  <body>
      <div class="container">
          <!-- إعلان علوي متوافق مع AdSense -->
          <div class="ad-container ad-top">
              <div class="ad-label">إعلان</div>
              <div class="ad-content">// كود إعلان AdSense هنا //</div>
          </div>
          
          <header class="main-header">
              <h1><i class="fas fa-calendar-alt"></i> حاسبة العمر باليوم والشهر والسنة</h1>
              <p class="subtitle">أداة دقيقة لحساب عمرك مع تفاصيل شاملة وتحويل التاريخ الهجري</p>
          </header>
          
          <!-- قسم إدخال التاريخ -->
          <div class="input-section card">
              <h2><i class="fas fa-birthday-cake"></i> أدخل تاريخ ميلادك</h2>
              
              <div class="date-input-group">
                  <div class="input-wrapper">
                      <label for="birthday"><i class="far fa-calendar"></i> تاريخ الميلاد:</label>
                      <input type="date" id="birthday" class="date-input" value="1990-01-01" max="2026-02-17">
                  </div>
                  
                  <button id="calculateBtn" class="calculate-btn">
                      <i class="fas fa-calculator"></i> احسب عمري
                  </button>
              </div>
              
              <div id="errorMessage" class="error-message" style="display: none;">
                  <i class="fas fa-exclamation-circle"></i> يرجى إدخال تاريخ ميلاد صحيح (لا يمكن أن يكون في المستقبل)
              </div>
          </div>
          
          <!-- قسم النتائج الرئيسية -->
          <div id="resultsSection" class="results-section">
              <!-- العمر الحالي -->
              <div class="age-card main-age card">
                  <div class="age-icon"><i class="fas fa-user-clock"></i></div>
                  <h3>عمرك الآن:</h3>
                  <div class="main-age-number" id="currentAge">
                      <span class="years" id="years">36</span> سنة 
                      <span class="months" id="months">1</span> شهر 
                      <span class="days" id="days">16</span> يوم
                  </div>
                  <div class="hijri-date" id="hijriDate">
                      <i class="fas fa-moon"></i> التاريخ الهجري: <span>15 شعبان 1445</span>
                  </div>
              </div>
              
              <!-- التفاصيل الإضافية -->
              <div class="details-grid">
                  <div class="detail-card card">
                      <div class="detail-icon"><i class="fas fa-calendar-week"></i></div>
                      <span class="detail-label">إجمالي الأشهر</span>
                      <span class="detail-value" id="totalMonths">433</span>
                  </div>
                  
                  <div class="detail-card card">
                      <div class="detail-icon"><i class="fas fa-clock"></i></div>
                      <span class="detail-label">إجمالي الأسابيع</span>
                      <span class="detail-value" id="totalWeeks">1,885</span>
                  </div>
                  
                  <div class="detail-card card">
                      <div class="detail-icon"><i class="fas fa-sun"></i></div>
                      <span class="detail-label">إجمالي الأيام</span>
                      <span class="detail-value" id="totalDays">13,196</span>
                  </div>
                  
                  <div class="detail-card card">
                      <div class="detail-icon"><i class="fas fa-hourglass-half"></i></div>
                      <span class="detail-label">إجمالي الساعات</span>
                      <span class="detail-value" id="totalHours">316,704</span>
                  </div>
                  
                  <div class="detail-card card">
                      <div class="detail-icon"><i class="fas fa-heartbeat"></i></div>
                      <span class="detail-label">إجمالي الدقائق</span>
                      <span class="detail-value" id="totalMinutes">19,002,240</span>
                  </div>
                  
                  <div class="detail-card card">
                      <div class="detail-icon"><i class="fas fa-smile"></i></div>
                      <span class="detail-label">إجمالي الثواني</span>
                      <span class="detail-value" id="totalSeconds">1,140,134,400</span>
                  </div>
              </div>
              
              <!-- عيد الميلاد القادم -->
              <div class="birthday-card card">
                  <div class="birthday-icon"><i class="fas fa-gift"></i></div>
                  <div class="birthday-content">
                      <h3>يفصلك عن عيد ميلادك القادم:</h3>
                      <div class="days-count" id="daysUntilBirthday">318</div>
                      <div class="days-label">يوم</div>
                  </div>
              </div>
              
              <!-- حقائق ممتعة عن العمر -->
              <div class="fun-facts card">
                  <h3><i class="fas fa-lightbulb"></i> هل تعلم؟</h3>
                  <p id="funFact">لقد عشت ما يقارب 1,140,134,400 ثانية! هذا وقت كافٍ لمشاهدة فيلم "العراب" أكثر من 380,000 مرة!</p>
              </div>
              
              <!-- أزرار المشاركة -->
              <div class="share-section">
                  <h4><i class="fas fa-share-alt"></i> شارك نتيجتك:</h4>
                  <div class="share-buttons">
                      <a href="#" id="shareTwitter" class="share-btn twitter" target="_blank"><i class="fab fa-twitter"></i> تويتر</a>
                      <a href="#" id="shareFacebook" class="share-btn facebook" target="_blank"><i class="fab fa-facebook-f"></i> فيسبوك</a>
                      <a href="#" id="shareWhatsapp" class="share-btn whatsapp" target="_blank"><i class="fab fa-whatsapp"></i> واتساب</a>
                      <a href="#" id="shareCopy" class="share-btn copy"><i class="fas fa-link"></i> نسخ الرابط</a>
                  </div>
              </div>
          </div>
          
          <!-- إعلان سفلي -->
          <div class="ad-container ad-bottom">
              <div class="ad-label">إعلان</div>
              <div class="ad-content">// كود إعلان AdSense هنا //</div>
          </div>
          
          <!-- قسم الشرح -->
          <div class="explanation card">
              <h3><i class="fas fa-question-circle"></i> كيف يتم حساب العمر بدقة؟</h3>
              <p>تعتمد أداتنا على الحساب الزمني الدقيق للفوارق بين تاريخ اليوم وتاريخ ميلادك، مع مراعاة:</p>
              <ul>
                  <li><i class="fas fa-check-circle"></i> السنوات الكبيسة (سنوات 366 يوم)</li>
                  <li><i class="fas fa-check-circle"></i> فوارق الأيام في الأشهر الميلادية (30/31 يوم)</li>
                  <li><i class="fas fa-check-circle"></i> شهر فبراير بأنواعه (28 أو 29 يوم)</li>
                  <li><i class="fas fa-check-circle"></i> المناطق الزمنية والتوقيت الصيفي</li>
              </ul>
              <p>كما نوفر لك تحويلاً فورياً لتاريخ ميلادك إلى التقويم الهجري القمري بدقة عالية.</p>
          </div>
          
          <!-- روابط سريعة -->
          <div class="quick-links">
              <a href="/privacy-policy"><i class="fas fa-shield-alt"></i> سياسة الخصوصية</a>
              <a href="/about-us"><i class="fas fa-info-circle"></i> من نحن</a>
              <a href="/contact-us"><i class="fas fa-envelope"></i> اتصل بنا</a>
              <a href="/date-difference"><i class="fas fa-clock"></i> حساب الفرق بين تاريخين</a>
          </div>
          
          <!-- تذييل الصفحة -->
          <footer>
              <p>© 2026 حاسبة العمر الدقيقة - جميع الحقوق محفوظة</p>
          </footer>
      </div>
      
      <!-- مكتبة moment للتعامل مع التواريخ -->
      <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/moment-hijri/2.1.2/moment-hijri.min.js"></script>
      
      <script src="/script.js"></script>
  </body>
  </html>
  `;
  res.send(html);
});

// صفحة سياسة الخصوصية
app.get('/privacy-policy', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>سياسة الخصوصية - حاسبة العمر</title>
      <meta name="robots" content="noindex, follow">
      <link rel="stylesheet" href="/style.css">
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  </head>
  <body>
      <div class="container">
          <div class="legal-page card">
              <h1><i class="fas fa-shield-alt"></i> سياسة الخصوصية</h1>
              <p class="last-updated">آخر تحديث: 17 فبراير 2026</p>
              
              <h2>المقدمة</h2>
              <p>نحن في "حاسبة العمر" نلتزم بحماية خصوصيتك وبياناتك الشخصية. توضح سياسة الخصوصية هذه كيفية تعاملنا مع معلوماتك عندما تستخدم أداتنا.</p>
              
              <h2>المعلومات التي نجمعها</h2>
              <p><strong>لا نقوم بتخزين أي تواريخ ميلاد</strong> تدخلها في أداتنا. جميع العمليات الحسابية تتم مباشرة على جهازك (في المتصفح) ولا يتم إرسال أي بيانات إلى خوادمنا.</p>
              
              <h2>ملفات تعريف الارتباط (Cookies)</h2>
              <p>نستخدم ملفات تعريف الارتباط لتحسين تجربتك وعرض الإعلانات المناسبة عبر Google AdSense. هذه الملفات لا تحتوي على معلومات شخصية تعريفية.</p>
              
              <h2>الإعلانات</h2>
              <p>نستخدم Google AdSense لعرض الإعلانات. يستخدم Google ملفات تعريف الارتباط لعرض إعلانات مخصصة بناءً على زياراتك السابقة لمواقع الويب الأخرى.</p>
              
              <h2>حقوقك</h2>
              <p>لديك الحق في رفض ملفات تعريف الارتباط عن طريق ضبط إعدادات المتصفح الخاص بك. هذا قد يؤثر على تجربتك في الموقع.</p>
              
              <h2>التغييرات على السياسة</h2>
              <p>قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنقوم بنشر أي تغييرات على هذه الصفحة.</p>
              
              <h2>اتصل بنا</h2>
              <p>إذا كان لديك أي أسئلة حول سياسة الخصوصية، يرجى التواصل معنا عبر البريد الإلكتروني: privacy@age-calculator.com</p>
              
              <a href="/" class="back-home"><i class="fas fa-arrow-right"></i> العودة للصفحة الرئيسية</a>
          </div>
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
      <meta name="robots" content="noindex, follow">
      <link rel="stylesheet" href="/style.css">
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  </head>
  <body>
      <div class="container">
          <div class="legal-page card">
              <h1><i class="fas fa-users"></i> من نحن</h1>
              
              <h2>رؤيتنا</h2>
              <p>نحن فريق من المطورين والمصممين العرب نسعى لتقديم أدوات ويب بسيطة ودقيقة تسهل حياة المستخدمين اليومية. نؤمن بأن التكنولوجيا يجب أن تكون في خدمة الجميع وبأبسط صورة ممكنة.</p>
              
              <h2>قصتنا</h2>
              <p>انطلقت فكرة حاسبة العمر عندما لاحظنا الحاجة لأداة عربية دقيقة تحسب العمر بالتفصيل مع مراعاة خصوصية التقويم الهجري. قررنا بناء أداة تجمع بين الدقة العلمية والسهولة في الاستخدام.</p>
              
              <h2>قيمنا</h2>
              <ul>
                  <li><i class="fas fa-check-circle"></i> <strong>الدقة:</strong> نعتمد على حسابات رياضية دقيقة مع مراعاة كل التفاصيل الزمنية.</li>
                  <li><i class="fas fa-check-circle"></i> <strong>الخصوصية:</strong> لا نخزن أي من بيانات المستخدمين.</li>
                  <li><i class="fas fa-check-circle"></i> <strong>المجانية:</strong> جميع أدواتنا مجانية بالكامل.</li>
                  <li><i class="fas fa-check-circle"></i> <strong>التطوير المستمر:</strong> نستمع لاقتراحاتكم ونطور أدواتنا باستمرار.</li>
              </ul>
              
              <h2>تواصل معنا</h2>
              <p>نرحب بملاحظاتكم واقتراحاتكم على البريد الإلكتروني: info@age-calculator.com</p>
              
              <a href="/" class="back-home"><i class="fas fa-arrow-right"></i> العودة للصفحة الرئيسية</a>
          </div>
      </div>
  </body>
  </html>
  `;
  res.send(html);
});

// صفحة اتصل بنا
app.get('/contact-us', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>اتصل بنا - حاسبة العمر</title>
      <meta name="robots" content="noindex, follow">
      <link rel="stylesheet" href="/style.css">
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  </head>
  <body>
      <div class="container">
          <div class="legal-page card">
              <h1><i class="fas fa-envelope"></i> اتصل بنا</h1>
              
              <p>نحن سعداء بتواصلك معنا! يمكنك مراسلتنا عبر البريد الإلكتروني أو متابعتنا على وسائل التواصل الاجتماعي.</p>
              
              <div class="contact-info">
                  <div class="contact-item">
                      <i class="fas fa-envelope"></i>
                      <span>البريد الإلكتروني: contact@age-calculator.com</span>
                  </div>
                  <div class="contact-item">
                      <i class="fab fa-twitter"></i>
                      <span>تويتر: @agecalculator</span>
                  </div>
                  <div class="contact-item">
                      <i class="fab fa-facebook"></i>
                      <span>فيسبوك: /agecalculator</span>
                  </div>
              </div>
              
              <p>نحاول الرد على جميع الاستفسارات خلال 24-48 ساعة عمل.</p>
              
              <a href="/" class="back-home"><i class="fas fa-arrow-right"></i> العودة للصفحة الرئيسية</a>
          </div>
      </div>
  </body>
  </html>
  `;
  res.send(html);
});

// صفحة حساب الفرق بين تاريخين
app.get('/date-difference', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>حساب الفرق بين تاريخين - أداة متقدمة</title>
      <meta name="description" content="أداة احترافية لحساب الفرق بين تاريخين باليوم والشهر والسنة، مع عرض النتيجة بالأيام والأسابيع والأشهر والسنين.">
      <link rel="stylesheet" href="/style.css">
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  </head>
  <body>
      <div class="container">
          <div class="card">
              <h1><i class="fas fa-clock"></i> حساب الفرق بين تاريخين</h1>
              
              <div class="date-input-group">
                  <div class="input-wrapper">
                      <label for="dateFrom">من تاريخ:</label>
                      <input type="date" id="dateFrom" class="date-input" value="2020-01-01">
                  </div>
                  
                  <div class="input-wrapper">
                      <label for="dateTo">إلى تاريخ:</label>
                      <input type="date" id="dateTo" class="date-input" value="2026-02-17">
                  </div>
                  
                  <button id="calculateDiffBtn" class="calculate-btn">
                      <i class="fas fa-calculator"></i> احسب الفرق
                  </button>
              </div>
              
              <div id="diffError" class="error-message" style="display: none;">
                  <i class="fas fa-exclamation-circle"></i> يرجى التأكد من إدخال تاريخين صحيحين
              </div>
              
              <div id="diffResults" class="diff-results" style="display: none;">
                  <h2>الفرق بين التاريخين:</h2>
                  <div class="main-diff" id="mainDiff">6 سنوات 1 شهر 16 يوم</div>
                  
                  <div class="diff-details">
                      <div class="diff-item"><span>بالأشهر:</span> <span id="diffMonths">73</span></div>
                      <div class="diff-item"><span>بالأسابيع:</span> <span id="diffWeeks">318</span></div>
                      <div class="diff-item"><span>بالأيام:</span> <span id="diffDays">2,228</span></div>
                      <div class="diff-item"><span>بالساعات:</span> <span id="diffHours">53,472</span></div>
                  </div>
              </div>
              
              <a href="/" class="back-home"><i class="fas fa-arrow-right"></i> العودة للصفحة الرئيسية</a>
          </div>
      </div>
      
      <script>
          document.getElementById('calculateDiffBtn').addEventListener('click', function() {
              const dateFrom = new Date(document.getElementById('dateFrom').value);
              const dateTo = new Date(document.getElementById('dateTo').value);
              
              if (!document.getElementById('dateFrom').value || !document.getElementById('dateTo').value) {
                  document.getElementById('diffError').style.display = 'block';
                  document.getElementById('diffResults').style.display = 'none';
                  return;
              }
              
              if (dateFrom > dateTo) {
                  document.getElementById('diffError').textContent = 'تاريخ "من" يجب أن يكون قبل تاريخ "إلى"';
                  document.getElementById('diffError').style.display = 'block';
                  document.getElementById('diffResults').style.display = 'none';
                  return;
              }
              
              document.getElementById('diffError').style.display = 'none';
              
              // حساب الفرق
              let years = dateTo.getFullYear() - dateFrom.getFullYear();
              let months = dateTo.getMonth() - dateFrom.getMonth();
              let days = dateTo.getDate() - dateFrom.getDate();
              
              if (days < 0) {
                  months--;
                  const lastMonth = new Date(dateTo.getFullYear(), dateTo.getMonth(), 0);
                  days += lastMonth.getDate();
              }
              
              if (months < 0) {
                  years--;
                  months += 12;
              }
              
              document.getElementById('mainDiff').textContent = 
                  \`\${years} سنوات \${months} أشهر \${days} أيام\`;
              
              // حساب التفاصيل
              const totalDays = Math.floor((dateTo - dateFrom) / (1000 * 60 * 60 * 24));
              const totalWeeks = Math.floor(totalDays / 7);
              const totalMonths = years * 12 + months;
              const totalHours = totalDays * 24;
              
              document.getElementById('diffMonths').textContent = totalMonths;
              document.getElementById('diffWeeks').textContent = totalWeeks;
              document.getElementById('diffDays').textContent = totalDays;
              document.getElementById('diffHours').textContent = totalHours;
              
              document.getElementById('diffResults').style.display = 'block';
          });
      </script>
  </body>
  </html>
  `;
  res.send(html);
});

// معالجة الأخطاء 404
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>الصفحة غير موجودة - 404</title>
        <link rel="stylesheet" href="/style.css">
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    </head>
    <body>
        <div class="container">
            <div class="error-404 card">
                <i class="fas fa-exclamation-triangle"></i>
                <h1>404</h1>
                <h2>عذراً، الصفحة غير موجودة</h2>
                <p>الصفحة التي تبحث عنها قد تكون انتقلت أو تم حذفها.</p>
                <a href="/" class="back-home"><i class="fas fa-home"></i> العودة للصفحة الرئيسية</a>
            </div>
        </div>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`✓ الموقع يعمل بنجاح على http://localhost:${port}`);
  console.log(`✓ تم تفعيل الصفحات: الرئيسية، سياسة الخصوصية، من نحن، اتصل بنا، حساب الفرق`);
});
