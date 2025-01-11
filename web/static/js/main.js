// 语言配置
const translations = {
    zh: {
        title: 'Handwriting Generator',
        placeholder: '添加样式图片并输入文字，让AI为您生成优美的手写文字',
        inputPlaceholder: '在此输入要转换的文字...',
        generateButton: '开始生成',
        generating: '生成中',
        uploadText: '点击或拖拽上传图片',
        styleImage: '样式图片',
        inputStyleText: '输入此样式图片对应的文字...',
        saveButton: '保存',
        discardButton: '丢弃',
        stylesTab: '样式管理',
        historyTab: '生成历史',
        artifyPlaceholder: '在此输入提示词...',
        artifyButton: '处理',
        processing: '处理中',
        errorText: '处理失败，请重试',
        noTextError: '请输入要转换的文字！',
        uploadError: '请上传图片文件！',
        saveError: '保存失败，请重试',
        loadError: '加载失败，请重试',
        previewImage: '预览图片',
        addStyle: '添加样式'
    },
    en: {
        title: 'Handwriting Generator',
        placeholder: 'Add style images and input text, let AI generate beautiful handwriting for you',
        inputPlaceholder: 'Enter text to convert...',
        generateButton: 'Generate',
        generating: 'Generating',
        uploadText: 'Click or drag to upload image',
        styleImage: 'Style Image',
        inputStyleText: 'Enter text for this style image...',
        saveButton: 'Save',
        discardButton: 'Discard',
        stylesTab: 'Styles',
        historyTab: 'History',
        artifyPlaceholder: 'Enter prompt here...',
        artifyButton: 'Process',
        processing: 'Processing',
        errorText: 'Processing failed, please try again',
        noTextError: 'Please enter text to convert!',
        uploadError: 'Please upload an image file!',
        saveError: 'Save failed, please try again',
        loadError: 'Load failed, please try again',
        previewImage: 'Preview Image',
        addStyle: 'Add Style'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const addPairButton = document.getElementById('add-pair');
    const imageTextPairs = document.getElementById('image-text-pairs');
    const generateBtn = document.getElementById('generate-btn');
    const finalImage = document.getElementById('final-image');
    const placeholderContent = document.getElementById('placeholder-content');
    const wordImagesContainer = document.getElementById('word-images-container');
    const finalImageContainer = document.getElementById('final-image-container');
    const textInput = document.getElementById('text-input');
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    let pairCounter = 0;
    let currentLang = localStorage.getItem('lang') || 'zh'; // 从本地存储获取语言设置，默认中文

    // 添加语言切换按钮
    const header = document.querySelector('.header');
    const langToggle = document.createElement('button');
    langToggle.className = 'lang-toggle';
    langToggle.innerHTML = '<i class="material-icons">language</i>';
    langToggle.title = '切换语言 / Switch Language';
    header.appendChild(langToggle);

    // 语言切换事件
    langToggle.addEventListener('click', () => {
        currentLang = currentLang === 'zh' ? 'en' : 'zh';
        localStorage.setItem('lang', currentLang); // 保存语言设置到本地存储
        updateLanguage();
    });

    // 更新页面上的文本
    function updateLanguage() {
        const t = translations[currentLang];

        // 更新标题
        document.querySelector('h1').textContent = t.title;

        // 更新添加样式按钮文本
        const addPairBtn = document.getElementById('add-pair');
        if (addPairBtn) {
            addPairBtn.querySelector('.button-text').textContent = t.addStyle;
        }

        // 更新占位符文本
        const placeholderText = document.querySelector('.placeholder-content p');
        if (placeholderText) {
            placeholderText.textContent = t.placeholder;
        }

        // 更新输入框占位符
        if (textInput) {
            textInput.placeholder = t.inputPlaceholder;
        }

        // 更新生成按钮文本
        if (generateBtn && !generateBtn.disabled) {
            generateBtn.innerHTML = `<span class="button-text">${t.generateButton}</span><i class="material-icons">auto_awesome</i>`;
        }

        // 更新标签文本
        const stylesTabEl = document.getElementById('styles-tab');
        const historyTabEl = document.getElementById('history-tab');
        if (stylesTabEl) {
            stylesTabEl.querySelector('.button-text').textContent = t.stylesTab;
        }
        if (historyTabEl) {
            historyTabEl.querySelector('.button-text').textContent = t.historyTab;
        }

        // 更新所有样式图片对的文本
        document.querySelectorAll('.image-text-pair').forEach((pair, index) => {
            const titleEl = pair.querySelector('.pair-title');
            const uploadContent = pair.querySelector('.pair-upload-content p');
            const textArea = pair.querySelector('.pair-text');

            if (titleEl) {
                titleEl.textContent = `${t.styleImage} ${index + 1}`;
            }
            if (uploadContent) {
                uploadContent.textContent = t.uploadText;
            }
            if (textArea) {
                textArea.placeholder = t.inputStyleText;
            }
        });

        // 更新所有艺术化处理面板的文本
        const artifyPanel = document.querySelector('.artify-panel');
        if (artifyPanel) {
            const input = artifyPanel.querySelector('.artify-input');
            const button = artifyPanel.querySelector('.artify-button');

            if (input) {
                input.placeholder = t.artifyPlaceholder;
            }
            if (button && !button.disabled) {
                button.innerHTML = `<i class="material-icons">auto_fix_high</i><span>${t.artifyButton}</span>`;
            }
        }
    }

    // 初始化语言
    updateLanguage();

    // 页面加载时加载样式列表
    loadStyles();

    // 加载用户的样式图片
    async function loadStyles() {
        const t = translations[currentLang];  // 获取当前语言的翻译
        try {
            const response = await fetch('/get_styles');
            if (!response.ok) {
                throw new Error(t.loadError);
            }

            const data = await response.json();

            // 清空现有的图片对
            imageTextPairs.innerHTML = '';
            pairCounter = 0;

            // 添加每个样式图片
            data.styles.forEach(style => {
                pairCounter = Math.max(pairCounter, style.index + 1);
                const pairElement = document.createElement('div');
                pairElement.className = 'image-text-pair';
                pairElement.id = `pair-${style.index}`;
                pairElement.dataset.index = style.index;
                pairElement.dataset.styleId = style.id;  // 保存样式ID

                pairElement.innerHTML = `
                    <div class="pair-header">
                        <h3 class="pair-title">${t.styleImage} ${style.index + 1}</h3>
                        <button class="delete-button" data-pair-id="pair-${style.index}">
                            <i class="material-icons">delete</i>
                        </button>
                    </div>
                    <div class="pair-upload">
                        <input type="file" id="pair-${style.index}-file" accept="image/*" style="display: none;">
                        <div class="pair-upload-content" style="display: none;">
                            <i class="material-icons">cloud_upload</i>
                            <p>${t.uploadText}</p>
                        </div>
                        <img class="preview-image visible" src="${style.image}" alt="${t.styleImage}">
                    </div>
                    <textarea class="pair-text" placeholder="${t.inputStyleText}">${style.text || ''}</textarea>
                `;

                imageTextPairs.appendChild(pairElement);
                setupPairEventListeners(pairElement);
            });
        } catch (error) {
            console.error('Error:', error);
            alert(t.loadError);
        }
    }

    // 设置图片对的事件监听器
    function setupPairEventListeners(pairElement) {
        const deleteButton = pairElement.querySelector('.delete-button');
        const fileInput = pairElement.querySelector('input[type="file"]');
        const uploadArea = pairElement.querySelector('.pair-upload');
        const previewImage = pairElement.querySelector('.preview-image');
        const uploadContent = pairElement.querySelector('.pair-upload-content');
        const textInput = pairElement.querySelector('.pair-text');

        // 设置删除按钮事件
        deleteButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            const pairId = e.currentTarget.dataset.pairId;
            const pairElement = document.getElementById(pairId);
            const styleId = pairElement.dataset.styleId;

            // 如果是临时 ID，直接删除元素
            if (styleId.startsWith('temp-')) {
                pairElement.remove();
                updatePairNumbers();
                return;
            }

            try {
                const response = await fetch('/delete_style', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: styleId
                    })
                });

                if (!response.ok) {
                    throw new Error('删除失败');
                }

                // 删除成功后重新加载样式列表
                loadStyles();
            } catch (error) {
                console.error('Error:', error);
                alert('删除失败，请重试');
            }
        });

        // 处理文件选择
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handleImageUpload(e.target.files[0], previewImage, uploadContent, pairElement);
            }
        });

        // 处理文字输入变化
        textInput.addEventListener('change', async () => {
            const text = textInput.value.trim();
            const styleId = pairElement.dataset.styleId;

            if (styleId) {
                try {
                    const response = await fetch('/update_style_text', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            id: styleId,
                            text: text
                        })
                    });

                    if (!response.ok) {
                        throw new Error('更新失败');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('更新文字失败，请重试');
                }
            }
        });

        // 处理拖拽上传
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary-color)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--border-color)';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border-color)';

            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleImageUpload(e.dataTransfer.files[0], previewImage, uploadContent, pairElement);
            }
        });

        // 点击上传区域时触发文件选择
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
    }

    // 侧边栏切换
    toggleSidebarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('active');
        if (sidebar.classList.contains('active')) {
            loadStyles();  // 当侧边栏打开时加载样式图片
        }
    });

    // 点击侧边栏外部时关闭侧边栏
    document.addEventListener('click', (e) => {
        const isMobile = window.innerWidth <= 768;
        if (sidebar.classList.contains('active') &&
            !sidebar.contains(e.target) &&
            !toggleSidebarBtn.contains(e.target)) {
            // 在移动端点击任何地方都关闭，在桌面端只有点击侧边栏外部时才关闭
            if (isMobile || (!isMobile && !e.target.closest('.sidebar-content'))) {
                sidebar.classList.remove('active');
            }
        }
    });

    // 阻止侧边栏内部点击事件冒泡
    sidebar.addEventListener('click', (e) => {
        if (window.innerWidth > 768) {
            e.stopPropagation();
        }
    });

    // 添加触摸滑动手势支持
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, false);

    document.addEventListener('touchmove', (e) => {
        touchEndX = e.touches[0].clientX;
    }, false);

    document.addEventListener('touchend', () => {
        if (touchStartX - touchEndX > 50) { // 向左滑动
            sidebar.classList.remove('active');
        } else if (touchEndX - touchStartX > 50) { // 向右滑动
            sidebar.classList.add('active');
        }
    }, false);

    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    // Set initial theme based on system preference
    if (prefersDarkScheme.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.querySelector('i').textContent = 'light_mode';
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? '' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        themeToggle.querySelector('i').textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
    });

    // 创建新的样式图片
    function createImageTextPair() {
        const t = translations[currentLang];  // 获取当前语言的翻译
        const pairElement = document.createElement('div');
        pairElement.className = 'image-text-pair';
        pairElement.id = `pair-${pairCounter}`;
        pairElement.dataset.index = pairCounter;
        pairElement.dataset.styleId = `temp-${pairCounter}`;  // 添加临时 ID

        pairElement.innerHTML = `
            <div class="pair-header">
                <h3 class="pair-title">${t.styleImage} ${pairCounter + 1}</h3>
                <button class="delete-button" data-pair-id="pair-${pairCounter}">
                    <i class="material-icons">delete</i>
                </button>
            </div>
            <div class="pair-upload">
                <input type="file" id="pair-${pairCounter}-file" accept="image/*" style="display: none;">
                <div class="pair-upload-content">
                    <i class="material-icons">cloud_upload</i>
                    <p>${t.uploadText}</p>
                </div>
                <img class="preview-image" src="" style="display: none;">
            </div>
            <textarea class="pair-text" placeholder="${t.inputStyleText}"></textarea>
        `;

        imageTextPairs.appendChild(pairElement);
        setupPairEventListeners(pairElement);
        pairCounter++;

        // 更新所有样式图片对的编号
        updatePairNumbers();
    }

    // 更新样式图片对的编号
    function updatePairNumbers() {
        const t = translations[currentLang];
        const pairs = document.querySelectorAll('.image-text-pair');
        pairs.forEach((pair, index) => {
            const title = pair.querySelector('.pair-title');
            title.textContent = `${t.styleImage} ${index + 1}`;
            pair.dataset.index = index;
        });
    }

    // 处理图片上传和预览
    async function handleImageUpload(file, previewImage, uploadContent, pairElement) {
        const t = translations[currentLang];
        if (!file.type.startsWith('image/')) {
            alert(t.uploadError);
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
            uploadContent.style.display = 'none';

            // 获取文字输入
            const textInput = pairElement.querySelector('.pair-text');
            const text = textInput.value.trim();

            // 创建 FormData 对象
            const formData = new FormData();
            formData.append('image', file);
            formData.append('text', text);

            try {
                // 发送到服务器保存
                const response = await fetch('/save_style', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(t.saveError);
                }

                const data = await response.json();

                // 更新元素的 style ID
                if (data.success && data.style) {
                    pairElement.dataset.styleId = data.style.id;
                }
            } catch (error) {
                console.error('Error:', error);
                alert(t.saveError);
                // 清除预览
                previewImage.src = '';
                previewImage.style.display = 'none';
                uploadContent.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }

    // 添加样式图片的点击事件
    addPairButton.addEventListener('click', () => {
        // 清空生成的图片列表
        document.getElementById('generated-images').innerHTML = '';
        // 创建新的样式对
        createImageTextPair();
    });

    // 添加保存和丢弃按钮
    function addSaveDiscardButtons() {
        const t = translations[currentLang];  // 获取当前语言的翻译

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'save-discard-buttons';
        buttonsContainer.innerHTML = `
            <button id="save-btn" class="action-button">
                <i class="material-icons">save</i>
                <span class="button-text">${t.saveButton}</span>
            </button>
            <button id="discard-btn" class="action-button">
                <i class="material-icons">delete</i>
                <span class="button-text">${t.discardButton}</span>
            </button>
        `;

        // 创建或获取 final-image-wrapper
        let wrapper = finalImageContainer.querySelector('.final-image-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'final-image-wrapper';
            // 将现有的 finalImage 移动到 wrapper 中
            if (finalImage.parentNode === finalImageContainer) {
                finalImageContainer.removeChild(finalImage);
            }
            wrapper.appendChild(finalImage);
            finalImageContainer.appendChild(wrapper);
        }

        // 将按钮添加到 wrapper 中
        wrapper.appendChild(buttonsContainer);

        // 保存按钮点击事件
        document.getElementById('save-btn').addEventListener('click', async () => {
            try {
                await fetch('/save_generated', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: finalImage.src
                    })
                });

                // 创建五彩纸屑效果
                createConfetti();

                // 如果历史标签页是激活状态，立即更新历史记录
                const historyContent = document.getElementById('history-content');
                if (historyContent.classList.contains('active')) {
                    loadGeneratedImages();
                }

                // 延迟一会儿再隐藏图片，让用户能看到纸屑效果
                setTimeout(() => {
                    hideGeneratedContent();
                }, 1000);

            } catch (error) {
                console.error('Error:', error);
                alert(t.saveError);
                hideGeneratedContent();
            }
        });

        // 丢弃按钮点击事件
        document.getElementById('discard-btn').addEventListener('click', () => {
            hideGeneratedContent();
        });
    }

    // 隐藏生成的内容
    function hideGeneratedContent() {
        finalImageContainer.hidden = true;
        finalImage.src = '';
        finalImage.classList.remove('visible');
        placeholderContent.hidden = false;
        const buttonsContainer = document.querySelector('.save-discard-buttons');
        if (buttonsContainer) {
            buttonsContainer.remove();
        }
        // 显示文字输入区域
        document.querySelector('.control-panel').style.display = 'flex';
    }

    // 创建五彩纸屑效果
    function createConfetti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        document.body.appendChild(confettiContainer);

        // 创建多个纸屑
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.setProperty('--delay', `${Math.random() * 3}s`);
            confetti.style.setProperty('--rotation', `${Math.random() * 360}deg`);
            confetti.style.setProperty('--x', `${Math.random() * 100}vw`);
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 80%, 60%)`;
            confettiContainer.appendChild(confetti);
        }

        // 动画结束后移除容器
        setTimeout(() => {
            confettiContainer.remove();
        }, 4000);
    }

    // 加载生成的图片
    async function loadGeneratedImages() {
        try {
            const response = await fetch('/get_generated');
            if (!response.ok) {
                throw new Error('加载图片失败');
            }

            const data = await response.json();
            const container = document.getElementById('generated-images');
            container.innerHTML = '';

            data.images.forEach(image => {
                const imgElement = document.createElement('div');
                imgElement.className = 'generated-image';
                imgElement.innerHTML = `
                    <img src="${image.image}" alt="生成的图片">
                    <div class="image-info">
                        <span class="timestamp">${new Date(image.created_at).toLocaleString()}</span>
                    </div>
                `;

                // 添加点击事件监听器，传递图片ID
                const imgNode = imgElement.querySelector('img');
                imgNode.addEventListener('click', () => {
                    showLargeImage(imgNode.src, image.id);
                });

                container.appendChild(imgElement);
            });
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // 显示大图
    function showLargeImage(src, imageId) {
        // 关闭侧边栏
        sidebar.classList.remove('active');

        const t = translations[currentLang];  // 获取当前语言的翻译

        // 创建预览模态框
        const modal = document.createElement('div');
        modal.className = 'preview-modal';
        modal.innerHTML = `
            <div class="preview-content">
                <img src="${src}" alt="${t.previewImage}">
                <div class="preview-buttons">
                    <button class="preview-close">
                        <i class="material-icons">close</i>
                    </button>
                    <button class="preview-delete">
                        <i class="material-icons">delete</i>
                    </button>
                </div>
            </div>
            <div class="artify-panel">
                <input type="text" class="artify-input" placeholder="${t.artifyPlaceholder}">
                <button class="artify-button">
                    <i class="material-icons">auto_fix_high</i>
                    <span>${t.artifyButton}</span>
                </button>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(modal);

        // 获取图片元素和控制面板元素
        const imgElement = modal.querySelector('img');
        const artifyInput = modal.querySelector('.artify-input');
        const artifyButton = modal.querySelector('.artify-button');
        const deleteButton = modal.querySelector('.preview-delete');

        // 处理删除按钮点击事件
        if (imageId) {
            deleteButton.addEventListener('click', async () => {
                try {
                    const response = await fetch('/delete_generated', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            id: imageId
                        })
                    });

                    if (!response.ok) {
                        throw new Error('删除失败');
                    }

                    // 关闭模态框
                    closePreviewModal(modal);
                    // 重新加载历史图片列表
                    loadGeneratedImages();
                } catch (error) {
                    console.error('Error:', error);
                    alert('删除失败，请重试');
                }
            });
        } else {
            // 如果没有imageId（不是历史图片），隐藏删除按钮
            deleteButton.style.display = 'none';
        }

        // 处理按钮点击事件
        artifyButton.addEventListener('click', async () => {
            const textPrompt = artifyInput.value.trim();
            if (!textPrompt) {
                alert('请输入处理提示词！');
                return;
            }

            try {
                artifyButton.disabled = true;
                artifyButton.innerHTML = '<i class="material-icons">hourglass_empty</i><span>处理中</span>';

                const response = await fetch('/artify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: imgElement.src,
                        text_prompt: textPrompt
                    })
                });

                if (!response.ok) {
                    throw new Error('处理失败');
                }

                const data = await response.json();
                imgElement.src = data.image;

            } catch (error) {
                console.error('Error:', error);
                alert('处理失败，请重试');
            } finally {
                artifyButton.disabled = false;
                artifyButton.innerHTML = '<i class="material-icons">auto_fix_high</i><span>处理</span>';
            }
        });

        // 延迟一帧添加active类，触发动画
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        // 点击关闭按钮
        modal.querySelector('.preview-close').addEventListener('click', (e) => {
            e.stopPropagation();
            closePreviewModal(modal);
        });

        // 点击空白处关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePreviewModal(modal);
            }
        });

        // ESC键关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closePreviewModal(modal);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    // 关闭预览模态框
    function closePreviewModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }

    // 处理生成按钮点击事件
    generateBtn.addEventListener('click', async () => {
        const t = translations[currentLang];  // 获取当前语言的翻译

        if (!textInput.value.trim()) {
            alert(t.noTextError);
            return;
        }

        // 禁用生成按钮，显示加载状态
        generateBtn.disabled = true;
        generateBtn.innerHTML = `<i class="material-icons">hourglass_empty</i><span class="button-text">${t.generating}</span>`;
        const progressRing = document.getElementById('progress-ring');
        progressRing.classList.add('active');

        try {
            // 清理之前的内容
            finalImage.classList.remove('visible');
            finalImageContainer.hidden = true;
            finalImage.src = '';
            wordImagesContainer.innerHTML = '';
            placeholderContent.hidden = true;

            const formData = new FormData();
            formData.append('text', textInput.value.trim());

            const response = await fetch('/process', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('处理请求时出错');
            }

            const data = await response.json();

            // 显示单词图片动画
            wordImagesContainer.hidden = false;
            const containerRect = wordImagesContainer.getBoundingClientRect();
            const centerX = containerRect.width / 2;
            const centerY = containerRect.height / 2;

            // 创建并显示单词图片
            const wordImagePromises = data.word_images.map((src, index) => {
                return new Promise(resolve => {
                    const img = document.createElement('img');
                    img.src = src;
                    img.className = 'word-image';
                    img.alt = `生成的单词 ${index + 1}`;

                    const angle = (Math.random() * Math.PI * 2);
                    const distance = Math.min(containerRect.width, containerRect.height) * 0.3;
                    const offsetX = Math.cos(angle) * distance;
                    const offsetY = Math.sin(angle) * distance;
                    const rotation = (Math.random() - 0.5) * 60;

                    img.style.setProperty('--offset-x', `${offsetX}px`);
                    img.style.setProperty('--offset-y', `${offsetY}px`);
                    img.style.setProperty('--rotation', `${rotation}deg`);
                    img.style.left = `${centerX - 80}px`;
                    img.style.top = `${centerY - 40}px`;

                    wordImagesContainer.appendChild(img);

                    setTimeout(() => {
                        img.classList.add('visible');
                        setTimeout(() => {
                            img.classList.add('stacked');
                            resolve();
                        }, 150);
                    }, index * 200);
                });
            });

            // 等待所有单词图片动画完成
            await Promise.all(wordImagePromises);
            await new Promise(resolve => setTimeout(resolve, 500));

            // 爆炸效果
            const wordImages = document.querySelectorAll('.word-image');
            wordImages.forEach(img => img.classList.add('explode'));

            // 等待爆炸动画完成
            await new Promise(resolve => setTimeout(resolve, 1000));
            wordImagesContainer.hidden = true;

            // 显示最终图片
            finalImage.src = data.final_image;
            finalImageContainer.hidden = false;

            // 等待图片加载完成
            await new Promise((resolve) => {
                if (finalImage.complete) {
                    resolve();
                } else {
                    finalImage.onload = resolve;
                }
            });

            // 隐藏文字输入区域
            document.querySelector('.control-panel').style.display = 'none';

            // 显示最终图片和按钮
            finalImage.classList.add('visible');
            addSaveDiscardButtons();

        } catch (error) {
            console.error('Error:', error);
            alert(t.errorText);
            placeholderContent.hidden = false;
        } finally {
            // 恢复生成按钮状态
            generateBtn.disabled = false;
            generateBtn.innerHTML = `<span class="button-text">${t.generateButton}</span><i class="material-icons">auto_awesome</i>`;
            progressRing.classList.remove('active');
        }
    });

    // 标签切换功能
    const stylesTab = document.getElementById('styles-tab');
    const historyTab = document.getElementById('history-tab');
    const stylesContent = document.getElementById('styles-content');
    const historyContent = document.getElementById('history-content');

    stylesTab.addEventListener('click', () => {
        stylesTab.classList.add('active');
        historyTab.classList.remove('active');
        stylesContent.classList.add('active');
        historyContent.classList.remove('active');
        loadStyles();  // 加载样式列表
    });

    historyTab.addEventListener('click', () => {
        historyTab.classList.add('active');
        stylesTab.classList.remove('active');
        historyContent.classList.add('active');
        stylesContent.classList.remove('active');
        loadGeneratedImages();  // 加载历史图片
    });

    // 确保 window.showLargeImage 也可用
    window.showLargeImage = showLargeImage;
});
