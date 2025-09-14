// عناصر الصفحة
const casesContainer = document.getElementById('cases-container');
const caseDetailsDiv = document.getElementById('case-details');
const tabs = document.querySelectorAll('.tab');
const allCounter = document.getElementById('all-counter');
const murderCounter = document.getElementById('murder-counter');
const theftCounter = document.getElementById('theft-counter');
const mysteryCounter = document.getElementById('mystery-counter');
const solvedCountSpan = document.getElementById('solved-count');
const totalCountSpan = document.getElementById('total-count');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const solutionModal = document.getElementById('solution-modal');
const solutionInput = document.getElementById('solution-input');
const submitSolutionBtn = document.getElementById('submit-solution');
const cancelSolutionBtn = document.getElementById('cancel-solution');
const noticeBox = document.querySelector('.notice-box');

let currentCategory = 'all';
let currentCaseIndex = null;
let firstVisit = true;
let solutionStep = 0;
let solutionAnswers = [];

// إحصائيات المستخدم
function getStats() {
    const solved = complexCases.filter(c => c.solved);
    const hardest = solved.length ? solved.reduce((a, b) => a.complexity > b.complexity ? a : b) : null;
    const startTime = getStartTime();
    const now = Date.now();
    const minutes = Math.floor((now - startTime) / 60000);
    return {
        solvedCount: solved.length,
        totalCount: complexCases.length,
        minutes,
        hardestTitle: hardest ? hardest.title : 'لا يوجد بعد'
    };
}

// عرض الإحصائيات الشخصية
function renderStats() {
    const statsDivId = 'user-stats-box';
    let statsDiv = document.getElementById(statsDivId);
    if (!statsDiv) {
        statsDiv = document.createElement('div');
        statsDiv.id = statsDivId;
        statsDiv.style = 'background:#203a43;color:#fff;padding:1rem 1.5rem;margin:1.5rem auto 1rem auto;border-radius:12px;max-width:420px;text-align:center;font-size:1.1rem;box-shadow:0 2px 12px #0002;';
        document.querySelector('.container').prepend(statsDiv);
    }
    const stats = getStats();
    statsDiv.innerHTML = `<strong>إحصائياتك الشخصية:</strong><br>
    عدد القضايا المحلولة: <span style='color:#27ae60;font-weight:bold;'>${stats.solvedCount}</span> / ${stats.totalCount}<br>
    الوقت المستغرق منذ أول زيارة: <span style='color:#f39c12;font-weight:bold;'>${stats.minutes} دقيقة</span><br>
    أصعب قضية تم حلها: <span style='color:#902114;font-weight:bold;'>${stats.hardestTitle}</span>`;
}

// حساب عدد القضايا لكل تصنيف
function updateCounters() {
    allCounter.textContent = complexCases.length;
    murderCounter.textContent = complexCases.filter(c => c.category === 'murder').length;
    theftCounter.textContent = complexCases.filter(c => c.category === 'theft').length;
    mysteryCounter.textContent = complexCases.filter(c => c.category === 'mystery').length;
    document.getElementById('arson-counter').textContent = complexCases.filter(c => c.solved).length;
    totalCountSpan.textContent = complexCases.length;
    solvedCountSpan.textContent = complexCases.filter(c => c.solved).length;
    updateProgressBar();
    saveProgress();
    renderStats();
    // إظهار صندوق الشهادة فقط عند حل جميع القضايا
    if (complexCases.length > 0 && complexCases.every(c => c.solved)) {
        noticeBox.style.display = '';
        setTimeout(() => {
            noticeBox.scrollIntoView({behavior: 'smooth'});
        }, 600);
    } else {
        noticeBox.style.display = 'none';
    }
}

// تحديث شريط التقدم
function updateProgressBar() {
    const solved = complexCases.filter(c => c.solved).length;
    const total = complexCases.length;
    const percent = total ? Math.round((solved / total) * 100) : 0;
    progressFill.style.width = percent + '%';
    progressText.textContent = percent + '%';
}

// عرض القضايا حسب التصنيف
function renderCases() {
    casesContainer.innerHTML = '';
    let filteredCases = complexCases;
    if (currentCategory === 'arson') {
        filteredCases = complexCases.filter(c => c.solved);
    } else if (currentCategory !== 'all') {
        filteredCases = complexCases.filter(c => c.category === currentCategory);
    }
    filteredCases.forEach((caseItem, index) => {
        const card = document.createElement('div');
        card.className = 'case-card' + (caseItem.solved ? ' solved' : '');
        card.innerHTML = `
            <div class="case-header">
                <span class="case-number">${index + 1}</span>
                <h3>${caseItem.title}</h3>
            </div>
            <div class="case-body">
                <div class="case-description">${caseItem.description}</div>
                <div class="case-stats">
                    <div class="stat">
                        <i class="fas fa-fingerprint"></i>
                        <span>${caseItem.evidence.length} أدلة</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-users"></i>
                        <span>${caseItem.suspects.length} مشتبه</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-brain"></i>
                        <span>صعوبة: ${caseItem.complexity}/10</span>
                    </div>
                </div>
                <a href="#" class="read-more" data-idx="${complexCases.indexOf(caseItem)}">
                    <i class="fas fa-search"></i> تحقق في القضية
                </a>

            </div>
        `;
        casesContainer.appendChild(card);
    });
}

