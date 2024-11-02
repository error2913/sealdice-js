export function getPlayerList(ext: seal.ExtInfo): string[] {
    let data: any;

    try {
        data = JSON.parse(ext.storageGet(`playerList`) || '[]');
    } catch (error) {
        console.error(`从数据库中获取playerList失败:`, error);
    }

    if (data && Array.isArray(data)) {
        playerList.push(...data);
    }

    return playerList;
}

export function savePlayerList(ext: seal.ExtInfo): void {
    ext.storageSet(`playerList`, JSON.stringify(playerList));
}

export const playerList: string[] = [];