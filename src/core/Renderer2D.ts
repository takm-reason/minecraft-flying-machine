import { BlockType, Direction, IMachineRenderer, MachineState, Vector3 } from '../types';

export class Renderer2D implements IMachineRenderer {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private gridSize = 40; // ピクセル単位のグリッドサイズ
    private textures: Map<BlockType, HTMLImageElement> = new Map();
    private textureLoadPromises: Promise<void>[] = [];

    // テクスチャのパスを定義
    private textureUrls = {
        [BlockType.StickyPiston]: '/textures/piston_side.png',                  // ピストンの側面テクスチャ
        [BlockType.Piston]: '/textures/piston_side.png',                        // ピストンの側面テクスチャ
        [BlockType.Redstone]: '/textures/redstone_block.png',
        [BlockType.Observer]: '/textures/observer_top.png',                     // オブザーバーの上面テクスチャ
        [BlockType.SlimeBlock]: '/textures/slime.png',
        [BlockType.HoneycombBlock]: '/textures/honeycomb.png',
        [BlockType.Dispenser]: '/textures/dispenser_front_horizontal.png',     // ディスペンサーの前面テクスチャ
    };

    private async loadTexture(type: BlockType, url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.textures.set(type, img);
                resolve();
            };
            img.onerror = () => reject(new Error(`Failed to load texture: ${url}`));
            img.src = url;
        });
    }

    private async loadAllTextures(): Promise<void> {
        this.textureLoadPromises = Object.entries(this.textureUrls).map(([type, url]) =>
            this.loadTexture(type as BlockType, url)
        );

        try {
            await Promise.all(this.textureLoadPromises);
            // テクスチャがロードされたら再描画
            if (this.canvas) {
                this.drawGrid();
            }
        } catch (error) {
            console.error('Failed to load textures:', error);
        }
    }

    async initialize(container: HTMLElement): Promise<void> {
        this.canvas = document.createElement('canvas');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.ctx = this.canvas.getContext('2d');
        container.appendChild(this.canvas);

        // テクスチャをロード
        await this.loadAllTextures();
        this.drawGrid();
    }

    render(state: MachineState): void {
        if (!this.ctx || !this.canvas) return;

        // キャンバスをクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();

        // ブロックを描画
        state.blocks.forEach(block => {
            this.drawBlock(block.position, block.type, block.direction);
        });
    }

    private drawGrid(): void {
        if (!this.ctx || !this.canvas) return;

        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;

        // 縦線
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // 横線
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    private drawBlock(position: Vector3, type: BlockType, direction: Direction): void {
        if (!this.ctx) return;

        const x = position.x * this.gridSize;
        const y = position.y * this.gridSize;

        // テクスチャがある場合は描画
        const texture = this.textures.get(type);
        if (texture) {
            // 方向に応じて回転を適用
            this.ctx.save();
            this.ctx.translate(x + this.gridSize / 2, y + this.gridSize / 2);

            switch (direction) {
                case Direction.North:
                    break; // デフォルトの向き
                case Direction.South:
                    this.ctx.rotate(Math.PI);
                    break;
                case Direction.East:
                    this.ctx.rotate(Math.PI / 2);
                    break;
                case Direction.West:
                    this.ctx.rotate(-Math.PI / 2);
                    break;
            }

            // テクスチャを描画
            this.ctx.drawImage(
                texture,
                -this.gridSize / 2,
                -this.gridSize / 2,
                this.gridSize,
                this.gridSize
            );

            this.ctx.restore();
        } else {
            // テクスチャがない場合は単色で描画
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(x, y, this.gridSize, this.gridSize);
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, this.gridSize, this.gridSize);
        }

        // 向きを示す矢印を描画
        this.ctx.globalAlpha = 0.7;
        this.drawDirectionArrow(x, y, direction);
        this.ctx.globalAlpha = 1.0;
    }

    private drawDirectionArrow(x: number, y: number, direction: Direction): void {
        if (!this.ctx) return;

        const center = {
            x: x + this.gridSize / 2,
            y: y + this.gridSize / 2
        };
        const arrowLength = this.gridSize * 0.4;

        this.ctx.beginPath();
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;

        let endX = center.x;
        let endY = center.y;

        switch (direction) {
            case Direction.North:
                endY = center.y - arrowLength;
                break;
            case Direction.South:
                endY = center.y + arrowLength;
                break;
            case Direction.East:
                endX = center.x + arrowLength;
                break;
            case Direction.West:
                endX = center.x - arrowLength;
                break;
        }

        // 矢印の線を描画
        this.ctx.moveTo(center.x, center.y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();

        // 矢印の先端を描画
        const arrowHeadSize = 8;
        const angle = Math.atan2(endY - center.y, endX - center.x);

        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - arrowHeadSize * Math.cos(angle - Math.PI / 6),
            endY - arrowHeadSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            endX - arrowHeadSize * Math.cos(angle + Math.PI / 6),
            endY - arrowHeadSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fillStyle = '#000000';
        this.ctx.fill();
    }

    handleBlockPlacement(_x: number, _y: number, _z: number): void {
        // マウス位置をグリッド座標に変換する処理は親コンポーネントで行う
    }

    cleanup(): void {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = null;
        this.ctx = null;
        this.textures.clear();
    }
}