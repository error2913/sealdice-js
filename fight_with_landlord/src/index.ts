import { Game } from "./game";
import { getType, parseCards } from "./utils";

function main() {
  // 注册扩展
  let ext = seal.ext.find('FightWithLandlord2');
  if (!ext) {
    ext = seal.ext.new('FightWithLandlord2', '错误', '2.0.0');
    seal.ext.register(ext);
  }

  const cmdPlay = seal.ext.newCmdItemInfo();
  cmdPlay.name = 'ddz'; // 指令名字，可用中文
  cmdPlay.help = `帮助：
【.ddz start】
【.ddz end】
【.ddz check】查看手牌
【.ddz test 牌型名称】测试牌型是否存在
【.ddz 牌型名称】出牌
【.ddz 不要】跳过
牌应当从小到大排列，附带的牌加在后边
例如：
JJJ4 三带一
44455533AA 飞机带对子`;
  cmdPlay.disabledInPrivate = true;// 不允许私聊
  cmdPlay.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const id = ctx.group.groupId;

    switch (val) {
      case 'start': {
        const game = Game.getData(ext, id);
        game.start(ctx, msg);
        Game.saveData(ext, id);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'end': {
        const game = Game.getData(ext, id);
        game.end(ctx, msg);
        Game.saveData(ext, id);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'test': {
        const s = cmdArgs.getRestArgsFrom(2);
        const cards = parseCards(s);
        const [type, value] = getType(cards);

        if (type) {
          seal.replyToSender(ctx, msg, `${cards.join('')}存在${type}:${value}`);
          return seal.ext.newCmdExecuteResult(true);
        }

        seal.replyToSender(ctx, msg, '不存在');
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'check': {
        const game = Game.getData(ext, id);
        game.check(ctx, msg);
        return seal.ext.newCmdExecuteResult(true);
      }
      case '':
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        const game = Game.getData(ext, id);
        const name = cmdArgs.getArgN(2);
        game.play(ctx, msg, name)
        Game.saveData(ext, id);
        return seal.ext.newCmdExecuteResult(true);
      }
    }
  };
  ext.cmdMap['ddz'] = cmdPlay;
}

main();
