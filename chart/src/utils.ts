import { ChartManager } from "./chart";

export function getMsg(messageType: "group" | "private", senderId: string, groupId: string = ''): seal.Message {
    let msg = seal.newMessage();

    if (messageType == 'group') {
        msg.groupId = groupId;
        msg.guildId = '';
    }

    msg.messageType = messageType;
    msg.sender.userId = senderId;
    return msg;
}

export function getCtx(epId: string, msg: seal.Message): seal.MsgContext | undefined {
    const eps = seal.getEndPoints();

    for (let i = 0; i < eps.length; i++) {
        if (eps[i].userId === epId) {
            return seal.createTempCtx(eps[i], msg);
        }
    }

    return undefined;
}

export async function update(ext: seal.ExtInfo, cm: ChartManager) {
    const updatedPlayers = new Set<string>();
    const eps = seal.getEndPoints();
    for (let i = 0; i < eps.length; i++) {
        const epId = eps[i].userId;

        const data = await globalThis.http.getData(epId,'get_group_list?no_cache=true');
        if (data === null) {
            continue;
        }

        for (let j = 0; j < data.length; j++) {
            const gid = `QQ-Group:${data[j].group_id}`
            const data2 = await globalThis.http.getData(epId, `get_group_member_list?group_id=${data[j].group_id}`);
            if (data2 === null) {
                continue;
            }

            for (let k = 0; k < data2.length; k++) {
                const uid = `QQ:${data2[k].user_id}`;
                if (!updatedPlayers.has(uid)) {
                    const msg = getMsg('group', uid, gid);
                    const ctx = getCtx(epId, msg);
                    cm.updateVars(ext, ctx);
                    updatedPlayers.add(uid);
                }
            }
        }
    }
}