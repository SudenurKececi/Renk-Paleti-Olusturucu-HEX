document.addEventListener('DOMContentLoaded', () => {

    const savedColorsKey = 'myColorStation_v9_ultimate';
    let savedColors = JSON.parse(localStorage.getItem(savedColorsKey)) || [];

    // Seçiciler
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.content');
    const eyeDropperBtn = document.getElementById('eye-dropper-btn');
    const selectedHex = document.getElementById('selected-hex');
    const saveBtn = document.getElementById('save-color-btn');

    // --- GLOBAL KOPYALAMA ---
    window.copyToClipboard = function(text) {
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => showToast(`Kopyalandı: ${text}`))
                .catch(err => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
    };

    function fallbackCopy(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.select();
        try { document.execCommand('copy'); showToast(`Kopyalandı: ${text}`); } 
        catch (err) { console.error('Hata', err); }
        document.body.removeChild(textArea);
    }

    // --- TABLAR ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.querySelector(tab.dataset.target).classList.add('active');
        });
    });

    // --- RENK ÇEMBERİ ---
    var colorPicker = new iro.ColorPicker("#color-picker-wheel", {
        width: 220, color: "#4facfe", borderWidth: 2, borderColor: "#fff",
        layout: [
            { component: iro.ui.Wheel, options: {} },
            { component: iro.ui.Slider, options: { sliderType: 'value', width: 220 } }
        ]
    });

    colorPicker.on('color:change', function(color) {
        const hex = color.hexString.toUpperCase();
        selectedHex.innerText = hex;
        saveBtn.style.backgroundColor = hex;
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        saveBtn.style.color = (yiq >= 128) ? '#000' : '#fff';
    });

    // --- EYE DROPPER ---
    if (!window.EyeDropper) { if(eyeDropperBtn) eyeDropperBtn.style.display = 'none'; }
    else {
        eyeDropperBtn.addEventListener('click', async () => {
            const eyeDropper = new EyeDropper();
            document.body.style.cursor = 'crosshair'; 
            try {
                const result = await eyeDropper.open();
                colorPicker.color.hexString = result.sRGBHex;
                showToast('Renk Seçildi!');
            } catch (e) { } 
            finally { document.body.style.cursor = 'default'; }
        });
    }

    // --- KAYIT ---
    saveBtn.addEventListener('click', () => {
        const hex = selectedHex.innerText;
        if (!savedColors.includes(hex)) {
            savedColors.push(hex);
            updateLocalStorage();
            renderSavedColors();
            showToast('Listeye Eklendi');
        }
    });

    function renderSavedColors() {
        const list = document.getElementById('saved-list');
        list.innerHTML = '';
        savedColors.slice().reverse().forEach((hex) => {
            const div = document.createElement('div');
            div.classList.add('saved-item');
            div.innerHTML = `
                <div class="saved-left"><div class="color-preview" style="background: ${hex}"></div><span class="saved-hex" onclick="window.copyToClipboard('${hex}')" style="cursor:pointer">${hex}</span></div>
                <div class="saved-actions">
                    <button class="action-btn copy" onclick="window.copyToClipboard('${hex}')"><i class="fa-regular fa-copy"></i></button>
                    <button class="action-btn delete" onclick="deleteColor('${hex}')"><i class="fa-solid fa-trash"></i></button>
                </div>`;
            list.appendChild(div);
        });
    }

    window.deleteColor = (hex) => { savedColors = savedColors.filter(c => c !== hex); updateLocalStorage(); renderSavedColors(); };
    window.clearAllColors = () => { if(confirm("Tümünü sil?")) { savedColors=[]; updateLocalStorage(); renderSavedColors(); } };
    function updateLocalStorage() { localStorage.setItem(savedColorsKey, JSON.stringify(savedColors)); }

    // --- PALET ---
    const cols = document.querySelectorAll('.color-col');
    const algoSelect = document.getElementById('algo-select');
    const generateBtn = document.querySelector('.generate-btn');
    document.addEventListener('keydown', (e) => { if (e.code === 'Space' && document.getElementById('palette-tab').classList.contains('active')) { e.preventDefault(); generatePalette(); } });
    if(generateBtn) generateBtn.addEventListener('click', generatePalette);

    function generatePalette() {
        const algo = algoSelect.value;
        let baseHue = Math.floor(Math.random() * 360);
        cols.forEach((col, index) => {
            if (col.querySelector('.lock-btn i').classList.contains('fa-lock')) return;
            let hue, saturation, lightness;
            if (algo === 'random') { hue = Math.floor(Math.random() * 360); saturation = Math.floor(Math.random() * 30) + 65; lightness = Math.floor(Math.random() * 40) + 35; }
            else if (algo === 'monochromatic') { hue = baseHue; saturation = 70; lightness = 20 + (index * 15); }
            else if (algo === 'analogous') { hue = (baseHue + (index * 30)) % 360; saturation = 80; lightness = 55; }
            else if (algo === 'complementary') { if (index < 3) { hue = baseHue; saturation = 75; lightness = 40 + (index * 15); } else { hue = (baseHue + 180) % 360; saturation = 90; lightness = 50 + ((index - 3) * 20); } }
            const hexCode = hslToHex(hue, saturation, lightness);
            col.style.background = hexCode; col.querySelector('.hex-text').innerText = hexCode;
            const lockBtn = col.querySelector('.lock-btn'); const newLockBtn = lockBtn.cloneNode(true); lockBtn.parentNode.replaceChild(newLockBtn, lockBtn);
            newLockBtn.onclick = (e) => { e.stopPropagation(); newLockBtn.querySelector('i').classList.toggle('fa-lock-open'); newLockBtn.querySelector('i').classList.toggle('fa-lock'); };
            const doCopy = (e) => { e.stopPropagation(); window.copyToClipboard(hexCode); };
            const copyBtn = col.querySelector('.copy-btn'); const newCopyBtn = copyBtn.cloneNode(true); copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn); newCopyBtn.onclick = doCopy;
            col.querySelector('.hex-text').onclick = doCopy; col.querySelector('.overlay').onclick = (e) => { if(e.target === col.querySelector('.overlay')) doCopy(e); };
        });
    }

    // --- RESİM ---
    const uploadArea = document.getElementById('upload-area');
    const imageInput = document.getElementById('image-input');
    const previewImg = document.getElementById('preview-img');
    const resultArea = document.getElementById('result-area');
    const extractedColorsDiv = document.getElementById('extracted-colors');
    const colorThief = new ColorThief();
    if(uploadArea) {
        uploadArea.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    resultArea.style.display = 'flex';
                    previewImg.onload = function() {
                        const colors = colorThief.getPalette(previewImg, 5);
                        extractedColorsDiv.innerHTML = '';
                        colors.forEach(rgb => {
                            const hex = "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1).toUpperCase();
                            const div = document.createElement('div');
                            div.className = 'extract-box'; div.style.backgroundColor = hex; div.innerText = hex; div.onclick = () => window.copyToClipboard(hex);
                            extractedColorsDiv.appendChild(div);
                        });
                    }
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // --- GRADIENT ---
    const gradC1 = document.getElementById('grad-c1');
    const gradC2 = document.getElementById('grad-c2');
    const gradAngle = document.getElementById('grad-angle');
    const angleVal = document.getElementById('angle-val');
    const gradPreview = document.getElementById('gradient-preview');
    const cssCode = document.getElementById('css-code');
    if (gradC1 && gradC2 && gradAngle) {
        function updateGradient() {
            const c1 = gradC1.value; const c2 = gradC2.value; const angle = gradAngle.value;
            angleVal.innerText = angle;
            const css = `background: linear-gradient(${angle}deg, ${c1}, ${c2});`;
            gradPreview.style.background = `linear-gradient(${angle}deg, ${c1}, ${c2})`;
            cssCode.innerText = css;
        }
        gradC1.addEventListener('input', updateGradient); gradC2.addEventListener('input', updateGradient); gradAngle.addEventListener('input', updateGradient); updateGradient();
    }
    window.copyGradient = () => { if(cssCode) window.copyToClipboard(cssCode.innerText); };
    window.exportPalette = () => { let css = ":root {\n"; cols.forEach((col, i) => css += `  --color-${i+1}: ${col.querySelector('.hex-text').innerText};\n`); css += "}"; window.copyToClipboard(css); }

    // --- KONTRAST (FİNAL) ---
    const contBg = document.getElementById('cont-bg');
    const contText = document.getElementById('cont-text');
    const contBgHex = document.getElementById('cont-bg-hex');
    const contTextHex = document.getElementById('cont-text-hex');
    const contrastPreviewBox = document.getElementById('contrast-preview-box');
    const contrastRatioSpan = document.getElementById('contrast-ratio');
    const meterFill = document.getElementById('contrast-meter-fill');
    const swapColorsBtn = document.getElementById('swap-colors-btn');

    if (contBg && contText) {
        function getLuminance(hex) {
            const rgb = parseInt(hex.slice(1), 16);
            const r = (rgb >> 16) & 0xff; const g = (rgb >> 8) & 0xff; const b = (rgb >> 0) & 0xff;
            const [lr, lg, lb] = [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
            return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
        }
        function calculateRatio(hex1, hex2) {
            const l1 = getLuminance(hex1); const l2 = getLuminance(hex2);
            return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        }
        function updateContrast() {
            const bg = contBg.value.toUpperCase(); const text = contText.value.toUpperCase();
            if(contBgHex) contBgHex.innerText = bg; if(contTextHex) contTextHex.innerText = text;
            contrastPreviewBox.style.backgroundColor = bg; contrastPreviewBox.style.color = text;
            contrastPreviewBox.style.borderColor = (calculateRatio(bg, '#ffffff') > 1.2) ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)';
            const ratio = calculateRatio(bg, text);
            contrastRatioSpan.innerText = ratio.toFixed(2);
            
            let percentage = (ratio / 21) * 100; if (percentage > 100) percentage = 100;
            meterFill.style.width = `${percentage}%`;
            if (ratio < 3) meterFill.style.backgroundColor = "#e74c3c";
            else if (ratio < 4.5) meterFill.style.backgroundColor = "#f1c40f";
            else if (ratio < 7) meterFill.style.backgroundColor = "#2ecc71";
            else meterFill.style.backgroundColor = "#27ae60";

            updateBadge('score-aa-normal', ratio >= 4.5); updateBadge('score-aaa-normal', ratio >= 7.0);
            updateBadge('score-aa-large', ratio >= 3.0); updateBadge('score-aaa-large', ratio >= 4.5);
        }
        function updateBadge(id, isPass) {
            const el = document.getElementById(id);
            if(el) {
                if(isPass) { el.innerText = 'GEÇTİ'; el.classList.remove('fail'); el.classList.add('pass'); }
                else { el.innerText = 'KALDI'; el.classList.remove('pass'); el.classList.add('fail'); }
            }
        }
        contBg.addEventListener('input', updateContrast); contText.addEventListener('input', updateContrast);
        swapColorsBtn.addEventListener('click', () => { const temp = contBg.value; contBg.value = contText.value; contText.value = temp; updateContrast(); });
        if(contBgHex) contBgHex.onclick = () => window.copyToClipboard(contBgHex.innerText);
        if(contTextHex) contTextHex.onclick = () => window.copyToClipboard(contTextHex.innerText);
        updateContrast();
    }

    function hslToHex(h, s, l) { l /= 100; const a = s * Math.min(l, 1 - l) / 100; const f = n => { const k = (n + h / 30) % 12; const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * color).toString(16).padStart(2, '0'); }; return `#${f(0)}${f(8)}${f(4)}`.toUpperCase(); }
    function showToast(msg) { const t = document.getElementById("toast"); t.innerText = msg; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 2000); }

    renderSavedColors();
    generatePalette();
});