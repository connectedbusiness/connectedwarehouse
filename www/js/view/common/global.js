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
	        DemoServiceUrl: "https://data.connectedbusiness.com/pos24/webservice/",
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
	            MinimumVersion: { Major: 20, Minor: 0, Build: 7458, Revision: 1 },
	            Version: { Major: 24, Minor: 0, Build: 9002, Revision: 1 },
	            CurrentVersion: { Major: 24, Minor: 0, Build: 9002, Revision: 1
                }
            },
            ScreenWidth: 0
	    }
    		
		return Global;
	}
);