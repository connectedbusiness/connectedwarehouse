/**
 * @author Interprise Solutions
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'view/common/global',
    'view/common/shared',
	'text!template/common/numericpad.tpl.html',

], function ($, _, Backbone,
	Global, Shared,
    NumericPadTemplate) {

    var NumericPadCriteria = {

        IsCloseNumericPad: true,
        NumericPadValue: 1
    }

    var NumericPadView = Backbone.View.extend({
        _template: _.template(NumericPadTemplate),

        events: {            
        },

        buttonEnter_tap: function (e) {

            //-- Code added by dynenttech.com ---
            //-- Task to restrict users to enter more then quanity in numeric pad---
            //--- Task reference https://github.com/connectedbusiness/connectedwarehouse/issues/13------
			
			console.log("localStorage", localStorage);

            if (localStorage.QuantityToPick != undefined && localStorage.QuantityToPick != "") {
				
                if ( parseInt(this.$('#textboxQuantity').val()) > parseInt(localStorage.QuantityToPick)) {
                    navigator.notification.alert("Enter " + localStorage.QuantityToPick + " or less", null, "Remaining Quantity Exceeded", "OK");
                    return;
                } 
            }

            //---------------------------------------------------------------------------------------

            var qty = this.$('#textboxQuantity').val();

            NumericPadCriteria.NumericPadValue = parseFloat(qty.replace(',', ''));

            if (NumericPadCriteria.NumericPadValue == 0) {
                NumericPadCriteria.NumericPadValue = 1;
            }


            this.trigger('quantitychange', NumericPadCriteria);


            if (NumericPadCriteria.IsCloseNumericPad) {
                this.ClearNumericPad();
                this.isFirstNumericPadInput = true;                
            }
            NumericPadCriteria.IsCloseNumericPad = true;
        },

        buttonClear_tap: function (e) {
            this.isFirstNumericPadInput = true;
            this.$('#textboxQuantity').val(0);
        },

        buttonCloseNumericPad_tap: function (e) {


           
            this.isFirstNumericPadInput = true;
            this.trigger('closenumericpad', this);
            $('.numericpad').removeClass('slideInUp').addClass('slideOutDown');
        },

        buttonNegative_tap: function (e) {
            this.ValidateNegativeSign();
        },

        buttonNumOne_tap: function (e) {
            this.UpdateNumericPad(1);
        },

        buttonNumTwo_tap: function (e) {
            this.UpdateNumericPad(2);
        },

        buttonNumThree_tap: function (e) {
            this.UpdateNumericPad(3);
        },

        buttonNumFour_tap: function (e) {
            this.UpdateNumericPad(4);
        },

        buttonNumFive_tap: function (e) {
            this.UpdateNumericPad(5);
        },

        buttonNumSix_tap: function (e) {
            this.UpdateNumericPad(6);
        },

        buttonNumSeven_tap: function (e) {
            this.UpdateNumericPad(7);
        },

        buttonNumEight_tap: function (e) {
            this.UpdateNumericPad(8);
        },

        buttonNumNine_tap: function (e) {
            this.UpdateNumericPad(9);
        },

        buttonNumZero_tap: function (e) {
            this.UpdateNumericPad(0);
        },

        buttonNumBackSpace_tap: function (e) {
            var currentVal = this.$('#textboxQuantity').val();
            var digits = currentVal.length;
            if (digits > 1) {
                /*switch (digits) {
                    case 5:
                    case 9:
                        this.$('#textboxQuantity').val(currentVal.substring(0, digits - 2));
                        break;
                    default:
                        if (currentVal.search("-") == 0) {
                            this.ClearNumericPad();
                        }
                        else {
                            this.$('#textboxQuantity').val(currentVal.substring(0, digits - 1));
                        }
                        break;
                }*/
                var numString = currentVal.replace(/,/g,'');
                if (currentVal.length == 2 && currentVal.search('-') == 0) {
                    this.ClearNumericPad();
                } else {
                    numString = numString.substring(0, numString.length - 1);
                    this.$('#textboxQuantity').val(parseFloat(numString).toLocaleString());
                }
            } else {
                this.ClearNumericPad();
            }
        },        

        initialize: function () {
            this.isFirstNumericPadInput = true;
        },

        render: function () {
            return this.$el.html(this._template());
        },

        ClearNumericPad: function () {
            this.$('#textboxQuantity').val(0);
        },

        FormatValue: function (currentVal, value) {
            /*var digits = currentVal.length;
            if ((digits > 0)) {
                if (currentVal.search("-") == -1) {
                    switch (digits) {
                        case 3:
                        case 7:
                            return currentVal + "," + value;
                        default:
                            return currentVal + value;
                    }
                }
                else {
                    switch (digits) {
                        case 4:
                        case 8:
                            return currentVal + "," + value;
                        default:
                            return currentVal + value;
                    }
                }
            }
            else return currentVal + value;*/
            var numString = (currentVal.length > 0 ? currentVal.replace(/,/g,'') : currentVal);
            return parseFloat(numString + value).toLocaleString();

        },

        SlideDownNumericPad: function () {
            $('.numericpad').addClass('slideOutDown').removeClass('slideInUp');
        },

        UpdateNumericPad: function (value) {
            var currentVal = this.$('#textboxQuantity').val();            
            if (currentVal.length < 11) {
                if (currentVal == "0" || this.isFirstNumericPadInput) currentVal = "";
                this.$('#textboxQuantity').val(this.FormatValue(currentVal, value));
                this.isFirstNumericPadInput = false;
            }
        },

        ValidateNegativeSign: function () {            
            var currentVal = this.$('#textboxQuantity').val();
            if (currentVal != "0" && currentVal.search("-") == -1) {
                this.isFirstNumericPadInput = false;
                this.$('#textboxQuantity').val("-" + currentVal);
            }
            else {
                currentVal = currentVal.replace("-", "");
                this.$('#textboxQuantity').val(currentVal);
            }
        },

        WireNumericPadEvents: function () {
            
            var self = this;
            Shared.AddRemoveHandler('#numOne', 'tap', function (e) { self.buttonNumOne_tap(e); });
            Shared.AddRemoveHandler('#numTwo', 'tap', function (e) { self.buttonNumTwo_tap(e); });
            Shared.AddRemoveHandler('#numThree', 'tap', function (e) { self.buttonNumThree_tap(e); });
            Shared.AddRemoveHandler('#numFour', 'tap', function (e) { self.buttonNumFour_tap(e); });
            Shared.AddRemoveHandler('#numFive', 'tap', function (e) { self.buttonNumFive_tap(e); });
            Shared.AddRemoveHandler('#numSix', 'tap', function (e) { self.buttonNumSix_tap(e); });
            Shared.AddRemoveHandler('#numSeven', 'tap', function (e) { self.buttonNumSeven_tap(e); });
            Shared.AddRemoveHandler('#numEight', 'tap', function (e) { self.buttonNumEight_tap(e); });
            Shared.AddRemoveHandler('#numNine', 'tap', function (e) { self.buttonNumNine_tap(e); });
            Shared.AddRemoveHandler('#numZero', 'tap', function (e) { self.buttonNumZero_tap(e); });
            Shared.AddRemoveHandler('#numBackSpace', 'tap', function (e) { self.buttonNumBackSpace_tap(e); });
            Shared.AddRemoveHandler('#numClear', 'tap', function (e) { self.buttonClear_tap(e); });
            Shared.AddRemoveHandler('#numNegative', 'tap', function (e) { self.buttonNegative_tap(e); });
            Shared.AddRemoveHandler('#numEnter', 'tap', function (e) { self.buttonEnter_tap(e); });
            Shared.AddRemoveHandler('#buttonCloseNumericPad', 'tap', function (e) { self.buttonCloseNumericPad_tap(e); });
        },

    });
    return NumericPadView;
});