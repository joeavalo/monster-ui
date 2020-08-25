(function($) {
	function guid() {
		var result = '';

		for (var i = 0; i < 4; i++) {
			result += (Math.random().toString(16)).substr(2, 8);
		}

		return result;
	}

	$.widget('custom.disableAutoFill', {
		options: {
			validator: function() {
				return true;
			}
		},

		idToName: {},
		idToPassword: {},

		_create: function _create() {
			var widget = this;
			var $form = widget.element;

			// [
			// 	$form,
			// 	$form.find('input[name]')
			// ].forEach(function(el) {
			// 	$(el).prop('autocomplete', 'off');
			// });

			$form.find('input[type="password"]').prop('autocomplete', 'new-password');

			this._obfuscatePasswordInputs();
		},

		_obfuscatePasswordInputs: function _obfuscatePasswordInputs() {
			var widget = this;

			widget.element.find('input[type="password"]').each(function() {
				var $input = $(this);

				$input
					.on('focusin', function() {
						$input.prop('type', 'text');
					})
					.on('focusout', function() {
						$input.prop('type', 'password');
					});
			});
		}
	});
}(jQuery));
