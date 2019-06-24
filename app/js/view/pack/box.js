/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',		
	'backbone',	
	'model/cartItem',
    'model/checkListGroup',
    'model/checkListItem',
    'model/lookupcriteria',
	'collection/cart',
	'view/common/global',
    'view/common/service',
    'view/common/method',
    'view/common/shared',
    'view/common/enum',
    'view/common/preference',
    'view/base/numericpad',
    'view/lookup/itemLookup/itemLookup',
    'view/lookup/lookup',
	'view/pack/cartItem',
    'view/pack/checkListGroup',
    'view/pack/checkListItem',
	'text!template/pack/box.tpl.html',	
],function($, _, Backbone,
	CartItemModel, CheckListGroupModel, CheckListItemModel, LookupCriteriaModel,
	CartCollection,
	Global, Service, Method, Shared, Enum, Preference, NumericPadView, ItemLookupView, AddressLookupView,
	CartItemView, CheckListGroupView, CheckListItemView,
	BoxTemplate) {
        
    var BoxView = Backbone.View.extend({	
        _boxTemplate : _.template( BoxTemplate ),		
		
        events: {
            "keyup #textAreaAddress": "textAreaAddress_keyup",
            "keypress #textboxScanItem": "textboxScanItem_keypress",
            "keyup #textCity": "textCity_keyup",
            "keyup #textCounty": "textCounty_keyup",
            "keyup #textCountry": "textCountry_keyup",
            "keyup #textManualTrackingNumber": "textManualTrackingNumber_keyup",		    
            "keyup #textPhone": "textPhone_keyup",
            "keyup #textPostal": "textPostal_keyup",
            "keyup #textState": "textState_keyup",
        },
		
        NumericPadType: "quantity",

        CheckListMode: "itemSetting",

        ReplaceQuantity: true,

        initialize: function () {
            Global.ApplicationType = "Pack";
        },
		
        render : function() {
            return this.$el.html(this._boxTemplate(this.model.toJSON()));			
        },
		
        buttonAddMoreBox_tap: function (e) {
            this.trigger("addMoreBox", this);
        },

        buttonAddress_tap: function (e) {
            this.SwitchDisplay('page2', "ShippingAddress");
        },

        buttonBackBoxDetails_tap: function (e) {
            this.SwitchDisplay('page1', null);
            if (this.model.get('CarrierDescription') == "Manual") this.UpdateManualBoxInfo();
        },

        buttonBackCheckList_tap: function () {
            $('li').removeClass('highlight');
            if (CheckListMode == "itemSetting") this.SwitchDisplay('page2', "ItemSetting")
            else this.SwitchDisplay('page2', "BoxDetails")
        },

        buttonBackItemSetting_tap: function (e) {
            $('td').removeClass('highlight');
            this.currentItem = null;
            this.SwitchDisplay('page1', null);
        },

        buttonBackShippingAddress_tap: function (e) {
            if (this.ValidateShippingAddress()) {
                $('#textAddress').text("with shipping address");
                $('#buttonAddress').removeClass("btn-danger").addClass("btn-inverse2");
                this.model.RaiseBoxValidated();
            }
            else {
                $('#textAddress').text("incomplete shipping address");
                $('#buttonAddress').addClass("btn-danger").removeClass("btn-inverse2");
                this.model.RaiseBoxError();
            }	        
            this.AssignShipmentAddress();
            this.SwitchDisplay('page1', null);
        },

        buttonCancelRemoveItems_tap: function (e) {
            //'Shared.RemoveCheckedItems(this.GetCartCollection());
            this.RemoveCheckedItems(this.GetCartCollection());
        },

        buttonDeleteBox_tap: function (e) {
            this.RemoveItemsFromBox();
            this.trigger("deleteBox", this);
        },		

        buttonEditDetails_tap: function (e) {
            this.InitializeBoxDetails();
            this.UpdateBoxWeight();
            this.SwitchDisplay("page2", "BoxDetails");
        },

        buttonCounter_tap: function (e) {
            this.trigger("showItemsRemainingSection", this);
            this.trigger("updateItemsRemaining", this);
        },

        buttonGenerateLabel_tap: function (e) {		    
            this.trigger("generateLabel", this);		    
        },

        buttonRemoveItemFromCart_tap: function (e) {
            this.RemoveItemFromCart();
        },

        buttonRemoveItems_tap: function (e) {
            this.RemoveSelectedItems();
        },

        buttonScanItem_tap: function (e) {		    
            this.CheckItem();		    
        },

        linkCommercial_tap: function (e) {
            this.UpdateShipToAddressType($('#linkCommercial').text());
            this.$('#buttonAddressType').css('border-color', 'transparent');
        },

        linkResidential_tap: function (e) {
            this.UpdateShipToAddressType($('#linkResidential').text());
            this.$('#buttonAddressType').css('border-color', 'transparent');
        },

        rowBoxWeight_tap: function (e) {
            if (!this.HasTrackingNumber()) {
                this.NumericPadType = "boxweight";
                this.ShowNumericPad();
            }
        },

        rowCarrierCode_tap: function (e) {
            if (this.model.get('IsCustom') || !this.model.get('CarrierCode') || this.model.get('CarrierCode') == "") {
                this.$('#rowCarrierCode').addClass('highlight');
                this.SetCheckListNavTitle("carriers");
                this.SwitchDisplay('page3', null);
                this.LoadCheckListLookup(Enum.ListMode.Carriers);
            }
        },
        		
        rowPackagingType_tap: function (e) {
            if (!this.HasTrackingNumber()) {
                this.$('#rowPackagingType').addClass('highlight');
                this.SetCheckListNavTitle("packages");
                this.SwitchDisplay('page3', null);
                this.LoadCheckListLookup(Enum.ListMode.Boxes);
            }
        },

        rowQty_tap: function (e) {
            if (!this.HasTrackingNumber()) {
                this.NumericPadType = "quantity";
                this.ReplaceQuantity = true;
                this.ShowNumericPad();
            }
        },

        rowServiceType_tap: function (e) {
            if (this.model.get('IsCustom') || !this.model.get('ServiceCode') || this.model.get('ServiceCode') == "" || this.model.get('ServiceCode') == '(Unspecified)') {
                if (this.model.get('CarrierDescription') != "Manual") {
                    this.$('#rowServiceType').addClass('highlight');
                    this.SetCheckListNavTitle("service types");
                    this.SwitchDisplay('page3', null);
                    this.LoadCheckListLookup(Enum.ListMode.ServiceTypes);
                }
            }
        },

        rowUnitMeasure_tap: function (e) {
            this.$('#rowUnitMeasure').addClass('highlight');
            this.SetCheckListNavTitle('unit measures');
            this.SwitchDisplay('page3', null);
            this.LoadCheckListLookup(Enum.ListMode.UM);
        },

        rowWeightInPounds_tap: function (e) {
            if (!this.HasTrackingNumber()) {
                this.NumericPadType = "weightinlbs";
                this.ShowNumericPad();
            }
        },
        
        textCountry_tap: function (e) {
            this.trigger("loadCountryLookup", this);
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

        textFreightRate_tap: function (e) {
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
            this.trigger("loadPostalLookup", this);
        },

        textboxScanItem_keypress: function (e) {
            if (e.keyCode === 13) {
                this.CheckItem();
            }
        },

        //Copied from shared.js removed some codes
        RemoveCheckedItems: function (collection) {
            var TapeItemID = "TapeItemID";

            collection.each(function (item) {
                item.set({ IsChecked: false });
                $('#itemRow' + item.get(TapeItemID)).removeClass('icon-remove icon-1h');
                $('#itemRow' + item.get(TapeItemID)).text(item.get('RowNumber'));
                $('.' + item.get(TapeItemID) + '-itemcol-1').removeClass("background-danger");
                $('#slideFooterBox').removeClass("slideInUpFooter").addClass("slideOutDownFooter");
            });
        },

        AddItemToCart : function(itemFound) {
            if (itemFound) {
                if (this.HasRemainingItem(itemFound)) {

                    itemFound.set({
                        RowNumber: this.GetCartCollection().length + 1,
                        IsItemsRemaining: false
                    });
                    var availableQty =  itemFound.get('Quantity');
                    if (availableQty == undefined) availableQty = 0;
                    var newItem = this.ConvertToCartItemModel(this, itemFound, false);
   		           			        
                    Shared.BeepSuccess();
                    this.GetCartCollection().add(newItem);
                    this.RenderItem(this, newItem, false);

                    if (Preference.PackIsPromptForQty && availableQty > 1) {
                        this.ShowNumericPad();
                    }
                    else {
                        this.ChangeItemQuantity(newItem, 1, false);
                        if (this.ItemLookup != null) this.ItemLookup.SlideDownItemLookup();
                    }
			       
                } else {			        
                    Shared.NotifyError("There are no more remaining items for " + itemFound.get('ItemCode'));
                    Shared.BeepError();
                }
            }
            else {
                Shared.NotifyError("Item not found.");
                Shared.BeepError();
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

        AnimateBox: function (isAnimate) {
            this.Animate(isAnimate, "boxBody");
            this.$("#buttonCounter").prop("disabled", isAnimate);		    
            this.$("#boxPreferenceList").prop('aria-disabled', isAnimate);
            this.$("#buttonBackBox").prop("disabled", isAnimate);
            this.$("#textboxScanItem").prop("disabled", isAnimate);
            this.$("#buttonScanItem").prop('disabled', isAnimate);		    
        },

        AnimateItemSetting: function (isAnimate) {
            this.Animate(isAnimate, "itemSettingBody");
            this.$("#itemSettingList").prop('aria-disabled', isAnimate);
            this.$("#buttonRemove").prop('disabled', isAnimate);
        },

        AssignShipmentAddress: function () {
            this.model.set({
                ShipToCountry: $('#textCountry').val(),
                ShipToPostalCode: $('#textPostal').val(),
                ShipToCity: $('#textCity').val(),
                ShipToCounty: $('#textCounty').val(),
                ShipToState: $('#textState').val(),
                ShipToAddress: $('#textAreaAddress').val(),
                ShipToPlus4: $('#textPlus4').val(),
                ShipToPhone: $('#textPhone').val(),
                ShipToPhoneExtension: $('#textPhoneExtension').val(),
                ShipToAddressType: $('#textAddressType').text()
            });
        },

        ChangeItemQuantity: function (item, qty, isFromNumericKeypad) {
            var qtyToadd = 0;
            var maxQty = 0;
            var itemFound;
            // get already scanned qty from available items
            var qtyScanned = item.get('QuantityScanned');
            if (qtyScanned == undefined) qtyScanned = 0;
            var currentItemScanned = 0;
		  
            // delete old value for replace
            if (qtyScanned > 0 && this.ReplaceQuantity) {
                this.UpdateRemainingItemByUPC(item.get('ItemCode'), item.get('UnitMeasureCode'), qtyScanned * -1);
                //this.UpdateRemainingItemByUPC(item.get('ItemCode'), item.get('UnitMeasureCode'), qtyScanned * -1, item.get('LineNum'));
                this.UpdateCounter( qtyScanned * -1);
                this.UpdateTotalItems( qtyScanned * -1, 0);
                qtyScanned = 0;
            }
            this.ReplaceQuantity= false;
            
            // check available qunatity count
            if (item) {
                itemFound = Shared.FindItem(this.availableItems, item.get('ItemCode'), item.get('UnitMeasureCode'));
                //itemFound = Shared.FindItem(this.availableItems, item.get('ItemCode'), item.get('UnitMeasureCode'), item.get('LineNum'));
                if (itemFound != null) {
                    // get item to scan from available items
                    currentItemScanned = itemFound.get('QuantityScanned');
                    maxQty = itemFound.get('QuantityToScan');
                }
            }
            
            // check if max value;		    	    
            if (qty >= maxQty) qty = maxQty;

            // check if value is for NumPad
            if (isFromNumericKeypad) {
                item.set({
                    Quantity: qty + qtyScanned,
                    ShipQuantity: qty + qtyScanned,
                    QuantityInput: qty + qtyScanned,
                    QuantityScanned: qty + qtyScanned
                });
                // set quantity to be added to total and deducted to item counter
                qtyToadd = qty;
            }
            else {
                qtyToadd = 1;
                item.set({
                    Quantity: qtyScanned + qty,
                    ShipQuantity: qtyScanned + qty,
                    QuantityScanned: qtyScanned + qty,
                    QuantityInput: qty
                });
            }
		    
            this.currentItem = item;
            this.RenderCurrentItem(qtyScanned + qty, isFromNumericKeypad);
            //this.UpdateCounter(qtyToadd);
            this.UpdateTotalItems(qtyToadd, 0);
            
            // update available item quantity
            var  inputQty = qty + currentItemScanned;
            this.UpdateRemainingItemByUPC(item.get('ItemCode'), item.get('UnitMeasureCode'), inputQty);
            //this.UpdateRemainingItemByUPC(item.get('ItemCode'), item.get('UnitMeasureCode'), inputQty, item.get('LineNum'));
            this.UpdateCounter(qtyToadd);

        },

        CalculateItemsTotalWeight: function () {
            var totalWeight = 0;
            var self = this;

            this.GetCartCollection().each(function (item) {
                totalWeight += self.CalculateItemWeight(item);
            });

            return totalWeight;
        },

        CalculateItemWeight: function (item) {
            var qty = item.get('ShipQuantity');
            var weight = 0;

            if (Global.CurrentUser.UnitMeasureSystem == 'Metric') {
                weight = item.get('WeightInKilograms');
            } else {
                weight = item.get('WeightInPounds');
            }

            if (qty == null) qty = 0;
            if (weight == null) weight = 0;

            return qty * weight;
        },

        CheckItem : function() {
            var counter = this.model.get("Counter");
            var valueToCheck = this.$("#textboxScanItem").val();
            this.$("#textboxScanItem").val("");

            if (counter > 0) this.GetItemByUPC(valueToCheck);
            else {
                Shared.NotifyError("There are no more items.");
                Shared.BeepError();
            }
        },

        ConvertToCartItemModel: function (self, item, isRefresh) {
            var newItem = new CartItemModel();
            var packageType = this.model.get("PackageType");

            if (!isRefresh) item.set({ RowNumber: self.GetCartCollection().length + 1 });

            newItem.set({
                BarCode: item.get("BarCode"),
                BoxID: this.model.get('BoxID'),
                BoxNumber: this.model.get("BoxNumber"),
                CurrentWeightInPounds: item.get("WeightInPounds"),
                FreeStock: item.get("FreeStock"),
                ItemCode: item.get("ItemCode"),
                ItemDescription: item.get("ItemDescription"),
                ItemID: item.get("ItemID"),
                ItemName: item.get("ItemName"),
                IsOverSized: item.get("IsOverSized"),
                PackageType: packageType,
                ShipQuantity: item.get("ShipQuantity"),
                Quantity: item.get("Quantity"),
                RemainingItemID: item.get("RemainingItemID"),
                RowNumber: item.get("RowNumber"),
                TapeItemID: item.get("TapeItemID"),
                TotalWeightInPounds: item.get("WeightInPounds"),
                TransactionCode: item.get("TransactionCode"),
                UPCCode: item.get("UPCCode"),
                UnitMeasureCode: item.get("UnitMeasureCode"),
                WeightInPounds: item.get("WeightInPounds"),
                CartItemImage: item.get("CartItemImage"),
                WeightInKilograms: item.get("WeightInKilograms"),
                UnitMeasureSystem: Global.CurrentUser.UnitMeasureSystem,
                ShippingNotes:item.get("ShippingNotes")
                //LineNum: item.get("LineNum")		        
            })

            return newItem;
        },

        GetRemainingItems: function (collection) {

            var newCollection = new CartCollection();
		    
            collection.each(function (item) {
                if (!item.get('IsDeleted')) {
                    newCollection.add(item);
                }
            });

            return newCollection;
        },

        GetCartCollection: function () {
            return this.model.get("cartCollection");
        },
		
        GetItemByUPC: function (upcCode) {
            this.AnimateBox(true);
            var items = Shared.FindItems(this.availableItems, upcCode);
            if (Preference.EnableAdvancedFreightRateCalculation) this.FilterShippingMethod(items, true);
            this.AnimateBox(false);

            if (items && items.length > 0)
                if (items.length > 1) {
                    var remainingItems = this.GetRemainingItems(items);

                    if (remainingItems.length > 1) this.ShowItemLookup(remainingItems.models);
                    else this.UpdateCart(remainingItems.models[0]);
                }
                else this.UpdateCart(items.models[0]);
            else {
                Shared.NotifyError("Item not found.");
                Shared.BeepError();
            }
        },

        FilterShippingMethod: function(itemCollection, remove) {
            var self= this;
            var toRemove = [];
            var counter = 0;
            itemCollection.each(function(item) {
                var isDeleted = item.get('IsDeleted');
                if (isDeleted == null) isDeleted = false;
                if (item.get('ShippingMethodCode') == self.model.get('ShippingMethodCode') && isDeleted == false) {
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

        GetTotalWeight: function () {
            return this.CalculateItemsTotalWeight() + this.model.get('BoxWeight');
        },

        HasRemainingItem: function (item) {
            if (item) {
                var itemFound = Shared.FindItem(this.availableItems, item.get('ItemCode'), item.get('UnitMeasureCode'));

                if (itemFound != null) {
                    return !itemFound.get('IsDeleted');
                }
                else { return false; }		        
            }
        },

        HasTrackingNumber: function () {
            var trackingNumber = this.model.get('TrackingNumber');

            if (trackingNumber == null) trackingNumber = "";

            return (!(trackingNumber == "" || trackingNumber == "[To be generated]"));
        },

        HideButtons: function () {
            if (this.availableItems.length <= 0 && this.HasTrackingNumber()) {
                $('.dropdown-toggle').hide();
            } else $('.dropdown-toggle').show();

            if (this.HasTrackingNumber() || this.model.get('IsPrePack')) {
                $('#buttonDeleteBox').hide();
                $('#boxPreferenceList').css({ "min-width": "100px", "width": "100px" });
            }
            else $('#buttonDeleteBox').show();

            if (this.model.get('CarrierDescription') != "Manual") {
                $('#textboxScanItem').prop("disabled", this.HasTrackingNumber());
                $('#buttonScanItem').prop("disabled", this.HasTrackingNumber());
                //$('#buttonGenerateLabel').prop("disabled", this.HasTrackingNumber());

            }

            if (this.model.get('FilteredCounter') <= 0) {
                $('#buttonAddMoreBox').hide();
                $('#slideFooterBox .footerTotal').addClass('footerTotalNoBox');
                $('#boxPreferenceList').css({ "min-width": "100px", "width": "100px" });
            }
            else {
                $('#buttonAddMoreBox').show();
                $('#slideFooterBox .footerTotalNoBox').removeClass('footerTotalNoBox');
                $('#boxPreferenceList').css({ "min-width": "185px", "width": "185px" });
            }
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

        InitializeBoxDetails: function () {
            if (this.model.get('IsCustom') || !this.model.get('CarrierCode') || this.model.get('CarrierCode') == "") this.$('#iconCarrierCode').show();
            else this.$('#iconCarrierCode').hide();

            if (this.model.get('IsCustom') || !this.model.get('ServiceCode') || this.model.get('ServiceCode') == "" || this.model.get('ServiceCode') == '(Unspecified)') {
                if (this.model.get('CarrierDescription') != "Manual") this.$('#iconServiceType').show();
                else this.$('#iconServiceType').hide();
            }
            else this.$('#iconServiceType').hide();
            
            if (this.HasTrackingNumber()) {
                $('#textTrackingNumber').text(this.model.get('TrackingNumber'));
                $("#rowTrackingNumber").show();
                $("#iconPackagingType").hide();
            }
            else {
                $("#rowTrackingNumber").hide();
                $("#iconPackagingType").show();
            }

            if (this.model.get('CarrierDescription') == 'Manual') {
                this.$("#rowTrackingNumber").hide();
                this.$("#rowTrackingNumberManual").show();
                this.$("#rowFreightRate").show();
                this.$('#rowServiceType').hide();
                this.$('#textManualTrackingNumber').val(this.model.get("TrackingNumber"));
                this.$('#textFreightRate').val(this.model.get("FreightRate"));
                this.ValidateManualShippingInfo();
            }
            else {
                this.$('#rowServiceType').show();
                this.$("#rowTrackingNumberManual").hide();
                this.$("#rowFreightRate").hide();
            }

            var carrierCode = this.model.get('CarrierCode');
            var carrierDescription = this.model.get('CarrierDescription');
            var shippingMethodCode = this.model.get('ShippingMethodCode');
            var totalWeightInPounds = this.model.get('TotalWeightInPounds');
            var dimension = this.model.get('Dimension');
            var packagingType = this.model.get('PackagingCode');
            var serviceCode = this.model.get('ServiceCode');

            if (!carrierCode) carrierCode = "";
            if (!carrierDescription) carrierDescription = "";
            if (!shippingMethodCode) shippingMethodCode = "";
            if (!totalWeightInPounds) totalWeightInPounds = "";
            if (!dimension) dimension = "";
            if (!packagingType) packagingType = "";
            if (!serviceCode) serviceCode = "";
		    
            $('#textCarrierCode').text(carrierDescription);		    
            $('#textShippingMethodCode').text(shippingMethodCode);
            $('#textBoxWeight').text(totalWeightInPounds);
            $('#textDimension').text(dimension);
            $('#textPackagingType').text(packagingType);
            $('#textServiceType').text(serviceCode);

            if (this.model.get('IsPrePack')) {
                $('#textIsPrePack').text("Yes");
                $("#rowIsPrePack").show();
            }
            else {
                $("#rowIsPrePack").hide();
            }
        },

        InitializeChildViews: function () {
            this.HideButtons();

            this.GetCartCollection().off("itemRemoved", this.RemoveItemFromCart, this);
            this.GetCartCollection().on("itemRemoved", this.RemoveItemFromCart, this);
            //some events doesnt fire this rebinds the events
            this.delegateEvents();
            this.InitializeNumericPad();
            this.InitializeItemLookup();
            this.RenderCart();
            this.SetBoxNavTitle();		    
            if (this.ValidateShippingAddress()) {
                $('#textAddress').text("with shipping address");
                $('#buttonAddress').removeClass("btn-danger").addClass("btn-inverse2");		     
            }		    
            this.UpdateCounter(0, false);
            this.UpdateBoxWeight();
            this.WireEvents();
            this.model.off("boxDeleted", this.RemoveItemsFromBox, this);
            this.model.on("boxDeleted", this.RemoveItemsFromBox, this);
        },

        InitializeItemLookup: function () {
            var self = this;
            this.ItemLookup = new ItemLookupView();
            this.$('#itemLookupContainer').html(this.ItemLookup.render());
            this.ItemLookup.InitializeChildViews();
            this.ItemLookup.on("itemSelected", function (item) { self.UpdateCart(item); });
        },

        InitializeItemSetting: function () {
            $('#textItemCode').text(this.currentItem.model.get('ItemCode'));
            $('#textItemName').text(this.currentItem.model.get('ItemName'));
            // $('#textItemDesc').text(this.currentItem.model.get('ItemDescription'));	
            $('#textUPCCode').text(Shared.ConvertNullToEmptyString(this.currentItem.model.get('UPCCode')));	    
            // $('#textUPCCode').text(this.currentItem.model.get('UPCCode'));
            $('#textQuantity').text(this.currentItem.model.get('Quantity'));
            $('#textFreeStock').text(this.currentItem.model.get('FreeStock'));
            var shippingNotes = this.currentItem.model.get('ShippingNotes');
            var itemDescription = this.currentItem.model.get('ItemDescription');        
            if (shippingNotes) {
                $('#rowShippingNotes').show();
                // $('#textShippingNotes').text(shippingNotes);     
                 if (shippingNotes.length > 20) {
                       this.$('#rowShippingNotes').html("<a>Notes<br><span style='white-space:normal'>" + shippingNotes  + "</span></a>")
                   }
                   else {
                      this.$('#rowShippingNotes').html("<a><span class='pull-right'>" + shippingNotes  + "</span>Notes</a>")
                   }
            } 
            else $('#rowShippingNotes').hide();

           if (itemDescription.length > 20) {
                    this.$('#rowDesc').html("<a>Description<br><span style='white-space:normal'>" + itemDescription  + "</span></a>")
            }
            else {
                    this.$('#rowDesc').html("<a><span class='pull-right'>" + itemDescription  + "</span>Description</a>")
            }
    
            if (Global.CurrentUser.UnitMeasureSystem == 'Metric') {
                $('#textWeightInPounds').text(this.currentItem.model.get('WeightInKilograms'));
            } else {
                $('#textWeightInPounds').text(this.currentItem.model.get('WeightInPounds'));
            }
            $('#textUnitMeasureCode').text(this.currentItem.model.get('UnitMeasureCode'));

            if (this.HasTrackingNumber() || this.model.get('IsPrePack')) {
                $('#buttonRemove').hide();
            } else $('#buttonRemove').show();
        },

        InitializeNumericPad: function () {
            var self = this;
            var view = new NumericPadView();
            this.$('#numericPadContainer').html(view.render());

            var headerName = '#boxHeader';
            view.WireNumericPadEvents();		    
            view.off('closenumericpad', function (e) {
                $(headerName).show();
                self.ItemLookup.SlideDownItemLookup();
                switch (self.NumericPadType) {
                    case "quantity":
                        self.ChangeItemQuantity(self.currentItem.model, 1, true);
                        break;
                }
                Shared.Focus('#textboxScanItem');
            });
            view.on('closenumericpad', function (e) {
                $(headerName).show();
                self.ItemLookup.SlideDownItemLookup();
                switch (self.NumericPadType) {
                    case "quantity":
                        self.ChangeItemQuantity(self.currentItem.model, 1, true);
                        break;
                }
                Shared.Focus('#textboxScanItem');
            });
            view.off('quantitychange', function (numericPadCriteria) {
                switch (self.NumericPadType) {
                    case "quantity":
                        self.ChangeItemQuantity(self.currentItem.model, numericPadCriteria.NumericPadValue, true);
                        self.UpdateBoxWeight();
                        break;
                    case "freightrate":
                        self.$('#textFreightRate').val(numericPadCriteria.NumericPadValue);
                        break;
                    case "weightinlbs":
                        if (Global.CurrentUser.UnitMeasureSystem == 'Metric') {
                            self.currentItem.model.set({ WeightInKilograms: numericPadCriteria.NumericPadValue });
                        } else {
                            self.currentItem.model.set({ WeightInPounds: numericPadCriteria.NumericPadValue });
                        }
                        var tapeItemID = self.currentItem.model.get('TapeItemID');
                        var weight = $('#itemWeight' + tapeItemID);
                        if (weight.text() != numericPadCriteria.NumericPadValue) weight.text(numericPadCriteria.NumericPadValue);
                        var settingWeight = $('#textWeightInPounds');
                        if (settingWeight.text() != numericPadCriteria.NumericPadValue) settingWeight.text(numericPadCriteria.NumericPadValue);
                        self.UpdateBoxWeight();
                        self.NumericPadType = "quantity";
                        break;
                    case "boxweight":
                        var itemsWeight = self.CalculateItemsTotalWeight();
                        if (numericPadCriteria.NumericPadValue >= itemsWeight) {
                            self.model.set({ BoxWeight: numericPadCriteria.NumericPadValue - itemsWeight });
                            //self.NumericPadType == "quantity";
                            self.UpdateBoxWeight();
                        } else {
                            numericPadCriteria.IsCloseNumericPad = false;
                            navigator.notification.alert("Box weight must be higher than the total weight of items", null, "box", "OK");
                        }
                        //self.model.set({ BoxWeight: numericPadCriteria.NumericPadValue });
                        //self.NumericPadType == "quantity";
                        //self.UpdateBoxWeight();
                        self.NumericPadType = "quantity";
                        break;
                }
                $(headerName).show();
                self.ItemLookup.SlideDownItemLookup();
                view.SlideDownNumericPad();
                Shared.Focus('#textboxScanItem');
            });
            view.on('quantitychange', function (numericPadCriteria) {
                switch (self.NumericPadType) {
                    case "quantity":
                        self.ChangeItemQuantity(self.currentItem.model, numericPadCriteria.NumericPadValue, true);
                        self.UpdateBoxWeight();
                        break;
                    case "freightrate":
                        self.$('#textFreightRate').val(numericPadCriteria.NumericPadValue);
                        if (!self.$('#textFreightRate').val()) {
                            self.$('#textFreightRate').parent().css('color', '#d2322d');
                        } else {
                            self.$('#textFreightRate').parent().css('color', '#2c3e50');
                        }
                        break;
                    case "weightinlbs":
                        if (Global.CurrentUser.UnitMeasureSystem == 'Metric') {
                            self.currentItem.model.set({ WeightInKilograms: numericPadCriteria.NumericPadValue });
                        } else {
                            self.currentItem.model.set({ WeightInPounds: numericPadCriteria.NumericPadValue });
                        }
                        var tapeItemID = self.currentItem.model.get('TapeItemID');
                        var weight = $('#itemWeight' + tapeItemID);
                        if (weight.text() != numericPadCriteria.NumericPadValue) weight.text(numericPadCriteria.NumericPadValue);
                        var settingWeight = $('#textWeightInPounds');
                        if (settingWeight.text() != numericPadCriteria.NumericPadValue) settingWeight.text(numericPadCriteria.NumericPadValue);
                        self.UpdateBoxWeight();
                        self.NumericPadType = "quantity";
                        break;
                    case "boxweight":
                        var itemsWeight = self.CalculateItemsTotalWeight();
                        if (numericPadCriteria.NumericPadValue >= itemsWeight) {
                            self.model.set({ BoxWeight: numericPadCriteria.NumericPadValue - itemsWeight });
                            //self.NumericPadType == "quantity";
                            self.UpdateBoxWeight();
                        } else {
                            numericPadCriteria.IsCloseNumericPad = false;
                            navigator.notification.alert("Box weight must be higher than the total weight of items", null, "Box", "OK");
                        }
                        //self.model.set({ BoxWeight: numericPadCriteria.NumericPadValue });
                        //self.NumericPadType == "quantity";
                        //self.UpdateBoxWeight();
                        self.NumericPadType = "quantity";
                        break;
                }		        
                $(headerName).show();
                self.ItemLookup.SlideDownItemLookup();
                view.SlideDownNumericPad();
                Shared.Focus('#textboxScanItem');
            });
        },

        IsItemDeleted: function (itemToDelete) {
            var item = Shared.FindItem(this.availableItems, itemToDelete.get('ItemCode'), itemToDelete.get('UnitMeasureCode'));

            if (item) {
                if (item.get('IsDeleted')) return true;
            }
            else {
                return true;
            }

            return false;
        },

        LoadCheckListLookup: function (listMode) {
            var lookupModel = new LookupCriteriaModel();
            var self = this;		    
            var itemCode = "";

            if (this.currentItem != null && this.currentItem != "undefined") {
                itemCode = this.currentItem.get('ItemCode');
            }

            if (listMode != null) {
                switch (listMode) {
                    case Enum.ListMode.Boxes:
                        var isShowAllBoxes = false;
                        if (!this.model.get("CarrierCode") || this.model.get("CarrierCode") == "") isShowAllBoxes = true;

                        lookupModel.url = Global.ServiceUrl + Service.SOP + Method.CARRIERPACKAGINGLOOKUP;
                        lookupModel.set({
                            CarrierCode: this.model.get("CarrierCode"),
                            IsShowAllBoxes: isShowAllBoxes,
                            ShippingMethodCode: this.model.get("ShippingMethodCode"),
                            WarehouseCode: Preference.DefaultLocation
                        });
                        break;
                    case Enum.ListMode.Carriers:
                        lookupModel.url = Global.ServiceUrl + Service.CUSTOMER + Method.CARRIERLOOKUP + "30";
                        lookupModel.set({ WarehouseCode: Preference.DefaultLocation });
                        break;
                    case Enum.ListMode.ServiceTypes:
                        lookupModel.url = Global.ServiceUrl + Service.CUSTOMER + Method.SERVICETYPELOOKUP + "30";
                        if (this.model.get("CarrierDescription") == "Manual") lookupModel.set({ CarrierCode: this.model.get("DescriptionCarrierCode") });
                        else lookupModel.set({ CarrierCode: this.model.get("CarrierCode") });
                        lookupModel.set({ WarehouseCode: Preference.DefaultLocation });
                        break;
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
            this.SwitchDisplay('page2', "ItemSetting");
            this.ShowFreeStockItemSetting();            
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

        RenderCart: function () {
            this.$("#cartListBox tbody").html("");
			
            var self = this;
            var items = this.GetCartCollection(); 
            var rowNumber = 0;

            items.each(function (current) {
                rowNumber = rowNumber + 1;
                current.set({ RowNumber: rowNumber });
                self.RenderItem(self, current, true);
            });

            this.boxiScroll = Shared.LoadiScroll(this.boxiScroll, 'Box');
        },
        
        RenderCheckListLookup: function (list, listMode) {
            if (list != null) {
                var self = this;
                this.$('#cartCheckList tbody').html('');
                self.$('#serviceTypeCheckList').html('');
                self.$('#containerTableCheckList').show();
                self.$('#containerServiceTypeCheckList').hide();

                switch (listMode) {
                    case Enum.ListMode.Boxes:
                        if (list.Packages && list.Packages.length > 0) {
                            if (self.model.get('CarrierCode')) {
                                _.each(list.Packages, function (current) {
                                    var carrierDesc = current.CarrierDescription;
                                    if (!carrierDesc) carrierDesc = "&nbsp;";
                                    else carrierDesc = "Carrier: " + carrierDesc;

                                    var checkListItemModel = new CheckListItemModel();
                                    checkListItemModel.set({
                                        ListItemTitle: current.PackagingType,
                                        ListItemRow1: carrierDesc,
                                        ListItemRow2: "",
                                        CarrierDescription: current.CarrierDescription,
                                        CarrierCode: current.CarrierCode,
                                        PackagingType: current.PackagingType,
                                        ServiceType: current.ServiceType
                                    });

                                    var checklistItemView = new CheckListItemView({ model: checkListItemModel });
                                    self.$('#cartCheckList tbody').append(checklistItemView.render());

                                    if (self.model.get('PackagingCode') == checklistItemView.model.get('PackagingType')) {
                                        self.HighLightListItem(checklistItemView);
                                    }
                                    Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {
                                        self.HighLightListItem(checklistItemView);
                                        self.UpdatePackagingType(checklistItemView);
                                        self.SwitchDisplay('page2', "BoxDetails");
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
                                        var checkListItemModel = new CheckListItemModel();
                                        checkListItemModel.set({
                                            ListItemTitle: current.PackagingType,
                                            ListItemRow1: "&nbsp;",
                                            ListItemRow2: "",
                                            CarrierDescription: current.CarrierDescription,
                                            CarrierCode: current.CarrierCode,
                                            PackagingType: current.PackagingType,
                                            ServiceType: current.ServiceType
                                        });

                                        var checklistItemView = new CheckListItemView({ model: checkListItemModel });
                                        self.$('#' + current.CarrierDescription + 'Body').append(checklistItemView.render());
                                        $('.' + checklistItemView.cid).hide();
                                        $('.' + checklistItemView.cid + ' div ul').removeClass('listitem-1').addClass('listitem-2');

                                        Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {
                                            self.HighLightServiceType(checklistItemView);
                                            self.UpdatePackagingType(checklistItemView);
                                            self.SwitchDisplay('page2', "BoxDetails");
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

                                if (self.$('#textCarrierCode').text() == 'Manual') {
                                    if (checklistItemView.model.get('CarrierDescription') == 'Manual') self.HighLightListItem(checklistItemView);
                                }
                                else {
                                    if (self.model.get('CarrierCode') == checklistItemView.model.get('CarrierCode')) self.HighLightListItem(checklistItemView);
                                }
		                        
                                Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {
                                    self.HighLightListItem(checklistItemView);
                                    self.UpdateCarrier(checklistItemView);
                                    self.SwitchDisplay('page2', "BoxDetails");
                                });
                            });
                        }
                        this.iScrollCheckList = Shared.LoadiScroll(this.iScrollCheckList, "CheckList");
                        break;
                    case Enum.ListMode.ServiceTypes:
                        if (list.Packages && list.Packages.length > 0) {
                            if (self.model.get('CarrierCode')) {
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

                                        if (self.model.get('ServiceCode') == checklistItemView.model.get('ServiceType')) {
                                            self.HighLightListItem(checklistItemView);
                                        }
                                        Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {
                                            self.HighLightListItem(checklistItemView);
                                            self.UpdateServiceType(checklistItemView);
                                            self.SwitchDisplay('page2', "BoxDetails");
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
                                        var iconName =  current.CarrierDescription +'Icon';
                                        self.$('#serviceTypeCheckList').append(checkListGroupView.render());
		                                
                                        Shared.AddRemoveHandler(tableName + ' thead', 'tap', function (e) {
                                            self.ShowServiceTypeRows(tableName, iconName);
                                        });
                                    });
                                }
                                if (list.Packages && list.Packages.length > 0) {
                                    _.each(list.Packages, function (current) {
                                        if (current.ServiceType != '(Unspecified)') {
                                            var serviceType = current.ServiceType;
                                            if (!serviceType) serviceType = "";
                                            var checkListItemModel = new CheckListItemModel();
                                            checkListItemModel.set({
                                                ListItemTitle: current.ServiceType,
                                                ListItemRow1: "&nbsp;",
                                                ListItemRow2: "",
                                                CarrierDescription: current.CarrierDescription,
                                                CarrierCode: current.CarrierCode,
                                                ServiceType: serviceType
                                            });

                                            var checklistItemView = new CheckListItemView({ model: checkListItemModel });
                                            self.$('#' + current.CarrierDescription + 'Body').append(checklistItemView.render());
                                            $('.' + checklistItemView.cid).hide();
                                            $('.' + checklistItemView.cid + ' div ul').removeClass('listitem-1').addClass('listitem-2');

                                            Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {
                                                self.HighLightServiceType(checklistItemView);
                                                self.UpdateServiceType(checklistItemView);
                                                self.SwitchDisplay('page2', "BoxDetails");
                                            });
                                        }
                                    });
                                }
                                this.iScrollServiceType = self.LoadiScrollServiceType(this.iScrollServiceType);
                            }
                        }
                        break;
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
                        this.iScrollCheckList = Shared.LoadiScroll(this.iScrollCheckList, "CheckList");
                        break;
                }		        
            }
        },

        LoadiScrollServiceType: function (myScroll){
            if (myScroll) {
                myScroll.refresh();
                return myScroll;
            }
            else {
                return new IScroll('#containerServiceTypeCheckList', { scrollY: true, scrollbars: true, });
            }
        },

        RenderItem: function (self, item) {		   	    		    		    
            var cartItemView = new CartItemView({ model: item });
            this.$("#cartListBox tbody").append(cartItemView.render());

            if (!this.HasTrackingNumber() || !self.model.get('IsPrePack')) {
                Shared.AddRemoveHandler('.' + cartItemView.model.get('TapeItemID') + "-itemcol-1", 'tap', function () {
                    var allowDelete = !self.model.get('IsPrePack');
                    if (allowDelete) allowDelete = !self.HasTrackingNumber();
                    if (allowDelete) {
                        Shared.ToggleItemCheck(cartItemView.model);
                        Shared.ShowRemoveFooter(self.GetCartCollection(), "slideFooterBox");
                    }
                });
            }
            Shared.AddRemoveHandler('.' + cartItemView.model.get('TapeItemID') + "-itemcol-2", 'tap', function () { self.LoadItemSetting(cartItemView) });
            Shared.AddRemoveHandler('.' + cartItemView.model.get('TapeItemID') + "-itemcol-3", 'tap', function () { self.LoadItemSetting(cartItemView) });
            Shared.AddRemoveHandler('.' + cartItemView.model.get('TapeItemID') + "-itemcol-4", 'tap', function () { self.LoadItemSetting(cartItemView) });
                       
            self.currentItem = cartItemView;
        },
			
        RenderCurrentItem: function (inputQty, isFromNumericKeypad) {
            if (qty == undefined) qty = 0;

            var self = this;
            if (self.currentItem == undefined) return;
            if (!self.currentItem instanceof Backbone.Model) return;
            var cartItemView = self.currentItem;

            var newQty = cartItemView.get('Quantity');
            var newWeight = 0;
            if (Global.CurrentUser.UnitMeasureSystem == 'Metric') {
                newWeight = cartItemView.get('WeightInKilograms');
            } else {
                newWeight = cartItemView.get('WeightInKilograms');
            }
            //newWeight = newWeight.toFixed(2);
            var newUM = cartItemView.get('UnitMeasureCode');
            
            //get cart item id's
            var tapeItemID = cartItemView.get('TapeItemID');
            var remItemID = cartItemView.get('RemainingItemID');
            var qty = $('#itemQty' + tapeItemID);
            var weight = $('#itemWeight' + tapeItemID);

            var settingUM = $('#textUnitMeasureCode');
            var settingWeight = $('#textWeightInPounds');
            var settingQty = $('#textQuantity');

            qty.text(newQty);
            //self.UpdateRemainingItemByUPC(cartItemView.model.get('ItemCode'), newUM, inputQty, isFromNumericKeypad);
            settingQty.text(newQty);

            if (weight.text() != newWeight) weight.text(newWeight);
            if (settingUM.text() != newUM) settingUM.text(newUM);
            if (settingWeight.text() != newWeight) settingWeight.text(newWeight);

        },

        RemoveItemsFromBox: function () {
            var self = this;
            var items = this.GetCartCollection();

            if (items && items.models.length > 0) {
                items.each(function (item) {
                    //self.GetCartCollection().remove(item);
                    self.UpdateRemainingItemByUPC(item.get('ItemCode'), item.get('UnitMeasureCode'), item.get('QuantityScanned') * -1);
                    //self.UpdateRemainingItemByUPC(item.get('ItemCode'), item.get('UnitMeasureCode'), item.get('QuantityScanned') * -1, item.get('LineNum'));
                    self.UpdateCounter(item.get('QuantityScanned') * -1);
                });
            }
        },

        RemoveItemFromCart: function () {
            var self = this;
            navigator.notification.confirm("Are you sure you want to remove this item?", function (button) {
                if (button == 1) {
                    if (self.currentItem != null) {
                        var itemCode = self.currentItem.model.get('ItemCode');
                        var unitMeasureCode = self.currentItem.model.get('UnitMeasureCode');
                        var tapeItemID = self.currentItem.model.get('TapeItemID');
                        var model = Shared.FindItem(self.GetCartCollection(), itemCode, unitMeasureCode);
                        //var lineNum = self.currentItem.model.get('LineNum');
                        //var model = Shared.FindItem(self.GetCartCollection(), itemCode, unitMeasureCode, lineNum);

                        self.GetCartCollection().remove(model);
                        self.AddCartItemToAvailableItems(model);

                        var qtyScanned = self.currentItem.model.get('ShipQuantity');

                        self.UpdateCounter(model.get('ShipQuantity') * -1);
                        self.UpdateTotalItems(model.get('ShipQuantity') * -1, (model.get('WeightInPounds') * qtyScanned));
                        
                        model.set({
                            QuantityToScan: self.currentItem.model.get('ShipQuantity'),
                            Quantity: self.currentItem.model.get('ShipQuantity'),
                            ShipQuantity: 0,
                            CurrentWeightInPounds: (self.currentItem.model.get('CurrentWeightInPounds') * qtyScanned) * -1,
                            QuantityInput: 0,
                            QuantityScanned: 0
                        });
                        self.UpdateRemainingItemByUPC(itemCode, unitMeasureCode, qtyScanned * -1);
                        //self.UpdateRemainingItemByUPC(itemCode, unitMeasureCode, qtyScanned * -1, lineNum);

                        self.$('#' + model.get('RemainingItemID')).parent().show();

                        self.currentItem.remove();
                        $("#" + tapeItemID).parent().remove();

                        self.RefreshRowNumber(self.GetCartCollection());
                        self.boxiScroll = Shared.LoadiScroll(self.boxiScroll, 'Box');
                        self.SwitchDisplay('page1', null);
                    }
                }
            }, "Remove from cart.", "Yes,No");
        },

        AddCartItemToAvailableItems: function(item){
            if (item == null) return;
            if (this.availableItems== undefined) 
                this.availableItems = new CartCollection();
            var itemFound = Shared.FindItem(this.availableItems, item.get('ItemCode'), item.get('UnitMeasureCode'));
            //var itemFound = Shared.FindItem(this.availableItems, item.get('ItemCode'), item.get('UnitMeasureCode'), item.get('LineNum'));
            if (itemFound == null) {
                var cartItem = this.ConvertToCartItemModel(this, item, true);
                cartItem.set({
                    QuantityToScan: item.get('QuantityToScan'),
                    QuantityScanned: item.get('QuantityScanned'),
                });
                this.availableItems.add(cartItem)
            }
        },
	
        RemoveSelectedItems: function () {
            var self = this;
            navigator.notification.confirm("Are you sure you want to remove these item/s?", function (button) {
                if (button == 1) {
                    var itemsToDelete = new CartCollection();

                    _.each(self.GetCartCollection().models, function (current) {
                        if (current.get("IsChecked")) {
                            itemsToDelete.add(current);
                            self.AddCartItemToAvailableItems(current);
                        }
                    });

                    while (itemsToDelete.models.length > 0) {
                        self.GetCartCollection().remove(itemsToDelete.models[0]);

                        var qtyScanned = itemsToDelete.models[0].get('ShipQuantity');

                        $('#' + itemsToDelete.models[0].get('RemainingItemID')).parent().show();
                        
                        //self.UpdateCounter(itemsToDelete.models[0].get('ShipQuantity') * -1);
                        if (Global.CurrentUser.UnitMeasureSystem = 'Metric') {
                            self.UpdateTotalItems(itemsToDelete.models[0].get('ShipQuantity') * -1, (itemsToDelete.models[0].get('WeightInKilograms') * qtyScanned));
                        } else {
                            self.UpdateTotalItems(itemsToDelete.models[0].get('ShipQuantity') * -1, (itemsToDelete.models[0].get('WeightInPounds') * qtyScanned));
                        }

                        itemsToDelete.models[0].set({
                            QuantityToScan: itemsToDelete.models[0].get('ShipQuantity'),
                            Quantity: itemsToDelete.models[0].get('ShipQuantity'),
                            ShipQuantity: 0,
                            CurrentWeightInPounds: (itemsToDelete.models[0].get('CurrentWeightInPounds') * qtyScanned) * -1,
                            QuantityInput: 0,
                            QuantityScanned: 0
                        });
                        self.UpdateRemainingItemByUPC(itemsToDelete.models[0].get('ItemCode'), itemsToDelete.models[0].get('UnitMeasureCode'), (qtyScanned * -1));
                        //self.UpdateRemainingItemByUPC(itemsToDelete.models[0].get('ItemCode'), itemsToDelete.models[0].get('UnitMeasureCode'), (qtyScanned * -1), itemsToDelete.models[0].get('LineNum'));
                        self.UpdateCounter(qtyScanned * -1);
                        $("#" + itemsToDelete.models[0].get('TapeItemID')).parent().remove();

                        itemsToDelete.remove(itemsToDelete.models[0]);
                    }

                    self.RefreshRowNumber(self.GetCartCollection());
                    self.boxiScroll = Shared.LoadiScroll(self.boxiScroll, 'Box');
                    $('#slideFooterBox').removeClass("slideInUpFooter").addClass("slideOutDownFooter");
                }
            });
        },
		
        SetBoxNavTitle: function () {
            $('#boxNavTitle').text(this.model.get('PackagingCode'));
        },

        SetCheckListNavTitle: function (title) {
            $("#checkListNavTitle").text(title);
        },

        SetControlsToReadOnly: function (flag) {
            this.$("#textAddressName").prop("disabled", flag);
            this.$("#textCountry").prop("disabled", flag);
            this.$("#textPostal").prop("disabled", flag);
            this.$("#textPlus4").prop('disabled', flag);
            this.$("#textAreaAddress").prop("disabled", flag);
            this.$("#textCity").prop("disabled", flag);
            this.$("#textState").prop("disabled", flag);
            this.$("#textCounty").prop('disabled', flag);
            this.$("#buttonAddressType").prop('disabled', flag);
            this.$("#textPhone").prop("disabled", flag);
            this.$("#textExt").prop('disabled', flag);
		    
        },

        SetNumericPadTitle: function (numericPadType) {
            switch (numericPadType) {
                case "boxweight":
                    $('#numericPadNavTitle').text("enter box weight");
                    break;
                case "freightrate":
                    $('#numericPadNavTitle').text("enter freight rate");
                    break;
                case "quantity":
                    $('#numericPadNavTitle').text("enter quantity");
                    break;
                case "weightinlbs":
                    $('#numericPadNavTitle').text("enter item weight");
                    break;
            }
        },

        ShowBoxDetailsSection: function () {
            this.$('#boxDetailsSection').removeClass('section-close');
            this.$('#itemSettingSection').addClass('section-close');
            this.$('#shippingAddressSection').addClass('section-close');
        },

        ShowFreeStockItemSetting: function () {		    
            if (Preference.PackIsShowQtyOnHand) $('#rowFreeStock').show();
            else $('#rowFreeStock').hide();
        },

        ShowItemSettingSection: function () {
            this.$('#itemSettingSection').removeClass('section-close');
            this.$('#boxDetailsSection').addClass('section-close');
            this.$('#shippingAddressSection').addClass('section-close');
        },

        ShowNumericPad: function () {
            this.SetNumericPadTitle(this.NumericPadType);

            switch (this.NumericPadType) {
                case "boxweight":
                    var numVal = this.model.get('BoxWeight');

                    if (numVal) $('#textboxQuantity').val(numVal);
                    else $('#textboxQuantity').val(1);
                    break;
                case "freightrate":
                    var numVal = this.model.get('FreightRate');

                    if (numVal) $('#textboxQuantity').val(numVal);
                    else $('#textboxQuantity').val(0);
                    break;
                default:
                    $('#textboxQuantity').val(1);
                    break;
            }

            this.$('#textboxScanItem').blur();
            $('#boxHeader').hide();		    
            $('.numericpad').addClass('slideInUp').removeClass('slideOutDown');
        },

   ShowItemLookup: function (items) {
                if (items) {
                    this.ItemLookup.RenderItems(items);
                    $('#boxHeader').hide();
                    $('#itemLookupSection').addClass('slideInUp').removeClass('slideOutDown');
                }
            },

    ShowPackSection: function () {
        this.UpdateTotalWeight();
        this.trigger("showPackSection", this);
    },

    ShowServiceTypeRows: function (tableName, iconName) {
        $(tableName + ' tbody tr td').toggle();
        if ($('#' + iconName).hasClass('icon-rotate-180')) $('#' + iconName).removeClass('icon-rotate-180').addClass('icon-rotate-0')
        else $('#' + iconName).addClass('icon-rotate-180').removeClass('icon-rotate-0')

        this.iScrollServiceType = this.LoadiScrollServiceType(this.iScrollServiceType);
    },

    ShowShippingAddressSection: function () {

        if (this.HasTrackingNumber()) this.SetControlsToReadOnly(true);
        else this.SetControlsToReadOnly(false);

        this.$('#shippingAddressSection').removeClass('section-close');
        this.$('#itemSettingSection').addClass('section-close');
        this.$('#boxDetailsSection').addClass('section-close');
    },

    SwitchDisplay: function (page, sectionType) {
        if (this.isAnimate) return false;

        switch (page) {
            case "page1":		            
                this.$('.slider').css("transform", "translateX(" + 0 + "px)");
                Shared.Focus('#textboxScanItem');
                break;
            case "page2":
                this.$('#textboxScanItem').blur();
                switch (sectionType) {
                    case "BoxDetails":
                        CheckListMode = "boxDetails";
                        this.ShowBoxDetailsSection();
                        break;
                    case "ItemSetting":
                        CheckListMode = "itemSetting";
                        this.ShowItemSettingSection();
                        break;
                    case "ShippingAddress":
                        this.ShowShippingAddressSection();
                        break;
                }
                $('li').removeClass('highlight');
                this.$('.slider').css("transform", "translateX(" + Global.ScreenWidth * -1 + "px)");		            
                break;
            case "page3":
                this.$('.slider').css("transform", "translateX(" + Global.ScreenWidth * -2 + "px)");
                break;
        }
    },
        
    UpdateBoxWeight: function () {
        this.model.set({ TotalWeightInPounds: this.GetTotalWeight() });
        $('#textBoxWeight').text(this.model.get('TotalWeightInPounds'));
        $('#textBoxTotalWeight').text(this.model.get('TotalWeightInPounds'));
    },

    UpdateCarrier: function (itemModel) {
        if (itemModel.model.get('CarrierDescription') == "Manual") {
            this.$("#rowTrackingNumberManual").show();
            this.$("#rowFreightRate").show();
            this.$('#rowServiceType').hide();
            this.$('#textTrackingNumber').val(this.model.get("TrackingNumber"));
            this.$('#textFreightRate').val(this.model.get("FreightRate"));
            this.ValidateManualShippingInfo();
        }
        else {
            this.$("#rowTrackingNumberManual").hide();
            this.$("#rowFreightRate").hide();
            this.$('#rowServiceType').show();
        } 

        this.model.set({
            CarrierCode: itemModel.model.get('CarrierCode'),
            CarrierDescription: itemModel.model.get('CarrierDescription'),
            ServiceCode: itemModel.model.get('ServiceType')
        });

        var serviceType = this.model.get('ServiceCode')
        if (!serviceType) serviceType = "";

        this.$('#textCarrierCode').text(this.model.get('CarrierDescription'));
        this.$('#textServiceType').text(serviceType);
    },

    UpdateCart: function (item) {
        if (item) {
            var upcCode = "";
            var itemCode = "";
            var unitMeasureCode = "";
            //var lineNum = "";

            if (item instanceof Backbone.Model) {
                itemCode = item.get('ItemCode');
                upcCode = item.get('UPCCode');
                if (!upcCode) upcCode = item.get('ItemCode');
                unitMeasureCode = item.get('UnitMeasureCode');
                //lineNum = item.get('LineNum');
            } else {
                itemCode = item.ItemCode;
                upcCode = item.UPCCode;
                if (!upcCode) upcCode = item.ItemCode;
                unitMeasureCode = item.UnitMeasureCode;
                //lineNum = item.LineNum;
            }
            var existingItem = Shared.FindItem(this.GetCartCollection(), itemCode, unitMeasureCode);
            //var existingItem = Shared.FindItem(this.GetCartCollection(), upcCode, unitMeasureCode, lineNum);
            this.ReplaceQuantity = false;
            if (existingItem) {				    
                if (this.HasRemainingItem(existingItem)) {
                    this.UpdateCartItem(existingItem.get('UPCCode'), existingItem);
                } else {				        
                    this.AddItemToCart(existingItem);
                }
            }
            else {
                this.AddItemToCart(item);
                this.boxiScroll = Shared.LoadiScroll(this.boxiScroll, 'Box');
            }
            this.UpdateBoxWeight();
        }
    },

    UpdateCartItem: function (valueToCheck, item) {
        if (item) this.UpdateItemQuantity(item);
        else navigator.notification.alert("There's no more item '" + valueToCheck + "' to pack.", null, "Pack", "OK");
    },

    UpdateCounter: function (qty, callPackUpdate) {
        if (qty == null) qty = 0;
        var counter = this.model.get('Counter');
        var filterCounter = this.FilterShippingMethod(this.availableItems);//this.model.get('FilteredCounter');
        //if (item) this.model.set({ Counter: counter - item.get('ShipQuantity') });
        this.model.set({ Counter: counter - qty, FilteredCounter: filterCounter });

        $('#textCounter').text(this.model.get('FilteredCounter'));
        if (this.model.get('FilteredCounter') == 0) {
            $("#buttonCounterShip").removeClass('btn-danger').addClass('btn-nephritis');
            $("#buttonCounter").removeClass('btn-danger').addClass('btn-nephritis');
            this.HideButtons();
        } else {
            $("#buttonCounterShip").removeClass('btn-nephritis').addClass('btn-danger');
            $("#buttonCounter").removeClass('btn-nephritis').addClass('btn-danger');
        }
        $('#textCounterShip').text(this.model.get('FilteredCounter'));

        if (callPackUpdate != false) this.trigger("updateCounter", qty);
    },
		
    UpdateCountry: function (itemModel) {
        this.model.set({ ShipToCountry: itemModel.CountryCode });

        $('#textCountry').val(itemModel.CountryCode);
    },

    UpdateItemQuantity: function (item) {
        Shared.BeepSuccess();
        if (Preference.PackIsPromptForQty) {
            this.currentItem = new CartItemView({ model: item });
            this.ShowNumericPad(this.currentItem.model);
        }
        else {
            this.ChangeItemQuantity(item, 1, false);
            this.ItemLookup.SlideDownItemLookup();
        }
    },

    UpdateItemSetting: function (itemView, listMode) {
        switch (listMode) {
            case Enum.ListMode.UM:
                this.currentItem.model.set({ UnitMeasureCode: itemView.model.get('UnitMeasureCode') });
                break;
        }
        this.HighLightListItem(itemView);
    },

    UpdateManualBoxInfo: function () {
        var textManualTrackingNumber = this.$('#textManualTrackingNumber').val();
        var textFreightRate = this.$('#textFreightRate').val();

        this.model.set({
            TrackingNumber: textManualTrackingNumber,
            FreightRate: textFreightRate
        });
    },

    UpdatePackagingType: function (itemModel) {
        if (itemModel.model.get('CarrierCode')) {
            this.model.set({
                CarrierCode: itemModel.model.get('CarrierCode'),
                CarrierDescription: itemModel.model.get('CarrierDescription')
            });
        }

        this.model.set({ PackagingCode: itemModel.model.get('PackagingType') });

        var carrierDesc = this.model.get('CarrierDescription');
        var packagingType = this.model.get('PackagingCode');

        if (!carrierDesc) carrierDesc = "";
        if (!packagingType) packagingType = "";

        $('#textPackagingCode' + this.model.get('BoxID')).text(this.model.get('PackagingCode'));
        this.$('#textCarrierCode').text(carrierDesc);
        this.$('#textPackagingType').text(packagingType);
        this.SetBoxNavTitle();
    },

    UpdatePostal: function (itemModel) {
        this.model.set({
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

    UpdateRemainingItemByUPC: function (itemCode, unitMeasureCode, qty, lineNum) {
        if (this.availableItems && this.availableItems.models.length > 0) {
            this.availableItems.each(function (item) {
                if (item.get('ItemCode') && item.get('UnitMeasureCode')) {
                    if (lineNum != null) {
                        if (item.get('ItemCode').toLowerCase() == itemCode.toLowerCase()
                            && item.get('UnitMeasureCode').toLowerCase() == unitMeasureCode.toLowerCase() && lineNum == item.get('LineNum')) {
                            if (qty == undefined) qty = 1;
                            var IsDelete = qty < 0;
                            var scannedQty = 0;
                            var prevScannedQty = item.get('QuantityScanned');
                            var quantityToScan = (item.get('QuantityToScan') + item.get('QuantityScanned'));
                            var remainingQty = item.get('QuantityToScan');

                            if (IsDelete) { scannedQty = prevScannedQty + qty; }
                            else {scannedQty = qty;}

                            remainingQty = quantityToScan - scannedQty;

                            item.set({
                                Quantity: remainingQty,
                                QuantityScanned: scannedQty,
                                QuantityToScan: remainingQty
                            })

                            $('#itemQty' + item.get('RemainingItemID')).text(remainingQty);

                            if (item.get('Quantity') <= 0) {
                                item.set({ IsDeleted: true});
                                $('#' + item.get('RemainingItemID')).parent().hide();
                            } else {
                                item.set({ IsDeleted: false });
                                $('#' + item.get('RemainingItemID')).parent().show();
                            }
                        }
                    } else {
                        if (item.get('ItemCode').toLowerCase() == itemCode.toLowerCase()
                            && item.get('UnitMeasureCode').toLowerCase() == unitMeasureCode.toLowerCase()) {
                            if (qty == undefined) qty = 1;
                            var IsDelete = qty < 0;
                            var scannedQty = 0;
                            var prevScannedQty = item.get('QuantityScanned');
                            var quantityToScan = (item.get('QuantityToScan') + item.get('QuantityScanned'));
                            var remainingQty = item.get('QuantityToScan');

                            if (IsDelete) { scannedQty = prevScannedQty + qty; }
                            else {scannedQty = qty;}

                            remainingQty = quantityToScan - scannedQty;

                            item.set({
                                Quantity: remainingQty,
                                QuantityScanned: scannedQty,
                                QuantityToScan: remainingQty
                            })

                            $('#itemQty' + item.get('RemainingItemID')).text(remainingQty);

                            if (item.get('Quantity') <= 0) {
                                item.set({ IsDeleted: true});
                                $('#' + item.get('RemainingItemID')).parent().hide();
                            } else {
                                item.set({ IsDeleted: false });
                                $('#' + item.get('RemainingItemID')).parent().show();
                            }
                        }
                    }
                }
            });
        }
    },

    UpdateServiceType: function (itemModel) {
        if (itemModel.model.get('CarrierDescription') == "Manual") this.model.set({ ServiceCode: null });
        else {
            this.model.set({
                CarrierCode: itemModel.model.get('CarrierCode'),
                CarrierDescription: itemModel.model.get('CarrierDescription'),
                ServiceCode: itemModel.model.get('ServiceType')
            });
            this.$('#textCarrierCode').text(this.model.get('CarrierDescription'));
            this.$('#textServiceType').text(this.model.get('ServiceCode'));
        }  
    },

    UpdateShipToAddressType: function (addressType) {
        this.model.set({ ShipToAddressType: addressType });
        $('#textAddressType').text(addressType);
    },        

    UpdateTotalItems: function (qty, weight) {
        var total = this.model.get('TotalItems');
        var totalWeight = this.model.get('TotalWeightInPounds');

        this.model.set({
            TotalItems: total + qty,
            TotalWeightInPounds: totalWeight - weight
        });

        $('#textBoxTotalWeight').text(this.model.get('TotalWeightInPounds'));
        $('#textBoxTotalItems').text(this.model.get('TotalItems'));
        $('#textBoxTotalQuantity' + this.model.get('BoxID')).text(this.model.get('TotalItems'));		    
        this.HideButtons();
        //this.trigger("updateTotalItems", item);
    },

    UpdateTotalWeight: function () {
        this.model.set({ TotalWeightInPounds: this.GetTotalWeight() });
        $('#textBoxTotalWeight' + this.model.get('BoxID')).text(this.model.get('TotalWeightInPounds'));
    },

    ValidateManualShippingInfo: function () {
        var result = true;

        if (!this.model.get('TrackingNumber') || this.model.get('TrackingNumber') == "" || this.model.get('TrackingNumber') == null) {
            $('#textManualTrackingNumber').parent().css('color', '#d2322d');
            result = false;
        }
        else {
            $('#textManualTrackingNumber').parent().css('color', '#2c3e50');
        }

        if (!this.model.get('FreightRate') || this.model.get('FreightRate') == "" || this.model.get('FreightRate') == 0) {
            $('#textFreightRate').parent().css('color', '#d2322d');
            result = false;
        }
        else {
            $('#textFreightRate').parent().css('color', '#2c3e50');
        }

        return result;
    },

    ValidateShippingAddress: function () {
		    
        if (!$('#textCountry').val()) {
            $('#textCountry').parent().addClass('has-error');
            return false;
        } else {
            $('#textCountry').parent().removeClass('has-error');
        }

        if (!$('#textPostal').val()) {
            $('#textPostal').parent().addClass('has-error');
            return false;
        } else {
            $('#textPostal').parent().removeClass('has-error');
        }

        if (!$('#textCity').val()) {
            $('#textCity').parent().addClass('has-error');
            return false;
        } else {
            $('#textCity').parent().removeClass('has-error');
        }

        //if (!$('#textCounty').val()) {
        //    $('#textCounty').parent().addClass('has-error');
        //    return false;
        //} else {
        //    $('#textCounty').parent().removeClass('has-error');
        //}

        if (!$('#textState').val()) {
            $('#textState').parent().addClass('has-error');
            return false;
        } else {
            $('#textState').parent().removeClass('has-error');
        }

        if (!$('#textAreaAddress').val()) {
            $('#textAreaAddress').parent().addClass('has-error');
            return false;
        } else {
            $('#textAreaAddress').parent().removeClass('has-error');
        }

        if (!$('#textPhone').val()) {
            $('#textPhone').parent().addClass('has-error');
            return false;
        } else {
            $('#textPhone').parent().removeClass('has-error');
        }

        if (!$('#textAddressType').text()) {
            $('#buttonAddressType').css('border-color', '#d2322d');
            return false;
        } else {
            $('#buttonAddressType').css('border-color', 'transparent');
        }
		    
        return true;
    },

    WireEvents: function () {
        var self = this;
		    
        Shared.AddRemoveHandler('#buttonAddress', 'tap', function (e) { self.buttonAddress_tap(e); });
        Shared.AddRemoveHandler('#buttonAddMoreBox', 'tap', function (e) { self.buttonAddMoreBox_tap(e); });
        Shared.AddRemoveHandler('#buttonBackBox', 'tap', function (e) { self.ShowPackSection(e); });
        Shared.AddRemoveHandler('#buttonBackBoxDetails', 'tap', function (e) { self.buttonBackBoxDetails_tap(e); });
        Shared.AddRemoveHandler('#buttonBackCheckList', 'tap', function (e) { self.buttonBackCheckList_tap(e); });
        Shared.AddRemoveHandler('#buttonBackItemSetting', 'tap', function (e) { self.buttonBackItemSetting_tap(e); });
        Shared.AddRemoveHandler('#buttonBackShippingAddress', 'tap', function (e) { self.buttonBackShippingAddress_tap(e); });
        Shared.AddRemoveHandler('#buttonCancelRemoveItemsBox', 'tap', function (e) { self.buttonCancelRemoveItems_tap(e); });
        Shared.AddRemoveHandler('#buttonCounter', 'tap', function (e) { self.buttonCounter_tap(e); });
        Shared.AddRemoveHandler('#buttonDeleteBox', 'tap', function (e) { self.buttonDeleteBox_tap(e); });
        Shared.AddRemoveHandler('#buttonEditDetails', 'tap', function (e) { self.buttonEditDetails_tap(e); });
        Shared.AddRemoveHandler('#buttonGenerateLabel', 'tap', function (e) { self.buttonGenerateLabel_tap(e); });
        Shared.AddRemoveHandler('#buttonRemove', 'tap', function (e) { self.buttonRemoveItemFromCart_tap(e); });
        Shared.AddRemoveHandler('#buttonRemoveItems', 'tap', function (e) { self.buttonRemoveItems_tap(e); });
        Shared.AddRemoveHandler('#buttonScanItem', 'tap', function (e) { self.buttonScanItem_tap(e); });

        Shared.AddRemoveHandler('#linkCommercial', 'tap', function (e) { self.linkCommercial_tap(e); });
        Shared.AddRemoveHandler('#linkResidential', 'tap', function (e) { self.linkResidential_tap(e); });

        Shared.AddRemoveHandler('#rowBoxWeight', 'tap', function (e) { self.rowBoxWeight_tap(e); });
        Shared.AddRemoveHandler('#rowCarrierCode', 'tap', function (e) { self.rowCarrierCode_tap(e); })
        if (self.HasTrackingNumber() || !self.model.get('IsPrePack'))
            Shared.AddRemoveHandler('#rowQty', 'tap', function (e) { self.rowQty_tap(e); });
        Shared.AddRemoveHandler('#rowPackagingType', 'tap', function (e) { self.rowPackagingType_tap(e); });
        Shared.AddRemoveHandler('#rowServiceType', 'tap', function (e) { self.rowServiceType_tap(e); })
        Shared.AddRemoveHandler('#rowWeightInPounds', 'tap', function (e) { self.rowWeightInPounds_tap(e); });

        Shared.AddRemoveHandler('#textCountry', 'tap', function (e) { self.textCountry_tap(e); });
        Shared.AddRemoveHandler('#textPostal', 'tap', function (e) { self.textPostal_tap(e); });
        Shared.AddRemoveHandler('#textFreightRate', 'tap', function (e) { self.textFreightRate_tap(e); });
		    
        //Tentative
        //Shared.AddRemoveHandler('#rowUnitMeasure', 'tap', function (e) { self.rowUnitMeasure_tap(e); });
        $('#rowUnitMeasure i').hide();
    },
    });
return BoxView;
});