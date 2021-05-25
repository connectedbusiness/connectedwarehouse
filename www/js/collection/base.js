define([
  	'base64',  	
  	'backbone',
  	'view/common/global'
], function(base64, Backbone,
	Global) {
	var EncodeAuth = function(user,pass)
    {
       var _tok = user + ':' + pass;
       var _hash = Base64.encode(_tok);
       return "Basic "+ _hash;
    };
                                            
	var sendAuthorization = function (xhr) {
		var auth = EncodeAuth(Global.CurrentUser.UserCode, Global.CurrentUser.Password);
		xhr.setRequestHeader('Authorization', auth)
		xhr.setRequestHeader('ProductType', Global.ProductType);
	};
    
	var Collection = Backbone.Collection.extend({
		fetch: function(options) {
			options || (options = {});
			if (options.timeout == null) {
				//set default timeout to 30 seconds
				options.timeout = 60000;				
			}      
  			options.beforeSend = sendAuthorization;
 
 			var isConnected = this.CheckInternet();
 			
  			if( isConnected != 'No network connection' ){
  			    if (!Global.IsBrowserMode) this.IntializeNetworkIndicator();

                this.HandleError(options);

  				Backbone.Collection.prototype.fetch.call(this, options);
  			}else{  				
  				if(options.isLocalStorage == undefined || !options.isLocalStorage){
  					var xhr = Backbone.Collection.prototype.fetch.call(this, options);
    				xhr.abort();
    				return xhr;
  				}else{
  					if(!Global.IsBrowserMode) this.IntializeNetworkIndicator();
  					Backbone.Collection.prototype.fetch.call(this, options);
  				}

  			}
  		},
  		paginate : function(perPage, page, remaining){
			page = page-1;
			var collection = this;
			 if(remaining < perPage){
				collection = _(collection.rest(perPage*page));
				collection = _(collection.last(perPage));
			 }else{
				collection = _(collection.rest(perPage*page));
				collection = _(collection.first(perPage));
			}
			return collection.map( function(model){
				 return model
			});
		},
		
		CheckInternet : function() {
	    	if( navigator.connection != undefined ){
			try	{
				var connection = Connection || {};
				if (connection !=undefined && connection != null) {
				var networkState = navigator.connection.type;
					var states = {};
					states[Connection.UNKNOWN]  = 'Unknown connection';
					states[Connection.ETHERNET] = 'Ethernet connection';
					states[Connection.WIFI]     = 'WiFi connection';
					states[Connection.CELL_2G]  = 'Cell 2G connection';
					states[Connection.CELL_3G]  = 'Cell 3G connection';
					states[Connection.CELL_4G]  = 'Cell 4G connection';
					states[Connection.NONE]     = 'No network connection';
					return this.connectionType = states[networkState];
				 }
		     } catch(error) {}
	    	return false;
	    	}
	    	else {
	    		
	    		Global.IsBrowserMode = true;
	    		return this.connectionType = "Browser Mode";
	    	}
	    	
		},

		HandleError: function (options) {
		    var success = options.success;
		    var error = options.error;
		    var progress = options.progress;
		    var self = this;

		    options.success = function (model, response, options) {                
		        var hasError = false;

		        if (progress != null) progress.HideProgress();
		        if (response != null && response.ErrorMessage != undefined) {
		            self.RequestError(null, null, response.ErrorMessage);
		            hasError = true;
		        }
		        if (success) {
		            if (model instanceof Backbone.Model) model.set({ hasError: hasError });
		            success(model, response, options);
		        }
		    }

		    options.error = function (model, exception, response) {		        
		        if (progress != null) progress.HideProgress();
		        if (response != null && response.ErrorMessage != undefined) {		            
		            self.RequestError(null, null, response.ErrorMessage);
		        }
		        if (error) error(model, exception, response);
		    }
		},
	    
		RequestError: function (exception, title, message) {
		    if (!message) message = "The remote server returned an error.";

		    if (exception != undefined) {
		        switch (exception.statusText) {
		            case "timeout":
		                navigator.notification.alert("Request timed out. Check internet settings and try again.", null, title, "OK");
		                break;
		            case "abort":
		                navigator.notification.alert("Unable to process request. Please check your internet settings.", null, title, "OK");
		                break;
		            default:
		                navigator.notification.alert(exception.message, null, title, "OK");
		                break;
		        }
		    }
		    else {
		        if (!message) message = "The remote server returned an error.";
		        navigator.notification.alert(message, null, title, "OK");
		    }
		},
	   
	   IntializeNetworkIndicator : function() {
	    	if(!window.plugins){
	        	window.plugins = {};
		  			
	        }else{
	        	window.plugins.cbNetworkActivity = cordova.require("cordova/plugin/cbNetworkActivity");
	        	window.plugins.cbNetworkActivity.ShowIndicator();                          
	       }
	   }
  });
  return Collection;
});

