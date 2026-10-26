package com.rezoxnemesis.reuz;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Reuz Pro through Google Play Billing: two subscriptions and one lifetime purchase.
 * The product ids below must exist in Play Console. Pro status is cached so the app
 * still works offline, and refreshed from Google Play whenever the app starts.
 */
public final class ProStore implements PurchasesUpdatedListener {
    static final String MONTHLY = "reuz_pro_monthly";
    static final String YEARLY = "reuz_pro_yearly";
    static final String LIFETIME = "reuz_pro_lifetime";
    private static final String KEY_PRO = "pro";

    /** Receives changes on the main thread. */
    public interface Listener {
        void onPro(boolean on);
        void onMessage(String message);
    }

    private final Context context;
    private final SharedPreferences prefs;
    private final Listener listener;
    private final BillingClient client;
    private final Map<String, ProductDetails> details = new HashMap<>();
    private volatile String productsJson = "[]";
    private volatile boolean pro;
    private boolean ready;

    public ProStore(Context context, Listener listener) {
        this.context = context.getApplicationContext();
        this.listener = listener;
        this.prefs = ReuzBridge.prefs(this.context);
        this.pro = prefs.getBoolean(KEY_PRO, false);
        this.client = BillingClient.newBuilder(this.context)
                .setListener(this)
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .build();
    }

    public boolean isPro() {
        return pro;
    }

    public String productsJson() {
        return productsJson;
    }

    /** Connects to Google Play, then loads prices and checks what the user owns. */
    public void connect() {
        if (ready || client.getConnectionState() == BillingClient.ConnectionState.CONNECTING) return;
        client.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                ready = result.getResponseCode() == BillingClient.BillingResponseCode.OK;
                if (ready) {
                    loadProducts();
                    refresh(false);
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                ready = false;
            }
        });
    }

    public void destroy() {
        client.endConnection();
    }

    private void loadProducts() {
        details.clear();
        queryProducts(BillingClient.ProductType.SUBS, new String[] { MONTHLY, YEARLY });
        queryProducts(BillingClient.ProductType.INAPP, new String[] { LIFETIME });
    }

    private void queryProducts(String type, String[] ids) {
        List<QueryProductDetailsParams.Product> list = new ArrayList<>();
        for (String id : ids) {
            list.add(QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(type).build());
        }
        client.queryProductDetailsAsync(
                QueryProductDetailsParams.newBuilder().setProductList(list).build(),
                (result, found) -> {
                    if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || found == null) return;
                    for (ProductDetails d : found) details.put(d.getProductId(), d);
                    rebuildJson();
                    listener.onMessage("");
                });
    }

    private void rebuildJson() {
        JSONArray out = new JSONArray();
        String[] order = { YEARLY, MONTHLY, LIFETIME };
        String[] titles = { "Yearly", "Monthly", "Lifetime" };
        String[] notes = { "Best value, billed once a year", "Billed every month", "One payment, yours for good" };
        for (int i = 0; i < order.length; i++) {
            ProductDetails d = details.get(order[i]);
            if (d == null) continue;
            String price = null;
            if (d.getOneTimePurchaseOfferDetails() != null) {
                price = d.getOneTimePurchaseOfferDetails().getFormattedPrice();
            } else if (d.getSubscriptionOfferDetails() != null && !d.getSubscriptionOfferDetails().isEmpty()) {
                List<ProductDetails.PricingPhase> phases =
                        d.getSubscriptionOfferDetails().get(0).getPricingPhases().getPricingPhaseList();
                price = phases.get(phases.size() - 1).getFormattedPrice();
            }
            if (price == null) continue;
            try {
                out.put(new JSONObject().put("sku", order[i]).put("title", titles[i])
                        .put("note", notes[i]).put("price", price));
            } catch (JSONException ignored) {
                // Cannot fail for plain strings.
            }
        }
        productsJson = out.toString();
    }

    /** Asks Google Play what the user owns. When verbose, tells the page the outcome. */
    public void refresh(final boolean verbose) {
        if (!ready) {
            connect();
            if (verbose) listener.onMessage("Couldn't reach Google Play. Try again in a moment.");
            return;
        }
        final boolean[] owned = { false };
        final int[] pending = { 2 };
        final boolean[] failed = { false };
        PurchasesCheck done = () -> {
            if (--pending[0] > 0) return;
            if (failed[0]) {
                if (verbose) listener.onMessage("Couldn't check purchases. Try again.");
                return;
            }
            setPro(owned[0]);
            if (verbose && !owned[0]) listener.onMessage("No Reuz Pro purchase found on this Google account.");
        };
        for (final String type : new String[] { BillingClient.ProductType.SUBS, BillingClient.ProductType.INAPP }) {
            client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(type).build(),
                    (result, purchases) -> {
                        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                            failed[0] = true;
                        } else if (handle(purchases)) {
                            owned[0] = true;
                        }
                        done.step();
                    });
        }
    }

    private interface PurchasesCheck {
        void step();
    }

    /** Acknowledges new purchases and reports whether any of them unlocks Pro. */
    private boolean handle(List<Purchase> purchases) {
        boolean unlocks = false;
        if (purchases == null) return false;
        for (Purchase p : purchases) {
            if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED) continue;
            boolean ours = false;
            for (String id : p.getProducts()) {
                if (MONTHLY.equals(id) || YEARLY.equals(id) || LIFETIME.equals(id)) ours = true;
            }
            if (!ours) continue;
            unlocks = true;
            if (!p.isAcknowledged()) {
                client.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder()
                        .setPurchaseToken(p.getPurchaseToken()).build(), r -> { });
            }
        }
        return unlocks;
    }

    private void setPro(boolean on) {
        boolean changed = on != pro;
        pro = on;
        prefs.edit().putBoolean(KEY_PRO, on).apply();
        if (changed) listener.onPro(on);
    }

    public void buy(Activity activity, String sku) {
        ProductDetails d = details.get(sku);
        if (!ready || d == null) {
            connect();
            listener.onMessage("Prices aren't loaded yet. Check your connection and try again.");
            return;
        }
        BillingFlowParams.ProductDetailsParams.Builder pd =
                BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(d);
        if (d.getSubscriptionOfferDetails() != null && !d.getSubscriptionOfferDetails().isEmpty()) {
            pd.setOfferToken(d.getSubscriptionOfferDetails().get(0).getOfferToken());
        }
        List<BillingFlowParams.ProductDetailsParams> one = new ArrayList<>();
        one.add(pd.build());
        BillingResult r = client.launchBillingFlow(activity,
                BillingFlowParams.newBuilder().setProductDetailsParamsList(one).build());
        if (r.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            listener.onMessage("Google Play couldn't start the purchase.");
        }
    }

    @Override
    public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        int code = result.getResponseCode();
        if (code == BillingClient.BillingResponseCode.OK) {
            if (handle(purchases)) setPro(true);
            else listener.onMessage("Your purchase is pending. Pro turns on when it clears.");
        } else if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            listener.onMessage("");
        } else if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            refresh(true);
        } else {
            listener.onMessage("The purchase didn't go through.");
        }
    }
}
