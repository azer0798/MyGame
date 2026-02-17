function calculateAge() {
    const birthdayInput = document.getElementById('birthday').value;
    
    if (!birthdayInput) {
        alert('الرجاء إدخال تاريخ الميلاد');
        return;
    }
    
    const birthDate = new Date(birthdayInput);
    const today = new Date();
    
    // حساب العمر
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
    
    // تحديث العمر المعروض
    const ageElement = document.querySelector('.age-number');
    ageElement.innerHTML = `
        <span class="years">${years}</span> سنة 
        <span class="months">${months}</span> شهر 
        <span class="days">${days}</span> يوم
    `;
    
    // حساب التفاصيل الإضافية
    const totalDays = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = years * 12 + months;
    
    document.getElementById('totalMonths').textContent = totalMonths;
    document.getElementById('totalWeeks').textContent = totalWeeks;
    document.getElementById('totalDays').textContent = totalDays;
    
    // حساب عيد الميلاد القادم
    let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    const daysUntilBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
    
    document.querySelector('.days-count').textContent = daysUntilBirthday + ' يوم';
}

// إضافة مستمع حدث لزر Enter
document.getElementById('birthday').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        calculateAge();
    }
});

// حساب العمر تلقائياً عند تحميل الصفحة (للتاريخ الافتراضي)
window.addEventListener('load', function() {
    // يمكن تفعيل هذا إذا أردت حساب العمر تلقائياً عند التحميل
    // calculateAge();
});
