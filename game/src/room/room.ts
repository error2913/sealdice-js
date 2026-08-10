export type RoomStatus = 'waiting' | 'playing' | 'ended';

export class Room {
    rid: string;
    status: RoomStatus;
    players: string[];
    data: { [key: string]: any };
    createTime: number;
    maxPlayers: number;

    // 生命周期钩子，函数不会被序列化，重载插件后需要重新设置
    onStart: ((ctx: seal.MsgContext, msg: seal.Message, room: Room) => void) | null;
    onEnd: ((ctx: seal.MsgContext, msg: seal.Message, room: Room) => void) | null;

    constructor(rid: string, maxPlayers: number = 0) {
        this.rid = rid;
        this.status = 'waiting';
        this.players = [];
        this.data = {};
        this.createTime = Math.floor(Date.now() / 1000);
        this.maxPlayers = maxPlayers;
        this.onStart = null;
        this.onEnd = null;
    }

    static parse(data: any, rid: string, maxPlayers: number = 0): Room {
        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
            data = {};
        }

        const room = new Room(rid, maxPlayers);

        if (data.hasOwnProperty('status') && ['waiting', 'playing', 'ended'].includes(data.status)) {
            room.status = data.status;
        }

        if (data.hasOwnProperty('players') && Array.isArray(data.players)) {
            room.players = data.players;
        }

        if (data.hasOwnProperty('data') && data.data !== null && typeof data.data === 'object' && !Array.isArray(data.data)) {
            room.data = data.data;
        }

        if (data.hasOwnProperty('createTime') && typeof data.createTime === 'number') {
            room.createTime = data.createTime;
        }

        return room;
    }

    // 状态机
    isWaiting(): boolean {
        return this.status === 'waiting';
    }

    isPlaying(): boolean {
        return this.status === 'playing';
    }

    isEnded(): boolean {
        return this.status === 'ended';
    }

    // 未开始 -> 游戏中，成功后执行start钩子
    start(ctx?: seal.MsgContext, msg?: seal.Message): boolean {
        if (this.status !== 'waiting') {
            return false;
        }

        this.status = 'playing';

        if (this.onStart) {
            try {
                this.onStart(ctx, msg, this);
            } catch (error) {
                console.error(`执行房间${this.rid}的start钩子时出现错误:`, error);
            }
        }

        return true;
    }

    // 游戏中 -> 已结束，成功后执行end钩子
    end(ctx?: seal.MsgContext, msg?: seal.Message): boolean {
        if (this.status !== 'playing') {
            return false;
        }

        this.status = 'ended';

        if (this.onEnd) {
            try {
                this.onEnd(ctx, msg, this);
            } catch (error) {
                console.error(`执行房间${this.rid}的end钩子时出现错误:`, error);
            }
        }

        return true;
    }

    // 重置为未开始状态，清空参与者和自定义数据
    reset(): void {
        this.status = 'waiting';
        this.players = [];
        this.data = {};
        this.createTime = Math.floor(Date.now() / 1000);
    }

    // 参与者管理
    addPlayer(uid: string): boolean {
        if (this.players.includes(uid)) {
            return false;
        }

        if (this.maxPlayers > 0 && this.players.length >= this.maxPlayers) {
            return false;
        }

        this.players.push(uid);
        return true;
    }

    removePlayer(uid: string): boolean {
        const index = this.players.indexOf(uid);
        if (index === -1) {
            return false;
        }

        this.players.splice(index, 1);
        return true;
    }

    hasPlayer(uid: string): boolean {
        return this.players.includes(uid);
    }

    playerCount(): number {
        return this.players.length;
    }

    isFull(): boolean {
        return this.maxPlayers > 0 && this.players.length >= this.maxPlayers;
    }

    clearPlayers(): void {
        this.players = [];
    }

    // 快照：导出为字符串
    snapshot(): string {
        return JSON.stringify(this);
    }

    // 快照：从字符串恢复，返回是否成功
    restore(json: string): boolean {
        try {
            const data = JSON.parse(json);
            const room = Room.parse(data, this.rid, this.maxPlayers);
            this.status = room.status;
            this.players = room.players;
            this.data = room.data;
            this.createTime = room.createTime;
            return true;
        } catch (error) {
            console.error(`恢复房间${this.rid}快照失败:`, error);
            return false;
        }
    }
}
