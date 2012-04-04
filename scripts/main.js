require(["jquery", "bayes"], function($, bayes) {
    $(function() {
        $('.bayes-calc').each(function () {
            var $this = $(this);
            (new bayes).init($.extend({
                el: $(this)
            }, $this.data('config')));
        });
    });
});