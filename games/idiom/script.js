/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
/* 成语接龙：四选一，含成语解释，限时/休闲两种模式 */
'use strict';

/* 精选成语题库（每条含成语/拼音/释义/出处） */
const IDIOMS = [
    {w:'一举两得',py:'yī jǔ liǎng dé',m:'做一件事同时得到两方面的好处。',s:'《晋书·束皙传》'},
    {w:'得过且过',py:'dé guò qiě guò',m:'只要能够过得去，就这样过下去。指胸无大志。',s:'元·无名氏'},
    {w:'过目不忘',py:'guò mù bù wàng',m:'看过一遍就不会忘记，形容记忆力强。',s:'《晋书·苻融载记》'},
    {w:'忘恩负义',py:'wàng ēn fù yì',m:'忘记别人对自己的恩情，做出对不起别人的事。',s:'《魏书》'},
    {w:'义无反顾',py:'yì wú fǎn gù',m:'从道义上只有勇往直前，不能犹豫回顾。',s:'汉·司马相如'},
    {w:'顾全大局',py:'gù quán dà jú',m:'从整个局势考虑，使不受损害。',s:'清·李宝嘉'},
    {w:'局促不安',py:'jú cù bù ān',m:'形容举止拘束，心中不安。',s:'明·冯梦龙'},
    {w:'安之若素',py:'ān zhī ruò sù',m:'遇到不顺利或反常的情况等安然处之，毫不在意。',s:'清·范寅'},
    {w:'素昧平生',py:'sù mèi píng shēng',m:'彼此一向不了解。指与某人从来不认识。',s:'唐·李商隐'},
    {w:'生龙活虎',py:'shēng lóng huó hǔ',m:'形容活泼矫健，富有生气。',s:'宋·朱熹'},
    {w:'虎头蛇尾',py:'hǔ tóu shé wěi',m:'比喻做事起初声势很大，后来劲头很小，有始无终。',s:'元·康进之'},
    {w:'尾大不掉',py:'wěi dà bù diào',m:'比喻机构下强上弱，或组织庞大、涣散，难以控制。',s:'《左传》'},
    {w:'掉以轻心',py:'diào yǐ qīng xīn',m:'对某件事不重视，态度不认真。',s:'唐·柳宗元'},
    {w:'心安理得',py:'xīn ān lǐ dé',m:'自认为做的事情合乎道理，心里很坦然。',s:'清·岭南羽衣女士'},
    {w:'得不偿失',py:'dé bù cháng shī',m:'所得的利益抵偿不了所受的损失。',s:'宋·苏轼'},
    {w:'失魂落魄',py:'shī hún luò pò',m:'形容惊慌忧虑、心神不定、行动失常的样子。',s:'元·无名氏'},
    {w:'魄散魂飞',py:'pò sàn hún fēi',m:'形容极端惊恐。',s:'《西湖二集》'},
    {w:'飞黄腾达',py:'fēi huáng téng dá',m:'形容马跑得极快。比喻骤然得志，官职地位升得很快。',s:'唐·韩愈'},
    {w:'达官贵人',py:'dá guān guì rén',m:'地位高的官吏和尊贵显赫的人物。',s:'《礼记》'},
    {w:'人山人海',py:'rén shān rén hǎi',m:'人群如山似海。形容人聚集得非常多。',s:'明·施耐庵'},
    {w:'海阔天空',py:'hǎi kuò tiān kōng',m:'形容大自然的广阔。比喻想象或说话毫无拘束。',s:'唐·刘氏瑶'},
    {w:'空穴来风',py:'kōng xué lái fēng',m:'有了洞穴才进风。比喻消息和谣言不是完全没有原因的。',s:'战国·宋玉'},
    {w:'风和日丽',py:'fēng hé rì lì',m:'和风习习，阳光灿烂。形容晴朗暖和的天气。',s:'唐·无名氏'},
    {w:'丽质天成',py:'lì zhì tiān chéng',m:'天生的美丽姿质。',s:'唐·白居易'},
    {w:'成家立业',py:'chéng jiā lì yè',m:'指建立了家庭，创立了事业。',s:'宋·吴自牧'},
    {w:'业精于勤',py:'yè jīng yú qín',m:'学业精深是由于勤奋。',s:'唐·韩愈'},
    {w:'勤能补拙',py:'qín néng bǔ zhuō',m:'勤奋能够弥补天生的不足。',s:'宋·邵雍'},
    {w:'拙嘴笨舌',py:'zhuō zuǐ bèn shé',m:'嘴巴笨拙，不善言辞。',s:'明·西周生'},
    {w:'舌灿莲花',py:'shé càn lián huā',m:'形容口才好，说话动听。',s:'佛教典故'},
    {w:'花好月圆',py:'huā hǎo yuè yuán',m:'比喻美好圆满的生活，多用作新婚颂辞。',s:'宋·晁次膺'},
    {w:'圆木警枕',py:'yuán mù jǐng zhěn',m:'用圆木做枕头，睡着时容易惊醒。形容刻苦自勉。',s:'宋·范祖禹'},
    {w:'枕戈待旦',py:'zhěn gē dài dàn',m:'枕着兵器等待天亮。形容时刻警惕，准备作战。',s:'《晋书·刘琨传》'},
    {w:'旦夕之间',py:'dàn xī zhī jiān',m:'形容很短的时间内。',s:'汉·无名氏'},
    {w:'间不容发',py:'jiān bù róng fà',m:'空隙中容不下一根头发。比喻与灾祸相距极近。',s:'汉·枚乘'},
    {w:'发愤图强',py:'fā fèn tú qiáng',m:'下定决心，努力追求进步。',s:'何香凝'},
    {w:'强人所难',py:'qiǎng rén suǒ nán',m:'勉强别人做不愿做或做不了的事。',s:'清·李汝珍'},
    {w:'难能可贵',py:'nán néng kě guì',m:'不容易做到的事居然能做到，非常可贵。',s:'宋·苏轼'},
    {w:'贵人多忘',py:'guì rén duō wàng',m:'地位高的人容易忘记旧交。也用作对别人忘记事情的客气话。',s:'五代·王定保'},
    {w:'忘乎所以',py:'wàng hū suǒ yǐ',m:'由于过度兴奋或骄傲自满而忘记了一切。',s:'明·冯梦龙'},
    {w:'以德报怨',py:'yǐ dé bào yuàn',m:'用恩惠回报与别人的仇恨。',s:'《论语》'},
    {w:'怨天尤人',py:'yuàn tiān yóu rén',m:'抱怨天，埋怨别人。形容对不如意的事一味归咎于客观。',s:'《论语》'},
    {w:'人杰地灵',py:'rén jié dì líng',m:'指杰出的人物出生或到过的地方成为名胜之地。',s:'唐·王勃'},
    {w:'灵丹妙药',py:'líng dān miào yào',m:'非常灵验、能起死回生的奇药。比喻幻想中的解决一切问题的方法。',s:'元·无名氏'},
    {w:'药到病除',py:'yào dào bìng chú',m:'药一服下病就好了。形容用药效果非常好。',s:'民间俗语'},
    {w:'除恶务尽',py:'chú è wù jìn',m:'清除坏人坏事必须彻底。',s:'《尚书》'},
    {w:'尽心尽力',py:'jìn xīn jìn lì',m:'费尽心思，使出全部力量。',s:'《晋书·王坦之传》'},
    {w:'力挽狂澜',py:'lì wǎn kuáng lán',m:'比喻尽力挽回危险的局势。',s:'唐·韩愈'},
    {w:'澜倒波随',py:'lán dǎo bō suí',m:'比喻言行随波逐流，没有主见。',s:'宋·苏轼'},
    {w:'随遇而安',py:'suí yù ér ān',m:'能顺应环境，在任何境遇中都能满足。',s:'清·刘献廷'},
    {w:'安步当车',py:'ān bù dàng chē',m:'以从容的步行代替乘车。',s:'《战国策》'},
    {w:'车水马龙',py:'chē shuǐ mǎ lóng',m:'车像流水，马像游龙。形容热闹繁华的景象。',s:'《后汉书》'},
    {w:'龙飞凤舞',py:'lóng fēi fèng wǔ',m:'形容书法笔势舒展活泼。也形容山势蜿蜒起伏。',s:'宋·苏轼'},
    {w:'舞文弄墨',py:'wǔ wén nòng mò',m:'故意玩弄文笔。原指曲引法律条文作弊。',s:'《隋书》'},
    {w:'墨守成规',py:'mò shǒu chéng guī',m:'指思想保守，守着老规矩不肯改变。',s:'明·黄宗羲'},
    {w:'规行矩步',py:'guī xíng jǔ bù',m:'严格按照规矩行事。也指墨守成规，不知变通。',s:'《晋书》'},
    {w:'步步为营',py:'bù bù wéi yíng',m:'军队每前进一步就设下一道营垒。形容进军谨慎。也比喻行动、做事谨慎稳妥。',s:'明·罗贯中'},
    {w:'营私舞弊',py:'yíng sī wǔ bì',m:'为了私人利益而弄虚作假、做违法乱纪的事。',s:'清·吴趼人'},
    {w:'弊绝风清',py:'bì jué fēng qīng',m:'贪污舞弊的事情完全没有了。形容社会风气良好。',s:'宋·周敦颐'},
    {w:'清风明月',py:'qīng fēng míng yuè',m:'只与清风、明月为伴。比喻不随便结交朋友。也比喻清闲无事。',s:'《南史》'},
    {w:'月下老人',py:'yuè xià lǎo rén',m:'神话中掌管婚姻的神。后指媒人。',s:'唐·李复言'},
    {w:'人生如梦',py:'rén shēng rú mèng',m:'人生如同一场梦。形容世事无定，人生短促。',s:'宋·苏轼'},
    {w:'梦寐以求',py:'mèng mèi yǐ qiú',m:'做梦的时候都在追求。形容迫切地期望着。',s:'《诗经》'},
    {w:'求同存异',py:'qiú tóng cún yì',m:'找出共同点，保留不同意见。',s:'《礼记》'},
    {w:'异曲同工',py:'yì qǔ tóng gōng',m:'不同的曲调演得同样好。比喻做法不同但效果一样。',s:'唐·韩愈'},
    {w:'工欲善其事必先利其器',py:'gōng yù shàn qí shì bì xiān lì qí qì',m:'工匠想要做好工作，一定要先让工具锋利。比喻要做好一件事，准备工作非常重要。',s:'《论语》'},
    {w:'器宇轩昂',py:'qì yǔ xuān áng',m:'形容人精神饱满，气度不凡。',s:'明·罗贯中'},
    {w:'昂首挺胸',py:'áng shǒu tǐng xiōng',m:'抬起头挺起胸膛。形容精神饱满的样子。',s:'现代汉语'},
];

