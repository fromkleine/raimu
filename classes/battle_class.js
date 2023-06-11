const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const messages = require("../objects/messages");

class Battle {
  constructor(channel, mc1, mc2, title) {
    this.channel = channel;
    this.mc1 = mc1;
    this.mc2 = mc2;
    this.id = this._createID();
    this.defaultTitle = false;
    if (!title) {
      this.title = `${mc1.displayName} vs ${mc2.displayName}`;
      this.defaultTitle = true;
    } else {
      this.title = title;
    }
    this.mc1_select = [];
    this.mc2_select = [];
  }

  async create() {
    const embed = new EmbedBuilder()
      .setColor([21, 88, 214])
      .setTitle(this.title)
      .setDescription("バトル後は判定に移ります。よく聴きましょう。")
      .addFields(
        {
          name: "プレイヤー1",
          value: `:one: <@!${this.mc1.id}>`,
        },
        {
          name: "プレイヤー2",
          value: `:two: <@!${this.mc2.id}>`,
        },
        {
          name: "ゲームID",
          value: `\`${this.id}\``,
        }
      );
    const row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setCustomId("battle_stop")
        .setLabel("中断")
        .setStyle("Primary"),
      new ButtonBuilder()
        .setCustomId("order_change")
        .setLabel("順番変更")
        .setStyle("Primary"),
      new ButtonBuilder()
        .setCustomId("battle_judge")
        .setLabel("判定")
        .setStyle("Primary"),
    ]);
    const message = await this.channel.send({
      embeds: [embed],
      components: [row],
    });
    this.message = message;
  }

  judge() {
    const embed = new EmbedBuilder()
      .setColor([21, 88, 214])
      .setTitle(`${this.title} 判定`)
      .setDescription("ボタンで1人1票だけ投票できます。")
      .addFields(
        {
          name: "先攻",
          value: `:one: <@!${this.mc1.id}>`,
        },
        {
          name: "後攻",
          value: `:two: <@!${this.mc2.id}>`,
        },
        {
          name: "ゲームID",
          value: `\`${this.id}\``,
        }
      );

    const row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setCustomId("mc1_select")
        .setLabel("1")
        .setStyle("Primary"),
      new ButtonBuilder()
        .setCustomId("mc2_select")
        .setLabel("2")
        .setStyle("Primary"),
      new ButtonBuilder()
        .setCustomId("battle_result")
        .setLabel("判定を終了")
        .setStyle("Primary"),
    ]);
    this.message.edit({
      embeds: [embed],
      components: [row],
    });
    return messages.success("判定に移りました。");
  }

  selectMc(targetMc, user) {
    if (user.id === this.mc1.id || user.id === this.mc2.id) {
      return messages.fail("バトルに出場しているMCは投票できません。");
    }
    const otherSelectors =
      targetMc === "mc1_select" ? "mc2_select" : "mc1_select";
    const emoji = targetMc === "mc1_select" ? "one" : "two";
    if (this[otherSelectors].includes(user.id)) {
      this[otherSelectors].splice(this[otherSelectors].indexOf(user.id), 1);
    }
    if (this[targetMc].includes(user.id)) {
      return messages.fail("すでに選択済みです。");
    }
    if (targetMc === "mc1_select") {
      this.mc1_select.push(user.id);
    } else {
      this.mc2_select.push(user.id);
    }
    this.message.edit(
      `投票人数: ${this.mc1_select.length + this.mc2_select.length}人`
    );
    return messages.default(`:${emoji}:を選択しました。`);
  }

  result() {
    const mc1Num = this.mc1_select.length;
    const mc2Num = this.mc2_select.length;
    const mc1Gauge = this._createGauge(mc1Num);
    const mc2Gauge = this._createGauge(mc2Num);
    let resultMessage = "引き分けです。";
    let resultDescription1 = `:one: <@!${this.mc1.id}>`;
    let resultDescription2 = `:two: <@!${this.mc2.id}>`;
    if (mc1Num > mc2Num) {
      resultMessage = `${this.mc1.displayName} の勝利です。`;
      resultDescription1 += " :trophy:";
    } else if (mc1Num < mc2Num) {
      resultMessage = `${this.mc2.displayName} の勝利です。`;
      resultDescription2 += " :trophy:";
    }
    const embed = new EmbedBuilder()
      .setColor([21, 88, 214])
      .setTitle(this.title)
      .setDescription(resultMessage)
      .addFields(
        {
          name: "先攻",
          value: `${resultDescription1} ${mc1Gauge} ${mc1Num}票`,
        },
        {
          name: "後攻",
          value: `${resultDescription2} ${mc2Gauge} ${mc2Num}票`,
        },
        {
          name: "ゲームID",
          value: `\`${this.id}\``,
        }
      );
    const row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setCustomId("battle_restart")
        .setLabel("再戦")
        .setStyle("Primary"),
      new ButtonBuilder()
        .setCustomId("battle_finish")
        .setLabel("終了")
        .setStyle("Primary"),
    ]);
    this.message.edit({
      embeds: [embed],
      components: [row],
    });
    return messages.success("判定を開始しました。");
  }

  restart(guildId) {
    const channelId = this.channel.id;
    this.message.edit({ components: [] });
    const battle = new Battle(this.channel, this.mc1, this.mc2, this.title);
    battle.create();
    battles[guildId][channelId][0] = battle;
    return messages.success("同じ組み合わせでバトルを作成しました。");
  }

  finish(guildId) {
    const channelId = this.channel.id;
    this.message.edit({ components: [] });
    battles[guildId][channelId].shift();
    return messages.default(
      "バトルを終了しました。次のバトルがある場合は自動で移行します。"
    );
  }

  orderChange() {
    const previousMc1 = this.mc1;
    const previousMc2 = this.mc2;
    this.mc1 = previousMc2;
    this.mc2 = previousMc1;
    if (this.defaultTitle) {
      this.title = `${this.mc1.displayName} vs ${this.mc2.displayName}`;
    }
    const embed = new EmbedBuilder()
      .setColor([21, 88, 214])
      .setTitle(this.title)
      .setDescription("バトル後は判定に移ります。よく聴きましょう。")
      .addFields(
        {
          name: "先攻",
          value: `:one: <@!${this.mc1.id}>`,
        },
        {
          name: "後攻",
          value: `:two: <@!${this.mc2.id}>`,
        },
        {
          name: "ゲームID",
          value: `\`${this.id}\``,
        }
      );
    const row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setCustomId("battle_stop")
        .setLabel("中断")
        .setStyle("Primary"),
      new ButtonBuilder()
        .setCustomId("order_change")
        .setLabel("順番変更")
        .setStyle("Primary"),
      new ButtonBuilder()
        .setCustomId("battle_judge")
        .setLabel("判定")
        .setStyle("Primary"),
    ]);
    this.message.edit({
      embeds: [embed],
      components: [row],
    });
    return messages.success("先行と後攻の順番を入れ替えました。");
  }

  delete() {
    const channelId = this.channel.id;
    const guildId = this.channel.guild.id;
    this.message.delete();
    battles[guildId][channelId].shift();
    return messages.default(
      "バトルを終了しました。次のバトルがある場合は自動で移行します。"
    );
  }

  _createID() {
    let obj = {};
    let text = "00112233445566778899";
    for (let i = 0; i < text.length; i++) {
      let rand = Math.floor(Math.random() * 10000000);
      if (!obj[rand]) {
        obj[rand] = text[i];
      } else {
        i--;
      }
    }
    return Object.values(obj).join("").slice(0, 8);
  }

  _createGauge(num) {
    let gauge = " ";
    let i = 0;
    if (i >= 5) {
      gauge += "\\";
    }
    while (i < num) {
      if (!(i % 5) || num - i >= 5) {
        gauge += "\\";
      }
      gauge += "|";
      i++;
    }
    return `${gauge}`;
  }
}

module.exports = Battle;
