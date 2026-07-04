"use client";
export default function TermsPage() {
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

      <h1 style={{fontSize:20,fontWeight:700,marginTop:20,marginBottom:32}}>利用規約</h1>

      <div style={{lineHeight:1.85,color:"#333",display:"flex",flexDirection:"column",gap:28}}>
        <div>
          <h2 style={{fontSize:15,fontWeight:700,marginBottom:8}}>1. サービスの利用条件</h2>
          <p>本サービスをご利用いただくことで、本規約に同意したものとみなします。</p>
        </div>
        <div>
          <h2 style={{fontSize:15,fontWeight:700,marginBottom:8}}>2. 禁止事項</h2>
          <p>以下の行為を禁止します。</p>
          <ul style={{paddingLeft:20,margin:"8px 0",display:"flex",flexDirection:"column",gap:4}}>
            <li>他のユーザーへの嫌がらせ・誹謗中傷</li>
            <li>違法なコンテンツの投稿</li>
            <li>不適切なコンテンツ（暴力的・性的・差別的な表現を含む投稿）</li>
            <li>サービスの不正利用・改ざん</li>
          </ul>
        </div>
        <div>
          <h2 style={{fontSize:15,fontWeight:700,marginBottom:8}}>3. 投稿コンテンツについて</h2>
          <p>ユーザーが投稿したコンテンツの著作権はユーザー本人に帰属します。ただし、サービス運営のために必要な範囲で利用する場合があります。</p>
        </div>
        <div>
          <h2 style={{fontSize:15,fontWeight:700,marginBottom:8}}>4. 免責事項</h2>
          <p>本サービスの利用により生じた損害について、当方は責任を負いません。サービスは予告なく変更・停止される場合があります。</p>
        </div>
        <div>
          <h2 style={{fontSize:15,fontWeight:700,marginBottom:8}}>5. 準拠法</h2>
          <p>本規約は日本法に準拠します。</p>
        </div>
      </div>

      <div style={{borderTop:"1px solid #eee",margin:"40px 0"}}/>

      <h1 style={{fontSize:20,fontWeight:700,marginBottom:32}}>Terms of Use</h1>

      <div style={{lineHeight:1.85,color:"#333",display:"flex",flexDirection:"column",gap:28}}>
        <div>
          <h2 style={{fontSize:15,fontWeight:700,marginBottom:8}}>1. Acceptance of Terms</h2>
          <p>By using this service, you agree to these Terms of Use.</p>
        </div>
        <div>
          <h2 style={{fontSize:15,fontWeight:700,marginBottom:8}}>2. Prohibited Actions</h2>
          <p>The following actions are prohibited:</p>
          <ul style={{paddingLeft:20,margin:"8px 0",display:"flex",flexDirection:"column",gap:4}}>
            <li>Harassment or defamation of other users</li>
            <li>Posting illegal content</li>
            <li>Posting inappropriate content (including violent, sexual, or discriminatory content)</li>
            <li>Unauthorized use or tampering with the service</li>
          </ul>
        </div>
        <div>
          <h2 style={{fontSize:15,fontWeight:700,marginBottom:8}}>3. User Content</h2>
          <p>Users retain ownership of their posted content. However, we may use it to the extent necessary for operating the service.</p>
        </div>
        <div>
          <h2 style={{fontSize:15,fontWeight:700,marginBottom:8}}>4. Disclaimer</h2>
          <p>We are not liable for any damages arising from the use of this service. The service may be modified or discontinued without notice.</p>
        </div>
        <div>
          <h2 style={{fontSize:15,fontWeight:700,marginBottom:8}}>5. Governing Law</h2>
          <p>These Terms of Use are governed by the laws of Japan.</p>
        </div>
      </div>

      <p style={{marginTop:40,color:"#aaa",fontSize:13}}>制定日：2026年6月30日</p>
    </div>
    </>
  );
}