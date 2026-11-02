from pathlib import Path
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else 'TradePilot')
js_files = list(root.rglob('app.js'))
if not js_files:
    raise SystemExit('TradePilot app.js not found')
js_path = js_files[0]
html_path = js_path.with_name('index.html')
source = js_path.read_text(encoding='utf-8')

start = source.index('  function analyzeCandles(candles) {')
end = source.index('  function positionSize(', start)
new_engine = r'''  function confirmedSwings(candles, left=2, right=2) {
    const highs=[], lows=[];
    for(let i=left;i<candles.length-right;i++) {
      let isHigh=true,isLow=true;
      for(let j=i-left;j<=i+right;j++) {
        if(j===i) continue;
        if(candles[j].h>=candles[i].h) isHigh=false;
        if(candles[j].l<=candles[i].l) isLow=false;
      }
      if(isHigh) highs.push({index:i,price:candles[i].h});
      if(isLow) lows.push({index:i,price:candles[i].l});
    }
    return {highs,lows};
  }

  function findLiquiditySweep(candles, pivots, side, lookback=10) {
    const first=Math.max(2,candles.length-lookback-1);
    for(let i=candles.length-2;i>=first;i--) {
      const ref=[...pivots].reverse().find(p=>p.index<i);
      if(!ref) continue;
      const c=candles[i];
      if(side==='LONG' && c.l<ref.price && c.c>ref.price) return {index:i,price:c.l,level:ref.price};
      if(side==='SHORT' && c.h>ref.price && c.c<ref.price) return {index:i,price:c.h,level:ref.price};
    }
    return null;
  }

  function confirmInternalBreak(candles, sweep, side) {
    if(!sweep || sweep.index>=candles.length-1) return false;
    const segment=candles.slice(sweep.index+1,-1);
    if(!segment.length) return false;
    const last=candles[candles.length-1],prev=candles[candles.length-2];
    if(side==='LONG') {
      const level=Math.max(...segment.map(c=>c.h));
      return last.c>level && prev.c<=level;
    }
    const level=Math.min(...segment.map(c=>c.l));
    return last.c<level && prev.c>=level;
  }

  function findRetestedZone(candles, side, atrValue) {
    const n=candles.length,last=candles[n-1],zones=[];
    const from=Math.max(2,n-36);
    for(let i=from;i<n;i++) {
      const older=candles[i-2],current=candles[i];
      if(side==='LONG' && current.l>older.h) zones.push({kind:'FVG',index:i,low:older.h,high:current.l});
      if(side==='SHORT' && current.h<older.l) zones.push({kind:'FVG',index:i,low:current.h,high:older.l});
    }
    for(let i=Math.max(0,n-20);i<n-1;i++) {
      const base=candles[i],impulse=candles[i+1];
      const body=Math.abs(impulse.c-impulse.o);
      if(side==='LONG' && base.c<base.o && impulse.c>base.h && body>=atrValue*.7)
        zones.push({kind:'Order Block',index:i,low:base.l,high:Math.max(base.o,base.c)});
      if(side==='SHORT' && base.c>base.o && impulse.c<base.l && body>=atrValue*.7)
        zones.push({kind:'Order Block',index:i,low:Math.min(base.o,base.c),high:base.h});
    }
    const tolerance=atrValue*.12;
    return zones.sort((a,b)=>b.index-a.index).find(z=>
      last.l<=z.high+tolerance && last.h>=z.low-tolerance && z.index<n-1
    ) || null;
  }

  function analyzeCandles(candles) {
    if(!candles || candles.length<100) return {direction:'NONE',score:0,confidence:0,reason:'برای تشخیص ساختار بازار حداقل ۱۰۰ کندل بسته‌شده لازم است.',setups:[],metrics:{}};
    const n=candles.length,last=candles[n-1],prev=candles[n-2],closes=candles.map(c=>c.c);
    const swings=confirmedSwings(candles),highs=swings.highs,lows=swings.lows;
    const av=atr(candles), e20=ema(closes,20),e50=ema(closes,50),rr=rsi(closes);
    if(!Number.isFinite(av) || av<=0 || highs.length<2 || lows.length<2)
      return {direction:'NONE',score:0,confidence:0,reason:'هنوز سقف و کف‌های تأییدشده کافی برای ساختار بازار وجود ندارد.',setups:[],metrics:{atr:av}};
    const lastHigh=highs[highs.length-1],priorHigh=highs[highs.length-2];
    const lastLow=lows[lows.length-1],priorLow=lows[lows.length-2];
    const bullishStructure=lastHigh.price>priorHigh.price && lastLow.price>priorLow.price;
    const bearishStructure=lastHigh.price<priorHigh.price && lastLow.price<priorLow.price;
    const bullBreak=last.c>lastHigh.price && prev.c<=lastHigh.price;
    const bearBreak=last.c<lastLow.price && prev.c>=lastLow.price;
    const bullCHOCH=bearishStructure && bullBreak;
    const bearCHOCH=bullishStructure && bearBreak;
    const bullSweep=findLiquiditySweep(candles,lows,'LONG');
    const bearSweep=findLiquiditySweep(candles,highs,'SHORT');
    const bullShift=confirmInternalBreak(candles,bullSweep,'LONG');
    const bearShift=confirmInternalBreak(candles,bearSweep,'SHORT');
    const bullZone=findRetestedZone(candles,'LONG',av);
    const bearZone=findRetestedZone(candles,'SHORT',av);
    const bullBias=bullishStructure||bullCHOCH;
    const bearBias=bearishStructure||bearCHOCH;
    const bullTrigger=(bullSweep&&bullShift)||bullBreak;
    const bearTrigger=(bearSweep&&bearShift)||bearBreak;
    const longReady=bullBias && bullTrigger && !!bullZone && !(bearBias&&bearTrigger&&bearZone);
    const shortReady=bearBias && bearTrigger && !!bearZone && !(bullBias&&bullTrigger&&bullZone);
    let direction='NONE',entry=last.c,stop=null,target=null,zone=null,sweep=null;
    const rrTarget=Math.max(1.5,Number(settings.rr)||2);
    if(longReady) {
      direction='LONG';zone=bullZone;sweep=bullSweep;
      const localLow=Math.min(...candles.slice(-10).map(c=>c.l));
      stop=localLow-av*.15;
      const risk=entry-stop;
      if(!(risk>=av*.35 && risk<=av*4 && stop>0)) direction='NONE';
      else target=entry+risk*rrTarget;
    } else if(shortReady) {
      direction='SHORT';zone=bearZone;sweep=bearSweep;
      const localHigh=Math.max(...candles.slice(-10).map(c=>c.h));
      stop=localHigh+av*.15;
      const risk=stop-entry;
      if(!(risk>=av*.35 && risk<=av*4 && entry>0 && risk<entry)) direction='NONE';
      else target=entry-risk*rrTarget;
    }
    const side=direction,setups=[];
    if(direction!=='NONE') {
      setups.push({direction,weight:1,name:'ساختار بازار و روند',detail:bullCHOCH||bearCHOCH?'تغییر کاراکتر بازار (CHoCH) با شکست سقف/کف ساختاری تأیید شد.':'ترتیب سقف‌ها و کف‌های تأییدشده، جهت ساختار بازار را مشخص می‌کند.'});
      setups.push({direction,weight:1,name:'جمع‌آوری نقدینگی',detail:sweep?'قیمت از نقدینگی سمت مقابل عبور کرد و دوباره داخل محدوده بسته شد.':'شکست ساختاری معتبر بالای/پایین آخرین سویینگ تأیید شد.'});
      setups.push({direction,weight:1,name:'تأیید BOS / CHoCH',detail:'کلوز کندل، شکست ساختار داخلی/سویینگ را تأیید کرده است.'});
      setups.push({direction,weight:1,name:zone.kind+' Retest',detail:'قیمت به ناحیه '+zone.kind+' برگشته و آن را لمس کرده است.'});
    } else {
      setups.push({direction:'NONE',weight:0,name:'ساختار بازار',detail:bullishStructure?'ساختار فعلاً صعودی است.':bearishStructure?'ساختار فعلاً نزولی است.':'بازار ساختار جهت‌دار واضحی ندارد.'});
      setups.push({direction:'NONE',weight:0,name:'نقدینگی و شکست',detail:(bullSweep||bearSweep)?'سویپ دیده شده اما شکست داخلی بعد از آن کامل نیست.':'سویپ نقدینگی معتبر همراه با شکست تأییدی دیده نشد.'});
      setups.push({direction:'NONE',weight:0,name:'Order Block / FVG',detail:'بازگشت قیمت به ناحیه معتبر و قابل معامله هنوز تأیید نشده است.'});
    }
    const score=direction==='NONE'?0:4,confidence=direction==='NONE'?0:100;
    const reason=direction==='NONE'?'ستاپ کامل وجود ندارد؛ تا تکمیل ساختار، شکست و پولبک وارد معامله نشو.':(direction==='LONG'?'ستاپ خرید':'ستاپ فروش')+' با تأیید ساختار بازار، نقدینگی، شکست و بازآزمایی ناحیه شکل گرفته است.';
    return {direction,score,confidence,entry,stop,target,rr:rrTarget,reason,setups,longScore:direction==='LONG'?4:0,shortScore:direction==='SHORT'?4:0,
      metrics:{rsi:rr,atr:av,ema20:e20[n-1],ema50:e50[n-1],close:entry,candleTime:last.t,structure:bullishStructure?'BULLISH':bearishStructure?'BEARISH':'RANGE',bos:bullBreak?'BULLISH':bearBreak?'BEARISH':null,zone:zone?zone.kind:null}};
  }

'''
source = source[:start] + new_engine + source[end:]
source = source.replace('limit=280) {', 'limit=1000) {')
source = source.replace('getCandles(settings.symbol, settings.timeframe, 280)', 'getCandles(settings.symbol, settings.timeframe, 1000)')
source = source.replace('getCandles(settings.symbol,settings.timeframe,280)', 'getCandles(settings.symbol,settings.timeframe,1000)')
source = source.replace('getCandles(symbol,settings.timeframe,180)', 'getCandles(symbol,settings.timeframe,300)')
source = source.replace('limit:String(Math.min(limit,500))', 'limit:String(Math.min(limit,1000))')
source = source.replace('قدرت هم‌گرایی $' + '{a.confidence}%', 'تکمیل شروط $' + '{a.setups.length}/4')
source = source.replace('امتیاز 

bt_start = source.index('  function runBacktest() {')
bt_end = source.index('  function addCurrentSignalToJournal()', bt_start)
new_backtest = r'''  function runBacktest() {
    const bars=activeCandles.filter(c=>Number.isFinite(c.closeTime)?c.closeTime<Date.now()-500:true);
    if(bars.length<220){showToast('برای بک‌تست قابل ارزیابی حداقل ۲۲۰ کندل بسته‌شده لازم است.');return;}
    const feePerSide=0.0006,slippagePerSide=0.0002,maxHold=40,warmup=100;
    function evaluate(from,to) {
      const trades=[];let signals=0,expired=0,i=Math.max(from,warmup);
      while(i<to-1) {
        const a=analyzeCandles(bars.slice(0,i+1));
        if(a.direction==='NONE'){i++;continue;}
        signals++;
        const long=a.direction==='LONG',sign=long?1:-1,next=bars[i+1];
        const entry=next.o*(long?1+slippagePerSide:1-slippagePerSide);
        const stop=a.stop,risk=Math.abs(entry-stop);
        if(!(risk>0 && (long?stop<entry:stop>entry))){i++;continue;}
        const target=entry+sign*risk*a.rr;
        let exitPrice=null,exitIndex=null,exitReason='TIME';
        const lastIndex=Math.min(to-1,i+maxHold);
        for(let j=i+1;j<=lastIndex;j++) {
          const c=bars[j];
          if(long && c.o<=stop){exitPrice=c.o*(1-slippagePerSide);exitReason='GAP_SL';exitIndex=j;break;}
          if(long && c.o>=target){exitPrice=c.o*(1-slippagePerSide);exitReason='GAP_TP';exitIndex=j;break;}
          if(!long && c.o>=stop){exitPrice=c.o*(1+slippagePerSide);exitReason='GAP_SL';exitIndex=j;break;}
          if(!long && c.o<=target){exitPrice=c.o*(1+slippagePerSide);exitReason='GAP_TP';exitIndex=j;break;}
          const stopHit=long?c.l<=stop:c.h>=stop;
          const targetHit=long?c.h>=target:c.l<=target;
          if(stopHit){exitPrice=stop*(long?1-slippagePerSide:1+slippagePerSide);exitReason='SL';exitIndex=j;break;}
          if(targetHit){exitPrice=target*(long?1-slippagePerSide:1+slippagePerSide);exitReason='TP';exitIndex=j;break;}
          if(j===lastIndex){exitPrice=c.c*(long?1-slippagePerSide:1+slippagePerSide);exitReason='TIME';exitIndex=j;}
        }
        if(exitPrice===null || exitIndex===null){expired++;i++;continue;}
        const grossR=sign*(exitPrice-entry)/risk;
        const feesR=((entry+exitPrice)*feePerSide)/risk;
        const netR=grossR-feesR;
        trades.push({netR,grossR,feesR,reason:exitReason,entryIndex:i+1,exitIndex});
        i=Math.max(i+1,exitIndex+1);
      }
      const wins=trades.filter(t=>t.netR>0).length,losses=trades.length-wins;
      const netR=trades.reduce((s,t)=>s+t.netR,0),grossProfit=trades.reduce((s,t)=>s+Math.max(0,t.netR),0),grossLoss=Math.abs(trades.reduce((s,t)=>s+Math.min(0,t.netR),0));
      let equity=0,peak=0,maxDrawdown=0;
      for(const t of trades){equity+=t.netR;peak=Math.max(peak,equity);maxDrawdown=Math.max(maxDrawdown,peak-equity);}
      return {signals,trades:trades.length,wins,losses,expired,netR,winRate:trades.length?wins/trades.length*100:0,
        expectancy:trades.length?netR/trades.length:0,profitFactor:grossLoss>0?grossProfit/grossLoss:null,maxDrawdown};
    }
    const split=Math.floor(bars.length*.7);
    const full=evaluate(warmup,bars.length),oos=evaluate(Math.max(warmup,split),bars.length),past=evaluate(warmup,split);
    const panel=$('backtestResult')||document.createElement('div');panel.id='backtestResult';panel.className='panel';
    panel.style.cssText='margin-top:12px;padding:14px;line-height:1.7';
    const fmtPF=x=>x.profitFactor===null?'—':num(x.profitFactor,2);
    const summary=(label,x)=>'<div style="margin-top:9px;padding:11px;background:#0a1725;border:1px solid #1d3046;border-radius:11px"><strong style="font-size:12px">'+label+'</strong><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px">'+
      '<div><small style="color:#8da1b8">معامل سود (PF)</small><b style="display:block">'+fmtPF(x)+'</b></div>'+
      '<div><small style="color:#8da1b8">بازده خالص</small><b style="display:block">'+num(x.netR,2)+'R</b></div>'+
      '<div><small style="color:#8da1b8">نرخ برد</small><b style="display:block">'+num(x.winRate,1)+'٪ · '+x.wins+'/'+x.trades+'</b></div>'+
      '<div><small style="color:#8da1b8">امید ریاضی</small><b style="display:block">'+num(x.expectancy,2)+'R</b></div>'+
      '<div><small style="color:#8da1b8">حداکثر افت سرمایه</small><b style="display:block">'+num(x.maxDrawdown,2)+'R</b></div>'+
      '<div><small style="color:#8da1b8">سیگنال / معاملات بسته</small><b style="display:block">'+x.signals+' / '+x.trades+'</b></div></div></div>';
    panel.innerHTML='<strong style="font-size:13px">گزارش بک‌تست ساختار بازار</strong><p style="font-size:10px;color:#8da1b8;margin:3px 0">'+bars.length+' کندل · ورود در بازشدن کندل بعدی · بدون هم‌پوشانی معاملات · حداکثر نگهداری '+maxHold+' کندل</p>'+
      summary('۷۰٪ بخش گذشته · بررسی تاریخی',past)+summary('۳۰٪ خارج از نمونه · مهم‌تر برای ارزیابی',oos)+summary('کل داده',full)+
      '<div style="margin-top:10px;padding:10px;border-right:2px solid #f5bd62;background:#171f2b;border-radius:8px;font-size:9px;color:#b5c3d2">هزینه فرضی هر سمت: کارمزد ۰٫۰۶٪ + اسلیپیج ۰٫۰۲٪. اگر حد ضرر و حد سود در یک کندل لمس شوند، حد ضرر اول فرض شده است. این گزارش شبیه‌سازی است، نه تضمین سود یا پیش‌بینی آینده.</div>'+
      (oos.trades<10?'<p style="font-size:10px;color:#f5bd62;margin:8px 0 0">نمونه خارج از نمونه کمتر از ۱۰ معامله دارد؛ برای نتیجه‌گیری آماری کافی نیست و داده بیشتری لازم است.</p>':'');
    const chart=$('backtestBtn').closest('.chart-panel');if(panel.parentElement!==chart)chart.appendChild(panel);
    showToast('بک‌تست تمام شد؛ نتیجه خارج از نمونه را بررسی کن.');
  }

'''
source = source[:bt_start] + new_backtest + source[bt_end:]
js_path.write_text(source, encoding='utf-8')
if html_path.exists():
    html=html_path.read_text(encoding='utf-8')
    html=html.replace('Confluence Engine','Market Structure Engine')
    html=html.replace('هر نماد با ۵ خانواده استراتژی بررسی می‌شود. نبود ستاپ معتبر به معنی «بدون سیگنال» است.','هر نماد با ساختار بازار، جمع‌آوری نقدینگی، شکست BOS/CHoCH و بازآزمایی Order Block یا FVG بررسی می‌شود. در نبود ستاپ کامل، سیگنالی صادر نمی‌شود.')
    html=html.replace('<span>EMA 20/50 Trend</span><span>MACD + RSI Momentum</span><span>Volume Breakout</span><span>Bollinger Reversion</span><span>Engulfing / Pin Bar</span><span>Market Structure</span><span>ATR Stop Loss</span><span>Risk / Reward Filter</span>', '<span>Market Structure · HH/HL & LH/LL</span><span>Liquidity Sweep</span><span>BOS / CHoCH Confirmation</span><span>Order Block Retest</span><span>Fair Value Gap (FVG)</span><span>ATR Structural Stop</span><span>Risk / Reward Filter</span><span>EMA / RSI · فقط اطلاعات کمکی</span>')
    html_path.write_text(html, encoding='utf-8')
print('Patched:', js_path)
print('Updated HTML:', html_path.exists()) + '{num(r.analysis.score,1)} · 

bt_start = source.index('  function runBacktest() {')
bt_end = source.index('  function addCurrentSignalToJournal()', bt_start)
new_backtest = r'''  function runBacktest() {
    const bars=activeCandles.filter(c=>Number.isFinite(c.closeTime)?c.closeTime<Date.now()-500:true);
    if(bars.length<220){showToast('برای بک‌تست قابل ارزیابی حداقل ۲۲۰ کندل بسته‌شده لازم است.');return;}
    const feePerSide=0.0006,slippagePerSide=0.0002,maxHold=40,warmup=100;
    function evaluate(from,to) {
      const trades=[];let signals=0,expired=0,i=Math.max(from,warmup);
      while(i<to-1) {
        const a=analyzeCandles(bars.slice(0,i+1));
        if(a.direction==='NONE'){i++;continue;}
        signals++;
        const long=a.direction==='LONG',sign=long?1:-1,next=bars[i+1];
        const entry=next.o*(long?1+slippagePerSide:1-slippagePerSide);
        const stop=a.stop,risk=Math.abs(entry-stop);
        if(!(risk>0 && (long?stop<entry:stop>entry))){i++;continue;}
        const target=entry+sign*risk*a.rr;
        let exitPrice=null,exitIndex=null,exitReason='TIME';
        const lastIndex=Math.min(to-1,i+maxHold);
        for(let j=i+1;j<=lastIndex;j++) {
          const c=bars[j];
          if(long && c.o<=stop){exitPrice=c.o*(1-slippagePerSide);exitReason='GAP_SL';exitIndex=j;break;}
          if(long && c.o>=target){exitPrice=c.o*(1-slippagePerSide);exitReason='GAP_TP';exitIndex=j;break;}
          if(!long && c.o>=stop){exitPrice=c.o*(1+slippagePerSide);exitReason='GAP_SL';exitIndex=j;break;}
          if(!long && c.o<=target){exitPrice=c.o*(1+slippagePerSide);exitReason='GAP_TP';exitIndex=j;break;}
          const stopHit=long?c.l<=stop:c.h>=stop;
          const targetHit=long?c.h>=target:c.l<=target;
          if(stopHit){exitPrice=stop*(long?1-slippagePerSide:1+slippagePerSide);exitReason='SL';exitIndex=j;break;}
          if(targetHit){exitPrice=target*(long?1-slippagePerSide:1+slippagePerSide);exitReason='TP';exitIndex=j;break;}
          if(j===lastIndex){exitPrice=c.c*(long?1-slippagePerSide:1+slippagePerSide);exitReason='TIME';exitIndex=j;}
        }
        if(exitPrice===null || exitIndex===null){expired++;i++;continue;}
        const grossR=sign*(exitPrice-entry)/risk;
        const feesR=((entry+exitPrice)*feePerSide)/risk;
        const netR=grossR-feesR;
        trades.push({netR,grossR,feesR,reason:exitReason,entryIndex:i+1,exitIndex});
        i=Math.max(i+1,exitIndex+1);
      }
      const wins=trades.filter(t=>t.netR>0).length,losses=trades.length-wins;
      const netR=trades.reduce((s,t)=>s+t.netR,0),grossProfit=trades.reduce((s,t)=>s+Math.max(0,t.netR),0),grossLoss=Math.abs(trades.reduce((s,t)=>s+Math.min(0,t.netR),0));
      let equity=0,peak=0,maxDrawdown=0;
      for(const t of trades){equity+=t.netR;peak=Math.max(peak,equity);maxDrawdown=Math.max(maxDrawdown,peak-equity);}
      return {signals,trades:trades.length,wins,losses,expired,netR,winRate:trades.length?wins/trades.length*100:0,
        expectancy:trades.length?netR/trades.length:0,profitFactor:grossLoss>0?grossProfit/grossLoss:null,maxDrawdown};
    }
    const split=Math.floor(bars.length*.7);
    const full=evaluate(warmup,bars.length),oos=evaluate(Math.max(warmup,split),bars.length),past=evaluate(warmup,split);
    const panel=$('backtestResult')||document.createElement('div');panel.id='backtestResult';panel.className='panel';
    panel.style.cssText='margin-top:12px;padding:14px;line-height:1.7';
    const fmtPF=x=>x.profitFactor===null?'—':num(x.profitFactor,2);
    const summary=(label,x)=>'<div style="margin-top:9px;padding:11px;background:#0a1725;border:1px solid #1d3046;border-radius:11px"><strong style="font-size:12px">'+label+'</strong><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px">'+
      '<div><small style="color:#8da1b8">معامل سود (PF)</small><b style="display:block">'+fmtPF(x)+'</b></div>'+
      '<div><small style="color:#8da1b8">بازده خالص</small><b style="display:block">'+num(x.netR,2)+'R</b></div>'+
      '<div><small style="color:#8da1b8">نرخ برد</small><b style="display:block">'+num(x.winRate,1)+'٪ · '+x.wins+'/'+x.trades+'</b></div>'+
      '<div><small style="color:#8da1b8">امید ریاضی</small><b style="display:block">'+num(x.expectancy,2)+'R</b></div>'+
      '<div><small style="color:#8da1b8">حداکثر افت سرمایه</small><b style="display:block">'+num(x.maxDrawdown,2)+'R</b></div>'+
      '<div><small style="color:#8da1b8">سیگنال / معاملات بسته</small><b style="display:block">'+x.signals+' / '+x.trades+'</b></div></div></div>';
    panel.innerHTML='<strong style="font-size:13px">گزارش بک‌تست ساختار بازار</strong><p style="font-size:10px;color:#8da1b8;margin:3px 0">'+bars.length+' کندل · ورود در بازشدن کندل بعدی · بدون هم‌پوشانی معاملات · حداکثر نگهداری '+maxHold+' کندل</p>'+
      summary('۷۰٪ بخش گذشته · بررسی تاریخی',past)+summary('۳۰٪ خارج از نمونه · مهم‌تر برای ارزیابی',oos)+summary('کل داده',full)+
      '<div style="margin-top:10px;padding:10px;border-right:2px solid #f5bd62;background:#171f2b;border-radius:8px;font-size:9px;color:#b5c3d2">هزینه فرضی هر سمت: کارمزد ۰٫۰۶٪ + اسلیپیج ۰٫۰۲٪. اگر حد ضرر و حد سود در یک کندل لمس شوند، حد ضرر اول فرض شده است. این گزارش شبیه‌سازی است، نه تضمین سود یا پیش‌بینی آینده.</div>'+
      (oos.trades<10?'<p style="font-size:10px;color:#f5bd62;margin:8px 0 0">نمونه خارج از نمونه کمتر از ۱۰ معامله دارد؛ برای نتیجه‌گیری آماری کافی نیست و داده بیشتری لازم است.</p>':'');
    const chart=$('backtestBtn').closest('.chart-panel');if(panel.parentElement!==chart)chart.appendChild(panel);
    showToast('بک‌تست تمام شد؛ نتیجه خارج از نمونه را بررسی کن.');
  }

'''
source = source[:bt_start] + new_backtest + source[bt_end:]
js_path.write_text(source, encoding='utf-8')
if html_path.exists():
    html=html_path.read_text(encoding='utf-8')
    html=html.replace('Confluence Engine','Market Structure Engine')
    html=html.replace('هر نماد با ۵ خانواده استراتژی بررسی می‌شود. نبود ستاپ معتبر به معنی «بدون سیگنال» است.','هر نماد با ساختار بازار، جمع‌آوری نقدینگی، شکست BOS/CHoCH و بازآزمایی Order Block یا FVG بررسی می‌شود. در نبود ستاپ کامل، سیگنالی صادر نمی‌شود.')
    html=html.replace('<span>EMA 20/50 Trend</span><span>MACD + RSI Momentum</span><span>Volume Breakout</span><span>Bollinger Reversion</span><span>Engulfing / Pin Bar</span><span>Market Structure</span><span>ATR Stop Loss</span><span>Risk / Reward Filter</span>', '<span>Market Structure · HH/HL & LH/LL</span><span>Liquidity Sweep</span><span>BOS / CHoCH Confirmation</span><span>Order Block Retest</span><span>Fair Value Gap (FVG)</span><span>ATR Structural Stop</span><span>Risk / Reward Filter</span><span>EMA / RSI · فقط اطلاعات کمکی</span>')
    html_path.write_text(html, encoding='utf-8')
print('Patched:', js_path)
print('Updated HTML:', html_path.exists()) + '{r.analysis.confidence}%', 'تکمیل شروط 

bt_start = source.index('  function runBacktest() {')
bt_end = source.index('  function addCurrentSignalToJournal()', bt_start)
new_backtest = r'''  function runBacktest() {
    const bars=activeCandles.filter(c=>Number.isFinite(c.closeTime)?c.closeTime<Date.now()-500:true);
    if(bars.length<220){showToast('برای بک‌تست قابل ارزیابی حداقل ۲۲۰ کندل بسته‌شده لازم است.');return;}
    const feePerSide=0.0006,slippagePerSide=0.0002,maxHold=40,warmup=100;
    function evaluate(from,to) {
      const trades=[];let signals=0,expired=0,i=Math.max(from,warmup);
      while(i<to-1) {
        const a=analyzeCandles(bars.slice(0,i+1));
        if(a.direction==='NONE'){i++;continue;}
        signals++;
        const long=a.direction==='LONG',sign=long?1:-1,next=bars[i+1];
        const entry=next.o*(long?1+slippagePerSide:1-slippagePerSide);
        const stop=a.stop,risk=Math.abs(entry-stop);
        if(!(risk>0 && (long?stop<entry:stop>entry))){i++;continue;}
        const target=entry+sign*risk*a.rr;
        let exitPrice=null,exitIndex=null,exitReason='TIME';
        const lastIndex=Math.min(to-1,i+maxHold);
        for(let j=i+1;j<=lastIndex;j++) {
          const c=bars[j];
          if(long && c.o<=stop){exitPrice=c.o*(1-slippagePerSide);exitReason='GAP_SL';exitIndex=j;break;}
          if(long && c.o>=target){exitPrice=c.o*(1-slippagePerSide);exitReason='GAP_TP';exitIndex=j;break;}
          if(!long && c.o>=stop){exitPrice=c.o*(1+slippagePerSide);exitReason='GAP_SL';exitIndex=j;break;}
          if(!long && c.o<=target){exitPrice=c.o*(1+slippagePerSide);exitReason='GAP_TP';exitIndex=j;break;}
          const stopHit=long?c.l<=stop:c.h>=stop;
          const targetHit=long?c.h>=target:c.l<=target;
          if(stopHit){exitPrice=stop*(long?1-slippagePerSide:1+slippagePerSide);exitReason='SL';exitIndex=j;break;}
          if(targetHit){exitPrice=target*(long?1-slippagePerSide:1+slippagePerSide);exitReason='TP';exitIndex=j;break;}
          if(j===lastIndex){exitPrice=c.c*(long?1-slippagePerSide:1+slippagePerSide);exitReason='TIME';exitIndex=j;}
        }
        if(exitPrice===null || exitIndex===null){expired++;i++;continue;}
        const grossR=sign*(exitPrice-entry)/risk;
        const feesR=((entry+exitPrice)*feePerSide)/risk;
        const netR=grossR-feesR;
        trades.push({netR,grossR,feesR,reason:exitReason,entryIndex:i+1,exitIndex});
        i=Math.max(i+1,exitIndex+1);
      }
      const wins=trades.filter(t=>t.netR>0).length,losses=trades.length-wins;
      const netR=trades.reduce((s,t)=>s+t.netR,0),grossProfit=trades.reduce((s,t)=>s+Math.max(0,t.netR),0),grossLoss=Math.abs(trades.reduce((s,t)=>s+Math.min(0,t.netR),0));
      let equity=0,peak=0,maxDrawdown=0;
      for(const t of trades){equity+=t.netR;peak=Math.max(peak,equity);maxDrawdown=Math.max(maxDrawdown,peak-equity);}
      return {signals,trades:trades.length,wins,losses,expired,netR,winRate:trades.length?wins/trades.length*100:0,
        expectancy:trades.length?netR/trades.length:0,profitFactor:grossLoss>0?grossProfit/grossLoss:null,maxDrawdown};
    }
    const split=Math.floor(bars.length*.7);
    const full=evaluate(warmup,bars.length),oos=evaluate(Math.max(warmup,split),bars.length),past=evaluate(warmup,split);
    const panel=$('backtestResult')||document.createElement('div');panel.id='backtestResult';panel.className='panel';
    panel.style.cssText='margin-top:12px;padding:14px;line-height:1.7';
    const fmtPF=x=>x.profitFactor===null?'—':num(x.profitFactor,2);
    const summary=(label,x)=>'<div style="margin-top:9px;padding:11px;background:#0a1725;border:1px solid #1d3046;border-radius:11px"><strong style="font-size:12px">'+label+'</strong><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px">'+
      '<div><small style="color:#8da1b8">معامل سود (PF)</small><b style="display:block">'+fmtPF(x)+'</b></div>'+
      '<div><small style="color:#8da1b8">بازده خالص</small><b style="display:block">'+num(x.netR,2)+'R</b></div>'+
      '<div><small style="color:#8da1b8">نرخ برد</small><b style="display:block">'+num(x.winRate,1)+'٪ · '+x.wins+'/'+x.trades+'</b></div>'+
      '<div><small style="color:#8da1b8">امید ریاضی</small><b style="display:block">'+num(x.expectancy,2)+'R</b></div>'+
      '<div><small style="color:#8da1b8">حداکثر افت سرمایه</small><b style="display:block">'+num(x.maxDrawdown,2)+'R</b></div>'+
      '<div><small style="color:#8da1b8">سیگنال / معاملات بسته</small><b style="display:block">'+x.signals+' / '+x.trades+'</b></div></div></div>';
    panel.innerHTML='<strong style="font-size:13px">گزارش بک‌تست ساختار بازار</strong><p style="font-size:10px;color:#8da1b8;margin:3px 0">'+bars.length+' کندل · ورود در بازشدن کندل بعدی · بدون هم‌پوشانی معاملات · حداکثر نگهداری '+maxHold+' کندل</p>'+
      summary('۷۰٪ بخش گذشته · بررسی تاریخی',past)+summary('۳۰٪ خارج از نمونه · مهم‌تر برای ارزیابی',oos)+summary('کل داده',full)+
      '<div style="margin-top:10px;padding:10px;border-right:2px solid #f5bd62;background:#171f2b;border-radius:8px;font-size:9px;color:#b5c3d2">هزینه فرضی هر سمت: کارمزد ۰٫۰۶٪ + اسلیپیج ۰٫۰۲٪. اگر حد ضرر و حد سود در یک کندل لمس شوند، حد ضرر اول فرض شده است. این گزارش شبیه‌سازی است، نه تضمین سود یا پیش‌بینی آینده.</div>'+
      (oos.trades<10?'<p style="font-size:10px;color:#f5bd62;margin:8px 0 0">نمونه خارج از نمونه کمتر از ۱۰ معامله دارد؛ برای نتیجه‌گیری آماری کافی نیست و داده بیشتری لازم است.</p>':'');
    const chart=$('backtestBtn').closest('.chart-panel');if(panel.parentElement!==chart)chart.appendChild(panel);
    showToast('بک‌تست تمام شد؛ نتیجه خارج از نمونه را بررسی کن.');
  }

'''
source = source[:bt_start] + new_backtest + source[bt_end:]
js_path.write_text(source, encoding='utf-8')
if html_path.exists():
    html=html_path.read_text(encoding='utf-8')
    html=html.replace('Confluence Engine','Market Structure Engine')
    html=html.replace('هر نماد با ۵ خانواده استراتژی بررسی می‌شود. نبود ستاپ معتبر به معنی «بدون سیگنال» است.','هر نماد با ساختار بازار، جمع‌آوری نقدینگی، شکست BOS/CHoCH و بازآزمایی Order Block یا FVG بررسی می‌شود. در نبود ستاپ کامل، سیگنالی صادر نمی‌شود.')
    html=html.replace('<span>EMA 20/50 Trend</span><span>MACD + RSI Momentum</span><span>Volume Breakout</span><span>Bollinger Reversion</span><span>Engulfing / Pin Bar</span><span>Market Structure</span><span>ATR Stop Loss</span><span>Risk / Reward Filter</span>', '<span>Market Structure · HH/HL & LH/LL</span><span>Liquidity Sweep</span><span>BOS / CHoCH Confirmation</span><span>Order Block Retest</span><span>Fair Value Gap (FVG)</span><span>ATR Structural Stop</span><span>Risk / Reward Filter</span><span>EMA / RSI · فقط اطلاعات کمکی</span>')
    html_path.write_text(html, encoding='utf-8')
print('Patched:', js_path)
print('Updated HTML:', html_path.exists()) + '{r.analysis.direction===\'NONE\'?0:r.analysis.setups.length}/4')

