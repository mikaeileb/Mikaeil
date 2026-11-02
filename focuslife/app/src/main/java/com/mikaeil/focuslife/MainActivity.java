package com.mikaeil.focuslife;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 4107;
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(android.graphics.Color.rgb(16,20,27));
        getWindow().setNavigationBarColor(android.graphics.Color.rgb(16,20,27));
        webView = new WebView(this);
        webView.setBackgroundColor(android.graphics.Color.rgb(16,20,27));
        WebSettings s=webView.getSettings(); s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true); s.setAllowFileAccess(true); s.setAllowContentAccess(true);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE); s.setSupportZoom(false);
        webView.addJavascriptInterface(new FocusBridge(),"FocusBridge");
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams p) {
                if(fileCallback!=null)fileCallback.onReceiveValue(null); fileCallback=cb;
                try { startActivityForResult(p.createIntent(),FILE_CHOOSER_REQUEST); }
                catch(Exception e){fileCallback=null;Toast.makeText(MainActivity.this,"انتخاب فایل در دسترس نیست",Toast.LENGTH_SHORT).show();return false;}
                return true;
            }
        });
        setContentView(webView);
        if(state==null)webView.loadUrl("file:///android_asset/index.html"); else webView.restoreState(state);
    }
    @Override protected void onActivityResult(int req,int res,Intent data) {
        super.onActivityResult(req,res,data);
        if(req==FILE_CHOOSER_REQUEST&&fileCallback!=null){fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res,data));fileCallback=null;}
    }
    @Override protected void onSaveInstanceState(Bundle out){super.onSaveInstanceState(out);if(webView!=null)webView.saveState(out);}
    @Override public void onBackPressed(){if(webView!=null&&webView.canGoBack())webView.goBack();else super.onBackPressed();}
    private class FocusBridge {
        @JavascriptInterface public void exportBackup(String json) {
            runOnUiThread(()->{OutputStream out=null;try {
                ContentResolver r=getContentResolver();ContentValues v=new ContentValues();
                v.put(MediaStore.Downloads.DISPLAY_NAME,"FocusLife-backup.json");v.put(MediaStore.Downloads.MIME_TYPE,"application/json");
                if(Build.VERSION.SDK_INT>=29)v.put(MediaStore.Downloads.RELATIVE_PATH,Environment.DIRECTORY_DOWNLOADS);
                Uri u=r.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI,v);if(u==null)throw new IllegalStateException();
                out=r.openOutputStream(u);if(out==null)throw new IllegalStateException();out.write(json.getBytes(StandardCharsets.UTF_8));out.flush();
                Toast.makeText(MainActivity.this,"نسخه پشتیبان در پوشه Download ذخیره شد",Toast.LENGTH_LONG).show();
            }catch(Exception e){Toast.makeText(MainActivity.this,"ذخیره نسخه پشتیبان ناموفق بود",Toast.LENGTH_LONG).show();}
            finally{try{if(out!=null)out.close();}catch(Exception ignored){}}
            });
        }
    }
}
