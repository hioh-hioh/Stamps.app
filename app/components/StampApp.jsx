'use client'
import { Marker as MapMarker } from 'react-map-gl/mapbox'
import { useState, useEffect } from "react";
import { supabase } from '../../lib/supabase'
import MapView from './MapView'
import Map from 'react-map-gl/mapbox'
// ══════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════
const MAP_SPOTS = [
  { id:1, name:"渋谷ちかみち総合インフォメーション", stampUpdatedAt:"2026-04-15", stampUpdatedBy:{name:"masa", avatar:null}, category:"観光案内所", area:"東京都渋谷区", checkins:15403, comment:"周辺に4つほどスタンプがあります。状態もとても良く、可愛く押せました〜！", hours:"10:00-20:00", location:"入口入って左側荷物設置", x:48, y:28, lat:35.6591, lng:139.7019, reviews:[{text:"周辺に4つほどスタンプがあります。状態もとても良く、可愛く押せました〜！",user:null},{text:"インクの状態とてもよかったです。",user:null}] },
  { id:2, name:"渋谷駅", stampUpdatedAt:"2025-10-01", stampUpdatedBy:{name:"yuki", avatar:null}, category:"鉄道駅", area:"東京都渋谷区", checkins:22100, comment:"ハチ公口改札前に設置。朝は混むので夕方がおすすめです。", hours:"終日", location:"ハチ公口改札前", x:26, y:46, lat:35.6580, lng:139.7016, reviews:[{text:"ハチ公口改札前。朝は混むので夕方がおすすめです。",user:null}] },
  { id:3, name:"渋谷ヒカリエ", stampUpdatedAt:"2026-03-20", stampUpdatedBy:{name:"taro", avatar:null}, category:"商業施設", area:"東京都渋谷区", checkins:8742, comment:"3Fインフォメーション横。営業時間内のみ。", hours:"11:00-21:00", location:"3Fインフォメーション横", x:72, y:52, lat:35.6590, lng:139.7033, reviews:[{text:"3Fインフォメーション横。営業時間内のみ。",user:null}] },
  { id:4, name:"代官山蔦屋書店", stampUpdatedAt:"2025-12-01", stampUpdatedBy:{name:"hana", avatar:null}, category:"書店", area:"東京都渋谷区", checkins:5200, comment:"1号館入口付近。スタンプ状態良好！", hours:"10:00-22:00", location:"1号館入口", x:40, y:60, lat:35.6488, lng:139.7027, reviews:[{text:"1号館入口付近。スタンプ状態良好！",user:null}] },
  { id:5, name:"恵比寿ガーデンプレイス", stampUpdatedAt:"2026-05-10", stampUpdatedBy:{name:"masa", avatar:null}, category:"商業施設", area:"東京都渋谷区", checkins:6300, comment:"センター広場近くに設置。", hours:"11:00-20:00", location:"センター広場", x:62, y:70, lat:35.6465, lng:139.7152, reviews:[{text:"センター広場近くに設置。",user:null}] },
  { id:6, name:"中目黒駅", category:"鉄道駅", area:"東京都目黒区", checkins:4800, comment:"改札外コンコースに設置。", hours:"終日", location:"改札外コンコース", x:20, y:72, lat:35.6444, lng:139.6987, stampUpdatedAt:"2026-05-01", stampUpdatedBy:{name:"yuki", avatar:null}, reviews:[{text:"改札外コンコースに設置。",user:null}] },
];

