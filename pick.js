/**
 * @author Interprise Solutions
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'model/lookupcriteria',
	'model/cartItem',
    'model/checkListGroup',
    'model/checkListItem',
    'model/binManager',
    'model/boxItem',
	'model/pick',
    'model/pack',
	'collection/cart',
    'view/base/printer',
	'view/common/global',
	'view/common/service',
	'view/common/shared',
    'view/common/preference',
	'view/common/method',
    'view/common/enum',
    'view/base/numericpad',
    'view/binManager/binManager',
    'view/lookup/itemLookup/itemLookup',
    'view/lookup/lookup',
	'view/pick/card',
    'view/pick/cardList',
    'view/pick/cartItem',
    'view/pick/cartSkippedItem',
    'view/pick/checkListGroup',
    'view/pick/checkListItem',
    'view/pick/itemSetting',
	'text!template/pick/pick.tpl.html',
    'jqueryhammer'
], function ($, _, Backbone,
	LookupCriteriaModel, BinManagerModel, CartItemModel, CheckListGroupModel, CheckListItemModel, BoxItemModel, PickModel, PackModel,
	CartCollection,
    Printer,
	Global, Service, Shared, Preference, Method, Enum,
    NumericPadView, BinManagerView, ItemLookupView, LookupView, CardView, CardListView, CartItemView, CartSkippedItemView, CheckListGroupView, CheckListItemView, ItemSettingView,
	PickTemplate
	) {

    var isFromRemainingItemSection = false;
    var isOnItemSettingSection = false;
    var isSkipped = false;
    var isUpdate = false;
    var listWidth = Global.ScreenWidth;
    var isRotateCard = true;
    var serialQuantity = 0;
    var serialRequired = 0;
    var SerialNumberTransactionValidationType = 0;

    var PickView = Backbone.View.extend({
        _pickTemplate: _.template(PickTemplate),

        events: {
            "webkitAnimationEnd .pick-item-back": "pickBody_webkitAnimationEnd",
            "webkitTransitionEnd #containerBinManager": "containerBinManager_webkitTransitionEnd",
            "webkitTransitionEnd #itemLookupSection": "itemLookupSection_webkitTransitionEnd",
            "webkitTransitionEnd #skippedItemList": "skippedItemList_webkitTransitionEnd",
            "webkitTransitionEnd .numericpad": "numericpad_webkitTransitionEnd",
            "keypress #textScanItem": "textScanItem_keypress",
            "keypress #textScanSerial": "textScanSerial_keypress",
            "keyup #textAreaAddress": "textAreaAddress_keyup",
            "keyup #textCity": "textCity_keyup",
            "keyup #textCounty": "textCounty_keyup",
            "keyup #textCountry": "textCountry_keyup",
            "keyup #textManualTrackingNumber": "textManualTrackingNumber_keyup",
            "keyup #textPostal": "textPostal_keyup",
            "keyup #textPhone": "textPhone_keyup",
            "keyup #textState": "textState_keyup",
        },

        initialize: function () {
            Global.ApplicationType = "Pick";
        },

        buttonAddress_tap: function (e) {
            this.SwitchPage("page2", "shippingAddress");
        },

        buttonEditDetails_tap: function (e) {
            this.SwitchPage("page2", "boxDetails");
        },

        buttonBackBoxDetails_tap: function (e) {
            this.SwitchPage("page1", null);
            if (this.CurrentItem.get('CarrierDescription') == "Manual") this.UpdateManualBoxInfo();
        },

        buttonBackShippingAddress_tap: function (e) {
            Global.IsPrePackMode = true;

            this.UpdateShippingAddress();
            if (this.ValidateShippingAddress(this.CurrentItem)) {
                this.$('#textAddress').text("with shipping address");
                this.$('#buttonAddress').removeClass("btn-danger").addClass("btn-inverse2");
            }
            else {
                this.$('#textAddress').text("incomplete shipping address");
                this.$('#buttonAddress').addClass("btn-danger").removeClass("btn-inverse2");
            }
            this.SwitchPage("page1", null);
        },

        buttonMore_tap: function (e) {
            var self = this;
            this.$('#containerCompletedAnimation').removeClass('section-show').removeClass("bounceInDown").addClass("bounceOutUp");
            setTimeout(function () { self.GoToLookup(); }, 300);
            listWidth = Global.ScreenWidth;
            isRotateCard = true;
        },

        buttonBackPick_tap: function (e) {
            if (this.ValidateCancelPick()) this.GoToLookup();
            listWidth = Global.ScreenWidth;
            isRotateCard = true;
        },

        buttonScanItem_tap: function (e) {
            this.ScanItem();
        },

        buttonMenu_tap: function (e) {
            window.location.hash = "dashboard";
        },

        buttonPackOrder_tap: function (e) {
            if (Preference.PickSourceTransaction == "order") {
                if (Preference.PickIsAutoComplete) {
                    if (Preference.PackSourceTransaction == "invoice") window.location.hash = "pack";
                    else Shared.NotifyError("The action is not allowed since packing config does not support invoice.");
                }
                else {
                    if (Preference.PackSourceTransaction == "order") window.location.hash = "pack";
                    else Shared.NotifyError("The action is not allowed since packing config does not support order.");
                }
            }
            else {
                if (Preference.PackSourceTransaction == "invoice") window.location.hash = "pack";
                else Shared.NotifyError("The action is not allowed since packing config does not support invoice.");
            }
        },

        buttonCounter_tap: function (e) {
            this.ShowRemainingItems(true);
        },

        buttonBackCheckList_tap: function (e) {
            this.SwitchPage('page2');
        },

        buttonBackItemsRemaining_tap: function (e) {
            this.ShowRemainingItems(false);
        },

        buttonBackItemRemSetting_tap: function (e) {
            $('td').removeClass('highlight');
            this.ShowRemainingItems(true);
            this.SwitchDisplay('page1');
        },

        buttonBackItemsSerial_tap: function(e) {
            this.ShowSerialSection(false);
        },

        buttonBackSkippedItems_tap: function (e) {
            this.itemsSkipped.remove(this.itemCollection.models[0]);
            this.ShowSkippedItems(false);
        },

        buttonBinManager_tap: function (e) {
            if (Preference.PickIsPromptBinManager) this.ShowBinManager();
        },

       buttonScanSerial_tap: function (e) {
            this.ScanSerial();
        },

        buttonSerialClear_tap: function (e) {
            $('#textScanSerial').val('');
            $('#textScanSerial').focus();
        },

        buttonSkippedItemsSetting_tap: function (e) {
            $('td').removeClass('highlight');
            this.ShowSkippedItems(true);
            this.SwitchDisplay('page1');
        },

        buttonSkippedItemsLookup_tap: function (e) {
            this.ShowSkippedItems(true);
        },

        containerBinManager_webkitTransitionEnd: function (e) {
            isRotateCard = true;
        },

        itemLookupSection_webkitTransitionEnd: function (e) {
            if (this.CurrentItem) {
                if (!Preference.PickIsPromptForQty) { 
                    this.PickNextItem(this.CurrentItem, this.QuantityToScan);
                    this.QuantityToScan = 1;
                }
            }
        },

        linkCommercial_tap: function (e) {
            this.UpdateShipToAddressType($('#linkCommercial').text());
            this.$('#buttonAddressType').css('border-color', 'transparent');                        
            $('#containerTableShippingAddressBody').trigger('click');
            $('.dropdown-menu li a').on('click', function (e) {
                $('.dropdown-toggle').dropdown();
                e.stopPropagation();
            });
        },

        linkResidential_tap: function (e) {
            this.UpdateShipToAddressType($('#linkResidential').text());
            this.$('#buttonAddressType').css('border-color', 'transparent'); 
            $('.dropdown-menu li a').on('click', function (e) {
                $('.dropdown-toggle').dropdown();
                e.stopPropagation();
            });
        },

        numericpad_webkitTransitionEnd: function (e) {
            if ($('.numericpad').hasClass('slideInUp')) { }
            else {
                if (this.NumericPadType == "freightrate") return true;
                if (this.CurrentItem) {
                    if (isSkipped) this.RemoveFromSkippedItemList(this.CurrentItem, this.QuantityToScan);
                    else this.PickNextItem(this.CurrentItem, this.QuantityToScan);
                }
            }
        },

        rowCarrierCode_tap: function (e) {
            this.$('#rowCarrierCode').addClass('highlight');
            this.$('#checkListNavTitle').text("carriers");
            this.SwitchPage('page3');
            this.LoadCheckListLookup(Enum.ListMode.Carriers);
        },

        rowPackagingType_tap: function (e) {
            this.$('#rowPackagingType').addClass('highlight');
            this.$('#checkListNavTitle').text("packages");
            this.SwitchPage('page3');
            this.LoadCheckListLookup(Enum.ListMode.Boxes);
        },

        rowServiceType_tap: function (e) {
            if (this.CurrentItem.get('CarrierDescription') != "Manual") {
                this.$('#rowServiceType').addClass('highlight');
                this.$('#checkListNavTitle').text("service types");
                this.SwitchPage('page3');
                this.LoadCheckListLookup(Enum.ListMode.ServiceTypes);
            }
        },

        textCity_keyup: function (e) {
            if (!$('#textCity').val()) {
                $('#textCity').parent().addClass('has-error');
            } else {
                $('#textCity').parent().removeClass('has-error');
            }
        },

        textCounty_keyup: function (e) {
            if (!$('#textCounty').val()) {
                $('#textCounty').parent().addClass('has-error');
            } else {
                $('#textCounty').parent().removeClass('has-error');
            }
        },

        textCountry_keyup: function (e) {
            if (!$('#textCountry').val()) {
                $('#textCountry').parent().addClass('has-error');
            } else {
                $('#textCountry').parent().removeClass('has-error');
            }
        },

        textCountry_tap: function (e) {
            this.ShowShippingDetailsLookup("country");
        },
        
        textFreightRate_tap: function (e) {
            this.$('#textFreightRate').blur();
            this.NumericPadType = "freightrate";
            this.ShowNumericPad();
        },

        textManualTrackingNumber_keyup: function (e) {
            if (!$('#textManualTrackingNumber').val()) {
                $('#textManualTrackingNumber').parent().css('color', '#d2322d');
            } else {
                $('#textManualTrackingNumber').parent().css('color', '#2c3e50');
            }
        },

        textPhone_keyup: function (e) {
            if (!$('#textPhone').val()) {
                $('#textPhone').parent().addClass('has-error');
            } else {
                $('#textPhone').parent().removeClass('has-error');
            }
        },

        textPostal_keyup: function (e) {
            if (!$('#textPostal').val()) {
                $('#textPostal').parent().addClass('has-error');
            } else {
                $('#textPostal').parent().removeClass('has-error');
            }
        },

        textState_keyup: function (e) {
            if (!$('#textState').val()) {
                $('#textState').parent().addClass('has-error');
            } else {
                $('#textState').parent().removeClass('has-error');
            }
        },

        textAreaAddress_keyup: function (e) {
            if (!$('#textAreaAddress').val()) {
                $('#textAreaAddress').parent().addClass('has-error');
            } else {
                $('#textAreaAddress').parent().removeClass('has-error');
            }
        },

        textPostal_tap: function (e) {
            this.ShowShippingDetailsLookup("postal");
        },

        textScanItem_keypress: function (e) {
            if (e.keyCode === 13) {
                this.ScanItem();
            }
        },

        textScanSerial_keypress: function(e) {
            if (e.keyCode === 13) this.ScanSerial();
        },

        skippedItemList_webkitTransitionEnd: function (e) {
            isRotateCard = true;
        },

        pickBody_webkitAnimationEnd: function (e) {
            this.$("#containerCard").show();
            this.$("#containerItemSettings").show();
            this.$("#containerTransition").hide();

            this.RenderItem(this.CurrentItem, false);
        },

        AnimatePick: function (isAnimate, isFullScreen) {
            this.ProgressScreen = Shared.ShowProgress(this.ProgressScreen, isAnimate, "containerPick", isFullScreen);
        },

        ChangeAddressButton: function () {
            var item = this.CurrentItem;
            var isModified = false;

            if (item) {
                if (this.ValidateShippingAddress(item)) isModified = true;
            }

            if (isModified) {
                this.$('#textAddress').text("with shipping address");
                this.$('#buttonAddress').removeClass("btn-danger").addClass("btn-inverse2");
            }
            else {
                this.$('#textAddress').text("incomplete shipping address");
                this.$('#buttonAddress').addClass("btn-danger").removeClass("btn-inverse2");
            }
        },

        ChangeCardSize: function (skippedItemID) {
            if (Global.IsPrePackMode) {
                this.$('#pickItem' + skippedItemID).addClass("pick-item-prepack");
                this.$('#pickItemDetail' + skippedItemID).addClass("pick-item-detail-prepack");
                this.$('#pickItemImage' + skippedItemID).addClass("imageCard-prepack");
                this.$('#itemSettings' + skippedItemID).addClass("pick-item-prepack");

                try {
                    var detailScroll = new IScroll('#itemSettingBody' + skippedItemID, { vScrollbar: false, scrollY: true });
                }
                catch (e) { }
            }
        },

        ChangeItemCounter: function (value) {
            var remainingQuantity = this.CurrentItem.get('Counter');

            if (value > remainingQuantity) value = remainingQuantity;

            this.CurrentItem.set({ Counter: value });
        },
        
        CompletePick: function () {
            if (Global.IsPrePackMode) {
                this.PickCompleted(this.PrepackTransactionCode);
            }
            else {
                var pickModel = new PickModel();
                var transactionCode = Global.TransactionCode;
                var self = this;

                listWidth = Global.ScreenWidth;
                isRotateCard = true;

                pickModel.url = Global.ServiceUrl + Service.SOP + Method.PICKTRANSACTION;

                var picks = new CartCollection();                
                picks.add(this.model);

                pickModel.set({
                    Picks: picks,
                    Items: this.itemsPicked,
                    Serials: this.serialCollection
                });

                this.AnimatePick(true, true);
                pickModel.save(null, {
                    success: function (model, response, options) {
                        if (!model.get("hasError")) {

                            if (response != null && response.TransactionCodes != null && response.TransactionCodes.length > 0) {
                                transactionCode = response.TransactionCodes[0]
                            }
                            self.PickCompleted(transactionCode);
                        }
                    },
                    progress: this.ProgressScreen
                });
            }
        },

        CreateShipment: function (item, qty) {
            if (item) {
                var pickModel = new PickModel();
                var itemsToShip = new CartCollection();
                var self = this;
                this.PrepackTransactionCode = "";

                itemsToShip.add(item);

                pickModel.url = Global.ServiceUrl + Service.SOP + Method.CREATESHIPMENT;
                var isInvoice = (Preference.PickSourceTransaction.toLowerCase() == "invoice");

                pickModel.set({

                    Packs: this.boxCollection,
                    Items: itemsToShip,
                    IsInvoice: isInvoice,
                    IsPrePack: Global.IsPrePackMode
                });




                this.AnimatePick(true, true);
                pickModel.save(null, {
                    success: function (model, response, options) {
                        if (!model.get("hasError")) {
                            if (Preference.PickIsAutoComplete) {
                                if (response.TransactionCodes && response.TransactionCodes.length > 0) self.PrepackTransactionCode = response.TransactionCodes[0];
                            } 
                            self.PrintLabel(response);
                        }
                        else {
                            navigator.notification.alert("You may retry repacking the order either in CB or in CW.", null, "Pack Failed", "OK");
                            var carrierDesc = self.CurrentItem.get('CarrierDescription');
                            if (!carrierDesc) carrierDesc = "";
                            if (carrierDesc == 'Manual') {
                                self.$('#textManualTrackingNumber').val('');
                                self.UpdateManualBoxInfo();
                            }
                        }
                    },
                    progress: this.ProgressScreen
                });
            }
        },


        CheckSerialExist: function(serialLotNumber, currentItem) {
            var itemLookup = new LookupCriteriaModel();
            var item = currentItem;
            var serialLot = serialLotNumber;
            var serialExist = false;
            var self = this;

            self.serialCollection.each(function(serial) {
                if (serial.get("SerialLotNumber") == serialLotNumber) {
                    serialExist = true;
                     Shared.NotifyError("Serial already exists.");
                     Shared.BeepError();
                     Shared.Focus("#textScanSerial");

                    return;
                }
            });
            if (serialExist) return true;

            itemLookup.url = Global.ServiceUrl + Service.PRODUCT + Method.ISSERIALEXIST + "serialLotNumber=" + serialLotNumber;

            this.AnimatePick(true, false);
            itemLookup.fetch({
                success: function (model, response, options) {                  
                    if (!model.get("hasError")) {
                        if (response.Value) {
                            Shared.NotifyError("Serial already exists.");
                            Shared.BeepError();
                            Shared.Focus("#textScanSerial");

                            return true;
                        } else {
                            //add

                            var serial = new BinManagerModel();
                            serial.set({
                                DocumentCode: Global.TransactionCode,
                                SerialLotNumber: serialLotNumber,
                                ItemCode: item.get('ItemCode'),
                                LineNum: item.get('LineNum')
                            })
                            self.serialCollection.add(serial);
                            serialQuantity += 1;
                            $("#serialScanned").text(serialQuantity);

                            if (serialQuantity < serialRequired) {
                                Shared.BeepSuccess();
                                Shared.Focus("#textScanSerial");
                            }
                            else self.ShowSerialSection(false);

                            return false;
                        }
                    }               
                },
                progress: this.ProgressScreen
            });         
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
            this.InitializeCardViews();
            this.InitializeItemCollection();
            this.InitializeItemLookup();
            this.InitializeItemsSkipped();
            this.InitializeNumericPad();
            this.InitializeItemsPicked();   
            this.InitializeSerialCollection();         
            this.LoadPickItems();
            this.ShowHideControls();
        },

        InitializeModel: function () {
            this.model = new PickModel();
            
            this.model.set({
                Counter: 0,
                HasOnlyOneItem: false,
                IsAutoComplete: Preference.PickIsAutoComplete,
                TotalItems: 0,
                TotalItemsSkipped: 0,
                TransactionCode: Global.TransactionCode,
                TransactionType: Preference.PickSourceTransaction                
            });

            if (Global.CurrentTransactions != null && Global.CurrentTransactions.models.length > 0) {
                this.model.set({
                    BillToCode: Global.CurrentTransactions.models[0].get("BillToCode"),
                    ShippingDate: Global.CurrentTransactions.models[0].get("ShippingDate"),
                    ShiptoCode: Global.CurrentTransactions.models[0].get("ShiptoCode")
                });                
            }
            else {
                this.model.set({
                    ShiptoCode: "",
                    BillToCode: ""
                });
            }

            this.$el.html(this._pickTemplate(this.model.toJSON()));
        },

        InitializeBoxDetails: function () {
            if (this.CurrentItem) {
                var carrierDesc = this.CurrentItem.get('CarrierDescription');
                var packagingType = this.CurrentItem.get('PackagingCode');
                var serviceCode = this.CurrentItem.get('ServiceCode'); 
                var shippingMethod = this.CurrentItem.get('ShippingMethodCode');
                var trackingNumber = this.CurrentItem.get("TrackingNumber");
                                
                if (!carrierDesc) carrierDesc = "";
                if (!packagingType) packagingType = "";
                if (!serviceCode) serviceCode = "";
                if (!shippingMethod) shippingMethod = "";
                if (!trackingNumber) trackingNumber = "";

                if (carrierDesc == 'Manual') {
                    this.$('#textCarrier').text('Manual');
                    this.$("#rowFreightRate").show();
                    this.$("#rowTrackingNumberManual").show();                    
                    this.$('#rowServiceType').hide();
                    this.$('#textManualTrackingNumber').val(trackingNumber);
                    this.$('#textFreightRate').val(this.CurrentItem.get("FreightRate"));
                    this.ValidateManualShippingInfo();
                }
                else {
                    this.$('#textCarrier').text(carrierDesc);
                    this.$('#rowServiceType').show();
                    this.$("#rowTrackingNumberManual").hide();
                    this.$("#rowFreightRate").hide();
                }

                this.$('#textShippingMethodCode').text(shippingMethod);
                this.$('#textBoxWeight').text(this.CurrentItem.get('WeightInLbs'));
                this.$('#textDimension').text(this.CurrentItem.get('Dimensions'));
                this.$('#textServiceType').text(serviceCode);
                this.$('#textPackagingType').text(packagingType);
            }
        },

        InitializeItemCollection: function () {
            if (this.itemCollection) this.itemCollection.reset();
            else this.itemCollection = new CartCollection();
        },

        InitializeItemLookup: function () {
            var self = this;
            this.ItemLookupView = new ItemLookupView();
            this.$('#itemLookupContainer').html(this.ItemLookupView.render());
            this.ItemLookupView.InitializeChildViews();
            this.ItemLookupView.on("itemSelected", function (item) { self.PickItemFromItemLookup(item); });
        },

        InitializeItemsSkipped: function () {
            if (this.itemsSkipped) this.itemsSkipped.reset();
            else this.itemsSkipped = new CartCollection();
        },

        InitializeItemsPicked: function () {
            if (this.itemsPicked) {
                this.itemsPicked.reset();
            }
            else {
                this.itemsPicked = new CartCollection();
            }
        },

        InitializeNumericPad: function () {
            var self = this;
            var view = new NumericPadView();
            this.$('#numericPadContainer').html(view.render());

            var headerName = '#pickHeader';
            view.WireNumericPadEvents();
            view.off('closenumericpad', function (e) {

               
                self.$(headerName).show();
                self.ItemLookupView.SlideDownItemLookup();
                if (!self.QuantityToScan) self.QuantityToScan = 1;
                Shared.Focus('#textScanItem');
            });
            view.on('closenumericpad', function (e) {


                //--- Code added by Surinder Kaur--
                //-- In Pick Module, with Prompt for qty turned on, cancelling out of "enter quantity" screen improperly decrements qty remaining to be picked #9----



                self.$(headerName).show();
                self.ItemLookupView.SlideDownItemLookup();
                self.QuantityToScan = 0;
                Shared.Focus('#textScanItem');


               //self.$(headerName).show();
               //self.ItemLookupView.SlideDownItemLookup();
               //if (!self.QuantityToScan) {
               // self.QuantityToScan = 1;
               //}
               //Shared.Focus('#textScanItem');


            });


            view.off('quantitychange', function (numericPadCriteria) {
                if (self.NumericPadType == "freightrate") {
                    self.$('#textFreightRate').val(numericPadCriteria.NumericPadValue);
                }
                else {
                    self.QuantityToScan = numericPadCriteria.NumericPadValue;                    
                    Shared.Focus('#textScanItem');
                }
                self.ItemLookupView.SlideDownItemLookup();
                self.$(headerName).show();
                view.SlideDownNumericPad();
            });
            view.on('quantitychange', function (numericPadCriteria) {
                if (self.NumericPadType == "freightrate") {
                    self.$('#textFreightRate').val(numericPadCriteria.NumericPadValue);
                }
                else {
                    self.QuantityToScan = numericPadCriteria.NumericPadValue;  
                    Shared.Focus('#textScanItem');
                }
                self.ItemLookupView.SlideDownItemLookup();
                self.$(headerName).show();
                view.SlideDownNumericPad();
            });
        },

        InitializeItemSetting: function () {
            this.ShowFreeStockItemSetting();
            this.ShowTransactionCodeItemSetting();
            if (isFromRemainingItemSection) {
                $('#remSettingsItemCode').text(this.CurrentItem.get('ItemCode'));
                $('#remSettingsItemName').text(this.CurrentItem.get('ItemName'));
                //$('#remSettingsItemDesc').text(this.CurrentItem.get('ItemDescription'));
                $('#remSettingsUPCCode').text(Shared.ConvertNullToEmptyString(this.CurrentItem.get('UPCCode')));
                $('#remSettingsQuantity').text(this.CurrentItem.get('QuantityToPick'));
                $('#remSettingsFreeStock').text(this.CurrentItem.get('FreeStock'));
                $('#remSettingsRemUnitMeasureCode').text(this.CurrentItem.get('UnitMeasureCode'));
                $('#remSettingsBinLocation').text(this.CurrentItem.get('BinLocationName'));
                $('#remSettingsTransactionCode').text(this.CurrentItem.get('TransactionCode'));
                var shippingNotes = this.CurrentItem.get('ShippingNotes');
                var itemDescription = this.CurrentItem.get('ItemDescription');
                if(shippingNotes) {
                  $('#rowRemShippingNotes').show();
                   if (shippingNotes.length > 20) {
                       this.$('#rowRemShippingNotes').html("<a>Notes<br><span style='white-space:normal'>" + shippingNotes  + "</span></a>")
                   }
                   else {
                      this.$('#rowRemShippingNotes').html("<a><span class='pull-right'>" + shippingNotes  + "</span>Notes</a>")
                   }
                } 
                else  $('#rowRemShippingNotes').hide();

                if (itemDescription.length > 20) {
                       this.$('#rowRemItemDesc').html("<a>Description<br><span style='white-space:normal'>" + itemDescription  + "</span></a>")
                 }
                 else {
                    this.$('#rowRemItemDesc').html("<a><span class='pull-right'>" + itemDescription  + "</span>Description</a>")
                 }

            }
        },

        InitializeCardViews: function () {
            this.ItemSettingView = new ItemSettingView();
        },


        InitializeSerialCollection: function () {
            SerialNumberTransactionValidationType = Preference.SerialNumberTransactionValidationType;
            if (SerialNumberTransactionValidationType == null || SerialNumberTransactionValidationType <= 1 || SerialNumberTransactionValidationType > 3) {
                SerialNumberTransactionValidationType = 0;
            }

            if (this.serialCollection) this.serialCollection.reset();
            else this.serialCollection = new CartCollection();
        },

        InitializeShippingAddress: function () {
            var item = this.CurrentItem;

            if (item) {
                var addressType = item.get("ShipToAddressType");
                var address = item.get('ShipToAddress');
                var shipPlus4 = item.get('ShipToPlus4');

                if (!address || address == null) address = "";
                if (!shipPlus4 || shipPlus4 == 0) shipPlus4 = "";
                if (addressType == null || addressType == "") addressType = "Residential";

                this.$('#textAddressName').val(item.get('ShipToName'));
                this.$('#textCountry').val(item.get('ShipToCountry'));
                this.$('#textPostal').val(item.get('ShipToPostalCode'));
                this.$('#textPlus4').val(shipPlus4);
                this.$('#textAddressType').text(addressType);
                this.$('#textAreaAddress').val(address);
                this.$('#textCity').val(item.get('ShipToCity'));
                this.$('#textState').val(item.get('ShipToState'));
                this.$('#textCounty').val(item.get('ShipToCounty'));
                this.$('#textPhone').val(item.get('ShipToPhone'));
                this.$('#textExt').val(item.get('ShipToPhoneExtension'));
            }
        },

        IsAutoComplete: function () {
            if (Preference.PickSourceTransaction == "order") {
                if (Preference.PickIsAutoComplete) return "true";
                else return "false";
            } else return "false";
        },

        IsItemSkippedExisting: function () {
            if (this.CurrentItem == null) return false;

            var upcCode = this.CurrentItem.get('UPCCode');
            var itemCode = this.CurrentItem.get('ItemCode');
            var umCode = this.CurrentItem.get('UnitMeasureCode');

            var existingItem = Shared.FindItem(this.itemsSkipped, itemCode, umCode);

            if (!existingItem) return false;
            else return true;
        },

        IsNull: function (currentValue, newValue) {
            if (!currentValue || currentValue == "") {
                currentValue = newValue;
            }
            return currentValue;
        },

        GetCurrentItem: function () {
            var currentPage = this.itemSkippediScroll.currentPage.pageX;

            if (currentPage >= this.itemsSkipped.length) {
                this.CurrentItem = this.itemCollection.models[0];
                isSkipped = false;
            }
            else {
                this.CurrentItem = this.itemsSkipped.models[currentPage];
                this.QuantityToScan = 0;
                isSkipped = true;
            }

            if (Global.IsPrePackMode) this.ChangeAddressButton();
            setTimeout(function () { isRotateCard = true; }, 500);            
        },
        
        GetPicks: function () {
            var picks = new CartCollection();
            //var self = this;

            //var pick = Global.CurrentTransactions.find(function (model) {
            //    var transactionCode = model.get("TransactionCode");
            //    if (transactionCode) {
            //        if (transactionCode == Global.TransactionCode) return true;
            //    }
            //});

            //picks.add(new PickModel({
            //    transactionCode == Global.TransactionCode
            //    TransactionType: Preference.PickSourceTransaction,
            //    IsAutoComplete: Preference.PickIsAutoComplete,
            //}));

            //if (pick) {
            //    pick.set({
            //        TransactionType: Preference.PickSourceTransaction,
            //        IsAutoComplete: Preference.PickIsAutoComplete,
            //        ShippingDate: Global.CurrentTransactions.models[0].get("ShippingDate")

            //    });
            picks.add(this.model);

            return picks;
            //}
        },

        GoToLookup: function (e) {
            window.location.hash = "picklookup";
        },

        GoToSelectedItem: function (itemView) {
            this.itemsSkipped.remove(this.itemCollection.models[0]);

            this.CurrentItem = itemView.model;

            var skippedListItemID = itemView.model.get('SkippedListItemID');

            if (itemView.model.get('Quantity') > 1) skippedListItemID = skippedListItemID + "B";
            var listItem = $('#' + skippedListItemID).parent();
            var skippedItemPosition;

            if (listItem.length > 0) skippedItemPosition = this.$('#skippedItemList > li').index(listItem) * (Global.ScreenWidth * -1);
            else skippedItemPosition = ((this.$('#skippedItemList > li').length - 1) * (Global.ScreenWidth * -1));

            this.itemSkippediScroll.scrollTo(skippedItemPosition, 0, 500);
            this.itemSkippediScroll.refresh();
        },

        HideSkipButton: function (skippedListItemID) {
            $('#buttonSkipItem' + skippedListItemID).hide();
            //$('.boxitem-rownumber-title').css({
            //    "max-width": "270px",
            //    "width": "270px",
            //    "border-top-right-radius": "10px",
            //});
        },

        HighLightListItem: function (itemView) {
            this.$('.listitem-1').addClass('listitem-1').removeClass('listitem-2');
            this.$('.listitem-2').addClass('listitem-1').removeClass('listitem-2');
            Shared.HighLightItem(itemView.cid, "CheckList");
            this.$('#listItem' + itemView.model.get('ViewID')).removeClass('listitem-1').addClass('listitem-2');
        },

        HighLightServiceType: function (itemView) {
            this.$('.listitem-2').addClass('listitem-7').removeClass('listitem-2');
            this.$('.listitem-2').addClass('listitem-7').removeClass('listitem-2');
            Shared.HighLightItem(itemView.cid, "CheckList");
            this.$('#listItem' + itemView.model.get('ViewID')).removeClass('listitem-2').addClass('listitem-7');
        },

        LoadCheckListLookup: function (listMode) {
            var lookupModel = new LookupCriteriaModel();            
            var self = this;

            switch (listMode) {
                case Enum.ListMode.Boxes:
                    var isShowAllBoxes = false;
                    if (!this.CurrentItem.get("CarrierCode") || this.CurrentItem.get("CarrierCode") == "") isShowAllBoxes = true;

                    lookupModel.url = Global.ServiceUrl + Service.SOP + Method.CARRIERPACKAGINGLOOKUP;
                    lookupModel.set({
                        CarrierCode: this.CurrentItem.get("CarrierCode"),
                        ShippingMethodCode: this.CurrentItem.get("ShippingMethodCode"),
                        IsShowAllBoxes: isShowAllBoxes
                    });
                    break;
                case Enum.ListMode.Carriers:
                    lookupModel.url = Global.ServiceUrl + Service.CUSTOMER + Method.CARRIERLOOKUP + "30";
                    break;
                case Enum.ListMode.ServiceTypes:
                    lookupModel.url = Global.ServiceUrl + Service.CUSTOMER + Method.SERVICETYPELOOKUP + "30";
                    if (this.CurrentItem.get("CarrierDescription") == "Manual") lookupModel.set({ CarrierCode: this.CurrentItem.get("DescriptionCarrierCode") });
                    else lookupModel.set({ CarrierCode: this.CurrentItem.get("CarrierCode") });
                    break;
            }
            lookupModel.set({ WarehouseCode: Preference.DefaultLocation });

            this.AnimatePick(true, true);
            lookupModel.save(null, {
                success: function (model, response, options) {
                    if (!model.get("hasError")) {
                        self.RenderChecklist(response, listMode);
                    }
                },
                progress: this.ProgressScreen
            });
        },

        LoadiScrollServiceType: function (myScroll) {
            if (myScroll) {
                myScroll.refresh();
                return myScroll;
            }
            else {
                return new IScroll('#containerServiceTypeCheckList', { scrollY: true, scrollbars: true, });
            }
        },

        LoadItemSetting: function (item) {
            Shared.HighLightItem(item.model.get('TapeItemID'), "Default");
            this.CurrentItem = item.model;
            this.InitializeItemSetting();
            this.SwitchDisplay('page2');
        },

        LoadPickItems: function () {
            isSkipped = false;
            var salesOrderCode = Global.TransactionCode;
            var warehouseCode = Preference.DefaultLocation;
            var isShowFreeStock = Preference.PickIsShowQtyOnHand;

            var pickModel = new PickModel();
            var self = this;

            pickModel.url = Global.ServiceUrl + Service.SOP + Method.LOADPICKITEMS;

            pickModel.set({
                IsShowFreeStock: isShowFreeStock,
                IsPrepackMode: Preference.PrePackIsEnable,
                TransactionCode: salesOrderCode,
                WarehouseCode: warehouseCode,
                TransactionType: Preference.PickSourceTransaction,
                UseCbeImage: Preference.UseCbeImage,
                WebSiteCode: Preference.WebSiteCode,
            });
            this.AnimatePick(true, false);
            pickModel.save(null, {
                success: function (model, response, options) {
                    if (!model.get("hasError")) {                        
                        self.PrepareBin(response.Items);
                    }
                },
                progress: this.ProgressScreen
            });
        },

        PickItemFromItemLookup: function (item) {
            var upcCode = item.get('UPCCode');
            var itemCode = item.get('ItemCode');
            var unitMeasureCode = item.get('UnitMeasureCode');
            var existingItem = Shared.FindItem(this.itemCollection, itemCode, unitMeasureCode);

            if (existingItem) {
                if (this.CurrentItem.get('UPCCode') == upcCode
                    && this.CurrentItem.get('UnitMeasureCode') == unitMeasureCode) {

                    Shared.BeepSuccess();
                    if (Preference.PickIsPromptForQty) this.ShowNumericPad();
                    else {
                        this.CurrentItem = existingItem;
                        this.QuantityToScan = 1;
                        this.ItemLookupView.SlideDownItemLookup();
                    }                    
                }
                else {
                    Shared.NotifyError("Invalid item.");
                    Shared.BeepError();
                    this.ItemLookupView.SlideDownItemLookup();                    
                }
            }
            else {
                Shared.NotifyError("Invalid item.");
                Shared.BeepError();
            }
        },

        PopulateCart: function (items) {
            if (items && items.length > 0) {
                var self = this;
                var totalQty = 0;

                _.each(items, function (current) {
                    var card = new CartItemModel();
                    var binLocation = current.BinLocationName;
                    var counter = self.itemCollection.length + 1;

                    if (!binLocation) { binLocation = "No Bin"; }
                    if (current.UPCCode != null && current.UPCCode != "") card.set({ BarCode: current.UPCCode })
                    else card.set({ BarCode: current.ItemCode })

                    card.set({
                        BinLocationCode: current.BinLocationCode,
                        BinLocationName: binLocation,
                        CardNumber: 0,
                        Counter: current.QuantityToPick,
                        FreeStock: current.FreeStock,
                        IsCurrent: false,
                        IsItemsRemaining: true,
                        IsItemSkipped: false,
                        ItemCode: current.ItemCode,
                        ItemID: counter,
                        ItemName: current.ItemName,
                        ItemType: current.ItemType,
                        ItemDescription: current.ItemDescription,
                        LineNum: current.LineNum,
                        OverallCounter: 0,
                        Quantity: current.QuantityOrdered,
                        QuantityPicked: 0,
                        QuantityToPick: current.QuantityToPick,
                        QuantitySkipped: 0,
                        RemainingItemID: "REM" + counter,
                        RowNumber: counter,
                        RemainingQuantity: current.QuantityToPick,    
                        SerializeLot: current.SerializeLot,                    
                        SkippedListItemID: "SKIPPED" + counter,
                        TapeItemID: "ITEM" + counter,
                        TransactionCode: current.TransactionCode,
                        UnitMeasureCode: current.UnitMeasureCode,
                        UPCCode: current.UPCCode,
                        CardImage: Shared.GetImageUrl(Enum.ImageType.Card, current.ItemMediumFile),
                        CartItemImage: Shared.GetImageUrl(Enum.ImageType.CartItem, current.ItemIconFile),
                        ShippingNotes: current.ShippingNotes
                    });

                    if (Global.IsPrePackMode) {
                        var length = self.IsNull(current.Length, 0);
                        var width = self.IsNull(current.Width, 0);
                        var height = self.IsNull(current.Height, 0);
                        var weight = self.IsNull(current.WeightInPounds, 0);
                        var carrierDesc = self.IsNull(current.CarrierDescription, "");
                        var serviceCode = self.IsNull(current.ServiceCode, "");
                        var carrierCode = self.IsNull(current.CarrierCode, "");
                        var freightRate = self.IsNull(current.FreightRate, 0);

                        if (current.ShipToAddressType == null || current.ShipToAddressType == "") current.ShipToAddressType = "Residential";

                        card.set({
                            BillToCode: current.BillToCode,
                            BillToName: current.BillToName,
                            DueDate: current.DueDate,
                            CarrierCode: carrierCode,
                            CarrierDescription: carrierDesc,
                            Dimensions: length + " x " + width + " x " + height,
                            FreightRate: freightRate,
                            PackagingCode: current.PackagingCode,
                            SalesOrderDate: current.SalesOrderDate,
                            ShippingDate: current.ShippingDate,
                            ShipToAddress: current.ShipToAddress,
                            ShipToAddressType: current.ShipToAddressType,
                            ShipToCity: current.ShipToCity,
                            ShipToCode: current.ShipToCode,
                            ShipToCountry: current.ShipToCountry,
                            ShipToCounty: current.ShipToCounty,
                            ShipToName: current.ShipToName,
                            ShipToPhone: current.ShipToPhone,
                            ShipToPhoneExtension: current.ShipToPhoneExtension,
                            ShipToPlus4: current.ShipToPlus4,
                            ShipToPostalCode: current.ShipToPostalCode,
                            ShipToState: current.ShipToState,
                            ShippingMethodCode: current.ShippingMethodCode,                            
                            ServiceCode: serviceCode,
                            WeightInLbs: weight,
                            TrackingNumber: current.TrackingNumber,
                        });
                    }

                    if (card.get("ItemType") == "Kit") {
                        card.set ({
                            QuantitySkipped: current.QuantityToPick,
                            QuantityToPick: 0,
                            IsItemSkipped: true,
                            IsItemsRemaining: false,
                        });
                        self.itemsPicked.add(card);
                        // self.itemsSkipped.add(card);
                    } else {
                        totalQty = totalQty + current.QuantityToPick;
                        self.itemCollection.add(card);

                        var cartItemView = new CartItemView({ model: card });
                        self.$("#cartListItemsRemaining tbody").append(cartItemView.render());

                        card.on("remove", function () {
                            self.UpdateRemainingItems(cartItemView);
                        }, this);
                    }
                });

                this.model.set({ OverallCounter: totalQty });
                this.UpdateCounter(totalQty);
            }
        },

        PrepareBin: function (items) {
            if (items && items.length == 1 && items[0].QuantityToPick == 1) this.model.set({ HasOnlyOneItem: true });
            if (items && items.length > 0) {                
                this.PopulateCart(items); 
                this.RenderRemainingItems();
                if (this.itemCollection && this.itemCollection.length > 0) {
                    var item = this.itemCollection.models[0];
                    item.set({
                        OverallCounter: this.model.get("Counter")
                    })
                                        
                    this.RenderItem(item, false);
                }
            }
            else {
                navigator.notification.alert("There are no items to pick. Please select another order", this.GoToLookup(), "No Pick Items", "OK");
            }
        },

        ProcessPickItems: function (item, quantityToScan) {

            
            if (this.itemCollection && this.itemCollection.length > 0) {
                item.set({ IsItemSkipped: false });

                var maxQty = item.get("QuantityToPick");
                if (quantityToScan > maxQty) quantityToScan = maxQty;

                this.QuantityToScan = quantityToScan;

                if (Global.IsPrePackMode) {
                    item.set({ ShipQuantity: quantityToScan });
                    this.ProcessPrePackItem(item, quantityToScan);
                }
                else {
                    Shared.BeepSuccess();
                    this.ProcessCurrentPickItem(item)
                }
            }
            else {
                Shared.BeepSuccess();
                this.ValidateCompletePick();
            }
        },

        ProcessCurrentPickItem: function (item) { 

             

            var maxQty = item.get("QuantityToPick");
            var quantityToScan = this.QuantityToScan;

            //counter remaining 
            var remainingQty = item.get("RemainingQuantity");
            remainingQty -= quantityToScan;
            item.set({ RemainingQuantity: remainingQty });

            //qty picked
            var qtyPicked = item.get("QuantityPicked");
            qtyPicked = qtyPicked + quantityToScan;
            item.set({ QuantityPicked: qtyPicked });
            item.set({ QuantityToPick: maxQty - quantityToScan });

           
            if (remainingQty <= 0) {
                //
                //Move to next card or complete pick
                this.itemsPicked.add(item);
                this.itemCollection.remove(item);

                if (this.itemCollection && this.itemCollection.length > 0) {
                    item = this.itemCollection.models[0];
                    this.CurrentItem = item;
                }
                else {
                    this.ValidateCompletePick();
                    return true;
                }
            }
            else {
                //
                //Update current card
                var tapeItemID = item.get("SkippedListItemID");
                var remainingQty = item.get("RemainingQuantity");
                this.$('#textQty' + tapeItemID).text(remainingQty);
                this.$('#textQtyDetail' + tapeItemID).text(remainingQty);
                
                if (this.itemCollection.length == 1 && item.get('QuantityToPick') == 1 && maxQty == 1) this.HideSkipButton(item.get('SkippedListItemID'));                
            }            

            this.UpdateCounter(quantityToScan * -1);
            item.set({ OverallCounter: this.model.get("Counter") });
             
           
            if (remainingQty <= 0) this.RenderItem(item, true);
        },

        ProcessPrePackItem: function (item, quantityToScan) {
            var hasError = false;

            if (!this.ValidateShippingAddress(item)) {
                hasError = true;
                Shared.NotifyError("Please fill up complete shipping address.");
            }

            if (!this.ValidateShippingInfo(item)) {
                hasError = true;
                Shared.NotifyError("Please fill up complete shipping info.");
            }

            if (this.CurrentItem.get('ServiceCode') == "(Unspecified)") {
                hasError = true;
                Shared.NotifyError("(Unspecified) Service Type is not yet supported.");
            }

            if (this.CurrentItem.get('CarrierDescription') == "Manual") {
                if (!this.ValidateManualShippingInfo()) {
                    hasError = true;
                    Shared.NotifyError("Please fill up box details info.");
                }
            }

            if (hasError) {
                Shared.BeepError();
            }
            else {
                Shared.BeepSuccess();
                var self = this;
                setTimeout(function () {
                    self.SetBoxItemDetail(item, quantityToScan);
                    self.CreateShipment(item, quantityToScan);
                }, 100);                
            }             
        },

        ProcessSkipItems: function () {
            if (this.itemCollection && this.itemCollection.length > 0) {
                var self = this;
              //  var item = this.itemCollection.models[0];
                var item = this.CurrentItem;
                this.UpdateCounter(item.get("RemainingQuantity") * -1);

                var remainingQuantity = item.get("RemainingQuantity");
                var qtySkipped = item.get('QuantitySkipped');
                qtySkipped += item.get("RemainingQuantity");
                item.set({ QuantitySkipped: qtySkipped });

                var qtyToPick = item.get('QuantityToPick');
                qtyToPick -= item.get("QuantitySkipped");
                item.set({ QuantityToPick: qtyToPick });

                item.set({
                    IsItemSkipped: true,
                    IsItemsRemaining: false,
                });

                this.itemsPicked.add(item);
                this.itemCollection.remove(item);
                if (!this.IsItemSkippedExisting()) this.itemsSkipped.add(item);

                if (this.itemCollection.length == 0) {
                    this.ValidateCompletePick();
                    return true;
                }

                this.RenderSkippedItemList(item);
                this.UpdateTotalItemsSkipped(item.get("RemainingQuantity"));
            }
            else this.ValidateCompletePick();
        },

        PickNextItem: function (item, quantityToScan) { 
            if (this.IsValidPickTransaction()) { 
                if (SerialNumberTransactionValidationType > 1 && item.get("SerializeLot") == "Serial" && Global.IsPrePackMode == false) {
                    var maxQty = 0

                    if (Preference.PickIsPromptForQty) maxQty = item.get("QuantityToPick");
                    else maxQty = quantityToScan;

                    serialRequired = maxQty;

                    this.ShowSerialSection(true);
                }
                else { 
                    this.ProcessPickItems(item, quantityToScan);
                }
            }
            else { 
                this.ProcessPickItems(item, quantityToScan);
            }

             
        },

      IsValidPickTransaction:function() {

        if(Preference.PickSourceTransaction=="invoice" && Preference.PickIsAutoComplete) return true;
        else if (Preference.PickSourceTransaction=="invoice" && !Preference.PickIsAutoComplete) return true;
        else if (Preference.PickSourceTransaction=="order" && Preference.PickIsAutoComplete)  return true;
        else if (Preference.PickSourceTransaction=="order" && !Preference.PickIsAutoComplete) return false;
        else  return true;
        return true;
        
      },

        PickCompleted: function (transactionCode) {
            this.model.set({
                OverallCounter: 0,
                Counter: 0
            });

            if (!Global.IsPrePackMode) {
                if (transactionCode) {
                    this.$('#completedNavTitle').text(transactionCode);
                    Global.TransactionCode = transactionCode;
                }

                if (Preference.PickSourceTransaction == "order") {
                    if (Preference.PickIsAutoComplete) this.$('#buttonPackOrder').text('pack invoice');
                    else this.$('#buttonPackOrder').text('pack order');
                }
                else this.$('#buttonPackOrder').text('pack invoice');
            }
            else {
                if (Preference.PickIsAutoComplete) this.$('#completedNavTitle').text(transactionCode);
            }

            this.$("#containerCompletedAnimation").removeClass("bounceOutUp").show().addClass("bounceInDown");
            Shared.SetVisibilityToHidden("#pickHeader");
        },

        PrintLabel: function (response) {
            if (response != null) {
                if (Preference.PrePackIsAutoPrint && this.CurrentItem.get('CarrierDescription') != "Manual") {
                    var self = this;

                    this.AnimatePick(true, true);
                    Printer.PrintLabels(response.Packs, {
                        progress: this.ProgressScreen,
                        success: function (model, response, options) {
                            self.ProcessCurrentPickItem(self.CurrentItem);
                        },
                        error: function (model, exception, response) {
                            self.ProcessCurrentPickItem(self.CurrentItem);
                        }
                    });
                }
                else this.ProcessCurrentPickItem(this.CurrentItem);
            }
        },

        RenderChecklist: function (list, listMode) {
            if (list != null) {
                var self = this;
                this.$('#cartCheckList tbody').html('');
                self.$('#serviceTypeCheckList').html('');
                self.$('#containerTableCheckList').show();
                self.$('#containerServiceTypeCheckList').hide();

                switch (listMode) {
                    case Enum.ListMode.Boxes:
                        if (list.Packages && list.Packages.length > 0) {
                            if (self.CurrentItem.get('CarrierCode')) {
                                _.each(list.Packages, function (current) {
                                    var carrierCode = current.CarrierCode;
                                    var carrierDesc = current.CarrierDescription;
                                    var packagingType = current.PackagingType;
                                    var serviceCode = current.ServiceType;                                    

                                    if (!carrierCode) carrierCode = "";
                                    if (!carrierDesc) carrierDesc = "";
                                    if (!packagingType) packagingType = "";
                                    if (!serviceCode) serviceCode = "";

                                    var checkListItemModel = new CheckListItemModel();
                                    checkListItemModel.set({
                                        ListItemTitle: packagingType,
                                        ListItemRow1: "Carrier: " + carrierDesc,
                                        ListItemRow2: "",
                                        CarrierDescription: carrierDesc,
                                        CarrierCode: carrierCode,
                                        PackagingType: packagingType,
                                        ServiceType: serviceCode
                                    });

                                    var checklistItemView = new CheckListItemView({ model: checkListItemModel });
                                    self.$('#cartCheckList tbody').append(checklistItemView.render());

                                    if (self.CurrentItem.get('PackagingCode') == checklistItemView.model.get('PackagingType')) {
                                        self.HighLightListItem(checklistItemView);
                                    }
                                    Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {
                                        self.HighLightListItem(checklistItemView);
                                        self.UpdatePackagingType(checklistItemView);
                                        self.SwitchPage('page2');
                                    });
                                });
                                this.iScrollCheckList = Shared.LoadiScroll(this.iScrollCheckList, "CheckList");
                            }
                            else {
                                self.$('#containerTableCheckList').hide();
                                self.$('#containerServiceTypeCheckList').show();
                                if (list.Carriers && list.Carriers.length > 0) {
                                    _.each(list.Carriers, function (current) {
                                        var checkListGroupModel = new CheckListGroupModel();
                                        checkListGroupModel.set({
                                            CarrierDescription: current.CarrierDescription
                                        });
                                        var checkListGroupView = new CheckListGroupView({ model: checkListGroupModel });
                                        var tableName = '#' + current.CarrierDescription + 'Table';
                                        var iconName = current.CarrierDescription + 'Icon';
                                        self.$('#serviceTypeCheckList').append(checkListGroupView.render());

                                        Shared.AddRemoveHandler(tableName + ' thead', 'tap', function (e) {
                                            self.ShowServiceTypeRows(tableName, iconName);
                                        });
                                    });
                                }
                                if (list.Packages && list.Packages.length > 0) {
                                    _.each(list.Packages, function (current) {
                                        var serviceType = current.ServiceType;
                                        if (!serviceType) serviceType = "";

                                        var checkListItemModel = new CheckListItemModel();
                                        checkListItemModel.set({
                                            ListItemTitle: current.PackagingType,
                                            ListItemRow1: "&nbsp;",
                                            ListItemRow2: "",
                                            CarrierDescription: current.CarrierDescription,
                                            CarrierCode: current.CarrierCode,
                                            PackagingType: current.PackagingType,
                                            ServiceType: serviceType
                                        });

                                        var checklistItemView = new CheckListItemView({ model: checkListItemModel });
                                        self.$('#' + current.CarrierDescription + 'Body').append(checklistItemView.render());
                                        $('.' + checklistItemView.cid).hide();
                                        $('.' + checklistItemView.cid + ' div ul').removeClass('listitem-1').addClass('listitem-2');

                                        Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {
                                            self.HighLightServiceType(checklistItemView);
                                            self.UpdatePackagingType(checklistItemView);
                                            self.SwitchPage('page2');
                                        });
                                    });
                                }
                                this.iScrollServiceType = self.LoadiScrollServiceType(this.iScrollServiceType);
                            }
                        }
                        break;
                    case Enum.ListMode.Carriers:                        
                        if (list.Packages && list.Packages.length > 0) {
                            _.each(list.Packages, function (current) {
                                var serviceType = current.ServiceType;
                                if (serviceType) serviceType = "Service: " + current.ServiceType
                                else serviceType = "&nbsp;";

                                var checkListItemModel = new CheckListItemModel();
                                checkListItemModel.set({
                                    ListItemTitle: current.CarrierDescription,
                                    ListItemRow1: serviceType,
                                    ListItemRow2: "",
                                    CarrierDescription: current.CarrierDescription,
                                    CarrierCode: current.CarrierCode,
                                    DefaultCarrierDescription: current.DefaultCarrierDescription,
                                    DefaultCarrierCode: current.DefaultCarrierCode,
                                    ServiceType: current.ServiceType
                                });

                                var checklistItemView = new CheckListItemView({ model: checkListItemModel });
                                self.$('#cartCheckList tbody').append(checklistItemView.render());

                                if (self.$('#textCarrier').text() == 'Manual') {
                                    if (checklistItemView.model.get('CarrierDescription') == 'Manual') self.HighLightListItem(checklistItemView);
                                }
                                else {
                                    if (self.CurrentItem.get('CarrierCode') == checklistItemView.model.get('CarrierCode')) self.HighLightListItem(checklistItemView);
                                }
                                Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {
                                    self.HighLightListItem(checklistItemView);
                                    self.UpdateCarrier(checklistItemView);
                                    self.SwitchPage('page2');
                                });
                            });
                        }
                        this.iScrollCheckList = Shared.LoadiScroll(this.iScrollCheckList, "CheckList");
                        break;
                    case Enum.ListMode.ServiceTypes:                        
                        if (list.Packages && list.Packages.length > 0) {
                            if (self.CurrentItem.get('CarrierCode')) {
                                _.each(list.Packages, function (current) {
                                    if (current.ServiceType != '(Unspecified)') {
                                        var checkListItemModel = new CheckListItemModel();
                                        checkListItemModel.set({
                                            ListItemTitle: current.ServiceType,
                                            ListItemRow1: "Carrier: " + current.CarrierDescription,
                                            ListItemRow2: "",
                                            CarrierDescription: current.CarrierDescription,
                                            CarrierCode: current.CarrierCode,
                                            ServiceType: current.ServiceType
                                        });

                                        var checklistItemView = new CheckListItemView({ model: checkListItemModel });
                                        self.$('#cartCheckList tbody').append(checklistItemView.render());

                                        if (self.CurrentItem.get('ServiceCode') == checklistItemView.model.get('ServiceType')) {
                                            self.HighLightListItem(checklistItemView);
                                        }
                                        Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {
                                            self.HighLightListItem(checklistItemView);
                                            self.UpdateServiceType(checklistItemView);
                                            self.SwitchPage('page2');
                                        });
                                    }
                                });
                                this.iScrollCheckList = Shared.LoadiScroll(this.iScrollCheckList, "CheckList");
                            }
                            else {
                                self.$('#containerTableCheckList').hide();
                                self.$('#containerServiceTypeCheckList').show();
                                if (list.Carriers && list.Carriers.length > 0) {
                                    _.each(list.Carriers, function (current) {
                                        var checkListGroupModel = new CheckListGroupModel();
                                        checkListGroupModel.set({
                                            CarrierDescription: current.CarrierDescription
                                        });
                                        var checkListGroupView = new CheckListGroupView({ model: checkListGroupModel });
                                        var tableName = '#' + current.CarrierDescription + 'Table';
                                        var iconName = current.CarrierDescription + 'Icon';
                                        self.$('#serviceTypeCheckList').append(checkListGroupView.render());

                                        Shared.AddRemoveHandler(tableName + ' thead', 'tap', function (e) {
                                            self.ShowServiceTypeRows(tableName, iconName);
                                        });
                                    });
                                }
                                if (list.Packages && list.Packages.length > 0) {
                                    _.each(list.Packages, function (current) {
                                        if (current.ServiceType != '(Unspecified)') {
                                            var checkListItemModel = new CheckListItemModel();
                                            checkListItemModel.set({
                                                ListItemTitle: current.ServiceType,
                                                ListItemRow1: "&nbsp;",
                                                ListItemRow2: "",
                                                CarrierDescription: current.CarrierDescription,
                                                CarrierCode: current.CarrierCode,
                                                ServiceType: current.ServiceType
                                            });

                                            var checklistItemView = new CheckListItemView({ model: checkListItemModel });
                                            self.$('#' + current.CarrierDescription + 'Body').append(checklistItemView.render());
                                            $('.' + checklistItemView.cid).hide();
                                            $('.' + checklistItemView.cid + ' div ul').removeClass('listitem-1').addClass('listitem-2');

                                            Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {
                                                self.HighLightServiceType(checklistItemView);
                                                self.UpdateServiceType(checklistItemView);
                                                self.SwitchPage('page2');
                                            });
                                        }
                                    });                                        
                                }
                                this.iScrollServiceType = self.LoadiScrollServiceType(this.iScrollServiceType);
                            }
                        }
                        break;
                }                
            }
        },

        RenderItem: function (item, isAnimate) {
            this.CurrentItem = item;

            if (isAnimate) {
                this.$("#containerTransition").show();
                this.$("#containerCard").hide();
                this.$("#containerItemSettings").hide();
            }
            else {
                var itemCounter = item.get("RemainingQuantity");
                var skippedItemID = item.get("SkippedListItemID");
                var cardNumber = this.model.get("OverallCounter") - this.model.get("RemainingQuantity") + 1;

                item.set({ CardNumber: cardNumber });

                var cardCoverView = new CardView();

                cardCoverView.model = item;
                this.$("#containerCard").html("");
                this.$("#containerCard").append(cardCoverView.render());

                this.ItemSettingView.model = item;
                this.$("#containerItemSettings").html("");
                this.$("#containerItemSettings").append(this.ItemSettingView.render());

                var cardFrontView = new CardView();
                cardFrontView.model = item;
                this.$("#cardFront").html("");
                this.$("#cardFront").append(cardFrontView.render());

                this.RenderItemDetail(item)

                if (itemCounter > 1) {
                    var cardBackView = new CardView();

                    cardBackView.model = item;
                    item.set({ CardNumber: cardNumber + 1 });
                    this.$("#cardBack").html("");
                    this.$("#cardBack").append(cardBackView.render());
                    item.set({ CardNumber: cardNumber - 1 });
                }
                else {
                    if (this.itemCollection && this.itemCollection.length > 1) {
                        var item2 = this.itemCollection.models[1];
                        item2.set({ CardNumber: cardNumber + 1 });

                        var cardBackView = new CardView();

                        cardBackView.model = item2;
                        this.$("#cardBack").html("");
                        this.$("#cardBack").append(cardBackView.render());

                        this.RenderItemDetail(item2)
                    }
                }
                this.ChangeCardSize(skippedItemID);
                if (Global.IsPrePackMode) this.ChangeAddressButton();
            }            
        },

        RenderItemDetail: function (item) {
            var self = this;

            var skippedItemID = item.get("SkippedListItemID");
            var newBinLocation = item.get("BinLocationName");
            var binLocationCard = $('#textbinLocation' + item.get("ItemCode"));
            var binLocationCardDetail = $('#textbinLocationDetail' + item.get("ItemCode"))

            if (newBinLocation == "No Bin") {
                binLocationCard.css("font-style", "italic");
                binLocationCard.text("< No Bin >");

                binLocationCardDetail.css("font-style", "italic");
                binLocationCardDetail.text("< No Bin >");
            }

            this.ShowFreeStockItemSetting(skippedItemID);
            this.ShowTransactionCodeItemSetting(skippedItemID);
           
            this.WireCardEvents(skippedItemID, false);

            var onAttributeChanged = function () {
                var newBinLocation = item.get("BinLocationName");
                var binLocationCard = $('#textbinLocation' + item.get("ItemCode"));
                var binLocationCardDetail = $('#textbinLocationDetail' + item.get("ItemCode"))
                var binLocationItemSetting = $('#itemSettingBinLocation');

                var newItemQty = item.get("QuantityToPick");
                var itemQty = $('#itemQty' + item.get("TapeItemID"));
                
                if (binLocationCard.text() != newBinLocation) {
                    if (newBinLocation == "No Bin") {
                        binLocationCard.css("font-style", "italic");
                        binLocationCard.text("< No Bin >");

                        binLocationCardDetail.css("font-style", "italic");
                        binLocationCardDetail.text("< No Bin >");
                    }
                    else {
                        binLocationCard.text(newBinLocation);
                        binLocationCard.css("font-style", "normal");

                        binLocationCardDetail.text(newBinLocation);
                        binLocationCardDetail.css("font-style", "normal");
                    }
                }
                else {
                    if (binLocationCard.text() == "No Bin") {
                        binLocationCard.css("font-style", "italic");
                        binLocationCard.text("< No Bin >");

                        binLocationCardDetail.css("font-style", "italic");
                        binLocationCardDetail.text("< No Bin >");
                    }
                }

                if (itemQty.text() != newItemQty) itemQty.text(newItemQty);

                if (binLocationItemSetting.text() != newBinLocation) binLocationItemSetting.text(newBinLocation);
            };

            this.CurrentItem.off('change', onAttributeChanged);
            this.CurrentItem.on('change', onAttributeChanged);
        },

        ScanSelectedItem: function (itemView) { 
            var itemName = itemView.model.get('ItemName');
            var currentItemName = this.CurrentItem.get("ItemName");
             if (!Preference.PickIsAllowToSkipItems && currentItemName != itemName)
             {
                       Shared.NotifyError("Preference does not allow skipping an item.");
                       Shared.BeepError();
             }
             else
             {
                var upcCode = itemView.model.get('UPCCode');
                var itemCode = itemView.model.get('ItemCode');
                var unitMeasureCode = itemView.model.get('UnitMeasureCode');
                var selectedItem = Shared.FindItem(this.itemCollection, itemCode, unitMeasureCode);
                this.CurrentItem = selectedItem;
                if (itemName !=currentItemName)
                {
                    this.RenderItem(selectedItem,false);
                }
                this.$("#textScanItem").val(itemCode);
                this.ShowRemainingItems(false);
                this.ScanItem();
             }
    
          
        },

        RenderRemainingItems: function () { 
            var self = this;
            if (this.itemCollection && this.itemCollection.length > 0) {
                this.itemCollection.each(function (item) {
                    var quantityToPick = item.get("QuantityToPick");

                    if (quantityToPick != 0) {
                        var itemView = new CartItemView({ model: item });
                        Shared.AddRemoveHandler('#buttonItemSetting' + itemView.model.get('TapeItemID'), 'tap', function (event) {       
                            self.LoadItemSetting(itemView)
                            $("#itemRemainingSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
                              event.stopPropagation();
                        });

                      Shared.AddRemoveHandler('#' + itemView.model.get('TapeItemID'), 'tap', function () {
                            self.ScanSelectedItem(itemView);
                        });

                        if (!Global.IsPrePackMode) $('#rowTransactionCode' + itemView.model.get('TapeItemID')).hide();
                    };
                });
            };
        },

        RenderSkippedItems: function () {
            var self = this;
            var totalItemsSkipped = this.model.get("TotalItemsSkipped");
            var rownumber = 1;
            this.$("#cartListSkippedItems tbody").html("");

            this.itemsSkipped.add(this.itemCollection.models[0]);

            if (totalItemsSkipped > 0) {
                this.$("#textSkippedQty").text(totalItemsSkipped);
                this.$("#textTotalSkippedItems").text(this.itemsSkipped.length);
                this.itemsSkipped.models.reverse();
                this.itemsSkipped.each(function (item) {
                    var cartSkippedItemView = new CartSkippedItemView({ model: item });

                    if (cartSkippedItemView.model.get('QuantitySkipped') > 0 || !cartSkippedItemView.model.get('IsItemSkipped')) {
                        self.$("#cartListSkippedItems tbody").append(cartSkippedItemView.render());
                        $('#itemRow' + cartSkippedItemView.model.get('SkippedListItemID')).text(rownumber);

                        if (cartSkippedItemView.model.get("UPCCode") == self.CurrentItem.get("UPCCode")) Shared.HighLightItem(cartSkippedItemView.model.get('SkippedListItemID'), "Default");

                        rownumber += 1;
                        Shared.AddRemoveHandler('#skippedItemRow' + cartSkippedItemView.model.get('SkippedListItemID'), 'tap', function () {
                            Shared.HighLightItem(cartSkippedItemView.model.get('SkippedListItemID'), "Default");
                            $("#skippedItemsSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
                            setTimeout(function () { self.GoToSelectedItem(cartSkippedItemView) }, 300);
                        });
                    }

                    if (!cartSkippedItemView.model.get('IsItemSkipped')) {
                        $('#itemQty' + cartSkippedItemView.model.get('SkippedListItemID')).text(item.get('RemainingQuantity'));
                    }
                });
                this.itemsSkipped.models.reverse();
            }
        },

        RenderSkippedItemList: function (item) {
            var self = this;
            var cardListView = new CardListView({ model: item });
            var tempSkippedItemID = item.get('SkippedListItemID');
            var skippedItemID = item.get('SkippedListItemID');
            var binLocationName = item.get("BinLocationName");

            if (item.get('Quantity') > 1) {
                skippedItemID = skippedItemID + "B";
                item.set({ SkippedListItemID: skippedItemID });
            }

            var existingCard = $('#' + skippedItemID);

            if (existingCard.length > 0) {
                existingCard.parent().remove();
                isUpdate = true;
            }

            this.$('#skippedItemList #currentCardContainer').before(cardListView.render());

            var cardCoverView = new CardView({ model: item });
            var itemSettingView = new ItemSettingView({ model: item });

            $('#containerCard' + skippedItemID).append(cardCoverView.render());
            $('#containerItemSettings' + skippedItemID).append(itemSettingView.render());
            
            this.ChangeCardSize(skippedItemID);            
            this.WireCardEvents(skippedItemID, true);
            this.ShowFreeStockItemSetting(skippedItemID);
            this.ShowTransactionCodeItemSetting(skippedItemID);

            $('#textQty' + skippedItemID).text(item.get("QuantitySkipped"));
            $('#textQtyDetail' + skippedItemID).text(item.get("QuantitySkipped"));

            if (binLocationName == 'No Bin') {
                var binLocationCard = $('#textbinLocation' + item.get("ItemCode"));
                var binLocationCardDetail = $('#textbinLocationDetail' + item.get("ItemCode"))

                binLocationCard.css("font-style", "italic");
                binLocationCardDetail.css("font-style", "italic");

                binLocationCard.text("< No Bin >");
                binLocationCardDetail.text("< No Bin >");
            }
            
            if (!isUpdate) {
                if (listWidth == 0) listWidth = Global.ScreenWidth;
                listWidth += Global.ScreenWidth;
                this.$('.iscroll-pickbody').css("width", listWidth + "px");
            }

            item.set({ SkippedListItemID: tempSkippedItemID });
            this.RenderItem(this.itemCollection.models[0], false);
        },

        RemoveFromSkippedItemList: function (item, quantityToScan) {
            var qtySkipped = item.get('QuantitySkipped');
            var qtyPicked = item.get('QuantityPicked');
            var remQty = item.get('RemainingQuantity');
            var skippedItemID = item.get('SkippedListItemID');

            qtySkipped -= quantityToScan;
            item.set({ QuantitySkipped: qtySkipped });

            qtyPicked += quantityToScan;
            item.set({ QuantityPicked: qtyPicked });

            remQty -= quantityToScan;
            item.set({ RemainingQuantity: remQty });

            if (qtySkipped <= 0) {
                listWidth -= Global.ScreenWidth;
                var skipListControl = this.$('#' + skippedItemID);
                if (skipListControl.length == 0) { skipListControl = this.$('#' + skippedItemID + "B"); }
                skipListControl.parent().remove();
                this.$('#pickBody').css("width", listWidth + "px");
                this.itemsSkipped.remove(item);
                this.itemsPicked.add(item);
                this.GetCurrentItem();
            }
            else {
                $('#textQty' + item.get('SkippedListItemID') + "B").text(qtySkipped);
                $('#textQtyDetail' + item.get('SkippedListItemID') + "B").text(qtySkipped);
            }

            if (Global.IsPrePackMode) {
                item.set({
                    QuantityPicked: quantityToScan,
                    ShipQuantity: quantityToScan
                });
                this.ProcessPrePackItem(item, quantityToScan);
            }

            this.UpdateTotalItemsSkipped(quantityToScan * -1);
            var totalSkipped = this.model.get("TotalItemsSkipped");
            this.itemSkippediScroll.refresh();
        },

        ShowHideShippingNotes: function (shippingNotes, skippedItemId) {
             if (shippingNotes) {
                 $('#rowShipNotes').show();
                   if (shippingNotes.length > 20) {
                      this.$('#rowShipNotes'+ skippedItemId).html("<a>Notes<br><span style='white-space:normal'>" + shippingNotes  + "</span></a>")
                   }
                   else {
                      this.$('#rowShipNotes'+ skippedItemId).html("<a><span class='pull-right'>" + shippingNotes  + "</span>Notes</a>")
                   }

             } 
             else  this.$('#rowShipNotes'+ skippedItemId).hide();
        },
 
        RotateContainerCard: function (skippedListItemID) {
            

            if (isRotateCard) {
                if (isOnItemSettingSection) {
                    Shared.FlipY(('#flipper' + skippedListItemID), 0);
                    isOnItemSettingSection = false;
                }
                else {
                     var skippedItemID = this.CurrentItem.get("SkippedListItemID");
                     var itemDescription = this.CurrentItem.get('ItemDescription');
                     var shippingNotes = this.CurrentItem.get('ShippingNotes');
                     if (itemDescription.length > 20) {
                          this.$('#rowDescription'+ skippedItemID).html("<a>Description<br><span style='white-space:normal'>" + itemDescription  + "</span></a>")
                     }
                     else {
                             this.$('#rowDescription'+ skippedItemID).html("<a><span class='pull-right'>" + itemDescription  + "</span>Description</a>")
                     }

                    this.ShowHideShippingNotes(shippingNotes, skippedItemID);
                    Shared.FlipY(('#flipper' + skippedListItemID), 180);
                    isOnItemSettingSection = true;
                }
            }
        },

        SetBoxItemDetail: function (item, qty) {
            this.InitializeBoxCollection();

            for (i = 0; i < qty; i++) {
                var box = new BoxItemModel();
                var counter = 0;

                if (item) {
                    box.set({
                        BoxNumber: counter,
                        BillToCode: item.get("BillToCode"),
                        BillToName: item.get("BillToName"),
                        DueDate: item.get("DueDate"),
                        CarrierCode: item.get("CarrierCode"),
                        CarrierDescription: item.get("CarrierDescription"),
                        FreightRate: item.get("FreightRate"),
                        IsAutoComplete: true,
                        SalesOrderDate: item.get("SalesOrderDate"),
                        ServiceCode: item.get("ServiceCode"),
                        ShippingDate: item.get("ShippingDate"),
                        ShipToCode: item.get("ShipToCode"),
                        ShipToName: item.get("ShipToName"),
                        ShipToCountry: item.get("ShipToCountry"),
                        ShipToPostalCode: item.get("ShipToPostalCode"),
                        ShipToPlus4: item.get("ShipToPlus4"),
                        ShipToAddress: item.get("ShipToAddress"),
                        ShipToCity: item.get("ShipToCity"),
                        ShipToState: item.get("ShipToState"),
                        ShipToCounty: item.get("ShipToCounty"),
                        ShipToAddressType: item.get("ShipToAddressType"),
                        ShipToPhone: item.get("ShipToPhone"),
                        ShipToPhoneExtension: item.get("ShipToPhoneExtension"),
                        ShippingMethodCode: item.get("ShippingMethodCode"),
                        TrackingNumber: item.get("TrackingNumber"),
                        TransactionCode: item.get("TransactionCode"),
                        TransactionType: Preference.PickSourceTransaction,
                        WarehouseCode: Preference.DefaultLocation,
                        PackagingCode: item.get("PackagingCode")
                    });

                    counter += 1;
                    this.boxCollection.add(box);
                }
            }
        },

        SetShippingAddress: function (item) {
            if (item) {
                item.set({
                    ShipToAddressType: this.$('#textAddressType').text(),
                    ShipToName: this.$('#textAddressName').val(),
                    ShipToCountry: this.$('#textCountry').val(),
                    ShipToPostalCode: this.$('#textPostal').val(),
                    ShipToAddress: this.$('#textAreaAddress').val(),
                    ShipToCity: this.$('#textCity').val(),
                    ShipToState: this.$('#textState').val(),
                    ShipToCounty: this.$('#textCounty').val(),
                    ShipToPhone: this.$('#textPhone').val(),
                    ShipToPhoneExtension: this.$('#textExt').val()
                });
                if (this.$('#textPlus4').val() == "") item.set({ ShipToPlus4: 0 })
                else item.set({ ShipToPlus4: parseInt(this.$('#textPlus4').val()) })
            }
        },

        SlideDownLookup: function () {
            $('#lookupSection').addClass('slideOutDown').removeClass('slideInUp');
        },

        ScanItem: function () {
            var upcCode = this.CurrentItem.get("UPCCode");
            var itemCode = this.CurrentItem.get("ItemCode");
            var itemName = this.CurrentItem.get("ItemName");
            var valueToCheck = $("#textScanItem").val();
            var qtySkipped = this.CurrentItem.get("QuantitySkipped");

            if (upcCode != null) upcCode = upcCode.toLowerCase();
            if (itemCode != null) itemCode = itemCode.toLowerCase();
            if (itemName != null) itemName = itemName.toLowerCase();
            if (valueToCheck != null) valueToCheck = valueToCheck.toLowerCase();

            this.$("#textScanItem").val("");

            if (valueToCheck == upcCode || valueToCheck == itemCode || valueToCheck == itemName) {
                if (valueToCheck == upcCode || valueToCheck == itemCode || valueToCheck == itemName) {
                    
                    if (isOnItemSettingSection) {
                        Shared.FlipY('.flipper', 0);
                        isOnItemSettingSection = false;
                    }
                    if (Preference.PickIsPromptForQty) { 
                        if (this.CurrentItem.get('QuantityToPick') > 1) this.ShowNumericPad();
                        else this.PickNextItem(this.CurrentItem, 1)
                    }
                    else { 
                        if (qtySkipped > 0) this.RemoveFromSkippedItemList(this.CurrentItem, 1);
                        else this.PickNextItem(this.CurrentItem, 1);
                    }
                }
            }
            else {
                Shared.NotifyError("You are scanning the wrong item.");
                Shared.BeepError();
            }
        },


         ScanSerial: function(valueToCheck) {
            var valueToCheck = $("#textScanSerial").val().trim();
            if (valueToCheck == "") {
                $("#textScanSerial").focus();
                return;
            }

            $("#textScanSerial").val("");

            if (Preference.PreventDuplicateSerialNumber) {
                //check duplicate
                this.CheckSerialExist(valueToCheck, this.CurrentItem);
            } else {
                //BinManagerModel?? mali sequence sa define
                var serial = new BinManagerModel();
                serial.set({
                    DocumentCode: Global.TransactionCode,
                    SerialLotNumber: valueToCheck,
                    ItemCode: this.CurrentItem.get('ItemCode'),
                    LineNum: this.CurrentItem.get('LineNum')
                });
                this.serialCollection.add(serial);
                Shared.BeepSuccess();
                serialQuantity += 1;
                $("#serialScanned").text(serialQuantity);

                if (serialQuantity < serialRequired) Shared.Focus("#textScanSerial");
                else this.ShowSerialSection(false);
            }
        },


        ShowBinManager: function () {
            Global.ApplicationType = "Pick";
            var self = this;
            this.BinManagerView = new BinManagerView();
            this.BinManagerView.model.set({ ItemCode: this.CurrentItem.get('ItemCode') });
            this.BinManagerView.CurrentItem = this.CurrentItem;
            var itemModel = this.CurrentItem;

            isRotateCard = false;
            this.$("#binManagerSlider").removeClass("container slideOutDown").addClass("container slideInUp");

            this.BinManagerView.on("selectedBin", function (item) {
                self.UpdateBinItemSortOrder(item);
            });

            this.BinManagerView.on("deleteBin", function (binCode, binCollection, isDeleteAll) {
                Shared.RemoveBinFromItem(itemModel, binCode, binCollection, isDeleteAll);
            });

            this.$("#containerBinManager").html("");
            this.$("#containerBinManager").append(this.BinManagerView.Render());

            this.BinManagerView.InitializeChildViews();
        },

        ShowFreeStockItemSetting: function (skippedItemID) {
            if (Preference.PickIsShowQtyOnHand) {
                if (isFromRemainingItemSection) {
                    $('#rowRemFreeStock').show();
                     
                     
                    //---  This code is commented by Surinder Kaur---
                    //---  Reason:  Quanitity going to less some time 2 or 3 along-----
                    //---  Task :  https://github.com/DynEntTech/connectedwarehouse/issues/14----

                    //this.RenderRemainingItems(); 


                }
                else $('#rowFreeStock' + skippedItemID).show();
            }
            else {
                if (isFromRemainingItemSection) $('#rowRemFreeStock').hide();
                else $('#rowFreeStock' + skippedItemID).hide();
            }
        },

        ShowServiceTypeRows: function (tableName, iconName) {
            $(tableName + ' tbody tr td').toggle();
            if ($('#' + iconName).hasClass('icon-rotate-180')) $('#' + iconName).removeClass('icon-rotate-180').addClass('icon-rotate-0')
            else $('#' + iconName).addClass('icon-rotate-180').removeClass('icon-rotate-0')

            this.iScrollServiceType = this.LoadiScrollServiceType(this.iScrollServiceType);
        },

        ShowShippingDetailsLookup: function (shippingMode) {
            var self = this;
            $('#lookupSectionContainer').html("");

            var lookupView = new LookupView();
            lookupView.LookupMode = Enum.LookupMode.ShippingAddress;
            lookupView.ShippingMode = shippingMode;

            if (shippingMode == "postal") lookupView.CountryCode = self.CurrentItem.get("ShipToCountry");

            lookupView.off("slideDownLookup", function (view) {
                self.SlideDownLookup();
            }, this);
            lookupView.on("slideDownLookup", function (view) {
                self.SlideDownLookup();
            }, this);

            lookupView.off("itemSelected", function (itemModel) {
                switch (shippingMode) {
                    case "country":
                        self.UpdateCountry(itemModel);
                        break;
                    case "postal":
                        self.UpdatePostal(itemModel);
                        break;                                        
                }
                self.SlideDownLookup();
            }, this);
            lookupView.on("itemSelected", function (itemModel) {
                switch (shippingMode) {
                    case "postal":
                        self.UpdatePostal(itemModel);
                        break;
                    case "country":
                        self.UpdateCountry(itemModel);
                        break;
                }
                self.SlideDownLookup();
            }, this);

            $('#lookupSectionContainer').html(lookupView.Render());
            $('#lookupSectionContainer').removeClass('section-close').addClass('section-show');
            $('#completedSection').removeClass('section-show').addClass('section-close');

            lookupView.InitializeChildViews();

            $('#lookupSection').addClass('slideInUp').removeClass('slideOutDown');
        },
                
        ShowTransactionCodeItemSetting: function (skippedItemID) {
            if (Global.IsPrePackMode) {
                if (skippedItemID) $('#rowTransactionCode' + skippedItemID).show();
                else $('#rowRemTransactionCode').show();
            }
            else {
                if (skippedItemID) $('#rowTransactionCode' + skippedItemID).hide();
                $('#rowRemTransactionCode').hide();
            }
        },

        ShowHideControls: function () {
            isRotateCard = true;
            if (Preference.PickIsAllowToSkipItems) this.$('#buttonSkipItem').show();
            else this.$('#buttonSkipItem').hide();

            if (Global.IsPrePackMode) {
                this.$('#buttonAddress').show();
                this.$('#buttonPackOrder').hide();
                this.$('#buttonEditDetails').show();
                this.$('#navbar-title').text("prepack items");
                this.$('#pickBody').css('min-height', '-=34');
                this.$('.pick-item-transition').css('height', '-=34');
                this.$('.form-group').css('margin-bottom', '12px');                
            }
            else {
                this.$('#buttonAddress').hide();
                this.$('#buttonEditDetails').hide();
                this.$('#buttonPackOrder').show();
            }
            this.$('#completedNavTitle').text("");
            Shared.Focus('#textScanItem');
        },

        ShowItemLookup: function (items) {
            if (items) {
                this.ItemLookupView.RenderItems(items);
                $('#pickHeader').hide();
                $('#itemLookupSection').addClass('slideInUp').removeClass('slideOutDown');
            }
        },

        ShowNumericPad: function () {

            if (SerialNumberTransactionValidationType > 1 && this.CurrentItem.get("SerializeLot") == "Serial") {
                $('#numEnter').text('continue');
            } else {
                $('#numEnter').text('enter');
            }

            if (this.NumericPadType == "freightrate") {
                $('#numericPadNavTitle').text("enter freight rate");
                var numVal = this.CurrentItem.get('FreightRate');

                if (numVal) $('#textboxQuantity').val(numVal);
                else $('#textboxQuantity').val(0);
            }
            else { 
                $('#numericPadNavTitle').text("enter quantity");

                //--- Code added by surinder kaur------------------------------------------------
                //--- Reason:  In Picking, add item description to Enter Quantity screen #11-----
                //-------------------------------------------------------------------------------
                var texta = $("#itemsdes11").text();
                $('#Spndes').text(texta); 
                //------------------------------------------------------------------------------
               
                $('#textboxQuantity').val(this.CurrentItem.get('QuantityToPick'));

                localStorage.QuantityToPick = this.CurrentItem.get('QuantityToPick');

            }
            
            this.$('#textScanItem').blur();
            $('#pickHeader').hide();
            $('.numericpad').addClass('slideInUp').removeClass('slideOutDown');
        },

        ShowRemainingItems: function (isShow) {
            if (isShow) {
                this.$('#textScanItem').blur();
                $("#itemRemainingSlider").removeClass("container-remaining slideOutDown").addClass("container-remaining slideInUp");
                this.itemRemainingiScroll = Shared.LoadiScroll(this.itemRemainingiScroll, "ItemsRemaining");
                isFromRemainingItemSection = true;
                // this.RenderRemainingItems();
                Shared.SetVisibilityToHidden("#pickHeader");
            }
            else {
                $('#itemRemainingSlider').removeAttr("style");
                $("#itemRemainingSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
                isFromRemainingItemSection = false;
                Shared.SetVisibilityToVisible("#pickHeader");
                Shared.Focus('#textScanItem');
            }
        },

        ProcessSerializeItem: function() {
            var self = this;
            if (self.CurrentItem) {  
                        if (isSkipped) self.RemoveFromSkippedItemList(self.CurrentItem, self.QuantityToScan);
                        else self.ProcessPickItems(self.CurrentItem, serialRequired);              
                    }

                    $("#serialSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");  
                    Shared.Focus('#textScanItem');

        },

         ShowSerialSection: function(isShow) {
            var self = this;
            if (isShow) {
                serialQuantity = 0;
                $("#serialScanned").text(serialQuantity);
                $("#serialTotal").text(serialRequired);
                $("#serialSlider").removeClass("container-remaining slideOutDown").addClass("container-remaining slideInUp");
                Shared.Focus('#textScanSerial');
            } else {
                if (self.ValidateSerial()) {
                    if (SerialNumberTransactionValidationType == 0 || SerialNumberTransactionValidationType == 2){
                    self.ProcessSerializeItem();    
                    }
                    else {
                        if (serialQuantity == serialRequired) {
                             self.ProcessSerializeItem();    
                            }
                    }

                    // if (self.CurrentItem) {
                    //     if (isSkipped) self.RemoveFromSkippedItemList(self.CurrentItem, self.QuantityToScan);
                    //     else self.ProcessPickItems(self.CurrentItem, serialRequired);              
                    // }

                    // $("#serialSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");  
                    // Shared.Focus('#textScanItem');
                }
                else Shared.Focus('#textScanSerial');
            }
        },

        ShowSkippedItems: function (isShow) {
            var totalItemsSkipped = this.model.get('TotalItemsSkipped');

            if (totalItemsSkipped > 0) {
                $('.slideInUp').css('-webkit-transition', 'all 0.3s ease 0s');
                if (isShow) {
                    $("#skippedItemsSlider").removeClass("container-remaining slideOutDown").addClass("container-remaining slideInUp");
                    this.skippedItemsiScroll = Shared.LoadiScroll(this.skippedItemsiScroll, "SkippedItems");
                    this.RenderSkippedItems();
                }
                else {
                    $('#skippedItemsSlider').removeAttr("style");
                    $("#skippedItemsSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
                }
            }
        },

        SkipItem: function () {
            var self = this;
            this.$("#textScanItem").val("");
            isRotateCard = false;

            if (this.itemsSkipped.length > 0 && this.IsItemSkippedExisting()) {   
                 if (this.itemCollection.length == 0)
                 {
                    this.ValidateCompletePick();
                 }
                 else
                 {
                  this.itemSkippediScroll.next();    
                 }
                
                return;
            }

            if (this.itemCollection.length == 1) {
                var qty = this.CurrentItem.get("Quantity");
                if (qty > 1) this.ProcessSkipItems();
                else {
                    Shared.BeepError();
                    return;
                }
                
            }
            else this.ProcessSkipItems();

            this.itemSkippediScroll = Shared.LoadHorizontaliScroll('#pickBody', this.itemSkippediScroll);
            this.itemSkippediScroll.on("scrollEnd", function (e) { self.GetCurrentItem(); });            
            this.itemSkippediScroll.next();
            this.GetCurrentItem();

            Shared.Focus('#textScanItem');
        },
        
        SwitchDisplay: function (page) {
            if (this.isAnimate) return false;
            $('.slideInUp').css('-webkit-transition', 'all 0.3s ease-in-out 0.1s');
            switch (page) {
                case "page1":
                    if (isFromRemainingItemSection) Shared.SlideX('#itemRemainingSlider', 0);
                    else Shared.SlideX('#skippedItemsSlider', 0);
                    break;
                case "page2":
                    if (isFromRemainingItemSection) Shared.SlideX('#itemRemainingSlider', Global.ScreenWidth * -1);
                    else Shared.SlideX('#skippedItemsSlider', Global.ScreenWidth * -1);
                    break;
                case "page3":
                    if (isFromRemainingItemSection) Shared.SlideX('#itemRemainingSlider', Global.ScreenWidth * -1);
                    else Shared.SlideX('#skippedItemsSlider', Global.ScreenWidth * -1);
                    break;
            }
        },

        SwitchPage: function (page, feature) {
            switch (page) {
                case "page1":
                    Shared.SlideX('#pickContainerSlider', 0);
                    break;
                case "page2":
                    $('.slideInUp').css('-webkit-transition', 'all 0.3s ease-in-out 0.1s');
                    switch (feature) {
                        case "shippingAddress":
                            this.InitializeShippingAddress();
                            this.$('#shippingAddressSection').removeClass('section-close');
                            this.$('#boxDetailsSection').addClass('section-close');
                            break;
                        case "boxDetails":
                            this.InitializeBoxDetails();
                            this.$('#boxDetailsSection').removeClass('section-close');
                            this.$('#shippingAddressSection').addClass('section-close');
                            break;
                    }
                    $('li').removeClass('highlight');
                    Shared.SlideX('#pickContainerSlider', Global.ScreenWidth * -1);
                    break;
                case "page3":
                    Shared.SlideX('#pickContainerSlider', Global.ScreenWidth * -2);
                    break;
            }
        },

        UpdateBinItemSortOrder: function (bin) {
            if (bin) {
                var binModel = new BinManagerModel();
                var self = this;

                binModel.set({
                    BinLocationCode: bin.get('BinLocationCode'),
                    BinLocationName: bin.get('BinLocationName'),
                    ItemCode: self.CurrentItem.get('ItemCode'),
                    LocationCode: "Zone1",
                    WarehouseCode: Preference.DefaultLocation
                });

                binModel.url = Global.ServiceUrl + Service.PRODUCT + Method.UPDATEBINITEMSORTORDER;

                self.AnimatePick(true, true);
                binModel.save(null, {
                    success: function (model, response, options) {

                    },
                    progress: this.ProgressScreen
                });
            }
        },

        UpdateCarrier: function (itemModel) {
            if (itemModel.model.get('CarrierDescription') == "Manual") {
                this.$("#rowTrackingNumberManual").show();
                this.$("#rowFreightRate").show();
                this.$('#rowServiceType').hide();
                this.$('#textTrackingNumber').val(this.CurrentItem.get("TrackingNumber"));
                this.$('#textFreightRate').val(this.CurrentItem.get("FreightRate"));
                this.ValidateManualShippingInfo();
            }
            else {
                this.$("#rowTrackingNumberManual").hide();
                this.$("#rowFreightRate").hide();
                this.$('#rowServiceType').show();
            }

            this.CurrentItem.set({
                CarrierCode: itemModel.model.get('CarrierCode'),
                CarrierDescription: itemModel.model.get('CarrierDescription'),
                ServiceCode: itemModel.model.get('ServiceType')
            });

            var serviceType = this.CurrentItem.get('ServiceCode')
            if (!serviceType) serviceType = "";
            
            this.$('#textCarrier').text(this.CurrentItem.get('CarrierDescription'));
            this.$('#textServiceType').text(serviceType);
        },       
        
        UpdateCounter: function (qty) {
            var counter = this.model.get("Counter");
            var textQty = "";

            counter += qty;

            this.model.set({ Counter: counter });
            if (counter > 99) textQty = "99+";
            else textQty = counter;

            $("#textCounter").text(textQty);
            $("#textTotalItemsRemaining").text(counter);
        },

        UpdateCountry: function (itemModel) {
            this.CurrentItem.set({ ShipToCountry: itemModel.CountryCode });

            this.$('#textCountry').val(itemModel.CountryCode);
        },

        UpdateManualBoxInfo: function () {
            var textManualTrackingNumber = this.$('#textManualTrackingNumber').val();
            var textFreightRate = this.$('#textFreightRate').val();

            this.CurrentItem.set({
                TrackingNumber: textManualTrackingNumber,
                FreightRate: textFreightRate
            });
        },

        UpdatePackagingType: function (itemModel) {
            if (itemModel.model.get('CarrierCode')) {
                this.CurrentItem.set({
                    CarrierCode: itemModel.model.get('CarrierCode'),
                    CarrierDescription: itemModel.model.get('CarrierDescription')
                });
            }
            
            this.CurrentItem.set({ PackagingCode: itemModel.model.get('PackagingType') });

            this.$('#textCarrier').text(this.CurrentItem.get('CarrierDescription'));
            this.$('#textPackagingType').text(this.CurrentItem.get('PackagingCode'));
        },

        UpdatePostal: function (itemModel) {
            this.CurrentItem.set({
                ShipToPostalCode: itemModel.PostalCode,
                ShipToCity: itemModel.City,
                ShipToCounty: itemModel.County,
                ShipToState: itemModel.StateCode,
            });

            $('#textPostal').val(itemModel.PostalCode);
            $('#textCity').val(itemModel.City);
            $('#textCounty').val(itemModel.County);
            $('#textState').val(itemModel.StateCode);
        },

        UpdateServiceType: function (itemModel) {
            if (itemModel.model.get('CarrierDescription') == "Manual") this.CurrentItem.set({ ServiceCode: null });            
            else {
                this.CurrentItem.set({
                    CarrierCode: itemModel.model.get('CarrierCode'),
                    CarrierDescription: itemModel.model.get('CarrierDescription'),
                    ServiceCode: itemModel.model.get('ServiceType')
                });                
            }

            this.$('#textCarrier').text(this.CurrentItem.get('CarrierDescription'));
            this.$('#textServiceType').text(this.CurrentItem.get('ServiceCode'));
        },

        UpdateShippingAddress: function () {
            if (this.CurrentItem) {
                var transactionCode = this.CurrentItem.get('TransactionCode');
                var self = this;

                this.SetShippingAddress(this.CurrentItem);

                if (this.itemCollection && this.itemCollection.length > 0) {
                    _.each(this.itemCollection.models, function (current) {
                        if (current.get('TransactionCode') == transactionCode) {
                            self.SetShippingAddress(current);
                        }
                    });
                }
            }
        },

        UpdateShipToAddressType: function (addressType) {
            this.CurrentItem.set({ ShipToAddressType: addressType });
            this.$('#textAddressType').text(addressType);
        },

        UpdateTotalItemsSkipped: function (qty) {
            var totalSkipped = this.model.get("TotalItemsSkipped");
            totalSkipped += qty;

            this.model.set({ TotalItemsSkipped: totalSkipped });
        },

        UpdateRemainingItems: function (cartItemView) {
            if (cartItemView != null) {
                cartItemView.remove();
            }
            if (this.itemCollection && this.itemCollection.length > 0) {
                var rowNumber = 0;
                var self = this;

                this.itemCollection.each(function (item) {
                    rowNumber = rowNumber + 1;
                    var tapeItemID = item.get("TapeItemID");
                    self.$('#itemRow' + tapeItemID).text(rowNumber);
                });
            }
        },

        ValidateCancelPick: function () {
            var overallCounter = this.model.get("OverallCounter");
            var counter = (this.model.get("Counter")) + (this.model.get("TotalItemsSkipped"));

            if (!Global.IsPrePackMode) {
                if (overallCounter == counter) {
                    var self = this;

                    navigator.notification.confirm("Do you want to cancel Pick?", function (button) {
                        if (button == 1) {
                            self.GoToLookup(); 
                            isOnItemSettingSection = false;
                           }
                    }, "Cancel Pick", "Yes,No");
                    return false;
                }
                if (overallCounter != counter) {
                    var self = this;

                    navigator.notification.confirm("Some items have been picked. Do you want to cancel Pick?", function (button) {
                        if (button == 1) {
                          self.GoToLookup();
                          isOnItemSettingSection = false;
                        } 
                    }, "Cancel Pick", "Yes,No");
                    return false;
                }
                return true;
            }
            else return true;
        },

        ValidateCompletePick: function () {
            var self = this;

            if (this.itemsSkipped.length > 0 && this.itemsPicked.length > 0) {
                navigator.notification.confirm("Some items are skipped. Do you still want to complete pick?", function (button) {
                    if (button == 1) self.CompletePick();
                    else {
                        for(var i=0; i<serialQuantity; i++) {
                            self.serialCollection.pop();
                        }
                    }
                }, "Complete Pick", "Yes,No");
                return false;
            }
            else if (this.itemsPicked.length <= 0) {
                Shared.NotifyError("No item/s picked.");
                Shared.BeepError();
                return false;
            }
            else if (this.itemsSkipped.length == 0) self.CompletePick();
            return true;
        },

        ValidateManualShippingInfo: function () {
            var result = true;

            if (!this.CurrentItem.get('TrackingNumber') || this.CurrentItem.get('TrackingNumber') == "" || this.CurrentItem.get('TrackingNumber') == null) {
                $('#textManualTrackingNumber').parent().css('color', '#d2322d');
                result = false;
            }
            else {
                $('#textManualTrackingNumber').parent().css('color', '#2c3e50');
            }

            if (!this.CurrentItem.get('FreightRate') || this.CurrentItem.get('FreightRate') == "" || this.CurrentItem.get('FreightRate') == 0) {
                $('#textFreightRate').parent().css('color', '#d2322d');
                result = false;
            }
            else {
                $('#textFreightRate').parent().css('color', '#2c3e50');
            }

            return result;
        },

         ValidateSerial: function() {
            var confirm;
            var self = this;

            if (SerialNumberTransactionValidationType == 0) {
                return true;
            } else if (SerialNumberTransactionValidationType == 2) {
                //quantity = count
                if (serialRequired == serialQuantity) return true;
                else {
                    navigator.notification.alert("Pick quantity should be equal to the number of Serials.", null, "", "OK");
                    return false;
                }
            } else if (SerialNumberTransactionValidationType == 3) {
                //show warning when not equal
                if (serialQuantity < serialRequired) {
                    navigator.notification.confirm("Picked quantity is not equal to the number of Serials. Do you want to continue?", function(button) {
                        if (button == 1) {
                         confirm = true;  
                          self.ProcessSerializeItem();
                      }
                     // confirm = true;
                    }, "Cancel Pick", "Yes,No");

                    if (confirm) {             
                      return true;  
                    } 
                    else {         
                        return false;
                    }
                }

                return true;
            } else {
                return true;
            }

            return false;
        },

        ValidateShippingAddress: function (item) {
            if (item.get("ShipToCountry") == "" || item.get("ShipToCountry") == null) {
                $('#textCountry').parent().addClass('has-error');
                return false;
            } else {
                $('#textCountry').parent().removeClass('has-error');
            }

            if (item.get("ShipToPostalCode") == "" || item.get("ShipToPostalCode") == null) {
                $('#textPostal').parent().addClass('has-error');
                return false;
            } else {
                $('#textPostal').parent().removeClass('has-error');
            }

            if (item.get("ShipToCity") == "" || item.get("ShipToCity") == null) {
                $('#textCity').parent().addClass('has-error');
                return false;
            } else {
                $('#textCity').parent().removeClass('has-error');
            }

            //if (item.get("ShipToCounty") == "" || item.get("ShipToCounty") == null) {
            //    $('#textCounty').parent().addClass('has-error');
            //    return false;
            //} else {
            //    $('#textCounty').parent().removeClass('has-error');
            //}

            if (item.get("ShipToState") == "" || item.get("ShipToState") == null) {
                $('#textState').parent().addClass('has-error');
                return false;
            } else {
                $('#textState').parent().removeClass('has-error');
            }

            if (item.get("ShipToAddress") == "" || item.get("ShipToAddress") == null) {
                $('#textAreaAddress').parent().addClass('has-error');
                return false;
            } else {
                $('#textAreaAddress').parent().removeClass('has-error');
            }

            if (item.get("ShipToPhone") == "" || item.get("ShipToPhone") == null) {
                $('#textPhone').parent().addClass('has-error');
                return false;
            } else {
                $('#textPhone').parent().removeClass('has-error');
            }
            
            if (item.get("ShipToAddressType") == "" || item.get("ShipToAddressType") == null) {
                $('#buttonAddressType').css('border-color', '#d2322d');
                return false;
            } else {
                $('#buttonAddressType').css('border-color', 'transparent');
            }

            return true;
        },

        ValidateShippingInfo: function (item) {
            if (item.get("CarrierCode") == "" || item.get("CarrierCode") == null) {
                return false;            
            }

            if (item.get("CarrierDescription") != "Manual") {
                if (item.get("ServiceCode") == "" || item.get("ServiceCode") == null) {
                    return false;
                }
            }

            if (item.get("CarrierDescription") == "Manual") {
                if (item.get("TrackingNumber") == "" || item.get("TrackingNumber") == null) {
                    return false;
                }
            }

            if (item.get("ShippingMethodCode") == "" || item.get("ShippingMethodCode") == null) {

                return false;
            }
            if (item.get("CarrierDescription") != "Manual") {
                if (item.get("PackagingCode") == "" || item.get("PackagingCode") == null) {
                    return false;
                }
            }

            return true;
        },

        WireCardEvents: function (skippedItemID, isSkippedItem) {
            var self = this;
            
            if (isSkippedItem) {
                //Bin Manager
                if (Preference.PickIsPromptBinManager) {
                    Shared.AddRemoveHandler('#binColIcon' + skippedItemID, 'tap', function (e) { self.buttonBinManager_tap(e); });
                    Shared.AddRemoveHandler('#binCol' + skippedItemID, 'tap', function (e) { self.buttonBinManager_tap(e); });
                } else {
                    Shared.AddRemoveHandler('#binColIcon' + skippedItemID, 'tap', function (e) { self.RotateContainerCard(skippedItemID); });
                    Shared.AddRemoveHandler('#binCol' + skippedItemID, 'tap', function (e) { self.RotateContainerCard(skippedItemID); });
                }

                //Rotate Card
                Shared.AddRemoveHandler('#' + skippedItemID, 'tap', function () { self.RotateContainerCard(skippedItemID); });
            }
            else {
                //Bin Manager
                if (Preference.PickIsPromptBinManager) {
                    Shared.AddRemoveHandler('#binColIcon' + skippedItemID, 'tap', function (e) { self.buttonBinManager_tap(e); });
                    Shared.AddRemoveHandler('#binCol' + skippedItemID, 'tap', function (e) { self.buttonBinManager_tap(e); });
                } else {
                    Shared.AddRemoveHandler('#binColIcon' + skippedItemID, 'tap', function (e) { self.RotateContainerCard(""); });
                    Shared.AddRemoveHandler('#binCol' + skippedItemID, 'tap', function (e) { self.RotateContainerCard(""); });
                }

                //Rotate Card
                if (!$._data($('#currentCardContainer > div').get(0), 'events')) {
                    Shared.AddRemoveHandler('#currentCardContainer > div', 'tap', function () { self.RotateContainerCard(""); });
                }
            }

            //Skip Item
            if (Preference.PickIsAllowToSkipItems && !this.model.get("HasOnlyOneItem")) { Shared.AddRemoveHandler('#buttonSkipItem' + skippedItemID, 'tap', function () { self.SkipItem(); }); }
            else this.HideSkipButton(skippedItemID);
        },

        WireEvents: function () {
            var self = this;
            Shared.AddRemoveHandler('#buttonAddress', 'tap', function (e) { self.buttonAddress_tap(e); });
            Shared.AddRemoveHandler('#buttonEditDetails', 'tap', function (e) { self.buttonEditDetails_tap(e); });
            Shared.AddRemoveHandler('#buttonScanItem', 'tap', function (e) { self.buttonScanItem_tap(e); });
            Shared.AddRemoveHandler('#buttonMenu', 'tap', function (e) { self.buttonMenu_tap(e); });
            Shared.AddRemoveHandler('#buttonMore', 'tap', function (e) { self.buttonMore_tap(e); });
            Shared.AddRemoveHandler('#buttonPackOrder', 'tap', function (e) { self.buttonPackOrder_tap(e); });
            Shared.AddRemoveHandler('#buttonCounter', 'tap', function (e) { self.buttonCounter_tap(e); });
            Shared.AddRemoveHandler('#buttonBackBoxDetails', 'tap', function (e) { self.buttonBackBoxDetails_tap(e); });
            Shared.AddRemoveHandler('#buttonBackItemsRemaining', 'tap', function (e) { self.buttonBackItemsRemaining_tap(e); });
            Shared.AddRemoveHandler('#buttonBackItemRemSetting', 'tap', function (e) { self.buttonBackItemRemSetting_tap(e); });
            Shared.AddRemoveHandler('#buttonBackItemsSerial', 'tap', function (e) { self.buttonBackItemsSerial_tap(e); });
            Shared.AddRemoveHandler('#buttonBackPick', 'tap', function (e) { self.buttonBackPick_tap(e); });
            Shared.AddRemoveHandler('#buttonBackShippingAddress', 'tap', function (e) { self.buttonBackShippingAddress_tap(e); });
            Shared.AddRemoveHandler('#buttonBackSkippedItems', 'tap', function (e) { self.buttonBackSkippedItems_tap(e); });
            Shared.AddRemoveHandler('#buttonSkippedItemsSetting', 'tap', function (e) { self.buttonSkippedItemsSetting_tap(e); });
            Shared.AddRemoveHandler('#buttonScanSerial', 'tap', function (e) { self.buttonScanSerial_tap(e); });
            Shared.AddRemoveHandler('#serialClear', 'tap', function (e) { self.buttonSerialClear_tap(e); });

            Shared.AddRemoveHandler('#linkResidential', 'tap', function (e) { self.linkResidential_tap(e); });
            Shared.AddRemoveHandler('#linkCommercial', 'tap', function (e) { self.linkCommercial_tap(e); });
            Shared.AddRemoveHandler('#textCountry', 'tap', function (e) { self.textCountry_tap(e); });
            Shared.AddRemoveHandler('#textFreightRate', 'tap', function (e) { self.textFreightRate_tap(e); });
            Shared.AddRemoveHandler('#textPostal', 'tap', function (e) { self.textPostal_tap(e); });

            Shared.AddRemoveHandler('#buttonBackCheckList', 'tap', function (e) { self.buttonBackCheckList_tap(e) });
            Shared.AddRemoveHandler('#rowCarrierCode', 'tap', function (e) { self.rowCarrierCode_tap(e); });
            Shared.AddRemoveHandler('#rowPackagingType', 'tap', function (e) { self.rowPackagingType_tap(e); });
            Shared.AddRemoveHandler('#rowServiceType', 'tap', function (e) { self.rowServiceType_tap(e); });            
        }
    });
    return PickView;
});