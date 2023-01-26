define(
	function() {
	    var Global = {
	        ApplicationType: "Adjustment",
	        CurrentLocation: "MAIN",
	        CurrentUser: {
	            UserCode: '',
	            RoleCode: '',
	            Password: '',
	            UnitMeasureSystem: ''
	        },
	        CurrentTransactions: null,
	        DemoServiceUrl: "http://cbdemo.connectedbusiness.com/POS23/Webservice/",
            IsBrowserMode : true,
            IsPrePackMode: false,
            ServiceUrl: "",
            StockMode: "Stock",            
            PackMode: "Pack", 
            PreviousPage: "",
	        PrintPluginLoaded: false,
	        Plugins : {	            
	            AirPrinter : "com.connectedbusiness.plugins.airprinter.AirPrinter"	            
	        },
	        ProductType: "Connected Warehouse",
	        TransactionCode: "",
	        TemporaryDocumentCode: "[To be generated]",
	        WorkstationID: "Warehouse1",
	        Version14:  "19.0.0.0",
	        Versions: {
	            MinimumVersion: { Major: 23, Minor: 0, Build: 8411, Revision: 0 },
	            Version: { Major: 23, Minor: 0, Build: 8411, Revision: 0},
	            CurrentVersion: { Major: 23, Minor: 0, Build: 8411, Revision: 0
                }
            },
            ScreenWidth: 0
	    }
    		
		return Global;
	}
);