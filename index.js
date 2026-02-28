require("dotenv").config();
const http = require("http");
const fs = require("fs");
const axios = require("axios");

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits
} = require("discord.js");

const { joinVoiceChannel } = require("@discordjs/voice");

// ================= SAFETY =================
if (!process.env.TOKEN) {
  console.error("❌ TOKEN is missing in environment variables");
  process.exit(1);
}

// ================= Config =================
const config = require("./config.json");
const TICKET_CATEGORY_ID = "1476424956827930766";
const WELCOME_BACKGROUND = "https://i.imgur.com/6rG8OlA.jpeg";

// ================= Client =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// ================= Protection =================
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// ================= Ticket Counter =================
function getTicketCount() {
  if (!fs.existsSync("./tickets.json")) {
    fs.writeFileSync("./tickets.json", JSON.stringify({ count: 0 }, null, 2));
  }
  return JSON.parse(fs.readFileSync("./tickets.json")).count;
}
function saveTicketCount(count) {
  fs.writeFileSync("./tickets.json", JSON.stringify({ count }, null, 2));
}

// ================= Suggestions Memory =================
const suggestionsData = new Map();

// ================= Normalize =================
function normalize(text) {
  if (!text) return "";
  return text
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .trim();
}

// ================= Auto Replies =================
const autoReplies = [
  {
    keywords: ["مرحبا", "هلا", "السلام", "السلام عليكم"],
    replies: ["وعليكم السلام 👋", "ياهلا فيك 🔥", "نورت ❤️"]
  },
  {
    keywords: ["كيفك", "شلونك"],
    replies: ["تمام الحمدلله 😄 وانت؟"]
  }
];

const badWords = ["زب", "كس", "قح"];

// ================= Slash Register =================
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
      {
        body: [
          { name: "panel", description: "لوحة التذاكر" },
          { name: "testwelcome", description: "تجربة الترحيب" }
        ]
      }
    );
    console.log("✅ Slash commands registered");
  } catch (e) {
    console.log("❌ Slash register error:", e);
  }
})();

// ================= Ready =================
client.once("clientReady", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  if (config.VOICE_CHANNEL_ID && config.VOICE_CHANNEL_ID !== "0") {
    const voiceChannel = client.channels.cache.get(config.VOICE_CHANNEL_ID);
    if (voiceChannel) {
      joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: true
      });
    }
  }
});

// ================= Welcome helper =================
async function buildWelcomeImage(member) {
  const avatar = member.user.displayAvatarURL({ extension: "png", size: 512 });

  const url =
    `https://api.popcat.xyz/welcomecard` +
    `?background=${encodeURIComponent(WELCOME_BACKGROUND)}` +
    `&avatar=${encodeURIComponent(avatar)}` +
    `&text1=${encodeURIComponent(member.user.username)}` +
    `&text2=${encodeURIComponent("Welcome to " + member.guild.name)}` +
    `&text3=${encodeURIComponent("Member #" + member.guild.memberCount)}`;

  const res = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
  return Buffer.from(res.data);
}

// ================= Welcome Event =================
client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.get(config.WELCOME_CHANNEL_ID);
  if (!channel) return;

  try {
    const img = await buildWelcomeImage(member);
    await channel.send({
      content: `🔥 مرحباً ${member} ❤️`,
      files: [{ attachment: img, name: "welcome.png" }]
    });
  } catch (e) {
    console.log("Welcome Error:", e?.message || e);
  }
});

// ================= Web Server (FOR RENDER 24/7) =================
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write("Bot is alive 🔥");
  res.end();
}).listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// ================= LOGIN =================
client.login(process.env.TOKEN);