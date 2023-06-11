const { EmbedBuilder } = require("discord.js");

function defaultEmbed(text, tf) {
  if (!tf) {
    tf = true;
  }
  const embed = new EmbedBuilder().setDescription(text);
  return { embeds: [embed], ephemeral: tf };
}

function successEmbed(text, tf) {
  if (!tf) {
    tf = true;
  }
  const embed = new EmbedBuilder().setColor([0, 255, 0]).setDescription(text);
  return { embeds: [embed], ephemeral: tf };
}

function failEmbed(text, tf) {
  if (!tf) {
    tf = true;
  }
  const embed = new EmbedBuilder().setColor("Red").setDescription(text);
  return { embeds: [embed], ephemeral: tf };
}

const messages = {
  default: defaultEmbed,
  success: successEmbed,
  fail: failEmbed,
};

module.exports = messages;
