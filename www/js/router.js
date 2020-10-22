/**
 * @author alexis.banaag
 */
define([
	'backbone',
	'view/common/enum',
    'view/common/global',
    'view/login/login',
	'view/login/connection/connection',
	'view/adjustment/adjustment',
    'view/binManager/binManager',
	'view/dashboard/dashboard',
    'view/label/label',
    'view/label/prepack',
    'view/pack/pack',
	'view/pick/pick',    
    'view/receive/receive',
    'view/stock/stock',
    'view/stockTake/stockTake',
    'view/transfer/transfer',		
	'view/lookup/lookup',
	'view/settings/settings',
], function(Backbone,
		Enum, Global,		
		LoginView, ConnectionView,
		AdjustmentView, BinManagerView, DashboardView,
		LabelView, PrePackView, PackView, PickView, ReceiveView, StockView, StockTakeView, TransferView,
		OrderLookupView, SettingsView
){	
	Backbone.View.prototype.close = function () {
	    console.log('Closing view ' + this.el);
	    if (this.beforeClose) {
	        this.beforeClose();
	    }
	    this.remove();
	    this.off();
	};

	var AppRouter = Backbone.Router.extend({

	    events: {
	        "webkitTransitionEnd .fadeIn": "bounceOutUp_webkitTransitionEnd",
	        "webkitTransitionEnd .fadeIn": "backWrapper_webkitTransitionEnd",
	        "webkitAnimationEnd .bounceOutUp": "bounceOutUp_webkitAnimationEnd",
	        "webkitAnimationEnd .bounceOutUp": "backWrapper_webkitAnimationEnd",
	    },
        
		routes :{
			"" : 'Login',
			"login" : "Login",			
			"connection" : "Connection",
			"dashboard" : "Dashboard",
			"adjustment": "Adjustment",
			"bininventory": "BinInventory",
			"label": "Label",
			"pack" : "Pack",			
			"pick" : "Pick",
			"prepack": "PrePack",
			"receive": "Receive",
			"stock": "Stock",
			"stockTake": "StockTake",
			"transfer": "Transfer",			
			"packcompleted" : "PackComplete",			
			"packlookup" : "Lookup",
			"picklookup": "Lookup",
			"receivelookup": "Lookup",
			"shipmentlookup": "Lookup",
			"stocklookup": "Lookup",
			"settings" : "Settings",			
		},

		bounceOutUp_webkitAnimationEnd: function (e) {
		    if (this.previousView) this.previousView.close();
		},
        
		backWrapper_webkitAnimationEnd: function (e) {
		    if (this.previousView) this.previousView.close();
		},

		backWrapper_webkitTransitionEnd: function (e) {
		    if (this.previousView) this.previousView.close();
		},

        bounceOutUp_webkitTransitionEnd: function (e) {
		    if (this.currentView) this.currentView.close();
		},

	    IsDashboardFirstLoad: true,

	    IsFirstload: true,

        CurrentMode: null,
		
        Adjustment: function () {
            this.CurrentMode = "adjustmentMode";
			this.showView(new AdjustmentView());
		},

        BinInventory: function () {
            this.CurrentMode = "binInventoryMode";
		    this.showView(new BinManagerView());
		},
		
		Connection : function(){
			this.showView(new ConnectionView());
		},
		
		Dashboard: function () {		    
		    this.showDashboardView(new DashboardView());
		},
		
		Label: function () {
		    this.CurrentMode = "labelMode";
		    this.showView(new LabelView());
		},

		Login: function () {
		    this.CurrentMode = "loginMode";
		    this.showLoginView(new LoginView());
		},
		
		Lookup : function(){
			var lookupView = new OrderLookupView();
			this.CurrentMode = "lookupMode";

			switch (window.location.hash) {
				case "#packlookup":					
					lookupView.LookupMode = Enum.LookupMode.Pack;									
					break;
				case "#picklookup":					
					lookupView.LookupMode = Enum.LookupMode.Pick;									
					break;
			    case "#receivelookup":
			        lookupView.LookupMode = Enum.LookupMode.Receive;
			        break;
			    case "#shipmentlookup":
			        lookupView.LookupMode = Enum.LookupMode.Shipment;
			        break;
			    case "#stocklookup":
			        lookupView.LookupMode = Enum.LookupMode.Stock;
			        break;
			}
			this.showView(lookupView);				
		},
		
		Pack: function () {
		    this.CurrentMode = "packMode";
			this.showView(new PackView());
		},				
		
		Pick: function () {
		    this.CurrentMode = "pickMode";
		    this.showView(new PickView());		    
		},

		PrePack: function () {
		    this.showView(new PrePackView());
		},
		
		Receive: function () {
		    this.CurrentMode = "receiveMode";
		    this.showView(new ReceiveView());
		},

		Transfer: function () {
		    this.CurrentMode = "transferMode";
		    this.showView(new TransferView());
		},

		Settings : function(){
			this.showView(new SettingsView());
		},
		
		Stock: function () {
		    this.CurrentMode = "stockMode";
            this.showView(new StockView());
		},

		StockTake: function () {
		    this.CurrentMode = "stockTakeMode";
		    this.showView(new StockTakeView());
		},

		showDashboardView: function (view) {		    
		    $('#frontWrapper').removeClass("bounceInDown").removeClass("bounceOutUp").removeClass("scaleDownUp").removeClass("scaleUpDown");
		    $('#backWrapper').removeClass("bounceInDown").removeClass("scaleUpDown").removeClass("scaleDownUp");
		    $('#backWrapper').html(view.render().el);
		    this.previousView = view;

		    switch (this.CurrentMode) {		       
		        case "loginMode":
		            $('#frontWrapper').addClass("bounceOutUp");
		            break;
		        default:
		            $('#backWrapper').addClass("scaleDownUp");
		            $('#frontWrapper').addClass("scaleUpDown");
		            break;
		    }
		    
		    this.currentView = view;
		    this.currentView.InitializeChildViews();
		    if (this.IsDashboardFirstLoad) view.ApplyFadeIn();
		    else $('#containerDashboard').css("opacity", "1");

		    setTimeout(function () { $('#backWrapper').css("z-index", "0"); }, 300);
		    this.IsDashboardFirstLoad = false;
		    $('#completedSection').removeClass('section-show').removeClass("bounceInDown").addClass("bounceOutUp");
		    
		    return view;		    
		},

		showLoginView: function (view) {
		    if (!this.IsFirstload) $('#backWrapper').css("z-index", "-1");
		    $('#frontWrapper').removeClass("bounceInDown").removeClass("scaleDownUp").removeClass("scaleUpDown");
		    $('#backWrapper').removeClass("fadeIn");
		    $('#frontWrapper').html(view.render().el);
		    this.previousView = view;
		    if (!this.IsFirstload) $('#frontWrapper').removeClass("bounceOutUp").addClass("bounceInDown").show();
		    this.IsFirstload = false;
		    this.IsDashboardFirstLoad = true;
		    this.currentView = view;
		    this.currentView.InitializeChildViews();
		    Global.ScreenWidth = $("#loginSection").width();

		    return view;
		},

		showView: function (view) {
			//Global.ScreenSize = $("#loginSection").width();
		    $('#backWrapper').css("z-index", "-1");
		    $('#frontWrapper').removeClass("bounceOutUp").removeClass("bounceInDown").removeClass("scaleDownUp").removeClass("scaleUpDown");
		    $('#frontWrapper').html(view.render().el);

		    if (this.CurrentMode != "lookupMode") {
		        $('#backWrapper').html(this.currentView.render().el);
		        $('#backWrapper').removeClass("fadeIn").addClass("scaleUpDown");
		        this.previousView = this.currentView;
		    }

		    this.currentView = view;
		    this.currentView.InitializeChildViews();
		    $('#frontWrapper').addClass("scaleDownUp");

		    return view;
	    } 
	});

	var preventScrolling = function () {
	    document.body.addEventListener('touchmove', function (event) {
	        event.preventDefault();
	    }, false);
	};
	
	var initialize = function () {
	    preventScrolling();
    	var app_router = new AppRouter;
    	Backbone.history.start();    	
	};

  	return {
    	initialize : initialize
  	};
});
