/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* MBTI 人格测试：44 题（四维度各 11 题）强迫选择 → 16 型结果，计时并写入历史 */
class MbtiTest {
    constructor() {
        this.screens = {
            intro: document.getElementById('intro-screen'),
            quiz: document.getElementById('quiz-screen'),
            result: document.getElementById('result-screen'),
            history: document.getElementById('history-screen')
        };
        this.timer = new GameTimer(document.getElementById('timer'));
        this.idx = 0;
        this.scores = {};
        this.order = [];

        this.bindEvents();
        this.showLastResult();
    }

    bindEvents() {
        document.querySelectorAll('.return-lobby-btn').forEach(btn => {
            btn.addEventListener('click', () => { window.location.href = '../../index.html'; });
        });
        document.getElementById('start-btn').addEventListener('click', () => this.begin());
        document.getElementById('quit-btn').addEventListener('click', () => this.showScreen('intro'));
        document.getElementById('retry-btn').addEventListener('click', () => this.begin());
        document.getElementById('history-btn').addEventListener('click', () => this.openHistory());
        document.getElementById('history-btn2').addEventListener('click', () => this.openHistory());
        document.getElementById('back-btn').addEventListener('click', () => this.showScreen('intro'));
        document.getElementById('clear-history-btn').addEventListener('click', () => {
            if (!window.LG) return;
            LG.History.clear('mbti');
            this.renderHistory();
        });
        document.getElementById('opt-a').addEventListener('click', () => this.pick(0));
        document.getElementById('opt-b').addEventListener('click', () => this.pick(1));
        window.addEventListener('keydown', (e) => {
            if (this.screens.quiz.style.display === 'none') return;
            if (e.key === '1') this.pick(0);
            if (e.key === '2') this.pick(1);
        });
    }

    showScreen(name) {
        Object.values(this.screens).forEach(s => { s.style.display = 'none'; });
        this.screens[name].style.display = 'block';
        window.scrollTo(0, 0);
    }

    begin() {
        this.idx = 0;
        this.scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
        // 题序：四维度轮转出题，避免同维度连续轰炸
        this.order = [];
        for (let i = 0; i < 11; i++) {
            for (const dim of ['EI', 'SN', 'TF', 'JP']) this.order.push(QUESTIONS[dim][i]);
        }
        this.timer.reset();
        this.showScreen('quiz');
        this.renderQuestion();
        this.timer.start();
    }

    renderQuestion() {
        const q = this.order[this.idx];
        const total = this.order.length;
        document.getElementById('q-counter').textContent = `${this.idx + 1} / ${total}`;
        document.getElementById('progress-bar').style.width = `${((this.idx) / total) * 100}%`;
        document.getElementById('question-text').textContent = q.q;
        const a = document.getElementById('opt-a');
        const b = document.getElementById('opt-b');
        a.textContent = q.A;
        b.textContent = q.B;
        a.dataset.key = '1.';
        b.dataset.key = '2.';
    }

    pick(option) {
        const q = this.order[this.idx];
        this.scores[option === 0 ? q.a : q.b]++;
        AudioManager.play('click');
        this.idx++;
        if (this.idx >= this.order.length) {
            this.finish();
        } else {
            this.renderQuestion();
        }
    }

    computeType() {
        const s = this.scores;
        const dims = [
            { key: 'EI', poles: ['E', 'I'], labels: ['外向 E', '内向 I'], names: ['外向', '内向'] },
            { key: 'SN', poles: ['S', 'N'], labels: ['实感 S', '直觉 N'], names: ['实感', '直觉'] },
            { key: 'TF', poles: ['T', 'F'], labels: ['思考 T', '情感 F'], names: ['思考', '情感'] },
            { key: 'JP', poles: ['J', 'P'], labels: ['判断 J', '知觉 P'], names: ['判断', '知觉'] }
        ];
        let code = '';
        const bars = [];
        for (const d of dims) {
            const a = s[d.poles[0]];
            const b = s[d.poles[1]];
            const winner = a >= b ? 0 : 1;
            code += d.poles[winner];
            bars.push({
                leftLabel: d.labels[0],
                rightLabel: d.labels[1],
                leftPct: Math.round((a / (a + b)) * 100),
                winner
            });
        }
        return { code, bars };
    }

