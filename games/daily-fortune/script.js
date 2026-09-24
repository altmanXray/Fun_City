/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* 每日一签：日期种子固定，同一天同结果 */
'use strict';

const FORTUNES = [
    { level:'上上签', verse:'春风得意马蹄疾，一日看尽长安花', luck:{career:'事业如虹，大胆出击', love:'姻缘美满，真情相伴', wealth:'财源广进，投资顺利', health:'身心愉悦，精力充沛' } },
    { level:'上上签', verse:'长风破浪会有时，直挂云帆济沧海', luck:{career:'贵人相助，步步高升', love:'心上人自远方来', wealth:'意外之财，收获满满', health:'体健神旺，百病不侵' } },
    { level:'上签', verse:'山重水复疑无路，柳暗花明又一村', luck:{career:'困局将解，转机已现', love:'旧缘未了，重逢有望', wealth:'稳中有升，积少成多', health:'小恙自愈，渐入佳境' } },
    { level:'上签', verse:'千淘万漉虽辛苦，吹尽狂沙始到金', luck:{career:'厚积薄发，终获认可', love:'真心换真心，水到渠成', wealth:'辛苦有回报，储蓄为宜', health:'注意休息，劳逸结合' } },
    { level:'上签', verse:'欲穷千里目，更上一层楼', luck:{career:'视野开阔，格局提升', love:'主动出击，告白时机', wealth:'眼界放远，长线为宜', health:'加强锻炼，体质提升' } },
    { level:'中吉签', verse:'采菊东篱下，悠然见南山', luck:{career:'稳扎稳打，不必着急', love:'平淡是真，细水长流', wealth:'知足常乐，守成为主', health:'心态平和，自然康泰' } },
    { level:'中吉签', verse:'海上生明月，天涯共此时', luck:{career:'合作共赢，团队致胜', love:'远方有人思念着你', wealth:'合伙经营，共谋发展', health:'规律作息，均衡饮食' } },
    { level:'中签', verse:'路漫漫其修远兮，吾将上下而求索', luck:{career:'仍在摸索，方向渐明', love:'缘分未到，耐心等待', wealth:'平平淡淡，不宜冒进', health:'常规体检，防患未然' } },
    { level:'中签', verse:'不识庐山真面目，只缘身在此山中', luck:{career:'跳出舒适圈，换位思考', love:'旁观者清，多听建议', wealth:'谨慎投资，避免跟风', health:'减压放松，心态调整' } },
    { level:'中签', verse:'宝剑锋从磨砺出，梅花香自苦寒来', luck:{career:'磨练期，坚持就是胜利', love:'考验期，真心经得住', wealth:'先苦后甜，耐心积累', health:'坚持锻炼，体质渐强' } },
    { level:'下签', verse:'抽刀断水水更流，举杯消愁愁更愁', luck:{career:'不宜强求，顺势而为', love:'沟通不畅，冷静处理', wealth:'不宜投资，保守为上', health:'情绪波动，注意心理' } },
    { level:'下签', verse:'屋漏偏逢连夜雨，船迟又遇打头风', luck:{career:'多事之秋，谨慎行事', love:'聚少离多，多加沟通', wealth:'破财消灾，破而后立', health:'注意保暖，预防感冒' } },
    { level:'下下签', verse:'欲渡黄河冰塞川，将登太行雪满山', luck:{career:'阻力重重，暂缓大计', love:'姻缘受阻，缘分的考验', wealth:'不宜出手，静待时机', health:'务必体检，不可拖延' } },
    { level:'下下签', verse:'花自飘零水自流，一种相思两处闲愁', luck:{career:'心不在焉，调整状态', love:'思念成疾，主动联系', wealth:'破费难免，量力而行', health:'失眠多梦，注意休息' } },
    { level:'上上签', verse:'会当凌绝顶，一览众山小', luck:{career:'登顶在望，全力以赴', love:'居高临下，选你所爱', wealth:'收获丰盛，硕果累累', health:'巅峰状态，一往无前' } },
    { level:'上签', verse:'忽如一夜春风来，千树万树梨花开', luck:{career:'机遇突至，抓住不放', love:'惊喜降临，缘分天定', wealth:'横财就手，见好就收', health:'精神焕发，气色红润' } },
    { level:'中吉签', verse:'沉舟侧畔千帆过，病树前头万木春', luck:{career:'旧去新来，焕然一新', love:'放下过去，新的开始', wealth:'旧账已清，新财可期', health:'旧疾将愈，重获新生' } },
    { level:'中签', verse:'此情可待成追忆，只是当时已惘然', luck:{career:'回顾总结，汲取经验', love:'旧情难忘，珍惜当下', wealth:'复盘得失，调整策略', health:'怀旧伤神，活在当下' } },
    { level:'上签', verse:'天生我材必有用，千金散尽还复来', luck:{career:'才华得展，大放异彩', love:'自信满满，魅力四射', wealth:'财运亨通，挥金如土也回', health:'活力充沛，青春焕发' } },
    { level:'中吉签', verse:'两情若是久长时，又岂在朝朝暮暮', luck:{career:'远程合作，异地机遇', love:'异地恋情，经得起考验', wealth:'外地有财，出差获利', health:'旅行运佳，出门散心' } },
    { level:'中签', verse:'众里寻他千百度，蓦然回首那人却在灯火阑珊处', luck:{career:'答案就在身边，留意同事', love:'真爱就在眼前，擦亮眼睛', wealth:'机会近在咫尺，把握眼前', health:'健康就在习惯，改善作息' } },
    { level:'上签', verse:'落红不是无情物，化作春泥更护花', luck:{career:'付出终有回报', love:'奉献赢得真心', wealth:'投资他人，回报自己', health:'帮助他人，快乐自己' } },
    { level:'下签', verse:'飘飘何所似，天地一沙鸥', luck:{career:'漂泊不定，定位模糊', love:'孤独感重，主动社交', wealth:'收入不稳，开源节流', health:'注意安全，出行小心' } },
    { level:'中吉签', verse:'竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生', luck:{career:'轻装上阵，无所畏惧', love:'随遇而安，不强求', wealth:'粗茶淡饭，自得其乐', health:'简朴生活，身心自在' } },
    { level:'上上签', verse:'春风又绿江南岸，明月何时照我还', luck:{career:'归乡发展，根基稳固', love:'旧情复燃，破镜重圆', wealth:'故土有财，回乡投资', health:'水土养人，回家休养' } },
    { level:'中签', verse:'人生如逆旅，我亦是行人', luck:{career:'职场如旅途，且行且珍惜', love:'过客匆匆，留得住的是缘', wealth:'量入为出，旅途平安', health:'奔波劳碌，注意休息' } },
    { level:'上签', verse:'不畏浮云遮望眼，自缘身在最高层', luck:{career:'高瞻远瞩，布局未来', love:'格局放大，真爱不远', wealth:'长线投资，未来可期', health:'站得高看得远，心态好身体好' } },
    { level:'下签', verse:'无可奈何花落去，似曾相识燕归来', luck:{career:'旧事重提，妥善处理', love:'旧爱归来，慎重选择', wealth:'重复消费，控制开支', health:'旧病复发，及时就医' } },
    { level:'中吉签', verse:'莫愁前路无知己，天下谁人不识君', luck:{career:'人脉广阔，贵人多助', love:'朋友介绍，姻缘将至', wealth:'合作共赢，资源整合', health:'朋友相伴，心情舒畅' } },
    { level:'上上签', verse:'仰天大笑出门去，我辈岂是蓬蒿人', luck:{career:'大展宏图，无人可挡', love:'意中人主动靠近', wealth:'大财可发，抓住风口', health:'精气神十足，百事无忌' } },
];

