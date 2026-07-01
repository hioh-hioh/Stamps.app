"use client";
export default function AboutPage() {
  return (
    <>
    <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
    <div style={{padding:"0 16px 40px",fontSize:14,color:"#222",fontFamily:"inherit",animation:"slideInRight 0.25s ease-out"}}>
      <div style={{position:"sticky",top:0,background:"#fff",zIndex:10,padding:"12px 0 8px",marginBottom:8}}>
        <button onClick={()=>window.history.back()}
          style={{background:"none",border:"none",cursor:"pointer",color:"#666",display:"flex",padding:0}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
      </div>

      <div style={{textAlign:"center",margin:"32px 0 40px"}}>
        <img src="/stamp_logo.png" style={{width:72,height:72,borderRadius:18,display:"block",margin:"0 auto 16px"}}/>
        <div style={{fontSize:22,fontWeight:700,letterSpacing:".02em"}}>Stamps.</div>
      </div>

      <div style={{lineHeight:1.85,color:"#333",display:"flex",flexDirection:"column",gap:16}}>
        <p>こんにちは！「Stamps.」を楽しんでいただき、本当にありがとうございます。「Stamps.」はスタンプを押すことが好きな全ての人のためのアプリです。</p>
        <p>スタンプを押した時の達成感や喜びを多くの人と共有したくて、このアプリを作りました。皆さんのスタンプ帳はとてもユニークで、人によって押し方やレイアウトに個性が出ることも魅力の一つです。このアプリでは、皆さんと押したスタンプを共有しながら、行った場所を記録し、後でスタンプを整理して見返すことができます。今後どんどんアプリを使いやすく&amp;楽しくしていく予定です！もし何か気になることがあれば気軽にコンタクトして下さい。</p>
        <p style={{fontWeight:600}}>Have a Nice Stamps Day! :)</p>
      </div>

      <div style={{borderTop:"1px solid #eee",margin:"32px 0"}}/>

      <div style={{lineHeight:1.85,color:"#333",display:"flex",flexDirection:"column",gap:16}}>
        <p>Hello! Thank you so much for enjoying Stamps. Stamps. is an app for everyone who loves collecting stamps.</p>
        <p>We created this app to share the joy and excitement of stamp collecting with as many people as possible. Everyone's stamp book is unique — the way you ink and arrange your stamps is part of what makes it special. With Stamps., you can share your collection, record the places you've visited, and look back on your stamps whenever you like. We'll keep making the app more fun and easy to use — if you have any questions or feedback, feel free to reach out!</p>
        <p style={{fontWeight:600}}>Have a Nice Stamps Day! :)</p>
      </div>

      <div style={{marginTop:48,display:"flex",flexDirection:"column",gap:12,borderTop:"1px solid #eee",paddingTop:24}}>
        <a href="/contact" style={{fontSize:14,color:"#555",textDecoration:"none"}}>お問い合わせ</a>
        <a href="/privacy" style={{fontSize:14,color:"#555",textDecoration:"none"}}>プライバシーポリシー</a>
      </div>

      <div style={{marginTop:40,color:"#aaa",fontSize:12,textAlign:"center"}}>Stamps.</div>
    </div>
    </>
  );
}