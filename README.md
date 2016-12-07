Native Android App with Embedded Webview and AEM 6.2
===========

A native Android example running a Cordova (ie. PhoneGap) WebView home page connected to AEM6.

This example demonstrates how a Cordova WebView can be added to an existing Android application that uses fragments.  Once the Cordova WebView
has been added and configured it will then be possible to supply any web content to this view for displaying within your Android app.  Furthermore,
it is also possible to include Cordova plugins with your Android app that the web content can take advantage of in order to access device features.

In this example AEM App web content is added to the Android app assets folder and delivered to the Cordova WebView.  The web content from AEM takes
advantage of the Cordova plugins for accessing the device filesystem, unzipping packages and geolocation.

The Phonegap [documentation](http://docs.phonegap.com/develop/1-embed-webview/android/) does provide some details on how to embed a Cordova-enabled WebView component as an Android activity.

This example however, embeds the Cordova WebView as an Android fragment instead in order to support the Android View Pager.

## Minimum requirements for development

1. Maven (tested: Apache Maven `3.2.2`)
2. Gradle (tested: `2.1`)
2. Git (tested: git version `2.3.2`)
3. Android SDK (tested: `API 23`)
4. Android Studio (tested: `2.1`)
4. Cordova (tested: `5.3.3`)
5. [node.js](http://nodejs.org/) version `>=0.12.x`
6. AEM 6.2

##Getting Started

This example contains two projects that need to be built and deployed.  First there is the *Android app* itself.  The app
consists of one activity that uses a FragmentPager for moving between views.  The Home Page view fragment injects a CordovaWebView and
the remaining views are native Android.  Second, there is an *AEM compatible package* that contains all the required content and components for rendering the web content that will be displayed by the app.  Installing this package will allow you to manage all your web content within AEM and have it delivered to your Android app via content sync.

Android
----

###Setup

Before being able to build this example Android app ensure your development environment is set up correctly.

1. Android SDK (http://developer.android.com/sdk/index.html)
1. ANDROID_HOME environment variable
2. Android Studio 2.0+

####References

- <http://docs.phonegap.com/develop/1-embed-webview/android/>
- <http://blog.grafixartist.com/onboarding-android-viewpager-google-way>
- <https://github.com/roughike/BottomBar>

###Build

* Use Android Studio

or

* Command Line
  * <http://developer.android.com/tools/building/building-cmdline.html>
  * Build Debug Android APK
        ./gradlew assembleDebug
  * Deploy and Run
        ./gradlew installDebug

Experience Manager (AEM Mobile 6.2)
----

* First a package that contains the content to be managed by AEM needs to be installed.

        cd content
        mvn -PautoInstallPackage clean install

* Then download the content sync ZIP of the content from AEM Mobile.

        http://localhost:4502/content/mobileapps/geometrixx-webview/shell.cli-dev.zip

* Unzip to your local file system

* Go to the Android platform of the phonegap project you just built

        cd platforms/android

* Copy the following files/directories to platforms/android
    * www (web content)
    * res/xml (cordova config)

Build Scripts
----

Several build scripts have been created to make it easier to synchronize the native android project with updated content from AEM.

* Install required modules

        npm install
        
* Download content package from AEM

        npm run fetch
        
* Merge ZIP contents with your Android project
        
        npm run merge        

* Download and merge at the same time

        npm run full


OTA Updates
----

In order to support OTA updates the content package needs to be replicated to a publish server.

* Change the server address used by the app
* Re-build package
* Replicate package
* Download content sync ZIP from publish server
        <http://localhost:4503/content/mobileapps/geometrixx-webview/shell.cli-dev.zip>

Manually Updating Cordova
----

    cordova create cordova
    cd cordova
    cordova platform add android

Add plugins

    cordova plugin add cordova-plugin-file@^4.3.0
    cordova plugin add cordova-plugin-file-transfer@^1.6.0
    cordova plugin add phonegap-plugin-contentsync@^1.2.4
    cordova plugin add adobe-mobile-services@4.13.1-cor

Copy everything to `platform/android`

    src
    assets/www/plugins
    assets/www/cordova.js
    libs
    res/xml/config.xml
    cordova
    CordovaLib


##Tutorials

The following tutorials provide more details on how components of this example were created.

1. *Pre-Cordova 4.0* [Embedding a Cordova WebView in an Android Fragment](https://github.com/Adobe-Marketing-Cloud/app-sample-android-phonegap/wiki/Embed-Webview-in-Android-Fragment)
2. *Coming Soon!* [Embedding a Cordova WebView in an Android Fragment with Cordova 4.0+]
