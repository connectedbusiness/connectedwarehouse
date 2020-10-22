/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',	
	'backbone',
    'bootstrap',
    'bootstrapSwitch',
	'model/adjustment',
	'model/cartItem',
    'model/checkListItem',
	'model/lookupcriteria',	
	'collection/cart',
	'view/common/global',
	'view/common/service',
	'view/common/shared',
	'view/common/method',
	'view/common/enum',
    'view/common/preference',
    'view/base/numericpad',
    'view/lookup/itemLookup/itemLookup',
    'view/adjustment/cartItem',
    'view/adjustment/checkListItem',
	'text!template/adjustment/adjustment.tpl.html',    
], function ($, _, Backbone, BootStrap, BootStrapSwitch,
	AdjustmentModel, CartItemModel, CheckListItemModel, LookupCriteriaModel,
	CartCollection, 
	Global, Service, Shared, Method, Enum, Preference,
    NumericPadView, ItemLookupView, CartItemView, CheckListItemView,
	AdjustmentTemplate) {

    var currentScannedItemQuantity = 0;
    var isFromItemSettingSection = false;

    var AdjustmentView = Backbone.View.extend({
        _adjustmentTemplate: _.template(AdjustmentTemplate),        
	
        events: {
            "keypress #textboxSearch": "textboxSearch_keypress",            
        },
		
        initialize: function () {
            this.$el.html(this._adjustmentTemplate);
            Global.ApplicationType = "Adjustment";
        },
        
        buttonMore_tap: function (e) {
            this.InitializeModel();
            this.ShowAdjustmentSection();
            this.InitializeCartCollection();            
            this.ClearCart();
        },
		
        buttonComplete_tap: function () {
            this.ProcessAdjustment();
        },

        buttonDelete_tap: function () {
            this.RemoveItem();
        },

        buttonSearch_tap: function () {
            this.SearchItem();
        },

        buttonItemSetting_tap: function (e) {
            this.InitializeItemSetting();
            this.SwitchDisplay("page2");
        },

        buttonMenu_tap: function(e) {
            this.GoToMenu();
        },

        buttonBackCheckList_tap: function () {
            $('li').removeClass('highlight');
            this.SwitchDisplay('page2')
        },

        buttonBackComplete_tap: function (e) {
            this.GoToMenu();
        },	    

        buttonBackItemSetting_tap: function (e) {
            this.CurrentItemView.model.set({ IsChangeFromItemSetting: false });
            $('td').removeClass('highlight');
            this.SwitchDisplay("page1");
        },

        buttonCancelRemoveItems_tap: function (e) {
            Shared.RemoveCheckedItems(this.cartCollection);
        },

        buttonRemoveItems_tap: function (e) {
            this.RemoveSelectedItems();
        },

        rowZone_tap: function (e) {
            this.$('#rowZone').addClass('highlight');
            this.SetCheckListNavTitle('zones');
            this.SwitchDisplay('page3');
            this.LoadCheckListLookup(Enum.ListMode.ToZone);
        },

        rowQty_tap: function (e) {
            if (Preference.AdjustmentIsPromptForQty) {
                isFromItemSettingSection = true;
                this.ShowNumericPad($('#textQuantity').text());
            }
        },

        rowUnitMeasure_tap: function (e) {
            this.$('#rowUnitMeasure').addClass('highlight');
            this.SetCheckListNavTitle('unit measures');
            this.SwitchDisplay('page3');
            this.LoadCheckListLookup(Enum.ListMode.UM);
        },

        textboxSearch_keypress: function (e) {
            if(e.keyCode === 13){
                this.SearchItem();
            }
        },
		
        AddItemFromItemLookup: function (item) {
            var itemCode = item.ItemCode;
            var existingItem = Shared.FindItem(this.cartCollection, itemCode, item.UnitMeasureCode);

            if (existingItem) {
                this.UpdateItemQuantity(existingItem);
            }
            else {
                this.AddItemToCart(item);
            }
        },

        AddItemToCart: function (item) {
            var cartItem = new CartItemModel();
            var counter = this.cartCollection.length + 1;

            cartItem.set({
                CurrentQuantity: 1,
                FeatureID: "Adjustment",
                FreeStock: item.FreeStock,
                ItemAdjustmentType: "In",
                ItemCode: item.ItemCode,
                ItemDescription: item.ItemDescription,
                ItemID: counter,
                ItemName: item.ItemName,
                IsChangeFromItemSetting: false,
                IsNewlyAdded: true,
                LocationCode: "Zone1",
                LocationDesc: "Normal",
                Quantity: 1,
                RowNumber: counter,
                TapeItemID: "ITEM" + counter,
                UPCCode: item.UPCCode,
                UnitMeasureCode: item.UnitMeasureCode,
                WarehouseCode: Preference.DefaultLocation,
                CartItemImage: Shared.GetImageUrl(Enum.ImageType.CartItem, item.ItemIconFile),
                Cost: item.Cost
            });


            if (Preference.AdjustmentIsPromptForQty) {
                cartItem.set({
                    CurrentQuantity: 0,
                    Quantity: 0,
                });
            }

            this.cartCollection.add(cartItem);

            var cartItemView = new CartItemView({ model: cartItem });
            var self = this;

            this.$("#cartListAdjustment tbody").append(cartItemView.render());
            this.myScroll = Shared.LoadiScroll(this.myScroll, "Adjustment");

            var tapeItemID = cartItemView.model.get('TapeItemID');

            var onAttributeChanged = function () {                
                var um = $('#itemUnitMeasureCode' + tapeItemID);
                var qty = $('#itemQty' + tapeItemID);
                var zoneCode = $('#itemZone' + tapeItemID);

                var settingQty = $('#textQuantity');
                var settingUM = $('#textUnitMeasureCode');
                var settingZone = $('#textZone');                

                var newQty = cartItemView.model.get('Quantity');
                var newUM = cartItemView.model.get('UnitMeasureCode');
                var newZoneCode = cartItemView.model.get('LocationDesc');

                if (qty.text() != newQty) qty.text(newQty);
                if (um.text() != newUM) um.text(newUM);
                if (zoneCode.text() != newZoneCode) zoneCode.text(newZoneCode);
               
                if (settingQty.text() != newQty) settingQty.text(newQty);
                if (settingUM.text() != newUM) settingUM.text(newUM);
                if (settingZone.text() != newZoneCode) settingZone.text(newZoneCode);
            };            

            Shared.AddRemoveHandler('.' + cartItemView.model.get('TapeItemID') + "-itemcol-1", 'tap', function () {
                Shared.ToggleItemCheck(cartItemView.model);
                Shared.ShowRemoveFooter(self.cartCollection);
            });
            Shared.AddRemoveHandler('.' + cartItemView.model.get('TapeItemID') + "-itemcol-2", 'tap', function () { self.LoadItemSetting(cartItemView) });
            Shared.AddRemoveHandler('.' + cartItemView.model.get('TapeItemID') + "-itemcol-3", 'tap', function () { self.LoadItemSetting(cartItemView) });
            Shared.AddRemoveHandler('.' + cartItemView.model.get('TapeItemID') + "-itemcol-4", 'tap', function () { self.LoadItemSetting(cartItemView) });

            Shared.AddRemoveHandler('#' + tapeItemID, 'swipeleft', function (e) {
                var itemQuantity = cartItemView.model.get('Quantity');
                if (itemQuantity == 1) {
                    self.ChangeItemQuantity(cartItemView.model, itemQuantity - 1);
                    self.ChangeItemQuantity(cartItemView.model, cartItemView.model.get('Quantity') - 1);
                }
                else {
                    self.ChangeItemQuantity(cartItemView.model, itemQuantity - 1);
                }
                self.ChangeItemAdjustmentType(cartItemView.model);
                self.UpdateTotalItems(-1, cartItemView.model, true);
            });

            Shared.AddRemoveHandler('#' + tapeItemID, 'swiperight', function (e) {
                var itemQuantity = cartItemView.model.get('Quantity');
                if (itemQuantity == -1) {
                    self.ChangeItemQuantity(cartItemView.model, itemQuantity + 1);
                    self.ChangeItemQuantity(cartItemView.model, cartItemView.model.get('Quantity') + 1);
                }
                else {
                    self.ChangeItemQuantity(cartItemView.model, itemQuantity + 1);
                }
                self.ChangeItemAdjustmentType(cartItemView.model);
                self.UpdateTotalItems(1, cartItemView.model, true);
            });

            cartItem.off("change", onAttributeChanged);
            cartItem.on("change", onAttributeChanged);

            this.currentItem = cartItemView;            

            if (Preference.AdjustmentIsPromptForQty) {
                this.ShowNumericPad(1);
            } else {
                this.UpdateTotalItems(1, null, false);
                this.ItemLookupView.SlideDownItemLookup();
                Shared.Focus("#textboxSearch");
            }

            Shared.BeepSuccess();
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
                    this.UpdateItemQuantity(existingItem);
                }
                else this.AddItemToCart(item);
            }
        },

        Animate: function (isAnimate, isFullScreen) {            
            this.ProgressScreen = Shared.ShowProgress(this.ProgressScreen, isAnimate, "itemMainSlider", isFullScreen);
        },

        AnimateCompleteButton: function (isAnimate) {
            if (isAnimate) this.$('#buttonComplete').text('adjusting...');
            else this.$('#buttonComplete').text('complete');
        },

		CompleteAdjustment: function (result) {		    
		    if (result.ErrorMessage) {
		        navigator.notification.alert(result.ErrorMessage, null, "Adjustment", "OK");
		    }
		    else {
		        this.cartCollection.reset();
		        this.ShowCompletedSection(result);
		    }
		},
        				
		ChangeItemAdjustmentType: function (item) {
		    if (item.get('Quantity') >= 1) {
		        item.set({ ItemAdjustmentType: "In" });
		    }
		    else {
		        item.set({ ItemAdjustmentType: "Out" });		        
		    }
		},

		ChangeItemQuantity: function (item, qtyAdded, isFromNumericPad) {
		    if (isFromNumericPad) {
		        var qtyToAdd = 0
		        if (!isFromItemSettingSection) {
		            qtyToAdd = Shared.ChangeItemQuantity(item, qtyAdded, 11, "add")
		        }
		        else {
		            qtyToAdd = Shared.ChangeItemQuantity(item, qtyAdded, 11, "replace")
		        }
		    }
		    else {
		        item.set({
		            CurrentQuantity: qtyAdded,
		            Quantity: qtyAdded,
		        });
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
		
		ClearCart: function () {
		    $('#textboxSearch').val('');
		    $('#cartListAdjustment tbody').html('');
		    $('#adjustmentCodeIn').text('');
		    $('#adjustmentCodeOut').text('');
		    this.CurrentItemView = null;		    
		},

		GetItemByUPC : function(upcCode) {			
			var itemLookup = new LookupCriteriaModel();   	
	    	var self = this;
	
	    	itemLookup.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADITEMBYUPC + "upcCode=" + upcCode
                                                                                      + "&warehouseCode=" + Preference.DefaultLocation
                                                                                      + "&isShowFreeStock=" + true
                                                                                      + "&useCbe=" + Preference.UseCbeImage
                                                                                      + "&webSite=" + Preference.WebSiteCode;
	    	this.Animate(true, false);
	    	itemLookup.fetch({
	    	    success: function (model, response, options) {	    	        
	    	        if (!model.get("hasError")) {
	    	            if (response != null && response.Items != null && response.Items.length > 0) {
	    	                currentScannedItemQuantity = 0;
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

		GoToMenu: function () {
		    if (this.cartCollection && this.cartCollection.length > 0) {
		        navigator.notification.confirm("There are items to process. Are you sure you want to cancel?", function (button) {
		            if (button == 1) window.location.hash = "dashboard";		            
		        }, "Cancel Adjustment", "Yes,No");
		    }
		    else {
		        window.location.hash = "dashboard";
		    }
		},

		HighlighItem: function () {
		    if (this.CurrentItemView) {
		        this.$("td").removeClass("highlight");
		        this.$("#" + "").addClass("highlight");
		    }
		},

		HighLightListItem: function (itemView) {
		    this.$('.listitem-1').addClass('listitem-1').removeClass('listitem-2');
		    this.$('.listitem-2').addClass('listitem-1').removeClass('listitem-2');
		    Shared.HighLightItem(itemView.cid, "CheckList");
		    this.$('#listItem' + itemView.model.get('ViewID')).removeClass('listitem-1').addClass('listitem-2');
		},

		InitializeChildViews: function () {
		    this.InitializeModel();
		    this.InitializeCartCollection();		    
		    this.WireEvents();
		    this.InitializeItemLookup();
		    this.InitializeNumericPad();
		    this.ShowFreeStockItemSetting();		    
		    Shared.Focus('#textboxSearch');
		},

		InitializeCartCollection: function () {
		    if (this.cartCollection) {
		        this.cartCollection.reset();
		    }
		    else {
		        this.cartCollection = new CartCollection();		        
		    }
		},		

		InitializeModel: function() {
		    this.model = new AdjustmentModel();
		    this.model.set({
		        TotalItemsIn: 0,
                TotalItemsOut: 0,
                WorkstationID: Preference.WorkstationID
		    });
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
		    $('#textItemCode').text(this.CurrentItemView.model.get('ItemCode'));
		    $('#textItemName').text(this.CurrentItemView.model.get('ItemName'));
		    // $('#textItemDesc').text(this.CurrentItemView.model.get('ItemDescription'));
            $('#textUPCCode').text(Shared.ConvertNullToEmptyString(this.CurrentItemView.model.get('UPCCode')));   
		    //$('#textUPCCode').text(this.CurrentItemView.model.get('UPCCode'));
		    $('#textQuantity').text(this.CurrentItemView.model.get('Quantity'));
		    $('#textFreeStock').text(this.CurrentItemView.model.get('FreeStock'));
		    $('#textUnitMeasure').text(this.CurrentItemView.model.get('UnitMeasureCode'));
		    $('#textZone').text(this.CurrentItemView.model.get('LocationDesc'));
            if (itemDescription.length > 20) {
                 this.$('#rowItemDesc').html("<a>Description<br><span style='white-space:normal'>" + itemDescription  + "</span></a>")
             }
            else {
                  this.$('#rowItemDesc').html("<a><span class='pull-right'>" + itemDescription  + "</span>Description</a>")
            }
		    this.CurrentItemView.model.set({ IsChangeFromItemSetting: true });
		    currentScannedItemQuantity = this.CurrentItemView.model.get('Quantity');
		},
		
		InitializeNumericPad: function () {
		    var self = this;
		    var view = new NumericPadView();
		    this.$('#numericPadContainer').html(view.render());

		    this.$('#numClear').addClass('section-close');
		    this.$('#numNegative').removeAttr("style");

		    view.WireNumericPadEvents();
		    var numericPadClosed = function (e) {
		        self.$('#adjustmentHeader').show();
		        if (isFromItemSettingSection) {
		            self.ItemLookupView.SlideDownItemLookup();
		        }
		        else {
		            var qtyScanned = self.currentItem.model.get("Quantity");
		            if (!qtyScanned == 0) {
		                self.ItemLookupView.SlideDownItemLookup();
		            }
		            else {
		                self.currentItem.model.set({
		                    Quantity: 1,
		                    QuantityScanned: 1,
		                })
		                self.ChangeItemAdjustmentType(self.currentItem.model);
		                self.UpdateTotalItemsFromNumerickeyPad();
		            }
		        }
		        isFromItemSettingSection = false;
		        //self.ItemLookupView.SlideDownItemLookup();
		        Shared.Focus('#textboxSearch');
		    }

		    view.off('closenumericpad', numericPadClosed);
		    view.on('closenumericpad', numericPadClosed);

		    var quantityChanged = function (numericPadCriteria) {
		        self.ChangeItemQuantity(self.currentItem.model, numericPadCriteria.NumericPadValue, true);
		        self.ChangeItemAdjustmentType(self.currentItem.model);
		        self.UpdateTotalItemsFromNumerickeyPad();
		        isFromItemSettingSection = false;
		        self.$('#adjustmentHeader').show();
		        self.ItemLookupView.SlideDownItemLookup();
		        view.SlideDownNumericPad();
		        Shared.Focus('#textboxSearch');
		    };

		    view.off('quantitychange', quantityChanged);
		    view.on('quantitychange', quantityChanged);
		},

		LoadCheckListLookup: function (listMode) {
		    var lookupModel = new LookupCriteriaModel();
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
		            case Enum.ListMode.ToZone:
		                lookupModel.set({ Criteria: null });
		                lookupModel.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADSTOCKFROMTOZONELOOKUP;
		                lookupModel.set({ WarehouseCode: Preference.DefaultLocation });
		                break;
		        }

		        this.Animate(true, false);
		        lookupModel.save(null, {
		            success: function (model, response, options) {		                
		                if (!model.get("hasError")) {
		                    self.RenderCheckListLookup(response, listMode);
		                }
		            },
		            progress: this.ProgressScreen
		        });
		    }
		},

		LoadItemSetting: function (cartItemView) {
		    Shared.HighLightItem(cartItemView.model.get("TapeItemID"), 'Adjustment');
		    this.CurrentItemView = cartItemView;
		    this.InitializeItemSetting();
		    this.SwitchDisplay("page2");
		    this.currentItem = cartItemView;
		},

		ProcessAdjustment : function() {
		    if (!this.ValidateAdjustment()) {
		        return false;
		    }
		    else {
                var self = this;
			    if (self.cartCollection.length > 0) {
			        var adjustment = new CartItemModel();
			        var adjustmentType = "Dynamic"
			        adjustment.set({
			            AdjustmentType: adjustmentType,
                        WorkstationID: this.model.get("WorkstationID")
			        })

			        var adjustments = new CartCollection();
			        adjustments.add(adjustment);
			        var adjustmentModel = new AdjustmentModel();
			        adjustmentModel.set({
			            Adjustments: adjustments,
			            Items: self.cartCollection
			        });

			        this.Animate(true, true);
			        this.AnimateCompleteButton(true);
			        adjustmentModel.url = Global.ServiceUrl + Service.PRODUCT + Method.ADJUSTINVENTORYITEMS;
			        adjustmentModel.save(null, {
			            success: function (model, response, options) {
			                if (!model.get("hasError")) {
			                    self.CompleteAdjustment(response);
			                }
			                self.AnimateCompleteButton(false);
			            },
			            progress: this.ProgressScreen
			        });
			    }
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
		            $('#itemZone' + oldTapeItemID).attr("id", 'itemZone' + newTapeItemID);
		            $('#textQty' + oldTapeItemID).attr("id", 'textQty' + newTapeItemID);
		            $('#itemQty' + oldTapeItemID).attr("id", 'itemQty' + newTapeItemID);
		            $('#buttonItemSetting' + oldTapeItemID).attr("id", 'buttonItemSetting' + newTapeItemID);
		        });
		    }
		},

		RemoveItem: function () {
		    var self = this;

		    navigator.notification.confirm("Are you sure you want to remove this item?", function (button) {
		        if (button == 1) {
		            var model = self.CurrentItemView.model;

		            self.cartCollection.remove(model);
		            self.CurrentItemView.remove();

		            self.CurrentItemView.model.set({ CurrentQuantity: self.CurrentItemView.model.get('Quantity') * -1 });
		            self.UpdateTotalItems((model.get('Quantity') * -1), model, false);
		            model.destroy();		            

		            self.RefreshRowNumber(self.cartCollection);
		            self.myScroll = Shared.LoadiScroll(self.myScroll, "Adjustment");
		            self.SwitchDisplay("page1");
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
		                self.UpdateTotalQty(itemsToDelete.models[0].get('Quantity'));
		                itemsToDelete.models[0].RaiseItemDeleted();
		            }

		            self.RefreshRowNumber(self.cartCollection);
		            self.myScroll = Shared.LoadiScroll(self.myScroll, "Adjustment");
		            $('#slideFooter').removeClass("slideInUpFooter").addClass("slideOutDownFooter");
		        }
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
		                        Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) { self.UpdateItemSetting(checklistItemView, listMode); });
		                    });
		                }
		                break;
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
		                        var currentLocationCode = self.currentItem.model.get('LocationCode');

		                        if (currentLocationCode) {
		                            if (currentLocationCode == locationCode) {
		                                self.HighLightListItem(checklistItemView);
		                            }
		                        }
		                        
		                        Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {
		                            self.UpdateItemSetting(checklistItemView, listMode);
		                            self.SwitchDisplay("page2");
		                            self.$('#rowZone').removeClass('highlight');
		                        });
		                    });
		                }
		                break;
		        }
		        this.iScrollCheckList = Shared.LoadiScroll(this.iScrollCheckList, "CheckList");
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
            this.GetItemByUPC(upcCode)
		},

		SetCheckListNavTitle: function (title) {
		    $("#checkListNavTitle").text(title);
		},

		ShowAdjustmentSection: function () {
		    $('#adjustmentSection').removeClass('section-close').addClass('section-show');
		    $('#completedSection').removeClass('section-show').removeClass("bounceInDown").addClass("bounceOutUp");
		    $('#textTotalItemsIn').text(this.model.get('TotalItemsIn'));
		    $('#textTotalItemsOut').text(this.model.get('TotalItemsOut'));
		    Shared.Focus('#textboxSearch');
		},

		ShowCompletedSection: function (result) {		    		    
		    $('#completedSection').removeClass('section-close').addClass('section-show').removeClass("bounceOutUp").addClass("bounceInDown");

		    if (result.TransactionCodes.length == 1) {
		        $('#completedNavTitle').text(result.TransactionCodes[0]);
		    }
		    else if (result.TransactionCodes.length == 2) {
		        $('#completedNavTitle').text(result.TransactionCodes[0] + ' , ' + result.TransactionCodes[1]);
		        $('#completedNavTitle').css('font-size', '16px');
		    }
		    else {
		        $('#completedNavTitle').text(result.TransactionCodes[0] + ' , ' + result.TransactionCodes[1] + ', ...');
		        $('#completedNavTitle').css('font-size', '15px');
		    }
		},

		ShowFreeStockItemSetting: function () {
		    if (Preference.AdjustmentIsShowQtyOnHand) this.$('#rowFreeStock').show();
		    else this.$('#rowFreeStock').hide();
		},

		ShowItemLookup: function (items) {
		    if (items) {
		        this.ItemLookupView.RenderItems(items);
		        $('#adjustmentHeader').hide();
		        $('#itemLookupSection').addClass('slideInUp').removeClass('slideOutDown');
		    }
		},

		ShowNumericPad: function (qty) {
		    $('#textboxQuantity').val(qty);
		    this.$('#textboxSearch').blur();
		    this.$('#adjustmentHeader').hide();
		    $('.numericpad').addClass('slideInUp').removeClass('slideOutDown');
		},

		SwitchDisplay: function (page) {		    
		    switch (page) {
		        case "page1":
		            Shared.SlideX('.slider', 0);
		            Shared.Focus('#textboxSearch');
		            break;
		        case "page2":
		            this.$('#textboxSearch').blur();
		            Shared.SlideX('.slider', Global.ScreenWidth * -1);
		            break;
		        case "page3":
		            Shared.SlideX('.slider', Global.ScreenWidth * -2);
		            break;
		    }
		},

		UpdateItemQuantity: function (item) {		    
		    Shared.BeepSuccess();

		    if (Preference.AdjustmentIsPromptForQty) {
		        this.currentItem = new CartItemView({ model: item });
		        this.ShowNumericPad(1);
		    }
		    else {
		        if (item.get('ItemAdjustmentType') == "In") { this.ChangeItemQuantity(item, (item.get('Quantity') + 1)); }
		        else { this.ChangeItemQuantity(item, (item.get('Quantity') - 1)); }
		        this.UpdateTotalItems(1, null, false);
		        this.ItemLookupView.SlideDownItemLookup();
                Shared.Focus("#textboxSearch");
		    }
		},

		UpdateItemSetting: function (itemView, listMode) {
		    switch (listMode) {		        
		        case Enum.ListMode.UM:
		            this.currentItem.model.set({ UnitMeasureCode: itemView.model.get('UnitMeasureCode') });
		            break;
		        case Enum.ListMode.ToZone:
		            this.currentItem.model.set({
		                LocationCode: itemView.model.get('LocationCode'),
		                LocationDesc: itemView.model.get('ListItemRow1')
		            });
		            break;
		    }
		    this.HighLightListItem(itemView);
		},

		UpdateTotalItems: function (qty, item, isApplyToOther) {
		    var totalIn = this.model.get('TotalItemsIn');
		    var totalOut = this.model.get('TotalItemsOut');
		    var adjustmentType = "In";

		    if (item) adjustmentType = item.get('ItemAdjustmentType');

		    switch (adjustmentType) {
		        case "In":
		            if (isApplyToOther) isApplyToOther = (item.get('Quantity') - qty <= 0);
		            if (isApplyToOther) totalOut -= Math.abs(qty);
		            totalIn += qty;
		            //item.set({ IsNewlyAdded: false });
		            break;
		        case "Out":
		            if (isApplyToOther) isApplyToOther = (item.get('Quantity') - qty >= 0);
		            if (isApplyToOther) totalIn -= Math.abs(qty);
		            totalOut += (qty * -1);
		            break;
		    }

		    if (totalOut < 0) totalOut = 0;
		    if (totalIn < 0) totalIn = 0;

		    this.model.set({ TotalItemsIn: totalIn });
		    this.model.set({ TotalItemsOut: totalOut });

		    $('#textTotalItemsIn').text(this.model.get('TotalItemsIn'));
		    $('#textTotalItemsOut').text(this.model.get('TotalItemsOut'));
		},		

		UpdateTotalItemsFromNumerickeyPad: function () {
		    var totalIn = 0;
		    var totalOut = 0;

		    this.cartCollection.each(function (item) {
		        var adjustmentType = item.get('ItemAdjustmentType');
		        var qty = item.get('Quantity');

		        switch (adjustmentType) {
		            case "In":		                
		                totalIn += qty;
		                break;
		            case "Out":		                
		                totalOut += (qty * -1);
		                break;
		        }
		    });

		    if (totalOut < 0) totalOut = 0;
		    if (totalIn < 0) totalIn = 0;

		    this.model.set({ TotalItemsIn: totalIn });
		    this.model.set({ TotalItemsOut: totalOut });

		    $('#textTotalItemsIn').text(this.model.get('TotalItemsIn'));
		    $('#textTotalItemsOut').text(this.model.get('TotalItemsOut'));
		},

		UpdateTotalQty: function (qty) {
		    var totalIn = this.model.get('TotalItemsIn');
		    var totalOut = this.model.get('TotalItemsOut');

		    if (qty > 0) {
		        this.model.set({ TotalItemsIn: totalIn - qty });
		    }
		    else {
		        this.model.set({ TotalItemsOut: totalOut + qty });
		    }

		    $('#textTotalItemsIn').text(this.model.get('TotalItemsIn'));
		    $('#textTotalItemsOut').text(this.model.get('TotalItemsOut'));
		},

		ValidateAdjustment: function () {
		    if (this.cartCollection == null || this.cartCollection.length == 0) {
		        navigator.notification.alert("There are no items to process.", null, "Adjustment", "OK");
		        return false;
		    }
		    else {
		        var self = this;
		        var result = true;
                var tempArray = [];
		        self.cartCollection.each(function (item) {
		            if (item.get("ItemAdjustmentType") == "Out") {
		                var qty = item.get("Quantity");
		                if (qty < 0) qty = qty * -1;
		                if (item.get("FreeStock") < qty) {
		                    navigator.notification.alert("There is not enough stock for " 
                                + item.get("ItemName") + "." + " You are deducting quantity more than its free stock of " 
                                + item.get("FreeStock") + ".", null, "Adjustment", "OK");
		                    result = false;
		                    return true;
		                }
		            } 

                    //Validate to make sure that the items to be adjusted are not repeated.
                    //Repeated items are items with the same ItemCode, LocationCode, Zone. Didnt include UM because its already filtered during scanning at UpdateCart()
                    tempArray[tempArray.length] = item;
                    for (var i = 0; i < tempArray.length; i++) {
                        if (tempArray[i] == item) continue;

                        var itemToCheck = tempArray[i];
                        var itemCode = itemToCheck.get("ItemCode");
                        var warehouseCode = itemToCheck.get("WarehouseCode");
                        var locationCode = itemToCheck.get("LocationCode");
                        if (itemCode == item.get("ItemCode") && warehouseCode == item.get("WarehouseCode") && locationCode == item.get("LocationCode")) {
                            navigator.notification.alert("Repeated items cannot have the same Zone. Zone can be changed by clicking on the item and then selecting Zone.");
                            result = false;
                            return true;
                        }
                    }
		        });
		        return result;
		    }

		    return true;
		},

		WireEvents: function () {
		    var self = this;

		    Shared.AddRemoveHandler('#buttonBackCheckList', 'tap', function (e) { self.buttonBackCheckList_tap(e); });
		    Shared.AddRemoveHandler('#buttonBackComplete', 'tap', function (e) { self.buttonBackToAdjustment_tap(e); });
		    Shared.AddRemoveHandler('#buttonBackItemSetting', 'tap', function (e) { self.buttonBackItemSetting_tap(e); });
		    Shared.AddRemoveHandler('#buttonCancelRemoveItems', 'tap', function (e) { self.buttonCancelRemoveItems_tap(e); });
		    Shared.AddRemoveHandler('#buttonComplete', 'tap', function (e) { self.buttonComplete_tap(e); });
		    Shared.AddRemoveHandler('#buttonDelete', 'tap', function (e) { self.buttonDelete_tap(e); });
		    Shared.AddRemoveHandler('#buttonMenu', 'tap', function (e) { self.buttonMenu_tap(e); });
		    Shared.AddRemoveHandler('#buttonMenuCompleted', 'tap', function (e) { self.buttonMenu_tap(e); });
		    Shared.AddRemoveHandler('#buttonMore', 'tap', function (e) { self.buttonMore_tap(e); });
		    Shared.AddRemoveHandler('#buttonRemoveItems', 'tap', function (e) { self.buttonRemoveItems_tap(e); });
		    Shared.AddRemoveHandler('#buttonSearch', 'tap', function (e) { self.buttonSearch_tap(e); });

		    Shared.AddRemoveHandler('#rowQty', 'tap', function (e) { self.rowQty_tap(e); });
		    Shared.AddRemoveHandler('#rowZone', 'tap', function (e) { self.rowZone_tap(e); });

            //Tentative
		    //Shared.AddRemoveHandler('#rowUnitMeasure', 'tap', function (e) { self.rowUnitMeasure_tap(e); });
		    $('#rowUnitMeasure').hide();
		},
	});
	return AdjustmentView;
});