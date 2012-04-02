require(["bayes"], function(bayes) {
    $(function() {
    	(new bayes).init({
    		selector: "#simple",
    		type: 'simple'
    	});
    	(new bayes).init({
    		selector: "#full",
    		type: 'full',
    		styles: false
    	});
        (new bayes).init({
            selector: "#simple-multi",
            type: 'simple',
            styles: false,
            num: 3
        });
    });
});