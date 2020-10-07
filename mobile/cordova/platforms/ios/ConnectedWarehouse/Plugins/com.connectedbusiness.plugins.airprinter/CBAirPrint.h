//
//  CBAirPrint.h
//  ConnectedSale
//
//  Created by TEAMLERRY on 9/4/13.
//
//

#import <Cordova/CDV.h>

@interface CBAirPrint : CDVPlugin {
    NSString* successCallback;
    NSString* failCallback;
    NSString* ipAddress;
    
    //Options
    NSInteger dialogLeftPos;
    NSInteger dialogTopPos;
}

@property (nonatomic, copy) NSString* successCallback;
@property (nonatomic, copy) NSString* failCallback;
@property (nonatomic, copy) NSString* ipAddress;


//Print Settings
@property NSInteger dialogLeftPos;
@property NSInteger dialogTopPos;

//Print HTML
- (void) print:(CDVInvokedUrlCommand*) command;
@end