// 2点間の距離計算（km）
function calcDist(lat1,lng1,lat2,lng2){
  const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function fmtDist(km){
  return km<1 ? `${Math.round(km*1000)}m` : `${km.toFixed(1)}km`;
}

// heightsパターン (左列・右列でずらす)
const LEFT_HEIGHTS  = [196, 160, 210, 150, 180, 200, 155, 175, 205, 165];
const RIGHT_HEIGHTS = [150, 200, 155, 195, 165, 145, 210, 160, 180, 190];

const MOCK_FEED = [
  { id:101, name:"Shibuya Chikamichi Info",     nameJa:"渋谷ちかみち総合インフォメーション", hasImg:true,  emoji:"🏮", color:"#E1F5EE", category:"観光" },
  { id:102, name:"JR Shibuya Station",          nameJa:"JR渋谷駅",                           hasImg:false, emoji:"🚉", color:"#EBF0F5", category:"駅スタンプ" },
  { id:103, name:"Shibuya Hikarie",             nameJa:"渋谷ヒカリエ",                       hasImg:false, emoji:"🏬", color:"#F5F0EB", category:"商業施設" },
  { id:104, name:"Daikanyama Tsutaya Books",    nameJa:"代官山蔦屋書店",                     hasImg:true,  emoji:"📚", color:"#EBF5E1", category:"書店" },
  { id:105, name:"Shibuya Scramble Square",     nameJa:"渋谷スクランブルスクエア",           hasImg:false, emoji:"🌆", color:"#F0EBF5", category:"商業施設" },
  { id:106, name:"Shibuya Park",                nameJa:"渋谷公園",                           hasImg:true,  emoji:"🌳", color:"#E1F5E1", category:"公園" },
  { id:107, name:"Shibuya Mark City",           nameJa:"渋谷マークシティ",                   hasImg:false, emoji:"🏢", color:"#F5EBE1", category:"商業施設" },
  { id:108, name:"Shibuya Fukuras",             nameJa:"渋谷フクラス",                       hasImg:true,  emoji:"🏙️", color:"#EBF0F5", category:"観光" },
  { id:109, name:"Shibuya East Exit Plaza",     nameJa:"渋谷駅東口広場",                     hasImg:false, emoji:"🗺️", color:"#F5F5E1", category:"駅スタンプ" },
  { id:110, name:"Shibuya Stream",              nameJa:"渋谷ストリーム",                     hasImg:true,  emoji:"💧", color:"#E1EBF5", category:"観光" },
  { id:111, name:"Shibuya Bridge",              nameJa:"渋谷ブリッジ",                       hasImg:false, emoji:"🌉", color:"#F5E1EB", category:"観光" },
  { id:112, name:"Shibuya OPA",                 nameJa:"渋谷オーパ",                         hasImg:true,  emoji:"🛍️", color:"#F5F0E1", category:"商業施設" },
  { id:113, name:"Daikanyama Address",          nameJa:"代官山アドレス",                     hasImg:false, emoji:"🏘️", color:"#E1F5F0", category:"商業施設" },
  { id:114, name:"Ebisu Garden Place",          nameJa:"恵比寿ガーデンプレイス",             hasImg:true,  emoji:"🌹", color:"#F5E1F0", category:"美術館" },
  { id:115, name:"Nakameguro Station",          nameJa:"中目黒駅",                           hasImg:false, emoji:"🚆", color:"#EBF5F5", category:"駅スタンプ" },
  { id:116, name:"Shibuya Tourist Info",        nameJa:"渋谷区観光案内所",                   hasImg:true,  emoji:"ℹ️",  color:"#F5EBEB", category:"観光" },
];

// ホットなトレンドタグ（実際はサーバーから取得するイメージ）
const CATEGORIES = [
  { key:"All",              label:"All",                  labelJa:"すべて",          type:"all" },
  { key:"Shibuya",          label:"#Shibuya",             labelJa:"渋谷",            type:"area" },
  { key:"コナンスタンプ",    label:"#ConanStamp",          labelJa:"コナンスタンプ",   type:"rally" },
  { key:"駅スタンプ",        label:"#EkiStamp",            labelJa:"駅スタンプ",      type:"category" },
  { key:"Tokyo",            label:"#Tokyo",               labelJa:"東京",            type:"area" },
  { key:"渋谷駅",            label:"#ShibuyaStation",      labelJa:"渋谷駅",          type:"spot" },
  { key:"Kyoto",            label:"#Kyoto",               labelJa:"京都",            type:"area" },
  { key:"公園",              label:"#Park",                labelJa:"公園",            type:"category" },
  { key:"Osaka",            label:"#Osaka",               labelJa:"大阪",            type:"area" },
  { key:"美術館",            label:"#Museum",              labelJa:"美術館",          type:"category" },
  { key:"Yokohama",         label:"#Yokohama",            labelJa:"横浜",            type:"area" },
  { key:"ドラえもんスタンプ", label:"#DoraemonStamp",       labelJa:"ドラえもんスタンプ", type:"rally" },
  { key:"Sapporo",          label:"#Sapporo",             labelJa:"札幌",            type:"area" },
  { key:"Fukuoka",          label:"#Fukuoka",             labelJa:"福岡",            type:"area" },
];

const RALLY_ITEMS = [
  { id:1, title:"コナンスタンプラリー2027", date:null },
  { id:2, title:"2025/11/17 (Mon)", date:"2025/11/17" },
];

const ARCHIVE_ITEMS = [
  { id:1, hasImg:true }, { id:2, hasImg:false }, { id:3, hasImg:false },
  { id:4, hasImg:false }, { id:5, hasImg:false }, { id:6, hasImg:false },
];

// ══════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════
const S = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --red:#E8452A; --red-dark:#C43520; --red-bg:#FEF0ED;
  --gray-50:#F7F7F5; --gray-100:#EBEBEB; --gray-200:#D8D8D5; --gray-400:#9B9B97;
  --gray-600:#6B6B67; --gray-800:#2C2C2A;
  --white:#FFFFFF; --text:#1A1A18; --text2:#6B6B67; --text3:#9B9B97;
  --border:#E0DFDB;
  --r-sm:8px; --r-md:12px; --r-lg:16px;
  --sh-sm:0 1px 4px rgba(0,0,0,.06);
  --sh-md:0 4px 16px rgba(0,0,0,.10);
  --sh-lg:0 8px 32px rgba(0,0,0,.14);
}
body{font-family:'Noto Sans JP',sans-serif;background:#E8E8E4}

.frame{
  width:390px;height:844px;background:var(--white);
  margin:0 auto;position:relative;overflow:hidden;
  display:flex;flex-direction:column;
  border-radius:0;box-shadow:var(--sh-lg)
}

/* ── NAV ── */
.bnav{
  position:fixed;bottom:0;left:50%;transform:translateX(-50%);
  width:min(390px, 100%);
  display:flex;align-items:flex-start;
  background:var(--white);
  border-top:1px solid var(--border);
  padding:12px 0;padding-bottom:calc(12px + env(safe-area-inset-bottom));z-index:999
}
.nbtn{
  flex:1;display:flex;flex-direction:column;align-items:center;
  gap:0;cursor:pointer;background:none;border:none;
  color:var(--text3);font-size:11px;font-family:inherit;transition:color .2s;
  padding:0
}
.nbtn.active{color:var(--red)}
.nbtn-icon{width:24px;height:24px;margin-bottom:4px}

/* ── SEARCH BAR ── */
.sbar{
  position:absolute;top:16px;left:16px;right:16px;z-index:20;
  display:flex;align-items:center;gap:10px;
  background:var(--white);border-radius:12px;
  padding:10px 14px;box-shadow:var(--sh-md)
}
.sbar input{
  border:none;background:none;flex:1;font-size:15px;
  font-family:inherit;color:var(--text);outline:none
}
.sbar input::placeholder{color:var(--text3)}

/* ── FAB ── */
/* Stamp update badge */
.stamp-updater{
  display:flex;align-items:center;gap:6px;
  padding:8px 12px;
  background:var(--gray-50);border-radius:8px;
  margin-top:8px
}
.stamp-updater-avatar{
  width:24px;height:24px;border-radius:50%;
  background:var(--gray-200);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:11px;color:var(--text2);font-weight:700
}
.stamp-updater-info{flex:1;min-width:0}
.stamp-updater-name{font-size:12px;font-weight:500;color:var(--text)}
.stamp-updater-date{font-size:11px;color:var(--text3);margin-top:1px}

.stamp-update-badge{
  display:inline-flex;align-items:center;gap:4px;
  padding:3px 8px;border-radius:20px;
  background:#FFF8E1;color:#F57F17;
  font-size:11px;font-weight:700;
  border:1px solid #EB4B24
}
.pin-update-dot{
  position:absolute;top:-3px;right:-3px;
  width:10px;height:10px;border-radius:50%;
  background:#EB4B24;border:2px solid #fff;
  z-index:2
}
.map-filter-btn-update{
  position:relative
}

/* Bookmark */
.bookmark-btn{
  background:none;border:none;cursor:pointer;
  padding:4px;display:flex;align-items:center;justify-content:center;
  transition:transform .15s
}
.bookmark-btn:active{transform:scale(.85)}
.map-filter-bar{
  position:absolute;top:72px;left:0;right:0;
  display:flex;gap:6px;z-index:20;
  overflow-x:auto;scrollbar-width:none;
  flex-wrap:nowrap;
  padding:0 16px;
}
.map-filter-bar::-webkit-scrollbar{display:none}
.map-filter-btn{
  padding:6px 14px;border-radius:20px;font-size:12px;
  font-family:inherit;border:none;cursor:pointer;
  background:var(--white);color:var(--text2);
  box-shadow:var(--sh-sm);transition:all .15s;white-space:nowrap;
  display:flex;align-items:center;gap:4px;font-weight:500
}
.map-filter-btn.on{background:var(--red);color:#fff}
.saved-panel{
  position:absolute;bottom:68px;left:0;right:0;
  background:var(--white);
  border-radius:var(--r-lg) var(--r-lg) 0 0;
  box-shadow:0 -4px 20px rgba(0,0,0,.12);
  max-height:360px;overflow-y:auto;
  transform:translateY(0);transition:transform .3s cubic-bezier(.4,0,.2,1);z-index:29
}
.saved-panel.hidden{transform:translateY(110%)}
.saved-panel-hd{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 16px 10px;border-bottom:1px solid var(--border);
  position:sticky;top:0;background:var(--white);z-index:5
}
.saved-panel-hd h3{font-size:15px;font-weight:700;color:var(--text)}
.saved-panel-close{background:none;border:none;cursor:pointer;color:var(--text3);font-size:20px}
.saved-item{
  display:flex;align-items:center;gap:12px;
  padding:12px 16px;border-bottom:1px solid var(--gray-50);
  cursor:pointer;transition:background .15s
}
.saved-item:active{background:var(--gray-50)}
.saved-item-icon{
  width:40px;height:40px;border-radius:8px;
  background:var(--red-bg);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;font-size:18px
}
.saved-item-info{flex:1;min-width:0}
.saved-item-info h4{font-size:13px;font-weight:500;color:var(--text);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.saved-item-info p{font-size:11px;color:var(--text2);margin-top:2px}
.saved-empty{padding:32px 16px;text-align:center;color:var(--text3);font-size:13px}

.fab{
  position:fixed;bottom:calc(90px + env(safe-area-inset-bottom));right:max(20px, calc(50vw - 175px));
  width:52px;height:52px;border-radius:50%;
  background:var(--red);color:var(--white);
  border:none;cursor:pointer;font-size:26px;
  display:flex;align-items:center;justify-content:center;
  line-height:1;padding:0 0 4px 0;
  box-shadow:var(--sh-md);z-index:50;transition:transform .15s
}
.fab:active{transform:scale(.94)}

/* ══════ HOME ══════ */
.home-screen{flex:1;overflow-y:auto;padding-bottom:88px;background:var(--white)}
.home-search{
  display:flex;align-items:center;gap:10px;margin:0;
  background:var(--white);padding:16px 16px 12px;
  position:sticky;top:0;z-index:10;border-bottom:1px solid var(--gray-50);
  box-sizing:border-box;width:100%;overflow:hidden
}
.home-search-box{
  display:flex;align-items:center;gap:8px;flex:1;
  background:var(--gray-50);border-radius:10px;padding:9px 12px;
  min-width:0;box-sizing:border-box
}
.home-search-box input{
  border:none;background:none;flex:1;font-size:14px;
  font-family:inherit;color:var(--text);outline:none
}
.home-search-box input::placeholder{color:var(--text3)}

.cats{
  display:flex;gap:4px;
  padding:10px 16px;
  overflow-x:auto;scrollbar-width:none;
  align-items:center
}
.cats::-webkit-scrollbar{display:none}
.cat-pill{
  padding:5px 12px;border-radius:20px;font-size:13px;
  font-family:inherit;border:none;
  background:none;cursor:pointer;color:var(--text2);white-space:nowrap;
  transition:all .15s;flex-shrink:0;font-weight:400
}
.cat-pill.on{background:var(--red);color:#fff;padding:4px 12px 6px;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:500}

/* Masonry-style 2-col grid — Figma: frame width 361px, centered */
.masonry-wrap{
  padding:8px 16px
}
.masonry{
  display:flex;
  gap:8px;
  align-items:flex-start
}
.masonry-col{
  display:flex;flex-direction:column;
  gap:24px;
  flex:1;min-width:0
}
.m-cell{
  cursor:pointer;
  display:flex;flex-direction:column;gap:8px
}
.m-cell-img{
  width:100%;
  border-radius:8px;
  overflow:hidden;
  background:var(--gray-100);
  flex-shrink:0
}
.m-cell-img img{
  width:100%;height:100%;object-fit:cover;display:block
}
.m-cell-label{
  font-size:11px;font-weight:400;
  color:var(--text2);
  line-height:1.4;
  padding:0;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis
}

/* ══════ MAP ══════ */
.map-screen{flex:1;position:relative;overflow:hidden;height:calc(844px - 68px)}
.map-canvas{position:absolute;inset:0;background:#E8EEF4}

.map-pin{
  position:absolute;transform:translate(-50%,-100%);
  cursor:pointer;transition:transform .15s;border:none;background:none;padding:0
}
.map-pin:hover{transform:translate(-50%,-112%)}
.pin-body{
  width:36px;height:42.478px;display:flex;align-items:flex-start;
  justify-content:center;position:relative
}
.pin-drop{
  width:36px;height:36px;border-radius:50% 50% 50% 0;
  transform:rotate(-45deg);
  display:flex;align-items:center;justify-content:center;
  border:2.5px solid var(--white);box-shadow:var(--sh-md)
}
.pin-drop.red{background:var(--red)}
.pin-inner{transform:rotate(45deg);color:#fff;display:flex;align-items:center;justify-content:center}

/* bottom sheet */
.bsheet{
  position:fixed;bottom:calc(90px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:min(390px,100%);
  display:flex;justify-content:center;
  z-index:60;padding:0 16px
}
.bsheet.hidden{display:none}
.bsheet-card{
  width:361px;
  background:#FCFCFC;
  border-radius:8px;
  padding:16px 16px 16px;
  display:flex;flex-direction:column;
  gap:16px;
  box-shadow:var(--sh-md)
}
.bsheet-top{display:flex;gap:14px;align-items:flex-start}
.bsheet-thumb{
  width:72px;height:72px;border-radius:8px;
  background:var(--red-bg);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  overflow:hidden;font-size:10px;color:var(--red)
}
.bsheet-info{flex:1;min-width:0;overflow:visible;width:0}
.bsheet-info h3{font-size:14px;font-weight:700;color:var(--text);line-height:1.4;word-break:break-all;white-space:normal;overflow-wrap:break-word}
.bsheet-info p{font-size:12px;color:var(--text2);margin-top:2px}
.checkin-count{display:flex;align-items:center;gap:4px;font-size:12px;color:#37383A;margin-top:4px}
.sheet-comment{font-size:12px;color:var(--text);line-height:1.5}
.sclose{
  background:#FCFCFC;border:none;
  cursor:pointer;color:var(--text3);font-size:18px;
  width:28px;height:28px;display:flex;align-items:center;justify-content:center;
  border-radius:50%;flex-shrink:0
}

/* ══════ OVERLAY ══════ */
.overlay{
  position:absolute;top:0;left:0;right:0;bottom:0;background:var(--white);
  z-index:200;overflow-y:auto;overflow-x:clip;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;
  display:none
}
.overlay.open{display:flex;flex-direction:column;}

.ov-maparea{height:220px;background:#E8EEF4;position:relative;overflow:hidden}
.ov-sbar{
  position:absolute;top:12px;left:12px;right:12px;
  display:flex;align-items:center;gap:8px;
  background:var(--white);border-radius:10px;
  padding:8px 12px;box-shadow:var(--sh-sm)
}
.ov-sbar span{font-size:14px;color:var(--text3)}
.ov-back{
  position:absolute;top:10px;left:10px;background:none;
  border:none;cursor:pointer;color:var(--text2);font-size:22px;line-height:1
}

.ov-body{
  width:100%;max-width:393px;
  padding:0 16px 28px;
  display:flex;flex-direction:column;
  align-items:center;
  gap:12px;
  box-sizing:border-box;
  background:var(--white);
  border-radius:8px 8px 0 0;
}
.ov-name{font-size:18px;font-weight:700;color:var(--text);margin-top:40px}
.ov-sub{font-size:13px;color:var(--text2);margin-top:-8px}
.change-loc{font-size:12px;color:var(--red);margin-top:4px;cursor:pointer;display:block}

.input-card{
  background:var(--white);border:1px solid var(--border);
  border-radius:var(--r-md);padding:14px;margin-top:16px;
  box-sizing:border-box;width:100%
}
.input-card textarea{
  width:100%;border:none;background:none;resize:none;
  font-family:inherit;font-size:16px;color:var(--text);
  outline:none;min-height:60px;line-height:1.6
}
.input-card textarea::placeholder{color:var(--text3)}
.media-row{display:flex;gap:14px;margin-top:8px;padding-top:8px;border-top:1px solid var(--gray-50)}
.mbtn{
  background:none;border:none;cursor:pointer;color:var(--text2);
  display:flex;align-items:center;padding:4px;border-radius:6px;transition:background .15s
}
.mbtn:hover{background:var(--gray-50)}
.prev-wrap{margin-top:10px;position:relative;display:inline-block}
.prev-rm{
  position:absolute;top:-6px;right:-6px;
  width:18px;height:18px;background:#616168;
  color:#fff;border-radius:50%;border:none;cursor:pointer;
  font-size:11px;display:flex;align-items:center;justify-content:center
}

.limited-wrap{
  padding:14px 0;
}
.limited-toggle-row{
  display:flex;align-items:center;justify-content:space-between
}
.limited-toggle-row label{font-size:14px;color:var(--text);display:flex;align-items:center;gap:6px}
.limited-badge{
  display:inline-flex;align-items:center;gap:3px;
  padding:2px 8px;border-radius:20px;
  background:#FFF3E0;color:#E65100;
  font-size:11px;font-weight:700;letter-spacing:.02em
}
.toggle-switch{
  position:relative;width:44px;height:26px;cursor:pointer
}
.toggle-switch input{opacity:0;width:0;height:0;position:absolute}
.toggle-track{
  position:absolute;inset:0;border-radius:13px;
  background:var(--gray-200);transition:background .2s
}
.toggle-switch input:checked + .toggle-track{background:var(--red)}
.toggle-thumb{
  position:absolute;top:3px;left:3px;
  width:20px;height:20px;border-radius:50%;
  background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);
  transition:transform .2s
}
.toggle-switch input:checked ~ .toggle-thumb{transform:translateX(18px)}
.limited-dates{
  display:flex;align-items:center;gap:8px;justify-content:flex-end;background:var(--white);width:100%;
  margin-top:12px;flex-wrap:wrap
}
.limited-date-field{display:flex;flex-direction:column;gap:4px;flex:1;min-width:120px}
.limited-date-label{font-size:11px;color:var(--text3);font-weight:500;letter-spacing:.03em}
.limited-date-input{
  border:1px solid var(--border);border-radius:8px;
  padding:8px 10px;font-size:13px;font-family:inherit;
  color:var(--text);outline:none;background:var(--white);
  transition:border-color .15s;width:100%
}
.limited-date-input:focus{border-color:var(--gray-400);background:var(--white)}
.limited-sep{color:var(--text3);font-size:13px;padding-top:20px}

.vis-row{
  display:flex;align-items:center;justify-content:space-between;
  padding:16px 0;
  box-sizing:border-box;width:100%
}
.vis-row label{font-size:14px;color:var(--text)}
.vis-tog{display:flex;border-radius:20px;overflow:hidden;border:1px solid var(--border)}
.vtbtn{
  padding:6px 16px;font-size:13px;border:none;cursor:pointer;
  font-family:inherit;background:none;color:var(--text2);transition:all .15s
}
.vtbtn.on{background:#616168;color:#fff}

.submit-btn{
  width:100%;padding:16px;background:#616168;color:#fff;
  border:none;border-radius:14px;font-size:16px;font-weight:700;
  font-family:inherit;cursor:pointer;margin-top:8px;letter-spacing:.05em;
  transition:opacity .15s
}
.submit-btn:active{opacity:.85}

.detail-meta{
  background:var(--gray-50);border-radius:var(--r-md);
  padding:14px;margin-top:20px;display:flex;flex-direction:column;gap:10px
}
.mrow{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--text2)}
.mic{color:var(--red);flex-shrink:0}

.reviews{margin-top:20px}
.rev-item{display:flex;gap:10px;padding:12px 0;border-bottom:1px solid var(--gray-50)}
.rev-av{
  width:32px;height:32px;border-radius:50%;
  background:var(--gray-100);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;color:var(--text3)
}
.rev-body{flex:1}
.rev-user{font-size:12px;color:var(--text2);font-weight:500}
.rev-date{font-size:11px;color:var(--text3);margin-top:2px}
.rev-text{font-size:13px;color:var(--text);line-height:1.6}

.detail-hero{
  height:220px;
  border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  font-size:13px;color:var(--text2);overflow:hidden;position:relative
}
.detail-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}

/* ══════ MYPAGE ══════ */
.mypage-screen{flex:1;overflow-y:auto;padding-bottom:120px;background:var(--white);height:calc(844px - 68px)}
.profile-hd{padding:28px 16px 0}
.prof-row{display:flex;align-items:center;gap:15px;align-self:stretch}
.avatar{
  width:72px;height:72px;border-radius:50%;
  background:var(--gray-100);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;
  color:var(--text3);flex-shrink:0
}
.stats{display:flex;flex:1;justify-content:space-around}
.stat{text-align:center}
.snum{font-size:18px;font-weight:700;color:var(--text);display:block}
.slbl{font-size:11px;color:var(--text2)}
.prof-info{margin-top:14px;display:flex;flex-direction:row;align-items:flex-end;width:100%;padding:0}
.prof-name{font-size:16px;font-weight:700;color:var(--text)}
.prof-bio{font-size:13px;color:var(--text2);margin-top:4px;line-height:1.6}
.edit-btn{
  width:32px;height:32px;border-radius:50%;
  background:none;border:1px solid var(--border);
  cursor:pointer;color:var(--text2);
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0
}

/* View toggle tabs */
.view-tabs{
  display:flex;
  align-items:flex-start;
  justify-content:flex-start;
  gap:0;
  width:361px;
  height:32px;
  margin:20px auto 0;
  padding:0;
  border-bottom:1px solid var(--border);
}
.vtab{
  flex:1;display:flex;align-items:flex-start;justify-content:center;
  height:32px;
  cursor:pointer;background:none;border:none;
  color:var(--text3);border-bottom:2px solid transparent;
  transition:all .15s;font-family:inherit;padding:0
}
.vtab.on{color:#5D5D5D;border-bottom-color:#5D5D5D}

/* Grid view */
.photo-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:12px;padding:0 16px}
.gcell{
  aspect-ratio:1;background:var(--gray-100);
  overflow:hidden;cursor:pointer;position:relative;
  border-radius:8px;
  display:flex;align-items:center;justify-content:center
}
.gcell img{width:100%;height:100%;object-fit:cover;display:block}

/* List view */
.list-view{display:flex;flex-direction:column;gap:8px;margin-top:12px;padding:0 16px}
.list-card{
  background:var(--gray-100);border-radius:8px;
  padding:0;cursor:pointer;overflow:hidden;
  height:120px;position:relative;
  display:flex;align-items:flex-end
}
.list-card-label{
  position:relative;z-index:2;
  padding:12px 16px;font-size:14px;font-weight:700;color:var(--text);
  background:linear-gradient(to top,rgba(255,255,255,.9) 70%,transparent);
  width:100%
}

/* Archive overlay */
.spot-posts{margin-top:20px}
.spot-post-card{
  background:var(--gray-50);border-radius:8px;
  padding:14px;margin-bottom:12px
}
.spot-post-header{
  display:flex;align-items:center;gap:10px;margin-bottom:10px
}
.spot-post-avatar{
  width:32px;height:32px;border-radius:50%;
  background:var(--gray-200);flex-shrink:0;
  display:flex;align-items:center;justify-content:center
}
.spot-post-meta h4{font-size:13px;font-weight:500;color:var(--text)}
.spot-post-meta p{font-size:11px;color:var(--text3);margin-top:1px}
.spot-post-text{font-size:13px;color:var(--text);line-height:1.6;margin-bottom:10px}
.spot-post-imgs{
  display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;
  margin:0
}
.spot-post-imgs::-webkit-scrollbar{display:none}
.spot-post-img{
  width:100px;height:80px;border-radius:8px;
  background:var(--red-bg);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:32px;cursor:pointer;overflow:hidden
}
.spot-post-img:active{opacity:.8}
.spot-empty{
  padding:24px 16px;text-align:center;
  color:var(--text3);font-size:13px
}

/* Photo viewer overlay */
.photo-viewer{
  position:absolute;inset:0;background:rgba(0,0,0,.92);
  z-index:500;display:flex;align-items:center;justify-content:center;
  flex-direction:column;gap:12px
}
.photo-viewer-img{
  width:340px;height:340px;border-radius:12px;
  background:var(--red-bg);display:flex;align-items:center;
  justify-content:center;font-size:80px;overflow:hidden
}
.photo-viewer-close{
  position:absolute;top:20px;right:20px;
  background:rgba(255,255,255,.15);border:none;cursor:pointer;
  color:#fff;width:36px;height:36px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;font-size:20px
}
.photo-viewer-nav{
  display:flex;gap:24px;align-items:center
}
.photo-nav-btn{
  background:rgba(255,255,255,.2);border:none;cursor:pointer;
  color:#fff;width:40px;height:40px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;font-size:20px
}
.photo-nav-btn:disabled{opacity:.3}
.photo-viewer-counter{color:rgba(255,255,255,.7);font-size:13px}
.photo-viewer-caption{color:#fff;font-size:13px;text-align:center;padding:0 24px;line-height:1.5}

.profile-edit-overlay{
  position:absolute;top:0;left:0;right:0;bottom:0;background:var(--white);
  z-index:998;
  display:none;
  flex-direction:column
}
.profile-edit-overlay.open{display:flex}
.pe-hd{
  display:flex;align-items:center;gap:12px;
  padding:16px;border-bottom:1px solid var(--border);
  position:sticky;top:0;background:var(--white);z-index:10
}
.pe-hd h2{font-size:16px;font-weight:700;flex:1}
.pe-save{
  background:var(--red);color:#fff;border:none;
  border-radius:8px;padding:7px 16px;font-size:14px;
  font-weight:700;font-family:inherit;cursor:pointer
}
.pe-body{padding:24px 16px;flex:1;overflow-y:auto}
.pe-avatar-area{
  display:flex;flex-direction:column;align-items:center;
  gap:10px;margin-bottom:28px
}
.pe-avatar{
  width:80px;height:80px;border-radius:50%;
  background:var(--gray-100);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;
  color:var(--text3);position:relative;cursor:pointer
}
.pe-avatar-edit{
  position:absolute;bottom:0;right:0;
  width:24px;height:24px;border-radius:50%;
  background:var(--red);color:#fff;
  display:flex;align-items:center;justify-content:center;font-size:12px
}
.pe-change-photo{font-size:13px;color:var(--red);cursor:pointer}
.pe-field{margin-bottom:20px}
.pe-label{font-size:12px;color:var(--text3);font-weight:500;
  margin-bottom:6px;display:block;letter-spacing:.03em}
.pe-input{
  width:100%;border:1px solid var(--border);border-radius:10px;
  padding:12px 14px;font-size:15px;font-family:inherit;
  color:var(--text);outline:none;transition:border-color .15s
}
.pe-input:focus{border-color:var(--red)}
.pe-textarea{
  width:100%;border:1px solid var(--border);border-radius:10px;
  padding:12px 14px;font-size:15px;font-family:inherit;
  color:var(--text);outline:none;resize:none;
  min-height:80px;line-height:1.6;transition:border-color .15s
}
.pe-textarea:focus{border-color:var(--red)}
.pe-divider{height:1px;background:var(--border);margin:8px 0 20px}

.arc-overlay{
  position:absolute;top:0;left:0;right:0;bottom:0;background:var(--white);
  z-index:300;overflow-y:auto;
  display:none
}
.arc-overlay.open{display:block}

/* Group detail overlay */
.group-overlay{
  position:absolute;top:0;left:0;right:0;bottom:0;background:var(--white);
  z-index:310;overflow-y:auto;
  display:none
}
.group-overlay.open{display:block}
.group-hd{
  display:flex;align-items:center;gap:12px;
  padding:16px;border-bottom:1px solid var(--border);
  position:sticky;top:0;background:var(--white);z-index:10
}
.group-hd h2{font-size:16px;font-weight:700;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.group-count{font-size:12px;color:var(--text3)}
.group-masonry{
  display:flex;gap:8px;
  padding:12px 16px;
  align-items:flex-start
}
.group-col{display:flex;flex-direction:column;gap:8px;flex:1;min-width:0}
.group-cell{
  cursor:pointer;position:relative
}
.group-cell-img{
  width:100%;display:flex;align-items:center;
  justify-content:center;font-size:36px;
  border-radius:8px;overflow:hidden
}
.group-cell-label{
  padding:6px 2px;font-size:11px;color:var(--text2);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  background:var(--white)
}
.arc-hd{
  display:flex;align-items:center;gap:12px;
  padding:16px;border-bottom:1px solid var(--border);
  position:sticky;top:0;background:var(--white);z-index:10
}
.arc-hd h2{font-size:16px;font-weight:700;flex:1}
.arc-back{background:none;border:none;cursor:pointer;color:var(--text2);display:flex}
.arc-img{
  width:100%;height:260px;background:var(--red-bg);
  border-radius:8px;
  display:flex;align-items:center;justify-content:center;font-size:80px
}
.arc-body{padding:20px 16px}
.arc-spot{font-size:17px;font-weight:700;color:var(--text)}
.arc-sub{font-size:13px;color:var(--text2);margin-top:3px}
.arc-date{font-size:12px;color:var(--text3);margin-top:6px}
.arc-note{font-size:14px;color:var(--text);line-height:1.7;margin-top:14px}
.tag-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:14px}
.tag{padding:4px 12px;background:var(--red-bg);color:var(--red-dark);border-radius:20px;font-size:12px}

/* Folder create modal */
.modal-backdrop{
  position:absolute;inset:0;background:rgba(0,0,0,.3);
  z-index:400;display:flex;align-items:flex-end
}
.modal-sheet{
  background:var(--white);width:100%;
  border-radius:20px 20px 0 0;
  padding:0 0 40px;
  box-shadow:0 -4px 24px rgba(0,0,0,.08);
  max-height:80vh;overflow-y:auto
}
.modal-sheet-hd{
  display:flex;align-items:center;justify-content:space-between;
  padding:18px 16px 14px;
  border-bottom:1px solid var(--border)
}
.modal-sheet-hd h3{font-size:16px;font-weight:700;color:var(--text)}
.modal-sheet-hd button{
  background:none;border:none;cursor:pointer;
  color:var(--text3);font-size:20px;line-height:1;
  width:28px;height:28px;display:flex;align-items:center;justify-content:center;
  border-radius:50%
}
.modal-body{padding:20px 16px 0}
.modal-field-label{
  font-size:11px;font-weight:500;color:var(--text3);
  letter-spacing:.05em;margin-bottom:6px;display:block
}
.modal-input{
  width:100%;border:1px solid var(--border);border-radius:10px;
  padding:12px 14px;font-size:15px;font-family:inherit;
  color:var(--text);outline:none;margin-bottom:20px;
  background:var(--gray-50);transition:border-color .15s,background .15s
}
.modal-input:focus{border-color:var(--gray-400);background:var(--white)}
.modal-type-row{display:flex;gap:8px;margin-bottom:24px}
.modal-type-btn{
  flex:1;padding:10px 8px;border-radius:10px;
  border:1px solid var(--border);
  background:var(--gray-50);cursor:pointer;font-size:13px;font-family:inherit;
  color:var(--text2);transition:all .15s;
  display:flex;flex-direction:column;align-items:center;gap:4px
}
.modal-type-btn span.type-emoji{font-size:20px}
.modal-type-btn span.type-label{font-size:12px}
.modal-type-btn.on{
  border-color:var(--gray-800);background:#616168;
  color:#fff;font-weight:500
}
.modal-actions{display:flex;gap:8px}
.modal-cancel{
  flex:1;padding:14px;border-radius:12px;
  border:1px solid var(--border);
  background:none;cursor:pointer;font-size:14px;
  font-family:inherit;color:var(--text2);
  transition:background .15s
}
.modal-cancel:active{background:var(--gray-50)}
.modal-ok{
  flex:2;padding:14px;border-radius:12px;border:none;
  background:var(--red);color:#fff;cursor:pointer;
  font-size:14px;font-weight:700;font-family:inherit;
  transition:opacity .15s
}
.modal-ok:active{opacity:.85}

/* New checkin search overlay *//* Map nearby search overlay */
.nearby-overlay{
  position:absolute;top:0;left:0;right:0;bottom:0;background:var(--white);
  z-index:240;
  display:none;
  flex-direction:column
}
.nearby-overlay.open{display:flex}
.nearby-search-top{
  padding:16px 16px 8px;
  background:var(--white);
  border-bottom:1px solid var(--border)
}
.nearby-search-input{
  display:flex;align-items:center;gap:10px;
  background:var(--gray-50);border-radius:10px;
  padding:10px 14px;
}
.nearby-search-input input{
  border:none;background:none;flex:1;font-size:14px;
  font-family:inherit;color:var(--text);outline:none
}
.nearby-search-input input::placeholder{color:var(--text3)}
.nearby-back{
  background:none;border:none;cursor:pointer;
  color:var(--text2);display:flex;padding:0;margin-bottom:12px;
  align-items:center;gap:6px;font-size:14px;font-family:inherit
}
.nearby-list{flex:1;overflow-y:auto;padding:8px 16px 100px}
.nearby-item{
  display:flex;align-items:center;gap:12px;
  padding:12px 0;border-bottom:1px solid var(--gray-50);
  cursor:pointer;transition:background .15s
}
.nearby-item:active{background:var(--gray-50)}
.nearby-icon{
  width:44px;height:44px;border-radius:50%;
  background:var(--red-bg);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;font-size:20px
}
.nearby-info{flex:1;min-width:0}
.nearby-info h4{font-size:14px;font-weight:500;color:var(--text);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nearby-info p{font-size:12px;color:var(--text2);margin-top:2px}
.nearby-dist{
  font-size:12px;color:var(--red);font-weight:500;
  display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0
}
.nearby-dist span{font-size:10px;color:var(--text3);font-weight:400}
.nearby-section-label{
  font-size:11px;color:var(--text3);font-weight:500;
  padding:12px 0 4px;letter-spacing:.05em;text-transform:uppercase
}

/* New checkin search overlay */
.new-ci-overlay{
  position:absolute;top:0;left:0;right:0;bottom:0;background:var(--white);
  z-index:250;overflow-y:auto;
  display:none
}
.new-ci-overlay.open{display:block}
.new-ci-hd{
  display:flex;align-items:center;gap:12px;
  padding:16px;border-bottom:1px solid var(--border);
  position:sticky;top:0;background:var(--white);z-index:10
}
.new-ci-hd h2{font-size:16px;font-weight:700;flex:1}
.spot-search-box{
  display:flex;align-items:center;gap:10px;
  background:var(--gray-50);border-radius:10px;
  padding:10px 14px;margin:14px 16px 8px;
}
.spot-search-box input{
  border:none;background:none;flex:1;font-size:14px;
  font-family:inherit;color:var(--text);outline:none
}
.spot-search-box input::placeholder{color:var(--text3)}
.spot-list{padding:0 16px 100px}
.spot-list-item{
  display:flex;align-items:center;gap:12px;
  padding:12px 0;border-bottom:1px solid var(--gray-50);
  cursor:pointer;transition:background .15s
}
.spot-list-item:hover{background:var(--gray-50)}
.spot-list-icon{
  width:40px;height:40px;border-radius:50%;
  background:var(--red-bg);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;font-size:18px
}
.spot-list-info{flex:1;min-width:0}
.spot-list-info h4{font-size:14px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.spot-list-info p{font-size:12px;color:var(--text2);margin-top:2px}
.spot-list-count{font-size:12px;color:var(--text3);display:flex;align-items:center;gap:3px}

/* Toast */
.toast{
  position:absolute;bottom:96px;left:50%;transform:translateX(-50%) translateY(16px);
  background:#616168;color:#fff;
  padding:10px 22px;border-radius:24px;font-size:13px;
  opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;
  white-space:nowrap;z-index:400
}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.toast.ok{background:var(--red)}

::-webkit-scrollbar{width:0}
`;

// ══════════════════════════════════════════════
// SVG MAP BG
// ══════════════════════════════════════════════
function MapBg({ h = 700 }) {
  return (
    <svg width="390" height={h} viewBox={`0 0 390 ${h}`} preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg" style={{position:"absolute",inset:0}}>
      <rect width="390" height={h} fill="#E8EEF4"/>
      <rect width="390" height={h} fill="#DDE5EE" opacity=".4"/>
      <path d="M60,50 L340,50" stroke="#fff" strokeWidth="14" fill="none"/>
      <path d="M190,0 L190,700" stroke="#fff" strokeWidth="18" fill="none"/>
      <path d="M100,140 L300,140" stroke="#fff" strokeWidth="12" fill="none"/>
      <path d="M40,230 L360,230" stroke="#fff" strokeWidth="16" fill="none"/>
      <path d="M270,50 L270,700" stroke="#fff" strokeWidth="14" fill="none"/>
      <path d="M80,140 L80,350" stroke="#fff" strokeWidth="10" fill="none"/>
      <path d="M130,0 L80,350" stroke="#e8edf2" strokeWidth="7" fill="none"/>
      <path d="M160,230 L200,700" stroke="#e8edf2" strokeWidth="9" fill="none"/>
      <rect x="120" y="160" width="80" height="65" rx="4" fill="#D0DBE5" opacity=".7"/>
      <rect x="215" y="155" width="55" height="55" rx="4" fill="#D0DBE5" opacity=".6"/>
      <rect x="25" y="250" width="55" height="50" rx="4" fill="#D0DBE5" opacity=".5"/>
      <rect x="300" y="100" width="60" height="80" rx="4" fill="#D0DBE5" opacity=".55"/>
      <ellipse cx="196" cy={h-40} rx="70" ry="30" fill="#C5D3DF" opacity=".8"/>
    </svg>
  );
}

// ══════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════
// ピンSVGコンポーネント
const PinSVG = ({ color = "#EB4B24", width = 24, height = 29 }) => (
  <svg width={width} height={height} viewBox="0 0 36 43" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 0C27.9411 0 36 8.05887 36 18C36 23.1107 33.8698 27.7235 30.4492 31H30.5L27.0996 34.0479C24.5371 36.3453 22.1635 38.8451 20.001 41.5225C18.9715 42.7971 17.0285 42.7971 15.999 41.5225C13.8365 38.8451 11.4629 36.3453 8.90039 34.0479L5.5 31H5.55078C2.13023 27.7235 0 23.1107 0 18C0 8.05887 8.05887 0 18 0Z" fill={color}/>
    <mask id="mask0_pin" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="10" y="10" width="16" height="16">
      <rect x="10" y="10" width="16" height="16" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask0_pin)">
      <path d="M12.6667 24.6667V20.6667C12.6667 20.3 12.7972 19.9861 13.0583 19.725C13.3194 19.4639 13.6333 19.3333 14 19.3333H22C22.3667 19.3333 22.6805 19.4639 22.9417 19.725C23.2028 19.9861 23.3333 20.3 23.3333 20.6667V24.6667H12.6667ZM14 22H22V20.6667H14V22ZM18 19.3333L14.6667 14.6667C14.6667 13.7445 14.9917 12.9583 15.6417 12.3083C16.2917 11.6583 17.0778 11.3333 18 11.3333C18.9222 11.3333 19.7083 11.6583 20.3583 12.3083C21.0083 12.9583 21.3333 13.7445 21.3333 14.6667L18 19.3333Z" fill="white"/>
    </g>
  </svg>
);
const CheckedPinSVG = ({ width = 27, height = 32 }) => (
  <svg width={width} height={height} viewBox="0 0 27 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 0C20.9558 0 27 6.04416 27 13.5C27 17.333 25.4023 20.7926 22.8369 23.25H22.875L20.3252 25.5361C18.4034 27.2591 16.6228 29.1337 15.001 31.1416C14.2288 32.0976 12.7712 32.0976 11.999 31.1416C10.3772 29.1337 8.59661 27.2591 6.6748 25.5361L4.125 23.25H4.16309C1.59767 20.7926 0 17.333 0 13.5C0 6.04416 6.04416 0 13.5 0Z" fill="#A5EB24"/>
    <mask id="mask0_ci" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="7" y="7" width="13" height="13">
      <rect x="7.5" y="7.5" width="12" height="12" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask0_ci)">
      <path d="M12.8 16.05L16.325 12.525L15.625 11.825L12.8 14.65L11.375 13.225L10.675 13.925L12.8 16.05ZM13.5 18.75C12.8083 18.75 12.1583 18.6187 11.55 18.3562C10.9417 18.0937 10.4125 17.7375 9.9625 17.2875C9.5125 16.8375 9.15625 16.3083 8.89375 15.7C8.63125 15.0917 8.5 14.4417 8.5 13.75C8.5 13.0583 8.63125 12.4083 8.89375 11.8C9.15625 11.1917 9.5125 10.6625 9.9625 10.2125C10.4125 9.7625 10.9417 9.40625 11.55 9.14375C12.1583 8.88125 12.8083 8.75 13.5 8.75C14.1917 8.75 14.8417 8.88125 15.45 9.14375C16.0583 9.40625 16.5875 9.7625 17.0375 10.2125C17.4875 10.6625 17.8437 11.1917 18.1062 11.8C18.3687 12.4083 18.5 13.0583 18.5 13.75C18.5 14.4417 18.3687 15.0917 18.1062 15.7C17.8437 16.3083 17.4875 16.8375 17.0375 17.2875C16.5875 17.7375 16.0583 18.0937 15.45 18.3562C14.8417 18.6187 14.1917 18.75 13.5 18.75Z" fill="white"/>
    </g>
  </svg>
);
const CheckCircleSVG = ({ active = false }) => (
  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="mask_cc" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="0" y="0" width="12" height="12">
      <rect width="12" height="12" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask_cc)">
      <path d="M5.3 8.3L8.825 4.775L8.125 4.075L5.3 6.9L3.875 5.475L3.175 6.175L5.3 8.3ZM6 11C5.30833 11 4.65833 10.8687 4.05 10.6062C3.44167 10.3437 2.9125 9.9875 2.4625 9.5375C2.0125 9.0875 1.65625 8.55833 1.39375 7.95C1.13125 7.34167 1 6.69167 1 6C1 5.30833 1.13125 4.65833 1.39375 4.05C1.65625 3.44167 2.0125 2.9125 2.4625 2.4625C2.9125 2.0125 3.44167 1.65625 4.05 1.39375C4.65833 1.13125 5.30833 1 6 1C6.69167 1 7.34167 1.13125 7.95 1.39375C8.55833 1.65625 9.0875 2.0125 9.5375 2.4625C9.9875 2.9125 10.3437 3.44167 10.6062 4.05C10.8687 4.65833 11 5.30833 11 6C11 6.69167 10.8687 7.34167 10.6062 7.95C10.3437 8.55833 9.9875 9.0875 9.5375 9.5375C9.0875 9.9875 8.55833 10.3437 7.95 10.6062C7.34167 10.8687 6.69167 11 6 11Z" fill={active?"#fff":"#808080"}/>
    </g>
  </svg>
);
const BookmarkSVG = ({ active = false, size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="mask_bm" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="0" y="0" width="12" height="12">
      <rect width="12" height="12" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask_bm)">
      <path d="M2.5 10.5V2.5C2.5 2.225 2.59792 1.98958 2.79375 1.79375C2.98958 1.59792 3.225 1.5 3.5 1.5H8.5C8.775 1.5 9.01042 1.59792 9.20625 1.79375C9.40208 1.98958 9.5 2.225 9.5 2.5V10.5L6 9L2.5 10.5Z" fill={active ? "#fff" : "#808080"}/>
    </g>
  </svg>
);
const UpdateSVG = ({ active = false }) => (
  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="mask_upd" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="0" y="0" width="12" height="12">
      <rect width="12" height="12" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask_upd)">
      <path d="M8.5 0.5C9.33333 0.5 10.0417 0.791667 10.625 1.375C11.2083 1.95833 11.5 2.66667 11.5 3.5C11.5 4.33333 11.2083 5.04167 10.625 5.625C10.0417 6.20833 9.33333 6.5 8.5 6.5C7.66667 6.5 6.95833 6.20833 6.375 5.625C5.79167 5.04167 5.5 4.33333 5.5 3.5C5.5 2.66667 5.79167 1.95833 6.375 1.375C6.95833 0.791667 7.66667 0.5 8.5 0.5ZM8.55 7.5125C8.79167 7.5125 9.02708 7.4875 9.25625 7.4375C9.48542 7.3875 9.70833 7.31667 9.925 7.225C9.75 8.31667 9.24583 9.21875 8.4125 9.93125C7.57917 10.6438 6.60833 11 5.5 11C4.875 11 4.28958 10.8813 3.74375 10.6438C3.19792 10.4063 2.72292 10.0854 2.31875 9.68125C1.91458 9.27708 1.59375 8.80208 1.35625 8.25625C1.11875 7.71042 1 7.125 1 6.5C1 5.39167 1.35625 4.42083 2.06875 3.5875C2.78125 2.75417 3.68333 2.25 4.775 2.075C4.68333 2.3 4.61458 2.53333 4.56875 2.775C4.52292 3.01667 4.5 3.25833 4.5 3.5C4.51667 4.61667 4.91667 5.56458 5.7 6.34375C6.48333 7.12292 7.43333 7.5125 8.55 7.5125Z" fill={active?"#fff":"#808080"}/>
    </g>
  </svg>
);
const Ic = {
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  User: ({s=16}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Edit: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Grid: ({active}) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="mg1" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#D9D9D9"/></mask>
      <g mask="url(#mg1)">
        <path d="M13 13H21V19C21 19.55 20.8042 20.0208 20.4125 20.4125C20.0208 20.8042 19.55 21 19 21H13V13ZM13 11V3H19C19.55 3 20.0208 3.19583 20.4125 3.5875C20.8042 3.97917 21 4.45 21 5V11H13ZM11 11H3V5C3 4.45 3.19583 3.97917 3.5875 3.5875C3.97917 3.19583 4.45 3 5 3H11V11ZM11 13V21H5C4.45 21 3.97917 20.8042 3.5875 20.4125C3.19583 20.0208 3 19.55 3 19V13H11Z" fill={active?"#5D5D5D":"#C9C9C9"}/>
      </g>
    </svg>
  ),
  List: ({active}) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="ml1" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#D9D9D9"/></mask>
      <g mask="url(#ml1)">
        <path d="M9 20H20C20.55 20 21.0208 19.8042 21.4125 19.4125C21.8042 19.0208 22 18.55 22 18V16H9V20ZM2 8H7V4H4C3.45 4 2.97917 4.19583 2.5875 4.5875C2.19583 4.97917 2 5.45 2 6V8ZM2 14H7V10H2V14ZM4 20H7V16H2V18C2 18.55 2.19583 19.0208 2.5875 19.4125C2.97917 19.8042 3.45 20 4 20ZM9 14H22V10H9V14ZM9 8H22V6C22 5.45 21.8042 4.97917 21.4125 4.5875C21.0208 4.19583 20.55 4 20 4H9V8Z" fill={active?"#5D5D5D":"#C9C9C9"}/>
      </g>
    </svg>
  ),
  Clock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mic"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Pin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mic"><path d="M20 10c0 6-8 13-8 13S4 16 4 10a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Stamp: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8H6a4 4 0 000 8h12a4 4 0 000-8z"/></svg>,
  Photo: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Camera: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Back: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>,
  // Nav icons
  NavTimeline: ({a}) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="m1" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#D9D9D9"/></mask>
      <g mask="url(#m1)">
        <path d="M13 13H21V19C21 19.55 20.8042 20.0208 20.4125 20.4125C20.0208 20.8042 19.55 21 19 21H13V13ZM13 11V3H19C19.55 3 20.0208 3.19583 20.4125 3.5875C20.8042 3.97917 21 4.45 21 5V11H13ZM11 11H3V5C3 4.45 3.19583 3.97917 3.5875 3.5875C3.97917 3.19583 4.45 3 5 3H11V11ZM11 13V21H5C4.45 21 3.97917 20.8042 3.5875 20.4125C3.19583 20.0208 3 19.55 3 19V13H11Z" fill={a?"#EB4B24":"#808080"}/>
      </g>
    </svg>
  ),
  NavMap: ({a}) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="mask_nm" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="#D9D9D9"/>
      </mask>
      <g mask="url(#mask_nm)">
        <path d="M12 12C12.55 12 13.0208 11.8042 13.4125 11.4125C13.8042 11.0208 14 10.55 14 10C14 9.45 13.8042 8.97917 13.4125 8.5875C13.0208 8.19583 12.55 8 12 8C11.45 8 10.9792 8.19583 10.5875 8.5875C10.1958 8.97917 10 9.45 10 10C10 10.55 10.1958 11.0208 10.5875 11.4125C10.9792 11.8042 11.45 12 12 12ZM12 22C9.31667 19.7167 7.3125 17.5958 5.9875 15.6375C4.6625 13.6792 4 11.8667 4 10.2C4 7.7 4.80417 5.70833 6.4125 4.225C8.02083 2.74167 9.88333 2 12 2C14.1167 2 15.9792 2.74167 17.5875 4.225C19.1958 5.70833 20 7.7 20 10.2C20 11.8667 19.3375 13.6792 18.0125 15.6375C16.6875 17.5958 14.6833 19.7167 12 22Z" fill={a?"#EB4B24":"#808080"}/>
      </g>
    </svg>
  ),
  NavUser: ({a}) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="mask_nu" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="#D9D9D9"/>
      </mask>
      <g mask="url(#mask_nu)">
        <path d="M9.175 10.825C8.39167 10.0417 8 9.1 8 8C8 6.9 8.39167 5.95833 9.175 5.175C9.95833 4.39167 10.9 4 12 4C13.1 4 14.0417 4.39167 14.825 5.175C15.6083 5.95833 16 6.9 16 8C16 9.1 15.6083 10.0417 14.825 10.825C14.0417 11.6083 13.1 12 12 12C10.9 12 9.95833 11.6083 9.175 10.825ZM4 20V17.2C4 16.6333 4.14583 16.1125 4.4375 15.6375C4.72917 15.1625 5.11667 14.8 5.6 14.55C6.63333 14.0333 7.68333 13.6458 8.75 13.3875C9.81667 13.1292 10.9 13 12 13C13.1 13 14.1833 13.1292 15.25 13.3875C16.3167 13.6458 17.3667 14.0333 18.4 14.55C18.8833 14.8 19.2708 15.1625 19.5625 15.6375C19.8542 16.1125 20 16.6333 20 17.2V20H4Z" fill={a?"#EB4B24":"#808080"}/>
      </g>
    </svg>
  ),
  // Stamp person pin icon
  StampPerson: ({s=18}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="white" stroke="none">
      <circle cx="12" cy="6" r="3.5"/>
      <path d="M5 20c0-4 3.1-7 7-7s7 3 7 7" strokeWidth="0"/>
      <rect x="8" y="16" width="8" height="3" rx="1" fill="white" opacity=".9"/>
    </svg>
  ),
};

// ══════════════════════════════════════════════
// APP
// ══════════════════════════════════════════════
export default function App() {
  const [tab, setTab]             = useState("home");
  const [selSpot, setSelSpot]     = useState(null);
  const [overlay, setOverlay]     = useState(null); // "form"|"detail"
  const [ciText, setCiText]       = useState("");
  const [ciVis, setCiVis]         = useState("public");
  const [ciCat, setCiCat]         = useState("");
  const [ciLimited, setCiLimited]   = useState(false);
  const [ciDateFrom, setCiDateFrom] = useState("");
  const [ciDateTo, setCiDateTo]     = useState("");
  const [ciHours, setCiHours] = useState("");
  const [ciLocation, setCiLocation] = useState("");
  const [showSpotEdit, setShowSpotEdit] = useState(false);
  const [savedSpots, setSavedSpots] = useState([]);
  const [mapFilter, setMapFilter]   = useState("all"); // "all"|"saved"|"checkedin"
  const [showSaved, setShowSaved]   = useState(false);
  const [hasPrev, setHasPrev]     = useState(false);
  const [ciPhotos, setCiPhotos] = useState([]);
  const [checkins, setCheckins]   = useState(200);
  const [viewMode, setViewMode]   = useState("grid"); // "grid"|"list"
  const [selArc, setSelArc]       = useState(null);
  const [selGroup, setSelGroup]   = useState(null); // {title, items[]}
  const [archives, setArchives]   = useState([
    {id:1, spot:"渋谷ちかみち総合インフォメーション", sub:"観光案内所　東京都渋谷区", date:"2025/11/17 12:17", note:"周辺に4つほどスタンプがあります。状態もとても良く、可愛く押せました〜！", emoji:"🏮", hasImg:true,  color:"#E1F5EE", category:"観光",   tags:["渋谷","観光"]},
    {id:2, spot:"渋谷駅",                             sub:"鉄道駅　東京都渋谷区",     date:"2025/11/16 10:30", note:"今日は渋谷からスタンプ集め開始！",                                       emoji:"🚉", hasImg:false, color:"#EBF0F5", category:"駅スタンプ", tags:["渋谷","駅"]},
    {id:3, spot:"渋谷ヒカリエ",                       sub:"商業施設　東京都渋谷区",   date:"2025/11/15 14:00", note:"3Fインフォメーション横。スタンプ状態良好！",                             emoji:"🏬", hasImg:true,  color:"#F5F0EB", category:"商業施設", tags:["渋谷","商業施設"]},
    {id:4, spot:"代官山蔦屋書店",                     sub:"書店　東京都渋谷区",       date:"2025/11/14 11:20", note:"1号館入口付近。可愛いスタンプが押せました！",                           emoji:"📚", hasImg:false, color:"#EBF5E1", category:"書店",   tags:["代官山","書店"]},
    {id:5, spot:"渋谷公園",                           sub:"公園　東京都渋谷区",       date:"2025/11/13 09:45", note:"天気がいいな〜 スタンプもきれいに押せた",                               emoji:"🌳", hasImg:true,  color:"#E1F5E1", category:"公園",   tags:["渋谷","公園"]},
    {id:6, spot:"渋谷スクランブルスクエア",           sub:"商業施設　東京都渋谷区",   date:"2025/11/12 16:30", note:"展望台近くに設置。景色も最高！",                                         emoji:"🌆", hasImg:false, color:"#F0EBF5", category:"商業施設", tags:["渋谷","展望台"]},
  ]);
  const [catSel, setCatSel]       = useState("All");
  const [searchQ, setSearchQ]     = useState("");
  const [newCiOpen, setNewCiOpen] = useState(false);
  const [spotSearch, setSpotSearch] = useState("");
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [nearbySearch, setNearbySearch] = useState("");
  const [nearbyGeoResults, setNearbyGeoResults] = useState([]);
const [nearbyGeoLoading, setNearbyGeoLoading] = useState(false);
  const [geoResults, setGeoResults] = useState([]);
const [geoLoading, setGeoLoading] = useState(false);
const [sessionToken] = useState(()=>crypto.randomUUID());
const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [photoViewer, setPhotoViewer] = useState(null);
  const [profile, setProfile] = useState({
    name:"NameNameName", location:"東京都在住", bio:"スタンプ収集歴5年"
  });
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState({name:"",location:"",bio:""}); // {posts:[], postIdx:0, imgIdx:0}
  const [folders, setFolders]       = useState([
    { id:1, title:"Conan Stamp Rally 2027", type:"rally", ids:[] },
  ]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName]   = useState("");
  const [folderPhotos, setFolderPhotos] = useState([]); // mock photo list
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [toast, setToast]         = useState({msg:"",type:""});
  const [toastOn, setToastOn]     = useState(false);
useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setUser(session?.user ?? null);
      if(session?.user) loadCheckins(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user ?? null);
      if(session?.user) loadCheckins(session.user.id);
      else setArchives([]);
    });
    return () => subscription.unsubscribe();
  },[]);

  const loadCheckins = async (userId) => {
    const { data, error } = await supabase
      .from("checkins")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if(error || !data) return;
    setArchives(data.map(d=>({
      id: d.id,
      spot: d.spot_name,
      sub: `${d.category||""}　${d.area||""}`,
      date: d.created_at?.slice(0,16).replace("T"," ").replace(/-/g,"/"),
      note: d.note||"",
      emoji: d.emoji||"🏮",
      hasImg: (d.photo_urls||[]).length>0,
      photos: d.photo_urls||[],
      color: d.color||"#E1F5EE",
      category: d.category||"",
      tags: [],
      limited: d.limited||false,
      dateFrom: d.date_from||"",
      dateTo: d.date_to||"",
      lat: d.lat,
      lng: d.lng,
    })));
  };
  const showToast = (msg, type="") => {
    setToast({msg,type}); setToastOn(true);
    setTimeout(()=>setToastOn(false), 2200);
  };
const searchGeo = async (q) => {
    setSpotSearch(q);
    if(q.trim().length < 2){ setGeoResults([]); return; }
    setGeoLoading(true);
    try {
      const res = await fetch(`/api/places?q=${encodeURIComponent(q)}${userLocation ? `&lat=${userLocation.lat}&lng=${userLocation.lng}` : ""}`);
      const data = await res.json();
      setGeoResults(data.predictions || []);
    } catch(e) {
      setGeoResults([]);
    } finally {
      setGeoLoading(false);
    }
  };
  const openForm = (spot) => { setSelSpot(spot); setCiText(""); setHasPrev(false); setCiCat(""); setCiLimited(false); setCiDateFrom(""); setCiDateTo(""); setCiHours(spot.hours||""); setCiLocation(""); setShowSpotEdit(!isCheckedIn(spot)); setOverlay("form"); };
  const openDetail = (spot) => { setSelSpot(spot); setOverlay("detail"); };
  const closeOv = () => setOverlay(null);

  const submit = async () => {
    if(!user){ showToast("ログインが必要です"); return; }

    // 写真をSupabase Storageにアップロード
    const photoUrls = [];
    for(const p of ciPhotos){
      const ext = p.file?.name?.split(".").pop() || "jpg";
      const path = `checkins/${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("photos").upload(path, p.file);
      if(!error){
        const { data } = supabase.storage.from("photos").getPublicUrl(path);
        photoUrls.push(data.publicUrl);
      }
    }

    // Supabaseに保存
    const { data, error } = await supabase.from("checkins").insert({
      user_id: user.id,
      spot_name: selSpot.name,
      spot_id: String(selSpot.id||""),
      category: selSpot.category||"",
      area: selSpot.area||"",
      lat: selSpot.lat,
      lng: selSpot.lng,
      note: ciText||"チェックイン！",
      photo_urls: photoUrls,
      emoji: "🏮",
      color: "#E1F5EE",
      limited: ciLimited,
      date_from: ciDateFrom||null,
      date_to: ciDateTo||null,
    }).select().single();
    // スポット情報を更新
    if(ciHours||ciLocation){
      await supabase.from("spots").upsert({
        id: String(selSpot.id||selSpot.name),
        name: selSpot.name,
        hours: ciHours||"",
        location: ciLocation||"",
      }, { onConflict:"id" });
    }

    if(!error && data){
      setArchives(a=>[{
        id: data.id,
        spot: data.spot_name,
        sub: `${data.category}　${data.area}`,
        date: data.created_at?.slice(0,16).replace("T"," ").replace(/-/g,"/"),
        note: data.note,
        emoji: data.emoji,
        hasImg: photoUrls.length>0,
        photos: photoUrls,
        color: data.color,
        category: data.category,
        tags: [],
        limited: data.limited,
        dateFrom: data.date_from||"",
        dateTo: data.date_to||"",
        lat: data.lat,
        lng: data.lng,
      },...a]);
      setCheckins(c=>c+1);
    }
    setOverlay(null); setSelSpot(null); setCiPhotos([]);
    showToast(error?"保存に失敗しました":"チェックイン完了！", error?"":"ok");
  };

  const switchTab = (t) => { setTab(t); setOverlay(null); setSelSpot(null); };
  const toggleSave = (spot) => {
    setSavedSpots(s=>
      s.find(x=>x.id===spot.id)
        ? s.filter(x=>x.id!==spot.id)
        : [...s, spot]
    );
  };
  const isSaved = (spot) => savedSpots.some(x=>x.id===spot.id);
  const isCheckedIn = (spot) => archives.some(a=>a.spot===spot.name);
  // スタンプ更新日が自分の最終訪問より新しいか
  const isExpired = (spot) => {
  if(!spot.limited || !spot.dateTo) return false;
  return new Date(spot.dateTo) < new Date();
};
　const isStampUpdated = (spot) => {
    if(!spot.stampUpdatedAt) return false;
    const myVisits = archives.filter(a=>a.spot===spot.name);
    if(myVisits.length===0) return false; // 未訪問は対象外
    const lastVisit = myVisits.map(a=>a.date.slice(0,10)).sort().reverse()[0];
    return spot.stampUpdatedAt > lastVisit;
  };
  const updatedCount = MAP_SPOTS.filter(s=>isStampUpdated(s)).length;

  // ── render ──
  return (
    <>
      <style>{S}</style>
      <div className="frame">

        {/* ════ HOME ════ */}
        {tab==="home" && (
          <div className="home-screen">
            {/* Sticky header */}
            <div className="home-search">
              <div className="home-search-box">
                <Ic.Search/>
                <input placeholder="Search Stamp / スタンプ検索" value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
              </div>
            </div>

            {/* Timeline */}
            {(()=>{
              // モックタイムラインデータ
              const TIMELINE_MOCK = [
                { id:201, spot:"渋谷ちかみち総合インフォメーション", category:"観光案内所", area:"東京都渋谷区", date:"2025/11/17 12:17", dateKey:"2025/11/17", dateLabel:"2025/11/17 (Mon)", emoji:"🏮", color:"#E1F5EE", note:"今日は渋谷からスタンプ集め開始！", hasImg:true },
                { id:202, spot:"渋谷公園", category:"公園", area:"東京都渋谷区", date:"2025/11/17 12:17", dateKey:"2025/11/17", dateLabel:"2025/11/17 (Mon)", emoji:"🌳", color:"#E1F5E1", note:"天気がいいな〜", hasImg:false },
                { id:203, spot:"渋谷駅", category:"鉄道駅", area:"東京都渋谷区", date:"2025/11/16 10:00", dateKey:"2025/11/16", dateLabel:"2025/11/16 (Sun)", emoji:"🚉", color:"#EBF0F5", note:"今日は渋谷からスタンプ集め開始！", hasImg:true },
              ];

              // archivesをタイムライン形式に変換してマージ
              const arcItems = archives.map(a=>({
                id: a.id,
                spot: a.spot,
                category: a.sub||"",
                area: "",
                date: a.date,
                dateKey: a.date?.slice(0,10)||"",
                dateLabel: (()=>{
                  const d = new Date(a.date?.slice(0,10));
                  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                  return `${a.date?.slice(0,10).replace(/-/g,"/")} (${days[d.getDay()]})`;
                })(),
                emoji: a.emoji||"🏮",
                color: a.color||"var(--gray-100)",
                note: a.note||"",
                hasImg: a.hasImg||false,
                photos: a.photos||[],
              }));

              const allItems = [...arcItems, ...TIMELINE_MOCK];
              const filtered = searchQ.trim()===""
                ? allItems
                : allItems.filter(item=>
                    item.spot.includes(searchQ) || item.note.includes(searchQ)
                  );

              // 日付でグループ化
              const groups = [];
              const seen = {};
              filtered.forEach(item=>{
                if(!seen[item.dateKey]){
                  seen[item.dateKey] = true;
                  groups.push({ dateKey: item.dateKey, dateLabel: item.dateLabel, items: [] });
                }
                groups.find(g=>g.dateKey===item.dateKey).items.push(item);
              });

              if(filtered.length===0) return (
                <div style={{padding:"48px 24px",textAlign:"center",color:"var(--text3)",fontSize:14}}>
                  チェックインの記録がありません
                </div>
              );

              return (
                <div style={{padding:"8px 0 100px"}}>
                  {groups.map((group, gi)=>(
                    <div key={group.dateKey}>
                      {/* 日付ヘッダー */}
                      <div style={{padding:"16px 16px 8px",fontSize:14,fontWeight:700,color:"rgba(28,27,31,1)"}}>
                        {group.dateLabel}
                      </div>

                      {/* 投稿リスト */}
                      {group.items.map((item, ii)=>{
                        const matchSpot = MAP_SPOTS.find(s=>s.name===item.spot);
                        return (
                          <div key={item.id}
                            style={{display:"flex",gap:12,padding:"0 16px",cursor:"pointer"}}
                            onClick={()=>{
                              if(matchSpot){ setSelSpot(matchSpot); setOverlay("detail"); }
                            }}>
                            {/* ドット＋縦線 */}
                            <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,width:12}}>
                              <div style={{width:2,background:"transparent",height:8,flexShrink:0}}/>
                              <div style={{width:12,height:12,borderRadius:"50%",background:"#E8452A",flexShrink:0}}/>
                              {ii < group.items.length-1
                                ? <div style={{width:2,flex:1,background:"#EDEDEC",minHeight:16,marginTop:8}}/>
                                : <div style={{height:8,flexShrink:0}}/>
                              }
                            </div>
                            {/* 内容 */}
                            <div style={{flex:1,minWidth:0,paddingTop:6,paddingBottom:16}}>
                              <div style={{fontWeight:700,fontSize:15,color:"rgba(28,27,31,1)",marginBottom:2}}>
                                {item.spot}
                              </div>
                              <div style={{fontSize:12,color:"var(--text3)",marginBottom:8,display:"flex",gap:8}}>
                                {item.category && <span>{item.category}</span>}
                                {item.area && <span>{item.area}</span>}
                                <span>{item.date}</span>
                              </div>
                              {item.note && (
                                <div style={{fontSize:14,color:"rgba(28,27,31,1)",lineHeight:1.6,marginBottom:8}}>
                                  {item.note}
                                </div>
                              )}
                              {item.hasImg && (
                                <div style={{display:"flex",gap:6,marginTop:4,overflowX:"auto"}}>
                                  {(item.photos&&item.photos.length>0) ? item.photos.map((url,i)=>(
                                    <img key={i} src={url} style={{width:"100%",maxWidth:280,height:180,borderRadius:8,objectFit:"cover",flexShrink:0,display:"block"}}/>
                                  )) : (
                                    <div style={{width:"100%",height:180,borderRadius:8,background:item.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:48}}>
                                      {item.emoji}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* セパレーター */}
                      {gi < groups.length-1 && (
                        <div style={{height:1,background:"var(--gray-100)",margin:"8px 0"}}/>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ════ MAP ════ */}
        {tab==="map" && (
          <div className="map-screen">
            <div className="map-canvas">
  <MapView>
    {[...MAP_SPOTS, ...archives
        .filter(a => a.lat && a.lng && !MAP_SPOTS.find(s=>s.name===a.spot))
        .map(a=>({id:"arc-"+a.id, name:a.spot, lat:a.lat, lng:a.lng, category:a.category||"", area:"", checkins:0, hours:"", location:"", reviews:[], comment:a.note||"", stampUpdatedAt:null, stampUpdatedBy:null}))
      ]
      .filter(s=>{
        if(mapFilter==="saved") return isSaved(s);
        if(mapFilter==="checkedin") return isCheckedIn(s);
        if(mapFilter==="updated") return isStampUpdated(s);
        return true;
      })
      .map(s=>{
        const expired = isExpired(s);
        const saved = isSaved(s);
        const checked = isCheckedIn(s);
        const pinColor = expired ? "#F8C2B5" : saved ? "#185FA5" : checked ? "#A5EB24" : "#EB4B24";
        return (
          <MapMarker key={s.id} longitude={s.lng} latitude={s.lat} anchor="bottom"
            onClick={()=>{setSelSpot(s);setShowSaved(false);}}>
            <div style={{position:"relative",cursor:"pointer"}}>
              {isStampUpdated(s) && <div className="pin-update-dot"/>}
              {checked ? <CheckedPinSVG width={selSpot?.id===s.id?36:27} height={selSpot?.id===s.id?43:32}/> : <PinSVG color={pinColor} width={selSpot?.id===s.id?36:24} height={selSpot?.id===s.id?43:29}/>}
            </div>
          </MapMarker>
        );
      })
    }
  </MapView>
</div>

            {/* search */}
            <div className="sbar" style={{position:"absolute",top:16,left:16,right:16}}
              onClick={()=>{
                setNearbyOpen(true);
                setLocLoading(true);
                if(navigator.geolocation){
                  navigator.geolocation.getCurrentPosition(
                    pos=>{ setUserLocation({lat:pos.coords.latitude,lng:pos.coords.longitude}); setLocLoading(false); },
                    ()=>{ setUserLocation({lat:35.6580,lng:139.7016}); setLocLoading(false); }
                  );
                } else { setUserLocation({lat:35.6580,lng:139.7016}); setLocLoading(false); }
              }}>
              <Ic.Search/>
              <input placeholder="Search Stamp / スタンプ検索" readOnly style={{cursor:"pointer"}}/>
            </div>

            

            {/* Filter bar */}
            <div className="map-filter-bar">
              <button className={`map-filter-btn ${mapFilter==="all"?"on":""}`}
                onClick={()=>{setMapFilter("all");setShowSaved(false);}}>
                すべて
              </button>
              <button className={`map-filter-btn ${mapFilter==="saved"?"on":""}`}
                onClick={()=>{setMapFilter("saved");setShowSaved(true);}}>
                <BookmarkSVG active={mapFilter==="saved"} size={14}/> 保存済み{savedSpots.length>0?` (${savedSpots.length})`:""}
              </button>
              <button className={`map-filter-btn ${mapFilter==="checkedin"?"on":""}`}
                onClick={()=>{setMapFilter("checkedin");setShowSaved(false);}}>
                <CheckCircleSVG active={mapFilter==="checkedin"}/>
                チェックイン済み
              </button>
              <button className={`map-filter-btn ${mapFilter==="updated"?"on":""}`}
                onClick={()=>{setMapFilter("updated");setShowSaved(false);}}>
                <UpdateSVG active={mapFilter==="updated"}/> 更新あり
              </button>
            </div>

            {/* FAB */}
            <button className="fab"
              onClick={()=>setNewCiOpen(true)}>+</button>

            {/* bottom sheet */}
            <div className={`bsheet ${selSpot?"":"hidden"}`}>
              {selSpot && (()=>{
                const spotPosts = archives.filter(a=>a.spot===selSpot.name && a.hasImg);
                const allPhotoPosts = [
                  {id:"mock-0", spot:selSpot.name, emoji:"🏮", color:"var(--red-bg)", hasImg:true, note:selSpot.comment, date:""},
                  ...spotPosts
                ];
                return (
                  <div className="bsheet-card" style={{position:"relative"}}
  onTouchStart={e=>{e.currentTarget._startY=e.touches[0].clientY;}}
  onTouchEnd={e=>{
    const diff = e.changedTouches[0].clientY - e.currentTarget._startY;
    if(diff > 60) setSelSpot(null);
  }}>
                   {/* closeボタン */}
<button onClick={()=>setSelSpot(null)}
  style={{position:"absolute",top:12,right:12,
    background:"none",border:"none",cursor:"pointer",
    color:"var(--text3)",fontSize:18,lineHeight:1,
    width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>

                    {/* サムネイル＋情報 */}
                    <div className="bsheet-top">
                      <div className="bsheet-thumb" style={{cursor:"pointer"}}
                        onClick={()=>setPhotoViewer({posts:allPhotoPosts,postIdx:0,imgIdx:0})}>
                        {spotPosts.length>0 && spotPosts[0].photos?.length>0
                          ? <img src={spotPosts[0].photos[0]} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:8}}/>
                          : <div style={{width:"100%",height:"100%",background:"var(--red-bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>🏮</div>
                        }
                      </div>
                      <div className="bsheet-info">
                        <h3 style={{paddingRight:24,lineHeight:1.4,wordBreak:"break-all"}}>{selSpot.name}</h3>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
  <span style={{fontSize:12,color:"var(--text2)"}}>観光案内所</span>
  <span style={{fontSize:12,color:"var(--text2)"}}>{selSpot.area}</span>
</div>
                        <div className="checkin-count"><svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
  <mask id="mask_fp" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="0" y="0" width="11" height="11">
    <rect width="11" height="11" fill="#D9D9D9"/>
  </mask>
  <g mask="url(#mask_fp)">
    <path d="M2.97919 0.458336C3.62849 0.458336 4.13457 0.746704 4.49742 1.32344C4.86026 1.90018 5.04169 2.52847 5.04169 3.20834C5.04169 3.52153 5.00922 3.81945 4.94429 4.10209C4.87936 4.38472 4.80488 4.63681 4.72085 4.85834L1.45523 5.51146C1.34065 5.28993 1.22224 4.98247 1.10002 4.58906C0.977798 4.19566 0.916687 3.73542 0.916687 3.20834C0.916687 2.42153 1.11148 1.7665 1.50106 1.24323C1.89065 0.719968 2.38335 0.458336 2.97919 0.458336ZM3.6094 8.25C3.06703 8.25 2.64499 8.06094 2.34325 7.68281C2.04151 7.30469 1.87155 6.86736 1.83335 6.37084L4.7896 5.775C4.85071 5.90486 4.90801 6.05191 4.96148 6.21615C5.01495 6.38038 5.04169 6.55035 5.04169 6.72604C5.04169 7.16146 4.9061 7.52431 4.63492 7.81459C4.36374 8.10486 4.0219 8.25 3.6094 8.25ZM8.02085 2.75C8.61669 2.75 9.1094 3.01163 9.49898 3.5349C9.88856 4.05816 10.0834 4.7132 10.0834 5.5C10.0834 6.02709 10.0222 6.48733 9.90002 6.88073C9.7778 7.27413 9.6594 7.5816 9.54481 7.80313L6.27919 7.15C6.19516 6.92847 6.12068 6.67639 6.05575 6.39375C5.99082 6.11111 5.95835 5.8132 5.95835 5.5C5.95835 4.82014 6.13978 4.19184 6.50262 3.61511C6.86547 3.03837 7.37155 2.75 8.02085 2.75ZM7.39065 10.5417C6.97815 10.5417 6.63631 10.3965 6.36512 10.1063C6.09394 9.81597 5.95835 9.45313 5.95835 9.01771C5.95835 8.84202 5.98509 8.67205 6.03856 8.50781C6.09203 8.34358 6.14933 8.19653 6.21044 8.06667L9.15523 8.6625C9.11703 9.15903 8.94898 9.59636 8.65106 9.97448C8.35315 10.3526 7.93301 10.5417 7.39065 10.5417Z" fill="#37383A"/>
  </g>
</svg> {selSpot.checkins.toLocaleString()}</div>
                        {selSpot.limited && (
                          <div style={{marginTop:4,display:"flex",alignItems:"center",gap:4}}>
                            <span className="limited-badge">LIMITED</span>
                            {selSpot.dateFrom && <span style={{fontSize:11,color:"var(--text3)"}}>{selSpot.dateFrom} → {selSpot.dateTo||"?"}</span>}
                          </div>
                        )}
                        <p className="sheet-comment">{selSpot.comment}</p>
                        <div style={{display:"flex",gap:8,marginTop:10,alignItems:"center"}}>
                          <button style={{padding:"4px 14px 6px",background:"var(--red)",color:"#fff",border:"none",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}} onClick={()=>openForm(selSpot)}>チェックイン</button>
                          <button style={{padding:"4px 14px 6px",background:"none",color:"var(--red)",border:"1.5px solid var(--red)",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>openDetail(selSpot)}>詳細</button>
                          {/* 保存ボタン */}
                          <button className="bookmark-btn" onClick={()=>toggleSave(selSpot)} title={isSaved(selSpot)?"保存済み":"保存する"}>
                            <svg width="20" height="20" viewBox="0 0 24 24"
                              fill={isSaved(selSpot)?"#616168":"none"}
                              stroke={isSaved(selSpot)?"#616168":"var(--text3)"}
                              strokeWidth="2">
                              <path d="M5 3h14a1 1 0 011 1v17l-7-3-7 3V4a1 1 0 011-1z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            {/* Saved spots panel */}
            <div className={`saved-panel ${showSaved&&mapFilter==="saved"?"":"hidden"}`}>
              <div className="saved-panel-hd">
                <h3>🔖 保存済みスポット ({savedSpots.length})</h3>
                <button className="saved-panel-close" onClick={()=>{setShowSaved(false);setMapFilter("all");}}>×</button>
              </div>
              {savedSpots.length===0
                ? <div className="saved-empty">保存したスポットがここに表示されます<br/><span style={{fontSize:11,marginTop:4,display:"block"}}>ピンを選択してブックマークしましょう</span></div>
                : savedSpots.map(s=>(
                  <div key={s.id} className="saved-item" onClick={()=>{setSelSpot(s);setShowSaved(false);}}>
                    <div className="saved-item-icon">🏮</div>
                    <div className="saved-item-info">
                      <h4>{s.name}</h4>
                      <p>{s.category}　{s.area}</p>
                    </div>
                    <button className="bookmark-btn" onClick={e=>{e.stopPropagation();toggleSave(s);}}>
                      <BookmarkSVG active={true} size={18}/>
                    </button>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ════ MYPAGE ════ */}
        {tab==="mypage" && (
          <div className="mypage-screen">
            {!user && (
              <div style={{padding:"8px 16px 0",textAlign:"right"}}>
            <button onClick={()=>supabase.auth.signInWithOAuth({provider:"google"})}
              style={{background:"none",border:"none",color:"var(--red)",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
              Googleでログイン
            </button>
          </div>
            )}
            {user && (
              <div style={{padding:"8px 16px 0",textAlign:"right"}}>
                <button onClick={()=>supabase.auth.signOut()}
                  style={{background:"none",border:"none",color:"var(--text3)",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                  ログアウト
                </button>
              </div>
            )}
            <div className="profile-hd">
              <div className="prof-row">
                <div className="avatar"><Ic.User s={36}/></div>
                <div className="stats">
                  <div className="stat"><span className="snum">{archives.length}</span><span className="slbl">ポスト</span></div>
                  <div className="stat"><span className="snum">{checkins}</span><span className="slbl">チェックイン</span></div>
                  <div className="stat"><span className="snum">120</span><span className="slbl">いいね</span></div>
                </div>
              </div>
              <div className="prof-info">
                <div style={{flex:1}}>
                  <div className="prof-name">{profile.name}</div>
                  <div className="prof-bio">{profile.location}<br/>{profile.bio}</div>
                </div>
                <button className="edit-btn" onClick={()=>{
                  setEditDraft({name:profile.name,location:profile.location,bio:profile.bio});
                  setProfileEditOpen(true);
                }}><Ic.Edit/></button>
              </div>
            </div>

            {/* フォルダ一覧 */}
            {(()=>{
              const allFolders = [
                { id:"all", title:"All", items: archives },
                ...folders.map(f=>({
                  id: f.id,
                  title: f.title,
                  items: archives.filter(e=>f.ids.includes(e.id))
                }))
              ];
              return (
                <div style={{padding:"20px 16px 100px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {allFolders.map(f=>(
                      <div key={f.id} className="list-card" onClick={()=>setSelGroup({title:f.title,items:f.items})}>
                        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,display:"flex",gap:2,overflow:"hidden",borderRadius:8}}>
                          {(f.items.length>0?f.items:[{emoji:"📁",color:"var(--gray-100)"}]).slice(0,3).map((e,i)=>(
                            <div key={i} style={{flex:1,background:e.color||"var(--red-bg)",display:"flex",
                              alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                              {e.photos&&e.photos.length>0
                                ? <img src={e.photos[0]} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                                : <span style={{fontSize:24,opacity:0.7}}>{e.emoji}</span>
                              }
                            </div>
                          ))}
                        </div>
                        <div className="list-card-label">
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <span style={{fontWeight:700}}>{f.title}</span>
                            <span style={{fontSize:11,color:"var(--text3)"}}>{f.items.length} stamps</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={()=>setShowFolderModal(true)}
                      style={{display:"flex",alignItems:"center",gap:8,padding:"14px",
                        background:"none",border:"1.5px dashed var(--border)",borderRadius:8,
                        cursor:"pointer",color:"var(--text2)",fontSize:13,fontFamily:"inherit",width:"100%"}}>
                      <span style={{fontSize:18,lineHeight:1,width:"100%"}}>＋</span> 
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ════ BOTTOM NAV ════ */}


        {/* ════ CHECKIN FORM OVERLAY ════ */}
        <div className={`overlay ${overlay==="form"?"open":""}`} style={{overflowY:"auto"}}>
          {selSpot && overlay==="form" && <>
            <div className="ov-maparea">
              <Map
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                initialViewState={{
                  longitude: selSpot.lng || 139.7016,
                  latitude: selSpot.lat || 35.6580,
                  zoom: 15,
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/kthhtm/cmptvkv4f006501su5hqm3cp2"
                interactive={false}
              >
                <div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-100%)"}}>
                  <PinSVG color="var(--red)"/>
                </div>
              </Map>
              <button className="ov-back" onClick={closeOv} style={{position:"absolute",top:16,left:16}}>←</button>
            </div>
            <div className="ov-body">
              <div className="ov-name">{selSpot.name}</div>
              <div className="ov-sub">{selSpot.category}　{selSpot.area}</div>
              <span className="change-loc" style={{color:"var(--text3)"}}>位置情報を変更</span>
              <div className="input-card">
                <textarea placeholder="最新情報" value={ciText} onChange={e=>setCiText(e.target.value)}/>
                {ciPhotos.length > 0 && (
                  <div className="prev-wrap" style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {ciPhotos.map((p,i)=>(
                      <div key={i} style={{position:"relative"}}>
                        <img src={p.url} style={{width:90,height:70,borderRadius:8,objectFit:"cover",display:"block"}}/>
                        <button className="prev-rm" onClick={()=>setCiPhotos(ps=>ps.filter((_,pi)=>pi!==i))}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="media-row">
                  <label className="mbtn" style={{cursor:"pointer"}}>
                    <Ic.Photo/>
                    <input type="file" accept="image/*" multiple style={{display:"none"}}
                      onChange={e=>{
                        Array.from(e.target.files).forEach(f=>{
                          const reader = new FileReader();
                          reader.onload = ev => {
                            setCiPhotos(ps=>[...ps,{url:ev.target.result,file:f}]);
                          };
                          reader.readAsDataURL(f);
                        });
                        e.target.value="";
                      }}/>
                  </label>
                  <label className="mbtn" style={{cursor:"pointer"}}>
                    <Ic.Camera/>
                    <input type="file" accept="image/*" capture="environment" style={{display:"none"}}
                      onChange={e=>{
                        const f=e.target.files[0]; if(!f) return;
                        const reader = new FileReader();
                        reader.onload = ev => {
                          setCiPhotos(ps=>[...ps,{url:ev.target.result,file:f}]);
                        };
                        reader.readAsDataURL(f);
                        e.target.value="";
                      }}/>
                  </label>
                </div>
              </div>
              {/* スポット情報入力 */}
              {showSpotEdit && (
                <div style={{width:"100%",boxSizing:"border-box"}}>
                  {!isCheckedIn(selSpot) && (
                    <div style={{fontSize:13,color:"var(--red)",fontWeight:700,marginBottom:12,textAlign:"left"}}>
                      🎉 初めてのチェックイン！スポット情報を登録しましょう
                    </div>
                  )}
                  <div style={{marginBottom:12}}>
                    <label style={{fontSize:12,color:"var(--text3)",fontWeight:500,display:"block",marginBottom:4}}>営業時間</label>
                    <input className="modal-input" placeholder="例：10:00-20:00 / 終日"
                      value={ciHours} onChange={e=>setCiHours(e.target.value)} style={{margin:0,width:"100%",boxSizing:"border-box",background:"#fff"}}/>
                  </div>
                  <div style={{marginBottom:4}}>
                    <label style={{fontSize:12,color:"var(--text3)",fontWeight:500,display:"block",marginBottom:4}}>スタンプ設置場所</label>
                    <input className="modal-input" placeholder="例：入口入って左側"
                      value={ciLocation} onChange={e=>setCiLocation(e.target.value)} style={{margin:0,width:"100%",boxSizing:"border-box",background:"#fff"}}/>
                  </div>
                </div>
              )}
              {isCheckedIn(selSpot) && !showSpotEdit && (
                <div style={{padding:"0 16px",marginBottom:8}}>
                  <button onClick={()=>setShowSpotEdit(true)}
                    style={{fontSize:13,color:"var(--text2)",background:"none",border:"1px solid var(--border)",
                      borderRadius:8,padding:"6px 14px",cursor:"pointer",fontFamily:"inherit"}}>
                    📝 スポット情報を修正する
                  </button>
                </div>
              )}
              {/* 期間限定設定 */}
              <div className="vis-row" style={{marginBottom:"-8px"}}>
                <label>期間限定</label>
                <div className="vis-tog">
                  <button className={`vtbtn ${ciLimited?"on":""}`} onClick={()=>setCiLimited(true)}>ON</button>
                  <button className={`vtbtn ${!ciLimited?"on":""}`} onClick={()=>setCiLimited(false)}>OFF</button>
                </div>
              </div>
              {ciLimited && (
                <div className="limited-dates" style={{marginTop:"-8px"}}>
                  <div className="limited-date-field">
                    <span className="limited-date-label">START</span>
                    <input type="date" className="limited-date-input"
                      value={ciDateFrom} onChange={e=>setCiDateFrom(e.target.value)}/>
                  </div>
                  <span className="limited-sep">→</span>
                  <div className="limited-date-field">
                    <span className="limited-date-label">END</span>
                    <input type="date" className="limited-date-input"
                      value={ciDateTo} onChange={e=>setCiDateTo(e.target.value)}/>
                  </div>
                </div>
              )}
              </div>
              <div className="vis-row" style={{paddingLeft:16,paddingRight:16,width:"100%",boxSizing:"border-box",marginTop:"4px"}}>
                <label>公開範囲</label>
                <div className="vis-tog">
                  <button className={`vtbtn ${ciVis==="public"?"on":""}`} onClick={()=>setCiVis("public")}>公開する</button>
                  <button className={`vtbtn ${ciVis==="private"?"on":""}`} onClick={()=>setCiVis("private")}>自分だけ</button>
                </div>
              </div>
              <button className="submit-btn" onClick={submit} style={{marginTop:40,marginBottom:120,marginLeft:16,marginRight:16,width:"calc(100% - 32px)"}}>チェックイン</button>
          </>}
        </div>


        {/* ════ DETAIL OVERLAY ════ */}
        <div className={`overlay ${overlay==="detail"?"open":""}`} style={{overflowY:"auto"}}>
          {selSpot && overlay==="detail" && (()=>{
            // このスポットへのチェックイン一覧
            const spotPosts = archives.filter(a=>a.spot===selSpot.name);
            // モックレビューも投稿カード形式に変換
            const mockPosts = (selSpot.reviews||[]).filter(r=>r.text).map((r,i)=>({
              id:`mock-${i}`, spot:selSpot.name, note:r.text,
              date:"2025/11/01 10:00", hasImg:false, emoji:"🏮",
              color:"var(--red-bg)", user:r.user||"Anonymous"
            }));
            const allPosts = [...spotPosts, ...mockPosts];
            return <>
              {/* ── ヘッダー: 戻るボタン左上 ── */}
              <div style={{display:"flex",alignItems:"center",padding:"14px 16px 0",position:"sticky",top:0,background:"var(--white)",zIndex:10}}>
                <button className="ov-back" style={{position:"static",background:"none",border:"none",cursor:"pointer",color:"var(--text2)",display:"flex",padding:0}} onClick={closeOv}>
                  <Ic.Back/>
                </button>
              </div>
              {/* ── hero画像 ── */}
              {(()=>{
                const allPhotos = spotPosts.flatMap(p=>p.photos||[]).filter(Boolean);
                console.log("DEBUG photos:", allPhotos);
                return allPhotos.length>0 ? (
                  <>
                    <div style={{position:"relative",height:220,margin:"12px 16px",borderRadius:8,overflow:"hidden"}}>
                      <div style={{display:"flex",overflowX:"scroll",scrollbarWidth:"none",height:"100%",scrollSnapType:"x mandatory"}}>
                        {allPhotos.map((url,i)=>(
                          <div key={i} style={{flexShrink:0,width:"358px",height:"100%",scrollSnapAlign:"start"}}>
                            <img src={url} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:8}}>
                      {allPhotos.map((_,i)=>(
                        <div key={i} style={{width:6,height:6,borderRadius:"50%",background:i===0?"rgba(28,27,31,1)":"rgba(28,27,31,0.3)"}}/>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="detail-hero" style={{height:220,borderRadius:8,margin:"12px 16px"}}>
                      <div style={{position:"absolute",inset:0,background:"var(--red-bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:80}}>🏮</div>
                    </div>
                    <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:8}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:"rgba(28,27,31,1)"}}/>
                    </div>
                  </>
                );
              })()}
              <div className="ov-body" style={{paddingTop:16}}>
                {/* タイトル＋ブックマーク */}
<div style={{display:"flex",alignItems:"flex-start",gap:28,alignSelf:"stretch",width:"100%"}}>
  <div style={{flex:1}}>
    <div className="ov-name">{selSpot.name}</div>
    <div className="ov-sub" style={{display:"flex",gap:8,marginTop:4}}>
      <span>{selSpot.category}</span>
      <span>{selSpot.area}</span>
    </div>
  </div>
  <button className="bookmark-btn" onClick={()=>toggleSave(selSpot)}>
    <BookmarkSVG active={isSaved(selSpot)} size={20}/>
  </button>
</div>
                <div style={{display:"flex",padding:"12px",flexDirection:"column",alignItems:"flex-start",gap:8,alignSelf:"stretch",borderRadius:4,background:"#F6F6F6"}}>
                  <div className="mrow"><Ic.Clock/> {selSpot.hours}</div>
                  <div className="mrow"><Ic.Pin/> {selSpot.location}</div>
                </div>

                {/* 投稿一覧 */}
                <div className="spot-posts" style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:16,alignSelf:"stretch"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span>投稿 ({allPosts.length})</span>
                  </div>
                  {allPosts.length===0
                    ? <div className="spot-empty">まだ投稿がありません<br/>最初にチェックインしてみましょう！</div>
                    : allPosts.map((post,pi)=>(
                      <div key={post.id} className="spot-post-card" style={{display:"flex",alignItems:"flex-start",gap:16,alignSelf:"stretch",background:"none",boxShadow:"none",padding:0}}>
                        <div className="spot-post-avatar"><Ic.User s={14}/></div>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:4,flex:1}}>
                          <div className="spot-post-meta">
                            <h4>{post.user||"You"}</h4>
                            <p>{post.date}</p>
                          </div>
                          {post.note && <p className="spot-post-text">{post.note}</p>}
                          {post.hasImg && (
                            <div className="spot-post-imgs">
                              {(post.photos&&post.photos.length>0 ? post.photos : [null]).map((url,ii)=>(
                                <div key={ii} className="spot-post-img"
                                  style={{background:post.color||"var(--red-bg)"}}
                                  onClick={()=>setPhotoViewer({posts:allPosts,postIdx:pi,imgIdx:ii})}>
                                  {url
                                    ? <img src={url} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                                    : <span style={{fontSize:36}}>{post.emoji}</span>
                                  }
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>

                <button className="submit-btn" style={{marginTop:24}} onClick={()=>setOverlay("form")}>チェックインする</button>

                {/* ── マップ（写真一覧の下） ── */}
                <div style={{marginTop:24,borderRadius:8,overflow:"hidden",height:180,position:"relative"}}>
                  <MapBg h={180}/>
                  <div className="map-pin" style={{position:"absolute",left:"50%",top:"40%",transform:"translate(-50%,-100%)"}}>
<PinSVG color={isCheckedIn(selSpot)?"#2E7D32":isSaved(selSpot)?"#185FA5":"var(--red)"}/>
                  </div>
                  <div style={{position:"absolute",bottom:8,right:8,background:"var(--white)",borderRadius:6,padding:"4px 8px",fontSize:11,color:"var(--text2)",boxShadow:"var(--sh-sm)"}}>
                    {selSpot.area}
                  </div>
                </div>
              </div>
          </>
          })()}
        </div>

        {/* ════ ARCHIVE DETAIL ════ */}
        <div className={`arc-overlay ${selArc?"open":""}`}>
          {selArc && <>
            <div className="arc-hd">
              <button className="arc-back" onClick={()=>setSelArc(null)}><Ic.Back/></button>
              <h2>チェックイン記録</h2>
            </div>
            {selArc.photos && selArc.photos.length > 0 ? (
              <div style={{display:"flex",gap:6,overflowX:"auto",padding:"0 16px"}}>
                {selArc.photos.map((url,i)=>(
                  <img key={i} src={url} style={{width:"100%",maxWidth:340,height:220,borderRadius:8,objectFit:"cover",flexShrink:0,display:"block"}}/>
                ))}
              </div>
            ) : (
              <div className="arc-img">{selArc.emoji}</div>
            )}
            <div className="arc-body">
              <div className="arc-spot">{selArc.spot}</div>
              <div className="arc-sub">{selArc.sub}</div>
              <div className="arc-date">{selArc.date}</div>
              {selArc.limited && (
                <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}>
                  <span className="limited-badge">LIMITED</span>
                  {selArc.dateFrom && <span style={{fontSize:12,color:"var(--text3)"}}>{selArc.dateFrom} → {selArc.dateTo||"未定"}</span>}
                </div>
              )}
              <p className="arc-note">{selArc.note}</p>
              <div className="tag-row">
                {selArc.tags.map(t=><span key={t} className="tag">#{t}</span>)}
              </div>
            </div>
          </>}
        </div>


        {/* ════ NEARBY SEARCH OVERLAY ════ */}
        <div className={`nearby-overlay ${nearbyOpen?"open":""}`}>
          <div className="nearby-search-top">
            <button className="nearby-back" onClick={()=>{setNearbyOpen(false);setNearbySearch("");}}>
              <Ic.Back/> マップに戻る
            </button>
            <div className="nearby-search-input">
              <Ic.Search/>
              <input
                placeholder="場所を検索（例：東京駅）"
                value={nearbySearch}
                onChange={async e=>{
                  const q = e.target.value;
                  setNearbySearch(q);
                  if(q.trim().length < 2){ setNearbyGeoResults([]); return; }
                  setNearbyGeoLoading(true);
                  try {
                    const locParam = userLocation ? "&lat=" + userLocation.lat + "&lng=" + userLocation.lng : "";
                    const res = await fetch("/api/places?q=" + encodeURIComponent(q) + locParam);
                    const data = await res.json();
                    setNearbyGeoResults(data.predictions || []);
                  } catch(e){ setNearbyGeoResults([]); }
                  finally { setNearbyGeoLoading(false); }
                }}
                autoFocus
              />
            </div>
          </div>
          <div className="nearby-list">
            {nearbySearch.trim().length >= 2 ? (
              <>
                {nearbyGeoLoading && <div style={{padding:"24px 16px",textAlign:"center",color:"var(--text3)",fontSize:13}}>検索中...</div>}
                {!nearbyGeoLoading && nearbyGeoResults.map(f=>(
                  <div key={f.place_id} className="nearby-item" onClick={async ()=>{
                    const res = await fetch(`/api/places/details?place_id=${f.place_id}`);
                    const data = await res.json();
                    const result = data.result;
                    if(!result) return;
                    const spot = {
                      id: f.place_id,
                      name: result.name,
                      address: result.formatted_address || "",
                      lat: result.geometry.location.lat,
                      lng: result.geometry.location.lng,
                      category: result.types?.[0] || "場所",
                      area: result.address_components?.find(c=>c.types.includes("locality"))?.long_name || "",
                      checkins: 0, hours: "", location: result.formatted_address || "", reviews: [], comment: "",
                    };
                    const { supabase } = await import("../../lib/supabase");
                    await supabase.from("spots").upsert(spot, { onConflict: "id" });
                    setNearbyOpen(false);
                    setNearbySearch("");
                    setNearbyGeoResults([]);
                    if(window.__mapboxFlyTo) window.__mapboxFlyTo(spot.lng, spot.lat);
                    setSelSpot(spot);
                    setTab("map");
                  }}>
                    <div className="nearby-icon">📍</div>
                    <div className="nearby-info">
                      <h4>{f.structured_formatting?.main_text || f.description}</h4>
                      <p style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.structured_formatting?.secondary_text || f.description}</p>
                    </div>
                  </div>
                ))}
                {!nearbyGeoLoading && nearbyGeoResults.length === 0 && (
                  <div style={{padding:"32px 16px",textAlign:"center",color:"var(--text3)",fontSize:13}}>見つかりませんでした</div>
                )}
              </>
            ) : (
              locLoading ? (
                <div style={{padding:"40px 16px",textAlign:"center",color:"var(--text3)",fontSize:13}}>📍 現在地を取得中...</div>
              ) : (()=>{
                const filtered = MAP_SPOTS
                  .map(s=>({...s, dist: userLocation ? calcDist(userLocation.lat,userLocation.lng,s.lat,s.lng) : null}))
                  .sort((a,b)=> a.dist!=null&&b.dist!=null ? a.dist-b.dist : 0);
                const nearby  = filtered.filter(s=>s.dist!=null && s.dist<=1.0);
                const farther = filtered.filter(s=>s.dist==null || s.dist>1.0);
                return <>
                  {nearby.length>0 && <>
                    <div className="nearby-section-label">📍 近く（1km以内）</div>
                    {nearby.map(s=>(
                      <div key={s.id} className="nearby-item" onClick={()=>{
                        setNearbyOpen(false); setNearbySearch("");
                        if(window.__mapboxFlyTo) window.__mapboxFlyTo(s.lng, s.lat);
                        setSelSpot(s); setTab("map");
                      }}>
                        <div className="nearby-icon">🏮</div>
                        <div className="nearby-info"><h4>{s.name}</h4><p>{s.category}　{s.area}</p></div>
                        <div className="nearby-dist">{s.dist!=null && fmtDist(s.dist)}<span>{s.checkins.toLocaleString()} stamps</span></div>
                      </div>
                    ))}
                  </>}
                  {farther.length>0 && <>
                    <div className="nearby-section-label">{nearby.length>0?"その他のスポット":"すべてのスポット"}</div>
                    {farther.map(s=>(
                      <div key={s.id} className="nearby-item" onClick={()=>{
                        setNearbyOpen(false); setNearbySearch("");
                        if(window.__mapboxFlyTo) window.__mapboxFlyTo(s.lng, s.lat);
                        setSelSpot(s); setTab("map");
                      }}>
                        <div className="nearby-icon">🏮</div>
                        <div className="nearby-info"><h4>{s.name}</h4><p>{s.category}　{s.area}</p></div>
                        <div className="nearby-dist">{s.dist!=null && fmtDist(s.dist)}<span>{s.checkins.toLocaleString()} stamps</span></div>
                      </div>
                    ))}
                  </>}
                </>;
              })()
            )}
          </div>
        </div>


        {/* ════ NEW CHECKIN OVERLAY ════ */}
        <div className={`new-ci-overlay ${newCiOpen?"open":""}`}>
          <div className="new-ci-hd">
            <button className="arc-back" onClick={()=>{setNewCiOpen(false);setSpotSearch("");}}><Ic.Back/></button>
            <h2>スポットを選択</h2>
          </div>
          <div className="spot-search-box">
            <Ic.Search/>
            <input
              placeholder="場所を検索（例：東京タワー）"
              value={spotSearch}
              onChange={e=>searchGeo(e.target.value)}
              autoFocus
            />
          </div>
          <div className="spot-list">
            {geoLoading && (
              <div style={{padding:"24px 16px",textAlign:"center",color:"var(--text3)",fontSize:13}}>検索中...</div>
            )}
            {!geoLoading && geoResults.map(f=>(
              <div key={f.place_id} className="spot-list-item" onClick={async ()=>{
                const detailRes = await fetch(`/api/places/details?place_id=${f.place_id}`);
                const detailData = await detailRes.json();
                const result = detailData.result;
                if(!result) return;
                const spot = {
                  id: f.place_id,
                  name: result.name,
                  address: result.formatted_address || "",
                  lat: result.geometry.location.lat,
                  lng: result.geometry.location.lng,
                  category: result.types?.[0] || "場所",
                  area: result.address_components?.find(c=>c.types.includes("locality"))?.long_name || "",
                };
                spot.checkins = spot.checkins ?? 0;
                spot.hours = spot.hours ?? "";
                spot.location = spot.location ?? spot.address ?? "";
                spot.reviews = spot.reviews ?? [];
                spot.comment = spot.comment ?? "";
                const { supabase } = await import("../../lib/supabase");
                await supabase.from("spots").upsert(spot, { onConflict: "id" });
                setNewCiOpen(false);
                setSpotSearch("");
                setGeoResults([]);
                openForm(spot);
              }}>
                <div className="spot-list-icon">📍</div>
                <div className="spot-list-info">
                  <h4>{f.structured_formatting?.main_text || f.description}</h4>
                  <p style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.structured_formatting?.secondary_text || f.description}</p>
                </div>
              </div>
            ))}
            {!geoLoading && spotSearch.length >= 2 && geoResults.length === 0 && (
              <div style={{padding:"32px 16px",textAlign:"center",color:"var(--text3)",fontSize:13}}>
                見つかりませんでした
              </div>
            )}
            {spotSearch.trim() === "" && (
              <div style={{padding:"32px 16px",textAlign:"center",color:"var(--text3)",fontSize:13}}>
                スポット名や住所で検索してください
              </div>
            )}
          </div>
        </div>





        {/* ════ PROFILE EDIT OVERLAY ════ */}
        <div className={`profile-edit-overlay ${profileEditOpen?"open":""}`}>
          <div className="pe-hd">
            <button className="arc-back" onClick={()=>setProfileEditOpen(false)}><Ic.Back/></button>
            <h2>プロフィール編集</h2>
            <button className="pe-save" onClick={()=>{
              setProfile({...editDraft});
              setProfileEditOpen(false);
              showToast("保存しました","ok");
            }}>保存</button>
          </div>
          <div className="pe-body">
            {/* アバター */}
            <div className="pe-avatar-area">
              <div className="pe-avatar">
                <Ic.User s={40}/>
                <div className="pe-avatar-edit">＋</div>
              </div>
              <span className="pe-change-photo">写真を変更</span>
            </div>

            {/* 名前 */}
            <div className="pe-field">
              <label className="pe-label">NAME</label>
              <input className="pe-input" placeholder="名前を入力"
                value={editDraft.name}
                onChange={e=>setEditDraft(d=>({...d,name:e.target.value}))}/>
            </div>

            {/* 居住地 */}
            <div className="pe-field">
              <label className="pe-label">LOCATION</label>
              <input className="pe-input" placeholder="例：東京都在住"
                value={editDraft.location}
                onChange={e=>setEditDraft(d=>({...d,location:e.target.value}))}/>
            </div>

            <div className="pe-divider"/>

            {/* 自己紹介 */}
            <div className="pe-field">
              <label className="pe-label">BIO</label>
              <textarea className="pe-textarea" placeholder="自己紹介を入力"
                value={editDraft.bio}
                onChange={e=>setEditDraft(d=>({...d,bio:e.target.value}))}/>
            </div>
          </div>
        </div>



        {/* ════ GROUP DETAIL OVERLAY ════ */}
        <div className={`group-overlay ${selGroup?"open":""}`}>
          {selGroup && (()=>{
            const items = selGroup.items.length > 0 ? selGroup.items : archives;
            const leftHeights  = [180,150,200,160,190,155];
            const rightHeights = [155,195,160,185,150,200];
            const left  = items.filter((_,i)=>i%2===0);
            const right = items.filter((_,i)=>i%2===1);
            return <>
              <div className="group-hd">
                <button className="arc-back" onClick={()=>setSelGroup(null)}><Ic.Back/></button>
                <h2>{selGroup.title}</h2>
                <span className="group-count">{items.length} stamps</span>
              </div>
              <div className="group-masonry">
                <div className="group-col">
                  {left.map((e,i)=>(
                    <div key={e.id} className="group-cell" onClick={()=>setSelArc(e)}>
                      <div className="group-cell-img"
                        style={{height:leftHeights[i%leftHeights.length],background:e.color||"var(--gray-100)"}}>
                        {e.hasImg
                          ? <span style={{fontSize:44}}>{e.emoji}</span>
                          : <span style={{fontSize:32,opacity:0.3}}>{e.emoji}</span>
                        }
                      </div>
                      <div className="group-cell-label">{e.spot}</div>
                    </div>
                  ))}
                </div>
                <div className="group-col">
                  {right.map((e,i)=>(
                    <div key={e.id} className="group-cell" onClick={()=>setSelArc(e)}>
                      <div className="group-cell-img"
                        style={{height:rightHeights[i%rightHeights.length],background:e.color||"var(--gray-100)"}}>
                        {e.hasImg
                          ? <span style={{fontSize:44}}>{e.emoji}</span>
                          : <span style={{fontSize:32,opacity:0.3}}>{e.emoji}</span>
                        }
                      </div>
                      <div className="group-cell-label">{e.spot}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>;
          })()}
        </div>

        {/* ════ PHOTO VIEWER ════ */}
        {photoViewer && (()=>{
          const post = photoViewer.posts[photoViewer.postIdx];
          const total = photoViewer.posts.filter(p=>p.hasImg).length;
          const viewablePosts = photoViewer.posts.filter(p=>p.hasImg);
          const curIdx = viewablePosts.findIndex(p=>p.id===post.id);
          return (
            <div className="photo-viewer" onClick={()=>setPhotoViewer(null)}>
              <button className="photo-viewer-close" onClick={()=>setPhotoViewer(null)}>×</button>
              <div className="photo-viewer-img" onClick={e=>e.stopPropagation()}
                style={{background:post.color||"var(--red-bg)"}}>
                <span style={{fontSize:80}}>{post.emoji}</span>
              </div>
              <div className="photo-viewer-nav" onClick={e=>e.stopPropagation()}>
                <button className="photo-nav-btn" disabled={curIdx===0}
                  onClick={()=>{const prev=viewablePosts[curIdx-1];if(prev)setPhotoViewer({...photoViewer,postIdx:photoViewer.posts.findIndex(p=>p.id===prev.id)});}}>‹</button>
                <span className="photo-viewer-counter">{curIdx+1} / {total}</span>
                <button className="photo-nav-btn" disabled={curIdx===total-1}
                  onClick={()=>{const next=viewablePosts[curIdx+1];if(next)setPhotoViewer({...photoViewer,postIdx:photoViewer.posts.findIndex(p=>p.id===next.id)});}}>›</button>
              </div>
              {post.note && <p className="photo-viewer-caption">{post.note}</p>}
              <p style={{color:"rgba(255,255,255,.5)",fontSize:11}}>{post.date}</p>
            </div>
          );
        })()}
{/* ════ FOLDER PICKER ════ */}
        {showFolderPicker && (
          <div className="modal-backdrop" onClick={()=>setShowFolderPicker(false)}>
            <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
              <div className="modal-sheet-hd">
                <h3>フォルダを選択</h3>
                <button onClick={()=>setShowFolderPicker(false)}>×</button>
              </div>
              <div className="modal-body">
                {folders.length===0 && (
                  <div style={{padding:"24px 0",textAlign:"center",color:"var(--text3)",fontSize:13}}>フォルダがありません</div>
                )}
                {folders.map(f=>(
                  <div key={f.id} onClick={()=>{
                    setFolders(fs=>fs.map(folder=>
                      folder.id===f.id
                        ? {...folder, ids:[...new Set([...folder.ids,...selectedIds])]}
                        : folder
                    ));
                    setShowFolderPicker(false);
                    setSelectMode(false);
                    setSelectedIds([]);
                    showToast(`「${f.title}」に追加しました`,"ok");
                  }}
                    style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0",
                      borderBottom:"1px solid var(--gray-50)",cursor:"pointer"}}>
                    <div style={{width:40,height:40,borderRadius:8,background:"var(--gray-100)",
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>📁</div>
                    <div>
                      <div style={{fontSize:14,fontWeight:500,color:"var(--text)"}}>{f.title}</div>
                      <div style={{fontSize:12,color:"var(--text3)",marginTop:2}}>{f.ids.length} stamps</div>
                    </div>
                  </div>
                ))}
                <button onClick={()=>{setShowFolderPicker(false);setShowFolderModal(true);}}
                  style={{marginTop:16,width:"100%",padding:"12px",borderRadius:10,
                    border:"1.5px dashed var(--border)",background:"none",
                    cursor:"pointer",fontSize:13,color:"var(--text2)",fontFamily:"inherit"}}>
                  ＋ 新しいフォルダを作成
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ FOLDER MODAL ════ */}
        {showFolderModal && (
          <div className="modal-backdrop" onClick={()=>setShowFolderModal(false)}>
            <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
              <div className="modal-sheet-hd">
                <h3>新しいフォルダを作成</h3>
                <button onClick={()=>{setShowFolderModal(false);setFolderName("");setFolderPhotos([]);}}>×</button>
              </div>
              <div className="modal-body" style={{paddingBottom:40}}>
                <label className="modal-field-label">FOLDER NAME</label>
                <input className="modal-input" placeholder="フォルダ名を入力..."
                  value={folderName} onChange={e=>setFolderName(e.target.value)}
                  autoFocus/>
                <label className="modal-field-label">チェックインを選択してフォルダに追加</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:24,maxHeight:200,overflowY:"auto"}}>
                  {archives.map(e=>{
                    const selected = folderPhotos.some(p=>p.id===e.id);
                    return (
                      <div key={e.id} onClick={()=>setFolderPhotos(fp=>
                        selected ? fp.filter(p=>p.id!==e.id) : [...fp,e]
                      )} style={{position:"relative",cursor:"pointer",borderRadius:8,overflow:"hidden",
                        height:76,background:e.color||"var(--gray-100)",
                        outline:selected?"2.5px solid var(--red)":"none"}}>
                        {e.photos&&e.photos.length>0
                          ? <img src={e.photos[0]} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                          : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{e.emoji}</div>
                        }
                        {selected && <div style={{position:"absolute",top:4,right:4,width:16,height:16,borderRadius:"50%",background:"var(--red)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>
                        </div>}
                      </div>
                    );
                  })}
                </div>
                <div className="modal-actions">
                  <button className="modal-cancel" onClick={()=>{setShowFolderModal(false);setFolderName("");setFolderPhotos([]);}}>キャンセル</button>
                  <button className="modal-ok" onClick={()=>{
                    if(!folderName.trim()) return;
                    setFolders(f=>[...f,{id:Date.now(),title:folderName.trim(),type:"custom",ids:folderPhotos.map(p=>p.id)}]);
                    setFolderName(""); setFolderPhotos([]); setShowFolderModal(false);
                  }}>作成する</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="bnav">
          <button className={`nbtn ${tab==="home"?"active":""}`} onClick={()=>switchTab("home")}>
            <Ic.NavTimeline a={tab==="home"}/> Timeline
          </button>
          <button className={`nbtn ${tab==="map"?"active":""}`} onClick={()=>switchTab("map")}>
            <Ic.NavMap a={tab==="map"}/> Map
          </button>
          <button className={`nbtn ${tab==="mypage"?"active":""}`} onClick={()=>switchTab("mypage")}>
            <Ic.NavUser a={tab==="mypage"}/> My Page
          </button>
        </nav>

        {/* ════ TOAST ════ */}
        <div className={`toast ${toastOn?"show":""} ${toast.type}`}>{toast.msg}</div>
      </div>
      </>
  );
}
