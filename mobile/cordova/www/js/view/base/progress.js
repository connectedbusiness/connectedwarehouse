define([
    'jquery',
	'underscore',
    'backbone',
    'model/cartItem',
    'view/common/global',
    'text!template/common/progress.html',
], function ($, _, Backbone,
    CartItem,
    Global,
    ProgressTempalte) {
    
    var ProgressView = Backbone.View.extend({
        _progressTempalte: _.template(ProgressTempalte),
        
        render: function () {
            this.model = new CartItem();
            this.model.set({ Caption: this.options });
            return this.$el.html(this._progressTempalte(this.model.toJSON()));
        },

        ShowProgres: function (isFullScreen) {
            if (isFullScreen) {
                $("#progressContainer").removeClass("progress-bodyscreen").addClass("progress-fullscreen");
            }
            else {
                $("#progressContainer").removeClass("progress-fullscreen").addClass("progress-bodyscreen");
            }

            $("#progressContainer").show();
            $("input").prop("disabled", true); // disable all input controls while progress is shown

            if (this.spinner == null) {                
                this.spinner = new Spinner();
            }
            var target = document.getElementById('progressContainer');
            this.spinner.spin(target);
        },

        HideProgress: function () {
            if (this.spinner != null) {
                this.spinner.stop();
            }
            $("#progressContainer").hide();
            $("input").prop("disabled", false); // enable all input controls if progress is not shown
        }
    });
    return ProgressView;
});