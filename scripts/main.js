require.config({
    baseUrl: ".",
    paths: {
        main: "scripts/main",
        app: "scripts/app",
        underscore: "scripts/lib/underscore",
        jquery: "scripts/lib/jquery",
        text: "scripts/lib/text"
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