// ==UserScript==
// @name         蟹脚小游戏
// @author       错误
// @version      2.1.1
// @description  使用指令.cult查看游戏指引，使用指令.cult master查看骰主指令\n经验值获得：翻垃圾；遭遇警察，神话生物；强行越狱成功；献祭成功；还有抢劫，战胜等级高的对手可获得更多；\n贡献值：贡献值越高发展信众获得的货币就越高；达到一定上限，献祭成功后可晋升职位；\n职位：职位越高发展信众获得的贡献度越高\n抢劫：成败和等级，武器数值挂钩，同时具有随机性；\n市场目前在买卖多几次后，各地物价会逐渐持平
// @timestamp    1717065841
// 2024-05-30 18:44:01
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/%E8%9F%B9%E8%84%9A%E5%B0%8F%E6%B8%B8%E6%88%8F.js
// ==/UserScript==
// 首先检查是否已经存在
//部分指令参考了星界佬佬的诡秘游戏，虽然已经看不清形状了
let ext = seal.ext.find('蟹脚小游戏');
if (!ext) {
  // 不存在，那么建立扩展
  ext = seal.ext.new('蟹脚小游戏', '错误', '2.1.1');
  // 注册扩展
  seal.ext.register(ext);

  seal.ext.registerIntConfig(ext, "指令间隔/s(抢劫)", 30)
  seal.ext.registerIntConfig(ext, "指令间隔/s(前往)", 30)
  seal.ext.registerIntConfig(ext, "指令间隔/s(逛逛)", 30)
  seal.ext.registerIntConfig(ext, "指令间隔/s(强行越狱)", 60)
  seal.ext.registerIntConfig(ext, "逮捕时间/s", 180)
  seal.ext.registerIntConfig(ext, "精神病院时间/s", 600)
  seal.ext.registerIntConfig(ext, "迷路概率%", 20)
  seal.ext.registerIntConfig(ext, "越狱概率%", 50)
  seal.ext.registerIntConfig(ext, "献祭概率%", 40)
  seal.ext.registerIntConfig(ext, "最大抢夺率%", 50)
  seal.ext.registerIntConfig(ext, "罚款率%", 20)
  seal.ext.registerIntConfig(ext, "价格调整幅度因子", 100)
  seal.ext.registerStringConfig(ext, "教团列表(建议只添加，且修改后需重载插件)", "大衮密令教/黄印兄弟会/银色暮光密教/血腥之舌/不灭之炎的奴仆")
  seal.ext.registerStringConfig(ext, "地点列表(建议只添加，且修改后需重载插件)", "阿卡姆/金斯波特/印斯茅斯/南极营地/拉莱耶/乌撒/无名之城")

  const lead = `游戏指引:
今日商店、查看背包、个人信息、
武器商店、发展信众、教团信息、
买武器、翻垃圾、排行榜、前往、
注销、购入、售出、逛逛、抢劫、
情报、行情、散播、丢弃、改名、
献祭、使用、转账、送`
  const players = {}
  const places = {}
  const cults = {}
  const playerlist = JSON.parse(ext.storageGet("playerlist") || '{}')
  const use = JSON.parse(ext.storageGet("use") || '{}')
  const priceUpdCache = {}

  //所有地点和教团的一个数组
  const allplaces = seal.ext.getStringConfig(ext, "地点列表(建议只添加，且修改后需重载插件)").split('/')
  const allcults = seal.ext.getStringConfig(ext, "教团列表(建议只添加，且修改后需重载插件)").split('/')
  //教团对应的邪神
  const cultgods = {
    "大衮密令教": ["父神大衮", "母神海德拉", "天父克苏鲁"],
    "黄印兄弟会": ["黄衣之王哈斯塔"],
    "银色暮光密教": ["克苏鲁", "犹格索托斯", "奈亚拉托提普"],
    "血腥之舌": ["奈亚拉托提普"],
    "不灭之炎的奴仆": ["活火焰克图格亚"]
  }
  //衣服颜色
  const level = {
    "灰": 250,
    "蓝": 1000,
    "红": 2500,
    "黑": 5000,
    "紫": 10000,
    "白": 15000,
    "金": 20000
  }
  //入教宣誓————懒了不搞了，先摆在这里
  const cultpledge = {
    "大衮密令教": 'Ia!Dagon!我，${players[id].name}，庄严宣誓，我不会妨碍或将深潜者的行动告知他人。我若离弃这誓言，就必被人所讳避，我将被判作不配得大衮宠爱之人，并接受所定的一切惩罚，即便是死。Ia!Dagon!',
    "黄印兄弟会": ``,
    "银色暮光密教": ``,
    "血腥之舌": ``
  }

  //一些文本
  let cultText = ""
  for (let cult of allcults) { cultText += cult + "、" }
  cultText = cultText.slice(0, -1)

  let placeText = ""
  for (let place of allplaces) { placeText += place + "、" }
  placeText = placeText.slice(0, -1)

  //货物列表
  const goodlst = [
    { p: 1, max: 13, min: 10, weight: 40, lst: ["手电筒", "提灯", "土豆", "皮下注射器", "阿司匹林", "女士内衣", "男士内裤", "婴儿奶嘴", "防水火柴", "致死镜", "米纳尔的星石", "羊皮纸"] },
    { p: 1, max: 150, min: 100, weight: 35, lst: ["铅蓄电池", "留声机唱片", "胶卷", "警用手铐", "潜水服", "医用威士忌", "黄铜头像", "瑟德夫卡之像", "梦境结晶器", "书写专用血液"] },
    { p: 0.9, max: 1314, min: 750, weight: 15, lst: ["灵魂精盐", "医用血包", "雷明顿牌打字机", "11.43mm自动手枪子弹", "雪茄", "翡翠小像", "盖尔之镜", "月之透镜"] },
    { p: 0.5, max: 10000, min: 5000, weight: 2, lst: ["夏塔克鸟蛋", "缸中之脑", "黄金蜂蜜酒", "伊波恩戒指", "格拉基启示录残卷", "银之匙", "透特的匕首"] },
    { p: 0.2, max: 93750, min: 31250, weight: 1, lst: ["不明的乳汁", "奇怪多面体", "阿尔哈兹莱德之灯", "光辉的偏方三八面体", "拉莱耶圆盘"] }
  ]
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
    "猎象枪": 65, "20号霰弹枪": 30, "16号霰弹枪": 40, "12号霰弹枪": 60, "12号霰弹枪": 60, "10号霰弹枪": 70,
    "12号贝里尼M3": 60, "12号SPAS": 60, "AKM": 35, "AK-74": 35, "巴雷特M82": 100,
    "FN-FAL": 80, "加利尔突击步枪": 60, "M16A2": 60, "M4": 60, "斯泰尔AUG": 60, "贝雷塔M70": 60, "MP18I": 25, "MP28II": 25, "MP5": 25, "MAC-11": 25,
    "蝎式冲锋枪": 20, "汤普森冲锋枪": 35, "乌兹微型冲锋枪": 25, "1882年式加特林": 80, "M1918式勃朗宁自动步枪": 80, "勃朗宁M1917A1": 80,
    "布伦轻机枪": 80, "路易斯Ⅰ型机枪": 80, "GE-M134式7.62mm速射机枪": 80, "FN米尼米": 60, "维克斯.303机枪": 80,
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
  const myths = [
    "食尸鬼", "古老者", "恐怖猎手", "空鬼",
    "蛇人", "深潜者", "修格斯", "星之彩",
    "炎之精", "钻地魔虫", "拜亚基", "蠕行者",
    "黑山羊幼崽", "飞天水螅", "廷达罗斯猎犬", "米戈",
    "夏盖虫族", "星之眷属", "无形之子"
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

  const views = [
    "图书馆", "森林", "祭坛", "教堂",
    "沙漠", "遗迹", "废弃小屋", "洞穴",
    "剧院", "墓地", "医院", "工厂",
    "学校", "码头", "矿井", "城堡",
    "实验室",
  ]
  const viewwords = ["废弃的", "黑暗的", "古老的", "荒凉的", "暴风雨中的", "幽暗的"]
  const viewfounds = [
    "一本{{word}}书籍，书中记载着关于人类智慧的深刻见解",
    "一位{{word}}吟游诗人，他为你演奏了一首治愈心灵的乐曲",
    "一幅{{word}}壁画，壁画中的光芒照亮了你的内心",
    "一只{{word}}海龟，它缓慢而沉稳的游动让你感到时间的流逝变得缓慢",
    "一片{{word}}绿洲，清澈的泉水和茂密的植被让你感到生命的奇迹",
    "一面{{word}}镜子，镜中的自己显得格外平静和自信",
    "一颗{{word}}宝石，宝石的光芒照亮了你的内心",
    "一台{{word}}留声机，播放的音乐让你感到时光倒流",
    "一瓶{{word}}镇静剂，服用后感到内心的焦虑逐渐平息",
    "一台{{word}}收音机，播放的广播让你感到与外界的联系",
    "一棵{{word}}古树，树下的宁静让你感到内心的平静",
    "一艘{{word}}船只，船上的航海日志让你感到冒险的激情",
    "一颗{{word}}水晶，水晶的光芒照亮了你的内心",
  ]
  const viewfoundwords = ["古老的", "神秘的", "刻有祝福符文的", "巨大的", "温暖的", "发光的", "老旧的"]

  class Player {
    constructor(id, name) {
      this.id = id;
      this.name = name;
      this.cult = allcults[Math.floor(Math.random() * allcults.length)];
      this.place = allplaces[Math.floor(Math.random() * allplaces.length)];
      this.car = '二手别克';
      this.weapon = '催泪瓦斯';
      this.goods = { "土豆": 20 };
      this.san = Math.floor(Math.random() * (80 - 40 + 1)) + 40;
      this.down = 0;
      this.money = 100;
      this.contr = 0;
      this.color = '无'
      this.exp = 0;
      this.time = {
        adTime: 0,
        movTime: 0,
        strollTime: 0,
        healTime: 0,
        robTime: 0,
        arrestTime: 0,
        escTime: 0
      };
    }

    // 从存储中获取数据并初始化玩家对象
    static getData(id) {
      try {
        let idData = JSON.parse(ext.storageGet(id) || '{}');
        let player = new Player(id, idData.name)
        player.cult = idData.cult
        player.place = idData.place
        player.car = idData.car
        player.weapon = idData.weapon
        player.goods = idData.goods
        player.san = idData.san
        player.down = idData.down
        player.money = idData.money
        player.contr = idData.contr
        player.color = idData.color
        player.exp = idData.exp

        players[id] = player
      } catch (error) {
        console.error(`Failed to initialize ${id}:`, error);
      }
    }

    // 保存玩家数据到存储
    saveData() {
      ext.storageSet(this.id, JSON.stringify(this));
    }

    movPlace(dest) {
      let place = this.place
      if (places.hasOwnProperty(place)) {
        places[place].members = places[place].members.filter(item => item !== this.id)
        places[place].saveData()
      }
      if (places.hasOwnProperty(dest)) {
        places[dest].members.push(this.id)
        places[dest].saveData()
      }

      this.place = dest
      this.saveData()
    }

    movCult(dest) {
      let cult = this.cult
      if (cults.hasOwnProperty(cult)) {
        cults[cult].members = cults[cult].members.filter(item => item !== this.id)
        cults[cult].saveData()
      }
      if (cults.hasOwnProperty(dest)) {
        cults[dest].members.push(this.id)
        cults[dest].saveData()
      }

      this.cult = dest
      this.color = '灰'
      this.contr = 0
      this.saveData()
    }

    //把钱从第一个人抢给第二个人，返回抢到的数字
    robMoneyTo(altid) {
      let maxrob = seal.ext.getIntConfig(ext, "最大抢夺率%") / 100
      let lostmoney = Math.ceil(Math.random() * this.money * maxrob)

      this.money -= lostmoney
      players[altid].money += lostmoney
      return lostmoney;
    }

    //将num数量的货物添加到背包，返回溢出数量
    addGoodTo(good, num) {
      let space = carlst[this.car]
      let goodsnum = 0
      for (let good in this.goods) goodsnum += this.goods[good]
      let outnum = goodsnum + num - space

      //货物是否溢出
      if (outnum > 0) {
        num -= outnum
        //增加落魄值作为补偿
        this.down += outnum / 10
        this.down = parseFloat(this.down.toFixed(1));
      } else outnum = 0

      if (num > 0) {
        if (!this.goods.hasOwnProperty(good)) this.goods[good] = num
        else this.goods[good] += num
      }
      this.saveData()
      return outnum;
    }

    //把num数量的货物从背包去除，返回bool
    takeGood(good, num) {
      if (!this.goods.hasOwnProperty(good) || this.goods[good] < num) return false;

      this.goods[good] -= num;
      if (this.goods[good] <= 0) delete this.goods[good];
      this.saveData()
      return true;
    }

    //把货物抢给另一个人，这里老是出bug，抢的都是写什么undefined*NaN啦、啥都没有*null啦  #死掉
    robGoodsTo(altid) {
      let maxrob = seal.ext.getIntConfig(ext, "最大抢夺率%") / 100

      //计算货物数量
      let goodsnum = 0
      for (let good in this.goods) goodsnum += this.goods[good]

      let lostlst = {}
      let drawtime = Math.ceil(Math.random() * goodsnum * maxrob)
      //按权重抽取至少一个货物
      for (let i = 0; i < drawtime; i++) {
        let ran = Math.ceil(Math.random() * goodsnum)
        let tmpsum = 0

        //抽取种类
        for (let good in this.goods) {
          tmpsum += this.goods[good]

          if (ran <= tmpsum) {
            this.takeGood(good, 1)
            lostlst[good] = (lostlst[good] || 0) + 1
            goodsnum -= 1
            break;
          }
        }
      }
      //把货物加给第二个人并输出文本
      let text = ``
      let outnum = 0
      for (let good in lostlst) {
        text += `${good}×${lostlst[good]}、`
        outnum += players[altid].addGoodTo(good, lostlst[good])
      }
      text = text.slice(0, -1)

      if (outnum > 0) text += `溢出${outnum}件`
      return text;
    }

    //抢劫：发起对另一个人的抢劫
    rob(altid, now) {
      this.time.robTime = now

      let place = this.place
      let altplace = players[altid].place
      let weapon1 = this.weapon
      let weapon2 = players[altid].weapon
      let val1 = weaponlst[weapon1] / 5
      let val2 = weaponlst[weapon2] / 5
      let lv1 = this.getLv()[0]
      let lv2 = players[altid].getLv()[0]
      let ran1 = Math.floor(Math.random() * 100)
      let ran2 = Math.floor(Math.random() * 100)
      let text = `在${players[altid].place}
${this.name}(Lv${lv1})=>${players[altid].name}(Lv${lv2})
${weapon1}(${val1 * 5}) vs ${weapon2}(${val2 * 5})\n`

      //位置不对
      if (place !== altplace) {
        let missText = this.ckMiss(altplace)
        if (missText) return missText
        else this.movPlace(altplace)
      }

      //赢
      if (ran1 + lv1 + val1 >= ran2 + lv2 + val2) {
        this.exp += lv1 < lv2 ? lv2 - lv1 : 0
        players[altid].exp += 1

        let goodsnum = 0
        for (let good in players[altid].goods) goodsnum += players[altid].goods[good]

        text += `抢劫成功！\n`
        //抢钱
        if (players[altid].money <= 0) text += `对方钱包空空\n`
        else text += `抢走了$ ${players[altid].robMoneyTo(this.id)}\n`
        //抢货
        if (goodsnum > 20) text += players[altid].robGoodsTo(this.id)
      }
      //输
      else {
        players[altid].exp += lv1 > lv2 ? lv1 - lv2 : 0
        this.exp += 1

        let goodsnum = 0
        for (let good in this.goods) goodsnum += this.goods[good]

        text += `抢劫失败！\n`
        //抢钱
        if (this.money <= 0) text += `你钱包空空\n`
        else text += `被抢走了$ ${this.robMoneyTo(altid)}\n`
        //抢货
        if (goodsnum > 20) text += this.robGoodsTo(altid)
      }
      this.saveData()
      return text;
    }

    //修改san值并判断，返回文本
    stSan(now, num) {
      //修改san值
      this.san += num

      let maxheal = 0.8

      let text = ``
      if (num >= 0) text = `san+${num}=>${this.san}`
      else text = `san${num}=>${this.san}`

      if (this.san <= 0) {
        let lostmoney = Math.ceil(Math.random() * this.money * maxheal)
        lostmoney = lostmoney < 500 ? 500 : lostmoney

        let healInterval = seal.ext.getIntConfig(ext, "精神病院时间/s")
        this.time.healTime = now
        this.san += Math.floor(Math.random() * (80 - 40 + 1)) + 40;
        this.money -= lostmoney

        text += `\nsan值小于零！精神崩溃！被抓进${this.place}精神病院${healInterval}秒，扣除医疗费用$ ${lostmoney}。\nsan值=>${this.san}\n货币=>$ ${this.money}`
      }
      else if (this.san <= 20) {
        text += `\n警告！精神不稳定！`
      }
      else if (this.san > 100) {
        text += "\n哟哈！精神满溢！"
        this.san = 100
      }
      this.saveData()
      return text;
    }

    stMoney(num) {
      this.money += num
      this.saveData()
    }

    //检查指令，返回Bool
    ckCmd(ctx, msg, ckHeal = true, ckArrest = true) {
      const now = parseInt(seal.format(ctx, "{$tTimestamp}"))
      let healInterval = seal.ext.getIntConfig(ext, "精神病院时间/s")
      let arrestInterval = seal.ext.getIntConfig(ext, "逮捕时间/s")
      let text = ``
      if (ckHeal) {
        let t = now - this.time.healTime
        if (t < healInterval) {
          text = `<${this.name}>在精神病院无力地嘶吼着，治疗结束还有${healInterval - t}！`
        }
      }
      if (ckArrest) {
        let t = now - this.time.arrestTime
        if (t < arrestInterval) {
          text = `<${this.name}>在越狱中，还有${arrestInterval - t}秒就可以逃出来了！`
        }
      }
      if (text) {
        seal.replyToSender(ctx, msg, text)
        return true
      } else return false
    }

    //翻垃圾时间~翻一次、返回一段文本
    rubbish() {
      this.down -= 6
      this.down = parseFloat(this.down.toFixed(1));
      this.exp += 1
      let ran = Math.random()
      let text = ``
      //翻到货物
      if (ran <= 0.85) {
        let ran = Math.random()
        let good
        let num = 0

        //按权重概率抽取
        let sumW = 0
        for (let i = 0; i < goodlst.length; i++) sumW += goodlst[i].weight
        let tmpW = 0
        for (let i = 0; i < goodlst.length; i++) {
          tmpW += goodlst[i].weight
          if (ran <= tmpW / sumW) {
            let goods = goodlst[i].lst
            good = goods[Math.floor(Math.random() * goods.length)]
            num = Math.ceil(Math.random() * goodlst[i].weight)
            break;
          }
        }

        let outnum = this.addGoodTo(good, num)
        text = `${good}×${num}`
        if (outnum > 0) text += `，溢出${outnum}件`
      }
      //翻到回san道具
      else if (ran <= 0.95) {
        let good = '圣水'
        let num = 1

        let outnum = this.addGoodTo(good, num)
        text = `${good}×${num}`
        if (outnum > 0) text += `，溢出${outnum}件`
      }
      //翻到车
      else {
        let formercar = this.car
        let cars = Object.keys(carlst)
        let car = cars[Math.floor(Math.random() * cars.length)]

        if (carlst[this.car] > carlst[car]) {
          this.money += carlst[car]
          text = `一台${car}！卖掉赚了$ ${carlst[car]}！`
        }
        else {
          this.car = car
          text = `一台${car}！原来的${formercar}就丢到垃圾堆里吧。`
        }
      }
      this.saveData()
      return text;
    }

    ckMiss(altplace) {
      let text = ``
      if (Math.random() * 100 <= seal.ext.getIntConfig(ext, "迷路概率%")) {
        let newplace
        let place = this.place

        do newplace = allplaces[Math.floor(Math.random() * allplaces.length)]
        while (newplace == place || newplace == altplace)

        this.movPlace(newplace)
        text = `<${this.name}>迷路了！走着走着竟然到了${newplace}！\n`
      }
      return text
    }

    meetMyth(now) {
      let lostsan = Math.ceil(Math.random() * 6)
      let view = views[Math.floor(Math.random() * views.length)]
      let viewword = viewwords[Math.floor(Math.random() * viewwords.length)]
      let myth = myths[Math.floor(Math.random() * myths.length)]
      let mythword = mythwords[Math.floor(Math.random() * mythwords.length)]
      this.exp += 1
      return `在${this.place}，${viewword + view}\n<${this.name}>遇到了${mythword}${myth}！\n${this.stSan(now, -lostsan)}`
    }

    meetOther(now, ctx, msg) {
      let members = places[this.place].members
      let altid
      do altid = members[Math.floor(Math.random() * members.length)]
      while (altid == this.id && members.length > 1)

      if (players[altid].ckCmd(ctx, msg)) return;

      return `遭遇了抢劫！\n${this.rob(altid, now)}`
    }

    meetPolice(now) {
      let arrestInterval = seal.ext.getIntConfig(ext, "逮捕时间/s")
      let fine_p = seal.ext.getIntConfig(ext, "罚款率%") / 100

      let fine = Math.floor(this.money * fine_p)
      let goods = Object.keys(this.goods)
      let good = goods[Math.floor(Math.random() * goods.length)]
      let num = Math.ceil(this.goods[good] * fine_p)


      this.exp += 1
      this.money -= fine
      this.down += 10
      this.time.arrestTime = now
      this.takeGood(good, num)

      let reason = goods.length > 0 ? `检查出车上有${good}，没收${good}×${num}！` : ``

      return `在${this.place}
<${this.name}>遇到了警察，被抓起来了！但作为一名教徒，越狱只需${arrestInterval}秒！
${reason}
落魄值+10=>${this.down}
货币-$ ${fine}`
    }

    meetView(now) {
      let addsan = Math.ceil(Math.random() * 6)
      let view = views[Math.floor(Math.random() * views.length)]
      let viewword = viewwords[Math.floor(Math.random() * viewwords.length)]
      let viewfound = viewfounds[Math.floor(Math.random() * viewfounds.length)]
      let viewfoundword = viewfoundwords[Math.floor(Math.random() * viewfoundwords.length)]
      return `在${this.place}，${viewword + view}\n<${this.name}>遇到了${viewfound.replace('{{word}}', viewfoundword)}\n${this.stSan(now, addsan)}`
    }

    meet(now, ctx, msg) {
      let members = places[this.place].members
      let ran = Math.random()
      if (members.length > 1 && ran <= 0.3) return this.meetOther(now, ctx, msg)
      else if (ran <= 0.6) return this.meetMyth(now)
      else if (ran <= 0.9) return this.meetPolice(now)
      else return this.meetView(now)
    }

    getLv() {
      let expLimit = 10
      let lv = 1
      while (this.exp >= expLimit) {
        lv += 1
        expLimit += lv * 10
      }
      return [lv, expLimit]
    }

    colorUp() {
      let color = this.color
      let text = ``
      if (this.contr >= level[color]) {
        let colors = Object.keys(level)
        let index = colors.indexOf(color)
        if (index == colors.length - 1) text = `\n已达到最高位阶`
        else {
          this.color = colors[index + 1]
          text = `\n晋升至${this.color}衣`
        }
      }
      return text;
    }

    /**使用货物，返回文本*/
    useGood(good, num, now) {
      if (good == "圣水") {
        this.takeGood('圣水', num)
        return `<${this.name}>使用了${good}×${num}\n${this.stSan(now, 10 * num)}`
      }
      if (Object.keys(weaponlst).includes(good)) {
        let formerweapon = this.weapon
        this.weapon = good
        this.takeGood(good, 1)
        this.addGoodTo(formerweapon, 1)
        return `<${this.name}>更换了武器\n${formerweapon}=>${good}`
      }
      if (Object.keys(use).includes(good)) {
        this.takeGood(good, num)
        return use[good]
      }
      return `无法使用${good}`
    }

    /**发展信众 */
    mission(now) {
      let increase = Math.floor(Math.random() * (150 - 100 + 1)) + 100
      let index = Object.keys(level).indexOf(this.color)
      increase *= index + 1
      let timestamp = this.time.adTime * 1000

      if (new Date(timestamp).toDateString() === new Date().toDateString()) {
        return `<${this.name}>今天的传单已经派完了`
      }

      this.time.adTime = now
      this.contr += increase

      let moneyincrease = this.contr * (Math.floor(Math.random() * (15 - 5 + 1)) + 5)
      this.money += moneyincrease

      this.saveData()
      return `在${this.place}\n<${this.name}>发展了${increase}个信众。\n贡献度=>${this.contr}\n货币+$ ${moneyincrease}=>$ ${this.money}`
    }
  }

  class Place {
    constructor(name) {
      this.name = name
      this.members = []
      this.says = []
      this.shop = {}
      this.date = ''
    }

    // 从存储中获取数据并初始化地点对象
    static getData(name) {
      try {
        let placeData = JSON.parse(ext.storageGet(name) || '{}');
        let place = new Place(name)
        place.members = placeData.members || []
        place.says = placeData.says || []
        place.shop = placeData.shop || {}
        place.date = placeData.date || ''

        places[name] = place
      } catch (error) {
        console.error(`Failed to initialize ${name}:`, error);
      }
    }

    // 保存地点数据到存储
    saveData() {
      ext.storageSet(this.name, JSON.stringify(this));
    }

    //更新当地商店
    updateshop(date) {
      this.date = date
      this.shop = {}

      let ran = Math.random()
      for (let i = 0; i < goodlst.length; i++) {
        if (ran < goodlst[i].p) {
          let max = goodlst[i].max
          let min = goodlst[i].min
          let goods = goodlst[i].lst
          let good;

          //生成商品列表
          for (let k = 0; k < Math.ceil(goods.length / 2); k++) {
            do good = goods[Math.floor(Math.random() * goods.length)]
            while (this.shop.hasOwnProperty(good))
            this.shop[good] = Math.floor(Math.random() * (max - min + 1)) + min
          }
        }
      }

      this.saveData()
    }

    //获取当地商店货物列表，返回文本
    getShop(date) {
      let place = this.name
      if (this.date != date) this.updateshop(date)

      let shoplst = Object.keys(this.shop)
      let text = `${place}商店`
      let good = ''
      for (let i = 0; i < shoplst.length; i++) {
        good = shoplst[i]
        text += i % 2 == 0 ? `\n` : `|`
        text += `${good}:$${this.shop[good]}`
      }
      return text
    }

    /**动态调整售价，num为正，指售出的数量，num为负，指购入的数量 */
    adjustPrice(good, num) {
      //先调整缓存的价格
      if (priceUpdCache.hasOwnProperty(good)) {
        let place = priceUpdCache[good].place
        let price = priceUpdCache[good].price

        if (places[place].shop.hasOwnProperty(good)) {
          places[place].shop[good] = price
          places[place].saveData()
        }
      }

      let factor = seal.ext.getIntConfig(ext, "价格调整幅度因子")
      let price = this.shop[good]
      let maxprice, minprice
      for (let i = 0; i < goodlst.length; i++) {
        if (goodlst[i].lst.includes(good)) {
          let prices = []
          for (let place of allplaces) if (places[place].shop.hasOwnProperty(good)) prices.push(places[place].shop[good])
          prices.sort((a, b) => b - a)
          maxprice = prices[0]
          minprice = prices[prices.length - 1]
          break;
        }
      }
      
      let midprice = (maxprice + minprice) / 2
      let profit = (maxprice - minprice) / minprice
      let adjustFactor = (maxprice - minprice) * (profit + 1) / factor

      if (num > 0) {
        price -= Math.floor(adjustFactor * num)
        price = Math.max(price, midprice)
      }
      else {
        price += Math.floor(adjustFactor * (-num))
        price = Math.min(price, midprice)
      }

      priceUpdCache[good] = {
        place: this.name,
        price: price
      }
    }
  }

  class Cult {
    constructor(name) {
      this.name = name
      this.members = []
      this.ones = {}
      this.weapons = {}
      this.date = ''
    }

    // 从存储中获取数据并初始化教团对象
    static getData(name) {
      try {
        let cultData = JSON.parse(ext.storageGet(name) || '{}');
        let cult = new Cult(name)
        cult.members = cultData.members || []
        cult.ones = cultData.ones || {}
        cult.weapons = cultData.weapons || {}
        cult.date = cultData.date || ''

        cults[name] = cult
      } catch (error) {
        console.error(`Failed to initialize ${cult}:`, error);
      }
    }

    // 保存教团数据到存储
    saveData() {
      ext.storageSet(this.name, JSON.stringify(this));
    }

    //更新武器商店
    updateWeapon(date) {
      this.date = date
      this.weapons = {}

      let weapon
      let weapons = Object.keys(weaponlst)

      for (let i = 0; i < 5; i++) {
        do weapon = weapons[Math.floor(Math.random() * weapons.length)]
        while (this.weapons.hasOwnProperty(weapon))
        let num = weaponlst[weapon] / 5
        this.weapons[weapon] = {
          price: Math.ceil(Math.pow(1.2, num) * 100 * num),
          rest: Math.ceil(Math.random() * 2)
        }
      }

      this.saveData()
    }
    //生成武器商店
    weaponShop(date) {
      let cult = this.name
      if (this.date != date) this.updateWeapon(date)

      let shoplst = Object.keys(this.weapons)
      let text = `${cult}武器商店`
      for (let i = 0; i < shoplst.length; i++) {
        let weapon = shoplst[i]
        text += `\n${weapon}(${weaponlst[weapon]}):$ ${this.weapons[weapon].price} 剩余:${this.weapons[weapon].rest}`
      }
      return text
    }
  }

  //初始化————
  for (let id in playerlist) if (!players.hasOwnProperty(id)) Player.getData(id)
  for (let place of allplaces) if (!places.hasOwnProperty(place)) Place.getData(place)
  for (let cult of allcults) if (!cults.hasOwnProperty(cult)) {
    Cult.getData(cult)
    if (cultgods.hasOwnProperty(cult)) cultgods[cult].forEach(god => { if (!cults[cult].ones.hasOwnProperty(god)) cults[cult].ones[god] = 0; })
  }

  function getTime() {
    const now = new Date();
    const dateString = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }).replace(/,/g, '');;
    const [date, time] = dateString.split(' ');
    const [month, day, year] = date.split('/');
    const [hours, minutes, seconds] = time.split(':');

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hours}:${minutes}:${seconds}`;
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

  //检查是否存在该玩家并加入游戏
  function ckId(id, name) {
    if (!playerlist.hasOwnProperty(id)) {
      const player = new Player(id, name)
      players[id] = player
      players[id].movPlace(players[id].place)
      players[id].movCult(players[id].cult)
      playerlist[id] = getTime()
      ext.storageSet('playerlist', JSON.stringify(playerlist));
    }
  }

  /**检查参数是否为数字并返回，若为all则返回ifAll，无效则返回0*/
  function ckNum(val, ifAll) {
    switch (val) {
      case '': return 1
      case 'all': return ifAll
      default: {
        val = parseInt(val)
        return isNaN(val) ? 0 : val
      }
    }
  }

  function findPlayer(text) {
    text = text.toLowerCase()
    let lst = []
    for (let id in players) if (players[id].name.includes(text)) lst.push(id)
    return lst
  }

  const cmdadd = seal.ext.newCmdItemInfo();
  cmdadd.name = "加入";
  cmdadd.help = "指令：.加入 教团（当前教团可用 .教团信息 查看），或者使用 .加入 随便";
  cmdadd.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const id = ctx.player.userId
    const name = ctx.player.name
    ckId(id, name)

    switch (val) {
      case "":
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      case "随便": {
        val = allcults[Math.floor(Math.random() * allcults.length)]
        break;
      }
    }

    //乱写是吧
    if (!allcults.includes(val)) {
      seal.replyToSender(ctx, msg, `很抱歉，你不能自创教团。目前可加入的有${cultText}`)
      return;
    }

    const cult = val
    if (!playerlist.hasOwnProperty(id)) {
      players[id].movCult(cult)
      seal.replyToSender(ctx, msg, `${name}，欢迎你加入${cult}。你来到了${players[id].place}。当前有$ 100,土豆×20`)
      seal.replyToSender(ctx, msg, lead)
      return;
    } else {
      if (players[id].ckCmd(ctx, msg)) return;
      if (players[id].cult == cult) {
        seal.replyToSender(ctx, msg, `${players[id].name}，你已经是${cult}的成员了!`)
        return;
      }
      players[id].movCult(cult)
      seal.replyToSender(ctx, msg, `${players[id].name}，欢迎你加入${cult}。`)
      return;
    }
  }

  const cmdShop = seal.ext.newCmdItemInfo();
  cmdShop.name = "今日商店";
  cmdShop.help = "指令：.今日商店 （地点）";
  cmdShop.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const id = ctx.player.userId
    const name = ctx.player.name
    //检查是否存在
    ckId(id, name)

    if (!val) val = players[id].place
    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        //又乱写是吧
        if (!allplaces.includes(val)) {
          seal.replyToSender(ctx, msg, `暂无此地。目前的地点有${placeText}`)
          return;
        }

        const date = seal.format(ctx, "{$tDate}")
        seal.replyToSender(ctx, msg, places[val].getShop(date) + `\n你目前有$ ${players[id].money}。`)
        return;
      }
    }
  }

  const cmdgoods = seal.ext.newCmdItemInfo();
  cmdgoods.name = "查看背包";
  cmdgoods.help = "指令：.查看背包（如果你的背包里出现了undefined、NaN、null之类不可名状的脏东西，请使用 .清除背包 ，以免传染给其他人）";
  cmdgoods.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const id = ctx.player.userId
    const name = ctx.player.name
    const now = parseInt(seal.format(ctx, "{$tTimestamp}"))
    ckId(id, name)

    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        let money = players[id].money
        let arr = Object.keys(players[id].goods)

        //计算货物数量
        let goodsnum = 0
        for (let good in players[id].goods) goodsnum += players[id].goods[good]

        text = `<${players[id].name}>的背包：\n货币：$ ${money}\n空间:${goodsnum}/${carlst[players[id].car]}`
        for (let i = 0; i < arr.length; i++) {
          if (players[id].goods[arr[i]] != 0) {
            if (weaponlst.hasOwnProperty(arr[i])) text += `\n${arr[i]}(${weaponlst[arr[i]]})×${players[id].goods[arr[i]]}`
            else text += `\n${arr[i]}×${players[id].goods[arr[i]]}`
          }
        }
        seal.replyToSender(ctx, msg, text)
        return;
      }
    }
  }

  const cmdmove = seal.ext.newCmdItemInfo();
  cmdmove.name = "前往";
  cmdmove.help = `指令：.前往 地点（目前可去的地点有${placeText}）`;
  cmdmove.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const id = ctx.player.userId
    const name = ctx.player.name
    const now = parseInt(seal.format(ctx, "{$tTimestamp}"))
    ckId(id, name)
    if (players[id].ckCmd(ctx, msg)) return

    //冷却时间~
    let interval = seal.ext.getIntConfig(ext, "指令间隔/s(前往)")
    if (now - players[id].time.movTime < interval) return;

    switch (val) {
      case "":
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        //又乱写是吧
        if (!allplaces.includes(val)) {
          seal.replyToSender(ctx, msg, `暂无此地。目前可去的地点有${placeText}`)
          return;
        }

        if (val == players[id].place) {
          seal.replyToSender(ctx, msg, `你已经到${val}啦！`)
          return;
        }

        players[id].time.movTime = now
        players[id].movPlace(val)
        seal.replyToSender(ctx, msg, players[id].meet(now, ctx, msg));
      }
    }
  }

  const cmdCancel = seal.ext.newCmdItemInfo();
  cmdCancel.name = "注销";
  cmdCancel.help = "指令：.注销（注销就是注销了）";
  cmdCancel.allowDelegate = true;
  cmdCancel.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getRestArgsFrom(1)
    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    const id = mctx.player.userId
    const name = mctx.player.name
    ckId(id, name)

    if (ctx.player.userId !== mctx.player.userId && ctx.privilegeLevel < 100) {
      seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
      return;
    }

    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      case "确认": {
        players[id].movCult('不存在')
        players[id].movPlace('不存在')
        delete players[id]
        delete playerlist[id]
        ext.storageSet('playerlist', JSON.stringify(playerlist));

        seal.replyToSender(ctx, msg, "注销成功！")
        return;
      }
      default: {
        seal.replyToSender(ctx, msg, "请使用 【.注销 确认】 进行注销！")
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
    const id = ctx.player.userId
    const name = ctx.player.name
    const now = parseInt(seal.format(ctx, "{$tTimestamp}"))
    ckId(id, name)
    if (players[id].ckCmd(ctx, msg)) return

    let money = players[id].money
    let place = players[id].place
    const date = seal.format(ctx, "{$tDate}")
    places[place].getShop(date)

    switch (val) {
      case "":
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        if (!places[place].shop.hasOwnProperty(val)) {
          seal.replyToSender(ctx, msg, `没有在售。<${players[id].name}>当前位于${players[id].place}`)
          return;
        }

        let space = carlst[players[id].car]
        let goodsnum = 0
        for (let good in players[id].goods) goodsnum += players[id].goods[good]

        let maxCost = Math.floor(money / places[place].shop[val])
        let ifAll = goodsnum + maxCost > space ? space - goodsnum : maxCost
        ifAll = ifAll == 0 ? 1 : ifAll
        val2 = ckNum(val2, ifAll)
        if (val2 <= 0) {
          seal.replyToSender(ctx, msg, '请输入正确的数字！');
          return;
        }

        //溢出的情况
        if (goodsnum + val2 > space) {
          seal.replyToSender(ctx, msg, `<${players[id].name}>的车装不下啦！`)
          return;
        }

        let price = places[place].shop[val] * val2
        //钱不够的情况
        if (price > money) {
          seal.replyToSender(ctx, msg, `<${players[id].name}>看了看自己的钱包摇了摇头。`)
          return;
        }

        players[id].money -= price
        places[place].adjustPrice(val, -val2)
        players[id].addGoodTo(val, val2)

        seal.replyToSender(ctx, msg, `<${players[id].name}>花费了$ ${price}，购买到${val}×${val2}。`)
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
    const id = ctx.player.userId
    const name = ctx.player.name
    ckId(id, name)
    if (players[id].ckCmd(ctx, msg)) return

    const date = seal.format(ctx, "{$tDate}")
    let place = players[id].place
    places[place].getShop(date)

    let text = ``
    let increase = 0

    switch (val) {
      case "":
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      //卖掉所有能卖的货物
      case "all": {
        for (let good in players[id].goods) {
          if (places[place].shop.hasOwnProperty(good)) {
            let num = players[id].goods[good]

            let price = places[place].shop[good] * num
            increase += price
            text += `\n${good}×${num}、`
            players[id].money += price
            places[place].adjustPrice(good, num)
            players[id].takeGood(good, num)
          }
        }

        if (increase == 0) {
          seal.replyToSender(ctx, msg, `<${players[id].name}>的背包里好像没什么好卖的呢~`)
          return;
        }

        break;
      }
      default: {
        if (!places[place].shop.hasOwnProperty(val)) {
          seal.replyToSender(ctx, msg, `<${players[id].name}>当前位于${players[id].place}。暂不收购该商品。`)
          return;
        }
        if (!players[id].goods.hasOwnProperty(val)) {
          seal.replyToSender(ctx, msg, "库中没有此物品。")
          return;
        }

        val2 = ckNum(val2, players[id].goods[val])
        if (val2 <= 0) {
          seal.replyToSender(ctx, msg, '请输入正确的数字！');
          return;
        }
        if (players[id].goods[val] < val2) {
          seal.replyToSender(ctx, msg, "库中物品数量不足！")
          return;
        }

        increase = places[place].shop[val] * val2
        text = `${val}×${val2}、`

        players[id].money += increase
        places[place].adjustPrice(val, val2)
        players[id].takeGood(val, val2)

        break;
      }
    }
    seal.replyToSender(ctx, msg, `<${players[id].name}>出售了${text.slice(0, -1)}\n货币+$ ${increase}=>$ ${players[id].money}。`)
    return;
  }

  const cmdCheat = seal.ext.newCmdItemInfo();
  cmdCheat.name = "cult";
  cmdCheat.help = lead;
  cmdCheat.allowDelegate = true;
  cmdCheat.solve = (ctx, msg, cmdArgs) => {
    if (ctx.privilegeLevel < 100) {
      seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
      return;
    }
    let val = cmdArgs.getArgN(1);
    let val2 = cmdArgs.getArgN(2);
    let val3 = cmdArgs.getArgN(3);

    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    const id = mctx.player.userId
    const name = mctx.player.name
    const now = parseInt(seal.format(ctx, "{$tTimestamp}"))
    ckId(id, name)

    switch (val) {
      case "":
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      case 'master': {
        seal.replyToSender(ctx, msg, "参数：clr、find、add、del、upd、free、arrest、money、san、contr、down、exp、赏、赐、加时")
        return;
      }
      case 'clr': {
        for (let id in playerlist) if (playerlist.hasOwnProperty(id)) delete playerlist[id]
        ext.storageSet('playerlist', JSON.stringify(playerlist))
        seal.replyToSender(ctx, msg, `清除成功！`)
        return;
      }
      case 'find': {
        if (!val2) {
          seal.replyToSender(ctx, msg, `参数2为名字。`)
          return;
        }

        let lst = findPlayer(val2)
        if (lst.length == 0) {
          seal.replyToSender(ctx, msg, `没有找到${val2}。`)
          return;
        }

        let text = '查询如下:'
        for (let i = 0; i < lst.length; i++) text += `\n${players[lst[i]].name}(${lst[i]})`

        seal.replyToSender(ctx, msg, text)
        return;
      }
      case 'upd': {
        switch (val2) {
          case 'shop': {
            for (let place of allplaces) {
              places[place].date = ''
              places[place].saveData()
            }
            seal.replyToSender(ctx, msg, `商店刷新成功！`)
            return;
          }
          case 'weapon': {
            for (let cult of allcults) {
              cults[cult].date = ''
              cults[cult].saveData()
            }
            seal.replyToSender(ctx, msg, `武器商店刷新成功！`)
            return;
          }
          case 'place': {
            for (let id in playerlist) {
              let newplace = allplaces[Math.floor(Math.random() * allplaces.length)]
              players[id].movPlace(newplace)
            }
            seal.replyToSender(ctx, msg, `玩家地点刷新成功！`)
            return;
          }
          default: {
            seal.replyToSender(ctx, msg, `参数2为shop、weapon、place。`)
            return;
          }
        }
      }
      case 'free': {
        //关进医院时间
        players[id].time.healtime = 0
        //被抓时间
        players[id].time.arrestTime = 0
        seal.replyToSender(ctx, msg, `释放成功！`)
        return;
      }
      case 'arrest': {
        //被抓时间
        players[id].time.arrestTime = now
        seal.replyToSender(ctx, msg, `逮捕成功！`)
        return;
      }
      case 'money': {
        let increase = parseInt(val2)
        if (isNaN(increase)) {
          seal.replyToSender(ctx, msg, `请输入数字`)
          return;
        }

        players[id].money = increase
        players[id].saveData()
        seal.replyToSender(ctx, msg, `修改money成功！`)
        return;
      }
      case 'san': {
        let increase = parseInt(val2)
        if (isNaN(increase)) {
          seal.replyToSender(ctx, msg, `请输入数字`)
          return;
        }

        players[id].san = increase
        players[id].saveData()
        seal.replyToSender(ctx, msg, `修改san值成功！`)
        return;
      }
      case 'contr': {
        let increase = parseInt(val2)
        if (isNaN(increase)) {
          seal.replyToSender(ctx, msg, `请输入数字`)
          return;
        }

        players[id].contr = increase
        players[id].saveData()
        seal.replyToSender(ctx, msg, `修改贡献度成功！`)
        return;
      }
      case 'down': {
        let increase = parseInt(val2)
        if (isNaN(increase)) {
          seal.replyToSender(ctx, msg, `请输入数字`)
          return;
        }

        players[id].down = increase
        players[id].saveData()
        seal.replyToSender(ctx, msg, `修改落魄值成功！`)
        return;
      }
      case 'exp': {
        let increase = parseInt(val2)
        if (isNaN(increase)) {
          seal.replyToSender(ctx, msg, `请输入数字`)
          return;
        }

        players[id].exp = increase
        players[id].saveData()
        seal.replyToSender(ctx, msg, `修改经验值成功！`)
        return;
      }
      case '赏': {
        let increase = parseInt(val2)
        if (isNaN(increase)) {
          seal.replyToSender(ctx, msg, `请输入数字`)
          return;
        }

        for (let id in playerlist) {
          players[id].money += increase
          players[id].saveData()
        }

        seal.replyToSender(ctx, msg, `赏$ ${increase}成功！`)
        return;
      }
      case '赐': {
        if (!val3) {
          seal.replyToSender(ctx, msg, `参数3缺失`)
          return;
        }
        let num = parseInt(val3)
        if (isNaN(num) || num <= 0) {
          seal.replyToSender(ctx, msg, `请输入大于0的数字`)
          return;
        }
        for (let id in playerlist) players[id].addGoodTo(val2, num)

        seal.replyToSender(ctx, msg, `赐${val2}×${num}成功！`)
        return;
      }
      case '加时': {
        let increase = parseInt(val2)
        if (isNaN(increase) || increase <= 0) {
          seal.replyToSender(ctx, msg, `请输入大于0的数字`)
          return;
        }

        //被抓时间
        players[id].time.arrestTime += increase
        seal.replyToSender(ctx, msg, `加时${increase}秒成功！`)
        return;
      }
      case 'add': {
        let val3 = cmdArgs.getRestArgsFrom(3)
        if (!val3) {
          seal.replyToSender(ctx, msg, `add 物品名称 回执`)
          return;
        }
        use[val2] = val3
        ext.storageSet('use', JSON.stringify(use));
        seal.replyToSender(ctx, msg, `添加成功！`)
        return;
      }
      case 'del': {
        if (!val2) {
          seal.replyToSender(ctx, msg, `del 物品名称`)
          return;
        }
        if (!use.hasOwnProperty(val2)) {
          seal.replyToSender(ctx, msg, `没有此物品`)
          return;
        }
        delete use[val2]
        ext.storageSet('use', JSON.stringify(use));
        seal.replyToSender(ctx, msg, `删除成功！`)
        return;
      }
      default: {
        if (!val) return
        //修改背包物品
        let increase = parseInt(val2)
        if (isNaN(increase) || increase < 0) {
          seal.replyToSender(ctx, msg, `请输入大于等于0的数字`)
          return;
        }

        players[id].goods[val] = increase
        if (increase == 0) delete players[id].goods[val];

        seal.replyToSender(ctx, msg, `修改背包成功！`)
        return;
      }
    }
  }

  const cmdinfo = seal.ext.newCmdItemInfo();
  cmdinfo.name = "个人信息";
  cmdinfo.help = "指令：.个人信息";
  cmdinfo.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const id = ctx.player.userId
    const name = ctx.player.name
    ckId(id, name)

    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        const player = players[id]
        //计算等级
        let [lv, expLimit] = player.getLv()

        //计算货物数量
        let goodsnum = 0
        for (let good in player.goods) goodsnum += player.goods[good]

        let qq = id.replace(/\D+/g, '')

        title = `﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌[CQ:image,file=http://q2.qlogo.cn/headimg_dl?dst_uin=${qq}&spec=5]昵称:<${player.name}>
所属:${player.cult}
职位:${player.color}衣
等级:${lv} (${player.exp}/${expLimit})
san值:${player.san} | 贡献度:${player.contr}/${level[player.color]}
落魄值:${player.down} | 货币:$ ${player.money}
武器:${player.weapon}  数值:${weaponlst[player.weapon]}
载具:${player.car} (${goodsnum}/${carlst[player.car]})
位置:${player.place}
加入时间:${playerlist[id]}`
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
    const id = ctx.player.userId
    const name = ctx.player.name
    //检查是否存在
    ckId(id, name)

    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        let cult = players[id].cult
        const date = seal.format(ctx, "{$tDate}")

        seal.replyToSender(ctx, msg, `${cults[cult].weaponShop(date)}\n<${players[id].name}>目前有$ ${players[id].money}。\n（指令：.买武器 武器名称）`)
        return;
      }
    }
  }

  const cmdbwp = seal.ext.newCmdItemInfo();
  cmdbwp.name = "买武器";
  cmdbwp.help = "指令：.买武器 武器名称";
  cmdbwp.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getRestArgsFrom(1)
    const id = ctx.player.userId
    const name = ctx.player.name
    const now = parseInt(seal.format(ctx, "{$tTimestamp}"))
    ckId(id, name)
    if (players[id].ckCmd(ctx, msg)) return

    const date = seal.format(ctx, "{$tDate}")
    const cult = players[id].cult
    let money = players[id].money
    cults[cult].weaponShop(date)

    switch (val) {
      case "":
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        if (!cults[cult].weapons.hasOwnProperty(val)) {
          seal.replyToSender(ctx, msg, `没有在售。`)
          return;
        }
        //剩余数量不足
        if (cults[cult].weapons[val].rest <= 0) {
          seal.replyToSender(ctx, msg, `${val}已经卖光啦！`)
          return;
        }

        let space = carlst[players[id].car]
        let goodsnum = 0
        for (let good in players[id].goods) goodsnum += players[id].goods[good]

        //钱不够
        let price = cults[cult].weapons[val].price
        if (price > money) {
          seal.replyToSender(ctx, msg, `钱不够呢。`)
          return;
        }

        //溢出的情况
        if (goodsnum + 1 > space) {
          seal.replyToSender(ctx, msg, `<${players[id].name}>的车装不下啦！`)
          return;
        }

        players[id].money -= price
        cults[cult].weapons[val].rest -= 1
        players[id].addGoodTo(val, 1)
        players[id].useGood(val, 1, now)

        seal.replyToSender(ctx, msg, `<${players[id].name}>花费了$ ${price}，购买到${val}。`)
        return;
      }
    }
  }

  const cmdmission = seal.ext.newCmdItemInfo();
  cmdmission.name = "发展信众";
  cmdmission.help = "指令：.发展信众";
  cmdmission.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const id = ctx.player.userId
    const name = ctx.player.name
    const now = parseInt(seal.format(ctx, "{$tTimestamp}"))
    ckId(id, name)
    if (players[id].ckCmd(ctx, msg)) return

    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        seal.replyToSender(ctx, msg, players[id].mission(now))
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
          let allcontr = cults[cult].members.length;//加上玩家人数
          let allmoney = 0;
          for (let id of cults[cult].members) {
            allcontr += players[id].contr
            allmoney += players[id].money
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
    const id = ctx.player.userId
    const name = ctx.player.name
    const now = parseInt(seal.format(ctx, "{$tTimestamp}"))
    ckId(id, name)
    if (players[id].ckCmd(ctx, msg)) return

    let interval = seal.ext.getIntConfig(ext, "指令间隔/s(逛逛)")
    if (now - players[id].time.strollTime < interval) return;

    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        players[id].time.strollTime = now
        seal.replyToSender(ctx, msg, players[id].ckMiss('不存在') + players[id].meet(now, ctx, msg))
        return;
      }
    }
  }

  const cmdRob = seal.ext.newCmdItemInfo();
  cmdRob.name = "抢劫";
  cmdRob.help = "指令：.抢劫(@你要抢的冤大头)";
  cmdRob.allowDelegate = true;
  cmdRob.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    const id = ctx.player.userId
    const name = ctx.player.name
    const now = parseInt(seal.format(ctx, "{$tTimestamp}"))
    ckId(id, name)
    if (players[id].ckCmd(ctx, msg)) return

    let altid = mctx.player.userId
    let altname = mctx.player.name
    ckId(altid, altname)
    if (players[altid].ckCmd(ctx, msg)) return


    let interval = seal.ext.getIntConfig(ext, "指令间隔/s(抢劫)")
    if (now - players[id].time.robTime < interval) return;

    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        //随机选一个冤大头
        if (id == altid) {
          let place = players[id].place
          let members = places[place].members

          if (members.length == 1) {
            seal.replyToSender(ctx, msg, `${place}似乎没有可以抢的目标呢。`)
            return;
          } else {
            do altid = members[Math.floor(Math.random() * members.length)]
            while (altid == id)
            if (players[altid].ckCmd(ctx, msg)) return
          }
        }

        seal.replyToSender(ctx, msg, players[id].rob(altid, now))
        return;
      }
    }
  }

  //翻垃圾嘿嘿嘿
  const cmdrub = seal.ext.newCmdItemInfo();
  cmdrub.name = "翻垃圾";
  cmdrub.help = "指令：.翻垃圾（三连/十连）（每翻一次需要3点落魄值）";
  cmdrub.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const id = ctx.player.userId
    const name = ctx.player.name
    ckId(id, name)
    if (players[id].ckCmd(ctx, msg)) return

    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        let down = players[id].down
        let replytext = `<${players[id].name}>在垃圾堆里面开始翻找，竟然找到了:\n`
        let num = ckNum(val, 10)
        if (num <= 0 || num > 10) {
          seal.replyToSender(ctx, msg, `请输入1~10的数字！`)
          return;
        }

        if (down < 6 * num) {
          seal.replyToSender(ctx, msg, `<${players[id].name}>你还没有落魄到要到垃圾堆进货的程度——\n当前落魄值：${down}`)
          return;
        }
        for (let i = 0; i < num; i++) replytext += players[id].rubbish() + `\n`
        replytext += `落魄值-${6 * num}=>${players[id].down}`
        seal.replyToSender(ctx, msg, replytext)
        return;
      }
    }
  }

  const cmdChart = seal.ext.newCmdItemInfo();
  cmdChart.name = "排行榜";
  cmdChart.help = "指令：.排行榜 (贡献/等级) [me/@]";
  cmdChart.allowDelegate = true
  cmdChart.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    let val2 = cmdArgs.getArgN(2);
    const id = ctx.player.userId
    const name = ctx.player.name
    ckId(id, name)

    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    let altid = mctx.player.userId
    let altname = mctx.player.name
    ckId(altid, altname)

    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      //贡献排行榜
      case "贡献": {
        let contr = {}
        for (let id in playerlist) contr[id] = players[id].contr

        let arr = Object.keys(contr).sort(function (a, b) { return contr[b] - contr[a] })

        if (altid != id || val2 == "me") {
          let index = arr.indexOf(altid)
          seal.replyToSender(ctx, msg, `<${players[altid].name}>的贡献：${players[altid].contr} 第${index + 1}名`)
          return;
        }

        let title = `贡献排行榜\n♚`
        for (let i = 0; i < arr.length && i < 10; i++) {
          let id = arr[i]
          title += `第${i + 1}名：\n<${players[id].name}>  ${players[id].cult}\n${contr[id]}\n`
        }

        let index = arr.indexOf(id)
        title += `我的贡献：${players[id].contr} 第${index + 1}名`

        seal.replyToSender(ctx, msg, title)
        return;
      }
      //经验排行榜
      case "等级": {
        let exp = {}
        for (let id in playerlist) exp[id] = players[id].exp

        let arr = Object.keys(exp).sort(function (a, b) { return exp[b] - exp[a] })

        if (altid != id || val2 == "me") {
          let index = arr.indexOf(altid)
          seal.replyToSender(ctx, msg, `<${players[altid].name}>的等级：Lv${players[altid].getLv()[0]}(${players[altid].exp}) 第${index + 1}名`)
          return;
        }

        let title = `等级排行榜\n♚`
        for (let i = 0; i < arr.length && i < 10; i++) {
          let id = arr[i]
          title += `第${i + 1}名：\n<${players[id].name}>  ${players[id].cult}\nLv${players[id].getLv()[0]}(${exp[id]})\n`
        }

        let index = arr.indexOf(id)
        title += `我的等级：Lv${players[id].getLv()[0]}(${players[id].exp}) 第${index + 1}名`

        seal.replyToSender(ctx, msg, title)
        return;
      }
      default: {
        //货币排行榜
        let money = {}
        for (let id in playerlist) money[id] = players[id].money

        let arr = Object.keys(money).sort(function (a, b) { return money[b] - money[a] })

        if (altid != id || val2 == "me") {
          let index = arr.indexOf(altid)
          seal.replyToSender(ctx, msg, `<${players[altid].name}>的货币：$ ${players[altid].money} 第${index + 1}名`)
          return;
        }

        let title = `货币排行榜\n♚`
        for (let i = 0; i < arr.length && i < 10; i++) {
          let id = arr[i]
          title += `第${i + 1}名：\n<${players[id].name}>  ${players[id].cult}\n$ ${money[id]}\n`
        }

        let index = arr.indexOf(id)
        title += `我的货币：$ ${players[id].money} 第${index + 1}名`

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
    const id = ctx.player.userId
    const name = ctx.player.name
    ckId(id, name)
    if (players[id].ckCmd(ctx, msg)) return

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
          let num = places[place].members.length
          let money = 0

          for (let id of places[place].members) money += players[id].money

          moneysum += money
          text += `\n${place}:\n${num}人 $ ${money}`
        }
        seal.replyToSender(ctx, msg, `${text}\n总金额$ ${moneysum}`)
        return;
      }
      default: {
        //抽取其他玩家的谣言
        if (Math.random() <= 0.5) {
          let shuffledallplaces = shuffle(allplaces)
          for (let place of shuffledallplaces) {
            let says = places[place].says

            if (says.length !== 0) {
              let index = Math.floor(Math.random() * says.length)
              let say = says[index]

              places[place].says.splice(index, 1)

              seal.replyToSender(ctx, msg, `<${players[id].name}>从${place}的一名流浪汉口中得知${say}`)
              return;
            }
          }
        }

        let idlst = Object.keys(playerlist)
        let altid = idlst[Math.floor(Math.random() * idlst.length)]
        let place = players[id].place

        let goodsnum = 0
        for (let good in players[altid].goods) goodsnum += players[altid].goods[good]

        if (altid == id) {
          seal.replyToSender(ctx, msg, `<${players[id].name}>从${place}的一名流浪汉口中得知<${players[altid].name}>身怀$ ${players[altid].money}、带着${goodsnum}件货物在${players[altid].place}附近。这不是你自己吗？`)
          return;
        } else {
          seal.replyToSender(ctx, msg, `<${players[id].name}>从${place}的一名流浪汉口中得知<${players[altid].name}>身怀$ ${players[altid].money}、带着${goodsnum}件货物在${players[altid].place}附近。要不要去碰碰运气？`)
          return;
        }
      }
    }
  };

  const cmdesc = seal.ext.newCmdItemInfo();
  cmdesc.name = '强行越狱';
  cmdesc.help = '指令：.强行越狱';
  cmdesc.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const now = parseInt(seal.format(ctx, "{$tTimestamp}"))
    const id = ctx.player.userId
    const name = ctx.player.name
    ckId(id, name)

    let arrestInterval = seal.ext.getIntConfig(ext, "逮捕时间/s")

    if (now - players[id].time.arrestTime >= arrestInterval) {
      seal.replyToSender(ctx, msg, `小菜一碟，<${players[id].name}>早已经逃出来了`)
      return;
    }

    let interval = seal.ext.getIntConfig(ext, "指令间隔/s(强行越狱)")
    if (now - players[id].time.escTime < interval) return;

    switch (val) {
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        players[id].time.escTime = now

        //成功
        if (Math.random() * 100 <= seal.ext.getIntConfig(ext, "越狱概率%")) {
          players[id].time.arrestTime -= arrestInterval

          if (now - players[id].time.arrestTime >= arrestInterval) {
            players[id].exp += 5
            seal.replyToSender(ctx, msg, `<${players[id].name}>用${players[id].weapon}强行放倒了几名狱警然后扬长而去。`)
            return;
          }

          let t = now - players[id].time.arrestTime

          seal.replyToSender(ctx, msg, `<${players[id].name}>的动作加快了几分，还要${arrestInterval - t}秒就能逃出来！`)
          return;
        }
        //失败
        else {
          players[id].time.arrestTime += arrestInterval

          seal.replyToSender(ctx, msg, `<${players[id].name}>引来了几名狱警的注意，看来还需要再多${arrestInterval}秒。`)
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
    const id = ctx.player.userId
    const name = ctx.player.name
    ckId(id, name)

    const date = seal.format(ctx, "{$tDate}")
    let allgoods = {}
    let text = `今日行情如下:`

    //获取当日所有商品和价格
    for (let place of allplaces) {
      places[place].getShop(date)

      for (let good in places[place].shop) {
        if (!allgoods.hasOwnProperty(good)) allgoods[good] = []
        allgoods[good].push({
          place: place,
          price: places[place].shop[good]
        })
      }
    }

    //计算所有商品的最大差价
    let prices = []
    for (let good in allgoods) {
      if (allgoods[good].length > 1) {
        allgoods[good].sort((a, b) => a.price - b.price)

        let maxgood = allgoods[good][allgoods[good].length - 1]
        let mingood = allgoods[good][0]
        prices.push({
          good: good,
          dif: maxgood.price - mingood.price,
          maxgood: maxgood,
          mingood: mingood,
          profit: Math.floor(((maxgood.price - mingood.price) / mingood.price) * 100)
        })
      }
    }

    switch (val) {
      case '':
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      case "最高价": {
        prices.sort((a, b) => b.maxgood.price - a.maxgood.price)
        for (let i = 0; i < prices.length && i < 5; i++) text += `
${i + 1}.${prices[i].good} ${prices[i].maxgood.place} 
$ ${prices[i].maxgood.price}`
        break;
      }
      case "最低价": {
        prices.sort((a, b) => a.mingood.price - b.mingood.price)
        for (let i = 0; i < prices.length && i < 5; i++) text += `
${i + 1}.${prices[i].good} ${prices[i].mingood.place} 
$ ${prices[i].mingood.price}`
        break;
      }
      case "差价": {
        prices.sort((a, b) => b.dif - a.dif)
        for (let i = 0; i < prices.length && i < 5; i++) text += `
${i + 1}.${prices[i].good} $ ${prices[i].dif}
${prices[i].mingood.place}——>${prices[i].maxgood.place}
$ ${prices[i].mingood.price}          $ ${prices[i].maxgood.price}`
        break;
      }
      case "利润": {
        prices.sort((a, b) => b.profit - a.profit)
        for (let i = 0; i < prices.length && i < 5; i++) text += `
${i + 1}.${prices[i].good} ${prices[i].profit}%
${prices[i].mingood.place}——>${prices[i].maxgood.place}`
        break;
      }
      default: {
        //查询地点
        for (let place of allplaces) {
          if (val == place) {
            prices.sort((a, b) => b.profit - a.profit)
            let placeprices = prices.filter(price => price.mingood.place == place)

            for (let i = 0; i < placeprices.length && i < 5; i++) text += `
${i + 1}.${placeprices[i].good} ${placeprices[i].profit}%
$ ${placeprices[i].mingood.price}——>$ ${placeprices[i].maxgood.price} ${placeprices[i].maxgood.place}`
          }
        }
        //查询商品
        for (let good in allgoods) {
          if (val == good) {
            for (let place of allplaces) {
              if (!places[place].shop.hasOwnProperty(val)) text += `\n${place}:暂无`
              else text += `\n${place}:$ ${places[place].shop[val]}`
            }
          }
        }
      }
    }
    //推荐
    let profits = []
    for (let goodinfo of prices) {
      profits.push({
        good: goodinfo.good,
        profit: goodinfo.dif * Math.floor(players[id].money / goodinfo.mingood.price),
        dif: goodinfo.dif,
        maxgood: goodinfo.maxgood,
        mingood: goodinfo.mingood
      })
    }
    profits.sort((a, b) => b.profit - a.profit)
    let recommend = `\n为您推荐${profits[0].mingood.place}的${profits[0].good}，运至${profits[0].maxgood.place}`

    //买不起是吧！
    if (profits[0].profit == 0) recommend = `\n现在的你啥都买不起`

    seal.replyToSender(ctx, msg, `${text}\n<${players[id].name}>目前有$ ${players[id].money}，位于${players[id].place}。${recommend}`)
    return seal.ext.newCmdExecuteResult(true);
  };

  const cmdsay = seal.ext.newCmdItemInfo();
  cmdsay.name = '散播';
  cmdsay.help = '指令：.散播 你要散播的情报';
  cmdsay.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const id = ctx.player.userId
    const name = ctx.player.name
    ckId(id, name)
    if (players[id].ckCmd(ctx, msg)) return


    switch (val) {
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        if (val.length > 60) {
          seal.replyToSender(ctx, msg, `长度超过60（${val.length}）`)
          return;
        }

        let place = players[id].place
        let say = `<${players[id].name}>说过：${val}`
        places[place].says.push(say)


        seal.replyToSender(ctx, msg, `<${players[id].name}>在${place}的一名流浪汉面前故意提起了……`)
        return seal.ext.newCmdExecuteResult(true);
      }
    }
  };

  const cmddelbag = seal.ext.newCmdItemInfo();
  cmddelbag.name = '丢弃';
  cmddelbag.help = '指令：.丢弃 物品名称 数量';
  cmddelbag.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    let val2 = cmdArgs.getArgN(2);
    const id = ctx.player.userId
    const name = ctx.player.name
    ckId(id, name)
    if (players[id].ckCmd(ctx, msg)) return

    switch (val) {
      case '':
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      case 'all': {
        for (let good in players[id].goods) players[id].down += players[id].goods[good] / 10
        players[id].down = parseFloat(players[id].down.toFixed(1));
        players[id].goods = {}
        players[id].saveData()
        seal.replyToSender(ctx, msg, `你把车上的东西扔了个一干二净`)
        return seal.ext.newCmdExecuteResult(true);
      }
      default: {
        if (!players[id].goods.hasOwnProperty(val)) {
          seal.replyToSender(ctx, msg, "库中没有此物品。")
          return;
        }

        val2 = ckNum(val2, players[id].goods[val])
        if (val2 <= 0) {
          seal.replyToSender(ctx, msg, '请输入正确的数字！');
          return;
        }
        if (players[id].goods[val] < val2) {
          seal.replyToSender(ctx, msg, "库中物品数量不足！")
          return;
        }

        players[id].down += val2 / 10
        players[id].down = parseFloat(players[id].down.toFixed(1));
        players[id].takeGood(val, val2)
        seal.replyToSender(ctx, msg, `${val}-${val2}`)
        return seal.ext.newCmdExecuteResult(true);
      }
    }
  };

  const cmdname = seal.ext.newCmdItemInfo();
  cmdname.name = '改名';
  cmdname.help = '指令：.改名 新名字';
  cmdname.allowDelegate = true;
  cmdname.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getRestArgsFrom(1)
    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    const id = mctx.player.userId
    const name = mctx.player.name
    ckId(id, name)

    switch (val) {
      case '':
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        if (ctx.player.userId !== mctx.player.userId && ctx.privilegeLevel < 100) {
          seal.replyToSender(ctx, msg, seal.formatTmpl(ctx, "核心:提示_无权限"));
          return;
        }

        players[id].name = val
        players[id].saveData()
        seal.replyToSender(ctx, msg, `改名成功！`)
        return seal.ext.newCmdExecuteResult(true);
      }
    }
  };

  const cmdscrf = seal.ext.newCmdItemInfo();
  cmdscrf.name = '献祭';
  cmdscrf.help = '指令：.献祭 物品名称（数量/all）';
  cmdscrf.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    let val2 = cmdArgs.getArgN(2);
    const now = parseInt(seal.format(ctx, "{$tTimestamp}"))
    const id = ctx.player.userId
    const name = ctx.player.name
    ckId(id, name)
    if (players[id].ckCmd(ctx, msg)) return

    switch (val) {
      case '':
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        if (!players[id].goods.hasOwnProperty(val)) {
          seal.replyToSender(ctx, msg, `你没有这件物品。还是说<${players[id].name}>你要献上自己呢？`)
          return seal.ext.newCmdExecuteResult(true);
        }

        val2 = ckNum(val2, players[id].goods[val])
        if (val2 <= 0) {
          seal.replyToSender(ctx, msg, `请输入正确的数字！`)
          return
        }

        if (players[id].goods[val] < val2) {
          seal.replyToSender(ctx, msg, `数量不够！<${players[id].name}>需要更多！更多！`)
          return seal.ext.newCmdExecuteResult(true);
        }

        //扣除物品
        players[id].takeGood(val, val2)

        let cult = players[id].cult
        let gods = Object.keys(cults[cult].ones)
        let god = gods[Math.floor(Math.random() * gods.length)]

        let text = `在${players[id].place}\n你带领着信众向伟大的${god}举行了献祭仪式\n祭品:${val}×${val2}\n`
        if (Math.random() * 100 <= seal.ext.getIntConfig(ext, "献祭概率%")) {
          text += `献祭成功！\n`
          let add = Math.ceil(Math.random() * 10) + 10
          cults[cult].ones[god] += add
          players[id].exp += 5
          text += `随后祂向你们降下了视线：\n`

          if (cults[cult].ones[god] >= 100) {
            cults[cult].ones[god] = 0
            let gift = `${god}的雕像`

            let outnum = players[id].addGoodTo(gift, 1)
            text = `${gift}×1`
            text += `${god}的注视值达到100！获得了${gift}`
            if (outnum > 0) text += `，溢出${outnum}件`
          }
          else text += `${god}的注视值+${add}=>${cults[cult].ones[god]}`
          cults[cult].saveData()

          //晋升
          text += players[id].colorUp()

          seal.replyToSender(ctx, msg, `${text}\n${players[id].stSan(now, -10)}`)
          return seal.ext.newCmdExecuteResult(true);
        } else {
          text += `献祭失败！\n`
          seal.replyToSender(ctx, msg, `${text}${players[id].stSan(now, -10)}`)
          return seal.ext.newCmdExecuteResult(true);
        }
      }
    }
  };

  const cmdgft = seal.ext.newCmdItemInfo();
  cmdgft.name = "送";
  cmdgft.help = "指令：.送 物品名称 （数量） @要送的人";
  cmdgft.allowDelegate = true;
  cmdgft.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    let val2 = cmdArgs.getArgN(2);
    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    const id = ctx.player.userId
    const name = ctx.player.name
    ckId(id, name)
    if (players[id].ckCmd(ctx, msg)) return

    let altid = mctx.player.userId
    let altname = mctx.player.name
    ckId(altid, altname)
    if (players[altid].ckCmd(ctx, msg)) return

    if (id == altid) {
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
        if (Object.keys(players[id].goods).length == 0) {
          seal.replyToSender(ctx, msg, "你的背包里一干二净。")
          return;
        }

        let text = `<${players[id].name}>`
        let title = ``

        if (players[id].place !== players[altid].place) {
          text += `从${players[id].place}追到了${players[altid].place}，`
          players[id].movPlace(players[altid].place)
        }

        text += `送给了<${players[altid].name}>`

        for (let good in players[id].goods) {
          let num = players[id].goods[good]
          let outnum = players[altid].addGoodTo(good, num)

          players[id].takeGood(good, num)
          text += `${good}×${num}`
          if (outnum > 0) text += `，溢出${outnum}件`
          text += `、`
        }

        seal.replyToSender(ctx, msg, `${text.slice(0, -1)}！`)
        return;
      }
      default: {
        if (!players[id].goods.hasOwnProperty(val)) {
          seal.replyToSender(ctx, msg, "库中没有此物品。")
          return;
        }

        val2 = ckNum(val2, players[id].goods[val])
        if (val2 <= 0) {
          seal.replyToSender(ctx, msg, "请输入正确的数字！")
          return;
        }

        if (players[id].goods[val] < val2) {
          seal.replyToSender(ctx, msg, "库中物品数量不足！")
          return;
        }

        let text = ``
        if (players[id].place !== players[altid].place) {
          text = `从${players[id].place}追到了${players[altid].place}，`
          players[id].movPlace(players[altid].place)
        }
        text += `<${players[id].name}>送给了<${players[altid].name}>`
        players[id].takeGood(val, val2)
        let outnum = players[altid].addGoodTo(val, val2)
        text += `${val}×${val2}`
        if (outnum > 0) text += `，溢出${outnum}件`

        if (players[id].goods[val] == 0) {
          delete players[id].goods[val];
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
    const now = parseInt(seal.format(ctx, "{$tTimestamp}"))
    const id = ctx.player.userId
    const name = ctx.player.name
    ckId(id, name)
    if (players[id].ckCmd(ctx, msg)) return

    switch (val) {
      case "help": {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        if (!players[id].goods.hasOwnProperty(val)) {
          seal.replyToSender(ctx, msg, "库中没有此物品。")
          return;
        }

        val2 = ckNum(val2, players[id].goods[val])
        if (val2 <= 0) {
          seal.replyToSender(ctx, msg, "请输入正确的数字！")
          return;
        }

        if (players[id].goods[val] < val2) {
          seal.replyToSender(ctx, msg, "库中物品数量不足！")
          return;
        }

        seal.replyToSender(ctx, msg, seal.format(ctx, players[id].useGood(val, val2, now)))
        return;
      }
    }
  }
  const cmdtransfer = seal.ext.newCmdItemInfo();
  cmdtransfer.name = "转账";
  cmdtransfer.help = "指令：.转账 数额";
  cmdtransfer.allowDelegate = true;
  cmdtransfer.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
    const id = ctx.player.userId
    const name = ctx.player.name
    ckId(id, name)
    if (players[id].ckCmd(ctx, msg)) return

    let altid = mctx.player.userId
    let altname = mctx.player.name
    ckId(altid, altname)
    if (players[altid].ckCmd(ctx, msg)) return

    if (id == altid) {
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
      default: {
        val = ckNum(val, players[id].money)
        if (val <= 0) {
          seal.replyToSender(ctx, msg, '请输入正确的数字！');
        }

        if (players[id].money < val) {
          seal.replyToSender(ctx, msg, "没有那么多钱呢——")
          return;
        }
        players[altid].stMoney(val)
        players[id].stMoney(-val)

        seal.replyToSender(ctx, msg, `<${players[id].name}>成功把$ ${val}转给了<${players[altid].name}>！`)
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
  ext.cmdMap['翻垃圾'] = cmdrub;
  ext.cmdMap['排行榜'] = cmdChart;
  ext.cmdMap['情报'] = cmditg;
  ext.cmdMap['强行越狱'] = cmdesc;
  ext.cmdMap['行情'] = cmdmkt;
  ext.cmdMap['散播'] = cmdsay;
  ext.cmdMap['丢弃'] = cmddelbag;
  ext.cmdMap['改名'] = cmdname;
  ext.cmdMap['献祭'] = cmdscrf;
  ext.cmdMap['送'] = cmdgft;
  ext.cmdMap['使用'] = cmduse;
  ext.cmdMap['转账'] = cmdtransfer;
}
