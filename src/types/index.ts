export type Vector3 = {
    x: number;
    y: number;
    z: number;
};

export enum BlockType {
    StickyPiston = 'STICKY_PISTON',
    Piston = 'PISTON',
    Redstone = 'REDSTONE',
    Observer = 'OBSERVER',
    SlimeBlock = 'SLIME_BLOCK',
    Empty = 'EMPTY'
}

export enum Direction {
    North = 'NORTH',
    South = 'SOUTH',
    East = 'EAST',
    West = 'WEST',
    Up = 'UP',
    Down = 'DOWN'
}

export enum BlockState {
    Active = 'ACTIVE',
    Inactive = 'INACTIVE'
}

export interface Block {
    position: Vector3;
    type: BlockType;
    direction: Direction;
    state: BlockState;
}

export interface MachineState {
    blocks: Block[];
    isSimulating: boolean;
    selectedBlock: BlockType | null;
}

export interface IMachineRenderer {
    initialize(container: HTMLElement): void;
    render(state: MachineState): void;
    handleBlockPlacement(x: number, y: number, z: number): void;
    cleanup(): void;
}