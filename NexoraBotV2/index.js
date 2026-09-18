require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
  AttachmentBuilder
} = require('discord.js');

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/* =========================================================
   NEXORA V2
   Discord bot + Website API + Orders + Fun systems
   Footer: Nexora, Best of the Best
   ========================================================= */

const env = name => String(process.env[name] || '').trim();

const list = name =>
  env(name)
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);

const num = (name, fallback) =>
  Number.isFinite(Number(env(name))) ? Number(env(name)) : fallback;

const CONFIG = {
  token: env('DISCORD_TOKEN'),
  clientId: env('CLIENT_ID'),
  guildId: env('GUILD_ID'),
  clientSecret: env('DISCORD_CLIENT_SECRET'),

  currency: env('CURRENCY_NAME') || 'Robux',

  logoUrl: env('NEXORA_LOGO_URL'),

  websiteUrl:
    env('WEBSITE_URL') ||
    'http://localhost:5500',

  apiUrl:
    env('BOT_API_URL') ||
    `http://localhost:${env('PORT') || 3000}`,

  port: num('PORT', 3000),
  sessionHours: num('SESSION_TTL_HOURS', 24),

  ordersChannelId: env('ORDERS_CHANNEL_ID'),
  orderCommandChannelId:
    env('ORDER_COMMAND_CHANNEL_ID') ||
    env('ORDERS_CHANNEL_ID'),

  archiveChannelId:
    env('ORDER_ARCHIVE_CHANNEL_ID'),

  ticketCategoryId:
    env('ORDER_TICKET_CATEGORY_ID'),

  supportPanelChannelId:
    env('SUPPORT_PANEL_CHANNEL_ID'),

  pricingChannelId:
    env('PRICING_CHANNEL_ID'),

  servicesChannelId:
    env('SERVICES_CHANNEL_ID'),

  welcomeChannelId:
    env('WELCOME_CHANNEL_ID'),

  reviewLogChannelId:
    env('REVIEW_LOG_CHANNEL_ID'),

  funChannelId:
    env('FUN_CHANNEL_ID'),

  ideasChannelId:
    env('IDEAS_CHANNEL_ID'),

  moderationLogChannelId:
    env('MODERATION_LOG_CHANNEL_ID'),

  supportRoleIds:
    list('SUPPORT_ROLE_IDS'),

  managementRoleIds:
    list('MANAGEMENT_ROLE_IDS'),

  botDesignerRoleId:
    env('BOT_DESIGNER_ROLE_ID'),

  websiteDesignerRoleId:
    env('WEBSITE_DESIGNER_ROLE_ID'),

  customerRoleId:
    env('CUSTOMER_ROLE_ID'),

  vipCustomerRoleId:
    env('VIP_CUSTOMER_ROLE_ID'),

  sayRoleId:
    env('SAY_ROLE_ID'),

  newMemberRoleId:
    env('NEW_MEMBER_ROLE_ID'),

  banRoleIds:
    list('BAN_ROLE_IDS'),

  kickRoleIds:
    list('KICK_ROLE_IDS'),

  purgeRoleIds:
    list('PURGE_ROLE_IDS'),

  countingChannelId:
    env('COUNTING_CHANNEL_ID') ||
    '1546192692088938526',

  countingGoalMin:
    num('COUNTING_DAILY_GOAL_MIN', 100),

  countingGoalMax:
    num('COUNTING_DAILY_GOAL_MAX', 500)
};

if (!CONFIG.token)
  throw new Error('DISCORD_TOKEN is missing.');

if (!CONFIG.clientId)
  throw new Error('CLIENT_ID is missing.');

if (!CONFIG.guildId)
  throw new Error('GUILD_ID is missing.');

/* =========================================================
   MEDIA
   Same Nexora artwork family as the previous bot
   ========================================================= */

const MEDIA = {
  logo: CONFIG.logoUrl,

  welcome:
    'https://media.discordapp.net/attachments/1477130024392855595/1543372854891126866/nexora_welcome.png?ex=6a94a17b&is=6a934ffb&hm=18bea857f698dcfde5270fd7df40c63c44fc6b3fc9453c1af2c76d29789dc6c1&=&format=webp&quality=lossless',

  bottomBanner:
    'https://media.discordapp.net/attachments/1477130024392855595/1543380733756833922/nexora_bottom_banner.png?ex=6a94a8d1&is=6a935751&hm=3c31b5d36439e037b731bbd96234c8789ab761a4f1ce3ff5a8ea199ad315999e&=&format=webp&quality=lossless',

  order:
    'https://media.discordapp.net/attachments/1477130024392855595/1543372858737033226/nexora_order.png',

  services:
    'https://media.discordapp.net/attachments/1477130024392855595/1543372859592933528/nexora_services.png',

  pricing:
    'https://media.discordapp.net/attachments/1477130024392855595/1543372858225459350/nexora_pricing.png',

  support:
    'https://media.discordapp.net/attachments/1477130024392855595/1543372856266858587/nexora_support.png',

  review:
    'https://media.discordapp.net/attachments/1477130024392855595/1543372856921165844/nexora_review.png'
};

/* =========================================================
   PRICING
   Edit this one section when you want to change prices.
   ========================================================= */

const PRICING = {
  bot: {
    label: 'Discord Bot',
    roleId: CONFIG.botDesignerRoleId,

    plans: {
      starter: {
        label: 'Starter',
        price: 650,
        description:
          'Small custom bot with core commands and a clean setup.'
      },

      studio: {
        label: 'Studio',
        price: 1200,
        description:
          'Larger bot with multiple custom systems and automation.'
      },

      pro: {
        label: 'Pro',
        price: 2250,
        description:
          'Advanced custom bot with complex systems, databases and workflows.'
      },

      custom: {
        label: 'Custom',
        price: 0,
        quoteRequired: true,
        description:
          'Large or unusual projects. Nexora prepares a custom quote.'
      }
    }
  },

  website: {
    label: 'Website',
    roleId: CONFIG.websiteDesignerRoleId,

    plans: {
      launch: {
        label: 'Launch',
        price: 750,
        description:
          'Modern responsive single-page website.'
      },

      business: {
        label: 'Business',
        price: 1500,
        description:
          'Multi-section client website with polished interactions and forms.'
      },

      premium: {
        label: 'Premium',
        price: 2750,
        description:
          'High-detail premium experience with custom sections and advanced UI.'
      }
    }
  },

  branding: {
    label: 'Branding',
    roleId:
      CONFIG.supportRoleIds[0] ||
      CONFIG.managementRoleIds[0],

    plans: {
      logo: {
        label: 'Logo',
        price: 350,
        description:
          'Custom logo and brand mark.'
      },

      banner: {
        label: 'Banner',
        price: 450,
        description:
          'Custom Discord, profile or promotional banner.'
      },

      bundle: {
        label: 'Logo + Banner',
        price: 700,
        description:
          'Matched logo and banner package.'
      }
    }
  },

  subscription: {
    label: 'Nexora Care',
    roleId:
      CONFIG.supportRoleIds[0] ||
      CONFIG.managementRoleIds[0],

    plans: {
      care: {
        label: 'Care',
        price: 350,
        billing: 'month',
        description:
          'Monthly maintenance, small fixes and priority assistance.'
      },

      priority: {
        label: 'Priority',
        price: 650,
        billing: 'month',
        description:
          'Monthly maintenance with higher priority and more included changes.'
      },

      full: {
        label: 'Full',
        price: 1000,
        billing: 'month',
        description:
          'Monthly maintenance for active projects with ongoing support.'
      }
    }
  }
};

const ADDONS = {
  rush: {
    label: 'Rush handling',
    price: 500,
    description:
      'Higher handling priority. Subject to staff availability.'
  },

  extra_system: {
    label: 'Extra bot system',
    price: 150,
    description:
      'For larger bot projects beyond the selected package.'
  },

  extra_page: {
    label: 'Extra website page',
    price: 175,
    description:
      'Additional custom website page.'
  }
};

/* =========================================================
   DATABASE
   ========================================================= */

const dataDir = path.join(process.cwd(), 'data');

fs.mkdirSync(dataDir, {
  recursive: true
});

const db = new Database(
  path.join(dataDir, 'nexora.sqlite')
);

