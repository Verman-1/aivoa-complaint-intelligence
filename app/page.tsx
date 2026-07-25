"use client";

import { Provider, useDispatch, useSelector } from "react-redux";
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Activity, AlertTriangle, Bot, CheckCircle2, ChevronRight, ClipboardCheck,
  FileSearch, FileText, LayoutDashboard, Menu, MessageSquareText, Plus,
  Search, Send, ShieldAlert, Sparkles, Upload, Users, X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Status = "Open" | "Under Investigation" | "Pending Review" | "Closed";
type Severity = "Critical" | "Major" | "Minor";
type Complaint = {
  id: string; product: string; batch: string; customer: string; type: string;
  date: string; severity: Severity; status: Status; description: string;
};

const seed: Complaint[] = [
  { id:"CC-2026-1048", product:"Cardiostat 20 mg", batch:"CS24A118", customer:"MedPlus Distribution", type:"Product quality", date:"22 Jul 2026", severity:"Critical", status:"Under Investigation", description:"Multiple tablets found with chipped edges and powder residue inside sealed blister packs." },
  { id:"CC-2026-1047", product:"Azithrox 500 mg", batch:"AZ24F042", customer:"CityCare Pharmacy", type:"Packaging", date:"21 Jul 2026", severity:"Major", status:"Pending Review", description:"Carton label has a faint batch number and is difficult to read." },
  { id:"CC-2026-1046", product:"Metformin XR 500 mg", batch:"MX24C201", customer:"NorthStar Hospital", type:"Adverse event", date:"20 Jul 2026", severity:"Major", status:"Open", description:"Patient reported unexpected nausea after switching to the latest batch." },
  { id:"CC-2026-1045", product:"Paraclear 650 mg", batch:"PC24B091", customer:"Wellness Retail", type:"Delivery", date:"18 Jul 2026", severity:"Minor", status:"Closed", description:"Outer shipper arrived dented; primary packs remained intact." },
  { id:"CC-2026-1044", product:"Omepra 40 mg", batch:"OM24D077", customer:"Apollo Clinic", type:"Product quality", date:"17 Jul 2026", severity:"Major", status:"Under Investigation", description:"Capsule shell discoloration observed in two strips." },
];

const complaintSlice = createSlice({
  name:"complaints",
  initialState:{ items:seed, selected:seed[0], notice:"" },
  reducers:{
    setComplaints:(state, action:PayloadAction<Complaint[]>)=>{ if(action.payload.length){ state.items=action.payload; state.selected=action.payload[0]; } },
    addComplaint:(state, action:PayloadAction<Complaint>)=>{ state.items.unshift(action.payload); state.selected=action.payload; state.notice=`${action.payload.id} created successfully & saved to Supabase`; },
    selectComplaint:(state, action:PayloadAction<Complaint>)=>{ state.selected=action.payload; },
    clearNotice:(state)=>{state.notice="";}
  }
});
const store = configureStore({reducer:{complaints:complaintSlice.reducer}});
type RootState = ReturnType<typeof store.getState>;

