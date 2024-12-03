import { ConfigManager } from "./configManager";
import { TeamManager } from "./teamManager";

function main() {
  // 注册扩展
  let ext = seal.ext.find('team');
  if (!ext) {
    ext = seal.ext.new('team', '错误', '4.0.2');
    seal.ext.register(ext);
  }

  const teamManager = new TeamManager(ext);
  const configManager = new ConfigManager(ext);
  configManager.registerConfig();

  const cmdteam = seal.ext.newCmdItemInfo();
  cmdteam.name = 'team';
  cmdteam.help = `帮助：
【.team bind <队伍名字>】绑定/新建队伍
【.team del <队伍名字>】删除队伍
【.team del --all】删除所有队伍
【.team del --now】删除当前队伍
【.team list】查看队伍列表
【.team add ...@玩家】添加若干成员
【.team rm ...@玩家】删除若干成员
【.team rm --all】删除所有成员
【.team draw <抽取数量=1>】随机抽取队伍内成员
【.team call】限时呼叫队内成员
【.team show ...<属性名>】查看队内成员属性
【.team st <属性名> <表达式>】修改队内成员属性
【.team sort <属性名>】对队内成员属性进行排序`;
  cmdteam.allowDelegate = true;
  cmdteam.disabledInPrivate = true;
  cmdteam.solve = (ctx, msg, cmdArgs) => {

    ctx.delegateText = ''

    const val = cmdArgs.getArgN(1);
    const id = ctx.group.groupId

    switch (val) {
      case 'bd':
      case 'bind': {
        const name = cmdArgs.getRestArgsFrom(2);

        if (!name) {
          seal.replyToSender(ctx, msg, "提示:【.team bind <队伍名字>】队伍名字缺失");
          return seal.ext.newCmdExecuteResult(true);
        }

        const result = teamManager.bind(id, name);
        const reply = result ? configManager.bindText(name) : configManager.createText(name);

        seal.replyToSender(ctx, msg, reply);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'del':
      case 'delete': {
        const name = cmdArgs.getRestArgsFrom(2);
        const kwargs = cmdArgs.kwargs;

        if (!name && kwargs.length == 0) {
          seal.replyToSender(ctx, msg, "提示:【.team del <队伍名字>】队伍名字缺失");
          return seal.ext.newCmdExecuteResult(true);
        }

        const nameList = teamManager.delete(id, name, kwargs);
        const reply = nameList.length !== 0 ? configManager.delText(nameList) : configManager.notExistText();

        seal.replyToSender(ctx, msg, reply);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'lst':
      case 'list': {
        const teamList = teamManager.getTeamList(id);
        const reply = configManager.getListText(teamList);

        seal.replyToSender(ctx, msg, reply);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'add': {
        let atList = cmdArgs.at
        .filter(item => item.userId !== ctx.endPoint.userId)
        .map(item => item.userId);

        const members = teamManager.add(ctx, atList);
        const reply = configManager.addText(atList.length, members.length);

        seal.replyToSender(ctx, msg, reply);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'rm':
      case 'remove': {
        let atList = cmdArgs.at
        .filter(item => item.userId !== ctx.endPoint.userId)
        .map(item => item.userId);

        const kwargs = cmdArgs.kwargs;
        const members = teamManager.remove(ctx, atList, kwargs);
        const reply = configManager.removeText(atList.length, members.length);

        seal.replyToSender(ctx, msg, reply);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'draw': {
        const teamList = teamManager.getTeamList(id);
        if (teamList[0].members.length === 0) {
          const reply = configManager.emptyText();

          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }

        let num = parseInt(cmdArgs.getArgN(2));
        if (isNaN(num) || num < 1) {
          num = 1;
        }

        const nameList = teamManager.draw(ctx, num);
        const reply = configManager.drawText(nameList);

        seal.replyToSender(ctx, msg, reply);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'call': {
        const teamList = teamManager.getTeamList(id);
        if (teamList[0].members.length === 0) {
          const reply = configManager.emptyText();

          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }

        const [callList, isCalling] = teamManager.call(ctx);
        
        if (isCalling) {
          const reply = configManager.isCallingText();

          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }

        const reply = configManager.callText(callList);

        seal.replyToSender(ctx, msg, reply);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'show': {
        const teamList = teamManager.getTeamList(id);
        if (teamList[0].members.length === 0) {
          const reply = configManager.emptyText();

          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }

        const keys = cmdArgs.args.slice(1);

        const mis = teamManager.show(ctx, keys);
        const reply = configManager.showText(mis, keys);

        seal.replyToSender(ctx, msg, reply);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'st': {
        const teamList = teamManager.getTeamList(id);
        if (teamList[0].members.length === 0) {
          const reply = configManager.emptyText();

          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }

        const key = cmdArgs.getArgN(2);
        const valueText = cmdArgs.getArgN(3);

        if (!valueText) {
          seal.replyToSender(ctx, msg, "提示:【.team st <属性名> <表达式>】表达式缺失");
          return seal.ext.newCmdExecuteResult(true);
        }

        const mis = teamManager.set(ctx, key, valueText);
        const reply = configManager.setText(mis, key, valueText);

        seal.replyToSender(ctx, msg, reply);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'sort': {
        const teamList = teamManager.getTeamList(id);
        if (teamList[0].members.length === 0) {
          const reply = configManager.emptyText();

          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }

        const key = cmdArgs.getArgN(2);

        if (!key) {
          seal.replyToSender(ctx, msg, "提示:【.team sort 属性名】属性名缺失");
          return seal.ext.newCmdExecuteResult(true);
        }

        const mis = teamManager.sort(ctx, key);
        const reply = configManager.sortText(mis, key);

        seal.replyToSender(ctx, msg, reply);
        return seal.ext.newCmdExecuteResult(true);
      }
      default: {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
    }
  };

  ext.onNotCommandReceived = (ctx, msg) => {
    if (ctx.isPrivate) return;
    const message = msg.message

    const sortWords = seal.ext.getTemplateConfig(ext, "战斗轮排序关键词")
    const signWords = seal.ext.getTemplateConfig(ext, "签到关键词")

    if (signWords.includes(message)) {
      teamManager.signUp(ctx);
      return;
    }
    if (sortWords.includes(message)) {
      const id = ctx.group.groupId;
      const teamList = teamManager.getTeamList(id);
      if (teamList[0].members.length === 0) {
        const reply = configManager.emptyText();

        seal.replyToSender(ctx, msg, reply);
        return;
      }

      const key = 'dex';

      const mis = teamManager.sort(ctx, key);
      const reply = configManager.sortText(mis, key);

      seal.replyToSender(ctx, msg, reply);
      return;
    }
  }

  // 将命令注册到扩展中
  ext.cmdMap['team'] = cmdteam;
  ext.cmdMap['tm'] = cmdteam;
  globalThis.teamManager = teamManager;
}

main();
