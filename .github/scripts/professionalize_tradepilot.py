from pathlib import Path
import re,json
root=Path("TradePilot")
js_path=next(root.rglob("app.js"));html_path=js_path.with_name("index.html");css_path=js_path.with_name("styles.css")
js=js_path.read_text(encoding="utf-8");html=html_path.read_text(encoding="utf-8");css=css_path.read_text(encoding="utf-8")
coins="BTC ETH BNB SOL XRP ADA LINK AVAX DOGE TRX DOT LTC BCH UNI NEAR ATOM ETC FIL APT ARB OP SUI INJ SEI TIA RENDER FET AAVE MKR ICP SHIB PEPE WIF BONK FLOKI TON XLM HBAR VET ALGO GRT CRV LDO JUP PYTH ONDO ENA PENDLE RUNE ZEC MANA SAND AXS EGLD THETA XTZ FLOW IMX GALA COMP SNX 1INCH DYDX KAVA".split()
coin_js="  const CRYPTO = [\n"+",\n".join("    ['%sUSDT','%s/USDT']"%(x,x) for x in coins)+"\n  ];"
js,n=re.subn(r"  const CRYPTO = \[.*?\n  \];",coin_js,js,count=1,flags=re.S)
if n!=1:raise SystemExit("CRYPTO list marker missing")
anchor="  function analyzeCandles(candles) {"
helpers=r'''
  let higherTimeframeBias=null;
  function volumeRatio(c,p=20){if(c.length<p+2)return null;const avg=c.slice(-p-1,-1).reduce((s,x)=>s+(x.v||0),0)/p;return avg>0?(c.at(-1).v||0)/avg:null;}
  function adxValue(c,p=14){if(c.length<2*p+2)return null;const tr=[],pd=[],md=[];for(let i=1;i<c.length;i++){const x=c[i],q=c[i-1],u=x.h-q.h,d=q.l-x.l;tr.push(Math.max(x.h-x.l,Math.abs(x.h-q.c),Math.abs(x.l-q.c)));pd.push(u>d&&u>0?u:0);md.push(d>u&&d>0?d:0);}let st=tr.slice(0,p).reduce((a,b)=>a+b,0),sp=pd.slice(0,p).reduce((a,b)=>a+b,0),sm=md.slice(0,p).reduce((a,b)=>a+b,0),dx=[];for(let i=p;i<tr.length;i++){if(i>p){st+=tr[i]-st/p;sp+=pd[i]-sp/p;sm+=md[i]-sm/p;}const a=st?100*sp/st:0,b=st?100*sm/st:0;dx.push(a+b?100*Math.abs(a-b)/(a+b):0);}if(dx.length<p)return null;let v=dx.slice(0,p).reduce((a,b)=>a+b,0)/p;for(let i=p;i<dx.length;i++)v=(v*(p-1)+dx[i])/p;return v;}
  function candleConfirm(c,side){if(c.length<3)return false;const x=c.at(-1),p=c.at(-2),s=candleShape(x),q=candleShape(p);return side==='LONG'?((s.bull&&q.bear&&x.c>=p.o&&x.o<=p.c)||(s.lower>s.body*2&&s.upper<s.body&&x.c>x.o)):((s.bear&&q.bull&&x.c<=p.o&&x.o>=p.c)||(s.upper>s.body*2&&s.lower<s.body&&x.c<x.o));}
  function fibConfirm(c,side,av){const s=confirmedSwings(c,3,3),h=s.highs.at(-1),l=s.lows.at(-1);if(!h||!l||Math.abs(h.index-l.index)<3)return false;const r=Math.abs(h.price-l.price),v=c.at(-1).c;if(r<av)return false;const z=side==='LONG'?[h.price-r*.618,h.price-r*.5,h.price-r*.382]:[l.price+r*.618,l.price+r*.5,l.price+r*.382];return z.some(x=>Math.abs(v-x)<=av*.35);}
  function structureLevels(c){const s=confirmedSwings(c,3,3),v=c.at(-1).c;return {support:s.lows.filter(x=>x.price<v).sort((a,b)=>b.price-a.price)[0]?.price??null,resistance:s.highs.filter(x=>x.price>v).sort((a,b)=>a.price-b.price)[0]?.price??null};}
  const structuralAnalyzer=analyzeCandles;
  analyzeCandles=function(c){const a=structuralAnalyzer(c);if(!c||c.length<100)return a;const side=a.direction==='NONE'?(a.metrics?.structure==='BEARISH'?'SHORT':'LONG'):a.direction,v=c.map(x=>x.c),last=c.at(-1),m=macd(v),e20=ema(v,20),e50=ema(v,50),adx=adxValue(c),vol=volumeRatio(c),rv=rsi(v);
    const emaOk=side==='LONG'?last.c>e20.at(-1)&&e20.at(-1)>e50.at(-1):last.c<e20.at(-1)&&e20.at(-1)<e50.at(-1);
    const macdOk=!!m&&(side==='LONG'?m.line.at(-1)>m.signal.at(-1)&&m.hist.at(-1)>0:m.line.at(-1)<m.signal.at(-1)&&m.hist.at(-1)<0);
    const volOk=vol!==null&&vol>=1.15,candleOk=candleConfirm(c,side),adxOk=adx!==null&&adx>=18,rsiOk=rv!==null&&(side==='LONG'?rv>40&&rv<75:rv>25&&rv<60),fibOk=fibConfirm(c,side,a.metrics?.atr||atr(c)||0),mtfOk=higherTimeframeBias===null?null:higherTimeframeBias===side;
    const core=a.direction!=='NONE'&&a.stop!==null&&a.target!==null,optional=[emaOk,macdOk,volOk,candleOk,adxOk,rsiOk,fibOk,mtfOk===true],count=optional.filter(Boolean).length,quality=Math.round(((core?4:0)+count)/12*100);
    if(core&&count<2){a.direction='NONE';a.entry=null;a.stop=null;a.target=null;a.reason='ستاپ ساختاری وجود دارد، اما حداقل دو تأیید مستقل از فیلترهای کیفیت دریافت نشده؛ فعلاً صبر کن.';}
    const row=(name,ok,detail,required=false)=>({name,direction:ok&&a.direction!=='NONE'?a.direction:'NONE',weight:ok?1:0,detail,required,passed:!!ok}),sweep=(a.setups||[]).some(x=>x.name==='جمع‌آوری نقدینگی'&&x.detail.includes('قیمت از نقدینگی')),sr=structureLevels(c);
    a.setups=[
      row('ساختار بازار · HH/HL · LH/LL',['BULLISH','BEARISH'].includes(a.metrics?.structure),'سویینگ‌های تأییدشده و توالی سقف‌ها و کف‌ها.',true),
      row('BOS / CHoCH',!!a.metrics?.bos||sweep,'شکست ساختار با کلوز کندل بسته‌شده.',true),
      row('Liquidity Sweep',sweep,'جمع‌آوری نقدینگی سقف/کف و بازگشت قیمت.',true),
      row('Order Block / FVG',!!a.metrics?.zone,'پولبک به ناحیه سفارش یا عدم‌تعادل معتبر.',true),
      row('EMA 20 / EMA 50',emaOk,'فیلتر جهت روند؛ نه سیگنال مستقل.'),row('MACD Momentum',macdOk,'هم‌جهتی خط MACD، سیگنال و هیستوگرام.'),
      row('Volume Expansion',volOk,'حجم کندل آخر حداقل ۱٫۱۵ برابر میانگین ۲۰ کندل قبلی.'),row('کندل تأییدی',candleOk,'پوشای صعودی/نزولی یا پین‌بار در ناحیه ورود.'),
      row('ADX · قدرت روند',adxOk,'ADX بالاتر از ۱۸ برای حذف بخشی از بازار خنثی.'),row('RSI · مومنتوم',rsiOk,'فیلتر ناحیه سالم؛ RSI به‌تنهایی سیگنال نیست.'),
      row('Fibonacci Golden Zone',fibOk,'هم‌پوشانی با بازگشت ۳۸٫۲ تا ۶۱٫۸ درصد سویینگ.'),row('تأیید تایم‌فریم بالاتر',mtfOk===null?false:mtfOk,mtfOk===null?'داده تایم‌فریم بالاتر موجود نیست.':mtfOk?'جهت تایم‌فریم بالاتر هم‌سو است.':'تایم‌فریم بالاتر مخالف است.')
    ];
    a.confidence=quality;a.score=(core?4:0)+count;a.confluenceCount=count;a.metrics={...(a.metrics||{}),adx,volumeRatio:vol,macd:m?.hist.at(-1)??null,rsi:rv,ema20:e20.at(-1),ema50:e50.at(-1),support:sr.support,resistance:sr.resistance,higherTimeframeBias,qualityScore:quality};
    if(a.direction!=='NONE')a.reason+=' تأییدهای تکمیلی: '+count+' از ۸.';return a;};
'''
if anchor not in js:raise SystemExit("Analyzer marker missing")
js=js.replace(anchor,helpers+"\n"+anchor,1)
metric="$('atrValue').textContent=a.metrics.atr!==undefined?num(a.metrics.atr,5):'—';"
if metric in js:js=js.replace(metric,metric+"""
    const extra=$('advancedMetrics');if(extra)extra.innerHTML=[['ADX',a.metrics.adx],['نسبت حجم',a.metrics.volumeRatio],['MACD',a.metrics.macd],['حمایت',a.metrics.support],['مقاومت',a.metrics.resistance],['کیفیت ستاپ',a.metrics.qualityScore]].map(([k,v])=>'<div class="size-metric"><small>'+k+'</small><b>'+(v===null||v===undefined?'—':num(v,4))+'</b></div>').join('');""",1)
