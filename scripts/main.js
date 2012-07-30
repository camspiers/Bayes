requirejs.config({
    baseUrl: 'scripts/lib',
    paths: {
        app: '../app'
    }
});

require(["jquery", "app/bayes"], function($, bayes) {
    $(function() {
        $('.bayes-calc').each(function () {
            var $this = $(this);
            (new bayes).init($.extend({
                el: $this
            }, $this.data('config')));
        });
    });
});