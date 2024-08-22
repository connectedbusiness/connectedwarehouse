/**
 * @author Interprise Solutions
 */
define([
	'jquery',
	'underscore',
	'backbone',
    'view/common/enum',
	'model/stockTake',
    'model/lookupcriteria',
    'model/cartItem',
    'model/checkListItem',
	'collection/cart',
	'view/common/global',
	'view/common/service',
	'view/common/shared',
	'view/common/method',
    'view/common/preference',
    'view/base/numericpad',
    'view/binManager/binManager',
    'view/lookup/itemLookup/itemLookup',
    'view/stockTake/card',
    'view/stockTake/cardList',
    'view/stockTake/cartItem',
    'view/stockTake/cartSkippedItem',
    'view/stockTake/itemSetting',
    'view/stockTake/checkListItem',
	'text!template/stockTake/stockTake.tpl.html',

], function ($, _, Backbone, Enum,
	StockTakeModel, LookupCriteriaModel, CartItemModel, CheckListItemModel,
	CartCollection, Global, Service, Shared, Method, Preference,
	NumericPadView, BinManagerView, ItemLookupView, CardView, CardListView, CartItemView, CartSkippedItemView, ItemSettingView, CheckListItemView,
    StockTakeTemplate) {

    var currentLocation = 0;
    var currentScannedItemQuantity = 0;
    var listWidth = Global.ScreenWidth;
    var resumeQuantityScanned = 0;
    var isFromRemainingItemSection = false;
    var isOnItemSettingSection = false;
    var isSkipped = false;
    var isUpdate = false;
    var isRotateCard = true;
    var pageNumber = 1;
    var remainingItemPageNumber = 1;
    var lastPageNumber = 0;
    var lastPage = false;
    var remainingItemLastPage = false;
    var isFromSkipItems = false;
    var resumeItemCount = 0;

    var StockTakeView = Backbone.View.extend({
        _template: _.template(StockTakeTemplate),        

        events: {
            "webkitAnimationEnd .pick-item-back": "pickBody_webkitAnimationEnd",
            "webkitTransitionEnd #itemLookupSection": "itemLookupSection_webkitTransitionEnd",
            "webkitTransitionEnd #skippedItemList": "skippedItemList_webkitTransitionEnd",
            "webkitTransitionEnd .numericpad": "numericpad_webkitTransitionEnd",
            "keypress #textScanItemCount": "textScanItemCount_keypress",
            "keypress #textboxSearch": "textboxSearch_keypress",
        },
        
        initialize: function () {
        },

        buttonBackCheckList_tap: function (e) {
            this.CheckListBack();
        },

        buttonBackItemCount_tap: function (e) {
            this.GoToMenu();
            listWidth = Global.ScreenWidth;
        },

        buttonBackItemsRemaining_tap: function (e) {
            this.ShowRemainingItems(false);
        },

        buttonBackItemRemSetting_tap: function (e) {
 			$('td').removeClass('highlight');        
            this.ShowRemainingItems(true);
            this.SwitchItemRemSettingDisplay('page1');
        },

        buttonBackItemSetting_tap: function (e) {
            this.CurrentItemView.model.set({ IsChangeFromItemSetting: false });
            $('td').removeClass('highlight');
            this.SwitchDisplay("page1");
        },

        buttonBackMiscPhysical_tap: function (e) {
            this.GoToMenu();
        },

        buttonBackSkippedItems_tap: function (e) {
            this.itemsSkipped.remove(this.itemCollection.models[0]);
            this.ShowSkippedItems(false);
        },

        buttonCancelRemoveItems_tap: function (e) {
            Shared.RemoveCheckedItems(this.cartCollection);
        },

        buttonComplete_tap: function (e) {
            this.CompleteStockTake();
        },

        buttonCounter_tap: function (e) {
            remainingItemPageNumber = 1;
            if (this.itemCollection.length < 10) {              
                    this.ResetPageNumber(true);
                }
                else {
                    this.LoadRemainingPageItems();
                }
            
     
        },

        buttonDelete_tap: function () {
            this.RemoveItem();
        },

        buttonItemCount_tap: function (e) {
            pageNumber = 1;
            if (this.TotalItemCount > 0) this.InitializeItemCountSection();
            else {
                Shared.BeepError();
                Shared.NotifyError("There are no items to count.");
            }
        },

        buttonMenu_tap: function (e) {
            window.location.hash = "dashboard";
        },

        buttonMiscPhysical_tap: function (e) {
            this.InitializeMiscPhysical();
        },        

        buttonMore_tap: function (e) {
            var self = this;
            this.$('#completedSection').removeClass('section-show').removeClass("bounceInDown").removeAttr('style').addClass("bounceOutUp");
            self.RefreshStockTakeSection();
            self.ShowStockTakeSection();
            self.itemCodeCollection.reset();
            self.LoadDueAndOverdueItemCodes();
        },

        buttonNextItem_tap: function (e) {

            if (lastPage && this.itemCollection.length == 0) {
                this.ValidateCompleteItemCount(false);
                return;
            }
            else {

                var item = this.GetFirstOrDefaultItemInCollection();
                if (item) this.currentItem = this.GetFirstOrDefaultItemInCollection();
                var qty = 0;
                qty = this.currentItem.get("Quantity");
                if (!qty) qty = 0;
                if (qty == 0) {
                    if (Preference.PhysicalInventoryIsAllowToSkipItems) {
                        this.SkipItem();
                    } else {
                        Shared.NotifyError("Item not yet scanned.");
                        Shared.BeepError();
                    }
                } else this.GotoNextItem();
            }
          
        },

        buttonRemoveItems_tap: function (e) {
            this.RemoveSelectedItems();
        },

        buttonResume_tap: function (e) {
            lastPage = false;
            pageNumber = 1;
            this.InitializeResumeStockTake();
            $("#textCounter").text(resumeItemCount);
            $("#textTotalItemsRemaining").text(resumeItemCount);
           // this.ResetPageNumber();

        },

        buttonScanItemCount_tap: function (e) {
            this.ScanItem();
        },

        buttonSearch_tap: function (e) {
            this.SearchItem();
        },

        buttonSkippedItemsLookup_tap: function (e) {
            this.ShowSkippedItems(true);
        },

        buttonPostpone_tap: function (e) {
            if (this.model.get("IsResume")) {
                this.PostponeStockTake();
            } else {
                var self = this;
                var message = "";

                if (this.HasPostponed) message = "There is still a postponed stocktake, Do you want to continue? This will overwrite the existing postponed stocktake.";
                else message = "Current action will create a suspended list of " + this.Mode + ", Do you still want to continue?";

                navigator.notification.confirm(message, function (button) {
                    if (button == 1) {
                        resumeItemCount = self.itemCodeCollection.length;
                        self.PostponeStockTake();
                    }
                }, "Postpone Item Count", "Yes,No");
            }
        },

        buttonItemSetting_tap: function (e) {
            $('#itemSettingSection').removeClass('section-close').addClass('section-show');
            this.InitializeItemSetting();
            this.SwitchDisplay("page2");
            this.ShowFreeStockItemSetting();
        },


        buttonPreviousPage_tap: function (e) {
            if (lastPageNumber == 1) return;
            if (remainingItemPageNumber > 1) {
                remainingItemPageNumber = remainingItemPageNumber - 1;
                this.$('#buttonPreviousPage').prop('disabled', false);
            }
             
            if (remainingItemPageNumber >= 1)
            {
                if (remainingItemPageNumber == 1) this.$('#buttonPreviousPage').prop('disabled', true);
                this.LoadRemainingPageItems();
                //   this.LoadNextItems(true,false, false);
            }
   
          
          },

        buttonNextPage_tap: function (e) {
            if (lastPageNumber == 1) return;
            remainingItemPageNumber = remainingItemPageNumber + 1;
            // this.LoadNextItems(true, false,false);
            this.LoadRemainingPageItems();
        },

       
        LoadNextItems: function (isFromNextButton) {   
            this.Mode = "ItemCount";
            this.itemCollection.reset();
            this.currentItem = null;
            this.quantityToScan = 0;
            this.model.set({
                Counter: 0,
                LocationCode: "Zone1",
                TotalItemsSkipped: 0,
                TotalItems: 0
            });
            //$('#cartListItemsRemaining tbody').html("");
            $('#itemCountBody').html(this.GetDefaultContainerHTML());
            $('#itemCountBody').width(Global.ScreenWidth);
            $('#textScanItemCount').val("");
            listWidth = Global.ScreenWidth;
            currentLocation = 0;
            this.itemSkippediScroll = null;
            this.ShowItemCountSection();

            $('#buttonItemCountDetails').hide();

            if (isFromNextButton) {

                this.LoadItemByStockTakeDays(false, true);
            } else this.LoadItemByStockTakeDays(false, false);
            this.$('#itemCountHeader').show();
            Shared.Focus('#textScanItemCount');

        },


        LoadRemainingPageItems: function () {
            this.cartItemCollection.reset();
            $('#cartListItemsRemaining tbody').html("");          
            $('#textScanItemCount').val("");      
            this.itemSkippediScroll = null;
            this.ShowItemCountSection();
            $('#buttonItemCountDetails').hide();
            this.LoadItemPerPage();           
            this.$('#itemCountHeader').show();     
        },


        rowQty_tap: function (e) {
            if (Preference.PhysicalInventoryIsPromptForQty) {
                isOnItemSettingSection = true;
                this.ShowNumericPad($("#textQuantity").text());
            }
        },



        itemLookupSection_webkitTransitionEnd: function (e) {
            if (this.Mode == "ItemCount") {
                if (this.currentItem) {
                    //TEMP
                    //if (!Preference.PickIsPromptForQty) {
                    //    this.PickNextItem(this.currentItem, this.quantityToScan);
                    //    this.currentItem = null;
                    //    this.quantityToScan = 1;
                    //}
                }
            }
        },

        numericpad_webkitTransitionEnd: function (e) {
            if (this.Mode == "ItemCount") {
                if (this.currentItem && this.quantityToScan) {
                    this.GetNextItem(this.currentItem, this.quantityToScan);
                    this.quantityToScan = 1;
                }
            }
        },

        pickBody_webkitAnimationEnd: function (e) {
            if (this.Mode == "ItemCount") {
                this.$("#containerCard").show();
                this.$("#containerItemSettings").show();
                this.$("#containerTransition").hide();
            }

            this.RenderCard(this.currentItemModel, false);
        },

        skippedItemList_webkitTransitionEnd: function (e) {
            isRotateCard = true;
        },

        textboxSearch_keypress: function (e) {
            if (e.keyCode === 13) {
                this.SearchItem();
            }
        },

        textScanItemCount_keypress: function (e) {
            if (e.keyCode === 13) {
                this.ScanItem();
            }
        },

        AddItemToCart: function (item, isRefresh) {
            var cartItem = new CartItemModel();
            var counter = this.cartCollection.length + 1;
            var userCode = "";
            
            if (item.UserCode) userCode = item.UserCode;
            else userCode = Global.CurrentUser.UserCode;

            cartItem.set({
                AllocatedQty: item.UnitsAllocated,
                CurrentQuantity: 1,
                FreeStock: item.FreeStock,
                ExpectedQuantity: item.InStock,
                ItemAdjustmentType: "In",
                ItemCode: item.ItemCode,
                ItemID: counter,
                ItemName: item.ItemName,
                ItemDescription: item.ItemDescription,
                IsChangeFromItemSetting: false,
                IsNewlyAdded: !isRefresh,
                LastStockTake: item.LastStockTake,
                LocationCode: item.LocationCode,
                Quantity: 1,
                RowNumber: counter,
                RowID: counter,
                TapeItemID: "ITEM" + counter,
                UPCCode: item.UPCCode,
                UnitMeasureCode: item.UnitMeasureCode,
                UnitMeasureQty: item.UnitMeasureQty,
                UserCode: userCode,
                WarehouseCode: item.WarehouseCode,
                CartItemImage: Shared.GetImageUrl(Enum.ImageType.CartItem, item.ItemIconFile)
            });

            if (Preference.PhysicalInventoryIsPromptForQty) {
                cartItem.set({
                    CurrentQuantity: 0,
                    Quantity: 0,
                });
            }

            this.cartCollection.add(cartItem);

            var cartItemView = new CartItemView({ model: cartItem });
            var self = this;

            this.$("#cartListMiscPhysical tbody").append(cartItemView.render());
            this.myScroll = Shared.LoadiScroll(this.myScroll, "MiscPhysical");

            var tapeItemID = cartItemView.model.get('TapeItemID');

            var onAttributeChanged = function () {
                var um = $('#itemUnitMeasureCode' + tapeItemID);
                var qty = $('#itemQty' + tapeItemID);
                var warehouseCode = $('#itemLocation' + tapeItemID);

                var settingQty = $('#textQuantity');
                var settingUM = $('#textUnitMeasureCode');
                var settingLocation = $('#textLocation');

                var newQty = cartItemView.model.get('Quantity');
                var newUM = cartItemView.model.get('UnitMeasureCode');
                var newWarehouseCode = cartItemView.model.get('WarehouseCode');

                if (qty.text() != newQty) qty.text(newQty);
                if (um.text() != newUM) um.text(newUM);
                if (warehouseCode.text() != newWarehouseCode) warehouseCode.text(newWarehouseCode);

                if (settingQty.text() != newQty) settingQty.text(newQty);
                if (settingUM.text() != newUM) settingUM.text(newUM);
                if (settingLocation.text() != newWarehouseCode) settingLocation.text(newWarehouseCode);
            };

            Shared.AddRemoveHandler('.' + cartItemView.model.get('TapeItemID') + "-itemcol-1", 'tap', function () {
                Shared.ToggleItemCheck(cartItemView.model);
                Shared.ShowRemoveFooter(self.cartCollection);
            });
            Shared.AddRemoveHandler('.' + cartItemView.model.get('TapeItemID') + "-itemcol-2", 'tap', function () { self.LoadItemSetting(cartItemView) });
            Shared.AddRemoveHandler('.' + cartItemView.model.get('TapeItemID') + "-itemcol-3", 'tap', function () { self.LoadItemSetting(cartItemView) });
            Shared.AddRemoveHandler('.' + cartItemView.model.get('TapeItemID') + "-itemcol-4", 'tap', function () { self.LoadItemSetting(cartItemView) });

            cartItem.off("change", onAttributeChanged);
            cartItem.on("change", onAttributeChanged);            

            this.currentItem = cartItemView;

            if (isRefresh) {
                if (this.model.get("IsResume")) {
                    cartItem.set({
                        CurrentQuantity: item.Quantity,
                        RowID: item.RowID,
                        Quantity: item.Quantity,
                        QuantityScanned: item.Quantity
                    });

                    resumeQuantityScanned = item.Quantity;
                }
                this.ChangeRowColor(cartItem);
            }
            if (!isRefresh) {
                if (Preference.PhysicalInventoryIsPromptForQty) {
                    this.ShowNumericPad(1);
                } else {
                    this.UpdateTotalItems(1);
                    this.ItemLookupView.SlideDownItemLookup();
                    Shared.Focus("#textboxSearch");
                } 
                Shared.BeepSuccess();
            }
            
        },

        UpdateCart: function (item, isRefresh) {
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
                    this.UpdateItemQuantity(existingItem);
                }
                else this.AddItemToCart(item, isRefresh);
            }
        },

        AddItemFromItemLookup: function (item) {
            var upcCode = item.UPCCode;
            var itemCode = item.ItemCode;
            if (upcCode == null) upcCode = item.ItemCode;
            
            var existingItem = Shared.FindItem(this.cartCollection, item.ItemCode, item.UnitMeasureCode);

            if (existingItem) {
                this.UpdateItemQuantity(existingItem);
            }
            else this.AddItemToCart(item);
        },

        Animate: function (isAnimate, isFullScreen) {
            this.ProgressScreen = Shared.ShowProgress(this.ProgressScreen, isAnimate, "itemMainSlider", isFullScreen);
        },

        ChangeItemAdjustmentType: function (item) {
            if (item.get('Quantity') >= 1) {
                item.set({ ItemAdjustmentType: "In" });
            }
            else {
                item.set({ ItemAdjustmentType: "Out" });
            }
        },

        ChangeItemQuantity: function (item, qtyAdded) {
            var qtyToAdd = 0
            var physInvMode = 9 // 9 = ItemCount enum value

            if (this.Mode == "MiscPhysical") { physInvMode = 10}
            
            if (!isOnItemSettingSection) {
                qtyToAdd = Shared.ChangeItemQuantity(item, qtyAdded, physInvMode, "add");
                this.UpdateTotalItems(qtyAdded);
            } else {
                qtyToAdd = Shared.ChangeItemQuantity(item, qtyAdded, physInvMode, "replace");
                var totalItems = 0

                this.cartCollection.each(function (cartItem) {
                    var qty = cartItem.get('Quantity');
                    totalItems = totalItems + qty;
                });

                this.model.set({
                    TotalItems: totalItems
                });
                this.UpdateTotalItems(0);
            }
            this.ChangeRowColor(item);
        },

        ChangeRowColor: function (item) {
            if (item.get('Quantity') >= 0) {
                this.$('#rowNumber' + item.get('TapeItemID') + '.cartitem-rownumber').css('background-color', '#2980b9');
                this.$('#itemQty' + item.get('TapeItemID')).css('color', '#2c3e50');
                this.$('#textQty' + item.get('TapeItemID')).css('color', '#2c3e50');
            }
            else {
                this.$('#rowNumber' + item.get('TapeItemID') + '.cartitem-rownumber').css('background-color', '#c0392b')
                this.$('#itemQty' + item.get('TapeItemID')).css('color', '#c0392b');
                this.$('#textQty' + item.get('TapeItemID')).css('color', '#c0392b');
            }
        },

        CheckListBack: function () {
            $('li').removeClass('highlight');
            this.SwitchDisplay('page2', null);
        },

        CompleteStockTake: function () {
            var stockTakeModel = new StockTakeModel();
            var self = this;

            stockTakeModel.url = Global.ServiceUrl + Service.PRODUCT + Method.CREATESTOCKTAKE + Preference.DefaultLocation;

            switch (this.Mode)
            {
                case "ItemCount":
                    stockTakeModel.set({
                        StockTake: this.model,
                        StockTakeDetails: this.itemCountedCollection
                    });
                    this.Animate(true, true);
                    break;
                case "MiscPhysical":
                    if (this.cartCollection.length < 1) {
                        Shared.NotifyError("There are no items to process.");
                        Shared.BeepError();
                        return;
                    }
                    stockTakeModel.set({
                        StockTake: this.model,
                        StockTakeDetails: this.cartCollection
                    });
                    this.Animate(true, true);
                    break;
            }            
            
            stockTakeModel.save(null, {
                success: function (model, response, options) {                    
                    if (!model.get("hasError")) {                        
                        self.ShowCompleteSection(response, false);
                    }
                },
                progress: this.ProgressScreen
            });
        },

        DeleteByItemCode: function (collection, itemCode) {
            var itemToDelete = collection.where({ ItemCode: itemCode })[0] || null;
            if (itemToDelete) collection.remove(itemToDelete);
        },


        EnableDisablePagingButtons: function () {

            if (remainingItemLastPage && remainingItemPageNumber == 1) {
                this.$('#buttonPreviousPage').prop('disabled', true);
                this.$('#buttonNextPage').prop('disabled', true);
            }
            else if (remainingItemLastPage && remainingItemPageNumber > 1) {
                this.$('#buttonPreviousPage').prop('disabled', false);
                this.$('#buttonNextPage').prop('disabled', true);
            }

            else if (!remainingItemLastPage && remainingItemPageNumber == 1) {
                this.$('#buttonPreviousPage').prop('disabled', true);
                this.$('#buttonNextPage').prop('disabled', false);
            }

            else {
                this.$('#buttonPreviousPage').prop('disabled', false);
                this.$('#buttonNextPage').prop('disabled', false);
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

        InitializeCardViews: function () {
            this.CardCoverView = new CardView();
            this.CardFrontView = new CardView();
            this.CardBackView = new CardView();
            this.ItemSettingView = new ItemSettingView();
        },

        InitializeChildViews: function () {
            this.InitializeModel();
            this.InitializeCartCollection();
            this.InitializeCardViews();            
            this.InitializeItemCollection();
            this.InitializeItemCountedCollection();
            this.InitializeItemLookup();
            this.InitializeItemsSkipped();
            this.InitializeItemCodeCollection();
            this.InitializeItemCodeSkipCollection();
            this.InitializeCartItemCollection();
            this.InitializeNumericPad();            
            this.WireEvents();
            this.ShowHideControls();
            this.LoadDueAndOverdueItemCodes();
            this.LoadItemByStockTakeDays(true,false);
        },
        
        InitializeItemCollection: function () {
            if (this.itemCollection) {
                this.itemCollection.reset();
            }
            else {
                this.itemCollection = new CartCollection();
            }
        },

        InitializeItemCodeCollection: function () {
            if (this.itemCodeCollection) {
                this.itemCodeCollection.reset();
            }
            else {
                this.itemCodeCollection = new CartCollection();
            }
        },

        InitializeItemCodeSkipCollection: function () {
            if (this.itemCodeSkipCollection) {
                this.itemCodeSkipCollection.reset();
            }
            else {
                this.itemCodeSkipCollection = new CartCollection();
            }
        },

        InitializeItemCountedCollection: function () {
            if (this.itemCountedCollection) {
                this.itemCountedCollection.reset();
            }
            else {
                this.itemCountedCollection = new CartCollection();
            }
        },

        InitializeCartItemCollection: function () {
            if (this.cartItemCollection) {
                this.cartItemCollection.reset();
            }
            else {
                this.cartItemCollection = new CartCollection();
            }
        },


        InitializeItemCountSection: function () {
            this.model.set({
                HasOnlyOneItem: false,
                IsResume: false
            });
            this.HasPostponedStockTake();
            this.Mode = "ItemCount";
            this.RefreshItemCountSection(false);
            this.ShowItemCountSection();
            $('#buttonItemCountDetails').hide();
            this.LoadItemByStockTakeDays(false,false);
            this.$('#itemCountHeader').show();            
            Shared.Focus('#textScanItemCount');
        },

        InitializeItemLookup: function () {
            var self = this;
            this.ItemLookupView = new ItemLookupView();
            this.$('#itemLookupContainer').html(this.ItemLookupView.render());
            this.ItemLookupView.InitializeChildViews();
            this.ItemLookupView.on("itemSelected", function (item) { self.AddItemFromItemLookup(item); });
        },

        InitializeItemSetting: function () {
            var itemDescription =  this.CurrentItemView.model.get('ItemDescription');
            var upcCode = this.CurrentItemView.model.get('UPCCode');
            $('#textItemCode').text(this.CurrentItemView.model.get('ItemCode'));
            $('#textItemName').text(this.CurrentItemView.model.get('ItemName'));
            // $('#textItemDesc').text(this.CurrentItemView.model.get('ItemDescription'));
            if (upcCode) {
            $('#textUPCCode').text(upcCode);    
            }
            else $('#textUPCCode').text("");     
            
            $('#textQuantity').text(this.CurrentItemView.model.get('Quantity'));
            $('#textFreeStock').text(this.CurrentItemView.model.get('FreeStock'));
            $('#textUnitMeasure').text(this.CurrentItemView.model.get('UnitMeasureCode'));
            $('#textLocation').text(this.CurrentItemView.model.get('WarehouseCode'));
            if (itemDescription.length > 20) {
                 this.$('#rowItemDesc').html("<a>Description<br><span style='white-space:normal'>" + itemDescription  + "</span></a>")       
             }
            else {
                  this.$('#rowItemDesc').html("<a><span class='pull-right'>" + itemDescription  + "</span>Description</a>")      
            }

            this.CurrentItemView.model.set({ IsChangeFromItemSetting: true });
            currentScannedItemQuantity = this.CurrentItemView.model.get('Quantity');
        },

        InitializeItemsSkipped: function () {
            if (this.itemsSkipped) this.itemsSkipped.reset();
            else this.itemsSkipped = new CartCollection();
        },

        InitializeMiscPhysical: function () {
            this.model.set({ IsResume: false });
            this.HasPostponedStockTake();
            this.Mode = "MiscPhysical";
            this.RefreshMiscPhysicalSection();
            this.ShowMiscPhysicalSection();
        },

        InitializeModel: function () {
            this.model = new StockTakeModel();
            var today = new Date();

            this.model.set({           
                Counter: 0,
                HasOnlyOneItem: false,
                IsResume: false,
                LocationCode: "Zone1",
                Mode: "",
                Notes: "",
                TotalItemsIn: 0,
                TotalItemsOut: 0,
                TotalItemsSkipped: 0,
                UserCode: Global.CurrentUser.UserCode,
                WarehouseCode: Preference.DefaultLocation,
                WorkstationID: Preference.WorkstationID
            });

            this.$el.html(this._template);
        },

        InitializeNumericPad: function () {
            var self = this;
            var view = new NumericPadView();
            this.$('#numericPadContainer').html(view.render());

            var headerName = '#pickHeader';
            view.WireNumericPadEvents();
            view.off('closenumericpad', function (e) {
                $(headerName).show();

                if (isOnItemSettingSection) {
                    self.ItemLookupView.SlideDownItemLookup();
                }
                else {
                    var qtyScanned = 0
                    if (self.Mode == "ItemCount") { qtyScanned == self.currentItem.get("CurrentQuantity"); }
                    else { qtyScanned = self.currentItem.model.get("Quantity"); }

                    if (!qtyScanned == 0) { self.ItemLookupView.SlideDownItemLookup(); }
                    else {
                        if (self.Mode == "ItemCount") {
                            self.ChangeItemQuantity(self.currentItem, 1);
                            self.quantityToScan = self.currentItem.get("Quantity");
                        } else {
                            self.ChangeItemQuantity(self.currentItem.model, 1);
                        }
                    }
                }
                isOnItemSettingSection = false;
                if (self.Mode == "ItemCount") Shared.Focus('#textScanItemCount');
                else Shared.Focus('#textboxSearch');
            });
            view.on('closenumericpad', function (e) {
                $(headerName).show();
                if (isOnItemSettingSection) {
                    self.ItemLookupView.SlideDownItemLookup();
                }
                else {
                    var qtyScanned = 0
                    if (self.Mode == "ItemCount") { qtyScanned == self.currentItem.get("CurrentQuantity"); }
                    else { qtyScanned = self.currentItem.model.get("Quantity"); }
                    
                    if (!qtyScanned == 0) {self.ItemLookupView.SlideDownItemLookup();}
                    else {
                        if (self.Mode == "ItemCount") {
                            self.ChangeItemQuantity(self.currentItem, 1);
                            self.quantityToScan = self.currentItem.get("Quantity");
                        } else {
                            self.ChangeItemQuantity(self.currentItem.model, 1);
                        }
                    }
                }
                isOnItemSettingSection = false;
                if (self.Mode == "ItemCount") Shared.Focus('#textScanItemCount');
                else Shared.Focus('#textboxSearch');
            });
            view.off('quantitychange', function (numericPadCriteria) {
                switch (self.Mode)
                {
                    case "ItemCount":
                        self.currentItem = self.CardCoverView.model;
                        self.ChangeItemQuantity(self.currentItem, numericPadCriteria.NumericPadValue);
                        self.quantityToScan = self.currentItem.get("CurrentQuantity");
                        isOnItemSettingSection = false;
                        Shared.Focus('#textScanItemCount');
                        break;
                    case "MiscPhysical":
                        self.ChangeItemQuantity(self.currentItem.model, numericPadCriteria.NumericPadValue);
                        self.ChangeItemAdjustmentType(self.currentItem.model);
                        isOnItemSettingSection = false;
                        Shared.Focus('#textboxSearch');
                        break;
                }
                self.ItemLookupView.SlideDownItemLookup();
                view.SlideDownNumericPad();                
                $(headerName).show();
            });
            view.on('quantitychange', function (numericPadCriteria) {
                switch (self.Mode) {
                    case "ItemCount":
                        self.currentItem = self.CardCoverView.model;
                        self.ChangeItemQuantity(self.currentItem, numericPadCriteria.NumericPadValue);

                        self.quantityToScan = self.currentItem.get("CurrentQuantity") + self.currentItem.get("QuantityScanned");
                        isOnItemSettingSection = false;
                        Shared.Focus('#textScanItemCount');
                        break;
                    case "MiscPhysical":
                        self.ChangeItemQuantity(self.currentItem.model, numericPadCriteria.NumericPadValue);
                        self.ChangeItemAdjustmentType(self.currentItem.model);
                        isOnItemSettingSection = false;
                        Shared.Focus('#textboxSearch');
                        break;
                }
                self.ItemLookupView.SlideDownItemLookup();
                view.SlideDownNumericPad();
                $(headerName).show();
            });
        },

        InitializeRemainingItemSetting: function (item) {
            this.ShowFreeStockItemSetting();
            var itemDescription = item.model.get('ItemDescription');
            $('#remSettingsItemCode').text(item.model.get('ItemCode'));
            $('#remSettingsItemName').text(item.model.get('ItemName'));
              if (itemDescription.length > 20) {
                 this.$('#rowRemDesc').html("<a>Description<br><span style='white-space:normal'>" + itemDescription  + "</span></a>")
             }
            else {
                  this.$('#rowRemDesc').html("<a><span class='pull-right'>" + itemDescription  + "</span>Description</a>")
            }
            // $('#remSettingsItemDesc').text(item.model.get('ItemDescription'));
            $('#remSettingsUPCCode').text(Shared.ConvertNullToEmptyString(item.model.get('UPCCode')));
            $('#remSettingsQuantity').text(item.model.get('QuantityToPick'));
            $('#remSettingsFreeStock').text(item.model.get('FreeStock'));
            $('#remSettingsRemUnitMeasureCode').text(item.model.get('UnitMeasureCode'));
        },

        InitializeResumeStockTake: function () {
            this.model.set({ IsResume: true });
            this.LoadWarehouseStockTakeByUserCode();
            this.$('#itemCountHeader').show();
        },

        GetCurrentItem: function () {            
            if (this.itemSkippediScroll) {
             
                var currentPage = this.itemSkippediScroll.currentPage.pageX;

                // if (currentPage >= this.itemsSkipped.length) {
                if (this.itemCollection.length >= 1) {
                    this.CardCoverView.model = this.GetFirstOrDefaultItemInCollection();
                    this.currentItemModel = this.GetFirstOrDefaultItemInCollection();
                    this.currentItem = this.GetFirstOrDefaultItemInCollection();
                    isSkipped = false;
                }
                else {
                    this.CardCoverView.model = this.itemsSkipped.models[currentPage];
                    this.currentItemModel = this.itemsSkipped.models[currentPage];
                    this.currentItem = this.itemsSkipped.models[currentPage];
                    isSkipped = true;
                }
                
            }
            setTimeout(function () { isRotateCard = true; }, 500);
        },
                
        GetDefaultContainerHTML: function () {
            return "<ul id=\"skippedItemList\"> \
                        <li id=\"currentCardContainer\"> \
                            <div class=\"pull-left\"> \
                                <div class=\"flip-container\"> \
                                    <div id=\"flipper\" class=\"flipper\"> \
                                        <div id=\"containerCard\" class=\"flip-front\" /> \
                                        <div id=\"containerItemSettings\" class=\"flip-back\" /> \
                                    </div> \
                                </div> \
                                <div id=\"containerTransition\" class=\"stocktake-item-transition section-close\"> \
                                    <div id=\"cardFront\" class=\"pick-body pick-item-front\" /> \
                                    <div id=\"cardBack\" class=\"pick-body pick-item-back\" /> \
                                </div> \
                            </div> \
                        </li> \
                    </ul>";
        },

        GetItemByUPC: function (upcCode) {
            var itemLookup = new LookupCriteriaModel();
            var self = this;
            
            itemLookup.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADSTOCKTAKELOCATIONITEMVIEWBYUPC;

            itemLookup.set({
                UPCCode: upcCode,
                WarehouseCode: Preference.DefaultLocation,
                LocationCode: this.model.get("LocationCode"),
                UseCbeImage: Preference.UseCbeImage,
                WebSiteCode: Preference.WebSiteCode,
                IsShowFreeStock: Preference.PhysicalInventoryIsShowQtyOnHand
            });
            this.Animate(true, false);

            itemLookup.save(null, {
                success: function (model, response, options) {                    
                    if (!model.get("hasError")) {
                        if (response != null && response.StockTakeItems != null && response.StockTakeItems.length > 0) {
                            if (response.StockTakeItems.length > 1) self.ShowItemLookup(response.StockTakeItems);
                            else self.UpdateCart(response.StockTakeItems[0], false);
                        } else {
                            Shared.NotifyError("Invalid item.");
                            Shared.BeepError();
                        }
                    }
                },
                progress: this.ProgressScreen
            });
        },

        GetFirstOrDefaultItemInCollection: function () {
            return this.itemCollection.find(function (current) {
                    if (!current.get("IsDeleted")) return true;
                   });
        },


        GetNextItem: function (item, quantityToScan) {
            if (item) {
                var self = this;

                item.set({ Quantity: quantityToScan });

                var tapeItemID = item.get("TapeItemID");
                this.$('#cardQty' + tapeItemID).text(quantityToScan);
                this.$('#cardDetailQty' + tapeItemID).text(quantityToScan);
            }
        },

        GoToMenu: function () {
            var self = this;
            var hasOpenTransaction = false;
            var title = "";

            switch (this.Mode) {
                case "ItemCount":
                    if ((this.itemsSkipped && this.itemsSkipped.length > 0) || this.itemCollection && this.itemCollection.length > 0) hasOpenTransaction = true;
                    title = "Cancel ItemCount";
                    break;
                case "MiscPhysical":
                    if (this.cartCollection && this.cartCollection.length > 0) hasOpenTransaction = true;
                    title = "Cancel Misc Physical";
                    break;
                default:
                    if (this.IsResume) {
                        if ((this.cartCollection && this.cartCollection.length > 0) || (this.itemCollection && this.itemCollection.length > 0)) hasOpenTransaction = true;
                        title = "Cancel Resume";
                    }
            }

            if (hasOpenTransaction) {
                navigator.notification.confirm("There are items to process. Are you sure you want to cancel?", function (button) {
                    if (button == 1) {
                        if (self.Mode == "ItemCount") {
                            self.itemCodeCollection.reset();
                            self.LoadDueAndOverdueItemCodes();
                        }
                        self.ShowStockTakeSection();
                    }
                }, title, "Yes,No");
            }
            else {
                self.ShowStockTakeSection();
            }
        },

        GotoNextItem: function () {
            var isItemSkipped = this.CardCoverView.model.get("IsItemSkipped");
            this.currentItem = this.CardCoverView.model;

            if (isItemSkipped) this.RemoveFromSkippedItemList(this.currentItem);
            else {
              

                if (this.itemCollection.length == 1) {
                    pageNumber = pageNumber + 1;
              
                    var itemCodes = [];
                    _.each(this.itemCodeCollection.where({ ItemPageNumber: pageNumber }), function (model) {
                        itemCodes.push(model.get('ItemCode'));
                    });


                    if (this.currentItem) this.itemCountedCollection.add(this.currentItem);

                    if (itemCodes.length == 0) {
                        this.ValidateCompleteItemCount(true);
                        return true;

                    }
                    else {
                        //this.itemCountedCollection.add(this.currentItem);
                        this.DeleteByItemCode(this.itemCollection, this.currentItem.get('ItemCode'));
                        this.DeleteByItemCode(this.itemCodeCollection, this.currentItem.get('ItemCode'));
                        this.LoadNextItems(true);

                    } 

                    

                    
                }

                else {

                    this.currentItem.set({ IsDeleted: true });
                    $('#' + this.currentItem.get("RemainingItemID")).parent().hide();

                    this.UpdateRemainingItems(null);

                    var hasItem = false;
                    this.itemCountedCollection.add(this.currentItem);
                   
                    this.DeleteByItemCode(this.itemCollection, this.currentItem.get('ItemCode'));
                    this.DeleteByItemCode(this.itemCodeCollection, this.currentItem.get('ItemCode'));

                    this.currentItem = this.itemCollection.find(function (current) {
                        if (!current.get("IsDeleted")) {
                            hasItem = true;
                            return true;
                        }
                    });

                    if (!hasItem) {
                        this.ValidateCompleteItemCount(false);
                        return true;
                    }

                    this.UpdateCounter(-1);
                    this.RenderCard(this.currentItem, true);
                    Shared.Focus('#textScanItemCount');

                }
           
            }            
        },

        GoToSelectedItem: function (itemView) {
            this.itemsSkipped.remove(this.itemCollection.models[0]);            
            this.currentItem = itemView;

            var skippedListItemID = itemView.model.get('SkippedListItemID');

            if (itemView.model.get('Quantity') > 1) skippedListItemID = skippedListItemID + "B";
            var listItem = $('#' + skippedListItemID).parent();
            var skippedItemPosition;

            if (listItem.length > 0) skippedItemPosition = this.$('#skippedItemList > li').index(listItem) * (Global.ScreenWidth * -1);
            else skippedItemPosition = ((this.$('#skippedItemList > li').length - 1) * (Global.ScreenWidth * -1));

            this.itemSkippediScroll.scrollTo(skippedItemPosition, 0, 500);
            this.itemSkippediScroll.refresh();
        },

        HasPostponedStockTake: function () {            
            this.LoadWarehouseStockTakeByUserCode();
        },

        HideSkipButton: function (skippedListItemID) {
            $('#buttonSkipItem' + skippedListItemID).hide();
            //$('.boxitem-rownumber-title').css({
            //    "max-width": "290px",
            //    "width": "290px",
            //    "border-top-right-radius": "10px",
            //});
        },

        HighLightListItem: function (itemView) {
            this.$('.listitem-1').addClass('listitem-1').removeClass('listitem-2');
            this.$('.listitem-2').addClass('listitem-1').removeClass('listitem-2');
            Shared.HighLightItem(itemView.cid, "CheckList");
            this.$('#listItem' + itemView.model.get('ViewID')).removeClass('listitem-1').addClass('listitem-2');
        },

        IsItemSkippedExisting: function () {
            if (this.itemsSkipped && this.itemsSkipped.length > 0) {
                var upcCode = this.CardCoverView.model.get('UPCCode');
                var itemCode = this.CardCoverView.model.get('ItemCode');
                var umCode = this.CardCoverView.model.get('UnitMeasureCode');

                var existingItem = Shared.FindItem(this.itemsSkipped, itemCode, umCode);

                if (!existingItem) return false;
                else return true;
            }
        },

        LoadItemSetting: function (cartItemView) {
            Shared.HighLightItem(cartItemView.model.get('TapeItemID'), "MiscPhysical");
            this.CurrentItemView = cartItemView;
            $('#itemSettingSection').removeClass('section-close').addClass('section-show');
            this.InitializeItemSetting();
            this.SwitchDisplay("page2");
            this.ShowFreeStockItemSetting();
            this.currentItem = cartItemView;
        },

        LoadFromToZoneLookup: function (listMode) {
            var lookupModel = new LookupCriteriaModel();
            var self = this;
            var itemCode = "";

            if (this.currentItemModel != null && this.currentItemModel != "undefined") {
                itemCode = this.currentItemModel.get('ItemCode');
            }

            if (listMode != null) {
                switch (listMode) {
                    case Enum.ListMode.UM:
                        lookupModel.set({ Criteria: null });
                        lookupModel.url = Global.ServiceUrl + Service.PRODUCT + Method.UNITMEASURECODELOOKUP + "50/" + itemCode;
                        break;
                    case Enum.ListMode.ToZone:
                        lookupModel.set({
                            ItemCode: itemCode,
                            WarehouseCode: Preference.DefaultLocation
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

        LoadItemPerPage: function () {

            var stockTakeModel = new StockTakeModel();
            var self = this;
            // this.TotalItemCount = 0;

      
                var itemCodes = [];
                _.each(this.itemCodeCollection.where({ ItemRemainingPageNumber: remainingItemPageNumber }), function (model) {
                    itemCodes.push(model.get('ItemCode'));
                });

                stockTakeModel.set({
                    IsLoadItemCountOnly: false,
                    IsShowFreeStock: Preference.PhysicalInventoryIsShowQtyOnHand,
                    LocationCode: self.model.get("LocationCode"),
                    UseCbeImage: Preference.UseCbeImage,
                    WarehouseCode: Preference.DefaultLocation,
                    WebsiteCode: Preference.WebSiteCode,
                    PageNumber: remainingItemPageNumber,
                    ItemCodes: itemCodes
                });
     

            stockTakeModel.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADDUEANDOVERDUEITEMS;

            //  this.Animate(true, false);
            stockTakeModel.save(null, {
                success: function (model, response, options) {
                    if (!model.get("hasError")) {
                        if (!response.IsLastPage) remainingItemLastPage = (response.StockTakeItems.length < 10); else remainingItemLastPage = response.IsLastPage;
                        self.PrepareRemainingItems(response.StockTakeItems);
                        self.ShowRemainingCartItems(true);
                        self.EnableDisablePagingButtons();
                        if (isFromRemainingItemSection) self.itemRemainingiScroll = Shared.LoadiScroll(self.itemRemainingiScroll, "ItemsRemaining");
                    }
                },
                progress: this.ProgressScreen
            });

        },

      

        LoadItemByStockTakeDays: function (isLoadItemCountOnly, isFromNextButton) {
            var stockTakeModel = new StockTakeModel();
            var self = this;
            
            if (!isLoadItemCountOnly) {

                var itemCodes = [];
                _.each(this.itemCodeCollection.where({ ItemPageNumber: pageNumber }), function (model) {
                    itemCodes.push(model.get('ItemCode'));
                });

                stockTakeModel.set({
                    IsLoadItemCountOnly: false,
                    IsShowFreeStock: Preference.PhysicalInventoryIsShowQtyOnHand,
                    LocationCode: self.model.get("LocationCode"),
                    UseCbeImage: Preference.UseCbeImage,
                    WarehouseCode: Preference.DefaultLocation,
                    WebsiteCode: Preference.WebSiteCode,
                    PageNumber: pageNumber,
                    ItemCodes: itemCodes
                });

            }
            else {
                

                stockTakeModel.set({
                    IsLoadItemCountOnly: true,
                    IsShowFreeStock: false,
                    LocationCode: self.model.get("LocationCode"),
                    UseCbeImage: false,
                    WarehouseCode: Preference.DefaultLocation,
                    WebsiteCode: ""
                  
                });
            }

            stockTakeModel.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADDUEANDOVERDUEITEMS;
            
            this.Animate(true, false);
            stockTakeModel.save(null, {
                success: function (model, response, options) {
                    if (!model.get("hasError")) {
                        if (isLoadItemCountOnly) {
                            if (response.ItemCount == 0) response.ItemCount = "none";
                            else if (response.ItemCount > 99) response.ItemCount = "99+"
                            self.$('#textItemCount').text("(" + response.ItemCount + ")");
                           
                        }
                        else {
                            if (response.StockTakeItems && response.StockTakeItems.length == 1) self.model.set({ HasOnlyOneItem: true });
                            if (response.IsLastPage) lastPageNumber = pageNumber;
                            lastPage = response.IsLastPage;
                            self.PrepareItems(response.StockTakeItems);
                            if (isFromRemainingItemSection) self.itemRemainingiScroll = Shared.LoadiScroll(self.itemRemainingiScroll, "ItemsRemaining");
                            if (isFromNextButton) {
                                if (self.itemCollection.length == 1) {
                                    self.ValidateCompleteItemCount(false);
                                    return true;
                                }
                                else {
                                   
                                    self.currentItem = self.GetFirstOrDefaultItemInCollection();
                                } 
                            }
                            
                        }                        
                    }
                },
                progress: this.ProgressScreen
            });

        },


        LoadDueAndOverdueItemCodes: function () {

            var stockTakeModel = new StockTakeModel();
            var self = this;
            this.TotalItemCount = 0;
   
            stockTakeModel.set({     
                LocationCode: self.model.get("LocationCode"),
                WarehouseCode: Preference.DefaultLocation
               
            });  
            stockTakeModel.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADDUEANDOVERDUEITEMCODES;

          // this.Animate(true, false);
            stockTakeModel.save(null, {
                success: function (model, response, options) {
                    if (!model.get("hasError")) {
                        if (response.StockTakeItems) {
                            self.TotalItemCount = response.StockTakeItems.length;
                            self.PopulateItemCodeCollection(response.StockTakeItems);
                      
                        }

                    }
                },
                progress: this.ProgressScreen
            });

        },
        
        LoadRemainingItemSetting: function (item) {
            Shared.HighLightItem(item.model.get('TapeItemID'), "Default");            
            this.InitializeRemainingItemSetting(item);
            this.SwitchItemRemSettingDisplay('page2');
        },

        LoadWarehouseStockTakeByUserCode: function () {
            var model = new StockTakeModel();
            var self = this;
            var countedItemCollection = new CartCollection;
            var itemToCountCollection = new CartCollection;
            

            model.set({
                IsShowFreeStock: Preference.PhysicalInventoryIsShowQtyOnHand,
                UserCode: Global.CurrentUser.UserCode,
                UseCbeImage: Preference.UseCbeImage,
                WarehouseCode: Preference.DefaultLocation,
                WebsiteCode: Preference.WebSiteCode,
            });

            model.url = Global.ServiceUrl + Service.POS + Method.LOADWAREHOUSESTOCKTAKEBYUSERCODE;

            this.Animate(this, false);

            model.save(null, {
                success: function (model, response, options) {                    
                    if (!model.get("hasError")) {
                        if (response.StockTake) {
                            if (self.model.get("IsResume")) {
                                self.Mode = response.StockTake.Mode;
                                if (response.StockTake.Mode == "ItemCount") {
                             
                                    var items = _.filter(response.StockTakeDetails, function (item) {
                                        return item.Quantity > 0;
                                    });

                                    self.itemCountedCollection.add(items);
                                    _.each(items, function (current) {
                                        self.DeleteByItemCode(self.itemCodeCollection, current.ItemCode);
                                    });
                                    self.ResetPageNumber(false);

                                } else {
                                    self.RefreshMiscPhysicalSection();
                                    self.ShowMiscPhysicalSection();
                                    self.RenderMiscItems(response.StockTakeDetails);
                                }
                            } else {
                                self.HasPostponed = true;
                            }
                        } else {
                            self.HasPostponed = false;
                            if (self.model.get("IsResume")) navigator.notification.alert("There is no stock take to resume.");
                        }
                    }
                },
                progress: this.ProgressScreen
            });

        },

        PopulateItemCodeCollection: function(items){
            var self = this; 
            var counter = 0;
            var _page = 1;
            var itemRowCount = 1;
        
            _.each(items, function (current) {

                counter = self.itemCodeCollection.length + 1;
                var rowID = 0;
                var card = new CartItemModel();
                rowID = counter;
                
                card.set({
                    RowNumber: current.RowNumber,
                    ItemPageNumber: _page, //Custom
                    ItemRemainingPageNumber: _page, //Custom
                    AllocatedQty:0,
                    BarCode: current.ItemCode,
                    CardNumber: 0,
                    CurrentQuantity: 0,
                    ExpectedQuantity: current.InStock,
                    FreeStock: 0,
                    IsCurrent: false,
                    IsDeleted: false,
                    IsItemsRemaining: true,
                    IsItemSkipped: false,
                    ItemCode: current.ItemCode,
                    ItemID: counter,
                    ItemName: current.ItemName,
                    ItemDescription: current.ItemDescription,
                    LastStockTake: current.LastStockTake,
                    LocationCode: current.LocationCode,
                    OverallCounter: 0,
                    Quantity: 0,
                    QuantityScanned: 0,
                    QuantitySkipped: 0,
                    RemainingItemID: "REM" + counter,
                    RowID: counter * -1,
                    SkippedListItemID: "SKIPPED" + counter,
                    StockTakeDays: 0,
                    TapeItemID: "ITEM" + counter,
                    TransactionCode: null,
                    UPCCode: null,
                    UnitMeasureCode: null,
                    UnitMeasureQty: 1,
                    UserCode: Global.CurrentUser.UserCode,
                    WarehouseCode: current.WarehouseCode,
                    CardImage: null,
                    CartItemImage: null
                });

                itemRowCount++;
                if (itemRowCount > 10) {
                    _page++;
                    itemRowCount = 1;
                }

                self.itemCodeCollection.add(card);
               
            });


        },


        PopulateCartItem: function (items) {
            var self = this;
            var totalQty = 0;
            var counter = 0;
            var lastItemCode;
            var itemCount = items.length;

            self.lastItemIndex = 0;

            _.each(items, function (current) {

                counter = self.cartItemCollection.length + 1;
                totalQty = totalQty + current.InStock;

                var card = new CartItemModel();
                var rowID = 0;
                var rowNumber = 1;

                var barCode = "";

                if (current.UPCCode) barCode = current.UPCCode;
                else barCode = current.ItemCode;

                if (current.RowID) rowID = current.RowID;
                else rowID = counter;

                var selectedItemCode = self.itemCodeCollection.where({ ItemCode: current.ItemCode })[0] || null;
                if (selectedItemCode) {
                    if (selectedItemCode.get('RowNumber')) rowNumber = selectedItemCode.get('RowNumber');
                }

                card.set({
                    AllocatedQty: current.UnitsAllocated,
                    BarCode: barCode,
                    CardNumber: 0,
                    CurrentQuantity: 0,
                    ExpectedQuantity: current.InStock,
                    FreeStock: current.FreeStock,
                    IsCurrent: false,
                    IsDeleted: false,
                    IsItemsRemaining: true,
                    IsItemSkipped: false,
                    ItemCode: current.ItemCode,
                    ItemID: rowNumber,
                    ItemName: current.ItemName,
                    ItemDescription: current.ItemDescription,
                    LastStockTake: current.LastStockTake,
                    LocationCode: current.LocationCode,
                    OverallCounter: 0,
                    Quantity: current.Quantity,
                    QuantityScanned: current.Quantity,
                    QuantitySkipped: 0,
                    RemainingItemID: "REM" + rowNumber,
                    RowNumber: rowNumber,
                    RowID: counter,
                    SkippedListItemID: "SKIPPED" + rowNumber,
                    StockTakeDays: current.StockTakeDays,
                    TapeItemID: "ITEM" + rowNumber,
                    TransactionCode: current.TransactionCode,
                    UPCCode: current.UPCCode,
                    UnitMeasureCode: current.UnitMeasureCode,
                    UnitMeasureQty: current.UnitMeasureQty,
                    UserCode: Global.CurrentUser.UserCode,
                    WarehouseCode: current.WarehouseCode,
                    CardImage: Shared.GetImageUrl(Enum.ImageType.Card, current.ItemMediumFile),
                    CartItemImage: Shared.GetImageUrl(Enum.ImageType.CartItem, current.ItemIconFile)
                });

                self.cartItemCollection.add(card);


                var cartItemView = new CartItemView({ model: card });
                self.$("#cartListItemsRemaining tbody").append(cartItemView.render());
         

                $('#rowQty' + card.get("RemainingItemID")).hide();
                $('#rowUM' + card.get("RemainingItemID")).hide();
            });

        },



        PopulateCart: function (items) {
            var self = this;
            var totalQty = 0;
            var counter = 0;
            var lastItemCode;
            var itemCount = items.length;
           
            self.lastItemIndex = 0;

            _.each(items, function (current) {

                counter = self.itemCollection.length + 1;
                totalQty = totalQty + current.InStock;

                var card = new CartItemModel();
                var rowID = 0;
                var rowNumber = 1;

                var barCode = "";
                
                if (current.UPCCode) barCode = current.UPCCode;
                else barCode = current.ItemCode;
                
                if (current.RowID) rowID = current.RowID;
                else rowID = counter;                

                var selectedItemCode = self.itemCodeCollection.where({ ItemCode: current.ItemCode })[0] || null;
                if (selectedItemCode) {
                    if (selectedItemCode.get('RowNumber')) rowNumber = selectedItemCode.get('RowNumber');
                }

                //if (current.RowNumber) rowNumber = current.RowNumber;
                //else rowNumber = counter;

                card.set({
                    AllocatedQty: current.UnitsAllocated,
                    BarCode: barCode,
                    CardNumber: 0,
                    CurrentQuantity: 0,
                    ExpectedQuantity: current.InStock,
                    FreeStock: current.FreeStock,
                    IsCurrent: false,
                    IsDeleted: false,
                    IsItemsRemaining: true,
                    IsItemSkipped: false,
                    ItemCode: current.ItemCode,
                    ItemID: rowNumber,
                    ItemName: current.ItemName,
                    ItemDescription: current.ItemDescription,
                    LastStockTake: current.LastStockTake,
                    LocationCode: current.LocationCode,
                    OverallCounter: 0,
                    Quantity: current.Quantity,
                    QuantityScanned: current.Quantity,
                    QuantitySkipped: 0,
                    RemainingItemID: "REM" + rowNumber,
                    RowNumber: rowNumber,
                    RowID: counter,
                    SkippedListItemID: "SKIPPED" + rowNumber,
                    StockTakeDays: current.StockTakeDays,                    
                    TapeItemID: "ITEM" + rowNumber,
                    TransactionCode: current.TransactionCode,                    
                    UPCCode: current.UPCCode,
                    UnitMeasureCode: current.UnitMeasureCode,
                    UnitMeasureQty: current.UnitMeasureQty,
                    UserCode: Global.CurrentUser.UserCode,
                    WarehouseCode: current.WarehouseCode,
                    CardImage: Shared.GetImageUrl(Enum.ImageType.Card, current.ItemMediumFile),
                    CartItemImage: Shared.GetImageUrl(Enum.ImageType.CartItem, current.ItemIconFile)
                });

                self.itemCollection.add(card);

                $('#rowQty' + card.get("RemainingItemID")).hide();
                $('#rowUM' + card.get("RemainingItemID")).hide();                
            });            
            
            this.currentItem = this.itemCollection.find(function (current) {
                if (!current.get("IsDeleted")) {
                    return true;
                }
            });

            this.UpdateCounter(counter);
        },

       
        PrepareRemainingItems: function (items) {
            if (items && items.length > 0) {
                if (items.length == 1) this.model.set({ HasOnlyOneItem: true });
                this.PopulateCartItem(items);
                this.RenderRemainingCartItems();
            }
            else {
                navigator.notification.alert("There are no overdue items.", null, "Stock Take", "OK");
                this.ShowStockTakeSection();
            }
        },

        PrepareItems: function (items) {
            if (items && items.length > 0) {
                if (items.length == 1) this.model.set({ HasOnlyOneItem: true });
                this.PopulateCart(items);
                this.RenderRemainingItems();
                if (this.itemCollection && this.itemCollection.length > 0) {
                    var item = this.itemCollection.models[0];
                    item.set({
                        //OverallCounter: this.model.get("Counter")
                        OverallCounter: item.get("Quantity") //this.model.get("Counter")
                    })

                    this.RenderCard(item, false);
                }
            }
            else {
                navigator.notification.alert("There are no overdue items.", null, "Stock Take", "OK");
                this.ShowStockTakeSection();
            }
        },

        RefreshItemCountSection: function (resume) {
            this.itemCollection.reset();
            if(!resume) this.itemCountedCollection.reset();
            this.itemsSkipped.reset();
           
            this.currentItem = null;
            this.quantityToScan = 0;            
            this.model.set({
                Counter: 0,
                LocationCode: "Zone1",
                TotalItemsSkipped: 0,
                TotalItems: 0
            });
            $('#cartListItemsRemaining tbody').html("");
            $('#itemCountBody').html(this.GetDefaultContainerHTML());
            $('#itemCountBody').width(Global.ScreenWidth)
            $('#textScanItemCount').val("");
            listWidth = Global.ScreenWidth;
            currentLocation = 0;            
            this.itemSkippediScroll = null;
            this.LoadItemByStockTakeDays(true,false);
        },

        RefreshMiscPhysicalSection: function () {
            this.cartCollection.reset();
            this.model.set({
                Counter: 0,
                TotalItemsIn: 0,
                TotalItemsOut: 0,
                LocationCode: "Zone1",
                TotalItems: 0,
            });
            $('#cartListMiscPhysical tbody').html("");
            $('#textTotalItemsIn').text(0);
            $('#textTotalItemsOut').text(0);
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
                        RowID: rowNumber,
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
                    $('#rowQty' + oldTapeItemID).attr("id", 'rowQty' + newTapeItemID);
                    $('#textQty' + oldTapeItemID).attr("id", 'textQty' + newTapeItemID);
                    $('#itemQty' + oldTapeItemID).attr("id", 'itemQty' + newTapeItemID);
                    $('#rowUM' + oldTapeItemID).attr("id", 'rowUM' + newTapeItemID);
                    $('#itemUM' + oldTapeItemID).attr("id", 'itemUM' + newTapeItemID);
                    $('#buttonItemSetting' + oldTapeItemID).attr("id", 'buttonItemSetting' + newTapeItemID);
                });
            }
        },

        RefreshStockTakeSection: function () {
            this.RefreshItemCountSection(false);
            this.RefreshMiscPhysicalSection();
        },

        RemoveFromSkippedItemList: function (item) {
            this.UpdateTotalItemsSkipped(-1);
            listWidth -= Global.ScreenWidth;

            var totalSkipped = this.model.get("TotalItemsSkipped");
            var skippedItemID = item.get('SkippedListItemID');                        
            if (item.get('Quantity') > 1) skippedItemID = skippedItemID + "B";
            this.$('#' + skippedItemID).parent().remove();
            this.$('#itemCountBody').css("width", listWidth + "px");
            this.itemsSkipped.remove(item);
            this.itemCountedCollection.add(item);
            this.GetCurrentItem();            

            this.itemSkippediScroll.refresh();            
        },

        RemoveItem: function () {
            var self = this;

            navigator.notification.confirm("Are you sure you want to remove this item?", function (button) {
                if (button == 1) {
                    var model = self.CurrentItemView.model;

                    self.cartCollection.remove(model);
                    self.CurrentItemView.remove();

                    self.CurrentItemView.model.set({ CurrentQuantity: self.CurrentItemView.model.get('Quantity') * -1 });
                    self.UpdateTotalItems(self.CurrentItemView.model.get("CurrentQuantity"));
                    model.destroy();

                    self.RefreshRowNumber(self.cartCollection);
                    self.SwitchDisplay("page1");
                    self.myScroll = Shared.LoadiScroll(self.myScroll, "MiscPhysical");
                }
            }, "Remove Item", "Yes,No");
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
                    self.myScroll = Shared.LoadiScroll(self.myScroll, "MiscPhysical");
                    $('#slideFooter').removeClass("slideInUpFooter").addClass("slideOutDownFooter");
                }
            });
        },

        RenderCard: function (item, isAnimate) {
            var self = this;
            if (isAnimate) {
                this.$("#containerTransition").show();
                this.$("#containerCard").hide();
                this.$("#containerItemSettings").hide();
            }
            else {
                var itemCounter = item.get("Counter");
                var cardNumber = this.model.get("OverallCounter") - this.model.get("Counter") + 1;
                var skippedItemID = item.get("SkippedListItemID");

                item.set({ CardNumber: cardNumber });
                this.CardCoverView.model = item;
                this.$("#containerCard").html("");
                this.$("#containerCard").append(this.CardCoverView.render());

                this.ItemSettingView.model = item;
                this.$("#containerItemSettings").html("");
                this.$("#containerItemSettings").append(this.ItemSettingView.render());

                this.CardFrontView.model = item;
                this.$("#cardFront").html("");
                this.$("#cardFront").append(this.CardFrontView.render());

                if (itemCounter > 1) {
                    this.CardBackView.model = item;
                    item.set({ CardNumber: cardNumber + 1 });
                    this.$("#cardBack").html("");
                    this.$("#cardBack").append(this.CardBackView.render());
                    item.set({ CardNumber: cardNumber - 1 });
                }
                else {
                    if (this.itemCollection && this.itemCollection.length > 1) {
                        var item2 = this.itemCollection.models[1];
                        item2.set({ CardNumber: cardNumber + 1 });

                        this.CardBackView.model = item2;
                        this.$("#cardBack").html("");
                        this.$("#cardBack").append(this.CardBackView.render());
                    }
                }                            

                this.ShowFreeStockItemSetting(skippedItemID);

                $('#imageItemPicture').on('dragstart', function (event) { event.preventDefault(); });

                this.WireCardEvents(skippedItemID, false);
            }

            this.currentItemModel = item;
        },

        RenderMiscItems: function (items) {
            if (items && items.length > 0) {
                var self = this;
                var totalQty = 0;
                _.each(items, function (item) {
                    self.AddItemToCart(item, true);
                    totalQty = totalQty + item.Quantity;
                });

                self.model.set({ TotalItems: totalQty });
                $('#textTotalItemsIn').text(this.model.get('TotalItems'));
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

                                Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {
                                    self.UpdateStockItemSetting(checklistItemView, listMode);
                                    self.CheckListBack(e);
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
                                    ListItemTitle: current.LocationCode,
                                    ListItemRow1: "Description: " + current.LocationDescription,
                                    ListItemRow2: "Stock Type: " + current.StockType,
                                    LocationCode: current.LocationCode,
                                    LocationDescription: current.LocationDescription,
                                });

                                var checklistItemView = new CheckListItemView({ model: checkListItemModel });
                                self.$('#cartCheckList tbody').append(checklistItemView.render());

                                Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {
                                    self.HighLightListItem(checklistItemView);
                                    self.CheckListBack(e);
                                });
                            });
                        }
                        break;
                }
                this.iScrollCheckList = Shared.LoadiScroll(this.iScrollCheckList, "CheckList");
            }
        },

        RenderRemainingItems: function () {
            var self = this;
            if (this.itemCollection && this.itemCollection.length > 0) {
                this.itemCollection.each(function (item) {
                    if (item.QuantityOrdered != 0) {
                        var itemView = new CartItemView({ model: item });
                        Shared.AddRemoveHandler('.' + itemView.model.get('TapeItemID'), 'tap', function () {
                            self.LoadRemainingItemSetting(itemView)
                            $("#itemRemainingSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
                        });
                    };
                });
            };
        },


        RenderRemainingCartItems: function () {
            var self = this;
            if (this.cartItemCollection && this.cartItemCollection.length > 0) {
                this.cartItemCollection.each(function (item) {
                    if (item.QuantityOrdered != 0) {
                        var itemView = new CartItemView({ model: item });
                        Shared.AddRemoveHandler('.' + itemView.model.get('TapeItemID'), 'tap', function () {
                            self.LoadRemainingItemSetting(itemView)
                            $("#itemRemainingSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
                        });
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
                this.$("#textSkippedItems").text(totalItemsSkipped);
                this.$("#textTotalSkippedItems").text(totalItemsSkipped + 1);
                this.itemsSkipped.models.reverse();
                this.itemsSkipped.each(function (item) {
                    var cartSkippedItemView = new CartSkippedItemView({ model: item });

                    if (cartSkippedItemView.model.get('QuantitySkipped') > 0 || !cartSkippedItemView.model.get('IsItemSkipped')) {
                        self.$("#cartListSkippedItems tbody").append(cartSkippedItemView.render());
                        $('#itemRow' + cartSkippedItemView.model.get('SkippedListItemID')).text(rownumber);

                        if (cartSkippedItemView.model.get("UPCCode") == self.currentItemModel.get("UPCCode")) Shared.HighLightItem(cartSkippedItemView.model.get('SkippedListItemID'), "Default");

                        rownumber += 1;
                        Shared.AddRemoveHandler('#skippedItemRow' + cartSkippedItemView.model.get('SkippedListItemID'), 'tap', function () {
                            Shared.HighLightItem(cartSkippedItemView.model.get('SkippedListItemID'), "Default");
                            $("#skippedItemsSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
                            setTimeout(function () { self.GoToSelectedItem(cartSkippedItemView) }, 300);
                        });
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
            
            this.WireCardEvents(skippedItemID, true);
           
            this.ShowFreeStockItemSetting(skippedItemID);

            if (!isUpdate) {
                listWidth += Global.ScreenWidth;
                this.$('.iscroll-pickbody').css("width", listWidth + "px");
            }

            item.set({ SkippedListItemID: tempSkippedItemID });
            
            this.RenderCard(this.GetFirstOrDefaultItemInCollection(), false);

        },

        RotateContainerCard: function (skippedListItemID) {
            if (isRotateCard) {
                if (isOnItemSettingSection) {
                    Shared.FlipY(('#flipper' + skippedListItemID), 0);
                    isOnItemSettingSection = false;
                }
                else {
                     var skippedItemID = this.currentItem.get("SkippedListItemID");
                     var itemDescription = this.currentItem.get('ItemDescription');
                    
                     if (itemDescription.length > 20) {
                          this.$('#rowDescription'+ skippedItemID).html("<a>Description<br><span style='white-space:normal'>" + itemDescription  + "</span></a>")
                     }
                     else {
                         this.$('#rowDescription'+ skippedItemID).html("<a><span class='pull-right'>" + itemDescription  + "</span>Description</a>")
                     }

                    Shared.FlipY(('#flipper' + skippedListItemID), 180);
                    isOnItemSettingSection = true;
                }
                Shared.Focus('#textScanItemCount');
            }
        },


        ResetPageNumber: function (showRemainingItems) {

            if (showRemainingItems) {
                var self = this;
                this.cartItemCollection.reset();
                var cnt = 1, pgn = 1; rowNumber = 1;
                this.itemCodeCollection.each(function (item) {
                    if (cnt > 10) {
                        cnt = 1;
                        pgn++;
                    }
                    item.set({ ItemRemainingPageNumber: pgn, RowNumber: rowNumber });
                    rowNumber++;
                    cnt++;
                });

                this.LoadRemainingPageItems();
            }
            else {
                var self = this;
                this.itemCollection.reset();
                var cnt = 1, pgn = 1; rowNumber = 1;
                this.itemCodeCollection.each(function (item) {
                    if (cnt > 10) {
                        cnt = 1;
                        pgn++;
                    }
                    item.set({ ItemPageNumber: pgn, RowNumber: rowNumber });
                    rowNumber++;
                    cnt++;
                });
                this.LoadNextItems(false);
            }


        },

        ScanItem: function () {
            var upcCode = this.CardCoverView.model.get("UPCCode");
            var itemCode = this.CardCoverView.model.get("ItemCode");
            var itemName = this.CardCoverView.model.get("ItemName");
            var valueToCheck = $("#textScanItemCount").val();            

            if (upcCode != null) upcCode = upcCode.toLowerCase();
            if (itemCode != null) itemCode = itemCode.toLowerCase();
            if (itemName != null) itemName = itemName.toLowerCase();
            if (valueToCheck != null) valueToCheck = valueToCheck.toLowerCase();

            $("#textScanItemCount").val("");            

            if (valueToCheck == upcCode || valueToCheck == itemCode || valueToCheck == itemName) {
                var items = Shared.FindItems(this.itemCollection, valueToCheck);

                if (items == null || items.length == 0) items = Shared.FindItems(this.itemsSkipped, valueToCheck);

                if (items && items.length > 0) {
                    if (items.length > 1) this.ShowItemLookup(items.models);
                    else {
                        if (valueToCheck == upcCode || valueToCheck == itemCode || valueToCheck == itemName) {
                            Shared.BeepSuccess();
                            if (isOnItemSettingSection) {
                                Shared.FlipY('.flipper', 0);
                                isOnItemSettingSection = false;
                            }
                            if (Preference.PhysicalInventoryIsPromptForQty) this.ShowNumericPad(1);                             
                            else this.GetNextItem(items.models[0], items.models[0].get("Quantity") + 1);
                        }
                    }
                }
            }
            else {
                Shared.NotifyError("Invalid item.");
                Shared.BeepError();
            }
        },

        SearchItem: function () {
            var upcCode = this.$("#textboxSearch").val();
            this.$("#textboxSearch").val("");
            
            if (upcCode) this.SearchItemByUPC(upcCode);
            else {
                Shared.NotifyError("Item not found.");
                Shared.BeepError();
            }
        },

        SearchItemByUPC: function (upcCode) {
            /*if (upcCode) {
                var existingItem = Shared.FindItem(this.cartCollection, upcCode, "EACH");

                if (existingItem) {
                    currentScannedItemQuantity = existingItem.get('Quantity');
                    this.UpdateItemQuantity(existingItem, 1);
                    Shared.BeepSuccess();
                }
                else this.GetItemByUPC(upcCode);
            }*/
            this.GetItemByUPC(upcCode);
        },

        SetCheckListNavTitle: function (title) {
            $("#checkListNavTitle").text(title);
        },

        ShowCompleteSection: function (stockTakeCode, isPostponed) {
            var self = this;
            if (!isPostponed) {
                this.$("#completedNavTitle").text(stockTakeCode);
                this.$("#completedMessage").text("Count Completed!");
                this.$("#completedMessage").removeAttr("style");                
                this.$('#buttonMore').text("count more");
                this.$('#piIconOkay').show();
                this.$('#piIconPostponedContainer').hide();
            } else {
                this.$("#completedNavTitle").text("physical inventory");
                this.$("#completedMessage").text("Count Postponed!");                
                this.$('#piIconStop').css("color", "#d9534f");
                this.$("#completedMessage").css("color", "#d9534f");
                this.$('#buttonMore').text("physical inventory");
                this.$('#piIconOkay').hide();
                this.$('#piIconPostponedContainer').show();
            }
            this.$("#completedSection").removeClass('bounceOutUp').removeClass('section-close').show().addClass("bounceInDown");
        },

        ShowCheckListSection: function () {
            $('#itemSettingSection').addClass('section-close').removeClass('section-show');
            $('#itemCountDetailSection').addClass('section-close').removeClass('section-show');
        },

        ShowFreeStockItemSetting: function (skippedItemID) {
            if (Preference.PhysicalInventoryIsShowQtyOnHand) {
                if (isFromRemainingItemSection) {
                    $('#rowRemFreeStock').show();
                    this.RenderRemainingItems();
                }
                else {
                    $('#rowFreeStock' + skippedItemID).show();
                    return new IScroll('#itemSettingBody' + skippedItemID, { vScrollbar: false, scrollY: true });
                } 
            }
            else {
                if (isFromRemainingItemSection) $('#rowRemFreeStock').hide();
                else {
                    $('#rowFreeStock' + skippedItemID).hide();
                    $('#rowFreeStock').hide();
                }
            }
        },

        ShowHideControls: function () {
            if (Preference.PhysicalInventoryIsAllowToSkipItems) this.$('#buttonSkipItem').show();
            else this.$('#buttonSkipItem').hide();

            this.$('#itemCountHeader').show();
        },

        ShowItemCountSection: function() {
            $('#itemCountSection').removeClass('section-close').removeClass('scaleUpDown').addClass('section-show').addClass('scaleDownUp');
            $('#miscPhysicalSection').removeClass('section-show').removeClass('scaleDownUp').addClass('section-close').addClass('scaleUpDown');
            $('#stockTakeSection').removeClass('scaleDownUp').addClass('scaleUpDown').hide();
            Shared.Focus('#textScanItemCount');
        },

        ShowItemLookup: function (items) {
            if (items) {
                this.ItemLookupView.RenderItems(items);
                $('#pickHeader').hide();
                $('#itemLookupSection').addClass('slideInUp').removeClass('slideOutDown');
            }
        },

        ShowMiscPhysicalSection: function () {
            $('#miscPhysicalSection').removeClass('section-close').removeClass('scaleUpDown').addClass('section-show').addClass('scaleDownUp');
            $('#itemCountSection').removeClass('section-show').removeClass('scaleDownUp').addClass('section-close').addClass('scaleUpDown');
            $('#stockTakeSection').removeClass('scaleDownUp').addClass('scaleUpDown').hide();
            Shared.Focus('#textboxSearch');
        },

        ShowNumericPad: function (qty) {
            $('#textboxQuantity').val(qty);
            $('#pickHeader').hide();
           // $('#buttonComplete').focus();
            $('.numericpad').addClass('slideInUp').removeClass('slideOutDown');
        },

        ShowRemainingItems: function (isShow) {
            if (isShow) {                
                $("#itemRemainingSlider").removeClass("container-remaining slideOutDown").addClass("container-remaining slideInUp");
                this.itemRemainingiScroll = Shared.LoadiScroll(this.itemRemainingiScroll, "ItemsRemaining");
                isFromRemainingItemSection = true;
                this.RenderRemainingItems();
                this.$('#itemCountHeader').hide();
            }
            else {
                $('#itemRemainingSlider').removeAttr("style");
                $("#itemRemainingSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
                isFromRemainingItemSection = false;
                this.$('#itemCountHeader').show();
                Shared.Focus('#textScanItemCount');
            }            
        },

        ShowRemainingCartItems: function (isShow) {
            if (isShow) {
                $("#itemRemainingSlider").removeClass("container-remaining slideOutDown").addClass("container-remaining slideInUp");
                this.itemRemainingiScroll = Shared.LoadiScroll(this.itemRemainingiScroll, "ItemsRemaining");
                isFromRemainingItemSection = true;
                this.RenderRemainingCartItems();
                this.$('#itemCountHeader').hide();
            }
            else {
                $('#itemRemainingSlider').removeAttr("style");
                $("#itemRemainingSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
                isFromRemainingItemSection = false;
                this.$('#itemCountHeader').show();
                Shared.Focus('#textScanItemCount');
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

        ShowStockTakeSection: function () {
            $('#miscPhysicalSection').removeClass('section-show').addClass('section-close').addClass('scaleUpDown');
            $('#itemCountSection').removeClass('section-show').addClass('section-close').addClass('scaleUpDown');
            $('#stockTakeSection').removeClass('scaleUpDown').addClass('scaleDownUp').show();
        },

        SkipItem: function () {

           

            this.currentItem = this.GetFirstOrDefaultItemInCollection();
            var self = this;
            this.$("#textScanItem").val("");
            isRotateCard = false;
            isFromSkipItems = false;
            if (this.itemCollection.length == 1) {
                if (this.itemSkippediScroll) {

                    if (!lastPage) {

                        var item = this.GetFirstOrDefaultItemInCollection();
                        this.currentItem = item;
                        this.itemsSkipped.add(item);
                        this.DeleteByItemCode(this.itemCollection, item.get('ItemCode'));
                        this.DeleteByItemCode(this.itemCodeCollection, item.get('ItemCode'));
                        isFromSkipItems = true;
                        // this.buttonNextPage_tap();
                        pageNumber = pageNumber + 1;
                        this.itemSkippediScroll.next();
                        this.LoadNextItems(false);
                        return;
                    }

                    else {
                        this.ValidateCompleteItemCount(false);
                        return;
                    }

                    //var currentPage = this.itemSkippediScroll.currentPage.pageX;
                    //var maxPage = this.itemSkippediScroll.pages.length;

                    //if (currentPage < maxPage - 1) {
                    //    this.itemSkippediScroll.next();
                    //    return;
                    //}
                    //else {

                         
                       
                     
                    //}
                }
                else {
                    this.ValidateCompleteItemCount(false);
                    return;
                }
            }
            else {
                if (this.currentItem.get('IsItemSkipped')) {
                    this.itemSkippediScroll.next();
                    return;
                }
                else {
                    if (!this.itemSkippediScroll) {
                        this.ProcessSkipItems();
                    }
                    else {
                        var currentPage = this.itemSkippediScroll.currentPage.pageX;
                        var maxPage = this.itemSkippediScroll.pages.length;
                        if (!(currentPage < (maxPage - 1))) {
                            this.ProcessSkipItems();
                        }
                        else {
                            this.ProcessSkipItems();
                        }
                    }
                }
            }

        

                this.itemSkippediScroll = Shared.LoadHorizontaliScroll('#itemCountBody', this.itemSkippediScroll);
                this.itemSkippediScroll.on("scrollEnd", function (e) { self.GetCurrentItem(); });
                this.itemSkippediScroll.next();
                this.GetCurrentItem();

                Shared.Focus('#textScanItemCount');

       


        },
        
        PostponeStockTake: function () {
            var stockTakeService = new StockTakeModel();
            var self = this;
            var newItemCodeCollection = new CartCollection();

            var maintenanceType = "";
            if (this.model.get("IsResume")) maintenanceType = "UPDATE";
            else maintenanceType = "CREATE";

            stockTakeService.url = Global.ServiceUrl + Service.POS + Method.POSTPONEWAREHOUSESTOCKTAKE + maintenanceType;

            this.model.set({ Mode: this.Mode });

            if (this.itemCountedCollection.length > 0) {
                this.itemCountedCollection.each(function (item) {
                    newItemCodeCollection.add(item);
                });
            }
            
            if (this.itemCodeCollection.length > 0) {
                this.itemCodeCollection.each(function (item) {
                    newItemCodeCollection.add(item);
                });
            }
            

            if (this.itemCountedCollection.length > 0) {
                this.itemCountedCollection.each(function (item) {
                    var itemCode = item.get("ItemCode");
                    var qty = item.get("Quantity");
                    var expectedQty = item.get("ExpectedQuantity");
                    newItemCodeCollection.where({ ItemCode: itemCode}), function (model) {
                        model.set({ Quantity: qty, ExpectedQuantity: expectedQty });
                    }
                        
                });

            }
        

            switch (this.Mode) {
                case "ItemCount":
                    stockTakeService.set({
                        StockTake: this.model,
                        StockTakeDetails: newItemCodeCollection
                    });
                    this.Animate(true, false);
                    break;
                case "MiscPhysical":
                    stockTakeService.set({
                        StockTake: this.model,
                        StockTakeDetails: this.cartCollection
                    });
                    this.Animate(true, false);
                    break;
            }                        

            stockTakeService.save(null, {
                success: function (model, response, options) {                    
                    if (!model.get("hasError")) {                        
                        self.ShowCompleteSection("", true);
                    }
                },
                progress: this.ProgressScreen
            });

        },

        ProcessSkipItems: function () {
            
                if (this.itemCollection && this.itemCollection.length > 0) {
                    var self = this;
                    var item = this.GetFirstOrDefaultItemInCollection();

                    if (item != null) {
                        var qtySkipped = item.get('QuantitySkipped');
                        var remItemID = item.get("RemainingItemID");

                        qtySkipped += 1;

                        item.set({ QuantitySkipped: qtySkipped });
                        item.set({
                            IsItemSkipped: true,
                            IsItemsRemaining: false
                        });


                        this.UpdateRemainingItems(item);
                        this.itemsSkipped.add(item);
      
                        this.DeleteByItemCode(this.itemCollection, item.get('ItemCode'));
                        this.DeleteByItemCode(this.itemCodeCollection, item.get('ItemCode'));

                        this.RenderSkippedItemList(item);

                        this.UpdateCounter(-1);
                        this.UpdateTotalItemsSkipped(1);
                    }
                }
                else this.ValidateCompleteItemCount(false);

         

           
        },

    

        SwitchDisplay: function (page, pageMode) {
            if (this.isAnimate) return false;

            switch (page) {
                case "page1":
                    Shared.SlideX('#itemMainSlider', 0);                    
                    Shared.Focus('#textboxSearch');
                    break;
                case "page2":
                    this.$('#textboxSearch').blur();
                    switch (pageMode) {
                        case "ItemSetting":
                            this.ShowItemSettingSection();
                            break;
                        case "ItemCountDetail":
                            this.ShowTransferDetailSection();
                            break;
                        case "CheckList":
                            this.ShowCheckListSection();
                    }
                    Shared.SlideX('#itemMainSlider', Global.ScreenWidth * -1);
                    break;
                case "page3":
                    Shared.SlideX('#itemMainSlider', Global.ScreenWidth * -2);
                    break;
            }
        },

        SwitchItemRemSettingDisplay: function (page) {
            if (this.isAnimate) return false;

            switch (page) {
                case "page1":
                    Shared.SlideX('#itemRemainingSlider', 0);
                    break;
                case "page2":
                    Shared.SlideX('#itemRemainingSlider', (Global.ScreenWidth * -1));
                    break;
            }
        },        

        UpdateCounter: function (qty) {
            var counter = this.model.get("Counter");
            var textQty = "";

            counter += qty;

            this.model.set({ Counter: counter });

            textQty = counter;
            if (this.itemCodeCollection.length > 99) textQty = "99+";
            else textQty = this.itemCodeCollection.length;
            $("#textCounter").text(textQty);
            $("#textTotalItemsRemaining").text(textQty);
        },

        UpdateItemQuantity: function (item) {
            Shared.BeepSuccess();
            this.currentItem = new CartItemView({ model: item });
            if (Preference.PhysicalInventoryIsPromptForQty) {
                this.ShowNumericPad(1);
            } else {
                if (item.get('ItemAdjustmentType') == "In") { this.ChangeItemQuantity(item, 1); }
                else { this.ChangeItemQuantity(item, -1); }
                this.ItemLookupView.SlideDownItemLookup();
                Shared.Focus("#textboxSearch");
            } 
        },
        
        UpdateRemainingItems: function (itemModel) {
            if (itemModel != null) {
                if (!itemModel.get("IsItemsRemaining")) {
                    itemModel.set({ IsDeleted: true });
                    $('#' + itemModel.get("RemainingItemID")).parent().hide();

                    this.currentItem = this.GetFirstOrDefaultItemInCollection();
                }
            }
            if (this.itemCollection && this.itemCollection.length > 0) {
                var rowNumber = 0;
                var self = this;

                this.itemCollection.each(function (item) {
                    if(!item.get("IsDeleted")) {
                        rowNumber = rowNumber + 1;
                        var tapeItemID = item.get("TapeItemID");
                        self.$('#itemRow' + tapeItemID).text(rowNumber);
                    }
                });
            }
        },

        UpdateTotalItems: function (qty) {
            var totalIn = this.model.get('TotalItems');
            if (!totalIn) { totalIn = 0}
            this.model.set({ TotalItems: totalIn += qty });
            $('#textTotalItemsIn').text(this.model.get('TotalItems'));
        },

        UpdateTotalItemsSkipped: function (qty) {
            var totalSkipped = this.model.get("TotalItemsSkipped");
            totalSkipped += qty;

            this.model.set({ TotalItemsSkipped: totalSkipped });
            //this.$("#textTotalItemsSkipped").text(totalSkipped);
        },

        UpdateTotalItemsFromNumerickeyPad: function (item) {
            var totalIn = this.model.get('TotalItemsIn');
            var totalOut = this.model.get('TotalItemsOut');
            var adjustmentType = item.get('ItemAdjustmentType');
            var currentItemQuantity = item.get('CurrentQuantity');
            var existingItemQuantity = currentScannedItemQuantity

            switch (adjustmentType) {
                case "In":
                    if (item.get('IsNewlyAdded')) {
                        item.set({ IsNewlyAdded: false });
                        this.model.set({ TotalItemsIn: (totalIn - 1) + (currentItemQuantity - resumeQuantityScanned) });
                    }
                    else {
                        if (existingItemQuantity > currentItemQuantity) {
                            currentItemQuantity = existingItemQuantity - currentItemQuantity;
                            if (item.get('IsChangeFromItemSetting')) { this.model.set({ TotalItemsIn: totalIn - currentItemQuantity }); }
                            else { this.model.set({ TotalItemsIn: (totalIn - 1) - currentItemQuantity }); }
                        }
                        else {
                            if (existingItemQuantity < 0) {
                                this.model.set({ TotalItemsIn: totalIn + currentItemQuantity });
                            }
                            else {
                                currentItemQuantity = currentItemQuantity - existingItemQuantity;
                                if (item.get('IsChangeFromItemSetting')) { this.model.set({ TotalItemsIn: totalIn + currentItemQuantity }); }
                                else { this.model.set({ TotalItemsIn: (totalIn - 1) + currentItemQuantity }); }
                            }
                        }

                        if (existingItemQuantity > 0) {
                            if (totalOut > 0) { this.model.set({ TotalItemsOut: totalOut - existingItemQuantity }); }
                        }
                        else {
                            if (totalOut == 0) {
                                this.model.set({ TotalItemsOut: totalOut + existingItemQuantity });
                            }
                            else {
                                if (item.get('IsChangeFromItemSetting')) { this.model.set({ TotalItemsOut: totalOut + existingItemQuantity }); }
                                else { this.model.set({ TotalItemsOut: (totalOut - 1) + existingItemQuantity }); }
                            }
                        }
                    }
                    break;
                case "Out":
                    if (item.get('IsNewlyAdded')) {
                        this.model.set({ TotalItemsIn: totalIn - 1 });
                        item.set({ IsNewlyAdded: false })
                        this.model.set({ TotalItemsOut: (totalOut - resumeQuantityScanned) + (currentItemQuantity * -1) });
                    }
                    else {
                        if (existingItemQuantity < 0) {
                            if (existingItemQuantity < currentItemQuantity) {
                                currentItemQuantity = currentItemQuantity - existingItemQuantity;
                                if (item.get('IsChangeFromItemSetting')) { this.model.set({ TotalItemsOut: totalOut + (currentItemQuantity * -1) }); }
                                else { this.model.set({ TotalItemsOut: (totalOut - 1) + (currentItemQuantity * -1) }); }
                            }
                            else {
                                currentItemQuantity = existingItemQuantity - currentItemQuantity;
                                if (item.get('IsChangeFromItemSetting')) { this.model.set({ TotalItemsOut: totalOut - (currentItemQuantity * -1) }); }
                                else { this.model.set({ TotalItemsOut: (totalOut - 1) - (currentItemQuantity * -1) }); }
                            }
                        }
                        else {
                            if (item.get('IsChangeFromItemSetting')) {
                                this.model.set({
                                    TotalItemsIn: totalIn - existingItemQuantity,
                                    TotalItemsOut: totalOut + currentItemQuantity * -1
                                });
                            }
                            else {
                                this.model.set({
                                    TotalItemsIn: (totalIn - 1) - existingItemQuantity,
                                    TotalItemsOut: totalOut + currentItemQuantity * -1
                                });
                            }
                        }
                    }
                    break;
            }

            $('#textTotalItemsIn').text(this.model.get('TotalItemsIn'));
            $('#textTotalItemsOut').text(this.model.get('TotalItemsOut'));
            currentScannedItemQuantity = 0;
            resumeQuantityScanned = 0;
        },

        UpdateTotalQty: function (qty) {
            var totalIn = this.model.get('TotalItemsIn');
            this.model.set({ TotalItemsIn: totalIn - qty });
            $('#textTotalItemsIn').text(this.model.get('TotalItemsIn'));
        },

        ValidateCompleteItemCount: function (isLastItem) {
            var self = this;

            if (this.itemCountedCollection.length < 1) {
                Shared.NotifyError("Cannot complete transaction. You must count at least one item.");
                Shared.BeepError();
                isRotateCard = false;
                return false;                
            }
            else {
                if ((this.itemsSkipped && this.itemsSkipped.length > 0) || (this.currentItem && this.currentItem.get("Quantity") == 0)) {
                    navigator.notification.confirm("You are about to create partial count. Do you want to proceed?", function (button) {
                        if (button == 1) {
                                if (isLastItem && self.itemCollection.length == 1) {
                                    var lastItem = self.GetFirstOrDefaultItemInCollection();
                                    self.itemCountedCollection.add(lastItem);
                                    self.DeleteByItemCode(self.itemCollection, lastItem.get("ItemCode"));
                                    self.DeleteByItemCode(self.itemCodeCollection, lastItem.get("ItemCode"));
                                }
                                self.CompleteStockTake();
                                isFromSkipItems = false;
                          
                           
                        } 
                    }, "Partial Item Count", "Yes,No");
                }
                else {
                    if (isLastItem && this.itemCollection.length == 1) {
                        var lastItem = this.GetFirstOrDefaultItemInCollection();
                        this.itemCountedCollection.add(lastItem);
                        this.DeleteByItemCode(this.itemCollection, lastItem.get("ItemCode"));
                        this.DeleteByItemCode(this.itemCodeCollection, lastItem.get("ItemCode"));
                    }
                    this.CompleteStockTake();
                    isFromSkipItems = false;
                }
            }
            return true;
        },

        WireCardEvents: function (skippedItemID, isSkippedItem) {
            var self = this;

            if (isSkippedItem) {
                //Rotate Card
                Shared.AddRemoveHandler('#' + skippedItemID, 'tap', function () { self.RotateContainerCard(skippedItemID); });

                //Skip Item
                if (Preference.PhysicalInventoryIsAllowToSkipItems) Shared.AddRemoveHandler('#buttonSkipItem' + skippedItemID, 'tap', function () {
                    self.SkipItem();
                });
                else this.HideSkipButton(skippedItemID);
            }
            else {
                //Rotate Card
                if (!$._data($('#currentCardContainer > div').get(0), 'events')) {
                    Shared.AddRemoveHandler('#currentCardContainer > div', 'tap', function () { self.RotateContainerCard(""); });
                }

                //Skip Item
                if (Preference.PhysicalInventoryIsAllowToSkipItems && !this.model.get("HasOnlyOneItem")) {
                    Shared.AddRemoveHandler('#buttonSkipItem' + skippedItemID, 'tap', function () {
                        self.SkipItem();
                    });
                }
                else this.HideSkipButton(skippedItemID);                
            }
        },

        WireEvents: function () {
            var self = this;
            Shared.AddRemoveHandler('#buttonBackCheckList', 'tap', function (e) { self.buttonBackCheckList_tap(e); });
            Shared.AddRemoveHandler('#buttonBackItemsRemaining', 'tap', function (e) { self.buttonBackItemsRemaining_tap(e); });
            Shared.AddRemoveHandler('#buttonBackItemRemSetting', 'tap', function (e) { self.buttonBackItemRemSetting_tap(e); });
            Shared.AddRemoveHandler('#buttonBackItemSetting', 'tap', function (e) { self.buttonBackItemSetting_tap(e); });
            Shared.AddRemoveHandler('#buttonBackItemCount', 'tap', function (e) { self.buttonBackItemCount_tap(e); });
            Shared.AddRemoveHandler('#buttonBackMiscPhysical', 'tap', function (e) { self.buttonBackMiscPhysical_tap(e); });
            Shared.AddRemoveHandler('#buttonBackSkippedItems', 'tap', function (e) { self.buttonBackSkippedItems_tap(e); });
            Shared.AddRemoveHandler('#buttonCancelRemoveItems', 'tap', function (e) { self.buttonCancelRemoveItems_tap(e); });
            Shared.AddRemoveHandler('#buttonComplete', 'tap', function (e) { self.buttonComplete_tap(e); });
            Shared.AddRemoveHandler('#buttonCounter', 'tap', function (e) { self.buttonCounter_tap(e); });
            Shared.AddRemoveHandler('#buttonDelete', 'tap', function (e) { self.buttonDelete_tap(e); });
            Shared.AddRemoveHandler('#buttonItemCount', 'tap', function (e) { self.buttonItemCount_tap(e); });
            Shared.AddRemoveHandler('#buttonMenuCompleted', 'tap', function (e) { self.buttonMenu_tap(e); });            
            Shared.AddRemoveHandler('#buttonMenuStockTake', 'tap', function (e) { self.buttonMenu_tap(e); });            
            Shared.AddRemoveHandler('#buttonMiscPhysical', 'tap', function (e) { self.buttonMiscPhysical_tap(e); });
            Shared.AddRemoveHandler('#buttonMore', 'tap', function (e) { self.buttonMore_tap(e); });
            Shared.AddRemoveHandler('#buttonNextItem', 'tap', function (e) { self.buttonNextItem_tap(e); });
            Shared.AddRemoveHandler('#buttonPostponeItemCount', 'tap', function (e) { self.buttonPostpone_tap(e); });
            Shared.AddRemoveHandler('#buttonPostponeMiscPhysical', 'tap', function (e) { self.buttonPostpone_tap(e); });
            Shared.AddRemoveHandler('#buttonRemoveItems', 'tap', function (e) { self.buttonRemoveItems_tap(e); });
            Shared.AddRemoveHandler('#buttonResume', 'tap', function (e) { self.buttonResume_tap(e); });
            Shared.AddRemoveHandler('#buttonScanItemCount', 'tap', function (e) { self.buttonScanItemCount_tap(e); });
            Shared.AddRemoveHandler('#buttonSearch', 'tap', function (e) { self.buttonSearch_tap(e); });            
            Shared.AddRemoveHandler('#rowQty', 'tap', function (e) { self.rowQty_tap(e); });
            Shared.AddRemoveHandler('#buttonPreviousPage', 'tap', function (e) { self.buttonPreviousPage_tap(e); });
            Shared.AddRemoveHandler('#buttonNextPage', 'tap', function (e) { self.buttonNextPage_tap(e); });
          
    
            
        },        
    });
    return StockTakeView;
});