import './style.css';

/**
 * Paint Tool Application - Canvas2D Implementation
 * A touch-optimized paint tool for kids and toddlers
 */

type Tool = 'brush' | 'star' | 'heart';

interface Point {
  x: number;
  y: number;
}

// 40 vibrant, kid-friendly colors
const COLOR_PALETTE = [
  // Reds & Pinks
  '#FF6B6B', '#FF5252', '#F44336', '#E91E63', '#FF1744', '#F50057', '#FF4081', '#FF80AB',
  // Oranges & Yellows
  '#FFA07A', '#FF9800', '#FF6F00', '#FFB300', '#F7DC6F', '#FFEB3B', '#FDD835', '#FFFF00',
  // Greens
  '#52BE80', '#4CAF50', '#8BC34A', '#CDDC39', '#66BB6A', '#81C784', '#00E676', '#69F0AE',
  // Blues & Cyans
  '#45B7D1', '#2196F3', '#03A9F4', '#00BCD4', '#0097A7', '#006064', '#80DEEA', '#84FFFF',
  // Purples & Magentas
  '#BB8FCE', '#9C27B0', '#673AB7', '#7C4DFF', '#D500F9', '#E1BEE7', '#CE93D8', '#BA68C8',
];

class PaintApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isDrawing: boolean = false;
  private color: string = '#FF6B6B';
  private size: number = 25;
  private tool: Tool = 'brush';
  private lastPoint: Point | null = null;

  constructor() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    this.setupCanvas();
    this.setupEventListeners();
    this.updateBrushPreview();
  }

  /**
   * Initialize canvas dimensions
   */
  private setupCanvas(): void {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    
    // Set canvas properties for smooth drawing
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  /**
   * Set up all event listeners for toolbar and canvas
   */
  private setupEventListeners(): void {
    // Color picker button
    document.getElementById('colorPickerBtn')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openColorPicker();
    });

    // Close color picker
    document.getElementById('closePickerBtn')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeColorPicker();
    });

    // Close on modal background click
    document.getElementById('colorPickerModal')!.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeColorPicker();
      }
    });

    // Build color grid
    this.buildColorGrid();

    // Size slider
    const sizeSlider = document.getElementById('sizeSlider') as HTMLInputElement;
    sizeSlider.addEventListener('input', () => {
      this.size = parseInt(sizeSlider.value);
      this.updateBrushPreview();
    });

    // Tool buttons
    document.getElementById('brushBtn')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setActiveTool('brush');
    });

    document.getElementById('starBtn')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setActiveTool('star');
    });

    document.getElementById('heartBtn')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setActiveTool('heart');
    });

    // Clear button
    document.getElementById('clearBtn')!.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Clear the canvas? 🎨')) {
        this.clearCanvas();
      }
    });

    // Prevent toolbar interactions from drawing
    const toolbar = document.querySelector('.toolbar');
    toolbar!.addEventListener('touchstart', (e) => e.stopPropagation());
    toolbar!.addEventListener('touchmove', (e) => e.stopPropagation());
    toolbar!.addEventListener('touchend', (e) => e.stopPropagation());

    // Canvas mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e.clientX, e.clientY));
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDrawing) {
        this.draw(e.clientX, e.clientY);
      }
    });
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

    // Canvas touch events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startDrawing(touch.clientX, touch.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.draw(touch.clientX, touch.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.stopDrawing();
    }, { passive: false });
  }

  /**
   * Update the brush preview circle
   */
  private updateBrushPreview(): void {
    const preview = document.getElementById('brushPreview')!;
    const previewSize = Math.max(10, Math.min(40, this.size));
    preview.style.width = `${previewSize}px`;
    preview.style.height = `${previewSize}px`;
    preview.style.backgroundColor = this.color;
  }

  /**
   * Build the color grid with all available colors
   */
  private buildColorGrid(): void {
    const colorGrid = document.getElementById('colorGrid')!;
    colorGrid.innerHTML = '';
    
    COLOR_PALETTE.forEach((color) => {
      const colorItem = document.createElement('div');
      colorItem.className = 'color-grid-item';
      colorItem.style.backgroundColor = color;
      colorItem.dataset.color = color;
      
      if (color === this.color) {
        colorItem.classList.add('selected');
      }
      
      colorItem.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectColor(color);
      });
      
      colorGrid.appendChild(colorItem);
    });
  }

  /**
   * Open the color picker modal
   */
  private openColorPicker(): void {
    const modal = document.getElementById('colorPickerModal')!;
    modal.classList.add('active');
    this.buildColorGrid(); // Refresh to show current selection
  }

  /**
   * Close the color picker modal
   */
  private closeColorPicker(): void {
    const modal = document.getElementById('colorPickerModal')!;
    modal.classList.remove('active');
  }

  /**
   * Select a color from the picker
   */
  private selectColor(color: string): void {
    this.color = color;
    this.updateBrushPreview();
    
    // Update selection in grid
    document.querySelectorAll('.color-grid-item').forEach(item => {
      item.classList.remove('selected');
      if ((item as HTMLElement).dataset.color === color) {
        item.classList.add('selected');
      }
    });
    
    // Close modal after selection
    setTimeout(() => this.closeColorPicker(), 200);
  }

  /**
   * Set the active tool and update button states
   */
  private setActiveTool(tool: Tool): void {
    this.tool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => {
      if (btn.id.endsWith('Btn') && btn.id !== 'clearBtn') {
        btn.classList.remove('active');
      }
    });
    document.getElementById(`${tool}Btn`)!.classList.add('active');
  }

  /**
   * Start drawing
   */
  private startDrawing(x: number, y: number): void {
    this.isDrawing = true;
    this.lastPoint = { x, y };
    this.drawAt(x, y);
  }

  /**
   * Continue drawing
   */
  private draw(x: number, y: number): void {
    if (!this.isDrawing) return;

    if (this.tool === 'brush') {
      // Smooth drawing with interpolation
      if (this.lastPoint) {
        const dist = Math.hypot(x - this.lastPoint.x, y - this.lastPoint.y);
        const steps = Math.max(1, Math.floor(dist / (this.size / 3)));

        for (let i = 0; i <= steps; i++) {
          const interpX = this.lastPoint.x + (x - this.lastPoint.x) * (i / steps);
          const interpY = this.lastPoint.y + (y - this.lastPoint.y) * (i / steps);
          this.drawCircle(interpX, interpY);
        }
      } else {
        this.drawCircle(x, y);
      }
    } else {
      // For stamps, only draw at the current position
      this.drawAt(x, y);
    }

    this.lastPoint = { x, y };
  }

  /**
   * Stop drawing
   */
  private stopDrawing(): void {
    this.isDrawing = false;
    this.lastPoint = null;
  }

  /**
   * Draw at a specific point based on current tool
   */
  private drawAt(x: number, y: number): void {
    switch (this.tool) {
      case 'brush':
        this.drawCircle(x, y);
        break;
      case 'star':
        this.drawStar(x, y);
        break;
      case 'heart':
        this.drawHeart(x, y);
        break;
    }
  }

  /**
   * Draw a circle (brush stroke)
   */
  private drawCircle(x: number, y: number): void {
    this.ctx.fillStyle = this.color;
    this.ctx.globalAlpha = 0.9;
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.size / 2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  /**
   * Draw a star shape
   */
  private drawStar(x: number, y: number): void {
    const points = 5;
    const outerRadius = this.size;
    const innerRadius = this.size / 2.5;
    const angle = Math.PI / points;

    this.ctx.fillStyle = this.color;
    this.ctx.globalAlpha = 0.9;
    this.ctx.beginPath();

    for (let i = 0; i < 2 * points; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const currAngle = i * angle - Math.PI / 2;
      const px = x + radius * Math.cos(currAngle);
      const py = y + radius * Math.sin(currAngle);

      if (i === 0) {
        this.ctx.moveTo(px, py);
      } else {
        this.ctx.lineTo(px, py);
      }
    }

    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  /**
   * Draw a heart shape
   */
  private drawHeart(x: number, y: number): void {
    const s = this.size / 20; // scale factor

    this.ctx.fillStyle = this.color;
    this.ctx.globalAlpha = 0.9;
    this.ctx.beginPath();
    
    // Heart shape using bezier curves
    this.ctx.moveTo(x, y + 5 * s);
    
    // Left side of heart
    this.ctx.bezierCurveTo(
      x, y + 2 * s,
      x - 5 * s, y - 3 * s,
      x - 10 * s, y - 3 * s
    );
    this.ctx.bezierCurveTo(
      x - 15 * s, y - 3 * s,
      x - 20 * s, y + 2 * s,
      x - 20 * s, y + 7 * s
    );
    this.ctx.bezierCurveTo(
      x - 20 * s, y + 12 * s,
      x - 15 * s, y + 17 * s,
      x, y + 25 * s
    );
    
    // Right side of heart
    this.ctx.bezierCurveTo(
      x + 15 * s, y + 17 * s,
      x + 20 * s, y + 12 * s,
      x + 20 * s, y + 7 * s
    );
    this.ctx.bezierCurveTo(
      x + 20 * s, y + 2 * s,
      x + 15 * s, y - 3 * s,
      x + 10 * s, y - 3 * s
    );
    this.ctx.bezierCurveTo(
      x + 5 * s, y - 3 * s,
      x, y + 2 * s,
      x, y + 5 * s
    );

    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  /**
   * Clear the entire canvas
   */
  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PaintApp();
});
