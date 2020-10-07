/**
 * @author LJGasque | 05-1-2012
 */
define([
  'model/base'
], function(BaseModel) {
  var CartItem = BaseModel.extend({
	
	
		RaiseItemRemoved : function() {
			this.trigger("itemRemoved", this);
		},
		
        RaiseItemDeleted : function() {
            this.trigger("itemDeleted", this);
        },

        ValidateServiceType: function () {
            if (this.get("ServiceCode") && this.get("ServiceCode") == '(Unspecified)') {
                return false;
            }

            return true;
        },

        ValidateShippingAddress: function () {
            if (this.get("ShipToCountry") == "" || this.get("ShipToCountry") == null) {
                $('#textCountry').parent().addClass('has-error');
                return false;
            } else {
                $('#textCountry').parent().removeClass('has-error');
            }

            if (this.get("ShipToPostalCode") == "" || this.get("ShipToPostalCode") == null) {
                $('#textPostal').parent().addClass('has-error');
                return false;
            } else {
                $('#textPostal').parent().removeClass('has-error');
            }

            if (this.get("ShipToCity") == "" || this.get("ShipToCity") == null) {
                $('#textCity').parent().addClass('has-error');
                return false;
            } else {
                $('#textCity').parent().removeClass('has-error');
            }

            //if (this.get("ShipToCounty") == "" || this.get("ShipToCounty") == null) {
            //    $('#textCounty').parent().addClass('has-error');
            //    return false;
            //} else {
            //    $('#textCounty').parent().removeClass('has-error');
            //}

            if (this.get("ShipToState") == "" || this.get("ShipToState") == null) {
                if(!this.get("IsEuro") == 1) {
                $('#textState').parent().addClass('has-error');
                return false;     
                }
                else {
                 $('#textState').parent().removeClass('has-error');
                }
               
            } else {
                $('#textState').parent().removeClass('has-error');
            }

            if (this.get("ShipToAddress") == "" || this.get("ShipToAddress") == null) {
                $('#textAreaAddress').parent().addClass('has-error');
                return false;
            } else {
                $('#textAreaAddress').parent().removeClass('has-error');
            }

            if (this.get("ShipToPhone") == "" || this.get("ShipToPhone") == null) {
                $('#textPhone').parent().addClass('has-error');
                return false;
            } else {
                $('#textPhone').parent().removeClass('has-error');
            }

            if (this.get("ShipToAddressType") == "" || this.get("ShipToAddressType") == null) {
                $('#buttonAddressType').css('border-color', '#d2322d');
                return false;
            } else {
                $('#buttonAddressType').css('border-color', 'transparent');
            }

            return true;
        },

        ValidateShippingInfo: function () {
            if (this.get("CarrierCode") == "" || this.get("CarrierCode") == null) {                
                return false;            
            }

            if (this.get("CarrierDescription") == "Manual") {
                if (this.get("textManualTrackingNumber") == "" || this.get("TrackingNumber") == null) {
                    $('#textManualTrackingNumber').parent().addClass('has-error');
                    return false;
                }
                // allow zero freight for manual carrier
                // if (this.get("FreightRate") == "" || this.get("FreightRate") == 0) {
                //     $('#textFreightRate').parent().addClass('has-error');
                //     return false;
                // }
            }

            if (this.get("CarrierDescription") != "Manual") {
                if (this.get("ServiceCode") == "" || this.get("ServiceCode") == null) {
                    return false;
                }
            }            

            if (this.get("ShippingMethodCode") == "" || this.get("ShippingMethodCode") == null) {
                return false;
            }            

            if (this.get("CarrierDescription") == "Manual") {
                if (this.get("TrackingNumber") == "" || this.get("TrackingNumber") == null) {
                    return false;
                }
            }

            if (this.get("PackagingCode") == "" || this.get("PackagingCode") == null) {
                    return false;
            }
            
            return true;
        }
  });
  return CartItem;
});