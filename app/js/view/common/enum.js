define(
	function () {
	    var Enum = {
	        LookupMode: {
	            Default: 0,
	            Pack: 1,
	            Pick: 2,
	            Receive: 3,
	            Stock: 4,
	            Box: 5,
	            Shipment: 6,
	            ShippingAddress: 7,
	            Transfer: 8,
	            StockTakeItemCount: 9,
	            StockTakeMiscPhys: 10,
                Adjustment: 11,
	        },

	        Adjustment: {
	            Out: 0,
	            In: 1
	        },

	        CompareVersion: {
	            Equal: 0,
	            GreaterThanOrEqual: 1,
	            LessThanOrEqual: 2,
	            GreaterThan: 3,
	            LessThan: 4,
	            NotEqual: 5
	        },

	        ImageType: {
	            CartItem: 0,
	            Card: 1,
	            Label: 2,
	            ReceiveLabel: 3
	        },

	        Template: {
	            Default: 0,
	            ItemRemaining: 1,
	            ItemSetting: 2,
	            Complete: 3,
	            TransferDetail: 4,
	            Setting: 5,
	            CheckList: 6,
	            Transfer: 7,
	            NewStock: 8,
	            Stock: 9,
	            StockLookup: 10,
	            FeaturePreference: 11,
	        },

	        ListMode: {
	            Workstations: 0,
                DefaultLocations: 1,
	            FromLocation: 2,
	            ToLocation: 3,
	            FromZone: 4,
	            ToZone: 5,
	            UM: 6,
	            PickPreference: 7,
	            PackPreference: 8,
	            ReceivePreference: 9,
	            StockPreference: 10,
	            TransferPreference: 11,
	            AdjustmentPreference: 12,
	            LabelPreference: 13,
	            PhysicalInventoryPreference: 14,
	            ItemImagesPreference: 15,
	            WebSite: 16,
	            PrePackPreference: 17,
	            Carriers: 18,
	            ServiceTypes: 19,
                Boxes: 20,
	        }
	    }

	    return Enum;
	}
);