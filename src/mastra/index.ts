import dotenv from 'dotenv';
dotenv.config(); 

import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, NewsChannel } from 'discord.js';
import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import { reporterAgent } from './agents/reporter-agent';
import { newsWorkflow } from './workflows/news-workflow';
import { writerAgent } from './agents/writer-agent';
import { newsAgent } from './agents/news-agent';

export const mastra = new Mastra({
  agents: { reporterAgent, writerAgent, newsAgent },
  workflows: { newsWorkflow },
  storage: new LibSQLStore({ url: 'file:../../mastra.db' }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  }),
  observability: {
    default: {
      enabled: true,
    },
  },
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', async () => {
    console.log('🤖 Discord bot is ready!');
    
    // Register slash commands
    const commands = [
        new SlashCommandBuilder()
            .setName('technews')
            .setDescription('Get latest technology news')
            .addStringOption(option =>
                option.setName('topic')
                    .setDescription('Technology topic to search for')
                    .setRequired(false)
            )
    ];

    // Register commands with Discord
    if (client.application) {
        await client.application.commands.set(commands);
        console.log('✅ Slash commands registered');
    }

    automateTechNews();
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
        if (interaction.commandName === 'technews') {
            await handleTechNewsCommand(interaction);
        }
    } catch (error) {
        console.error('❌ Discord command error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ Error')
            .setDescription('Sorry, something went wrong while fetching the news.')
            .setTimestamp();

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
});

//handle direct message
client.on('messageCreate', async (message) => {

  if (message.author.bot) return;

  try {
    let topic = null;

    if (message.content.trim()) {
      topic = message.content.trim();
      await handleNewsMessage(message, topic);
    }
  } catch (error) {
      console.error('❌ Discord message error:', error);
  }

});

function findArticlesString(obj: any): string | null {
  const visited = new Set<any>();
  const stack = [obj];

  while (stack.length) {
    const cur = stack.pop();
    if (!cur || visited.has(cur)) continue;
    visited.add(cur);

    if (typeof cur === 'string') {
      const s = cur.trim();
      if (s.length > 50 || s.startsWith('**Báo cáo') || s.includes('Nguồn tham khảo')) {
        return s;
      }
    } else if (typeof cur === 'object') {
      for (const key of Object.keys(cur)) {
        if (key.toLowerCase().includes('article') && typeof cur[key] === 'string' && cur[key].trim()) {
          return cur[key];
        }
      }
      for (const key of Object.keys(cur)) {
        stack.push(cur[key]);
      }
    }
  }
  return null;
}

async function handleTechNewsCommand(interaction: any) {
    await interaction.deferReply();

    const topic = interaction.options.getString('topic') || 'technology';

    console.log(`🔍 Discord user requested tech news: topic="${topic}"`);

    // Execute the workflow
    const result = await reporterAgent.generateVNext([
        {
            role: 'user',
            content: topic,
        },
    ]);

    console.log('Full result object:', JSON.stringify(result, null, 2));

    const extractedArticles = findArticlesString(result) || result.text || 'Không tìm thấy nội dung bài báo.';

    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setDescription(extractedArticles.slice(0, 8192)) 

    await interaction.editReply({
        content: `📰 **Dạ dưới đây là thông tin anh cần**`,
        embeds: [embed]
    });
}

async function handleNewsMessage(message: any, topic: string) {
    console.log(`🔍 Discord user requested news via message: topic="${topic}" from ${message.author.username}`)
    
    await message.channel.send('Đang tìm kiếm tin tức, vui lòng chờ...');

    const result = await reporterAgent.generateVNext([
        {
            role: 'user',
            content: topic,
        },
    ]);

    const extractedArticles = findArticlesString(result) || result.text || 'Không tìm thấy nội dung bài báo.';
    
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setDescription(extractedArticles.slice(0, 8192))
    
    await message.reply({
        content: `📰 **Dạ dưới đây là thông tin anh cần**`,
        embeds: [embed]
    })
}

async function automateTechNews() {
  const CHANNEL_ID = process.env.NEWS_CHANNEL_ID;
  const INTERVAL_HOURS = 6;
  const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000;
  
  const topics = ['artificial intelligence', 'blockchain', 'cybersecurity', 'technology trends', 'machine learning'];

  console.log(`🕐 Starting automatic news fetching every ${INTERVAL_HOURS} hours`);

  const sendAutomaticNews = async () => {
    try {
      if (!CHANNEL_ID) {
        console.error('❌ NEWS_CHANNEL_ID environment variable is not set');
        return;
      }
      
      const channel = client.channels.cache.get(CHANNEL_ID);
      if (!channel || !channel.isTextBased() || !('send' in channel)) {
        console.error('❌ News channel not found or is not a text channel');
        return;
      }

      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      console.log(`🔄 Fetching automatic tech news for topic: ${randomTopic}`);

      const result = await reporterAgent.generateVNext([
        {
          role: 'user',
          content: randomTopic,
        },
      ]);

      const extractedArticles = findArticlesString(result) || result.text || 'Không tìm thấy nội dung bài báo.';
      
      const embed = new EmbedBuilder()
        .setColor(0x00ff88) 
        .setTitle(`🤖 Automatic Tech News Update - ${randomTopic}`)
        .setDescription(extractedArticles.slice(0, 8192)) 
        .setTimestamp()
        .setFooter({ text: `Next update in ${INTERVAL_HOURS} hours` });

      await channel.send({
        content: `📰 **Automatic Tech News Update** 🕐`,
        embeds: [embed]
      });

      console.log(`✅ Automatic news sent for topic: ${randomTopic}`);
      
    } catch (error) {
      console.error('❌ Error in automatic news fetching:', error);
    }
  };


  setTimeout(sendAutomaticNews, 30000);
  
  
  setInterval(sendAutomaticNews, INTERVAL_MS);
}

// Start the bot
client.login(process.env.DISCORD_TOKEN);