db.pragma('journal_mode=WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS counters(
    name TEXT PRIMARY KEY,
    value INTEGER NOT NULL
  );

  INSERT OR IGNORE INTO counters VALUES ('order', 0);
  INSERT OR IGNORE INTO counters VALUES ('idea', 0);
  INSERT OR IGNORE INTO counters VALUES ('giveaway', 0);
  INSERT OR IGNORE INTO counters VALUES ('poll', 0);

  CREATE TABLE IF NOT EXISTS orders(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT UNIQUE NOT NULL,
    customer_id TEXT NOT NULL,
    service TEXT NOT NULL,
    plan TEXT NOT NULL,
    plan_label TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    deadline TEXT,
    details TEXT NOT NULL DEFAULT '{}',
    billing TEXT,
    base_price INTEGER NOT NULL DEFAULT 0,
    discount_percent INTEGER NOT NULL DEFAULT 0,
    price INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'SUBMITTED',
    created_at TEXT NOT NULL,
    claimed_at TEXT,
    claimed_staff_id TEXT,
    ready_at TEXT,
    ticket_channel_id TEXT,
    ticket_opened_at TEXT,
    perfect_at TEXT,
    paid_at TEXT,
    closed_at TEXT,
    cancelled_at TEXT,
    cancelled_by TEXT,
    cancellation_reason TEXT,
    order_message_id TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_orders_customer
    ON orders(customer_id);

  CREATE INDEX IF NOT EXISTS idx_orders_status
    ON orders(status);

  CREATE TABLE IF NOT EXISTS order_events(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    actor_id TEXT,
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER UNIQUE NOT NULL,
    customer_id TEXT NOT NULL,
    staff_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS wallets(
    user_id TEXT PRIMARY KEY,
    nx INTEGER NOT NULL DEFAULT 0,
    last_daily TEXT,
    daily_streak INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS counting_state(
    guild_id TEXT PRIMARY KEY,
    current_number INTEGER NOT NULL DEFAULT 0,
    last_user_id TEXT,
    streak INTEGER NOT NULL DEFAULT 0,
    server_record INTEGER NOT NULL DEFAULT 0,
    daily_date TEXT NOT NULL,
    daily_goal INTEGER NOT NULL,
    daily_goal_reached INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS counting_members(
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    personal_best INTEGER NOT NULL DEFAULT 0,
    mistakes INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(guild_id,user_id)
  );

  CREATE TABLE IF NOT EXISTS ideas(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN'
  );

  CREATE TABLE IF NOT EXISTS idea_votes(
    idea_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    vote INTEGER NOT NULL,
    PRIMARY KEY(idea_id,user_id)
  );

  CREATE TABLE IF NOT EXISTS polls(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT NOT NULL,
    message_id TEXT,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    ends_at TEXT,
    ended INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS poll_votes(
    poll_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    option_index INTEGER NOT NULL,
    PRIMARY KEY(poll_id,user_id)
  );

  CREATE TABLE IF NOT EXISTS giveaways(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT,
    prize TEXT NOT NULL,
    winners INTEGER NOT NULL,
    ends_at TEXT NOT NULL,
    required_role_id TEXT,
    ended INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS giveaway_entries(
    giveaway_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY(giveaway_id,user_id)
  );

  CREATE TABLE IF NOT EXISTS oauth_states(
    state TEXT PRIMARY KEY,
    return_url TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS login_tickets(
    ticket TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sessions(
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
`);

/* =========================================================
   GENERAL HELPERS
   ========================================================= */

const now = () => new Date().toISOString();

const unix = value =>
  Math.floor(new Date(value).getTime() / 1000);

const clip = (value, max) =>
  String(value ?? '').slice(0, max);

const esc = value =>
  String(value ?? '')
    .replace(/([_*`~|>])/g, '\\$1');

const sleep = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

function nextCode(kind, prefix, pad = 4) {
  const row =
    db.prepare(
      'SELECT value FROM counters WHERE name=?'
    ).get(kind) || { value: 0 };

  const value =
    Number(row.value) + 1;

  db.prepare(`
    INSERT INTO counters(name,value)
    VALUES(?,?)
    ON CONFLICT(name)
    DO UPDATE SET value=excluded.value
  `).run(kind, value);

  return `${prefix}-${String(value).padStart(pad, '0')}`;
}

function logEvent(
  orderId,
  type,
  actorId,
  content = ''
) {
  db.prepare(`
    INSERT INTO order_events(
      order_id,
      type,
      actor_id,
      content,
      created_at
    )
    VALUES(?,?,?,?,?)
  `).run(
    orderId,
    type,
    actorId || null,
    String(content || ''),
    now()
  );
}

function getOrder(idOrCode) {
  return db.prepare(`
    SELECT *
    FROM orders
    WHERE id=? OR order_code=?
  `).get(
    idOrCode,
    String(idOrCode)
  );
}

function getPricing(service, plan) {
  const group = PRICING[service];

  if (!group)
    return null;

  const entry =
    group.plans?.[plan];

  if (!entry)
    return null;

  return {
    service,
    plan,
    ...entry,
    serviceLabel: group.label
  };
}

function getDiscountFromMember(member) {
  if (!member?.roles?.cache)
    return 0;

  if (
    CONFIG.vipCustomerRoleId &&
    member.roles.cache.has(
      CONFIG.vipCustomerRoleId
    )
  ) {
    return 10;
  }

  if (
    CONFIG.customerRoleId &&
    member.roles.cache.has(
      CONFIG.customerRoleId
    )
  ) {
    return 5;
  }

  return 0;
}

function calculatePrice({
  service,
  plan,
  addons = [],
  member
}) {
  const pricing =
    getPricing(service, plan);

  if (!pricing)
    return null;

  const base =
    Number(pricing.price || 0);

  const addonValues = [
    ...new Set(
      Array.isArray(addons)
        ? addons
        : []
    )
  ].filter(
    value => Boolean(ADDONS[value])
  );

  /*
     A Custom plan is a quote.
     It does not pretend to know its final amount.
  */

  const addonTotal =
    pricing.quoteRequired
      ? 0
      : addonValues.reduce(
          (sum, key) =>
            sum + ADDONS[key].price,
          0
        );

  const subtotal =
    base + addonTotal;

  const discountPercent =
    pricing.quoteRequired
      ? 0
      : getDiscountFromMember(member);

  const discount =
    Math.round(
      subtotal *
      discountPercent /
      100
    );

  const total =
    pricing.quoteRequired
      ? 0
      : Math.max(
          0,
          subtotal - discount
        );

  return {
    basePrice:
      base + addonTotal,

    addonTotal,

    subtotal,

    discountPercent,

    price:
      total,

    addons:
      addonValues,

    quoteRequired:
      Boolean(pricing.quoteRequired),

    billing:
      pricing.billing || null,

    serviceLabel:
      pricing.serviceLabel,

    planLabel:
      pricing.label,

    description:
      pricing.description
  };
}

function jsonDetails(order) {
  try {
    return JSON.parse(
      order.details || '{}'
    );
  } catch {
    return {};
  }
}

/* =========================================================
   DISCORD UI
   ========================================================= */

const COLORS = {
  primary: 0x5865F2,
  success: 0x57F287,
  danger: 0xED4245,
  warning: 0xFEE75C,
  dark: 0x11131A,
  cyan: 0x2F80ED
};

function baseEmbed(
  title,
  description,
  color = COLORS.primary
) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setFooter({
      text: 'Nexora, Best of the Best',
      ...(MEDIA.logo
        ? { iconURL: MEDIA.logo }
        : {})
    })
    .setTimestamp();
}

function embedWithImage(
  title,
  description,
  color,
  image
) {
  const embed =
    baseEmbed(
      title,
      description,
      color
    );

  if (MEDIA.logo) {
    embed.setThumbnail(
      MEDIA.logo
    );
  }

  if (image) {
    embed.setImage(
      image
    );
  }

  return embed;
}

function button(
  customId,
  label,
  style = ButtonStyle.Secondary,
  disabled = false
) {
  return new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style)
    .setDisabled(disabled);
}

function linkButton(
  label,
  url
) {
  return new ButtonBuilder()
    .setLabel(label)
    .setStyle(ButtonStyle.Link)
    .setURL(url);
}

function row(...components) {
  return new ActionRowBuilder()
    .addComponents(
      components
    );
}

async function replyEmbed(
  interaction,
  title,
  description,
  color = COLORS.primary,
  ephemeral = true,
  components = []
) {
  return interaction.reply({
    embeds: [
      embedWithImage(
        title,
        description,
        color
      )
    ],
    components,
    ephemeral
  });
}

/* =========================================================
   PERMISSIONS
   ========================================================= */

function authorized(member, ids = []) {
  return Boolean(
    member?.permissions?.has(
      PermissionFlagsBits.Administrator
    ) ||
    ids.some(id =>
      member?.roles?.cache?.has(id)
    )
  );
}

function isManagement(member) {
  return authorized(
    member,
    CONFIG.managementRoleIds
  );
}

function isSupport(member) {
  return (
    isManagement(member) ||
    authorized(
      member,
      CONFIG.supportRoleIds
    )
  );
}

function isBotDesigner(member) {
  return Boolean(
    isManagement(member) ||
    (
      CONFIG.botDesignerRoleId &&
      member?.roles?.cache?.has(
        CONFIG.botDesignerRoleId
      )
    )
  );
}

function isWebsiteDesigner(member) {
  return Boolean(
    isManagement(member) ||
    (
      CONFIG.websiteDesignerRoleId &&
      member?.roles?.cache?.has(
        CONFIG.websiteDesignerRoleId
      )
    )
  );
}

function isOrderStaff(
  member,
  order
) {
  if (isManagement(member))
    return true;

  if (
    order.service === 'bot' &&
    isBotDesigner(member)
  ) {
    return true;
  }

  if (
    order.service === 'website' &&
    isWebsiteDesigner(member)
  ) {
    return true;
  }

  return isSupport(member);
}

function getClaimPingRoleIds(order) {
  const ids = [];

  if (
    order.service === 'bot' &&
    CONFIG.botDesignerRoleId
  ) {
    ids.push(
      CONFIG.botDesignerRoleId
    );
  }

  if (
    order.service === 'website' &&
    CONFIG.websiteDesignerRoleId
  ) {
    ids.push(
      CONFIG.websiteDesignerRoleId
    );
  }

  if (!ids.length) {
    ids.push(
      ...CONFIG.supportRoleIds
    );
  }

  return [
    ...new Set(
      ids.filter(Boolean)
    )
  ];
}

/* =========================================================
   ORDER PRESENTATION
   ========================================================= */

function orderStatusLabel(status) {
  return ({
    SUBMITTED: 'Submitted',
    CLAIMED: 'Claimed',
    READY: 'Ready',
    IN_TICKET: 'Ticket Open',
    PERFECT: 'Client Approved',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
  })[status] || status;
}

function orderEmbed(order) {
  const details =
    jsonDetails(order);

  const billing =
    order.billing
      ? `\n**Billing**\n${
          order.billing === 'month'
            ? 'Monthly'
            : order.billing
        }`
      : '';

  const priceText =
    order.price > 0
      ? `${order.price.toLocaleString()} ${CONFIG.currency}`
      : 'Custom quote';

  return embedWithImage(
    `NEXORA • ${order.order_code} • ${orderStatusLabel(order.status).toUpperCase()}`,

    `### ${esc(order.title)}

**CLIENT**
<@${order.customer_id}>

**SERVICE**
${esc(order.service)} · ${esc(order.plan_label)}

**PRICE**
${priceText}${billing}

**DESCRIPTION**
${clip(
  esc(order.description),
  1400
)}

**DEADLINE**
${esc(
  order.deadline ||
  'Not specified'
)}

${
  details.addons?.length
    ? `**ADD-ONS**
${details.addons
  .map(
    x =>
      esc(
        ADDONS[x]?.label ||
        x
      )
  )
  .join(', ')}

`
    : ''
}

**CLAIMED STAFF**
${
  order.claimed_staff_id
    ? `<@${order.claimed_staff_id}>`
    : 'Waiting for a claim'
}

-# ${
  order.created_at
    ? `<t:${unix(
        order.created_at
      )}:R>`
    : ''
}`,
    order.status === 'CANCELLED'
      ? COLORS.danger
      : order.status === 'COMPLETED'
        ? COLORS.success
        : COLORS.primary,
    MEDIA.order
  );
}

/*
  Before claim:
      Claim

  After claim:
      Ready
      Cancel

  Once ready:
      Cancel
*/

function orderRows(order) {
  if (
    order.status === 'SUBMITTED'
  ) {
    return [
      row(
        button(
          `order:claim:${order.id}`,
          'Claim order',
          ButtonStyle.Primary
        )
      )
    ];
  }

  if (
    order.status === 'CLAIMED'
  ) {
    return [
      row(
        button(
          `order:ready:${order.id}`,
          'Ready',
          ButtonStyle.Success
        ),
        button(
          `order:cancel:${order.id}`,
          'Cancel',
          ButtonStyle.Danger
        )
      )
    ];
  }

  if (
    ['READY', 'IN_TICKET', 'PERFECT']
      .includes(order.status)
  ) {
    return [
      row(
        button(
          `order:cancel:${order.id}`,
          'Cancel',
          ButtonStyle.Danger
        )
      )
    ];
  }

  return [
    row(
      button(
        `order:closed:${order.id}`,
        order.status === 'COMPLETED'
          ? 'Completed'
          : 'Cancelled',
        order.status === 'COMPLETED'
          ? ButtonStyle.Success
          : ButtonStyle.Danger,
        true
      )
    )
  ];
}

function ticketOpenEmbed(order) {
  return embedWithImage(
    `NEXORA • ORDER ROOM • ${order.order_code}`,

    `### Your private project room

**CLIENT**
<@${order.customer_id}>

**STAFF**
<@${order.claimed_staff_id}>

**SERVICE**
${esc(order.plan_label)}

When the work has been delivered and everything is good, **the client only** can press **Perfect**.

> **Perfect is NOT a payment button.**

The Perfect button means:
**“The delivered work is good for me.”**

After that, Nexora staff receives the payment confirmation step.

-# Nexora, Best of the Best`,

    COLORS.primary,
    MEDIA.support
  );
}

function perfectEmbed(order) {
  return embedWithImage(
    `NEXORA • PERFECT • ${order.order_code}`,

    `### Client approval received

The client confirmed that the work is good.

**CLIENT**
<@${order.customer_id}>

**STAFF**
<@${order.claimed_staff_id}>

### PAYMENT CONFIRMATION

The next button is **staff-only**.

> **ONLY PRESS “CONFIRM PAYMENT & CLOSE” AFTER THE CLIENT HAS ACTUALLY PAID THE AGREED AMOUNT.**

Once confirmed:

• the ticket closes  
• the transcript is archived  
• the order is marked completed  
• the customer receives the Nexora completion DM  
• the customer can leave a 1–5 star review

**Nexora, Best of the Best.**`,

    COLORS.success,
    MEDIA.order
  );
}

function reviewEmbed(order) {
  return embedWithImage(
    `NEXORA • ${order.order_code} • COMPLETED`,

    `### Thank you for choosing Nexora

Your order is officially complete.

> **Nexora, Best of the Best.**

Please rate the experience from **1 to 5 stars**.

Your rating opens a short form asking why you chose it, then the review is logged for the team.`,

    COLORS.success,
    MEDIA.review
  );
}

/* =========================================================
   TRANSCRIPT
   ========================================================= */

async function collectMessages(channel) {
  const all = [];

  let before;

  for (
    let page = 0;
    page < 20;
    page++
  ) {
    const options = {
      limit: 100
    };

    if (before)
      options.before = before;

    const batch =
      await channel.messages
        .fetch(options)
        .catch(() => null);

    if (!batch?.size)
      break;

    all.push(
      ...batch.values()
    );

    before =
      batch.last()?.id;

    if (
      batch.size < 100
    ) {
      break;
    }

    await sleep(100);
  }

  return all.sort(
    (a, b) =>
      a.createdTimestamp -
      b.createdTimestamp
  );
}

async function transcriptBuffer(
  channel,
  order
) {
  const messages =
    await collectMessages(
      channel
    );

  const lines = [];

  lines.push(
    'NEXORA ORDER TRANSCRIPT'
  );

  lines.push(
    '='.repeat(72)
  );

  lines.push(
    `Order: ${order.order_code}`
  );

  lines.push(
    `Client: ${order.customer_id}`
  );

  lines.push(
    `Staff: ${
      order.claimed_staff_id ||
      'None'
    }`
  );

  lines.push(
    `Opened: ${
      order.ticket_opened_at ||
      'Unknown'
    }`
  );

  lines.push(
    `Closed: ${
      order.closed_at ||
      'Unknown'
    }`
  );

  lines.push(
    `Service: ${order.service}`
  );

  lines.push(
    `Plan: ${order.plan_label}`
  );

  lines.push(
    `Price: ${
      order.price || 0
    } ${CONFIG.currency}`
  );

  lines.push(
    '='.repeat(72)
  );

  lines.push('');

  for (const message of messages) {
    const author =
      message.author
        ? `${message.author.tag} (${message.author.id})`
        : 'Unknown';

    const timestamp =
      new Date(
        message.createdTimestamp
      ).toISOString();

    let body =
      message.content || '';

    if (
      message.attachments?.size
    ) {
      body +=
        `${
          body ? '\n' : ''
        }[Attachments] ` +
        [
          ...message.attachments.values()
        ]
          .map(
            x => x.url
          )
          .join(', ');
    }

    if (
      !body &&
      message.embeds?.length
    ) {
      body = '[Embed message]';
    }

    lines.push(
      `[${timestamp}] ${author}`
    );

    lines.push(
      body ||
      '[No text content]'
    );

    lines.push(
      '-'.repeat(72)
    );
  }

  return Buffer.from(
    lines.join('\n'),
    'utf8'
  );
}

/* =========================================================
   CLIENT / BOT
   ========================================================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],

  partials: [
    Partials.Channel
  ]
});

/* =========================================================
   DISCORD HELPERS
   ========================================================= */

async function dmUser(
  userId,
  payload
) {
  const user =
    await client.users
      .fetch(userId)
      .catch(() => null);

  if (!user)
    return false;

  return Boolean(
    await user
      .send(payload)
      .then(() => true)
      .catch(() => false)
  );
}

async function updateOrderMessage(
  guild,
  order
) {
  if (
    !order.order_message_id
  ) {
    return;
  }

  const channel =
    await guild.channels
      .fetch(
        CONFIG.ordersChannelId
      )
      .catch(() => null);

  if (
    !channel?.isTextBased()
  ) {
    return;
  }

  const message =
    await channel.messages
      .fetch(
        order.order_message_id
      )
      .catch(() => null);

  if (!message)
    return;

  await message
    .edit({
      embeds: [
        orderEmbed(order)
      ],
      components:
        orderRows(order)
    })
    .catch(() => {});
}

/* =========================================================
   CREATE ORDER
   ========================================================= */

async function createOrderFromWebsite(
  data,
  customerMember
) {
  const pricing =
    calculatePrice({
      ...data,
      member:
        customerMember
    });

  if (!pricing) {
    throw new Error(
      'Invalid service or plan.'
    );
  }

  const code =
    nextCode(
      'order',
      'NX'
    );

  const created =
    now();

  const details = {
    addons:
      pricing.addons,

    text:
      data.details || '',

    source:
      'website'
  };

  const result =
    db.prepare(`
      INSERT INTO orders(
        order_code,
        customer_id,
        service,
        plan,
        plan_label,
        title,
        description,
        deadline,
        details,
        billing,
        base_price,
        discount_percent,
        price,
        status,
        created_at
      )
      VALUES(
        ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
      )
    `).run(
      code,
      data.customerId,
      data.service,
      data.plan,
      pricing.planLabel,
      clip(
        data.title,
        120
      ),
      clip(
        data.description,
        4000
      ),
      clip(
        data.deadline ||
          '',
        120
      ) || null,
      JSON.stringify(
        details
      ),
      pricing.billing,
      pricing.basePrice,
      pricing.discountPercent,
      pricing.price,
      'SUBMITTED',
      created
    );

  logEvent(
    Number(
      result.lastInsertRowid
    ),
    'SUBMITTED',
    data.customerId,
    'Order submitted from Nexora website.'
  );

  const order =
    db.prepare(`
      SELECT *
      FROM orders
      WHERE id=?
    `).get(
      result.lastInsertRowid
    );

  return {
    order,
    pricing
  };
}

async function postNewOrder(
  order,
  guild
) {
  const channel =
    await guild.channels
      .fetch(
        CONFIG.ordersChannelId
      )
      .catch(() => null);

  if (
    !channel?.isTextBased()
  ) {
    throw new Error(
      'Orders channel is missing or unavailable.'
    );
  }

  const roleIds =
    getClaimPingRoleIds(order);

  const content =
    roleIds.length
      ? roleIds
          .map(
            id =>
              `<@&${id}>`
          )
          .join(' ')
      : undefined;

  const message =
    await channel.send({
      content,
      embeds: [
        orderEmbed(order)
      ],
      components:
        orderRows(order),

      allowedMentions: {
        roles:
          roleIds
      }
    });

  db.prepare(`
    UPDATE orders
    SET order_message_id=?
    WHERE id=?
  `).run(
    message.id,
    order.id
  );

  order.order_message_id =
    message.id;

  await dmUser(
    order.customer_id,
    {
      embeds: [
        embedWithImage(
          `NEXORA • ORDER RECEIVED • ${order.order_code}`,

          `Your order has reached Nexora.

**SERVICE**
${esc(order.plan_label)}

**PRICE**
${
  order.price
    ? `${order.price.toLocaleString()} ${CONFIG.currency}`
    : 'Custom quote'
}

A matching Nexora staff member will claim it.

> **Nexora, Best of the Best.**`,

          COLORS.primary,
          MEDIA.order
        )
      ]
    }
  );

  return message;
}

/* =========================================================
   CLAIM
   ========================================================= */

async function handleClaim(
  interaction,
  order
) {
  if (
    !isOrderStaff(
      interaction.member,
      order
    )
  ) {
    return replyEmbed(
      interaction,
      'CLAIM DENIED',
      'You do not have the role required to claim this order.',
      COLORS.danger
    );
  }

  if (
    order.status !==
      'SUBMITTED' ||
    order.claimed_staff_id
  ) {
    return replyEmbed(
      interaction,
      'ORDER ALREADY CLAIMED',
      'Another staff member has already claimed this order or it is no longer claimable.',
      COLORS.warning
    );
  }

  db.prepare(`
    UPDATE orders
    SET
      status=?,
      claimed_staff_id=?,
      claimed_at=?
    WHERE id=?
  `).run(
    'CLAIMED',
    interaction.user.id,
    now(),
    order.id
  );

  logEvent(
    order.id,
    'CLAIMED',
    interaction.user.id,
    'Order claimed.'
  );

  const fresh =
    getOrder(order.id);

  await interaction.update({
    embeds: [
      orderEmbed(fresh)
    ],
    components:
      orderRows(fresh)
  });

  await dmUser(
    fresh.customer_id,
    {
      embeds: [
        embedWithImage(
          `NEXORA • ORDER CLAIMED • ${fresh.order_code}`,

          `Your order has been claimed by **<@${interaction.user.id}>**.

Nexora has assigned a staff member to your project.

You will receive another DM as soon as the project is ready for the private order room.

> **Nexora, Best of the Best.**`,

          COLORS.primary,
          MEDIA.order
        )
      ]
    }
  );
}

/* =========================================================
   MODALS
   ========================================================= */

function cancelModal(order) {
  return new ModalBuilder()
    .setCustomId(
      `order:cancel-modal:${order.id}`
    )
    .setTitle(
      `Cancel ${order.order_code}`
    )
    .addComponents(
      new ActionRowBuilder()
        .addComponents(
          new TextInputBuilder()
            .setCustomId(
              'reason'
            )
            .setLabel(
              'Why is this order being cancelled?'
            )
            .setStyle(
              TextInputStyle.Paragraph
            )
            .setRequired(true)
            .setMaxLength(
              1500
            )
            .setPlaceholder(
              'Explain the cancellation clearly.'
            )
        )
    );
}

function paymentModal(order) {
  return new ModalBuilder()
    .setCustomId(
      `order:payment-modal:${order.id}`
    )
    .setTitle(
      `Confirm payment • ${order.order_code}`
    )
    .addComponents(
      new ActionRowBuilder()
        .addComponents(
          new TextInputBuilder()
            .setCustomId(
              'reference'
            )
            .setLabel(
              'Payment reference / confirmation'
            )
            .setStyle(
              TextInputStyle.Paragraph
            )
            .setRequired(true)
            .setMaxLength(
              1200
            )
            .setPlaceholder(
              'Example: payment reference, payer name, amount, proof reference.'
            )
        )
    );
}

/* =========================================================
   READY
   ========================================================= */

async function handleReady(
  interaction,
  order
) {
  if (
    order.claimed_staff_id !==
      interaction.user.id &&
    !isManagement(
      interaction.member
    )
  ) {
    return replyEmbed(
      interaction,
      'READY DENIED',
      'Only the assigned staff member or management can mark this order ready.',
      COLORS.danger
    );
  }

  if (
    order.status !==
      'CLAIMED'
  ) {
    return replyEmbed(
      interaction,
      'NOT READY YET',
      'This order is not currently in the claimed stage.',
      COLORS.warning
    );
  }

  db.prepare(`
    UPDATE orders
    SET
      status=?,
      ready_at=?
    WHERE id=?
  `).run(
    'READY',
    now(),
    order.id
  );

  logEvent(
    order.id,
    'READY',
    interaction.user.id,
    'Staff marked order ready.'
  );

  const fresh =
    getOrder(order.id);

  await updateOrderMessage(
    interaction.guild,
    fresh
  );

  const ticket =
    await openOrderTicket(
      interaction.guild,
      fresh
    );

  const ticketUrl =
    ticket?.url ||
    `https://discord.com/channels/${interaction.guild.id}/${fresh.ticket_channel_id}`;

  await dmUser(
    fresh.customer_id,
    {
      embeds: [
        embedWithImage(
          `NEXORA • YOUR ORDER IS READY • ${fresh.order_code}`,

          `Your Nexora order is ready for the final private stage.

Your private Discord order room is ready.

> **Open it with the button below.**`,

          COLORS.success,
          MEDIA.order
        )
      ],

      components: [
        row(
          linkButton(
            'Open private order room',
            ticketUrl
          )
        )
      ]
    }
  );

  return replyEmbed(
    interaction,
    'ORDER MARKED READY',
    'The client was notified and the private order room has been created.',
    COLORS.success
  );
}

/* =========================================================
   OPEN PRIVATE ORDER TICKET
   ========================================================= */

async function openOrderTicket(
  guild,
  order
) {
  const existing =
    order.ticket_channel_id
      ? await guild.channels
          .fetch(
            order.ticket_channel_id
          )
          .catch(() => null)
      : null;

  if (existing)
    return existing;

  const overwrites = [
    {
      id: guild.id,
      deny: [
        PermissionFlagsBits.ViewChannel
      ]
    },

    {
      id: order.customer_id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles
      ]
    },

    {
      id: order.claimed_staff_id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles
      ]
    },

    {
      id: client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages
      ]
    }
  ];

  for (
    const roleId of [
      ...CONFIG.supportRoleIds,
      ...CONFIG.managementRoleIds
    ]
  ) {
    if (!roleId)
      continue;

    overwrites.push({
      id: roleId,

      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles
      ]
    });
  }

  const channel =
    await guild.channels.create({
      name:
        `order-${order.order_code.toLowerCase()}`,

      type:
        ChannelType.GuildText,

      parent:
        CONFIG.ticketCategoryId ||
        undefined,

      topic:
        `Nexora order ${order.order_code} • client ${order.customer_id} • staff ${order.claimed_staff_id || 'unassigned'}`,

      permissionOverwrites:
        overwrites
    });

  db.prepare(`
    UPDATE orders
    SET
      status=?,
      ticket_channel_id=?,
      ticket_opened_at=?
    WHERE id=?
  `).run(
    'IN_TICKET',
    channel.id,
    now(),
    order.id
  );

  logEvent(
    order.id,
    'TICKET_OPENED',
    client.user.id,
    channel.id
  );

  const fresh =
    getOrder(order.id);

  await channel.send({
    content:
      `<@${fresh.customer_id}> <@${fresh.claimed_staff_id}>`,

    embeds: [
      ticketOpenEmbed(fresh)
    ],

    components: [
      row(
        button(
          `order:perfect:${fresh.id}`,
          'Perfect',
          ButtonStyle.Success
        ),

        button(
          `order:cancel-ticket:${fresh.id}`,
          'Cancel order',
          ButtonStyle.Danger
        )
      )
    ],

    allowedMentions: {
      users: [
        fresh.customer_id,
        fresh.claimed_staff_id
      ]
    }
  });

  return channel;
}

