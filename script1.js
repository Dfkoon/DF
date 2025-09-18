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
    let badges = '';
    if (stats.solvedCount >= 5) badges += '<span class="badge" style="background:#27ae60;color:#fff;padding:0.3em 1em;border-radius:16px;margin:0 0.3em;font-size:0.95em;"><i class="fas fa-star"></i> مبتدئ</span>';
    if (stats.solvedCount >= 10) badges += '<span class="badge" style="background:#f39c12;color:#fff;padding:0.3em 1em;border-radius:16px;margin:0 0.3em;font-size:0.95em;"><i class="fas fa-trophy"></i> محقق متقدم</span>';
    if (stats.solvedCount >= 15) badges += '<span class="badge" style="background:#902114;color:#fff;padding:0.3em 1em;border-radius:16px;margin:0 0.3em;font-size:0.95em;"><i class="fas fa-certificate"></i> بطل القضايا</span>';
    statsDiv.innerHTML = `<strong>إحصائياتك الشخصية:</strong><br>
    عدد القضايا المحلولة: <span style='color:#27ae60;font-weight:bold;'>${stats.solvedCount}</span> / ${stats.totalCount} ${badges}<br>
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
    // إظهار زر الشهادة بعد حل 15 قضية
    if (complexCases.filter(c => c.solved).length >= 15) {
        showCertificatePrompt();
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
    // إضافة قسم التعليقات والتقييم
    let comments = JSON.parse(localStorage.getItem('case_comments_' + idx) || '[]');
    let avgRating = comments.length ? (comments.reduce((a, b) => a + b.rating, 0) / comments.length).toFixed(1) : '—';
    let commentsHtml = `<div class='comments-section' style='margin-top:2.5rem;background:#fff2;padding:1.2rem;border-radius:10px;'>
        <h3 style='color:#902114;margin-bottom:1rem;'><i class='fas fa-comments'></i> التعليقات والتقييم</h3>
        <div style='margin-bottom:1rem;'>
            <strong>متوسط التقييم:</strong> <span style='color:#f39c12;font-size:1.1em;'>${avgRating}</span> ⭐
        </div>
        <form id='comment-form-${idx}' style='margin-bottom:1.2rem;'>
            <textarea id='comment-text-${idx}' rows='2' style='width:100%;border-radius:8px;padding:0.7rem;margin-bottom:0.5rem;' placeholder='اكتب تعليقك هنا...'></textarea>
            <div style='margin-bottom:0.7rem;'>
                <label>تقييمك: </label>
                <select id='comment-rating-${idx}' style='border-radius:6px;padding:0.2rem 0.7rem;'>
                    <option value='5'>5 ⭐</option>
                    <option value='4'>4 ⭐</option>
                    <option value='3'>3 ⭐</option>
                    <option value='2'>2 ⭐</option>
                    <option value='1'>1 ⭐</option>
                </select>
            </div>
            <button type='submit' style='background:#27ae60;color:#fff;padding:0.5rem 1.2rem;border:none;border-radius:8px;font-weight:bold;cursor:pointer;'>إرسال التعليق</button>
        </form>
        <div id='comments-list-${idx}'>
            ${comments.map(cmt => `<div style='background:#fff3cd;color:#902114;padding:0.7rem;border-radius:8px;margin-bottom:0.7rem;'><strong>⭐ ${cmt.rating}</strong> - ${cmt.text}</div>`).join('')}
        </div>
    </div>`;
    caseDetailsDiv.innerHTML += commentsHtml;
    // منطق إرسال التعليق
    setTimeout(() => {
        const form = document.getElementById('comment-form-' + idx);
        if (form) {
            form.onsubmit = function(e) {
                e.preventDefault();
                const text = document.getElementById('comment-text-' + idx).value.trim();
                const rating = parseInt(document.getElementById('comment-rating-' + idx).value);
                if (!text) return;
                comments.push({ text, rating });
                localStorage.setItem('case_comments_' + idx, JSON.stringify(comments));
                showCaseDetails(idx);
            };
        }
    }, 100);
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
            // استرجاع الإجابات المؤقتة إن وجدت
            solutionStep = c._solutionStep || 0;
            solutionAnswers = c._solutionAnswers ? [...c._solutionAnswers] : [];
            solutionInput.value = '';
            if (solutionStep > 0 && c.solution.length > 1) {
                solutionInput.placeholder = `اكتب اسم المشتبه التالي (${solutionStep + 1} من ${c.solution.length})...`;
                // إعادة زر الاطلاع على تفاصيل القضية إذا كان في منتصف الحل
                let viewBtn = document.getElementById('view-case-btn');
                if (!viewBtn) {
                    viewBtn = document.createElement('button');
                    viewBtn.id = 'view-case-btn';
                    viewBtn.className = 'submit-solution';
                    viewBtn.style = 'margin-top:1.2rem;background:#902114;color:#fff;';
                    viewBtn.innerHTML = '<i class="fas fa-eye"></i> الاطلاع على تفاصيل القضية';
                    solutionModal.querySelector('.solution-buttons').appendChild(viewBtn);
                    viewBtn.onclick = function() {
                        solutionModal.style.display = 'none';
                        showCaseDetails(currentCaseIndex);
                    };
                }
            } else {
                solutionInput.placeholder = 'اكتب اسم المشتبه...';
            }
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
    // تحقق مرن من الحل (أي ترتيب)
    if (c.solution.length > 1) {
        // إذا كانت الإجابة صحيحة ولم تدخل من قبل
        const normalized = normalizeAnswer(answer);
        const normalizedSolutions = c.solution.map(normalizeAnswer);
        if (normalizedSolutions.includes(normalized) && !solutionAnswers.map(normalizeAnswer).includes(normalized)) {
            solutionAnswers.push(answer);
            solutionStep = solutionAnswers.length;
            c._solutionAnswers = [...solutionAnswers];
            c._solutionStep = solutionStep;
            // زر الاطلاع على تفاصيل القضية بعد أول إجابة صحيحة
            if (solutionStep === 1) {
                let viewBtn = document.getElementById('view-case-btn');
                if (!viewBtn) {
                    viewBtn = document.createElement('button');
                    viewBtn.id = 'view-case-btn';
                    viewBtn.className = 'submit-solution';
                    viewBtn.style = 'margin-top:1.2rem;background:#902114;color:#fff;';
                    viewBtn.innerHTML = '<i class="fas fa-eye"></i> الاطلاع على تفاصيل القضية';
                    solutionModal.querySelector('.solution-buttons').appendChild(viewBtn);
                    viewBtn.onclick = function() {
                        solutionModal.style.display = 'none';
                        showCaseDetails(currentCaseIndex);
                    };
                }
            }
            if (solutionAnswers.length < c.solution.length) {
                solutionInput.value = '';
                solutionInput.style.borderColor = '';
                solutionInput.placeholder = `اكتب اسم مشتبه آخر (${solutionAnswers.length + 1} من ${c.solution.length})...`;
                return;
            } else {
                c.solved = true;
                delete c._solutionAnswers;
                delete c._solutionStep;
                solutionModal.style.display = 'none';
                showCaseDetails(currentCaseIndex);
                updateCounters();
                renderCases();
                solutionStep = 0;
                solutionAnswers = [];
                audioSuccess.currentTime = 0;
                audioSuccess.play();
                solutionModal.classList.add('solved-success-flash');
                setTimeout(() => {
                    solutionModal.classList.remove('solved-success-flash');
                    alert('أحسنت! تم حل القضية بنجاح ✅');
                }, 600);
            }
        } else {
            solutionInput.style.borderColor = 'var(--warning-color)';
            solutionInput.value = '';
            solutionInput.placeholder = 'الإجابة غير صحيحة أو مكررة، حاول مرة أخرى!';
            // لا تصفر الإجابات، فقط أعطِ تنبيه
            audioError.currentTime = 0;
            audioError.play();
            solutionModal.classList.add('solved-error');
            setTimeout(() => {
                solutionModal.classList.remove('solved-error');
            }, 600);
        }
    } else {
        // قضية بمشتبه واحد فقط
        const expected = c.solution[solutionStep];
        if (expected && normalizeAnswer(expected) === normalizeAnswer(answer)) {
            solutionAnswers.push(answer);
            solutionStep++;
            c.solved = true;
            delete c._solutionAnswers;
            delete c._solutionStep;
            solutionModal.style.display = 'none';
            showCaseDetails(currentCaseIndex);
            updateCounters();
            renderCases();
            solutionStep = 0;
            solutionAnswers = [];
            audioSuccess.currentTime = 0;
            audioSuccess.play();
            solutionModal.classList.add('solved-success-flash');
            setTimeout(() => {
                solutionModal.classList.remove('solved-success-flash');
                alert('أحسنت! تم حل القضية بنجاح ✅');
            }, 600);
        } else {
            solutionInput.style.borderColor = 'var(--warning-color)';
            solutionInput.value = '';
            solutionInput.placeholder = 'الإجابة غير صحيحة، حاول مرة أخرى!';
            solutionStep = 0;
            solutionAnswers = [];
            audioError.currentTime = 0;
            audioError.play();
            solutionModal.classList.add('solved-error');
            setTimeout(() => {
                solutionModal.classList.remove('solved-error');
            }, 600);
        }
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

// نافذة تعليمات الاستخدام
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeHelp = document.getElementById('close-help');
if (helpBtn && helpModal && closeHelp) {
    helpBtn.onclick = () => {
        helpModal.style.display = 'block';
    };
    closeHelp.onclick = () => {
        helpModal.style.display = 'none';
    };
    window.addEventListener('click', function(e) {
        if (e.target === helpModal) helpModal.style.display = 'none';
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

// حفظ واسترجاع التقدم من localStorage
function saveProgress() {
    const solvedArr = complexCases.map(c => c.solved ? 1 : 0);
    localStorage.setItem('koon_progress', JSON.stringify(solvedArr));
}
function loadProgress() {
    const saved = localStorage.getItem('koon_progress');
    if (saved) {
        const arr = JSON.parse(saved);
        arr.forEach((v, i) => { if (complexCases[i]) complexCases[i].solved = !!v; });
    }
}

// زر حفظ التقدم
let saveBtn = document.getElementById('save-progress-btn');
if (saveBtn) {
    saveBtn.onclick = function() {
        saveProgress();
        // إظهار رسالة تأكيد أعلى الصفحة بشكل واضح
        let notif = document.getElementById('save-progress-notif');
        if (!notif) {
            notif = document.createElement('div');
            notif.id = 'save-progress-notif';
            notif.style = 'position:fixed;top:18px;left:50%;transform:translateX(-50%);background:#27ae60;color:#fff;padding:1rem 2.2rem;border-radius:12px;font-weight:bold;z-index:9999;box-shadow:0 2px 12px #0002;font-size:1.15rem;transition:opacity 0.3s;opacity:0.97;';
            notif.innerHTML = '<i class="fas fa-check-circle" style="font-size:1.3em;margin-left:0.5em;"></i> تم حفظ جميع تقدماتك بنجاح! يمكنك استرجاعها حتى بعد إغلاق المتصفح.';
            document.body.appendChild(notif);
        } else {
            notif.innerHTML = '<i class="fas fa-check-circle" style="font-size:1.3em;margin-left:0.5em;"></i> تم حفظ جميع تقدماتك بنجاح! يمكنك استرجاعها حتى بعد إغلاق المتصفح.';
            notif.style.display = '';
        }
        notif.classList.add('notif-flash');
        audioNotif.currentTime = 0;
        audioNotif.play();
        setTimeout(()=>{
            notif.style.display = 'none';
            notif.classList.remove('notif-flash');
        }, 2500);
    };
}

// عند تحميل الصفحة استرجع التقدم
window.addEventListener('DOMContentLoaded', () => {
    loadProgress();
    toggleNoticeBox();
    renderStats();
});

// عند تحديث القضايا أو حلها احفظ التقدم تلقائياً
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

// دالة لتطبيع الإجابات (إزالة الحركات والمسافات والفواصل والتنوين والتعريف)
function normalizeAnswer(str) {
    // إزالة المسافات، الحركات، التنوين، الفواصل، التعريف، الرموز غير حرفية
    return str
        .replace(/\s/g, '') // إزالة المسافات
        .replace(/[\u064B-\u0652]/g, '') // إزالة الحركات والتنوين
        .replace(/[\u0640]/g, '') // إزالة الكشيدة
        .replace(/[.,;،؛:!?؟\-]/g, '') // إزالة الفواصل والرموز
        .replace(/^ال/, '') // إزالة "ال" التعريف من البداية
        .replace(/^(دكتور|دكتورة|د\.?|د\.?\s)/, '') // إزالة دكتور/دكتورة
        .toLowerCase();
}

// تحميل المؤثرات الصوتية
const audioSuccess = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b1b2b2.mp3'); // صوت نجاح
const audioError = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_126b6b1b1b.mp3'); // صوت خطأ
// تحميل مؤثر صوتي للتنبيه
const audioNotif = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_126b6b1b1b.mp3'); // صوت تنبيه

function showCertificatePrompt() {
    let certPrompt = document.getElementById('certificate-prompt');
    if (!certPrompt) {
        certPrompt = document.createElement('div');
        certPrompt.id = 'certificate-prompt';
        certPrompt.style = 'position:fixed;top:70px;left:50%;transform:translateX(-50%);background:#902114;color:#fff;padding:1.2rem 2.2rem;border-radius:14px;font-weight:bold;z-index:9999;box-shadow:0 2px 12px #90211422;font-size:1.15rem;transition:opacity 0.3s;opacity:0.97;text-align:center;';
        certPrompt.innerHTML = '<i class="fas fa-certificate" style="font-size:1.3em;margin-left:0.5em;"></i> لقد قمت بحل 15 قضية! إذا ترغب بطلب الشهادة الآن اضغط الزر التالي:<br><a href="https://forms.gle/dhQFcnDsJVmFHqKa7" target="_blank" class="certificate-link-custom" style="display:inline-block;margin-top:12px;"><i class="fas fa-certificate"></i> طلب الشهادة</a>';
        document.body.appendChild(certPrompt);
    } else {
        certPrompt.style.display = '';
    }
    certPrompt.classList.add('notif-flash');
    audioNotif.currentTime = 0;
    audioNotif.play();
    setTimeout(()=>{
        certPrompt.style.display = 'none';
        certPrompt.classList.remove('notif-flash');
    }, 8000);
}
