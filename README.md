Native Android App with Embedded Webview and AEM 6.0
===========

A native Android example running a Cordova (ie. PhoneGap) WebView home page connected to AEM6.

This example demonstrates how a Cordova WebView can be added to an existing Android application that uses fragments.  Once the Cordova WebView
has been added and configured it will then be possible to supply any web content to this view for displaying within your Android app.  Furthermore,
it is also possible to include Cordova plugins with your Android app that the web content can take advantage of in order to access device features.

In this example AEM App web content is added to the Android app assets folder and delivered to the Cordova WebView.  The web content from AEM takes
advantage of the Cordova plugins for accessing the device filesystem, unzipping packages and geolocation.

The Phonegap [documentation](http://docs.phonegap.com/en/3.4.0/guide_platforms_android_webview.md.html) does provide some details on how to embed a Cordova-enabled WebView component as an Android activity.
This example however, embeds the Cordova WebView as an Android fragment instead.


##Installation

This example contains two projects that need to be built and deployed.  First there is the Android app itself.  The app
consists of one activity that uses a FragmentPager for moving between views.  The Home Page view fragment includes a CordovaWebView and
the remaining views are native Android.  Second, there is an AEM compatible package that contains all the required content and components for
rendering the web content that will be displayed by the app.  Installing this package will allow you to manage all your web content within AEM
and have it delivered to your Android app via content sync.

Android
----

###Setup

Before being able to build this example Android app ensure your development environment is set up correctly.

1. Android SDK (http://developer.android.com/sdk/index.html)
1. Maven 3.2.1+
1. ANDROID_HOME environment variable
1. Install Android artifacts in to local Maven repository
    - When building an Android application with Maven the compile process needs access to the Android API for the specific platform version the project is configured against. The Android SDK ships this as android.jar files in the different platform folders. In order for Maven to access these libraries, they need to be available in the local Maven repository.
    - See: <http://books.sonatype.com/mvnref-book/reference/android-dev-sect-config-build.html#android-dev-sect-repository-install>

####References

- <http://books.sonatype.com/mvnref-book/reference/android-dev.html>
- <https://code.google.com/p/maven-android-plugin/wiki/GettingStarted>
- <https://github.com/mosabua/maven-android-sdk-deployer>

###Build

* Install additional libs to local maven repository

        cd platforms/android/geometrixx-app/libs
        mvn install:install-file -Dfile=cordova-3.4.0.jar -DgroupId=org.apache.cordova -DartifactId=cordova -Dversion=3.4.0 -Dpackaging=jar
        mvn install:install-file -Dfile=adobeMobileLibrary.jar -DgroupId=com.adobe.mobile -DartifactId=mobile-services -Dversion=4.1.1 -Dpackaging=jar

* Build Android APK

        cd platforms/android/geometrixx-app
        mvn clean install

* Deploy and run app

        mvn android:deploy android:run



Experience Manager (AEM 6.0)
----

* First a package that contains the content to be managed by AEM needs to be installed.

        cd content
        mvn package content-package:install

* Then download the PhoneGap compatible content sync ZIP of the content.

        http://localhost:4502/content/phonegap/geometrixx/content/ng-geometrixx-webview/geometrixx-webview-cli.zip

* Unzip to your local file system and run phonegap build

        phonegap build android

* Go to the Android platform of the phonegap project you just built

        cd platforms/android

* Copy the following files/directories to platforms/android/geometrixx-app
    * assets (web content)
    * res/xml (cordova config)
    * libs (additional libs)
    * src/com -> src/main/java/com (cordova plugins)
    * src/org -> src/main/java/org (cordova plugins)

##OTA Updates

In order to support OTA updates the content package needs to be replicated to a publish server.

* Change the server address used by the app
* Re-build package
* Replicate package
* Download content sync ZIP from publish server
        <http://localhost:4503/content/phonegap/geometrixx/content/ng-geometrixx-webview/geometrixx-webview-cli.zip>

##Tutorials

The following tutorials provide more details on how components of this example were created.

1. [Embedding a Cordova WebView in an Android Fragment](https://github.com/Adobe-Marketing-Cloud/app-sample-android-phonegap/wiki/Embed-Webview-in-Android-Fragment)
