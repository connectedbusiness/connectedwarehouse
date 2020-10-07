//  CBAirPrint.m
//  ConnectedWarehouse
//
//  Created by TEAMRAYMOND on 4/4/2014.

#import "CBAirPrint.h"

@interface CBAirPrint (Private)
-(void) doPrint;
-(void) callbackWithFuntion:(NSString *)function withData:(NSString *)value;
-(BOOL) isPrintServiceAvailable;
-(void) labelPrinting:(NSArray*) ipAddresses : (UIPrintInteractionCompletionHandler) completionHandler : (UIPrintInteractionController*) printController;
-(void) defaultPrinting: (NSArray*) ipAddresses : (UIPrintInteractionCompletionHandler) completionHandler : (UIPrintInteractionController*) printController;
@end

@implementation CBAirPrint

@synthesize successCallback, failCallback, ipAddress, dialogTopPos, dialogLeftPos;

- (void) print:(CDVInvokedUrlCommand*) command{
    
    if([command.arguments count] < 1){
        return;
    }
    
    CDVPluginResult* pluginResult = nil;
    
    if (![self isPrintServiceAvailable]){
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsBool:false];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        return;
    }
    
    UIPrintInteractionController *printController = [UIPrintInteractionController sharedPrintController];

    UIPrintInteractionCompletionHandler completionHandler = ^(UIPrintInteractionController *controller, BOOL completed, NSError *error) {
        if(!completed && error){
            NSLog(@"FAILED! due to error in domain %@ with error code %u", error.domain, error.code);
            [self pluginResponse:pluginResult pluginFailed:true callbackId:command.callbackId];
        }else {
            NSLog(@"Selected Printer ID : %@",printController.printInfo.printerID);
            [self pluginResponse:pluginResult pluginFailed:false callbackId:command.callbackId];
        }
    };
    
    NSArray *ipAddresses = [[command.arguments objectAtIndex:0] componentsSeparatedByString:@","];
    NSString *printingMode = [command.arguments objectAtIndex:1];
    
    if(printingMode && [printingMode isEqualToString:@"label"]){
        [self labelPrinting:ipAddresses :completionHandler :printController];
       return;
    }
    
   [self defaultPrinting:ipAddresses[0] :completionHandler :printController];
    
}

- (void) labelPrinting:(NSArray*) ipAddresses : (UIPrintInteractionCompletionHandler) completionHandler : (UIPrintInteractionController*) printController{
    
    int counter = [ipAddresses count];
    
    NSMutableArray *arrImages = [[NSMutableArray alloc] initWithCapacity:counter];
    
    counter-=1;
    for (int i=0;i<=counter; i++) {
        
        @autoreleasepool {
            NSData *data = [NSData dataWithContentsOfURL:[NSURL URLWithString:ipAddresses[i]]];
            if([UIPrintInteractionController canPrintData:data]){
                [arrImages addObject:[UIImage imageWithData:data]];
            }
        }
        
    }
    
    UIPrintInfo *printInfo = [UIPrintInfo printInfo];
    
    printInfo.outputType = UIPrintInfoOutputPhoto;
    printInfo.orientation = UIPrintInfoOrientationPortrait;
    printInfo.duplex = UIPrintInfoDuplexLongEdge;
    
    printController.printInfo = printInfo;
    printController.showsPageRange = YES;
    printController.printingItems = arrImages;
    
    if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad && dialogTopPos != 0 && dialogLeftPos != 0) {
        [printController presentFromRect:CGRectMake(self.dialogLeftPos, self.dialogTopPos, 0, 0) inView:self.webView animated:YES completionHandler:completionHandler];  // iPad
        return;
    }
    
    [printController presentAnimated:YES completionHandler:completionHandler];  // iPhone
}

- (void) defaultPrinting:(NSString*) url : (UIPrintInteractionCompletionHandler) completionHandler : (UIPrintInteractionController*) printController{
    
    UIMarkupTextPrintFormatter *htmlFormatter = [[UIMarkupTextPrintFormatter alloc]
                                                 initWithMarkupText: [NSString stringWithFormat:@"<html><body><img src='%@'></body></html>", url]];
    htmlFormatter.startPage = 0;
    
    UIPrintInfo *printInfo = [UIPrintInfo printInfo];
    
    printInfo.outputType = UIPrintInfoOutputPhoto;
    printInfo.orientation = UIPrintInfoOrientationPortrait;
    printInfo.duplex = UIPrintInfoDuplexLongEdge;
    
    printController.printInfo = printInfo;
    printController.printFormatter = htmlFormatter;
    printController.showsPageRange = YES;
    
    if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad && dialogTopPos != 0 && dialogLeftPos != 0) {
        [printController presentFromRect:CGRectMake(self.dialogLeftPos, self.dialogTopPos, 0, 0) inView:self.webView animated:YES completionHandler:completionHandler];  // iPad
        return;
    }
    
    [printController presentAnimated:YES completionHandler:completionHandler];  // iPhone
  
}

-(UIWebView*) GenerateWebView
{
    UIWebView *webPrint = [[UIWebView alloc] init];
    
    NSURL *url = [NSURL URLWithString:ipAddress];
    NSURLRequest *req = [NSURLRequest requestWithURL:url];
    
    [webPrint loadRequest:req];
    
    return webPrint;
}

-(BOOL) isPrintServiceAvailable{
    
    Class myClass = NSClassFromString(@"UIPrintInteractionController");
    if (myClass) {
        UIPrintInteractionController *controller = [UIPrintInteractionController sharedPrintController];
        return (controller != nil) && [UIPrintInteractionController isPrintingAvailable];
    }
    
    return NO;
}

-(void) pluginResponse:(CDVPluginResult*) result pluginFailed:(BOOL) isError callbackId:(NSString*) callbackId{
    
    if(!isError){
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"PRINT SUCCESS"];
    }else{
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"FAILED"];
    }
    
    [self.commandDelegate sendPluginResult:result callbackId:callbackId];
}

@end
