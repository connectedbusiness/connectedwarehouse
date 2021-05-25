/**
 * @author LJGasque | 05-1-2012
 */
define([  
  'collection/base',
  'model/cartItem'
], function(BaseCollection, CartItemModel) {
  var Cart = BaseCollection.extend({
  	model : CartItemModel,
  	initialize: function(){
   	}
  });
  return Cart;
});