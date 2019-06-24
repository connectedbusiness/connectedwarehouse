/**
 * @author Interprise Solutions
 */
define([
	'jquery',
	'underscore',
  	'backbone',
  	'model/login',
  	'view/common/global',
    'view/common/shared',
  	'view/common/service',
  	'view/common/method',
    'view/login/connection/connection',
    'view/settings/settings',
    'text!template/login/login.tpl.html',
    'js/libs/spin.min.js',
    'jqueryhammer'
],function($, _, Backbone,
	LoginModel, 	
	Global, Shared, Service, Method,
    ConnectionView, SettingsView,
    LoginTemplate) {
       
    var LoginView = Backbone.View.extend({
        _loginTemplate: _.template(LoginTemplate),
  	
	    events : {	        
	        "keyup #textUsername": "textlogin_keyup",
	        "keyup #textPassword": "textlogin_keyup",
	    },
	                        
	    initialize: function () {	      
		},
		
	    render: function () {	        
	        this.$el.html(this._loginTemplate);
	        return this;
	    },

		textlogin_keyup: function (e) {
		    if (e.keyCode === 13) {
		        this.Login(e);
		    };
		},

		AnimateLogin: function (isLoggingIn) {
		    if (this.spinner == null) {
		        this.spinner = new Spinner({
		            color: "#FFFFFF",
		            length: 4,
		            width: 3,
		            radius: 6,
		            left: 70
		        });
		    } 

		    if (isLoggingIn) {
		        this.$("#buttonLogIn").html("Logging in...");
		        var target = document.getElementById("buttonLogIn");		        
		        this.spinner.spin(target);
            }
		    else {
		        this.spinner.stop();
		        this.$("#buttonLogIn").html("Login");
		    }

		    this.$("#textUsername").prop("disabled", isLoggingIn);
		    this.$("#textPassword").prop("disabled", isLoggingIn);
		    this.$("#buttonConnection").prop("disabled", isLoggingIn);
		    this.$("#buttonLogIn").prop("disabled", isLoggingIn);
		},

		ForceSignOut: function() {
		    this.model.url = Global.ServiceUrl + Service.POS + Method.FORCESIGNOUT;
		    this.model.save(null);
		},

		InitializeChildViews: function () {
		    this.AnimateLogin(false);
		    this.InitializeLoginModel();
		    this.InitializeDefaultConnection();
		    this.InitializeDefaultWorkstation();
		    this.InitializeEventHandlers();
		},		
	    
		InitializeEventHandlers: function () {
		    var self = this;

		    Shared.AddRemoveHandler('#buttonLogIn', 'tap', function (e) { self.Login(e); });
		    Shared.AddRemoveHandler('#buttonConnection', 'tap', function (e) { self.ShowConnection(true); });
		    Shared.AddRemoveHandler('#buttonBackConnection', 'tap', function (e) { self.ShowConnection(false); });
		},

	    InitializeLoginModel : function() {
			this.model = new LoginModel();
	    },

	    InitializeDefaultConnection: function () {
	        var connectionView = new ConnectionView();
	        this.$('#containerConnectionSection').html(connectionView.render());
	        connectionView.InitializeChildViews();
	        connectionView.InitializeDefaultConnection();

	        if (Global.ServiceUrl == Global.DemoServiceUrl) {
	            $("#textUsername").val("warehouse1");
	            $("#textPassword").val("warehouse1");
	        }
	    },        
	    
	    InitializeDefaultWorkstation: function() {
	        this.settingsView = new SettingsView();
	        this.settingsView.InitializeDefaultWorkstation();
	    },	    

	    Login: function (e) {
	    	e.preventDefault();
	    	var self = this;
	    	
	    	if (this.ValidateFields()) {
	    	    this.AnimateLogin(true);
	    	    this.model.url = Global.ServiceUrl + Service.POS + Method.SIGNIN;
	    	    this.model.save(null, {
	    	        success: function (model, result) {	    	            
	    	            if (!model.get("hasError")) {
	    	                self.ProcessLogin(result);
	    	            }
	    	            else { self.AnimateLogin(false); }
	    	        },
	    	        error: function (model, error, response) {
	    	            navigator.notification.alert("Unable to access server, please contact your administrator.", null, "Server Error", "OK")
	    	            self.AnimateLogin(false);	    	            
	    	        }
	    	    });
	    	}
	    },
	    
	    ProcessLogin: function (userAccount) {
	        if (userAccount == null) {
	            this.AnimateLogin(false);
	            navigator.notification.alert("There was an error trying to login. You may need to restart Connected Warehouse to fix this problem.", null, "Unable to Login", "OK");
	        }
	        else {
	            if (Shared.ValidateVersion(userAccount.AppVersion, userAccount.PatchVersion, userAccount.MinPatchVersion14)) {
	                Global.CurrentUser.RoleCode = userAccount.RoleCode;
	                Global.CurrentUser.UnitMeasureSystem = userAccount.UnitMeasureSystem;
	                var self = this;

	                if (userAccount.IsPromptForceSignOut) {
	                    navigator.notification.confirm(userAccount.Message, function (button) {
	                        if (button == 1) self.ForceSignOut();
	                        self.ContinueLogin();
	                    }, "Force Sign Out?", "Yes,No");
	                    return;
	                }
	                else if (!userAccount.Message && !userAccount.Message == "") {	                    
	                    navigator.notification.alert(userAccount.Message, null, "Login", "OK");
	                }

	                this.ContinueLogin();
	            }
	            else {
	                this.AnimateLogin(false);
	            }
	        }
	    },

	    ContinueLogin: function () {	        
	        this.settingsView.LoadPreferenceByWorkstation(true);	        
	    },
	    
	    ShowConnection: function (isShow) {
	        if (isShow) $('#containerConnectionSection').removeClass("container-remaining slideOutDown").addClass("container-remaining slideInUp"); 
	        else $('#containerConnectionSection').removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown"); 
	    },
            	
    	ValidateFields : function(){
    	    var hasInternetConnection = window.navigator.onLine;
    	    Global.CurrentUser.UserCode = $("#textUsername").val().trim();
	    	Global.CurrentUser.Password = $("#textPassword").val();

	    	this.$("#textUsername").blur();
	    	this.$("#textPassword").blur();
	      
	    	if (!hasInternetConnection) {
	    	    navigator.notification.alert("Please check your internet connection and try again.", null, "Login Failed", "OK");
	    	    return false;
	    	}

			if (!Global.ServiceUrl || Global.ServiceUrl === "") {
				navigator.notification.alert("Please setup your connection.",null,"Login Failed","OK");				
				return false;
			}
			else if (!Global.CurrentUser.UserCode) {
				navigator.notification.alert("Username is required.",null,"Login Failed","OK");
				return false;
			}
			else if (!Global.CurrentUser.Password) {
				navigator.notification.alert("Password is required.",null,"Login Failed","OK");
				return false;
			}
	        return true;
	    },
 	});
    
 return LoginView;
});