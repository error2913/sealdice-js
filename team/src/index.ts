import { ConfigManager } from "./configManager";
import { TeamManager } from "./teamManager";

function main() {
  // 注册扩展
  let ext = seal.ext.find('team');
  if (!ext) {
    ext = seal.ext.new('team', '错误', '4.0.0');
    seal.ext.register(ext);
  }

  const teamManager = new TeamManager(ext);
  const configManager = new ConfigManager(ext);
  configManager.registerConfig();

  const cmdteam = seal.ext.newCmdItemInfo();
  cmdteam.name = 'team';
  cmdteam.help = `帮助：
【.team bind 队伍名字】绑定/新建队伍
【.team del 队伍名字】删除队伍
【.team del --all】删除所有队伍
【.team del --now】删除当前队伍
【.team lst】队伍列表
【.team add @xx@xxx...】添加若干成员
【.team rm @xx@xxx...】删除若干成员
【.team rm --all】删除所有成员
【.team draw (抽取数量)】随机抽取队伍内成员
【.team call】调查员集结！
【.team show (属性名)】查看属性
【.team st <属性名> <表达式>】修改属性
【.team sort 属性名】对成员的该项属性排序`;
  cmdteam.allowDelegate = true;
  cmdteam.disabledInPrivate = true;
  cmdteam.solve = (ctx, msg, cmdArgs) => {

    ctx.delegateText = ''

    const val = cmdArgs.getArgN(1);
    const id = ctx.group.groupId

    switch (val) {
      case 'b':
      case 'bd':
      case 'bind': {
        const name = cmdArgs.getRestArgsFrom(2);

        if (!name) {
          seal.replyToSender(ctx, msg, "参数错误，【.team bind 队伍名字】绑定/新建队伍")
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
          seal.replyToSender(ctx, msg, "参数错误，【.team del 队伍名字】删除队伍")
          return seal.ext.newCmdExecuteResult(true);
        }

        const nameList = teamManager.delete(id, name, kwargs);
        const reply = nameList.length !== 0 ? configManager.delText(nameList) : configManager.notExistText();

        seal.replyToSender(ctx, msg, reply);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'l':
      case 'lst':
      case 'list': {
        const teamList = teamManager.getTeamList(id);
        const reply = configManager.getListText(teamList);

        seal.replyToSender(ctx, msg, reply);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'a':
      case 'add': {
        let atList = cmdArgs.at
        .filter(item => item.userId !== ctx.endPoint.userId)
        .map(item => item.userId);

        const members = teamManager.add(ctx, atList);
        const reply = configManager.addText(atList.length, members.length);

        seal.replyToSender(ctx, msg, reply);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'r':
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
      case 'c':
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

        const keys = cmdArgs.args.slice();
        keys.splice(0, 1);

        const members = teamManager.show(ctx, keys);
        const reply = configManager.showText(members, keys);

        seal.replyToSender(ctx, msg, reply);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'st':
      case 'set': {
        const teamList = teamManager.getTeamList(id);
        if (teamList[0].members.length === 0) {
          const reply = configManager.emptyText();

          seal.replyToSender(ctx, msg, reply);
          return seal.ext.newCmdExecuteResult(true);
        }

        const key = cmdArgs.getArgN(2);
        const valueText = cmdArgs.getArgN(3);

        if (!key || !valueText) {
          seal.replyToSender(ctx, msg, "参数错误，【.team st <属性名> <表达式>】修改属性")
          return seal.ext.newCmdExecuteResult(true);
        }

        const members = teamManager.set(ctx, key, valueText);
        const reply = configManager.setText(members, key, valueText);

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
          seal.replyToSender(ctx, msg, "参数错误，【.team sort 属性名】对成员的该项属性排序")
          return seal.ext.newCmdExecuteResult(true);
        }

        const members = teamManager.sort(ctx, key);
        const reply = configManager.sortText(members, key);

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

      const members = teamManager.sort(ctx, key);
      const reply = configManager.sortText(members, key);

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
