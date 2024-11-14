import { Goods } from "./shop";

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

export function parseGoods(data: any): Goods {
    if (!data) {
        return {};
    }

    const goods: Goods = {};

    try {
        const names = Object.keys(data);

        for (let i = 0; i < names.length; i++) {
            const name = names[i];

            if (!data[name].price ||!data[name].count) {
                throw new Error('商品价格和数量不存在');
            }

            goods[name] = {
                price: data[name].price,
                count: data[name].count,
                receipt: data[name].receipt,
                usage: data[name].usage
            }
        }
    } catch (err) {
        console.error(`在解析商店货品时出现错误：${err}`);
    }

    return goods;
}
