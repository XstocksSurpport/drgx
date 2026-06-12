export const POOL_ZADDR = 'zs1prc4q97x05kp642tz0ntlxgz7m6u6ulezdcy6nqjjw4zxvaqtf7svlqjvk86n0hlv5av22ksnz8';

export const EXPLORER_API = '/api';

export const BLOCK_REWARD = 3;
export const BLOCK_TIME = 36;
export const HALVING_BLOCKS = 3500000;

export const WALLETS = [
  {
    id: 'obsidian',
    name: 'ObsidianDragon',
    desc: 'Full-node GUI wallet with built-in pool miner. Send, receive, and mine — all in one app.',
    releases: 'https://git.dragonx.is/DragonX/ObsidianDragon/releases',
    source: 'https://git.dragonx.is/DragonX/ObsidianDragon',
    downloads: [
      { label: 'Windows EXE', platform: 'Windows' },
      { label: 'Windows ZIP', platform: 'Windows' },
      { label: 'Linux ZIP', platform: 'Linux' },
      { label: 'Linux AppImage', platform: 'Linux' },
      { label: 'macOS DMG', platform: 'macOS' },
      { label: 'macOS ZIP', platform: 'macOS' },
    ],
  },
  {
    id: 'cli',
    name: 'DragonX CLI',
    desc: 'Command-line daemon and wallet tools for advanced users and server deployments.',
    releases: 'https://git.dragonx.is/DragonX/dragonx/releases',
    source: 'https://git.dragonx.is/DragonX/dragonx',
    downloads: [
      { label: 'Linux ZIP', platform: 'Linux' },
      { label: 'Windows ZIP', platform: 'Windows' },
      { label: 'macOS ZIP', platform: 'macOS' },
    ],
  },
  {
    id: 'lite',
    name: 'SilentDragonX Lite',
    desc: 'Lightweight desktop wallet — no full node required. Connect to a light server and transact instantly.',
    releases: 'https://git.dragonx.is/DragonX/SilentDragonXLite/releases',
    source: 'https://git.dragonx.is/DragonX/SilentDragonXLite',
    downloads: [
      { label: 'Windows EXE', platform: 'Windows' },
      { label: 'Linux', platform: 'Linux' },
    ],
  },
  {
    id: 'android',
    name: 'SilentDragonX Android',
    desc: 'Mobile wallet for Android — send and receive DRGX on the go with full privacy.',
    releases: 'https://git.dragonx.is/DragonX/SilentDragonXAndroid/releases',
    source: 'https://git.dragonx.is/DragonX/SilentDragonXAndroid',
    downloads: [{ label: 'Android APK', platform: 'Android' }],
  },
  {
    id: 'miner',
    name: 'Pool Miner',
    desc: 'Standalone CPU miner — no wallet needed. Pre-configured to connect to the DragonX pool.',
    releases: 'https://git.dragonx.is/DragonX/drg-xmrig/releases',
    source: 'https://git.dragonx.is/DragonX/drg-xmrig',
    downloads: [
      { label: 'Linux ZIP', platform: 'Linux' },
      { label: 'Windows ZIP', platform: 'Windows' },
    ],
  },
  {
    id: 'dashboard',
    name: 'Pool Dashboard',
    desc: 'Monitor your hashrate, check payouts, and view pool stats in real time.',
    dashboard: 'https://pool.dragonx.is',
  },
];

export const ROADMAP = [
  { label: 'Fair Launch', value: '0% Pre-mine & Dev Tax' },
  { label: 'RandomX', value: 'CPU Mining · 36s Block Time' },
  { label: 'Privacy', value: 'zk-SNARKs · Sietch · Encrypted Memos' },
  { label: 'ObsidianDragon', value: 'Full-node GUI + Pool Miner' },
  { label: 'DragonX CLI', value: 'Daemon & Wallet Tools' },
  { label: 'SilentDragonX Lite', value: 'Light Desktop Wallet' },
  { label: 'SilentDragonX Android', value: 'Mobile Wallet' },
  { label: 'Pool Miner', value: 'Standalone CPU Miner' },
  { label: 'Pool Dashboard', value: 'Hashrate · Payouts · Stats' },
  { label: 'NonKYC.io', value: 'DRGX / USDT' },
];

export const COMMUNITY = [
  { name: 'Telegram', href: 'https://dragonx.is/tg', icon: 'img/social_icons/icon_telegram.svg' },
  { name: 'Telegram CN', href: 'https://t.co/gceYAaC6lE', icon: 'img/social_icons/icon_telegram.svg' },
  { name: 'Matrix', href: 'https://dragonx.is/matrix', icon: 'img/social_icons/icon_matrix.svg' },
  { name: 'Twitter/X', href: 'https://twitter.com/DragonXchain', icon: 'img/social_icons/icon_twitter.svg' },
  { name: 'Git', href: 'https://git.dragonx.is/DragonX', icon: 'img/social_icons/icon_git.svg' },
  { name: 'CoinGecko', href: 'https://www.coingecko.com/en/coins/dragonx-2', icon: 'img/logos/logo_coingecko.svg' },
];

export const SPECS = [
  { label: 'Max Supply', value: '21,000,000' },
  { label: 'Block Reward', value: '3 DRGX' },
  { label: 'Algorithm', value: 'RandomX' },
  { label: 'Block Time', value: '36s' },
  { label: 'Halving', value: '3.5M blocks' },
  { label: 'Pre-mine & Dev Tax', value: '0%' },
  { label: 'P2P Port', value: '21768' },
  { label: 'RPC Port', value: '21769' },
];