/* =========================================================
   PERFECT
   ========================================================= */

async function handlePerfect(
  interaction,
  order
) {
  if (
    order.customer_id !==
    interaction.user.id
  ) {
    return replyEmbed(
      interaction,
      'CLIENT ONLY',
      'Only the client who placed this order can press **Perfect**.',
      COLORS.danger
    );
  }

  if (
    ![
      'IN_TICKET',
      'READY'
    ].includes(
      order.status
    )
  ) {
    return replyEmbed(
      interaction,
      'PERFECT UNAVAILABLE',
      'The order is not currently waiting for client approval.',
      COLORS.warning
    );
  }

  db.prepare(`
    UPDATE orders
    SET
      status=?,
      perfect_at=?
    WHERE id=?
  `).run(
    'PERFECT',
    now(),
    order.id
  );

  logEvent(
    order.id,
    'PERFECT',
    interaction.user.id,
    'Client marked the work as perfect.'
  );

  const fresh =
    getOrder(order.id);

  await interaction.update({
    embeds: [
      perfectEmbed(fresh)
    ],

    components: [
      row(
        button(
          `order:payment:${fresh.id}`,
          'Confirm Payment & Close',
          ButtonStyle.Success
        ),

        button(
          `order:cancel-ticket:${fresh.id}`,
          'Cancel order',
          ButtonStyle.Danger
        )
      )
    ]
  });

  await dmUser(
    fresh.claimed_staff_id,
    {
      embeds: [
        baseEmbed(
          `NEXORA • CLIENT APPROVED • ${fresh.order_code}`,

          `The client pressed **Perfect**.

When the client has actually paid, use **Confirm Payment & Close** in the ticket.

> **DO NOT PRESS IT BEFORE PAYMENT.**`,

          COLORS.success
        )
      ]
    }
  );
}

/* =========================================================
   FINALIZE / PAYMENT
   ========================================================= */

async function finalizeOrder(
  guild,
  order,
  actorId,
  paymentReference
) {
  const closedAt =
    now();

  db.prepare(`
    UPDATE orders
    SET
      status=?,
      paid_at=?,
      closed_at=?
    WHERE id=?
  `).run(
    'COMPLETED',
    closedAt,
    closedAt,
    order.id
  );

  logEvent(
    order.id,
    'PAID_COMPLETED',
    actorId,
    paymentReference
  );

  const fresh =
    getOrder(order.id);

  const channel =
    await guild.channels
      .fetch(
        fresh.ticket_channel_id
      )
      .catch(() => null);

  let transcript =
    Buffer.from(
      'Transcript unavailable.',
      'utf8'
    );

  if (
    channel?.isTextBased()
  ) {
    transcript =
      await transcriptBuffer(
        channel,
        fresh
      );
  }

  const archive =
    await guild.channels
      .fetch(
        CONFIG.archiveChannelId
      )
      .catch(() => null);

  if (
    archive?.isTextBased()
  ) {
    const logEmbed =
      embedWithImage(

        `NEXORA • ORDER CLOSED • ${fresh.order_code}`,

        `**CLIENT**
<@${fresh.customer_id}>

**CLAIMED STAFF**
<@${fresh.claimed_staff_id || 'Unknown'}>

**SERVICE**
${esc(fresh.plan_label)}

**PRICE**
${fresh.price.toLocaleString()} ${CONFIG.currency}

**OPEN DATE**
<t:${unix(
  fresh.ticket_opened_at ||
  fresh.created_at
)}:F>

**CLOSED DATE**
<t:${unix(
  fresh.closed_at
)}:F>

**PAYMENT CONFIRMATION**
${clip(
  esc(paymentReference),
  1500
)}

**STATUS**
COMPLETED

**NEXORA**
Best of the Best.`,

        COLORS.success,
        MEDIA.bottomBanner
      );

    await archive.send({
      embeds: [
        logEmbed
      ],

      files: [
        new AttachmentBuilder(
          transcript,
          {
            name:
              `${fresh.order_code}-transcript.txt`
          }
        )
      ]
    }).catch(() => {});
  }

  if (channel) {
    await channel.send({
      embeds: [
        baseEmbed(

          `NEXORA • ORDER COMPLETED • ${fresh.order_code}`,

          `Payment was confirmed and this order is now closed.

Thank you for choosing **Nexora, Best of the Best**.`,

          COLORS.success
        )
      ]
    }).catch(() => {});

    await channel
      .permissionOverwrites
      .edit(
        fresh.customer_id,
        {
          SendMessages:
            false
        }
      )
      .catch(() => {});

    await channel
      .permissionOverwrites
      .edit(
        fresh.claimed_staff_id,
        {
          SendMessages:
            false
        }
      )
      .catch(() => {});

    setTimeout(
      () => {
        channel
          .delete(
            'Nexora order completed'
          )
          .catch(() => {});
      },
      15000
    );
  }

  const member =
    await guild.members
      .fetch(
        fresh.customer_id
      )
      .catch(() => null);

  if (
    member &&
    CONFIG.customerRoleId &&
    !member.roles.cache.has(
      CONFIG.customerRoleId
    )
  ) {
    await member.roles.add(
      CONFIG.customerRoleId,
      'Nexora completed order'
    ).catch(() => {});
  }

  if (
    member &&
    CONFIG.vipCustomerRoleId
  ) {
    const completed =
      db.prepare(`
        SELECT COUNT(*) c
        FROM orders
        WHERE customer_id=?
        AND status='COMPLETED'
      `).get(
        fresh.customer_id
      ).c;

    if (
      completed >= 3 &&
      !member.roles.cache.has(
        CONFIG.vipCustomerRoleId
      )
    ) {
      await member.roles.add(
        CONFIG.vipCustomerRoleId,
        'Nexora VIP customer reward'
      ).catch(() => {});
    }
  }

  await dmUser(
    fresh.customer_id,
    {
      embeds: [
        reviewEmbed(fresh)
      ],

      components: [
        row(
          button(
            `review:1:${fresh.id}`,
            '★ 1',
            ButtonStyle.Danger
          ),

          button(
            `review:2:${fresh.id}`,
            '★ 2',
            ButtonStyle.Danger
          ),

          button(
            `review:3:${fresh.id}`,
            '★ 3',
            ButtonStyle.Secondary
          ),

          button(
            `review:4:${fresh.id}`,
            '★ 4',
            ButtonStyle.Primary
          ),

          button(
            `review:5:${fresh.id}`,
            '★ 5',
            ButtonStyle.Success
          )
        )
      ]
    }
  );

  return fresh;
}

