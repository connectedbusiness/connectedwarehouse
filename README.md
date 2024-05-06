
Dependencies Information:

MAC Version: macOS Catalina (Version: 10.15.7)

XCode Version: 12.0.1

Cordova Version: 9.0.0


# connectedwarehouse
Connected Warehouse is an iOS application that manages inventories for Connected Business.

Note: Make sure to create a provisioning profile to be use when compiling your app using xcode and uploading you app in the app store.

1. Create App Id first. Go to https://developer.apple.com/account/ios/identifier/bundle

   ex. Name:CW20_1
       Prefix:5GKC59E3V4
       ID:com.connectedbusiness.connectedwarehouse-20-1
 
2. Create new provisioning profile for both Development and Distribution

     Development: ConnectedWarehouse20_1 Development 
     App ID: CW20_1 (com.connectedbusiness.connected-warehouse-20-1)

     Distribution: ConnectedWarehouse20_1 Distribution
     App ID: CW20_1 (com.connectedbusiness.connected-warehouse-20-1)
     

How to build connected warehouse and deploy it to your device.


1. In you MAC install the cordova globally. In terminal run (sudo npm install -g cordova)

2. If INSTALLED and needs to update cordova. In terminal run  (sudo npm update -g cordova)

3. Use command npm install in root folder.

4. Use command corodva platform add ios.

5. Use command cordova build ios.

6. If there is an error when building of app using cordova just open the Xcode and build using Xcode. Open the root folder platforms > iOS > ConnectedWarehouse.xcodeproj

7. Under General setting of ConnectedWarehouse.xcodeproj set the following:

Identity

Display Name: Connected Warehouse
Bundle Identifier: com.connectedbusiness.connectedwarehouse23
Version: 24.0.0
Build  : 24.0.0.1

Signing

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

9 Connect your device in MAC then set the Active Scheme to your device.

10. Product Clean 
11. Product Build 
12. If there is an error regarding ARC semantic Issue (CDVPlugin)

Go to build phases
Expand the compiled resources tap
select “CDVConnection.m”
add the compiler flag ( -fno-objc-arc )

13. Product Clean 
14. Product Build 


15. if you encountered an errorabout 2 duplicate symbols for architecture armv7 remove the CDVLogger in the Build Phrases > Complied Resources

16. Product Clean 
17. Product Build 

18. If there are no errors. Product > Run. The app will be installed to your device.
