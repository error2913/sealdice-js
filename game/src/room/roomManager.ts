import { Room } from "./room";

export class RoomManager {
    private ext: seal.ExtInfo;
    private cache: { [key: string]: Room };

    constructor(ext: seal.ExtInfo) {
        this.ext = ext;
        this.cache = {};
    }

    clearCache() {
        this.cache = {};
    }

    // 获取房间对象，不存在时从storage加载，加载不到则新建
    getRoom(rid: string): Room {
        if (!this.cache.hasOwnProperty(rid)) {
            let data: any = {};

            try {
                data = JSON.parse(this.ext.storageGet(`room_${rid}`) || '{}');
            } catch (error) {
                console.error(`从数据库中获取room_${rid}失败:`, error);
            }

            this.cache[rid] = Room.parse(data, rid);
        }

        return this.cache[rid];
    }

    // 保存房间快照到storage
    saveRoom(rid: string) {
        if (this.cache.hasOwnProperty(rid)) {
            this.ext.storageSet(`room_${rid}`, JSON.stringify(this.cache[rid]));
        }
    }

    // 导出缓存中房间的快照字符串，房间不在缓存中时返回null
    snapshotRoom(rid: string): string | null {
        if (this.cache.hasOwnProperty(rid)) {
            return this.cache[rid].snapshot();
        }

        return null;
    }

    // 用快照字符串恢复房间，房间不在缓存中时返回false
    restoreRoom(rid: string, json: string): boolean {
        if (this.cache.hasOwnProperty(rid)) {
            return this.cache[rid].restore(json);
        }

        return false;
    }
}
