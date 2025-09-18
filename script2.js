// script2.js

// مؤثرات خطوط متحركة في الخلفية
window.addEventListener('DOMContentLoaded', function() {
    const svg = document.getElementById('diagonal-lines-bg');
    if (!svg) return;
    svg.innerHTML = '';
    for (let i = 0; i < 18; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 0);
        line.setAttribute('y1', i * 60);
        line.setAttribute('x2', 1920);
        line.setAttribute('y2', i * 60 + 180);
        line.setAttribute('stroke', '#902114');
        line.setAttribute('stroke-width', '2');
        line.classList.add('animated-bg-line');
        svg.appendChild(line);
    }
    // تحريك الخطوط
    let offset = 0;
    setInterval(() => {
        offset += 2;
        const lines = svg.querySelectorAll('.animated-bg-line');
        lines.forEach((line, idx) => {
            line.setAttribute('y1', idx * 60 + offset);
            line.setAttribute('y2', idx * 60 + 180 + offset);
            if (line.getAttribute('y1') > 1080) {
                line.setAttribute('y1', 0);
                line.setAttribute('y2', 180);
            }
        });
    }, 60);
});

// إضافة خاصية البحث عن قضية بالاسم أو التصنيف
window.addEventListener('DOMContentLoaded', function() {
    const casesContainer = document.getElementById('cases-container');
    const container = document.querySelector('.container');
    if (!container) return;
    let searchDiv = document.getElementById('search-box');
    if (!searchDiv) {
        searchDiv = document.createElement('div');
        searchDiv.id = 'search-box';
        searchDiv.innerHTML = `<input type='text' id='case-search-input' class='case-search-input' placeholder='ابحث عن قضية بالاسم أو التصنيف...'>`;
        container.prepend(searchDiv);
    }
    const searchInput = document.getElementById('case-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const val = searchInput.value.trim().toLowerCase();
            let filtered = window.complexCases.filter(c =>
                c.title.toLowerCase().includes(val) ||
                c.category.toLowerCase().includes(val)
            );
            casesContainer.innerHTML = '';
            filtered.forEach((caseItem, index) => {
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
                        <a href="#" class="read-more" data-idx="${window.complexCases.indexOf(caseItem)}">
                            <i class="fas fa-search"></i> تحقق في القضية
                        </a>
                    </div>
                `;
                casesContainer.appendChild(card);
            });
        });
    }
});

// نظام إشعارات داخل الموقع
function showNotification(msg, type = 'info') {
    let notif = document.getElementById('site-notification');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'site-notification';
        notif.className = 'site-notification';
        document.body.appendChild(notif);
    }
    notif.textContent = msg;
    notif.className = 'site-notification notif-' + type + ' notif-flash';
    notif.style.display = '';
    setTimeout(() => {
        notif.style.display = 'none';
        notif.classList.remove('notif-flash');
    }, 2200);
}

// مراقبة حل القضايا وتحديث العرض في جميع الأقسام
function refreshCasesAfterSolve() {
    if (typeof renderCases === 'function') {
        renderCases();
    }
    if (typeof updateCounters === 'function') {
        updateCounters();
    }
}
// يمكنك استدعاء refreshCasesAfterSolve() بعد حل أي قضية

// مثال: بعد تعيين c.solved = true استدعِ refreshCasesAfterSolve();

// زر ونافذة ترتيب أفضل المحققين (Leaderboard)
window.addEventListener('DOMContentLoaded', function() {
    // إضافة زر في الهيدر إذا لم يوجد
    let leaderboardBtn = document.getElementById('leaderboard-btn');
    if (!leaderboardBtn) {
        leaderboardBtn = document.createElement('button');
        leaderboardBtn.id = 'leaderboard-btn';
        leaderboardBtn.className = 'about-btn-small';
        leaderboardBtn.title = 'ترتيب المحققين';
        leaderboardBtn.innerHTML = '<i class="fas fa-crown"></i>';
        document.querySelector('header').appendChild(leaderboardBtn);
    }
    // نافذة الترتيب
    let leaderboardModal = document.getElementById('leaderboard-modal');
    if (!leaderboardModal) {
        leaderboardModal = document.createElement('div');
        leaderboardModal.id = 'leaderboard-modal';
        leaderboardModal.className = 'about-modal hidden';
        leaderboardModal.innerHTML = `<div class='about-content'>
            <button id='close-leaderboard' class='close-about-btn'>إغلاق</button>
            <h2 class='about-title'><i class='fas fa-crown'></i> ترتيب أفضل المحققين</h2>
            <div id='leaderboard-list'></div>
        </div>`;
        document.body.appendChild(leaderboardModal);
    }
    leaderboardBtn.onclick = function() {
        leaderboardModal.style.display = 'block';
        renderLeaderboard();
    };
    document.getElementById('close-leaderboard').onclick = function() {
        leaderboardModal.style.display = 'none';
    };
    window.addEventListener('click', function(e) {
        if (e.target === leaderboardModal) leaderboardModal.style.display = 'none';
    });
});
// دالة عرض الترتيب
function renderLeaderboard() {
    let listDiv = document.getElementById('leaderboard-list');
    if (!listDiv) return;
    // جلب بيانات المحققين من localStorage
    let users = JSON.parse(localStorage.getItem('koon_leaderboard') || '[]');
    // إضافة المستخدم الحالي
    let myName = localStorage.getItem('koon_username') || 'أنت';
    let mySolved = window.complexCases ? window.complexCases.filter(c => c.solved).length : 0;
    let found = users.find(u => u.name === myName);
    if (!found) {
        users.push({ name: myName, solved: mySolved });
    } else {
        found.solved = mySolved;
    }
    // ترتيب القائمة
    users = users.sort((a, b) => b.solved - a.solved);
    localStorage.setItem('koon_leaderboard', JSON.stringify(users));
    // عرض القائمة
    listDiv.innerHTML = users.map((u, i) => `<div class='leaderboard-item'><span class='rank'>${i+1}</span> <span class='name'>${u.name}</span> <span class='solved'>${u.solved} قضية</span></div>`).join('');
}
// يمكنك إضافة واجهة إدخال اسم المستخدم عند أول زيارة إذا رغبت بذلك.