'use client'
'use client'
import { Marker as MapMarker } from 'react-map-gl/mapbox'
import { useState, useEffect } from "react";
import { supabase } from '../../lib/supabase'
import { SocialLogin } from '@capgo/capacitor-social-login'
import { Capacitor } from '@capacitor/core'
import MapView from './MapView'
import Map from 'react-map-gl/mapbox'
// ══════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════
const MAP_SPOTS = [];

// 2点間の距離計算（km）
function calcDist(lat1,lng1,lat2,lng2){
  const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function fmtDist(km){
  return km<1 ? `${Math.round(km*1000)}m` : `${km.toFixed(1)}km`;
}
const CATEGORY_LABELS = {
  ja: {
    tourist_information_center:"観光案内所", point_of_interest:"観光スポット", establishment:"施設",
    premise:"施設", subpremise:"施設", store:"店舗", shopping_mall:"商業施設", department_store:"百貨店",
    supermarket:"スーパー", convenience_store:"コンビニ", clothing_store:"衣料品店", book_store:"書店",
    restaurant:"レストラン", cafe:"カフェ", bakery:"パン屋", bar:"バー", food:"飲食店",
    museum:"博物館", art_gallery:"ギャラリー", library:"図書館", park:"公園", zoo:"動物園", aquarium:"水族館",
    amusement_park:"遊園地", tourist_attraction:"観光地", place_of_worship:"寺社・教会", shrine:"神社", temple:"寺",
    church:"教会", hindu_temple:"寺院", mosque:"モスク",
    train_station:"駅", transit_station:"駅", subway_station:"駅", bus_station:"バス停", light_rail_station:"駅",
    airport:"空港", parking:"駐車場",
    city_hall:"市役所", local_government_office:"行政施設", post_office:"郵便局", police:"警察署", fire_station:"消防署",
    hospital:"病院", pharmacy:"薬局", doctor:"医療機関",
    lodging:"宿泊施設", hotel:"ホテル", campground:"キャンプ場",
    stadium:"スタジアム", gym:"スポーツ施設", spa:"スパ", beauty_salon:"美容室",
    school:"学校", university:"大学",
    bank:"銀行", atm:"ATM",
    natural_feature:"自然・景観", landmark:"ランドマーク",
    place:"場所",
  },
  en: {
    tourist_information_center:"Tourist Information", point_of_interest:"Point of Interest", establishment:"Establishment",
    premise:"Facility", subpremise:"Facility", store:"Store", shopping_mall:"Shopping Mall", department_store:"Department Store",
    supermarket:"Supermarket", convenience_store:"Convenience Store", clothing_store:"Clothing Store", book_store:"Bookstore",
    restaurant:"Restaurant", cafe:"Cafe", bakery:"Bakery", bar:"Bar", food:"Restaurant",
    museum:"Museum", art_gallery:"Art Gallery", library:"Library", park:"Park", zoo:"Zoo", aquarium:"Aquarium",
    amusement_park:"Amusement Park", tourist_attraction:"Tourist Attraction", place_of_worship:"Place of Worship", shrine:"Shrine", temple:"Temple",
    church:"Church", hindu_temple:"Hindu Temple", mosque:"Mosque",
    train_station:"Station", transit_station:"Station", subway_station:"Station", bus_station:"Bus Stop", light_rail_station:"Station",
    airport:"Airport", parking:"Parking",
    city_hall:"City Hall", local_government_office:"Government Office", post_office:"Post Office", police:"Police Station", fire_station:"Fire Station",
    hospital:"Hospital", pharmacy:"Pharmacy", doctor:"Medical Clinic",
    lodging:"Lodging", hotel:"Hotel", campground:"Campground",
    stadium:"Stadium", gym:"Sports Facility", spa:"Spa", beauty_salon:"Beauty Salon",
    school:"School", university:"University",
    bank:"Bank", atm:"ATM",
    natural_feature:"Natural Feature", landmark:"Landmark",
    place:"Place",
  },
  zh: {
    tourist_information_center:"旅游咨询处", point_of_interest:"景点", establishment:"设施",
    premise:"设施", subpremise:"设施", store:"商店", shopping_mall:"购物中心", department_store:"百货商店",
    supermarket:"超市", convenience_store:"便利店", clothing_store:"服装店", book_store:"书店",
    restaurant:"餐厅", cafe:"咖啡馆", bakery:"面包店", bar:"酒吧", food:"餐厅",
    museum:"博物馆", art_gallery:"美术馆", library:"图书馆", park:"公园", zoo:"动物园", aquarium:"水族馆",
    amusement_park:"游乐园", tourist_attraction:"旅游景点", place_of_worship:"寺社・教堂", shrine:"神社", temple:"寺庙",
    church:"教堂", hindu_temple:"印度教寺庙", mosque:"清真寺",
    train_station:"车站", transit_station:"车站", subway_station:"车站", bus_station:"公交车站", light_rail_station:"车站",
    airport:"机场", parking:"停车场",
    city_hall:"市政厅", local_government_office:"行政机构", post_office:"邮局", police:"警察局", fire_station:"消防局",
    hospital:"医院", pharmacy:"药店", doctor:"诊所",
    lodging:"住宿设施", hotel:"酒店", campground:"露营地",
    stadium:"体育场", gym:"运动设施", spa:"水疗中心", beauty_salon:"美容院",
    school:"学校", university:"大学",
    bank:"银行", atm:"ATM",
    natural_feature:"自然景观", landmark:"地标",
    place:"地点",
  },
};

// heightsパターン (左列・右列でずらす)
const LEFT_HEIGHTS  = [196, 160, 210, 150, 180, 200, 155, 175, 205, 165];
const RIGHT_HEIGHTS = [150, 200, 155, 195, 165, 145, 210, 160, 180, 190];

// 多言語UI辞書（ユーザー入力データは対象外。日本語がデフォルト/フォールバック）
const T = {
  guestUser:            { ja:"ゲスト", en:"Guest", zh:"游客" },
  loginRequired:        { ja:"ログインが必要です", en:"Please log in", zh:"请先登录" },
  saveFailed:            { ja:"保存に失敗しました", en:"Failed to save", zh:"保存失败" },
  checkinComplete:      { ja:"チェックイン完了！", en:"Checked in!", zh:"打卡完成！" },
  noCheckinRecords:      { ja:"チェックインの記録がありません", en:"No check-in records yet", zh:"暂无打卡记录" },
  confirmDeleteCheckin:  { ja:"削除しますか？", en:"Delete this?", zh:"要删除吗？" },
  noSpots:              { ja:"スポットがありません", en:"No spots", zh:"没有地点" },
  searchStampPlaceholder:{ ja:"Search Stamp / スタンプ検索", en:"Search Stamp", zh:"搜索印章" },
  filterAll:             { ja:"すべて", en:"All", zh:"全部" },
  filterSaved:          { ja:"保存済み", en:"Saved", zh:"已保存" },
  filterCheckedIn:      { ja:"チェックイン済み", en:"Checked in", zh:"已打卡" },
  checkinBtn:            { ja:"チェックイン", en:"Check in", zh:"打卡" },
  detailBtn:            { ja:"詳細", en:"Details", zh:"详情" },
  saveAction:            { ja:"保存する", en:"Save", zh:"保存" },
  savedSpotsHeader:      { ja:"保存済みスポット", en:"Saved Spots", zh:"已保存地点" },
  savedEmptyLine1:      { ja:"保存したスポットがここに表示されます", en:"Spots you save will appear here", zh:"已保存的地点会显示在这里" },
  savedEmptyLine2:      { ja:"ピンを選択してブックマークしましょう", en:"Tap a pin to bookmark it", zh:"点击图钉即可收藏" },
  myPageTitle:          { ja:"マイページ", en:"My Page", zh:"我的页面" },
  loginDescription:      { ja:"Googleアカウントでログインすると、チェックイン記録やフォルダを管理できます。", en:"Log in with your Google account to manage your check-ins and folders.", zh:"使用Google账号登录后即可管理打卡记录和文件夹。" },
  loginWithGoogle:      { ja:"Googleでログイン", en:"Log in with Google", zh:"使用Google登录" },
  logout:                { ja:"ログアウト", en:"Log out", zh:"退出登录" },
  confirmDeleteFolder:  { ja:"このフォルダを削除しますか？", en:"Delete this folder?", zh:"要删除这个文件夹吗？" },
  folderDeleted:        { ja:"フォルダを削除しました", en:"Folder deleted", zh:"文件夹已删除" },
  delete:                { ja:"削除", en:"Delete", zh:"删除" },
  latestInfoPlaceholder:{ ja:"最新情報", en:"Latest update", zh:"最新动态" },
  firstCheckinMessage:  { ja:"初めてのチェックインスポットです！スポット情報を登録しましょう🎉", en:"This is your first check-in here! Let's add some spot info 🎉", zh:"这是你在这里的第一次打卡！来登记一下地点信息吧🎉" },
  hoursLabel:            { ja:"営業時間", en:"Hours", zh:"营业时间" },
  hoursPlaceholder:      { ja:"例：10:00-20:00 / 終日", en:"e.g. 10:00-20:00 / All day", zh:"例如：10:00-20:00 / 全天" },
  stampLocationLabel:    { ja:"スタンプ設置場所", en:"Stamp location", zh:"印章放置位置" },
  stampLocationPlaceholder:{ ja:"例：入口入って左側", en:"e.g. Left side after entrance", zh:"例如：入口进去左侧" },
  limitedTimeLabel:      { ja:"期間限定", en:"Limited time", zh:"限定期间" },
  visibilityLabel:      { ja:"公開範囲", en:"Visibility", zh:"公开范围" },
  makePublic:            { ja:"公開する", en:"Public", zh:"公开" },
  onlyMe:                { ja:"自分だけ", en:"Only me", zh:"仅自己" },
  spotInfoUpdated:      { ja:"スポット情報を更新しました", en:"Spot info updated", zh:"地点信息已更新" },
  submitting:            { ja:"送信中...", en:"Submitting...", zh:"提交中..." },
  createdOn:            { ja:"{date}に作成", en:"Created {date}", zh:"创建于{date}" },
  checkinRecordsTitle:  { ja:"チェックイン記録", en:"Check-in Record", zh:"打卡记录" },
  confirmDeleteCheckinRecord:{ ja:"このチェックインを削除しますか？", en:"Delete this check-in?", zh:"要删除这次打卡吗？" },
  deletedToast:          { ja:"削除しました", en:"Deleted", zh:"已删除" },
  tbd:                  { ja:"未定", en:"TBD", zh:"待定" },
  backToMap:            { ja:"マップに戻る", en:"Back to map", zh:"返回地图" },
  searchPlaceholderStation:{ ja:"場所を検索（例：東京駅）", en:"Search a place (e.g. Tokyo Station)", zh:"搜索地点（例如：东京站）" },
  searching:            { ja:"検索中...", en:"Searching...", zh:"搜索中..." },
  notFound:              { ja:"見つかりませんでした", en:"No results found", zh:"未找到结果" },
  gettingLocation:      { ja:"📍 現在地を取得中...", en:"📍 Getting your location...", zh:"📍 正在获取当前位置..." },
  nearbyLabel:          { ja:"📍 近く（1km以内）", en:"📍 Nearby (within 1km)", zh:"📍 附近（1公里内）" },
  otherSpots:            { ja:"その他のスポット", en:"Other spots", zh:"其他地点" },
  allSpots:              { ja:"すべてのスポット", en:"All spots", zh:"全部地点" },
  selectSpotTitle:      { ja:"スポットを選択", en:"Select a spot", zh:"选择地点" },
  searchPlaceholderTower:{ ja:"場所を検索（例：東京タワー）", en:"Search a place (e.g. Tokyo Tower)", zh:"搜索地点（例如：东京塔）" },
  searchBySpotOrAddress:{ ja:"スポット名や住所で検索してください", en:"Search by spot name or address", zh:"请输入地点名称或地址进行搜索" },
  editProfileTitle:      { ja:"プロフィール編集", en:"Edit Profile", zh:"编辑资料" },
  profileSaved:          { ja:"保存しました", en:"Saved", zh:"已保存" },
  saveBtn:              { ja:"保存", en:"Save", zh:"保存" },
  changePhoto:          { ja:"写真を変更", en:"Change photo", zh:"更换照片" },
  namePlaceholder:      { ja:"名前を入力", en:"Enter your name", zh:"请输入姓名" },
  bioPlaceholder:        { ja:"自己紹介を入力", en:"Write a short bio", zh:"请输入个人简介" },
  edit:                  { ja:"編集", en:"Edit", zh:"编辑" },
  selectFolderTitle:    { ja:"フォルダを選択", en:"Select a folder", zh:"选择文件夹" },
  noFolders:            { ja:"フォルダがありません", en:"No folders yet", zh:"暂无文件夹" },
  addedToFolder:        { ja:"「{name}」に追加しました", en:"Added to \"{name}\"", zh:"已添加到「{name}」" },
  createNewFolder:      { ja:"＋ 新しいフォルダを作成", en:"+ Create new folder", zh:"＋ 创建新文件夹" },
  editFolderTitle:      { ja:"フォルダを編集", en:"Edit folder", zh:"编辑文件夹" },
  newFolderTitle:        { ja:"新しいフォルダを作成", en:"Create new folder", zh:"创建新文件夹" },
  folderNamePlaceholder:{ ja:"フォルダ名を入力...", en:"Enter folder name...", zh:"请输入文件夹名称..." },
  selectCheckinsForFolder:{ ja:"チェックインを選択してフォルダに追加", en:"Select check-ins to add to this folder", zh:"选择要添加到文件夹的打卡记录" },
  cancel:                { ja:"キャンセル", en:"Cancel", zh:"取消" },
  createAction:          { ja:"作成する", en:"Create", zh:"创建" },
  viewMore:              { ja:"もっと見る（{count}件）", en:"View more ({count})", zh:"查看更多（{count}）" },
  close:                { ja:"閉じる", en:"Close", zh:"收起" },
  postsLabel:            { ja:"投稿", en:"Posts", zh:"帖子" },
  noPostsYet:            { ja:"まだ投稿がありません", en:"No posts yet", zh:"暂无帖子" },
  startCheckinPrompt:    { ja:"最初にチェックインしてみましょう！", en:"Be the first to check in!", zh:"快来抢先打卡吧！" },
  checkinHere:          { ja:"チェックインする", en:"Check in", zh:"去打卡" },
  editSpotInfo:          { ja:"スポット情報を修正する", en:"Edit spot info", zh:"修改地点信息" },
};

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
@import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&display=swap');
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
body{font-family:'Public Sans','Noto Sans JP',sans-serif;background:#E8E8E4}

.frame{
  width:390px;height:844px;background:var(--white);
  margin:0 auto;position:relative;overflow:hidden;
  display:flex;flex-direction:column;
  border-radius:0;box-shadow:var(--sh-lg)
}
@media (max-width:600px){
  .frame{width:100%;height:100dvh;box-shadow:none}
}

/* ── NAV ── */
.bnav{
  position:fixed;bottom:0;left:50%;transform:translateX(-50%);
  width:min(390px, 100%);
  display:flex;align-items:flex-start;
  background:var(--white);
  border-top:1px solid var(--border);
  padding:8px 0;padding-bottom:calc(8px + env(safe-area-inset-bottom));z-index:999
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
  border:none;background:none;flex:1;font-size:16px;
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
  line-height:1;padding:3px 0 4px 0;
  box-shadow:var(--sh-md);z-index:50;transition:transform .15s
}
.fab:active{transform:scale(.94)}

/* ══════ HOME ══════ */
.home-screen{flex:1;overflow-y:auto;padding-top:16px;padding-bottom:160px;background:var(--white);overscroll-behavior:contain}
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

.ov-maparea{height:160px;flex-shrink:0;background:#E8EEF4;position:relative;overflow:hidden}
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
  display:flex;align-items:center;justify-content:center;gap:10px;
  padding:4px 10px;border-radius:100px;
  background:rgba(240,240,240,0.85);color:#E65100;
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
  display:grid;grid-template-columns:1fr 20px 1fr;align-items:end;gap:4px;background:var(--white);
  width:100%;box-sizing:border-box;margin-top:12px
}
.limited-date-field{display:flex;flex-direction:column;gap:4px;min-width:0;overflow:hidden}
.limited-date-label{font-size:11px;color:var(--text3);font-weight:500;letter-spacing:.03em}
.limited-date-input{
  border:1px solid var(--border);border-radius:8px;
  padding:8px 4px;font-size:16px;font-family:inherit;
  color:var(--text);outline:none;background:var(--white);
  transition:border-color .15s;width:100%;min-width:0;box-sizing:border-box
}
.limited-date-input:focus{border-color:var(--gray-400);background:var(--white)}
.limited-sep{color:var(--text3);font-size:13px;text-align:center;padding-bottom:10px}

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
.mrow{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:var(--text2)}
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
  width:56px;height:56px;border-radius:50%;
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
}
.list-card-label{
  position:absolute;bottom:0;left:0;right:0;z-index:2;
  padding:8px 12px;font-size:13px;font-weight:700;color:#fff;
  background:linear-gradient(to top,rgba(0,0,0,.6),transparent);
}

/* Archive overlay */
.spot-posts{margin-top:20px}
.spot-post-card{
  background:var(--gray-50);border-radius:8px;
  padding:14px;margin-bottom:12px;min-width:0;width:100%;overflow:hidden
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
.spot-post-text{font-size:13px;color:var(--text);line-height:1.6;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.spot-post-text.expanded{display:block;overflow:visible}
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
  color:var(--text3);font-size:13px;width:100%
}

/* Photo viewer overlay */
.photo-viewer{
  position:fixed;inset:0;background:rgba(0,0,0,.92);
  z-index:500;display:flex;align-items:center;justify-content:center;
  flex-direction:column;gap:12px
}
.photo-viewer-img{
  width:calc(100vw - 32px);max-width:480px;
  max-height:80vh;border-radius:12px;
  background:#000;display:flex;align-items:center;
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
  padding:12px 14px;font-size:16px;font-family:inherit;
  color:var(--text);outline:none;resize:none;
  min-height:80px;line-height:1.6;transition:border-color .15s
}
.pe-textarea:focus{border-color:var(--red)}
.pe-divider{height:1px;background:var(--border);margin:8px 0 20px}

.arc-overlay{
  position:absolute;top:0;left:0;right:0;bottom:0;background:var(--white);
  z-index:320;overflow-y:auto;
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
  padding:12px 16px 100px;
  align-items:flex-start
}
.group-col{display:flex;flex-direction:column;gap:8px;flex:1;min-width:0}
.group-cell{
  cursor:pointer;position:relative
}
.group-cell-img{
  width:100%;aspect-ratio:1/1;display:flex;align-items:center;
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
  padding:12px 14px;font-size:16px;font-family:inherit;
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
  background:#616168;color:#fff;cursor:pointer;
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
  border:none;background:none;flex:1;font-size:16px;
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
  font-size:12px;color:var(--text3);font-weight:500;
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
      <path d="M2.5 10.5V2.5C2.5 2.225 2.59792 1.98958 2.79375 1.79375C2.98958 1.59792 3.225 1.5 3.5 1.5H8.5C8.775 1.5 9.01042 1.59792 9.20625 1.79375C9.40208 1.98958 9.5 2.225 9.5 2.5V10.5L6 9L2.5 10.5Z" fill={active ? "#C5C5C5" : "#808080"}/>
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
  NavList: ({a}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <mask id="mask0_list" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="#D9D9D9"/>
      </mask>
      <g mask="url(#mask0_list)">
        <path d="M8.7125 16.7125C8.90417 16.5208 9 16.2833 9 16C9 15.7167 8.90417 15.4792 8.7125 15.2875C8.52083 15.0958 8.28333 15 8 15C7.71667 15 7.47917 15.0958 7.2875 15.2875C7.09583 15.4792 7 15.7167 7 16C7 16.2833 7.09583 16.5208 7.2875 16.7125C7.47917 16.9042 7.71667 17 8 17C8.28333 17 8.52083 16.9042 8.7125 16.7125ZM8.7125 12.7125C8.90417 12.5208 9 12.2833 9 12C9 11.7167 8.90417 11.4792 8.7125 11.2875C8.52083 11.0958 8.28333 11 8 11C7.71667 11 7.47917 11.0958 7.2875 11.2875C7.09583 11.4792 7 11.7167 7 12C7 12.2833 7.09583 12.5208 7.2875 12.7125C7.47917 12.9042 7.71667 13 8 13C8.28333 13 8.52083 12.9042 8.7125 12.7125ZM8.7125 8.7125C8.90417 8.52083 9 8.28333 9 8C9 7.71667 8.90417 7.47917 8.7125 7.2875C8.52083 7.09583 8.28333 7 8 7C7.71667 7 7.47917 7.09583 7.2875 7.2875C7.09583 7.47917 7 7.71667 7 8C7 8.28333 7.09583 8.52083 7.2875 8.7125C7.47917 8.90417 7.71667 9 8 9C8.28333 9 8.52083 8.90417 8.7125 8.7125ZM11 17H17V15H11V17ZM11 13H17V11H11V13ZM11 9H17V7H11V9ZM5 21C4.45 21 3.97917 20.8042 3.5875 20.4125C3.19583 20.0208 3 19.55 3 19V5C3 4.45 3.19583 3.97917 3.5875 3.5875C3.97917 3.19583 4.45 3 5 3H19C19.55 3 20.0208 3.19583 20.4125 3.5875C20.8042 3.97917 21 4.45 21 5V19C21 19.55 20.8042 20.0208 20.4125 20.4125C20.0208 20.8042 19.55 21 19 21H5Z" fill={a?"#EB4B24":"#808080"}/>
      </g>
    </svg>
  ),
  NavTimeline: ({a}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <mask id="m1" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="#D9D9D9"/>
      </mask>
      <g mask="url(#m1)">
        <path d="M15.3 16.7L16.7 15.3L13 11.6V7H11V12.4L15.3 16.7ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22Z" fill={a?"#EB4B24":"#808080"}/>
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
  const isNative = Capacitor.getPlatform() !== 'web';
  const [tab, setTab]             = useState("map");
  const [selSpot, setSelSpot]     = useState(null);
  const [overlay, setOverlay]     = useState(null); // "form"|"detail"
  const [ciText, setCiText]       = useState("");
  const [ciVis, setCiVis]         = useState("public");
  const [ciCat, setCiCat]         = useState("");
  const [ciLimited, setCiLimited]   = useState(false);
  const [ciDateFrom, setCiDateFrom] = useState("");
  const [ciDateTo, setCiDateTo]     = useState("");
  const [ciEventName, setCiEventName] = useState("");
  const [ciHours, setCiHours] = useState("");
  const [ciLocation, setCiLocation] = useState("");
  const [showSpotEdit, setShowSpotEdit] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState([]);
  const [timelineMenu, setTimelineMenu] = useState(null); // item.id
  const [editingCheckin, setEditingCheckin] = useState(null);
  const [editNote, setEditNote] = useState("");
  const [editPhotos, setEditPhotos] = useState([]);
  const [editLimited, setEditLimited] = useState(false);
  const [editEventName, setEditEventName] = useState("");
  const [editDateFrom, setEditDateFrom] = useState("");
  const [editDateTo, setEditDateTo] = useState("");
  const [editHours, setEditHours] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [dbSpots, setDbSpots] = useState([]);
  const [savedSpots, setSavedSpots] = useState([]);
  const [mapFilter, setMapFilter]   = useState("all"); // "all"|"saved"|"checkedin"
  const [showSaved, setShowSaved]   = useState(false);
  const [hasPrev, setHasPrev]     = useState(false);
  const [ciPhotos, setCiPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [checkins, setCheckins]   = useState(0);
  const [viewMode, setViewMode]   = useState("grid"); // "grid"|"list"
  const [selArc, setSelArc]       = useState(null);
  const [selGroup, setSelGroup]   = useState(null); // {title, items[]}
  const [archives, setArchives]   = useState([]);
  const [spotCheckins, setSpotCheckins] = useState([]);
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
  const [detailPhotoIdx, setDetailPhotoIdx] = useState(0);
  const [profile, setProfile] = useState({
    name:"", location:"", bio:"", avatar_url:""
  });
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState({name:"",location:"",bio:"",avatar_url:""}); // {posts:[], postIdx:0, imgIdx:0}
const [creatorAvatar, setCreatorAvatar] = useState("");
  const [folders, setFolders]       = useState([]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderCoverFile, setFolderCoverFile] = useState(null);
  const [folderCoverPreview, setFolderCoverPreview] = useState(null);
  const [folderName, setFolderName]   = useState("");
  const [folderPhotos, setFolderPhotos] = useState([]); // mock photo list
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [folderMenuOpen, setFolderMenuOpen] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [toast, setToast]         = useState({msg:"",type:""});
  const [toastOn, setToastOn]     = useState(false);
  // ブラウザの言語設定から表示言語を自動判定（ja/en/zh。それ以外はja）
  const [lang] = useState(()=>{
    const bl = (typeof navigator!=="undefined" ? navigator.language||navigator.userLanguage||"" : "").toLowerCase();
    if(bl.startsWith("en")) return "en";
    if(bl.startsWith("zh")) return "zh";
    return "ja";
  });
  const t = (key, vars) => {
    let s = T[key]?.[lang] ?? T[key]?.ja ?? key;
    if(vars) Object.entries(vars).forEach(([k,v])=>{ s = s.replace(`{${k}}`, v); });
    return s;
  };
  const catLabel = (cat) => {
    if(!cat) return "";
    return CATEGORY_LABELS[lang]?.[cat] || CATEGORY_LABELS.ja[cat] || cat;
  };
useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setUser(session?.user ?? null);
      if(session?.user){ loadCheckins(session.user.id); loadProfile(session.user.id); loadFolders(session.user.id); loadSavedSpots(session.user.id); }
    });
    loadSpots();
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        pos=>setUserLocation({lat:pos.coords.latitude,lng:pos.coords.longitude}),
        ()=>{}
      );
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user ?? null);
      if(session?.user && session.user.id !== user?.id){ loadCheckins(session.user.id); loadProfile(session.user.id); loadFolders(session.user.id); loadSavedSpots(session.user.id); }
      else setArchives([]);
    });
    return () => subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!selSpot?.created_by){ setCreatorAvatar(""); return; }
    supabase.from("profiles").select("avatar_url").eq("id", selSpot.created_by).single()
      .then(({data})=> setCreatorAvatar(data?.avatar_url||""));
  },[selSpot?.created_by]);

  useEffect(()=>{
    if(!selSpot?.id){ setSpotCheckins([]); return; }
    (async()=>{
      const { data } = await supabase.from("checkins").select("*").eq("spot_id", String(selSpot.id)).order("created_at",{ascending:false});
      if(!data){ setSpotCheckins([]); return; }
      const userIds = [...new Set(data.map(d=>d.user_id).filter(Boolean))];
      let nameMap = {};
      let avatarMap = {};
      if(userIds.length>0){
        const { data: profiles } = await supabase.from("profiles").select("id,name,avatar_url").in("id", userIds);
        nameMap = Object.fromEntries((profiles||[]).map(p=>[p.id,p.name]));
        avatarMap = Object.fromEntries((profiles||[]).map(p=>[p.id,p.avatar_url]));
      }
      setSpotCheckins(data.map(d=>({
        id: d.id,
        user: nameMap[d.user_id] || t('guestUser'),
        avatar_url: avatarMap[d.user_id] || null,
        date: d.created_at ? new Date(d.created_at).toLocaleString("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).replace(/\//g,"/") : "",
        note: d.note||"",
        emoji: d.emoji||"",
        hasImg: (d.photo_urls||[]).length>0,
        photos: d.photo_urls||[],
        color: d.color||"#E1F5EE",
        limited: d.limited||false,
        dateFrom: d.date_from||"",
        dateTo: d.date_to||"",
      })));
    })();
  },[selSpot?.id]);

  const loadCheckins = async (userId) => {
    const { data, error } = await supabase
      .from("checkins")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if(error || !data) return;
    setArchives(data.map(d=>({
      id: d.id,
      spot_id: d.spot_id||"",
      spot: d.spot_name,
      sub: `${catLabel(d.category)}　${d.area||""}`,
      date: d.created_at ? new Date(d.created_at).toLocaleString("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).replace(/\//g,"/") : "",
      note: d.note||"",
      emoji: d.emoji||"",
      hasImg: (d.photo_urls||[]).length>0,
      photos: d.photo_urls||[],
      color: d.color||"#E1F5EE",
      category: d.category||"",
      tags: [],
      limited: d.limited||false,
      eventName: d.event_name||"",
      dateFrom: d.date_from||"",
      dateTo: d.date_to||"",
      lat: d.lat,
      lng: d.lng,
    })));
  };
  const loadProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if(data) setProfile({ name: data.name||"", location: data.location||"", bio: data.bio||"", avatar_url: data.avatar_url||"" });
  };
  const loadFolders = async (userId) => {
    const { data } = await supabase.from("folders").select("*").eq("user_id", userId);
    if(data) setFolders(data.map(f=>({id:f.id, title:f.title, type:"custom", ids:f.checkin_ids||[], cover_url:f.cover_url||null})));
  };
  const loadSavedSpots = async (userId) => {
    const { data: saved } = await supabase.from("saved_spots").select("spot_id").eq("user_id", userId);
    if(!saved || saved.length===0){ setSavedSpots([]); return; }
    const ids = saved.map(d=>d.spot_id);
    const { data: spotsData } = await supabase.from("spots").select("*").in("id", ids);
    setSavedSpots((spotsData||[]).map(s=>({
      id: s.id, name: s.name, lat: s.lat, lng: s.lng,
      category: s.category||"", area: s.area||"",
      hours: s.hours||"", location: s.location||"",
      creator_name: s.creator_name||"", created_by: s.created_by||"",
      spot_created_at: s.created_at||"", spot_updated_at: s.updated_at||"",
      checkins: 0, reviews: [], comment: "",
      stampUpdatedAt: null, stampUpdatedBy: null,
    })));
  };
  const loadSpots = async () => {
    const { data } = await supabase.from("spots").select("*");
    const { data: ciData } = await supabase.from("checkins").select("spot_name,lat,lng,photo_urls").order("created_at",{ascending:false});
    const photoMap = {};
    (ciData||[]).forEach(c=>{
      if(!photoMap[c.spot_name] && c.photo_urls && c.photo_urls.length>0) photoMap[c.spot_name] = c.photo_urls[0];
    });
    window.__publicPhotos = photoMap;
    const spotsFromCi = (ciData||[])
      .filter(c=>c.lat&&c.lng)
      .reduce((acc,c)=>{
        if(!acc.find(s=>s.name===c.spot_name)) acc.push({id:"pub-"+c.spot_name, name:c.spot_name, lat:c.lat, lng:c.lng, category:"", area:"", checkins:0, hours:"", location:"", reviews:[], comment:"", stampUpdatedAt:null, stampUpdatedBy:null});
        return acc;
      },[]);
    const spotsFromDb = (data||[]).map(s=>({
      id: s.id, name: s.name, lat: s.lat, lng: s.lng,
      category: s.category||"", area: s.area||"",
      hours: s.hours||"", location: s.location||"",
      creator_name: s.creator_name||"", created_by: s.created_by||"",
      spot_created_at: s.created_at||"", spot_updated_at: s.updated_at||"",
      checkins: 0, reviews: [], comment: "",
      stampUpdatedAt: null, stampUpdatedBy: null,
    }));
    if(data) window.__spotsCache = Object.fromEntries(data.map(s=>[s.name, s]));
    const merged = [...spotsFromDb, ...spotsFromCi.filter(c=>!spotsFromDb.find(s=>s.name===c.name))];
    setDbSpots(merged);
  };
  const loadPublicPins = async () => {
    const { data } = await supabase.from("checkins").select("spot_name,lat,lng").not("lat","is",null);
    if(data) setDbSpots(prev=>{
      const extra = data
        .filter(c=>c.lat&&c.lng&&!prev.find(s=>s.name===c.spot_name))
        .map(c=>({id:"pub-"+c.spot_name, name:c.spot_name, lat:c.lat, lng:c.lng, category:"", area:"", checkins:0, hours:"", location:"", reviews:[], comment:"", stampUpdatedAt:null, stampUpdatedBy:null}));
      return [...prev, ...extra];
    });
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
  const openDetail = (spot) => {
    const cached = window.__spotsCache?.[spot.name];
    setSelSpot(cached ? {...spot, hours:cached.hours||spot.hours, location:cached.location||spot.location, creator_name:cached.creator_name||"", spot_created_at:cached.created_at||"", created_by:cached.created_by||""} : spot);
    setOverlay("detail");
  };
  const closeOv = () => setOverlay(null);

  const resizeImage = (file) => new Promise((resolve)=>{
    const img = new Image();
    const reader = new FileReader();
    reader.onload = ev => {
      img.onload = () => {
        const maxSize = 1600;
        let { width, height } = img;
        if(width>maxSize||height>maxSize){
          if(width>height){ height=Math.round(height*maxSize/width); width=maxSize; }
          else{ width=Math.round(width*maxSize/height); height=maxSize; }
        }
        const canvas = document.createElement("canvas");
        canvas.width=width; canvas.height=height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img,0,0,width,height);
        canvas.toBlob(blob=>{
          const newFile = new File([blob], file.name.replace(/\.\w+$/,".jpg"), {type:"image/jpeg"});
          resolve({url:canvas.toDataURL("image/jpeg",0.9), file:newFile});
        }, "image/jpeg", 0.9);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
  const submit = async () => {
    if(submitting) return;
    setSubmitting(true);
    if(!user){ showToast(t('loginRequired')); return; }

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
      note: ciText||"",
      photo_urls: photoUrls,
      emoji: "",
      color: "#E1F5EE",
      limited: ciLimited,
      event_name: ciEventName||null,
      date_from: ciDateFrom||null,
      date_to: ciDateTo||null,
    }).select().single();
    // スポット情報を更新（毎回category/areaは保存。hours/locationは入力時のみ。creator_nameは未設定時のみ）
    const { error: spotsErr } = await supabase.from("spots").upsert({
      id: String(selSpot.id||selSpot.name),
      name: selSpot.name,
      category: selSpot.category||"",
      area: selSpot.area||"",
      ...(ciHours ? {hours: ciHours} : {}),
      ...(ciLocation ? {location: ciLocation} : {}),
      ...((ciHours||ciLocation) ? {creator_name: profile.name || user?.email || "", created_by: user?.id || "", updated_at: new Date().toISOString()} : (!selSpot.creator_name ? {creator_name: profile.name || user?.email || "", created_by: user?.id || ""} : {})),
      lat: selSpot.lat||null,
      lng: selSpot.lng||null,
    }, { onConflict:"id" });
    console.log("spotsErr:", spotsErr, "creator_name送信値:", !selSpot.creator_name ? (profile.name || user?.email || "") : "(スキップ)");
    if(ciHours||ciLocation){
      // selSpotに即時反映
      setSelSpot(s=>s ? {...s, hours:ciHours||s.hours, location:ciLocation||s.location, creator_name:profile.name||user?.email||"", spot_updated_at:new Date().toISOString()} : s);
    }
    await loadSpots();

    if(!error && data){
      setArchives(a=>[{
        id: data.id,
        spot: data.spot_name,
        sub: `${catLabel(data.category)}　${data.area}`,
        date: data.created_at ? new Date(data.created_at).toLocaleString("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).replace(/\//g,"/") : "",
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
    setOverlay(null); setSelSpot(null); setCiPhotos([]); setCiEventName("");
    showToast(error?t('saveFailed'):t('checkinComplete'), error?"":"ok");
    if(!error && selSpot?.lat && selSpot?.lng){
      setTab("map");
      setTimeout(()=>{ if(window.__mapboxFlyTo) window.__mapboxFlyTo(selSpot.lng, selSpot.lat); }, 100);
    }
    setSubmitting(false);
  };

  const switchTab = (t) => {
    setTab(t); setOverlay(null); setSelSpot(null); setSelGroup(null);
    setNearbyOpen(false); setNearbySearch("");
    setNewCiOpen(false); setSpotSearch("");
    setSelArc(null);
    setProfileEditOpen(false);
    setShowFolderModal(false);
    setShowFolderPicker(false);
  };
  const toggleSave = async (spot) => {
    const already = savedSpots.some(x=>x.id===spot.id);
    setSavedSpots(s=>
      already ? s.filter(x=>x.id!==spot.id) : [...s, spot]
    );
    if(!user) return;
    if(already) await supabase.from("saved_spots").delete().eq("user_id", user.id).eq("spot_id", spot.id);
    else await supabase.from("saved_spots").insert({user_id:user.id, spot_id:spot.id});
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
            {/* Timeline */}
            {(()=>{
              // モックタイムラインデータ
              const TIMELINE_MOCK = [];

              // archivesをタイムライン形式に変換してマージ
              const arcItems = archives.map(a=>({
                id: a.id,
                spot_id: a.spot_id||"",
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
                emoji: a.emoji||"",
                color: a.color||"var(--gray-100)",
                note: a.note||"",
                hasImg: a.hasImg||false,
                photos: a.photos||[],
                limited: a.limited||false,
                eventName: a.eventName||"",
                dateFrom: a.dateFrom||"",
                dateTo: a.dateTo||"",
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
                  {t('noCheckinRecords')}
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
                            style={{display:"flex",gap:12,padding:"0 16px",cursor:"pointer",alignItems:"stretch"}}
                            onClick={()=>{
                              if(matchSpot){ setSelSpot(matchSpot); setOverlay("detail"); }
                            }}>
                            {/* ドット＋縦線 */}
                            <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,width:12,paddingTop:3}}>
                              <div style={{width:2,background:"transparent",height:8,flexShrink:0}}/>
                              <div style={{width:9,height:9,borderRadius:"50%",background:"#E8452A",flexShrink:0}}/>
                              {ii < group.items.length-1
                                ? <div style={{width:2,flex:1,background:"#EDEDEC",minHeight:16,marginTop:8}}/>
                                : <div style={{height:8,flexShrink:0}}/>
                              }
                            </div>
                            {/* 内容 */}
                            <div style={{flex:1,minWidth:0,paddingTop:6,paddingBottom:16}}>
                              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:2}}>
                                <div style={{fontWeight:700,fontSize:14,color:"rgba(28,27,31,1)"}}>{item.spot}</div>
                                {item.id && !String(item.id).startsWith("mock") && (
                                  <div style={{position:"relative",flexShrink:0}} onClick={e=>e.stopPropagation()}>
                                    <button onClick={()=>setTimelineMenu(m=>m===item.id?null:item.id)}
                                      style={{background:"none",border:"none",cursor:"pointer",color:"var(--text3)",padding:"0 4px",fontSize:18,lineHeight:1,marginTop:3}}>
                                      •••
                                    </button>
                                    {timelineMenu===item.id && (
                                      <div style={{position:"absolute",top:24,right:0,background:"#fff",borderRadius:8,boxShadow:"0 2px 12px rgba(0,0,0,.15)",zIndex:20,overflow:"hidden",minWidth:120}}>
                                        <button onClick={()=>{
                                          setEditingCheckin({id:item.id,spot_id:item.spot_id||selSpot?.id,note:item.note,photos:item.photos||[]});
                                          setEditNote(item.note||"");
                                          setEditPhotos(item.photos||[]);
                                          setEditLimited(item.limited||false);
                                          setEditEventName(item.eventName||"");
                                          setEditDateFrom(item.dateFrom||"");
                                          setEditDateTo(item.dateTo||"");
                                          setTimelineMenu(null);
                                          if(item.spot_id){
                                            supabase.from("spots").select("hours,location").eq("id",item.spot_id).maybeSingle()
                                              .then(({data})=>{ setEditHours(data?.hours||""); setEditLocation(data?.location||""); });
                                          }
                                        }} style={{display:"block",width:"100%",padding:"10px 16px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>編集</button>
                                        <button onClick={async()=>{
                                          if(!confirm(t('confirmDeleteCheckin'))) return;
                                          const {supabase} = await import("../../lib/supabase");
                                          await supabase.from("checkins").delete().eq("id", item.id);
                                          setArchives(a=>a.filter(x=>x.id!==item.id));
                                          setTimelineMenu(null);
                                        }} style={{display:"block",width:"100%",padding:"10px 16px",background:"none",border:"none",textAlign:"left",fontSize:13,color:"var(--red)",cursor:"pointer",fontFamily:"inherit"}}>削除</button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div style={{fontSize:12,color:"var(--text3)",marginBottom:8,display:"flex",gap:8}}>
                                {item.category?.trim() && <span>{catLabel(item.category)}</span>}
                                {item.area?.trim() && <span>{item.area}</span>}
                                <span>{item.date?.slice(-5)}</span>
                              </div>
                              {item.note && (
                                <div style={{fontSize:14,color:"rgba(28,27,31,1)",lineHeight:1.6,marginBottom:8}}>
                                  {item.note}
                                </div>
                              )}
                              {item.hasImg && (
                                <div style={{display:"flex",gap:6,marginTop:4,overflowX:"auto"}}>
                                  {(item.photos&&item.photos.length>0) ? item.photos.map((url,i)=>(
                                    <img key={i} src={url} style={{width:"100%",maxWidth:280,height:180,borderRadius:8,objectFit:"cover",flexShrink:0,display:"block",cursor:"pointer"}}
                                      onClick={e=>{e.stopPropagation();setPhotoViewer({posts:[item],postIdx:0,imgIdx:i});}}/>
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
        {/* ════ LIST ════ */}
        {tab==="list" && (()=>{
          const areas = [...new Set(dbSpots.map(s=>s.area).filter(Boolean))];
          const [listArea, setListArea] = [catSel, setCatSel];
          const filtered = dbSpots
            .filter(s=> listArea==="All" || s.area===listArea || s.category===listArea)
            .map(s=>{
              const dist = userLocation ? calcDist(userLocation.lat, userLocation.lng, s.lat, s.lng) : null;
              return {...s, dist};
            })
            .sort((a,b)=> a.dist!=null && b.dist!=null ? a.dist-b.dist : 0);
          return (
            <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
              <div style={{flex:1,overflowY:"auto",padding:`${isNative?52:8}px 16px 120px`}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginTop:12,marginBottom:8}}>{dbSpots.length.toLocaleString()} Stamps.</div>
                {filtered.length===0 && <div style={{color:"var(--text3)",textAlign:"center",marginTop:40}}>{t('noSpots')}</div>}
                {filtered.map(s=>{
                  const latestPhoto = archives.find(a=>a.spot===s.name&&a.photos?.length>0)?.photos?.[0] || window.__publicPhotos?.[s.name];
                  return (
                    <div key={s.id} onClick={()=>{setSelSpot(s); setOverlay("detail");}}
                      style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 0",borderBottom:"1px solid var(--gray-50)",cursor:"pointer"}}>
                      <div style={{width:64,height:64,borderRadius:8,background:"var(--gray-100)",flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {latestPhoto
                          ? <img src={latestPhoto} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                          : <span style={{fontSize:28}}></span>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,fontSize:14,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</div>
                        {s.location&&<div style={{fontSize:12,color:"var(--text3)",marginTop:2}}>{s.location}</div>}
                        {s.hours&&<div style={{fontSize:12,color:"var(--text3)",marginTop:1}}>{s.hours}</div>}
                      </div>
                      <div style={{fontSize:12,color:"var(--text2)",flexShrink:0}}>
                        {s.dist!=null ? fmtDist(s.dist) : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
        {/* ════ MAP ════ */}
        {tab==="map" && (
          <div className="map-screen">
            <div className="map-canvas">
  <MapView>
    {[...MAP_SPOTS, ...dbSpots.filter(s=>s.lat&&s.lng&&!MAP_SPOTS.find(m=>m.name===s.name)), ...archives
        .filter(a => a.lat && a.lng && !MAP_SPOTS.find(s=>s.name===a.spot) && !dbSpots.find(s=>s.lat&&s.lng&&s.name===a.spot))
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
              {checked ? <CheckedPinSVG width={selSpot?.id===s.id?36:27} height={selSpot?.id===s.id?43:32}/> : <PinSVG color={pinColor} width={selSpot?.id===s.id?36:24} height={selSpot?.id===s.id?43:29}/>}
            </div>
          </MapMarker>
        );
      })
    }
  </MapView>
</div>

            {/* search */}
            <div className="sbar" style={{position:"absolute",top:isNative?52:16,left:16,right:16}}
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
              <input placeholder={t('searchStampPlaceholder')} readOnly style={{cursor:"pointer"}}/>
            </div>

            

            {/* Filter bar */}
            <div className="map-filter-bar">
              <button className={`map-filter-btn ${mapFilter==="all"?"on":""}`}
                onClick={()=>{setMapFilter("all");setShowSaved(false);}}>
                {t('filterAll')}
              </button>
              <button className={`map-filter-btn ${mapFilter==="saved"?"on":""}`}
                onClick={()=>{setMapFilter("saved");setShowSaved(true);}}>
                <BookmarkSVG active={mapFilter==="saved"} size={14}/> {t('filterSaved')}{savedSpots.length>0?` (${savedSpots.length})`:""}
              </button>
              <button className={`map-filter-btn ${mapFilter==="checkedin"?"on":""}`}
                onClick={()=>{setMapFilter("checkedin");setShowSaved(false);}}>
                <CheckCircleSVG active={mapFilter==="checkedin"}/>
                {t('filterCheckedIn')}
              </button>
              </div>
            <button onClick={()=>{
                if(!navigator.geolocation) return;
                navigator.geolocation.getCurrentPosition(pos=>{
                  if(window.__mapboxFlyTo) window.__mapboxFlyTo(pos.coords.longitude, pos.coords.latitude);
                });
              }}
              style={{
                position:"fixed",
                bottom:`calc(${90 + 52 + 12}px + env(safe-area-inset-bottom))`,
                right:"max(20px, calc(50vw - 175px))",
                width:52, height:52,
                background:"none", border:"none", cursor:"pointer",
                padding:0, zIndex:50,
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52" fill="none">
                <g filter="url(#filter0_d_190_2664)">
                  <rect x="6" y="4" width="40" height="40" rx="20" fill="white"/>
                  <mask id="mask0_190_2664" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="14" y="12" width="25" height="25">
                    <rect x="14" y="12" width="24.5" height="24.5" fill="#D9D9D9"/>
                  </mask>
                  <g mask="url(#mask0_190_2664)">
                    <path d="M25.1667 32.625V30.9583C23.4306 30.7639 21.941 30.0451 20.6979 28.8021C19.4549 27.559 18.7361 26.0694 18.5417 24.3333H16.875V22.6667H18.5417C18.7361 20.9306 19.4549 19.441 20.6979 18.1979C21.941 16.9549 23.4306 16.2361 25.1667 16.0417V14.375H26.8333V16.0417C28.5694 16.2361 30.059 16.9549 31.3021 18.1979C32.5451 19.441 33.2639 20.9306 33.4583 22.6667H35.125V24.3333H33.4583C33.2639 26.0694 32.5451 27.559 31.3021 28.8021C30.059 30.0451 28.5694 30.7639 26.8333 30.9583V32.625H25.1667ZM30.125 27.625C31.2639 26.4861 31.8333 25.1111 31.8333 23.5C31.8333 21.8889 31.2639 20.5139 30.125 19.375C28.9861 18.2361 27.6111 17.6667 26 17.6667C24.3889 17.6667 23.0139 18.2361 21.875 19.375C20.7361 20.5139 20.1667 21.8889 20.1667 23.5C20.1667 25.1111 20.7361 26.4861 21.875 27.625C23.0139 28.7639 24.3889 29.3333 26 29.3333C27.6111 29.3333 28.9861 28.7639 30.125 27.625ZM23.6458 25.8542C22.9931 25.2014 22.6667 24.4167 22.6667 23.5C22.6667 22.5833 22.9931 21.7986 23.6458 21.1458C24.2986 20.4931 25.0833 20.1667 26 20.1667C26.9167 20.1667 27.7014 20.4931 28.3542 21.1458C29.0069 21.7986 29.3333 22.5833 29.3333 23.5C29.3333 24.4167 29.0069 25.2014 28.3542 25.8542C27.7014 26.5069 26.9167 26.8333 26 26.8333C25.0833 26.8333 24.2986 26.5069 23.6458 25.8542Z" fill="#616168"/>
                  </g>
                </g>
                <defs>
                  <filter id="filter0_d_190_2664" x="0" y="0" width="52" height="52" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dy="2"/>
                    <feGaussianBlur stdDeviation="3"/>
                    <feComposite in2="hardAlpha" operator="out"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.03 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_190_2664"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_190_2664" result="shape"/>
                  </filter>
                </defs>
              </svg>
            </button>
            {/* FAB */}
            <button onClick={()=>{
                if(!navigator.geolocation) return;
                navigator.geolocation.getCurrentPosition(pos=>{
                  if(window.__mapboxFlyTo) window.__mapboxFlyTo(pos.coords.longitude, pos.coords.latitude);
                });
              }}
              style={{
                position:"fixed",
                bottom:`calc(${90 + 52 + 12}px + env(safe-area-inset-bottom))`,
                right:"max(20px, calc(50vw - 175px))",
                width:52, height:52,
                background:"none", border:"none", cursor:"pointer",
                padding:0, zIndex:50,
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52" fill="none">
                <g filter="url(#filter0_d_190_2664)">
                  <rect x="6" y="4" width="40" height="40" rx="20" fill="white"/>
                  <mask id="mask0_190_2664" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="14" y="12" width="25" height="25">
                    <rect x="14" y="12" width="24.5" height="24.5" fill="#D9D9D9"/>
                  </mask>
                  <g mask="url(#mask0_190_2664)">
                    <path d="M25.1667 32.625V30.9583C23.4306 30.7639 21.941 30.0451 20.6979 28.8021C19.4549 27.559 18.7361 26.0694 18.5417 24.3333H16.875V22.6667H18.5417C18.7361 20.9306 19.4549 19.441 20.6979 18.1979C21.941 16.9549 23.4306 16.2361 25.1667 16.0417V14.375H26.8333V16.0417C28.5694 16.2361 30.059 16.9549 31.3021 18.1979C32.5451 19.441 33.2639 20.9306 33.4583 22.6667H35.125V24.3333H33.4583C33.2639 26.0694 32.5451 27.559 31.3021 28.8021C30.059 30.0451 28.5694 30.7639 26.8333 30.9583V32.625H25.1667ZM30.125 27.625C31.2639 26.4861 31.8333 25.1111 31.8333 23.5C31.8333 21.8889 31.2639 20.5139 30.125 19.375C28.9861 18.2361 27.6111 17.6667 26 17.6667C24.3889 17.6667 23.0139 18.2361 21.875 19.375C20.7361 20.5139 20.1667 21.8889 20.1667 23.5C20.1667 25.1111 20.7361 26.4861 21.875 27.625C23.0139 28.7639 24.3889 29.3333 26 29.3333C27.6111 29.3333 28.9861 28.7639 30.125 27.625ZM23.6458 25.8542C22.9931 25.2014 22.6667 24.4167 22.6667 23.5C22.6667 22.5833 22.9931 21.7986 23.6458 21.1458C24.2986 20.4931 25.0833 20.1667 26 20.1667C26.9167 20.1667 27.7014 20.4931 28.3542 21.1458C29.0069 21.7986 29.3333 22.5833 29.3333 23.5C29.3333 24.4167 29.0069 25.2014 28.3542 25.8542C27.7014 26.5069 26.9167 26.8333 26 26.8333C25.0833 26.8333 24.2986 26.5069 23.6458 25.8542Z" fill="#616168"/>
                  </g>
                </g>
                <defs>
                  <filter id="filter0_d_190_2664" x="0" y="0" width="52" height="52" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dy="2"/>
                    <feGaussianBlur stdDeviation="3"/>
                    <feComposite in2="hardAlpha" operator="out"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.03 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_190_2664"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_190_2664" result="shape"/>
                  </filter>
                </defs>
              </svg>
            </button>
            <button className="fab"
              onClick={()=>setNewCiOpen(true)}>+</button>

            {/* bottom sheet */}
            <div className={`bsheet ${selSpot?"":"hidden"}`}>
              {selSpot && (()=>{
                const spotPosts = spotCheckins.filter(a=>a.hasImg);
                const allPhotoPosts = [
                  {id:"mock-0", spot:selSpot.name, emoji:"", color:"var(--red-bg)", hasImg:true, note:selSpot.comment, date:""},
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
                      <div className="bsheet-thumb">
                        {(spotPosts.length>0 && spotPosts[0].photos?.length>0) || window.__publicPhotos?.[selSpot.name]
                          ? <img src={(spotPosts.length>0 && spotPosts[0].photos?.[0]) || window.__publicPhotos?.[selSpot.name]} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:8}}/>
                          : <div style={{width:"100%",height:"100%",background:"var(--red-bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}></div>
                        }
                      </div>
                      <div className="bsheet-info">
                        <h3 style={{paddingRight:24,lineHeight:1.4,wordBreak:"break-all"}}>{selSpot.name}</h3>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
  <span style={{fontSize:12,color:"var(--text2)"}}>{catLabel(selSpot.category)}</span>
  <span style={{fontSize:12,color:"var(--text2)"}}>{selSpot.area}</span>
</div>
                        <div className="checkin-count" style={{display:"flex",alignItems:"center",gap:4}}>
                          <Ic.Pin/> {userLocation && selSpot.lat && selSpot.lng ? fmtDist(calcDist(userLocation.lat,userLocation.lng,selSpot.lat,selSpot.lng)) : "—"}
                        </div>
                        {selSpot.limited && (
                          <div style={{marginTop:4,display:"flex",alignItems:"center",gap:4}}>
                            <span className="limited-badge">LIMITED</span>
                            {selSpot.dateFrom && <span style={{fontSize:11,color:"var(--text3)"}}>{selSpot.dateFrom} → {selSpot.dateTo||"?"}</span>}
                          </div>
                        )}
                        <p className="sheet-comment">{selSpot.comment}</p>
                        <div style={{display:"flex",gap:8,marginTop:10,alignItems:"center"}}>
                          <button style={{padding:"5px 14px 6px",background:"var(--red)",color:"#fff",border:"none",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}} onClick={()=>openForm(selSpot)}>{t('checkinBtn')}</button>
                          <button style={{padding:"5px 14px 6px",background:"none",color:"var(--red)",border:"1.5px solid var(--red)",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>openDetail(selSpot)}>{t('detailBtn')}</button>
                          {/* 保存ボタン */}
                          <button className="bookmark-btn" onClick={()=>toggleSave(selSpot)} title={isSaved(selSpot)?t('filterSaved'):t('saveAction')}>
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
                <h3>🔖 {t('savedSpotsHeader')} ({savedSpots.length})</h3>
                <button className="saved-panel-close" onClick={()=>{setShowSaved(false);setMapFilter("all");}}>×</button>
              </div>
              {savedSpots.length===0
                ? <div className="saved-empty">{t('savedEmptyLine1')}<br/><span style={{fontSize:11,marginTop:4,display:"block"}}>{t('savedEmptyLine2')}</span></div>
                : savedSpots.map(s=>(
                  <div key={s.id} className="saved-item" onClick={()=>{setSelSpot(s);setShowSaved(false);}}>
                    <div className="saved-item-icon"></div>
                    <div className="saved-item-info">
                      <h4>{s.name}</h4>
                      <p>{catLabel(s.category)}　{s.area}</p>
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
            {!user ? (
              <>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"70vh",gap:16,padding:"0 32px",textAlign:"center"}}>
                <img src="/stamp_logo.png" alt="Stamps." style={{height:80}}/>
                <div style={{fontSize:14,color:"var(--text3)",lineHeight:1.6}}>{t('loginDescription')}</div>
                <button onClick={async()=>{try{const platform=Capacitor.getPlatform();if(platform==='web'){await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:'https://stampsapp.vercel.app/auth/callback'}});}else{const rawNonce=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');const encoder=new TextEncoder();const data=encoder.encode(rawNonce);const hashBuffer=await crypto.subtle.digest('SHA-256',data);const nonce=Array.from(new Uint8Array(hashBuffer)).map(b=>b.toString(16).padStart(2,'0')).join('');await SocialLogin.initialize({google:{webClientId:'368587032324-v1vbgkruufbgc13fedfr4pt0ef4em4qd.apps.googleusercontent.com',iOSClientId:'368587032324-pp8j5cuq1s5223kj6501btrh29k8qvg9.apps.googleusercontent.com',mode:'online'}});const r=await SocialLogin.login({provider:'google',options:{scopes:['email','profile'],nonce:nonce}});const idToken=r.result?.idToken;if(idToken){const{error}=await supabase.auth.signInWithIdToken({provider:'google',token:idToken,nonce:rawNonce});if(error)console.error(error);}}}catch(e){console.error(e);}}}
                  style={{width:"100%",padding:"14px 24px",background:"var(--red)",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#fff" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/></svg>
                  {t('loginWithGoogle')}
                </button>
                <div style={{width:"100%",display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:1,background:"var(--gray-200)"}}/><span style={{fontSize:12,color:"var(--text3)"}}>or</span><div style={{flex:1,height:1,background:"var(--gray-200)"}}/></div>
                <input id="magic-email" type="email" placeholder={t('emailPlaceholder')} style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"1.5px solid var(--gray-200)",fontSize:16,fontFamily:"inherit",boxSizing:"border-box"}}/>
                <button onClick={async()=>{const email=document.getElementById('magic-email').value;if(!email)return;const{error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:"https://stampsapp.vercel.app"}});if(error)showToast(error.message);else showToast(t('emailSent'));}}
                  style={{width:"100%",padding:"14px 24px",background:"#616168",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  {t('loginWithEmail')}
                </button>
              </div>
              </>
            ) : (
              <>
              <div style={{padding:"8px 16px 0",marginTop:isNative?44:20,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <button onClick={()=>supabase.auth.signOut()}
                  style={{background:"none",border:"none",color:"var(--text3)",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                  {t('logout')}
                </button>
              </div>
            <div className="profile-hd">
              <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:15}}>
                <div style={{flex:1,minWidth:0,paddingBottom:4}}>
                  <div className="prof-name">{profile.name}</div>
                  <div className="prof-bio">{profile.bio}</div>
                  <div style={{fontSize:11,color:"var(--text3)",marginTop:6}}>Post: {archives.filter(a=>a.photos?.length>0).length}　Checkin: {archives.length}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                  <div className="avatar">
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>
                      : <Ic.User s={36}/>}
                  </div>
                  <button className="edit-btn" onClick={()=>{
                    setEditDraft({name:profile.name,location:profile.location,bio:profile.bio,avatar_url:profile.avatar_url||""});
                    setProfileEditOpen(true);
                  }}><Ic.Edit/></button>
                </div>
              </div>
            </div>

            {/* フォルダ一覧 */}
            {(()=>{
              const allFolders = [
                { id:"all", title:t('filterAll'), items: archives },
                ...folders.map(f=>({
                  id: f.id,
                  title: f.title,
                  items: archives.filter(e=>f.ids.includes(e.id))
                }))
              ];
              return (
                <div style={{padding:"20px 16px 100px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                    {allFolders.map(f=>{
                      const coverUrl = f.cover_url || f.items.find(e=>e.photos&&e.photos.length>0)?.photos[0];
                      return (
                        <div key={f.id} onClick={()=>setSelGroup({id:f.id,title:f.title,items:f.items})}
                          style={{borderRadius:8,overflow:"hidden",cursor:"pointer",position:"relative",aspectRatio:"2/3",background:"#444"}}>
                          {coverUrl ? (
                            <img src={coverUrl}
                              style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                          ) : (
                            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>📁</div>
                          )}
                          {f.id!=="all" && (
                            <div style={{position:"absolute",top:6,right:6}} onClick={e=>e.stopPropagation()}>
                              <button onClick={()=>setFolderMenuOpen(m=>m===f.id?null:f.id)}
                                style={{background:"rgba(0,0,0,.4)",border:"none",borderRadius:"50%",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",padding:0}}>
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/></svg>
                              </button>
                              {folderMenuOpen===f.id && (
                                <div style={{position:"absolute",top:28,right:0,background:"#fff",borderRadius:8,boxShadow:"0 2px 8px rgba(0,0,0,.2)",overflow:"hidden",zIndex:5}}>
                                  <button onClick={async()=>{
                                    if(!confirm(t('confirmDeleteFolder'))) return;
                                    await supabase.from("folders").delete().eq("id", f.id);
                                    setFolders(fs=>fs.filter(fo=>fo.id!==f.id));
                                    setFolderMenuOpen(null);
                                    showToast(t('folderDeleted'));
                                  }} style={{background:"none",border:"none",padding:"10px 16px",color:"var(--red)",fontSize:13,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"}}>{t('delete')}</button>
                                </div>
                              )}
                            </div>
                          )}
                          <div style={{position:"absolute",bottom:0,left:0,right:0,
                            padding:"20px 8px 8px",
                            background:"linear-gradient(to top,rgba(0,0,0,.5),transparent)"}}>
                            <div style={{color:"#fff",fontWeight:700,fontSize:13}}>{f.title}</div>
                            <div style={{color:"rgba(255,255,255,.7)",fontSize:11}}>{f.items.filter(e=>e.photos&&e.photos.length>0).length} stamps</div>
                          </div>
                        </div>
                      );
                    })}
                    <button onClick={()=>setShowFolderModal(true)}
                      style={{display:"flex",alignItems:"center",justifyContent:"center",
                        aspectRatio:"2/3",background:"none",border:"1.5px dashed var(--border)",borderRadius:8,
                        cursor:"pointer",color:"var(--text2)",fontSize:24,fontFamily:"inherit"}}>
                      ＋
                    </button>
                  </div>
                </div>
              );
            })()}
            </>
            )}
          </div>
        )}

        {/* ════ BOTTOM NAV ════ */}


        {/* ════ CHECKIN FORM OVERLAY ════ */}
        <div className={`overlay ${overlay==="form"?"open":""}`} style={{overflowY:"auto"}}>
          {selSpot && overlay==="form" && <>
            <div style={{display:"flex",alignItems:"center",padding:"14px 16px 12px",position:"sticky",top:0,background:"var(--white)",zIndex:10}}>
              <button className="ov-back" style={{position:"static",background:"none",border:"none",cursor:"pointer",color:"var(--text2)",display:"flex",padding:0}} onClick={closeOv}>
                <Ic.Back/>
              </button>
            </div>
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
            </div>
            <div className="ov-body">
              <div className="ov-name">{selSpot.name}</div>
              <div className="ov-sub">{catLabel(selSpot.category)}　{selSpot.area}</div>
              {!(showSpotEdit && isCheckedIn(selSpot)) && (
              <div className="input-card">
                <textarea placeholder={t('latestInfoPlaceholder')} value={ciText} onChange={e=>setCiText(e.target.value)}/>
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
                      onChange={async e=>{
                        const files = Array.from(e.target.files);
                        e.target.value="";
                        for(const f of files){
                          const resized = await resizeImage(f);
                          setCiPhotos(ps=>[...ps,resized]);
                        }
                      }}/>
                  </label>
                  <label className="mbtn" style={{cursor:"pointer"}}>
                    <Ic.Camera/>
                    <input type="file" accept="image/*" capture="environment" style={{display:"none"}}
                      onChange={async e=>{
                        const f=e.target.files[0]; if(!f) return;
                        e.target.value="";
                        const resized = await resizeImage(f);
                        setCiPhotos(ps=>[...ps,resized]);
                      }}/>
                  </label>
                </div>
              </div>)}
              {/* スポット情報入力 */}
              {showSpotEdit && (
                <div style={{width:"100%",boxSizing:"border-box"}}>
                  {!isCheckedIn(selSpot) && (
                    <div style={{fontSize:13,color:"var(--red)",fontWeight:700,marginBottom:12,textAlign:"left"}}>
                      {t('firstCheckinMessage')}
                    </div>
                  )}
                  <div style={{marginBottom:12}}>
                    <label style={{fontSize:12,color:"var(--text3)",fontWeight:500,display:"block",marginBottom:4}}>{t('hoursLabel')}</label>
                    <input className="modal-input" placeholder={t('hoursPlaceholder')}
                      value={ciHours} onChange={e=>setCiHours(e.target.value)} style={{margin:0,width:"100%",boxSizing:"border-box",background:"#fff"}}/>
                  </div>
                  <div style={{marginBottom:4}}>
                    <label style={{fontSize:12,color:"var(--text3)",fontWeight:500,display:"block",marginBottom:4}}>{t('stampLocationLabel')}</label>
                    <input className="modal-input" placeholder={t('stampLocationPlaceholder')}
                      value={ciLocation} onChange={e=>setCiLocation(e.target.value)} style={{margin:0,width:"100%",boxSizing:"border-box",background:"#fff"}}/>
                  </div>
                </div>
              )}
              {/* 期間限定設定 */}
              {!(showSpotEdit && isCheckedIn(selSpot)) && <div className="vis-row" style={{marginBottom:"-8px"}}>
                <label>{t('limitedTimeLabel')}</label>
                <div className="vis-tog">
                  <button className={`vtbtn ${ciLimited?"on":""}`} onClick={()=>setCiLimited(true)}>ON</button>
                  <button className={`vtbtn ${!ciLimited?"on":""}`} onClick={()=>setCiLimited(false)}>OFF</button>
                </div>
              </div>}
              {ciLimited && (
                <>
                <div style={{width:"100%",boxSizing:"border-box",marginTop:"4px"}}>
                  <input className="limited-date-input" placeholder="イベント名（任意）"
                    value={ciEventName} onChange={e=>setCiEventName(e.target.value)}
                    style={{fontSize:16,background:"#fff",width:"100%",padding:"8px 12px"}}/>
                </div>
                <div className="limited-dates" style={{marginTop:"4px"}}>
                  <div className="limited-date-field">
                    <span className="limited-date-label">START</span>
                    <input type="date" className="limited-date-input"
                      value={ciDateFrom} onChange={e=>setCiDateFrom(e.target.value)}
                      style={{appearance:"none",WebkitAppearance:"none"}}/>
                  </div>
                  <span className="limited-sep" style={{paddingBottom:10,flexShrink:0}}>→</span>
                  <div className="limited-date-field">
                    <span className="limited-date-label">END</span>
                    <input type="date" className="limited-date-input"
                      value={ciDateTo} onChange={e=>setCiDateTo(e.target.value)}
                      style={{appearance:"none",WebkitAppearance:"none"}}/>
                  </div>
                </div>
                </>
              )}
              </div>
              {!(showSpotEdit && isCheckedIn(selSpot)) && <div className="vis-row" style={{paddingLeft:16,paddingRight:16,width:"100%",boxSizing:"border-box",marginTop:"-4px"}}>
                <label>{t('visibilityLabel')}</label>
                <div className="vis-tog">
                  <button className={`vtbtn ${ciVis==="public"?"on":""}`} onClick={()=>setCiVis("public")}>{t('makePublic')}</button>
                  <button className={`vtbtn ${ciVis==="private"?"on":""}`} onClick={()=>setCiVis("private")}>{t('onlyMe')}</button>
                </div>
              </div>}
              {showSpotEdit && isCheckedIn(selSpot) ? (
                <button className="submit-btn" onClick={async()=>{
                  if(ciHours||ciLocation){
                    await supabase.from("spots").upsert({
                      id:String(selSpot.id||selSpot.name),
                      name:selSpot.name,
                      hours:ciHours||"",
                      location:ciLocation||"",
                      creator_name:profile.name||user?.email||"",
                      created_by:user?.id||"",
                      updated_at:new Date().toISOString(),
                    },{onConflict:"id"});
                    setSelSpot(s=>s?{...s,hours:ciHours||s.hours,location:ciLocation||s.location,creator_name:profile.name||user?.email||"",created_by:user?.id||"",spot_updated_at:new Date().toISOString()}:s);
                  }
                  setOverlay("detail");
                  showToast(t('spotInfoUpdated'),"ok");
                }} style={{marginTop:40,marginBottom:120,marginLeft:16,marginRight:16,width:"calc(100% - 32px)"}}>
                  {t('saveAction')}
                </button>
              ) : (
                <button className="submit-btn" onClick={submit} disabled={submitting} style={{marginTop:40,marginBottom:120,marginLeft:16,marginRight:16,width:"calc(100% - 32px)",opacity:submitting?0.5:1}}>{submitting?t('submitting'):t('checkinBtn')}</button>
              )}
          </>}
        </div>


        {/* ════ DETAIL OVERLAY ════ */}
        <div className={`overlay ${overlay==="detail"?"open":""}`} style={{overflowY:"auto"}}>
          {selSpot && overlay==="detail" && (()=>{
            // このスポットへのチェックイン一覧
            const spotPosts = spotCheckins;
            // モックレビューも投稿カード形式に変換
            const mockPosts = (selSpot.reviews||[]).filter(r=>r.text).map((r,i)=>({
              id:`mock-${i}`, spot:selSpot.name, note:r.text,
              date:"2025/11/01 10:00", hasImg:false, emoji:"",
              color:"var(--red-bg)", user:r.user||"Anonymous"
            }));
            const allPosts = [...spotPosts, ...mockPosts];
            return <>
              {/* ── ヘッダー: 戻るボタン左上 ── */}
              <div style={{display:"flex",alignItems:"center",padding:"14px 16px 12px",position:"sticky",top:0,background:"var(--white)",zIndex:10}}>
                <button className="ov-back" style={{position:"static",background:"none",border:"none",cursor:"pointer",color:"var(--text2)",display:"flex",padding:0}} onClick={closeOv}>
                  <Ic.Back/>
                </button>
              </div>
              <div className="ov-body" style={{paddingTop:16}}>
                {/* 投稿済み写真（メイン1枚＋ドット） */}
                {(()=>{
                  const photoEntries = spotPosts.flatMap(a=>(a.photos||[]).filter(Boolean).map(url=>({url, limited:a.limited, dateFrom:a.dateFrom, dateTo:a.dateTo, note:a.note, user:a.user})));
                  if(photoEntries.length===0) return null;
                  const photos = photoEntries.map(e=>e.url);
                  const current = photoEntries[detailPhotoIdx||0];
                  return (
                    <div style={{width:"100%",marginBottom:16}}>
                      <div style={{position:"relative"}}>
                        <img src={current.url} style={{width:"100%",height:280,borderRadius:8,objectFit:"cover",display:"block",cursor:"pointer",background:"var(--gray-100)"}}
                          onTouchStart={e=>{e.currentTarget._startX=e.touches[0].clientX;}}
                          onTouchEnd={e=>{
                            const diff = e.changedTouches[0].clientX - e.currentTarget._startX;
                            const idx = detailPhotoIdx||0;
                            if(diff > 50 && idx>0) setDetailPhotoIdx(idx-1);
                            if(diff < -50 && idx<photos.length-1) setDetailPhotoIdx(idx+1);
                          }}
                          onClick={()=>setPhotoViewer({posts:photoEntries.map((e,i)=>({id:`detail-${i}`,hasImg:true,photos:[e.url],color:"#000",note:e.note,user:e.user})),postIdx:detailPhotoIdx||0,imgIdx:0})}/>
                        {current.limited && (
                          <div style={{position:"absolute",left:12,bottom:12,display:"flex",alignItems:"center",gap:6}}>
                            <span className="limited-badge">LIMITED</span>
                            {current.dateFrom && <span style={{fontSize:12,color:"#fff"}}>{current.dateFrom} → {current.dateTo||t('tbd')}</span>}
                          </div>
                        )}
                      </div>
                      {photos.length>1 && (
                        <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:8}}>
                          {photos.map((_,i)=>(
                            <button key={i} onClick={()=>setDetailPhotoIdx(i)}
                              style={{width:6,height:6,borderRadius:"50%",border:"none",cursor:"pointer",
                                background:(detailPhotoIdx||0)===i?"var(--red)":"var(--border)",padding:0}}/>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
                {/* タイトル＋ブックマーク */}
<div style={{display:"flex",alignItems:"center",width:"100%"}}>
  <div className="ov-name" style={{flex:1,margin:0,textAlign:"center"}}>{selSpot.name}</div>
</div>
<div className="ov-sub" style={{display:"flex",gap:8,marginTop:-4,justifyContent:"flex-start"}}>
  <span>{catLabel(selSpot.category)}</span>
  <span>{selSpot.area}</span>
</div>
                <div style={{display:"flex",padding:"12px",flexDirection:"column",alignItems:"flex-start",gap:8,alignSelf:"stretch",borderRadius:4,background:"#F6F6F6",marginTop:20}}>
                  <div className="mrow"><span style={{display:"inline-flex",marginTop:2}}><Ic.Clock/></span> {selSpot.hours}</div>
                  <div className="mrow"><Ic.Pin/> {selSpot.location}</div>
                </div>
                {/* 投稿一覧 */}
                <div className="spot-posts" style={{display:"flex",flexDirection:"column",alignItems:"stretch",gap:12,alignSelf:"stretch"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:4,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span>{t('postsLabel')} ({allPosts.length})</span>
                  </div>
                  {allPosts.length===0
                    ? <div className="spot-empty">{t('noPostsYet')}<br/>{t('startCheckinPrompt')}</div>
                    : <>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 12px",width:"100%"}}>
                      {(showAllPosts ? allPosts : allPosts.slice(0,2)).map((post,pi)=>(
                        <div key={post.id} className="spot-post-card" style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:8,background:"#F7F7F7",borderRadius:8,padding:12,boxShadow:"none"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,width:"100%"}}>
                            <div className="spot-post-avatar">
                              {post.avatar_url ? <img src={post.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/> : <Ic.User s={14}/>}
                            </div>
                            <div className="spot-post-meta">
                              <h4>{post.user||"You"}</h4>
                              <p>{post.date}</p>
                            </div>
                          </div>
                          {post.note && <>
                            <p className={`spot-post-text${(expandedPosts||[]).includes(post.id)?" expanded":""}`}>{post.note}</p>
                            {post.note.length>60 && !(expandedPosts||[]).includes(post.id) && (
                              <button onClick={e=>{e.stopPropagation();setExpandedPosts(p=>[...(p||[]),post.id]);}}
                                style={{background:"none",border:"none",color:"var(--text3)",fontSize:11,cursor:"pointer",padding:0,fontFamily:"inherit",marginBottom:6}}>続きを見る</button>
                            )}
                          </>}
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
                          {user && archives.some(a=>a.id===post.id) && (
                            <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
                              <button onClick={()=>setTimelineMenu(m=>m===post.id?null:post.id)}
                                style={{background:"none",border:"none",cursor:"pointer",color:"var(--text3)",fontSize:16,padding:"0 4px"}}>•••</button>
                              {timelineMenu===post.id && (
                                <div style={{position:"absolute",bottom:24,left:0,background:"#fff",borderRadius:8,boxShadow:"0 2px 12px rgba(0,0,0,.15)",zIndex:20,overflow:"hidden",minWidth:120}}>
                                  <button onClick={()=>{
                                    setEditingCheckin({id:post.id,spot_id:selSpot?.id,note:post.note,photos:post.photos||[]});
                                    setEditNote(post.note||"");
                                    setEditPhotos(post.photos||[]);
                                    setEditLimited(post.limited||false);
                                    setEditEventName(post.eventName||"");
                                    setEditDateFrom(post.dateFrom||"");
                                    setEditDateTo(post.dateTo||"");
                                    setEditHours(selSpot?.hours||"");
                                    setEditLocation(selSpot?.location||"");
                                    setTimelineMenu(null);
                                  }} style={{display:"block",width:"100%",padding:"10px 16px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>編集</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      </div>
                      {allPosts.length>2 && (
                        <button onClick={()=>setShowAllPosts(v=>!v)}
                          style={{background:"none",border:"none",color:"var(--text3)",fontSize:13,
                            cursor:"pointer",fontFamily:"inherit",textDecoration:"underline",padding:"4px 0 0"}}>
                          {showAllPosts ? t('close') : t('viewMore',{count:allPosts.length-2})}
                        </button>
                      )}
                    </>
                  }
                </div>

                {(selSpot.creator_name||selSpot.spot_created_at) && (
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 0",borderTop:"1px solid var(--gray-50)",marginTop:40,width:"100%"}}>
                    <div style={{width:32,height:32,borderRadius:"50%",background:"var(--gray-100)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
                      {creatorAvatar ? <img src={creatorAvatar} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <Ic.User s={16}/>}
                    </div>
                    <div style={{fontSize:13,color:"var(--text2)"}}>
                      <span style={{fontWeight:600,color:"var(--text)"}}>{selSpot.creator_name}</span>
                      {selSpot.spot_created_at && <span style={{color:"var(--text3)",marginLeft:6}}>{(selSpot.spot_updated_at||selSpot.spot_created_at).slice(0,10).replace(/-/g,"/")+"に更新"}</span>}
                    </div>
                  </div>
                )}
                <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8,width:"100%"}}>
                  <button className="submit-btn" style={{flex:1,margin:0}} onClick={()=>setOverlay("form")}>{t('checkinHere')}</button>
                  <button className="bookmark-btn" onClick={()=>toggleSave(selSpot)}
                    style={{flexShrink:0,width:44,height:44,borderRadius:12,border:"1px solid var(--border)",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <BookmarkSVG active={isSaved(selSpot)} size={20}/>
                  </button>
                </div>
                <button onClick={()=>{setShowSpotEdit(true);setCiHours(selSpot.hours||"");setCiLocation(selSpot.location||"");setOverlay("form");}}
                  style={{background:"none",border:"none",color:"var(--text3)",fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"block",margin:"8px auto 0",textDecoration:"underline"}}>
                  {t('editSpotInfo')}
                </button>

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
              <h2>{t('checkinRecordsTitle')}</h2>
            </div>
            {selArc.photos && selArc.photos.length > 0 ? (
              <div style={{marginTop:16,display:"flex",gap:6,overflowX:"auto"}}>
                {selArc.photos.map((url,i)=>(
                  <img key={i} src={url} style={{width:"100vw",flexShrink:0,height:260,objectFit:"cover",display:"block"}}/>
                ))}
              </div>
            ) : (
              <div className="arc-img">{selArc.emoji}</div>
            )}
            <div className="arc-body">
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div className="arc-spot">{selArc.spot}</div>
                <button onClick={async()=>{
                  if(!confirm(t('confirmDeleteCheckinRecord'))) return;
                  const {supabase} = await import("../../lib/supabase");
                  await supabase.from("checkins").delete().eq("id", selArc.id);
                  setArchives(a=>a.filter(e=>e.id!==selArc.id));
                  setSelArc(null);
                  showToast(t('deletedToast'));
                }} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text3)",padding:4}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
              <div className="arc-sub">{selArc.sub}</div>
              <div className="arc-date">{selArc.date}</div>
              {selArc.limited && (
                <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}>
                  <span className="limited-badge">LIMITED</span>
                  {selArc.dateFrom && <span style={{fontSize:12,color:"var(--text3)"}}>{selArc.dateFrom} → {selArc.dateTo||t('tbd')}</span>}
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
              <Ic.Back/> {t('backToMap')}
            </button>
            <div className="nearby-search-input">
              <Ic.Search/>
              <input
                placeholder={t('searchPlaceholderStation')}
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
                {nearbyGeoLoading && <div style={{padding:"24px 16px",textAlign:"center",color:"var(--text3)",fontSize:13}}>{t('searching')}</div>}
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
                      category: result.types?.[0] || "place",
                      area: result.address_components?.find(c=>c.types?.includes("locality"))?.long_name || "",
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
                    <div className="nearby-info">
                      <h4>{f.structured_formatting?.main_text || f.description}</h4>
                      <p style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.structured_formatting?.secondary_text || f.description}</p>
                    </div>
                  </div>
                ))}
                {!nearbyGeoLoading && nearbyGeoResults.length === 0 && (
                  <div style={{padding:"32px 16px",textAlign:"center",color:"var(--text3)",fontSize:13}}>{t('notFound')}</div>
                )}
              </>
            ) : (
              locLoading ? (
                <div style={{padding:"40px 16px",textAlign:"center",color:"var(--text3)",fontSize:13}}>{t('gettingLocation')}</div>
              ) : (()=>{
                const filtered = dbSpots
                  .map(s=>({...s, dist: userLocation ? calcDist(userLocation.lat,userLocation.lng,s.lat,s.lng) : null}))
                  .sort((a,b)=> a.dist!=null&&b.dist!=null ? a.dist-b.dist : 0);
                const nearby  = filtered.filter(s=>s.dist!=null && s.dist<=1.0);
                const farther = filtered.filter(s=>s.dist==null || s.dist>1.0);
                return <>
                  {nearby.length>0 && <>
                    {nearby.map(s=>(
                      <div key={s.id} className="nearby-item" onClick={()=>{
                        setNearbyOpen(false); setNearbySearch("");
                        if(window.__mapboxFlyTo) window.__mapboxFlyTo(s.lng, s.lat);
                        setSelSpot(s); setTab("map");
                      }}>
                        <div className="nearby-info"><h4>{s.name}</h4><p>{catLabel(s.category)}　{s.area}</p></div>
                        <div className="nearby-dist">{s.dist!=null && fmtDist(s.dist)}</div>
                      </div>
                    ))}
                  </>}
                  {farther.length>0 && <>
                    {farther.map(s=>(
                      <div key={s.id} className="nearby-item" onClick={()=>{
                        setNearbyOpen(false); setNearbySearch("");
                        if(window.__mapboxFlyTo) window.__mapboxFlyTo(s.lng, s.lat);
                        setSelSpot(s); setTab("map");
                      }}>
                        <div className="nearby-info"><h4>{s.name}</h4><p>{catLabel(s.category)}　{s.area}</p></div>
                        <div className="nearby-dist">{s.dist!=null && fmtDist(s.dist)}</div>
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
            <h2>{t('selectSpotTitle')}</h2>
          </div>
          <div className="spot-search-box">
            <Ic.Search/>
            <input
              placeholder={t('searchPlaceholderTower')}
              value={spotSearch}
              onChange={e=>searchGeo(e.target.value)}
              autoFocus
            />
          </div>
          <div className="spot-list">
            {geoLoading && (
              <div style={{padding:"24px 16px",textAlign:"center",color:"var(--text3)",fontSize:13}}>{t('searching')}</div>
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
                  category: result.types?.[0] || "place",
                  area: result.address_components?.find(c=>c.types?.includes("locality"))?.long_name || "",
                  creator_name: profile.name || user?.email || "",
                  created_by: user?.id || "",
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
                <div className="spot-list-info">
                  <h4>{f.structured_formatting?.main_text || f.description}</h4>
                  <p style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.structured_formatting?.secondary_text || f.description}</p>
                </div>
              </div>
            ))}
            {!geoLoading && spotSearch.length >= 2 && geoResults.length === 0 && (
              <div style={{padding:"32px 16px",textAlign:"center",color:"var(--text3)",fontSize:13}}>
                {t('notFound')}
              </div>
            )}
            {spotSearch.trim() === "" && (
              userLocation && dbSpots.length > 0 ? (
                <>
                  {[...dbSpots]
                    .map(s=>({...s, dist: calcDist(userLocation.lat,userLocation.lng,s.lat,s.lng)}))
                    .sort((a,b)=>a.dist-b.dist)
                    .slice(0,10)
                    .map(s=>(
                      <div key={s.id} className="spot-list-item" onClick={()=>{
                        setNewCiOpen(false);
                        setSpotSearch("");
                        setGeoResults([]);
                        openForm(s);
                      }}>
                        <div className="spot-list-info">
                          <h4>{s.name}</h4>
                          <p style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{catLabel(s.category)}　{s.area}</p>
                        </div>
                      </div>
                    ))}
                </>
              ) : (
                <div style={{padding:"32px 16px",textAlign:"center",color:"var(--text3)",fontSize:13}}>
                  {t('searchBySpotOrAddress')}
                </div>
              )
            )}
          </div>
        </div>





        {/* ════ PROFILE EDIT OVERLAY ════ */}
        <div className={`profile-edit-overlay ${profileEditOpen?"open":""}`}>
          <div className="pe-hd">
            <button className="arc-back" onClick={()=>setProfileEditOpen(false)}><Ic.Back/></button>
            <h2>{t('editProfileTitle')}</h2>
            <button className="pe-save" onClick={async()=>{
              await supabase.from("profiles").upsert({id:user.id,...editDraft});
              setProfile({...editDraft});
              setProfileEditOpen(false);
              showToast(t('profileSaved'),"ok");
            }}>{t('saveBtn')}</button>
          </div>
          <div className="pe-body">
            {/* アバター */}
            <div className="pe-avatar-area">
              <label style={{cursor:"pointer"}}>
                <div className="pe-avatar">
                  {editDraft.avatar_url
                    ? <img src={editDraft.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>
                    : <Ic.User s={40}/>}
                  <div className="pe-avatar-edit">＋</div>
                </div>
                <input type="file" accept="image/*" style={{display:"none"}} onChange={async(e)=>{
                  const file = e.target.files[0];
                  if(!file||!user) return;
                  const path = `avatars/${user.id}/${Date.now()}.${file.name.split(".").pop()}`;
                  const { error } = await supabase.storage.from("photos").upload(path, file);
                  if(!error){
                    const { data } = supabase.storage.from("photos").getPublicUrl(path);
                    setEditDraft(d=>({...d, avatar_url: data.publicUrl}));
                  }
                }}/>
              </label>
              <label style={{cursor:"pointer",fontSize:13,color:"var(--red)"}}>
                {t('changePhoto')}
                <input type="file" accept="image/*" style={{display:"none"}} onChange={async(e)=>{
                  const file = e.target.files[0];
                  if(!file||!user) return;
                  const path = `avatars/${user.id}/${Date.now()}.${file.name.split(".").pop()}`;
                  const { error } = await supabase.storage.from("photos").upload(path, file);
                  if(!error){
                    const { data } = supabase.storage.from("photos").getPublicUrl(path);
                    setEditDraft(d=>({...d, avatar_url: data.publicUrl}));
                  }
                }}/>
              </label>
            </div>

            {/* 名前 */}
            <div className="pe-field">
              <label className="pe-label">NAME</label>
              <input className="pe-input" placeholder={t('namePlaceholder')}
                value={editDraft.name}
                onChange={e=>setEditDraft(d=>({...d,name:e.target.value}))}/>
            </div>

            {/* 自己紹介 */}
            <div className="pe-field">
              <label className="pe-label">BIO</label>
              <textarea className="pe-textarea" placeholder={t('bioPlaceholder')}
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
            const imgItems = items.filter(e=>e.hasImg||( e.photos&&e.photos.length>0));
            const left  = imgItems.filter((_,i)=>i%2===0);
            const right = imgItems.filter((_,i)=>i%2===1);
            return <>
              <div className="group-hd">
                <button className="arc-back" onClick={()=>setSelGroup(null)}><Ic.Back/></button>
                <h2 style={{whiteSpace:"normal",overflow:"visible",textOverflow:"unset"}}>{selGroup.title}</h2>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"0 16px",margin:"14px 0 4px"}}>
                <span className="group-count">{items.length} stamps</span>
                {selGroup.id!=="all" && (
                  <button onClick={()=>{
                    const folder = folders.find(f=>f.id===selGroup.id);
                    if(!folder) return;
                    setFolderName(folder.title);
                    setFolderPhotos(archives.filter(a=>folder.ids.includes(a.id)));
                    setEditingFolderId(folder.id);
                    setShowFolderModal(true);
                  }} style={{background:"none",border:"none",color:"var(--text2)",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{t('edit')}</button>
                )}
              </div>
              <div className="group-masonry">
                <div className="group-col">
                  {left.map((e,i)=>(
                    <div key={e.id} className="group-cell" onClick={()=>setSelArc(e)}>
                      <div className="group-cell-img"
                        style={{height:leftHeights[i%leftHeights.length],background:e.color||"var(--gray-100)"}}>
                        {e.photos&&e.photos.length>0
                          ? <img src={e.photos[0]} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
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
                        {e.photos&&e.photos.length>0
                          ? <img src={e.photos[0]} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
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
          const imgIdx = photoViewer.imgIdx||0;
          const photoCount = post.photos?.length||0;
          return (
            <div className="photo-viewer" onClick={()=>setPhotoViewer(null)}>
              <button className="photo-viewer-close" onClick={()=>setPhotoViewer(null)}>×</button>
              <div className="photo-viewer-img" onClick={e=>e.stopPropagation()}
                onTouchStart={e=>{e.currentTarget._startX=e.touches[0].clientX;}}
                onTouchEnd={e=>{
                  const diff = e.changedTouches[0].clientX - e.currentTarget._startX;
                  if(diff > 50 && imgIdx>0) setPhotoViewer({...photoViewer,imgIdx:imgIdx-1});
                  if(diff < -50 && imgIdx<photoCount-1) setPhotoViewer({...photoViewer,imgIdx:imgIdx+1});
                }}
                style={{background:photoCount>0?"#000":(post.color||"var(--red-bg)"),display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                {photoCount>0
                  ? <img src={post.photos[imgIdx]} style={{width:"100%",height:"auto",maxHeight:"80vh",objectFit:"contain"}}/>
                  : <span style={{fontSize:80}}>{post.emoji}</span>}
              </div>
              {photoCount>1 && (
                <div className="photo-viewer-nav" onClick={e=>e.stopPropagation()}>
                  <button className="photo-nav-btn" disabled={imgIdx===0}
                    onClick={()=>setPhotoViewer({...photoViewer,imgIdx:imgIdx-1})}>‹</button>
                  <span className="photo-viewer-counter">{imgIdx+1} / {photoCount}</span>
                  <button className="photo-nav-btn" disabled={imgIdx===photoCount-1}
                    onClick={()=>setPhotoViewer({...photoViewer,imgIdx:imgIdx+1})}>›</button>
                </div>
              )}
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
                <h3>{t('selectFolderTitle')}</h3>
                <button onClick={()=>setShowFolderPicker(false)}>×</button>
              </div>
              <div className="modal-body">
                {folders.length===0 && (
                  <div style={{padding:"24px 0",textAlign:"center",color:"var(--text3)",fontSize:13}}>{t('noFolders')}</div>
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
                    showToast(t('addedToFolder',{name:f.title}),"ok");
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
                  {t('createNewFolder')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ CHECKIN EDIT MODAL ════ */}
        {editingCheckin && (
          <div className="modal-backdrop" onClick={()=>setEditingCheckin(null)}>
            <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
              <div className="modal-sheet-hd">
                <h3>投稿を編集</h3>
                <button onClick={()=>{setEditingCheckin(null);setEditLimited(false);setEditEventName("");setEditDateFrom("");setEditDateTo("");setEditHours("");setEditLocation("");}}>×</button>
              </div>
              <div className="modal-body" style={{paddingBottom:40}}>
                <label className="modal-field-label">コメント</label>
                <textarea className="modal-input" value={editNote} onChange={e=>setEditNote(e.target.value)}
                  style={{minHeight:80,resize:"none",background:"#fff"}}/>
                <label className="modal-field-label">{t('hoursLabel')}</label>
                <input className="modal-input" placeholder={t('hoursPlaceholder')} value={editHours}
                  onChange={e=>setEditHours(e.target.value)} style={{background:"#fff",fontSize:16}}/>
                <label className="modal-field-label">{t('stampLocationLabel')}</label>
                <input className="modal-input" placeholder={t('stampLocationPlaceholder')} value={editLocation}
                  onChange={e=>setEditLocation(e.target.value)} style={{background:"#fff",fontSize:16}}/>
                <div className="vis-row" style={{width:"100%",marginBottom:8}}>
                  <label>{t('limitedTimeLabel')}</label>
                  <div className="vis-tog">
                    <button className={`vtbtn ${editLimited?"on":""}`} onClick={()=>setEditLimited(true)}>ON</button>
                    <button className={`vtbtn ${!editLimited?"on":""}`} onClick={()=>setEditLimited(false)}>OFF</button>
                  </div>
                </div>
                {editLimited && (<>
                  <div style={{width:"100%",boxSizing:"border-box",marginBottom:8}}>
                    <input className="limited-date-input" placeholder="イベント名（任意）"
                      value={editEventName} onChange={e=>setEditEventName(e.target.value)}
                      style={{fontSize:16,background:"#fff",width:"100%",padding:"8px 12px"}}/>
                  </div>
                  <div className="limited-dates" style={{width:"100%",marginBottom:8}}>
                    <div className="limited-date-field">
                      <span className="limited-date-label">START</span>
                      <input type="date" className="limited-date-input" value={editDateFrom} onChange={e=>setEditDateFrom(e.target.value)} style={{appearance:"none",WebkitAppearance:"none"}}/>
                    </div>
                    <span className="limited-sep" style={{paddingBottom:10,flexShrink:0}}>→</span>
                    <div className="limited-date-field">
                      <span className="limited-date-label">END</span>
                      <input type="date" className="limited-date-input" value={editDateTo} onChange={e=>setEditDateTo(e.target.value)} style={{appearance:"none",WebkitAppearance:"none"}}/>
                    </div>
                  </div>
                </>)}
                <label className="modal-field-label">画像</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:32}}>
                  {editPhotos.map((url,i)=>(
                    <div key={i} style={{position:"relative",width:80,height:80}}>
                      <img src={url} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:8}}/>
                      <button onClick={()=>setEditPhotos(p=>p.filter((_,j)=>j!==i))}
                        style={{position:"absolute",top:-6,right:-6,width:20,height:20,borderRadius:"50%",background:"#616168",border:"none",color:"#fff",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                    </div>
                  ))}
                  <label style={{width:80,height:80,border:"1.5px dashed var(--border)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:24,color:"var(--text3)"}}>
                    ＋
                    <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={async e=>{
                      const files = Array.from(e.target.files||[]);
                      for(const file of files){
                        const canvas = document.createElement("canvas");
                        const img = new Image();
                        img.src = URL.createObjectURL(file);
                        await new Promise(r=>{img.onload=r;});
                        const max=1920;
                        let w=img.width,h=img.height;
                        if(w>max||h>max){ if(w>h){h=Math.round(h*max/w);w=max;}else{w=Math.round(w*max/h);h=max;} }
                        canvas.width=w; canvas.height=h;
                        canvas.getContext("2d").drawImage(img,0,0,w,h);
                        canvas.toBlob(async blob=>{
                          const path=`photos/${user.id}/${Date.now()}_${file.name}`;
                          const {data}=await supabase.storage.from("photos").upload(path,blob,{upsert:true});
                          if(data){ const {data:u}=supabase.storage.from("photos").getPublicUrl(path); setEditPhotos(p=>[...p,u.publicUrl]); }
                        },"image/jpeg",0.85);
                      }
                    }}/>
                  </label>
                </div>
                <div className="modal-actions" style={{marginBottom:40}}>
                  <button className="modal-cancel" onClick={()=>{setEditingCheckin(null);setEditLimited(false);setEditEventName("");setEditDateFrom("");setEditDateTo("");setEditHours("");setEditLocation("");}}>{t('cancel')}</button>
                  <button className="modal-ok" onClick={async()=>{
                    await supabase.from("checkins").update({
                      note:editNote, photo_urls:editPhotos,
                      limited:editLimited, event_name:editEventName||null,
                      date_from:editDateFrom||null, date_to:editDateTo||null,
                    }).eq("id",editingCheckin.id);
                    if(editingCheckin.spot_id && (editHours||editLocation)){
                      await supabase.from("spots").update({
                        ...(editHours?{hours:editHours}:{}),
                        ...(editLocation?{location:editLocation}:{}),
                      }).eq("id",editingCheckin.spot_id);
                      setSelSpot(s=>s?{...s,hours:editHours||s.hours,location:editLocation||s.location}:s);
                    }
                    setArchives(a=>a.map(x=>x.id===editingCheckin.id?{...x,note:editNote,photos:editPhotos,hasImg:editPhotos.length>0,limited:editLimited,dateFrom:editDateFrom,dateTo:editDateTo}:x));
                    setSpotCheckins(a=>a.map(x=>x.id===editingCheckin.id?{...x,note:editNote,photos:editPhotos,hasImg:editPhotos.length>0,limited:editLimited,dateFrom:editDateFrom,dateTo:editDateTo}:x));
                    setEditingCheckin(null);
                    showToast(t('profileSaved'),"ok");
                  }}>{t('saveAction')}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ FOLDER MODAL ════ */}
        {showFolderModal && (
          <div className="modal-backdrop" onClick={()=>{setShowFolderModal(false);setFolderName("");setFolderPhotos([]);setFolderCoverFile(null);setFolderCoverPreview(null);setEditingFolderId(null);}}>
            <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
              <div className="modal-sheet-hd">
                <h3>{editingFolderId ? t('editFolderTitle') : t('newFolderTitle')}</h3>
                <button onClick={()=>{setShowFolderModal(false);setFolderName("");setFolderPhotos([]);setFolderCoverFile(null);setFolderCoverPreview(null);setEditingFolderId(null);}}>×</button>
              </div>
              <div className="modal-body" style={{paddingBottom:40}}>
                <label className="modal-field-label">FOLDER NAME</label>
                <input className="modal-input" placeholder={t('folderNamePlaceholder')}
                  value={folderName} onChange={e=>setFolderName(e.target.value)}
                  autoFocus/>
                <label className="modal-field-label">COVER IMAGE</label>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                  {folderCoverPreview && (
                    <img src={folderCoverPreview} style={{width:60,height:90,objectFit:"cover",borderRadius:6,flexShrink:0}}/>
                  )}
                  <label style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",border:"1.5px dashed var(--border)",borderRadius:8,cursor:"pointer",fontSize:13,color:"var(--text2)"}}>
                     {folderCoverPreview ? "変更する" : "表紙を選ぶ"}
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{
                      const file = e.target.files?.[0];
                      if(!file) return;
                      const previewUrl = URL.createObjectURL(file);
                      setFolderCoverPreview(previewUrl);
                      setFolderCoverFile(file);
                    }}/>
                  </label>
                  {folderCoverPreview && (
                    <button onClick={()=>{setFolderCoverPreview(null);setFolderCoverFile(null);}}
                      style={{background:"none",border:"none",color:"var(--text3)",fontSize:12,cursor:"pointer"}}>削除</button>
                  )}
                </div>
                <label className="modal-field-label">{t('selectCheckinsForFolder')}</label>
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
                  <button className="modal-cancel" onClick={()=>{setShowFolderModal(false);setFolderName("");setFolderPhotos([]);setEditingFolderId(null);}}>{t('cancel')}</button>
                  <button className="modal-ok" onClick={async ()=>{
                    if(!folderName.trim()) return;
                    let coverUrl = null;
                    if(folderCoverFile){
                      const ext = folderCoverFile.name.split(".").pop();
                      const path = `folders/${user.id}/${Date.now()}.${ext}`;
                      const { data: upData } = await supabase.storage.from("photos").upload(path, folderCoverFile, {upsert:true});
                      if(upData){
                        const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
                        coverUrl = urlData.publicUrl;
                      }
                    }
                    if(editingFolderId){
                      const ids = folderPhotos.map(p=>p.id);
                      const upd = {title:folderName.trim(), checkin_ids:ids};
                      if(coverUrl) upd.cover_url = coverUrl;
                      await supabase.from("folders").update(upd).eq("id", editingFolderId);
                      setFolders(f=>f.map(fo=>fo.id===editingFolderId?{...fo,title:folderName.trim(),ids,cover_url:coverUrl||fo.cover_url}:fo));
                      setSelGroup(g=>g&&g.id===editingFolderId?{...g,title:folderName.trim(),items:folderPhotos}:g);
                    } else {
                      const ins = {user_id: user.id, title: folderName.trim(), checkin_ids: folderPhotos.map(p=>p.id)};
                      if(coverUrl) ins.cover_url = coverUrl;
                      const { data, error } = await supabase.from("folders").insert(ins).select().single();
                      if(!error && data) setFolders(f=>[...f,{id:data.id,title:data.title,type:"custom",ids:data.checkin_ids||[],cover_url:data.cover_url||null}]);
                    }
                    setFolderName(""); setFolderPhotos([]); setFolderCoverFile(null); setFolderCoverPreview(null); setShowFolderModal(false); setEditingFolderId(null);
                  }}>{editingFolderId ? t('saveAction') : t('createAction')}</button>
                </div>
              <div style={{height:40}}/>
              </div>
            </div>
          </div>
        )}

        <nav className="bnav">
          <button className={`nbtn ${tab==="home"?"active":""}`} onClick={()=>switchTab("home")}>
            <Ic.NavTimeline a={tab==="home"}/> Timeline
          </button>
          <button className={`nbtn ${tab==="list"?"active":""}`} onClick={()=>switchTab("list")}>
            <Ic.NavList a={tab==="list"}/> List
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
