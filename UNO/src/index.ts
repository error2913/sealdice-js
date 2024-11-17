import { deckMap, load } from "./deck";
import { Game } from "./game";
import { getName } from "./utils";

function main() {
  // 注册扩展
  let ext = seal.ext.find('UNO');
  if (!ext) {
    ext = seal.ext.new('UNO', '错误', '1.0.0');
    seal.ext.register(ext);
  }

  //注册指令
  const cmdGame = seal.ext.newCmdItemInfo();
  cmdGame.name = 'uno'; // 指令名字，可用中文
  cmdGame.help = `帮助：
【.uno start】使用team里的成员创建游戏
【.uno end】
【.uno check】查看自己的手牌
【.uno skip】跳过这轮
【.uno <牌名> (指定颜色)】
【.uno info】`;
  cmdGame.disabledInPrivate = true;// 不允许私聊
  cmdGame.solve = (ctx, msg, cmdArgs) => {
    if (Object.keys(deckMap).length === 0) {
      console.log('开始加载牌组');
      load();
    }
    
    const val = cmdArgs.getArgN(1);
    const id = ctx.group.groupId;

    switch (val) {
      case '':
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
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
      case 'check': {
        const game = Game.getData(ext, id);
        game.check(ctx, msg);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'info': {
        const game = Game.getData(ext, id);
        if (!game.status) {
          seal.replyToSender(ctx, msg, '游戏未开始');
          return seal.ext.newCmdExecuteResult(true);
        }
        seal.replyToSender(ctx, msg, `当前回合数:${game.round}\n当前轮数:${game.turn}\n当前玩家:${getName(ctx, game.info.id)}\n当前场上牌的信息:${game.info.color}${game.info.type}\n当前玩家顺序:${game.players.map(player => getName(ctx, player.id)).join('->')}`);
        return seal.ext.newCmdExecuteResult(true);
      }
      default: {
        const game = Game.getData(ext, id);
        game.play(ctx, msg, cmdArgs);
        Game.saveData(ext, id);
        return seal.ext.newCmdExecuteResult(true);
      }
    }
  };
  ext.cmdMap['uno'] = cmdGame;
  ext.cmdMap['UNO'] = cmdGame;
}

main();
