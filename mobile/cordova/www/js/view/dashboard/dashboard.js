/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',
	'backbone',
    'model/login',
	'view/common/global',
  	'view/common/service',
  	'view/common/method',
  	'view/common/shared',
	'text!template/dashboard/dashboard.tpl.html',    
    'js/libs/iscroll.js',
    'js/libs/spin.min.js',
    'jqueryhammer'
], function ($, _, Backbone,
     LoginModel,
	 Global, Service, Method, Shared,
	 DashboardTemplate, MenuTemplate
	 ){    
    var DashboardView = Backbone.View.extend({
        _dashboardTemplate: _.template(DashboardTemplate),	    
		
        events : {			
        },
		
        render : function() {	
            this.$el.html(this._dashboardTemplate({ UserCode: Global.CurrentUser.UserCode }));		    
            return this;
        },

        ApplyFadeIn: function () {
            $("#containerDashboard").addClass("fadeIn");
        },
		
		buttonAdjustment_tap : function(e) {
			e.preventDefault();
			Global.PreviousPage = "dashboard";
			this.ChangeApplicationMode("adjustment");
		},

		buttonBinInventory_tap: function (e) {
		    e.preventDefault();
		    Global.ApplicationType = "BinInventory";
		    Global.PreviousPage = "dashboard";
		    this.ChangeApplicationMode("bininventory");
		},
        		
		buttonPack_tap : function(e) {
		    e.preventDefault();
		    Global.PackMode = "Pack";
			Global.PreviousPage = "dashboard";
			this.ChangeApplicationMode("packlookup");
		},
		
		buttonPick_tap : function(e) {
		    e.preventDefault();		    
			Global.PreviousPage = "dashboard";
			this.ChangeApplicationMode("picklookup");
		},		
		
		buttonReceive_tap: function (e) {
		    e.preventDefault();
		    Global.PreviousPage = "dashboard";
		    this.ChangeApplicationMode("receivelookup");
		},
        		
		buttonSettings_tap : function(e) {
			e.preventDefault();
			Global.PreviousPage = "dashboard";
			this.ChangeApplicationMode("settings");
		},
		
		buttonLabel_tap: function (e) {
		    e.preventDefault();
		    Global.PreviousPage = "dashboard";
		    this.ChangeApplicationMode("shipmentlookup");
		},

		buttonStock_tap: function (e) {
		    e.preventDefault();
		    Global.StockMode = "Stock";
		    Global.PreviousPage = "dashboard";
		    this.ChangeApplicationMode("stock");
		},

		buttonStockTake_tap: function (e) {
		    e.preventDefault();
		    Global.PreviousPage = "dashboard";
		    this.ChangeApplicationMode("stockTake");
		},

		buttonTransfer_tap: function (e) {
		    e.preventDefault();		    
		    Global.PreviousPage = "dashboard";
		    this.ChangeApplicationMode("transfer");
		},

		buttonLogOut_click: function (e) {
		    this.Logout();
		},

		AnimateLogout: function (isAnimate) {
		    this.ProgressScreen = Shared.ShowProgress(this.ProgressScreen, isAnimate, "dashboardSection", true);
		},
		
		ChangeApplicationMode : function(mode) {
			//To prevent frontWrapper and backWrapper from changing top position when changing hash. Gets recreated		
			$("#containerDashboard").empty();
			window.location.hash = mode;	
		},
		
		InitializeChildViews : function() {			
			this.render();
			this.ctr = 0;
			this.InitializeEventHandlers();
		    //this.InitializeSwipe();
			this.InitializeVersion();
			this.LoadiScroll();
		},

		InitializeVersion: function () {
		    var version = Global.Versions.CurrentVersion.Major + "." + Global.Versions.CurrentVersion.Minor + "." + Global.Versions.CurrentVersion.Build + "." + Global.Versions.CurrentVersion.Revision;
		    $("#textVersion").text(version);
		},
		
		InitializeEventHandlers: function () {		    
		    var self = this;		    
		    Shared.AddRemoveHandler('#adjustment', 'tap', function (e) { self.buttonAdjustment_tap(e); });
		    Shared.AddRemoveHandler('#binInventory', 'tap', function (e) { self.buttonBinInventory_tap(e); });
			Shared.AddRemoveHandler('#label', 'tap', function (e) { self.buttonLabel_tap(e); });
			Shared.AddRemoveHandler('#pick', 'tap', function (e) { self.buttonPick_tap(e); });
			Shared.AddRemoveHandler('#pack', 'tap', function (e) { self.buttonPack_tap(e); });
			Shared.AddRemoveHandler('#receive', 'tap', function (e) { self.buttonReceive_tap(e); });			
			Shared.AddRemoveHandler('#stock', 'tap', function (e) { self.buttonStock_tap(e); });
			Shared.AddRemoveHandler('#stockTake', 'tap', function (e) { self.buttonStockTake_tap(e); });			
			Shared.AddRemoveHandler('#transfer', 'tap', function (e) { self.buttonTransfer_tap(e); });
		    //Shared.AddRemoveHandler('#setting', 'tap', function (e) { self.buttonSettings_tap(e); });			
			Shared.AddRemoveHandler('#buttonSetting', 'tap', function (e) { self.buttonSettings_tap(e); });
			Shared.AddRemoveHandler('#buttonLogOut', 'tap', function (e) { self.buttonLogOut_click(e); });			
		},

		//InitializeSwipe: function () {
		//    var self = this;

		//    var myScroll = new iScroll("dashboardIcons", {
		//        snap: true,
		//        momentum: false,
		//        hScrollbar: false,
		//        vScrollbar: false,
		//        onScrollEnd: function () {
		//            self.$("#itemBullet1").removeClass("active");
		//            self.$("#itemBullet2").removeClass("active");
		            
		//            if (this.currPageX == 1) {
		//                self.$("#itemBullet2").addClass("active");
		//            }
		//            else {
		//                self.$("#itemBullet1").addClass("active");		                
		//            }
		//        }
		//    });
		//},

		LoadiScroll: function () {		    		    
		    if (this.myScroll) {
		        this.myScroll.refresh();
		        return this.myScroll;
		    }
		    else {
		        var self = this;
		        this.myScroll = new IScroll("#containerDashboard", {
		            vScrollbar: false,
		            scrollX: false,
		            scrollY: true,
                    		            
		        });
		        this.myScroll.on("scrollEnd", function (e) {
		            var xValue = self.MatrixToArray($("#containerDashboard div").css("-webkit-transform"));
		            if (xValue) {
		                if (xValue[5] <= -130) {
		                    $('#containerScrollUp').removeClass('section-close');
		                    $('#containerScrollDown').hide();
		                }
		                else if (xValue[5] < 0) {
		                    $('#containerScrollUp').addClass('section-close');
		                    $('#containerScrollDown').hide();
		                }
		                else {
		                    $('#containerScrollUp').addClass('section-close');
		                    $('#containerScrollDown').show();
		                }
		            }
		        });
		    }		   
		},

		Logout: function () {
		    var loginModel = new LoginModel();
		    var self = this;

		    loginModel.url = Global.ServiceUrl + Service.POS + Method.SIGNOUT;
		    this.AnimateLogout(true);		    
		    loginModel.save(null, {
		        success: function (model, response, options) {
		            if (!model.get("hasError")) {
		                window.location.hash = "login";
		            }
		        }
		    });
		},

	    MatrixToArray: function(matrix) {
            if (matrix) return matrix.match(/(-?[0-9\.]+)/g);
	    }
	});
	return DashboardView;
})
