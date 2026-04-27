with open("tools/md-editor/templates/index.html", "r", encoding="utf-8") as f:
    text = f.read()

# Modify updateMedia:
media_old = """            // 图片：点击加载
            if (imgPath) {
                if (!imgPath.startsWith('/')) imgPath = '/' + imgPath;
                imgPath = '/media' + imgPath;
                imgEl.innerHTML = `<div class="lazy-media" onclick="loadMedia(this, '${imgPath}', 'img')">📷 点击加载图片</div>`;
            } else {
                imgEl.innerHTML = '-';
            }

            // 视频：点击播放
            if (vidPath) {
                if (!vidPath.startsWith('/')) vidPath = '/' + vidPath;
                vidPath = '/media' + vidPath;
                vidEl.innerHTML = `<div class="lazy-media" onclick="loadMedia(this, '${vidPath}', 'video')">🎬 点击播放视频</div>`;
            } else {
                vidEl.innerHTML = '-';
            }"""
media_new = """            // 图片：直接加载
            if (imgPath) {
                if (!imgPath.startsWith('/')) imgPath = '/' + imgPath;
                imgPath = '/media' + imgPath;
                imgEl.innerHTML = '';
                const img = document.createElement('img');
                img.src = imgPath;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                img.onerror = () => imgEl.innerHTML = '加载失败';
                imgEl.appendChild(img);
            } else {
                imgEl.innerHTML = '-';
            }

            // 视频：保持点击加载，减小服务器压力
            if (vidPath) {
                if (!vidPath.startsWith('/')) vidPath = '/' + vidPath;
                vidPath = '/media' + vidPath;
                vidEl.innerHTML = `<div class="lazy-media" onclick="loadMedia(this, '${vidPath}', 'video')">🎬 点击播放视频</div>`;
            } else {
                vidEl.innerHTML = '-';
            }"""
text = text.replace(media_old, media_new)

# Modify openFile:
open_old = """async function openFile(filePath) {
            if (currentFile === filePath) return; // 防重复
            currentFile = filePath;"""
open_new = """async function openFile(filePath, forceReload = false) {
            if (currentFile === filePath && !forceReload) return; // 防重复
            
            // 如果是重新加载，保持正在编辑所在的模式（表单还是文本）
            const modeForm = document.getElementById('formEditor').style.display === 'flex';
            currentFile = filePath;"""
text = text.replace(open_old, open_new)


# Modfiy openFile switchMode at bottom:
open_bottom_old = """                // 源码编辑器
                document.getElementById('sourceTextarea').value = currentRaw;

                // 显示表单
                switchMode('form');
                document.getElementById('emptyState').style.display = 'none';
                document.getElementById('formEditor').style.display = 'flex';
                document.getElementById('formEditor').style.flexDirection = 'column';"""
open_bottom_new = """                // 源码编辑器
                document.getElementById('sourceTextarea').value = currentRaw;

                // 根据先前的状态或传入的参数，决定显示什么
                if (forceReload) {
                    if (modeForm) {
                        switchMode('form');
                    } else {
                        switchMode('source');
                        // 因为 switchMode('source') 时会覆盖 sourceTextarea，这里必须显式重新赋值
                        document.getElementById('sourceTextarea').value = currentRaw;
                    }
                } else {
                    switchMode('form');
                }
                
                document.getElementById('emptyState').style.display = 'none';
                document.getElementById('formEditor').style.display = 'flex';
                document.getElementById('formEditor').style.flexDirection = 'column';"""
text = text.replace(open_bottom_old, open_bottom_new)


# Modify doSave:
save_old = """                    if (raw_content !== null) {
                        currentRaw = raw_content;
                    } else if (frontmatter_data) {
                        // To properly reflect changes, if user hits save on form repeatedly it should be fine.
                    }
                    editedFiles.add(currentFile);"""
save_new = """                    editedFiles.add(currentFile);
                    await openFile(currentFile, true); // 自动重载最新文件，包含由于yaml format和新字段的变化
"""
text = text.replace(save_old, save_new)

with open("tools/md-editor/templates/index.html", "w", encoding="utf-8") as f:
    f.write(text)