// عرض تفاصيل القضية
function showCaseDetails(idx) {
    const c = complexCases[idx];
    const solvedClass = c.solved ? 'solved-green' : '';
    caseDetailsDiv.innerHTML = `
        <div class="case-details ${solvedClass}" style="display:block;">
            <button class="back-button"><i class="fas fa-arrow-right"></i> رجوع للقائمة</button>
            <h2 class="case-title">${c.title}</h2>
            <div class="case-description">${c.description}</div>
            <div class="complexity-badge">الصعوبة: ${c.complexity}/10</div>
            <div class="evidence-list">
                <h3><i class="fas fa-flask"></i> الأدلة</h3>
                ${c.evidence.map(e => `<div class="evidence-item${e.important ? ' important' : ''}">${e.text}</div>`).join('')}
            </div>
            <div class="suspects-list">
                <h3><i class="fas fa-user-secret"></i> المشتبهون</h3>
                <div class="suspects-grid">
                    ${c.suspects.map(s => `
                        <div class="suspect-card">
                            <h4>${s.name}</h4>
                            <p>${s.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${c.solved ? `<div class="solved-box" style="background:#27ae60;color:#fff;font-weight:bold;text-align:center;margin:2rem 0;padding:1.2rem;border-radius:10px;box-shadow:0 2px 12px #27ae6055;">تم حل القضية! ✅</div>` : `
                <button class="solve-case" data-idx="${idx}"><i class="fas fa-gavel"></i> حل القضية</button>
                <button class="hint-case" style="background:#f39c12;color:#fff;border:none;padding:0.7rem 1.5rem;border-radius:8px;cursor:pointer;font-weight:bold;margin-top:1rem;display:block;width:100%;"><i class="fas fa-lightbulb"></i> تلميح</button>
                <div class="hint-box" style="display:none;margin-top:1rem;background:#fff3cd;color:#902114;padding:1rem;border-radius:8px;font-weight:bold;"></div>
            `}
        </div>
    `;
    caseDetailsDiv.scrollIntoView({ behavior: 'smooth' });
    currentCaseIndex = idx;
    // زر الرجوع
    caseDetailsDiv.querySelector('.back-button').onclick = () => {
        caseDetailsDiv.innerHTML = '';
    };
    // زر حل القضية
    const solveBtn = caseDetailsDiv.querySelector('.solve-case');
    if (solveBtn) {
        solveBtn.onclick = () => {
            solutionModal.style.display = 'block';
            solutionInput.value = '';
            solutionInput.placeholder = 'اكتب اسم المشتبه...';
            solutionStep = 0;
            solutionAnswers = [];
            solutionInput.focus();
            // رسالة توضيحية إذا كان هناك أكثر من مشتبه
            const c = complexCases[idx];
            let infoMsg = solutionModal.querySelector('.multi-suspect-info');
            if (c.solution.length > 1) {
                if (!infoMsg) {
                    infoMsg = document.createElement('div');
                    infoMsg.className = 'multi-suspect-info';
                    infoMsg.style = 'background:#ffe6b3;color:#902114;padding:0.7rem 1rem;margin-bottom:1rem;border-radius:8px;font-weight:bold;text-align:center;';
                    infoMsg.innerText = 'هذه القضية تتطلب أكثر من مشتبه، يرجى إدخال جميع الأسماء المطلوبة بالتسلسل.';
                    solutionModal.querySelector('.solution-content').prepend(infoMsg);
                }
            } else if (infoMsg) {
                infoMsg.remove();
            }
        };
    }
    // زر التلميح
    const hintBtn = caseDetailsDiv.querySelector('.hint-case');
    const hintBox = caseDetailsDiv.querySelector('.hint-box');
    if (hintBtn && hintBox) {
        hintBtn.onclick = () => {
            hintBox.style.display = 'block';
            // تلميح افتراضي بناءً على الأدلة والمشتبهين
            let importantEvidence = c.evidence.find(e => e.important);
            let suspectNames = c.suspects.map(s => s.name).join(', ');
            let hintText = importantEvidence ? `ركز على الدليل التالي: "${importantEvidence.text}".` : 'راجع الأدلة المهمة في القضية.';
            hintText += `\nفكر في المشتبهين الأكثر ارتباطاً بالأحداث: ${suspectNames}.`;
            hintBox.innerText = hintText;
        };
    }
}

// تفعيل الفلاتر (tabs)
tabs.forEach(tab => {
    tab.onclick = () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.getAttribute('data-category');
        noticeBox.style.display = 'none';
        renderCases();
        caseDetailsDiv.innerHTML = '';
    };
});

// تفعيل زر تفاصيل القضية
casesContainer.addEventListener('click', function (e) {
    const btn = e.target.closest('.read-more');
    if (btn) {
        e.preventDefault();
        const idx = parseInt(btn.getAttribute('data-idx'));
        showCaseDetails(idx);
        solutionStep = 0;
        solutionAnswers = [];
    }
});

// نافذة الحل: زر الإلغاء
cancelSolutionBtn.onclick = () => {
    solutionModal.style.display = 'none';
};

// نافذة الحل: زر التأكيد
submitSolutionBtn.onclick = () => {
    const answer = solutionInput.value.trim();
    const c = complexCases[currentCaseIndex];
    if (!answer) {
        solutionInput.style.borderColor = 'var(--warning-color)';
        solutionInput.placeholder = 'يرجى كتابة اسم المشتبه!';
        return;
    }
    // تحقق مرن من الحل
    const expected = c.solution[solutionStep];
    if (expected && normalizeAnswer(expected) === normalizeAnswer(answer)) {
        solutionAnswers.push(answer);
        solutionStep++;
        if (solutionStep < c.solution.length) {
            solutionInput.value = '';
            solutionInput.style.borderColor = '';
            solutionInput.placeholder = `اكتب اسم المشتبه التالي (${solutionStep + 1} من ${c.solution.length})...`;
            return;
        } else {
            c.solved = true;
            solutionModal.style.display = 'none';
            showCaseDetails(currentCaseIndex);
            updateCounters();
            renderCases();
            solutionStep = 0;
            solutionAnswers = [];
            // مؤثر صوتي وبصري للنجاح
            audioSuccess.currentTime = 0;
            audioSuccess.play();
            solutionModal.classList.add('solved-success');
            setTimeout(() => {
                solutionModal.classList.remove('solved-success');
                alert('أحسنت! تم حل القضية بنجاح ✅');
            }, 600);
        }
    } else {
        solutionInput.style.borderColor = 'var(--warning-color)';
        solutionInput.value = '';
        solutionInput.placeholder = 'الإجابة غير صحيحة، حاول مرة أخرى!';
        solutionStep = 0;
        solutionAnswers = [];
        // مؤثر صوتي وبصري للخطأ
        audioError.currentTime = 0;
        audioError.play();
        solutionModal.classList.add('solved-error');
        setTimeout(() => {
            solutionModal.classList.remove('solved-error');
        }, 600);
    }
};

// إغلاق نافذة الحل عند الضغط خارجها
window.onclick = function (e) {
    if (e.target === solutionModal) {
        solutionModal.style.display = 'none';
    }
};

// نافذة حول الموقع
const aboutBtn = document.getElementById('about-btn');
const aboutModal = document.getElementById('about-modal');
const closeAbout = document.getElementById('close-about');
if (aboutBtn && aboutModal && closeAbout) {
    aboutBtn.onclick = () => {
        aboutModal.style.display = 'block';
    };
    closeAbout.onclick = () => {
        aboutModal.style.display = 'none';
    };
    window.addEventListener('click', function(e) {
        if (e.target === aboutModal) aboutModal.style.display = 'none';
    });
}

// إظهار صندوق الشهادة فقط عند أول دخول (مع إخفاء القضايا)، ثم إخفاؤه عند فتح أي قسم، وإظهاره مجدداً فقط عند حل جميع القضايا.
function toggleNoticeBox() {
    if (!noticeBox) return;
    if (firstVisit) {
        noticeBox.style.display = '';
        casesContainer.innerHTML = '';
        caseDetailsDiv.innerHTML = '';
        firstVisit = false;
        return;
    }
    // إظهار الصندوق فقط عند حل جميع القضايا
    if (complexCases.length > 0 && complexCases.every(c => c.solved)) {
        noticeBox.style.display = '';
        setTimeout(() => {
            noticeBox.scrollIntoView({behavior: 'smooth'});
        }, 600);
    } else {
        noticeBox.style.display = 'none';
    }
}
window.addEventListener('DOMContentLoaded', () => {
    loadProgress();
    toggleNoticeBox();
    renderStats();
});

// تهيئة الصفحة
updateCounters();
renderCases();

window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    e.returnValue = '';
    alert('تم استعادة تقدمك، ولا يتم فقدان التقدم.');
});

// دالة لتطبيع الإجابات (إزالة الحركات والمسافات)
function normalizeAnswer(str) {
    // إزالة المسافات والحركات العربية
    return str.replace(/\s/g, '').replace(/[\u064B-\u0652]/g, '').replace(/[\u0640]/g, '').toLowerCase();
}

// تحميل المؤثرات الصوتية
const audioSuccess = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b1b2b2.mp3'); // صوت نجاح
const audioError = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_126b6b1b1b.mp3'); // صوت خطأ
