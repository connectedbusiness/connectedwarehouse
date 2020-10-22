/**
 * @author Interprise Solutions
 */
define([
	'jquery',
	'underscore',
	'backbone',
    'view/common/enum',
	'model/cartItem',
    'model/checkListItem',
    'model/lookupcriteria',
	'model/stock',
	'collection/cart',
	'view/common/global',
	'view/common/service',
	'view/common/shared',
	'view/common/method',
    'view/common/preference',
    'view/base/numericpad',
    'view/binManager/binManager',
    'view/lookup/itemLookup/itemLookup',
	'view/stock/cartItem',    
    'view/stock/checkListItem',
	'text!template/stock/stock.tpl.html',
    'js/libs/moment.min.js'

], function ($, _, Backbone, Enum,
	CartItemModel, CheckListItemModel, LookupCriteriaModel, StockModel,
	CartCollection, Global, Service, Shared, Method, CurrentPreference,
	NumericPadView, BinManagerView, ItemLookupView, CartItemView, CheckListItemView,
    StockTemplate) {

    var isFromRemainingItemSection = false;
    var isFromItemSettingSection = false;

    var StockView = Backbone.View.extend({
        _template: _.template(StockTemplate),

        events: {
            "keypress #textboxSearchStock": "textboxSearch_keypress",
            "keypress #textboxScanItem": "textboxScanItem_keypress",
        },
                
        buttonBackCheckList_tap: function () {
            $('li').removeClass('highlight');
            this.SwitchDisplay('page2', false, false)
        },

        buttonBackItemSetting_tap: function (e) {
            $('td').removeClass('highlight');
            this.currentStock = null;
            isFromItemSettingSection = false;
            this.SwitchDisplay('page1', false, false);
        },

        buttonBackRemItemSetting_tap: function (e) {
            $('td').removeClass('highlight');
            this.currentStock = null;
            this.ShowItemsRemainingSection(true);
            this.SwitchDisplay('page1', false, false);
        },

        buttonBackItemsRemaining_tap: function (e) {            
            this.ShowItemsRemainingSection(false);
        },        

        buttonBackStockDetail_tap: function (e) {
            this.UpdateStockTransferDetail();
            this.SwitchDisplay('page1', false, false);            
        },

        buttonCancelRemoveItems_tap: function (e) {
            Shared.RemoveCheckedItems(this.cartCollection);
        },

        buttonCounter_tap: function (e) {
            this.ShowItemsRemainingSection(true);            
        },

        buttonComplete_tap: function (e) {
            this.TransferStockItems();            
        },

        buttonMenuStock_tap: function (e) {            
            this.GoToMenu();
        },

        buttonMore_tap: function (e) {
            var self = this;
            this.$('#completedSection').removeClass('section-show').removeClass("bounceInDown").addClass("bounceOutUp");

            setTimeout(function () {
                if (Global.StockMode == "StockFromGRN") {
                    self.InitializeNewTransaction(false);
                    self.ResetControls();
                } else {
                    self.InitializeChildViews();
                }
            }, 300 );
        },
        
        buttonEditDetails_tap: function (e) {
            this.SwitchDisplay('page2', true, false);
        },        

        buttonRemove_tap: function (e) {
            this.RemoveItemFromCart();
        },        

        buttonRemoveItems_tap: function (e) {
            this.RemoveItemsFromCart();
        },

        buttonSearchItem_click: function (e) {
            this.FindItemByUPC();
        },                       
               
        buttonMenu_tap: function (e) {
            this.ShowDashBoard();
        },

        initialize: function () {
            Global.ApplicationType = "Stock";
        },

        rowBinLocation_tap: function (e) {
            this.ShowBinManagerSection(this.currentStock, true);
        },

        rowLocationTo_tap: function (e) {            
            this.$('#rowLocationTo').addClass('highlight');
            this.UpdateStockTransferDetail();
            this.SetCheckListNavTitle('locations');
            this.SwitchDisplay('page3', false, false);            
            this.LoadFromToLocationOrZoneLookup(Enum.ListMode.ToLocation);
        },

        rowQty_tap: function (e) {
            if (CurrentPreference.StockIsPromptForQty) {
                isFromItemSettingSection = true;
                this.ShowNumericPad($("#textQuantity").text());
            }
        },

        rowZoneFrom_tap: function (e) {            
            this.$('#rowZoneFrom').addClass('highlight');
            this.SetCheckListNavTitle('zones');
            this.SwitchDisplay('page3', false, false);
            this.LoadFromToLocationOrZoneLookup(Enum.ListMode.FromZone);            
        },        

        rowZoneTo_tap: function (e) {
            if(this.HasWarehouseCodeDest()) {                
                this.$('#rowZoneTo').addClass('highlight');
                this.SetCheckListNavTitle('zones');
                this.SwitchDisplay('page3', false, false);
                this.LoadFromToLocationOrZoneLookup(Enum.ListMode.ToZone);
            }
        },

        rowUnitMeasure_tap: function (e) {            
            this.$('#rowUnitMeasure').addClass('highlight');
            this.SetCheckListNavTitle('unit measures');
            this.SwitchDisplay('page3', false, false);
            this.LoadFromToLocationOrZoneLookup(Enum.ListMode.UM);
        },      

        textboxSearch_keypress: function (e) {
            if (e.keyCode === 13) {
                this.FindItemByUPC();
            }
        },        

        textboxScanItem_keypress: function (e) {
            if (e.keyCode === 13) {
                this.FindItemByUPC();
            }
        },

        Animate: function (isAnimate, isFullScreen) {            
            this.ProgressScreen = Shared.ShowProgress(this.ProgressScreen, isAnimate, "itemMainSlider", isFullScreen);
        },

        AnimateCompleteButton: function (isAnimate) {
            if (isAnimate) this.$('#buttonCompleteStock').text('stocking...');
            else this.$('#buttonCompleteStock').text('complete');
        },
        
        AnimateItemSetting: function(isAnimate) {
            this.Animate(isAnimate, false);            
        },           

        AddItemToCart: function (item) {                                    
            var itemModel = null;
            if (Global.StockMode != "StockFromGRN") {
                itemModel = this.AssignItemProperties(item);
                this.cartCollection.add(itemModel);                
            } else {                
                itemModel = item;                
                if (this.HasQuantityReceived(itemModel)) {                    
                    this.cartCollection.add(itemModel);
                }
            }
            
            this.RenderItem(this, itemModel);
            if (Global.StockMode == "StockFromGRN") this.UpdateCounter(this.currentStock.model);
            
            if (CurrentPreference.StockIsPromptForQty) {
                if (Global.StockMode == "StockFromGRN") {
                    if (this.currentStock.model.get('QuantityReceived') > 1) this.ShowNumericPad(1);
                } else this.ShowNumericPad(1);
            } else {                
                if (CurrentPreference.StockIsPromptBinManager) this.ShowBinManagerSection(itemModel, false);
                else {
                    this.ItemLookupView.SlideDownItemLookup();
                    if (this.NumericPadView != null) this.NumericPadView.SlideDownNumericPad();
                    Shared.Focus("#textboxSearchStock");
                }
                this.ChangeItemQuantity(this.currentStock.model, 1);
            }
            
            Shared.BeepSuccess();            
            this.iScroll = Shared.LoadiScroll(this.iScroll, "Stock");
        },

        AssignItemProperties: function(item) {
            if (item) {
                var itemModel = new CartItemModel();
                var unitMeasure = item.UnitMeasureCode;
                var counter = this.cartCollection.length + 1;                
                var binLocationName = item.BinLocationName;

                if (!binLocationName) { binLocationName = "No Bin" }
                if (item.WarehouseCode == null) item.WarehouseCode = CurrentPreference.DefaultLocation;
                if (!unitMeasure) unitMeasure = item.UnitMeasure;

                itemModel.set({
                    BinLocationCode: item.BinLocationCode,
                    BinLocationName: binLocationName,
                    CurrentQuantityScanned: 0,
                    ItemCode: item.ItemCode,
                    ItemID: counter,
                    ItemName: item.ItemName,
                    ItemDescription: item.ItemDescription,
                    LocationCodeSource: "Zone2",
                    LocationCodeDest: "Zone1",
                    Quantity: 0,
                    QuantityLeft: item.QuantityLeft,
                    QuantityReceived: item.QuantityReceived,
                    QuantityScanned: 0,
                    RemainingItemID: "REM" + counter,
                    RowNumber: counter,
                    TapeItemID: "ITEM" + counter,
                    UPCCode: item.UPCCode,
                    UnitMeasureCode: unitMeasure,
                    CartItemImage: Shared.GetImageUrl(Enum.ImageType.CartItem, item.ItemIconFile)
                });

                if (CurrentPreference.StockIsShowQtyOnHand) itemModel.set({ FreeStock: item.FreeStock });

                return itemModel;
            }
        },
        
        ChangeItemQuantity: function (item, qty) {
            var qtyToAdd = 0
            if (!isFromItemSettingSection) {
                qtyToAdd = Shared.ChangeItemQuantity(item, qty, Enum.LookupMode.Stock, "add")
            }
            else {
                qtyToAdd = Shared.ChangeItemQuantity(item, qty, Enum.LookupMode.Stock, "replace")
            }
            this.UpdateTotalItems(qtyToAdd);
               
        },        

        ConvertDateToDateTime: function (value) {
            var oldDate = Date.parse(value);
            var newDate = new Date(oldDate);
            var m = newDate.getMonth();
            var d = newDate.getDate();
            var y = newDate.getFullYear();
            newDate = Date.UTC(y, m, d);
            newDate = "/Date(" + newDate + ")/";
            return newDate;
        },

        FindItemByUPC: function () {
            var upcCode = this.$("#textboxSearchStock").val();
            
            this.$("#textboxSearchStock").val("");
                        
            if (upcCode) this.GetItemByUPC(upcCode);
            else {
                Shared.NotifyError("Item not found.");
                Shared.BeepError();
            }
        },        

        GetItemByUPC: function (upcCode) {
            var self = this;
            this.AnimateItemSetting(true);
            if (Global.StockMode != "StockFromGRN") {
                var itemLookup = new LookupCriteriaModel();
                itemLookup.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADITEMBYUPC + "upcCode=" + upcCode
                                                                                            + "&warehouseCode=" + CurrentPreference.DefaultLocation
                                                                                            + "&isShowFreeStock=" + CurrentPreference.StockIsShowQtyOnHand
                                                                                            + "&useCbe=" + CurrentPreference.UseCbeImage
                                                                                            + "&webSite=" + CurrentPreference.WebSiteCode;
                itemLookup.fetch({
                    success: function (model, response) {                        
                        if (!model.get("hasError")) {
                            if (response != null && response.Items != null) {
                                if (response.Items.length > 1) self.ShowItemLookup(response.Items);
                                else self.UpdateCart(response.Items[0]);
                            } else {
                                Shared.NotifyError("Item not found.");
                                Shared.BeepError();
                            }
                        }                        
                    },
                    progress: this.ProgressScreen
                });
            } else {
                var hasItem = false;
                this.itemsRemaining.find(function (cartItem) {
                    self.AnimateItemSetting(false);
                    var cartItemUPCCode = "";                    
                    if (cartItem.get("UPCCode")) { cartItemUPCCode = cartItem.get("UPCCode").toLowerCase(); }
                    if (upcCode == cartItem.get('ItemCode').toLowerCase()                        
                        || upcCode == cartItemUPCCode) {
                        self.AddItemToCart(cartItem);
                        hasItem = true;
                    }
                });

                if (!hasItem) {
                    Shared.NotifyError("Item not found.");
                    Shared.BeepError();
                }
            }
        },

        GoToMenu: function () {
            if (this.HasOpenTransaction()) {
                navigator.notification.confirm("There are items to process. Are you sure you want to cancel?", function (button) {
                    if (button == 1) window.location.hash = Global.PreviousPage;
                }, "Cancel Stock", "Yes,No");
            }
            else {
                window.location.hash = Global.PreviousPage;
            }
        },

        HasQuantityReceived: function (item) {
            if ((item.get('QuantityReceived') - item.get('QuantityScanned')) > 0) return true;
            else return false;
        },

        HasOpenTransaction: function() {
            if (this.cartCollection.length > 0) return true;
            else return false;
        },
        
        HasWarehouseCodeDest: function () {
            var toLocation = this.model.get('WarehouseCodeDest');
            if (toLocation != null && toLocation != "") {
                return true;
            } else {
                return false;
            }
        },

        HighLightListItem: function(itemView) {
            this.$('.listitem-1').addClass('listitem-1').removeClass('listitem-2');
            this.$('.listitem-2').addClass('listitem-1').removeClass('listitem-2');
            Shared.HighLightItem(itemView.cid, "CheckList");
            this.$('#listItem' + itemView.model.get('ViewID')).removeClass('listitem-1').addClass('listitem-2');
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
            this.InitializeNewTransaction(true);
            this.WireEvents();
            this.InitializeNumericPad();
            this.InitializeItemLookup();
            this.LoadiScroll();
            Shared.Focus('#textboxSearchStock');            
        },

        InitializeItemLookup: function () {
            var self = this;
            this.ItemLookupView = new ItemLookupView();
            this.$('#itemLookupContainer').html(this.ItemLookupView.render());
            this.ItemLookupView.InitializeChildViews();
            this.ItemLookupView.on("itemSelected", function (item) { self.UpdateCart(item); });
        },

        InitializeItemsRemainingCollection: function () {
            if (this.itemsRemaining) {
                this.itemsRemaining.reset();
            }
            else {
                this.itemsRemaining = new CartCollection();
            }
        },

        InitializeItemSetting: function () {
            var itemDescription =  this.currentStock.model.get('ItemDescription');
            if (isFromRemainingItemSection) {
                $('#remSettingsItemCode').text(this.currentStock.model.get('ItemCode'));
                $('#remSettingsItemName').text(this.currentStock.model.get('ItemName'));
                // $('#remSettingsItemDesc').text(this.currentStock.model.get('ItemDescription'));
                $('#remSettingsUPCCode').text(Shared.ConvertNullToEmptyString(this.currentStock.model.get('UPCCode')));
                var qtyToScan = this.currentStock.model.get('QuantityReceived') - this.currentStock.model.get('QuantityScanned');
                $('#remSettingsQuantity').text(qtyToScan);
                $('#remSettingsFreeStock').text(this.currentStock.model.get('FreeStock'));
                $('#remSettingsUnitMeasureCode').text(this.currentStock.model.get('UnitMeasureCode'));
                $('#remSettingsLocationCodeSource').text(this.currentStock.model.get('LocationCodeSource'));
                $('#remSettingsLocationCodeDest').text(this.currentStock.model.get('LocationCodeDest'));
                 if (itemDescription.length > 20) {
                       this.$('#rowRemDesc').html("<a>Description<br><span style='white-space:normal'>" + itemDescription  + "</span></a>")
                 }
                 else {
                    this.$('#rowRemDesc').html("<a><span class='pull-right'>" + itemDescription  + "</span>Description</a>")
                 }
            }
            else {
                isFromItemSettingSection = true;
                $('#textItemCode').text(this.currentStock.model.get('ItemCode'));
                $('#textItemName').text(this.currentStock.model.get('ItemName'));
                // $('#textItemDesc').text(this.currentStock.model.get('ItemDescription'));
                $('#textUPCCode').text(Shared.ConvertNullToEmptyString(this.currentStock.model.get('UPCCode')));
                $('#textQuantity').text(this.currentStock.model.get('Quantity'));
                $('#textFreeStock').text(this.currentStock.model.get('FreeStock'));
                $('#textUnitMeasureCode').text(this.currentStock.model.get('UnitMeasureCode'));
                $('#textBinLocation').text(this.currentStock.model.get('BinLocationName'));
                $('#textLocationCodeSource').text(this.currentStock.model.get('LocationCodeSource'));
                $('#textLocationCodeDest').text(this.currentStock.model.get('LocationCodeDest'));
                 if (itemDescription.length > 20) {
                       this.$('#rowDesc').html("<a>Description<br><span style='white-space:normal'>" + itemDescription  + "</span></a>")
                 }
                 else {
                    this.$('#rowDesc').html("<a><span class='pull-right'>" + itemDescription  + "</span>Description</a>")
                 }
            }
        },

        InitializeModel: function (isRender) {
            var stockCode = Global.TransactionCode;
            this.model = new StockModel();
            var today = new Date();
            this.model.set({
                StockCode: stockCode,
                TransferDate: this.ConvertDateToDateTime(today),
                WarehouseCodeSource: CurrentPreference.DefaultLocation,
                WarehouseCodeDest: CurrentPreference.DefaultLocation,
                Notes: "",
                Counter: 0,
                TotalItems: 0,
                IsStock: true
            });

            if (isRender) this.$el.html(this._template(this.model.toJSON()));
            else this._template(this.model.toJSON());
        },

        InitializeNewTransaction: function (isRender) {
            this.InitializeModel(isRender);
            this.InitializeStockSection(true);            
            this.InitializeCartCollection();
            this.InitializeItemsRemainingCollection();
        },

        InitializeNumericPad: function () {
            var self = this;
            var view = new NumericPadView();
            this.NumericPadView = new NumericPadView();
            this.$('#numericPadContainer').html(view.render());

            var headerName = '#stockHeader';
            view.WireNumericPadEvents();
            view.off('closenumericpad', function (e) {
                self.$(headerName).show();                                
                if (isFromItemSettingSection) {
                    self.ItemLookupView.SlideDownItemLookup();
                }
                else {
                    var qtyScanned = self.currentStock.model.get("QuantityScanned");
                    if (!qtyScanned == 0) {
                       self.ItemLookupView.SlideDownItemLookup();
                    }
                    else {
                        self.currentStock.model.set({
                            Quantity: 1,
                            QuantityScanned: 1,
                        })
                        self.UpdateTotalItems(1);
                        self.UpdateCounter(self.currentStock.model);
                        if (CurrentPreference.StockIsPromptBinManager) {
                            self.ShowBinManagerSection(self.currentStock.model, false);
                        } else self.ItemLookupView.SlideDownItemLookup();
                    }
                }
                isFromItemSettingSection = false;
                Shared.Focus('#textboxSearchStock');
            });
            view.on('closenumericpad', function (e) {
                self.$(headerName).show();                                
                if (isFromItemSettingSection) {
                    self.ItemLookupView.SlideDownItemLookup();
                }
                else {
                    var qtyScanned = self.currentStock.model.get("QuantityScanned");
                    if (!qtyScanned == 0) {
                        self.ItemLookupView.SlideDownItemLookup();
                    }
                    else {
                        self.currentStock.model.set({
                            Quantity: 1,
                            QuantityScanned: 1,
                        })
                        self.UpdateTotalItems(1);
                        self.UpdateCounter(self.currentStock.model);
                        if (CurrentPreference.StockIsPromptBinManager) {
                            self.ShowBinManagerSection(self.currentStock.model, false);
                        }else self.ItemLookupView.SlideDownItemLookup();
                    }
                }
                isFromItemSettingSection = false;
                Shared.Focus('#textboxSearchStock');
            });
            view.off('quantitychange', function (numericPadCriteria) {
                var qtyScanned = self.currentStock.model.get("QuantityScanned");
                self.ChangeItemQuantity(self.currentStock.model, numericPadCriteria.NumericPadValue)
                self.UpdateCounter(self.currentStock.model);
                
                $('#receiveHeader').show();
                if (qtyScanned == 0) {
                    if (CurrentPreference.StockIsPromptBinManager && !isFromItemSettingSection) self.ShowBinManagerSection(self.currentStock.model, false);
                }
                self.ItemLookupView.SlideDownItemLookup();
                view.SlideDownNumericPad();
                Shared.Focus('#textboxSearchStock');
            });
            view.on('quantitychange', function (numericPadCriteria) {
                var qtyScanned = self.currentStock.model.get("QuantityScanned");
                self.ChangeItemQuantity(self.currentStock.model, numericPadCriteria.NumericPadValue)
                self.UpdateCounter(self.currentStock.model);

                $('#receiveHeader').show();
                if (qtyScanned == 0) {
                    if (CurrentPreference.StockIsPromptBinManager && !isFromItemSettingSection) self.ShowBinManagerSection(self.currentStock.model, false);
                }
                self.ItemLookupView.SlideDownItemLookup();
                view.SlideDownNumericPad();
                Shared.Focus('#textboxSearchStock');
            });
        },

        InitializeStockSection: function (isRefresh) {           
            if (isRefresh) {
                if (Global.StockMode == "StockFromGRN") {
                    $('#buttonCounterContainer').show();
                    this.ProcessSelectedTransaction();
                }
                else $('#buttonCounterContainer').hide();
            }            
        },

        LoadFromToLocationOrZoneLookup: function (listMode) {
            var lookupModel = new LookupCriteriaModel();
            var self = this;
            var warehouseCodeSource = "";
            var itemCode = "";            

            if (this.currentStock != null && this.currentStock != "undefined") {
                itemCode = this.currentStock.model.get('ItemCode');
            }

            if (this.model.get('WarehouseCodeSource') == "" && this.model.get('WarehouseCodeSource') == "undefined") {
                warehouseCodeSource = CurrentPreference.DefaultLocation;
            } else {
                warehouseCodeSource = this.model.get('WarehouseCodeSource');
            }

            if (listMode != null) {
                switch (listMode) {
                    case Enum.ListMode.FromLocation:
                        lookupModel.set({ WarehouseCode: warehouseCodeSource });
                        lookupModel.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADSTOCKFROMTOLOCATIONLOOKUP;
                        break;
                    case Enum.ListMode.ToLocation:
                        lookupModel.set({ WarehouseCode: warehouseCodeSource });
                        lookupModel.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADSTOCKFROMTOLOCATIONLOOKUP;
                        break;
                    case Enum.ListMode.UM:
                        lookupModel.set({ Criteria: null });
                        lookupModel.url = Global.ServiceUrl + Service.PRODUCT + Method.UNITMEASURECODELOOKUP + "50/" + itemCode;
                        break;
                    case Enum.ListMode.FromZone:
                        lookupModel.set({
                            ItemCode: itemCode,
                            WarehouseCode: warehouseCodeSource
                        });
                        lookupModel.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADSTOCKFROMTOZONELOOKUP;
                        break;
                    case Enum.ListMode.ToZone:
                        lookupModel.set({
                            ItemCode: itemCode,
                            WarehouseCode: this.model.get('WarehouseCodeDest')
                        });
                        lookupModel.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADSTOCKFROMTOZONELOOKUP;
                        break;
                }
                this.AnimateItemSetting(true);
                lookupModel.save(null, {
                    success: function (model, response, options) {                        
                        if (!model.get("hasError")) {
                            self.RenderLookup(response, listMode);
                        }
                    },
                    progress: this.ProgressScreen
                });
            }
        },
                
        LoadItemSetting: function (item) {            
            Shared.HighLightItem(item.model.get('TapeItemID'), "Default");
            this.currentStock = item;
            this.InitializeItemSetting();
            this.SwitchDisplay('page2', true, true);
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

        PopulateItemsRemaining: function (list) {
            if (list && list.length > 0) {
                var self = this;
                var counter = 0;
                _.each(list, function (current) {
                    var itemModel = self.AssignItemProperties(current);
                    itemModel.set({ RowNumber: self.itemsRemaining.length + 1 });
                    self.itemsRemaining.add(itemModel);
                    counter += current.QuantityReceived;
                });
                self.model.set({ Counter: counter });                
            }
        },

        ProcessSelectedTransaction: function() {           
            var lookupModel = new LookupCriteriaModel();
            var self = this;

            lookupModel.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADSTOCKSTOTRANSFER + Global.TransactionCode + "/" + CurrentPreference.StockIsShowQtyOnHand;

            lookupModel.fetch({
                success: function (model, response, options) {
                    if (!model.get("hasError")) {
                        self.PopulateItemsRemaining(response.SupplierPurchaseReceiptDetail);                        
                        self.RenderRemainingItems();
                    }
                }
            });
        },
        
        RefreshRowNumber: function (collection) {
            if (collection && collection.length > 0) {
                var rowNumber = 0;
                var self = this;

                collection.each(function (item) {
                    rowNumber = rowNumber + 1;
                    var oldTapeItemID = item.get("TapeItemID");
                    var rowNum = $('#itemRow' + oldTapeItemID);
                    rowNum.text(rowNumber);

                    item.set({
                        ItemID: rowNumber,
                        RowNumber: rowNumber,
                        TapeItemID: "ITEM" + rowNumber
                    });

                    var newTapeItemID = item.get("TapeItemID");

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

        RemoveItemsFromCart: function () {
            var self = this;

            navigator.notification.confirm("Are you sure you want to remove these item/s?", function (button) {
                if (button == 1) {
                    var itemsToDelete = new CartCollection();

                    _.each(self.cartCollection.models, function (current) {
                        if (current.get("IsChecked")) itemsToDelete.add(current);
                    });

                    while (itemsToDelete.models.length > 0) {
                        self.UpdateTotalItems(itemsToDelete.models[0].get('Quantity') * -1);
                        itemsToDelete.models[0].RaiseItemDeleted();
                    }                   

                    self.RefreshRowNumber(self.cartCollection);
                    self.iScroll = Shared.LoadiScroll(self.iScroll, "Stock");
                    $('#slideFooter').removeClass("slideInUpFooter").addClass("slideOutDownFooter");
                }
            }, "Remove Item", "Yes,No");
        },

        RemoveItemFromCart: function () {
            var self = this;

            navigator.notification.confirm("Are you sure you want to remove this item?", function (button) {
                if (button == 1) {
                    if (self.currentStock != null) {
                        var model = self.currentStock.model;
                        
                        self.cartCollection.remove(model);
                        self.currentStock.remove();

                        if (Global.StockMode == "StockFromGRN") {
                            self.UpdateTotalItems(self.currentStock.model.get(''));
                            model.destroy();
                        }
                        else {            
                            self.$(model.get("RemainingItemID")).parent().show();
                            self.itemsRemaining.add(self.currentStock.model);

                            self.UpdateTotalItems(self.currentStock.model.get('QuantityScanned') * -1);

                            self.currentStock.model.set({
                                Quantity: self.currentStock.model.get('QuantityReceived'),
                                QuantityScanned: 0
                            });
                        }

                        self.RefreshRowNumber(self.itemsRemaining);
                        self.iScroll = Shared.LoadiScroll(self.iScroll, "Stock");
                        self.SwitchDisplay('page1', false, false);
                    }
                }
            }, "Remove Item", "Yes,No");
        },
              
        RemoveItemFromCollection: function (item) {            
            this.cartCollection.remove(item);
        },

        RemoveRemainingItem: function(criteria, unitMeasureCode) {
            if (upcCode) {
                var item = Shared.FindItem(this.itemsRemaining, criteria, unitMeasureCode);

                if (item) {
                    this.$(model.get("RemainingItemID")).parent().hide();
                    this.itemsRemaining.remove(item);
                }
            }
        },

        RenderLookup: function (list, listMode) {
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
                                                                
                                if (self.currentStock.model.get('UnitMeasureCode') == checklistItemView.model.get('UnitMeasureCode')) {
                                    self.HighLightListItem(checklistItemView);
                                }

                                Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {                                    
                                    self.UpdateStockItemSetting(checklistItemView, listMode);
                                    self.SwitchDisplay('page2', false, false);
                                });
                            });
                        }
                        break;
                    case Enum.ListMode.FromLocation:
                    case Enum.ListMode.ToLocation:
                        if (list.Warehouses.length > 0) {
                            _.each(list.Warehouses, function (current) {
                                var checkListItemModel = new CheckListItemModel();
                                checkListItemModel.set({                                    
                                    ListItemTitle: current.WarehouseDescription,
                                    ListItemRow1: current.Address,
                                    ListItemRow2: "",
                                    WarehouseCode: current.WarehouseCode,
                                    WarehouseDescription: current.WarehouseDescription,
                                });

                                var checklistItemView = new CheckListItemView({ model: checkListItemModel });                                
                                self.$('#cartCheckList tbody').append(checklistItemView.render());
                                
                                Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {                                    
                                    self.UpdateStockItemSetting(checklistItemView, listMode);
                                    self.SwitchDisplay('page2', false, false);
                                });
                            });
                        }
                        break;
                    case Enum.ListMode.FromZone:
                    case Enum.ListMode.ToZone:
                        if (list.LocationStockCounts.length > 0) {
                            _.each(list.LocationStockCounts, function (current) {
                                var checkListItemModel = new CheckListItemModel();
                                checkListItemModel.set({                                    
                                    ListItemTitle: current.LocationDescription,
                                    ListItemRow1: current.StockType,
                                    ListItemRow2: "",
                                    LocationCode: current.LocationCode,
                                    LocationDescription: current.LocationDescription,
                                });

                                var checklistItemView = new CheckListItemView({ model: checkListItemModel });
                                self.$('#cartCheckList tbody').append(checklistItemView.render());
                                                                
                                var locationCode = checklistItemView.model.get('LocationCode');
                                if (listMode == Enum.ListMode.FromZone) {
                                    var fromZone = self.currentStock.model.get('LocationCodeSource');
                                    if (fromZone != null && fromZone != "") {
                                        if (fromZone == locationCode) {
                                            self.HighLightListItem(checklistItemView);
                                        }
                                    }
                                } else {                                    
                                    var toZone = self.currentStock.model.get('LocationCodeDest');
                                    if (toZone != null && toZone != "") {
                                        if (toZone == locationCode) {
                                            self.HighLightListItem(checklistItemView);
                                        }
                                    }
                                }
                                Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {
                                    self.UpdateStockItemSetting(checklistItemView, listMode);
                                    self.SwitchDisplay('page2', false, false);
                                });
                            });
                        }
                        break;
                }
                this.iScrollCheckList = Shared.LoadiScroll(this.iScrollCheckList, "CheckList");
            }
        },        

        RenderItem: function (self, itemModel) {
            var cart = self.$("#cartListStock tbody");

            if (Global.StockMode == "StockFromGRN") {
                itemModel.set({ IsItemsRemaining: false });
                if (itemModel.get('QuantityScanned')) itemModel.set({ Quantity: itemModel.get('QuantityScanned') });
            }

            var itemView = new CartItemView({ model: itemModel });
            cart.append(itemView.render());
            
            Shared.AddRemoveHandler('.' + itemView.model.get('TapeItemID') + "-itemcol-1", 'tap', function () {
                Shared.ToggleItemCheck(itemView.model);
                Shared.ShowRemoveFooter(self.cartCollection);
            });
            Shared.AddRemoveHandler('.' + itemView.model.get('TapeItemID') + "-itemcol-2", 'tap', function () { self.LoadItemSetting(itemView) });
            Shared.AddRemoveHandler('.' + itemView.model.get('TapeItemID') + "-itemcol-3", 'tap', function () { self.LoadItemSetting(itemView) });
            Shared.AddRemoveHandler('.' + itemView.model.get('TapeItemID') + "-itemcol-4", 'tap', function () { self.LoadItemSetting(itemView) });

            var onAttributeChanged = function () {
                var tapeItemID = itemView.model.get('TapeItemID');
                var um = $('#itemUnitMeasureCode' + tapeItemID);
                var binLocation = $('#itemBinLocation' + tapeItemID);
                var qty = $('#itemQty' + tapeItemID);
                var locationCodeSource = $('#itemLocationCodeSource' + tapeItemID);
                var locationCodeDest = $('#itemLocationCodeDest' + tapeItemID);

                var settingQty = $('#textQuantity');
                var settingUM = $('#textUnitMeasureCode');
                var settingBinLocation = $('#textBinLocation');
                var settingLocationCodeSource = $('#textLocationCodeSource');
                var settingLocationCodeDest = $('#textLocationCodeDest');

                var newQty = itemView.model.get('Quantity');
                var newUM = itemView.model.get('UnitMeasureCode');
                var newBinLocation = itemView.model.get('BinLocationName');
                var newLocationCodeSource = itemView.model.get('LocationCodeSource');
                var newLocationCodeDest = itemView.model.get('LocationCodeDest');

                var qtyRem = $('#itemQty' + itemView.model.get('RemainingItemID'));
                var qtyToScan = itemView.model.get('QuantityReceived') - itemView.model.get('QuantityScanned');

                if (qty.text() != newQty) qty.text(newQty);                                
                if (um.text() != newUM) um.text(newUM);
                if (binLocation.text() != newBinLocation) {                    
                    if (newBinLocation == "No Bin") {
                        binLocation.css("font-style", "italic");
                        binLocation.text("< No Bin >");
                    }
                    else {
                        binLocation.text(newBinLocation);
                        binLocation.css("font-style", "normal");
                    }
                }
                else {
                    if (binLocation.text() == "No Bin") 
                    {
                        binLocation.css("font-style", "italic");
                        binLocation.text("< No Bin >");
                    }                
                }

                if (locationCodeSource.text() != newLocationCodeSource) locationCodeSource.text(newLocationCodeSource);
                if (locationCodeDest.text() != newLocationCodeDest) locationCodeDest.text(newLocationCodeDest);

                if (settingQty.text() != newQty) settingQty.text(newQty);
                if (settingUM.text() != newUM) settingUM.text(newUM);
                if (settingBinLocation.text() != newBinLocation) settingBinLocation.text(newBinLocation);
                if (settingLocationCodeSource.text() != newLocationCodeSource) settingLocationCodeSource.text(newLocationCodeSource);
                if (settingLocationCodeDest.text() != newLocationCodeDest) settingLocationCodeDest.text(newLocationCodeDest);

                if (Global.StockMode == "StockFromGRN") {
                    if (qtyRem != qtyToScan) {
                        if (qtyToScan > 0) qtyRem.text(qtyToScan);
                        else {
                            qtyRem.text(qtyToScan);
                            self.RemoveRemainingItem(itemView.model.get('ItemCode'), itemView.model.get('UnitMeasureCode'));
                        }
                    }
                }

            };

            itemView.model.off('change', onAttributeChanged);
            itemView.model.on('change', onAttributeChanged);                      

            self.currentStock = itemView; 
        },

        RenderRemainingItems: function (template) {
            var self = this;
            this.$("#cartListItemsRemaining tbody").html("");
            if (this.itemsRemaining && this.itemsRemaining.models.length > 0) {
                this.itemsRemaining.each(function (item) {
                    item.set({ IsItemsRemaining: true });
                    var itemView = new CartItemView({ model: item });
                    this.$("#cartListItemsRemaining tbody").append(itemView.render());

                    var remainingItemID = itemView.model.get('RemainingItemID');
                    $('#itemQty' + remainingItemID).text(item.get('QuantityReceived') - item.get('QuantityScanned'));
                    Shared.AddRemoveHandler('.' + remainingItemID, 'tap', function () {
                        self.LoadItemSetting(itemView)
                        $("#itemRemainingSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
                    });
                    self.UpdateCounter(itemView.model);
                });
            }
        },

        ResetControls: function () {
            $('#textboxSearchStock').val('');
            $('#cartListStock tbody').html('');
            $('#cartCheckList tbody').html('');
            $('#textTotalItems').text(this.model.get('TotalItems'));
        },

        SetCheckListNavTitle: function (title) {
            $("#checkListNavTitle").text(title);
        },

        ShowBinManagerSection: function (item, isUpdate) {
            var stockDetailsCollection = this.cartCollection;
            Global.ApplicationType = "Stock";
            this.BinManagerView = new BinManagerView();
            if (isUpdate) this.BinManagerView.model.set({ LocationCode: item.model.get('LocationCodeDest') });
            else this.BinManagerView.model.set({ LocationCode: "Zone1" });
            this.BinManagerView.CurrentItem = item;
            this.BinManagerView.IsUpdate = isUpdate;

            this.$("#stockHeader").hide();
            this.$("#binManagerSlider").removeClass("container slideOutDown").addClass("container slideInUp");            

            this.BinManagerView.on("selectedBin", function (item) {
                if (item) {
                    if (isUpdate) this.UpdateBinLocation(item);
                    else {
                        this.ItemLookupView.SlideDownItemLookup();
                        if (CurrentPreference.StockIsPromptForQty) this.NumericPadView.SlideDownNumericPad();
                    }
                }
                this.$("#stockHeader").show();
            }, this);

            this.BinManagerView.on("deleteBin", function (binCode, binCollection, isDeleteAll) {
                Shared.RemoveBinFromItem(stockDetailsCollection, binCode, binCollection, isDeleteAll);
                this.$("#stockHeader").show();
            });

            this.$("#containerBinManager").html("");
            this.$("#containerBinManager").append(this.BinManagerView.Render());

            this.BinManagerView.InitializeChildViews();
        },

        ShowCompletedSection: function () {
            $('#completedNavTitle').text("");

            $('#completedMessage').text('Stock Completed!');
            $('#buttonMore').text('stock more');                

            $('#completedSection').removeClass('section-close').removeClass('bounceOutUp').addClass('section-show').addClass("bounceInDown");
        },

        ShowDashBoard: function (button) {

            var showDashBoard = function (button) {
                if (button === 1) {
                    window.location.hash = "dashboard";
                }
            };

            if (this.HasOpenTransaction()) {

                navigator.notification.confirm('There is an open transaction. Do you still want to proceed?', showDashBoard, "Confirmation", "Yes,No");

            } else window.location.hash = "dashboard";
            
        },

        ShowFreeStockItemSetting: function () {                       
            if (CurrentPreference.StockIsShowQtyOnHand) {
                $('#rowFreeStock').show();
                $('#rowRemFreeStock').show();
            }
            else {
                $('#rowFreeStock').hide();
                $('#rowRemFreeStock').hide();
            }                         
        },

        ShowNumericPad: function (qty) {
            $('#textboxQuantity').val(qty);
            this.$('#textboxSearchStock').blur();
            $('#stockHeader').hide();
            $('#buttonCompleteStock').focus();
            $('.numericpad').addClass('slideInUp').removeClass('slideOutDown');
        },        

        ShowItemLookup: function (items) {
            if (items) {
                this.ItemLookupView.RenderItems(items);
                $('#stockHeader').hide();
                $('#itemLookupSection').addClass('slideInUp').removeClass('slideOutDown');
            }
        },

        ShowItemSettingSection: function () {
            if (isFromRemainingItemSection) {
                $('#itemRemSettingSection').addClass('section-show').removeClass('section-close');
            }
            else {
                $('#itemSettingSection').addClass('section-show').removeClass('section-close');
            }
            
            $('#stockDetailSection').addClass('section-close').removeClass('section-show');
            this.LoadiScroll();
        },

        ShowItemsRemainingSection: function (isShow) {
            if (isShow) {
                this.$("#stockHeader").hide();
                $("#itemRemainingSlider").removeClass("container-remaining slideOutDown").addClass("container-remaining slideInUp");
                this.itemRemainingiScroll = Shared.LoadiScroll(this.itemRemainingiScroll, "ItemsRemaining");
                isFromRemainingItemSection = true;
                this.RenderRemainingItems();
            }
            else {
                this.$("#stockHeader").show();                
                Shared.Focus('#textboxSearchStock');
                $('#itemRemainingSlider').removeAttr("style");
                $("#itemRemainingSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
                isFromRemainingItemSection = false;
            }
        },                       

        ShowStockDetailSection: function () {
            $('#stockDetailSection').addClass('section-show').removeClass('section-close');
            $('#itemSettingSection').addClass('section-close').removeClass('section-show');
        },        

        SwitchDisplay: function (page, isRefreshPage, isItemSetting) {
            if (this.isAnimate) return false;

            switch (page) {
                case "page1":
                    this.$('#transferDetailNotes').blur();
                    if (isFromRemainingItemSection) Shared.SlideX('#itemRemainingSlider', 0);
                    else {
                        Shared.SlideX('#itemMainSlider', 0);                        
                        Shared.Focus('#textboxSearchStock');
                    }
                    break;
                case "page2":
                    this.$('#textboxSearchStock').blur();
                    if (isRefreshPage) {
                        if (isItemSetting) this.ShowItemSettingSection();
                        else this.ShowStockDetailSection();
                    }
                    if (isFromRemainingItemSection) Shared.SlideX('#itemRemainingSlider', Global.ScreenWidth * -1);
                    else {
                        Shared.SlideX('#itemMainSlider', Global.ScreenWidth * -1);                        
                        Shared.Focus('#transferDetailNotes');
                    }
                    $('td').removeClass('highlight');                    
                    break;                    
                case "page3":                    
                    Shared.SlideX('#itemMainSlider', Global.ScreenWidth * -2);
                    break;
            }
        },        

        TransferStockItems: function () {
            if (!this.ValidateStock()) return false;

            var lookupModel = new LookupCriteriaModel();
            var self = this;                        

            lookupModel.url = Global.ServiceUrl + Service.PRODUCT + Method.TRANSFERSTOCKITEMS;            
            lookupModel.set({
                StockTransfer: this.model,
                StockTransferDetails: this.cartCollection
            });

            this.Animate(true, true);
            this.AnimateCompleteButton(true);
            lookupModel.save(null, {
                success: function (model, response, options) {                    
                    if (!model.get("hasError")) {
                        //self.model.set({ StockCode: response.Adjustments[0].ReferenceCode });
                        self.ShowCompletedSection();
                        self.InitializeCartCollection();
                    }
                    self.AnimateCompleteButton(false);
                },
                progress: this.ProgressScreen
            });
        },

        UpdateBinLocation: function (binView) {
            if (this.currentStock) {
                this.currentStock.model.set({
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

                if (item instanceof Backbone.Model) {
                    upcCode = item.get('UPCCode');
                    itemCode = item.get('ItemCode');
                    unitMeasureCode = item.get('UnitMeasureCode');
                    if (!upcCode) upcCode = item.get('ItemCode');
                } else {
                    upcCode = item.UPCCode;
                    itemCode = item.ItemCode;
                    unitMeasureCode = item.UnitMeasureCode;
                    if (!upcCode) upcCode = item.ItemCode;
                }

                var existingItem = Shared.FindItem(this.cartCollection, itemCode, unitMeasureCode);

                if (existingItem) {
                    if (Global.StockMode == "StockFromGRN") {

                        if (existingItem.get('QuantityScanned') != existingItem.get('QuantityReceived')) {

                            this.UpdateItemQuantity(existingItem);

                        } else this.AddItemToCart(existingItem);

                    } else this.UpdateItemQuantity(existingItem);
                }
                else this.AddItemToCart(item);
            }
        },

        UpdateCounter: function (item) {
            var counter = this.model.get('Counter');
            if (item) this.model.set({ Counter: counter - item.get('CurrentQuantityScanned') });

            $('#textCounter').text(this.model.get('Counter'));
            $('#textTotalItemsRemaining').text(this.model.get('Counter'));
            if (!this.HasQuantityReceived(item)) this.itemsRemaining.remove(item);
            else this.itemsRemaining.add(item);
        },

        UpdateItemQuantity: function (item) {
            Shared.BeepSuccess();

            if (CurrentPreference.StockIsPromptForQty) {
                this.currentStock = new CartItemView({ model: item });
                this.ShowNumericPad(1);
            }
            else {
                if (Global.StockMode == "StockFromGRN") this.UpdateCounter(item);
                this.ChangeItemQuantity(item, 1);
                this.ItemLookupView.SlideDownItemLookup();
                Shared.Focus("#textboxSearchStock");
            }
        },

        UpdateStockTransferDetail: function () {
            this.model.set({ Notes: $('#stockDetailNotes').val() });
        },

        UpdateStockItemSetting: function (itemView, listMode) {
            switch (listMode) {                
                case Enum.ListMode.ToLocation:
                    var warehouseCode = itemView.model.get('WarehouseCode');
                    this.model.set({ WarehouseCodeDest: warehouseCode });
                    $('#textLocationTo').text(warehouseCode);
                    break;
                case Enum.ListMode.UM:
                    this.currentStock.model.set({ UnitMeasureCode: itemView.model.get('UnitMeasureCode') });
                    break;
                case Enum.ListMode.FromZone:
                    this.currentStock.model.set({ LocationCodeSource: itemView.model.get('LocationCode') });
                    break;
                case Enum.ListMode.ToZone:
                    this.currentStock.model.set({ LocationCodeDest: itemView.model.get('LocationCode') });
                    break;
                case Enum.ListMode.BinManager:
                    this.currentStock.model.set({
                        BinLocationCode: itemView.model.get('BinLocationCode'),
                        BinLocationName: itemView.model.get('BinLocationName')
                    });
                    break;
            }
            this.HighLightListItem(itemView);
        },

        UpdateTotalItems: function (qty) {
            var total = this.model.get('TotalItems');
            this.model.set({ TotalItems: total += qty });
            $('#textStockTotalItems').text(this.model.get('TotalItems'));
        },

        ValidateStock: function () {
            if (this.cartCollection == null || this.cartCollection.length == 0) {
                navigator.notification.alert("There are no items to process.", null, "Stock", "OK");
                return false;
            }            

            var dateStock = this.model.get("TransferDate");
            if (dateStock == null || dateStock == "") {
                navigator.notification.alert("Stock Date was not set. Go to details to setup the date.", null, "Stock Date", "OK");                
                return false;
            }

            return true;
        },
        
        WireEvents: function () {            
            var self = this;

            Shared.AddRemoveHandler('#buttonBackCheckList', 'tap', function (e) { self.buttonBackCheckList_tap(e); });
            Shared.AddRemoveHandler('#buttonBackItemSetting', 'tap', function (e) { self.buttonBackItemSetting_tap(e); });
            Shared.AddRemoveHandler('#buttonBackItemsRemaining', 'tap', function (e) { self.buttonBackItemsRemaining_tap(e); });
            Shared.AddRemoveHandler('#buttonBackRemItemSetting', 'tap', function (e) { self.buttonBackRemItemSetting_tap(e); });
            Shared.AddRemoveHandler('#buttonBackStockDetail', 'tap', function (e) { self.buttonBackStockDetail_tap(e); });
            Shared.AddRemoveHandler('#buttonCancelRemoveItems', 'tap', function (e) { self.buttonCancelRemoveItems_tap(e); });
            Shared.AddRemoveHandler('#buttonCompleteStock', 'tap', function (e) { self.buttonComplete_tap(e); });
            Shared.AddRemoveHandler('#buttonCounter', 'tap', function (e) { self.buttonCounter_tap(e); });
            Shared.AddRemoveHandler('#buttonMenuStock', 'tap', function (e) { self.buttonMenu_tap(e); });
            Shared.AddRemoveHandler('#buttonMenuCompleted', 'tap', function (e) { self.buttonMenu_tap(e); });
            Shared.AddRemoveHandler('#buttonMore', 'tap', function (e) { self.buttonMore_tap(e); });
            Shared.AddRemoveHandler('#buttonRemove', 'tap', function (e) { self.buttonRemove_tap(e); });
            Shared.AddRemoveHandler('#buttonRemoveItems', 'tap', function (e) { self.buttonRemoveItems_tap(e); });
            Shared.AddRemoveHandler('#buttonSearchItemStock', 'tap', function (e) { self.buttonSearchItem_click(e); });
            Shared.AddRemoveHandler('#buttonStockEditDetails', 'tap', function (e) { self.buttonEditDetails_tap(e); });

            Shared.AddRemoveHandler('#rowBinLocation', 'tap', function (e) { self.rowBinLocation_tap(e); });
            Shared.AddRemoveHandler('#rowLocationTo', 'tap', function (e) { self.rowLocationTo_tap(e); });            
            Shared.AddRemoveHandler('#rowQty', 'tap', function (e) { self.rowQty_tap(e); });
            Shared.AddRemoveHandler('#rowZoneTo', 'tap', function (e) { self.rowZoneTo_tap(e); });
            Shared.AddRemoveHandler('#rowZoneFrom', 'tap', function (e) { self.rowZoneFrom_tap(e); });
            
            //Tentative
            //Shared.AddRemoveHandler('#rowUnitMeasure', 'tap', function (e) { self.rowUnitMeasure_tap(e); });
            $('#rowUnitMeasure i').hide();
        },        
    });
    return StockView;
});