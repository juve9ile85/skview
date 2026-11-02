/* ═══════════════════════════════════════════════
   form.js — 송암공원 SK VIEW 관심고객 등록
   Telegram Bot API 연동
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ── 설정 ─────────────────────────────────── */
    var TG_TOKEN   = '8905166889:AAE0J54RA0D4W761N7iz1yX_yQWToMOu4Sc';
    var TG_CHAT_ID = '-1004464960964';   // 숫자 또는 -100...

    /* ── 폼 요소 ─────────────────────────────── */
    var form = document.getElementById('form');
    if (!form) return;

    var btn = form.querySelector('.btn-submit');
    var resultEl = document.getElementById('formResult');
    var btnText = '관심고객 등록하기 <i class="fa-solid fa-arrow-right"></i>';

    /* ── UTM 수집 ────────────────────────────── */
    function getUtmParams() {
        var p = new URLSearchParams(window.location.search);
        return {
            utm_source:   p.get('utm_source')   || '',
            utm_medium:   p.get('utm_medium')   || '',
            utm_campaign: p.get('utm_campaign') || '',
            utm_content:  p.get('utm_content')  || '',
            utm_term:     p.get('utm_term')     || ''
        };
    }

    /* ── 검증 ────────────────────────────────── */
    function validateForm() {
        var errors = [];
        var name  = form.querySelector('[name="name"]').value.trim();
        var phone = form.querySelector('[name="phone"]').value.trim();

        if (!name) errors.push('이름을 입력해주세요.');
        if (!phone) errors.push('연락처를 입력해주세요.');
        else if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(phone.replace(/\s/g, ''))) {
            errors.push('연락처 형식이 올바르지 않습니다.');
        }
        return errors;
    }

    /* ── 데이터 수집 ─────────────────────────── */
    function collectData() {
        var utm = getUtmParams();
        return {
            name:       form.querySelector('[name="name"]').value.trim(),
            phone:      form.querySelector('[name="phone"]').value.trim(),
            size:       form.querySelector('[name="size"]').value || '-',
            visit_date: form.querySelector('[name="visit_date"]').value || '-',
            visit_time: form.querySelector('[name="visit_time"]').value || '-',
            message:    form.querySelector('[name="message"]').value.trim() || '-',
            utm_source:   utm.utm_source   || '-',
            utm_medium:   utm.utm_medium   || '-',
            utm_campaign: utm.utm_campaign || '-',
            utm_content:  utm.utm_content  || '-',
            utm_term:     utm.utm_term     || '-',
            page_url:     window.location.href
        };
    }

    /* ── 텔레그램 메시지 포맷 ────────────────── */
    function buildMessage(d) {
        return [
            '🏠 <b>관심고객 신규 등록</b>',
            '',
            '👤 <b>이름</b> : ' + escapeHtml(d.name),
            '📞 <b>연락처</b> : ' + escapeHtml(d.phone),
            '📐 <b>관심평형</b> : ' + escapeHtml(d.size),
            '📅 <b>방문일</b> : ' + escapeHtml(d.visit_date),
            '🕐 <b>방문시간</b> : ' + escapeHtml(d.visit_time),
            '💬 <b>문의</b> : ' + escapeHtml(d.message),
            '',
            '📊 <b>UTM</b>',
            '  source : ' + escapeHtml(d.utm_source),
            '  medium : ' + escapeHtml(d.utm_medium),
            '  campaign : ' + escapeHtml(d.utm_campaign),
            '  content : ' + escapeHtml(d.utm_content),
            '  term : ' + escapeHtml(d.utm_term),
            '',
            '🔗 <b>페이지</b> : ' + escapeHtml(d.page_url)
        ].join('\n');
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /* ── 제출 ────────────────────────────────── */
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var errors = validateForm();
        if (errors.length) {
            showResult('error', errors.join('\n'));
            return;
        }

        var data = collectData();
        var text = buildMessage(data);

        setLoading(true);

        fetch('https://api.telegram.org/bot' + TG_TOKEN + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TG_CHAT_ID,
                text: text,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        })
            .then(function (res) { return res.json(); })
            .then(function (json) {
                setLoading(false);
                if (json && json.ok) {
                    showResult('success', '예약이 완료되었습니다.\n담당자가 빠르게 연락드리겠습니다.');
                    form.reset();
                } else {
                    console.error('Telegram error:', json);
                    showResult('error', '전송 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
                }
            })
            .catch(function (err) {
                setLoading(false);
                console.error('Fetch error:', err);
                showResult('error', '전송 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
            });
    });

    /* ── 개인정보 토글 ───────────────────────── */
    var privBtn = document.getElementById('privacyToggle');
    var privBox = document.getElementById('privacyDetail');
    if (privBtn && privBox) {
        privBtn.addEventListener('click', function () {
            var open = privBox.classList.toggle('open');
            privBtn.classList.toggle('open', open);
            privBtn.firstChild.textContent = open ? '접기 ' : '내용보기 ';
        });
    }

    /* ── UI 헬퍼 ─────────────────────────────── */
    function setLoading(on) {
        btn.disabled = on;
        btn.innerHTML = on
            ? '<i class="fa-solid fa-spinner fa-spin"></i> 전송 중...'
            : btnText;
    }

    function showResult(type, msg) {
        if (!resultEl) return;
        resultEl.className = 'form-result form-result--' + type;
        resultEl.textContent = '';
        var lines = msg.split('\n');
        for (var i = 0; i < lines.length; i++) {
            if (i > 0) resultEl.appendChild(document.createElement('br'));
            resultEl.appendChild(document.createTextNode(lines[i]));
        }
        resultEl.style.display = 'block';
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (type === 'success') {
            setTimeout(function () { resultEl.style.display = 'none'; }, 6000);
        }
    }
})();