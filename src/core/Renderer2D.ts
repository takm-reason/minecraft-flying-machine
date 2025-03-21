import { BlockType, Direction, IMachineRenderer, MachineState, Vector3 } from '../types';

export class Renderer2D implements IMachineRenderer {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private gridSize = 40; // ピクセル単位のグリッドサイズ
    private textures: Map<string, HTMLImageElement> = new Map();

    // ピストンの向きに応じたテクスチャを管理
    private pistonTextures = {
        side: {
            [BlockType.StickyPiston]: '/textures/piston_side.png',
            [BlockType.Piston]: '/textures/piston_side.png',
        },
        top: {
            [BlockType.StickyPiston]: '/textures/piston_top_sticky.png',
            [BlockType.Piston]: '/textures/piston_top_normal.png',
        }
    };

    // 基本テクスチャ
    private textureUrls = {
        [BlockType.Redstone]: '/textures/redstone_block.png',
        [BlockType.Observer]: '/textures/observer_top.png',
        [BlockType.SlimeBlock]: '/textures/slime.png',
        [BlockType.HoneycombBlock]: '/textures/honeycomb.png',
        [BlockType.Dispenser]: '/textures/dispenser_front_horizontal.png',
    };

    private async loadTexture(key: string, url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.textures.set(key, img);
                resolve();
            };
            img.onerror = () => reject(new Error(`Failed to load texture: ${url}`));
            img.src = url;
        });
    }

    private async loadAllTextures(): Promise<void> {
        const promises: Promise<void>[] = [];

        // 基本テクスチャのロード
        Object.entries(this.textureUrls).forEach(([type, url]) => {
            promises.push(this.loadTexture(type, url));
        });

        // ピストンの側面テクスチャをロード
        Object.entries(this.pistonTextures.side).forEach(([type, url]) => {
            promises.push(this.loadTexture(`${type}_side`, url));
        });

        // ピストンの前面テクスチャをロード
        Object.entries(this.pistonTextures.top).forEach(([type, url]) => {
            promises.push(this.loadTexture(`${type}_top`, url));
        });

        try {
            await Promise.all(promises);
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

        // テクスチャの選択
        let textureKey: string = type;
        if (type === BlockType.StickyPiston || type === BlockType.Piston) {
            // Upの場合は前面（上面）のテクスチャを使用
            if (direction === Direction.Up) {
                textureKey = `${type}_top` as string;
            } else {
                textureKey = `${type}_side` as string;
            }
        }

        const texture = this.textures.get(textureKey.toString());
        if (texture) {
            // 方向に応じて回転を適用
            this.ctx.save();
            this.ctx.translate(x + this.gridSize / 2, y + this.gridSize / 2);

            // 方向に応じた回転を適用
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
                case Direction.Up:
                    break; // 上向きはそのまま
                case Direction.Down:
                    this.ctx.rotate(Math.PI);
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
        }

        // 向きのないブロックタイプを定義
        const noDirectionBlocks = [
            BlockType.Redstone,
            BlockType.SlimeBlock,
            BlockType.HoneycombBlock
        ];

        // 向きのあるブロックの場合のみ矢印を描画
        if (!noDirectionBlocks.includes(type)) {
            this.ctx.globalAlpha = 0.7;
            this.drawDirectionArrow(x, y, direction);
            this.ctx.globalAlpha = 1.0;
        }
    }

    private drawDirectionArrow(x: number, y: number, direction: Direction): void {
        if (!this.ctx) return;

        const center = {
            x: x + this.gridSize / 2,
            y: y + this.gridSize / 2
        };
        const arrowLength = this.gridSize * 0.4;
        const upDownArrowLength = arrowLength * 0.6;

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
            case Direction.Up:
                // 上向きの矢印は円の中に点を追加
                this.ctx.beginPath();
                this.ctx.arc(center.x, center.y, upDownArrowLength / 2, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.arc(center.x, center.y, 2, 0, Math.PI * 2);
                this.ctx.fill();
                return;
            case Direction.Down:
                // 下向きの矢印は×印を描画
                const crossSize = upDownArrowLength / 2;
                this.ctx.beginPath();
                this.ctx.moveTo(center.x - crossSize, center.y - crossSize);
                this.ctx.lineTo(center.x + crossSize, center.y + crossSize);
                this.ctx.moveTo(center.x + crossSize, center.y - crossSize);
                this.ctx.lineTo(center.x - crossSize, center.y + crossSize);
                this.ctx.stroke();
                return;
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