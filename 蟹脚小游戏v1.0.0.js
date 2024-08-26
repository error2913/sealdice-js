// ==UserScript==
// @name         蟹脚小游戏
// @author       错误(2913949387)
// @version      1.0.0
// @description  发送 .加入 姓名 性别 教团 开始游戏，使用指令.cult查看游戏指引，使用指令.cult master查看骰主指令
// @timestamp    1717065841
// 2024-05-30 18:44:01
// @license      MIT
// @homepageURL  https://github.com/sealdice/javascript
// ==/UserScript==
// 首先检查是否已经存在
//部分指令参考了星界佬佬的诡秘游戏
let ext = seal.ext.find('蟹脚小游戏');
if (!ext) {
  // 不存在，那么建立扩展
  ext = seal.ext.new('蟹脚小游戏', '错误', '1.0.0');
  // 注册扩展
  seal.ext.register(ext);
  seal.ext.registerIntConfig(ext, "指令间隔/s(抢劫)", 30)
  seal.ext.registerIntConfig(ext, "指令间隔/s(前往)", 30)
  seal.ext.registerIntConfig(ext, "指令间隔/s(逛逛)", 30)
  seal.ext.registerIntConfig(ext, "指令间隔/s(强行越狱)", 60)
  const lead = `游戏指引：\n今日商店、 查看背包、 前往、 注销、 购入、 售出、 个人信息、 武器商店、 买武器、 发展信众、 教团信息、 逛逛、 抢劫、 翻垃圾、 排行榜、 情报、 行情、 散播、 清空背包、 改名、 献祭、 送、 成就、 使用、 转账`
  const attrb = JSON.parse(ext.storageGet("attrb") || '{}')
  const places = JSON.parse(ext.storageGet("places") || '{}')
  const cults = JSON.parse(ext.storageGet("cults") || '{}')
  const weaponnow = JSON.parse(ext.storageGet("weaponnow") || '{}')
  //所有地点和教团的一个数组（都可以改、但最好使用指令 .写 del 清除下数据，不然可能会有bug（清除完最后重新装一次不然可能还会有bug
  const allplaces = ["阿卡姆", "金斯波特", "印斯茅斯", "南极营地", "拉莱耶", "乌撒", "无名之城"]//乱写的
  const allcults = ["大衮密令教", "黄印兄弟会", "银色暮光密教", "血腥之舌", "不灭之炎的奴仆"]
  //教团对应的邪神
  const cultgods = { "大衮密令教": ["父神大衮", "母神海德拉", "天父克苏鲁"], "黄印兄弟会": ["黄衣之王哈斯塔"], "银色暮光密教": ["克苏鲁", "犹格索托斯", "奈亚拉托提普"], "血腥之舌": ["奈亚拉托提普"], "不灭之炎的奴仆": ["活火焰克图格亚"] }
  //入教宣誓————懒了不搞了，先摆在这里
  const cultpledge = {
    "大衮密令教": 'Ia!Dagon!我，${attrb[qq]["name"]}，庄严宣誓，我不会妨碍或将深潜者的行动告知他人。我若离弃这誓言，就必被人所讳避，我将被判作不配得大衮宠爱之人，并接受所定的一切惩罚，即便是死。Ia!Dagon!',
    "黄印兄弟会": ``,
    "银色暮光密教": ``,
    "血腥之舌": ``
  }
  //成就列表，没什么用只是写在这里防止忘记
  const achieves = ["『留下买路财』", "『第一桶金』", "『目无法纪』", "『插翅难逃』", "『孩子你无敌了』", "『冤大头』", "『失信、执行！』", "『时间差不多咯~』", "『金色传说！』"]
  //一些文本
  let culttexttmp = ""
  for (let cult of allcults) { culttexttmp += cult + "、" }
  const culttext = culttexttmp.slice(0, -1)
  let placetexttmp = ""
  for (let place of allplaces) { placetexttmp += place + "、" }
  const placetext = placetexttmp.slice(0, -1)
  //初始化————
  for (let cult of allcults) {
    if (!cults.hasOwnProperty(cult)) { cults[cult] = {} }
    if (!cults[cult].hasOwnProperty("members")) { cults[cult]["members"] = []; }
    if (!cults[cult].hasOwnProperty("seeing")) { cults[cult]["seeing"] = {}; }
  }
  for (let cult in cultgods) {
    for (let god of cultgods[cult]) {
      if (!cults[cult]["seeing"].hasOwnProperty(god)) { cults[cult]["seeing"][god] = 0 }
    }
  }
  for (let place of allplaces) {
    if (!places.hasOwnProperty(place)) { places[place] = {} }
    if (!places[place].hasOwnProperty("members")) { places[place]["members"] = []; }
    if (!places[place].hasOwnProperty("says")) { places[place]["says"] = []; }
  }

  //货物列表
  const goods = {
    "灰": ["手电筒", "提灯", "土豆", "皮下注射器", "阿司匹林", "女士内衣", "男士内裤", "婴儿奶嘴", "防水火柴", "致死镜", "米纳尔的星石", "羊皮纸"],
    "蓝": ["铅蓄电池", "留声机唱片", "胶卷", "警用手铐", "潜水服", "医用威士忌", "黄铜头像", "瑟德夫卡之像", "梦境结晶器", "书写专用血液"],
    "紫": ["灵魂精盐", "医用血包", "雷明顿牌打字机", "11.43mm自动手枪子弹", "雪茄", "翡翠小像", "盖尔之镜", "月之透镜"],
    "金": ["夏塔克鸟蛋", "缸中之脑", "黄金蜂蜜酒", "伊波恩戒指", "格拉基启示录残卷", "银之匙", "透特的匕首"],
    "红": ["不明的乳汁", "奇怪多面体", "阿尔哈兹莱德之灯", "光辉的偏方三八面体", "拉莱耶圆盘"]
  }
  //武器列表
  const weaponlst = {
    "弓箭": 20, "黄铜指虎": 20, "长鞭": 15, "燃烧的火把": 20, "电锯": 40, "甩棍": 30, "大头棍": 30, "护身棒": 30,
    "棒球棍": 30, "板球棒": 30, "拨火棍": 30, "警棍": 20, "弩": 30, "绞具": 40, "手斧": 30, "镰刀": 30, "甘蔗刀": 30, "切肉菜刀": 30, "弹簧折叠刀": 20, "220v通电导线": 45,
    "催泪瓦斯": 5, "双节棍": 30, "投石": 15, "手里剑": 15, "矛": 25, "骑士长枪": 25, "投矛": 25, "马刀": 35, "佩剑": 30, "重剑": 30, "花剑": 20, "剑杖": 20, "电棍": 15, "电击枪": 15,
    "战斗回力镖": 25, "伐木斧": 35, "燧发枪": 20, "5.6mm小型自动手枪": 15, "6.35mm短口手枪": 15, "7.65mm左轮手枪": 20, "7.65mm自动手枪": 20,
    "马格南左轮": 30, "9mm左轮手枪": 25, "9mm自动手枪": 25, "贝瑞塔M9": 25, "9mm格洛克17": 25, "9mm鲁格P08": 25, "10.4mm左轮手枪": 25,
    "11.2mm马格南左轮手枪": 45, "11.43mm左轮手枪": 35, "11.43mm自动手枪": 35, "IMI沙漠之鹰": 55, "14.7mm春田步枪": 45,
    "5.6mm栓式枪机步枪": 20, "7.62mm杠杆式枪机步枪": 30, "马提尼·亨利步枪": 50, "莫兰上校的气动步枪": 35, "加兰德M1步枪": 50, "加兰德M2步枪": 50,
    "SKS半自动步枪": 35, "7.7mm李·恩菲尔德": 50, "7.62mm栓式枪机步枪": 50, "7.62mm半自动步枪": 50, "11.28mm马林步枪": 60,
    "猎象枪": 65, "20号霰弹枪": 30, "16号霰弹枪": 40, "12号霰弹枪": 60, "12号霰弹枪(泵动)": 60, "12号霰弹枪(半自动)": 60, "12号霰弹枪(锯短)": 60, "10号霰弹枪": 70,
    "12号贝里尼M3": 60, "12号SPAS": 60, "AKM": 35, "AK-74": 35, "巴雷特M82": 100,
    "FN-FAL": 80, "加利尔突击步枪": 60, "M16A2": 60, "M4": 60, "斯泰尔AUG": 60, "贝雷塔M70": 60, "MP18I": 25, "MP28II": 25, "MP5": 25, "MAC-11": 25,
    "蝎式冲锋枪": 20, "汤普森冲锋枪": 35, "乌兹微型冲锋枪": 25, "1882年式加特林": 80, "M1918式勃朗宁自动步枪": 80, "勃朗宁M1917A1": 80,
    "布伦轻机枪": 80, "路易斯Ⅰ型机枪": 80, "GE-M134式7.62mm速射机枪": 80, "FN米尼米(5.56mm)": 60, "维克斯.303机枪": 80,
    "莫洛托夫燃烧瓶": 65, "信号弹枪": 40, "M79-40mm榴弹发射器": 75,
    "81mm迫击炮": 150, "75mm野战火炮": 250, "120mm坦克炮": 250, "5英寸舰载炮": 375, "火焰喷射器": 65, "M72式单发轻型反坦克炮": 200
  }
  //载具列表
  const carlst = {
    "二手别克": 75, "诺顿摩托车": 95, "二手雪佛兰 F.B. 轿车": 300, "福特 T 型车": 360, "福特 A 型车": 450, "福特 TT 卡车": 490,
    "法国雷诺 AX": 500, "雪佛兰皮卡": 545, "雪佛兰敞篷车": 570, "雪佛兰 Capitol": 695, "庞帝克 6-28": 745,
    "法国雪铁龙 C3": 800, "道奇 S/1": 985, "斯图贝克独裁者": 995, "斯图贝克房车": 995,
    "别克 D-45": 1020, "克莱斯勒 F-58": 1045, "道奇半吨小卡车": 1085, "德国宝马迪克西": 1225, "奥兹摩比 43-AT": 1345, "哈德森面包车": 1450, "哈德孙 Super Six": 1750,
    "凯迪拉克 55": 2240, "帕卡德双六缸房车": 2950, "西班牙希斯帕诺- 苏扎 阿方索": 4000, "意大利蓝旗亚 兰姆达214": 4050, "皮尔斯箭": 6000, "英国劳斯莱斯：银魅": 6750,
    "德国梅塞迪斯- 奔驰 SS": 7750, "英国宾利 3 升型": 9000, "英国劳斯莱斯：幻影Ⅰ型": 10800, "杜森堡 J 型车": 20000
  }
  //神话生物列表
  const myths = ["食尸鬼", "古老者", "恐怖猎手", "空鬼", "蛇人", "深潜者", "修格斯", "星之彩", "炎之精", "钻地魔虫", "拜亚基", "蠕行者", "黑山羊幼崽",
    "飞天水螅", "廷达罗斯猎犬", "米戈", "夏盖虫族", "星之眷属", "无形之子"
  ]
  //神话生物前缀
  const mythwords = [
    "正在觅食的", "不可名状的", "完全无害的", "忸怩作态的",
    "悄无声息的", "狂暴无比的", "优雅飘逸的", "笨拙可爱的",
    "神秘莫测的", "慢吞吞的", "迅速闪电的", "悲伤落泪的",
    "愤怒咆哮的", "喜悦洋溢的", "好奇探索的", "疯狂狂乱的",
    "慎重考虑的", "大胆无畏的", "恐惧颤抖的", "勇敢无畏的",
    "狡猾多诈的", "忠诚不渝的", "胆小怕事的", "坚定不移的",
    "犹豫不决的", "冷静自若的", "热情奔放的", "冷漠无情的",
    "激动万分的", "平静如水的", "悠闲自得的", "紧张兮兮的",
    "专注致志的", "分心忘我的", "愚蠢无知的", "聪明伶俐的",
    "懒散无力的", "勤奋努力的", "贪婪无厌的", "慷慨大方的",
    "自私自利的", "无私奉献的", "虚荣心强的", "谦逊低调的",
    "傲慢自大的", "谨慎小心的", "鲁莽冲动的", "快乐欢喜的",
    "悲观失望的", "乐观向上的", "顽固不化的", "灵活多变的",
    "随意随性的"
  ]
  //根据用户性别来判断称呼
  function call(qq) {
    if (attrb[qq]["sex"] == "男") {
      return "他"
    } else {
      return "她"
    }
  }
  //抽取货物添加到shoplst[place]
  function addgoodtoshop(shoplst_place, level, max, min) {
    let a
    for (let i = 0; i < Math.ceil(goods[level].length / 2); i++) {
      a = goods[level][Math.floor(Math.random() * goods[level].length)]
      while (shoplst_place.hasOwnProperty(a)) {
        a = goods[level][Math.floor(Math.random() * goods[level].length)]
      }
      shoplst_place[a] = Math.floor(Math.random() * (max - min + 1)) + min
    }
  }
  //更新当地商店
  function updateshop(place) {
    let shoplst = {}
    shoplst[place] = {}
    addgoodtoshop(shoplst[place], "灰", 13, 10)
    addgoodtoshop(shoplst[place], "蓝", 75, 50)
    addgoodtoshop(shoplst[place], "紫", 438, 250)
    if (Math.random() < 0.5) { addgoodtoshop(shoplst[place], "金", 2500, 1250) }
    if (Math.random() < 0.2) { addgoodtoshop(shoplst[place], "红", 18750, 6250) }
    return shoplst[place]
  }
  //生成当地商店
  function shop(date, place) {
    let obj
    if (places[place].hasOwnProperty("date") == false || places[place]["date"] != date) {
      obj = updateshop(place)
      places[place]["date"] = date
      places[place]["goods"] = obj
    } else {
      obj = places[place]["goods"]
    }
    ext.storageSet("places", JSON.stringify(places))

    let shoplst = Object.keys(obj)
    let text = place + "的商品如下"
    let arr = []
    for (let i = 0; i < shoplst.length; i++) {
      if (arr.length % 2 == 0) {
        text += "\n"
      } else {
        text += "｜"
      }
      text += shoplst[i] + ":$" + obj[shoplst[i]]
      arr.push(shoplst[i])
    }
    return text
  }
  //更新教团信息和地点……信息，感觉还能优化啊
  function updating(cultmember = false, placemember = false) {
    if (cultmember) {
      for (let cult of allcults) { cults[cult]["members"] = [] }
      for (let qq in attrb) {
        let belong = attrb[qq]["belong"]
        cults[belong]["members"].push(qq)
      }
    }
    if (placemember) {
      for (let place of allplaces) { places[place]["members"] = [] }
      for (let qq in attrb) {
        let place = attrb[qq]["place"]
        places[place]["members"].push(qq)
      }
    }
    ext.storageSet("attrb", JSON.stringify(attrb))
    ext.storageSet("places", JSON.stringify(places))
    ext.storageSet("cults", JSON.stringify(cults))
    ext.storageSet("weaponnow", JSON.stringify(weaponnow))
  }
  //更新武器商店
  function updateweapon() {
    let shoplst = {}
    let weapon = ""
    let weapons = Object.keys(weaponlst)
    for (let i = 0; i < 5; i++) {
      weapon = weapons[Math.floor(Math.random() * weapons.length)]
      while (shoplst.hasOwnProperty(weapon)) {
        weapon = weapons[Math.floor(Math.random() * weapons.length)]
      }
      shoplst[weapon] = { "price": Math.ceil(Math.pow(1.2, weaponlst[weapon] / 5) * 15), "rest": Math.ceil(Math.random() * 2) }
    }
    return shoplst
  }
  //生成武器商店
  function weaponshop(date) {
    let obj = {}
    if (weaponnow.hasOwnProperty("date") == false || weaponnow["date"] != date) {
      obj = updateweapon()
      weaponnow["date"] = date
      weaponnow["goods"] = obj
    }
    else { obj = weaponnow["goods"] }
    ext.storageSet("weaponnow", JSON.stringify(weaponnow))

    let shoplst = Object.keys(obj)
    let text = "今天销售的武器如下"
    for (let i = 0; i < shoplst.length; i++) {
      text += "\n" + shoplst[i] + ":$" + obj[shoplst[i]]["price"] + " 剩余:" + obj[shoplst[i]]["rest"]
    }
    return text
  }
  //检查san值并判断，返回文本
  function checksan(qq, now) {
    let san = attrb[qq]["san"]
    let text = ""
    if (san <= 0) {
      let lostmoney = Math.ceil(Math.random() * attrb[qq]["money"])
      if (lostmoney < 100) { lostmoney = 100 }

      attrb[qq]["healtime"] = now
      attrb[qq]["san"] = 20
      attrb[qq]["money"] -= lostmoney
      text = `\nsan值小于零！陷入了永久的疯狂之中——吗？被抓进精神病院十分钟，扣除医疗费用$ ${lostmoney}，san值恢复至20。\n<${attrb[qq]["name"]}>目前有$ ${attrb[qq]["money"]}` + checkachieve(qq, now)
    }
    if (san > 0 && san <= 20) {
      //没货
      if (Object.keys(attrb[qq]["goods"]).length === 0) {
        text = `\n嗬嗬嗬——你的san值已经低于20——`
      }
      //有货
      else {
        //计算货物数量
        let goodsnum = 0
        for (let good in attrb[qq]["goods"]) {
          goodsnum += attrb[qq]["goods"][good]
        }

        let ran = Math.ceil(Math.random() * goodsnum)
        let tmpsum = 0
        let lostgood = ''
        //抽取种类
        for (let good in attrb[qq]["goods"]) {
          tmpsum += attrb[qq]["goods"][good]
          if (ran <= tmpsum) { lostgood = good; break; }
        }

        attrb[qq]["goods"][lostgood] -= 1
        if (attrb[qq]["goods"][lostgood] == 0) {
          delete attrb[qq]["goods"][lostgood];
        }

        text = `\n嗬嗬嗬——你的san值已经低于20——随机丢失一件${lostgood}`
      }
    }
    if (san > 90) {
      text = "\n哟哈！精神满溢！"
    }
    return text;
  }
  //检查成就是否完成，返回文本
  function checkachieve(qq, now, esc = false) {
    let text = ``
    if (attrb[qq]["robwin"] >= 100) {
      let index = attrb[qq]["achieves"].indexOf("『留下买路财』")
      if (index == -1) {
        attrb[qq]["achieves"].push("『留下买路财』")
        text += `\n获得成就：『留下买路财』`
      }
    }
    if (attrb[qq]["roblose"] >= 10) {
      let index = attrb[qq]["achieves"].indexOf("『冤大头』")
      if (index == -1) {
        attrb[qq]["achieves"].push("『冤大头』")
        text += `\n获得成就：『冤大头』`
      }
    }
    if (attrb[qq]["money"] >= 1000) {
      let index = attrb[qq]["achieves"].indexOf("『第一桶金』")
      if (index == -1) {
        attrb[qq]["achieves"].push("『第一桶金』")
        text += `\n获得成就：『第一桶金』`
      }
    }
    if (attrb[qq]["money"] < 0) {
      let index = attrb[qq]["achieves"].indexOf("『失信、执行！』")
      if (index == -1) {
        attrb[qq]["achieves"].push("『失信、执行！』")
        text += `\n获得成就：『失信、执行！』`
      }
    }
    if (attrb[qq]["weapon"] == "5英寸舰载炮") {
      let index = attrb[qq]["achieves"].indexOf("『孩子你无敌了』")
      if (index == -1) {
        attrb[qq]["achieves"].push("『孩子你无敌了』")
        text += `\n获得成就：『孩子你无敌了』`
      }
    }
    if (attrb[qq]["rubbish"] >= 100) {
      let index = attrb[qq]["achieves"].indexOf("『金色传说！』")
      if (index == -1) {
        attrb[qq]["achieves"].push("『金色传说！』")
        text += `\n获得成就：『金色传说！』`
      }
    }
    if (attrb[qq]["contr"] >= 1000) {
      let index = attrb[qq]["achieves"].indexOf("『时间差不多咯~』")
      if (index == -1) {
        attrb[qq]["achieves"].push("『时间差不多咯~』")
        text += `\n获得成就：『时间差不多咯~』`
      }
    }
    if (esc == true) {
      let index = attrb[qq]["achieves"].indexOf("『目无法纪』")
      if (index == -1) {
        attrb[qq]["achieves"].push("『目无法纪』")
        text += `\n获得成就：『目无法纪』`
      }
    }
    if (180 * 1000 - now + attrb[qq]["policetime"] >= 600 * 1000) {
      let index = attrb[qq]["achieves"].indexOf("『插翅难逃』")
      if (index == -1) {
        attrb[qq]["achieves"].push("『插翅难逃』")
        text += `\n获得成就：『插翅难逃』`
      }
    }
    return text;
  }
  //检查指令，返回文本
  function checkcmd(qq, now, chkheal = true, chkplc = true, anotherqq = 0, anotherheal = true, anotherplc = true) {
    let text = ``
    if (!attrb.hasOwnProperty(qq)) {
      text = `你还没有加入任何教团。`
      return text;
    }
    if (chkheal) {
      if (now - attrb[qq]["healtime"] < 600 * 1000) {
        text = `<${attrb[qq]["name"]}>在精神病院无力地嘶吼着。`
        return text;
      }
    }
    if (chkplc) {
      if (now - attrb[qq]["policetime"] < 180 * 1000) {
        let t = now / 1000 - attrb[qq]["policetime"] / 1000
        text = `<${attrb[qq]["name"]}>还有${180 - t}秒就可以逃出来了！`
        return text;
      }
    }
    if (anotherqq != 0 && anotherqq != qq) {
      if (!attrb.hasOwnProperty(anotherqq)) {
        text = "对方还没有加入任何教团。"
        return text;
      }
      if (anotherheal) {
        if (now - attrb[anotherqq]["healtime"] < 600 * 1000) {
          text = `<${attrb[qq]["name"]}>遇到了正在精神病院咆哮的<${attrb[anotherqq]["name"]}>。`
          return text;
        }
      }
      if (anotherplc) {
        if (now - attrb[anotherqq]["policetime"] < 180 * 1000) {
          text = `<${attrb[qq]["name"]}>遇到了正在尝试越狱的<${attrb[anotherqq]["name"]}>。`
          return text;
        }
      }
    }
    return text;
  }
  //检查另一个被@的人，返回文本
  function checkanother(anotherqq, now) {
    let text = ``
    if (!attrb.hasOwnProperty(anotherqq)) {
      text = "对方还没有加入任何教团。"
      return text;
    }
    if (now - attrb[anotherqq]["healtime"] < 600 * 1000) {
      text = `<${attrb[anotherqq]["name"]}>在精神病院无力地嘶吼着。`
      return text;
    }
    if (now - attrb[anotherqq]["policetime"] < 180 * 1000) {
      text = `<${attrb[anotherqq]["name"]}>正在紧张地越狱中。`
      return text;
    }
    return text;
  }
  //把钱从第一个人抢给第二个人，返回抢到的数字
  function robmoney(qq, anotherqq) {
    attrb[qq]["roblose"] += 1
    attrb[anotherqq]["robwin"] += 1
    let lostmoney = Math.ceil(Math.random() * attrb[qq]["money"])

    attrb[qq]["money"] -= lostmoney
    attrb[anotherqq]["money"] += lostmoney
    return lostmoney;
  }
  //将num数量的货物添加至qq的背包,返回文本
  function addgoodtoqq(qq, good, num) {
    let text = ``
    let space = carlst[attrb[qq]["car"]]
    let goodsnum = 0
    num = parseInt(num)
    for (let good in attrb[qq]["goods"]) {
      goodsnum += attrb[qq]["goods"][good]
    }
    //溢出的情况
    if (goodsnum + num > space) {
      let outnum = goodsnum + num - space
      num -= outnum
      if (!attrb[qq]["goods"].hasOwnProperty(good)) { attrb[qq]["goods"][good] = num }
      else { attrb[qq]["goods"][good] += num }
      text = `${good}×${num}，溢出${outnum}件`
    }
    //没溢出
    else {
      if (!attrb[qq]["goods"].hasOwnProperty(good)) { attrb[qq]["goods"][good] = num }
      else { attrb[qq]["goods"][good] += num }
      text = `${good}×${num}`
    }
    return text;
  }
  //把货物从第一个人抢给第二个人，这里老是出bug，抢的都是写什么undefined*NaN啦、啥都没有*null啦  #死掉
  function robgoods(qq, anotherqq) {
    attrb[qq]["roblose"] += 1
    attrb[anotherqq]["robwin"] += 1
    //计算货物数量
    let goodsnum = 0
    for (let good in attrb[qq]["goods"]) {
      goodsnum += attrb[qq]["goods"][good]
    }
    let lostlst = {}
    let drawtime = Math.ceil(Math.random() * goodsnum)
    //按权重抽取至少一个货物
    for (let i = 0; i < drawtime; i++) {
      let ran = Math.ceil(Math.random() * goodsnum)
      let tmpsum = 0
      let lostgood = ''
      //抽取种类
      for (let good in attrb[qq]["goods"]) {
        tmpsum += attrb[qq]["goods"][good]
        if (ran <= tmpsum) { lostgood = good; break; }
      }

      attrb[qq]["goods"][lostgood] -= 1
      if (attrb[qq]["goods"][lostgood] == 0) {
        delete attrb[qq]["goods"][lostgood];
      }
      if (lostlst.hasOwnProperty(lostgood)) { lostlst[lostgood] += 1 } else { lostlst[lostgood] = 1 }

      //重置总数，可恶啊啊啊啊没写这段又出bug了
      goodsnum = 0
      for (let good in attrb[qq]["goods"]) {
        goodsnum += attrb[qq]["goods"][good]
      }
      if (goodsnum == 0) { break; }
    }
    //把货物加给第二个人并输出文本
    let text = ``
    for (let lostgood in lostlst) {
      text += addgoodtoqq(anotherqq, lostgood, lostlst[lostgood]) + `、`
    }
    return text.slice(0, -1);
  }
  //打乱数组
  function shuffle(array) {
    let arr = array
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]; // 交换元素
    }
    return arr
  }
  //翻垃圾时间~翻一次、返回一段文本
  function rubbish(qq) {
    let ran = Math.random()
    attrb[qq]["exp"] -= 3
    attrb[qq]["rubbish"] += 1
    let text = ``
    //翻到货物
    if (ran <= 0.9) {
      let good = ``
      let num = 0
      if (ran <= 0.01) {
        good = goods["红"][Math.floor(Math.random() * goods["红"].length)]
        num = 1
      }
      if (ran > 0.01 && ran <= 0.06) {
        good = goods["金"][Math.floor(Math.random() * goods["金"].length)]
        num = Math.ceil(Math.random() * 2)
      }
      if (ran > 0.06 && ran <= 0.25) {
        good = goods["紫"][Math.floor(Math.random() * goods["紫"].length)]
        num = Math.ceil(Math.random() * 6)
      }
      if (ran > 0.25 && ran <= 0.5) {
        good = goods["蓝"][Math.floor(Math.random() * goods["蓝"].length)]
        num = Math.ceil(Math.random() * 12)
      }
      if (ran > 0.5 && ran <= 0.9) {
        good = goods["灰"][Math.floor(Math.random() * goods["灰"].length)]
        num = Math.ceil(Math.random() * 20)
      }

      text = addgoodtoqq(qq, good, num) + `！`
    }
    //翻到回san道具
    if (ran <= 0.93 && ran > 0.9) {
      text = addgoodtoqq(qq, "圣水", 1) + `！`
    }
    //翻到车
    if (ran > 0.93) {
      let formercar = attrb[qq]["car"]
      let cars = Object.keys(carlst)
      let car = cars[Math.floor(Math.random() * cars.length)]

      if (carlst[attrb[qq]["car"]] > carlst[car]) {
        attrb[qq]["money"] += carlst[car]
        text = `一台${car}！卖掉赚了$ ${carlst[car]}！`
      }
      else {
        attrb[qq]["car"] = car
        text = `一台${car}！原来的${formercar}就丢到垃圾堆里吧。`
      }
    }
    return text;
  }
  //抢劫：第一个人发起对第二个人的抢劫
  function rob(qq, anotherqq, now) {
    attrb[qq]["robtime"] = now

    let place = attrb[qq]["place"]
    let val1 = weaponlst[attrb[qq]["weapon"]]
    let val2 = weaponlst[attrb[anotherqq]["weapon"]]
    let ran1 = Math.random()
    let ran2 = Math.random()
    let text = `<${attrb[qq]["name"]}>在${place}找到了<${attrb[anotherqq]["name"]}>，`
    if (attrb[qq]["place"] !== attrb[anotherqq]["place"]) {
      //迷路了！！！
      if (Math.random() <= 0.2) {
        text = `<${attrb[qq]["name"]}>在追踪${attrb[anotherqq]["name"]}的时候迷路了……`
        let newplace = allplaces[Math.floor(Math.random() * allplaces.length)]
        while (newplace == attrb[anotherqq]["place"]) {
          newplace = allplaces[Math.floor(Math.random() * allplaces.length)]
        }

        if (newplace != place) {
          attrb[qq]["place"] = newplace;
          text += `竟然来到了${newplace}！`
        }
        return text;
      }
      attrb[qq]["place"] = attrb[anotherqq]["place"]
      text = `<${attrb[qq]["name"]}>在${attrb[anotherqq]["place"]}追到了<${attrb[anotherqq]["name"]}>，`
    }

    //新来的赢
    if (ran1 * val1 >= ran2 * val2) {
      let goodsnum = 0
      for (let good in attrb[anotherqq]["goods"]) {
        goodsnum += attrb[anotherqq]["goods"][good]
      }

      text += `用${attrb[qq]["weapon"]}揍了${call(anotherqq)}一顿后，`
      //抢货
      if (Math.random() < 0.5 && goodsnum >= 20) {
        text += `抢走了${robgoods(anotherqq, qq)}。`
      }
      //抢钱
      else {
        if (attrb[anotherqq]["money"] <= 0) {
          text += `一边嫌弃${call(anotherqq)}是个穷鬼一边离开了。`
        }
        else {
          text += `抢走了$ ${robmoney(anotherqq, qq)}。`
        }
      }
    }
    //新来的输
    else {
      let goodsnum = 0
      for (let good in attrb[qq]["goods"]) {
        goodsnum += attrb[qq]["goods"][good]
      }

      text += `被${call(anotherqq)}的${attrb[anotherqq]["weapon"]}反过来揍了一顿后，`
      //抢货
      if (Math.random() < 0.5 && goodsnum >= 20) {
        text += `被抢走了${robgoods(qq, anotherqq)}。`
      }
      //抢钱
      else {
        if (attrb[qq]["money"] <= 0) {
          text += `${call(anotherqq)}嫌弃你是个穷鬼并离开了。`
        }
        else {
          text += `被抢走了$ ${robmoney(qq, anotherqq)}。`
        }
      }
    }
    return text;
  }
  //加入
  function addplayer(qq, name, sex, belong) {
    attrb[qq] = {}
    //昵称
    attrb[qq]["name"] = name
    //所属
    attrb[qq]["belong"] = belong
    //性别
    attrb[qq]["sex"] = sex
    //san值
    attrb[qq]["san"] = Math.floor(Math.random() * (80 - 40 + 1)) + 40
    //落魄值
    attrb[qq]["exp"] = 0
    //货币
    attrb[qq]["money"] = 100
    //贡献
    attrb[qq]["contr"] = 0
    //载具
    attrb[qq]["car"] = "二手别克"
    //货物
    attrb[qq]["goods"] = { "土豆": 20 }
    //武器
    attrb[qq]["weapon"] = "催泪瓦斯"
    //位置
    attrb[qq]["place"] = allplaces[Math.floor(Math.random() * allplaces.length)]
    //发传单时间
    attrb[qq]["missionTime"] = 1717065841 * 1000
    //前往时间
    attrb[qq]["gotime"] = 1717065841 * 1000
    //逛逛时间
    attrb[qq]["happytime"] = 1717065841 * 1000
    //关进医院时间
    attrb[qq]["healtime"] = 1717065841 * 1000
    //被抓时间
    attrb[qq]["policetime"] = 1717065841 * 1000
    //抢劫时间
    attrb[qq]["robtime"] = 1717065841 * 1000
    //越狱时间
    attrb[qq]["esctime"] = 1717065841 * 1000
    //成就列表
    attrb[qq]["achieves"] = []
    //抢劫赢的次数
    attrb[qq]["robwin"] = 0
    //抢劫输的次数
    attrb[qq]["roblose"] = 0
    //翻垃圾的次数
    attrb[qq]["rubbish"] = 0
  }

  const cmdadd = seal.ext.newCmdItemInfo();
  cmdadd.name = "加入";
  cmdadd.help = "指令：.加入 昵称 性别 教团（当前教团可用 .教团信息 查看），或者使用 .加入 随便";
  cmdadd.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const name = val
    const sex = cmdArgs.getArgN(2)
    const belong = cmdArgs.getArgN(3)
    if (attrb.hasOwnProperty(qq)) {
      seal.replyToSender(ctx, msg, `${ctx.player.name}，你早已加入了。`)
      return;
    }
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      case "随便": {
        const name = ctx.player.name
        let sex = "男"
        if (Math.random() <= 0.5) {
          sex = "女"
        }
        const belong = allcults[Math.floor(Math.random() * allcults.length)]
        if (attrb.hasOwnProperty(qq)) {
          seal.replyToSender(ctx, msg, `早已加入了。`)
          return;
        }
        addplayer(qq, name, sex, belong)

        seal.replyToSender(ctx, msg, `${name}，欢迎你加入${belong}。你来到了${attrb[qq]["place"]}。当前有$ 100,土豆×20`)
        seal.replyToSender(ctx, msg, lead)
        updating(true, true)
        return;
      }
      default: {
        if (!belong) {
          const ret = seal.ext.newCmdExecuteResult(true);
          ret.showHelp = true;
          return ret;
        }
        if (sex !== "男" && sex !== "女") {
          seal.replyToSender(ctx, msg, `请正确输入性别（男/女）。`)
          return;
        }

        //乱写是吧
        let sign = false
        for (let cult of allcults) { if (belong == cult) { sign = true } }
        if (!sign) {
          seal.replyToSender(ctx, msg, `很抱歉，你不能自创教团。目前可加入的有${culttext}`)
          return;
        }

        addplayer(qq, name, sex, belong)

        seal.replyToSender(ctx, msg, `${name}，欢迎你加入${belong}。你来到了${attrb[qq]["place"]}。当前有$ 100,土豆×20`)
        seal.replyToSender(ctx, msg, lead)
        updating(true, true)
        return;
      }
    }
  }

  const cmdShop = seal.ext.newCmdItemInfo();
  cmdShop.name = "今日商店";
  cmdShop.help = "指令：.今日商店 （地点）";
  cmdShop.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now, false, false)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        if (!val) { val = attrb[qq]["place"] }
        //又乱写是吧
        let sign = false
        for (let place of allplaces) { if (val == place) { sign = true } }
        if (!sign) {
          seal.replyToSender(ctx, msg, `暂无此地。目前的地点有${placetext}`)
          return;
        }

        const date = seal.format(ctx, "{$tDate}")
        let text = shop(date, val)
        seal.replyToSender(ctx, msg, text + `\n你目前有$ ${attrb[qq]["money"]}。`)
        updating()
        return;
      }
    }
  }

  const cmdgoods = seal.ext.newCmdItemInfo();
  cmdgoods.name = "查看背包";
  cmdgoods.help = "指令：.查看背包（如果你的背包里出现了undefined、NaN、null之类不可名状的脏东西，请使用 .清除背包 ，以免传染给其他人）";
  cmdgoods.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now, false, false)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        let money = attrb[qq]["money"]
        let arr = Object.keys(attrb[qq]["goods"])

        //计算货物数量
        let goodsnum = 0
        for (let good in attrb[qq]["goods"]) {
          goodsnum += attrb[qq]["goods"][good]
        }

        text = `<${attrb[qq]["name"]}>的背包：\n货币：$ ${money}\n空间:${goodsnum}/${carlst[attrb[qq]["car"]]}`
        for (let i = 0; i < arr.length; i++) {
          if (attrb[qq]["goods"][arr[i]] != 0) {
            text += `\n${arr[i]}×${attrb[qq]["goods"][arr[i]]}`
          }
        }
        seal.replyToSender(ctx, msg, text)
        return;
      }
    }
  }

  const cmdmove = seal.ext.newCmdItemInfo();
  cmdmove.name = "前往";
  cmdmove.help = `指令：.前往 地点（目前可去的地点有${placetext}）`;
  cmdmove.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    //冷却时间~
    let interval = seal.ext.getConfig(ext, "指令间隔/s(前往)").value * 1000
    if (now - attrb[qq]["gotime"] < interval) {
      return;
    }
    switch (val) {
      case "":
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        //又乱写是吧
        let sign = false
        for (let place of allplaces) { if (val == place) { sign = true } }
        if (!sign) {
          seal.replyToSender(ctx, msg, `暂无此地。目前可去的地点有${placetext}`)
          return;
        }
        if (val == attrb[qq]["place"]) {
          seal.replyToSender(ctx, msg, `你已经到${val}啦！`)
          return;
        }
        let formerplace = attrb[qq]["place"]
        attrb[qq]["gotime"] = now
        attrb[qq]["place"] = val;

        let place = attrb[qq]["place"]
        let members = places[place]["members"]
        let ran = Math.random()

        //遇到了谁？
        if (members.length > 1 && ran <= 0.3) {
          let anotherqq = members[Math.floor(Math.random() * members.length)]
          while (anotherqq == qq) {
            anotherqq = members[Math.floor(Math.random() * members.length)]
          }
          if (now - attrb[anotherqq]["healtime"] < 600 * 1000) {
            seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>在${place}遇到了正在精神病院咆哮的<${attrb[anotherqq]["name"]}>。`)
            return;
          }
          if (now - attrb[anotherqq]["policetime"] < 180 * 1000) {
            seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>在${place}遇到了正在尝试越狱的<${attrb[anotherqq]["name"]}>。`)
            return;
          }
          seal.replyToSender(ctx, msg, rob(qq, anotherqq, now) + checkachieve(qq, now))
          updating(false, true)
          return;
        }
        //疯狂啦~
        if (ran <= 0.5) {
          let lostsan = Math.floor(Math.random() * 6) + 1
          let myth = myths[Math.floor(Math.random() * myths.length)]
          let mythword = mythwords[Math.floor(Math.random() * mythwords.length)]
          attrb[qq]["san"] -= lostsan;

          seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>在${place}遇到了${mythword}${myth}！san-${lostsan}。` + `\n当前san值为${attrb[qq]["san"]}` + checksan(qq, now))
          updating(false, true)
          return;
        }
        //警察！
        if (ran > 0.5 && ran <= 0.8) {
          attrb[qq]["exp"] += 8
          attrb[qq]["policetime"] = now
          let goods = Object.keys(attrb[qq]["goods"])
          let plccheck = ``
          if (goods.length !== 0) {
            plccheck = `因为检查出车上有${goods[Math.floor(Math.random() * goods.length)]}，`
          }

          seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>在${place}遇到了警察！${plccheck}被抓起来了！但作为${attrb[qq]["belong"]}的资深教徒，越狱只需要三分钟！\n落魄值+8=${attrb[qq]["exp"]}`)
          updating(false, true)
          return;
        }
        //我是迷路大师！
        if (ran > 0.8) {
          let newplace = allplaces[Math.floor(Math.random() * allplaces.length)]
          while (newplace == val) {
            newplace = allplaces[Math.floor(Math.random() * allplaces.length)]
          }
          attrb[qq]["place"] = newplace;
          attrb[qq]["gotime"] = 1717065841 * 1000

          if (newplace == formerplace) {
            seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>迷路了！走着走着竟然回到了${newplace}！`)
            return;
          }
          seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>迷路了！竟然来到了${newplace}！`)
          updating(false, true)
          return;
        }
      }
    }
  }

  const cmdCancel = seal.ext.newCmdItemInfo();
  cmdCancel.name = "注销";
  cmdCancel.help = "指令：.注销（注销就是注销了）";
  cmdCancel.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now, false, false)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        delete attrb[qq]
        updating(true, true)
        seal.replyToSender(ctx, msg, "注销成功！")
        return;
      }
    }
  }

  const cmdBuy = seal.ext.newCmdItemInfo();
  cmdBuy.name = "购入";
  cmdBuy.help = "指令：.购入 物品名称 （数量/all）";
  cmdBuy.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    let val2 = cmdArgs.getArgN(2);
    const date = seal.format(ctx, "{$tDate}")
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    switch (val) {
      case "":
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        let money = attrb[qq]["money"]
        let place = attrb[qq]["place"]
        let kunkun = shop(date, place)
        let space = carlst[attrb[qq]["car"]]
        let goodsnum = 0
        for (let good in attrb[qq]["goods"]) {
          goodsnum += attrb[qq]["goods"][good]
        }

        if (!val2) { val2 = 1 }
        if ((val2 !== "all" && isNaN(val2)) || val2 <= 0) {
          const ret = seal.ext.newCmdExecuteResult(true);
          ret.showHelp = true;
          return ret;
        }
        if (!places[place]["goods"].hasOwnProperty(val)) {
          seal.replyToSender(ctx, msg, `没有在售。<${attrb[qq]["name"]}>当前位于${attrb[qq]["place"]}`)
          return;
        }
        if (val2 == "all") {
          val2 = Math.floor(attrb[qq]["money"] / places[place]["goods"][val])
          if (goodsnum + val2 > space) {
            val2 = space - goodsnum
          }
        }

        val2 = parseInt(val2)
        //溢出的情况
        if (goodsnum + val2 > space) {
          seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>的车装不下啦！`)
          return;
        }

        let price = places[place]["goods"][val] * val2
        //钱不够的情况
        if (price > money) {
          seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>看了看自己的钱包摇了摇头。`)
          return;
        }

        attrb[qq]["money"] = money - price
        let text = addgoodtoqq(qq, val, val2)


        seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>花费了$ ${price}，购买到${text}。`)
        updating()
        return;
      }
    }
  }

  const cmdSell = seal.ext.newCmdItemInfo();
  cmdSell.name = "售出";
  cmdSell.help = "指令：.售出 物品名称/all （数量/all）";
  cmdSell.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    let val2 = cmdArgs.getArgN(2);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    const date = seal.format(ctx, "{$tDate}")
    let place = attrb[qq]["place"]
    let text = shop(date, place)
    switch (val) {
      case "":
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      //卖掉所有能卖的货物
      case "all": {
        let text = ``
        let increase = 0
        for (let level in goods) {
          for (let val of goods[level]) {
            if (places[place]["goods"].hasOwnProperty(val) && attrb[qq]["goods"].hasOwnProperty(val)) {
              val2 = attrb[qq]["goods"][val]
              let price = places[place]["goods"][val] * val2
              increase += price
              text += `${val}×${val2}、`
              delete attrb[qq]["goods"][val]
            }
          }
        }
        if (increase == 0) {
          seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>的背包里好像没什么好卖的呢~` + checkachieve(qq, now))
          return;
        }
        attrb[qq]["money"] += increase

        seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>出售了${text.slice(0, -1)}，得到$ ${increase}。` + checkachieve(qq, now))
        updating()
        return;
      }
      default: {
        if (!places[place]["goods"].hasOwnProperty(val)) {
          seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>当前位于${attrb[qq]["place"]}。暂不收购该商品。`)
          return;
        }

        if (!val2) { val2 = 1 }
        if ((val2 !== "all" && isNaN(val2)) || val2 <= 0) {
          const ret = seal.ext.newCmdExecuteResult(true);
          ret.showHelp = true;
          return ret;
        }

        if (!attrb[qq]["goods"].hasOwnProperty(val)) {
          seal.replyToSender(ctx, msg, "库中没有此物品。")
          return;
        }
        if (val2 == "all") {
          val2 = attrb[qq]["goods"][val]
        }
        val2 = parseInt(val2)
        if (attrb[qq]["goods"][val] < val2) {
          seal.replyToSender(ctx, msg, "库中物品数量不足！")
          return;
        }
        let price = places[place]["goods"][val] * val2
        attrb[qq]["money"] += price

        attrb[qq]["goods"][val] -= val2
        if (attrb[qq]["goods"][val] == 0) {
          delete attrb[qq]["goods"][val];
        }


        seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>出售了${val}×${val2}，得到$ ${price}。` + checkachieve(qq, now))
        updating()
        return;
      }
    }
  }

  const cmdCheat = seal.ext.newCmdItemInfo();
  cmdCheat.name = "cult";
  cmdCheat.help = lead;
  cmdCheat.allowDelegate = true;
  cmdCheat.solve = (ctx, msg, cmdArgs) => {
    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    let val = cmdArgs.getArgN(1);
    let val2 = cmdArgs.getArgN(2);
    let val3 = cmdArgs.getArgN(3);

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
        if (val == "master") {
          seal.replyToSender(ctx, msg, "指令：.cult 参数1 参数2（参数目前有加入（@另一个人）、del(清除所有数据)、刷新商店、刷新武器、重置地点、自首、保释、加时 数值（分钟）、清空成就、money 数值(修改金额)、contr 数值(修改贡献度)、lp 数值(修改落魄值)、san 数值、赏 金额、赐 物品名称，除了这些外，默认参数1为物品名称，参数2为物品数量写入到背包中）")
          return;
        }

        let anotherPeople = mctx.player.userId
        const qq = anotherPeople.replace(/\D+/g, "")
        const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
        if (val == "加入") {
          const name = mctx.player.name
          let sex = "男"
          if (Math.random() <= 0.5) {
            sex = "女"
          }
          const belong = allcults[Math.floor(Math.random() * allcults.length)]
          if (attrb.hasOwnProperty(qq)) {
            seal.replyToSender(ctx, msg, `早已加入了。`)
            return;
          }
          addplayer(qq, name, sex, belong)

          seal.replyToSender(ctx, msg, `${name}，欢迎你加入${belong}。你来到了${attrb[qq]["place"]}。`)
          updating(true, true)
          return;
        }
        if (!attrb.hasOwnProperty(qq)) {
          seal.replyToSender(ctx, msg, `[CQ:at,qq=${qq}]还没有注册账号！`)
          return;
        }
        //更新数据用
        /*if (val == "updt") {
          for (let qq in attrb) {
            attrb[qq]["esctime"] = 1717065841 * 1000
            delete attrb[qq]["raiseTime"]
          }
          seal.replyToSender(ctx, msg, `成功！`)
          updating()
          return;
        }*/
        if (val == "del") {
          for (let i in attrb) { delete attrb[i] }
          for (let i in places) { delete places[i] }
          for (let i in cults) { delete cults[i] }
          for (let i in weaponnow) { delete weaponnow[i] }

          //初始化————
          for (let cult of allcults) {
            if (!cults.hasOwnProperty(cult)) { cults[cult] = {} }
            if (!cults[cult].hasOwnProperty("members")) { cults[cult]["members"] = []; }
            if (!cults[cult].hasOwnProperty("seeing")) { cults[cult]["seeing"] = {}; }
          }
          for (let cult in cultgods) {
            for (let god of cultgods[cult]) {
              if (!cults[cult]["seeing"].hasOwnProperty(god)) { cults[cult]["seeing"][god] = 0 }
            }
          }
          for (let place of allplaces) {
            if (!places.hasOwnProperty(place)) { places[place] = {} }
            if (!places[place].hasOwnProperty("members")) { places[place]["members"] = []; }
            if (!places[place].hasOwnProperty("says")) { places[place]["says"] = []; }
          }
          ext.storageSet("attrb", JSON.stringify(attrb))
          ext.storageSet("places", JSON.stringify(places))
          ext.storageSet("cults", JSON.stringify(cults))
          ext.storageSet("weaponnow", JSON.stringify(weaponnow))
          seal.replyToSender(ctx, msg, `成功！`)
          return;
        }
        if (val == "刷新商店") {
          for (let place of allplaces) { delete places[place]["date"] }
          seal.replyToSender(ctx, msg, `成功！`)
          return;
        }
        if (val == "刷新武器") {
          delete weaponnow["date"]
          seal.replyToSender(ctx, msg, `成功！`)
          return;
        }
        if (val == "重置地点") {
          for (let qq in attrb) { attrb[qq]["place"] = allplaces[Math.floor(Math.random() * allplaces.length)] }
          updating(false, true)
          seal.replyToSender(ctx, msg, `成功！`)
          return;
        }
        if (val == "保释") {
          //关进医院时间
          attrb[qq]["healtime"] = 1717065841 * 1000
          //被抓时间
          attrb[qq]["policetime"] = 1717065841 * 1000
          updating()
          seal.replyToSender(ctx, msg, `成功！`)
          return;
        }
        if (val == "自首") {
          //被抓时间
          attrb[qq]["policetime"] = now
          updating()
          seal.replyToSender(ctx, msg, `成功！`)
          return;
        }
        if (val == "清空成就") {
          attrb[qq]["achieves"] = []
          updating()
          seal.replyToSender(ctx, msg, `成功！`)
          return;
        }

        //需要两个参数
        if (!val2) {
          seal.replyToSender(ctx, msg, `参数错误`)
          return;
        }
        if (val == "money") {
          attrb[qq]["money"] = parseInt(val2)
          seal.replyToSender(ctx, msg, `成功！`)
          updating()
          return;
        }
        if (val == "赏") {
          for (let QQ in attrb) {
            attrb[QQ]["money"] += parseInt(val2)
          }
          seal.replyToSender(ctx, msg, `成功！`)
          updating()
          return;
        }
        if (val == "赐") {
          if (!val3) {
            seal.replyToSender(ctx, msg, `.写 xxx xxx`)
            return;
          }
          for (let QQ in attrb) {
            addgoodtoqq(QQ, val2, val3)
          }
          seal.replyToSender(ctx, msg, `成功！`)
          updating()
          return;
        }
        if (val == "lp") {
          attrb[qq]["exp"] = parseInt(val2)
          seal.replyToSender(ctx, msg, `成功！`)
          updating()
          return;
        }
        if (val == "contr") {
          attrb[qq]["contr"] = parseInt(val2)
          seal.replyToSender(ctx, msg, `成功！`)
          updating()
          return;
        }
        if (val == "san") {
          attrb[qq]["san"] = parseInt(val2)
          seal.replyToSender(ctx, msg, `成功！`)
          updating()
          return;
        }
        if (val == "加时") {
          //被抓时间
          attrb[qq]["policetime"] += parseInt(val2) * 60 * 1000
          updating()
          seal.replyToSender(ctx, msg, `成功！`)
          return;
        }
        //修改背包物品
        attrb[qq]["goods"][val] = parseInt(val2)
        if (attrb[qq]["goods"][val] == 0) { delete attrb[qq]["goods"][val]; }
        seal.replyToSender(ctx, msg, `成功！`)
        updating()
        return;
      }
    }
  }

  const cmdinfo = seal.ext.newCmdItemInfo();
  cmdinfo.name = "个人信息";
  cmdinfo.help = "指令：.个人信息";
  cmdinfo.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now, false, false)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        //计算货物数量
        let goodsnum = 0
        for (let good in attrb[qq]["goods"]) {
          goodsnum += attrb[qq]["goods"][good]
        }

        title = `﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌[CQ:image,file=http://q2.qlogo.cn/headimg_dl?dst_uin=${qq}&spec=5]昵称:<${attrb[qq]["name"]}>\n所属:${attrb[qq]["belong"]}\n性别:${attrb[qq]["sex"]} | san值:${attrb[qq]["san"]} | 落魄值:${attrb[qq]["exp"]}\n货币:$ ${attrb[qq]["money"]} | 贡献度:${attrb[qq]["contr"]}\n武器:${attrb[qq]["weapon"]}  数值:${weaponlst[attrb[qq]["weapon"]]}\n载具:${attrb[qq]["car"]}（${goodsnum}/${carlst[attrb[qq]["car"]]}）\n位置:${attrb[qq]["place"]}`
        seal.replyToSender(ctx, msg, `${title}`)
        return;
      }
    }
  }

  const cmdwShop = seal.ext.newCmdItemInfo();
  cmdwShop.name = "武器商店";
  cmdwShop.help = "指令：.武器商店";
  cmdwShop.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now, false, false)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        const date = seal.format(ctx, "{$tDate}")
        let text = weaponshop(date)
        seal.replyToSender(ctx, msg, text + `\n<${attrb[qq]["name"]}>目前有$ ${attrb[qq]["money"]}。（买武器指令：.买武器 武器名称）`)
        updating()
        return;
      }
    }
  }

  const cmdbwp = seal.ext.newCmdItemInfo();
  cmdbwp.name = "买武器";
  cmdbwp.help = "指令：.买武器 武器名称";
  cmdbwp.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    switch (val) {
      case "":
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        const date = seal.format(ctx, "{$tDate}")
        let money = attrb[qq]["money"]
        let formerweapon = attrb[qq]["weapon"]
        let text = weaponshop(date)

        if (attrb[qq]["weapon"] == val) {
          seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>已经有了${val}。`)
          return;
        }
        if (!weaponnow["goods"].hasOwnProperty(val)) {
          seal.replyToSender(ctx, msg, `没有在售。`)
          return;
        }
        //剩余数量不足
        if (weaponnow["goods"][val]["rest"] <= 0) {
          seal.replyToSender(ctx, msg, `${val}已经卖光啦！`)
          return;
        }
        //武器太辣鸡
        if (weaponlst[val] < weaponlst[attrb[qq]["weapon"]]) {
          seal.replyToSender(ctx, msg, `你看了看手中的${attrb[qq]["weapon"]}，觉得似乎并不太需要这个`)
          return;
        }
        //钱不够
        let price = weaponnow["goods"][val]["price"]
        if (price > money) {
          seal.replyToSender(ctx, msg, `钱不够呢。`)
          return;
        }

        attrb[qq]["money"] = money - price
        attrb[qq]["weapon"] = val
        weaponnow["goods"][val]["rest"] -= 1

        seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>花费了$ ${price}，购买到新的${val}。原来的${formerweapon}就丢到垃圾桶吧。` + checkachieve(qq, now))
        updating()
        return;
      }
    }
  }

  const cmdmission = seal.ext.newCmdItemInfo();
  cmdmission.name = "发展信众";
  cmdmission.help = "指令：.发展信众";
  cmdmission.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    let checkmsg = checkcmd(qq, now)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        let increase = parseInt(seal.format(ctx, "{$t增加=1d50+100}"))
        let timestamp = attrb[qq]["missionTime"]

        if (new Date(timestamp).toDateString() === new Date().toDateString()) {
          seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>今天的传单已经派完了`)
          return;
        }
        attrb[qq]["missionTime"] = now
        attrb[qq]["contr"] += increase

        let ran = Math.floor(Math.random() * (15 - 5 + 1)) + 5
        let moneyincrease = attrb[qq]["contr"] * ran
        attrb[qq]["money"] += moneyincrease

        seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>今天在${attrb[qq]["place"]}发展了${increase}个信众，目前贡献度为${attrb[qq]["contr"]}，收取了$ ${moneyincrease}。` + checkachieve(qq, now))
        updating()
        return;
      }
    }
  }

  const cmdcinfo = seal.ext.newCmdItemInfo();
  cmdcinfo.name = "教团信息";
  cmdcinfo.help = "指令：.教团信息";
  cmdcinfo.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        let text = `教团信息如下：`
        let cultinfo = {}

        for (let cult of allcults) {
          let allcontr = cults[cult]["members"].length;//加上玩家人数
          let allmoney = 0;
          for (let qq of cults[cult]["members"]) {
            allcontr += attrb[qq]["contr"]
            allmoney += attrb[qq]["money"]
          }
          cultinfo[cult] = [allcontr, allmoney]
        }
        //按人数排序
        let arr = Object.keys(cultinfo).sort(function (a, b) { return cultinfo[b][0] - cultinfo[a][0] })
        for (let i = 0; i < arr.length; i++) {
          if (i == 5) { break }
          let cult = arr[i]
          text += `\n第${i + 1}名：${cult} ${cultinfo[cult][0]}人\n资产$ ${cultinfo[cult][1]}`
        }
        seal.replyToSender(ctx, msg, text);
        return;
      }
    }
  }

  const cmdhappy = seal.ext.newCmdItemInfo();
  cmdhappy.name = "逛逛";
  cmdhappy.help = "指令：.逛逛";
  cmdhappy.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    let interval = seal.ext.getConfig(ext, "指令间隔/s(逛逛)").value * 1000
    if (now - attrb[qq]["happytime"] < interval) {
      return;
    }
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        attrb[qq]["happytime"] = now
        let place = attrb[qq]["place"]
        let ran = Math.random()
        let milu = ``
        //迷路————
        if (Math.random() <= 0.2) {
          let newplace = allplaces[Math.floor(Math.random() * allplaces.length)]
          while (newplace == place) {
            newplace = allplaces[Math.floor(Math.random() * allplaces.length)]
          }
          attrb[qq]["place"] = newplace;

          milu = `<${attrb[qq]["name"]}>迷路了！走着走着竟然来到了${newplace}！\n`
        }

        //神话生物！
        if (ran <= 0.6) {
          let lostsan = Math.floor(Math.random() * 6) + 1
          let myth = myths[Math.floor(Math.random() * myths.length)]
          let mythword = mythwords[Math.floor(Math.random() * mythwords.length)]
          attrb[qq]["san"] -= lostsan;

          seal.replyToSender(ctx, msg, milu + `<${attrb[qq]["name"]}>遇到了${mythword}${myth}！san-${lostsan}。` + `\n当前san值为${attrb[qq]["san"]}` + checksan(qq, now))
          updating(false, true)
          return;
        }
        //警察！！！
        if (ran > 0.6 && ran <= 0.9) {
          attrb[qq]["exp"] += 8
          attrb[qq]["policetime"] = now
          let goods = Object.keys(attrb[qq]["goods"])
          let plccheck = ``
          if (goods.length !== 0) {
            plccheck = `因为检查出车上有${goods[Math.floor(Math.random() * goods.length)]}，`
          }

          seal.replyToSender(ctx, msg, milu + `<${attrb[qq]["name"]}>遇到了警察！${plccheck}被抓起来了！但作为${attrb[qq]["belong"]}的资深教徒，越狱只需要三分钟！\n落魄值+8=${attrb[qq]["exp"]}`)
          updating(false, true)
          return;
        }
        //看风景~
        if (ran > 0.9) {
          let sanup = Math.floor(Math.random() * 6) + 1
          attrb[qq]["san"] += sanup

          seal.replyToSender(ctx, msg, milu + `${place}风景宜人，<${attrb[qq]["name"]}>的san值恢复了${sanup}！` + `\n当前san值为${attrb[qq]["san"]}`)
          updating(false, true)
          return;
        }
      }
    }
  }

  const cmdRob = seal.ext.newCmdItemInfo();
  cmdRob.name = "抢劫";
  cmdRob.help = "指令：.抢劫(@你要抢的冤大头)";
  cmdRob.allowDelegate = true;
  cmdRob.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    let anotherPeople = mctx.player.userId
    let anotherqq = anotherPeople.replace(/\D+/g, "")
    let checkmsg = checkcmd(qq, now, true, true, anotherqq)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    let interval = seal.ext.getConfig(ext, "指令间隔/s(抢劫)").value * 1000
    if (now - attrb[qq]["robtime"] < interval) {
      return;
    }
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        //随机选一个冤大头
        if (qq == anotherqq) {
          let place = attrb[qq]["place"]

          let members = places[place]["members"]
          if (members.length == 1) {
            seal.replyToSender(ctx, msg, `${place}似乎没有可以抢的目标呢。`)
            return;
          }

          anotherqq = members[Math.floor(Math.random() * members.length)]
          while (anotherqq == qq) {
            anotherqq = members[Math.floor(Math.random() * members.length)]
          }
          let checkmsg = checkcmd(qq, now, true, true, anotherqq)
          if (checkmsg !== ``) {
            seal.replyToSender(ctx, msg, checkmsg)
            return;
          }
        }

        seal.replyToSender(ctx, msg, rob(qq, anotherqq, now) + checkachieve(qq, now))
        updating(false, true)
        return;
      }
    }
  }

  //乱起个名字嘿嘿嘿
  const cmdrbq = seal.ext.newCmdItemInfo();
  cmdrbq.name = "翻垃圾";
  cmdrbq.help = "指令：.翻垃圾（三连/十连）（每翻一次需要3点落魄值）";
  cmdrbq.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    let exp = attrb[qq]["exp"]
    let replytext = `<${attrb[qq]["name"]}>在垃圾堆里面开始翻找，竟然找到了:\n`
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      case "三连": {
        if (exp < 9) {
          seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>你还没有落魄到要住在垃圾堆的程度——\n当前落魄值：${exp}`)
          return;
        }
        for (let i = 0; i < 3; i++) {
          replytext += rubbish(qq) + `\n`
        }
        replytext += `落魄值-9=${attrb[qq]["exp"]}`
        seal.replyToSender(ctx, msg, replytext + checkachieve(qq, now))
        updating()
        return;
      }
      case "十连": {
        if (exp < 30) {
          seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>你还没有落魄到要到垃圾堆进货的程度——\n当前落魄值：${exp}`)
          return;
        }
        for (let i = 0; i < 10; i++) {
          replytext += rubbish(qq) + `\n`
        }
        replytext += `落魄值-30=${attrb[qq]["exp"]}`
        seal.replyToSender(ctx, msg, replytext + checkachieve(qq, now))
        updating()
        return;
      }
      default: {
        if (exp < 3) {
          seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>你还没有落魄到要翻垃圾的程度——\n当前落魄值：${exp}`)
          return;
        }
        replytext += rubbish(qq) + `\n`
        replytext += `落魄值-3=${attrb[qq]["exp"]}`
        seal.replyToSender(ctx, msg, replytext + checkachieve(qq, now))
        updating()
        return;
      }
    }
  }

  const cmdChart = seal.ext.newCmdItemInfo();
  cmdChart.name = "排行榜";
  cmdChart.help = "指令：.排行榜 (贡献/me/@另一个人)";
  cmdChart.allowDelegate = true
  cmdChart.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    let val2 = cmdArgs.getArgN(2);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now, false, false)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    let anotherPeople = mctx.player.userId
    let anotherqq = anotherPeople.replace(/\D+/g, "")
    if (!attrb.hasOwnProperty(anotherqq)) {
      seal.replyToSender(ctx, msg, "对方还没有加入任何教团。")
      return;
    }
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      //贡献排行榜
      case "贡献": {
        let contr = {}
        for (let qq of Object.keys(attrb)) {
          contr[qq] = attrb[qq]["contr"]
        }
        let arr1 = Object.keys(contr).sort(function (a, b) { return contr[b] - contr[a] })
        if (anotherqq != qq) {
          let index = arr1.indexOf(anotherqq)
          seal.replyToSender(ctx, msg, `<${attrb[anotherqq]["name"]}>的贡献：${attrb[anotherqq]["contr"]}` + ` 第${index + 1}名`)
          return;
        }
        let index = arr1.indexOf(qq)
        if (val2 == "me") {
          seal.replyToSender(ctx, msg, `我的贡献：${attrb[qq]["contr"]}` + ` 第${index + 1}名`)
          return;
        }
        let title = `贡献排行榜\n♚`
        for (let i = 0; i < arr1.length; i++) {
          if (i == 10) { break }
          let qq = arr1[i]
          title += `第${i + 1}名：\n<${attrb[qq]["name"]}>  ${attrb[qq]["belong"]}  \n${contr[qq]}\n`
        }
        title += `我的贡献：${attrb[qq]["contr"]}` + ` 第${index + 1}名`

        seal.replyToSender(ctx, msg, title)
        return;
      }
      default: {
        //货币排行榜
        let money = {}
        for (let qq of Object.keys(attrb)) {
          money[qq] = attrb[qq]["money"]
        }
        let arr = Object.keys(money).sort(function (a, b) { return money[b] - money[a] })
        if (anotherqq != qq) {
          let index = arr.indexOf(anotherqq)
          seal.replyToSender(ctx, msg, `<${attrb[anotherqq]["name"]}>的货币：$ ${attrb[anotherqq]["money"]}` + ` 第${index + 1}名`)
          return;
        }
        let index = arr.indexOf(qq)
        if (val == "me") {
          seal.replyToSender(ctx, msg, `我的货币：$ ${attrb[qq]["money"]}` + ` 第${index + 1}名`)
          return;
        }
        let title = `货币排行榜\n♚`
        for (let i = 0; i < arr.length; i++) {
          if (i == 10) { break }
          let qq = arr[i]
          title += `第${i + 1}名：\n<${attrb[qq]["name"]}>  ${attrb[qq]["belong"]}  \n$ ${money[qq]}\n`
        }
        title += `我的货币：$ ${attrb[qq]["money"]}` + ` 第${index + 1}名`

        seal.replyToSender(ctx, msg, title)
        return;
      }
    }
  }

  const cmditg = seal.ext.newCmdItemInfo();
  cmditg.name = '情报';
  cmditg.help = '指令：.情报（分布）（可以使用 .散播 散播情报）';
  cmditg.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    switch (val) {
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      //所有地点分布
      case "分布": {
        let text = `分布如下：`
        let moneysum = 0
        for (let place of allplaces) {
          let num = places[place]["members"].length
          let money = 0
          for (let qq of places[place]["members"]) {
            money += attrb[qq]["money"]
          }
          moneysum += money
          text += `\n${place}:\n${num}人 $ ${money}`
        }
        seal.replyToSender(ctx, msg, text + `\n总金额$ ${moneysum}`)
        return;
      }
      default: {
        //抽取其他玩家的谣言
        if (Math.random() <= 0.5) {
          let shuffledallplaces = shuffle(allplaces)
          for (let place of shuffledallplaces) {
            let says = places[place]["says"]
            if (says.length !== 0) {
              let index = Math.floor(Math.random() * says.length)
              let say = says[index]
              says.splice(index, 1)
              places[place]["says"] = says


              seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>从${place}的一名流浪汉口中得知${say}`)
              updating()
              return seal.ext.newCmdExecuteResult(true);
            }
          }
        }

        let qqlst = Object.keys(attrb)
        let anotherqq = qqlst[Math.floor(Math.random() * qqlst.length)]
        let place = attrb[qq]["place"]
        let goodsnum = 0
        for (let good in attrb[anotherqq]["goods"]) {
          goodsnum += attrb[anotherqq]["goods"][good]
        }

        if (anotherqq == qq) {
          seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>从${place}的一名流浪汉口中得知<${attrb[anotherqq]["name"]}>身怀$ ${attrb[anotherqq]["money"]}、带着${goodsnum}件货物在${attrb[anotherqq]["place"]}附近。这不是你自己吗？`)
          return seal.ext.newCmdExecuteResult(true);
        }
        seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>从${place}的一名流浪汉口中得知<${attrb[anotherqq]["name"]}>身怀$ ${attrb[anotherqq]["money"]}、带着${goodsnum}件货物在${attrb[anotherqq]["place"]}附近。要不要去碰碰运气？`)
        return seal.ext.newCmdExecuteResult(true);
      }
    }
  };

  const cmdesc = seal.ext.newCmdItemInfo();
  cmdesc.name = '强行越狱';
  cmdesc.help = '指令：.强行越狱';
  cmdesc.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now, true, false)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    if (now - attrb[qq]["policetime"] >= 180 * 1000) {
      seal.replyToSender(ctx, msg, `小菜一碟，<${attrb[qq]["name"]}>早已经逃出来了`)
      return;
    }

    let interval = seal.ext.getConfig(ext, "指令间隔/s(强行越狱)").value * 1000
    if (now - attrb[qq]["esctime"] < interval) {
      return;
    }
    switch (val) {
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        attrb[qq]["esctime"] = now
        ran = Math.random()
        //成功
        if (ran <= 0.5) {
          attrb[qq]["policetime"] -= 180 * 1000
          if (now - attrb[qq]["policetime"] >= 180 * 1000) {

            seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>用${attrb[qq]["weapon"]}强行放倒了几名狱警然后扬长而去。` + checkachieve(qq, now, true))
            updating()
            return;
          }
          let t = now / 1000 - attrb[qq]["policetime"] / 1000

          seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>的动作加快了几分，还要${180 - t}秒就能逃出来！`)
          updating()
          return;
        }
        //失败
        else {
          attrb[qq]["policetime"] += 180 * 1000

          seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>引来了几名狱警的注意，看来还需要再多三分钟。` + checkachieve(qq, now))
          updating()
          return;
        }
      }
    }
  };

  const cmdmkt = seal.ext.newCmdItemInfo();
  cmdmkt.name = '行情';
  cmdmkt.help = '指令：.行情 商品名称/最高价/最低价/差价/利润/地点';
  cmdmkt.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    if (!attrb.hasOwnProperty(qq)) {
      seal.replyToSender(ctx, msg, "你还没有加入任何教团。")
      return;
    }
    const date = seal.format(ctx, "{$tDate}")
    let sign = false
    let allgoods = {}
    let text = `今日行情如下:`
    //获取当日所有商品和价格
    for (let place of allplaces) {
      let kunkun = shop(date, place)
      for (let good in places[place]["goods"]) {
        if (!allgoods.hasOwnProperty(good)) {
          allgoods[good] = [{ "place": place, "price": places[place]["goods"][good] }]
        } else {
          allgoods[good].push({ "place": place, "price": places[place]["goods"][good] })
        }
      }
    }
    //计算所有商品的最大差价
    let prices = []
    for (let good in allgoods) {
      allgoods[good].sort((a, b) => a["price"] - b["price"])
      let maxgood = allgoods[good][allgoods[good].length - 1]
      let mingood = allgoods[good][0]
      if (maxgood != mingood) {
        let dif = maxgood["price"] - mingood["price"]
        let profit = Math.floor((dif / mingood["price"]) * 100)
        let goodinfo = { "good": good, "dif": dif, "maxgood": maxgood, "mingood": mingood, "profit": profit }
        prices.push(goodinfo)
      }
    }
    switch (val) {
      case "":
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      case "最高价": {
        sign = true
        prices.sort((a, b) => b["maxgood"]["price"] - a["maxgood"]["price"])
        for (let i = 0; i < prices.length; i++) {
          if (i == 5) { break }
          text += `\n${i + 1}.${prices[i]["good"]} ${prices[i]["maxgood"]["place"]} \n$ ${prices[i]["maxgood"]["price"]}`
        }
      }
      case "最低价": {
        sign = true
        prices.sort((a, b) => a["mingood"]["price"] - b["mingood"]["price"])
        for (let i = 0; i < prices.length; i++) {
          if (i == 5) { break }
          text += `\n${i + 1}.${prices[i]["good"]} ${prices[i]["mingood"]["place"]} \n$ ${prices[i]["mingood"]["price"]}`
        }
      }
      case "差价": {
        sign = true
        prices.sort((a, b) => b["dif"] - a["dif"])
        for (let i = 0; i < prices.length; i++) {
          if (i == 5) { break }
          text += `\n${i + 1}.${prices[i]["good"]} $ ${prices[i]["dif"]}\n${prices[i]["mingood"]["place"]}——>${prices[i]["maxgood"]["place"]}\n$ ${prices[i]["mingood"]["price"]}          $ ${prices[i]["maxgood"]["price"]}`
        }
      }
      case "利润": {
        sign = true
        prices.sort((a, b) => b["profit"] - a["profit"])
        for (let i = 0; i < prices.length; i++) {
          if (i == 5) { break }
          text += `\n${i + 1}.${prices[i]["good"]} ${prices[i]["profit"]}%\n${prices[i]["mingood"]["place"]}——>${prices[i]["maxgood"]["place"]}`
        }
      }
      default: {
        //查询地点
        for (let place of allplaces) {
          if (val == place) {
            sign = true
            let placeprices = []
            prices.sort((a, b) => b["profit"] - a["profit"])
            for (let i = 0; i < prices.length; i++) {
              if (prices[i]["mingood"]["place"] == place) {
                placeprices.push(prices[i])
              }
            }
            for (let i = 0; i < placeprices.length; i++) {
              if (i == 5) { break }
              text += `\n${i + 1}.${placeprices[i]["good"]} ${placeprices[i]["profit"]}%\n$ ${placeprices[i]["mingood"]["price"]}——>$ ${placeprices[i]["maxgood"]["price"]} ${placeprices[i]["maxgood"]["place"]}`
            }
          }
        }
        //查询商品
        for (let level in goods) {
          for (let good of goods[level]) {
            if (val == good) {
              sign = true
              for (let place of allplaces) {
                if (!places[place]["goods"].hasOwnProperty(val)) { text += `\n${place}:暂无` } else { text += `\n${place}:$ ${places[place]["goods"][val]}` }
              }
            }
          }
        }
        if (!sign) { return; }

        //推荐
        let profits = []
        for (let goodinfo of prices) {
          let profitinfo = { "good": goodinfo["good"], "profit": goodinfo["dif"] * Math.floor(attrb[qq]["money"] / goodinfo["mingood"]["price"]), "dif": goodinfo["dif"], "maxgood": goodinfo["maxgood"], "mingood": goodinfo["mingood"] }
          profits.push(profitinfo)
        }
        profits.sort((a, b) => b["profit"] - a["profit"])
        let text1 = `\n为您推荐${profits[0]["mingood"]["place"]}的${profits[0]["good"]}`

        //买不起是吧！
        if (profits[0]["profit"] == 0) { text1 = `\n现在的你啥都买不起` }

        seal.replyToSender(ctx, msg, text + `\n<${attrb[qq]["name"]}>目前有$ ${attrb[qq]["money"]}，位于${attrb[qq]["place"]}。` + text1)
        return seal.ext.newCmdExecuteResult(true);
      }
    }
  };

  const cmdsay = seal.ext.newCmdItemInfo();
  cmdsay.name = '散播';
  cmdsay.help = '指令：.散播 你要散播的情报';
  cmdsay.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    switch (val) {
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        if (typeof val !== 'string') {
          seal.replyToSender(ctx, msg, `error`)
          return;
        }
        if (val.length > 60) {
          seal.replyToSender(ctx, msg, `长度超过60（${val.length}）`)
          return;
        }

        let place = attrb[qq]["place"]
        let say = `<${attrb[qq]["name"]}>说过：` + val
        places[place]["says"].push(say)


        seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>在${place}的一名流浪汉面前故意提起了……`)
        updating()
        return seal.ext.newCmdExecuteResult(true);
      }
    }
  };

  const cmddelbag = seal.ext.newCmdItemInfo();
  cmddelbag.name = '清空背包';
  cmddelbag.help = '指令：.清空背包（脏东西统统去死哇哇哇哇哇哇哇）';
  cmddelbag.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    switch (val) {
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        attrb[qq]["goods"] = {}
        seal.replyToSender(ctx, msg, `你把车上的东西扔了个一干二净`)
        updating()
        return seal.ext.newCmdExecuteResult(true);
      }
    }
  };

  const cmdname = seal.ext.newCmdItemInfo();
  cmdname.name = '改名';
  cmdname.help = '指令：.改名 新名字';
  cmdname.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now, false, false)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    switch (val) {
      case '':
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        attrb[qq]["name"] = val
        seal.replyToSender(ctx, msg, `改名成功！`)
        updating()
        return seal.ext.newCmdExecuteResult(true);
      }
    }
  };

  const cmdscrf = seal.ext.newCmdItemInfo();
  cmdscrf.name = '献祭';
  cmdscrf.help = '指令：.献祭 物品名称（数量/all）';
  cmdscrf.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    let val2 = parseInt(cmdArgs.getArgN(2));
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    switch (val) {
      case '':
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        if (!val2) { val2 = 1 }
        if ((val2 !== "all" && isNaN(val2)) || val2 <= 0) {
          const ret = seal.ext.newCmdExecuteResult(true);
          ret.showHelp = true;
          return ret;
        }
        if (!attrb[qq]["goods"].hasOwnProperty(val)) {
          seal.replyToSender(ctx, msg, `你没有这件物品。还是说<${attrb[qq]["name"]}>你要献上自己呢？`)
          return seal.ext.newCmdExecuteResult(true);
        }
        if (val2 == "all") {
          val2 = attrb[qq]["goods"][val]
        }
        if (attrb[qq]["goods"][val] < val2) {
          seal.replyToSender(ctx, msg, `数量不够！<${attrb[qq]["name"]}>需要更多！更多！`)
          return seal.ext.newCmdExecuteResult(true);
        }
        //扣除物品
        attrb[qq]["goods"][val] -= val2
        if (attrb[qq]["goods"][val] == 0) {
          delete attrb[qq]["goods"][val];
        }
        let ran = Math.random()
        let cult = attrb[qq]["belong"]
        let gods = Object.keys(cults[cult]["seeing"])
        let god = gods[Math.floor(Math.random() * gods.length)]

        attrb[qq]["san"] -= 10
        let text = `你带领着信众向伟大的${god}举行了献祭仪式，${val}×${val2}逐渐溶解在了法阵里……\n`
        if (ran <= 0.4) {
          let add = Math.ceil(Math.random() * 10) + 10
          cults[cult]["seeing"][god] += add
          //我在写什么？？？？？？？？？？？
          if (cults[cult]["seeing"][god] >= 100) {
            cults[cult]["seeing"][god] = 0
            let gift = `${god}的眷顾`
            let text1 = addgoodtoqq(qq, gift, 1)

            seal.replyToSender(ctx, msg, text + `随后祂向你们降下了视线：\n${god}的注视值达到100！获得了${text1}。\nsan值-10=${attrb[qq]["san"]}` + checksan(qq, now))
            updating()
            return seal.ext.newCmdExecuteResult(true);
          }

          seal.replyToSender(ctx, msg, text + `随后祂向你们降下了视线：\n${god}的注视值+${add}=${cults[cult]["seeing"][god]}\nsan值-10=${attrb[qq]["san"]}` + checksan(qq, now))
          updating()
          return seal.ext.newCmdExecuteResult(true);
        }

        seal.replyToSender(ctx, msg, text + `然后——就没了\nsan值-10=${attrb[qq]["san"]}` + checksan(qq, now))
        updating()
        return seal.ext.newCmdExecuteResult(true);
      }
    }
  };

  const cmdgft = seal.ext.newCmdItemInfo();
  cmdgft.name = "送";
  cmdgft.help = "指令：.送 物品名称 （数量） @要送的人";
  cmdgft.allowDelegate = true;
  cmdgft.solve = (ctx, msg, cmdArgs) => {
    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    let val = cmdArgs.getArgN(1);
    let val2 = cmdArgs.getArgN(2);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let anotherPeople = mctx.player.userId
    let anotherqq = anotherPeople.replace(/\D+/g, "")
    let checkmsg = checkcmd(qq, now, true, true, anotherqq)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    if (qq == anotherqq) {
      seal.replyToSender(ctx, msg, `那么你送给了你自己。`)
      return;
    }
    switch (val) {
      case "":
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      case "all": {
        if (Object.keys(attrb[qq]["goods"]).length == 0) {
          seal.replyToSender(ctx, msg, "你的背包里一干二净。")
          return;
        }
        let text = ``
        let title = ``
        if (attrb[qq]["place"] !== attrb[anotherqq]["place"]) {
          title = `从${attrb[qq]["place"]}追到了${attrb[anotherqq]["place"]}，`
          attrb[qq]["place"] = attrb[anotherqq]["place"]
        }
        for (let good in attrb[qq]["goods"]) {
          text += addgoodtoqq(anotherqq, good, attrb[qq]["goods"][good]) + `、`
        }
        attrb[qq]["goods"] = {}
        seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>` + title + `送给了<${attrb[anotherqq]["name"]}>` + text.slice(0, -1) + `！`)
        updating()
        return;
      }
      default: {
        if (!val2) { val2 = 1 }
        if ((val2 !== "all" && isNaN(val2)) || val2 <= 0) {
          const ret = seal.ext.newCmdExecuteResult(true);
          ret.showHelp = true;
          return ret;
        }
        if (!attrb[qq]["goods"].hasOwnProperty(val)) {
          seal.replyToSender(ctx, msg, "库中没有此物品。")
          return;
        }
        if (val2 == "all") {
          val2 = attrb[qq]["goods"][val]
        }
        val2 = parseInt(val2)
        if (attrb[qq]["goods"][val] < val2) {
          seal.replyToSender(ctx, msg, "库中物品数量不足！")
          return;
        }
        let text = addgoodtoqq(anotherqq, val, val2)
        let title = ``
        if (attrb[qq]["place"] !== attrb[anotherqq]["place"]) {
          title = `从${attrb[qq]["place"]}追到了${attrb[anotherqq]["place"]}，`
          attrb[qq]["place"] = attrb[anotherqq]["place"]
        }
        attrb[qq]["goods"][val] -= val2
        if (attrb[qq]["goods"][val] == 0) {
          delete attrb[qq]["goods"][val];
        }

        seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>` + title + `送给了<${attrb[anotherqq]["name"]}>` + text + `！`)
        updating()
        return;
      }
    }
  }
  const cmdachv = seal.ext.newCmdItemInfo();
  cmdachv.name = "成就";
  cmdachv.help = "指令：.成就";
  cmdachv.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    if (!attrb.hasOwnProperty(qq)) {
      seal.replyToSender(ctx, msg, "你还没有加入。")
      return;
    }
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        let text = `<${attrb[qq]["name"]}>的成就列表如下：`
        for (let achieve of attrb[qq]["achieves"]) {
          text += `\n` + achieve
        }

        seal.replyToSender(ctx, msg, text)
        return;
      }
    }
  }

  const cmduse = seal.ext.newCmdItemInfo();
  cmduse.name = "使用";
  cmduse.help = "指令：.使用 物品名称 （数量/all）";
  cmduse.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    let val2 = cmdArgs.getArgN(2);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let checkmsg = checkcmd(qq, now, true, false)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        if (!val2) { val2 = 1 }
        if ((val2 !== "all" && isNaN(val2)) || val2 <= 0) {
          const ret = seal.ext.newCmdExecuteResult(true);
          ret.showHelp = true;
          return ret;
        }
        if (!attrb[qq]["goods"].hasOwnProperty(val)) {
          seal.replyToSender(ctx, msg, "库中没有此物品。")
          return;
        }
        if (val2 == "all") {
          val2 = attrb[qq]["goods"][val]
        }
        val2 = parseInt(val2)
        if (attrb[qq]["goods"][val] < val2) {
          seal.replyToSender(ctx, msg, "库中物品数量不足！")
          return;
        }
        if (val == "生锈十字架" || val == "圣水") {
          attrb[qq]["san"] += 10 * val2

          attrb[qq]["goods"][val] -= val2
          if (attrb[qq]["goods"][val] == 0) {
            delete attrb[qq]["goods"][val];
          }


          seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>使用了${val}×${val2}，san+${10 * val2}=${attrb[qq]["san"]}` + checksan(qq, now))
          updating()
          return;
        }
        seal.replyToSender(ctx, msg, `无法使用`)
        return;
      }
    }
  }
  const cmdtransfer = seal.ext.newCmdItemInfo();
  cmdtransfer.name = "转账";
  cmdtransfer.help = "指令：.转账 数额";
  cmdtransfer.allowDelegate = true;
  cmdtransfer.solve = (ctx, msg, cmdArgs) => {
    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    let val = cmdArgs.getArgN(1);
    const qq = seal.format(ctx, "{$t账号ID_RAW}")
    const now = parseInt(seal.format(ctx, "{$tTimestamp}")) * 1000
    let anotherPeople = mctx.player.userId
    let anotherqq = anotherPeople.replace(/\D+/g, "")
    let checkmsg = checkcmd(qq, now, true, true, anotherqq, false, false)
    if (checkmsg !== ``) {
      seal.replyToSender(ctx, msg, checkmsg)
      return;
    }
    if (qq == anotherqq) {
      seal.replyToSender(ctx, msg, `那么你转钱给了你自己。`)
      return;
    }
    switch (val) {
      case "":
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      case "all": {
        if (attrb[qq]["money"] <= 0) {
          seal.replyToSender(ctx, msg, "已经没钱啦——")
          return;
        }
        val = attrb[qq]["money"]
      }
      default: {
        val = parseInt(val)
        if (attrb[qq]["money"] < val) {
          seal.replyToSender(ctx, msg, "没有那么多钱呢——")
          return;
        }
        attrb[anotherqq]["money"] += val
        attrb[qq]["money"] -= val

        seal.replyToSender(ctx, msg, `<${attrb[qq]["name"]}>成功把$ ${val}转给了<${attrb[anotherqq]["name"]}>！`)
        updating()
        return;
      }
    }
  }

  //ext.cmdMap[''] = cmd;
  ext.cmdMap["加入"] = cmdadd;
  ext.cmdMap["今日商店"] = cmdShop;
  ext.cmdMap["查看背包"] = cmdgoods;
  ext.cmdMap["前往"] = cmdmove;
  ext.cmdMap["注销"] = cmdCancel;
  ext.cmdMap["购入"] = cmdBuy;
  ext.cmdMap["售出"] = cmdSell;
  ext.cmdMap["cult"] = cmdCheat;
  ext.cmdMap["个人信息"] = cmdinfo;
  ext.cmdMap['武器商店'] = cmdwShop;
  ext.cmdMap['买武器'] = cmdbwp;
  ext.cmdMap['发展信众'] = cmdmission;
  ext.cmdMap['教团信息'] = cmdcinfo;
  ext.cmdMap['逛逛'] = cmdhappy;
  ext.cmdMap['抢劫'] = cmdRob;
  ext.cmdMap['翻垃圾'] = cmdrbq;
  ext.cmdMap['排行榜'] = cmdChart;
  ext.cmdMap['情报'] = cmditg;
  ext.cmdMap['强行越狱'] = cmdesc;
  ext.cmdMap['行情'] = cmdmkt;
  ext.cmdMap['散播'] = cmdsay;
  ext.cmdMap['清空背包'] = cmddelbag;
  ext.cmdMap['改名'] = cmdname;
  ext.cmdMap['献祭'] = cmdscrf;
  ext.cmdMap['送'] = cmdgft;
  ext.cmdMap['成就'] = cmdachv;
  ext.cmdMap['使用'] = cmduse;
  ext.cmdMap['转账'] = cmdtransfer;
}