/* =========================================================
   CANCEL
   ========================================================= */

async function cancelOrder(
  guild,
  order,
  actorId,
  reason
) {
  db.prepare(`
    UPDATE orders
    SET
      status=?,
      cancelled_at=?,
      cancelled_by=?,
      cancellation_reason=?
    WHERE id=?
  `).run(
    'CANCELLED',
    now(),
    actorId,
    reason,
    order.id
  );

  logEvent(
    order.id,
    'CANCELLED',
    actorId,
    reason
  );

  const fresh =
    getOrder(order.id);

  await updateOrderMessage(
    guild,
    fresh
  );

  if (
    fresh.ticket_channel_id
  ) {
    const ch =
      await guild.channels
        .fetch(
          fresh.ticket_channel_id
        )
        .catch(() => null);

    if (ch) {
      await ch.send({
        embeds: [
          baseEmbed(

            `NEXORA • ORDER CANCELLED • ${fresh.order_code}`,

            `**Reason**
${esc(reason)}

This order room will now close.

> **Nexora, Best of the Best.**`,

            COLORS.danger
          )
        ]
      }).catch(() => {});

      setTimeout(
        () =>
          ch.delete(
            'Nexora order cancelled'
          ).catch(() => {}),
        5000
      );
    }
  }

  await dmUser(
    fresh.customer_id,
    {
      embeds: [
        baseEmbed(

          `NEXORA • ORDER CANCELLED • ${fresh.order_code}`,

          `Your order has been cancelled.

**Reason**
${esc(reason)}

If you believe this was incorrect, contact Nexora staff.`,

          COLORS.danger
        )
      ]
    }
  );

  if (
    fresh.claimed_staff_id
  ) {
    await dmUser(
      fresh.claimed_staff_id,
      {
        embeds: [
          baseEmbed(

            `NEXORA • ORDER CANCELLED • ${fresh.order_code}`,

            `This order has been cancelled.

**Reason**
${esc(reason)}`,

            COLORS.danger
          )
        ]
      }
    );
  }

  return fresh;
}

/* =========================================================
   REVIEW SYSTEM
   ========================================================= */

function reviewModal(
  orderId,
  rating
) {
  return new ModalBuilder()
    .setCustomId(
      `review-modal:${rating}:${orderId}`
    )
    .setTitle(
      `Nexora review • ${rating}/5`
    )
    .addComponents(
      new ActionRowBuilder()
        .addComponents(
          new TextInputBuilder()
            .setCustomId(
              'reason'
            )
            .setLabel(
              'Why did you choose this rating?'
            )
            .setStyle(
              TextInputStyle.Paragraph
            )
            .setRequired(true)
            .setMaxLength(
              1500
            )
            .setPlaceholder(
              'Tell the Nexora team what influenced your rating.'
            )
        )
    );
}

async function openReviewModal(
  interaction,
  orderId,
  rating
) {
  const order =
    getOrder(orderId);

  if (!order)
    return interaction.reply({
      content:
        'Review unavailable.',
      ephemeral: true
    });

  if (
    order.customer_id !==
      interaction.user.id ||
    order.status !==
      'COMPLETED'
  ) {
    return interaction.reply({
      content:
        'Only the client who completed this order can leave this review.',
      ephemeral: true
    });
  }

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return interaction.reply({
      content:
        'Invalid review rating.',
      ephemeral: true
    });
  }

  return interaction.showModal(
    reviewModal(
      order.id,
      rating
    )
  );
}

async function saveReview(
  interaction,
  orderId,
  rating,
  reason
) {
  const order =
    getOrder(orderId);

  if (!order)
    return interaction.reply({
      content:
        'Order not found.',
      ephemeral: true
    });

  if (
    order.customer_id !==
      interaction.user.id ||
    order.status !==
      'COMPLETED'
  ) {
    return interaction.reply({
      content:
        'This review does not belong to your order.',
      ephemeral: true
    });
  }

  try {
    db.prepare(`
      INSERT INTO reviews(
        order_id,
        customer_id,
        staff_id,
        rating,
        reason,
        created_at
      )
      VALUES(?,?,?,?,?,?)
    `).run(
      order.id,
      order.customer_id,
      order.claimed_staff_id,
      rating,
      reason,
      now()
    );
  } catch {
    return interaction.reply({
      content:
        'This order already has a review.',
      ephemeral: true
    });
  }

  const channel =
    await client.channels
      .fetch(
        CONFIG.reviewLogChannelId
      )
      .catch(() => null);

  if (
    channel?.isTextBased()
  ) {
    const stars =
      '★'.repeat(rating) +
      '☆'.repeat(5 - rating);

    const ping =
      order.claimed_staff_id
        ? `<@${order.claimed_staff_id}>`
        : '';

    await channel.send({
      content:
        ping || undefined,

      embeds: [
        embedWithImage(

          `NEXORA • REVIEW • ${order.order_code}`,

          `**CLIENT**
<@${order.customer_id}>

**STAFF**
${ping || 'Unknown'}

**RATING**
${stars}

**WHY**
${esc(reason)}

**DATE**
<t:${unix(now())}:F>

> **Nexora, Best of the Best.**`,

          rating <= 2
            ? COLORS.danger
            : rating === 3
              ? COLORS.warning
              : COLORS.success,

          MEDIA.review
        )
      ],

      allowedMentions:
        order.claimed_staff_id
          ? {
              users: [
                order.claimed_staff_id
              ]
            }
          : undefined
    });
  }

  return interaction.reply({
    content:
      'Thank you. Your review was logged for the Nexora team.',
    ephemeral: true
  });
}

/* =========================================================
   OAUTH / WEBSITE API
   ========================================================= */

const app =
  express();

app.use(
  express.json({
    limit:
      '64kb'
  })
);

const websiteOrigin =
  (() => {
    try {
      return new URL(
        CONFIG.websiteUrl
      ).origin;
    } catch {
      return CONFIG.websiteUrl;
    }
  })();

app.use(
  cors({
    origin:
      websiteOrigin,
    credentials:
      false
  })
);

function bearer(req) {
  const header =
    String(
      req.headers.authorization ||
        ''
    );

  return header.startsWith(
    'Bearer '
  )
    ? header
        .slice(7)
        .trim()
    : '';
}

function sessionUser(req) {
  const token =
    bearer(req);

  if (!token)
    return null;

  const row =
    db.prepare(`
      SELECT *
      FROM sessions
      WHERE token=?
      AND expires_at>?
    `).get(
      token,
      Date.now()
    );

  if (!row)
    return null;

  return row.user_id;
}

function apiAuth(
  req,
  res,
  next
) {
  const userId =
    sessionUser(req);

  if (!userId) {
    return res
      .status(401)
      .json({
        error:
          'Discord login required.'
      });
  }

  req.userId =
    userId;

  next();
}

app.get(
  '/health',
  (req, res) =>
    res.json({
      ok: true,
      service:
        'nexora-bot',
      time:
        now()
    })
);

/* =========================================================
   DISCORD LOGIN
   ========================================================= */

app.get(
  '/auth/discord',
  (req, res) => {
    if (!CONFIG.clientSecret) {
      return res
        .status(500)
        .send(
          'DISCORD_CLIENT_SECRET is missing on the bot host.'
        );
    }

    const state =
      crypto
        .randomBytes(24)
        .toString('hex');

    db.prepare(`
      INSERT INTO oauth_states(
        state,
        return_url,
        expires_at
      )
      VALUES(?,?,?)
    `).run(
      state,
      CONFIG.websiteUrl,
      Date.now() +
        10 * 60 * 1000
    );

    const redirectUri =
      `${CONFIG.apiUrl.replace(/\/$/, '')}/auth/callback`;

    const params =
      new URLSearchParams({
        client_id:
          CONFIG.clientId,

        response_type:
          'code',

        redirect_uri:
          redirectUri,

        scope:
          'identify',

        state
      });

    res.redirect(
      `https://discord.com/oauth2/authorize?${params.toString()}`
    );
  }
);

app.get(
  '/auth/callback',
  async (
    req,
    res
  ) => {
    try {
      const stateRow =
        db.prepare(`
          SELECT *
          FROM oauth_states
          WHERE state=?
          AND expires_at>?
        `).get(
          String(
            req.query.state ||
              ''
          ),
          Date.now()
        );

      if (!stateRow) {
        return res
          .status(400)
          .send(
            'Login session expired. Return to the Nexora website and try again.'
          );
      }

      db.prepare(`
        DELETE FROM oauth_states
        WHERE state=?
      `).run(
        stateRow.state
      );

      const redirectUri =
        `${CONFIG.apiUrl.replace(/\/$/, '')}/auth/callback`;

      const tokenRes =
        await fetch(
          'https://discord.com/api/v10/oauth2/token',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/x-www-form-urlencoded'
            },

            body:
              new URLSearchParams({
                client_id:
                  CONFIG.clientId,

                client_secret:
                  CONFIG.clientSecret,

                grant_type:
                  'authorization_code',

                code:
                  String(
                    req.query.code ||
                      ''
                  ),

                redirect_uri:
                  redirectUri
              })
          }
        );

      if (!tokenRes.ok) {
        throw new Error(
          `Discord token exchange failed (${tokenRes.status}).`
        );
      }

      const tokens =
        await tokenRes.json();

      const userRes =
        await fetch(
          'https://discord.com/api/v10/users/@me',
          {
            headers: {
              Authorization:
                `Bearer ${tokens.access_token}`
            }
          }
        );

      if (!userRes.ok) {
        throw new Error(
          'Could not read the Discord profile.'
        );
      }

      const user =
        await userRes.json();

      /*
        Force the website login to actually belong
        to someone in the Nexora Discord server.
      */

      const memberRes =
        await fetch(
          `https://discord.com/api/v10/guilds/${CONFIG.guildId}/members/${user.id}`,
          {
            headers: {
              Authorization:
                `Bot ${CONFIG.token}`
            }
          }
        );

      if (!memberRes.ok) {
        return res
          .status(403)
          .send(
            'You must be a member of the Nexora Discord server before placing an order.'
          );
      }

      const ticket =
        crypto
          .randomBytes(32)
          .toString('hex');

      db.prepare(`
        INSERT INTO login_tickets(
          ticket,
          user_id,
          expires_at
        )
        VALUES(?,?,?)
      `).run(
        ticket,
        user.id,
        Date.now() +
          60 * 1000
      );

      const redirect =
        new URL(
          stateRow.return_url
        );

      redirect.searchParams.set(
        'auth_ticket',
        ticket
      );

      res.redirect(
        redirect.toString()
      );
    } catch (error) {
      console.error(
        '[OAuth]',
        error
      );

      res
        .status(500)
        .send(
          'Nexora login could not be completed. Return to the Nexora website and try again.'
        );
    }
  }
);

app.post(
  '/api/auth/exchange',
  (req, res) => {
    const ticket =
      String(
        req.body?.ticket ||
          ''
      );

    const row =
      db.prepare(`
        SELECT *
        FROM login_tickets
        WHERE ticket=?
        AND expires_at>?
        AND used=0
      `).get(
        ticket,
        Date.now()
      );

    if (!row) {
      return res
        .status(400)
        .json({
          error:
            'Login ticket expired.'
        });
    }

    const session =
      crypto
        .randomBytes(32)
        .toString('hex');

    const expiresAt =
      Date.now() +
      CONFIG.sessionHours *
        3600000;

    db.prepare(`
      UPDATE login_tickets
      SET used=1
      WHERE ticket=?
    `).run(ticket);

    db.prepare(`
      INSERT INTO sessions(
        token,
        user_id,
        expires_at
      )
      VALUES(?,?,?)
    `).run(
      session,
      row.user_id,
      expiresAt
    );

    res.json({
      token: session,
      expiresAt
    });
  }
);

app.post(
  '/api/auth/logout',
  apiAuth,
  (req, res) => {
    const token =
      bearer(req);

    if (token) {
      db.prepare(`
        DELETE FROM sessions
        WHERE token=?
      `).run(
        token
      );
    }

    res.json({
      ok: true
    });
  }
);

/* =========================================================
   WEBSITE API
   ========================================================= */

app.get(
  '/api/me',
  apiAuth,
  async (
    req,
    res
  ) => {
    const userRes =
      await fetch(
        `https://discord.com/api/v10/users/${req.userId}`,
        {
          headers: {
            Authorization:
              `Bot ${CONFIG.token}`
          }
        }
      ).catch(
        () => null
      );

    const user =
      userRes?.ok
        ? await userRes.json()
        : {
            id:
              req.userId,
            username:
              'Discord User'
          };

    const guild =
      await client.guilds
        .fetch(
          CONFIG.guildId
        )
        .catch(() => null);

    const member =
      await guild?.members
        .fetch(
          req.userId
        )
        .catch(() => null);

    res.json({
      id:
        user.id,

      username:
        user.global_name ||
        user.username,

      avatar:
        user.avatar,

      discountPercent:
        getDiscountFromMember(
          member
        )
    });
  }
);

app.get(
  '/api/services',
  apiAuth,
  async (
    req,
    res
  ) => {
    const guild =
      await client.guilds
        .fetch(
          CONFIG.guildId
        )
        .catch(() => null);

    const member =
      await guild?.members
        .fetch(
          req.userId
        )
        .catch(() => null);

    res.json({
      currency:
        CONFIG.currency,

      discountPercent:
        getDiscountFromMember(
          member
        ),

      services:
        PRICING,

      addons:
        ADDONS
    });
  }
);

app.get(
  '/api/orders',
  apiAuth,
  (req, res) => {
    const rows =
      db.prepare(`
        SELECT
          order_code,
          service,
          plan_label,
          title,
          price,
          status,
          created_at,
          claimed_at,
          ready_at,
          ticket_opened_at,
          closed_at
        FROM orders
        WHERE customer_id=?
        ORDER BY id DESC
        LIMIT 20
      `).all(
        req.userId
      );

    res.json(rows);
  }
);

