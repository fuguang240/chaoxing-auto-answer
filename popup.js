document.addEventListener('DOMContentLoaded', function() {
  const btnAutoStart = document.getElementById('btnAutoStart');
  const btnFillText = document.getElementById('btnFillText');
  const btnSave = document.getElementById('btnSave');
  const btnSubmit = document.getElementById('btnSubmit');
  const status1 = document.getElementById('status1');
  const status2 = document.getElementById('status2');

  function showStatus(el, msg, type) {
    el.textContent = msg;
    el.className = 'status show ' + type;
  }

  // ========== 选择题全自动 ==========
  btnAutoStart.addEventListener('click', function() {
    if (!confirm('确认开始全自动答题？\n\n插件将自动：\n1. 读取所有选择题\n2. 智能匹配答案\n3. 自动填写\n4. 自动保存')) {
      return;
    }

    btnAutoStart.disabled = true;
    btnAutoStart.textContent = '⏳ 正在自动答题...';
    showStatus(status1, '正在自动读取题目...', 'info');

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'autoAnswer'}, function(response) {
        if (response && response.success) {
          showStatus(status1, `✅ 选择题完成：${response.answered}/${response.total} 题，已自动保存`, 'success');
          btnAutoStart.textContent = '✅ 选择题答题完成';
        } else {
          showStatus(status1, '❌ 答题失败', 'error');
          btnAutoStart.disabled = false;
          btnAutoStart.textContent = '⚡ 一键全自动（选择题）';
        }
      });
    });
  });

  // ========== 文字题填写 ==========
  btnFillText.addEventListener('click', function() {
    const text = document.getElementById('textAnswers').value.trim();
    if (!text) {
      showStatus(status2, '请先粘贴文字题答案！', 'error');
      return;
    }

    const answers = text.split('\n').filter(l => l.trim());
    showStatus(status2, '正在填入 ' + answers.length + ' 道文字题...', 'info');

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'fillTextAnswers',
        answers: answers
      }, function(response) {
        if (response && response.success) {
          showStatus(status2, '✅ 成功填入 ' + response.filled + ' 道文字题！', 'success');
        } else {
          showStatus(status2, '填写失败', 'error');
        }
      });
    });
  });

  // ========== 保存/提交 ==========
  btnSave.addEventListener('click', function() {
    showStatus(status1, '正在保存...', 'info');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'saveWork'}, function(response) {
        if (response && response.success) {
          showStatus(status1, '✅ 保存成功！', 'success');
        } else {
          showStatus(status1, '❌ 保存失败', 'error');
        }
      });
    });
  });

  btnSubmit.addEventListener('click', function() {
    if (!confirm('确定要提交作业吗？提交后无法修改！')) return;
    showStatus(status1, '正在提交...', 'info');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'submitWork'}, function(response) {
        if (response && response.success) {
          showStatus(status1, '✅ 提交成功！', 'success');
        } else {
          showStatus(status1, '❌ 提交失败', 'error');
        }
      });
    });
  });
});
