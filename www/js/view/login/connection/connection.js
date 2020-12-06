define([
	'jquery',	
	'underscore',	
	'backbone',	
    'model/cartItem',
	'collection/url',    
	'view/common/global',
    'view/common/shared',
    'view/login/connection/cartItem',
	'text!template/login/connection/connection.tpl.html',
    'jqueryhammer'
],function($, _, Backbone, CartItemModel, UrlCollection, 
	Global, Shared,
    CartItemView,
	ConnectionTemplate){   
    
	var ConnectionView = Backbone.View.extend({
	    _template: _.template(ConnectionTemplate),	    	    

	    events: {	        
		},

		buttonBackConnection_tap: function (e) {
		    window.location.hash = 'login';
		},

		buttonUrlCancel_tap: function (e) {
		    if (this.SaveConnection()) this.SwitchDisplay(false);
		    //this.SwitchDisplay(false);
		},

		buttonSaveConnection_tap: function (e) {
		    if (this.SaveConnection()) this.SwitchDisplay(false);
		},

		buttonRemoveConnection_tap: function (e) {
		    this.RemoveConnection()
		},

		buttonNewConnection_tap: function (e) {
		    if (this.urlcollection.length >= 5) {
		        navigator.notification.alert("You already reach maximum number of connections.", null, "New Connection", "OK");		        
		    }
		    else {
		        this.CurrentConnectionView = null;
		        this.SwitchDisplay(true);
		    }
		},

		buttonShowUrl_tap: function (cartItemView) {
		    this.CurrentConnectionView = cartItemView;
		    this.SwitchDisplay(true);
		},

		Url_OnSetDefaultConnection: function (cartItemView) {		    
		    this.SetDefaultConnection(cartItemView);
		},

		initialize : function(){
		    this.$el.html(this._template);	 

		},

		AddUrl: function (urlModel) {
		    var self = this;
		    var cartItemView = new CartItemView({ model: urlModel });		    

		    this.$("#tableUrl tbody").append(cartItemView.render());

		    //var highlighItem = function () {
		    //    self.CurrentConnectionView = cartItemView;
		    //    self.SetDefaultConnection(cartItemView);	        
		    //};

		    //Shared.AddRemoveHandler('.' + cartItemView.cid, 'tap', setSelectedUrl);
		    //Shared.AddRemoveHandler('#checkListRow' + cartItemView.cid, 'tap', self.Url_OnSetDefaultConnection(cartItemView));
		    //Shared.AddRemoveHandler('#buttonShowUrl' + cartItemView.cid, 'tap', function (e) { self.buttonShowUrl_tap(cartItemView); });
		    self.WireUrlEvents(cartItemView);

		    var isDefault = urlModel.get("isDefault");
		    if (isDefault) this.SetDefaultConnection(cartItemView);
		},

		ClearConnections: function () {
		    while (this.urlcollection.length > 0)
		    {
		        var url = this.urlcollection.models[0];	            
		        url.destroy({ isLocalStorage: true });
		        this.urlcollection.remove(url);
		    }
		    window.localStorage.clear();
		},

		CreateUriItem : function(name, uri, isDefault) {		    
		    var maxCounter = 0;

		    if (this.urlcollection.length > 0) {
		        var maxUrl = this.urlcollection.max(function (current) { return current.get("counter"); });
		        if (maxUrl) maxCounter = maxUrl.get("counter");
            }
		    
		    var urlItem = {
		        counter: maxCounter + 1,
		        name : name,
		        url: uri,
		        isDefault: isDefault
            };
            return urlItem;
		},

		HasChanges: function () {
		    if (this.CurrentConnectionView != null) {
		        var newServerName = $("#textServerName").val().trim();
		        var newUrl = $("#textUrl").val().trim();
		        var currentServername = this.CurrentConnectionView.model.get("name");
		        var currentUrl = this.CurrentConnectionView.model.get("url");

		        if (newServerName != null) newServerName = newServerName.trim().toLowerCase();
		        if (newUrl != null) newUrl = newUrl.trim().toLowerCase();
		        if (currentServername != null) currentServername = currentServername.trim().toLowerCase();
		        if (currentUrl != null) currentUrl = currentUrl.trim().toLowerCase();

		        return (newServerName != currentServername || newUrl != currentUrl);
		    }

		    return true;
		},

		HighlighConnection: function (cartItemView, reset) {
		    var viewID = cartItemView.model.get('ViewID');
		    if (reset) {
		        this.$("td").removeClass("highlight");
		        this.$("i").removeClass("icon-ok");
		        this.$('.listitem-4').addClass('listitem-4').removeClass('listitem-5');
		        this.$('.listitem-5').addClass('listitem-4').removeClass('listitem-5');
		    }

		    this.$("." + cartItemView.cid).addClass("highlight");
		    this.$("#iconIsSelected" + cartItemView.cid).addClass("icon-ok");
		    this.$('#itemName' + viewID).toggleClass('listitem-4').toggleClass('listitem-5');
		},
		
		InitializeChildViews : function() {
		    this.InitializeConnections();
		    this.InitializeEventHandlers();
		},
		
		InitializeConnections : function() {
		    if (this.LoadConnections()) {
		        this.PopulateList();
		    }			
		},

		InitializeEventHandlers: function () {
		    var self = this;

		    Shared.AddRemoveHandler('#buttonBackUrl', 'tap', function (e) { self.buttonUrlCancel_tap(e); });
		    Shared.AddRemoveHandler('#buttonSaveUrl', 'tap', function (e) { self.buttonSaveConnection_tap(e); });
		    Shared.AddRemoveHandler('#buttonRemoveConnection', 'tap', function (e) { self.buttonRemoveConnection_tap(e); });
		    Shared.AddRemoveHandler('#buttonNewConnection', 'tap', function (e) { self.buttonNewConnection_tap(e); });
		},

		LoadConnections: function () {
		    var result = false;

		    this.urlcollection = new UrlCollection();			
		    this.urlcollection.fetch({
		        isLocalStorage: true,
		        success: function (model, response, options) {
		            if (!model.get("hasError")) result = true;		            
		        }
		    });

		    return result;
		},

		InitializeDefaultConnection: function () {
		    this.LoadConnections();

		    var defaultConnection = null;

		    if (this.urlcollection.length == 0) {
		        defaultConnection = this.urlcollection.create(this.CreateUriItem("Demo Server", Global.DemoServiceUrl, true));		        
		    }
		    else {
		        defaultConnection = this.urlcollection.find(function (current) {		            
		            var isDefault = current.get("isDefault");
		            if (isDefault) return true;
		        }); 
		    }

		    if (defaultConnection) this.SetDefaultUrl(defaultConnection.get("url"));
		},

		PopulateList: function () {
		    if (this.urlcollection.length == 0) {
		        this.urlcollection.create(this.CreateUriItem("Demo Server", Global.DemoServiceUrl, true));
		    }

		    if (this.urlcollection.length > 0) {
		        var self = this;
                //this.ClearConnections();
		        
		        this.urlcollection.each(function (url) {
		            self.AddUrl(url);
		        });
		    }
		},

		RemoveConnection: function () {
		    var self = this;

		    navigator.notification.confirm("Are you sure you want to remove this connection?", function (button) {
		        if (button == 1) {
		            if (self.CurrentConnectionView != null) {
		                var model = self.CurrentConnectionView.model;

		                model.destroy();
		                self.urlcollection.remove(model);
		                self.CurrentConnectionView.remove();

		                self.SwitchDisplay(false);
		            }
		            else {
		                self.SwitchDisplay(false);
		            }
		        }
		    }, "Delete Connection", "Yes,No");
		},

		render: function () {
		    return this.$el.html(this._template());
		},
        
		RenderUrl: function () {
		    var urlModel = null;
		    var isNew = false;

		    if (this.CurrentConnectionView != null) {
		        urlModel = this.CurrentConnectionView.model;
		        isNew = false;		        		        
		    }
		    else {		        
		        urlModel = new CartItemModel({ 
		            id: null,
		            name: "Connection " + (this.urlcollection.length + 1),
		            url: null,
		            isDefault: true                  
		        });
		        isNew = true;
		    }

		    this.tempCurrentID = urlModel.get("id");
		    this.tempCurrentServerName = urlModel.get("name");
		    this.tempCurrentServerUrl = urlModel.get("url");

		    this.$('#textServerName').val(this.tempCurrentServerName);
		    this.$('#textUrl').val(this.tempCurrentServerUrl);

		    if (isNew) this.$("#buttonRemoveConnection").addClass("control-hidden");
		    else this.$("#buttonRemoveConnection").removeClass("control-hidden");
		},

		ResetDefaultConnection: function () {
		    this.urlcollection.each(function (current) {
		        current.save({ isDefault: false })
		    }, this);		    
		},

		SetDefaultUrl: function (url) {
		    Global.ServiceUrl = url;
		},
	
		SetDefaultConnection: function (cartItemView) {
		    this.ResetDefaultConnection();

		    var urlModel = cartItemView.model;		    
		    urlModel.save({ isDefault: true });
		    
		    this.SetDefaultUrl(urlModel.get("url"));
		    this.HighlighConnection(cartItemView, true);
		    this.CurrentConnectionView = cartItemView;		    
		},
	
		SaveConnection: function () {
		    if (this.HasChanges()) {
		        if (this.ValidateConnection()) {
		            var serverName = $("#textServerName").val().trim();
		            var url = $("#textUrl").val().trim();

		           // if (!/^http:\/\//.test(url)) url = "http://" + url;
				   // if (!/\/$/.test(url)) url = url + "/";
				   if (!/^http:\/\//.test(url))
                        {
                        if (!/^Http:\/\//.test(url))
                            {
                            if (!/^https:\/\//.test(url))
                                {   
                                if (!/^Https:\/\//.test(url))
                                    {
                                    url = "http://" + url;
                                    }
                                }
                            }
                        }


		            if (!/\/$/.test(url))
                        {
                      url = url + "/";
                        }


		            $("#textUrl").val(url);

		            if (this.CurrentConnectionView == null) {
		                urlModel = this.urlcollection.create(this.CreateUriItem(serverName, url, true));
		                this.AddUrl(urlModel);
		                this.$("#buttonRemoveConnection").removeClass("control-hidden");
		            }
		            else {
		                this.UpdateUrl(serverName, url);
		            }
		            return true;
		        }
		        return false;
		    }
		    else { return true; }            
		},

		SwitchDisplay: function (isUrl) {
		    if (isUrl) {
		        this.RenderUrl();		        
		        $(".slider").css("transform", "translateX(" + Global.ScreenWidth * -1 + "px)");
		        Shared.Focus('#textServerName');
		    }
		    else {
		        this.$('#textServerName').blur();
		        $(".slider").css("transform", "translateX(" + -0 + "px)");
		    }
		},

		UpdateUrl: function (serverName, serverUrl) {
		    if (this.CurrentConnectionView != null) {
		        this.CurrentConnectionView.model.save({
		            name: serverName,
		            url: serverUrl,
		        });
		        this.CurrentConnectionView.render();
		        this.WireUrlEvents(this.CurrentConnectionView);

		        var isDefault = this.CurrentConnectionView.model.get("isDefault");
		        if (isDefault) this.HighlighConnection(this.CurrentConnectionView, false);
		    }
		},

		ValidateConnection: function () {
		    var serverName = $("#textServerName").val().trim();
		    var url = $("#textUrl").val().trim();

		    if (!this.ValidateEmpty(serverName)) {
		        navigator.notification.alert("Server name is required.", null, "Server Name", "OK");
		        return false;
		    }
		    if (!this.ValidateEmpty(url)) {
		        navigator.notification.alert("Server Url is required.", null, "Server Url", "OK");
		        return false;
		    }
		    if (!this.ValidateURL(url)) {
		        navigator.notification.alert("Server Url is invalid.", null, "Server Url", "OK");
		        return false;
		    }
		    if (!this.ValidateExists("name", serverName)) {
		        navigator.notification.alert("Server name '" + serverName + "' already exists.", null, "Server Name", "OK");
		        return false;
		    }
		    if (!this.ValidateExists("url", serverName)) {
		        navigator.notification.alert("Server url '" + url + "' already exists.", null, "Server Url", "OK");
		        return false;
		    }

		    return true;
		},

		ValidateEmpty: function(value) {
		    return (value != null && value != "");
		},

		ValidateExists: function(nameToCheck, valueToCheck){
		    var self = this;

		    var existingItem = this.urlcollection.find(function (current) {
		        if (nameToCheck == "name") {
		            if (self.tempCurrentServerName.toLowerCase() == valueToCheck.toLowerCase()) return false;
		        }
                else if (nameToCheck == "name") {
                    if (self.tempCurrentServerUrl.toLowerCase() == valueToCheck.toLowerCase()) return false;
		        }

		        var currentValue = current.get(nameToCheck);	        
		        if (currentValue.toLowerCase() === valueToCheck.toLowerCase()) return false;
		    });

		    return (existingItem == null)
		},

		ValidateURL: function (value) {
		    return true;
		    //return  /^(((([a-z]|\d|-|\.|_|~|localhost|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value)
            //    || /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
		},

		WireUrlEvents: function (cartItemView) {
		    var self = this;
		    Shared.AddRemoveHandler('#divIsSelected' + cartItemView.cid, 'tap', function (e) { self.Url_OnSetDefaultConnection(cartItemView); });
		    Shared.AddRemoveHandler('#divItemName' + cartItemView.cid, 'tap', function (e) { self.Url_OnSetDefaultConnection(cartItemView); });
		    Shared.AddRemoveHandler('#buttonShowUrl' + cartItemView.cid, 'tap', function (e) { self.buttonShowUrl_tap(cartItemView); });
		}
	});
	return ConnectionView;
});