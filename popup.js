document.addEventListener('DOMContentLoaded', function() {
  const btnAutoStart = document.getElementById('btnAutoStart');
  const btnParse = document.getElementById('btnParse');
  const btnSave = document.getElementById('btnSave');
  const btnSubmit = document.getElementById('btnSubmit');
  const status = document.getElementById('status');
  const totalQ = document.getElementById('totalQ');
  const answeredQ = document.getElementById('answeredQ');

  function showStatus(msg, type) {
    status.textContent = msg;
    status.className = 'status show ' + type;
  }

  function hideStatus() {
    status.className = 'status';
  }

  // 初始化 - 获取题目总数
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'getQuestionCount'}, function(response) {
      if (response && response.count) {
        totalQ.textContent = response.count;
      }
    });
  });

  // ========== 全自动答题 ==========
  btnAutoStart.addEventListener('click', function() {
    if (!confirm('确认开始全自动答题？\n\n插件将自动：\n1. 读取所有题目\n2. 智能匹配答案\n3. 自动填写所有选项\n4. 自动保存\n\n全程无需人工干预！')) {
      return;
    }

    btnAutoStart.disabled = true;
    btnAutoStart.textContent = '⏳ 正在自动答题...';
    showStatus('正在自动读取题目...', 'info');

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'autoAnswer'}, function(response) {
        if (response && response.success) {
          totalQ.textContent = response.total;
          answeredQ.textContent = response.answered;
          showStatus(`✅ 完成！共 ${response.total} 题，已答 ${response.answered} 题，已自动保存`, 'success');
          btnAutoStart.textContent = '✅ 答题完成';
        } else {
          showStatus('❌ 答题失败，请刷新页面重试', 'error');
          btnAutoStart.disabled = false;
          btnAutoStart.textContent = '⚡ 一键全自动开始';
        }
      });
    });
  });

  // ========== 手动模式 ==========
  btnParse.addEventListener('click', function() {
    const lines = document.getElementById('answerInput').value.split('\n').map(l => l.trim().toUpperCase()).filter(l => l);
    if (lines.length === 0) {
      showStatus('请先填写答案！', 'error');
      return;
    }
    showStatus('正在填写...', 'info');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'fillAnswers',
        answers: lines
      }, function(response) {
        if (response && response.success) {
          showStatus('成功填写 ' + response.filled + ' 道题！', 'success');
        } else {
          showStatus('填写失败', 'error');
        }
      });
    });
  });

  btnSave.addEventListener('click', function() {
    showStatus('正在保存...', 'info');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'saveWork'}, function(response) {
        if (response && response.success) {
          showStatus('保存成功！', 'success');
        } else {
          showStatus('保存失败', 'error');
        }
      });
    });
  });

  btnSubmit.addEventListener('click', function() {
    if (!confirm('确定要提交作业吗？提交后无法修改！')) return;
    showStatus('正在提交...', 'info');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'submitWork'}, function(response) {
        if (response && response.success) {
          showStatus('提交成功！', 'success');
        } else {
          showStatus('提交失败', 'error');
        }
      });
    });
  });
});
