document.addEventListener('DOMContentLoaded', function() {
    const answerInput = document.getElementById('answerInput');
    const btnParse = document.getElementById('btnParse');
    const btnSave = document.getElementById('btnSave');
    const btnSubmit = document.getElementById('btnSubmit');
    const status = document.getElementById('status');

                            function showStatus(msg, type) {
                                  status.textContent = msg;
                                  status.className = 'status show ' + type;
                                  setTimeout(() => status.className = 'status', 3000);
                            }

                            btnParse.addEventListener('click', function() {
                                  const lines = answerInput.value.split('\n').map(l => l.trim().toUpperCase()).filter(l => l);
                                  if (lines.length === 0) {
                                          showStatus('请先填写答案！', 'error');
                                          return;
                                  }
                                  showStatus('正在填写答案...', '');
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
                                  showStatus('正在保存...', '');
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
                                  showStatus('正在提交...', '');
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