/* 构建接龙图：按尾字→首字索引 */
const byFirst = {};
IDIOMS.forEach(item => {
    const c = item.w[0];
    if (!byFirst[c]) byFirst[c] = [];
    byFirst[c].push(item);
});

class IdiomGame {
    constructor() {
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.overOverlay = document.getElementById('result-overlay');
        this.mode = null;
        this.current = null;
        this.streak = 0;
        this.best = this.loadBest();
        this.timeLeft = 0;
        this.bindEvents();
    }

    loadBest() { try { return +localStorage.getItem('idiom_best') || 0; } catch { return 0; } }
    saveBest() { try { localStorage.setItem('idiom_best', String(this.best)); } catch {} }

    bindEvents() {
        document.querySelectorAll('.return-lobby-btn').forEach(b => b.addEventListener('click', () => location.href = '../../index.html'));
        document.querySelectorAll('.mode-btn').forEach(b => b.addEventListener('click', () => this.start(b.dataset.mode)));
        document.getElementById('quit-btn').addEventListener('click', () => this.showStart());
        document.getElementById('over-retry').addEventListener('click', () => { this.hideOver(); this.start(this.mode); });
        document.getElementById('over-menu').addEventListener('click', () => { this.hideOver(); this.showStart(); });
    }

    showStart() { this.gameScreen.style.display = 'none'; this.startScreen.style.display = ''; this.stopTimer(); }
    hideOver() { this.overOverlay.style.display = 'none'; }

