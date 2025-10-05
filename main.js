class MandalaColoringApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentTool = 'brush';
        this.isDrawing = false;
        this.brushSize = 3;
        this.currentColor = '#FF6B6B';
        this.originalImage = null;
        this.currentMandala = null;
        
        this.setupEventListeners();
        this.initializeCanvas();
    }
    
    initializeCanvas() {
        // Fill canvas with white background
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    setupEventListeners() {
        // Mandala selection
        document.querySelectorAll('.mandala-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const imagePath = option.dataset.image;
                this.loadMandala(imagePath);
                
                // Update selection visual
                document.querySelectorAll('.mandala-option').forEach(opt => 
                    opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
        
        // Tool selection
        document.querySelectorAll('.tool-button[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.tool-button.active')?.classList.remove('active');
                e.target.closest('.tool-button').classList.add('active');
                this.currentTool = e.target.closest('.tool-button').dataset.tool;
                this.updateCursor();
            });
        });
        
        // Color selection
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                document.querySelector('.color-swatch.active')?.classList.remove('active');
                e.target.classList.add('active');
                this.currentColor = e.target.dataset.color;
            });
        });
        
        // Brush size
        const brushSize = document.getElementById('brushSize');
        const sizeDisplay = document.getElementById('sizeDisplay');
        brushSize.addEventListener('input', (e) => {
            this.brushSize = e.target.value;
            sizeDisplay.textContent = e.target.value;
        });
        
        // Canvas events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }
    
    loadMandala(imagePath) {
        const loadingMessage = document.getElementById('loadingMessage');
        loadingMessage.style.display = 'block';
        
        const img = new Image();
        img.onload = () => {
            // Clear canvas
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw mandala centered
            const scale = Math.min(
                this.canvas.width / img.width,
                this.canvas.height / img.height
            ) * 0.9; // 90% of canvas size
            
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const x = (this.canvas.width - scaledWidth) / 2;
            const y = (this.canvas.height - scaledHeight) / 2;
            
            this.ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
            
            // Store original for reset functionality
            this.originalImage = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.currentMandala = imagePath;
            
            loadingMessage.style.display = 'none';
        };
        
        img.onerror = () => {
            loadingMessage.textContent = 'Error loading mandala. Please check if the image file exists.';
            setTimeout(() => {
                loadingMessage.style.display = 'none';
            }, 3000);
        };
        
        img.src = imagePath;
    }
    
    updateCursor() {
        const cursors = {
            'brush': 'cursor-brush',
            'pen': 'cursor-pen',
            'eraser': 'cursor-eraser',
            'bucket': 'cursor-bucket'
        };
        
        // Remove all cursor classes
        Object.values(cursors).forEach(cursor => {
            this.canvas.classList.remove(cursor);
        });
        
        // Add current cursor class
        this.canvas.classList.add(cursors[this.currentTool]);
    }
    
    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                        e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    startDrawing(e) {
        if (this.currentTool === 'bucket') return;
        
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        
        this.setupDrawingStyle();
    }
    
    draw(e) {
        if (!this.isDrawing || this.currentTool === 'bucket') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }
    
    stopDrawing() {
        this.isDrawing = false;
        this.ctx.beginPath();
    }
    
    handleClick(e) {
        if (this.currentTool !== 'bucket') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);
        
        this.floodFill(x, y, this.hexToRgb(this.currentColor));
    }
    
    setupDrawingStyle() {
        switch(this.currentTool) {
            case 'brush':
                this.ctx.globalCompositeOperation = 'source-over';
                this.ctx.lineWidth = this.brushSize;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.strokeStyle = this.currentColor;
                break;
            case 'pen':
                this.ctx.globalCompositeOperation = 'source-over';
                this.ctx.lineWidth = Math.max(1, this.brushSize / 2);
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.strokeStyle = this.currentColor;
                break;
            case 'eraser':
                this.ctx.globalCompositeOperation = 'destination-out';
                this.ctx.lineWidth = this.brushSize * 2;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                break;
        }
    }
    
    // Advanced Flood Fill Algorithm with Tolerance
    floodFill(startX, startY, fillColor) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Get the color of the clicked pixel
        const startPos = (startY * width + startX) * 4;
        const startR = data[startPos];
        const startG = data[startPos + 1];
        const startB = data[startPos + 2];
        const startA = data[startPos + 3];
        
        // If the clicked color is the same as fill color, return
        if (startR === fillColor.r && startG === fillColor.g && 
            startB === fillColor.b && startA === 255) {
            return;
        }
        
        // Tolerance for color matching (helps with anti-aliasing)
        const tolerance = 30;
        
        // Function to check if colors match within tolerance
        const colorMatch = (r, g, b, a) => {
            return Math.abs(r - startR) <= tolerance &&
                   Math.abs(g - startG) <= tolerance &&
                   Math.abs(b - startB) <= tolerance &&
                   Math.abs(a - startA) <= tolerance;
        };
        
        // Use scanline flood fill for better performance
        const pixelStack = [[startX, startY]];
        const visited = new Set();
        
        while (pixelStack.length > 0) {
            const [x, y] = pixelStack.pop();
            
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            
            const pos = (y * width + x) * 4;
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            
            const r = data[pos];
            const g = data[pos + 1];
            const b = data[pos + 2];
            const a = data[pos + 3];
            
            // Check if current pixel matches the start color within tolerance
            if (!colorMatch(r, g, b, a)) {
                continue;
            }
            
            visited.add(key);
            
            // Fill the pixel
            data[pos] = fillColor.r;
            data[pos + 1] = fillColor.g;
            data[pos + 2] = fillColor.b;
            data[pos + 3] = 255;
            
            // Add neighboring pixels
            pixelStack.push([x + 1, y]);
            pixelStack.push([x - 1, y]);
            pixelStack.push([x, y + 1]);
            pixelStack.push([x, y - 1]);
        }
        
        // Put the modified image data back to canvas
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}

// Global functions
function clearCanvas() {
    const app = window.mandalaApp;
    app.ctx.fillStyle = '#FFFFFF';
    app.ctx.fillRect(0, 0, app.canvas.width, app.canvas.height);
}

function resetToOriginal() {
    const app = window.mandalaApp;
    if (app.originalImage) {
        app.ctx.putImageData(app.originalImage, 0, 0);
    } else if (app.currentMandala) {
        app.loadMandala(app.currentMandala);
    }
}

function saveImage() {
    const app = window.mandalaApp;
    const link = document.createElement('a');
    link.download = 'my-mandala-coloring.png';
    link.href = app.canvas.toDataURL();
    link.click();
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mandalaApp = new MandalaColoringApp();
});