app.post(
  '/api/orders',
  apiAuth,
  async (
    req,
    res
  ) => {
    try {
      const {
        service,
        plan,
        title,
        description,
        deadline,
        details,
        addons
      } = req.body || {};

      if (
        !PRICING[service] ||
        !PRICING[service]
          .plans?.[plan]
      ) {
        return res
          .status(400)
          .json({
            error:
              'Invalid service or plan.'
          });
      }

      if (
        !String(title || '').trim()
      ) {
        return res
          .status(400)
          .json({
            error:
              'A project title is required.'
          });
      }

      if (
        !String(
          description || ''
        ).trim()
      ) {
        return res
          .status(400)
          .json({
            error:
              'A project description is required.'
          });
      }

      const guild =
        await client.guilds
          .fetch(
            CONFIG.guildId
          )
          .catch(
            () => null
          );

      const member =
        await guild?.members
          .fetch(
            req.userId
          )
          .catch(
            () => null
          );

      if (!member) {
        return res
          .status(403)
          .json({
            error:
              'You must be in the Nexora Discord server.'
          });
      }

      const {
        order,
        pricing
      } =
        await createOrderFromWebsite(
          {
            customerId:
              req.userId,

            service,
            plan,

            title:
              String(
                title
              ).trim(),

            description:
              String(
                description
              ).trim(),

            deadline:
              String(
                deadline || ''
              ).trim(),

            details:
              String(
                details || ''
              ).trim(),

            addons
          },

          member
        );

      const current =
        getOrder(
          order.id
        );

      await postNewOrder(
        current,
        guild
      );

      res.json({
        ok: true,

        order: {
          code:
            current.order_code,

          service:
            current.plan_label,

          price:
            current.price,

          currency:
            CONFIG.currency,

          billing:
            current.billing,

          discountPercent:
            current.discount_percent
        }
      });
    } catch (error) {
      console.error(
        '[API ORDER]',
        error
      );

      res
        .status(500)
        .json({
          error:
            'The order could not be submitted.'
        });
    }
  }
);

app.use(
  (req, res) =>
    res
      .status(404)
      .json({
        error:
          'Not found.'
      })
);

app.listen(
  CONFIG.port,
  '0.0.0.0',
  () =>
    console.log(
      `Nexora API listening on ${CONFIG.port}`
    )
);

/* =========================================================
   FUN / ECONOMY
   ========================================================= */

const JOKES = [
  'Why did the developer go broke? Because they used up all their cache.',
  'My code and I had an argument. It refused to throw an exception.',
  'Why do bots love Discord? Too many channels to count.',
  'I asked the bug to leave. It said it was a feature.'
];

const FACTS = [
  'Bananas are botanically berries, while strawberries are not.',
  'Octopuses have three hearts.',
  'The first computer mouse was made of wood.',
  'A day on Venus is longer than a Venusian year.'
];

const DARES = [
  'Change your status to “Nexora, Best of the Best” for ten minutes.',
  'Send the next message using only three words.',
  'Compliment someone in the server.',
  'Use the most dramatic GIF you can find for your next reply.'
];

const ROASTS = [
  'I would roast you, but the server already has enough heat.',
  'You have the confidence of a finished project and the bug count of a beta build.',
  'Your Wi-Fi has better decision making than you.',
  'You are not a loading screen. You are the whole loading process.'
];

function ensureWallet(
  userId
) {
  db.prepare(`
    INSERT INTO wallets(
      user_id,
      nx,
      last_daily,
      daily_streak
    )
    VALUES(?,?,NULL,0)
    ON CONFLICT(user_id)
    DO NOTHING
  `).run(
    userId,
    0
  );

  return db.prepare(`
    SELECT *
    FROM wallets
    WHERE user_id=?
  `).get(
    userId
  );
}

function addNX(
  userId,
  amount
) {
  ensureWallet(
    userId
  );

  db.prepare(`
    UPDATE wallets
    SET nx=MAX(0,nx+?)
    WHERE user_id=?
  `).run(
    amount,
    userId
  );

  return db.prepare(`
    SELECT nx
    FROM wallets
    WHERE user_id=?
  `).get(
    userId
  ).nx;
}

/* =========================================================
   COUNTING
   ========================================================= */

function dailyGoalFor(date) {
  const min =
    Math.max(
      10,
      CONFIG.countingGoalMin
    );

  const max =
    Math.max(
      min,
      CONFIG.countingGoalMax
    );

  const span =
    Math.max(
      1,
      Math.floor(
        (max - min) / 25
      )
    );

  let hash =
    2166136261;

  for (
    const char of date
  ) {
    hash =
      Math.imul(
        hash ^
          char.charCodeAt(0),
        16777619
      );
  }

  return (
    min +
    (
      Math.abs(
        hash >>> 0
      ) %
        (span + 1)
    ) *
      25
  );
}

function ensureCounting(
  guildId
) {
  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  let row =
    db.prepare(`
      SELECT *
      FROM counting_state
      WHERE guild_id=?
    `).get(
      guildId
    );

  if (!row) {
    db.prepare(`
      INSERT INTO counting_state(
        guild_id,
        current_number,
        last_user_id,
        streak,
        server_record,
        daily_date,
        daily_goal,
        daily_goal_reached,
        updated_at
      )
      VALUES(?,?,?,?,?,?,?,?,?)
    `).run(
      guildId,
      0,
      null,
      0,
      0,
      today,
      dailyGoalFor(
        today
      ),
      0,
      now()
    );

    row =
      db.prepare(`
        SELECT *
        FROM counting_state
        WHERE guild_id=?
      `).get(
        guildId
      );
  }

  if (
    row.daily_date !==
    today
  ) {
    db.prepare(`
      UPDATE counting_state
      SET
        daily_date=?,
        daily_goal=?,
        daily_goal_reached=0,
        updated_at=?
      WHERE guild_id=?
    `).run(
      today,
      dailyGoalFor(
        today
      ),
      now(),
      guildId
    );

    row =
      db.prepare(`
        SELECT *
        FROM counting_state
        WHERE guild_id=?
      `).get(
        guildId
      );
  }

  return row;
}

async function handleCounting(
  message
) {
  if (
    !message.guild ||
    message.author.bot ||
    message.channel.id !==
      CONFIG.countingChannelId
  ) {
    return false;
  }

  const value =
    Number(
      String(
        message.content || ''
      )
        .trim()
        .replace(
          /,/g,
          ''
        )
    );

  if (
    !Number.isSafeInteger(
      value
    ) ||
    value < 0
  ) {
    await message
      .delete()
      .catch(() => {});

    return true;
  }

  const result =
    db.transaction(() => {
      const state =
        ensureCounting(
          message.guild.id
        );

      const member =
        db.prepare(`
          SELECT *
          FROM counting_members
          WHERE guild_id=?
          AND user_id=?
        `).get(
          message.guild.id,
          message.author.id
        );

      const expected =
        state.current_number +
        1;

      const failed =
        state.last_user_id ===
          message.author.id ||
        value !== expected;

      const mistakes =
        (member?.mistakes || 0) +
        (failed ? 1 : 0);

      if (failed) {
        db.prepare(`
          INSERT INTO counting_members(
            guild_id,
            user_id,
            personal_best,
            mistakes,
            updated_at
          )
          VALUES(?,?,?,?,?)
          ON CONFLICT(
            guild_id,
            user_id
          )
          DO UPDATE SET
            mistakes=excluded.mistakes,
            updated_at=excluded.updated_at
        `).run(
          message.guild.id,
          message.author.id,
          member?.personal_best ||
            0,
          mistakes,
          now()
        );

        db.prepare(`
          UPDATE counting_state
          SET
            current_number=0,
            last_user_id=NULL,
            streak=0,
            updated_at=?
          WHERE guild_id=?
        `).run(
          now(),
          message.guild.id
        );

        return {
          ok: false,
          expected
        };
      }

      const personalBest =
        Math.max(
          member?.personal_best ||
            0,
          value
        );

      const streak =
        state.streak +
        1;

      const daily =
        !state.daily_goal_reached &&
        value >=
          state.daily_goal;

      db.prepare(`
        INSERT INTO counting_members(
          guild_id,
          user_id,
          personal_best,
          mistakes,
          updated_at
        )
        VALUES(?,?,?,?,?)
        ON CONFLICT(
          guild_id,
          user_id
        )
        DO UPDATE SET
          personal_best=excluded.personal_best,
          updated_at=excluded.updated_at
      `).run(
        message.guild.id,
        message.author.id,
        personalBest,
        member?.mistakes ||
          0,
        now()
      );

      db.prepare(`
        UPDATE counting_state
        SET
          current_number=?,
          last_user_id=?,
          streak=?,
          server_record=MAX(
            server_record,
            ?
          ),
          daily_goal_reached=MAX(
            daily_goal_reached,
            ?
          ),
          updated_at=?
        WHERE guild_id=?
      `).run(
        value,
        message.author.id,
        streak,
        value,
        daily ? 1 : 0,
        now(),
        message.guild.id
      );

      return {
        ok: true,
        value,
        streak,
        personalBest,
        record:
          value >
          state.server_record,
        daily
      };
    })();

  if (!result.ok) {
    await message
      .react('😡')
      .catch(() => {});

    const reply =
      await message.reply(
        `Wrong number. The next number was **${result.expected}**. The count resets.`
      ).catch(
        () => null
      );

    if (reply) {
      setTimeout(
        () =>
          reply
            .delete()
            .catch(
              () => {}
            ),
        7000
      );
    }

    return true;
  }

  await message
    .react('✅')
    .catch(() => {});

  if (result.record) {
    await message.channel
      .send(
        `🏆 **New server record:** ${result.value.toLocaleString()}!`
      )
      .catch(() => {});
  }

  if (result.daily) {
    await message.channel
      .send(
        `✅ **Daily counting goal completed:** ${ensureCounting(message.guild.id).daily_goal.toLocaleString()}!`
      )
      .catch(() => {});
  }

  return true;
}

/* =========================================================
   POLLS
   ========================================================= */

function pollEmbed(
  poll
) {
  const options =
    JSON.parse(
      poll.options
    );

  const counts =
    options.map(
      (_, index) =>
        db.prepare(`
          SELECT COUNT(*) c
          FROM poll_votes
          WHERE poll_id=?
          AND option_index=?
        `).get(
          poll.id,
          index
        ).c
    );

  return embedWithImage(

    `NEXORA • POLL • #${poll.id}`,

    `### ${esc(poll.question)}

${options
  .map(
    (option, index) =>
      `**${index + 1}. ${esc(option)}** — ${counts[index]} vote(s)`
  )
  .join('\n')}

-# Nexora, Best of the Best`,

    COLORS.primary,
    MEDIA.services
  );
}

function pollComponents(
  poll
) {
  const options =
    JSON.parse(
      poll.options
    );

  return [
    row(
      ...options
        .slice(0, 5)
        .map(
          (option, index) =>
            button(
              `poll:${poll.id}:${index}`,
              `${index + 1}`,
              ButtonStyle.Primary
            )
        )
    )
  ];
}

function renderPoll(
  poll
) {
  return {
    embeds: [
      pollEmbed(poll)
    ],
    components:
      poll.ended
        ? []
        : pollComponents(poll)
  };
}

async function endPoll(
  poll
) {
  if (poll.ended)
    return;

  db.prepare(`
    UPDATE polls
    SET ended=1
    WHERE id=?
  `).run(
    poll.id
  );

  const channel =
    await client.channels
      .fetch(
        poll.channel_id
      )
      .catch(() => null);

  const message =
    channel?.isTextBased()
      ? await channel.messages
          .fetch(
            poll.message_id
          )
          .catch(() => null)
      : null;

  if (message) {
    await message
      .edit(
        renderPoll({
          ...poll,
          ended: 1
        })
      )
      .catch(() => {});
  }
}

/* =========================================================
   GIVEAWAYS
   ========================================================= */

function parseDuration(
  input
) {
  const match =
    /^(\d+)\s*(s|m|h|d|w)$/i.exec(
      String(
        input || ''
      ).trim()
    );

  if (!match)
    return null;

  const amount =
    Number(match[1]);

  const unit =
    match[2].toLowerCase();

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
  };

  return (
    amount *
    multipliers[unit]
  );
}

function giveawayEmbed(
  giveaway,
  ended = false
) {
  const entryCount =
    db.prepare(`
      SELECT COUNT(*) c
      FROM giveaway_entries
      WHERE giveaway_id=?
    `).get(
      giveaway.id
    ).c;

  return embedWithImage(

    ended
      ? `NEXORA • GIVEAWAY CLOSED • ${giveaway.code}`
      : `NEXORA • GIVEAWAY • ${giveaway.code}`,

    `### ${esc(giveaway.prize)}

**WINNERS**
${giveaway.winners}

**ENTRIES**
${entryCount}

${
  ended
    ? 'This giveaway is now closed.'
    : `**ENDS**
<t:${unix(giveaway.ends_at)}:R>`
}

${
  giveaway.required_role_id
    ? `**REQUIRED ROLE**
<@&${giveaway.required_role_id}>`
    : ''
}

> **Nexora, Best of the Best.**`,

    ended
      ? COLORS.danger
      : COLORS.primary,

    MEDIA.bottomBanner
  );
}

function giveawayComponents(
  giveaway
) {
  if (giveaway.ended)
    return [];

  return [
    row(
      button(
        `giveaway:join:${giveaway.id}`,
        'Enter / Leave',
        ButtonStyle.Primary
      )
    )
  ];
}

async function endGiveaway(
  giveaway
) {
  if (
    giveaway.ended
  ) {
    return;
  }

  db.prepare(`
    UPDATE giveaways
    SET ended=1
    WHERE id=?
  `).run(
    giveaway.id
  );

  const channel =
    await client.channels
      .fetch(
        giveaway.channel_id
      )
      .catch(() => null);

  if (
    !channel?.isTextBased()
  ) {
    return;
  }

  const message =
    await channel.messages
      .fetch(
        giveaway.message_id
      )
      .catch(() => null);

  const entries =
    db.prepare(`
      SELECT user_id
      FROM giveaway_entries
      WHERE giveaway_id=?
    `).all(
      giveaway.id
    );

  const pool =
    entries.map(
      x => x.user_id
    );

  const winners = [];

  while (
    winners.length <
      Math.min(
        giveaway.winners,
        pool.length
      )
  ) {
    const index =
      Math.floor(
        Math.random() *
          pool.length
      );

    winners.push(
      pool.splice(
        index,
        1
      )[0]
    );
  }

  if (message) {
    await message
      .edit({
        embeds: [
          giveawayEmbed(
            giveaway,
            true
          )
        ],
        components:
          []
      })
      .catch(() => {});
  }

  await channel.send(
    winners.length
      ? `🎉 Giveaway **${giveaway.code}** closed!\n\nWinner${winners.length === 1 ? '' : 's'}: ${winners.map(x => `<@${x}>`).join(', ')}\n\nPlease claim within **24 hours**.`
      : `Giveaway **${giveaway.code}** closed with no eligible winner.`
  ).catch(() => {});
}

