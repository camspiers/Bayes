(function ($, document) {

	var hashlink = {

		find: function (find, options) {

			options = $.extend(
				{
					split: '&',
					equal: '/'
				},
				options
			);

			var result = {};

			if (document.location.hash) {

				var parts = document.location.hash.replace('#', '').split(options.split);

				for (var i in parts) {

					if (parts.hasOwnProperty(i)) {

						var el = parts[i].split(options.equal);

						if (el[0] !== undefined && $.inArray(el[0], find) !== -1) {

							result[el[0]] = el[1];

						}

					}

				}

			}

			return result.length !== 0 ? result : undefined;
			
		},

		change: function(parts, options) {

			options = $.extend(
				{
					split: '&',
					equal: '/'
				},
				options
			);

			var hash = [];
			var hashpartsArray = document.location.hash !== '' ? document.location.hash.replace('#', '').split(options.split) : [];
			var hashparts = {};

			for (var i in hashpartsArray) {

				if (hashpartsArray.hasOwnProperty(i)) {

					var part = hashpartsArray[i].split(options.equal);

					hashparts[part[0]] = part[1];

				}

			}

			for (var i in parts) {

				if (parts.hasOwnProperty(i)) {

					if (!_.isString(parts[i])) {

						parts[i] = $(parts[i]).serializeObject();

					}

				}

			}

			parts = $.extend(
				hashparts,
				parts
			);

			console.log(parts);

			for (var j in parts) {
				
				if (parts.hasOwnProperty(j) && parts[j] !== false) {

					hash.push(j + options.equal + parts[j]);
					
				}

			}

			document.location.hash = '#' + hash.join(options.split);

		},

		monitor: function (config, findOptions) {

			$(window).bind('hashchange', function (event) {

				var i;

				for (i in config) {

					if (config.hasOwnProperty(i)) {

						config[i]($.hashlinkfind([i], findOptions)[i]);

					}

				}

			});

		}

	};

	window.hashlink = hashlink;

}(jQuery, document));