    start(mode) {
        this.mode = mode;
        this.streak = 0;
        this.current = IDIOMS[Math.floor(Math.random() * IDIOMS.length)];
        this.startScreen.style.display = 'none';
        this.gameScreen.style.display = '';
        document.getElementById('hud-best').textContent = `最佳 ${this.best}`;
        document.getElementById('hud-timer').textContent = mode === 'timed' ? '⏱️ 60s' : '';
        if (mode === 'timed') { this.timeLeft = 60; this.startTimer(); }
        this.showQuestion();
    }

    startTimer() {
        this.stopTimer();
        this.timer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('hud-timer').textContent = `⏱️ ${this.timeLeft}s`;
            if (this.timeLeft <= 0) this.endGame();
        }, 1000);
    }

    stopTimer() { if (this.timer) clearInterval(this.timer); this.timer = null; }

    showQuestion() {
        const cur = this.current;
        document.getElementById('idiom-text').textContent = cur.w;
        document.getElementById('idiom-py').textContent = cur.py;
        document.getElementById('idiom-meaning').textContent = cur.m;
        document.getElementById('last-char').textContent = cur.w[cur.w.length - 1];
        document.getElementById('idiom-result').style.display = 'none';

        // 生成四选一选项：1 个正确 + 3 个干扰项
        const lastChar = cur.w[cur.w.length - 1];
        const correct = (byFirst[lastChar] || []).filter(x => x.w !== cur.w);
        let answer;
        if (correct.length) answer = correct[Math.floor(Math.random() * correct.length)];
        else {
            // 没有接龙的成语，随机换当前成语
            this.current = IDIOMS[Math.floor(Math.random() * IDIOMS.length)];
            return this.showQuestion();
        }

        // 干扰项：不以尾字开头的随机成语
        const wrong = [];
        while (wrong.length < 3) {
            const cand = IDIOMS[Math.floor(Math.random() * IDIOMS.length)];
            if (cand.w !== answer.w && cand.w[0] !== lastChar && !wrong.some(w => w.w === cand.w)) wrong.push(cand);
        }

        const options = [answer, ...wrong].sort(() => Math.random() - 0.5);
        const optDiv = document.getElementById('options');
        optDiv.innerHTML = options.map((o, i) =>
            `<button class="opt-btn" data-idiom="${o.w}" data-correct="${o.w === answer.w}">${o.w}</button>`
        ).join('');

        optDiv.querySelectorAll('.opt-btn').forEach(btn => {
            btn.addEventListener('click', () => this.answer(btn, answer));
        });
    }

    answer(btn, answer) {
        const opts = document.querySelectorAll('.opt-btn');
        opts.forEach(b => b.disabled = true);
        const isCorrect = btn.dataset.correct === 'true';

        if (isCorrect) {
            btn.classList.add('correct');
            this.streak++;
            this.current = answer;
            AudioManager.play('success');
            if (this.streak > this.best) { this.best = this.streak; this.saveBest(); }
        } else {
            btn.classList.add('wrong');
            const correctBtn = document.querySelector(`[data-correct="true"]`);
            if (correctBtn) correctBtn.classList.add('correct');
            AudioManager.play('error');
            if (this.mode === 'casual') { this.streak = 0; }
            else { this.endGame(); return; }
        }

        document.getElementById('hud-streak').textContent = `连对 ${this.streak}`;
        document.getElementById('hud-best').textContent = `最佳 ${this.best}`;

        // 显示解释
        const resultDiv = document.getElementById('idiom-result');
        resultDiv.style.display = '';
        resultDiv.innerHTML = `<div class="idiom-full">
            <b>${answer.w}</b>（${answer.py}）<br>
            ${answer.m}<br>
            <small style="color:#888">—— ${answer.s}</small>
        </div>`;

        // 下一题
        setTimeout(() => {
            if (this.mode === 'timed' && this.timeLeft <= 0) return;
            this.showQuestion();
        }, isCorrect ? 1800 : 3000);
    }

    endGame() {
        this.stopTimer();
        document.getElementById('over-title').textContent = this.streak >= 10 ? '🎉 了不起！' : '⏱️ 时间到！';
        document.getElementById('over-text').textContent = `连对 ${this.streak} 题，最佳纪录 ${this.best} 题`;
        this.overOverlay.style.display = 'flex';
        if (window.LG) LG.Achievements.report('idiom_play', { streak: this.streak });
    }
}

document.addEventListener('DOMContentLoaded', () => new IdiomGame());
