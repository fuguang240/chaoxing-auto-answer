// 学习通全自动答题插件 v2.1
// 支持单选题 + 多选题
// 全自动流程：读题 → 智能匹配答案 → 自动确认 → 批量填写 → 自动保存

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch(request.action) {
    case 'getQuestionCount':
      sendResponse({count: getQuestionCount()});
      break;

    case 'fillAnswers':
      fillAnswers(request.answers).then(filled => {
        sendResponse({success: true, filled: filled});
      });
      return true;

    case 'autoAnswer':
      autoAnswer().then(result => sendResponse(result));
      return true;

    case 'saveWork':
      saveWork().then(success => sendResponse({success: success}));
      return true;

    case 'submitWork':
      submitWork().then(success => sendResponse({success: success}));
      return true;
  }
});

// ========== 全自动答题主流程 ==========
async function autoAnswer() {
  console.log('[全自动答题] 开始...');

  // 1. 自动读题
  const questions = readAllQuestions();
  console.log('[全自动答题] 共读取 ' + questions.length + ' 道题');

  // 2. 自动匹配答案
  let answered = 0;
  for (let q of questions) {
    const answer = matchAnswer(q.stem, q.options, q.type);
    if (answer && answer.length > 0) {
      clickOptions(q.id, answer);
      answered++;
      await sleep(100);
    }
  }
  console.log('[全自动答题] 自动匹配完成，已答 ' + answered + '/' + questions.length + ' 题');

  // 3. 自动确认
  await sleep(500);

  // 4. 自动保存
  await saveWork();
  console.log('[全自动答题] 已自动保存');

  return {
    success: true,
    total: questions.length,
    answered: answered
  };
}

// ========== 自动读题引擎 ==========
function readAllQuestions() {
  const questions = [];
  const spans = document.querySelectorAll('span[class*="num_option"]');
  const idMap = {};

  // 按题目ID分组
  spans.forEach(span => {
    const match = span.className.match(/choice(\d+)/);
    if (match) {
      const qid = match[1];
      if (!idMap[qid]) idMap[qid] = [];
      idMap[qid].push(span);
    }
  });

  // 按顺序处理
  const qids = Object.keys(idMap).sort((a, b) => parseInt(a) - parseInt(b));

  qids.forEach((qid, idx) => {
    const optionSpans = idMap[qid];
    const options = [];
    let stem = '';
    let type = 'single'; // 默认单选题

    // 获取选项文本
    optionSpans.forEach((span, optIdx) => {
      const row = span.closest('.answerBg');
      if (row) {
        const text = row.textContent.trim().replace(/^[ABCD]\s*/, '').trim();
        options.push({
          letter: String.fromCharCode(65 + optIdx),
          text: text
        });
      }
    });

    // 获取题干和题型
    if (optionSpans.length > 0) {
      let container = optionSpans[0].closest('.TiMu, .question, [class*="stem"], [class*="work"]');
      if (container) {
        stem = container.textContent.trim().substring(0, 300);
        // 判断题型
        if (stem.includes('多选') || stem.includes('不定项') || stem.includes('多选）')) {
          type = 'multiple';
        }
      }
    }

    questions.push({
      id: qid,
      stem: stem,
      options: options,
      type: type,
      index: idx
    });
  });

  return questions;
}

