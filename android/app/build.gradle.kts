plugins {
    id("com.android.application")
}

android {
    namespace = "com.rezoxnemesis.reuz"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.rezoxnemesis.reuz"
        minSdk = 26
        targetSdk = 36
        versionCode = 10 + (System.getenv("GITHUB_RUN_NUMBER")?.toIntOrNull() ?: 0)
        versionName = "1.1.0"
    }

    // CI supplies a fixed key (from repository secrets) so newer APKs install over older ones.
    // Without it, Gradle falls back to the default debug key, which is fine for local builds.
    val keystorePath = System.getenv("REUZ_KEYSTORE")
    if (keystorePath != null && file(keystorePath).exists()) {
        signingConfigs {
            create("reuz") {
                storeFile = file(keystorePath)
                storePassword = System.getenv("REUZ_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("REUZ_KEY_ALIAS") ?: "reuz"
                keyPassword = System.getenv("REUZ_KEYSTORE_PASSWORD")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildTypes {
        debug {
            signingConfigs.findByName("reuz")?.let { signingConfig = it }
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.findByName("reuz") ?: signingConfigs.getByName("debug")
        }
    }

    lint {
        abortOnError = false
    }
}

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("com.android.billingclient:billing:7.1.1")
}
