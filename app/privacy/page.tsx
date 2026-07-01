"use client";
export default function PrivacyPage() {
  return (
    <>
    <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
    <div style={{maxWidth:680,margin:"0 auto",padding:"40px 20px",lineHeight:1.8,fontSize:14,color:"#222",animation:"slideInRight 0.25s ease-out"}}>
      <div style={{position:"sticky",top:0,background:"#fff",zIndex:10,padding:"12px 0 8px",marginBottom:16}}>
        <button onClick={()=>window.history.back()} style={{background:"none",border:"none",cursor:"pointer",color:"#666",display:"flex",padding:0}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
      </div>
      <h1 style={{fontSize:22,fontWeight:700,marginTop:20,marginBottom:24}}>プライバシーポリシー</h1>

      <p style={{marginBottom:24}}>
        Stamps.（以下「本アプリ」）は、ユーザーの個人情報を適切に取り扱うことを重要な責務と考え、以下のとおりプライバシーポリシーを定めます。
      </p>

      <h2 style={{fontSize:17,fontWeight:700,marginTop:32,marginBottom:12}}>1. 収集する情報</h2>
      <p style={{marginBottom:8}}>本アプリは、以下の情報を取得することがあります。</p>
      <ul style={{paddingLeft:20,marginBottom:24}}>
        <li>メールアドレス（ログイン認証のため）</li>
        <li>Googleアカウント情報（氏名、メールアドレス、プロフィール画像）</li>
        <li>位置情報（チェックイン機能・近隣スポット表示のため）</li>
        <li>カメラロールへのアクセスおよびアップロードされた写真</li>
        <li>プロフィール情報（ニックネーム、自己紹介、アバター画像）</li>
      </ul>

      <h2 style={{fontSize:17,fontWeight:700,marginTop:32,marginBottom:12}}>2. 利用目的</h2>
      <p style={{marginBottom:8}}>取得した情報は、以下の目的でのみ利用します。</p>
      <ul style={{paddingLeft:20,marginBottom:24}}>
        <li>アカウントの作成・認証・ログイン</li>
        <li>チェックイン記録の保存・表示</li>
        <li>近隣のスタンプスポットの表示</li>
        <li>ユーザー間での投稿・プロフィールの共有</li>
        <li>アプリの機能改善・不具合対応</li>
      </ul>

      <h2 style={{fontSize:17,fontWeight:700,marginTop:32,marginBottom:12}}>3. 第三者提供</h2>
      <p style={{marginBottom:24}}>
        本アプリは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
      </p>

      <h2 style={{fontSize:17,fontWeight:700,marginTop:32,marginBottom:12}}>4. 外部サービスの利用</h2>
      <p style={{marginBottom:24}}>
        本アプリは、認証およびデータ保存のためにSupabase（データベース・認証基盤）、位置情報表示のためにGoogle Maps Platformを利用しています。これらのサービスは、それぞれ独自のプライバシーポリシーに基づきデータを取り扱います。
      </p>

      <h2 style={{fontSize:17,fontWeight:700,marginTop:32,marginBottom:12}}>5. データの削除</h2>
      <p style={{marginBottom:24}}>
        ユーザーは、アプリ内のアカウント設定からチェックイン記録・投稿・アカウント自体の削除を行うことができます。削除に関するお問い合わせは下記の連絡先までご連絡ください。
      </p>

      <h2 style={{fontSize:17,fontWeight:700,marginTop:32,marginBottom:12}}>6. お問い合わせ</h2>
      <p style={{marginBottom:24}}>
        本ポリシーに関するお問い合わせは、アプリ内のお問い合わせフォームよりご連絡ください。
      </p>

      <h2 style={{fontSize:17,fontWeight:700,marginTop:32,marginBottom:12}}>7. ポリシーの変更</h2>
      <p style={{marginBottom:24}}>
        本ポリシーの内容は、必要に応じて予告なく変更されることがあります。変更後の内容は、本ページに掲載した時点から効力を生じるものとします。
      </p>

      <p style={{marginTop:40,color:"#888",fontSize:13}}>制定日：2026年6月30日</p>
    </div>
    </>
  );
}
