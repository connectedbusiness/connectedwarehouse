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
		    DemoServiceUrl: "http://data.connectedbusiness.com/Demo_CB18/POS/WebService/",
	        // DemoServiceUrl: "http://data.connectedbusiness.com/demo/pos17/",
	        //DemoServiceUrl: "http://webservices.connectedbusiness.com/CBPOS_14_0_1/",
	        //DemoServiceUrl: "http://webservices.connectedbusiness.com/CW/",
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
	        
	        Version14:  "18.0.0.0",
	        Versions: {
	            MinimumVersion: { Major: 18, Minor: 2, Build: 6534, Revision: 0 },
	            Version: { Major: 18, Minor: 2, Build: 6534, Revision: 0},
	            CurrentVersion: { Major: 18, Minor: 2, Build: 6534, Revision: 0
                }
            },
            ScreenWidth: 0
	    }
    		
		return Global;
	}
);