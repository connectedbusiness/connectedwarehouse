define([    
    'view/common/global',
    'view/common/shared',
    'view/common/enum',
    'view/common/service',
    'view/common/method',
    'model/cartItem',
    'collection/cart',
], function (Global, Shared, Enum, Service, Method,
    CartItemModel, CartCollection) {
    var Printer = {
        DeleteLabelImages: function (labelNames) {
            //if (labelNames != null && labelNames.length > 0) {
            //    var successPrintouts = new CartCollection();
                
            //    labelNames.forEach(function (labelFileName) {
            //        var newItem = new CartItemModel();
            //        newItem.set({
            //            LabelFileName: labelFileName
            //        })
            //        successPrintouts.add(newItem)
            //    });

            //    var packGroup = new CartItemModel();
            //    packGroup.set({
            //        Packs: successPrintouts
            //    });

            //    packGroup.url = Global.ServiceUrl + Service.SOP + Method.DELETELABELIMAGES;
            //    packGroup.save(null, null);
            //}
        },

        GetLabelFileName: function (pack) {            
            if (pack instanceof Backbone.Model) return pack.get("LabelFileName");
            else return pack.LabelFileName;            
        },       

        InitializeOptions: function (options) {
            if (options == null) options = { success: null, failed: null };
            return options;
        },

        PrintReceiveLabelReport: function (purchaseReceipt, options) {
            options = this.InitializeOptions(options);
            options.printingMode = "receive";
       
            if (purchaseReceipt != null) {
                var fileName = purchaseReceipt.ReceiveLabelImageFile;
                var imageUrl = Shared.GetImageUrl(Enum.ImageType.ReceiveLabel, fileName);

                options.labels = [fileName];
                this.PrintReport(imageUrl, options);
            }
        },
        
        PrintLabel: function (pack, options) {
            options = this.InitializeOptions(options);
            options.printingMode = "label";
       
            if (pack != null) {
                var fileName = this.GetLabelFileName(pack);
                var imageUrl = Shared.GetImageUrl(Enum.ImageType.Label, fileName);
                
                options.labels = [fileName];
                this.PrintReport(imageUrl, options);
            }
            else {
                var progress = options.progress;
                if (progress != null) progress.HideProgress();
            }
        },

        PrintLabels: function (packs, options) {            
            options = this.InitializeOptions(options);
            options.printingMode = "label";
       
            if (packs != null && packs.length > 0) {
                var labelNames = new Array();
                var imageUrls = new Array();
                var counter = 0;
                var self = this;

                packs.forEach(function (pack) {
                    if (pack != null) {
                        var fileName = self.GetLabelFileName(pack);

                        labelNames[counter] = fileName;
                        imageUrls[counter] = Shared.GetImageUrl(Enum.ImageType.Label, fileName);
                        counter = counter + 1;
                    }
                });

                options.labels = labelNames;
                this.PrintReport(imageUrls.toString(), options);
            }
            else {                
                var progress = options.progress;
                if (progress != null) progress.HideProgress();
            }
        },

        PrintReport: function (imageURLString, options) {
            var printingMode = "default-printing";
       
            var success = null;
            var error = null;
            var labels = null;
       
            var self = this;
            var progress = options.progress;

            if (options != null) {
                success = options.success;
                error = options.error;
                labels = options.labels;
                printingMode = options.printingMode;
            }
       

            options = {
                success: function (result) {
                    if (progress != null) progress.HideProgress();
                    if (success) {
                        self.DeleteLabelImages(labels);
                        success();
                    }
                },
                error: function (result) {
                    if (progress != null) progress.HideProgress();

                    var message = null;

                    if ((typeof result) == "string") {
                        message = result;
                    }
                    else {
                        message = result.message;
                    }
                   // Shared.NotifyErrorWithDuration(message,"1000");
                    navigator.notification.alert(message, null, "Print Error", "OK");
                    if (error) error();
                },
                printingMode : printingMode
            }

            this.ExecutePrintReport(imageURLString, options);
        },

        ExecutePrintReport: function (imageURL, options) {
            try {
                //if (Global.IsBrowserMode) throw "Printing is not supported in desktop mode.";
       
                var printingMode = (typeof options.printingMode == "undefined" || options.printingMode=="") ? "default-printing" : options.printingMode;
                this.LoadAirPrintPlugin();
                window.plugins.printPlugin.print( imageURL, options.success, options.error, printingMode );
            }
            catch (ex) {
                //if (options.success) options.success(ex);
                if (options.error) options.error(ex);
            }
        },

        LoadAirPrintPlugin: function () {
            if (!window.plugins) {
                window.plugins = {};
            }

            if (window.plugins.printPlugin == null) {                
                if (cordova == null) throw "Unable to initialize printer plugin.";
                
                window.plugins.printPlugin = cordova.require(Global.Plugins.AirPrinter);
                                

                if (window.plugins.printPlugin == null) throw "Unable to initialize printer plugin.";
            }            
        },

        RaiseError: function (error) {
            if (options.error) options.error(ex);
        }
    }

    return Printer;
}
);