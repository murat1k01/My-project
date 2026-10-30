import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

// RepairVision: Expo Go үшін. Бүкіл қосымша (HTML/CSS/JS) төмендегі HTML ішінде.
const HTML = String.raw`<!DOCTYPE html>
<html lang="kk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>RepairVision</title>
<style>
:root{--bg:#f2f2f7;--ph:#f2f2f7;--card:#ffffff;--card2:#ffffff;--bd:rgba(60,60,67,.14);--sep:rgba(60,60,67,.14);--fill:rgba(120,120,128,.14);--tx:#000;--mu:#6c6c70;--ac:#1f8f3f;--ac2:#34c759;--ok:#34c759;--sh:0 1px 2px rgba(0,0,0,.04);box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#000;--ph:#000;--card:#1c1c1e;--card2:#636366;--bd:rgba(84,84,88,.5);--sep:rgba(84,84,88,.5);--fill:rgba(120,120,128,.32);--tx:#fff;--mu:#98989f;--ac:#248a3d;--ac2:#30d158;--sh:none}}
:root[data-theme="dark"]{--bg:#000;--ph:#000;--card:#1c1c1e;--card2:#636366;--bd:rgba(84,84,88,.5);--sep:rgba(84,84,88,.5);--fill:rgba(120,120,128,.32);--tx:#fff;--mu:#98989f;--ac:#248a3d;--ac2:#30d158;--sh:none}
*{box-sizing:border-box}html,body{height:100%;margin:0}
body{background:var(--bg);color:var(--tx);font-family:"Manrope","Segoe UI",system-ui,sans-serif;display:flex;justify-content:center;align-items:center}
.phone{width:100%;max-width:430px;height:100%;max-height:880px;background:var(--ph);display:flex;flex-direction:column;position:relative;overflow:hidden;background-image:radial-gradient(circle at 88% 0,rgba(34,197,94,.3),transparent 45%),radial-gradient(circle at 0 62%,rgba(79,124,255,.16),transparent 40%)}
@media(min-width:500px){.phone{height:92%;border-radius:36px;box-shadow:0 30px 70px rgba(20,34,63,.35)}}
header{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:16px 20px 8px}
h1{font-size:22px;margin:0;letter-spacing:-.02em}h1 small{display:block;font-size:11.5px;font-weight:500;color:var(--mu);letter-spacing:0;margin-top:2px;line-height:1.35}
.acts{display:flex;gap:8px}
main{flex:1;overflow-y:auto;padding:6px 18px 20px}
.card{background:var(--card);border:1px solid var(--bd);border-radius:22px;padding:16px;margin-bottom:14px;box-shadow:var(--sh);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
h2{font-size:16px;margin:0 0 10px}p{margin:0 0 8px;font-size:14px;line-height:1.5;color:var(--mu)}
button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}
button:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid var(--ac2);outline-offset:2px}
.btn{width:100%;padding:14px;border-radius:999px;background:linear-gradient(135deg,var(--ac),var(--ac2));color:#fff;font-weight:700;font-size:15px;box-shadow:0 10px 22px rgba(34,197,94,.35)}
.btn+.btn{margin-top:8px}.btn.ghost{background:var(--card);color:var(--tx);box-shadow:none;border:1px solid var(--bd)}
.btn:disabled{opacity:.5;cursor:not-allowed}
.icb{width:40px;height:40px;border-radius:50%;background:var(--card);border:1px solid var(--bd);font-size:17px}
.lang{display:flex;gap:6px;padding:0 20px 8px}.lang button{flex:1;padding:7px 4px;border-radius:999px;background:var(--card);border:1px solid var(--bd);font-size:12px;font-weight:700}.lang button.on{background:var(--ac);color:#fff;border-color:var(--ac)}
.logo{width:64px;height:64px;border-radius:20px;margin:4px auto 12px;display:grid;place-items:center;font-size:30px;background:linear-gradient(135deg,var(--ac),var(--ac2));box-shadow:0 10px 24px rgba(34,197,94,.4)}
.err{color:#ef4444;font-size:13px;min-height:18px;margin:10px 0 4px}.lnk{color:var(--ac2);font-weight:700;font-size:14px}
.hi{font-size:18px;font-weight:800;margin:4px 2px 12px;color:var(--tx)}
.drop{border:2px dashed var(--ac2);border-radius:20px;min-height:170px;display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden;position:relative;cursor:pointer;background:rgba(34,197,94,.07)}
.drop img,.drop video{width:100%;max-height:300px;object-fit:cover;display:block}
.two{display:flex;gap:8px;margin:12px 0 8px}.two .btn{margin:0}
.hot{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:var(--ac2);color:#fff;font-weight:800;font-size:13px;box-shadow:0 0 0 6px rgba(74,222,128,.35);animation:pl 1.8s infinite}
.hot.on{background:#fff;color:var(--ac)}
@keyframes pl{50%{box-shadow:0 0 0 12px rgba(74,222,128,0)}}
@media(prefers-reduced-motion:reduce){.hot{animation:none}}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.chip{padding:8px 14px;border-radius:999px;background:var(--card);border:1px solid var(--bd);font-size:13px;font-weight:600}
.chip.on{background:var(--ac);color:#fff;border-color:var(--ac)}
.info{background:rgba(34,197,94,.12);border-radius:16px;padding:12px;margin:12px 0}.info p{margin:4px 0 0}
.row{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--bd);width:100%;text-align:left}.row:last-child{border:0}
.row .em{width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,var(--ac),var(--ac2));display:grid;place-items:center;font-size:22px;flex:none}
.row b{display:block;font-size:14px}.row span{font-size:12px;color:var(--mu)}
.tag{display:inline-block;margin-left:auto;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;background:rgba(22,163,74,.15);color:var(--ok)}
.tag.w{background:rgba(245,158,11,.18);color:#d97706}
.bar{height:8px;border-radius:99px;background:var(--bd);overflow:hidden;margin:6px 0 14px}.bar i{display:block;height:100%;background:linear-gradient(90deg,var(--ac),var(--ac2));transition:width .3s}
.step{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--bd);align-items:flex-start;width:100%;text-align:left}
.step .ck{width:26px;height:26px;border-radius:50%;border:2px solid var(--ac2);flex:none;display:grid;place-items:center;font-size:14px;color:#fff}
.step.done .ck{background:var(--ok);border-color:var(--ok)}.step.done div{opacity:.55;text-decoration:line-through}.step div{font-size:14px;line-height:1.45}
label{display:block;font-size:13px;font-weight:600;margin:10px 0 6px}
input,textarea{width:100%;padding:12px 14px;border-radius:14px;border:1px solid var(--bd);background:var(--card);color:var(--tx);font:inherit;font-size:16px}
textarea{min-height:80px;resize:vertical}
nav{display:flex;justify-content:space-around;align-items:center;padding:10px 12px 16px;background:var(--card);border-top:1px solid var(--bd);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
nav button{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;color:var(--mu);font-weight:600;min-width:58px}
nav button .i{font-size:20px}nav button.on{color:var(--ac2)}
nav .fab{width:58px;height:58px;border-radius:50%;margin-top:-30px;min-width:0;background:linear-gradient(135deg,var(--ac),var(--ac2));color:#fff;font-size:24px;box-shadow:0 10px 22px rgba(34,197,94,.45);border:4px solid var(--ph);justify-content:center}
.toast{position:absolute;left:50%;bottom:96px;transform:translateX(-50%);background:var(--ac);color:#fff;padding:10px 18px;border-radius:999px;font-size:13px;font-weight:600;box-shadow:var(--sh);white-space:nowrap}
.phone{background-image:radial-gradient(circle at 92% -4%,rgba(34,197,94,.38),transparent 42%),radial-gradient(circle at -12% 52%,rgba(99,102,241,.24),transparent 46%),radial-gradient(circle at 105% 102%,rgba(14,165,233,.2),transparent 42%)}
header{padding:14px 20px 10px}
.brand{display:flex;align-items:center;gap:12px}
.lgo{width:44px;height:44px;flex:none;filter:drop-shadow(0 6px 12px rgba(34,197,94,.45))}
.av{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--ac),var(--ac2));color:#fff;font-weight:800;font-size:17px;display:grid;place-items:center;border:2px solid var(--bd);box-shadow:0 6px 14px rgba(34,197,94,.35);flex:none}
.card{border-radius:26px;box-shadow:var(--sh),inset 0 1px 0 rgba(255,255,255,.35)}
.card.pf{display:flex;align-items:center;gap:14px}.pf .av{width:64px;height:64px;font-size:26px}.pf b{display:block;font-size:18px}
nav{border-radius:26px 26px 0 0;padding:10px 10px 14px;box-shadow:0 -10px 30px rgba(16,24,40,.14)}
nav button{flex:1;min-width:0;padding:6px 0;border-radius:16px;font-size:10.5px}
nav button.on{color:var(--ac2);background:rgba(34,197,94,.14)}
nav .fab{flex:none;width:62px;height:62px;margin:-34px 4px 0;padding:0;font-size:26px;background:linear-gradient(135deg,var(--ac),var(--ac2));color:#fff}
.seg{display:flex;padding:4px;border-radius:999px;background:rgba(34,197,94,.1);border:1px solid var(--bd)}
.seg button{flex:1;padding:10px 4px;border-radius:999px;font-size:13px;font-weight:700;color:var(--mu)}
.seg button.on{background:linear-gradient(135deg,var(--ac),var(--ac2));color:#fff;box-shadow:0 6px 14px rgba(34,197,94,.35)}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.stat{background:var(--card);border:1px solid var(--bd);border-radius:20px;padding:14px 6px;text-align:center;box-shadow:var(--sh)}
.stat b{display:block;font-size:22px}.stat span{font-size:11.5px;color:var(--mu)}
.btn.danger{background:rgba(239,68,68,.12);color:#ef4444;box-shadow:none;border:1px solid rgba(239,68,68,.35)}
.rem{display:flex;align-items:center;gap:10px;margin:14px 0 0;font-size:14px;font-weight:600;cursor:pointer}
.rem input{width:20px;height:20px;padding:0;accent-color:var(--ac2)}
.drop.scanning:after{content:"";position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,#4ade80,transparent);box-shadow:0 0 14px #4ade80;animation:scn 1s linear infinite}
@keyframes scn{from{top:0}to{top:100%}}
.splash{position:absolute;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 36%,#0f6b3a 0,#06140d 64%);color:#fff;transition:opacity .5s,visibility .5s}
.splash.out{opacity:0;visibility:hidden}
.sl{position:relative;width:132px;height:132px;display:grid;place-items:center;margin-bottom:20px}
.sl svg{width:96px;height:96px;filter:drop-shadow(0 12px 30px rgba(34,197,94,.75));animation:pop .9s cubic-bezier(.2,1.3,.4,1) both}
.sl:before,.sl:after{content:"";position:absolute;inset:4px;border-radius:50%;border:2px solid rgba(74,222,128,.55);animation:ring 2s ease-out infinite}
.sl:after{animation-delay:1s}
.sl i{position:absolute;left:20px;right:20px;height:3px;border-radius:3px;background:linear-gradient(90deg,transparent,#bbf7d0,transparent);box-shadow:0 0 14px #4ade80;animation:sweep 1.6s ease-in-out infinite}
.splash h1{font-size:32px;letter-spacing:-.02em;margin:0;animation:up .8s .25s both}
.splash p{color:#9ad1b0;font-size:13px;margin:8px 0 0;padding:0 44px;text-align:center;animation:up .8s .45s both}
.ld{width:150px;height:5px;border-radius:9px;background:rgba(255,255,255,.14);overflow:hidden;margin-top:36px}
.ld i{display:block;height:100%;width:0;border-radius:9px;background:linear-gradient(90deg,#16a34a,#bbf7d0);animation:fill 2s ease-in-out forwards}
@keyframes pop{from{transform:scale(.4) rotate(-12deg);opacity:0}}
@keyframes ring{from{transform:scale(.7);opacity:.9}to{transform:scale(1.4);opacity:0}}
@keyframes sweep{0%,100%{top:24px}50%{top:104px}}
@keyframes up{from{transform:translateY(12px);opacity:0}}
@keyframes fill{to{width:100%}}
@keyframes fi{from{opacity:0;transform:translateY(10px)}}
.phone.ready>header,.phone.ready>main,.phone.ready>nav{animation:fi .6s both}
@media(prefers-reduced-motion:reduce){.sl svg,.sl:before,.sl:after,.sl i,.splash h1,.splash p,.phone.ready>header,.phone.ready>main,.phone.ready>nav{animation:none}}
.pwf{position:relative}.pwf input{padding-right:50px}
.eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:50%;font-size:18px;line-height:1}
.eye:active{background:rgba(34,197,94,.15)}
.hidden{display:none!important}

.phone{background:var(--ph);background-image:none}
header{background:transparent;padding:16px 20px 12px}
.card{background:var(--card);backdrop-filter:none;-webkit-backdrop-filter:none;border-radius:20px;box-shadow:var(--sh)}
.btn{background:linear-gradient(135deg,var(--ac),var(--ac2));box-shadow:0 8px 18px rgba(22,163,74,.3)}
.btn.ghost{background:var(--card);color:var(--tx);box-shadow:none}.btn.danger{background:rgba(239,68,68,.1);box-shadow:none}
nav{background:var(--card);backdrop-filter:none;-webkit-backdrop-filter:none;border-radius:22px 22px 0 0;box-shadow:0 -4px 18px rgba(16,24,40,.08)}
nav button.on{background:rgba(34,197,94,.14)}
.hero{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:20px;border-radius:24px;margin-bottom:14px;color:#fff;background:linear-gradient(135deg,#0b7a3b,#16a34a 62%,#4ade80);box-shadow:0 12px 26px rgba(22,163,74,.32);position:relative;overflow:hidden}
.hero:after{content:"";position:absolute;right:-34px;top:-46px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,.14)}
.hero>div:first-child span{display:block;font-size:13px;opacity:.88}.hero>div:first-child b{font-size:22px}
.hs{display:flex;gap:20px;position:relative;z-index:1}.hs div{text-align:center}.hs b{display:block;font-size:22px}.hs span{font-size:11px;opacity:.88}
.qa{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
.qa button{background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:12px 2px;display:flex;flex-direction:column;align-items:center;gap:6px;box-shadow:var(--sh);font-size:11px;font-weight:700}
.qa i{font-style:normal;width:42px;height:42px;border-radius:14px;display:grid;place-items:center;font-size:20px;background:rgba(34,197,94,.15)}
.two{display:none}
body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,"Helvetica Neue",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.phone{background:var(--ph);background-image:none}
header{padding:14px 20px 4px}header small{display:none}header h1{font-size:19px}
.lgo{width:34px;height:34px;filter:none}
.lt{font-size:32px;font-weight:800;letter-spacing:-.02em;margin:6px 4px 14px}
.gh{font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--mu);margin:4px 8px 8px;font-weight:600}
.card{background:var(--card);border:0;border-radius:16px;box-shadow:var(--sh)}
h2{font-size:17px;font-weight:700}
.ic{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none}
.tl{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex:none}.tl .ic{width:22px;height:22px}
.tl.g{background:rgba(52,199,89,.16);color:#1f9d46}.tl.b{background:rgba(10,132,255,.14);color:#0a84ff}.tl.c{background:rgba(50,173,230,.16);color:#1d9bd1}.tl.p{background:rgba(175,82,222,.15);color:#a550d6}.tl.o{background:rgba(255,149,0,.16);color:#e08600}.tl.r{background:rgba(255,59,48,.14);color:#ff3b30}
.hd{display:flex;gap:12px;align-items:center}.sm{font-size:12.5px;color:var(--mu)}
.btn{background:linear-gradient(135deg,var(--ac),var(--ac2));border-radius:14px;box-shadow:none;padding:15px;font-weight:600;font-size:17px;color:#fff}
.btn.ghost{background:var(--fill);color:var(--tx)}.btn.danger{background:rgba(255,59,48,.12);color:#ff3b30}
.chip{display:inline-flex;align-items:center;gap:6px;background:var(--fill);border:0;color:var(--tx)}.chip .ic{width:16px;height:16px}.chip.on{background:var(--ac);color:#fff}
input,textarea{background:var(--fill);border:0;border-radius:12px;padding:14px;color:var(--tx)}
.grp{background:var(--card);border-radius:16px;overflow:hidden;margin-bottom:18px;box-shadow:var(--sh)}
.cell{display:flex;align-items:center;gap:12px;padding:12px 16px;width:100%;text-align:left;position:relative;color:var(--tx)}
.cell+.cell:before{content:"";position:absolute;top:0;left:68px;right:0;height:1px;background:var(--sep)}
.ct{flex:1;min-width:0}.ct b{display:block;font-size:16px;font-weight:600}.ct span{font-size:13px;color:var(--mu)}
.cv{width:18px;height:18px;color:var(--mu);opacity:.6}
.seg{background:var(--fill);border:0;border-radius:10px;padding:2px}
.seg button{display:flex;align-items:center;justify-content:center;gap:6px;border-radius:8px;padding:9px 4px;font-weight:600;color:var(--tx);font-size:13px}
.seg button.on{background:var(--card2);box-shadow:0 1px 3px rgba(0,0,0,.18);color:var(--tx)}.seg .ic{width:16px;height:16px}
.hero{border-radius:20px}
.qa button{border:0;border-radius:16px}.qa .tl{width:46px;height:46px;border-radius:14px}
.stat{border:0;border-radius:16px}
.bar{background:var(--fill)}.info{background:rgba(52,199,89,.12)}
.step{border-bottom:1px solid var(--sep)}.step .ck .ic{width:14px;height:14px;stroke-width:3}
.bk{display:flex;align-items:center;font-size:17px;font-weight:500;margin:0 0 10px}.bk .ic{width:22px;height:22px;margin-left:-6px}
.eye .ic{width:20px;height:20px;color:var(--mu)}
.rem{justify-content:space-between}
.rem input{-webkit-appearance:none;appearance:none;width:51px;height:31px;border-radius:99px;background:var(--fill);position:relative;transition:.2s;flex:none;padding:0;border:0}
.rem input:after{content:"";position:absolute;top:2px;left:2px;width:27px;height:27px;border-radius:50%;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.3);transition:.2s}
.rem input:checked{background:var(--ac2)}.rem input:checked:after{left:22px}
nav{background:var(--card);background:color-mix(in srgb,var(--card) 86%,transparent);-webkit-backdrop-filter:saturate(180%) blur(20px);backdrop-filter:saturate(180%) blur(20px);border-radius:0;border-top:1px solid var(--sep);box-shadow:none;padding:8px 6px 12px}
nav button{color:var(--mu);font-size:10px;font-weight:600;background:none}nav button.on{background:none;color:var(--ac2)}nav .i .ic{width:25px;height:25px}
nav .fab{width:56px;height:56px;margin:-26px 4px 0;border:0;color:#fff;box-shadow:0 6px 16px rgba(52,199,89,.45)}nav .fab .ic{width:26px;height:26px}
.hidden{display:none!important}
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="rvlogo" viewBox="0 0 64 64"><defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b7a3b"/><stop offset="1" stop-color="#16a34a"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="url(#gg)"/><path d="M18 26v-8a2 2 0 0 1 2-2h8M36 16h8a2 2 0 0 1 2 2v8M46 38v8a2 2 0 0 1-2 2h-8M28 48h-8a2 2 0 0 1-2-2v-8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/><circle cx="31" cy="31" r="8" fill="none" stroke="#fff" stroke-width="3"/><path d="M37 37l7 7" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><circle cx="29" cy="29" r="2" fill="#fff" opacity=".7"/></symbol></svg>
<div class="phone" id="phone">
 <div class="splash" id="splash" role="status"><div class="sl"><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#rvlogo"/></svg><i></i></div><h1>RepairVision</h1><p id="spt"></p><div class="ld"><i></i></div></div>
 <header>
  <div class="brand"><svg class="lgo" viewBox="0 0 64 64" aria-hidden="true"><use href="#rvlogo"/></svg><h1>RepairVision<small id="sub"></small></h1></div>
 </header>
 <div class="lang" id="lang"></div>
 <main id="main"></main>
 <nav id="nav" class="hidden"></nav>
 <div class="toast hidden" id="toast"></div>
</div>
<input type="file" id="f1" accept="image/*,video/*" class="hidden">
<input type="file" id="f2" accept="image/*" capture="environment" class="hidden">
<script>
var T={
kk:{sub:'Техникалық ақауды зерттеуге арналған визуалды көмекші',in:'Кіру',up:'Тіркелу',nm:'Атыңыз',lg:'Логин',pw:'Пароль',pw2:'Парольді қайталаңыз',noacc:'Тіркелгіңіз жоқ па?',have:'Тіркелгіңіз бар ма?',eEmpty:'Барлық өрісті толтырыңыз.',eShort:'Пароль кемінде 6 таңба болуы керек.',eExists:'Бұл логин бос емес.',eMatch:'Парольдер сәйкес келмейді.',eBad:'Логин немесе пароль дұрыс емес.',out:'Шығу',rem:'Мені есте сақта',pro:'Профиль',pApp:'Көрініс',tL:'Ашық',tD:'Қараңғы',tS:'Жүйелік',pLang:'Тіл',rep:'Жөнделді',req:'Өтінім',devs:'Құрылғы',back:'Артқа',hi:'Сәлем',nHome:'Басты',nCat:'Каталог',nSt:'Қадам',nAsk:'Маман',dT:'Ақауды сипаттаңыз',dX:'Тұрмыстық және оқу техникасының ақауын сипаттауға, тиісті нұсқаулықты табуға көмектеседі.',upT:'Ақаудың фотосын немесе қысқа бейнесін жүктеу',cam:'Камера',gal:'Галерея',run:'Талдауды бастау',busy:'Талданып жатыр...',cs:'Болжам',lv:'Күрделілік',l0:'Жеңіл',l1:'Орташа',l2:'Күрделі',goS:'Қадамдық нұсқаулыққа өту',goM:'Маманға өтінім беру',catT:'Құрылғылар каталогы',hiT:'Жөндеу тарихы',emp:'Тарих әзірше бос. Алғашқы жөндеуді бастаңыз.',fx:'Жөнделді',iw:'Үдерісте',stT:'Қадамдық нұсқаулық',dn:'орындалды',sv:'Жөндеу тарихына сақтау',svd:'Тарихқа сақталды',akT:'Қосалқы бөлімшеге немесе маманға өтінім',akS:'Нұсқаулық көмектеспесе, өтінім қалдырыңыз.',dvc:'Құрылғы',to:'Кімге жіберу',toP:'Қосалқы бөлім',toM:'Жөндеу маманы',ds:'Сипаттама',dsP:'Не болғанын жазыңыз',ph:'Телефон',snd:'Өтінімді жіберу',fill:'Сипаттама мен телефонды толтырыңыз.',sent:'Өтінім жіберілді'},
ru:{sub:'Визуальный помощник для диагностики технических неисправностей',in:'Войти',up:'Регистрация',nm:'Ваше имя',lg:'Логин',pw:'Пароль',pw2:'Повторите пароль',noacc:'Нет аккаунта?',have:'Уже есть аккаунт?',eEmpty:'Заполните все поля.',eShort:'Пароль должен быть не короче 6 символов.',eExists:'Этот логин уже занят.',eMatch:'Пароли не совпадают.',eBad:'Неверный логин или пароль.',out:'Выйти',rem:'Запомнить меня',pro:'Профиль',pApp:'Оформление',tL:'Светлая',tD:'Тёмная',tS:'Системная',pLang:'Язык',rep:'Исправлено',req:'Заявок',devs:'Устройств',back:'Назад',hi:'Привет',nHome:'Главная',nCat:'Каталог',nSt:'Шаги',nAsk:'Мастер',dT:'Опишите неисправность',dX:'Поможет описать неисправность бытовой и учебной техники и найти нужную инструкцию.',upT:'Загрузите фото или короткое видео неисправности',cam:'Камера',gal:'Галерея',run:'Начать анализ',busy:'Идёт анализ...',cs:'Предположение',lv:'Сложность',l0:'Лёгкая',l1:'Средняя',l2:'Сложная',goS:'Перейти к пошаговой инструкции',goM:'Оставить заявку специалисту',catT:'Каталог устройств',hiT:'История ремонта',emp:'История пока пуста. Начните первый ремонт.',fx:'Исправлено',iw:'В работе',stT:'Пошаговая инструкция',dn:'выполнено',sv:'Сохранить в историю ремонта',svd:'Сохранено в истории',akT:'Заявка в отдел запчастей или мастеру',akS:'Если инструкция не помогла, оставьте заявку.',dvc:'Устройство',to:'Кому отправить',toP:'Отдел запчастей',toM:'Мастер по ремонту',ds:'Описание',dsP:'Опишите, что произошло',ph:'Телефон',snd:'Отправить заявку',fill:'Заполните описание и телефон.',sent:'Заявка отправлена'},
en:{sub:'Visual assistant for diagnosing technical faults',in:'Sign in',up:'Sign up',nm:'Your name',lg:'Username',pw:'Password',pw2:'Repeat password',noacc:'No account yet?',have:'Already registered?',eEmpty:'Please fill in all fields.',eShort:'Password must be at least 6 characters.',eExists:'This username is already taken.',eMatch:'Passwords do not match.',eBad:'Wrong username or password.',out:'Sign out',rem:'Remember me',pro:'Profile',pApp:'Appearance',tL:'Light',tD:'Dark',tS:'System',pLang:'Language',rep:'Fixed',req:'Requests',devs:'Devices',back:'Back',hi:'Hello',nHome:'Home',nCat:'Catalog',nSt:'Steps',nAsk:'Expert',dT:'Describe the fault',dX:'Helps you describe a fault in household or study equipment and find the right instruction.',upT:'Upload a photo or short video of the fault',cam:'Camera',gal:'Gallery',run:'Start analysis',busy:'Analyzing...',cs:'Likely cause',lv:'Difficulty',l0:'Easy',l1:'Medium',l2:'Hard',goS:'Open step-by-step guide',goM:'Send request to a technician',catT:'Device catalog',hiT:'Repair history',emp:'No history yet. Start your first repair.',fx:'Fixed',iw:'In progress',stT:'Step-by-step guide',dn:'done',sv:'Save to repair history',svd:'Saved to history',akT:'Request to parts department or technician',akS:'If the guide did not help, leave a request.',dvc:'Device',to:'Send to',toP:'Parts department',toM:'Repair technician',ds:'Description',dsP:'Tell us what happened',ph:'Phone',snd:'Send request',fill:'Fill in the description and phone.',sent:'Request sent'}};
var DEV=[
{id:'wm',sp:0,lv:1,h:[[28,40],[68,62]],
 kk:{n:'Кір жуғыш машина',i:'Су төгілмейді',c:'Төгу сүзгісі немесе сорғы бітелген болуы мүмкін.',h:[['Төгу сүзгісі','Төменгі алдыңғы панельде орналасқан, қоқыс осында жиналады.'],['Төгу шлангісі','Бүгілген немесе бітелген болуы мүмкін.']],s:['Машинаны розеткадан ажыратыңыз.','Төменгі панельді ашып, астына тегене қойыңыз.','Сүзгіні бұрап шығарып, суды төгіп, тазалаңыз.','Сүзгіні орнына салып, қысқа жуу бағдарламасын қосыңыз.']},
 ru:{n:'Стиральная машина',i:'Не сливает воду',c:'Возможно, засорён сливной фильтр или насос.',h:[['Сливной фильтр','Находится за нижней передней панелью, здесь копится мусор.'],['Сливной шланг','Может быть перегнут или засорён.']],s:['Отключите машину от розетки.','Откройте нижнюю панель и подставьте таз.','Выкрутите фильтр, слейте воду и очистите его.','Поставьте фильтр на место и запустите короткую стирку.']},
 en:{n:'Washing machine',i:'Does not drain',c:'The drain filter or pump may be clogged.',h:[['Drain filter','Behind the lower front panel; debris collects here.'],['Drain hose','May be kinked or blocked.']],s:['Unplug the machine.','Open the lower panel and place a tray under it.','Unscrew the filter, drain the water and clean it.','Refit the filter and run a short wash.']}},
{id:'fr',sp:0,lv:0,h:[[50,85],[18,35]],
 kk:{n:'Тоңазытқыш',i:'Жеткілікті салқындатпайды',c:'Конденсатор шаң басқан немесе есік тығыздағышы тозған болуы мүмкін.',h:[['Конденсатор','Артқы қабырғада орналасқан, шаң жылу алмасуды нашарлатады.'],['Есік тығыздағышы','Қағаз парағы оңай суырылса, тығыздағыш тозған.']],s:['Тоңазытқышты өшіріңіз.','Конденсаторды шаңсорғышпен тазалаңыз.','Тығыздағышты сабынды сумен сүртіңіз.','Қосып, 4 сағаттан кейін температураны тексеріңіз.']},
 ru:{n:'Холодильник',i:'Плохо охлаждает',c:'Возможно, конденсатор покрыт пылью или износился уплотнитель двери.',h:[['Конденсатор','На задней стенке; пыль ухудшает теплообмен.'],['Уплотнитель двери','Если лист бумаги легко выдёргивается, уплотнитель изношен.']],s:['Выключите холодильник.','Очистите конденсатор пылесосом.','Протрите уплотнитель мыльной водой.','Включите и через 4 часа проверьте температуру.']},
 en:{n:'Refrigerator',i:'Not cooling well',c:'The condenser may be dusty or the door seal worn.',h:[['Condenser','On the back wall; dust reduces heat exchange.'],['Door seal','If a sheet of paper slides out easily, the seal is worn.']],s:['Switch the fridge off.','Vacuum the condenser.','Wipe the seal with soapy water.','Switch on and check the temperature after 4 hours.']}},
{id:'pr',sp:0,lv:0,h:[[35,30],[70,55]],
 kk:{n:'Принтер',i:'Қағаз тығылып қалады',c:'Роликтер кірлеген немесе қағаз жолында бөтен зат бар.',h:[['Қағаз роликі','Резеңке ролик тайғанақ болса, қағазды тартпайды.'],['Артқы қақпақ','Тығылған қағазды осы жерден алуға болады.']],s:['Принтерді өшіріп, кабельді ажыратыңыз.','Артқы қақпақты ашып, қағазды баяу тартып алыңыз.','Роликті дымқыл матамен сүртіңіз.','Қосып, сынақ бетін басыңыз.']},
 ru:{n:'Принтер',i:'Замятие бумаги',c:'Возможно, загрязнены ролики или в тракте посторонний предмет.',h:[['Ролик подачи','Если резина скользкая, бумага не захватывается.'],['Задняя крышка','Через неё можно достать зажёванную бумагу.']],s:['Выключите принтер и отсоедините кабель.','Откройте заднюю крышку и осторожно вытяните бумагу.','Протрите ролик влажной тканью.','Включите и распечатайте тестовую страницу.']},
 en:{n:'Printer',i:'Paper jam',c:'The rollers may be dirty or something is blocking the paper path.',h:[['Feed roller','If the rubber is slick, it cannot grip the paper.'],['Rear cover','Jammed paper can be removed through here.']],s:['Turn the printer off and unplug it.','Open the rear cover and pull the paper out slowly.','Wipe the roller with a damp cloth.','Switch on and print a test page.']}},
{id:'ac',sp:1,lv:2,h:[[50,25],[22,70]],
 kk:{n:'Кондиционер',i:'Су тамшылайды',c:'Дренаж түтігі бітелген немесе сүзгі лас болуы мүмкін.',h:[['Ауа сүзгісі','Лас сүзгі ауа ағынын тежеп, мұздануға әкеледі.'],['Дренаж түтігі','Конденсат осы түтік арқылы сыртқа шығады.']],s:['Кондиционерді өшіріңіз.','Сүзгіні шығарып, жылы сумен жуыңыз.','Дренаж түтігінің ұшын тексеріңіз.','Су тамса, маманға өтінім қалдырыңыз.']},
 ru:{n:'Кондиционер',i:'Капает вода',c:'Возможно, засорена дренажная трубка или загрязнён фильтр.',h:[['Воздушный фильтр','Грязный фильтр ограничивает поток воздуха и ведёт к обледенению.'],['Дренажная трубка','По ней конденсат выходит наружу.']],s:['Выключите кондиционер.','Достаньте фильтр и промойте тёплой водой.','Проверьте конец дренажной трубки.','Если капает дальше, оставьте заявку мастеру.']},
 en:{n:'Air conditioner',i:'Water is dripping',c:'The drain pipe may be blocked or the filter dirty.',h:[['Air filter','A dirty filter restricts airflow and causes icing.'],['Drain pipe','Condensate leaves the unit through this pipe.']],s:['Turn the unit off.','Remove the filter and rinse it with warm water.','Check the end of the drain pipe.','If it still drips, send a request to a technician.']}}
];
var $=function(i){return document.getElementById(i)};
var RV=window.__RV||{};
function native(o){try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(o))}catch(e){}}
function ld(k,d){try{var v=RV[k]!=null?RV[k]:localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function sv(k,v){var s=JSON.stringify(v);RV[k]=s;try{localStorage.setItem(k,s)}catch(e){}native({k:k,v:s})}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function H(s){var h=5381,i;for(i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return String(h>>>0)}
var nl=(navigator.language||'kk').slice(0,2);
var S={lang:ld('rv_lang',null)||(nl==='ru'||nl==='en'?nl:'kk'),user:ld('rv_session',null),theme:ld('rv_theme','system'),mode:'in',tab:'home',dv:'wm',img:null,vid:false,res:false,hot:0,prog:{}};
function t(k){return T[S.lang][k]||k}
function dev(id){return DEV.filter(function(x){return x.id===id})[0]}
function toast(m){var e=$('toast');e.textContent=m;e.classList.remove('hidden');clearTimeout(toast.h);toast.h=setTimeout(function(){e.classList.add('hidden')},2200)}
function hist(){return S.user?ld('rv_h_'+S.user.login,[]):[]}
function addH(x){var a=hist();a.unshift(x);sv('rv_h_'+S.user.login,a)}
function fmt(ts){try{return new Date(ts).toLocaleDateString({kk:'kk-KZ',ru:'ru-RU',en:'en-GB'}[S.lang],{day:'numeric',month:'long'})}catch(e){return ''}}
var IC={
home:'<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
grid:'<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
cam:'<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
img:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M3 17l5-5 4 4 3-3 6 6"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
help:'<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><path d="M4 13h3v5H5a1 1 0 0 1-1-1zM20 13h-3v5h2a1 1 0 0 0 1-1z"/><path d="M17 18c0 2-2 3-5 3"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
phone:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
out:'<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9"/>',
eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
eyeoff:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>',
chk:'<path d="M5 12l5 5 9-10"/>',
chev:'<path d="M9 6l6 6-6 6"/>',
back:'<path d="M15 6l-6 6 6 6"/>',
up:'<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
wm:'<rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="14" r="5"/><path d="M8 6h.01M12 6h5"/>',
fr:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M6 10h12M9 6v2M9 13v3"/>',
pr:'<path d="M7 9V3h10v6M7 18H5a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2"/><rect x="7" y="14" width="10" height="7"/>',
ac:'<rect x="3" y="5" width="18" height="8" rx="2"/><path d="M7 9h6M7 17v3M12 17v3M17 17v3"/>'};
var DC={wm:'b',fr:'c',pr:'p',ac:'o'};
function ic(n,c){return '<svg class="ic '+(c||'')+'" viewBox="0 0 24 24" aria-hidden="true">'+IC[n]+'</svg>'}
function tile(n,c){return '<span class="tl '+c+'">'+ic(n)+'</span>'}
function chips(){return '<div class="chips">'+DEV.map(function(d){return '<button class="chip'+(d.id===S.dv?' on':'')+'" data-d="'+d.id+'">'+ic(d.id)+d[S.lang].n+'</button>'}).join('')+'</div>'}
function authV(){var up=S.mode==='up';
 function pf(id,ac){return '<div class="pwf"><input id="'+id+'" type="password" autocomplete="'+ac+'"><button type="button" class="eye" data-eye="'+id+'" aria-label="'+esc(t(id))+'">'+ic('eye')+'</button></div>'}
 return '<div class="card"><svg class="lgo" style="width:72px;height:72px;display:block;margin:2px auto 10px" viewBox="0 0 64 64" aria-hidden="true"><use href="#rvlogo"/></svg><h2 style="text-align:center;font-size:22px;margin-bottom:4px">'+t(up?'up':'in')+'</h2><p style="text-align:center">'+t('sub')+'</p>'+
 (up?'<label for="nm">'+t('nm')+'</label><input id="nm" autocomplete="name">':'')+
 '<label for="lg">'+t('lg')+'</label><input id="lg" autocomplete="username" autocapitalize="none" value="'+(up?'':esc(ld('rv_last','')))+'">'+
 '<label for="pw">'+t('pw')+'</label>'+pf('pw',up?'new-password':'current-password')+
 (up?'<label for="pw2">'+t('pw2')+'</label>'+pf('pw2','new-password'):'')+
 (up?'':'<label class="rem">'+t('rem')+'<input type="checkbox" id="rm"'+(ld('rv_rem',true)?' checked':'')+'></label>')+
 '<p class="err" id="err" role="alert"></p><button class="btn" id="go">'+t(up?'up':'in')+'</button>'+
 '<p style="text-align:center;margin:14px 0 0">'+t(up?'have':'noacc')+' <button class="lnk" id="sw">'+t(up?'in':'up')+'</button></p></div>'}
function auth(){var up=S.mode==='up',l=$('lg').value.trim().toLowerCase(),p=$('pw').value,U=ld('rv_users',{});
 function bad(k){$('err').textContent=t(k)}
 if(!l||!p)return bad('eEmpty');
 if(up){var n=$('nm').value.trim();if(!n)return bad('eEmpty');if(p.length<6)return bad('eShort');if(p!==$('pw2').value)return bad('eMatch');if(U[l])return bad('eExists');U[l]={h:H(l+':'+p),n:n};sv('rv_users',U)}
 else if(!U[l]||U[l].h!==H(l+':'+p))return bad('eBad');
 var rm=$('rm')?$('rm').checked:true;S.user={login:l,name:U[l].n};sv('rv_rem',rm);sv('rv_last',l);sv('rv_session',rm?S.user:null);S.tab='home';render()}
function heroV(){var H2=hist(),fx=H2.filter(function(h){return h.ok}).length,rq=H2.filter(function(h){return h.r}).length;
 var Q=[['cm','cam','g',t('cam')],['gl','img','b',t('gal')],['cat','grid','o',t('nCat')],['ask','help','p',t('nAsk')]];
 return '<div class="hero"><div><span>'+t('hi')+'</span><b>'+esc(S.user.name)+'</b></div><div class="hs"><div><b>'+fx+'</b><span>'+t('rep')+'</span></div><div><b>'+rq+'</b><span>'+t('req')+'</span></div></div></div><div class="qa">'+Q.map(function(x){return '<button data-q="'+x[0]+'">'+tile(x[1],x[2])+'<span>'+x[3]+'</span></button>'}).join('')+'</div>'}
function home(){var d=dev(S.dv),x=d[S.lang],m=heroV()+'<div class="card"><h2>'+t('dT')+'</h2><p>'+t('dX')+'</p>'+chips()+'<div class="drop" id="drop">';
 if(S.img){m+=S.vid?'<video src="'+S.img+'" muted autoplay loop playsinline></video>':'<img src="'+S.img+'" alt="">';
  if(S.res)m+=d.h.map(function(h,i){return '<button class="hot'+(S.hot===i?' on':'')+'" style="left:'+h[0]+'%;top:'+h[1]+'%" data-h="'+i+'" aria-label="'+esc(x.h[i][0])+'">'+(i+1)+'</button>'}).join('')}
 else m+='<div style="padding:16px">'+tile('up','g')+'<b style="display:block;margin-top:10px">'+t('upT')+'</b></div>';
 m+='</div><button class="btn" id="an" style="margin-top:14px"'+(S.img?'':' disabled')+'>'+t('run')+'</button></div>';
 if(S.res){m+='<div class="card"><div class="hd">'+tile(d.id,DC[d.id])+'<div><h2 style="margin:0">'+x.i+'</h2><span class="sm">'+x.n+'</span></div></div><p style="margin-top:12px"><b>'+t('cs')+':</b> '+x.c+'</p><span class="tag'+(d.sp?' w':'')+'" style="margin:0">'+t('lv')+': '+t('l'+d.lv)+'</span><div class="info"><b>'+(S.hot+1)+'. '+x.h[S.hot][0]+'</b><p>'+x.h[S.hot][1]+'</p></div><button class="btn" id="goS">'+t('goS')+'</button>'+(d.sp?'<button class="btn ghost" id="goM">'+t('goM')+'</button>':'')+'</div>'}
 return m}
function cat(){var H2=hist();
 return '<h1 class="lt">'+t('catT')+'</h1><div class="grp">'+DEV.map(function(d){return '<button class="cell" data-c="'+d.id+'">'+tile(d.id,DC[d.id])+'<div class="ct"><b>'+d[S.lang].n+'</b><span>'+d[S.lang].i+'</span></div>'+ic('chev','cv')+'</button>'}).join('')+'</div>'+
 '<h3 class="gh">'+t('hiT')+'</h3>'+(H2.length?'<div class="grp">'+H2.map(function(h){var d=dev(h.d);return '<div class="cell">'+tile(d.id,DC[d.id])+'<div class="ct"><b>'+(h.r?t(h.r==='p'?'toP':'toM')+': '+esc(h.x):d[S.lang].i)+'</b><span>'+d[S.lang].n+' \u00b7 '+fmt(h.ts)+'</span></div><span class="tag'+(h.ok?'':' w')+'">'+t(h.ok?'fx':'iw')+'</span></div>'}).join('')+'</div>':'<div class="card"><p style="margin:0">'+t('emp')+'</p></div>')}
function steps(){var d=dev(S.dv),x=d[S.lang],p=S.prog[d.id]||[],n=p.filter(Boolean).length,pc=Math.round(n/x.s.length*100);
 return '<button class="lnk bk" id="bk">'+ic('back')+t('back')+'</button><div class="card"><div class="hd">'+tile(d.id,DC[d.id])+'<div><h2 style="margin:0">'+x.n+'</h2><span class="sm">'+x.i+'</span></div></div><p style="margin-top:12px">'+x.c+'</p><b style="font-size:13px">'+pc+'% '+t('dn')+'</b><div class="bar"><i style="width:'+pc+'%"></i></div>'+
 x.s.map(function(s,i){return '<button class="step'+(p[i]?' done':'')+'" data-s="'+i+'"><span class="ck">'+(p[i]?ic('chk'):'')+'</span><div>'+s+'</div></button>'}).join('')+
 (n===x.s.length?'<button class="btn" id="fin" style="margin-top:14px">'+t('sv')+'</button>':'')+'<button class="btn ghost" id="goM2" style="margin-top:10px">'+t('goM')+'</button></div>'}
function ask(){return '<h1 class="lt">'+t('nAsk')+'</h1><div class="card"><h2>'+t('akT')+'</h2><p>'+t('akS')+'</p><label>'+t('dvc')+'</label>'+chips()+'<label>'+t('to')+'</label><div class="seg" id="tg"><button class="'+((S.to||'p')==='p'?'on':'')+'" data-t="p">'+t('toP')+'</button><button class="'+(S.to==='m'?'on':'')+'" data-t="m">'+t('toM')+'</button></div>'+
 '<label for="a3">'+t('ds')+'</label><textarea id="a3" placeholder="'+esc(t('dsP'))+'"></textarea><label for="a4">'+t('ph')+'</label><input id="a4" type="tel" placeholder="+7 ___ ___ __ __"><button class="btn" id="snd" style="margin-top:16px">'+t('snd')+'</button></div>'}
function pro(){var H2=hist(),fx=H2.filter(function(h){return h.ok}).length,rq=H2.filter(function(h){return h.r}).length,u=S.user;
 function seg(items,attr,cur){return '<div class="seg">'+items.map(function(i){return '<button data-'+attr+'="'+i[0]+'" class="'+(cur===i[0]?'on':'')+'">'+i[1]+'</button>'}).join('')+'</div>'}
 return '<h1 class="lt">'+t('pro')+'</h1><div class="card pf"><div class="av">'+esc(u.name.trim().charAt(0).toUpperCase())+'</div><div><b>'+esc(u.name)+'</b><span style="color:var(--mu);font-size:13px">@'+esc(u.login)+'</span></div></div>'+
 '<div class="stats"><div class="stat"><b>'+fx+'</b><span>'+t('rep')+'</span></div><div class="stat"><b>'+rq+'</b><span>'+t('req')+'</span></div><div class="stat"><b>'+DEV.length+'</b><span>'+t('devs')+'</span></div></div>'+
 '<div class="card"><h2>'+t('pApp')+'</h2>'+seg([['light',ic('sun')+t('tL')],['dark',ic('moon')+t('tD')],['system',ic('phone')+t('tS')]],'th',S.theme)+'</div>'+
 '<div class="card"><h2>'+t('pLang')+'</h2>'+seg([['kk','\u049a\u0430\u0437\u0430\u049b\u0448\u0430'],['ru','\u0420\u0443\u0441\u0441\u043a\u0438\u0439'],['en','English']],'l',S.lang)+'</div>'+
 '<div class="grp"><button class="cell" id="pe">'+tile('help','p')+'<div class="ct"><b>'+t('goM')+'</b></div>'+ic('chev','cv')+'</button><button class="cell" id="lo">'+tile('out','r')+'<div class="ct"><b style="color:#ff3b30">'+t('out')+'</b></div></button></div>'}
function nav(){var N=[['home','home','nHome'],['cat','grid','nCat'],['scan','cam',''],['ask','help','nAsk'],['pro','user','pro']],cur=S.tab==='steps'?(S.from||'home'):S.tab;
 $('nav').innerHTML=N.map(function(n){return '<button data-t="'+n[0]+'" class="'+(n[0]==='scan'?'fab':cur===n[0]?'on':'')+'" aria-label="'+(n[2]?t(n[2]):t('cam'))+'"><span class="i">'+ic(n[1])+'</span>'+(n[2]?t(n[2]):'')+'</button>'}).join('');
 Array.prototype.forEach.call($('nav').children,function(b){b.onclick=function(){if(b.dataset.t==='scan'){S.tab='home';render();$('f2').click()}else{S.tab=b.dataset.t;render()}}})}
function render(){document.documentElement.lang=S.lang;$('sub').textContent=t('sub');$('spt').textContent=t('sub');$('lang').classList.toggle('hidden',!!S.user);
 $('lang').innerHTML=[['kk','\u049a\u0430\u0437\u0430\u049b\u0448\u0430'],['ru','\u0420\u0443\u0441\u0441\u043a\u0438\u0439'],['en','English']].map(function(l){return '<button data-l="'+l[0]+'" class="'+(S.lang===l[0]?'on':'')+'">'+l[1]+'</button>'}).join('');
 $('main').innerHTML=!S.user?authV():{home:home,cat:cat,steps:steps,ask:ask,pro:pro}[S.tab]();
 $('nav').classList.toggle('hidden',!S.user);if(S.user)nav();bind()}
function bind(){var q=function(i){return $(i)},A=function(s,f){Array.prototype.forEach.call(document.querySelectorAll(s),f)},toAsk=function(){S.tab='ask';render()};
 A('[data-l]',function(b){b.onclick=function(){S.lang=b.dataset.l;sv('rv_lang',S.lang);render()}});
 A('[data-eye]',function(b){b.onclick=function(){var i=$(b.dataset.eye),s=i.type==='password';i.type=s?'text':'password';b.innerHTML=ic(s?'eyeoff':'eye')}});
 if(!S.user){q('go').onclick=auth;q('sw').onclick=function(){S.mode=S.mode==='up'?'in':'up';render()};A('input',function(i){i.onkeydown=function(e){if(e.key==='Enter')auth()}});return}
 A('[data-d]',function(c){c.onclick=function(){S.dv=c.dataset.d;S.res=false;S.hot=0;render()}});
 A('[data-c]',function(c){c.onclick=function(){S.dv=c.dataset.c;S.from='cat';S.tab='steps';render()}});
 A('[data-h]',function(h){h.onclick=function(e){e.stopPropagation();S.hot=+h.dataset.h;render()}});
 A('[data-s]',function(b){b.onclick=function(){var k=S.dv,i=+b.dataset.s;S.prog[k]=S.prog[k]||[];S.prog[k][i]=!S.prog[k][i];render()}});
 A('[data-q]',function(b){b.onclick=function(){var k=b.dataset.q;if(k==='cm')q('f2').click();else if(k==='gl')q('f1').click();else{S.tab=k;render()}}});
 A('[data-th]',function(b){b.onclick=function(){S.theme=b.dataset.th;sv('rv_theme',S.theme);applyTheme();render()}});
 A('#tg button',function(b){b.onclick=function(){S.to=b.dataset.t;A('#tg button',function(x){x.classList.toggle('on',x===b)})}});
 if(q('drop'))q('drop').onclick=function(e){if(!e.target.closest('.hot'))q('f1').click()};
 if(q('an'))q('an').onclick=function(){q('an').textContent=t('busy');q('drop').classList.add('scanning');setTimeout(function(){S.res=true;S.hot=0;render()},800)};
 if(q('goS'))q('goS').onclick=function(){S.from='home';S.tab='steps';render()};
 if(q('goM'))q('goM').onclick=toAsk;if(q('goM2'))q('goM2').onclick=toAsk;if(q('pe'))q('pe').onclick=toAsk;
 if(q('bk'))q('bk').onclick=function(){S.tab=S.from||'home';render()};
 if(q('fin'))q('fin').onclick=function(){addH({d:S.dv,ts:Date.now(),ok:true});S.prog[S.dv]=[];S.tab='cat';render();toast(t('svd'))};
 if(q('lo'))q('lo').onclick=logout;
 if(q('snd'))q('snd').onclick=function(){var x=q('a3').value.trim();if(!x||!q('a4').value.trim())return toast(t('fill'));addH({d:S.dv,ts:Date.now(),ok:false,r:S.to||'p',x:x});S.to='p';S.tab='cat';render();toast(t('sent'))}}
function onFile(e){var f=e.target.files[0];if(!f)return;if(S.img)URL.revokeObjectURL(S.img);S.img=URL.createObjectURL(f);S.vid=f.type.indexOf('video')===0;S.res=false;S.tab='home';render();e.target.value=''}
$('f1').onchange=onFile;$('f2').onchange=onFile;
function applyTheme(quiet){var r=document.documentElement;if(S.theme==='system')r.removeAttribute('data-theme');else r.setAttribute('data-theme',S.theme);
 var dk=S.theme==='dark'||(S.theme==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);
 if(!quiet)native({bg:dk?'#000000':'#f2f2f7',dark:dk})}
function logout(){S.user=null;sv('rv_session',null);S.mode='in';S.img=null;S.res=false;S.tab='home';render()}
applyTheme(true);
render();
setTimeout(function(){$('splash').classList.add('out');$('phone').classList.add('ready');applyTheme()},2100);
</script>
</body>
</html>
`;