    finish() {
        this.timer.stop();
        const ms = this.timer.elapsed();
        const { code, bars } = this.computeType();
        const type = TYPES[code];
        AudioManager.play('success');

        if (window.LG) {
            LG.History.add('mbti', {
                summary: `${code} ${type.name}`,
                detail: bars.map((b, i) => `${['EI', 'SN', 'TF', 'JP'][i]} ${Math.max(b.leftPct, 100 - b.leftPct)}%`).join(' · '),
                ms
            });
            LG.Achievements.report('test_done', { tool: 'mbti' });
        }

        document.getElementById('result-emoji').textContent = type.emoji;
        document.getElementById('result-code').textContent = code;
        document.getElementById('result-name').textContent = `${type.name} · ${type.group}`;
        document.getElementById('result-keywords').innerHTML = type.keywords.map(k => `<span>${k}</span>`).join('');

        document.getElementById('dim-bars').innerHTML = bars.map(b => `
            <div class="dim-row">
                <span class="dim-side ${b.winner === 0 ? 'win' : ''}">${b.leftLabel}</span>
                <div class="dim-track"><div class="dim-fill" style="left:0; width:${b.leftPct}%"></div></div>
                <span class="dim-side ${b.winner === 1 ? 'win' : ''}" style="text-align:right">${b.rightLabel}</span>
            </div>
        `).join('');

        const sections = [
            ['🪞 性格画像', type.traits],
            ['💪 天赋优势', type.strengths],
            ['⚠️ 成长盲区', type.weaknesses],
            ['💼 适合的方向', type.careers],
            ['💗 感情风格', type.love],
            ['🌱 给你的建议', type.growth],
            ['🌟 同款人格', type.famous]
        ];
        document.getElementById('result-sections').innerHTML = sections
            .map(([t, c]) => `<div class="result-section"><h3>${t}</h3><p>${c}</p></div>`).join('');

        this.showLastResult();
        this.showScreen('result');
    }

    showLastResult() {
        const el = document.getElementById('last-result');
        if (!window.LG) { el.style.display = 'none'; return; }
        const list = LG.History.list('mbti');
        if (!list.length) { el.style.display = 'none'; return; }
        const last = list[0];
        el.style.display = 'block';
        el.innerHTML = `上次测试：<strong>${last.summary}</strong>（${formatTs(last.t)} · 用时 ${last.ms != null ? GameUtils.formatTime(last.ms) + ' 秒' : '--'}）`;
    }

    openHistory() {
        this.renderHistory();
        this.showScreen('history');
    }

    renderHistory() {
        const wrap = document.getElementById('history-list');
        const list = window.LG ? LG.History.list('mbti') : [];
        if (!list.length) {
            wrap.innerHTML = '<div class="history-empty">还没有测试记录，先来测一次吧 ✨</div>';
            return;
        }
        wrap.innerHTML = list.map(h => `
            <div class="history-item">
                <div class="history-main">
                    <span class="history-summary">${h.summary}</span>
                    <span class="history-meta">${formatTs(h.t)}${h.ms != null ? ' · 用时 ' + GameUtils.formatTime(h.ms) + ' 秒' : ''}</span>
                </div>
                ${h.detail ? `<span class="history-meta">${h.detail}</span>` : ''}
            </div>
        `).join('');
    }
}

