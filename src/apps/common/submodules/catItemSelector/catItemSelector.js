define(function() {
	return {
		subscribe: {
			'common.catItemSelector.render': 'catItemSelectorRender'
		},

		/**
		 * @param  {Object} args
		 * @param  {Object} [args.choices]
		 * @param  {Object} [args.existing]
		 * @param  {Boolean} [args.isEditable=false]
		 * @param  {Object} [args.i18n]
		 * @param  {Function} [args.normalizer]
		 * @param  {Function} [args.onSelect]
		 * @param  {Function} [args.onCancel]
		 * @param  {Function} [args.onClose]
		 */
		catItemSelectorRender: function(args) {
			var self = this,
				choices = _.get(args, 'choices', []),
				isEditable = _.isEmpty(choices) ? true : _.get(args, 'isEditable', false),
				existing = _.get(args, 'existing', _.transform(choices, function(object, catData) {
					_.set(object, catData.id, _.map(catData.items, 'id'));
				}, {})),
				$template = $(self.getTemplate({
					name: 'layout',
					data: {
						i18nCustom: _.get(args, 'i18n', {}),
						choices: choices,
						isEditable: isEditable
					},
					submodule: 'catItemSelector'
				})),
				dialog = monster.ui.dialog($template, {
					autoScroll: false,
					title: _.get(args, 'i18n.title', self.i18n.active().catItemSelector.title),
					onClose: args.onClose
				});

			self.catItemSelectorBindEvents({
				container: dialog,
				existing: existing,
				normalizer: _.get(args, 'normalizer', _.snakeCase),
				onSelect: args.onSelect,
				onCancel: args.onCancel
			});
		},

		catItemSelectorBindEvents: function(args) {
			var self = this,
				$container = args.container,
				$form = $container.find('#cat_item_selector_form'),
				normalizer = args.normalizer,
				onSelect = args.onSelect,
				onCancel = args.onCancel,
				existing = args.existing,
				$newCategoryInput = $container.find('input[name="newCategoryId"]'),
				$newItemInput = $container.find('input[name^="newItemId."]'),
				$selectButton = $container.find('.js-select'),
				ruleCommon = {
					normalizer: _.unary(normalizer)
				};

			monster.ui.validate($form, {
				rules: _.merge({
					newCategoryId: _.merge({
						checkList: _.keys(existing)
					}, ruleCommon)
				}, _.transform(existing, function(obj, items, category) {
					obj['newItemId.' + category] = _.merge({
						checkList: items
					}, ruleCommon);
				}, {}))
			});

			$container
				.find('input[name="categoryId"]')
					.on('change', function(event) {
						event.preventDefault();

						var selectedCategoryId = $(this).val();

						$container.find('.sub-category-wrapper').hide();
						$newItemInput.hide();
						$selectButton.prop('disabled', 'disabled');
						$container.find('input[name="itemId"]').prop('checked', false);

						if (_.isEmpty(selectedCategoryId)) {
							$newCategoryInput.slideDown(100, function() {
								$(this).focus();
							});
						} else {
							$newCategoryInput
								.slideUp(100)
								.val('');
							$newItemInput.val('');
							$container
								.find('.sub-category-wrapper[data-category="' + selectedCategoryId + '"]')
									.slideDown(100);
						}
					});

			$container
				.find('input[name="newCategoryId"]')
					.on('keyup input', _.debounce(function(event) {
						event.preventDefault();

						var newCategoryId = normalizer(monster.ui.getFormData('cat_item_selector_form').newCategoryId),
							$emptyCategoryWrapper = $container.find('.sub-category-wrapper[data-category=""]');

						if (_.isEmpty(newCategoryId) || _.has(existing, newCategoryId)) {
							$container.find('.sub-category-wrapper').hide();
							$newItemInput.val('');
						} else if (!$emptyCategoryWrapper.is(':visible')) {
							$emptyCategoryWrapper.slideDown(100, function() {
								$emptyCategoryWrapper.find('input[name="itemId"]').click();
							});
						}
						monster.ui.valid($form);
					}, 250));

			$container
				.find('input[name="itemId"]')
					.on('change', function(event) {
						event.preventDefault();

						var selectedItemId = $(this).val();

						$selectButton.prop('disabled', _.isEmpty(selectedItemId) ? 'disabled' : false);

						if (_.isEmpty(selectedItemId)) {
							$newItemInput.slideDown(100, function() {
								$(this).focus();
							});
						} else {
							$newItemInput
								.slideUp(100)
								.val('');
						}
					});

			$container
				.find('input[name^="newItemId."]')
					.on('keyup input', function(event) {
						event.preventDefault();

						var formData = monster.ui.getFormData('cat_item_selector_form'),
							newCategoryId = _.isEmpty(formData.categoryId)
								? normalizer($newCategoryInput.val())
								: formData.categoryId,
							newItemId = normalizer($(this).val()),
							alreadyExists = _.has(existing, newCategoryId) && _.includes(existing[newCategoryId], newItemId);

						if (_.isEmpty(newItemId) || alreadyExists) {
							$selectButton.prop('disabled', 'disabled');
						} else if (!_.isEmpty(newItemId) && !alreadyExists) {
							$selectButton.prop('disabled', false);
						}
						monster.ui.valid($form);
					});

			$container
				.find('.js-cancel')
					.on('click', function(event) {
						event.preventDefault();

						onCancel && onCancel();

						$container.dialog('close');
					});

			$container
				.find('#cat_item_selector_form')
					.on('submit', function(event) {
						event.preventDefault();

						var formData = monster.ui.getFormData('cat_item_selector_form'),
							category = _.isEmpty(formData.newCategoryId)
								? formData.categoryId
								: normalizer(formData.newCategoryId),
							isCategoryNew = !_.has(existing, category),
							newItemInputValue = _.get(formData, [
								'newItemId',
								isCategoryNew ? '' : category
							]),
							item = _.isEmpty(formData.itemId)
								? normalizer(newItemInputValue)
								: formData.itemId;

						onSelect && onSelect([category, item]);

						$container.dialog('close');
					});
		}
	};
});