export default function App() {
  const [store, setStore] = useState(null);   // телефонда сақталған деректер
  const [bg, setBg] = useState('#06140d');    // статус-бар фоны (тема бойынша өзгереді)
  const [dark, setDark] = useState(true);

  // Қосымша ашылғанда сақталған аккаунттар мен баптауларды оқимыз
  useEffect(() => {
    (async () => {
      try {
        const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('rv_'));
        const pairs = await AsyncStorage.multiGet(keys);
        const o = {};
        pairs.forEach(([k, v]) => { o[k] = v; });
        setStore(o);
      } catch (e) {
        setStore({});
      }
    })();
  }, []);

  // WebView-дан келген деректерді телефон жадына жазамыз
  const onMessage = (e) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.k) AsyncStorage.setItem(m.k, m.v);
      if (m.bg) { setBg(m.bg); setDark(!!m.dark); }
    } catch (err) {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
        {store && (
          <WebView
            originWhitelist={['*']}
            source={{ html: HTML, baseUrl: 'https://repairvision.local' }}
            injectedJavaScriptBeforeContentLoaded={'window.__RV=' + JSON.stringify(store) + ';true;'}
            onMessage={onMessage}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            contentInsetAdjustmentBehavior="never"
            bounces={false}
            overScrollMode="never"
            showsVerticalScrollIndicator={false}
            style={{ flex: 1, backgroundColor: 'transparent' }}
          />
        )}
      </SafeAreaView>
    </View>
  );
}