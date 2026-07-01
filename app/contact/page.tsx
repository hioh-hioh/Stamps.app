"use client";
import { useState } from "react";

const purposes = [
  { id: "feedback", label: "ご意見・ご感想" },
  { id: "spot",     label: "スポット情報の修正・追加" },
  { id: "bug",      label: "不具合を報告" },
];

export default function ContactPage() {
  const [step, setStep]       = useState<1|2>(1);
  const [purpose, setPurpose] = useState("");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    const subject = encodeURIComponent(`[Stamps.] ${purposes.find(p=>p.id===purpose)?.label||""}`);
    const body = encodeURIComponent(`お名前: ${name||"未入力"}\nメール: ${email||"未入力"}\n\n${message}`);
    window.location.href = `mailto:support@stampsapp.app?subject=${subject}&body=${body}`;
  };

  return (
    <>
    <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
    <div style={{padding:"0 16px 40px",fontSize:14,color:"#222",fontFamily:"inherit",animation:"slideInRight 0.25s ease-out"}}>
      <div style={{position:"sticky",top:0,background:"#fff",zIndex:10,padding:"12px 0 8px",marginBottom:8}}>
        <button onClick={()=>step===2?setStep(1):window.history.back()}
          style={{background:"none",border:"none",cursor:"pointer",color:"#666",display:"flex",padding:0}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
      </div>

      {step===1 && (
        <div>
          <h1 style={{fontSize:20,fontWeight:700,marginBottom:8,marginTop:20}}>お問い合わせ</h1>
          <p style={{color:"#888",marginBottom:28,lineHeight:1.7}}>お問い合わせの目的を選択してください。</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {purposes.map(p=>(
              <button key={p.id} onClick={()=>{setPurpose(p.id);setStep(2);}}
                style={{textAlign:"left",padding:"14px 16px",borderRadius:12,border:`1.5px solid ${purpose===p.id?"#E8452A":"#ddd"}`,background:"#fff",fontSize:14,color:"#222",cursor:"pointer",fontFamily:"inherit"}}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step===2 && (
        <div>
          <h1 style={{fontSize:20,fontWeight:700,marginBottom:8,marginTop:20}}>お問い合わせ</h1>
          <p style={{color:"#888",marginBottom:28,lineHeight:1.7}}>{purposes.find(p=>p.id===purpose)?.label}</p>
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div>
              <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:6}}>お名前（任意）</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="例：山田 花子"
                style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #ddd",fontSize:14,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}/>
            </div>
            <div>
              <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:6}}>メールアドレス（任意）</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="例：hello@example.com" type="email"
                style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #ddd",fontSize:14,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}/>
            </div>
            <div>
              <label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:6}}>メッセージ <span style={{color:"#E8452A"}}>*</span></label>
              <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="お問い合わせ内容をご記入ください" rows={5}
                style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #ddd",fontSize:14,fontFamily:"inherit",boxSizing:"border-box",outline:"none",resize:"vertical"}}/>
            </div>
            <button onClick={handleSubmit} disabled={!message.trim()}
              style={{padding:"14px",borderRadius:12,border:"none",background:message.trim()?"#E8452A":"#ddd",color:"#fff",fontSize:15,fontWeight:600,cursor:message.trim()?"pointer":"default",fontFamily:"inherit"}}>
              送信する
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}