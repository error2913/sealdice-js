import { Player } from "./player";
import { getPlayerList } from "./playerManager";
import { find, getScoreChart } from "./utils";

export const cache: { [key: string]: Player } = {};

function initPlayers(ext: seal.ExtInfo): void {
  const playerList = getPlayerList(ext);

  playerList.forEach(id => {
    Player.getPlayer(ext, id);
  })
}

function main() {
  // 注册扩展
  let ext = seal.ext.find('animalWorld');
  if (!ext) {
    ext = seal.ext.new('animalWorld', '错误', '1.0.0');
    seal.ext.register(ext);
  }

  initPlayers(ext);

  const cmdAW = seal.ext.newCmdItemInfo();
  cmdAW.name = 'aw';
  cmdAW.help = 'TODO';
  cmdAW.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
      case 'info': {
        const player = Player.getPlayer(ext, ctx.player.userId, ctx);

        //展示词条
        const entries = player.entries;
        const map = {};
        entries.forEach(entry => {
          map[entry] = map[entry] + 1 || 1;
        })
        const entries2 = [];
        for (let entry in map) {
          entries2.push(`${entry}×${map[entry]}`);
        }

        const text = `昵称:<${player.name}>
物种:${player.animal.species} | 年龄:${player.animal.age[0]}/${player.animal.age[1]}
攻击:${player.animal.attr.atk} | 防御:${player.animal.attr.def} | 敏捷:${player.animal.attr.dex}
幸运:${player.animal.attr.lck} | 生命:${player.animal.attr.hp} | 积分:${player.score}
词条:\n${entries2.join('\n')}`

        seal.replyToSender(ctx, msg, text);
        return seal.ext.newCmdExecuteResult(true);
      }
      case '排行榜':
      case 'chart': {
        const scoreChart = getScoreChart();
        if (scoreChart.length == 0) {
          seal.replyToSender(ctx, msg, '暂无记录。');
          return seal.ext.newCmdExecuteResult(true);
        }

        let text = `排行榜\n♚`
        for (let i = 0; i < 10 && i < scoreChart.length; i++) {
          const player = scoreChart[i];
          text += `第${i + 1}名: <${player.name}>  ${player.score}\n`
        }

        seal.replyToSender(ctx, msg, text);
        return seal.ext.newCmdExecuteResult(true);
      }
      case '查询':
      case 'find': {
        const s = cmdArgs.getArgN(2);
        const { animal, env, event, entry } = find(s);
        let text = `查询结果如下:`
        if (animal) {
          text += `\n动物:${animal.info}`;
        }
        if (env) {
          text += `\n环境:${env.info}`;
        }
        if (event) {
          text += `\n事件:${event.info}`;
        }
        if (entry) {
          text += `\n词条:${entry.info}`;
        }

        seal.replyToSender(ctx, msg, text);
        return seal.ext.newCmdExecuteResult(true);
      }
      default: {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
    }
  };
  ext.cmdMap['aw'] = cmdAW;
  ext.cmdMap['阿瓦'] = cmdAW;

  const cmdRevive = seal.ext.newCmdItemInfo();
  cmdRevive.name = 'revive';
  cmdRevive.help = '没有帮助';
  cmdRevive.solve = (ctx, msg, _) => {
    const player = Player.getPlayer(ext, ctx.player.userId, ctx);

    player.revive();
    seal.replyToSender(ctx, msg, `${player.name}转生成了新的动物: ${player.animal.species}`);

    Player.savePlayer(ext, player);
    return seal.ext.newCmdExecuteResult(true);
  };
  ext.cmdMap['revive'] = cmdRevive;
  ext.cmdMap['转生'] = cmdRevive;

  const cmdSurvive = seal.ext.newCmdItemInfo();
  cmdSurvive.name = 'survive';
  cmdSurvive.help = '没有帮助';
  cmdSurvive.solve = (ctx, msg, cmdArgs) => {
    const event = cmdArgs.getArgN(1);
    const player = Player.getPlayer(ext, ctx.player.userId, ctx);

    player.survive(ctx, msg, event);

    Player.savePlayer(ext, player);
    return seal.ext.newCmdExecuteResult(true);
  };
  ext.cmdMap['survive'] = cmdSurvive;
  ext.cmdMap['生存'] = cmdSurvive;

  const cmdExplore = seal.ext.newCmdItemInfo();
  cmdExplore.name = 'explore'; // 指令名字，可用中文
  cmdExplore.help = '';
  cmdExplore.solve = (ctx, msg, _) => {
    const player = Player.getPlayer(ext, ctx.player.userId, ctx);

    player.explore(ctx, msg);

    Player.savePlayer(ext, player);
    return seal.ext.newCmdExecuteResult(true);
  };
  ext.cmdMap['explore'] = cmdExplore;
  ext.cmdMap['探索'] = cmdExplore;

  const cmdMultiply = seal.ext.newCmdItemInfo();
  cmdMultiply.name = 'multiply';
  cmdMultiply.help = '没有帮助';
  cmdMultiply.solve = (ctx, msg, _) => {
    const player = Player.getPlayer(ext, ctx.player.userId, ctx);

    player.multiply(ctx, msg);

    Player.savePlayer(ext, player);
    return seal.ext.newCmdExecuteResult(true);
  };
  ext.cmdMap['multiply'] = cmdMultiply;
  ext.cmdMap['繁衍'] = cmdMultiply;

  const cmdEvolve = seal.ext.newCmdItemInfo();
  cmdEvolve.name = 'evolve';
  cmdEvolve.help = '';
  cmdEvolve.solve = (ctx, msg, _) => {
    const player = Player.getPlayer(ext, ctx.player.userId, ctx);

    player.evolve(ctx, msg);

    Player.savePlayer(ext, player);
    return seal.ext.newCmdExecuteResult(true);
  };
  ext.cmdMap['evolve'] = cmdEvolve;
  ext.cmdMap['进化'] = cmdEvolve;
}

main();