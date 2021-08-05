# connectedwarehouse
Connected Warehouse is a Cordova iOS application that manages inventories for Connected Business.

In order to perform development, you need to follow the instructions below.

Join the Apple Developer Program if you are not already a member
- https://developer.apple.com/programs/

Create an Apple Developer identifier
- https://developer.apple.com/account/resources/identifiers/list
- Example
       Name:CW20_1
       Prefix:5GKC59E3V4
       ID:com.connectedbusiness.connectedwarehouse-20-1
 
Create an Apple Developer profile for both Development and Distribution
- https://developer.apple.com/account/resources/profiles/list
- Examples
     Development: ConnectedWarehouse20_1 Development 
     App ID: CW20_1 (com.connectedbusiness.connected-warehouse-20-1)

     Distribution: ConnectedWarehouse20_1 Distribution
     App ID: CW20_1 (com.connectedbusiness.connected-warehouse-20-1)

Create the development environment
- If you don't have a MAC that meats the requirements, establish an account at macincloud.com.

Development environment requirements:
- MAC Version: macOS Catalina OR macOS Big Sur
- XCode Version: 12.x
- Cordova Version: 10.0.0
- Github Desktop

For new MAC users
- The command line is found under LaunchPad / Other / Terminal

If you are using your own MAC 
- if you need to install cordova globally: In terminal run (sudo npm install -g cordova)
- If INSTALLED and needs to update cordova. In terminal run  (sudo npm update -g cordova)

To confirm development envrionment versions installed on your system:
	For OS version
		- click on apple icon, select "about this mac"
	For XCode version
		- on the splash screen upon starting the program
		- while the program is running, Xcode menu, about Xcode
	Cordova version
		- from the terminal command line: cordova -v
 
 NOTE: whenever we remove and add platform, the images go to the default and we need to copy/paste images


 Using Github Desktop 
 - Clone the repository to a folder
 
How to build connected warehouse and deploy it to your device.
- in terminal command line, change to root folder of application
- Use command "npm install" in root folder. (node js command), Use command "npn audit fix" to address issues

4. Use command corodva platform add ios.


5. Use command cordova build ios.
should get BUILD SUCCEEDED at the end


6. Open the root folder, platforms > iOS > ConnectedWarehouse.xcodeproj, right mouse click, open (opens XCode)

7. In XCode, Under General setting of ConnectedWarehouse.xcodeproj set the following:

Identity

Display Name: Connected Warehouse
Bundle Identifier: com.connectedbusiness.connected-warehouse-20-1 (change to what you created in apple developer site)
Version: 20.1.7508
Build  : 20.1.7508.1

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

10. Product Clean in xcode
11. Product Build in xcode
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
