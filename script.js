// تهيئة المتغيرات العامة
let currentFunFactIndex = 0;

// قائمة الحقائق الممتعة
const funFacts = [
    (years, months, days, totalSeconds) => `لقد عشت ما يقارب ${totalSeconds.toLocaleString()} ثانية! هذا وقت كافٍ لمشاهدة فيلم "العراب" أكثر من ${Math.floor(totalSeconds / (60*60*3))} مرة!`,
    (years, months, days, totalSeconds) => `خلال هذه الفترة، قلبك نبض حوالي ${Math.floor(totalSeconds / 0.8).toLocaleString()} مرة!`,
    (years, months, days, totalSeconds) => `لو كنت تمشي ساعة يومياً، لقطعت مسافة ${Math.floor(years * 365 * 5).toLocaleString()} كيلومتر!`,
    (years, months, days, totalSeconds) => `عدد المرات التي ضحكت فيها تقريباً ${Math.floor(years * 365 * 15).toLocaleString()} مرة!`,
    (years, months, days, totalSeconds) => `قضيت حوالي ${Math.floor(years * 365 * 8).toLocaleString()} ساعة نائم!`,
    (years, months, days, totalSeconds) => `أكلت حوالي ${Math.floor(years * 365 * 3).toLocaleString()} وجبة!`
];

// تهيئة moment للتقويم الهجري
moment.locale('ar');

// دالة حساب العمر
function calculateAge(birthDate) {
    const today = new Date();
    
    // التحقق من صحة التاريخ
    if (birthDate > today) {
        showError('لا يمكن أن يكون تاريخ الميلاد في المستقبل');
        return null;
    }
    
    hideError();
    
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
    
    // حساب التاريخ الهجري
    const hijri = moment(birthDate).format('iYYYY/iM/iD');
    const hijriDate = convertHijriToArabic(hijri);
    
    return {
        years, months, days,
        totalMonths, totalWeeks, totalDays,
        totalHours, totalMinutes, totalSeconds,
        daysUntilBirthday,
        hijriDate
    };
}

// دالة تحويل التاريخ الهجري إلى نص عربي
function convertHijriToArabic(hijriString) {
    const [year, month, day] = hijriString.split('/');
    const monthNames = [
        'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
        'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
        'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];
    return `${day} ${monthNames[parseInt(month)-1]} ${year}`;
}

// دالة تحديث واجهة المستخدم
function updateUI(ageData) {
    if (!ageData) return;
    
    // تحديث العمر الرئيسي
    document.getElementById('years').textContent = ageData.years;
    document.getElementById('months').textContent = ageData.months;
    document.getElementById('days').textContent = ageData.days;
    
    // تحديث التفاصيل
    document.getElementById('totalMonths').textContent = ageData.totalMonths.toLocaleString();
    document.getElementById('totalWeeks').textContent = ageData.totalWeeks.toLocaleString();
    document.getElementById('totalDays').textContent = ageData.totalDays.toLocaleString();
    document.getElementById('totalHours').textContent = ageData.totalHours.toLocaleString();
    document.getElementById('totalMinutes').textContent = ageData.totalMinutes.toLocaleString();
    document.getElementById('totalSeconds').textContent = ageData.totalSeconds.toLocaleString();
    
    // تحديث عيد الميلاد
    document.getElementById('daysUntilBirthday').textContent = ageData.daysUntilBirthday;
    
    // تحديث التاريخ الهجري
    document.getElementById('hijriDate').innerHTML = `<i class="fas fa-moon"></i> التاريخ الهجري: <span>${ageData.hijriDate}</span>`;
    
    // تحديث الحقيقة الممتعة
    updateFunFact(ageData);
    
    // تحديث روابط المشاركة
    updateShareLinks(ageData);
    
    // تمرير سلس إلى النتائج
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// دالة تحديث الحقيقة الممتعة
function updateFunFact(ageData) {
    const factElement = document.getElementById('funFact');
    const newFact = funFacts[currentFunFactIndex](
        ageData.years, ageData.months, ageData.days, ageData.totalSeconds
    );
    factElement.textContent = newFact;
    
    // تحديث الفهرس للفقرة التالية
    currentFunFactIndex = (currentFunFactIndex + 1) % funFacts.length;
}

// دالة تحديث روابط المشاركة
function updateShareLinks(ageData) {
    const currentUrl = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(
        `عمري الآن ${ageData.years} سنة و ${ageData.months} شهر و ${ageData.days} يوم! احسب عمرك الآن`
    );
    
    document.getElementById('shareTwitter').href = `https://twitter.com/intent/tweet?text=${text}&url=${currentUrl}`;
    document.getElementById('shareFacebook').href = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
    document.getElementById('shareWhatsapp').href = `https://wa.me/?text=${text}%20${currentUrl}`;
}

// دالة إظهار الخطأ
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'flex';
}

// دالة إخفاء الخطأ
function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

// دالة نسخ الرابط
function copyToClipboard() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        alert('تم نسخ الرابط بنجاح!');
    }).catch(() => {
        alert('فشل نسخ الرابط، يرجى المحاولة مرة أخرى');
    });
}

// حدث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const birthdayInput = document.getElementById('birthday');
    const calculateBtn = document.getElementById('calculateBtn');
    
    // تعيين تاريخ افتراضي (مثال: 1 يناير 1990)
    const defaultDate = new Date('1990-01-01');
    const year = defaultDate.getFullYear();
    const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
    const day = String(defaultDate.getDate()).padStart(2, '0');
    birthdayInput.value = `${year}-${month}-${day}`;
    
    // حساب العمر للتاريخ الافتراضي
    const initialAge = calculateAge(new Date(birthdayInput.value));
    updateUI(initialAge);
    
    // حدث زر الحساب
    calculateBtn.addEventListener('click', function() {
        const birthDate = new Date(birthdayInput.value);
        const ageData = calculateAge(birthDate);
        updateUI(ageData);
    });
    
    // حدث الضغط على Enter
    birthdayInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            calculateBtn.click();
        }
    });
    
    // حدث زر نسخ الرابط
    document.getElementById('shareCopy').addEventListener('click', function(e) {
        e.preventDefault();
        copyToClipboard();
    });
    
    // تغيير الحقيقة الممتعة كل 10 ثواني
    setInterval(() => {
        const birthDate = new Date(birthdayInput.value);
        const ageData = calculateAge(birthDate);
        if (ageData) {
            updateFunFact(ageData);
        }
    }, 10000);
});
