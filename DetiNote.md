#Steps required to build app
1. Install node js
2. install cordova
3. Create a folder and www under that folder and copy all files from app
4. Modify Id in config file if required.
5. Modify version in config.xml file. 
6. Paste assets folder outside of www folder. 
7. Use command add plugin : cordova plugin add 'plugin name' (plugins in folder).
8. Use command to create platform: cordova platforms add 'platformname' (ios).
9. If any plugin directly given error copy paste in ios platform www under plugin folder.
10. Build app using 'cordova build ios'

To remove platform
1. Use cordova platforms remove ios
2. Use add command to add platform again and build.

To run as web application.
1. Use cordova platform add browser 
2. cordova run browser -- --port=8001 --target=Firefox
3. see this link https://www.raymondcamden.com/2016/03/22/the-cordova-browser-platform


