/**
 * @author Interprise Solutions
 */
define(
	function() {
	    var MethodName = {	        
	        ADJUSTINVENTORYITEMS: "adjustinventoryitems/",
	        ASSIGNITEMBINLOCATION: "assignitembinlocation/",
	        BINLOCATIONLOOKUP: "binlocationlookup/",
	        COUNTRYCODELOOKUP: "countrycodelookup/",
            CARRIERLOOKUP: "carrierlookup/",
			CARRIERPACKAGINGLOOKUP: "carrierpackaginglookup/",
			CREATEBINLOCATION: "createbinlocation/",
			CREATERECEIVEORDER: "createreceiveorder/",
			CREATESHIPMENT: "createshipment/",
			CREATESTOCKTAKE: "createstocktake/",
			DELETEBINLOCATION: "deletebinlocation/",
			DELETEITEMBINLOCATION: "deleteitembinlocation/",
			DELETELABELIMAGES: "deletelabelimages?",
			DELETESHIPMENTDETAIL: "deleteshipmentdetail/",
			DELETEWAREHOUSEPREFERENCE: "deletewarehousepreference/",
			GETSHIPMENTDETAIL: "getshipmentdetail/",
			GETSHIPMENTLABELFILENAMEBYTRANSACTIONCODE: "getshipmentlabelfilenamebytransactioncode/",
			ECOMMERCESITELOOKUP: "ecommercesitelookup/",
			GETWAREHOUSEPREFERENCEBYWORKSTATION: "getwarehousepreferencebyworkstation/",
			HASPOSTPONEDSTOCKTAKE: "haspostponedstocktake/",
			FORCESIGNOUT: "forcesignout/",
			ISSERIALEXIST: "isserialexist?",
			ISPURCHASEITEMSERIALEXIST: "ispurchaseitemserialexist?",
			LOADDUEANDOVERDUEITEMS: "loaddueandoverdueitems/",
			LOADDUEANDOVERDUEITEMCODES: "loaddueandoverdueitemcodes/",
			LOADINVENTORYITEMBINLOCATIONBYLOCATIONCODE: "loadinventoryitembinlocationbylocation/",
			LOADITEMBYUPC: "loaditembyupc?",						
			LOADGOODSRECEIVELOOKUP: "loadgoodsreceivelookup/",
			LOADPACKITEMS : "loadpackitems/", 
			LOADPICKITEMS: "loadpickitems/",
			LOADLOCATIONLOOKUP: "getlocationlookup/",
			LOADWAREHOUSEPREFERENCELOOKUP: "loadwarehousepreferencelookup/",
			LOADRECEIVEITEMS: "loadreceiveitems/",
			LOADSHIPMENTDETAILS: "loadshipmentdetails/",
			LOADSTOCKTAKELOCATIONITEMVIEWBYUPC: "loadstocktakelocationitemviewbyupc/",
			LOADSTOCKFROMTOLOCATIONLOOKUP: "loadstockfromtolocationlookup/",
			LOADSTOCKFROMTOZONELOOKUP: "loadstockfromtozonelookup/",
			LOADSTOCKSTOTRANSFER: "loadstockstotransfer/",
			LOADWAREHOUSESTOCKTAKEBYUSERCODE: "loadwarehousestocktakebyusercode/",
			PACKTRANSACTIONLOOKUP: "packtransactionlookup/",
			PICKTRANSACTION: "picktransaction/",
			PICKTRANSACTIONLOOKUP: "picktransactionlookup/",			
			POSTPONEWAREHOUSESTOCKTAKE: "postponewarehousestocktake/",
			RECEIVELOOKUP: "receivelookup/",
	        SERVICETYPELOOKUP: "servicetypelookup/",
			SIGNIN: "signin?isFromAutoSignIn=false",
			SIGNOUT: "signout/",
			SHIPMENTLOOKUP: "shipmentlookup/",
			TRANSFERSTOCKITEMS: "transferstockitems/",
            UPDATEBINITEMSORTORDER: "updatebinitemsortorder/",
			UPDATEWAREHOUSEPREFERENCE: "updatewarehousepreference/",			
			UNITMEASURECODELOOKUP: "unitmeasurecodelookup/",
			ZIPCODELOOKUP: "zipcodelookup/"
		}
		
		return MethodName;
	}
);