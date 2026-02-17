function calculateAge() {
    const birthDateInput = document.getElementById('birthDate').value;
    if (!birthDateInput) {
        alert("من فضلك اختر تاريخ ميلادك أولاً!");
        return;
    }

    const birthDate = new Date(birthDateInput);
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    // تصحيح الحسابات إذا كانت الأيام أو الأشهر سالبة
    if (days < 0) {
        months--;
        days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    // عرض النتائج
    document.getElementById('result').style.display = 'block';
    document.getElementById('years').innerText = years;
    document.getElementById('months').innerText = months;
    document.getElementById('days').innerText = days;

    // حساب الأيام المتبقية لعيد الميلاد القادم
    let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (today > nextBirthday) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    const diff = nextBirthday - today;
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    document.getElementById('remaining').innerText = daysLeft + " يوم";
}
