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
	'model/transfer',
	'collection/cart',
	'view/common/global',
	'view/common/service',
	'view/common/shared',
	'view/common/method',
    'view/common/preference',
    'view/base/numericpad',
    'view/lookup/itemLookup/itemLookup',
	'view/transfer/cartItem',    
    'view/transfer/checkListItem',    
	'text!template/transfer/transfer.tpl.html',
    'js/libs/moment.min.js'

], function ($, _, Backbone, Enum,
	CartItemModel, CheckListItemModel, LookupCriteriaModel, TransferModel,
	CartCollection, Global, Service, Shared, Method, CurrentPreference,
	NumericPadView, ItemLookupView, CartItemView, CheckListItemView,
    TransferTemplate) {    

    var isFromItemSettingSection = false;

    var TransferView = Backbone.View.extend({
        _template: _.template(TransferTemplate),           

        events: {
            "keypress #textboxSearchTransfer": "textboxSearch_keypress",
        },        
        
        buttonBackCheckList_tap: function (e) {
            this.CheckListBack();            
        },

        buttonBackItemSetting_tap: function (e) {
            $('td').removeClass('highlight');
            this.currentStock = null;
            this.SwitchDisplay('page1', "ItemSetting");
        },

        buttonBackTransferDetail_tap: function (e) {
            this.UpdateTransferDetail();
            this.SwitchDisplay('page1', null);
        },

        buttonCancelRemoveItems_tap: function (e) {
            Shared.RemoveCheckedItems(this.cartCollection);
        },

        buttonComplete_tap: function (e) {
            this.TransferStockItems();            
        },

        buttonMore_tap: function (e) {
            var self = this;
            $('#completedSection').removeClass('section-show').removeClass("bounceInDown").addClass("bounceOutUp");
            setTimeout(function () { self.InitializeChildViews(); }, 300);
        },
        
        buttonEditDetails_tap: function (e) {
            this.SwitchDisplay('page2', "TransferDetail");
        },        

        buttonLocationTo_tap: function (e) {
            this.SetCheckListNavTitle('locations');
            this.SwitchDisplay('page2', "CheckList");
            this.LoadFromToLocationOrZoneLookup(Enum.ListMode.ToLocation);
            this.FromMainPage = true;
        },

        buttonRemove_tap: function (e) {
            this.RemoveItemFromCart();
        },

        buttonRemoveItems_tap: function (e) {
            this.RemoveSelectedItems();
        },
        
        buttonSearchItemTransfer_tap: function (e) {
            this.FindItemByUPC();
        },

        buttonMenu_tap: function (e) {
            this.ShowDashBoard();
        },                       

        rowLocationTo_tap: function (e) {            
            this.$('#rowLocationTo').addClass('highlight');
            this.UpdateTransferDetail();
            this.SetCheckListNavTitle('locations');
            this.SwitchDisplay('page3', null);
            this.LoadFromToLocationOrZoneLookup(Enum.ListMode.ToLocation);
        },

        rowQty_tap: function (e) {
            if (CurrentPreference.TransferIsPromptForQty) {
                isFromItemSettingSection = true;
                this.ShowNumericPad($('#textQuantity').text());
            }
        },

        rowZoneFrom_tap: function (e) {                
            this.$('#rowZoneFrom').addClass('highlight');
            this.SetCheckListNavTitle('zones');
            this.SwitchDisplay('page3', false);
            this.LoadFromToLocationOrZoneLookup(Enum.ListMode.FromZone);            
        },        

        rowZoneTo_tap: function (e) {
            if(this.StockHasWarehouseCodeDest()) {                
                this.$('#rowZoneTo').addClass('highlight');
                this.SetCheckListNavTitle('zones');
                this.SwitchDisplay('page3', null);
                this.LoadFromToLocationOrZoneLookup(Enum.ListMode.ToZone);
            } else {
                navigator.notification.alert("You must select destination warehouse from transfer detail.");
            }
        },

        rowUnitMeasure_tap: function (e) {            
            this.$('#rowUnitMeasure').addClass('highlight');
            this.SetCheckListNavTitle('unit measures');
            this.SwitchDisplay('page3', null);
            this.LoadFromToLocationOrZoneLookup(Enum.ListMode.UM);
        },      

        textboxSearch_keypress: function (e) {
            if (e.keyCode === 13) {
                this.FindItemByUPC();
            }
        },        
        
        initialize: function () {
            Global.ApplicationType = "Transfer";
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
            this.InitializeItemLookup();
            this.InitializeNumericPad();            
            Shared.Focus('#textboxSearchTransfer');
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
            $('#textItemCode').text(this.currentStock.model.get('ItemCode'));
            $('#textItemName').text(this.currentStock.model.get('ItemName'));
            // $('#textItemDesc').text(this.currentStock.model.get('ItemDescription'));
            $('#textUPCCode').text(Shared.ConvertNullToEmptyString(this.currentStock.model.get('UPCCode')));
            $('#textQuantity').text(this.currentStock.model.get('Quantity'));
            $('#textFreeStock').text(this.currentStock.model.get('FreeStock'));
            $('#textUnitMeasureCode').text(this.currentStock.model.get('UnitMeasureCode'));
            $('#textLocationCodeSource').text(this.currentStock.model.get('LocationCodeSourceDesc'));
            $('#textLocationCodeDest').text(this.currentStock.model.get('LocationCodeDestDesc'));
             if (itemDescription.length > 20) {
                 this.$('#rowDesc').html("<a>Description<br><span style='white-space:normal'>" + itemDescription  + "</span></a>")
             }
            else {
                  this.$('#rowDesc').html("<a><span class='pull-right'>" + itemDescription  + "</span>Description</a>")
            }
        },

        InitializeModel: function (isRender) {
            var transferCode = Global.TransactionCode;
            this.model = new TransferModel();
            var today = new Date();
            this.model.set({
                TransferCode: transferCode,
                TransferDate: this.ConvertDateToDateTime(today),
                TransferDateJSON: this.ConvertDateToJSON(today),
                WarehouseCodeSource: CurrentPreference.DefaultLocation,
                WarehouseCodeDest: "",
                WorkstationID: CurrentPreference.WorkstationID,
                Notes: "",
                Counter: 0,                
                TotalItems: 0,
            });            

            if (isRender) this.$el.html(this._template(this.model.toJSON()));
            else this._template(this.model.toJSON());
        },

        InitializeNewTransaction: function (isRender) {            
            this.InitializeModel(isRender);            
            this.InitializeCartCollection();                        
            this.ShowTransferSection();            
        },

        InitializeNumericPad: function () {
            var self = this;
            var view = new NumericPadView();
            this.$('#numericPadContainer').html(view.render());

            var headerName = '#transferHeader';
            view.WireNumericPadEvents();
            view.off('closenumericpad', function (e) {
                $(headerName).show();
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
                        self.ItemLookupView.SlideDownItemLookup();
                    }
                }
                isFromItemSettingSection = false;
                Shared.Focus('#textboxSearchTransfer');
            });
            view.on('closenumericpad', function (e) {
                $(headerName).show();
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
                        self.ItemLookupView.SlideDownItemLookup();
                    }
                }
                isFromItemSettingSection = false;
                Shared.Focus('#textboxSearchTransfer');
            });
            view.off('quantitychange', function (numericPadCriteria) {
                var qtyScanned = self.currentStock.model.get("QuantityScanned");
                self.ChangeItemQuantity(self.currentStock.model, numericPadCriteria.NumericPadValue)
              
                $(headerName).show();
            
                isFromItemSettingSection = false;
                self.ItemLookupView.SlideDownItemLookup();
                view.SlideDownNumericPad();
                Shared.Focus('#textboxSearchTransfer');
            });
            view.on('quantitychange', function (numericPadCriteria) {
                var qtyScanned = self.currentStock.model.get("QuantityScanned");
                self.ChangeItemQuantity(self.currentStock.model, numericPadCriteria.NumericPadValue)
                
                $(headerName).show();
              
                isFromItemSettingSection = false;
                self.ItemLookupView.SlideDownItemLookup();
                view.SlideDownNumericPad();
                Shared.Focus('#textboxSearchTransfer');
            });
        },

        Animate: function (isAnimate, isFullScreen) {
            this.ProgressScreen = Shared.ShowProgress(this.ProgressScreen, isAnimate, "itemMainSlider", isFullScreen);
        },

        AnimateCompleteButton: function (isAnimate) {
            if (isAnimate) this.$('#buttonCompleteTransfer').text('transferring...');
            else this.$('#buttonCompleteTransfer').text('complete');
        },

        AddItemToCart: function (item) {
            var itemModel = null;
            
            itemModel = this.AssignItemProperties(item);
            this.cartCollection.add(itemModel);                
            
            this.RenderItem(this, itemModel);

            if (CurrentPreference.TransferIsPromptForQty) {
                this.ShowNumericPad(1);
            }
            else {
                this.ChangeItemQuantity(this.currentStock.model, 1);
                this.ItemLookupView.SlideDownItemLookup();
                Shared.Focus("#textboxSearchTransfer");
            }
                        
            Shared.BeepSuccess();
            this.iScroll = Shared.LoadiScroll(this.iScroll, "Transfer");
        },

        AssignItemProperties: function(item) {
            if (item) {
                var itemModel = new CartItemModel();
                var unitMeasure = item.UnitMeasureCode;
                var counter = this.cartCollection.length + 1;

                if (item.WarehouseCode == null) item.WarehouseCode = CurrentPreference.DefaultLocation;
                if (!unitMeasure) unitMeasure = item.UnitMeasure;

                itemModel.set({
                    CurrentQuantityScanned: 0,
                    ItemCode: item.ItemCode,
                    ItemID: counter,
                    ItemName: item.ItemName,
                    ItemDescription: item.ItemDescription,
                    LocationCodeSource: "Zone1",
                    LocationCodeSourceDesc: "Normal",
                    LocationCodeDest: "Zone1",
                    LocationCodeDestDesc: "Normal",
                    Quantity: 0,
                    QuantityScanned: 0,
                    RowNumber: counter,
                    TapeItemID: "ITEM" + counter,
                    UPCCode: item.UPCCode,
                    UnitMeasureCode: unitMeasure,
                    CartItemImage: Shared.GetImageUrl(Enum.ImageType.CartItem, item.ItemIconFile)
                });

                if (CurrentPreference.TransferIsShowQtyOnHand) {
                    itemModel.set({ FreeStock: item.FreeStock });
                }
                
                return itemModel;
            }
        },        

        ChangeItemQuantity: function (item, qty) {
            var qtyToAdd = 0
            if (!isFromItemSettingSection) {
                qtyToAdd = Shared.ChangeItemQuantity(item, qty, Enum.LookupMode.Transfer, "add")
            }
            else {
                qtyToAdd = Shared.ChangeItemQuantity(item, qty, Enum.LookupMode.Transfer, "replace")
            }
            this.UpdateTotalItems(qtyToAdd);
        },        

        CheckListBack: function () {
            if (this.FromMainPage) {
                this.FromMainPage = false;
                this.SwitchDisplay('page1', null);
            }
            else {
                $('li').removeClass('highlight');
                this.SwitchDisplay('page2', null);
            }
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

        ConvertDateToJSON : function(transactionDate){            
            var DateFormat = 'YYYY-MM-DD';
            var _tDate = moment(transactionDate).format(DateFormat); 
            return _tDate;
        },

        FindItemByUPC: function () {

            var targetLocation = this.model.get("WarehouseCodeDest");
            if (targetLocation == null || targetLocation == "") {
                Shared.NotifyError("Target location is not set. Go to details to setup target location.");
                Shared.BeepError();
                return false;
            }

            var upcCode = this.$("#textboxSearchTransfer").val();
            
            this.$("#textboxSearchTransfer").val("");

            if (upcCode) this.GetItemByUPC(upcCode);
            else {
                Shared.NotifyError("Item not found.");
                Shared.BeepError();
            }
        },        

        GetItemByUPC: function (upcCode) {
            var self = this;
            this.Animate(true, false);
            
            var itemLookup = new LookupCriteriaModel();            
            itemLookup.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADITEMBYUPC + "upcCode=" + upcCode
                                                                                  + "&warehouseCode=" + CurrentPreference.DefaultLocation
                                                                                  + "&isShowFreeStock=" + CurrentPreference.TransferIsShowQtyOnHand
                                                                                  + "&useCbe=" + CurrentPreference.UseCbeImage
                                                                                  + "&webSite=" + CurrentPreference.WebSiteCode;

            itemLookup.fetch({
                success: function (model, response, options) {                    
                    if (!model.get("hasError")) {
                        if (response != null && response.Items != null && response.Items.length > 0) {
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
        },        

        HasOpenTransaction: function() {
            if (this.cartCollection.length > 0) return true;
            else return false;
        },
        
        HighLightListItem: function(itemView) {
            this.$('.listitem-1').addClass('listitem-1').removeClass('listitem-2');
            this.$('.listitem-2').addClass('listitem-1').removeClass('listitem-2');
            Shared.HighLightItem(itemView.cid, "CheckList");
            this.$('#listItem' + itemView.model.get('ViewID')).removeClass('listitem-1').addClass('listitem-2');
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
                this.Animate(true, false);
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
            this.SwitchDisplay('page2', "ItemSetting");
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
                    $('#itemQty' + oldTapeItemID).attr("id", 'itemQty' + newTapeItemID);
                    $('#itemUM' + oldTapeItemID).attr("id", 'itemUnitMeasureCode' + newTapeItemID);
                    $('#buttonItemSetting' + oldTapeItemID).attr("id", 'buttonItemSetting' + newTapeItemID);
                });
            }
        },

        RemoveItemFromCart: function () {
            var self = this;

            navigator.notification.confirm("Are you sure you want to remove this item?", function (button) {
                if (button == 1) {
                    if (self.currentStock != null) {
                        var model = self.currentStock.model;

                        self.cartCollection.remove(model);
                        self.currentStock.remove();

                        self.UpdateTotalItems(self.currentStock.model.get('QuantityScanned') * -1);
                        model.destroy();

                        self.RefreshRowNumber(self.cartCollection);
                        self.iScroll = Shared.LoadiScroll(self.iScroll, "Transfer");
                        self.SwitchDisplay('page1', null);
                    }
                }
            }, "Remove Item" , "Yes,No");            
        },

        RemoveSelectedItems: function () {
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
                    self.iScroll = Shared.LoadiScroll(self.iScroll, "Transfer");
                    $('#slideFooter').removeClass("slideInUpFooter").addClass("slideOutDownFooter");
                }
            });
        },
              
        RemoveItemFromCollection: function (item) {            
            this.cartCollection.remove(item);
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
                                    self.CheckListBack();
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

                                if (listMode == Enum.ListMode.ToLocation) {
                                    var locationCode = self.model.get('WarehouseCodeDest');
                                    if (locationCode) {
                                        if (current.WarehouseCode == locationCode) {
                                            self.HighLightListItem(checklistItemView);
                                        }
                                    }
                                }

                                Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {
                                    self.UpdateStockItemSetting(checklistItemView, listMode);
                                    self.CheckListBack();
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
                                    self.CheckListBack();
                                });
                            });
                        }
                        break;                        
                }
                this.iScrollCheckList = Shared.LoadiScroll(this.iScrollCheckList, "CheckList");
            }
        },        

        RenderItem: function (self, itemModel) {
            
            var itemView = new CartItemView({ model: itemModel });
            self.$("#cartListTransfer tbody").append(itemView.render());

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
                var qty = $('#itemQty' + tapeItemID);

                var settingQty = $('#textQuantity');
                var settingUM = $('#textUnitMeasureCode');
                var settingLocationCodeSource = $('#textLocationCodeSource');
                var settingLocationCodeDest = $('#textLocationCodeDest');                

                var newQty = itemView.model.get('Quantity');
                var newUM = itemView.model.get('UnitMeasureCode');
                var newLocationCodeSource = itemView.model.get('LocationCodeSourceDesc');
                var newLocationCodeDest = itemView.model.get('LocationCodeDestDesc');

                if (qty.text() != newQty) qty.text(newQty);                                
                if (um.text() != newUM) um.text(newUM);                

                if (settingQty.text() != newQty) settingQty.text(newQty);
                if (settingUM.text() != newUM) settingUM.text(newUM);
                if (settingLocationCodeSource.text() != newLocationCodeSource) settingLocationCodeSource.text(newLocationCodeSource);
                if (settingLocationCodeDest.text() != newLocationCodeDest) settingLocationCodeDest.text(newLocationCodeDest);               

            };

            itemView.model.off('change', onAttributeChanged);
            itemView.model.on('change', onAttributeChanged);

            self.currentStock = itemView; 
        },

        ResetControls: function () {
            $('#textboxSearchTransfer').val('');
            $('#cartListTransfer tbody').html('');
            $('#cartCheckList tbody').html('');
            $('#textTotalItems').text(this.model.get('TotalItems'));
        },

        SetCheckListNavTitle: function (title) {
            $("#checkListNavTitle").text(title);
        },

        ShowCompletedSection: function () {
            $('#completedNavTitle').text(this.model.get('TransferCode'));
            $('#completedMessage').text('Transfer Completed!');
            $('#buttonMore').text('transfer more');                
            $('#completedSection').removeClass('section-close').removeClass('bounceOutUp').addClass('section-show').addClass("bounceInDown");
        },

        ShowCheckListSection: function () {
            $('#itemSettingSection').addClass('section-close').removeClass('section-show');
            $('#transferDetailSection').addClass('section-close').removeClass('section-show');
        },

        ShowDashBoard: function (button) {

            var showDashBoard = function (button) {
                if (button === 1) {
                    window.location.hash = "dashboard";
                }
            };

            if (this.HasOpenTransaction()) {

                navigator.notification.confirm('There is an open transaction, Do you still want to proceed?', showDashBoard, "Confirmation", "Yes,No");

            } else window.location.hash = "dashboard";
            
        },

        ShowFreeStockItemSetting: function () {
            if (CurrentPreference.TransferIsShowQtyOnHand) $('#rowFreeStock').show();
            else $('#rowFreeStock').hide();
        },

        ShowNumericPad: function (qty) {
            $('#textboxQuantity').val(qty);
            $('#textboxSearchTransfer').blur();
            $('#transferHeader').hide();
            $('#buttonCompleteTransfer').focus();
            $('.numericpad').addClass('slideInUp').removeClass('slideOutDown');
        },        

        ShowItemLookup: function (items) {
            if (items) {
                this.ItemLookupView.RenderItems(items);
                $('#transferHeader').hide();
                $('#itemLookupSection').addClass('slideInUp').removeClass('slideOutDown');
            }
        },

        ShowItemSettingSection: function () {
            $('#itemSettingSection').addClass('section-show').removeClass('section-close');
            $('#transferDetailSection').addClass('section-close').removeClass('section-show');
            this.LoadiScroll();
        },

        ShowTransferSection: function() {                                    
            $('#textTransferTotalItems').text(this.model.get('TotalItems'));
            $('#textLocationTo').text(this.model.get('WarehouseCodeDest'));
            $('#transferDetailNotes').val(this.model.get('Notes'));
        },

        ShowTransferDetailSection: function () {
            $('#transferDetailSection').addClass('section-show').removeClass('section-close');
            $('#itemSettingSection').addClass('section-close').removeClass('section-show');
        },

        StockHasWarehouseCodeDest: function () {
            var toLocation = this.model.get('WarehouseCodeDest');
            if (toLocation != null && toLocation != "") {
                return true;
            } else {
                return false;
            }
        },

        SwitchDisplay: function (page, pageMode) {            
            switch (page) {
                case "page1":                    
                    Shared.SlideX('.slider', 0);
                    Shared.Focus('#textboxSearchTransfer');
                    break;
                case "page2":
                    this.$('#textboxSearchTransfer').blur();
                    switch(pageMode)
                    {
                        case "ItemSetting":
                            this.ShowItemSettingSection();
                            break;
                        case "TransferDetail":
                            this.ShowTransferDetailSection();
                            break;
                        case "CheckList":
                            this.ShowCheckListSection();
                    }                                            
                    Shared.SlideX('.slider', Global.ScreenWidth * -1);
                    break;
                case "page3":                    
                    Shared.SlideX('.slider', Global.ScreenWidth * -2);
                    break;
            }
        },

        TransferStockItems: function () {
            if (!this.ValidateTransfer()) return false;

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
                        if (response.ErrorMessage) {
                            navigator.notification.alert(response.ErrorMessage, null, "Transfer", "OK");
                        }
                        else {
                            self.model.set({ TransferCode: response.Adjustments[0].ReferenceCode });
                            self.ShowCompletedSection();
                            self.InitializeCartCollection();
                        }
                    }
                    self.AnimateCompleteButton(false);
                },
                progress: this.ProgressScreen
            });
        },                

        UpdateCart: function (item) {
            if (item) {
                var upcCode = "";
                var itemCode = "";
                var unitMeasureCode = "";

                if (item instanceof Backbone.Model) {
                    upcCode = item.get('UPCCode');
                    itemCode = item.get('ItemCode');
                    if (!upcCode) upcCode = item.get('ItemCode');
                    unitMeasureCode = item.get('UnitMeasureCode');
                } else {
                    upcCode = item.UPCCode;
                    itemCode = item.ItemCode;
                    if (!upcCode) upcCode = item.ItemCode;
                    unitMeasureCode = item.UnitMeasureCode;
                }
                var existingItem = Shared.FindItem(this.cartCollection, itemCode, unitMeasureCode);

                if (existingItem) {
                    this.UpdateItemQuantity(existingItem);                    
                }
                else this.AddItemToCart(item);
            }
        },

        UpdateItemQuantity: function (item) {
            Shared.BeepSuccess();

            if (CurrentPreference.TransferIsPromptForQty) {
                this.currentStock = new CartItemView({ model: item });
                this.ShowNumericPad(1);
            }
            else {
                this.ChangeItemQuantity(item, 1);
                this.ItemLookupView.SlideDownItemLookup();
                Shared.Focus("#textboxSearchTransfer");
            }

        },

        UpdateTransferDetail: function () {
            var transferDateJSON = this.ConvertDateToJSON(this.model.get('TransferDate'));
            this.model.set({ TransferDateJSON: transferDateJSON });
            this.model.set({ Notes: $('#transferDetailNotes').val() });
        },

        UpdateStockItemSetting: function (itemView, listMode) {
            switch (listMode) {                
                case Enum.ListMode.ToLocation:
                    var warehouseCode = itemView.model.get('WarehouseCode');
                    var warehouseCodeDesc = itemView.model.get('ListItemTitle');
                    this.model.set({ WarehouseCodeDest: warehouseCode });
                    $('#textLocationToHeader').text(warehouseCodeDesc);
                    $('#textLocationTo').text(warehouseCodeDesc);
                    
                    if ($('#textLocationToHeader').text()) $('#buttonLocationTo').removeClass('btn-danger').addClass('btn-inverse2');
                    else $('#buttonLocationTo').removeClass('btn-inverse2').addClass('btn-danger');
                    break;
                case Enum.ListMode.UM:
                    this.currentStock.model.set({ UnitMeasureCode: itemView.model.get('UnitMeasureCode') });
                    break;
                case Enum.ListMode.FromZone:
                    this.currentStock.model.set({
                        LocationCodeSource: itemView.model.get('LocationCode'),
                        LocationCodeSourceDesc: itemView.model.get('ListItemRow1')
                    });
                    break;
                case Enum.ListMode.ToZone:
                    this.currentStock.model.set({
                        LocationCodeDest: itemView.model.get('LocationCode'),
                        LocationCodeDestDesc: itemView.model.get('ListItemRow1')
                    });
                    break;
            }
            this.HighLightListItem(itemView);
        },

        UpdateTotalItems: function (qty) {
            var total = this.model.get('TotalItems');            
            this.model.set({ TotalItems: total += qty });

            $('#textTransferTotalItems').text(this.model.get('TotalItems'));            
        },

        ValidateTransfer: function () {
            if (this.cartCollection == null || this.cartCollection.length == 0) {
                navigator.notification.alert("There are no items to process.", null, "Transfer", "OK");
                return false;
            }

            var targetLocation = this.model.get("WarehouseCodeDest");
            if (targetLocation == null || targetLocation == "") {
                navigator.notification.alert("Target location is not set. Go to details to setup target location.", null, "Transfer", "OK");
                return false;
            }

            var dateTransfer = this.model.get("TransferDate");
            if (dateTransfer == null || dateTransfer == "") {                
                navigator.notification.alert("Transfer Date was not set. Go to details to setup the date.", null, "Transfer Date", "OK");
                return false;
            }

            return true;
        },
        
        WireEvents: function () {            
            var self = this;

            Shared.AddRemoveHandler('#buttonBackCheckList', 'tap', function (e) { self.buttonBackCheckList_tap(e); });
            Shared.AddRemoveHandler('#buttonBackItemSetting', 'tap', function (e) { self.buttonBackItemSetting_tap(e); });
            Shared.AddRemoveHandler('#buttonBackTransferDetail', 'tap', function (e) { self.buttonBackTransferDetail_tap(e); });
            Shared.AddRemoveHandler('#buttonCancelRemoveItems', 'tap', function (e) { self.buttonCancelRemoveItems_tap(e); });
            Shared.AddRemoveHandler('#buttonCompleteTransfer', 'tap', function (e) { self.buttonComplete_tap(e); });
            Shared.AddRemoveHandler('#buttonCounter', 'tap', function (e) { self.buttonCounter_tap(e); });
            Shared.AddRemoveHandler('#buttonMenuCompleted', 'tap', function (e) { self.buttonMenu_tap(e); });
            Shared.AddRemoveHandler('#buttonMenuTransfer', 'tap', function (e) { self.buttonMenu_tap(e); });
            Shared.AddRemoveHandler('#buttonMore', 'tap', function (e) { self.buttonMore_tap(e); });
            Shared.AddRemoveHandler('#buttonRemove', 'tap', function (e) { self.buttonRemove_tap(e); });
            Shared.AddRemoveHandler('#buttonRemoveItems', 'tap', function (e) { self.buttonRemoveItems_tap(e); });
            Shared.AddRemoveHandler('#buttonSearchItemTransfer', 'tap', function (e) { self.buttonSearchItemTransfer_tap(e); });
            Shared.AddRemoveHandler('#buttonTransferEditDetails', 'tap', function (e) { self.buttonEditDetails_tap(e); });
            
            Shared.AddRemoveHandler('#rowZoneTo', 'tap', function (e) { self.rowZoneTo_tap(e); }); 
            Shared.AddRemoveHandler('#rowZoneFrom', 'tap', function (e) { self.rowZoneFrom_tap(e); }); 
            Shared.AddRemoveHandler('#rowQty', 'tap', function (e) { self.rowQty_tap(e); });
            Shared.AddRemoveHandler('#buttonLocationTo', 'tap', function (e) { self.buttonLocationTo_tap(e); });
            Shared.AddRemoveHandler('#rowLocationTo', 'tap', function (e) { self.rowLocationTo_tap(e); });

            //Tentative
            //Shared.AddRemoveHandler('#rowUnitMeasure', 'tap', function (e) { self.rowUnitMeasure_tap(e); }); 
            $('#rowUnitMeasure i').hide();
        },        
    });
    return TransferView;
});