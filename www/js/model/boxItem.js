define([
  'model/cartItem',
  'collection/cart'
], function(CartItem, CartCollection) {
  var BoxItem = CartItem.extend({
  	
		parse: function(response) {
		    response.cartCollection = new CartCollection(response.cartCollection);
		    return response;
		},

		RaiseBoxDeleted: function () {
		    this.trigger("boxDeleted", this);
		},

		RaiseBoxError: function () {
		    this.trigger("boxError", this);
		},

		RaiseBoxValidated: function () {
		    this.trigger("boxValidated", this);
		},
  });
  return BoxItem;
});