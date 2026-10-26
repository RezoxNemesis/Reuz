# The page calls these by name through window.ReuzNative.
-keepclassmembers class com.rezoxnemesis.reuz.ReuzBridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
