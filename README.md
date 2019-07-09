# connectedwarehouse
Connected Warehouse is an iOS application that manages inventories for Connected Business.


Note: Make sure to create a provisioning profile to be use when compiling your app using xcode and uploading you app in the app store.

1. Create App Id first. Go to https://developer.apple.com/account/ios/identifier/bundle

   ex. Name:CW19
       Prefix:5GKC59E3V4
       ID:com.connectedbusiness.connectedwarehouse19-1
 
2. Create new provisioning profile for both Development and Distribution

     Development: ConnectedWarehouse19 Development 
     App ID: CW19 (com.connectedbusiness.connected-warehouse-19-1)

     Distribution: ConnectedWarehouse19 Distribution
     App ID: CW19 (com.connectedbusiness.connected-warehouse-19-1)
     

How to build connected warehouse and deploy it to your device.


1. In you MAC install the cordova globally. In terminal run (sudo npm install -g cordova)

2. If INSTALLED and needs to update cordova. In terminal run  (sudo npm update -g cordova)

3. Create new directory (Documents > CW > SourceCode). Then copy the connected warehouse source code in this folder.

4. Create a new directory (Documents > CW > Build > mobile > cordova > www)

5. Copy the content of app folder from the source code (Step 3) then paste it in the  www folder Step 4.

6.  Create new directory Documents > CW > Build > mobile > cordova > plugins then add the following plugins

com.connect…ins.airprinter
cordova-plugin-dialogs
org.apache.cordova.console
org.apache.c…k-information

7. In terminal under Documents > CW > Build > mobile > cordova  add new iOS platform run cordova platform add iOS

8. In terminal under Documents > CW > Build > mobile > cordova run cordova build iOS

9. If there is an error when building of app using cordova just open the Xcode and build using Xcode. Open the Documents > CW > Build > mobile > cordova > platforms > iOS > ConnectedWarehouse.xcodeproj

10. Under General setting of ConnectedWarehouse.xcodeproj set the following:

Identity

Display Name: Connected Warehouse
Bundle Identifier: com.connectedbusiness.connected-warehouse-19-1
Version: 19.1.7032
Build  : 19.1.7032.1

Signing

Automatically Manage signing:  uncheck

Signing Debug
Provisioning Profile : Connected Warehouse 19 Development

Signing Release
Provisioning Profile : Connected Warehouse 19 Distribution

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