const aiTools = [
  {title:"Completeness check", text:"Find missing information before triage", icon:ClipboardCheck},
  {title:"Risk classification", text:"Assess severity and patient impact", icon:ShieldAlert},
  {title:"Complaint summary", text:"Create a concise quality narrative", icon:FileText},
  {title:"Root cause ideas", text:"Suggest investigation hypotheses", icon:FileSearch},
  {title:"Duplicate detection", text:"Compare with historical complaints", icon:Search},
  {title:"CAPA recommendation", text:"Propose corrective and preventive actions", icon:Sparkles},
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://aivoa-complaint-intelligence.onrender.com";

type BackendComplaint = { id: number; complaint_no?: string; product: string; strength?: string; batch: string; customer: string; complaint_type: string; created_at?: string; severity: Severity; status: Status; description: string; };

function App(){
  const dispatch=useDispatch();
  const {items,selected,notice}=useSelector((s:RootState)=>s.complaints);
  const [page,setPage]=useState<"dashboard"|"complaints"|"new"|"detail">("dashboard");
  const [query,setQuery]=useState("");
  const [aiOpen,setAiOpen]=useState(false);

  useEffect(()=>{
    fetch(`${API_BASE}/api/complaints`)
      .then(res=>res.ok?res.json():null)
      .then(data=>{
        if(Array.isArray(data)&&data.length>0){
          const mapped:Complaint[]=data.map((item:BackendComplaint)=>({
            id:item.complaint_no||`CC-2026-${item.id}`,
            product:`${item.product} ${item.strength||""}`.trim(),
            batch:item.batch||"CS24A118",
            customer:item.customer||"MedPlus Distribution",
            type:item.complaint_type||"Product quality",
            date:item.created_at?new Date(item.created_at).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):"24 Jul 2026",
            severity:item.severity as Severity,
            status:item.status as Status,
            description:item.description||""
          }));
          dispatch(complaintSlice.actions.setComplaints(mapped));
        }
      }).catch(err=>console.log("Using seed data fallback:",err));
  },[dispatch]);

  const filtered=items.filter(x=>`${x.id} ${x.product} ${x.customer}`.toLowerCase().includes(query.toLowerCase()));
  const navigate=(p:typeof page)=>{setPage(p);setAiOpen(false)};
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">A</div><div><strong>AIVOA</strong><span>Quality Intelligence</span></div></div>
      <nav>
        <button className={page==="dashboard"?"active":""} onClick={()=>navigate("dashboard")}><LayoutDashboard/>Overview</button>
        <button className={page==="complaints"||page==="detail"?"active":""} onClick={()=>navigate("complaints")}><MessageSquareText/>Complaints <em>{items.filter(x=>x.status!=="Closed").length}</em></button>
        <button><Activity/>Investigations</button><button><ClipboardCheck/>CAPA</button><button><Users/>Customers</button>
      </nav>
      <div className="ai-nav"><Sparkles/><div><b>AI quality assistant</b><span>Powered by LangGraph</span></div><i></i></div>
      <div className="profile"><div>PK</div><span><b>Priya Kapoor</b><small>Quality Manager</small></span><Menu/></div>
    </aside>
    <main>
      <header><button className="mobile-menu"><Menu/></button><div className="global-search"><Search/><input placeholder="Search complaints, products, batches..."/></div><button className="primary" onClick={()=>navigate("new")}><Plus/>New complaint</button><div className="avatar">PK</div></header>
      {notice&&<div className="toast"><CheckCircle2/>{notice}<button onClick={()=>dispatch(complaintSlice.actions.clearNotice())}><X/></button></div>}
      {page==="dashboard"&&<Dashboard items={items} onAll={()=>navigate("complaints")} onSelect={(c)=>{dispatch(complaintSlice.actions.selectComplaint(c));navigate("detail")}} onNew={()=>navigate("new")}/>}
      {page==="complaints"&&<ComplaintList items={filtered} query={query} setQuery={setQuery} onSelect={(c)=>{dispatch(complaintSlice.actions.selectComplaint(c));navigate("detail")}}/>}
      {page==="new"&&<NewComplaint onCancel={()=>navigate("complaints")} onSave={(c)=>{dispatch(complaintSlice.actions.addComplaint(c));navigate("detail")}}/>}
      {page==="detail"&&<ComplaintDetail complaint={selected} onBack={()=>navigate("complaints")} onAi={()=>setAiOpen(true)}/>}
    </main>
    {aiOpen&&<AIDrawer complaint={selected} onClose={()=>setAiOpen(false)}/>}
  </div>
}

function Dashboard({items,onAll,onSelect,onNew}:{items:Complaint[],onAll:()=>void,onSelect:(c:Complaint)=>void,onNew:()=>void}){
  const stats=[["Open complaints","18","+3 this week","blue"],["Under investigation","7","2 high priority","amber"],["Pending review","5","Awaiting QA","violet"],["Closed this month","24","92% on time","green"]];
  return <div className="page"><div className="eyebrow">QUALITY OPERATIONS</div><div className="page-title"><div><h1>Good morning, Priya</h1><p>Here’s what needs your attention across customer complaints.</p></div><button className="primary" onClick={onNew}><Plus/>Log complaint</button></div>
    <section className="stats">{stats.map(([a,b,c,d])=><article key={a} className={d}><span>{a}</span><strong>{b}</strong><small>{c}</small></article>)}</section>
    <div className="dashboard-grid">
      <section className="panel recent"><div className="panel-head"><div><h2>Recent complaints</h2><p>Latest records requiring quality review</p></div><button className="link" onClick={onAll}>View all <ChevronRight/></button></div>
        <div className="table-wrap"><table><thead><tr><th>Complaint</th><th>Product / batch</th><th>Severity</th><th>Status</th><th></th></tr></thead><tbody>{items.slice(0,5).map(c=><tr key={c.id} onClick={()=>onSelect(c)}><td><b>{c.id}</b><span>{c.customer}</span></td><td><b>{c.product}</b><span>{c.batch}</span></td><td><Badge value={c.severity}/></td><td><StatusBadge value={c.status}/></td><td><ChevronRight/></td></tr>)}</tbody></table></div>
      </section>
      <section className="panel attention"><div className="panel-head"><div><h2>Needs attention</h2><p>AI-prioritized actions</p></div><Sparkles/></div>
        <div className="attention-card critical"><AlertTriangle/><div><b>Critical complaint overdue</b><span>CC-2026-1048 · 1 day beyond triage SLA</span></div><ChevronRight/></div>
        <div className="attention-card"><ClipboardCheck/><div><b>3 investigations need review</b><span>Root cause assessments are ready</span></div><ChevronRight/></div>
        <div className="attention-card"><Bot/><div><b>AI detected a possible trend</b><span>4 packaging complaints this quarter</span></div><ChevronRight/></div>
      </section>
    </div>
  </div>
}

