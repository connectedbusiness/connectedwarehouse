/**
 * @author Interprise Solutions
 */
define([
	'jquery',
	'underscore',
	'backbone',
    'view/common/enum',
	'model/lookupcriteria',
    'model/binManager',
	'model/cartItem',
    'model/checkListItem',
	'model/receive',
	'collection/cart',
    'view/base/printer',
	'view/common/global',
	'view/common/service',
	'view/common/shared',
	'view/common/method',
    'view/common/preference',    
    'view/base/numericpad',
    'view/binManager/binManager',
    'view/lookup/itemLookup/itemLookup',
	'view/receive/cartItem',
    'view/receive/checkListItem',
	'text!template/receive/receive.tpl.html'

], function ($, _, Backbone, Enum,
	LookupCriteriaModel,BinManagerModel, CartItemModel, CheckListItemModel, ReceiveModel,
	CartCollection,
    Printer,
    Global, Service, Shared, Method, Preference,
	NumericPadView, BinManagerView, ItemLookupView, CartItemView, CheckListItemView, ReceiveTemplate) {

    var isFromRemainingItemSection = false;
    var isFromItemSettingSection = false;
    var isFromNumericPad = false;
     var serialQuantity = 0;
    var serialRequired = 0;
    var SerialNumberTransactionValidationType = 0;

    var ReceiveView = Backbone.View.extend({
        _receiveTemplate: _.template(ReceiveTemplate),

        events: {                        
            "keypress #textScanItem": "textScanItem_keypress",
            /*mark*/
            "keypress #textScanSerial": "textScanSerial_keypress",
            "webkitTransitionEnd .numericpad": "numericpad_webkitTransitionEnd",
        },            

        initialize: function () {
            Global.ApplicationType = "Receive";
        },

        buttonMenu_tap: function (e) {
            window.location.hash = "dashboard";
        },

        buttonBackCheckList_tap: function () {            
            $('li').removeClass('highlight');
            this.SwitchDisplay('page2')
        },

        buttonBackItemSetting_tap: function (e) {
            $('td').removeClass('highlight');
            this.currentItem = null;
            isFromItemSettingSection = false;
            this.SwitchDisplay('page1');
        },

        buttonBackItemRemSetting_tap: function (e) {
            $('td').removeClass('highlight');
            this.currentItem = null;            
            this.ShowItemsRemainingSection(true);
            this.SwitchDisplay('page1');
        },

        buttonBackItemsRemaining_tap: function (e) {          
            this.ShowItemsRemainingSection(false);
        },                        

        /*mark*/
         buttonBackItemsSerial_tap: function(e) {
            this.ShowSerialSection(false);
        },

        /*mark*/
         buttonScanSerial_tap: function (e) {
            this.ScanSerial();
        },

        /*mark*/
        buttonSerialClear_tap: function (e) {
            $('#textScanSerial').val('');
            $('#textScanSerial').focus();
        },

         /*mark*/
         textScanSerial_keypress: function(e) {
            if (e.keyCode === 13) this.ScanSerial();
        },

        buttonBackReceive_tap: function (e) {            
            var self = this;

            $('#completedSection').removeClass('section-show').removeClass("bounceInDown").addClass("bounceOutUp");
            setTimeout(function () { self.GoToMenu(); }, 300);
        },

        buttonCancelRemoveItems_tap: function (e) {
            Shared.RemoveCheckedItems(this.itemsForReceive);
        },

        buttonComplete_tap: function (e) {
            if (!this.HasOpenTransactions()) Shared.NotifyError("There are no items to receive.");
            else {
                if (this.model.get('Counter') != 0) {
                    var self = this;
                    navigator.notification.confirm("There are still remaining items. Do you want to continue?", function (button) {
                        if (button == 1) self.ReceivePurchaseOrder();
                        else {
                        for(var i=0; i<serialQuantity; i++) {
                            self.serialCollection.pop();
                        }
                    }
                    }, "Complete Receive", "Yes,No");
                }
                else {
                    this.ReceivePurchaseOrder();
                }
            }
        },

        buttonCounter_tap: function (e) {            
            this.ShowItemsRemainingSection(true);
        },

        buttonMore_tap: function (e) {
            $('#completedSection').removeClass('section-show').removeClass("bounceInDown").addClass("bounceOutUp");
            setTimeout(function () { window.location.hash = "receivelookup"; }, 300);
        },

        buttonRemove_tap: function (e) {
            this.RemoveItemFromCart();
        },

        buttonScanItem_tap: function (e) {
            this.ScanItem();
        },

        buttonPrintReport_tap: function (e) {
            this.PrintReceiveLabel()
        },

        buttonRemoveItems_tap: function (e) {
            this.RemoveSelectedItems();
        },

        buttonRePrintReport_tap: function (e) {
            this.ShowReceiveLabelReport(this.PurchaseReceipt);
        },

        buttonBackFS_tap: function (e) {
            this.ReturnFromReport();
        },       
        
        rowQty_tap: function (e) {
            if (Preference.ReceiveIsPromptForQty) {
                isFromItemSettingSection = true;
                this.ShowNumericPad($("#textQuantity").text());
            }
        },

        rowUnitMeasure_tap: function (e) {
            this.$('#rowUnitMeasure').addClass('highlight');
            this.SetCheckListNavTitle('unit measures');
            this.SwitchDisplay('page3');
            this.LoadCheckListLookup(Enum.ListMode.UM);            
        },

        rowBinLocation_tap: function (e) {
            this.ShowBinManagerSection(this.currentItem, true);
        },

        textScanItem_keypress: function (e) {
            if (e.keyCode === 13) {
                this.ScanItem();
            }
        },

        Animate: function (isAnimate, templateBody) {
            if (this.spinner == null) {
                this.spinner = new Spinner();
            }

            this.isAnimate = isAnimate;

            if (isAnimate) {
                var target = document.getElementById(templateBody);
                this.spinner.spin(target);
            }
            else {
                this.spinner.stop();
            }
        },

        AnimateCompleteButton: function (isAnimate) {
            if (isAnimate) this.$('#buttonComplete').text('receiving...');
            else this.$('#buttonComplete').text('complete');
        },

        AnimateItemSetting: function (isAnimate) {
            this.Animate(isAnimate, "itemSettingBody");
            this.$("#itemSettingList").prop('aria-disabled', isAnimate);
            this.$("#buttonRemove").prop('disabled', isAnimate);
        },

        AnimateReceive: function (isAnimate) {
            this.ProgressScreen = Shared.ShowProgress(this.ProgressScreen, isAnimate, "itemMainSlider", true);
        },

        AddItemToCart: function (item) {
            item.set({
                RowNumber: this.itemsForReceive.length + 1,
                IsItemsRemaining: false
            });
            this.itemsForReceive.add(item);
            this.RenderItem(this, item);
            this.myScroll = Shared.LoadiScroll(this.myScroll, "Receive");

            Shared.BeepSuccess();
            
            if (Preference.ReceiveIsPromptForQty) {
                if (this.currentItem.model.get('QuantityToScan') > 1) {
                    if (SerialNumberTransactionValidationType > 1 && this.currentItem.model.get("SerializeLot") == "Serial") $('#numEnter').text('continue');
                    else  $('#numEnter').text('enter');
                    this.ShowNumericPad(this.currentItem.model.get('QuantityToScan'));
                }
                else {
                    this.currentItem.model.set({ Quantity: 1, QuantityScanned: 1 });
                    if (Preference.ReceiveIsPromptBinManager) this.ShowBinManagerSection(item, false);
                    this.UpdateCounter(1);
                    this.UpdateTotalItems(1);
                    this.UpdateItemSerial(this.currentItem); 
                }
            } else {                
                if (Preference.ReceiveIsPromptBinManager) this.ShowBinManagerSection(item, false);
                else {
                    this.ItemLookupView.SlideDownItemLookup();
                    this.NumericPadView.SlideDownNumericPad();
                }
                    this.UpdateItemSerial(this.currentItem); 
                    this.ChangeItemQuantity(item, 1);
            }

            
        },

        AddItemToRemainingItems: function (criteria, unitMeasureCode) {
            if (criteria) {
                var item = Shared.FindItem(this.itemsForReceive, criteria, unitMeasureCode);

                if (item) {
                    this.$('#' + item.get('RemainingItemID')).parent().show();
                    this.availableItems.add(item);
                }
            }
        },

        ChangeItemQuantity: function (item, qty) {
            var qtyToAdd = 0;
            var maxQty = item.get('QuantityToScan');
            var qtyScanned = item.get('QuantityScanned');

            if (!isFromItemSettingSection) {
                qtyToAdd = Shared.ChangeItemQuantity(item, qty, 3, "add")
            }
            else {
                qtyToAdd = Shared.ChangeItemQuantity(item, qty, 3, "replace")
                var qtyLeft = item.get('QuantityLeft');
                if (!(qtyToAdd == maxQty) && !(qtyToAdd > maxQty) && !(qtyToAdd == 0) && !(qtyLeft == 0)) {
                    if (item instanceof Backbone.Model) {
                        this.AddItemToRemainingItems(item.get("ItemCode"), item.get("UnitMeasureCode"))
                    } else this.AddItemToRemainingItems(item.model.get("ItemCode"), item.model.get("UnitMeasureCode"))

                }
                else {
                    if (item instanceof Backbone.Model) {
                        this.RemoveItemRemaining(item.get("ItemCode"), item.get("UnitMeasureCode"))
                    } else this.RemoveItemRemaining(item.model.get("ItemCode"), item.model.get("UnitMeasureCode"))
                }
                if (!(qtyScanned == maxQty)) {
                    if ((!(qtyScanned > maxQty)) || (maxQty - qtyScanned) < maxQty) {
                        if (item instanceof Backbone.Model) {
                            this.AddItemToRemainingItems(item.get("ItemCode"), item.get("UnitMeasureCode"))
                        } else this.AddItemToRemainingItems(item.model.get("ItemCode"), item.model.get("UnitMeasureCode"))
                    }   
                }
            }
            this.UpdateTotalItems(qtyToAdd);
            if (qtyToAdd < 0) {
                if (qtyToAdd + qtyScanned >= maxQty) { qtyToAdd =0; }
                else {
                    qtyToAdd = maxQty - (qtyToAdd + qtyScanned);
                    qtyToAdd = qtyToAdd * -1;
                }
            } else {
                if (qtyScanned >= maxQty) { qtyToAdd = 0; }
                else if (qtyToAdd + qtyScanned > maxQty) { qtyToAdd = maxQty - qtyScanned; }
            }
            this.UpdateCounter(qtyToAdd);
        },

         /*mark*/
         CheckSerialExist: function(serialLotNumber, currentItem) {
            var itemLookup = new LookupCriteriaModel();
            var item = currentItem;
            var serialLot = serialLotNumber;
            var serialExist = false;
            var self = this;

            self.serialCollection.each(function(serial) {
                if (serial.get("SerialLotNumber") == serialLotNumber) {
                    serialExist = true;
                    return;
                }
            });
            if (serialExist) return true;

            itemLookup.url = Global.ServiceUrl + Service.PRODUCT + Method.ISPURCHASEITEMSERIALEXIST + "serialLotNumber=" + serialLotNumber;

            this.AnimateReceive(true);
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
                                ItemCode: item.model.get('ItemCode'),
                                LineNum: item.model.get('LineNum')
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

        GetItemByUPC: function (upcCode) {            
            var items = Shared.FindItems(this.availableItems, upcCode);            

            if (items && items.length > 0)
                if (items.length > 1) this.ShowItemLookup(items.models);
                else this.UpdateCart(items.models[0]);
            else {
                Shared.NotifyError("There are no more items.");
                Shared.BeepError();
            } 
        },

        GoToMenu: function () {
            if (this.HasOpenTransactions()) {
                navigator.notification.confirm("There are items to process. Are you sure you want to cancel?", function (button) {
                    if (button == 1) window.location.hash = "receivelookup";
                }, "Cancel Receive", "Yes,No");
            }
            else {
                window.location.hash = "receivelookup";
            }
        },

        HasOpenTransactions: function () {
            if (this.itemsForReceive && this.itemsForReceive.length > 0) return true;
            return false;
        },

        HasRemainingItems: function(item) {
            var quantityToScan = item.get('QuantityToScan') - item.get('QuantityScanned');
            if (quantityToScan <= 0) return false;
            return true;
        },

        HighLightListItem: function (itemView) {
            this.$('.listitem-1').addClass('listitem-1').removeClass('listitem-2');
            this.$('.listitem-2').addClass('listitem-1').removeClass('listitem-2');
            Shared.HighLightItem(itemView.cid, "CheckList");
            this.$('#listItem' + itemView.model.get('ViewID')).removeClass('listitem-1').addClass('listitem-2');
        },

        InitializeChildViews: function () {
            this.InitializeModel();
            this.InitializeAvailableItems();
            this.InitializeItemsForReceive();
            /*mark*/
            this.InitializeSerialCollection();
            this.LoadReceive();            
            this.WireEvents();
            this.InitializeNumericPad();
            this.InitializeItemLookup();
            this.LoadiScroll();
            Shared.Focus('#textScanItem');
        },

        InitializeModel: function () {
            var purchaseOrderCode = Global.TransactionCode;

            this.model = new ReceiveModel();

            this.model.set({
                PurchaseOrderCode: purchaseOrderCode,
                Counter: 0,
                TotalItems: 0,
                FeatureID: 'Receive',
                WarehouseCode: Preference.DefaultLocation
            });

            this.$el.html(this._receiveTemplate(this.model.toJSON()));
        },        

        InitializeAvailableItems: function () {
            if (this.availableItems) {
                this.availableItems.reset();
            }
            else {
                this.availableItems = new CartCollection();                
            }
        },        

        InitializeItemLookup: function () {
            var self = this;
            this.ItemLookupView = new ItemLookupView();
            this.$('#itemLookupContainer').html(this.ItemLookupView.render());
            this.ItemLookupView.InitializeChildViews();
            this.ItemLookupView.on("itemSelected", function (item) {
                self.UpdateCart(item);
                $('#receiveHeader').show();
            });
        },

        InitializeItemSetting: function () {
            var itemDescription =  this.currentItem.model.get('ItemDescription');
            if (isFromRemainingItemSection) {
                $('#remSettingsItemCode').text(this.currentItem.model.get('ItemCode'));
                $('#remSettingsItemName').text(this.currentItem.model.get('ItemName'));
                // $('#remSettingsItemDesc').text(this.currentItem.model.get('ItemDescription'));
                $('#remSettingsUPCCode').text(Shared.ConvertNullToEmptyString(this.currentItem.model.get('UPCCode')));
                $('#remSettingsQuantity').text(this.currentItem.model.get('Quantity'));
                $('#remSettingsFreeStock').text(this.currentItem.model.get('FreeStock'));
                $('#remSettingsRemUnitMeasureCode').text(this.currentItem.model.get('UnitMeasureCode'));
                if (itemDescription.length > 20) {
                       this.$('#rowRemDesc').html("<a>Description<br><span style='white-space:normal'>" + itemDescription  + "</span></a>")
                 }
                 else {
                    this.$('#rowRemDesc').html("<a><span class='pull-right'>" + itemDescription  + "</span>Description</a>")
                 }
            }
            else {
                isFromItemSettingSection = true;
                $('#textItemCode').text(this.currentItem.model.get('ItemCode'));
                $('#textItemName').text(this.currentItem.model.get('ItemName'));
                // $('#textItemDesc').text(this.currentItem.model.get('ItemDescription'));
                $('#textUPCCode').text(Shared.ConvertNullToEmptyString(this.currentItem.model.get('UPCCode')));
                $('#textQuantity').text(this.currentItem.model.get('Quantity'));
                $('#textFreeStock').text(this.currentItem.model.get('FreeStock'));
                $('#textUnitMeasureCode').text(this.currentItem.model.get('UnitMeasureCode'));
                $('#textBinLocation').text(this.currentItem.model.get('BinLocationName'));
                 if (itemDescription.length > 20) {
                       this.$('#rowDesc').html("<a>Description<br><span style='white-space:normal'>" + itemDescription  + "</span></a>")
                 }
                 else {
                    this.$('#rowDesc').html("<a><span class='pull-right'>" + itemDescription  + "</span>Description</a>")
                 }
            }
        },

        InitializeItemsForReceive: function () {
            if (this.itemsForReceive) {
                this.itemsForReceive.reset();
            }
            else {
                this.itemsForReceive = new CartCollection();                
            }
        },

        InitializeNumericPad: function () {
            var self = this;
            var view = new NumericPadView();
            this.NumericPadView = new NumericPadView();
            this.$('#numericPadContainer').html(view.render());

            view.WireNumericPadEvents();
            view.off('closenumericpad', function (e) {
                $('#receiveHeader').show();                
                if (isFromItemSettingSection) {
                    self.ItemLookupView.SlideDownItemLookup();
                }
                else {
                    var qtyScanned = self.currentItem.model.get("QuantityScanned");
                    if (!qtyScanned == 0) {
                        self.ItemLookupView.SlideDownItemLookup();
                    }
                    else {
                        self.currentItem.model.set({
                            Quantity: 1,
                            QuantityScanned: 1,
                        })
                        self.UpdateTotalItems(1);
                        self.UpdateCounter(1);
                        if (Preference.StockIsPromptBinManager) self.ShowBinManagerSection(self.currentItem.model, false);
                        else {
                            self.ItemLookupView.SlideDownItemLookup();
                        }
                    }
                }
                isFromItemSettingSection = false;
                Shared.Focus('#textScanItem');
            });
            view.on('closenumericpad', function (e) {
                $('#receiveHeader').show();
                if (isFromItemSettingSection) {
                    self.ItemLookupView.SlideDownItemLookup();
                }
                else {
                    var qtyScanned = self.currentItem.model.get("QuantityScanned");
                    if (!qtyScanned == 0) {
                       self.ItemLookupView.SlideDownItemLookup();
                    }
                    else {
                        self.currentItem.model.set({
                            Quantity: 1,
                            QuantityScanned: 1,
                        })
                        self.UpdateTotalItems(1);
                        self.UpdateCounter(1);
                        if (Preference.StockIsPromptBinManager) self.ShowBinManagerSection(self.currentItem.model, false);
                        else {
                            self.ItemLookupView.SlideDownItemLookup();
                        }
                    }
                }
                isFromItemSettingSection = false;
                Shared.Focus('#textScanItem');
            });
            view.off('quantitychange', function (numericPadCriteria) {
                var qtyScanned = self.currentItem.model.get("QuantityScanned");
                self.ChangeItemQuantity(self.currentItem.model, numericPadCriteria.NumericPadValue);
               
                $('#receiveHeader').show();
                if (qtyScanned == 0) {
                    if (Preference.ReceiveIsPromptBinManager && !isFromItemSettingSection) self.ShowBinManagerSection(self.currentItem.model, false);
                }
                self.ItemLookupView.SlideDownItemLookup();
                view.SlideDownNumericPad();
                Shared.Focus('#textScanItem');
                isFromNumericPad = false;
            });
            view.on('quantitychange', function (numericPadCriteria) {
                var qtyScanned = self.currentItem.model.get("QuantityScanned");
                self.ChangeItemQuantity(self.currentItem.model, numericPadCriteria.NumericPadValue);
             
                $('#receiveHeader').show();
                if (qtyScanned == 0) {
                    if (Preference.ReceiveIsPromptBinManager && !isFromItemSettingSection) self.ShowBinManagerSection(self.currentItem.model, false);
                }
                self.ItemLookupView.SlideDownItemLookup();
                view.SlideDownNumericPad();
                Shared.Focus('#textScanItem');
                isFromNumericPad = false;
            });
        },

        InitializePurchaseOrder: function (receive) {
            var poDate = Shared.FormatDate(receive.PODate, "L");
            this.model.set({
                PurchaseOrderCode: receive.PurchaseOrderCode,
                SupplierCode: receive.SupplierCode,
                Name: receive.SupplierName,
                Status: receive.OrderStatus,
                Date: poDate
            });
        },

        /*mark*/
         InitializeSerialCollection: function () {
            SerialNumberTransactionValidationType = Preference.SupplierSerialNumberTransactionValidationType;
            if (SerialNumberTransactionValidationType == null || SerialNumberTransactionValidationType <= 1 || SerialNumberTransactionValidationType > 3) {
                SerialNumberTransactionValidationType = 0;
            }

            if (this.serialCollection) this.serialCollection.reset();
            else this.serialCollection = new CartCollection();
        },


        LoadCheckListLookup: function (listMode) {
            var lookupModel = new LookupCriteriaModel();
            var warehouseCode = Preference.DefaultLocation;
            var self = this;            
            var itemCode = "";

            if (this.currentItem != null && this.currentItem != "undefined") {
                itemCode = this.currentItem.model.get('ItemCode');
            }

            if (listMode != null) {
                switch (listMode) {                    
                    case Enum.ListMode.UM:
                        lookupModel.set({ Criteria: null });
                        lookupModel.url = Global.ServiceUrl + Service.PRODUCT + Method.UNITMEASURECODELOOKUP + "50/" + itemCode;
                        break;
                }

                this.AnimateItemSetting(true);
                lookupModel.save(null, {
                    success: function (model, response, options) {
                        self.AnimateItemSetting(false);
                        if (!model.get("hasError")) {
                            self.RenderCheckListLookup(response, listMode);
                        }
                    },
                    error: function (model, error, response) {
                        self.AnimateItemSetting(false);                        
                    }
                });
            }
        },

        LoadItemSetting: function (item) {
            Shared.HighLightItem(item.model.get('TapeItemID'), "Default");
            this.currentItem = item;            
            this.InitializeItemSetting();
            this.SwitchDisplay('page2');
            this.ShowFreeStockItemSetting();
        },

        LoadiScroll: function () {
            var contentID = '#containerSettings';

            if (this.myScroll) {
                this.myScroll.refresh();
                return this.myScroll;
            }
            else {
                return new IScroll(contentID, { vScrollbar: true, scrollY: true });
            }
        },

        LoadReceive: function () {
            var purchaseOrderCode = Global.TransactionCode;

            if (purchaseOrderCode) {
                var receiveModel = new ReceiveModel();
                var self = this;

                receiveModel.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADRECEIVEITEMS;

                receiveModel.set({
                    PurchaseOrderCode: purchaseOrderCode,
                    IsShowFreeStock: Preference.ReceiveIsShowQtyOnHand,
                    UseCbeImage: Preference.UseCbeImage,
                    WebSiteCode: Preference.WebSiteCode
                });

                receiveModel.save(null, {
                    success: function (model, response, options) {
                        if (!model.get("hasError")) {
                            self.PrepareItemsToReceive(response);
                        }
                    }
                });
            }
        },

         numericpad_webkitTransitionEnd: function (e) {
            if ($('.numericpad').hasClass('slideInUp')) { }
            else {
                if (this.currentItem) {
                  this.UpdateItemSerial(this.currentItem); 
                }
            }
        },

        PrepareItemsToReceive: function (purchaseOrderGroup) {
            if (this.ValidateOrder(purchaseOrderGroup)) {
                var purchaseOrder = purchaseOrderGroup.PurchaseOrder;

                this.InitializePurchaseOrder(purchaseOrder);
                this.PopulateCart(purchaseOrderGroup.PurchaseOrderDetails);
                this.RenderRemainingItems();
                this.UpdateCounter(0);
                //this.RenderRemainingItems();
            }
            else {
                navigator.notification.alert("There are no items to receive. Please select another order.", null, "Receive", "OK");
                window.location.hash = "receivelookup";
            }
        },

        PopulateCart: function (items) {
            this.availableItems.reset();
            var self = this;
            var totalQty = 0;

            _.each(items, function (current) {
                var qtyLeft = (current.QuantityOrdered - current.QuantityReceived);
                var binLocationName;
                if (current.BinLocationName == null) { binLocationName = "No Bin"; }
                else { binLocationName = current.BinLocationName; }

                if (qtyLeft != 0) {
                    var cartItem = new CartItemModel();
                    var counter = self.availableItems.length + 1;

                    /*mark*/
                    cartItem.set({
						BinLocationCode: current.BinLocationCode,
                        BinLocationName: binLocationName,
                        FreeStock: current.FreeStock,
                        ItemCode: current.ItemCode,
                        ItemID: counter,
                        ItemName: current.ItemName,
                        ItemType: current.ItemType,
                        ItemDescription: current.ItemDescription,
                        LineNum: current.LineNum,
                        PurchaseOrderCode: current.PurchaseOrderCode,
                        Quantity: qtyLeft,
                        QuantityLeft: current.QuantityLeft,
                        QuantityOrdered: current.QuantityOrdered,
                        QuantityReceived: current.QuantityReceived,
                        SerializeLot: current.SerializeLot,
                        QuantityScanned: 0,
                        QuantityToScan: qtyLeft,
                        RemainingItemID: "REM" + counter,
                        RowNumber: counter,
                        TapeItemID: "ITEM" + counter,
                        UPCCode: current.UPCCode,
                        UnitMeasureCode: current.UnitMeasure,                        
                        CartItemImage: Shared.GetImageUrl(Enum.ImageType.CartItem, current.ItemIconFile)
                    });

                    self.availableItems.add(cartItem);
                    totalQty += qtyLeft;
                };
            });

            this.model.set({
                Counter: totalQty,
                HasItemsToReceive: (totalQty > 0)
            });
        },

        ShowReceiveLabelReport: function (purchaseReceipt) {
            this.PurchaseReceipt = purchaseReceipt;

            if (this.PurchaseReceipt != null) {
                if (this.PurchaseReceipt.ReceiveLabelImageFile != null) {
                    var imgSrc = Shared.GetImageUrl(Enum.ImageType.ReceiveLabel, this.PurchaseReceipt.ReceiveLabelImageFile);
                    Shared.LoadImage('imageReceiveLabel', imgSrc, '', function () {
                        this.fsiScroll = Shared.LoadPinchiScroll(this.fsiScroll, '#containerTableFullScreenBody');
                    });

                    this.$('#fullScreenSection').addClass('slideInUp').removeClass('slideOutDown');
                    $('.slideInUp').css('-webkit-transition', 'all 0.2s ease 0s');

                    return true;
                }
            }

            this.ShowCompletedSection(purchaseReceipt);
        },

        PrintReceiveLabel: function () {
            var self = this;

            this.AnimateReceive(true);

            Printer.PrintReceiveLabelReport(this.PurchaseReceipt, {
                success: function (model, response, options) {
                    self.ReturnFromReport();
                },
                error: function (model, exception, response) {
                    self.ReturnFromReport();
                },
                progress: this.ProgressScreen
            });
        },

        ReceivePurchaseOrder: function () {
            var receiveModel = new ReceiveModel();
            var self = this;

            receiveModel.url = Global.ServiceUrl + Service.PRODUCT + Method.CREATERECEIVEORDER;

            this.itemsForReceive.each(function (item) {
                item.set({ QuantityReceived: item.get('QuantityScanned') });
            });

           /*mark*/
            receiveModel.set({
                PurchaseOrder: this.model,
                PurchaseOrderDetails: this.itemsForReceive,
                SerialLotNumbers: this.serialCollection
            });

            this.AnimateReceive(true);
            this.AnimateCompleteButton(true);
            receiveModel.save(null, {
                success: function (model, response, options) {                    
                    if (!model.get("hasError")) {
                        self.ShowReceiveLabelReport(response);
                    }
                    self.AnimateCompleteButton(false);
                },
                progress: this.ProgressScreen
            });
        },

        

        RenderCheckListLookup: function (list, listMode) {
            if (list != null) {
                var self = this;
                this.$('#cartCheckList tbody').html('');
                switch (listMode) {
                    case Enum.ListMode.UM:
                        if (list.UnitMeasures.length > 0) {
                            _.each(list.UnitMeasures, function (current) {
                                var checkListItemModel = new CheckListItemModel();
                                checkListItemModel.set({
                                    ListItemTitle: current.UnitMeasureCode,
                                    ListItemRow1: "Description: " + current.UnitMeasureDescription,
                                    ListItemRow2: "Quantity: " + current.UnitMeasureQty,
                                    UnitMeasureCode: current.UnitMeasureCode,
                                    UnitMeasureDescription: current.UnitMeasureDescription,
                                });

                                var checklistItemView = new CheckListItemView({ model: checkListItemModel });
                                self.$('#cartCheckList tbody').append(checklistItemView.render());

                                if (self.currentItem.model.get('UnitMeasureCode') == checklistItemView.model.get('UnitMeasureCode')) {
                                    self.HighLightListItem(checklistItemView);
                                }
                                Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {                                    
                                    self.UpdateItemSetting(checklistItemView, listMode);
                                    self.SwitchDisplay('page2');
                                });
                            });
                        }
                        break;
                }
                this.iScrollCheckList = Shared.LoadiScroll(this.iScrollCheckList, "CheckList");
            }
        },

        RemoveItemFromCart: function () {
            var self = this;
            navigator.notification.confirm("Are you sure you want to remove this item?", function (button) {
                if (button == 1) {
                    if (self.currentItem != null) {
                        var model = self.currentItem.model;

                        self.itemsForReceive.remove(model);
                        self.currentItem.remove();

                        self.$('#' + model.get('RemainingItemID')).parent().show();
                        self.availableItems.add(self.currentItem.model);

                        //Changed from QuantityScanned to QuantityOrdered, cause of wrong #textCounter if QuantityScanned of removed item is more than QuantityOrdered
                        self.UpdateCounter(self.currentItem.model.get('QuantityOrdered') * -1);
                        self.UpdateTotalItems(self.currentItem.model.get('QuantityScanned') * -1);

                        self.currentItem.model.set({
                            Quantity: self.currentItem.model.get('QuantityReceived'),
                            QuantityScanned: 0
                        });

                        self.RefreshRowNumber(self.itemsForReceive);
                        self.myScroll = Shared.LoadiScroll(self.myScroll, "Receive");
                        self.SwitchDisplay('page1');
                    }
                }
            }, "Remove from cart.", "Yes,No");
        },

        RemoveItemRemaining: function (criteria, unitMeasureCode) {
            if (criteria) {
                var item = Shared.FindItem(this.availableItems, criteria, unitMeasureCode);

                if (item) {
                    this.$('#' + item.get('RemainingItemID')).parent().hide();
                    this.availableItems.remove(item);
                }
            }
        },

        RemoveItemRemainingByLineNum: function (criteria, unitMeasureCode, lineNum) {
            if (criteria) {
                var item = Shared.FindItem(this.availableItems, criteria, unitMeasureCode, lineNum);

                if (item) {
                    this.$('#' + item.get('RemainingItemID')).parent().hide();
                    this.availableItems.remove(item);
                }
            }
        },

        RemoveSelectedItems: function () {
            var self = this;

            navigator.notification.confirm("Are you sure you want to remove these item/s?", function (button) {
                if (button == 1) {
                    var itemsToDelete = new CartCollection();

                    _.each(self.itemsForReceive.models, function (current) {
                        if (current.get("IsChecked")) itemsToDelete.add(current);
                    });

                    while (itemsToDelete.models.length > 0) {
                        self.itemsForReceive.remove(itemsToDelete.models[0]);

                        $('#' + itemsToDelete.models[0].get('RemainingItemID')).parent().show();
                        self.availableItems.add(itemsToDelete.models[0]);
                        
                        var quantityOrdered = itemsToDelete.models[0].get('QuantityOrdered');
                        var quantityScanned = itemsToDelete.models[0].get('QuantityScanned');
                        var counter = quantityScanned > quantityOrdered ? quantityOrdered : quantityScanned;

                        self.UpdateCounter(counter * -1);
                        self.UpdateTotalItems(quantityScanned * -1);

                        itemsToDelete.models[0].set({
                            Quantity: itemsToDelete.models[0].get('QuantityReceived'),
                            QuantityScanned: 0
                        });
                        $('#' + itemsToDelete.models[0].get('TapeItemID')).parent().remove();

                        itemsToDelete.remove(itemsToDelete.models[0]);
                    }

                    self.RefreshRowNumber(self.itemsForReceive);
                    self.myScroll = Shared.LoadiScroll(self.myScroll, "Receive");
                    $('#slideFooter').removeClass("slideInUpFooter").addClass("slideOutDownFooter");
                }
            });
        },

        RenderItem: function (self, itemModel) {
            var cart = self.$("#cartListReceive tbody");
            var itemView = new CartItemView({ model: itemModel });

            if (itemModel.get('QuantityScanned')) itemModel.set({ Quantity: itemModel.get('QuantityScanned') });            
            cart.append(itemView.render());

            Shared.AddRemoveHandler('.' + itemView.model.get('TapeItemID') + "-itemcol-1", 'tap', function () {
                Shared.ToggleItemCheck(itemView.model);
                Shared.ShowRemoveFooter(self.itemsForReceive);
            });
            Shared.AddRemoveHandler('.' + itemView.model.get('TapeItemID') + "-itemcol-2", 'tap', function () { self.LoadItemSetting(itemView) });
            Shared.AddRemoveHandler('.' + itemView.model.get('TapeItemID') + "-itemcol-3", 'tap', function () { self.LoadItemSetting(itemView) });
            Shared.AddRemoveHandler('.' + itemView.model.get('TapeItemID') + "-itemcol-4", 'tap', function () { self.LoadItemSetting(itemView) });

            var onAttributeChanged = function () {
                var upcCode = itemView.model.get("UPCCode");
                if (!upcCode) upcCode = itemView.model.get('ItemCode');
                var itemCode = itemView.model.get('ItemCode');
                var tapeItemID = itemView.model.get('TapeItemID');
                var qty = $('#itemQty' + tapeItemID);
                var qtyRem = $('#itemQty' + itemView.model.get('RemainingItemID'));
                var um = $('#itemUM' + tapeItemID);
                var binLocation = $('#itemBinLocation' + tapeItemID);

                var settingQty = $('#textQuantity');
                var settingUM = $('#textUnitMeasureCode');
                var settingBinLocation = $('#textBinLocation');

                var newQty = itemView.model.get('Quantity');
                var newUM = itemView.model.get('UnitMeasureCode');
                var newBinLocation = itemView.model.get('BinLocationName');
                var qtyToScan = itemView.model.get('QuantityToScan') - itemView.model.get('QuantityScanned');

                if (qty.text() != newQty) qty.text(newQty);
                if (settingQty.text() != newQty) settingQty.text(newQty);

                if (binLocation.text() != newBinLocation) {
                    if (newBinLocation == "No Bin")
                    {
                        binLocation.css("font-style", "italic");
                        binLocation.text("< No Bin >");
                    }
                    else {
                    binLocation.text(newBinLocation);
                    binLocation.css("font-style", "normal");
                    }
                }
                else {
                    if (binLocation.text() == "No Bin") {
                        binLocation.css("font-style", "italic");
                        binLocation.text("< No Bin >");
                    }
                }
                if (settingBinLocation.text() != newBinLocation) settingBinLocation.text(newBinLocation);
                
                if (qtyRem != qtyToScan) {
                    if (qtyToScan > 0) qtyRem.text(qtyToScan);
                    else {
                        if (qtyToScan < 0) qtyToScan = 0;
                        qtyRem.text(qtyToScan);
                        self.RemoveItemRemaining(itemCode, itemView.model.get('UnitMeasureCode'));
                    }
                }

                if (um.text() != newUM) um.text(newUM);
                if (settingUM.text() != newUM) settingUM.text(newUM);                
            };

            itemView.model.off('change', onAttributeChanged);
            itemView.model.on('change', onAttributeChanged);            
            self.currentItem = itemView;
        },

          ScanSelectedItem: function (itemView) {
               var upcCode = itemView.model.get('UPCCode');
                var itemCode = itemView.model.get('ItemCode');
                if (upcCode=='' || upcCode == null) upcCode = itemCode;
               //  var unitMeasureCode = itemView.model.get('UnitMeasureCode');
               //  var selectedItem = Shared.FindItem(this.itemCollection, itemCode, unitMeasureCode);
               //  this.CurrentItem = selectedItem;
               //  if (itemName !=currentItemName)
               //  {
               //      this.RenderItem(selectedItem,false);
               //  }
                this.$("#textScanItem").val(upcCode);
                this.ShowItemsRemainingSection(false);
                this.ScanItem();
    
          
        },

        RenderRemainingItems: function () {
            var self = this;            
            if (this.model.get('HasItemsToReceive')) {                
                this.$("#cartListItemsRemaining tbody").html("");
                if (this.availableItems && this.availableItems.models.length > 0) {
                    this.availableItems.each(function (item) {                        
                        if (item.get('Quantity') != 0) {
                            item.set({ IsItemsRemaining: true });
                            var itemView = new CartItemView({ model: item });
                            this.$("#cartListItemsRemaining tbody").append(itemView.render());                            
                            Shared.AddRemoveHandler('#buttonItemSetting' + itemView.model.get('RemainingItemID'), 'tap', function (event) {
                                self.LoadItemSetting(itemView)
                                $("#itemsRemainingSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
                                event.stopPropagation();
                            }); 


                              Shared.AddRemoveHandler('#' + itemView.model.get('RemainingItemID'), 'tap', function () {
                                self.ScanSelectedItem(itemView);
                            });                           
                        };
                    });
                };
            } else {
                navigator.notification.alert("There are no items to receive. Please select another order.", null, "Receive", "OK");
                window.location.hash = "receivelookup";
            };
        },

        RefreshRowNumber: function (collection) {
            if (collection && collection.length > 0) {
                var rowNumber = 0;
            var self = this;

                collection.each(function (item) {
                    rowNumber = rowNumber + 1;
                    self.$('#itemRow' + item.get("TapeItemID")).text(rowNumber);
            });
                }
        },

        ReturnFromReport: function () {
            this.ShowCompletedSection(this.PurchaseReceipt);
            this.$('#fullScreenSection').removeClass('slideInUp').addClass('slideOutDown');
            $('.slideOutDown').css('-webkit-transition', 'all 0.2s ease 0s');
        },

        SetCheckListNavTitle: function (title) {
            $("#checkListNavTitle").text(title);
        },

        ScanItem: function () {                                 
            var upcCode = this.$('#textScanItem').val();
            this.$('#textScanItem').val("");

            this.GetItemByUPC(upcCode);
        },

        ScanSerial: function(valueToCheck) {
            var valueToCheck = $("#textScanSerial").val().trim();
            if (valueToCheck == "") {
                $("#textScanSerial").focus();
                return;
            }

            $("#textScanSerial").val("");

            if (Preference.SupplierPreventDuplicateSerialNumber) {
                //check duplicate
                this.CheckSerialExist(valueToCheck, this.currentItem);
            } else {
                //BinManagerModel?? mali sequence sa define
                var serial = new BinManagerModel();
                serial.set({
                    DocumentCode: Global.TransactionCode,
                    SerialLotNumber: valueToCheck,
                    ItemCode: this.currentItem.model.get('ItemCode'),
                    LineNum: this.currentItem.model.get('LineNum')
                });
                this.serialCollection.add(serial);
                Shared.BeepSuccess();
                serialQuantity += 1;
                $("#serialScanned").text(serialQuantity);

                if (serialQuantity < serialRequired) Shared.Focus("#textScanSerial");
                else this.ShowSerialSection(false);
            }
        },

        ShowBinManagerSection: function (item, isUpdate) {
            var receiveDetailsCollection = this.itemsForReceive;
            var self = this;
            Global.ApplicationType = "Receive";
            this.BinManagerView = new BinManagerView();
            this.BinManagerView.CurrentItem = item;
            this.BinManagerView.IsUpdate = isUpdate;            

            this.$("#receiveHeader").hide();
            this.$("#binManagerSlider").removeClass("container slideOutDown").addClass("container slideInUp");

            this.BinManagerView.on("selectedBin", function (item) {
                if (item) {
                    if (isUpdate) this.UpdateBinLocation(item);
                    else {
                        this.ItemLookupView.SlideDownItemLookup();
                        if (Preference.ReceiveIsPromptForQty) this.NumericPadView.SlideDownNumericPad();
                    }
                }
                self.$("#receiveHeader").show();
            }, this);

            this.BinManagerView.on("deleteBin", function (binCode, binCollection, isDeleteAll) {
                Shared.RemoveBinFromItem(receiveDetailsCollection, binCode, binCollection, isDeleteAll)
                self.$("#receiveHeader").show();
            });

            this.$("#containerBinManager").html("");
            this.$("#containerBinManager").append(this.BinManagerView.Render());
            this.BinManagerView.InitializeChildViews();
        },
        
        ShowCompletedSection: function (response) {
            this.InitializeItemsForReceive();

            $('#completedSection').removeClass('section-close').removeClass("bounceOutUp").addClass('section-show').addClass("bounceInDown");
            if (response) this.$('#completedNavTitle').text(response.PurchaseReceiptCode);
        },

        ShowFreeStockItemSetting: function () {            
            if (Preference.ReceiveIsShowQtyOnHand) {
                $('#rowFreeStock').show();
                $('#rowRemFreeStock').show();
            }
            else {
                $('#rowFreeStock').hide();
                $('#rowRemFreeStock').hide();
            }
        },

        ShowItemLookup: function (items) {
            if (items) {
                this.ItemLookupView.RenderItems(items);
                $('#receiveHeader').hide();
                $('#itemLookupSection').addClass('slideInUp').removeClass('slideOutDown');
            }
        },

        ShowItemsRemainingSection: function (isShow) {
            if (isShow) {
                this.$('#textScanItem').blur();
                this.$('#receiveHeader').hide();
                $("#itemsRemainingSlider").removeClass("container-remaining slideOutDown").addClass("container-remaining slideInUp");
                this.itemRemainingiScroll = Shared.LoadiScroll(this.itemRemainingiScroll, 'ItemsRemaining');
                isFromRemainingItemSection = true;                
            }
            else {
                this.$('#receiveHeader').show();                
                $('#itemsRemainingSlider').removeAttr("style");
                $("#itemsRemainingSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
                isFromRemainingItemSection = false;
                Shared.Focus('#textScanItem');
            }
            this.LoadiScroll();
        },

        ShowNumericPad: function (qty) {
            $('#textboxQuantity').val(qty);
            $('#textScanItem').blur();
            $('#receiveHeader').hide();
            $('#buttonComplete').focus();
            $('.numericpad').addClass('slideInUp').removeClass('slideOutDown');
            isFromNumericPad = true;
        },

        ProcessSerializeItem: function() {
             $("#serialSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
             Shared.Focus('#textScanItem');
        },

         /*mark*/
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
                   /* if (this.currentItem) {
                        this.UpdateItemSerial(this.currentItem);
                    }*/

                   
                }
                else Shared.Focus('#textScanSerial');
            }
        },

        SwitchDisplay: function (page) {
            if (this.isAnimate) return false;

            switch (page) {
                case "page1":
                    if (isFromRemainingItemSection) {
                        Shared.SlideX('#itemsRemainingSlider', 0);
                    }
                    else {
                        Shared.SlideX('#itemMainSlider', 0);
                        Shared.Focus('#textScanItem');
                    }                    
                    break;                                    
                case "page2":
                    this.$('#textScanItem').blur();
                    if (isFromRemainingItemSection) {
                        Shared.SlideX('#itemsRemainingSlider', Global.ScreenWidth * -1);                     
                    }
                    else {
                        Shared.SlideX('#itemMainSlider', Global.ScreenWidth * -1);
                    }
                    $('td').removeClass('highlight');
                    break;
                case "page3":
                    Shared.SlideX('#itemMainSlider', Global.ScreenWidth * -2);
                    break;
            }
        },

        UpdateBinLocation: function (binView) {
            if (this.currentItem) {
                this.currentItem.model.set({
                    BinLocationCode: binView.model.get("BinLocationCode"),
                    BinLocationName: binView.model.get("BinLocationName")
                });
            }
        },

        UpdateCart: function (item) {
            if (item) {
                var upcCode = "";
                var itemCode = "";
                var unitMeasureCode = "";
                //var lineNum = "";

                if (item instanceof Backbone.Model) {
                    upcCode = item.get('UPCCode');
                    if (!upcCode) upcCode = item.get('ItemCode');
                    itemCode = item.get('ItemCode');
                    unitMeasureCode = item.get('UnitMeasureCode');
                    //lineNum = item.get('LineNum');
                } else {
                    upcCode = item.UPCCode;
                    if (!upcCode) upcCode = item.ItemCode;
                    itemCode = item.ItemCode;
                    unitMeasureCode = item.UnitMeasureCode;
                    //lineNum = item.get('LineNum');
                }
                var existingItem = Shared.FindItem(this.itemsForReceive, itemCode, unitMeasureCode);

                if (existingItem) {
                    this.UpdateItemQuantity(existingItem);
                }
                else this.AddItemToCart(item);
            }
        },


         UpdateItemSerial: function (item) {
            if (SerialNumberTransactionValidationType > 1 && item.model.get("SerializeLot") == "Serial") {
                var maxQty = 0
                if (Preference.ReceiveIsPromptForQty) maxQty = item.model.get("QuantityScanned");
                else maxQty = 1;
                serialRequired = maxQty; 
                this.ShowSerialSection(true);
            }
        },

        
        UpdateCounter: function (qty) {
            var counter = this.model.get('Counter');
            var textQty = "";

            counter -= qty;

            this.model.set({ Counter: counter });
            if (counter > 99) textQty = "99+";
            else textQty = counter;

            $('#textCounter').text(textQty);
            $('#textTotalItemsRemaining').text(counter);

            if (this.model.get('Counter') == 0) {
                this.$("#buttonCounter").removeClass('btn-danger').addClass('btn-nephritis');
            } else {                    
                this.$("#buttonCounter").removeClass('btn-nephritis').addClass('btn-danger');
            }
        },        

        UpdateItemSetting: function (itemView, listMode) {
            switch (listMode) {                
                case Enum.ListMode.UM:
                    this.currentItem.model.set({ UnitMeasureCode: itemView.model.get('UnitMeasureCode') });
                    break;
                case Enum.ListMode.BinManager:
                    this.currentItem.model.set({
                        BinLocationCode: itemView.model.get('BinLocationCode'),
                        BinLocationName: itemView.model.get('BinLocationName')
                    });
                    break;                
            }
            this.HighLightListItem(itemView);
        },

        UpdateItemQuantity: function (item) {
            Shared.BeepSuccess();


            var maxQty, qtyScanned;
            if (Preference.ReceiveIsPromptForQty) {
          
                if (item instanceof Backbone.Model) {
                    maxQty = item.get('QuantityToScan');
                    qtyScanned = item.get('QuantityScanned');
                }
                else {
                    maxQty = item.model.get('QuantityToScan');
                    qtyScanned = item.model.get('QuantityScanned');
                }

                this.currentItem = new CartItemView({ model: item });
                var qtyToScan = (maxQty - qtyScanned <= 0 ? 0 : maxQty - qtyScanned);
                 if (SerialNumberTransactionValidationType > 1 && item.model.get("SerializeLot") == "Serial") $('#numEnter').text('continue');
                 else  $('#numEnter').text('enter');
                this.ShowNumericPad(qtyToScan);
            }
            else {

                this.UpdateItemSerial(this.currentItem); 
                this.ChangeItemQuantity(item, 1);  
                this.ItemLookupView.SlideDownItemLookup();
            } 
        },

        UpdateTotalItems: function (qty) {
            var total = this.model.get('TotalItems');
            this.model.set({ TotalItems: total += qty });
            $('#textTotalItems').text(this.model.get('TotalItems'));
        },

        /*mark*/
         ValidateSerial: function() {
            var confirm;
            var self = this;

            if (SerialNumberTransactionValidationType == 0) {
                return true;
            } else if (SerialNumberTransactionValidationType == 2) {
                //quantity = count
                if (serialRequired == serialQuantity) return true;
                else {
                    navigator.notification.alert("Received quantity should be equal to the number of Serials.", null, "", "OK");
                    return false;
                }
            } else if (SerialNumberTransactionValidationType == 3) {
                //show warning when not equal
                if (serialQuantity < serialRequired) {
                    navigator.notification.confirm("Received quantity is not equal to the number of Serials. Do you want to continue?", function(button) {
                        if (button == 1) {
                          confirm = true;
                          self.ProcessSerializeItem();  
                        } 
                    }, "Receive Purchase Order", "Yes,No");

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

        ValidateOrder: function (purchaseOrderGroup) {
            return (purchaseOrderGroup
					&& purchaseOrderGroup.PurchaseOrderDetails && purchaseOrderGroup.PurchaseOrderDetails.length > 0
					&& purchaseOrderGroup.PurchaseOrder);
        },

        ValidateReceive: function () {
            var quantityOrdered = this.model.get("QuantityOrdered");
            var counter = this.model.get("Counter");
            var result = true;

            if (counter >= quantityOrdered) {
                navigator.notification.alert("There are no items to receive.", null, "Receive", "OK");
                return false;
            }
            
            if (result) {
                if (counter != 0) {
                    navigator.notification.confirm("There are still remaining items. Do you want to continue?", function (button) {
                        if (button == 1) return true;
                        else return false;
                    }, "Complete Receive", "Yes,No");
                }
            }

            return result;
        },

        WireEvents: function () {
            var self = this;
            Shared.AddRemoveHandler('#buttonBackCheckList', 'tap', function (e) { self.buttonBackCheckList_tap(e); });
            Shared.AddRemoveHandler('#buttonBackItemSetting', 'tap', function (e) { self.buttonBackItemSetting_tap(e); });
            Shared.AddRemoveHandler('#buttonBackItemRemSetting', 'tap', function (e) { self.buttonBackItemRemSetting_tap(e); });
            Shared.AddRemoveHandler('#buttonBackItemsRemaining', 'tap', function (e) { self.buttonBackItemsRemaining_tap(e); });
            Shared.AddRemoveHandler('#buttonBackFS', 'tap', function (e) { self.buttonBackFS_tap(e); });
            Shared.AddRemoveHandler('#buttonBackReceive', 'tap', function (e) { self.buttonBackReceive_tap(e); });
            Shared.AddRemoveHandler('#buttonCancelRemoveItems', 'tap', function (e) { self.buttonCancelRemoveItems_tap(e); });
            Shared.AddRemoveHandler('#buttonComplete', 'tap', function (e) { self.buttonComplete_tap(e); });
            Shared.AddRemoveHandler('#buttonCounter', 'tap', function (e) { self.buttonCounter_tap(e); });
            Shared.AddRemoveHandler('#buttonMenu', 'tap', function (e) { self.buttonMenu_tap(e); });
            Shared.AddRemoveHandler('#buttonMenuCompleted', 'tap', function (e) { self.buttonMenu_tap(e); });
            Shared.AddRemoveHandler('#buttonMore', 'tap', function (e) { self.buttonBackReceive_tap(e); });
            Shared.AddRemoveHandler('#buttonPrintFS', 'tap', function (e) { self.buttonPrintReport_tap(e); });
            Shared.AddRemoveHandler('#buttonRePrint', 'tap', function (e) { self.buttonRePrintReport_tap(e); });
            Shared.AddRemoveHandler('#buttonRemove', 'tap', function (e) { self.buttonRemove_tap(e); });
            Shared.AddRemoveHandler('#buttonRemoveItems', 'tap', function (e) { self.buttonRemoveItems_tap(e); });
            Shared.AddRemoveHandler('#buttonScanItem', 'tap', function (e) { self.buttonScanItem_tap(e); });
            Shared.AddRemoveHandler('#buttonBackItemsSerial', 'tap', function (e) { self.buttonBackItemsSerial_tap(e); });
            Shared.AddRemoveHandler('#buttonScanSerial', 'tap', function (e) { self.buttonScanSerial_tap(e); });
            Shared.AddRemoveHandler('#serialClear', 'tap', function (e) { self.buttonSerialClear_tap(e); });


            //Tentative
            //Shared.AddRemoveHandler('#rowUnitMeasure', 'tap', function (e) { self.rowUnitMeasure_tap(e); });
            Shared.AddRemoveHandler('#rowBinLocation', 'tap', function (e) { self.rowBinLocation_tap(e); })
            Shared.AddRemoveHandler('#rowQty', 'tap', function (e) { self.rowQty_tap(e); });

            $('#rowUnitMeasure i').hide();
        },
    });
    return ReceiveView;
});