import { useEffect, useRef, useState } from 'react';
import { BlockType, Direction, MachineState, BlockState } from '../types';
import { Renderer2D } from '../core/Renderer2D';
import './FlyingMachineSimulator.css';

const BLOCK_LABELS: Record<BlockType, string> = {
    [BlockType.StickyPiston]: '粘着ピストン',
    [BlockType.Piston]: 'ピストン',
    [BlockType.Redstone]: 'レッドストーン',
    [BlockType.Observer]: 'オブザーバー',
    [BlockType.SlimeBlock]: 'スライムブロック',
    [BlockType.HoneycombBlock]: 'ハニカムブロック',
    [BlockType.Dispenser]: 'ディスペンサー',
    [BlockType.Empty]: '空気'
};

const initialState: MachineState = {
    blocks: [],
    isSimulating: false,
    selectedBlock: BlockType.StickyPiston
};

export function FlyingMachineSimulator() {
    const [state, setState] = useState<MachineState>(initialState);
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<Renderer2D | null>(null);

    useEffect(() => {
        if (containerRef.current && !rendererRef.current) {
            const renderer = new Renderer2D();
            renderer.initialize(containerRef.current);
            rendererRef.current = renderer;
        }

        return () => {
            if (rendererRef.current) {
                rendererRef.current.cleanup();
                rendererRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (rendererRef.current) {
            rendererRef.current.render(state);
        }
    }, [state]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || !state.selectedBlock) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / 40);
        const y = Math.floor((e.clientY - rect.top) / 40);

        setState(prev => {
            // 同じ座標に既存のブロックがあるか確認
            const existingBlockIndex = prev.blocks.findIndex(
                block => block.position.x === x && block.position.y === y && block.position.z === 0
            );

            const newBlock = {
                position: { x, y, z: 0 },
                type: state.selectedBlock!,
                direction: Direction.North,
                state: BlockState.Inactive
            };

            // 既存のブロックがある場合は置き換え、ない場合は追加
            if (existingBlockIndex !== -1) {
                const newBlocks = [...prev.blocks];
                newBlocks[existingBlockIndex] = newBlock;
                return {
                    ...prev,
                    blocks: newBlocks
                };
            } else {
                return {
                    ...prev,
                    blocks: [...prev.blocks, newBlock]
                };
            }
        });
    };

    const handleBlockSelect = (blockType: BlockType) => {
        setState(prev => ({
            ...prev,
            selectedBlock: blockType
        }));
    };

    const toggleSimulation = () => {
        setState(prev => ({
            ...prev,
            isSimulating: !prev.isSimulating
        }));
    };

    const resetSimulation = () => {
        setState(initialState);
    };

    return (
        <div className="main-content">
            <div className="toolbox">
                <h2>ブロック選択</h2>
                <div className="block-selector">
                    {Object.entries(BLOCK_LABELS).map(([type, label]) => (
                        type !== BlockType.Empty && (
                            <button
                                key={type}
                                className={`block-btn ${state.selectedBlock === type ? 'selected' : ''}`}
                                onClick={() => handleBlockSelect(type as BlockType)}
                            >
                                {label}
                            </button>
                        )
                    ))}
                </div>
                <div className="controls">
                    <button
                        id="start-sim"
                        onClick={toggleSimulation}
                    >
                        {state.isSimulating ? 'シミュレーション停止' : 'シミュレーション開始'}
                    </button>
                    <button
                        id="reset-sim"
                        onClick={resetSimulation}
                    >
                        リセット
                    </button>
                </div>
            </div>
            <div
                ref={containerRef}
                className="canvas-container"
                onClick={handleCanvasClick}
            />
        </div>
    );
}