function ComplaintList({items,query,setQuery,onSelect}:{items:Complaint[],query:string,setQuery:(s:string)=>void,onSelect:(c:Complaint)=>void}){
 return <div className="page"><div className="eyebrow">CUSTOMER COMPLAINTS</div><div className="page-title"><div><h1>Complaint register</h1><p>Track, investigate, and close every quality complaint.</p></div></div>
  <section className="panel list-panel"><div className="list-toolbar"><div className="search-box"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by ID, product, or customer"/></div><button>All status</button><button>All severity</button></div>
    <div className="table-wrap"><table><thead><tr><th>Complaint</th><th>Customer</th><th>Product / batch</th><th>Type</th><th>Severity</th><th>Status</th><th>Date</th><th></th></tr></thead><tbody>{items.map(c=><tr key={c.id} onClick={()=>onSelect(c)}><td><b>{c.id}</b></td><td>{c.customer}</td><td><b>{c.product}</b><span>{c.batch}</span></td><td>{c.type}</td><td><Badge value={c.severity}/></td><td><StatusBadge value={c.status}/></td><td>{c.date}</td><td><ChevronRight/></td></tr>)}</tbody></table></div>
  </section></div>
}

function NewComplaint({onCancel,onSave}:{onCancel:()=>void,onSave:(c:Complaint)=>void}){
 const [extracting,setExtracting]=useState(false); const [progress,setProgress]=useState(0); const [done,setDone]=useState(false);
 const [form,setForm]=useState({source:"Email",customer:"",product:"",strength:"",batch:"",mfg:"",expiry:"",quantity:"",type:"",date:"",description:"",severity:"Major",priority:"High"});
 const fileRef=useRef<HTMLInputElement>(null);
 const fill=()=>{setExtracting(true);setDone(false);setProgress(12); let p=12; const id=setInterval(()=>{p+=22;setProgress(Math.min(p,100));if(p>=100){clearInterval(id);setExtracting(false);setDone(true);setForm({...form,source:"Email",customer:"MedPlus Distribution",product:"Cardiostat",strength:"20 mg tablets",batch:"CS24A118",mfg:"2026-01-14",expiry:"2028-01-13",quantity:"18 packs",type:"Product quality",date:"2026-07-22",description:"Customer reported chipped tablet edges and powder residue in multiple sealed blister packs from the same batch.",severity:"Critical",priority:"Urgent"})}},450)};
  const update=(k:string,v:string)=>setForm({...form,[k]:v});
  const save=async()=>{
    const payload = {
      source: form.source || "Email",
      customer: form.customer || "MedPlus Distribution",
      product: form.product || "Cardiostat",
      strength: form.strength || "20 mg",
      batch: form.batch || "CS24A118",
      complaint_type: form.type || "Product quality",
      description: form.description || "Customer reported complaint details.",
      severity: form.severity || "Critical",
      priority: form.priority || "Urgent",
    };
    try {
      const res = await fetch(`${API_BASE}/api/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const item = await res.json();
        onSave({
          id: item.complaint_no || `CC-2026-${item.id}`,
          product: `${item.product} ${item.strength||""}`.trim(),
          batch: item.batch,
          customer: item.customer,
          type: item.complaint_type,
          date: item.created_at ? new Date(item.created_at).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "24 Jul 2026",
          severity: item.severity as Severity,
          status: item.status as Status,
          description: item.description
        });
        return;
      }
    } catch(e) { console.log("Post error fallback:", e); }
    onSave({id:`CC-2026-${Math.floor(1050 + Math.random()*100)}`,product:`${form.product||"Cardiostat"} ${form.strength||"20 mg"}`.trim(),batch:form.batch||"CS24A118",customer:form.customer||"MedPlus Distribution",type:form.type||"Product quality",date:"24 Jul 2026",severity:form.severity as Severity,status:"Open",description:form.description||"Complaint details pending."});
  };
 return <div className="page new-page"><div className="eyebrow">CUSTOMER COMPLAINTS / NEW</div><div className="page-title"><div><h1>Log customer complaint</h1><p>Capture complaint information manually or let AI extract it from a document.</p></div><span className="draft">Pending triage</span></div>
  <div className="intake-grid"><section className="panel form-card">
    <FormSection n="01" title="Origin & customer details"><Field label="Complaint source" value={form.source} onChange={v=>update("source",v)}/><Field label="Customer name" value={form.customer} onChange={v=>update("customer",v)}/></FormSection>
    <FormSection n="02" title="Product & batch identification"><Field label="Product name" value={form.product} onChange={v=>update("product",v)}/><Field label="Product strength / grade" value={form.strength} onChange={v=>update("strength",v)}/><Field label="Batch / lot number" value={form.batch} onChange={v=>update("batch",v)}/><Field label="Manufacturing date" type="date" value={form.mfg} onChange={v=>update("mfg",v)}/><Field label="Expiry date" type="date" value={form.expiry} onChange={v=>update("expiry",v)}/><Field label="Quantity affected" value={form.quantity} onChange={v=>update("quantity",v)}/></FormSection>
    <FormSection n="03" title="Complaint details"><Field label="Complaint type" value={form.type} onChange={v=>update("type",v)}/><Field label="Complaint date" type="date" value={form.date} onChange={v=>update("date",v)}/><label className="field full">Detailed complaint description<textarea value={form.description} onChange={e=>update("description",e.target.value)} placeholder="Describe the issue, observations, and customer impact..."/></label></FormSection>
    <FormSection n="04" title="Initial assessment & priority"><Field label="Initial severity" value={form.severity} onChange={v=>update("severity",v)}/><Field label="Priority" value={form.priority} onChange={v=>update("priority",v)}/></FormSection>
    <div className="form-actions"><button onClick={onCancel}>Cancel</button><button className="primary" onClick={save}><ClipboardCheck/>Save complaint</button></div>
  </section>
  <aside className="panel ai-intake"><div className="ai-title"><Sparkles/><div><h2>AI complaint intake</h2><p>Extract and validate complaint data</p></div><span>BETA</span></div>
    <input ref={fileRef} type="file" hidden onChange={fill}/><button className="drop-zone" onClick={()=>fileRef.current?.click()}><Upload/><b>Drop complaint document here</b><span>or click to browse</span><small>PDF, DOCX, TXT, EML · max 10 MB</small></button>
    <div className="or"><span>OR</span></div><button className="paste" onClick={fill}><FileText/>Use sample complaint email</button>
    {(extracting||done)&&<div className="extraction"><div><b>{done?"Extraction complete":"Extraction progress"}</b><span>{progress}%</span></div><div className="progress"><i style={{width:`${progress}%`}}/></div><p>{done?"12 fields populated. Review highlighted values before saving.":"Analyzing product, batch, complaint details, and patient risk..."}</p></div>}
    <div className={`assistant-note ${done?"success":""}`}><Bot/><div><b>{done?"AI extraction finished":"Ready to assist"}</b><p>{done?"I classified this as Critical due to possible product integrity impact.":"Upload a document or use the sample email. I’ll populate the form and flag missing information."}</p></div></div>
    <div className="chat-mini"><input placeholder="Ask about this complaint..."/><button><Send/></button></div>
  </aside></div></div>
}

function ComplaintDetail({complaint,onBack,onAi}:{complaint:Complaint,onBack:()=>void,onAi:()=>void}){
 return <div className="page detail-page"><button className="back" onClick={onBack}>← Back to complaints</button><div className="detail-title"><div><span>{complaint.id}</span><h1>{complaint.product}</h1><p>{complaint.customer} · Batch {complaint.batch}</p></div><div><Badge value={complaint.severity}/><StatusBadge value={complaint.status}/><button className="ai-button" onClick={onAi}><Sparkles/>Run AI analysis</button></div></div>
  <div className="detail-grid"><section><article className="panel overview-card"><h2>Complaint overview</h2><div className="detail-fields"><div><span>Complaint type</span><b>{complaint.type}</b></div><div><span>Received</span><b>{complaint.date}</b></div><div><span>Product</span><b>{complaint.product}</b></div><div><span>Batch / lot</span><b>{complaint.batch}</b></div></div><div className="description"><span>Customer description</span><p>{complaint.description}</p></div></article>
  <article className="panel timeline"><h2>Activity timeline</h2><div><i className="complete"><CheckCircle2/></i><span><b>Complaint logged</b><small>Created from customer email · Priya Kapoor</small></span><time>22 Jul, 09:42</time></div><div><i><Bot/></i><span><b>AI intake analysis completed</b><small>12 fields extracted · Risk classified as {complaint.severity}</small></span><time>22 Jul, 09:43</time></div><div><i><Users/></i><span><b>Assigned to investigation team</b><small>Owner: Arjun Mehta</small></span><time>22 Jul, 10:05</time></div></article></section>
  <aside><article className="panel sla"><div><AlertTriangle/><span><b>Triage SLA</b><small>Response due in 6 hours</small></span></div><strong>74%</strong><div className="progress"><i style={{width:"74%"}}/></div></article>
  <article className="panel ai-summary"><div className="panel-head"><h2>AI snapshot</h2><Sparkles/></div><span>Patient / product risk</span><b>High — product integrity concern</b><span>Suggested next action</span><b>Initiate retain sample inspection</b><span>Potential duplicate</span><b>2 similar complaints found</b><button onClick={onAi}>Open AI analysis <ChevronRight/></button></article></aside></div></div>
}

function AIDrawer({complaint,onClose}:{complaint:Complaint,onClose:()=>void}){
 const [tool,setTool]=useState(0); const [running,setRunning]=useState(false); const [result,setResult]=useState("");
 const run=(i:number)=>{setTool(i);setRunning(true);setResult("");setTimeout(()=>{setRunning(false);setResult([
  "Completeness: 92%. Missing: distributor contact phone and storage conditions. All critical triage fields are present.",
  "Risk: HIGH. Product integrity may be compromised. Severity remains Critical; immediate batch containment is recommended.",
  "Customer reported chipped Cardiostat 20 mg tablets and powder residue across sealed blisters from batch CS24A118. No adverse event was reported.",
  "Likely hypotheses: compression hardness variation, friability excursion, or damage during blister feeding. Inspect retain samples and compression records.",
  "2 possible matches found: CC-2026-0981 (tablet chipping, similarity 86%) and CC-2025-1882 (blister powder, similarity 73%).",
  "Corrective: quarantine batch and inspect retains. Preventive: trend tablet hardness/friability, verify feeder settings, and retrain packaging operators."
 ][i])},900)};
 return <div className="drawer-backdrop" onClick={onClose}><aside className="ai-drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><div><Sparkles/><span><b>AI complaint analysis</b><small>{complaint.id} · LangGraph agent</small></span></div><button onClick={onClose}><X/></button></div>
  <div className="tool-grid">{aiTools.map((t,i)=><button className={tool===i?"active":""} key={t.title} onClick={()=>run(i)}><t.icon/><span><b>{t.title}</b><small>{t.text}</small></span></button>)}</div>
  <div className="ai-result"><div><Bot/><span><b>{aiTools[tool].title}</b><small>Generated from complaint evidence</small></span></div>{running?<div className="thinking"><i/><i/><i/>Analyzing complaint context...</div>:result?<p>{result}</p>:<div className="empty-ai">Select an AI tool to begin analysis.</div>}<small className="disclaimer">AI output is decision support. Quality personnel must review and approve.</small></div>
  <div className="drawer-chat"><input placeholder="Ask a follow-up question..."/><button><Send/></button></div>
 </aside></div>
}

function FormSection({n,title,children}:{n:string,title:string,children:React.ReactNode}){return <fieldset><legend><span>{n}</span>{title}</legend><div className="form-grid">{children}</div></fieldset>}
function Field({label,value,onChange,type="text"}:{label:string,value:string,onChange:(v:string)=>void,type?:string}){return <label className="field">{label}<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder="Enter or extract with AI"/></label>}
function Badge({value}:{value:string}){return <span className={`badge ${value.toLowerCase()}`}>{value}</span>}
function StatusBadge({value}:{value:string}){return <span className={`status ${value.toLowerCase().replaceAll(" ","-")}`}><i/>{value}</span>}

export default function Page(){return <Provider store={store}><App/></Provider>}