function dateSeed() {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function seededRandom(seed) {
    let s = seed;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

class DailyFortune {
    constructor() {
        this.drawScreen = document.getElementById('draw-screen');
        this.resultScreen = document.getElementById('result-screen');
        this.historyScreen = document.getElementById('history-screen');
        this.bindEvents();
    }

    bindEvents() {
        document.querySelectorAll('.return-lobby-btn').forEach(b => b.addEventListener('click', () => location.href = '../../index.html'));
        document.getElementById('draw-btn').addEventListener('click', () => this.draw());
        document.getElementById('history-btn').addEventListener('click', () => this.showHistory());
        document.getElementById('back-draw').addEventListener('click', () => this.showScreen('draw'));
    }

    showScreen(name) {
        this.drawScreen.style.display = name === 'draw' ? '' : 'none';
        this.resultScreen.style.display = name === 'result' ? '' : 'none';
        this.historyScreen.style.display = name === 'history' ? '' : 'none';
    }

    todayFortune() {
        const seed = dateSeed();
        const rand = seededRandom(seed);
        return FORTUNES[Math.floor(rand() * FORTUNES.length)];
    }

    draw() {
        const wrap = document.getElementById('bucket-wrap');
        const hint = document.getElementById('draw-hint');
        wrap.classList.add('shaking');
        hint.textContent = '摇签中…';
        AudioManager.play('flip');

        setTimeout(() => {
            wrap.classList.remove('shaking');
            hint.textContent = '点击签筒摇一签';
            const f = this.todayFortune();
            this.showResult(f);
            this.saveHistory(f);
            AudioManager.play('success');
        }, 1200);
    }

    showResult(f) {
        const levelEl = document.getElementById('fortune-level');
        levelEl.textContent = f.level;
        levelEl.className = 'fortune-level ' + (f.level.includes('上上') ? 'great' : f.level.includes('上') ? 'good' : f.level.includes('下下') ? 'bad' : '');
        document.getElementById('fortune-num').textContent = `第 ${FORTUNES.indexOf(f) + 1} 签 · ${new Date().toLocaleDateString('zh-CN')}`;
        document.getElementById('fortune-verse').textContent = f.verse;
        document.getElementById('fortune-sections').innerHTML = [
            ['💼 事业', f.luck.career], ['💗 感情', f.luck.love],
            ['💰 财运', f.luck.wealth], ['🌿 健康', f.luck.health],
        ].map(([label, text]) => `<div class="f-section"><div class="f-label">${label}</div><div class="f-text">${text}</div></div>`).join('');
        this.showScreen('result');
    }

    saveHistory(f) {
        try {
            const key = 'daily_fortune_history';
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            const today = new Date().toISOString().slice(0, 10);
            // 同一天只保留一条
            const filtered = list.filter(h => h.date !== today);
            filtered.unshift({ date: today, level: f.level, verse: f.verse });
            localStorage.setItem(key, JSON.stringify(filtered.slice(0, 50)));
        } catch {}
    }

    showHistory() {
        const list = JSON.parse(localStorage.getItem('daily_fortune_history') || '[]');
        const el = document.getElementById('history-list');
        if (!list.length) { el.innerHTML = '<div class="hist-empty">还没有摇过签 ✨</div>'; }
        else {
            el.innerHTML = list.map(h => `
                <div class="hist-item">
                    <span class="h-date">${h.date}</span>
                    <span class="h-level ${h.level.includes('上上') ? 'great' : h.level.includes('下') ? 'bad' : 'good'}">${h.level}</span>
                </div>`).join('');
        }
        this.showScreen('history');
    }
}

document.addEventListener('DOMContentLoaded', () => new DailyFortune());