// ========== 智能答案匹配引擎 ==========
function matchAnswer(stem, options, type) {
  // 规则库：关键词 → 答案
  const rules = [
    // === 遗传算法 - 单选 ===
    {k: ['图灵测试'], a: ['C']},
    {k: ['符号主义', '符号系统'], a: ['B']},
    {k: ['连接主义', '人工神经网络'], a: ['C']},
    {k: ['神经元之间的连接强度'], a: ['B']},
    {k: ['适应度函数', '衡量'], a: ['B']},
    {k: ['交叉操作', '组合父代'], a: ['B']},
    {k: ['变异操作', '保持种群多样性'], a: ['A']},
    {k: ['选择操作', '分配繁殖'], a: ['B']},
    {k: ['轮盘赌选择概率'], a: ['A']},

    // === 搜索算法 - 单选 ===
    {k: ['BFS', '宽度优先', '最短路径'], a: ['A']},
    {k: ['BFS', '距离从近到远'], a: ['C']},
    {k: ['UCS', '按代价扩展'], a: ['B']},
    {k: ['DLS', '深度已知'], a: ['C']},
    {k: ['盲目搜索', '没有启发信息'], a: ['B']},
    {k: ['A算法', 'g(n) + h(n)'], a: ['C']},
    {k: ['h(n)', '小于等于', '不高估'], a: ['B']},
    {k: ['网格地图', '曼哈顿距离'], a: ['B']},
    {k: ['任意方向', '欧几里得距离'], a: ['B']},

    // === 蚁群算法 - 单选 ===
    {k: ['蚁群', '正反馈'], a: ['C']},
    {k: ['信息素浓度', '可见度'], a: ['B']},
    {k: ['信息素挥发', '平衡探索'], a: ['A']},
    {k: ['蒸发', '防止过度依赖'], a: ['B']},
    {k: ['信息素的蒸发和随机选择'], a: ['C']},
    {k: ['蚁周', '全局更新'], a: ['C']},
    {k: ['蚁周模型', '全局范围'], a: ['B']},

    // === 粒子群算法 - 单选 ===
    {k: ['粒子群', '自己的经验', '全局最优'], a: ['B']},
    {k: ['位置表示当前解', '速度表示变化'], a: ['A']},
    {k: ['全局最优解调整速度'], a: ['C']},
    {k: ['惯性权重', '平衡全局搜索'], a: ['B']},
    {k: ['w较大', '跳出局部最优'], a: ['B']},
    {k: ['c1和c2过大', '不稳定'], a: ['B']},
    {k: ['频繁跳出', 'w过大'], a: ['A']},
    {k: ['c1大于c2', '依赖自身'], a: ['A']},
    {k: ['PSO', '收敛速度更快'], a: ['C']},
    {k: ['车辆调度', '离散', '遗传算法'], a: ['A']},
    {k: ['机器人路径规划', '连续', '粒子群'], a: ['B']},

    // === 神经网络/深度学习 - 单选 ===
    {k: ['卷积核', '提取', '局部特征'], a: ['B']},
    {k: ['ReLU', '避免梯度消失'], a: ['B']},
    {k: ['Sigmoid', '输出范围小'], a: ['B']},
    {k: ['池化', '减少计算量'], a: ['A']},
    {k: ['最大池化', '平均池化'], a: ['A']},
    {k: ['卷积核越大', '更全局特征'], a: ['C']},
    {k: ['多种卷积核', '不同特征'], a: ['B']},
    {k: ['调整权重和偏置'], a: ['C']},
    {k: ['非线性激活', '复杂非线性关系'], a: ['C']},
    {k: ['递归网络', '环路', '反馈'], a: ['C']},
    {k: ['序列数据', '递归网络'], a: ['B']},
    {k: ['前馈网络', '层次结构'], a: ['B']},
    {k: ['前馈', '静态数据', '递归', '序列'], a: ['B']},
    {k: ['图像分类', '前馈', '训练稳定'], a: ['C']},
    {k: ['Transformer', '自注意力', '并行'], a: ['C']},
    {k: ['感知机', '线性可分', '超平面'], a: ['C']},
    {k: ['BP算法', '调整权重', '最小化误差'], a: ['B']},
    {k: ['损失函数', '测量', '差距'], a: ['B']},
    {k: ['梯度下降', '优化', '最小误差'], a: ['C']},
    {k: ['深度神经', '多层次表示'], a: ['B']},
    {k: ['ReLU', '计算简单', '加速训练'], a: ['C']},
    {k: ['梯度消失', '层数增加', '梯度趋零'], a: ['B']},
    {k: ['Sigmoid', '隐藏层', '大输入', '梯度小'], a: ['B']},

    // === 逻辑推理 - 单选 ===
    {k: ['子句', '析取公式'], a: ['B']},
    {k: ['消解', '不可满足'], a: ['C']},
    {k: ['消解前提', '互补文字'], a: ['B']},
    {k: ['空子句', '不可满足'], a: ['D']},
    {k: ['消解反演', '反证法'], a: ['C']},

    // === 多选题规则 ===
    {k: ['遗传算法', '基本要素', '组成'], a: ['A', 'B', 'C', 'D']}, // 通常全选
    {k: ['蚁群算法', '特点', '特征'], a: ['A', 'B', 'C']},
    {k: ['粒子群算法', '参数', '组成'], a: ['A', 'B', 'C']},
    {k: ['神经网络', '激活函数', '哪些'], a: ['A', 'B', 'C']},
    {k: ['深度学习', '优化算法'], a: ['A', 'B', 'C', 'D']},
  ];

  // 匹配规则
  for (let rule of rules) {
    let matchCount = 0;
    for (let kw of rule.k) {
      if (stem.includes(kw)) matchCount++;
    }
    if (matchCount >= Math.ceil(rule.k.length * 0.5)) {
      return rule.a;
    }
  }

  // === 智能推断兜底 ===
  if (type === 'multiple' && options.length >= 4) {
    // 多选题：通常选2-3个最全面的选项
    // 选最长的前2-3个
    const sorted = [...options].sort((a, b) => b.text.length - a.text.length);
    const pickCount = Math.min(3, sorted.length - 1);
    return sorted.slice(0, pickCount).map(o => o.letter);
  } else {
    // 单选题：选最长的选项
    if (options.length >= 3) {
      let longestIdx = 0;
      let longestLen = 0;
      options.forEach((opt, idx) => {
        if (opt.text.length > longestLen) {
          longestLen = opt.text.length;
          longestIdx = idx;
        }
      });
      return [String.fromCharCode(65 + longestIdx)];
    }
  }

  return [];
}

