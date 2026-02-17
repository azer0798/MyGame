document.addEventListener('DOMContentLoaded', function() {
    const ageForm = document.getElementById('ageForm');
    const birthdayInput = document.getElementById('birthday');
    const errorMessageDiv = document.getElementById('errorMessage');

    if (ageForm) {
        ageForm.addEventListener('submit', function(event) {
            const selectedDate = new Date(birthdayInput.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // تجاهل الوقت لمقارنة التواريخ فقط

            if (!birthdayInput.value) {
                event.preventDefault();
                showError('الرجاء إدخال تاريخ الميلاد');
            } else if (selectedDate > today) {
                event.preventDefault();
                showError('تاريخ الميلاد لا يمكن أن يكون في المستقبل');
            } else {
                // إذا كان التاريخ صحيحاً، نسمح بإرسال النموذج
                errorMessageDiv.style.display = 'none';
            }
        });
    }

    function showError(message) {
        if (errorMessageDiv) {
            errorMessageDiv.textContent = message;
            errorMessageDiv.style.display = 'flex';
        } else {
            alert(message);
        }
    }

    // التحقق من وجود خطأ في رابط الصفحة (مثل ?error=futureDate)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
        const error = urlParams.get('error');
        if (error === 'futureDate') {
            showError('تاريخ الميلاد لا يمكن أن يكون في المستقبل');
        } else if (error === 'noDate') {
            showError('الرجاء إدخال تاريخ الميلاد');
        }
    }
});
