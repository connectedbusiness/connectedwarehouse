/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',	
	'backbone',	
	'model/lookupcriteria',
	'model/cartItem',	
	'model/label',
	'collection/cart',
    'view/base/printer',
    'view/common/enum',
	'view/common/global',
	'view/common/service',
	'view/common/shared',
	'view/common/method',
    'view/common/preference',
    'view/label/pictureItem',
    'view/label/pictureItemFS',
	'text!template/label/label.tpl.html',		
],function($, _, Backbone,
	LookupCriteriaModel, CartItemModel, LabelModel,
	CartCollection,
	Printer, Enum, Global, Service, Shared, Method, Preference,	
    PictureItemView, PictureItemFSView,
    LabelTemplate) {
    
    var isFullScreen = false;

    var LabelView = Backbone.View.extend({
        _template: _.template(LabelTemplate),
		
        events: {
        },	

        buttonBackFS_tap: function (e) {            
            this.$('#fullScreenSection').removeClass('slideInUp').addClass('slideOutDown');
            $('.slideOutDown').css('-webkit-transition', 'all 0.2s ease 0s');
        },

        buttonBackLabel_tap: function (e) {
            Global.PreviousPage = "dashboard";
            window.location.hash = "shipmentlookup";
        },

        buttonMenu_tap: function (e) {
            window.location.hash = "dashboard";
        },

        buttonPrint_tap: function (e) {
            this.PrintLabels();
        },

        buttonPrintFS_tap: function (e) {
            this.PrintLabel();
        },
       
        initialize: function () {            
        },

        AnimatePrint: function (isAnimate) {
            this.ProgressScreen = Shared.ShowProgress(this.ProgressScreen, isAnimate, "itemMainSlider", true);
        },

        GetCurrentPicture: function () {
            var currentLocation = this.GetCurrentLocation();
            var currentIndex = Math.round(currentLocation / Global.ScreenWidth) * -1;
                            
            this.currentPicture = this.boxCollection.models[currentIndex];
        },

        GetCurrentLocation: function () {
            var style = window.getComputedStyle($('#pictureItemList').get(0));
            var matrix = new WebKitCSSMatrix(style.webkitTransform);

            return matrix.m41;
        },
        
        GetItemInViewCollection: function(collection, property, criteria) {            
            criteria = criteria.toLowerCase();

            return collection.find(function (item) {                   
                var propertyValue = item.get('model').get(property);
                if (propertyValue) {
                    propertyValue = propertyValue.toLowerCase();
                    if (propertyValue == criteria) return true;
                }    
            });            
        },
        
        HighLightSelectedPicture: function (itemModel) {
            var pictureID = "#" + itemModel.get("PictureID");
            if (itemModel.get("IsSelected")) {
                itemModel.set({ IsSelected: false });
                $(pictureID).removeClass("highlight");
            }
            else {
                itemModel.set({ IsSelected: true });
                $(pictureID).addClass("highlight");
            }
        },

        InitializeBoxCollection: function () {
            if (this.boxCollection) {
                this.boxCollection.reset();
            }
            else {
                this.boxCollection = new CartCollection();
            }
        },

        InitializeChildViews: function () {
            this.InitializeModel();
            this.WireEvents();
            this.InitializeBoxCollection();
            this.LoadShipmentByTrasactionCode(Global.TransactionCode);
        },

        InitializeModel: function () {
            this.model = new LabelModel();

            this.model.set({                                
                TransactionCode: Global.TransactionCode,                
            });

            this.$el.html(this._template(this.model.toJSON()));
        },

        LoadShipmentByTrasactionCode: function (transactionCode) {
            var lookupModel = new LookupCriteriaModel();
            var isShowFreeStock = Preference.LabelIsShowQtyOnHand;
            var self = this;

            lookupModel.url = Global.ServiceUrl + Service.SOP + Method.GETSHIPMENTLABELFILENAMEBYTRANSACTIONCODE;
            lookupModel.set({
                TransactionCode: transactionCode,
                TransactionType: "order",
				IsShowFreeStock: isShowFreeStock
            });

            lookupModel.save(null, {
                success: function (model, response, options) {
                    if (response) {                        
                        self.PopulateBoxCollection(response.Packs);                        
                    }
                },
                error: function (model, error, options) {
                    navigator.notification.alert(error);
                }
            });
        },

        PopulateBoxCollection: function (packages) {           
            if (packages) {
                var self = this;
                var shippingMethodCode = "";
                _.each(packages, function (current) {                    
                    var boxModel = new CartItemModel();
                    var pictureID = "PICTURE" + self.boxCollection.length + 1;

                    boxModel.set({
                        IsSelected: false,
                        ItemID: self.boxCollection.length + 1,
                        LabelFileName: current.LabelFileName,
                        PictureID: pictureID,                      
                        SourceFileName: Shared.GetImageUrl(Enum.ImageType.Label, current.LabelFileName),
                        TransactionCode: current.TransactionCode,
                        TrackingNumber: current.TrackingNumber,                        
                    });
                    
                    self.boxCollection.add(boxModel);

                    var pictureItemView = new PictureItemView({ model: boxModel });
                    $('#cartListLabel tbody').append(pictureItemView.render());

                    var pictureItemFSView = new PictureItemFSView({ model: boxModel });
                    $('#fullScreenBody #pictureItemList').append(pictureItemFSView.render());

                    Shared.AddRemoveHandler('#' + pictureID, 'tap', function (e) {
                        if (!isFullScreen) self.HighLightSelectedPicture(boxModel);
                        else isFullScreen = false;
                    });
                    Shared.AddRemoveHandler('#imageTitleHeader' + pictureID, 'tap', function (e) {
                        isFullScreen = true;
                        self.currentPicture = boxModel;
                        self.ShowFullScreenSection();
                        self.UpdateFullScreenNavTitle();
                        self.SetCurrentLocation();
                    });                    

                    Shared.LoadPinchiScroll(this.pinchiScroll, '#pictureItemFS' + boxModel.get("PictureID"));

                });

                this.labeliScroll = Shared.LoadiScroll(this.labeliScroll, "Label");

                $('#fullScreenBody').css("width", this.boxCollection.length * Global.ScreenWidth);
                $('#pictureItemList').css("width", this.boxCollection.length * Global.ScreenWidth);
                $('.iscroll-picturefs').css("width", this.boxCollection.length * Global.ScreenWidth);
                this.fsiScroll = Shared.LoadHorizontaliScroll('#fullScreenBody', this.fsiScroll);
                this.fsiScroll.on("scrollEnd", function (e) {
                    self.GetCurrentPicture();
                    self.UpdateFullScreenNavTitle();
                });
                this.pinchiScroll = Shared.LoadPinchiScroll(this.pinchiScroll, '#fullScreenBody');
            }
        },

        PrintLabel: function () {
            this.AnimatePrint(true);
            Printer.PrintLabel(this.currentPicture, { progress: this.ProgressScreen });
        },

        PrintLabels: function () {
            var packages = new CartCollection();

            this.AnimatePrint(true);
            this.boxCollection.each(function (box) {
                if (box.get("IsSelected")) packages.add(box);
            });

            if (packages && packages.length > 0) {
                Printer.PrintLabels(packages, { progress: this.ProgressScreen });
            } else {
                Printer.PrintLabels(this.boxCollection, { progress: this.ProgressScreen });
            }
        },

        SetCurrentLocation: function () {
            var position = this.currentPicture.get("ItemID");

            var location = (((position * 320) - 320) * -1);

            $('#pictureItemList').css("-webkit-transform", "translateX(" + location + "px)");
        },

        ShowFullScreenSection: function () {            
            this.$('#fullScreenSection').addClass('slideInUp').removeClass('slideOutDown');
            $('.slideInUp').css('-webkit-transition', 'all 0.2s ease 0s');
        },

        SwitchDisplay: function (page) {
            if (this.isAnimate) return false;
            if (this.HasCompleted) {
                $('.slider').removeAttr("style");
                this.HasCompleted = false;
            }

            switch (page) {
                case "page1":
                    $('td').removeClass('highlight');
                    Shared.SlideX('.slider', 0);
                    break;
                case "page2":
                    Shared.SlideX('.slider', Global.ScreenWidth * -1);
                    break;
            }
        },

        UpdateFullScreenNavTitle: function () {
            $('#fullScreenNavTitle').text(this.currentPicture.get("TrackingNumber"));
        },

        WireEvents: function () {            
            var self = this;
            Shared.AddRemoveHandler('#buttonBackLabel', 'tap', function (e) { self.buttonBackLabel_tap(e); });
            Shared.AddRemoveHandler('#buttonBackFS', 'tap', function (e) { self.buttonBackFS_tap(e); });
            Shared.AddRemoveHandler('#buttonPrint', 'tap', function (e) { self.buttonPrint_tap(e); });
            Shared.AddRemoveHandler('#buttonPrintFS', 'tap', function (e) { self.buttonPrintFS_tap(e); });
        }

	});
	return LabelView;
});