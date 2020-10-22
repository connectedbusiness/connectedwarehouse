/**
 * @author Interprise Solutions
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'model/cartItem',
	'model/prepack',
	'collection/cart',
    'view/base/printer',
    'view/common/enum',
	'view/common/global',
	'view/common/service',
	'view/common/shared',
	'view/common/method',
    'view/common/preference',
    'view/lookup/itemLookup/itemLookup',
    'view/label/cartItem',
    'view/label/pictureItemFS',    
	'text!template/label/prepack.tpl.html',
], function ($, _, Backbone,
	CartItemModel, PrePackModel,
	CartCollection,
    Printer,
	Enum, Global, Service, Shared, Method, Preference,
	ItemLookupView, CartItemView, PictureItemFSView,
	PrePackTemplate) {
    
    var PrePackView = Backbone.View.extend({
        _mainTemplate: _.template(PrePackTemplate),

        events: {
            "keypress #textboxSearch": "textboxSearch_keypress",
        },

        buttonBackItemsRemaining_tap: function (e) {
            this.ShowItemsRemainingSection(false);
        },

        buttonBackFS_tap: function (e) {
            this.ShowFullScreenSection(false);
        },
        
        buttonBackShipmentDetail_tap: function (e) {
            this.SwitchDisplay('page1');
        },

        buttonCounter_tap: function (e) {
            this.ShowItemsRemainingSection(true);
        },

        buttonBackPrepack_tap: function (e) {
            window.location.hash = "shipmentlookup";
        },

        buttonPrintFS_tap: function (e) {
            this.PrintLabel();
        },

        buttonSearch_tap: function (e) {
            this.ScanLabel();
        },

        initialize: function () {
            this.$el.html(this._mainTemplate);
            Global.ApplicationType = "PrePack";
        },

        textboxSearch_keypress: function (e) {
            if (e.keyCode === 13) this.ScanLabel();
        },

        Animate: function (isAnimate) {
            this.ProgressScreen = Shared.ShowProgress(this.ProgressScreen, isAnimate, "prepackSection", true);
        },

        DeleteShipmentDetail: function (currentPicture) {
            if (currentPicture) {
                var self = this;
                var prepackModel = new PrePackModel();

                prepackModel.url = Global.ServiceUrl + Service.SOP + Method.DELETESHIPMENTDETAIL;

                prepackModel.set({
                    SourceDocument: currentPicture.get('TransactionCode'),
                    TrackingNumber: currentPicture.get('TrackingNumber'),
                    WarehouseCode: Preference.DefaultLocation
                });

                this.Animate(true, true);

                prepackModel.save(null, {
                    success: function (model, response, options) {
                        if (!model.get("hasError")) {
                            self.RemoveFromCartCollection(currentPicture.get('TrackingNumber'));
                        }
                    },
                    progress: this.ProgressScreen
                });
            }
        },
        
        InitializeCartCollection: function () {
            if (this.cartCollection) {
                this.cartCollection.reset();
            }
            else {
                this.cartCollection = new CartCollection();
            }
        },

        InitializeChildViews: function () {
            this.InitializeModel();
            this.InitializeCartCollection();
            this.LoadShipmentDetails();
            this.InitializeItemLookup();
            this.WireEvents();
            Shared.Focus('#textboxSearch');
        },

        InitializeItemLookup: function () {
            var self = this;
            this.ItemLookupView = new ItemLookupView();
            this.$('#itemLookupContainer').html(this.ItemLookupView.render());
            this.ItemLookupView.InitializeChildViews();
            this.ItemLookupView.on("itemSelected", function (item) {
                $('#itemLookupSection').addClass('slideOutDown').removeClass('slideInUp');
                setTimeout(function () { self.RenderShipmentLabel(item); }, 400);
                self.$("#prepackHeader").show();
            });
        },

        InitializeModel: function () {
            this.model = new PrePackModel();
            this.model.set({ TotalItemsToPrint: 0 });
        },

        InitializeShippingDetail: function (shipment) {
            $('#remItemCode').text(shipment.model.get('ItemCode'));
            $('#remItemName').text(shipment.model.get('ItemName'));
            $('#remUPCCode').text(shipment.model.get('UPCCode'));
            $('#remUnitMeasureCode').text(shipment.model.get('UnitMeasureCode'));
            $('#remTrackingNumber').text(shipment.model.get('TrackingNumber'));
            $('#remSourceDocument').text(shipment.model.get('TransactionCode'));
        },

        LoadShipmentDetails: function () {
            var self = this;
            var prepackModel = new PrePackModel();

            prepackModel.url = Global.ServiceUrl + Service.SOP + Method.LOADSHIPMENTDETAILS;

            prepackModel.set({
                IsUseCbeImage: Preference.UseCbeImage,
                TransactionType: Preference.LabelSourceTransaction,
                WarehouseCode: Preference.DefaultLocation,
                WebsiteCode: Preference.WebSiteCode,
            });

            this.Animate(true, true);

            prepackModel.save(null, {
                success: function (model, response, options) {
                    if (!model.get("hasError")) {
                        if (response != null && response.ShipmentDetails != null && response.ShipmentDetails.length > 0) {
                            self.PopulateCartItem(response.ShipmentDetails);
                            self.RenderShipmentDetails();
                        }
                    }
                },
                progress: this.ProgressScreen
            });
        },
                
        LoadShippingDetail: function (shipment) {
            Shared.HighLightItem(shipment.model.get('TapeItemID'), "Default");
            this.InitializeShippingDetail(shipment);
            this.SwitchDisplay('page2');
        },

        PopulateCartItem: function (shipments) {
            this.cartCollection.reset();
            var self = this;

            _.each(shipments, function (current) {
                var cartItem = new CartItemModel();
                var counter = self.cartCollection.length + 1;

                cartItem.set({
                    CartItemImage: Shared.GetImageUrl(Enum.ImageType.CartItem, current.ItemIconFile),
                    ItemCode: current.ItemCode,
                    ItemDescription: current.ItemDescription,
                    ItemName: current.ItemName,
                    LabelFileName: current.LabelFileName,
                    PictureID: counter,
                    RowNumber: counter,
                    RemainingItemID: "REM" + counter,
                    TransactionCode: current.SourceDocument,
                    TrackingNumber: current.TrackingNumber,
                    TapeItemID: "ITEM" + counter,
                    UnitMeasureCode: current.UnitMeasureCode,
                    UPCCode: current.UPCCode,
                });

                counter += 1;
                self.UpdateCounter(1);
                self.cartCollection.add(cartItem);
            });
        },
                
        PrintLabel: function () {
            this.Animate(true);
            var self = this;

            Printer.PrintLabel(this.currentPicture, {
                success: function () {
                    self.DeleteShipmentDetail(self.currentPicture);
                },
                progress: this.ProgressScreen
            });
        },

        RefreshRowNumber: function () {
            if (this.cartCollection && this.cartCollection.length > 0) {
                var self = this;
                var rowNumber = 0;

                this.cartCollection.each(function (cartItem) {
                    rowNumber = rowNumber + 1;
                    var oldTapeItemID = cartItem.get("TapeItemID");
                    var rowNum = $('#itemRow' + oldTapeItemID);
                    rowNum.text(rowNumber);

                    cartItem.set({
                        ItemID: rowNumber,
                        RowNumber: rowNumber,
                        TapeItemID: "ITEM" + rowNumber
                    });

                    var newTapeItemID = cartItem.get("TapeItemID");
                    rowNum.attr("id", "itemRow" + newTapeItemID);
                    rowNum.parent().attr("id", "rowNumber" + newTapeItemID);
                    rowNum.parent().parent().attr("id", newTapeItemID).removeClass(oldTapeItemID).addClass(newTapeItemID);;
                    $('.' + oldTapeItemID + '-itemcol-1').removeClass(oldTapeItemID + '-itemcol-1').addClass(newTapeItemID + '-itemcol-1');
                    $('.' + oldTapeItemID + '-itemcol-2').removeClass(oldTapeItemID + '-itemcol-2').addClass(newTapeItemID + '-itemcol-2');
                    $('.' + oldTapeItemID + '-itemcol-3').removeClass(oldTapeItemID + '-itemcol-3').addClass(newTapeItemID + '-itemcol-3');
                    $('.' + oldTapeItemID + '-itemcol-4').removeClass(oldTapeItemID + '-itemcol-4').addClass(newTapeItemID + '-itemcol-4');
                    $('#itemUPCCode' + oldTapeItemID).attr("id", 'itemUPCCode' + newTapeItemID);
                    $('#itemBinLocation' + oldTapeItemID).attr("id", 'itemBinLocation' + newTapeItemID);
                    $('#itemQty' + oldTapeItemID).attr("id", 'itemQty' + newTapeItemID);
                    $('#itemUnitMeasureCode' + oldTapeItemID).attr("id", 'itemUnitMeasureCode' + newTapeItemID);
                    $('#buttonItemSetting' + oldTapeItemID).attr("id", 'buttonItemSetting' + newTapeItemID);
                });
            }
        },

        RemoveFromCartCollection: function (trackingNumber) {
            var itemToDelete = this.cartCollection.find(function (cartItem) {
                var trackNo = cartItem.get("TrackingNumber");
                if (trackNo == trackingNumber) return cartItem;
            });

            if (itemToDelete) {
                this.cartCollection.remove(itemToDelete);
                itemToDelete.RaiseItemDeleted();
            }
            
            this.RefreshRowNumber();
            this.UpdateCounter(-1);
            this.ShowFullScreenSection(false);
        },

        RenderShipmentDetails: function () {
            var self = this;
            this.$("#cartListItemsRemaining tbody").html("");

            if (this.cartCollection && this.cartCollection.length > 0) {
                this.cartCollection.each(function (shipment) {
                    var shipmentView = new CartItemView({ model: shipment });
                    this.$("#cartListItemsRemaining tbody").append(shipmentView.render());
                    Shared.AddRemoveHandler('#' + shipmentView.model.get('TapeItemID'), 'tap', function () {
                        self.LoadShippingDetail(shipmentView)
                        $("#itemsRemainingSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
                    });
                });
            }
        },

        RenderShipmentLabel: function (shipmentLabel) {
            if (shipmentLabel) {
                var self = this;
                var boxModel = new CartItemModel();
                this.currentPicture = null;
                this.$('#fullScreenBody #pictureItemList').html('');

                boxModel.set({
                    LabelFileName: shipmentLabel.get('LabelFileName'),
                    PictureID: shipmentLabel.get('PictureID'),
                    SourceFileName: Shared.GetImageUrl(Enum.ImageType.Label, shipmentLabel.get('LabelFileName')),
                    TransactionCode: shipmentLabel.get('TransactionCode'),
                    TrackingNumber: shipmentLabel.get('TrackingNumber'),
                });

                this.currentPicture = boxModel;

                var pictureItemFSView = new PictureItemFSView({ model: boxModel });
                var width = Global.ScreenWidth + 'px';
                this.$('#fullScreenBody #pictureItemList').append(pictureItemFSView.render());
                this.$('#fullScreenBody').css({ 'overflow': 'hidden', 'width': width });
                this.$('#fullScreenNavTitle').text(pictureItemFSView.model.get('TrackingNumber'));
                this.$('#pictureItemList').css('margin-bottom', '0px');

                Shared.LoadPinchiScroll(this.pinchiScroll, '#fullScreenBody');
                this.ShowFullScreenSection(true);
            }
            else {
                Shared.NotifyError("Item not found.");
                Shared.BeepError();
            }
        },

        ScanLabel: function () {
            var criteria = $("#textboxSearch").val();
            this.$("#textboxSearch").val("");
            
            var shipments = Shared.FindItems(this.cartCollection, criteria);

            if (shipments) {
                this.$("#textboxSearch").blur();
                if (shipments.length > 1) this.ShowItemLookup(shipments);
                else this.RenderShipmentLabel(shipments.models[0]);
            }            
        },

        ShowItemLookup: function (items) {
            if (items) {
                this.ItemLookupView.RenderItems(items);
                this.$('#prepackHeader').hide();
                $('#itemLookupSection').addClass('slideInUp').removeClass('slideOutDown');
            }
        },

        ShowItemsRemainingSection: function (isShow) {
            if (isShow) {
                this.$("#prepackHeader").hide();
                $("#itemsRemainingSlider").removeClass("container-remaining slideOutDown").addClass("container-remaining slideInUp");
                this.itemRemainingiScroll = Shared.LoadiScroll(this.itemRemainingiScroll, 'ItemsRemaining');
            }
            else {
                this.$("#prepackHeader").show();
                $('#itemsRemainingSlider').removeAttr("style");
                $("#itemsRemainingSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
            }
        },

        ShowFullScreenSection: function (isShow) {
            if (isShow) {
                this.$('#fullScreenSection').addClass('slideInUp').removeClass('slideOutDown');
                this.$("#prepackHeader").hide();
            }
            else {
                this.$('#fullScreenSection').removeClass('slideInUp').addClass('slideOutDown');
                this.$("#prepackHeader").show();
            } 
            $('.slideInUp').css('-webkit-transition', 'all 0.2s ease 0s');
        },

        SwitchDisplay: function (page) {
            $('.slideInUp').css('-webkit-transition', 'all 0.3s ease-in-out 0.1s');
            switch (page) {
                case "page1":
                    Shared.SlideX('#itemsRemainingSlider', 0);
                    $('td').removeClass('highlight');
                    break;
                case "page2":
                    Shared.SlideX('#itemsRemainingSlider', Global.ScreenWidth * -1);
                    break;
            }
        },

        UpdateCounter: function (qty) {
            var totalItemsToPrint = this.model.get('TotalItemsToPrint');

            totalItemsToPrint += qty;

            this.model.set({ TotalItemsToPrint: totalItemsToPrint })
            this.$('#textCounter').text(totalItemsToPrint);
            this.$('#textTotalItemsRemaining').text(totalItemsToPrint);
        },
                                
        WireEvents: function () {
            var self = this;
            
            Shared.AddRemoveHandler('#buttonBackFS', 'tap', function (e) { self.buttonBackFS_tap(e); });
            Shared.AddRemoveHandler('#buttonBackItemsRemaining', 'tap', function (e) { self.buttonBackItemsRemaining_tap(e); })
            Shared.AddRemoveHandler('#buttonBackShipmentDetail', 'tap', function (e) { self.buttonBackShipmentDetail_tap(e); })
            Shared.AddRemoveHandler('#buttonCounter', 'tap', function (e) { self.buttonCounter_tap(e); });
            Shared.AddRemoveHandler('#buttonBackPrepack', 'tap', function (e) { self.buttonBackPrepack_tap(e); });
            Shared.AddRemoveHandler('#buttonPrintFS', 'tap', function (e) { self.buttonPrintFS_tap(e); });
            Shared.AddRemoveHandler('#buttonSearch', 'tap', function (e) { self.buttonSearch_tap(e); });
        },
    });
    return PrePackView;
});