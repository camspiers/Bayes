require.config({
    shim: {
        'jquery.tools': {
            deps: ['jquery'],
            exports: 'jQuery.fn.tooltip'
        },
        d3: {
            exports: 'd3'
        },
        html5slider: {
        }
    },
    baseUrl: ".",
    paths: {
        main: "scripts/main",
        app: "scripts/app",
        underscore: "scripts/lib/underscore",
        jquery: "scripts/lib/jquery",
        text: "scripts/lib/text",
        'jquery.tools': 'scripts/lib/jquery.tools.min',
        html5slider: 'scripts/lib/html5slider',
        d3: 'scripts/lib/d3.v2'
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