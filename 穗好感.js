// ==UserScript==
// @name         穗好感
// @author       错误(2913949387)
// @version      1.0.0
// @description  
// @timestamp    1718456367
// 2024-06-15 20:59:27
// @license      MIT
// @homepageURL  https://github.com/sealdice/javascript
// ==/UserScript==
// 首先检查是否已经存在
let ext = seal.ext.find('穗');
if (!ext) {
  ext = seal.ext.new('穗', '错误', '1.0.0');
  // 注册扩展
  seal.ext.register(ext);
  const data = JSON.parse(ext.storageGet("data") || '{}')
  const shopnow = JSON.parse(ext.storageGet("shopnow") || '{}')
  const goods = {"食物":["一笼肉馒头","一笼菜馒头","干粮","白菜","萝卜","青鱼","番薯"],"礼物":["拨浪鼓","风车","陶响球"]}

  //添加qq号
  function add(ctx) {
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    if (!data.hasOwnProperty(qq)) {
      data[qq] = {}
      data[qq]["bag"] = {}
      data[qq]["money"] = 0
      data[qq]["walktime"] = 1718456367 * 1000
    }
    data[qq]["favor"] = parseInt(seal.format(ctx, `{$mSuiFavor}`))
    data[qq]["name"] = seal.format(ctx, `{$tQQ昵称}`)
  }
  //抽取货物添加到shoplst
  function addgoodtoshop(shoplst, level, max, min) {
    let a
    for (let i = 0; i < Math.ceil(goods[level].length / 2); i++) {
      a = goods[level][Math.floor(Math.random() * goods[level].length)]
      if (a=="番薯" && Math.random()>0.1){
        a = goods[level][Math.floor(Math.random() * goods[level].length)]
      }
      while (shoplst.hasOwnProperty(a)) {
        a = goods[level][Math.floor(Math.random() * goods[level].length)]
      }
      shoplst[a] = { "price": Math.floor(Math.random() * (max - min + 1)) + min, "rest": Math.ceil(Math.random() * 5) }
    }
  }
  //更新市集
  function updateshop() {
    let shoplst = {}
    addgoodtoshop(shoplst,"食物",50,40)
    addgoodtoshop(shoplst,"礼物",300,200)
    return shoplst
  }
  //生成市集
  function shop(date) {
    let obj = {}
    if (shopnow.hasOwnProperty("date") == false || shopnow["date"] != date) {
      obj = updateshop()
      shopnow["date"] = date
      shopnow["goods"] = obj
    }
    else { obj = shopnow["goods"] }
    ext.storageSet("shopnow", JSON.stringify(shopnow))

    let shoplst = Object.keys(obj)
    let text = "今天市集上有"
    for (let i = 0; i < shoplst.length; i++) {
      text += "\n" + shoplst[i] + ":" + obj[shoplst[i]]["price"] + "文 剩余:" + obj[shoplst[i]]["rest"]
    }
    return text
  }

  const cmdChart = seal.ext.newCmdItemInfo();
  cmdChart.name = "好感排行榜";
  cmdChart.help = "指令：.好感排行榜";
  cmdChart.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        add(ctx)
        const qq = seal.format(ctx, "{$t账号ID_RAW}")

        let favor = {}
        for (let qq of Object.keys(data)) {
          favor[qq] = data[qq]["favor"]
        }
        let arr = Object.keys(favor).sort(function (a, b) { return favor[b] - favor[a] })
        let title = `排行榜\n♚`
        for (let i = 0; i < arr.length; i++) {
          if (i == 10) { break }
          let qq = arr[i]
          title += `第${i + 1}名：\n${data[qq]["name"]} ${favor[qq]}\n`
        }
        title += `我的好感：${data[qq]["favor"]}`

        seal.replyToSender(ctx, msg, title)
        return;
      }
    }
  }

  const cmdbag = seal.ext.newCmdItemInfo();
  cmdbag.name = "查看行囊";
  cmdbag.help = "指令：.查看行囊";
  cmdbag.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        add(ctx)
        const qq = seal.format(ctx, "{$t账号ID_RAW}")

        let money = data[qq]["money"]
        let arr = Object.keys(data[qq]["bag"])

        //计算货物数量
        let goodsnum = 0
        for (let good in data[qq]["bag"]) {
          goodsnum += data[qq]["bag"][good]
        }

        text = `${data[qq]["name"]}的行囊：\n钱数：${money}文\n物品数量:${goodsnum}`
        for (let i = 0; i < arr.length; i++) {
          if (data[qq]["bag"][arr[i]] != 0) {
            text += `\n${arr[i]}×${data[qq]["bag"][arr[i]]}`
          }
        }
        seal.replyToSender(ctx, msg, text)
        return;
      }
    }
  }

  /*const cmdwalk = seal.ext.newCmdItemInfo();
  cmdwalk.name = "闲逛";
  cmdwalk.help = "指令：.闲逛";
  cmdwalk.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        add(ctx)
        const qq = seal.format(ctx, "{$t账号ID_RAW}")
        const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000

        if (now - data[qq]["walktime"] < 20 * 1000) {
          return;
        }

        let ran = Math.random()
        data[qq]["walktime"] = now
        if (ran<=0.5){
          data[qq]["money"] += 100
          ext.storageSet("data", JSON.stringify(data))
          seal.replyToSender(ctx, msg, `捡到钱`)
          return;
        }
        if (ran>0.5){
          data[qq]["money"] -= 100
          ext.storageSet("data", JSON.stringify(data))
          seal.replyToSender(ctx, msg, `钱没啦`)
          return;
        }
      }
    }
  }*/

  const cmdsignin = seal.ext.newCmdItemInfo();
  cmdsignin.name = "签到";
  cmdsignin.help = "指令：.签到";
  cmdsignin.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        add(ctx)
        const qq = seal.format(ctx, "{$t账号ID_RAW}")
        const date = parseInt(seal.format(ctx, "{$tDate}"))
        let sign = parseInt(seal.format(ctx, "{$msign}"))

        if (sign == date){
          seal.replyToSender(ctx, msg, `${data[qq]["name"]}爷今天已经签到过啦`)
          return;
        }
        else{
          seal.format(ctx, "{$msign=$tDate}")
          let signtime = seal.format(ctx, "{$msigntime=$msigntime+1}")
          let increase = Math.floor(Math.random()*(150 - 70 + 1))+70
          data[qq]["money"] += increase
          ext.storageSet("data", JSON.stringify(data))
          seal.replyToSender(ctx, msg, `${data[qq]["name"]}爷签到成功！获得了${increase}文，累计签到${signtime}次`)
          return;
        }
      }
    }
  }

  const cmdmarket = seal.ext.newCmdItemInfo();
  cmdmarket.name = "市集";
  cmdmarket.help = "指令：.市集";
  cmdmarket.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        add(ctx)
        const qq = seal.format(ctx, "{$t账号ID_RAW}")
        const date = seal.format(ctx, "{$tDate}")
        let text = shop(date)
        seal.replyToSender(ctx, msg, text + `\n${data[qq]["name"]}目前有${data[qq]["money"]}文。`)
      }
    }
  }

  const cmdbuy = seal.ext.newCmdItemInfo();
  cmdbuy.name = "买";
  cmdbuy.help = "指令：.买 名称";
  cmdbuy.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
      case "":
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        add(ctx)
        const qq = seal.format(ctx, "{$t账号ID_RAW}")
        const date = seal.format(ctx, "{$tDate}")

        let money = data[qq]["money"]
        let kawaiiisuisui = shop(date)
        //没有这玩意
        if (!shopnow["goods"].hasOwnProperty(val)) {
          seal.replyToSender(ctx, msg, `没有在售。`)
          return;
        }
        //剩余数量不足
        if (shopnow["goods"][val]["rest"] <= 0) {
          seal.replyToSender(ctx, msg, `${val}已经卖光啦！`)
          return;
        }
        //钱不够
        let price = shopnow["goods"][val]["price"]
        if (price > money) {
          seal.replyToSender(ctx, msg, `钱不够呢。`)
          return;
        }

        data[qq]["money"] = money - price
        if (!data[qq]["bag"].hasOwnProperty(val)) { data[qq]["bag"][val] = 1 }
        else { data[qq]["bag"][val] += 1 }
        shopnow["goods"][val]["rest"] -= 1

        ext.storageSet("data", JSON.stringify(data))
        seal.replyToSender(ctx, msg, `${data[qq]["name"]}花费了${price}文，买到了${val}。`)
        return;
      }
    }
  }

  const cmdgiv = seal.ext.newCmdItemInfo();
  cmdgiv.name = "赠予";
  cmdgiv.help = "指令：.赠予";
  cmdgiv.allowDelegate = true;
  cmdgiv.solve = (ctx, msg, cmdArgs) => {
    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    let val = cmdArgs.getArgN(1);
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        add(ctx)
        const qq = seal.format(ctx, "{$t账号ID_RAW}")

        let anotherPeople = mctx.player.userId
        let anotherqq = anotherPeople.replace(/\D+/g, "")
        if (qq == anotherqq) {
          seal.replyToSender(ctx, msg, `那么你送给了你自己。`)
          return;
        }
        add(mctx)

        if (!data[qq]["bag"].hasOwnProperty(val)) {
          seal.replyToSender(ctx, msg, "行囊中没有此物品。")
          return;
        }

        if (!data[anotherqq]["bag"].hasOwnProperty(val)) { data[anotherqq]["bag"][val] = 1 }
        else { data[anotherqq]["bag"][val] += 1 }

        data[qq]["bag"][val] -= 1
        if (data[qq]["bag"][val] == 0) {
          delete data[qq]["bag"][val];
        }
        ext.storageSet("data", JSON.stringify(data))
        seal.replyToSender(ctx, msg, `${data[qq]["name"]}送给了${data[anotherqq]["name"]}一件${val}`)
        return;
      }
    }
  }

  const cmdCheat = seal.ext.newCmdItemInfo();
  cmdCheat.name = "cheat";
  cmdCheat.help = "指令：.cheat";
  cmdCheat.allowDelegate = true;
  cmdCheat.solve = (ctx, msg, cmdArgs) => {
    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    let val = cmdArgs.getArgN(1);
    let val2 = cmdArgs.getArgN(2);

    switch (val) {
      case "":
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        if (ctx.privilegeLevel != 100) {
          return;
        }
        add(mctx)
        let anotherPeople = mctx.player.userId
        const qq = anotherPeople.replace(/\D+/g, "")
        const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000

        //需要一个参数
        if (!val) {
          seal.replyToSender(ctx, msg, `参数错误`)
          return;
        }
        /*if (val == "del") {
          for (let i in attrb) { delete attrb[i] }
          for (let i in places) { delete places[i] }
          for (let i in cults) { delete cults[i] }
          for (let i in weaponnow) { delete weaponnow[i] }
          ext.storageSet("attrb", JSON.stringify(attrb))
          ext.storageSet("places", JSON.stringify(places))
          ext.storageSet("cults", JSON.stringify(cults))
          ext.storageSet("weaponnow", JSON.stringify(weaponnow))
          seal.replyToSender(ctx, msg, `成功！`)
          return;
        }*/
        if (val == "刷新市集") {
          delete shopnow["date"]
          seal.replyToSender(ctx, msg, `成功！`)
          return;
        }
        /*if (val == "保释") {
          //关进医院时间
          attrb[qq]["healtime"] = 1717065841 * 1000
          //被抓时间
          attrb[qq]["policetime"] = 1717065841 * 1000
          updating()
          seal.replyToSender(ctx, msg, `成功！`)
          return;
        }*/

        //需要两个参数
        if (!val2) {
          seal.replyToSender(ctx, msg, `.cheat xxx xxx`)
          return;
        }
        if (val == "money") {
          data[qq]["money"] = parseInt(val2)
          ext.storageSet("data", JSON.stringify(data))
          seal.replyToSender(ctx, msg, `成功！`)
          return;
        }
        if (val == "favor") {
          data[qq]["favor"] = parseInt(val2)
          ext.storageSet("data", JSON.stringify(data))
          seal.replyToSender(ctx, msg, `成功！`)
          return;
        }
        /*if (val == "加时") {
          //被抓时间
          attrb[qq]["policetime"] += parseInt(val2) * 60 * 1000
          updating()
          ext.storageSet("data", JSON.stringify(data))
          seal.replyToSender(ctx, msg, `成功！`)
          return;
        }*/
        //修改背包物品
        data[qq]["bag"][val] = parseInt(val2)
        if (data[qq]["bag"][val] == 0) { delete attrb[qq]["goods"][val]; }
        ext.storageSet("data", JSON.stringify(data))
        seal.replyToSender(ctx, msg, `成功！`)
        return;
      }
    }
  }

  ext.onNotCommandReceived = (ctx, msg) => {
    let message = msg.message;
    add(ctx)
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    /*/投喂
    let food = message.match(/^投喂满穗(.*)/)
    if (food) {
      if (!food[1]) {
        seal.replyToSender(ctx, msg, `欸？要给我吃什么？`);
        return seal.ext.newCmdExecuteResult(true);
      }
      if (!data[qq]["bag"].hasOwnProperty(food[1])) {
        seal.replyToSender(ctx, msg, `${data[qq]["name"]}行囊里没有这东西`);
        return seal.ext.newCmdExecuteResult(true);
      }
      let index = goods["食物"].indexOf(food[1])
      if (index == -1) {
        seal.replyToSender(ctx, msg, `这个不能吃！`);
        return seal.ext.newCmdExecuteResult(true);
      }
      data[qq]["bag"][food[1]] -= 1
      if (data[qq]["bag"][food[1]] == 0) {
        delete data[qq]["bag"][food[1]];
      }
      ext.storageSet("data", JSON.stringify(data))
      seal.replyToSender(ctx, msg, `好吃`);
      return seal.ext.newCmdExecuteResult(true);
    }*/
    //送礼
    let gift = message.match(/^送给满穗(.*)/)
    if (gift) {
      if (!gift[1]) {
        seal.replyToSender(ctx, msg, `欸？${data[qq]["name"]}爷要送什么给我？`);
        return seal.ext.newCmdExecuteResult(true);
      }
      if (!data[qq]["bag"].hasOwnProperty(gift[1])) {
        seal.replyToSender(ctx, msg, `${data[qq]["name"]}的行囊里没有这东西`);
        return seal.ext.newCmdExecuteResult(true);
      }
      data[qq]["bag"][gift[1]] -= 1
      if (data[qq]["bag"][gift[1]] == 0) {
        delete data[qq]["bag"][gift[1]];
      }
      ext.storageSet("data", JSON.stringify(data))

      let index = goods["礼物"].indexOf(gift[1])
      if (index == -1) {
        if (gift[1] == "番薯"){
          seal.replyToSender(ctx, msg, seal.format(ctx,`是番薯！……那、快烤了一起分了吧！没想到这么稀罕的东西${data[qq]["name"]}爷竟然能找到，好厉害呀~\n好感度+{$tran=1d20}={$mSuiFavor=$mSuiFavor+$tran}`));
          data[qq]["favor"] = parseInt(seal.format(ctx, `{$mSuiFavor}`))
          return seal.ext.newCmdExecuteResult(true);
        }
        seal.replyToSender(ctx, msg, seal.format(ctx,`是${gift[1]}啊，${data[qq]["name"]}爷不吃吗？\n好感度+{$tran=1d6}={$mSuiFavor=$mSuiFavor+$tran}`));
        data[qq]["favor"] = parseInt(seal.format(ctx, `{$mSuiFavor}`))
        return seal.ext.newCmdExecuteResult(true);
      }
      seal.replyToSender(ctx, msg, seal.format(ctx,`哇，是${gift[1]}呢，嘿嘿~谢谢${data[qq]["name"]}爷！\n好感度+{$tran=1d10}={$mSuiFavor=$mSuiFavor+$tran}`));
      data[qq]["favor"] = parseInt(seal.format(ctx, `{$mSuiFavor}`))
      return seal.ext.newCmdExecuteResult(true);
    }
  }
  //ext.cmdMap[''] = cmd;
  ext.cmdMap['好感排行榜'] = cmdChart;
  ext.cmdMap['市集'] = cmdmarket;
  ext.cmdMap['查看行囊'] = cmdbag;
  ext.cmdMap['行囊'] = cmdbag;
  ext.cmdMap['买'] = cmdbuy;
  ext.cmdMap['cheat'] = cmdCheat;
  ext.cmdMap['赠予'] = cmdgiv;
  ext.cmdMap['签到'] = cmdsignin;
}