class SchulteGame {
    constructor() {
        this.screens = {
            main: document.getElementById('main-menu'),
            classic: document.getElementById('classic-mode-screen'),
            standard: document.getElementById('standard-mode-screen'),
            poetry: document.getElementById('poetry-mode-screen'),
            game: document.getElementById('game-screen')
        };
        
        this.gameBoard = document.getElementById('game-board');
        this.targetNumberDisplay = document.getElementById('target-number');
        this.timerDisplay = document.getElementById('timer');
        this.restartBtn = document.getElementById('restart-btn');
        this.poetryDisplay = document.getElementById('poetry-display');
        this.poetryTitle = document.getElementById('poetry-title');
        this.poetryContent = document.getElementById('poetry-content');
        this.poetryList = document.getElementById('poetry-list');
        
        this.items = [];
        this.currentTarget = 1;
        this.gridSize = 5;
        this.mode = null;
        this.timer = null;
        this.startTime = null;
        this.gameActive = false;
        this.currentPoetry = null;
        this.currentPoetryIndex = 0;
        
        this.poems = this.loadPoems();
        
        this.init();
    }
    
    loadPoems() {
        const poems = [
            { 
                title: '登鹳雀楼', 
                author: '王之涣', 
                content: '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。',
                pinyin: 'bái rì yī shān jìn, huáng hé rù hǎi liú. yù qióng qiān lǐ mù, gèng shàng yī céng lóu.'
            },
            { 
                title: '静夜思', 
                author: '李白', 
                content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
                pinyin: 'chuáng qián míng yuè guāng, yí shì dì shàng shuāng. jǔ tóu wàng míng yuè, dī tóu sī gù xiāng.'
            },
            { 
                title: '春晓', 
                author: '孟浩然', 
                content: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
                pinyin: 'chūn mián bù jué xiǎo, chù chù wén tí niǎo. yè lái fēng yǔ shēng, huā luò zhī duō shǎo.'
            },
            { 
                title: '相思', 
                author: '王维', 
                content: '红豆生南国，春来发几枝。愿君多采撷，此物最相思。',
                pinyin: 'hóng dòu shēng nán guó, chūn lái fā jǐ zhī. yuàn jūn duō cǎi xié, cǐ wù zuì xiāng sī.'
            },
            { 
                title: '江雪', 
                author: '柳宗元', 
                content: '千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。',
                pinyin: 'qiān shān niǎo fēi jué, wàn jìng rén zōng miè. gū zhōu suō lì wēng, dú diào hán jiāng xuě.'
            },
            { 
                title: '鹿柴', 
                author: '王维', 
                content: '空山不见人，但闻人语响。返景入深林，复照青苔上。',
                pinyin: 'kōng shān bù jiàn rén, dàn wén rén yǔ xiǎng. fǎn yǐng rù shēn lín, fù zhào qīng tái shàng.'
            },
            { 
                title: '竹里馆', 
                author: '王维', 
                content: '独坐幽篁里，弹琴复长啸。深林人不知，明月来相照。',
                pinyin: 'dú zuò yōu huáng lǐ, tán qín fù cháng xiào. shēn lín rén bù zhī, míng yuè lái xiāng zhào.'
            },
            { 
                title: '悯农', 
                author: '李绅', 
                content: '锄禾日当午，汗滴禾下土。谁知盘中餐，粒粒皆辛苦。',
                pinyin: 'chú hé rì dāng wǔ, hàn dī hé xià tǔ. shéi zhī pán zhōng cān, lì lì jiē xīn kǔ.'
            },
            { 
                title: '咏鹅', 
                author: '骆宾王', 
                content: '鹅，鹅，鹅，曲项向天歌。白毛浮绿水，红掌拨清波。',
                pinyin: 'é, é, é, qū xiàng xiàng tiān gē. bái máo fú lǜ shuǐ, hóng zhǎng bō qīng bō.'
            },
            { 
                title: '宿建德江', 
                author: '孟浩然', 
                content: '移舟泊烟渚，日暮客愁新。野旷天低树，江清月近人。',
                pinyin: 'yí zhōu bó yān zhǔ, rì mù kè chóu xīn. yě kuàng tiān dī shù, jiāng qīng yuè jìn rén.'
            },
            { 
                title: '鸟鸣涧', 
                author: '王维', 
                content: '人闲桂花落，夜静春山空。月出惊山鸟，时鸣春涧中。',
                pinyin: 'rén xián guì huā luò, yè jìng chūn shān kōng. yuè chū jīng shān niǎo, shí míng chūn jiàn zhōng.'
            },
            { 
                title: '独坐敬亭山', 
                author: '李白', 
                content: '众鸟高飞尽，孤云独去闲。相看两不厌，只有敬亭山。',
                pinyin: 'zhòng niǎo gāo fēi jìn, gū yún dú qù xián. xiāng kàn liǎng bù yàn, zhǐ yǒu jìng tíng shān.'
            },
            { 
                title: '暮江吟', 
                author: '白居易', 
                content: '一道残阳铺水中，半江瑟瑟半江红。可怜九月初三夜，露似珍珠月似弓。',
                pinyin: 'yī dào cán yáng pū shuǐ zhōng, bàn jiāng sè sè bàn jiāng hóng. kě lián jiǔ yuè chū sān yè, lù sì zhēn zhū yuè sì gōng.'
            },
            { 
                title: '忆江南', 
                author: '白居易', 
                content: '江南好，风景旧曾谙。日出江花红胜火，春来江水绿如蓝。能不忆江南？',
                pinyin: 'jiāng nán hǎo, fēng jǐng jiù céng ān. rì chū jiāng huā hóng shèng huǒ, chūn lái jiāng shuǐ lǜ rú lán. néng bù yì jiāng nán?'
            },
            { 
                title: '绝句', 
                author: '杜甫', 
                content: '两个黄鹂鸣翠柳，一行白鹭上青天。窗含西岭千秋雪，门泊东吴万里船。',
                pinyin: 'liǎng gè huáng lí míng cuì liǔ, yī háng bái lù shàng qīng tiān. chuāng hán xī lǐng qiān qiū xuě, mén bó dōng wú wàn lǐ chuán.'
            },
            { 
                title: '春夜喜雨', 
                author: '杜甫', 
                content: '好雨知时节，当春乃发生。随风潜入夜，润物细无声。',
                pinyin: 'hǎo yǔ zhī shí jié, dāng chūn nǎi fā shēng. suí fēng qián rù yè, rùn wù xì wú shēng.'
            },
            { 
                title: '望庐山瀑布', 
                author: '李白', 
                content: '日照香炉生紫烟，遥看瀑布挂前川。飞流直下三千尺，疑是银河落九天。',
                pinyin: 'rì zhào xiāng lú shēng zǐ yān, yáo kàn pù bù guà qián chuān. fēi liú zhí xià sān qiān chǐ, yí shì yín hé luò jiǔ tiān.'
            },
            { 
                title: '早发白帝城', 
                author: '李白', 
                content: '朝辞白帝彩云间，千里江陵一日还。两岸猿声啼不住，轻舟已过万重山。',
                pinyin: 'zhāo cí bái dì cǎi yún jiān, qiān lǐ jiāng líng yī rì huán. liǎng àn yuán shēng tí bú zhù, qīng zhōu yǐ guò wàn chóng shān.'
            },
            { 
                title: '赋得古原草送别', 
                author: '白居易', 
                content: '离离原上草，一岁一枯荣。野火烧不尽，春风吹又生。',
                pinyin: 'lí lí yuán shàng cǎo, yī suì yī kū róng. yě huǒ shāo bú jìn, chūn fēng chuī yòu shēng.'
            },
            { 
                title: '回乡偶书', 
                author: '贺知章', 
                content: '少小离家老大回，乡音无改鬓毛衰。儿童相见不相识，笑问客从何处来。',
                pinyin: 'shào xiǎo lí jiā lǎo dà huí, xiāng yīn wú gǎi bìn máo cuī. ér tóng xiāng jiàn bù xiāng shí, xiào wèn kè cóng hé chù lái.'
            },
            { 
                title: '赠汪伦', 
                author: '李白', 
                content: '李白乘舟将欲行，忽闻岸上踏歌声。桃花潭水深千尺，不及汪伦送我情。',
                pinyin: 'lǐ bái chéng zhōu jiāng yù xíng, hū wén àn shàng tà gē shēng. táo huā tán shuǐ shēn qiān chǐ, bù jí wāng lún sòng wǒ qíng.'
            },
            { 
                title: '山行', 
                author: '杜牧', 
                content: '远上寒山石径斜，白云生处有人家。停车坐爱枫林晚，霜叶红于二月花。',
                pinyin: 'yuǎn shàng hán shān shí jìng xié, bái yún shēng chù yǒu rén jiā. tíng chē zuò ài fēng lín wǎn, shuāng yè hóng yú èr yuè huā.'
            },
            { 
                title: '清明', 
                author: '杜牧', 
                content: '清明时节雨纷纷，路上行人欲断魂。借问酒家何处有，牧童遥指杏花村。',
                pinyin: 'qīng míng shí jié yǔ fēn fēn, lù shàng xíng rén yù duàn hún. jiè wèn jiǔ jiā hé chù yǒu, mù tóng yáo zhǐ xìng huā cūn.'
            },
            { 
                title: '望月怀远', 
                author: '张九龄', 
                content: '海上生明月，天涯共此时。情人怨遥夜，竟夕起相思。',
                pinyin: 'hǎi shàng shēng míng yuè, tiān yá gòng cǐ shí. qíng rén yuàn yáo yè, jìng xī qǐ xiāng sī.'
            },
            { 
                title: '送元二使安西', 
                author: '王维', 
                content: '渭城朝雨浥轻尘，客舍青青柳色新。劝君更尽一杯酒，西出阳关无故人。',
                pinyin: 'wèi chéng zhāo yǔ yì qīng chén, kè shè qīng qīng liǔ sè xīn. quàn jūn gèng jìn yī bēi jiǔ, xī chū yáng guān wú gù rén.'
            },
            { 
                title: '九月九日忆山东兄弟', 
                author: '王维', 
                content: '独在异乡为异客，每逢佳节倍思亲。遥知兄弟登高处，遍插茱萸少一人。',
                pinyin: 'dú zài yì xiāng wéi yì kè, měi féng jiā jié bèi sī qīn. yáo zhī xiōng dì dēng gāo chù, biàn chā zhū yú shǎo yī rén.'
            },
            { 
                title: '别董大', 
                author: '高适', 
                content: '千里黄云白日曛，北风吹雁雪纷纷。莫愁前路无知己，天下谁人不识君。',
                pinyin: 'qiān lǐ huáng yún bái rì xūn, běi fēng chuī yàn xuě fēn fēn. mò chóu qián lù wú zhī jǐ, tiān xià shéi rén bù shí jūn.'
            },
            { 
                title: '登高', 
                author: '杜甫', 
                content: '风急天高猿啸哀，渚清沙白鸟飞回。无边落木萧萧下，不尽长江滚滚来。',
                pinyin: 'fēng jí tiān gāo yuán xiào āi, zhǔ qīng shā bái niǎo fēi huí. wú biān luò mù xiāo xiāo xià, bù jìn cháng jiāng gǔn gǔn lái.'
            },
            { 
                title: '月下独酌', 
                author: '李白', 
                content: '花间一壶酒，独酌无相亲。举杯邀明月，对影成三人。',
                pinyin: 'huā jiān yī hú jiǔ, dú zhuó wú xiāng qīn. jǔ bēi yāo míng yuè, duì yǐng chéng sān rén.'
            },
            { 
                title: '黄鹤楼送孟浩然之广陵', 
                author: '李白', 
                content: '故人西辞黄鹤楼，烟花三月下扬州。孤帆远影碧空尽，唯见长江天际流。',
                pinyin: 'gù rén xī cí huáng hè lóu, yān huā sān yuè xià yáng zhōu. gū fān yuǎn yǐng bì kōng jìn, wéi jiàn cháng jiāng tiān jì liú.'
            }
        ];
        return poems;
    }
    