# Add a higher timeframe trend check to the primary instrument.
anchor="      currentAnalysis=analyzeCandles(getClosedCandles(candles));"
repl="""      higherTimeframeBias=null;const higherMap={'15m':'1h','1h':'4h','4h':'1d'},higherTf=higherMap[settings.timeframe];
      if(higherTf){try{const htf=getClosedCandles(await getCandles(settings.symbol,higherTf,220));if(htf.length>=60){const hc=htf.map(x=>x.c),h20=ema(hc,20).at(-1),h50=ema(hc,50).at(-1);higherTimeframeBias=hc.at(-1)>h20&&h20>h50?'LONG':hc.at(-1)<h20&&h20<h50?'SHORT':null;}}catch(_){higherTimeframeBias=null;}}
      currentAnalysis=analyzeCandles(getClosedCandles(candles));"""
if anchor in js:js=js.replace(anchor,repl,1)
# Replace scanner with rate-limited concurrent workers.
ss=js.index("  async function runScanner() {");se=js.index("\n  function runBacktest()",ss)
scanner=r'''  async function runScanner(){
    if(scannerBusy)return;scannerBusy=true;const btn=$('scanBtn');btn.disabled=true;btn.textContent='در حال اسکن…';
    const all=activeList(),n=Number($('scanLimitSelect')?.value||30),list=all.slice(0,Math.min(n,all.length));
    $('scanStatus').textContent='آماده‌سازی اسکن '+list.length+' نماد…';$('scannerResults').innerHTML='<div class="empty-state">در حال بررسی بازار؛ لطفاً برنامه را نبند.</div>';
    if(settings.market==='forex'&&!settings.twelveKey){$('scannerResults').innerHTML='<div class="empty-state">برای اسکن فارکس/طلا، ابتدا API Key را ذخیره کن.</div>';scannerBusy=false;btn.disabled=false;btn.innerHTML='شروع اسکن <span>⌕</span>';return;}
    try{const rows=new Array(list.length);let cursor=0,done=0;async function worker(){while(cursor<list.length){const i=cursor++,[symbol,label]=list[i];try{const candles=await getCandles(symbol,settings.timeframe,240),closed=getClosedCandles(candles),analysis=analyzeCandles(closed);rows[i]={symbol,label,price:closed.at(-1)?.c,analysis};}catch(e){rows[i]={symbol,label,error:e.message||'خطا'};}done++;$('scanStatus').textContent='بررسی '+done+' از '+list.length+' نماد…';if(done<list.length)await new Promise(r=>setTimeout(r,140));}}await Promise.all(Array.from({length:Math.min(4,list.length)},worker));rows.sort((a,b)=>(b.analysis?.confidence||0)-(a.analysis?.confidence||0));$('scannerResults').innerHTML=rows.map(r=>{if(r.error)return '<div class="scan-row"><div class="scan-symbol"><strong>'+esc(r.label)+'</strong><small>'+esc(r.error)+'</small></div><div class="scan-price">—</div><span class="scan-signal">ناموفق</span></div>';const d=r.analysis.direction,cls=d==='LONG'?'long':d==='SHORT'?'short':'',label=d==='LONG'?'خرید':d==='SHORT'?'فروش':'بدون ستاپ';return '<div class="scan-row"><div class="scan-symbol"><strong>'+esc(r.label)+'</strong><small>کیفیت '+r.analysis.confidence+'٪ · تأیید '+(r.analysis.confluenceCount||0)+'/8</small></div><div class="scan-price">'+num(r.price,5)+'</div><span class="scan-signal '+cls+'">'+label+'</span></div>';}).join('');$('scanStatus').textContent='اسکن '+rows.length+' نماد · '+rows.filter(r=>r.analysis?.direction!=='NONE'&&!r.error).length+' ستاپ معتبر · '+faDate(Date.now());}catch(e){$('scannerResults').innerHTML='<div class="empty-state">'+esc(e.message||'خطا در اسکن')+'</div>';}finally{scannerBusy=false;btn.disabled=false;btn.innerHTML='شروع اسکن <span>⌕</span>';}
  }
'''
js=js[:ss]+scanner+js[se:]
html=html.replace('<div class="brand-mark">TP</div>','<img class="brand-logo" src="brand-logo.svg" alt="TradePilot" />')
html=html.replace('<div class="scanner-toolbar"><span id="scanStatus">هنوز اسکن انجام نشده</span><label class="toggle-label"><input id="autoScanToggle" type="checkbox" /> اسکن خودکار هر ۵ دقیقه</label></div>','<div class="scanner-toolbar"><span id="scanStatus">هنوز اسکن انجام نشده</span><div class="scanner-controls"><label class="toggle-label">تعداد نماد <select id="scanLimitSelect"><option value="20">۲۰ نماد</option><option value="30" selected>۳۰ نماد</option><option value="50">۵۰ نماد</option><option value="65">همه نمادها</option></select></label><label class="toggle-label"><input id="autoScanToggle" type="checkbox" /> اسکن خودکار هر ۵ دقیقه</label></div></div>')
html=html.replace('<div class="two-cards">','<div id="advancedMetrics" class="advanced-metrics"></div><div class="two-cards">',1)
html=html.replace('هر نماد با ساختار بازار، جمع‌آوری نقدینگی، شکست BOS/CHoCH و بازآزمایی Order Block یا FVG بررسی می‌شود. در نبود ستاپ کامل، سیگنالی صادر نمی‌شود.','۶۵ رمزارز منتخب با ساختار بازار، نقدینگی، BOS/CHoCH، Order Block، FVG، فیبوناچی، کندل تأییدی، حجم، قدرت روند و مومنتوم بررسی می‌شوند.')
html=html.replace('<span>Market Structure · HH/HL & LH/LL</span><span>Liquidity Sweep</span><span>BOS / CHoCH Confirmation</span><span>Order Block Retest</span><span>Fair Value Gap (FVG)</span><span>ATR Structural Stop</span><span>Risk / Reward Filter</span><span>EMA / RSI · فقط اطلاعات کمکی</span>','<span>Market Structure · HH/HL · LH/LL</span><span>Liquidity Sweep</span><span>BOS / CHoCH</span><span>Order Block & Mitigation</span><span>Fair Value Gap / Imbalance</span><span>Fibonacci Golden Zone</span><span>Engulfing & Pin Bar</span><span>Volume Expansion</span><span>ADX · قدرت روند</span><span>EMA 20/50</span><span>MACD Momentum</span><span>RSI Filter</span><span>حمایت و مقاومت سویینگ</span><span>ATR Stop Loss</span><span>Risk / Reward & Position Sizing</span><span>تأیید تایم‌فریم بالاتر</span>')
html=html.replace('<link rel="icon" href="icon.svg" type="image/svg+xml" />','<link rel="icon" href="brand-logo.svg" type="image/svg+xml" />')
logo=r'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="b"><stop stop-color="#122b46"/><stop offset="1" stop-color="#06111f"/></linearGradient><linearGradient id="g"><stop stop-color="#31d9ff"/><stop offset="1" stop-color="#36e5a0"/></linearGradient></defs><rect x="12" y="12" width="488" height="488" rx="110" fill="url(#b)" stroke="#244a68" stroke-width="8"/><path d="M70 355V280h42v75zm70 0V225h42v130zm70 0V265h42v90zm70 0V175h42v180zm70 0V115h42v240" fill="#1b9c8d" opacity=".3"/><path d="M68 320 155 245l65 38 88-105 57 20 80-95" fill="none" stroke="#41d6a3" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/><path d="M392 103h55v55" fill="none" stroke="#5df0b3" stroke-width="20" stroke-linecap="round"/><rect x="120" y="80" width="272" height="230" rx="92" fill="#0b1b30" stroke="url(#g)" stroke-width="12"/><ellipse cx="207" cy="195" rx="18" ry="25" fill="#24d8ff"/><ellipse cx="305" cy="195" rx="18" ry="25" fill="#24d8ff"/><path d="M220 255q36 25 72 0" fill="none" stroke="#42e4a4" stroke-width="11" stroke-linecap="round"/><circle cx="256" cy="62" r="12" fill="#49dfff"/><text x="256" y="440" text-anchor="middle" fill="#e8f5ff" font-family="Arial,sans-serif" font-size="36" font-weight="800">TRADEPILOT</text></svg>'''
(root/"public").mkdir(exist_ok=True);(root/"public"/"brand-logo.svg").write_text(logo,encoding="utf-8")
js_path.write_text(js,encoding="utf-8");html_path.write_text(html,encoding="utf-8")
css+="""
.brand-logo{width:48px;height:48px;object-fit:contain;border-radius:14px;box-shadow:0 5px 18px #14cfa333}
.scanner-controls{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.scanner-controls select{background:#0b1a2a;color:var(--text);border:1px solid var(--line);border-radius:8px;padding:6px;font-size:10px}
.advanced-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:10px}
.advanced-metrics .size-metric{padding:9px 7px;min-width:0}.advanced-metrics .size-metric b{font-size:11px;overflow-wrap:anywhere}
@media(max-width:390px){.advanced-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.scanner-controls{width:100%;justify-content:space-between}.brand-logo{width:43px;height:43px}}
"""
css_path.write_text(css,encoding="utf-8")
mp=js_path.with_name("manifest.webmanifest")
if mp.exists():
    m=json.loads(mp.read_text(encoding="utf-8"));m["icons"]=[{"src":"brand-logo.svg","sizes":"any","type":"image/svg+xml","purpose":"any maskable"}];mp.write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding="utf-8")
print("Professional TradePilot complete:",len(coins),"coins")