// ========== 精准点击选项 ==========
function clickOption(qid, letter) {
  const optIndex = letter.charCodeAt(0) - 65;
  const spans = document.querySelectorAll('.choice' + qid);
  if (spans.length > optIndex) {
    spans[optIndex].click();
    return true;
  }
  return false;
}

// 点击多个选项（多选题用）
function clickOptions(qid, letters) {
  for (let letter of letters) {
    clickOption(qid, letter);
  }
}

// ========== 基础工具函数 ==========
function getQuestionCount() {
  const spans = document.querySelectorAll('span[class*="num_option"]');
  const ids = new Set();
  spans.forEach(span => {
    const match = span.className.match(/choice(\d+)/);
    if (match) ids.add(match[1]);
  });
  return ids.size;
}

async function fillAnswers(answers) {
  const questionIds = getSortedQuestionIds();
  let filled = 0;
  for (let i = 0; i < Math.min(answers.length, questionIds.length); i++) {
    const qid = questionIds[i];
    const optIndex = 'ABCD'.indexOf(answers[i].toUpperCase());
    if (optIndex === -1) continue;
    const spans = document.querySelectorAll('.choice' + qid);
    if (spans.length > optIndex) {
      spans[optIndex].click();
      filled++;
      await sleep(50);
    }
  }
  return filled;
}

function getSortedQuestionIds() {
  const spans = document.querySelectorAll('span[class*="num_option"]');
  const idSet = new Set();
  spans.forEach(span => {
    const match = span.className.match(/choice(\d+)/);
    if (match) idSet.add(match[1]);
  });
  return Array.from(idSet).sort((a, b) => parseInt(a) - parseInt(b));
}

async function saveWork() {
  const allElements = document.querySelectorAll('a, button');
  for (let el of allElements) {
    if (el.textContent.trim() === '暂时保存' && el.tagName === 'A') {
      el.click();
      await sleep(2000);
      return true;
    }
  }
  return false;
}

async function submitWork() {
  const allElements = document.querySelectorAll('a, button');
  for (let el of allElements) {
    if (el.textContent.trim() === '提交' && el.tagName === 'A') {
      el.click();
      await sleep(2000);
      return true;
    }
  }
  return false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('[全自动答题插件 v2.1] 已加载 - 支持单选+多选');