    init() {
        document.getElementById('classic-mode-btn').addEventListener('click', () => this.showScreen('classic'));
        document.getElementById('standard-mode-btn').addEventListener('click', () => this.showScreen('standard'));
        document.getElementById('poetry-mode-btn').addEventListener('click', () => this.showScreen('poetry'));
        
        document.getElementById('classic-start-btn').addEventListener('click', () => this.startClassicGame());
        document.getElementById('classic-back-btn').addEventListener('click', () => this.showScreen('main'));
        document.getElementById('standard-back-btn').addEventListener('click', () => this.showScreen('main'));
        document.getElementById('poetry-back-btn').addEventListener('click', () => this.showScreen('main'));
        document.getElementById('game-back-btn').addEventListener('click', () => this.showScreen('main'));
        
        document.querySelectorAll('.start-directly').forEach(btn => {
            btn.addEventListener('click', (e) => this.startStandardGame(e));
        });
        
        this.restartBtn.addEventListener('click', () => this.restartGame());
        
        document.getElementById('modal-restart-btn').addEventListener('click', () => {
            document.getElementById('result-modal').style.display = 'none';
            this.restartGame();
        });
        
        document.getElementById('modal-back-btn').addEventListener('click', () => {
            document.getElementById('result-modal').style.display = 'none';
            this.showScreen('main');
        });
        
        document.getElementById('modal-next-btn').addEventListener('click', () => {
            document.getElementById('result-modal').style.display = 'none';
            if (this.mode === 'standard') {
                this.gridSize++;
                this.startGame();
            } else if (this.mode === 'poetry') {
                this.startPoetryGame(this.currentPoetryIndex + 1);
            }
        });
        
        document.getElementById('result-modal').addEventListener('click', (e) => {
            if (e.target.id === 'result-modal') {
                document.getElementById('result-modal').style.display = 'none';
                this.showScreen('main');
            }
        });
        
        this.renderPoetryList();
    }
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.style.display = 'none');
        this.screens[screenName].style.display = 'block';
        
        if (screenName === 'main') {
            this.stopGame();
        }
    }
    
    startClassicGame() {
        this.mode = 'classic';
        this.gridSize = 5;
        this.startGame();
    }
    
    startStandardGame(e) {
        const size = parseInt(e.target.dataset.size);
        this.mode = 'standard';
        this.gridSize = size;
        this.startGame();
    }
    
    renderPoetryList() {
        this.poetryList.innerHTML = '';
        this.poems.forEach((poem, index) => {
            const item = document.createElement('div');
            item.className = 'poetry-item';
            item.innerHTML = `
                <div class="poetry-item-title">${poem.title}</div>
                <div class="poetry-item-author">作者：${poem.author}</div>
                <div class="poetry-item-content">${poem.content}</div>
            `;
            item.addEventListener('click', () => this.startPoetryGame(index));
            this.poetryList.appendChild(item);
        });
    }
    
    startPoetryGame(index) {
        this.mode = 'poetry';
        this.currentPoetryIndex = index;
        this.currentPoetry = this.poems[index];
        
        const chars = this.currentPoetry.content.split('').filter(char => 
            char !== '，' && char !== '。' && char !== '、' && char !== '？' && char !== '！' && char.trim() !== ''
        );
        
        const charCount = chars.length;
        const gridWidth = Math.ceil(Math.sqrt(charCount * 1.5));
        this.gridSize = Math.max(3, Math.min(9, gridWidth));
        
        this.startGame();
    }
    
    startGame() {
        this.resetGame();
        this.generateItems();
        this.renderBoard();
        
        if (this.mode === 'poetry') {
            this.poetryDisplay.style.display = 'block';
            this.displayPoetry();
            this.updatePoetryDisplay();
        } else {
            this.poetryDisplay.style.display = 'none';
        }
        
        this.showScreen('game');
        this.gameActive = true;
        this.startTime = Date.now();
        this.timer = setInterval(() => this.updateTimer(), 10);
    }
    
    resetGame() {
        this.currentTarget = 1;
        this.targetNumberDisplay.textContent = '1';
        this.timerDisplay.textContent = '0.00';
        this.gameBoard.innerHTML = '';
        this.gameBoard.className = 'game-board';
        this.gameBoard.classList.remove('poetry-mode');
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    stopGame() {
        this.gameActive = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    restartGame() {
        this.stopGame();
        this.startGame();
    }
    
    generateItems() {
        this.items = [];
        const totalItems = this.gridSize * this.gridSize;
        
        if (this.mode === 'poetry') {
            const chars = this.currentPoetry.content.split('').filter(char => 
                char !== '，' && char !== '。' && char !== '、' && char !== '？' && char !== '！' && char.trim() !== ''
            );
            
            for (let i = 0; i < chars.length; i++) {
                this.items.push({
                    value: chars[i],
                    order: i + 1
                });
            }
        } else {
            for (let i = 1; i <= totalItems; i++) {
                this.items.push(i);
            }
        }
        
        this.shuffleArray(this.items);
    }
    
    displayPoetry() {
        const chars = this.currentPoetry.content.split('');
        const pinyinChars = this.currentPoetry.pinyin.replace(/[，。？！、]/g, '').split(' ');
        
        let line1 = '';
        let line2 = '';
        let currentLine = 1;
        let charIndex = 0;
        let pinyinIndex = 0;
        
        chars.forEach((char) => {
            if (['，', '。', '、', '？', '！'].includes(char)) {
                if (currentLine === 1) {
                    line1 += `<span class="poetry-punct">${char}</span>`;
                } else {
                    line2 += `<span class="poetry-punct">${char}</span>`;
                }
            } else if (char.trim() !== '') {
                currentLine = charIndex < 10 ? 1 : 2;
                
                const pinyin = pinyinChars[pinyinIndex] || '';
                const charHtml = `<div class="poetry-char-wrapper" data-order="${charIndex + 1}">
                                    <span class="poetry-pinyin">${pinyin}</span>
                                    <span class="poetry-char">${char}</span>
                                 </div>`;
                
                if (currentLine === 1) {
                    line1 += charHtml;
                } else {
                    line2 += charHtml;
                }
                
                pinyinIndex++;
                charIndex++;
            }
        });
        
        const html = `<div class="poetry-line">${line1}</div><div class="poetry-line">${line2}</div>`;
        
        this.poetryTitle.innerHTML = `<div class="poetry-title-text">${this.currentPoetry.title}</div>
                                     <div class="poetry-author">${this.currentPoetry.author}</div>`;
        this.poetryContent.innerHTML = html;
    }
    
    updatePoetryDisplay() {
        const poetryChars = this.poetryContent.querySelectorAll('.poetry-char-wrapper');
        
        poetryChars.forEach(charWrapper => {
            const order = parseInt(charWrapper.dataset.order);
            
            if (order < this.currentTarget) {
                charWrapper.classList.add('found');
                charWrapper.classList.remove('current');
            } else if (order === this.currentTarget) {
                charWrapper.classList.add('current');
                charWrapper.classList.remove('found');
            } else {
                charWrapper.classList.remove('found', 'current');
            }
        });
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    renderBoard() {
        this.gameBoard.classList.add(`grid-${this.gridSize}`);
        
        if (this.mode === 'poetry') {
            this.gameBoard.classList.add('poetry-mode');
        }
        
        this.items.forEach((item, index) => {
            const cell = document.createElement('button');
            cell.className = 'cell';
            
            if (this.mode === 'poetry') {
                cell.textContent = item.value;
                cell.dataset.order = item.order;
            } else {
                cell.textContent = item;
                cell.dataset.number = item;
            }
            
            cell.addEventListener('click', (e) => this.handleCellClick(e));
            this.gameBoard.appendChild(cell);
        });
    }
    
    handleCellClick(event) {
        if (!this.gameActive) return;
        
        const cell = event.target;
        let clickedValue;
        
        if (this.mode === 'poetry') {
            clickedValue = parseInt(cell.dataset.order);
        } else {
            clickedValue = parseInt(cell.dataset.number);
        }
        
        const totalItems = this.items.length;
        
        if (clickedValue === this.currentTarget) {
            cell.classList.add('correct');
            cell.disabled = true;
            
            if (this.mode === 'poetry') {
                this.updatePoetryDisplay();
            }
            
            if (this.currentTarget === totalItems) {
                this.endGame();
            } else {
                this.currentTarget++;
                this.targetNumberDisplay.textContent = this.currentTarget;
            }
        } else {
            cell.classList.add('wrong');
            setTimeout(() => {
                cell.classList.remove('wrong');
            }, 300);
        }
    }
    
    updateTimer() {
        const elapsed = Date.now() - this.startTime;
        this.timerDisplay.textContent = (elapsed / 1000).toFixed(2);
    }
    
    endGame() {
        this.gameActive = false;
        clearInterval(this.timer);
        const finalTime = this.timerDisplay.textContent;
        const finalTimeNum = parseFloat(finalTime);
        
        let info = '';
        let hasNext = false;
        let gameKey = '';
        
        if (this.mode === 'standard') {
            info = `标准模式 ${this.gridSize}×${this.gridSize}`;
            gameKey = `standard_${this.gridSize}`;
            if (this.gridSize < 9) {
                hasNext = true;
            }
        } else if (this.mode === 'classic') {
            info = `经典模式 ${this.gridSize}×${this.gridSize}`;
            gameKey = `classic_${this.gridSize}`;
        } else if (this.mode === 'poetry') {
            info = `《${this.currentPoetry.title}》\n${this.currentPoetry.author}`;
            gameKey = `poetry_${this.currentPoetryIndex}`;
            if (this.currentPoetryIndex < this.poems.length - 1) {
                hasNext = true;
            }
        }
        
        document.getElementById('result-info').innerHTML = info;
        document.getElementById('result-time').textContent = `用时：${finalTime} 秒`;
        
        this.saveAndCompareResult(gameKey, finalTimeNum);
        
        document.getElementById('modal-next-btn').style.display = hasNext ? 'block' : 'none';
        document.getElementById('result-modal').style.display = 'flex';
    }
    
    saveAndCompareResult(gameKey, currentTime) {
        const lastResult = localStorage.getItem(gameKey);
        const comparisonDiv = document.getElementById('result-comparison');
        const lastResultP = document.getElementById('last-result');
        
        if (lastResult) {
            const lastTime = parseFloat(lastResult);
            const diff = lastTime - currentTime;
            
            comparisonDiv.style.display = 'block';
            
            if (diff > 0) {
                lastResultP.innerHTML = `<span class="last-time">上次用时：${lastTime.toFixed(2)} 秒</span><br>
                    <span class="time-change faster">快 ${diff.toFixed(2)} 秒</span>`;
            } else if (diff < 0) {
                lastResultP.innerHTML = `<span class="last-time">上次用时：${lastTime.toFixed(2)} 秒</span><br>
                    <span class="time-change slower">慢 ${(-diff).toFixed(2)} 秒</span>`;
            } else {
                lastResultP.innerHTML = `<span class="last-time">上次用时：${lastTime.toFixed(2)} 秒</span><br>
                    <span class="time-change same">用时相同！</span>`;
            }
        } else {
            comparisonDiv.style.display = 'none';
        }
        
        localStorage.setItem(gameKey, currentTime.toString());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SchulteGame();
});