/* =========================================================
   MODERATION
   ========================================================= */

async function logModeration(
  guild,
  title,
  description,
  color = COLORS.danger
) {
  const channel =
    await guild.channels
      .fetch(
        CONFIG.moderationLogChannelId
      )
      .catch(() => null);

  if (!channel?.isTextBased())
    return;

  await channel.send({
    embeds: [
      baseEmbed(
        title,
        description,
        color
      )
    ]
  }).catch(() => {});
}

/* =========================================================
   SLASH COMMANDS
   ========================================================= */

const commands = [
  new SlashCommandBuilder()
    .setName('order')
    .setDescription(
      'Open the Nexora order website.'
    ),

  new SlashCommandBuilder()
    .setName('prices')
    .setDescription(
      'View current Nexora pricing.'
    ),

  new SlashCommandBuilder()
    .setName('stats')
    .setDescription(
      'View Nexora statistics.'
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild.toString()
    ),

  new SlashCommandBuilder()
    .setName('order-history')
    .setDescription(
      'View your Nexora order history.'
    )
    .addUserOption(
      option =>
        option
          .setName('user')
          .setDescription(
            'Staff can view another user.'
          )
    ),

  new SlashCommandBuilder()
    .setName('joke')
    .setDescription(
      'Get a random joke.'
    ),

  new SlashCommandBuilder()
    .setName('fact')
    .setDescription(
      'Get a random fact.'
    ),

  new SlashCommandBuilder()
    .setName('dare')
    .setDescription(
      'Get a random dare.'
    ),

  new SlashCommandBuilder()
    .setName('roast')
    .setDescription(
      'Roast a selected user.'
    )
    .addUserOption(
      option =>
        option
          .setName('who')
          .setDescription(
            'Who should be roasted?'
          )
          .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('daily')
    .setDescription(
      'Claim your daily NX reward.'
    ),

  new SlashCommandBuilder()
    .setName('balance')
    .setDescription(
      'View your NX balance.'
    ),

  new SlashCommandBuilder()
    .setName('profile')
    .setDescription(
      'View a Nexora profile.'
    )
    .addUserOption(
      option =>
        option
          .setName('user')
          .setDescription(
            'User to inspect.'
          )
    ),

  new SlashCommandBuilder()
    .setName('nx-leaderboard')
    .setDescription(
      'View the top NX balances.'
    ),

  new SlashCommandBuilder()
    .setName('counting-leaderboard')
    .setDescription(
      'View the counting leaderboard.'
    ),

  new SlashCommandBuilder()
    .setName('idea')
    .setDescription(
      'Submit a community idea.'
    )
    .addStringOption(
      option =>
        option
          .setName('idea')
          .setDescription(
            'Your idea.'
          )
          .setRequired(true)
          .setMaxLength(1800)
    ),

  new SlashCommandBuilder()
    .setName('poll')
    .setDescription(
      'Create a poll.'
    )
    .addStringOption(
      option =>
        option
          .setName('question')
          .setDescription(
            'Question.'
          )
          .setRequired(true)
    )
    .addStringOption(
      option =>
        option
          .setName('options')
          .setDescription(
            'Options separated with |'
          )
          .setRequired(true)
    )
    .addIntegerOption(
      option =>
        option
          .setName('duration')
          .setDescription(
            'Minutes until automatic end.'
          )
          .setMinValue(1)
    ),

  new SlashCommandBuilder()
    .setName('say')
    .setDescription(
      'Send a message as Nexora.'
    )
    .addStringOption(
      option =>
        option
          .setName('message')
          .setDescription(
            'Message.'
          )
          .setRequired(true)
          .setMaxLength(2000)
    ),

  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription(
      'Manage giveaways.'
    )
    .addSubcommand(
      sub =>
        sub
          .setName('create')
          .setDescription(
            'Create a giveaway.'
          )
          .addStringOption(
            option =>
              option
                .setName('prize')
                .setDescription(
                  'Prize.'
                )
                .setRequired(true)
          )
          .addStringOption(
            option =>
              option
                .setName('duration')
                .setDescription(
                  '30m, 2h, 7d.'
                )
                .setRequired(true)
          )
          .addIntegerOption(
            option =>
              option
                .setName('winners')
                .setDescription(
                  'Number of winners.'
                )
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(25)
          )
          .addRoleOption(
            option =>
              option
                .setName(
                  'required-role'
                )
                .setDescription(
                  'Optional eligible role.'
                )
          )
    )
    .addSubcommand(
      sub =>
        sub
          .setName('end')
          .setDescription(
            'End a giveaway.'
          )
          .addStringOption(
            option =>
              option
                .setName('code')
                .setDescription(
                  'Giveaway code.'
                )
                .setRequired(true)
          )
    ),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription(
      'Ban a member.'
    )
    .addUserOption(
      option =>
        option
          .setName('user')
          .setDescription(
            'Member.'
          )
          .setRequired(true)
    )
    .addStringOption(
      option =>
        option
          .setName('reason')
          .setDescription(
            'Reason.'
          )
          .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription(
      'Kick a member.'
    )
    .addUserOption(
      option =>
        option
          .setName('user')
          .setDescription(
            'Member.'
          )
          .setRequired(true)
    )
    .addStringOption(
      option =>
        option
          .setName('reason')
          .setDescription(
            'Reason.'
          )
          .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('purge')
    .setDescription(
      'Delete recent messages.'
    )
    .addIntegerOption(
      option =>
        option
          .setName('amount')
          .setDescription(
            '1-100.'
          )
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(100)
    ),

  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription(
      'View user information.'
    )
    .addUserOption(
      option =>
        option
          .setName('user')
          .setDescription(
            'User.'
          )
          .setRequired(true)
    )
].map(
  command =>
    command.toJSON()
);

/* =========================================================
   REGISTER COMMANDS
   ========================================================= */

async function registerCommands() {
  const rest =
    new REST({
      version: '10'
    }).setToken(
      CONFIG.token
    );

  await rest.put(
    Routes.applicationGuildCommands(
      CONFIG.clientId,
      CONFIG.guildId
    ),
    {
      body:
        commands
    }
  );

  console.log(
    `Registered ${commands.length} Nexora slash commands.`
  );
}

/* =========================================================
   PANELS
   ========================================================= */

async function refreshPanel(
  channelId,
  key
) {
  if (!channelId)
    return;

  const channel =
    await client.channels
      .fetch(channelId)
      .catch(() => null);

  if (!channel?.isTextBased())
    return;

  const panels = {
    order: {
      embed:
        embedWithImage(

          'NEXORA • ORDER CENTER',

          `### START A PROJECT

Choose Nexora, tell us what you need and we take it from there.

**BOT**
Starter from **650 ${CONFIG.currency}**

**WEBSITE**
Launch from **750 ${CONFIG.currency}**

**BRANDING**
Logo from **350 ${CONFIG.currency}**

**NEXORA CARE**
Subscriptions from **350 ${CONFIG.currency} / month**

### WORKFLOW

**WEBSITE**
↓
**DISCORD CLAIM**
↓
**DEVELOPMENT**
↓
**READY**
↓
**PRIVATE ROOM**
↓
**PERFECT**
↓
**PAYMENT**
↓
**ARCHIVE**

-# All orders begin on the Nexora website.
-# Discord login is required.

> **Nexora, Best of the Best.**`,

          COLORS.primary,
          MEDIA.order
        ),

      components: [
        row(
          linkButton(
            'Place an order',
            `${CONFIG.websiteUrl}#order`
          ),

          linkButton(
            'Open website',
            CONFIG.websiteUrl
          )
        )
      ]
    },

    pricing: {
      embed:
        embedWithImage(

          'NEXORA • PRICING',

          `### CURRENT STARTING PRICES

**BOT**
650 / 1,200 / 2,250 ${CONFIG.currency}

**WEBSITE**
750 / 1,500 / 2,750 ${CONFIG.currency}

**BRANDING**
350 / 450 / 700 ${CONFIG.currency}

**CARE**
350 / 650 / 1,000 ${CONFIG.currency} per month

**CUSTOMER**
5% automatic discount

**VIP CUSTOMER**
10% automatic discount

-# Custom projects can be quoted.
-# Subscription renewal is manual until payment automation is added.

> **Nexora, Best of the Best.**`,

          COLORS.cyan,
          MEDIA.pricing
        ),

      components: [
        row(
          linkButton(
            'See full pricing',
            `${CONFIG.websiteUrl}#pricing`
          )
        )
      ]
    },

    services: {
      embed:
        embedWithImage(

          'NEXORA • SERVICES',

          `### WHAT NEXORA BUILDS

**DISCORD BOTS**
Custom commands, automation, moderation, tickets, dashboards and integrations.

**WEBSITES**
Modern responsive websites for communities, gaming projects and businesses.

**BRANDING**
Logos, banners and matched visual packs.

**NEXORA CARE**
Ongoing maintenance and priority support.

Every project gets a structured order flow and private delivery room.

> **Nexora, Best of the Best.**`,

          COLORS.primary,
          MEDIA.services
        ),

      components: [
        row(
          linkButton(
            'Explore services',
            `${CONFIG.websiteUrl}#services`
          )
        )
      ]
    },

    welcome: {
      embed:
        embedWithImage(

          'NEXORA • WELCOME',

          `Welcome to **Nexora**.

A clean place for custom bots, websites, branding and ongoing project support.

### BEST OF THE BEST

We build, deliver, document and archive projects through one connected Discord + website system.

Need something custom?
Start from the order website.

> **Nexora, Best of the Best.**`,

          COLORS.primary,
          MEDIA.welcome
        ),

      components: [
        row(
          linkButton(
            'Visit Nexora',
            CONFIG.websiteUrl
          ),

          linkButton(
            'Order now',
            `${CONFIG.websiteUrl}#order`
          )
        )
      ]
    },

    support: {
      embed:
        embedWithImage(

          'NEXORA • SUPPORT CENTER',

          `For private assistance, use the website for order support or contact authorized Nexora staff.

**ORDER**
Website order flow

**PRIVATE ROOM**
Assigned client + staff

**ARCHIVE**
Transcript + order record

> **Nexora, Best of the Best.**`,

          COLORS.primary,
          MEDIA.support
        ),

      components: [
        row(
          linkButton(
            'Open Nexora website',
            CONFIG.websiteUrl
          )
        )
      ]
    }
  };

  const panel =
    panels[key];

  if (!panel)
    return;

  const recent =
    await channel.messages
      .fetch({
        limit: 50
      })
      .catch(() => null);

  const existing =
    recent?.find(
      message =>
        message.author?.id ===
          client.user.id &&
        message.embeds?.[0]
          ?.title ===
          panel.embed.data
            .title
    );

  if (existing) {
    await existing
      .edit(panel)
      .catch(() => {});
  } else {
    await channel
      .send(panel)
      .catch(() => {});
  }
}

async function syncPanels() {
  await refreshPanel(
    CONFIG.orderCommandChannelId,
    'order'
  );

  await refreshPanel(
    CONFIG.pricingChannelId,
    'pricing'
  );

  await refreshPanel(
    CONFIG.servicesChannelId,
    'services'
  );

  await refreshPanel(
    CONFIG.supportPanelChannelId,
    'support'
  );

  await refreshPanel(
    CONFIG.welcomeChannelId,
    'welcome'
  );
}

/* =========================================================
   COMMAND HANDLER
   ========================================================= */

async function handleCommand(
  interaction
) {
  const command =
    interaction.commandName;

  if (
    command ===
    'order'
  ) {
    return interaction.reply({
      embeds: [
        embedWithImage(

          'NEXORA • ORDER WEBSITE',

          `### START YOUR PROJECT

Your project starts on the official Nexora website.

**Discord login is required.**

The website connects your Discord identity to your order and sends the order directly into the Nexora Discord workflow.

### ORDER FLOW

Website
→ Staff claim
→ Ready
→ Private room
→ Perfect
→ Payment confirmation
→ Transcript
→ Review

> **Nexora, Best of the Best.**`,

          COLORS.primary,
          MEDIA.order
        )
      ],

      components: [
        row(
          linkButton(
            'Place an order',
            `${CONFIG.websiteUrl}#order`
          )
        )
      ],

      ephemeral: true
    });
  }

  if (
    command ===
    'prices'
  ) {
    return interaction.reply({
      embeds: [
        embedWithImage(

          'NEXORA • PRICING',

          `**DISCORD BOT**
650 · 1,200 · 2,250 ${CONFIG.currency}

**WEBSITE**
750 · 1,500 · 2,750 ${CONFIG.currency}

**BRANDING**
350 · 450 · 700 ${CONFIG.currency}

**NEXORA CARE**
350 · 650 · 1,000 ${CONFIG.currency} / month

**CUSTOMER**
5% discount

**VIP**
10% discount

Custom quotes are available from the website.`,

          COLORS.cyan,
          MEDIA.pricing
        )
      ],

      components: [
        row(
          linkButton(
            'Full pricing',
            `${CONFIG.websiteUrl}#pricing`
          )
        )
      ],

      ephemeral: true
    });
  }

  if (
    command ===
    'stats'
  ) {
    const orders =
      db.prepare(`
        SELECT COUNT(*) c
        FROM orders
      `).get().c;

    const completed =
      db.prepare(`
        SELECT COUNT(*) c
        FROM orders
        WHERE status='COMPLETED'
      `).get().c;

    const cancelled =
      db.prepare(`
        SELECT COUNT(*) c
        FROM orders
        WHERE status='CANCELLED'
      `).get().c;

    return interaction.reply({
      embeds: [
        baseEmbed(

          'NEXORA • STATISTICS',

          `**Members**
${interaction.guild.memberCount}

**Orders**
${orders}

**Completed**
${completed}

**Cancelled**
${cancelled}

**Database**
SQLite / persistent

> **Nexora, Best of the Best.**`,

          COLORS.primary
        )
      ],
      ephemeral: true
    });
  }

  if (
    command ===
    'order-history'
  ) {
    const selected =
      interaction.options
        .getUser(
          'user'
        );

    const targetId =
      selected &&
      (
        isManagement(
          interaction.member
        ) ||
        isSupport(
          interaction.member
        )
      )
        ? selected.id
        : interaction.user.id;

    const rows =
      db.prepare(`
        SELECT
          order_code,
          plan_label,
          price,
          status,
          created_at
        FROM orders
        WHERE customer_id=?
        ORDER BY id DESC
        LIMIT 15
      `).all(
        targetId
      );

    return interaction.reply({
      embeds: [
        baseEmbed(

          'NEXORA • ORDER HISTORY',

          rows.length
            ? rows
                .map(
                  order =>
                    `**${order.order_code}** · ${esc(order.plan_label)} · ${order.price ? `${order.price.toLocaleString()} ${CONFIG.currency}` : 'Custom quote'} · **${order.status}** · <t:${unix(order.created_at)}:d>`
                )
                .join('\n')
            : 'No orders found.',

          COLORS.primary
        )
      ],
      ephemeral: true
    });
  }

  if (
    command ===
    'joke'
  ) {
    return interaction.reply({
      embeds: [
        baseEmbed(
          'NEXORA • JOKE',
          JOKES[
            Math.floor(
              Math.random() *
                JOKES.length
            )
          ],
          COLORS.primary
        )
      ]
    });
  }

  if (
    command ===
    'fact'
  ) {
    return interaction.reply({
      embeds: [
        baseEmbed(
          'NEXORA • FACT',
          FACTS[
            Math.floor(
              Math.random() *
                FACTS.length
            )
          ],
          COLORS.cyan
        )
      ]
    });
  }

  if (
    command ===
    'dare'
  ) {
    return interaction.reply({
      embeds: [
        baseEmbed(
          'NEXORA • DARE',
          DARES[
            Math.floor(
              Math.random() *
                DARES.length
            )
          ],
          COLORS.warning
        )
      ]
    });
  }

  if (
    command ===
    'roast'
  ) {
    const user =
      interaction.options.getUser(
        'who'
      );

    return interaction.reply({
      embeds: [
        baseEmbed(

          `NEXORA • ROAST • ${user.username}`,

          `<@${user.id}>, ${
            ROASTS[
              Math.floor(
                Math.random() *
                  ROASTS.length
              )
            ]
          }`,

          COLORS.danger
        )
      ]
    });
  }

  if (
    command ===
    'daily'
  ) {
    const wallet =
      ensureWallet(
        interaction.user.id
      );

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    if (
      wallet.last_daily ===
      today
    ) {
      return replyEmbed(
        interaction,
        'DAILY ALREADY CLAIMED',
        `You already claimed your daily reward today.\n\nCome back tomorrow.`,
        COLORS.warning
      );
    }

    const previous =
      wallet.last_daily
        ? new Date(
            wallet.last_daily
          )
        : null;

    let streak =
      wallet.daily_streak ||
      0;

    if (
      previous
    ) {
      const yesterday =
        new Date();

      yesterday.setUTCDate(
        yesterday.getUTCDate() -
          1
      );

      const yesterdayText =
        yesterday
          .toISOString()
          .slice(0, 10);

      if (
        wallet.last_daily ===
        yesterdayText
      ) {
        streak++;
      } else {
        streak = 1;
      }
    } else {
      streak = 1;
    }

    const reward =
      100 +
      Math.min(
        streak *
          10,
        200
      );

    db.prepare(`
      UPDATE wallets
      SET
        nx=nx+?,
        last_daily=?,
        daily_streak=?
      WHERE user_id=?
    `).run(
      reward,
      today,
      streak,
      interaction.user.id
    );

    const balance =
      ensureWallet(
        interaction.user.id
      ).nx;

    return interaction.reply({
      embeds: [
        baseEmbed(

          'NEXORA • DAILY',

          `You received **${reward} NX**.

**Streak**
${streak}

**Balance**
${balance} NX

> **Nexora, Best of the Best.**`,

          COLORS.success
        )
      ],
      ephemeral: true
    });
  }

  if (
    command ===
    'balance'
  ) {
    const wallet =
      ensureWallet(
        interaction.user.id
      );

    return interaction.reply({
      embeds: [
        baseEmbed(

          'NEXORA • BALANCE',

          `**NX BALANCE**
${wallet.nx} NX

> **Nexora, Best of the Best.**`,

          COLORS.cyan
        )
      ],
      ephemeral: true
    });
  }

  if (
    command ===
    'profile'
  ) {
    const user =
      interaction.options.getUser(
        'user'
      ) ||
      interaction.user;

    const wallet =
      ensureWallet(
        user.id
      );

    const best =
      db.prepare(`
        SELECT MAX(personal_best) best
        FROM counting_members
        WHERE user_id=?
      `).get(
        user.id
      ).best || 0;

    return interaction.reply({
      embeds: [
        baseEmbed(

          `NEXORA • PROFILE • ${user.username}`,

          `**USER**
<@${user.id}>

**NX**
${wallet.nx}

**COUNTING BEST**
${best}

> **Nexora, Best of the Best.**`,

          COLORS.primary
        )
      ]
    });
  }

  if (
    command ===
    'nx-leaderboard'
  ) {
    const rows =
      db.prepare(`
        SELECT
          user_id,
          nx
        FROM wallets
        ORDER BY nx DESC
        LIMIT 10
      `).all();

    return interaction.reply({
      embeds: [
        baseEmbed(

          'NEXORA • NX LEADERBOARD',

          rows.length
            ? rows
                .map(
                  (row, index) =>
                    `**${index + 1}.** <@${row.user_id}> — **${row.nx} NX**`
                )
                .join('\n')
            : 'No balances recorded yet.',

          COLORS.cyan
        )
      ]
    });
  }

  if (
    command ===
    'counting-leaderboard'
  ) {
    const rows =
      db.prepare(`
        SELECT
          user_id,
          personal_best,
          mistakes
        FROM counting_members
        WHERE guild_id=?
        ORDER BY personal_best DESC
        LIMIT 10
      `).all(
        interaction.guild.id
      );

    return interaction.reply({
      embeds: [
        baseEmbed(

          'NEXORA • COUNTING LEADERBOARD',

          rows.length
            ? rows
                .map(
                  (row, index) =>
                    `**${index + 1}.** <@${row.user_id}> — best **${row.personal_best}** · mistakes **${row.mistakes}**`
                )
                .join('\n')
            : 'No counting data yet.',

          COLORS.primary
        )
      ]
    });
  }

  if (
    command ===
    'idea'
  ) {
    const content =
      interaction.options.getString(
        'idea'
      );

    const code =
      nextCode(
        'idea',
        'IDEA'
      );

    const result =
      db.prepare(`
        INSERT INTO ideas(
          code,
          user_id,
          content,
          created_at
        )
        VALUES(?,?,?,?)
      `).run(
        code,
        interaction.user.id,
        content,
        now()
      );

    const channel =
      await interaction.guild.channels
        .fetch(
          CONFIG.ideasChannelId
        )
        .catch(
          () => null
        );

    if (
      channel?.isTextBased()
    ) {
      const message =
        await channel.send({
          embeds: [
            embedWithImage(

              `NEXORA • ${code}`,

              `**IDEA**
${esc(content)}

**FROM**
<@${interaction.user.id}>

**STATUS**
OPEN

> **Nexora, Best of the Best.**`,

              COLORS.primary,
              MEDIA.services
            )
          ]
        });

      db.prepare(`
        UPDATE ideas
        SET content=?
        WHERE id=?
      `).run(
        content,
        result.lastInsertRowid
      );

      await message.react('👍')
        .catch(() => {});

      await message.react('👎')
        .catch(() => {});
    }

    return interaction.reply({
      content:
        `Idea **${code}** submitted.`,
      ephemeral: true
    });
  }

  if (
    command ===
    'poll'
  ) {
    if (
      !isSupport(
        interaction.member
      )
    ) {
      return replyEmbed(
        interaction,
        'STAFF ONLY',
        'Only authorized Nexora staff can create polls.',
        COLORS.danger
      );
    }

    const question =
      interaction.options.getString(
        'question'
      );

    const rawOptions =
      interaction.options.getString(
        'options'
      );

    const duration =
      interaction.options.getInteger(
        'duration'
      );

    const options =
      rawOptions
        .split('|')
        .map(
          x => x.trim()
        )
        .filter(Boolean)
        .slice(0, 5);

    if (
      options.length <
      2
    ) {
      return replyEmbed(
        interaction,
        'POLL ERROR',
        'You need at least two options separated by `|`.',
        COLORS.danger
      );
    }

    const result =
      db.prepare(`
        INSERT INTO polls(
          channel_id,
          question,
          options,
          creator_id,
          ends_at,
          created_at
        )
        VALUES(?,?,?,?,?,?)
      `).run(
        interaction.channel.id,
        question,
        JSON.stringify(
          options
        ),
        interaction.user.id,
        duration
          ? new Date(
              Date.now() +
                duration *
                  60000
            ).toISOString()
          : null,
        now()
      );

    const poll =
      db.prepare(`
        SELECT *
        FROM polls
        WHERE id=?
      `).get(
        result.lastInsertRowid
      );

    const message =
      await interaction.channel.send(
        renderPoll(poll)
      );

    db.prepare(`
      UPDATE polls
      SET message_id=?
      WHERE id=?
    `).run(
      message.id,
      poll.id
    );

    return interaction.reply({
      content:
        `Poll **#${poll.id}** created.`,
      ephemeral: true
    });
  }

  if (
    command ===
    'say'
  ) {
    if (
      !authorized(
        interaction.member,
        [
          CONFIG.sayRoleId
        ]
      )
    ) {
      return replyEmbed(
        interaction,
        'ACCESS DENIED',
        'You are not authorized to use this command.',
        COLORS.danger
      );
    }

    const content =
      interaction.options.getString(
        'message'
      );

    await interaction.channel.send({
      embeds: [
        embedWithImage(
          'NEXORA',
          content,
          COLORS.primary,
          MEDIA.bottomBanner
        )
      ]
    });

    return interaction.reply({
      content:
        'Message sent.',
      ephemeral: true
    });
  }

  if (
    command ===
    'giveaway'
  ) {
    if (
      !isSupport(
        interaction.member
      )
    ) {
      return replyEmbed(
        interaction,
        'STAFF ONLY',
        'Only authorized Nexora staff can manage giveaways.',
        COLORS.danger
      );
    }

    const sub =
      interaction.options.getSubcommand();

    if (
      sub ===
      'create'
    ) {
      const prize =
        interaction.options.getString(
          'prize'
        );

      const duration =
        interaction.options.getString(
          'duration'
        );

      const winners =
        interaction.options.getInteger(
          'winners'
        );

      const requiredRole =
        interaction.options.getRole(
          'required-role'
        );

      const durationMs =
        parseDuration(
          duration
        );

      if (!durationMs) {
        return replyEmbed(
          interaction,
          'GIVEAWAY ERROR',
          'Use a duration such as `30m`, `2h`, `7d`.',
          COLORS.danger
        );
      }

      const code =
        nextCode(
          'giveaway',
          'GW'
        );

      const endsAt =
        new Date(
          Date.now() +
            durationMs
        ).toISOString();

      const result =
        db.prepare(`
          INSERT INTO giveaways(
            code,
            channel_id,
            prize,
            winners,
            ends_at,
            required_role_id,
            created_at
          )
          VALUES(?,?,?,?,?,?,?)
        `).run(
          code,
          interaction.channel.id,
          prize,
          winners,
          endsAt,
          requiredRole?.id ||
            null,
          now()
        );

      const giveaway =
        db.prepare(`
          SELECT *
          FROM giveaways
          WHERE id=?
        `).get(
          result.lastInsertRowid
        );

      const message =
        await interaction.channel.send({
          embeds: [
            giveawayEmbed(
              giveaway
            )
          ],
          components:
            giveawayComponents(
              giveaway
            )
        });

      db.prepare(`
        UPDATE giveaways
        SET message_id=?
        WHERE id=?
      `).run(
        message.id,
        giveaway.id
      );

      return interaction.reply({
        content:
          `Giveaway **${code}** created.`,
        ephemeral: true
      });
    }

    if (
      sub ===
      'end'
    ) {
      const code =
        interaction.options.getString(
          'code'
        );

      const giveaway =
        db.prepare(`
          SELECT *
          FROM giveaways
          WHERE code=?
        `).get(
          code
        );

      if (!giveaway) {
        return replyEmbed(
          interaction,
          'NOT FOUND',
          'Giveaway not found.',
          COLORS.danger
        );
      }

      await endGiveaway(
        giveaway
      );

      return interaction.reply({
        content:
          `Giveaway **${code}** ended.`,
        ephemeral: true
      });
    }
  }

  if (
    command ===
    'ban'
  ) {
    if (
      !authorized(
        interaction.member,
        CONFIG.banRoleIds
      )
    ) {
      return replyEmbed(
        interaction,
        'ACCESS DENIED',
        'You are not authorized to use `/ban`.',
        COLORS.danger
      );
    }

    const user =
      interaction.options.getUser(
        'user'
      );

    const reason =
      interaction.options.getString(
        'reason'
      );

    try {
      await interaction.guild.members.ban(
        user.id,
        {
          reason
        }
      );

      await logModeration(
        interaction.guild,
        'NEXORA • BAN',
        `**USER**\n<@${user.id}>\n\n**STAFF**\n<@${interaction.user.id}>\n\n**REASON**\n${esc(reason)}`
      );

      return interaction.reply({
        content:
          `Banned **${user.tag}**.`,
        ephemeral: true
      });
    } catch {
      return replyEmbed(
        interaction,
        'BAN FAILED',
        'Discord rejected the ban.',
        COLORS.danger
      );
    }
  }

  if (
    command ===
    'kick'
  ) {
    if (
      !authorized(
        interaction.member,
        CONFIG.kickRoleIds
      )
    ) {
      return replyEmbed(
        interaction,
        'ACCESS DENIED',
        'You are not authorized to use `/kick`.',
        COLORS.danger
      );
    }

    const user =
      interaction.options.getUser(
        'user'
      );

    const reason =
      interaction.options.getString(
        'reason'
      );

    const member =
      await interaction.guild.members
        .fetch(
          user.id
        )
        .catch(
          () => null
        );

    if (!member) {
      return replyEmbed(
        interaction,
        'KICK FAILED',
        'That member could not be found.',
        COLORS.danger
      );
    }

    try {
      await member.kick(
        reason
      );

      await logModeration(
        interaction.guild,
        'NEXORA • KICK',
        `**USER**\n<@${user.id}>\n\n**STAFF**\n<@${interaction.user.id}>\n\n**REASON**\n${esc(reason)}`
      );

      return interaction.reply({
        content:
          `Kicked **${user.tag}**.`,
        ephemeral: true
      });
    } catch {
      return replyEmbed(
        interaction,
        'KICK FAILED',
        'Discord rejected the kick.',
        COLORS.danger
      );
    }
  }

  if (
    command ===
    'purge'
  ) {
    if (
      !authorized(
        interaction.member,
        CONFIG.purgeRoleIds
      )
    ) {
      return replyEmbed(
        interaction,
        'ACCESS DENIED',
        'You are not authorized to use `/purge`.',
        COLORS.danger
      );
    }

    const amount =
      interaction.options.getInteger(
        'amount'
      );

    if (
      !interaction.channel
        ?.isTextBased()
    ) {
      return replyEmbed(
        interaction,
        'PURGE FAILED',
        'This channel cannot be purged.',
        COLORS.danger
      );
    }

    try {
      const deleted =
        await interaction.channel
          .bulkDelete(
            amount,
            true
          );

      return interaction.reply({
        content:
          `Deleted **${deleted.size}** message(s).`,
        ephemeral: true
      });
    } catch {
      return replyEmbed(
        interaction,
        'PURGE FAILED',
        'Discord rejected the purge.',
        COLORS.danger
      );
    }
  }

  if (
    command ===
    'userinfo'
  ) {
    const user =
      interaction.options.getUser(
        'user'
      );

    const member =
      await interaction.guild.members
        .fetch(
          user.id
        )
        .catch(
          () => null
        );

    return interaction.reply({
      embeds: [
        baseEmbed(

          `NEXORA • USERINFO • ${user.username}`,

          `**ID**
${user.id}

**BOT**
${user.bot ? 'Yes' : 'No'}

**ACCOUNT**
<t:${unix(
  user.createdAt
)}:F>

**JOINED**
${
  member?.joinedAt
    ? `<t:${unix(member.joinedAt)}:F>`
    : 'Unknown'
}

> **Nexora, Best of the Best.**`,

          COLORS.primary
        )
      ]
    });
  }
}

/* =========================================================
   INTERACTIONS
   ========================================================= */

client.on(
  'interactionCreate',
  async interaction => {
    try {
      if (
        interaction.isChatInputCommand()
      ) {
        await handleCommand(
          interaction
        );

        return;
      }

      if (
        interaction.isButton()
      ) {
        const parts =
          interaction.customId.split(
            ':'
          );

        /* ORDER */

        if (
          parts[0] ===
          'order'
        ) {
          const action =
            parts[1];

          const id =
            Number(parts[2]);

          const order =
            getOrder(id);

          if (!order) {
            return replyEmbed(
              interaction,
              'ORDER NOT FOUND',
              'This order no longer exists.',
              COLORS.danger
            );
          }

          if (
            action ===
            'claim'
          ) {
            return handleClaim(
              interaction,
              order
            );
          }

          if (
            action ===
            'ready'
          ) {
            return handleReady(
              interaction,
              order
            );
          }

          if (
            action ===
              'cancel' ||
            action ===
              'cancel-ticket'
          ) {
            if (
              !isOrderStaff(
                interaction.member,
                order
              )
            ) {
              return replyEmbed(
                interaction,
                'ACCESS DENIED',
                'Only authorized Nexora staff can cancel this order.',
                COLORS.danger
              );
            }

            if (
              [
                'COMPLETED',
                'CANCELLED'
              ].includes(
                order.status
              )
            ) {
              return replyEmbed(
                interaction,
                'ORDER CLOSED',
                'This order is already closed.',
                COLORS.warning
              );
            }

            return interaction.showModal(
              cancelModal(order)
            );
          }

          if (
            action ===
            'perfect'
          ) {
            return handlePerfect(
              interaction,
              order
            );
          }

          if (
            action ===
            'payment'
          ) {
            if (
              order.claimed_staff_id !==
                interaction.user.id &&
              !isManagement(
                interaction.member
              )
            ) {
              return replyEmbed(
                interaction,
                'STAFF ONLY',
                'Only the assigned staff member or management can confirm payment.',
                COLORS.danger
              );
            }

            if (
              order.status !==
              'PERFECT'
            ) {
              return replyEmbed(
                interaction,
                'PAYMENT LOCKED',
                'The client must press Perfect before payment can be confirmed.',
                COLORS.warning
              );
            }

            return interaction.showModal(
              paymentModal(
                order
              )
            );
          }
        }

        /* REVIEWS */

        if (
          parts[0] ===
          'review'
        ) {
          return openReviewModal(
            interaction,
            Number(
              parts[2]
            ),
            Number(
              parts[1]
            )
          );
        }

        /* POLLS */

        if (
          parts[0] ===
          'poll'
        ) {
          const poll =
            db.prepare(`
              SELECT *
              FROM polls
              WHERE id=?
            `).get(
              Number(
                parts[1]
              )
            );

          if (
            !poll ||
            poll.ended
          ) {
            return interaction.reply({
              content:
                'This poll is closed.',
              ephemeral: true
            });
          }

          const option =
            Number(
              parts[2]
            );

          if (
            !Number.isInteger(
              option
            ) ||
            option <
              0 ||
            option >
              4
          ) {
            return interaction.reply({
              content:
                'Invalid poll choice.',
              ephemeral: true
            });
          }

          db.prepare(`
            INSERT INTO poll_votes(
              poll_id,
              user_id,
              option_index
            )
            VALUES(?,?,?)
            ON CONFLICT(
              poll_id,
              user_id
            )
            DO UPDATE SET
              option_index=excluded.option_index
          `).run(
            poll.id,
            interaction.user.id,
            option
          );

          const fresh =
            db.prepare(`
              SELECT *
              FROM polls
              WHERE id=?
            `).get(
              poll.id
            );

          return interaction.update(
            renderPoll(
              fresh
            )
          );
        }

        /* GIVEAWAYS */

        if (
          parts[0] ===
          'giveaway'
        ) {
          const giveaway =
            db.prepare(`
              SELECT *
              FROM giveaways
              WHERE id=?
            `).get(
              Number(
                parts[2]
              )
            );

          if (
            !giveaway ||
            giveaway.ended
          ) {
            return interaction.reply({
              content:
                'This giveaway is closed.',
              ephemeral: true
            });
          }

          if (
            new Date(
              giveaway.ends_at
            ).getTime() <=
            Date.now()
          ) {
            await endGiveaway(
              giveaway
            );

            return interaction.reply({
              content:
                'This giveaway just ended.',
              ephemeral: true
            });
          }

          if (
            giveaway.required_role_id &&
            !interaction.member
              ?.roles
              ?.cache
              ?.has(
                giveaway.required_role_id
              )
          ) {
            return interaction.reply({
              content:
                'You do not have the required role for this giveaway.',
              ephemeral: true
            });
          }

          const exists =
            db.prepare(`
              SELECT 1
              FROM giveaway_entries
              WHERE giveaway_id=?
              AND user_id=?
            `).get(
              giveaway.id,
              interaction.user.id
            );

          if (exists) {
            db.prepare(`
              DELETE FROM giveaway_entries
              WHERE giveaway_id=?
              AND user_id=?
            `).run(
              giveaway.id,
              interaction.user.id
            );

            return interaction.reply({
              content:
                `You left **${giveaway.code}**.`,
              ephemeral: true
            });
          }

          db.prepare(`
            INSERT INTO giveaway_entries(
              giveaway_id,
              user_id
            )
            VALUES(?,?)
          `).run(
            giveaway.id,
            interaction.user.id
          );

          return interaction.reply({
            content:
              `You entered **${giveaway.code}**.`,
            ephemeral: true
          });
        }
      }

      /* MODALS */

      if (
        interaction.isModalSubmit()
      ) {
        const parts =
          interaction.customId.split(
            ':'
          );

        if (
          parts[0] ===
          'order' &&
          parts[1] ===
          'cancel-modal'
        ) {
          const order =
            getOrder(
              Number(parts[2])
            );

          if (
            !order ||
            !isOrderStaff(
              interaction.member,
              order
            )
          ) {
            return replyEmbed(
              interaction,
              'ACCESS DENIED',
              'You are not authorized to cancel this order.',
              COLORS.danger
            );
          }

          const reason =
            interaction.fields
              .getTextInputValue(
                'reason'
              )
              .trim();

          await cancelOrder(
            interaction.guild,
            order,
            interaction.user.id,
            reason
          );

          return replyEmbed(
            interaction,
            'ORDER CANCELLED',
            `${order.order_code} was cancelled. The client and claimed staff were notified.`,
            COLORS.danger
          );
        }

        if (
          parts[0] ===
          'order' &&
          parts[1] ===
          'payment-modal'
        ) {
          const order =
            getOrder(
              Number(parts[2])
            );

          if (
            !order ||
            (
              order.claimed_staff_id !==
                interaction.user.id &&
              !isManagement(
                interaction.member
              )
            )
          ) {
            return replyEmbed(
              interaction,
              'STAFF ONLY',
              'Only the assigned staff member or management can confirm payment.',
              COLORS.danger
            );
          }

          if (
            order.status !==
            'PERFECT'
          ) {
            return replyEmbed(
              interaction,
              'PAYMENT LOCKED',
              'Payment can only be confirmed after the client presses Perfect.',
              COLORS.warning
            );
          }

          const reference =
            interaction.fields
              .getTextInputValue(
                'reference'
              )
              .trim();

          await finalizeOrder(
            interaction.guild,
            order,
            interaction.user.id,
            reference
          );

          return replyEmbed(
            interaction,
            'ORDER COMPLETED',
            `${order.order_code} is now closed, archived and sent to the client for review.`,
            COLORS.success
          );
        }

        if (
          parts[0] ===
          'review-modal'
        ) {
          return saveReview(
            interaction,
            Number(
              parts[2]
            ),
            Number(
              parts[1]
            ),
            interaction.fields
              .getTextInputValue(
                'reason'
              )
              .trim()
          );
        }
      }
    } catch (error) {
      console.error(
        '[INTERACTION]',
        error
      );

      const payload = {
        embeds: [
          baseEmbed(
            'NEXORA • ACTION FAILED',
            'Something went wrong while processing that action. Check the bot log for details.',
            COLORS.danger
          )
        ]
      };

      if (
        interaction.replied ||
        interaction.deferred
      ) {
        await interaction
          .followUp({
            ...payload,
            ephemeral: true
          })
          .catch(
            () => {}
          );
      } else {
        await interaction
          .reply({
            ...payload,
            ephemeral: true
          })
          .catch(
            () => {}
          );
      }
    }
  }
);

/* =========================================================
   MESSAGE EVENTS
   ========================================================= */

client.on(
  'messageCreate',
  async message => {
    if (
      message.author.bot
    ) {
      return;
    }

    try {
      if (
        await handleCounting(
          message
        )
      ) {
        return;
      }
    } catch (error) {
      console.error(
        '[COUNTING]',
        error
      );
    }
  }
);

/* =========================================================
   WELCOME
   ========================================================= */

client.on(
  'guildMemberAdd',
  async member => {
    try {
      if (
        CONFIG.newMemberRoleId
      ) {
        await member.roles
          .add(
            CONFIG.newMemberRoleId,
            'Nexora new member role'
          )
          .catch(
            () => {}
          );
      }

      const channel =
        await member.guild.channels
          .fetch(
            CONFIG.welcomeChannelId
          )
          .catch(
            () => null
          );

      if (
        channel?.isTextBased()
      ) {
        await channel.send({
          content:
            `<@${member.id}>`,

          embeds: [
            embedWithImage(

              'NEXORA • NEW MEMBER',

              `Welcome <@${member.id}>.

Explore Nexora, Best of the Best.

Use the order website whenever you are ready to start a project.`,

              COLORS.primary,
              MEDIA.welcome
            )
          ],

          allowedMentions: {
            users: [
              member.id
            ]
          }
        }).catch(
          () => {}
        );
      }
    } catch (error) {
      console.error(
        '[WELCOME]',
        error
      );
    }
  }
);

/* =========================================================
   SWEEP
   ========================================================= */

async function sweep() {
  const expiredGiveaways =
    db.prepare(`
      SELECT *
      FROM giveaways
      WHERE ended=0
      AND ends_at<=?
    `).all(
      now()
    );

  for (
    const giveaway of expiredGiveaways
  ) {
    await endGiveaway(
      giveaway
    ).catch(
      () => {}
    );
  }

  const expiredPolls =
    db.prepare(`
      SELECT *
      FROM polls
      WHERE ended=0
      AND ends_at IS NOT NULL
      AND ends_at<=?
    `).all(
      now()
    );

  for (
    const poll of expiredPolls
  ) {
    await endPoll(
      poll
    ).catch(
      () => {}
    );
  }

  db.prepare(`
    DELETE FROM oauth_states
    WHERE expires_at<?
  `).run(
    Date.now()
  );

  db.prepare(`
    DELETE FROM login_tickets
    WHERE expires_at<?
  `).run(
    Date.now()
  );

  db.prepare(`
    DELETE FROM sessions
    WHERE expires_at<?
  `).run(
    Date.now()
  );
}

/* =========================================================
   STARTUP
   ========================================================= */

client.once(
  'ready',
  async () => {
    console.log(
      `Nexora V2 online as ${client.user.tag}`
    );

    try {
      await registerCommands();

      const guild =
        await client.guilds.fetch(
          CONFIG.guildId
        );

      await syncPanels();

      console.log(
        `Connected to guild: ${guild.name}`
      );

      if (
        !CONFIG.websiteUrl ||
        CONFIG.websiteUrl.includes(
          'YOUR-'
        )
      ) {
        console.warn(
          'WEBSITE_URL is still a placeholder.'
        );
      }

      if (
        !CONFIG.apiUrl ||
        CONFIG.apiUrl.includes(
          'YOUR-'
        )
      ) {
        console.warn(
          'BOT_API_URL is still a placeholder.'
        );
      }
    } catch (error) {
      console.error(
        '[STARTUP]',
        error
      );
    }

    setInterval(
      () =>
        sweep().catch(
          error =>
            console.error(
              '[SWEEP]',
              error
            )
        ),
      15000
    );
  }
);

process.on(
  'unhandledRejection',
  error =>
    console.error(
      '[unhandledRejection]',
      error
    )
);

process.on(
  'uncaughtException',
  error =>
    console.error(
      '[uncaughtException]',
      error
    )
);

client.login(
  CONFIG.token
);
