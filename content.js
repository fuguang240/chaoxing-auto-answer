// 学习通自动答题插件 - 内容脚本
// 核心原理：直接点击span选项字母，100%准确

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.action) {
      case 'fillAnswers':
              fillAnswers(request.answers).then(filled => {
                        sendResponse({success: true, filled: filled});
              });
              return true;
      case 'saveWork':
              saveWork().then(success => sendResponse({success: success}));
              return true;
      case 'submitWork':
              submitWork().then(success => sendResponse({success: success}));
              return true;
    }
});

// 批量填写答案 - 核心方法
async function fillAnswers(answers) {
    // 获取所有题目ID，按顺序排列
  const spans = document.querySelectorAll('span[class*="num_option"]');
    const idSet = new Set();
    spans.forEach(span => {
          const match = span.className.match(/choice(\d+)/);
          if (match) idSet.add(match[1]);
    });
    const questionIds = Array.from(idSet).sort((a, b) => parseInt(a) - parseInt(b));

  let filled = 0;
    for (let i = 0; i < Math.min(answers.length, questionIds.length); i++) {
          const qid = questionIds[i];
          const optIndex = 'ABCD'.indexOf(answers[i].toUpperCase());
          if (optIndex === -1) continue;

      // 精准点击span元素 - 这是最高准确率的方式
      const optSpans = document.querySelectorAll('.choice' + qid);
          if (optSpans.length > optIndex) {
                  optSpans[optIndex].click();
                  filled++;
                  await sleep(50); // 小延迟，避免操作过快
          }
    }
    return filled;
}

// 暂时保存
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

// 提交作业
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

console.log('学习通自动答题插件已加载');
