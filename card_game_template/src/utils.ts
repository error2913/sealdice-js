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

export function getName(ctx: seal.MsgContext, id: string) {
    const mmsg = getMsg('group', id, ctx.group.groupId);
    const mctx = getCtx(ctx.endPoint.userId, mmsg);
    return mctx.player.name;
}

export function parseCards(s: string): string[] {
    const cards = ['card A', 'card B', 'card C'];
    const pattern = new RegExp(`^${cards.join('|^')}`);
    const result = [];

    while (true) { 
        const match = s.match(pattern);

        if (match) {
            result.push(match[0]);
            s = s.slice(match[0].length).trim();
        } else {
            break;
        }
    }

    return result;
}