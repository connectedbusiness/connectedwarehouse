/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',	
	'backbone',	
	'model/lookupcriteria',
	'model/cartItem',
	'model/boxItem',
	'model/pack',
	'collection/cart',
    'view/base/printer',    
    'view/common/enum',
	'view/common/global',
	'view/common/service',
	'view/common/shared',
	'view/common/method',
    'view/common/preference',
	'view/pack/box',	
	'view/pack/boxItem',
    'view/pack/cartItem',
    'view/pack/shipMethodItem',
	'view/lookup/lookup',
	'text!template/pack/pack.tpl.html',
],function($, _, Backbone,
	LookupCriteriaModel, CartItemModel, BoxItemModel, PackModel,
	CartCollection,
    Printer,
	Enum, Global, Service, Shared, Method, Preference,
	BoxView, BoxItemView, CartItemView, ShipMethodItemView,
	BoxLookupView,
	PackTemplate) {

    var isFromRemainingItemSection = false;
    
	var PackView = Backbone.View.extend({
		_mainTemplate : _.template( PackTemplate ),		
		
		events: {										
		},
		
		CurrentSection: null,

		initialize: function() {			
		},		
				
		box_viewboxes: function (box) {
			this.RenderMain();
		},		

		buttonAddBox_tap: function (e) {
		    this.ShowBoxLookup();
		},

		buttonBackItemsRemaining_tap: function (e) {
		    this.ShowItemsRemaining(false);
		},

		buttonBackItemRemSetting_tap: function (e) {
		    $('td').removeClass('highlight');
		    this.currentItem = null;
		    this.ShowItemsRemaining(true);
		    this.SwitchDisplay('page1');
		},

		buttonBackPack_tap: function (e) {
		    var self = this;
		    self.UpdateHide();
		    $('#completedSection').removeClass('section-show').removeClass("bounceInDown").addClass("bounceOutUp");
		    setTimeout(function () { self.GoToMenu(); }, 300);
		},

		buttonCancelRemoveItems_tap: function (e) {
		    Shared.RemoveCheckedItems(this.boxCollection, "Box");
		},

		buttonCounter_tap: function (e) {
		    this.ShowItemsRemaining(true);
		    this.UpdateRemainingItems();
		},

		buttonOther_tap: function (e) {
		    $('#completedSection').removeClass('section-show').removeClass("bounceInDown").addClass("bounceOutUp");
		    setTimeout(function () { window.location.hash = "packlookup"; }, 300);
		},

		buttonRetry_tap: function (e) {
		    var self = this;

		    $('#completedSection').removeClass('section-show').removeClass("bounceInDown").addClass("bounceOutUp");
		    setTimeout(function () { self.InitializeChildViews(); }, 300);		    
		},

		buttonPrint_tap: function (e) {
		    if (this.LabelsToPrint) {
		        this.IsFromCompletePack = false;
		        this.PrintLabels(this.LabelsToPrint);
		    }
		},

		buttonMenu_tap: function (e) {
		    window.location.hash = "dashboard";		    
		},

		buttonCompletePack_tap: function (e) {
		    e.preventDefault();            
		    this.ValidateCompletePack();
		},

		buttonRemoveBoxes_tap: function (e) {
		    this.RemoveSelectedBoxes();
		},

		AddBox: function(currentBox, isConfigure, isNew) {
		    if (!currentBox.get("PackagingCode")) {
		        currentBox.set({ PackagingCode: "Box" + (this.boxCollection.length + 1) });
			}
					
			    box = new BoxItemModel();

			    var length = this.IsNull(currentBox.get("Length"), 0);
			    var width = this.IsNull(currentBox.get("Width"), 0);
			    var height = this.IsNull(currentBox.get("Height"), 0);
			    var addressType = this.model.get("ShipToAddressType");
			    var serviceCode = currentBox.get("ServiceCode");
			    var carrierCode = currentBox.get("CarrierCode");
			    var carrierDescription = currentBox.get("CarrierDescription");
			    var shipMethod= this.model.get('ShippingMethodCode');

			    if (Preference.EnableAdvancedFreightRateCalculation){
			    	shipMethod = this.currentShipMethod;

			    	if (!this.currentServiceCode || !this.currentCarrierDescription || !this.currentCarrierCode) {
			    		//use header carrier details if any of these 3 are null
			    	} else {
			    		serviceCode = this.currentServiceCode;
				    	carrierCode = this.currentCarrierCode;
				    	carrierDescription = this.currentCarrierDescription;
			    	}
			    }

			    if (serviceCode == null) serviceCode = this.model.get('ServiceCode');
			    if (carrierCode == null) carrierCode = this.model.get('CarrierCode');
			    if (carrierDescription == null) carrierDescription = this.model.get('CarrierDescription');
			    if (!addressType) addressType = "Residential";

			    box.set({
			        BoxCapacity: currentBox.get('BoxCapacity'),
			        BoxNumber: this.boxCollection.length + 1,
			        BoxWeight: 0,
			        CarrierCode: carrierCode,
			        CarrierDescription: carrierDescription,
			        cartCollection: new CartCollection(),
			        Counter: this.model.get("Counter"),
			        Dimension: length + " x " + width + " x " + height,
			        FreightRate: this.model.get("FreightRate"),
			        Height: height,
			        IsCustom: currentBox.get("IsCustom"),
			        IsGenerateLabel: false,
			        IsPrePack: currentBox.get("IsPrePack"),
			        Length: length,
			        PackagingCode: currentBox.get("PackagingCode"),
			        PrePackText: null,
			        RowNumber: this.GetShippingBoxCount() + 1,//this.boxCollection.length + 1,
			        ServiceCode: serviceCode,			        
			        ShippingRowNumber: this.GetShippingBoxCount() + 1,
			        ShipToName: this.model.get("ShipToName"),
			        ShipToCountry: this.model.get("ShipToCountry"),
			        ShipToPostalCode: this.model.get("ShipToPostalCode"),
			        ShipToPlus4: this.model.get("ShipToPlus4"),
			        ShipToAddress: this.model.get("ShipToAddress"),
			        ShipToCity: this.model.get("ShipToCity"),
			        ShipToState: this.model.get("ShipToState"),
			        ShipToCounty: this.model.get("ShipToCounty"),
			        ShipToAddressType: addressType,
			        ShipToPhone: this.model.get("ShipToPhone"),
			        ShipToPhoneExtension: this.model.get("ShipToPhoneExtension"),
			        ShippingMethodCode: shipMethod,
			        TotalItems: 0,
			        TotalWeightInPounds: 0,
			        TrackingNumber: currentBox.get("TrackingNumber"),
			        TransactionCode: this.model.get("TransactionCode"),
			        WarehouseCode: Preference.DefaultLocation,
			        Width: width,
			        WeightInPounds: this.IsNull(currentBox.get("WeightInPounds"), 0),
			        UnitMeasureSystem: Global.CurrentUser.UnitMeasureSystem,
			        Hide: false
			    });
			    this.model.set({
			    Box: currentBox.get("PackagingCode")
			    });

            this.boxCollection.add(box);
	
			var boxItemView = this.CreateBoxItemView(box);			

			boxItemView.boxView.off("deleteBox", function (view) { this.DeleteBox(); }, this);
			boxItemView.boxView.on("deleteBox", function (view) { this.DeleteBox(); }, this);

			boxItemView.boxView.off("addMoreBox", function (view) { this.ShowBoxLookup(); }, this);
			boxItemView.boxView.on("addMoreBox", function (view) { this.ShowBoxLookup(); }, this);

			boxItemView.boxView.off("loadCountryLookup", function (view) { this.ShowShippingAddressLookup("country", view); }, this);
			boxItemView.boxView.on("loadCountryLookup", function (view) { this.ShowShippingAddressLookup("country", view); }, this);

			boxItemView.boxView.off("loadPostalLookup", function (view) { this.ShowShippingAddressLookup("postal", view); }, this);
			boxItemView.boxView.on("loadPostalLookup", function (view) { this.ShowShippingAddressLookup("postal", view); }, this);

			boxItemView.boxView.off("showPackSection", function (view) { this.ShowPackSection(); }, this);
			boxItemView.boxView.on("showPackSection", function (view) { this.ShowPackSection(); }, this);

			boxItemView.boxView.off("showItemsRemainingSection", function (view) { this.ShowItemsRemaining(true); }, this);
			boxItemView.boxView.on("showItemsRemainingSection", function (view) { this.ShowItemsRemaining(true); }, this);

			boxItemView.boxView.off("updateItemsRemaining", function (view) { this.UpdateRemainingItems(); }, this);
			boxItemView.boxView.on("updateItemsRemaining", function (view) { this.UpdateRemainingItems(); }, this);

			boxItemView.boxView.off("updateCounter", function (view) { this.UpdateCounter(view); }, this);
			boxItemView.boxView.on("updateCounter", function (view) { this.UpdateCounter(view); }, this);

			boxItemView.boxView.off("updateTotalItems", function (view) { this.UpdateTotalItems(view); }, this);
			boxItemView.boxView.on("updateTotalItems", function (view) { this.UpdateTotalItems(view); }, this);

			boxItemView.boxView.off("generateLabel", function (e) { this.ValidateCompletePack(e) }, this);
			boxItemView.boxView.on("generateLabel", function (e) { this.ValidateCompletePack(e) }, this);

			this.currentBoxView = boxItemView.boxView;

			if (isConfigure) {
				this.ConfigureBox(boxItemView);	
			}

			this.UpdateTotalBoxes();
			this.UpdateShippingTotalBox(box, 1);
			this.iScrollPack = Shared.LoadiScroll(this.iScrollPack, "Pack");
		},
		
		AnimatePack: function (isAnimate) {
		    this.ProgressScreen = Shared.ShowProgress(this.ProgressScreen, isAnimate, "itemMainSlider", true);		    
		},

		AnimateCompleteButton: function (isAnimate) {
		    if (isAnimate) {
		        this.$('#buttonCompletePack').text('packing...');
		        this.$('#buttonGenerateLabel').text('packing...');
		    }
		    else {
		        this.$('#buttonCompletePack').text('complete');
		        this.$('#buttonGenerateLabel').text('complete');
		    }
		},

		ConvertToBoxModel: function (box) {
		    if (box) {
		        boxModel = new BoxItemModel();

		        boxModel.set({
		            BoxCapacity: this.IsNull(box.WeightLbs, 0),
		            BoxNumber: this.boxCollection.length + 1,
		            BoxWeight: 0,
		            CarrierCode: box.CarrierCode,
		            CarrierDescription: box.CarrierDescription,
		            cartCollection: new CartCollection(),
		            Counter: this.model.get("Counter"),
		            Height: this.IsNull(box.Height, 0),
		            IsCustom: box.IsCustom,
		            IsGenerateLabel: false,
		            Length: this.IsNull(box.Length, 0),
		            PackagingCode: box.PackagingCode,
		            RowNumber: this.boxCollection.length + 1,
		            ServiceCode: box.ServiceCode,
		            TotalItems: 0,
		            TrackingNumber: box.TrackingNumber,		            		            
		            TransactionCode: this.model.get("TransactionCode"),
		            WeightInPounds: 0,
		            Width: this.IsNull(box.Width, 0)
		        });
		        return boxModel;
		    }
            return null;
		},

		ConvertToCartItemModel: function (source, isRemainingItem) {
		    var cartItem = new CartItemModel();
		    var quantityToScan = 0;
		    var quantity = 0;
		    var boxNumber = 0;

		    if (this.currentBoxView != null) boxNumber = this.currentBoxView.model.get("BoxNumber");

		    if (this.itemID == null) this.itemID = 0;
		    this.itemID += 1;

		    if (source.ShipQuantity == null) source.ShipQuantity = 0;
		    quantityToScan = source.QuantityAllocated - source.ShipQuantity;		    

		    if (isRemainingItem) {
		        quantity = quantityToScan;
		    }
		    else {
		        if (source.IsPrePacked || source.IsOverSized) quantity = 1;
		        else if (source.TrackingNumber != "") quantity = source.ShipQuantity;
		        else quantity = 0; 
		    }		    

		    cartItem.set({
		        BarCode: source.BarCode,
		        BoxNumber: boxNumber,
		        CarrierCode: source.CarrierCode,
		        CarrierDescription: source.CarrierDescription,
		        CurrentWeightInPounds: source.WeightInPounds,
		        FreeStock: source.FreeStock,
                FreightRate: source.FreightRate,
		        IsDeleted: false,
		        IsOverSized: source.IsOverSized,		        
		        ItemCode: source.ItemCode,
		        ItemID: this.itemID,
		        ItemName: source.ItemName,
		        ItemDescription: source.ItemDescription,
		        OverSizedShippingMethodCode: source.OverSizedShippingMethodCode,
		        PackagingCode: source.PackagingCode,
		        RemainingItemID: "REM" + this.itemID,
		        RowNumber: this.itemID,
		        ShipQuantity: quantity,
		        Quantity: quantity,		        
		        QuantityToScan: quantityToScan,
                QuantityScanned: 0,
		        TapeItemID: "ITEM" + this.itemID,
		        TransactionCode: source.TransactionCode,
		        UPCCode: source.UPCCode,
		        UnitMeasureCode: source.UnitMeasureCode,
		        WeightInPounds: source.WeightInPounds,		        
		        CartItemImage: Shared.GetImageUrl(Enum.ImageType.CartItem, source.ItemIconFile),
		        WeightInKilograms: source.WeightInKilograms,
		        UnitMeasureSystem: Global.CurrentUser.UnitMeasureSystem,
		        ShippingMethodCode: source.ShippingMethodCode,
		        Hide: false,
		        ShippingNotes: source.ShippingNotes
		        //LineNum: source.LineNum
		    });

		    return cartItem;
		},

		CompletePack: function () {			
			var packModel = new PackModel();			    			    
			var self = this;

			packModel.url = Global.ServiceUrl + Service.SOP + Method.CREATESHIPMENT;
			var isInvoice = (Preference.PackSourceTransaction.toLowerCase() == "invoice");

			for (var i = 0; i < this.boxCollection.length; i++) {
				var curModel = this.boxCollection.models[i];
				curModel.set("Weight", curModel.get("TotalWeightInPounds"));
			}

			packModel.set({
			    Packs: this.boxCollection,
			    Items: this.GetBoxItems(),
			    IsInvoice: isInvoice
			});

			this.IsCompleting = true;
			this.AnimatePack(true);
			this.AnimateCompleteButton(true);
			packModel.save(null, {
			    success: function (model, response, options) {			        
			        if (!model.get("hasError")) {			            
			            self.boxCollection.reset();
			            self.LabelsToPrint = model;

			            if (Preference.PackIsAutoPrint) {
			                $('#buttonPrint').hide();
			                self.IsFromCompletePack = true;
			                self.PrintLabels(model);
			            }
			            else {
			                self.ShowCompletedSection(self.model.get("TransactionCode"));			                
			                $('#buttonPrint').show();
			            }
			        } else {
			            self.ShowFailedCompletedSection();
			        }
			        self.AnimateCompleteButton(false);
			    },
			    progress: this.ProgressScreen
			});					
		},
	
		ConfigureBox: function(boxItemView) {
			var boxView = boxItemView.boxView;
			this.currentBoxItemView = boxItemView;
			this.currentBoxView = boxView;
			this.IsInsideABox = true;
			
			this.ShowBoxSection(boxView);
		},
				
		CreateBoxView: function(box) {
			var boxView = new BoxView({
				model : box
			});
			
			this.boxArray.push(boxView);
			boxView.availableItems = this.availableItems;
			boxView.model.set('FilteredCounter', this.FilterShippingMethod(boxView.availableItems));
			return boxView;
		},
		
		CreateBoxItemView: function (box) {
		    var self = this;
			var boxItemView = new BoxItemView({
				model : box
			});
			
			self.boxItemArray.push(boxItemView);
			boxItemView.boxView = this.CreateBoxView(box);		
			$("#cartListPack tbody").append(boxItemView.render());
			$('#itemRow' + box.get('BoxID')).text(box.get('ShippingRowNumber'));
			
			if (!boxItemView.model.get('IsPrePack') || !this.HasTrackingNumber(boxItemView)) {
			    var allowDelete = !boxItemView.model.get('IsPrePack');
			    if (allowDelete) allowDelete = !self.HasTrackingNumber(boxItemView);
			    if (allowDelete) {
			        Shared.AddRemoveHandler('.' + boxItemView.model.get('BoxID') + "-itemcol-1", 'tap', function () {
			            Shared.ToggleItemCheck(boxItemView.model, "Box");
			            Shared.ShowRemoveFooter(self.boxCollection);
			        });
			    }			        
			}
			Shared.AddRemoveHandler('.' + boxItemView.model.get('BoxID') + "-itemcol-2", 'tap', function (e) { self.ConfigureBox(boxItemView); });
			Shared.AddRemoveHandler('.' + boxItemView.model.get('BoxID') + "-itemcol-3", 'tap', function (e) { self.ConfigureBox(boxItemView); });

			return boxItemView;
		},	        

		DeleteBox: function () {
		    var self = this;

		    navigator.notification.confirm("Are you sure you want to remove this box?", function (button) {
		        if (button == 1) {
		            if (self.currentBoxView && self.currentBoxItemView) {
		                //if (self.ValidateDeleteBox()) {
		                    var totalItems = self.model.get('TotalItems');
		                    var counter = self.model.get('Counter');

		                    self.model.set({
		                        TotalItems: totalItems - self.currentBoxView.model.get("TotalItems"),
		                        Counter: counter + self.currentBoxView.model.get("TotalItems")
		                    });

		                    self.currentBoxView.remove();
		                    self.boxCollection.remove(self.currentBoxView.model);
		                    self.currentBoxItemView.remove();

		                    self.UpdateBoxRow();
		                    self.UpdateCounter(null);
		                    self.UpdateTotalItems(null);
		                    self.UpdateTotalBoxes();
		                    self.ShowPackSection();
		                //}
		            }
		        }
		    }, "Delete Box", "Yes,No")
			
		},			

		FilterShippingMethod: function(itemCollection, shippingMethod, remove) {
            var self= this;
            var toRemove = [];
            var counter = 0;
            if (shippingMethod == null) shippingMethod = self.currentShipMethod;
            itemCollection.each(function(item) {
            	var isDeleted = item.get('IsDeleted');
            	if (isDeleted == null) isDeleted = false;
                if ((shippingMethod == null || item.get('ShippingMethodCode') == shippingMethod) && isDeleted == false) {
                    counter += item.get('Quantity');
                } else {
                    toRemove.push(item);
                }
            });

            if (remove) {
                for (var i = 0; i < toRemove.length; i++) {
                    itemCollection.remove(toRemove[i]);
                }
            }

            return counter;
        },

		GetBoxItems: function () {
		    var items = new CartCollection();
		    
		    this.boxCollection.each(function (box) {
		        box.get('cartCollection').each(function (item) {
		            items.add(item); 
		        })
		    });		    

		    return items;
		    
		},

		GetShippingBoxCount: function() {
			var self = this;
			var boxCount = 0;
			var count;

			if (Preference.EnableAdvancedFreightRateCalculation) {
				self.shippingCollection.find(function(shipModel) {
					if (shipModel.get("shippingName") == self.currentShipMethod) {
						count = shipModel.get('boxCount');
						return;
					}
				});

				if (count == null) {
					boxCount = self.boxCollection.length;
				} else {
					boxCount = count;
				}
			} else {
				boxCount = self.boxCollection.length;
			}

			return boxCount;
		},

		GoToMenu: function () {
			if ($('#packBody').is(':visible') && Preference.EnableAdvancedFreightRateCalculation) {
				$('#buttonCounterPack').show();
				$('#buttonCounterMessage').hide();
				$('#buttonCounterShip').hide();
				$('#shipBody').show();
				$('#packBody').hide();
				$('#textCounterPack').text(this.FilterShippingMethod(this.availableItems));
			} else {
			    if (this.boxCollection && this.boxCollection.length > 0) {
			        navigator.notification.confirm("There are items to process. Are you sure you want to cancel?", function (button) {
			            if (button == 1) window.location.hash = "packlookup";
			        }, "Cancel Pack", "Yes,No");
			    }
			    else {
			        window.location.hash = "packlookup";
			    }
			}

		},

		HasTrackingNumber: function (boxItemView) {
		    var trackingNumber = boxItemView.model.get('TrackingNumber');

		    if (trackingNumber == null) trackingNumber = "";

		    return (!(trackingNumber == "" || trackingNumber == "[To be generated]"));
		},

		InitializeChildViews: function () {
		    this.InitializeModel();		    
		    if (Global.PackMode == "Pack") {		        
		        this.$el.html(this._mainTemplate(this.model.toJSON()));
		        if (!Preference.EnableAdvancedFreightRateCalculation) {
		        	$('#packBody').show();
		        	$('#shipBody').hide();
		        }
		        this.WireEvents();
		        this.InitializeShippingCollection();
		        this.InitializeBoxCollection();
		        this.InitializeAvailableItems();
		        this.LoadPack();
		    } else if(Global.PackMode == "Label") {		        
		        this.InitializeBoxCollection();
		        this.InitializeAvailableItems();
		        $('#buttonCompletePack').text('generate label');
		    }
		},			

		InitializeModel: function() {			
		    var transactionCode = Global.TransactionCode;
			
			this.model = new PackModel();
							 
			this.model.set({
			    TransactionCode: transactionCode,
				Counter: 0,
				TotalItems: 0,
				TotalShipMethod: 0,
				Box: null                
			});					
		},
				
		InitializeBoxCollection: function() {
			this.boxItemArray = [];
			this.boxArray = [];
			if (this.boxCollection) {
				this.boxCollection.reset();
			}
			else {
				this.boxCollection = new CartCollection();													
			}
		},
	
		InitializeAvailableItems: function() {
			if (this.availableItems) {
				this.availableItems.reset();
			}
			else {
				this.availableItems = new CartCollection();										
			}
		},

		InitializeShippingCollection: function() {
			this.shippingArray = [];
			if (this.shippingCollection) {
				this.shippingCollection.reset();
			}
			else {
				this.shippingCollection = new CartCollection();
			}
		},

		InitializeOrder: function (pack) {

		    var shipToPlus4 = 0;
		    if (pack.ShipToPlus4) shipToPlus4 = pack.ShipToPlus4;

			this.model.set({				
        		TransactionCode : pack.TransactionCode,
        		BillToCode : pack.BillToCode,
        		BillToName : pack.BillToName,
        		ShipToCode : pack.ShipToCode,
        		ShipToName: pack.ShipToName,
        		ShipToCountry: pack.ShipToCountry,
        		ShipToPostalCode: pack.ShipToPostalCode,
        		ShipToPlus4: shipToPlus4,
        		ShipToAddress: pack.ShipToAddress,
        		ShipToCity: pack.ShipToCity,
        		ShipToState: pack.ShipToState,
        		ShipToCounty: pack.ShipToCounty,
        		ShipToAddressType: pack.ShipToAddressType,
        		ShipToPhone: pack.ShipToPhone,
        		ShipToPhoneExtension: pack.ShipToPhoneExtension,
        		DueDate : pack.DueDate,
        		PackagingCode : pack.PackagingCode,
        		WarehouseCode : pack.WarehouseCode,
        		ShippingMethodCode : pack.ShippingMethodCode,
        		CarrierCode: pack.CarrierCode,
        		CarrierDescription: pack.CarrierDescription,
        		Box: pack.PackagingCode,        		
        		ServiceCode: pack.ServiceCode,
        		TransactionType: Preference.PackSourceTransaction,
                FreightRate: pack.FreightRate,
			});
		},

		InitializeRemainingItemSetting: function () {
		    $('#remSettingsItemCode').text(this.currentItem.model.get('ItemCode'));
		    $('#remSettingsItemName').text(this.currentItem.model.get('ItemName'));
		    // $('#remSettingsItemDesc').text(this.currentItem.model.get('ItemDescription'));
		    $('#remSettingsUPCCode').text(Shared.ConvertNullToEmptyString(this.currentItem.model.get('UPCCode')));
		    $('#remSettingsQuantity').text(this.currentItem.model.get('Quantity'));
		    $('#remSettingsFreeStock').text(this.currentItem.model.get('FreeStock'));
		    $('#remSettingsRemUnitMeasureCode').text(this.currentItem.model.get('UnitMeasureCode'));
		    var shippingNotes = this.currentItem.model.get('ShippingNotes');
		    var itemDescription =  this.currentItem.model.get('ItemDescription');
		    if(shippingNotes) {
		    	 $('#rowRemShippingNotes').show();
		         // $('#remSettingsShippingNotes').text(shippingNotes);		
		         if (shippingNotes.length > 20) {
                       this.$('#rowRemShippingNotes').html("<a>Notes<br><span style='white-space:normal'>" + shippingNotes  + "</span></a>")
                   }
                   else {
                      this.$('#rowRemShippingNotes').html("<a><span class='pull-right'>" + shippingNotes  + "</span>Notes</a>")
                   }
		    } 
		    else  $('#rowRemShippingNotes').hide();

		     if (itemDescription.length > 20) {
                       this.$('#rowRemDesc').html("<a>Description<br><span style='white-space:normal'>" + itemDescription  + "</span></a>")
                 }
                 else {
                    this.$('#rowRemDesc').html("<a><span class='pull-right'>" + itemDescription  + "</span>Description</a>")
                 }
		},

		IsNull: function (currentValue, newValue) {
		    if (!currentValue || currentValue == "") {
		        currentValue = newValue;
		    }
		    return currentValue;
		},

		LoadRemainingItemSetting: function (item) {
		    Shared.HighLightItem(item.model.get('RemainingItemID'), "Default");
		    this.currentItem = item;
		    this.InitializeRemainingItemSetting();
		    this.SwitchDisplay('page2');
		    this.ShowFreeStockItemSetting();
		},

		LoadPack: function() {
			var transactionCode = Global.TransactionCode;
			var warehouseCode = Preference.DefaultLocation;
			var isShowFreeStock = Preference.PackIsShowQtyOnHand;

			if (transactionCode) {
				var packModel = new PackModel();
				var self = this;
				
				packModel.url = Global.ServiceUrl + Service.SOP + Method.LOADPACKITEMS;
				
				packModel.set({
				    IsShowFreeStock: isShowFreeStock,
				    TransactionCode: transactionCode,
				    WarehouseCode: warehouseCode,
				    TransactionType: Preference.PackSourceTransaction,
				    UseCbeImage: Preference.UseCbeImage,
				    WebSiteCode: Preference.WebSiteCode
				});
				
		    	packModel.save(null, {
		    	    success: function (model, response, options) {
		    	        if (!model.get("hasError")) {
		    	            self.PreparePack(response);
		    	        }		    			
		    		}		    		
		    	});
			}
		},
		
		PreparePack: function(packGroup) {
		    if (this.ValidateOrder(packGroup)) {
		        this.itemID = 0;
				var pack = packGroup.Packs[0];				
				
				this.InitializeOrder(pack);
				this.RenderBoxesWithLabel(packGroup);
				this.PrepareDefaultBox(pack, packGroup.Items);
				this.PopulateAvailableItems(packGroup.Items);
				this.PopulateShippingCollection(packGroup.Items);
			   //this.RenderItemsToPack();
				
                this.UpdateCounter(null);
				this.SetPackNavTitle();
				this.SetBoxLabel();
			}
		    else {
		        navigator.notification.alert("There are no items to pack. Please select another order", null, "Pack", "OK");
				window.location.hash = "packlookup";
			}			
		},		

		RenderShippingCollection: function() {
			var self = this;
			self.shippingCollection.each(function(shipMethod) {
				var shipView = new ShipMethodItemView({ model: shipMethod});
				self.shippingArray.push(shipView);
				$("#cartListShip tbody").append(shipView.render());
				Shared.AddRemoveHandler('#' + shipView.model.get('shippingID'), 'tap', function () {
					self.currentShipMethod = shipView.model.get('shippingName');
					self.currentCarrierCode = shipView.model.get('carrierCode');
					self.currentCarrierDescription = shipView.model.get('carrierDescription');
					self.currentServiceCode = shipView.model.get('serviceCode');
					self.UpdateHide(self.currentShipMethod);

					_.each(self.boxItemArray, function(box) {
						box.hidetoggle();
					});

					self.SetBoxlLabelShip();
					var filtered = self.FilterShippingMethod(self.availableItems);
					$('#textCounterPack').text(filtered);
					$('#textCounterShip').text(filtered);
					if (filtered == 0 ) {
						$("#buttonCounterShip").removeClass('btn-danger').addClass('btn-nephritis');
					} else {
						$("#buttonCounterShip").removeClass('btn-nephritis').addClass('btn-danger');
					}

					$('#buttonCounterShip').show();
					$('#buttonCounterPack').hide();
	            	$('#packBody').show();
	            	$('#shipBody').hide();
	            });
			});
			$('#textShipMethodTotal').text(this.shippingCollection.length);
		},

		UpdateHide: function(shippingMethod) {
			if (!Preference.EnableAdvancedFreightRateCalculation) return;
			var self = this;
			self.currentShipMethod = shippingMethod;
			this.availableItems.each(function(item) {
				if (shippingMethod == null || item.get('ShippingMethodCode') == self.currentShipMethod) {
					item.set('Hide', false);
				} else {
					item.set('Hide', true);
				}
				
			});

			this.boxCollection.each(function(box) {
				if (shippingMethod == null || box.get('ShippingMethodCode') == self.currentShipMethod) {
					box.set('Hide', false);
				} else {
					box.set('Hide', true);
				}
			});
		},

		PrepareDefaultBox: function(pack, packItems) {
		    //this.boxCollection.reset();
		    var self = this;
		    _.each(packItems, function (item) {
		        if (item != null) {		            
		            if (item.IsPrePacked || item.IsOverSized) {
		                for (i = 0; i < item.QuantityAllocated; i++) {
		                	if (Preference.EnableAdvancedFreightRateCalculation) self.currentShipMethod = item.ShippingMethodCode;
		                    self.PrepareDefaultBoxItem(pack, item);
		                    self.ShowPrePackIndicator(self.currentBoxView);
		                }
		            }		            		            
		        }
		    });
		},

		PrepareDefaultBoxItem: function (pack, item) {
		    var prepackBox = this.ConvertToBoxModel(pack);

		    if (Preference.EnableAdvancedFreightRateCalculation) {
		    	this.currentCarrierCode = item.CarrierCode;
		    	this.currentCarrierDescription = item.CarrierDescription;
		    	this.currentServiceCode = item.ServiceType;
		    }

		    prepackBox.set({ IsPrePack : true });
		    this.AddBox(prepackBox, false);

		    var newItem = this.ConvertToCartItemModel(item, false);

		    this.currentBoxView.GetCartCollection().add(newItem);

		    var weight = this.currentBoxView.CalculateItemWeight(newItem);
		    var qty = 1;
		    var boxID = this.currentBoxView.model.get('BoxID');

		    this.currentBoxView.model.set({
		        TotalWeightInPounds: weight,
		        TotalItems: qty,
		        WeightInPounds: weight,
		        BoxWeight: weight
		    });
		    $("#textBoxTotalWeight" + boxID).text(weight);
		    $("#textBoxTotalQuantity" + boxID).text(qty);
		},
		
		PopulateAvailableItems: function(items) {					
			this.availableItems.reset();
			var self = this;
			var totalQty = 0;
									
			_.each(items, function (current) {			    
			    var shipQuantity = 0;
			    if (current.ShipQuantity != null) shipQuantity = current.ShipQuantity;

			    if (current.IsPrePacked || current.IsOverSized) {
			        for (i = 0; i <= current.QuantityAllocated; i ++) {
			            var cartItem = self.ConvertToCartItemModel(current, true);
			            cartItem.set({ IsDeleted: true });

			            self.availableItems.add(cartItem);
                    }
			    }
			    else {
			        var cartItem = self.ConvertToCartItemModel(current, true);

			        if (current.QuantityAllocated == shipQuantity) cartItem.set({ IsDeleted: true });
			        else if (current.IsOverSized) cartItem.set({ IsDeleted: true });

			        self.availableItems.add(cartItem);
			    }
                
			    if (!current.IsPrePacked && !current.IsOverSized) totalQty = totalQty + (current.QuantityAllocated - shipQuantity);                			    
			});
			
			this.model.set({				
				Counter : totalQty
			});
		},

		PopulateShippingCollection: function(items) {
			this.shippingCollection.reset();
			var self = this;
			//Comment out pag mali buong self.boxCollection.each(function(box) {})
			self.boxCollection.each(function(box) {
				var boxModel = new BoxItemModel();
				boxModel.set({
					shippingID: "SHIP" + self.shippingCollection.length,
					shippingName: box.get("ShippingMethodCode"),
					carrierCode: box.get("CarrierCode"),
					carrierDescription: box.get("CarrierDescription"),
					serviceCode: box.get("ServiceCode"),
					boxCount: 0,
					quantity: self.FilterShippingMethod(self.availableItems, box.get("ShippingMethodCode")),
					quantityScanned: 0
				});

				var shipMethod = box.get("ShippingMethodCode");

				var methodExist = self.shippingCollection.find(function(shipMethod) {
					if (shipMethod.get('shippingName') == boxModel.get('shippingName')) {
						return true;
					}
				});
				if (methodExist == null || !methodExist ) {
					var boxCount = boxModel.get("boxCount");
					boxModel.set("boxCount", boxCount + 1);
					self.shippingCollection.add(boxModel);
				} else {
					var boxCount = methodExist.get("boxCount");
					methodExist.set("boxCount", boxCount + 1);
				}
			});

			_.each(items, function (item) {
				var boxModel = new BoxItemModel();
				boxModel.set({
					shippingID: "SHIP" + self.shippingCollection.length,
					shippingName: item.ShippingMethodCode,
					carrierCode: item.CarrierCode,
					carrierDescription: item.CarrierDescription,
					serviceCode: item.ServiceType,
					boxCount: 0,
					quantity: self.FilterShippingMethod(self.availableItems, item.ShippingMethodCode),
					quantityScanned: 0
				});

				var methodExist = self.shippingCollection.find(function(shipMethod) {
					if (shipMethod.get('shippingName') == boxModel.get('shippingName')) {
						return true;
					}
				});

				if (methodExist == null || !methodExist ) {
					//add to boxModel boxes that were added with PrepareDefaultBox()
					self.boxCollection.each(function(box) {
						if (box.get('ShippingMethodCode') == boxModel.get('shippingName')) {
							var boxCount = boxModel.get('boxCount');
							boxModel.set('boxCount', boxCount + 1);
						}
					});
					self.shippingCollection.add(boxModel);
				}
			});

			self.boxCollection.each(function(box) {

			});
			this.RenderShippingCollection();
		},

		PrintLabels: function (response) {
		    if (response != null) {
		        var self = this;
		        var transactionCode = self.model.get("TransactionCode");

		        this.AnimatePack(true);
		        Printer.PrintLabels(response.get("Packs"), {
		            success: function() {
		                self.ShowCompletedSection(transactionCode);
		            },
		            error: function () {
		                if (self.IsFromCompletePack) {
		                    self.IsFromCompletePack = false;
		                    if (Preference.PackIsAutoPrint) {
		                        $('#buttonPrint').show();
		                        self.ShowCompletedSection(transactionCode);
		                    }
		                }		                
		            },
		            progress: self.ProgressScreen
		        });
		    }
		},

		RemoveSelectedBoxes: function () {
		    var self = this;

		    navigator.notification.confirm("Are you sure you want to remove these box/es?", function (button) {
		        if (button == 1) {
		            var boxesToDelete = new CartCollection();

		            _.each(self.boxCollection.models, function (current) {
		                if (current.get("IsChecked")) boxesToDelete.add(current);
		            });

		            while (boxesToDelete.models.length > 0) {
		                var totalItems = self.model.get('TotalItems');
		                var counter = self.model.get('Counter');
		                //var boxItemView = new BoxItemView({ model: boxesToDelete.models[0] });
		                var boxItemView = _.find(self.boxItemArray, function(boxItemView) {
		                	if (boxItemView.model == boxesToDelete.models[0]) {
		                		return boxItemView;
		                	}
		                });
		                //boxesToDelete.models[0].trigger("boxDeleted", boxItemView);
		                boxesToDelete.models[0].trigger("boxDeleted");

		                self.model.set({
		                    TotalItems: totalItems - boxesToDelete.models[0].get("TotalItems"),
		                    Counter: counter + boxesToDelete.models[0].get("TotalItems")
		                });

		                self.UpdateShippingTotalBox(boxesToDelete.models[0], -1);
		                boxesToDelete.models[0].RaiseItemDeleted();
		                //self.UpdateCounter(null);
		                self.UpdateTotalItems(null);
		                self.UpdateBoxRow();
		                self.UpdateTotalBoxes();
		            }

		            self.iScrollPack = Shared.LoadiScroll(self.iScrollPack, "Pack");
		            $('#slideFooter').removeClass("slideInUpFooter").addClass("slideOutDownFooter");
		        }
		    });
		},

		Render: function () {
		    return this.$el.html(this._mainTemplate);
		},						

		RenderBoxesWithLabel: function (packGroup) {
		    var self = this;
		    var boxes = packGroup.Boxes;

		    if (boxes) {
		        _.each(boxes, function (box) {
		            if (box.TrackingNumber) {
		                self.AddBox(self.ConvertToBoxModel(box), false);
		                self.RenderItemsWithLabel(packGroup);
		                self.ShowPrePackIndicator(self.currentBoxView);
		            }
		        });
		    }
		},

		RenderItemsWithLabel: function (packGroup) {
		    var self = this;
		    var totalWeight = 0;	    
		    var totalItems = 0;
		    var hasBoxItems = false;
		    var isPrePack = false;

		    var box = this.currentBoxView.model;
		    var boxItems = packGroup.BoxItems;
		    var items = packGroup.Items;
		    var itemsToDelete = new Array();

		    var boxTrackingNumber = box.get("TrackingNumber");
            
		    _.each(boxItems, function (boxItem) {
		        if (boxItem.TrackingNumber) {
		            if (boxItem.TrackingNumber == boxTrackingNumber) {
		                hasBoxItems = true;
		                //Get box item from item collection 
		                var item = null;
		                var itemIndex = -1;
                        
		                for (index = 0; index < items.length; index++) {
		                    var itemCode1 = boxItem.ItemCode;
		                    var um1 = boxItem.UnitMeasureCode;
		                    var itemCode2 = items[index].ItemCode;
		                    var um2 = items[index].UnitMeasureCode;

		                    if (itemCode1 == null) itemCode1 = "";
		                    if (um1 == null) um1 = "";
		                    if (itemCode2 == null) itemCode2 = "";
		                    if (um2 == null) um2 = "";

		                    if (itemCode1 == itemCode2 && um1 == um2) {
		                        itemIndex = index;
		                        item = items[index];
		                        break;
		                    }
		                }
		           
		                if (item != null) {		                    
		                	if (item.ProcessedBox == null && (item.IsPrePacked == true || item.IsOverSized == true)) item.ProcessedBox = item.ShipQuantity;
		                    var newItem = self.ConvertToCartItemModel(item, false);

		                    if (Preference.EnableAdvancedFreightRateCalculation) {
		                    	self.currentBoxView.model.set("ShippingMethodCode", item.ShippingMethodCode);
		                    }
		                    isPrePack = item.IsPrePacked;
		                    self.currentBoxView.GetCartCollection().add(newItem);
		                    totalWeight += self.currentBoxView.CalculateItemWeight(newItem);
		                    totalItems += boxItem.ShipQuantity;
                            		                    
		                    if (item.QuantityAllocated <= item.ShipQuantity) {
		                    	if (item.ProcessedBox == null || item.ProcessedBox == 1) {
		                    		itemsToDelete.push(itemIndex);
		                    	} else {
		                    		item.ProcessedBox = item.ProcessedBox - 1;
		                    	}
		                        
		                    }
		                }
		            }		                
		        }
		    });

		    if (itemsToDelete.length > 0) {
		    	//sort indeces in descending order to not mess up their index when splicing
		    	itemsToDelete.sort(function(a, b) {
		    		return b - a;
		    	});

		        for (index = 0; index < itemsToDelete.length; index++) {
		            items.splice(itemsToDelete[index], 1);
		        }
		    }		    
		 
		    if (hasBoxItems) {		        
		        var boxWeight = box.get("BoxWeight");
		        var boxID = box.get("BoxID");

		        if (boxWeight == null) boxWeight = 0;
		        totalWeight += boxWeight;

		        box.set({
		            TotalWeightInPounds: totalWeight,
		            TotalItems: totalItems,
		            WeightInPounds: totalWeight,
		            IsPrePack: isPrePack
		        });
		        $("#textBoxTotalWeight" + boxID).text(totalWeight);
		        $("#textBoxTotalQuantity" + boxID).text(totalItems);
		    }		    
		},

		 ScanSelectedItem: function (itemView) {
             var upcCode = itemView.model.get('UPCCode');
             var itemCode = itemView.model.get('ItemCode');
             if (upcCode=='' || upcCode == null) upcCode = itemCode;
             this.ShowItemsRemaining(false);
             var items = Shared.FindItems(this.currentBoxView.availableItems, upcCode);
             var cartItemView = new CartItemView({ model: items.models[0] });
             this.currentBoxView.currentItem = cartItemView;
             this.currentBoxView.GetItemByUPC(upcCode);
             
        },

		RenderItemsToPack: function () {
		    var self = this;
		    if (this.model.get('Counter')!=undefined) {
		        $("#cartListItemsRemaining tbody").html("");
		        if (this.availableItems && this.availableItems.models.length > 0) {
		        	var RowNumber = 0;
		            this.availableItems.each(function (item) {
		                if (item.get('Quantity') != 0) {
		                    item.set({ IsItemsRemaining: true });
		                    var itemView = new CartItemView({ model: item });
		                    this.$("#cartListItemsRemaining tbody").append(itemView.render());
		                    Shared.AddRemoveHandler('#buttonItemSetting' + itemView.model.get('RemainingItemID'), 'tap', function (event) {
		                        self.LoadRemainingItemSetting(itemView)
		                        $("#itemRemainingSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
		                         event.stopPropagation();
		                    });
                            
                            Shared.AddRemoveHandler('#' + itemView.model.get('RemainingItemID'), 'tap', function () {
                            self.ScanSelectedItem(itemView);
                        });
		                    if (itemView.model.get('IsDeleted')) {
		                        $('#' + itemView.model.get('RemainingItemID')).parent().hide();
		                    }
		                };
		            });
		        }
		    }		    
		},

		SetPackNavTitle: function () {
		    $('#packNavTitle').text(this.model.get('TransactionCode'));		    
		},

		SetBoxLabel: function () {		    
		    if (this.boxCollection && this.boxCollection.length > 0) {
		        $('#textAddBox').text("add more box");
		    }
		    else {
		        $('#textAddBox').text("add a box");		        
		    }
		},		

		SetBoxlLabelShip: function() {
			// $('textAddBoxShip').text("(" + this.currentShipMethod + ")");
			if (Preference.EnableAdvancedFreightRateCalculation) {
				$("#listShipMethod").show();
				$("#listShipMethod").css("font-size", "16px");
				$("#listShipMethod").text("(" + this.currentShipMethod + ")");
				$("#listAddBox").css("font-size", "16px");
			} else {
				$("#listShipMethod").hide();
				$("#listAddBox").css("font-size", "20px");
			}
		},

		ShowBoxSection: function (boxView) {
		    if (boxView) {
		        $('#boxSectionContainer').html(boxView.render());
		        boxView.model.set({ Counter: this.model.get("Counter") });
		        boxView.InitializeChildViews();		        
		    }

		    $('#boxSectionContainer').removeClass('section-close').removeClass('scaleUpDown').addClass("scaleDownUp");
		    $('#packSection').hide();
		    $('#lookupSectionContainer').removeClass('section-show').addClass('section-close');		    
		    $('#completedSection').removeClass('section-show').addClass('section-close');
		    this.$('.form-group').css('margin-bottom', '12px');
		    this.CurrentSection = "Box";
		    Shared.Focus('#textboxScanItem');
		},

		ShowBoxLookup: function() {			    
		    $('#lookupSectionContainer').html("");

		    var lookupView = new BoxLookupView();
		    lookupView.LookupMode = Enum.LookupMode.Box;
		    if (Preference.EnableAdvancedFreightRateCalculation && this.shippingCollection.length > 0) {
		    	lookupView.CarrierCode = this.currentCarrierCode;
		    	lookupView.CarrierDescription = this.currentCarrierDescription;
			    lookupView.ShippingMethodCode = this.currentShipMethod;
			    lookupView.ServiceCode = this.currentServiceCode;
			    lookupView.IsShowAllBoxes = false;
		    } else {
		    	lookupView.CarrierCode = this.model.get("CarrierCode");
		    	lookupView.CarrierDescription = this.model.get("CarrierDescription");
			    lookupView.ShippingMethodCode = this.model.get("ShippingMethodCode");
			    lookupView.ServiceCode = this.model.get("ServiceCode");
			    lookupView.IsShowAllBoxes = false;
		    }

		    lookupView.on("boxSelected", function (view) {                
		        if (view.CurrentBox) {
		            this.AddBox(this.ConvertToBoxModel(view.CurrentBox), true);
		        }
		    }, this);

		    $('#lookupSectionContainer').html(lookupView.Render());
		    $('#lookupSectionContainer').removeClass('section-close').addClass('section-show');
		    $('#boxSectionContainer').removeClass('section-show').addClass('section-close');		    
		    $('#completedSection').removeClass('section-show').addClass('section-close');
		    $('#packSection').hide();

		    lookupView.InitializeChildViews();
		},
		
		ShowShippingAddressLookup: function (shippingMode, currentBox) {
		    var self = this;
		    $('#lookupSectionContainer').html("");

		    var lookupView = new BoxLookupView();
		    lookupView.LookupMode = Enum.LookupMode.ShippingAddress;
		    lookupView.ShippingMode = shippingMode;

		    if (shippingMode == "postal") lookupView.CountryCode = currentBox.model.get("ShipToCountry");

		    lookupView.off("slideDownLookup", function (view) {
		        self.SlideDownLookup();
		    }, this);
		    lookupView.on("slideDownLookup", function (view) {
		        self.SlideDownLookup();
		    }, this);

		    lookupView.off("itemSelected", function (itemModel) {
		        if (shippingMode == "postal") currentBox.UpdatePostal(itemModel);
		        else currentBox.UpdateCountry(itemModel);

		        self.SlideDownLookup();
		    }, this);
		    lookupView.on("itemSelected", function (itemModel) {
		        if (shippingMode == "postal") currentBox.UpdatePostal(itemModel);
		        else currentBox.UpdateCountry(itemModel);

		        self.SlideDownLookup();
		    }, this);

		    $('#lookupSectionContainer').html(lookupView.Render());
		    $('#lookupSectionContainer').removeClass('section-close').addClass('section-show');
		    $('#completedSection').removeClass('section-show').addClass('section-close');
		    $('#packSection').hide();

		    lookupView.InitializeChildViews();

		    $('#lookupSection').addClass('slideInUp').removeClass('slideOutDown');
		},

		ShowFailedCompletedSection: function() {
		    $('#iconCompleted').removeClass('icon-ok-sign').addClass('icon-remove-sign');
		    $('#completedMessage').text("Pack Failed!");
		    $('#completedMessage').css("color", "#d9534f");
		    $('#messageFailed').show();

		    $('#buttonMore').hide();
		    $('#buttonPrint').hide();
		    $('#buttonOther').show();
		    $('#buttonRetry').show();

		    $('#completedSection').removeClass('section-close').removeClass('bounceOutUp').addClass('section-show').addClass("bounceInDown");
		    $('#lookupSectionContainer').removeClass('section-show').addClass('section-close');
		    $('#boxSectionContainer').removeClass('section-show').addClass('section-close');
		},

		ShowCompletedSection: function (trasactionCode) {
		    $('#completedNavTitle').text(trasactionCode);
		    $('#completedSection').removeClass('section-close').removeClass('bounceOutUp').addClass('section-show').addClass("bounceInDown");
		    
		    $('#iconCompleted').removeClass('icon-remove-sign').addClass('icon-ok-sign');
		    $('#completedMessage').text("Pack Completed!");
		    $('#completedMessage').css("color", "#27ae60");
		    $('#messageFailed').hide();

		    $('#buttonMore').show();
		    $('#buttonPrint').show();
		    $('#buttonOther').hide();
		    $('#buttonRetry').hide();

		    $("#buttonCounterShip").hide();
		    $("#buttonCounterPack").hide();

		    $('#lookupSectionContainer').removeClass('section-show').addClass('section-close');
		    $('#boxSectionContainer').removeClass('section-show').addClass('section-close');
		},

		ShowItemsRemaining: function (isShow) {
		    if (isShow) {
		        this.$('#textboxScanItem').blur();
		        //this.$("#buttonCounterPack").hide();
		        this.$("#buttonCounter").hide();
		        $("#itemRemainingSlider").removeClass("container-remaining slideOutDown").addClass("container-remaining slideInUp");
		        this.iScrollItemsRemaining = Shared.LoadiScroll(this.iScrollItemsRemaining, "ItemsRemaining");
		        isFromRemainingItemSection = true;
		        this.RenderItemsToPack();
		    }
		    else {
		        if (this.currentShipMethod == null || this.currentShipMethod == '') {
		        	this.$("#buttonCounterPack").show();
		        } else {
		        	this.$("#buttonCounterShip").show();
		        }
		        this.$("#buttonCounter").show();
		        $('#itemRemainingSlider').removeAttr("style");
		        $("#itemRemainingSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
		        isFromRemainingItemSection = false;
		        Shared.Focus('#textboxScanItem');
		    }
		},

		ShowFreeStockItemSetting: function () {
		    if (Preference.PackIsShowQtyOnHand) $('#rowRemFreeStock').show();
		    else $('#rowRemFreeStock').hide();
		},

		SlideDownLookup: function () {
		    $('#lookupSection').addClass('slideOutDown').removeClass('slideInUp');
		},

		ShowPackSection: function () {		    
		    $('#packSection').removeClass('scaleUpDown').addClass('scaleDownUp').show();
		    $('#lookupSectionContainer').removeClass('section-show').addClass('section-close');
		    $('#boxSectionContainer').removeClass('scaleDownUp').removeClass('section-show').addClass('section-close').addClass('scaleUpDown');
		    $('#completedSection').removeClass('section-show').addClass('section-close');
		    this.CurrentSection = "Pack";
		    this.iScrollPack = Shared.LoadiScroll(this.iScrollPack, "Pack");
		},

		ShowPrePackIndicator: function (boxView) {
		    var boxID = boxView.model.get('BoxID');
		    if (boxView.model.get("IsPrePack")) {
		        $("#textBoxPackPrePack" + boxID).show();
		        $("#textBoxPackPrePack" + boxID).text("PrePacked");		                
		    }
		    else $("#textBoxPackPrePack" + boxID).hide();
		},

		SwitchDisplay: function (page) {
		    if (this.isAnimate) return false;

		    switch (page) {
		        case "page1":
		            if (isFromRemainingItemSection) {
		                Shared.SlideX('#itemRemainingSlider', 0);
		            }
		            else {
		                Shared.SlideX('#itemMainSlider', 0);
		            }
		            break;
		        case "page2":
		            if (isFromRemainingItemSection) {
		                Shared.SlideX('#itemRemainingSlider', Global.ScreenWidth * -1);
		            }
		            else {
		                Shared.SlideX('#itemMainSlider', Global.ScreenWidth * -1);
		            }
		            break;
		        case "page3":
		            Shared.SlideX('#itemMainSlider', Global.ScreenWidth * -2);
		            break;
		    }
		},

		UpdateCounter: function (qty) {
			var self = this;
		    var counter = this.model.get('Counter');
		    var textQty = "";
		    
		    //if (item) this.model.set({ Counter: counter - item.get('ShipQuantity') });		    
		    counter -= qty;

		    this.model.set({ Counter: counter });		    
		    if (counter > 99) textQty = "99+";
		    else textQty = counter;

		    $('#textCounterPack').text(textQty);
		    $('#textTotalItemsRemaining').text(counter);

		    if (this.model.get('Counter') == 0) {
		        $("#buttonCounterPack").removeClass('btn-danger').addClass('btn-nephritis');
		        $('#buttonAddBox').parent().hide();
		    } else {
		        $("#buttonCounterPack").removeClass('btn-nephritis').addClass('btn-danger');
		        $('#buttonAddBox').parent().show();
		    }		   

		    _.each(this.shippingArray, function(shipView) {
		    	var quantity = self.FilterShippingMethod(self.availableItems, shipView.model.get('shippingName'));
		    	shipView.model.set('quantity', quantity);
		    	shipView.$el.find('.boxRemaining').text(quantity);
		    })
		},

		UpdateRemainingItems: function () {		    
		    if (this.availableItems && this.availableItems.length > 0) {
		        var rowNumber = 0;
		        var totalItemsRemaining = 0;
		        var self = this;

		        this.availableItems.each(function (item) {
		            if (!item.get('IsDeleted') && !item.get('Hide')) {
		                rowNumber = rowNumber + 1;		                
		                totalItemsRemaining = totalItemsRemaining + item.get("QuantityToScan");
		                $('#itemRow' + item.get("RemainingItemID")).text(rowNumber);
		            }
		        });
		        $('#textTotalItemsRemaining').text(totalItemsRemaining);
		    }
		},

		UpdateBoxRow: function () {
		    if (this.boxCollection && this.boxCollection.length > 0) {
		        var rowNumber = 0;
		        var filteredRowNumber = 0;
		        var self = this;

		        this.boxCollection.each(function (item) {		            
		            var boxID = item.get("BoxID");
		            if (Preference.EnableAdvancedFreightRateCalculation) {
		            	if (item.get('ShippingMethodCode') == self.currentShipMethod) {
		            		filteredRowNumber += 1;
		            		item.set('RowNumber', filteredRowNumber);
		            		$('#itemRow' + boxID).text(filteredRowNumber);
		            	}
		            } else {
			            rowNumber = rowNumber + 1;
			            item.set('RowNumber', rowNumber);
			            $('#itemRow' + boxID).text(rowNumber);
		            }
		        });
		    }
		},

		UpdateTotalBoxes: function () {
		    $('#textPackTotalBoxes').text(this.boxCollection.length);
		},

		UpdateShippingTotalBox: function(boxToFind, qty) {
			_.each(this.shippingArray, function(shipView) {
				if (shipView.model.get('shippingName') == boxToFind.get('ShippingMethodCode')) {
					var boxCount = shipView.model.get('boxCount');
					if (boxCount == null) boxCount = 0;
					if (qty == null) qty = 1;
					boxCount = boxCount + qty;
					shipView.model.set('boxCount', boxCount)

					shipView.model.set('boxCount', boxCount);
					shipView.$el.find('.boxCount').text(boxCount);
				}
			});
		},

		UpdateTotalItems: function (item) {
		    var total = this.model.get('TotalItems');

		    if (item) {
		        this.model.set({ TotalItems: total + item.get('ShipQuantity') });
		    }		    
		},

		ValidateCompletePack: function (e) {		   
		    if (this.ValidatePack()) {
		        this.CompletePack();
		    }
		},

		ValidateDeleteBox: function() {
			if (this.currentBoxView.GetCartCollection().length > 0)
			{
			    navigator.notification.confirm("Box contains items. Are you sure you want to delete?", function (button) {
			        if (button == 1) return true;
			        else return false;
			    }, "Delete Box", "Yes,No");
			}
			return true;
		},
		
		ValidateOrder: function(packGroup) {		
			return (packGroup
					&& packGroup.Items && packGroup.Items.length > 0 
					&& packGroup.Packs && packGroup.Packs.length > 0);
		},
		
		ValidatePack: function () {
		    var result = true;

			if (this.CurrentSection == "Box") {
			    if (this.currentBoxView != null) {
			        var qty = this.currentBoxView.model.get("TotalItems");
			        if (qty == null) qty = 0;
                    
			        if (qty <= 0) {			            
			            Shared.NotifyError("You must add at least one item.");
			            result = false;
			        };
			        if (!this.currentBoxView.model.ValidateShippingAddress()) {
			            Shared.NotifyError("Please fill up complete shipping address.");
			            result = false
			        };
			        if (!this.currentBoxView.model.ValidateShippingInfo()) {
			            Shared.NotifyError("Please fill up complete shipping info.");
			            result = false
			        };
			        if (!this.currentBoxView.model.ValidateServiceType()) {
			            Shared.NotifyError("(Unspecified) Service Type is not yet supported.");
			            result = false
			        };

			        if (!result) return false
			    }
			}

			if (this.boxCollection == null || this.boxCollection.length == 0) {
			    navigator.notification.alert("There are no items to pack.");
			    return false;
			}

			var emptyBoxMessage = null;
			var invalidAdressMessage = null;
			var invalidShippingMessage = null;

			for (var index = 0; index < this.boxCollection.length; index++) {
			    var current = this.boxCollection.models[index];
			    var qty = current.get("TotalItems");
			    var isError = false;

			    if (qty == null) qty = 0;

			    if (qty <= 0) {
			        result = false;
			        if (this.CurrentSection == "Box") {
			            emptyBoxMessage = "All other boxes must have at least one item.";
			            isError = true;
			            break;
			        }
			        else {
			            emptyBoxMessage = "Boxes must have at least one item.";
			            isError = true;
			        }
			    }                

			    if (!current.ValidateShippingAddress()) {
			        if (this.CurrentSection == "Box") {
			            invalidAdressMessage = "All other boxes must have valid shipping address.";
			            isError = true;
			            break;
			        }
			        else {
			            invalidAdressMessage = "Boxes must valid shipping address.";
			            isError = true;
			        }
			    }

			    if (!current.ValidateShippingInfo()) {
			        if (this.CurrentSection == "Box") {
			            invalidShippingMessage = "All other boxes must have valid shipping info.";
			            isError = true;
			            break;
			        }
			        else {
			            invalidShippingMessage = "Boxes must have valid shipping info.";
			            isError = true;
			        }
			    }

			    if (isError) current.RaiseBoxError();
			    else current.RaiseBoxValidated();
			}

			if (emptyBoxMessage) Shared.NotifyError(emptyBoxMessage);
			if (invalidAdressMessage) Shared.NotifyError(invalidAdressMessage);
			if (invalidShippingMessage) Shared.NotifyError(invalidShippingMessage);			

			if (invalidAdressMessage || emptyBoxMessage || invalidShippingMessage) return false;

			if (result) {
			    var counter = this.model.get("Counter");
			    if (counter == null) counter = 0;

			    if (counter != 0) {
			        result = false;
			        var self = this;

			        navigator.notification.confirm("There are still remaining items. Do you want to continue?", function (button) {
			            if (button == 1) self.CompletePack();
			        }, "Complete Pack", "Yes,No");
			    }		
			}
			return result;
		},

		WireEvents: function () {
		    var self = this;

		    Shared.AddRemoveHandler('#buttonAddBox', 'tap', function (e) { self.buttonAddBox_tap(e); });
		    Shared.AddRemoveHandler('#buttonBackItemRemSetting', 'tap', function (e) { self.buttonBackItemRemSetting_tap(e); });
		    Shared.AddRemoveHandler('#buttonBackItemsRemaining', 'tap', function (e) { self.buttonBackItemsRemaining_tap(e); });
		    Shared.AddRemoveHandler('#buttonBackPack', 'tap', function (e) { self.buttonBackPack_tap(e); });
		    Shared.AddRemoveHandler('#buttonCancelRemoveItems', 'tap', function (e) { self.buttonCancelRemoveItems_tap(e); });
		    Shared.AddRemoveHandler('#buttonCompletePack', 'tap', function (e) { self.buttonCompletePack_tap(e); });
		    Shared.AddRemoveHandler('#buttonCounterPack', 'tap', function (e) { self.buttonCounter_tap(e); });
		    Shared.AddRemoveHandler('#buttonCounterShip', 'tap', function (e) { self.buttonCounter_tap(e); });
		    Shared.AddRemoveHandler('#buttonMenuCompleted', 'tap', function (e) { self.buttonMenu_tap(e); });
		    Shared.AddRemoveHandler('#buttonMore', 'tap', function (e) { self.buttonBackPack_tap(e); });
		    Shared.AddRemoveHandler('#buttonOther', 'tap', function (e) { self.buttonOther_tap(e); });
		    Shared.AddRemoveHandler('#buttonPrint', 'tap', function (e) { self.buttonPrint_tap(e); });
		    Shared.AddRemoveHandler('#buttonRemoveBoxes', 'tap', function (e) { self.buttonRemoveBoxes_tap(e); });
		    Shared.AddRemoveHandler('#buttonRetry', 'tap', function (e) { self.buttonRetry_tap(e); });
		},
	});
	return PackView;
});