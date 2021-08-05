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
            //DemoServiceUrl: "http://cbdemo.connectedbusiness.com/pos21/",
            DemoServiceUrl: "http://data.connectedbusiness.com/demo/pos17/",
            //DemoServiceUrl: "http://webservices.connectedbusiness.com/CBPOS_14_0_1/",
            //DemoServiceUrl: "http://webservices.connectedbusiness.com/CW/",
            IsBrowserMode: true,
            IsPrePackMode: false,
            ServiceUrl: "",
            StockMode: "Stock",
            PackMode: "Pack",
            PreviousPage: "",
            PrintPluginLoaded: false,
            Plugins : {
                //AirPrinter : "com.connectedbusiness.plugins.airprinter.AirPrinter"
            },
            ProductType: "Connected Warehouse",
            TransactionCode: "",
            TemporaryDocumentCode: "[To be generated]",
            WorkstationID: "Warehouse1",

            Version14: "19.0.0.0",
            Versions: {
                MinimumVersion: { Major: 19, Minor: 0, Build: 6914, Revision: 0 },
                Version: { Major: 20, Minor: 1, Build: 7508, Revision: 2 },
                CurrentVersion: { Major: 20, Minor: 1, Build: 7508, Revision: 2 }
            },
            ProductType: "Connected Warehouse",
            TransactionCode: "",
            TemporaryDocumentCode: "[To be generated]",
            WorkstationID: "Warehouse1",

            Version14: "19.0.0.0",
            Versions: {
                MinimumVersion: { Major: 19, Minor: 0, Build: 6914, Revision: 0 },
                // Version: { Major: 19, Minor: 1, Build: 7031, Revision: 0},
                // CurrentVersion: { Major: 19, Minor: 1, Build: 7031, Revision: 0
                Version: { Major: 20, Minor: 1, Build: 7508, Revision: 2 },
                CurrentVersion: { Major: 20, Minor: 1, Build: 7508, Revision: 2 }
        },
        ScreenWidth: 0
}

return Global;
});
