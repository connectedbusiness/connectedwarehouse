/**
@module main
@author Interprise Solutions
**/
require.config({
	paths:{
	    jquery: 'libs/jquery.min',
        jqueryhammer: 'libs/jquery.hammer.min',
		bootstrap: 'libs/bootstrap.min',
		bootstrapSwitch: 'libs/bootstrap-switch',
		base64 : 'libs/webtoolkit.base64',
		bigdecimal: 'libs/BigDecimal-all-last.min',
        backbone: 'libs/backbone-min',     
		localstorage : 'libs/backbone.localStorage',
		underscore : 'libs/underscore-min',
		text: 'libs/text',		
		template: '../template',
		toastr: 'libs/toastr.min'
	},
	"shim": {
	    jqueryhammer: ["jquery"],
	    bootstrap : ["jquery"],
	    bootstrapSwitch: ["jquery", "bootstrap"]
	}
});
require([  
  'router'
], function(Router){
	if (!navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
        navigator.__proto__.notification = { 

            alert: function (msg, ereceiver, title, buttons) {
                var isBrowser = !(navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/));

                if (isBrowser) {
                    alert(msg);
                }
                else {
                    navigator.notification.alert(msg, ereceiver, title, buttons);
                }
            },

            confirm: function (msg, ereceiver, title, buttons) {
                var isBrowser = !(navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/));

                if (isBrowser) {
                    var answer = confirm(msg);
                    if (answer) {
                        ereceiver(1);
                    }
                    else {
                        ereceiver(0);
                    }
                }
                else {
                    navigator.notification.alert(msg, ereceiver, title, buttons);
                }
            },
        }
}
  Router.initialize();
});