package com.rezoxnemesis.reuz;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.webkit.WebViewAssetLoader;

/**
 * Hosts the Reuz interface. The page is bundled inside the app and served from a local address,
 * so the clock, alarms and timers all work without any connection.
 */
public class MainActivity extends Activity implements ProStore.Listener {
    private static final String PAGE = "https://appassets.androidplatform.net/assets/index.html";
    private static final String PRIVACY_HOST = "reuz.prakasharuntandon634.workers.dev";
    private static final int BACKGROUND = Color.rgb(11, 13, 18);
    private WebView web;
    private ProStore store;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        store = new ProStore(this, this);
        ReuzBridge.ensureChannel(this);

        web = new WebView(this);
        web.setBackgroundColor(BACKGROUND);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        web.addJavascriptInterface(new ReuzBridge(this, store), "ReuzNative");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("appassets.androidplatform.net".equals(uri.getHost())) return false;
                if (PRIVACY_HOST.equals(uri.getHost()) || "https".equals(uri.getScheme())) {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                }
                return true;
            }
        });

        // From Android 15 the app draws edge to edge, so keep the page clear of the system bars.
        FrameLayout frame = new FrameLayout(this);
        frame.setBackgroundColor(BACKGROUND);
        frame.addView(web, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        frame.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override
            public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                int l, t, r, b;
                if (Build.VERSION.SDK_INT >= 30) {
                    android.graphics.Insets bars = insets.getInsets(
                            WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                    l = bars.left; t = bars.top; r = bars.right; b = bars.bottom;
                } else {
                    l = insets.getSystemWindowInsetLeft(); t = insets.getSystemWindowInsetTop();
                    r = insets.getSystemWindowInsetRight(); b = insets.getSystemWindowInsetBottom();
                }
                v.setPadding(l, t, r, b);
                return Build.VERSION.SDK_INT >= 30 ? WindowInsets.CONSUMED : insets.consumeSystemWindowInsets();
            }
        });
        setContentView(frame);
        web.loadUrl(PAGE);
        store.connect();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (store != null) store.refresh(false);
        ReuzWidget.updateAll(this);
    }

    @Override
    public void onPro(final boolean on) {
        run("window.reuzPro && window.reuzPro(" + on + ")");
    }

    @Override
    public void onMessage(String message) {
        run("window.reuzBilling && window.reuzBilling(" + org.json.JSONObject.quote(message) + ")");
    }

    private void run(final String js) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (web != null) web.evaluateJavascript(js, null);
            }
        });
    }

    @Override
    protected void onDestroy() {
        if (store != null) store.destroy();
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