function formatTs(t) {
    const d = new Date(t);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ================= 题库：四维度各 11 题（a/b 为得分极） ================= */
const QUESTIONS = {
    EI: [
        { a: 'E', b: 'I', q: '聚会中的你通常是？', A: '主动认识新朋友，越聊越有劲', B: '和熟悉的人待在角落，人多了就累' },
        { a: 'E', b: 'I', q: '长时间独处之后，你会？', A: '感到孤独，想找人聊聊', B: '感到精力充沛，很享受' },
        { a: 'E', b: 'I', q: '理想的周末是？', A: '约朋友出门玩，热闹才开心', B: '一个人在家看书打游戏，安静充电' },
        { a: 'E', b: 'I', q: '遇到问题时，你倾向？', A: '边说边想，说出来思路才清楚', B: '先在脑子里想清楚，再开口' },
        { a: 'E', b: 'I', q: '在陌生场合你会？', A: '很快融入，甚至成为话题中心', B: '安静观察一阵，等别人先开口' },
        { a: 'E', b: 'I', q: '你的朋友圈更像？', A: '朋友很多，各行各业都有', B: '两三个知己，足矣' },
        { a: 'E', b: 'I', q: '电话突然响起，你会？', A: '立刻接起，聊起来很自然', B: '犹豫一下，更想先发消息问"什么事"' },
        { a: 'E', b: 'I', q: '团队讨论中你常常是？', A: '发言最多的那一个', B: '倾听和记录的那一个' },
        { a: 'E', b: 'I', q: '独自长途旅行，你更期待？', A: '路上认识有趣的人', B: '戴上耳机，享受一个人的世界' },
        { a: 'E', b: 'I', q: '忙碌一周后，回血的方式是？', A: '参加聚会或活动，人越多越精神', B: '独处放空，谁都别找我' },
        { a: 'E', b: 'I', q: '微信消息你通常？', A: '想到就回，还爱发语音', B: '攒着批量回，更偏好文字' }
    ],
    SN: [
        { a: 'S', b: 'N', q: '回忆一段经历，印象更深的是？', A: '具体的细节：去了哪、吃了什么', B: '整体的感觉和旅途中的联想' },
        { a: 'S', b: 'N', q: '学习新东西，你偏好？', A: '按步骤一步步来，稳扎稳打', B: '先看全局框架，再回头填细节' },
        { a: 'S', b: 'N', q: '你更相信？', A: '亲身经验和摆在眼前的事实', B: '直觉和说不清的第六感' },
        { a: 'S', b: 'N', q: '阅读时你更关注？', A: '字面意思，生怕漏掉细节', B: '字里行间的言外之意' },
        { a: 'S', b: 'N', q: '接手新项目，你会先？', A: '看看有没有成熟的现成方法', B: '头脑风暴各种新奇的玩法' },
        { a: 'S', b: 'N', q: '别人说你更像？', A: '实干家，脚踏实地', B: '梦想家，脑洞很大' },
        { a: 'S', b: 'N', q: '拼装家具时你会？', A: '严格照着说明书来', B: '凭感觉先拼，卡住了再看说明' },
        { a: 'S', b: 'N', q: '哪种问题更吸引你？', A: '具体的、马上能解决的', B: '抽象的、关于未来可能性的' },
        { a: 'S', b: 'N', q: '数字和日期你？', A: '记得很准，误差很小', B: '常常只记得个大概' },
        { a: 'S', b: 'N', q: '工作中你更擅长？', A: '处理当下的实际问题', B: '构思长远蓝图和趋势' },
        { a: 'S', b: 'N', q: '听别人讲方案，你先想到？', A: '落地执行的可行性和成本', B: '它背后的想法和衍生的可能' }
    ],
    TF: [
        { a: 'T', b: 'F', q: '朋友向你倾诉烦恼，你会先？', A: '分析问题，给出解决建议', B: '先共情安慰，感受最重要' },
        { a: 'T', b: 'F', q: '做决定时你更看重？', A: '逻辑和利弊得失', B: '价值观以及对他人的影响' },
        { a: 'T', b: 'F', q: '看到别人争论，你更在意？', A: '谁说得更有道理', B: '别吵起来伤和气' },
        { a: 'T', b: 'F', q: '评价一部电影你会说？', A: '剧情逻辑是否成立、节奏如何', B: '有没有打动我的那个瞬间' },
        { a: 'T', b: 'F', q: '发现同事方案有问题，你会？', A: '直接指出问题所在', B: '先肯定再委婉提醒' },
        { a: 'T', b: 'F', q: '你认为规则应该？', A: '对事不对人，一视同仁', B: '视情况和人情可以灵活' },
        { a: 'T', b: 'F', q: '收到礼物你更在意？', A: '实不实用、值不值', B: '心意到了就好' },
        { a: 'T', b: 'F', q: '面对批评你会？', A: '就事论事，说得对就改', B: '嘴上认同，心里难受一会儿' },
        { a: 'T', b: 'F', q: '帮朋友做选择，你会？', A: '列出利弊清单理性比较', B: '问"你心里其实更想要哪个"' },
        { a: 'T', b: 'F', q: '你更容易被说成？', A: '太较真、不讲情面', B: '太感性、心太软' },
        { a: 'T', b: 'F', q: '组队合作你优先考虑？', A: '能力和岗位匹配度', B: '相处起来舒服、合拍' }
    ],
    JP: [
        { a: 'J', b: 'P', q: '出发旅行前，你会？', A: '做好详细攻略和每日行程', B: '订好机票酒店就好，随性走' },
        { a: 'J', b: 'P', q: '你的桌面/房间通常是？', A: '整洁有序，物归其位', B: '乱中有序，反正我知道东西在哪' },
        { a: 'J', b: 'P', q: '面对截止日期你？', A: '提前完成才安心', B: '最后一刻爆发小宇宙' },
        { a: 'J', b: 'P', q: '计划被临时打乱，你会？', A: '很不舒服，得重新规划', B: '正好，说不定有惊喜' },
        { a: 'J', b: 'P', q: '更喜欢的工作节奏是？', A: '按部就班，井井有条', B: '灵活机动，跟着感觉走' },
        { a: 'J', b: 'P', q: '待办清单对你来说是？', A: '必备神器，划掉一项超爽', B: '写了也不看，何必为难自己' },
        { a: 'J', b: 'P', q: '购物时你会？', A: '列好清单直奔目标', B: '边逛边看，看中就拿下' },
        { a: 'J', b: 'P', q: '做重要决定，你倾向？', A: '谋定而后动，想清楚再动手', B: '先干起来，边做边调整' },
        { a: 'J', b: 'P', q: '你的时间观念是？', A: '习惯提前到，迟到会焦虑', B: '差不多就行，掐着点到' },
        { a: 'J', b: 'P', q: '对未来你更喜欢？', A: '有清晰的规划和阶段目标', B: '保持开放，未来有无限可能' },
        { a: 'J', b: 'P', q: '收拾行李你会？', A: '提前一晚列清单装好', B: '出发前半小时火速塞包' }
    ]
};

/* ================= 16 型人格档案 ================= */
const TYPES = {
    INTJ: {
        name: '建筑师', group: '分析家', emoji: '♟️', keywords: ['独立', '深谋远虑', '高标准'],
        traits: '你是天生的战略家，脑中永远有一张完整的蓝图。喜欢独立思考、深度钻研，对感兴趣的领域可以钻得很深；社交上宁缺毋滥，讨厌无意义的寒暄与低效流程。',
        strengths: '强大的长远规划与逻辑推演能力；目标感极强，认准就执行到底；独立、冷静，不轻易被他人情绪裹挟。',
        weaknesses: '容易显得冷淡、挑剔；对"不够聪明"的流程缺乏耐心；过度追求完美，容易给自己太大压力。',
        careers: '科研、架构师、策略咨询、投资分析、产品与技术负责人等需要"想清楚再干"的领域。',
        love: '慢热但忠诚，爱情里重视精神共鸣胜过形式；不擅长甜言蜜语，但会用行动把一切安排妥当。',
        growth: '偶尔放下"最优解"，接受够好就好的状态；主动表达感受，你会发现被理解也没那么难。',
        famous: '马斯克、米歇尔·奥巴马、尼采（历史人物为后世推测，仅供娱乐）'
    },
    INTP: {
        name: '逻辑学家', group: '分析家', emoji: '🔬', keywords: ['好奇', '思辨', '自由'],
        traits: '你的大脑像一间永不关门的实验室，忍不住拆解一切概念。热爱知识本身，思维跳跃、点子极多，但对重复琐碎的执行容易失去兴趣。',
        strengths: '出色的抽象思维与洞察力；能发现别人忽略的逻辑漏洞；开放的头脑，愿意随时被更好的论证说服。',
        weaknesses: '想得多做得少，容易烂尾；对细节和例行事务缺乏耐心；情感表达偏被动，容易让关系停在"想"的阶段。',
        careers: '研究、算法、写作、哲学与理论方向、独立开发者等给大脑留足自由度的职业。',
        love: '最吸引你的是"聊得来"的灵魂；不粘人、给足空间，但也需要对方主动一点来确认关系。',
        growth: '给灵感装上截止日期：先完成、再完美；把心里那句"我在乎"说出来，天不会塌。',
        famous: '爱因斯坦、比尔·盖茨、笛卡尔（历史人物为后世推测，仅供娱乐）'
    },
    ENTJ: {
        name: '指挥官', group: '分析家', emoji: '👑', keywords: ['果断', '统率', '进取'],
        traits: '你是自带引擎的领导者，天然知道要去哪、谁做什么。效率至上，讨厌拖延与含糊；压力越大越清醒，天生适合在复杂局面里掌舵。',
        strengths: '强大的决断力与执行力；善于调动资源、组织团队；目标导向，越挫越勇。',
        weaknesses: '气场太强，容易压过别人；耐心不足，对"慢"和"感性"容忍度低；工作狂倾向，忽略休息与情感需求。',
        careers: '企业管理、创业、投行与咨询、项目负责人等指挥若定的角色。',
        love: '欣赏势均力敌的伙伴，喜欢直来直去；爱得很实际——为对方铺路就是你的浪漫。',
        growth: '练习"听完再说"；留一点不设 KPI 的时间给生活和身边人，赢面会更大。',
        famous: '乔布斯、撒切尔夫人、凯瑟琳大帝（历史人物为后世推测，仅供娱乐）'
    },
    ENTP: {
        name: '辩论家', group: '分析家', emoji: '⚡', keywords: ['机敏', '爱折腾', '点子王'],
        traits: '你的字典里没有"标准答案"。反应快、嘴更快，享受拆解与重构一切规则；新鲜感是你的燃料，重复是你的天敌。',
        strengths: '绝佳的临场应变与创意；敢于挑战权威与惯性；幽默风趣，是天生的气氛调节器。',
        weaknesses: '开头猛如虎、收尾常拖延；喜欢抬杠式讨论，容易无心伤人；同时对太多事感兴趣，精力过于分散。',
        careers: '创业、市场与增长、产品、律师、自媒体等需要"鬼点子+快反应"的舞台。',
        love: '需要一个接得住你脑洞还能跟你斗嘴的人；怕无聊胜过怕吵架，保持新鲜感是关系的保鲜剂。',
        growth: '给"完成"本身一点奖励；辩论赢了道理，别忘了也要赢人心。',
        famous: '爱迪生、丘吉尔、小托马斯·沃森（历史人物为后世推测，仅供娱乐）'
    },
    INFJ: {
        name: '提倡者', group: '外交家', emoji: '🕯️', keywords: ['洞察', '理想主义', '温柔而坚定'],
        traits: '你是稀有的理想主义者：外表温和，内心有一套不可动摇的原则。极擅长读懂他人情绪，却也常因吸收太多情绪而疲惫，需要定期"人间蒸发"回血。',
        strengths: '深刻的洞察力与共情力；对认定的价值极为坚定；写作与表达常常直击人心。',
        weaknesses: '过度自省、容易内耗；习惯把别人放前面，委屈自己；对冲突回避，问题容易拖大。',
        careers: '心理咨询、教育、公益、写作、人力资源等"影响人心"的方向。',
        love: '要深度不要广度：灵魂共鸣大于一切；一旦认定便极其长情，但也需要独处的空间。',
        growth: '学会说"不"并不可怕；把照顾别人的那份细腻，也分一点给自己。',
        famous: '特蕾莎修女、歌德、《西游记》里的唐僧（虚构/推测，仅供娱乐）'
    },
    INFP: {
        name: '调停者', group: '外交家', emoji: '🌙', keywords: ['真诚', '浪漫', '内心戏丰富'],
        traits: '你活在自己温柔的精神世界里，对美与意义极其敏感。看起来安静随和，内心其实上演着史诗级大戏；讨厌虚伪，渴望一切关系都真实。',
        strengths: '极强的共情与治愈力；想象力与创作力出众；价值观坚定，不为利益折腰。',
        weaknesses: '容易想太多、被批评击穿；拖延于不感兴趣的事；理想与现实的落差常让你emo。',
        careers: '写作、设计、音乐、翻译、心理健康等能安放感性与创造力的领域。',
        love: '爱得很纯粹也很小心翼翼；需要一个能接住你全部情绪、且不嫌你"想太多"的人。',
        growth: '把"完美状态"降级为"先开始"；你的感受值得被表达，而不是只被写在日记里。',
        famous: '莎士比亚、J.R.R.托尔金、海伦·凯勒（历史人物为后世推测，仅供娱乐）'
    },
    ENFJ: {
        name: '主人公', group: '外交家', emoji: '🌟', keywords: ['感染力', '责任感', '会来事'],
        traits: '你是人群里的太阳：善于看见每个人的好，并把他们凝聚到同一件事上。天生的组织者与鼓励者，走到哪都能带起一支队伍。',
        strengths: '超强的人际连接与号召力；善于激励他人成长；有担当，团队里最可靠的那类人。',
        weaknesses: '太在意别人的评价，容易自我消耗；习惯大包大揽，把自己累垮；面对冲突容易和稀泥。',
        careers: '教师、培训、公关与品牌、团队管理、社群运营等"带人成事"的角色。',
        love: '投入而体贴，记得对方所有的小事；也要小心别把伴侣当"项目"来培养。',
        growth: '允许自己偶尔"不担当"；先照顾好自己的油箱，再去点亮别人。',
        famous: '奥巴马、奥普拉·温弗瑞、马丁·路德·金（历史人物为后世推测，仅供娱乐）'
    },
    ENFP: {
        name: '竞选者', group: '外交家', emoji: '🎈', keywords: ['热情', '脑洞', '自由灵魂'],
        traits: '你是行走的多巴胺：好奇心满格、热情外溢，能把任何平凡的一天过成冒险。人缘极好，三分钟就能和陌生人聊成老友。',
        strengths: '感染力与创造力一流；善于发现可能性，把无聊变有趣；真诚待人，朋友遍天下。',
        weaknesses: '三分钟热度，虎头蛇尾；讨厌琐碎细节与长期计划；情绪起伏大，容易冲动决定。',
        careers: '创意、传媒、主持、市场、旅行与生活方式类工作，越自由越出彩。',
        love: '爱情里要火花也要自由；会为爱制造无数惊喜，但也怕被管束和冷落。',
        growth: '给热情装一个"完成"的仪式感；留一两件事坚持到底，你会惊艳所有人。',
        famous: '罗宾·威廉姆斯、威尔·史密斯、马克·吐温（历史人物为后世推测，仅供娱乐）'
    },
    ISTJ: {
        name: '物流师', group: '守护者', emoji: '📋', keywords: ['可靠', '严谨', '有始有终'],
        traits: '你是令人安心的存在：说过的话算数，答应的事办到。做事讲流程、重事实，是团队里那个默默把一切兜底的人。',
        strengths: '极强的责任心与执行力；细节管理出色，几乎不出低级错误；稳定可靠，值得托付。',
        weaknesses: '对变化和"离经叛道"适应较慢；容易固执于既有做法；对自己要求苛刻，放松下来反而不知所措。',
        careers: '财务、审计、法务、供应链、行政管理等需要精确与稳定的领域。',
        love: '不善花哨表达，但爱得踏实长久；你的浪漫是把生活安排得井井有条。',
        growth: '新方法先别急着否定，试三次再下结论；偶尔打破 routine，生活会有惊喜。',
        famous: '沃伦·巴菲特、乔治·华盛顿、安吉拉·默克尔（历史人物为后世推测，仅供娱乐）'
    },
    ISFJ: {
        name: '守卫者', group: '守护者', emoji: '🛡️', keywords: ['温暖', '细心', '默默付出'],
        traits: '你是最温柔的守护者：记得每个人的喜好，悄悄把细节做好。谦虚低调，不喜欢张扬，但身边人都知道——有你在就特别安心。',
        strengths: '体贴入微的照顾力；耐心与毅力出众；责任感强，承诺的事情一定做到。',
        weaknesses: '不善拒绝，容易委屈自己扛下所有；害怕冲突，有情绪也憋着；对变化敏感，容易焦虑。',
        careers: '医护、教育、图书与档案、行政支持、客户关怀等以细致与温度见长的职业。',
        love: '爱在细节里：一杯热汤、一句"路上小心"；需要对方主动看见你的付出。',
        growth: '把"没关系"换成"我其实希望…"；你的需求同样重要，说出来不是麻烦别人。',
        famous: '特蕾莎修女、凯特·米德尔顿、《甄嬛传》里的沈眉庄（虚构/推测，仅供娱乐）'
    },
    ESTJ: {
        name: '总经理', group: '守护者', emoji: '💼', keywords: ['务实', '执行', '组织力'],
        traits: '你是天生的管理者：目标清晰、令行禁止，最见不得磨叽和含糊。相信规则与努力，是把计划变成结果的发动机。',
        strengths: '强大的组织与执行能力；果断、负责，越是乱局越镇得住；务实高效，用结果说话。',
        weaknesses: '强势直接，容易忽略他人感受；对"不合逻辑"的情绪缺乏耐心；控制欲上头时听不进反对意见。',
        careers: '运营管理、项目管理、销售负责人、公共事务等需要拍板和推进的岗位。',
        love: '爱得很实在：解决问题就是表达爱的方式；也要学着陪对方"不解决问题，只聊聊天"。',
        growth: '慢一点下结论，先问一句"你怎么看"；团队里被需要≠被信服，留白才有威信。',
        famous: '亨利·福特、米歇尔·奥巴马、撒切尔夫人（历史人物为后世推测，仅供娱乐）'
    },
    ESFJ: {
        name: '执政官', group: '守护者', emoji: '💗', keywords: ['热心', '周到', '凝聚力'],
        traits: '你是人群的粘合剂：谁生日、谁爱吃什么、谁最近不开心，你全都记得。热心肠、爱张罗，聚会名单永远是你来定。',
        strengths: '超强的亲和力与组织协调；照顾他人感受的雷达极其灵敏；把集体氛围经营得温暖融洽。',
        weaknesses: '过于在意他人认可，容易讨好型内耗；害怕被讨厌，不敢表达真实想法；闲下来就慌。',
        careers: '人力资源、活动与客户成功、医护教育、餐饮酒店等"以人为本"的行业。',
        love: '全情投入型选手，把对方照顾得无微不至；也渴望同样的回应与肯定。',
        growth: '练习"课题分离"：别人不开心不一定与你有关；先取悦自己，再温暖世界。',
        famous: '泰勒·斯威夫特、比尔·克林顿、《老友记》莫妮卡（虚构/推测，仅供娱乐）'
    },
    ISTP: {
        name: '鉴赏家', group: '探索家', emoji: '🔧', keywords: ['冷静', '动手力', '活在当下'],
        traits: '你是沉默的实干家：话不多，但手上的活儿没人挑得出毛病。危机时刻最冷静，越乱越清醒；自由和空间是你的氧气。',
        strengths: '超强的动手与排障能力；临危不乱，风险判断精准；独立自主，不内耗不多想，先干再说。',
        weaknesses: '不爱表达，容易显得疏离；对长期承诺与计划兴趣寥寥；说话直接，无意间扎心。',
        careers: '工程技术、机械与硬件、外科医生、消防与救援、飞行员等"手上见真章"的职业。',
        love: '爱意藏在行动里：修好的、装好的、备好的就是情书；需要能给你留足空间的伴侣。',
        growth: '偶尔把"我来"换成"我们一起"；分享感受不是示弱，是给关系上油。',
        famous: '李小龙、克林特·伊斯特伍德、迈克尔·乔丹（历史人物为后世推测，仅供娱乐）'
    },
    ISFP: {
        name: '探险家', group: '探索家', emoji: '🎨', keywords: ['随性', '审美', '温柔'],
        traits: '你是低调的艺术家：感官敏锐、审美在线，对色彩、气味、旋律都有天然的挑剔。不爱争抢，按自己的节奏生活，外柔内韧。',
        strengths: '出众的审美与创造力；温和体贴，共情力强；行动力藏在随性之下——认准的事悄悄就做了。',
        weaknesses: '回避冲突与长远规划，容易被动等待；情绪敏感但不说，闷成内伤；原则被踩到底线会突然消失。',
        careers: '设计、摄影、音乐、料理、手作与疗愈类职业，让感官与创造力变现。',
        love: '细水长流型：一起吃饭、散步、看晚霞就是浪漫；讨厌被安排、被催促。',
        growth: '把感受说出口，别等人猜；给生活装一点小规划，随性会走得更远。',
        famous: '迈克尔·杰克逊、弗里达·卡罗、Bob Dylan（历史人物为后世推测，仅供娱乐）'
    },
    ESTP: {
        name: '企业家', group: '探索家', emoji: '🔥', keywords: ['果敢', '行动派', '冒险精神'],
        traits: '你是肾上腺素驱动的行动派：机会一闪你就出手了，别人还在做PPT你已经签完合同。直觉敏锐，擅长在现实世界里快速试错。',
        strengths: '顶级的临场反应与行动力；敢想敢干，抗压能力强；对人心的嗅觉极准，谈判天然占优。',
        weaknesses: '耐心稀缺，容易虎头蛇尾；风险偏好过高，偶尔大意失荆州；讨厌理论说教，学习靠踩坑。',
        careers: '销售、创业、金融交易、体育、危机公关等高风险高回报的快节奏领域。',
        love: '喜欢就直接追，热恋来得轰轰烈烈；保鲜秘诀是和对方一直有新鲜事可玩。',
        growth: '给冲动加一道三秒思考闸；偶尔停下来复盘，胜率还能再涨一截。',
        famous: '麦当娜、唐纳德·特朗普、欧内斯特·海明威（历史人物为后世推测，仅供娱乐）'
    },
    ESFP: {
        name: '表演者', group: '探索家', emoji: '🎤', keywords: ['活力', '感染力', '享乐当下'],
        traits: '你是天生的舞台中心和气氛担当：热情外放、笑点与泪点都坦诚。信奉"人生苦短，先开心再说"，跟你待在一起很难无聊。',
        strengths: '超强的感染力与表现力；乐观灵活，适应力一流；对当下体验的敏感让生活处处有滋味。',
        weaknesses: '容易被情绪牵着走；回避沉重话题与长期规划；冲动消费与三分钟热度需要警惕。',
        careers: '主持直播、表演、活动策划、销售、旅行体验师等越热闹越出彩的职业。',
        love: '爱得热烈直接，会把对方宠成主角；也需要对方稳稳接住你偶尔的低落。',
        growth: '给快乐配上一点延迟满足；学会与无聊共处，是自由的新境界。',
        famous: '玛丽莲·梦露、贾斯汀·比伯、埃尔顿·约翰（历史人物为后世推测，仅供娱乐）'
    }
};

document.addEventListener('DOMContentLoaded', () => new MbtiTest());