bt_start = source.index('  function runBacktest() {')
bt_end = source.index('  function addCurrentSignalToJournal()', bt_start)
new_backtest = r'''  function runBacktest() {
    const bars=activeCandles.filter(c=>Number.isFinite(c.closeTime)?c.closeTime<Date.now()-500:true);
    if(bars.length<220){showToast('برای بک‌تست قابل ارزیابی حداقل ۲۲۰ کندل بسته‌شده لازم است.');return;}
    const feePerSide=0.0006,slippagePerSide=0.0002,maxHold=40,warmup=100;
    function evaluate(from,to) {
      const trades=[];let signals=0,expired=0,i=Math.max(from,warmup);
      while(i<to-1) {
        const a=analyzeCandles(bars.slice(0,i+1));
        if(a.direction==='NONE'){i++;continue;}
        signals++;
        const long=a.direction==='LONG',sign=long?1:-1,next=bars[i+1];
        const entry=next.o*(long?1+slippagePerSide:1-slippagePerSide);
        const stop=a.stop,risk=Math.abs(entry-stop);
        if(!(risk>0 && (long?stop<entry:stop>entry))){i++;continue;}
        const target=entry+sign*risk*a.rr;
        let exitPrice=null,exitIndex=null,exitReason='TIME';
        const lastIndex=Math.min(to-1,i+maxHold);
        for(let j=i+1;j<=lastIndex;j++) {
          const c=bars[j];
          if(long && c.o<=stop){exitPrice=c.o*(1-slippagePerSide);exitReason='GAP_SL';exitIndex=j;break;}
          if(long && c.o>=target){exitPrice=c.o*(1-slippagePerSide);exitReason='GAP_TP';exitIndex=j;break;}
          if(!long && c.o>=stop){exitPrice=c.o*(1+slippagePerSide);exitReason='GAP_SL';exitIndex=j;break;}
          if(!long && c.o<=target){exitPrice=c.o*(1+slippagePerSide);exitReason='GAP_TP';exitIndex=j;break;}
          const stopHit=long?c.l<=stop:c.h>=stop;
          const targetHit=long?c.h>=target:c.l<=target;
          if(stopHit){exitPrice=stop*(long?1-slippagePerSide:1+slippagePerSide);exitReason='SL';exitIndex=j;break;}
          if(targetHit){exitPrice=target*(long?1-slippagePerSide:1+slippagePerSide);exitReason='TP';exitIndex=j;break;}
          if(j===lastIndex){exitPrice=c.c*(long?1-slippagePerSide:1+slippagePerSide);exitReason='TIME';exitIndex=j;}
        }
        if(exitPrice===null || exitIndex===null){expired++;i++;continue;}
        const grossR=sign*(exitPrice-entry)/risk;
        const feesR=((entry+exitPrice)*feePerSide)/risk;
        const netR=grossR-feesR;
        trades.push({netR,grossR,feesR,reason:exitReason,entryIndex:i+1,exitIndex});
        i=Math.max(i+1,exitIndex+1);
      }
      const wins=trades.filter(t=>t.netR>0).length,losses=trades.length-wins;
      const netR=trades.reduce((s,t)=>s+t.netR,0),grossProfit=trades.reduce((s,t)=>s+Math.max(0,t.netR),0),grossLoss=Math.abs(trades.reduce((s,t)=>s+Math.min(0,t.netR),0));
      let equity=0,peak=0,maxDrawdown=0;
      for(const t of trades){equity+=t.netR;peak=Math.max(peak,equity);maxDrawdown=Math.max(maxDrawdown,peak-equity);}
      return {signals,trades:trades.length,wins,losses,expired,netR,winRate:trades.length?wins/trades.length*100:0,
        expectancy:trades.length?netR/trades.length:0,profitFactor:grossLoss>0?grossProfit/grossLoss:null,maxDrawdown};
    }
    const split=Math.floor(bars.length*.7);
    const full=evaluate(warmup,bars.length),oos=evaluate(Math.max(warmup,split),bars.length),past=evaluate(warmup,split);
    const panel=$('backtestResult')||document.createElement('div');panel.id='backtestResult';panel.className='panel';
    panel.style.cssText='margin-top:12px;padding:14px;line-height:1.7';
    const fmtPF=x=>x.profitFactor===null?'—':num(x.profitFactor,2);
    const summary=(label,x)=>'<div style="margin-top:9px;padding:11px;background:#0a1725;border:1px solid #1d3046;border-radius:11px"><strong style="font-size:12px">'+label+'</strong><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px">'+
      '<div><small style="color:#8da1b8">معامل سود (PF)</small><b style="display:block">'+fmtPF(x)+'</b></div>'+
      '<div><small style="color:#8da1b8">بازده خالص</small><b style="display:block">'+num(x.netR,2)+'R</b></div>'+
      '<div><small style="color:#8da1b8">نرخ برد</small><b style="display:block">'+num(x.winRate,1)+'٪ · '+x.wins+'/'+x.trades+'</b></div>'+
      '<div><small style="color:#8da1b8">امید ریاضی</small><b style="display:block">'+num(x.expectancy,2)+'R</b></div>'+
      '<div><small style="color:#8da1b8">حداکثر افت سرمایه</small><b style="display:block">'+num(x.maxDrawdown,2)+'R</b></div>'+
      '<div><small style="color:#8da1b8">سیگنال / معاملات بسته</small><b style="display:block">'+x.signals+' / '+x.trades+'</b></div></div></div>';
    panel.innerHTML='<strong style="font-size:13px">گزارش بک‌تست ساختار بازار</strong><p style="font-size:10px;color:#8da1b8;margin:3px 0">'+bars.length+' کندل · ورود در بازشدن کندل بعدی · بدون هم‌پوشانی معاملات · حداکثر نگهداری '+maxHold+' کندل</p>'+
      summary('۷۰٪ بخش گذشته · بررسی تاریخی',past)+summary('۳۰٪ خارج از نمونه · مهم‌تر برای ارزیابی',oos)+summary('کل داده',full)+
      '<div style="margin-top:10px;padding:10px;border-right:2px solid #f5bd62;background:#171f2b;border-radius:8px;font-size:9px;color:#b5c3d2">هزینه فرضی هر سمت: کارمزد ۰٫۰۶٪ + اسلیپیج ۰٫۰۲٪. اگر حد ضرر و حد سود در یک کندل لمس شوند، حد ضرر اول فرض شده است. این گزارش شبیه‌سازی است، نه تضمین سود یا پیش‌بینی آینده.</div>'+
      (oos.trades<10?'<p style="font-size:10px;color:#f5bd62;margin:8px 0 0">نمونه خارج از نمونه کمتر از ۱۰ معامله دارد؛ برای نتیجه‌گیری آماری کافی نیست و داده بیشتری لازم است.</p>':'');
    const chart=$('backtestBtn').closest('.chart-panel');if(panel.parentElement!==chart)chart.appendChild(panel);
    showToast('بک‌تست تمام شد؛ نتیجه خارج از نمونه را بررسی کن.');
  }

'''
source = source[:bt_start] + new_backtest + source[bt_end:]
js_path.write_text(source, encoding='utf-8')
if html_path.exists():
    html=html_path.read_text(encoding='utf-8')
    html=html.replace('Confluence Engine','Market Structure Engine')
    html=html.replace('هر نماد با ۵ خانواده استراتژی بررسی می‌شود. نبود ستاپ معتبر به معنی «بدون سیگنال» است.','هر نماد با ساختار بازار، جمع‌آوری نقدینگی، شکست BOS/CHoCH و بازآزمایی Order Block یا FVG بررسی می‌شود. در نبود ستاپ کامل، سیگنالی صادر نمی‌شود.')
    html=html.replace('<span>EMA 20/50 Trend</span><span>MACD + RSI Momentum</span><span>Volume Breakout</span><span>Bollinger Reversion</span><span>Engulfing / Pin Bar</span><span>Market Structure</span><span>ATR Stop Loss</span><span>Risk / Reward Filter</span>', '<span>Market Structure · HH/HL & LH/LL</span><span>Liquidity Sweep</span><span>BOS / CHoCH Confirmation</span><span>Order Block Retest</span><span>Fair Value Gap (FVG)</span><span>ATR Structural Stop</span><span>Risk / Reward Filter</span><span>EMA / RSI · فقط اطلاعات کمکی</span>')
    html_path.write_text(html, encoding='utf-8')
print('Patched:', js_path)
print('Updated HTML:', html_path.exists())