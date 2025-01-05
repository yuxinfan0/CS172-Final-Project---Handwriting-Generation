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

    // 页面加载时加载样式列表
    loadStyles();

    // 加载用户的样式图片
    async function loadStyles() {
        try {
            const response = await fetch('/get_styles');
            if (!response.ok) {
                throw new Error('加载样式图片失败');
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
                        <h3 class="pair-title">样式图片 ${style.index + 1}</h3>
                        <button class="delete-button" data-pair-id="pair-${style.index}">
                            <i class="material-icons">delete</i>
                        </button>
                    </div>
                    <div class="pair-upload">
                        <input type="file" id="pair-${style.index}-file" accept="image/*" style="display: none;">
                        <div class="pair-upload-content" style="display: none;">
                            <i class="material-icons">cloud_upload</i>
                            <p>点击或拖拽上传图片</p>
                        </div>
                        <img class="preview-image visible" src="${style.image}" alt="样式图片">
                    </div>
                    <textarea class="pair-text" placeholder="输入此样式图片对应的文字...">${style.text || ''}</textarea>
                `;

                imageTextPairs.appendChild(pairElement);
                setupPairEventListeners(pairElement);
            });
        } catch (error) {
            console.error('Error:', error);
            alert('加载样式图片失败，请重试');
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
        const pairElement = document.createElement('div');
        pairElement.className = 'image-text-pair';
        pairElement.id = `pair-${pairCounter}`;
        pairElement.dataset.index = pairCounter;

        pairElement.innerHTML = `
            <div class="pair-header">
                <h3 class="pair-title">样式图片 ${pairCounter + 1}</h3>
                <button class="delete-button" data-pair-id="pair-${pairCounter}">
                    <i class="material-icons">delete</i>
                </button>
            </div>
            <div class="pair-upload">
                <input type="file" id="pair-${pairCounter}-file" accept="image/*" style="display: none;">
                <div class="pair-upload-content">
                    <i class="material-icons">cloud_upload</i>
                    <p>点击或拖拽上传图片</p>
                </div>
                <img class="preview-image" id="pair-${pairCounter}-preview">
            </div>
            <textarea class="pair-text" placeholder="输入此样式图片对应的文字..."></textarea>
        `;

        imageTextPairs.appendChild(pairElement);
        setupPairEventListeners(pairElement);
        pairCounter++;
    }

    // 更新样式图片对的编号
    function updatePairNumbers() {
        const pairs = document.querySelectorAll('.image-text-pair');
        pairs.forEach((pair, index) => {
            const title = pair.querySelector('.pair-title');
            title.textContent = `样式图片 ${index + 1}`;
            pair.dataset.index = index + 1;
        });
        pairCounter = pairs.length;
    }

    // 处理图片上传和预览
    async function handleImageUpload(file, previewImage, uploadContent, pairElement) {
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件！');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            previewImage.src = e.target.result;
            uploadContent.style.display = 'none';
            previewImage.classList.add('visible');

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
                    throw new Error('保存失败');
                }

                const data = await response.json();

                // 更新元素的 style ID
                if (data.success && data.style) {
                    pairElement.dataset.styleId = data.style.id;
                }
            } catch (error) {
                console.error('Error:', error);
                alert('保存失败，请重试');
                // 清除预览
                previewImage.src = '';
                previewImage.classList.remove('visible');
                uploadContent.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }

    // 添加样式图片的点击事件
    addPairButton.addEventListener('click', createImageTextPair);

    // 处理生成按钮点击事件
    generateBtn.addEventListener('click', async () => {
        if (!textInput.value.trim()) {
            alert('请输入要转换的文字！');
            return;
        }

        // 清理之前的图片
        finalImage.classList.remove('visible');
        finalImageContainer.hidden = true;
        finalImage.src = '';
        wordImagesContainer.innerHTML = '';

        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="material-icons">hourglass_empty</i><span class="button-text">生成中</span>';
        const progressRing = document.getElementById('progress-ring');
        progressRing.classList.add('active');

        try {
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

            // 隐藏占位内容
            placeholderContent.hidden = true;
            wordImagesContainer.hidden = false;
            wordImagesContainer.innerHTML = '';

            // 计算中心位置
            const containerRect = wordImagesContainer.getBoundingClientRect();
            const centerX = containerRect.width / 2;
            const centerY = containerRect.height / 2;

            // 逐个显示单词图片
            for (let i = 0; i < data.word_images.length; i++) {
                const img = document.createElement('img');
                img.src = data.word_images[i];
                img.className = 'word-image';
                img.alt = `生成的单词 ${i + 1}`;

                // 计算发散的位置
                const angle = (Math.random() * Math.PI * 2);
                const minDistanceX = containerRect.width * 0.3;
                const maxDistanceX = containerRect.width * 0.45;
                const minDistanceY = containerRect.height * 0.2;
                const maxDistanceY = containerRect.height * 0.4;

                const isMoreHorizontal = Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle));
                const distance = isMoreHorizontal
                    ? minDistanceX + Math.random() * (maxDistanceX - minDistanceX)
                    : minDistanceY + Math.random() * (maxDistanceY - minDistanceY);

                const offsetX = Math.cos(angle) * distance;
                const offsetY = Math.sin(angle) * distance;
                const rotation = (Math.random() - 0.5) * 60;

                img.style.setProperty('--offset-x', `${offsetX}px`);
                img.style.setProperty('--offset-y', `${offsetY}px`);
                img.style.setProperty('--rotation', `${rotation}deg`);

                img.style.left = `${centerX - 80}px`;
                img.style.top = `${centerY - 40}px`;

                wordImagesContainer.appendChild(img);

                await new Promise(resolve => setTimeout(resolve, 200));
                img.classList.add('visible');
                await new Promise(resolve => setTimeout(resolve, 150));
                img.classList.add('stacked');
            }

            // 等待最后一个动画完成
            await new Promise(resolve => setTimeout(resolve, 500));

            // 爆炸效果
            const wordImages = document.querySelectorAll('.word-image');
            wordImages.forEach(img => {
                img.classList.add('explode');
            });

            // 等待爆炸动画完成
            await new Promise(resolve => setTimeout(resolve, 1000));
            wordImagesContainer.hidden = true;

            // 创建并显示尘埃效果
            const dustContainer = document.getElementById('dust-particles');
            dustContainer.innerHTML = '';

            // 创建多个尘埃粒子
            const particleCount = 40;
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'dust-particle';

                const left = 20 + Math.random() * 60;
                particle.style.left = `${left}%`;

                const delay = Math.random() * 0.2;
                particle.style.animationDelay = `${delay}s`;

                const size = 1 + Math.random() * 2;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;

                const maxOpacity = 0.15 + Math.random() * 0.2;
                particle.style.setProperty('--max-opacity', maxOpacity);

                dustContainer.appendChild(particle);
            }

            // 显示最终图片
            finalImage.src = data.final_image;
            finalImageContainer.hidden = false;

            await new Promise((resolve) => {
                if (finalImage.complete) {
                    resolve();
                } else {
                    finalImage.onload = resolve;
                }
            });

            finalImage.classList.add('visible');

            await new Promise(resolve => setTimeout(resolve, 700));

            requestAnimationFrame(() => {
                dustContainer.style.opacity = '1';
                dustContainer.classList.add('active');
            });

            setTimeout(() => {
                dustContainer.style.opacity = '0';
                setTimeout(() => {
                    dustContainer.classList.remove('active');
                }, 300);
            }, 1200);

        } catch (error) {
            console.error('Error:', error);
            alert('生成过程中出现错误，请重试！');
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<span class="button-text">开始生成</span><i class="material-icons">auto_awesome</i>';
            progressRing.classList.remove('active');
        }
    });
});
