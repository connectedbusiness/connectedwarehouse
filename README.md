
Dependencies Information:

MAC Version: macOS Catalina (Version: 10.15.7)

XCode Version: 12.0.1

Cordova Version: 9.0.0


# connectedwarehouse
Connected Warehouse is an iOS application that manages inventories for Connected Business.

Note: Make sure to create a provisioning profile to be use when compiling your app using xcode and uploading you app in the app store.

# Create App Id 
First go to https://developer.apple.com/account/ios/identifier/bundle

   ex. Name:CW20_1
       Prefix:5GKC59E3V4
       ID:com.connectedbusiness.connectedwarehouse-20-1
 
# Create new provisioning profile for both Development and Distribution

     Development: ConnectedWarehouse20_1 Development 
     App ID: CW20_1 (com.connectedbusiness.connected-warehouse-20-1)

     Distribution: ConnectedWarehouse20_1 Distribution
     App ID: CW20_1 (com.connectedbusiness.connected-warehouse-20-1)
     

# Enviroment Setup - 
1. Install Node js - https://nodesource.com/blog/installing-nodejs-tutorial-mac-os-x/
2. In you MAC install the cordova globally. In terminal run (sudo npm install -g cordova)
3. If INSTALLED and needs to update cordova. In terminal run (sudo npm update -g cordova)

# Steps to build iOS app with updated code
1. Copy complete source code from git repository connectedwarehouse/app and paste in current repository www folder.
2. If version change required change config.xml version number under www folder and root folder.
3. In terminal run commands
4. Run command - cordova platform remove ios
5. Run command - cordova platform add ios
6. Run command - cordova build ios
7. Copy root folder Images.xcassets and paste in platforms/ios/[app name]
8. Open application in xcode and build app. Use this link for more details - https://blog.codemagic.io/how-to-code-sign-publish-ios-apps/
9. Use https://www.diawi.com/ and upload app and share with users for testing.

# Update plugins -
1. Remove plugin which are listed in plugins root folder using command line. 
2. Cordova plugin remove [Plugin Name]
3. Cordova Plugin add [Plugin Name]
4. Then use steps given in [ Steps to build IOS app with update code]

# Identity

Display Name: Connected Warehouse
Bundle Identifier: com.connectedbusiness.connected-warehouse-20-1
Version: 20.1.7508
Build  : 20.1.7508.1

# Signing

Automatically Manage signing:  uncheck

Signing Debug
Provisioning Profile : Connected Warehouse 20_1 Development

Signing Release
Provisioning Profile : Connected Warehouse 20_1 Distribution

Deployment Info
Deployment Target: 10.0
Devices: iPad
Device Orientation: Portrait (Check)
                    Upside Down (UnCheck)
                    Landscape Left (UnCheck)
		    Landscape Right (Uncheck)
                    Hide status bar (Check)
		    Require Full Screen (Check)

# Build
1. Connect your device in MAC then set the Active Scheme to your device.

2. Product Clean 
3. Product Build 
4. If there is an error regarding ARC semantic Issue (CDVPlugin)

Go to build phases
Expand the compiled resources tap
select “CDVConnection.m”
add the compiler flag ( -fno-objc-arc )

5. Product Clean 
6. Product Build 


7. if you encountered an errorabout 2 duplicate symbols for architecture armv7 remove the CDVLogger in the Build Phrases > Complied Resources

8. Product Clean 
9. Product Build 

10. If there are no errors. Product > Run. The app will be installed to your device.
