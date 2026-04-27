with open("tools/md-editor/templates/index.html", "r", encoding="utf-8") as f:
    text = f.read()

# Add the checkbox styles and HTML
css_old = ".btn-toggle.active { background: var(--accent-color); color: white; border-color: var(--accent-color); }"
css_new = css_old + "\\n        .publish-label { font-size: 12px; display: flex; align-items: center; gap: 4px; cursor: pointer; user-select: none; margin-right: 8px; }"
text = text.replace(css_old, css_new)

html_actions1 = """<div class="editor-actions">
                        <button class="btn btn-toggle active" id="formToggle" onclick="switchMode('form')">📝</button>
                        <button class="btn btn-toggle" id="sourceToggle" onclick="switchMode('source')">📄</button>
                        <button class="btn btn-primary" onclick="saveForm()">💾</button>
                    </div>"""
html_actions1_new = """<div class="editor-actions">
                        <label class="publish-label">
                            <input type="checkbox" id="inputPublish1" checked> 开启发布
                        </label>
                        <button class="btn btn-toggle active" id="formToggle" onclick="switchMode('form')">📝</button>
                        <button class="btn btn-toggle" id="sourceToggle" onclick="switchMode('source')">📄</button>
                        <button class="btn btn-primary" onclick="saveForm()">💾</button>
                    </div>"""
text = text.replace(html_actions1, html_actions1_new)

html_actions2 = """<div class="editor-actions">
                        <button class="btn btn-toggle" id="formToggle2" onclick="switchMode('form')">📝</button>
                        <button class="btn btn-toggle active" id="sourceToggle2" onclick="switchMode('source')">📄</button>
                        <button class="btn btn-primary" onclick="saveSource()">💾</button>
                    </div>"""
html_actions2_new = """<div class="editor-actions">
                        <label class="publish-label">
                            <input type="checkbox" id="inputPublish2" checked> 开启发布
                        </label>
                        <button class="btn btn-toggle" id="formToggle2" onclick="switchMode('form')">📝</button>
                        <button class="btn btn-toggle active" id="sourceToggle2" onclick="switchMode('source')">📄</button>
                        <button class="btn btn-primary" onclick="saveSource()">💾</button>
                    </div>"""
text = text.replace(html_actions2, html_actions2_new)

# Update sync for the two checkboxes
js_sync = """        function switchMode(mode) {
            const formOn = mode === 'form';
            document.getElementById('formEditor').style.display = formOn ? 'flex' : 'none';
            document.getElementById('sourceEditor').classList.toggle('active', !formOn);
            
            document.getElementById('formToggle').classList.toggle('active', formOn);
            document.getElementById('sourceToggle').classList.toggle('active', !formOn);
            document.getElementById('formToggle2').classList.toggle('active', formOn);
            document.getElementById('sourceToggle2').classList.toggle('active', !formOn);
            
            if (!formOn) {
                document.getElementById('sourceTextarea').value = currentRaw;
            }
        }"""
js_sync_new = """        function switchMode(mode) {
            const formOn = mode === 'form';
            document.getElementById('formEditor').style.display = formOn ? 'flex' : 'none';
            document.getElementById('sourceEditor').classList.toggle('active', !formOn);
            
            document.getElementById('formToggle').classList.toggle('active', formOn);
            document.getElementById('sourceToggle').classList.toggle('active', !formOn);
            document.getElementById('formToggle2').classList.toggle('active', formOn);
            document.getElementById('sourceToggle2').classList.toggle('active', !formOn);
            
            if (!formOn) {
                document.getElementById('sourceTextarea').value = currentRaw;
            }
        }

        // Sync checkboxes
        document.addEventListener('DOMContentLoaded', () => {
            const cb1 = document.getElementById('inputPublish1');
            const cb2 = document.getElementById('inputPublish2');
            cb1.addEventListener('change', () => cb2.checked = cb1.checked);
            cb2.addEventListener('change', () => cb1.checked = cb2.checked);
        });"""
text = text.replace(js_sync, js_sync_new)

# Update openFile to set publish state (if draft=true is default, so if not draft => published)
# But since we ONLY load drafts, they ARE drafts. Wait, if the user explicitly opens a published file, it wouldn't exist in the list. Wait, if it is loaded, it is draft. We just default check it to allow them to publish it.
# So "默认勾选，即draft=false". I will just set it to checked.
js_open = """                // 填充表单 - 确保所有字段有值
                document.getElementById('currentFileTitle').textContent = filePath;"""
js_open_new = """                // 填充表单 - 确保所有字段有值
                document.getElementById('inputPublish1').checked = true;
                document.getElementById('inputPublish2').checked = true;
                document.getElementById('currentFileTitle').textContent = filePath;"""
text = text.replace(js_open, js_open_new)

# Update saveForm and saveSource to process draft
js_saveForm = """            newFm.tags = tags;
            newFm.author = author;
            newFm.source_url = sourceUrl;
            
            await doSave(desc, newFm);"""
js_saveForm_new = """            newFm.tags = tags;
            newFm.author = author;
            newFm.source_url = sourceUrl;
            
            if (document.getElementById('inputPublish1').checked) {
                delete newFm.draft; // 变成 publish
                newFm.draft = false; // 稳妥起见
            } else {
                newFm.draft = true;
            }
            
            await doSave(desc, newFm);"""
text = text.replace(js_saveForm, js_saveForm_new)

# For saveSource, it's raw text. We need to modify raw text if publish is checked.
# Just a simple string replace for draft: true -> draft: false
js_saveSource = """            const content = document.getElementById('sourceTextarea').value;
            await doSave(content, null, content);"""
js_saveSource_new = """            let content = document.getElementById('sourceTextarea').value;
            if (document.getElementById('inputPublish2').checked) {
                content = content.replace(/^draft:\s*true/im, 'draft: false');
            } else {
                content = content.replace(/^draft:\s*false/im, 'draft: true');
            }
            await doSave(content, null, content);"""
text = text.replace(js_saveSource, js_saveSource_new)

with open("tools/md-editor/templates/index.html", "w", encoding="utf-8") as f:
    f.write(text)
