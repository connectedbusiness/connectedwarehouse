/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',	
	'backbone',	
	'model/lookupcriteria',
	'model/cartItem',
	'collection/cart',    
	'view/common/enum',
	'view/common/global',	
	'view/common/service',
	'view/common/shared',
	'view/common/method',
    'view/common/preference',
    'view/lookup/boxItem',
	'view/lookup/cartItem',
    'view/lookup/shipmentItem',
    'view/lookup/lookupItem',
	'text!template/lookup/lookup.tpl.html',
    'js/libs/iscroll.js'
],function($, _, Backbone,
	LookupCriteriaModel, CartItemModel,
	CartCollection,    
	Enum, Global, Service, Shared, Method, Preference,
    BoxItemView, CartItemView, ShipmentItemView, LookupItemView,
	LookupTemplate){ 
    
	var LookupView = Backbone.View.extend({
		_template : _.template( LookupTemplate ),		
		
		events: {			
			"keypress #textSearch" : "textSearch_KeyPress"
		},
		
        CountryCode: null,

		CurrentTransaction: null,

		Criteria: null,

		LookupMode: Enum.LookupMode.Default,

        ShippingMode: null,

        initialize: function () {
            Global.IsPrePackMode = false;            
		},		
		
        textSearch_KeyPress: function (e) {
		    if (e.keyCode === 13) {
		        var criteria = $("#textSearch").val();		        

		        switch (this.LookupMode) {
		            case Enum.LookupMode.Box:
		                this.IsShowAllBoxes = false;
		                this.LoadBoxes(criteria);
		                break;
		            case Enum.LookupMode.ShippingAddress:
		                this.Criteria = criteria;
		                switch (this.ShippingMode) {		                   
		                    case "country":
		                        this.LoadCountryLookup();
		                        break;
		                    case "postal":
		                        this.LoadPostalLookup();
		                        break;		                    
		                }
		                break;
		            default:
		                this.LoadTransactions(criteria);
		                break;
		        
		        }
		    }
		},
		
		buttonSearch_tap : function(e) {
		    var criteria = $("#textSearch").val();
		    
		    switch (this.LookupMode) {
		        case Enum.LookupMode.Box:
		            this.IsShowAllBoxes = false;
		            this.LoadBoxes(criteria);
		            break;
		        case Enum.LookupMode.ShippingAddress:
		            this.Criteria = criteria;
		            switch (this.ShippingMode) {		                
		                case "country":
		                    this.LoadCountryLookup();
		                    break;
		                case "postal":
		                    this.LoadPostalLookup();
		                    break;
		            }
		            break;
		        default:
		            this.LoadTransactions(criteria);
		            break;
		    }            
		},	
		
		AnimateLookup: function (isAnimate) {
		    this.ProgressScreen = Shared.ShowProgress(this.ProgressScreen, isAnimate, "lookupSection", false);		    
		},

		AnimateBoxLookup: function (isAnimate) {
		    if (isAnimate) {
		        $('#buttonMoreLookup').html("loading..");
		    }
		    else {
		        $('#buttonMoreLookup').html("load more");
		    }
		},
	
		ClearCart : function() {			
			this.$("#cartListContainer tbody").html("");
		},

		GeneratePrePackButtonHTML: function () {
            return "<button id=\"buttonPrePack\" class=\"btn-belize\"> \
                        <ul> \
                            <li><i class=\"icon-archive icon-2\"></i></li> \
                            <li><span>prepack</span></li> \
                            <li><span id=\"textPrepackQuantities\">(0)</span></li> \
                        </ul> \
                    </button>";
		},
	
		GoBack : function(e) {
			window.location.hash = "dashboard";
		},

		HighLightItem: function (self, cartItemView, current) {	    
		    if (self.LookupMode != Enum.LookupMode.Shipment) {
		        $("td").removeClass("highlight");
		        $("." + cartItemView.cid).addClass("highlight");		        
		    } else {		        
		        $("#icon" + cartItemView.cid).toggleClass("icon-ok shipment-icon-oncheck clear-padding");
		        $("." + cartItemView.cid + " ul").toggleClass('listitem-3 listitem-6');
		        $("." + cartItemView.cid).toggleClass("highlight");
		        
		        if ($("#icon" + cartItemView.cid).hasClass('icon-ok')) Global.CurrentTransactions.add(cartItemView.model);
		        else Global.CurrentTransactions.remove(cartItemView.model);
		    }

		    //if (self.myLastTap == null) self.myLastTap = new Date().getTime();

		    //var now = new Date().getTime();
		    //var timeSince = (now - self.myLastTap);

		    //if ((timeSince < 600) && (timeSince > 0)) {
		    //    var nowCID = cartItemView.cid;
		    //    var currentCID = null;

		    switch (self.LookupMode)
		    {
		        case Enum.LookupMode.Box:
		            self.CurrentBox = current;
		            this.trigger("boxSelected", this);
		            break;
		        case Enum.LookupMode.ShippingAddress:
		            this.trigger("itemSelected", current);
		        default:
		            if (self.CurrentTransaction == null) self.CurrentTransaction = current;
		            if (self.LookupMode == Enum.LookupMode.Shipment
                        || self.LookupMode == Enum.LookupMode.Pick
                        || self.LookupMode == Enum.LookupMode.Pack) {
		                Global.CurrentTransactions.add(cartItemView.model);
		            }
		            self.ProcessSelectedTransaction();
		            break;
		    }

		    if (self.LookupMode != Enum.LookupMode.Box) {
		        self.CurrentTransaction = current;
		        self.CurrentTransaction.CID = cartItemView.cid;
		    }

		    self.myLastTap = new Date().getTime();
		},

		InitializeBoxCollection: function () {
		    if (this.boxCollection) {
		        this.boxCollection.reset();
		    }
		    else {
		        this.boxCollection = new CartCollection();
		        this.boxCollection.on("reset", this.ClearCart, this);
		    }
		},

		InitializeLookupCollection: function () {
		    if (this.lookupCollection) {
		        this.lookupCollection.reset();
		    }
		    else {
		        this.lookupCollection = new CartCollection();
		        this.lookupCollection.on("reset", this.ClearCart, this);
		    }
		},

		InitializeTransactionCollection: function () {
		    if (this.transactionCollection) {
		        this.transactionCollection.reset();
		    }
		    else {
		        this.transactionCollection = new CartCollection();
		        this.transactionCollection.on("reset", this.ClearCart, this);
		    }
		},

		InitializeChildViews: function () {		    
		    if (this.LookupMode == Enum.LookupMode.Box) {
		        this.RenderLookup();
		        this.InitializeBoxCollection();
		        this.LoadBoxes();
		    }
		    else if (this.LookupMode == Enum.LookupMode.ShippingAddress) {
		        this.RenderLookup();
		        this.InitializeLookupCollection();

		        switch (this.ShippingMode) {
		            case "country":
		                this.LoadCountryLookup();
		                break;
		            case "postal":
		                this.LoadPostalLookup();
		                break;
		        }
		    }
		    else {
		        this.$el.html(this._template);
		        this.RenderLookup();
		        this.WireEvents();
		        this.InitializeTransactionCollection();
		        this.LoadTransactions();
		    }
		    Shared.Focus('#textSearch');
		},

		LoadBoxes: function (criteria) {
		    var lookupModel = new LookupCriteriaModel();
		    var self = this;		   		    

		    lookupModel.url = Global.ServiceUrl + Service.SOP + Method.CARRIERPACKAGINGLOOKUP;
		    lookupModel.set({
		        CarrierCode: this.CarrierCode,
		        ShippingMethodCode: this.ShippingMethodCode,
		        WarehouseCode: Global.CurrentLocation
		    });
            
		    if (criteria) lookupModel.set({ CriteriaString: criteria });

		    var animateElem = "";
		    if (this.IsShowAllBoxes) {
		        animateElem = "buttonMoreLookup";
		        lookupModel.set({ IsShowAllBoxes: true });
		        $('#containerTable').removeClass('iscroll-lookup-2').addClass('iscroll-lookup');
		        $('#buttonMoreLookup').hide();
		    } else {
		        animateElem = "lookupBody";
		        lookupModel.set({ IsShowAllBoxes: false });
		        this.ShowButtonMoreLookup();
		    }
		    this.AnimateBoxLookup(true);
		    lookupModel.save(null, {
		        success: function (model, response, options) {
		            self.AnimateBoxLookup(false);
		            if (!model.get("hasError")) {
		                self.PopulateCartByBoxes(response.Packages);
		            }
		        },
		        error: function (model, error, options) {
		            self.ShowButtonMoreLookup();
		            self.AnimateBoxLookup(false);
		        }
		    });		    
		},

		LoadCountryLookup: function () {
		    var lookupModel = new LookupCriteriaModel();
		    var self = this;

		    lookupModel.url = Global.ServiceUrl + Service.CUSTOMER + Method.COUNTRYCODELOOKUP + "30";

		    if (this.Criteria) {
		        lookupModel.set({
		            StringValue: this.Criteria
		        });
		    }

		    this.AnimateLookup(true);
		    lookupModel.save(null, {
		        success: function (model, response, options) {		            
		            if (!model.get("hasError")) {
		                self.PopulateCartByCountries(response.Countries);
		            }
		        },
		        progress: this.ProgressScreen
		    });		    
		},

		LoadPostalLookup: function () {
		    var lookupModel = new LookupCriteriaModel();
		    var self = this;

		    lookupModel.url = Global.ServiceUrl + Service.CUSTOMER + Method.ZIPCODELOOKUP + "30/" + this.CountryCode;

		    if (this.Criteria) {
		        lookupModel.set({
		            StringValue: this.Criteria
		        });
		    }

		    this.AnimateLookup(true);
		    lookupModel.save(null, {
		        success: function (model, response, options) {		            
		            if (!model.get("hasError")) {
		                self.PopulateCartByPostal(response.Postals);
		            }
		        },
		        progress: this.ProgressScreen
		    });		    
		},

		LoadiScroll: function () {
		    this.myScroll = Shared.LoadiScroll(this.myScroll, "");
		},

		LoadPrePackItems: function (itemCount) {
		    if (itemCount > 0) {
		        Global.IsPrePackMode = true;
		        Global.TransactionCode = "";
		        if (this.LookupMode == Enum.LookupMode.Pick) window.location.hash = "pick";
		        else if (this.LookupMode == Enum.LookupMode.Shipment) window.location.hash = "prepack";
		    }
		    else {
		        Shared.BeepError();
		        if (this.LookupMode == Enum.LookupMode.Pick) Shared.NotifyError("There are no items to pick.", "Prepack items");
		        else if (this.LookupMode == Enum.LookupMode.Shipment) Shared.NotifyError("There are no labels to print.", "Prepack labels");		        
		    }
		},

		LoadTransactions: function (criteria) {
			var lookupModel = new LookupCriteriaModel();
			var self = this;			
			
			switch (this.LookupMode) {
			    case Enum.LookupMode.Pack:
			        lookupModel.url = Global.ServiceUrl + Service.SOP + Method.PACKTRANSACTIONLOOKUP;
			        lookupModel.set({ TransactionType: Preference.PackSourceTransaction });
			        break;
			    case Enum.LookupMode.Pick:
			        lookupModel.url = Global.ServiceUrl + Service.SOP + Method.PICKTRANSACTIONLOOKUP;			        
			        lookupModel.set({
			            TransactionType: Preference.PickSourceTransaction,
			            IsPrePackMode: Preference.PrePackIsEnable
			        });			        
			        break;
			    case Enum.LookupMode.Receive:
			        lookupModel.url = Global.ServiceUrl + Service.PRODUCT + Method.RECEIVELOOKUP;
			        break;
			    case Enum.LookupMode.Stock:
			        lookupModel.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADGOODSRECEIVELOOKUP;
			        break;
			    case Enum.LookupMode.Shipment:
			        lookupModel.url = Global.ServiceUrl + Service.SOP + Method.SHIPMENTLOOKUP;
			        lookupModel.set({
			            TransactionType: Preference.LabelSourceTransaction,
			            HasTrackingNumber: false,
			            IsPrePackMode: Preference.PrePackIsEnable
			        });
			        break;			    
			};

			if (criteria) {
   				lookupModel.set({ CriteriaString : criteria });
   			}
   			
   			lookupModel.set({ WarehouseCode: Preference.DefaultLocation });
   			    		
   			this.AnimateLookup(true);
    		lookupModel.save(null, {
    		    success: function (model, response, options) {    		        
    		        if (!model.get("hasError")) {    		            
    		            switch (self.LookupMode) {
    		                case Enum.LookupMode.Pack:    		                    
    		                    self.PopulateCartByTransaction(response.Packs, criteria, 0);
    		                    break;
    		                case Enum.LookupMode.Pick:
    		                    if (Preference.PrePackIsEnable) self.PopulateCartByTransaction(response.Picks, criteria, response.ItemCount);
    		                    else self.PopulateCartByTransaction(response.Picks, criteria, 0);
    		                    break;
    		                case Enum.LookupMode.Receive:
    		                    self.PopulateCartByTransaction(response.PurchaseOrders, criteria, 0);
    		                    break;
    		                case Enum.LookupMode.Stock:
    		                    self.PopulateCartByTransaction(response.PurchaseReceiptCollection, criteria, 0);
    		                    break;
    		                case Enum.LookupMode.Shipment:
    		                    if (Preference.PrePackIsEnable) self.PopulateCartByTransaction(response.Packs, criteria, response.ItemCount);
    		                    else self.PopulateCartByTransaction(response.Packs, criteria, 0);
    		                    break;
    		            };
    		        }
    		    },
    		    progress: this.ProgressScreen
    		});    		
		},
		
		ProcessSelectedTransaction : function() {
		    if (this.CurrentTransaction) {		        
		        switch (this.LookupMode) {
		            case Enum.LookupMode.Pack:
		                Global.TransactionCode = this.CurrentTransaction.TransactionCode;
		                window.location.hash = "pack";
		                break;
		            case Enum.LookupMode.Pick:
		                Global.TransactionCode = this.CurrentTransaction.TransactionCode;
		                window.location.hash = "pick";
		                break;
		            case Enum.LookupMode.Receive:
		                Global.TransactionCode = this.CurrentTransaction.PurchaseOrderCode;
		                window.location.hash = "receive";
		                break;
		            case Enum.LookupMode.Stock:
		                Global.TransactionCode = this.CurrentTransaction.PurchaseReceiptCode;
		                Global.TransferMode = "Stock";
		                Global.PreviousPage = "stocklookup";
		                window.location.hash = "stock";
		                break;
		            case Enum.LookupMode.Shipment:
		                Global.TransactionCode = this.CurrentTransaction.TransactionCode;
		                Global.PackMode = "Label";
		                Global.PreviousPage = "shipmentlookup";
		                window.location.hash = "label";
		                break;
		        };		        
			}
		},
        		
		PopulateCartByCountries: function (countries) {
		    this.lookupCollection.reset();

		    if (countries && countries.length > 0) {
		        var self = this;
		        var counter = 1;

		        _.each(countries, function (current) {

		            if (countries.length == 1) {		                
		                self.trigger("itemSelected", current);

		            } else {
		                counter = counter + 1;

		                var lookupItemModel = new CartItemModel();

		                lookupItemModel.set({
		                    RowData1: current.CountryCode,
		                    RowData2: current.ThreeISOCode,
                            RowData3: "",
		                    CountryCode: current.CountryCode,
		                    ThreeISOCode: current.ThreeISOCode,
		                    RowNumber: counter - 1
		                });

		                self.lookupCollection.add(lookupItemModel);

		                var lookupItemView = new LookupItemView({ model: lookupItemModel });
		                self.$("#cartListContainer tbody").append(lookupItemView.render());

		                Shared.AddRemoveHandler("." + lookupItemView.cid, 'tap', function (e) { self.HighLightItem(self, lookupItemView, current); });
		            }

		        });
		        this.LoadiScroll();
		    }
		    else Shared.BeepError();
		},

		PopulateCartByBoxes : function(packages) {
		    this.boxCollection.reset();
			
		    if (packages && packages.length > 0) {

		        var self = this;
		        var counter = 1;
		        var criteria = $("#textSearch").val();

		        var filterToAdd = Array();
		        var len = packages.length

		        while (len--) {
		            var filterValue;
		            var packagingType;
		            var current = packages[len];

		            packagingType = current.PackagingType == undefined ? null : current.PackagingType;
		            packagingType = packagingType == null ? 'null' : packagingType.toString().toLowerCase();
		            // filter by PackagingType
		            filterValue = packagingType;

		            if (filterToAdd.indexOf(filterValue) < 0) {
		                filterToAdd.push(filterValue);
		            }
		            else {
		                if (len > -1) packages.splice(len, 1);
		            }
		        }

		        _.each(packages, function (current) {

                    current.ServiceCode = current.ServiceType;
		            current.PackagingCode = current.PackagingType;

		            if (criteria && packages.length == 1) {
		                self.CurrentBox = current;		                
		                self.trigger("boxSelected", self);

		            } else {		                
		                counter = counter + 1;

		                var boxModel = new CartItemModel();
                        var dimension = current.Height + "x" + current.Length + "x" + current.Width

		                boxModel.set({
		                    PackagingCode: current.PackagingCode,
		                    CarrierCode: current.CarrierCode,
		                    CarrierDescription: current.CarrierDescription,
		                    Dimension: dimension,
		                    Length: current.Length,
		                    Width: current.Width,
		                    Height: current.Height,
		                    WeightInLbs: current.WeightLbs,
		                    RowNumber: counter - 1,		                    
		                    ServiceCode: current.ServiceCode,
		                    IsCustom: current.IsCustom
		                });

		                self.boxCollection.add(boxModel);

		                var boxItemView = new BoxItemView({ model: boxModel });
		                self.$("#cartListContainer tbody").append(boxItemView.render());

		                Shared.AddRemoveHandler("." + boxItemView.cid, 'tap', function (e) { self.HighLightItem(self, boxItemView, current); });
		            }

		        });
		        this.LoadiScroll();
		    }
		    else Shared.BeepError();
		},

		PopulateCartByPostal: function (postals) {
		    this.lookupCollection.reset();

		    if (postals && postals.length > 0) {
		        var self = this;
		        var counter = 1;

		        _.each(postals, function (current) {

		            if (postals.length == 1) {		                
		                self.trigger("itemSelected", current);

		            } else {
		                counter = counter + 1;

		                var lookupItemModel = new CartItemModel();

		                lookupItemModel.set({
		                    RowData1: current.PostalCode,
		                    RowData2: current.City,
		                    RowData3: current.County,
		                    PostalCode: current.PostalCode,
		                    City: current.City,
		                    CountryCode: current.CountryCode,
		                    County: current.County,
                            StateCode: current.StateCode,
		                    RowNumber: counter - 1
		                });

		                self.lookupCollection.add(lookupItemModel);

		                var lookupItemView = new LookupItemView({ model: lookupItemModel });
		                self.$("#cartListContainer tbody").append(lookupItemView.render());

		                Shared.AddRemoveHandler("." + lookupItemView.cid, 'tap', function (e) { self.HighLightItem(self, lookupItemView, current); });
		            }

		        });
		        this.LoadiScroll();
		    }
		    else Shared.BeepError();
		},

		PopulateCartByTransaction : function(transactions, lookupCriteria, itemCount) {
		    this.transactionCollection.reset();
		    var self = this;
            
		    if ((this.LookupMode == Enum.LookupMode.Pick && Preference.PrePackIsEnable) || this.LookupMode == Enum.LookupMode.Shipment && Preference.PrePackIsEnable) {
		        this.$("#cartListContainer tbody").append(this.GeneratePrePackButtonHTML());
		        this.UpdatePrepackQuantities(itemCount);
		        Shared.AddRemoveHandler('#buttonPrePack', 'tap', function () { self.LoadPrePackItems(itemCount); });
		    } 

		    if (transactions && transactions.length > 0) {
		        if (transactions.length == 1) {
		            var criteria = $("#textSearch").val();

		            if (criteria != null && criteria != "") {
		                this.CurrentTransaction = transactions[0];
		                this.ProcessSelectedTransaction();
		                return true;
		            }
		        }
		        this.$("#textSearch").val("");

		        var counter = 1;

		        _.each(transactions, function (current) {
		            counter = counter + 1;

		            var transactionModel = new CartItemModel();

		            switch (self.LookupMode) {
		                case Enum.LookupMode.Pack:
		                case Enum.LookupMode.Pick:
		                    var dueDate = "Ship:  " + Shared.FormatDate(current.ShippingDate, "L");
		                    var salesOrderDate = Shared.FormatDate(current.TransactionDate, "L");

		                    transactionModel.set({
		                        TransactionCode: current.TransactionCode,
		                        CustomerCode: current.BillToCode,
		                        Name: current.BillToName,
		                        BillToCode: current.BillToCode,
		                        BillToName: current.BillToName,
		                        ShiptoCode: current.ShiptoCode,
		                        ShippingDate: current.ShippingDate,
		                        SalesOrderDate: current.TransactionDate,
		                        Date: salesOrderDate,
		                        WarehouseCode: current.WarehouseCode,
		                        Status: dueDate,
		                        RowNumber: counter - 1,
		                        IsPriority: current.IsPriority
		                    });

		                    if (self.LookupMode == Enum.LookupMode.Pack) transactionModel.set({ ServiceCode: current.ServiceCode });

		                    Global.CurrentTransactions = new CartCollection();
		                    break;
		                case Enum.LookupMode.Receive:
		                    var poDate = Shared.FormatDate(current.PODate, "L");
		                    transactionModel.set({
		                        TransactionCode: current.PurchaseOrderCode,
		                        SupplierCode: current.SupplierCode,
		                        Name: current.SupplierName,
		                        Status: current.OrderStatus,
		                        Date: poDate,
		                        RowNumber: counter - 1,
		                        IsPriority: null
		                    });
		                    break;
		                case Enum.LookupMode.Stock:
		                    var poDate = Shared.FormatDate(current.PRDate, "L");
		                    transactionModel.set({
		                        TransactionCode: current.PurchaseReceiptCode,
		                        SupplierCode: current.SupplierName,
		                        Name: current.SupplierName,
		                        Status: "",
		                        Date: poDate,
		                        RowNumber: counter - 1,
		                        IsPriority: null
		                    });
		                    break;
		                case Enum.LookupMode.Shipment:
		                    var shipmentDate = Shared.FormatDate(current.ShipmentDate, "L");
		                    transactionModel.set({
		                        TransactionCode: current.TransactionCode,		                        
		                        ShipFromName: current.ShipFromName,
		                        ShipToName: current.ShipToName,
		                        Date: shipmentDate,
		                        RowNumber: counter - 1,
		                        isChecked: false,
		                        ShipmentView: null,
		                        IsPriority: null
		                    });

		                    Global.CurrentTransactions = new CartCollection();
		                    break;
		            }

		            self.transactionCollection.add(transactionModel);

		            var itemView = null;

		            if (self.LookupMode == Enum.LookupMode.Shipment) itemView = new ShipmentItemView({ model: transactionModel });
		            else itemView = new CartItemView({ model: transactionModel });

		            self.$("#cartListContainer tbody").append(itemView.render());
		            Shared.AddRemoveHandler("." + itemView.cid, 'tap', function (e) { self.HighLightItem(self, itemView, current); });

		        });
		    }
		    else {
		        if (lookupCriteria && lookupCriteria != "") {
		            Shared.BeepError();
		        }
		    }
			this.LoadiScroll();
		},		
		
		Render: function () {
		    return this.$el.html(this._template);
		},

		RenderLookup: function () {

		    this.$('#buttonNew').hide();
		    this.$('#buttonBack').hide();
		    this.$('#buttonMoreLookup').hide();
		    this.$('#buttonSlideDown').hide();

		    switch (this.LookupMode) {
		        case Enum.LookupMode.Pick:
		            if (Preference.PickSourceTransaction == "invoice") this.$('#lookupTitle').text('select invoice');
		            else this.$('#lookupTitle').text('select order');
		            break;
		        case Enum.LookupMode.Pack:
		            if (Preference.PackSourceTransaction == "invoice") this.$('#lookupTitle').text('select invoice');
		            else this.$('#lookupTitle').text('select order');
		            break;
		        case Enum.LookupMode.Receive:
		            this.$('#lookupTitle').text('purchase orders');
		            break;
		        case Enum.LookupMode.Stock:
		            this.$('#lookupTitle').text('goods received');
		            this.$('#buttonNew').show();

		            var newStock = function (e) {
		                Global.TransferMode = "NewStock";
		                Global.PreviousPage = "stocklookup";
		                window.location.hash = "stock";
		            };

		            Shared.AddRemoveHandler('#buttonNew', 'tap', newStock);
		            break;
		        case Enum.LookupMode.Shipment:
		            this.$('#lookupTitle').text('shipments');		            
		            break;
		        case Enum.LookupMode.Box:
                    var self = this;
                    this.$('#lookupTitle').text('select box to add');
                    this.$('#buttonMenu').hide();
                    this.$('#buttonBack').show();
                    this.$('#buttonMoreLookup').show();
                    this.$('#containerTable').removeClass('iscroll-lookup').addClass('iscroll-lookup-2');
                    this.$('#textSearch').attr('placeholder', 'enter box to search');
                    Shared.AddRemoveHandler('#buttonBack', 'tap', function (e) { self.ShowPackSection(e); });
                    Shared.AddRemoveHandler('#buttonSearch', 'tap', function (e) { self.buttonSearch_tap(e); });
                    Shared.AddRemoveHandler('#buttonMoreLookup', 'tap', function (e) {
                        self.IsShowAllBoxes = true;
                        self.LoadBoxes(null);
                    });
                    break;
		        case Enum.LookupMode.ShippingAddress:
		            var self = this;
		            this.$('#lookupSection').addClass("slideDownReady");
                    
		            switch (this.ShippingMode) {
		                case "country":
		                    this.$('#lookupTitle').text('select a country');
		                    this.$('#textSearch').attr('placeholder', 'enter country to search');
		                    break;
		                case "postal":
		                    this.$('#lookupTitle').text('select a postal');
		                    this.$('#textSearch').attr('placeholder', 'enter postal to search');
		                    break;
		            }

		            this.$('#buttonMenu').hide();
		            this.$('#buttonSlideDown').show();
		            Shared.AddRemoveHandler('#buttonSearch', 'tap', function (e) { self.buttonSearch_tap(e); });
		            Shared.AddRemoveHandler('#buttonSlideDown', 'tap', function (e) { self.SlideDownLookup(e); });
		            break;
		    }		                    
		},

		ShowButtonMoreLookup: function () {
		    $('#containerTable').removeClass('iscroll-lookup').addClass('iscroll-lookup-2');
		    $('#buttonMoreLookup').show();
		},
        
		ShowPackSection: function () {
		    $('#packSection').show();
		    $('#lookupSectionContainer').removeClass('section-show').addClass('section-close');
		    $('#boxSectionContainer').removeClass('section-show').addClass('section-close');		    
		},

		SlideDownLookup: function () {
		    this.trigger("slideDownLookup", this);
		},
        
		UpdatePrepackQuantities: function (itemCount) {
		    if (itemCount == 0) itemCount = "none";
		    else if (itemCount > 99) itemCount = "99+"		    	    
		    this.$('#textPrepackQuantities').text("(" + itemCount + ")");
		},
        
	    WireEvents: function () {
	        var self = this;            
	        Shared.AddRemoveHandler('#buttonMenu', 'tap', function (e) { self.GoBack(e); });
	        Shared.AddRemoveHandler('#buttonSearch', 'tap', function (e) { self.buttonSearch_tap(e); });
	    },

	});
	return LookupView;
});