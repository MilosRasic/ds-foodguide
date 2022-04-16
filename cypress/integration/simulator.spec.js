function shouldHaveModeToggles(togglesLayout) {
	return toggles => {
		togglesLayout.forEach(toggleDef => {
			cy.wrap(toggles).find(`[data-mode="${toggleDef.mode}"]`).should(toggle => {
				expect(toggle).to.have.lengthOf(1);

				if (toggleDef.enabled) {
					expect(toggle).to.have.class('enabled');
				}
				else {
					expect(toggle).to.not.have.class('enabled');
				}
			});
		});
	};
}

describe('Simulator', () => {
	beforeEach(() => {
		cy.visit('http://localhost:3000');

		// because the app saves menu state to local storage on beforeunload
		// we have to clear it in beforeload so that we can have pristine state for each test case
		cy.on('window:before:load', () => {
			localStorage.clear();
		});
	});

	it('shows the blank simulator screen by default', () => {
		cy.log('Checking game mode toggles');
		cy.get('#navbar .mode').then(shouldHaveModeToggles([
			{mode: 'vanilla', enabled: true},
			{mode: 'giants', enabled: true},
			{mode: 'shipwrecked', enabled: true},
			{mode: 'hamlet', enabled: true},
			{mode: 'together', enabled: false},
			{mode: 'warly', enabled: false},
		]));

		cy.log('Checking main nav menu');
		cy.get('[data-tab="simulator"]').should(item => {
			expect(item).to.have.lengthOf(1);
			expect(item).to.have.class('selected');
		});
		cy.get('[data-tab="discovery"]').should(item => {
			expect(item).to.have.lengthOf(1);
			expect(item).to.not.have.class('selected');
		});
		cy.get('[data-tab="foodlist"]').should(item => {
			expect(item).to.have.lengthOf(1);
			expect(item).to.not.have.class('selected');
		});
		cy.get('[data-tab="crockpot"]').should(item => {
			expect(item).to.have.lengthOf(1);
			expect(item).to.not.have.class('selected');
		});
		cy.get('[data-tab="statistics"]').should(item => {
			expect(item).to.have.lengthOf(1);
			expect(item).to.not.have.class('selected');
		});
		cy.get('[data-tab="help"]').should(item => {
			expect(item).to.have.lengthOf(1);
			expect(item).to.not.have.class('selected');
		});

		cy.log('Checking search');
		cy.get('#simulator').within(() => {
			cy.get('.searchselector').should(searchSelector => {
				expect(searchSelector).to.have.lengthOf(1);
				expect(searchSelector).to.have.class('retracted');
				expect(searchSelector).to.contain.text('name');
			});
			cy.get('.ingredientpicker').should(search => {
				expect(search).to.have.lengthOf(1);
				expect(search).to.have.value('');
			});
			cy.get('.toggleingredients').should(toggle => {
				expect(toggle).to.have.lengthOf(1);
				expect(toggle).to.have.text('Icons only');
			});
			cy.get('.clearingredients').should(clearButton => {
				expect(clearButton).to.have.lengthOf(1);
			});
			cy.get('.ingredientdropdown').should(ingredients => {
				expect(ingredients).to.have.lengthOf(1);
				expect(ingredients).to.not.be.empty;
			});
			cy.get('.ingredientdropdown .item .text').should(ingredientNames => {
				expect(ingredientNames).to.be.visible;
			});

			cy.log('Checking recipe slots and results area');
			cy.get('#ingredients').should(recipe => {
				expect(recipe).to.have.lengthOf(1);

				const ingredients = recipe.children();

				expect(ingredients).to.have.lengthOf(4);
				ingredients.each(i => {
					expect(ingredients[i]).to.have.attr('data-id', 'null');
					expect(ingredients[i]).to.be.empty
				});
			});
			cy.get('#results').should(results => {
				expect(results).to.have.lengthOf(1);
			});
		});

		cy.log('Checking results');
		cy.get('#results .links:first tr').should(results => {
			expect(results).to.have.lengthOf(3);
			expect(results.find('tr.highlighted')).to.not.exist;
		});

		cy.get('#results .links:nth-child(2) tr').should(suggestions => {
			expect(suggestions).to.not.exist;
		});
	});

	it('leaves only vanilla on when vanilla mode toggle is clicked', () => {
		cy.get('[data-mode="vanilla"]').click();

		cy.get('#navbar .mode').then(shouldHaveModeToggles([
			{mode: 'vanilla', enabled: true},
			{mode: 'giants', enabled: false},
			{mode: 'shipwrecked', enabled: false},
			{mode: 'hamlet', enabled: false},
			{mode: 'together', enabled: false},
			{mode: 'warly', enabled: false},
		]));
	});

	it('leaves only vanilla and RoG on when RoG mode toggle is clicked', () => {
		cy.get('[data-mode="giants"]').click();

		cy.get('#navbar .mode').then(shouldHaveModeToggles([
			{mode: 'vanilla', enabled: true},
			{mode: 'giants', enabled: true},
			{mode: 'shipwrecked', enabled: false},
			{mode: 'hamlet', enabled: false},
			{mode: 'together', enabled: false},
			{mode: 'warly', enabled: false},
		]));
	});

	it('leaves only vanilla, RoG and Shipwrecked on when RoG mode toggle is clicked', () => {
		cy.get('[data-mode="shipwrecked"]').click();

		cy.get('#navbar .mode').then(shouldHaveModeToggles([
			{mode: 'vanilla', enabled: true},
			{mode: 'giants', enabled: true},
			{mode: 'shipwrecked', enabled: true},
			{mode: 'hamlet', enabled: false},
			{mode: 'together', enabled: false},
			{mode: 'warly', enabled: false},
		]));
	});

	it('leaves only vanilla, RoG, Shipwrecked and Hamlet on when Hamlet mode toggle is clicked', () => {
		cy.get('[data-mode="hamlet"]').click();

		cy.get('#navbar .mode').then(shouldHaveModeToggles([
			{mode: 'vanilla', enabled: true},
			{mode: 'giants', enabled: true},
			{mode: 'shipwrecked', enabled: true},
			{mode: 'hamlet', enabled: true},
			{mode: 'together', enabled: false},
			{mode: 'warly', enabled: false},
		]));
	});

	it('leaves only vanilla, RoG and DST on when DST mode toggle is clicked', () => {
		cy.get('[data-mode="together"]').click();

		cy.get('#navbar .mode').then(shouldHaveModeToggles([
			{mode: 'vanilla', enabled: true},
			{mode: 'giants', enabled: true},
			{mode: 'shipwrecked', enabled: false},
			{mode: 'hamlet', enabled: false},
			{mode: 'together', enabled: true},
			{mode: 'warly', enabled: false},
		]));
	});

	it('leaves only vanilla, RoG, Shipwrecked and Warly on when Warly mode toggle is clicked', () => {
		cy.get('[data-mode="warly"]').click();

		cy.get('#navbar .mode').then(shouldHaveModeToggles([
			{mode: 'vanilla', enabled: true},
			{mode: 'giants', enabled: true},
			{mode: 'shipwrecked', enabled: true},
			{mode: 'hamlet', enabled: false},
			{mode: 'together', enabled: false},
			{mode: 'warly', enabled: true},
		]));
	});

	it('toggles a mode on and off when it is right-clicked', () => {
		const togglesDef = [
			{mode: 'vanilla', enabled: true},
			{mode: 'giants', enabled: true},
			{mode: 'shipwrecked', enabled: true},
			{mode: 'hamlet', enabled: true},
			{mode: 'together', enabled: false},
			{mode: 'warly', enabled: false},
		];

		const randomToggleIndex = Cypress._.random(0, togglesDef.length - 1);
		togglesDef[randomToggleIndex].enabled = !togglesDef[randomToggleIndex].enabled;

		cy.get(`[data-mode="${togglesDef[randomToggleIndex].mode}"]`).rightclick();

		cy.get('#navbar .mode').then(shouldHaveModeToggles(togglesDef));
	});

	it('can search for a an ingredient by name', () => {
		cy.get('#simulator').within(() => {
			cy.get('.ingredientdropdown .item').then(ingredients => {
				return Cypress._.sample(ingredients.toArray());
			}).then(randomIngredient => {
				cy.get('.ingredientpicker').type(randomIngredient.find('.text').text());

				expect(cy.get(`.ingredientdropdown [data-id="${randomIngredient.attr('data-id')}"]`)).to.exist;
			});
		});
	});

	it('adds an ingredient to the recipe when clicked and populates the results', () => {
		cy.get('#simulator').within(() => {
			cy.get('.ingredientdropdown .item').then(ingredients => {
				return Cypress._.sample(ingredients.toArray());
			}).then(randomIngredient => {
				cy.wrap(randomIngredient).click();

				cy.get('#ingredients .ingredient:first').should(firstIngredient => {
					expect(firstIngredient).to.have.attr('data-id', randomIngredient.attr('data-id'));
				});

				cy.get('#results .links:first tr').should(results => {
					expect(results).to.have.length.of.at.least(3);
					expect(results.find('tr.highlighted')).to.have.length.at.most(1);
				});

				cy.get('#results .links:nth-child(2) tr').should(suggestions => {
					expect(suggestions).to.have.length.of.at.least(1);
				});
			});
		});
	});

	it('adds an ingredient to the recipe when it is clicked in the suggestions list', {retries: 3}, () => {
		cy.get('#simulator').within(() => {
			cy.get('.ingredientdropdown .item').then(ingredients => {
				return Cypress._.sample(ingredients.toArray());
			}).then(randomIngredient => {
				cy.wrap(randomIngredient).click();

				cy.get('#results .links:nth-child(2) .link[data-link^="*"]').then(suggestionsLinks => {
					return Cypress._.sample(suggestionsLinks.toArray());
				}).then(randomIngredientLink => {
					cy.wrap(randomIngredientLink).click();

					cy.get('#ingredients .ingredient:nth-child(2)').should(secondIngredient => {
						expect(secondIngredient).to.have.attr('title', randomIngredientLink.attr('data-link').substr(1));
					});
				});
			});
		});
	});

	it('sets the search to the tag when a tag link is clicked in the suggestions list', {retries: 3}, () => {
		cy.get('#simulator').within(() => {
			cy.get('.ingredientdropdown .item').then(ingredients => {
				return Cypress._.sample(ingredients.toArray());
			}).then(randomIngredient => {
				cy.wrap(randomIngredient).click();

				cy.get('#results .links:nth-child(2) .link[data-link^="tag:"]').then(suggestionsLinks => {
					return Cypress._.sample(suggestionsLinks.toArray());
				}).then(randomTagLink => {
					cy.wrap(randomTagLink).click();

					cy.get('.searchselector').should(searchSelector => {
						expect(searchSelector).to.contain.text('tag');
					});

					cy.get('.ingredientpicker').should(search => {
						expect(search).to.have.value(randomTagLink.attr('data-link').substr(4));
					});
				});
			});
		});
	});

	it('can search by tag', () => {
		cy.get('#simulator').within(() => {
			cy.get('.searchselector').click();
			cy.get('.searchdropdown > div').contains('tag').click();
			cy.get('.ingredientpicker').type('egg');

			cy.get('.searchselector').should(searchSelector => {
				expect(searchSelector).to.contain.text('tag');
			});

			cy.get('.ingredientdropdown [data-id="bird_egg"]').should(egg => {
				expect(egg).to.have.lengthOf(1);
			});
		});
	});

	it('can search by recipe name', () => {
		cy.get('#simulator').within(() => {
			cy.get('.searchselector').click();
			cy.get('.searchdropdown > div').contains('recipe').click();
			cy.get('.ingredientpicker').type('asparagus soup');

			cy.get('.searchselector').should(searchSelector => {
				expect(searchSelector).to.contain.text('recipe');
			});

			cy.get('.ingredientdropdown [data-id="asparagus"]').should(asparagus => {
				expect(asparagus).to.have.lengthOf(1);
			});
		});
	});

	it('clears the search when clear button is clicked', () => {
		cy.get('#simulator').within(() => {
			cy.get('.searchselector').click();
			cy.get('.searchdropdown > div').contains('tag').click();
			cy.get('.ingredientpicker').type('egg');
			cy.get('.clearingredients').click();

			cy.get('.searchselector').should(searchSelector => {
				expect(searchSelector).to.contain.text('name');
			});

			cy.get('.ingredientpicker').should(search => {
				expect(search).to.have.value('');
			});
		});
	});

	it('hides ingredient names when "Icons only" button is clicked', () => {
		cy.get('#simulator').within(() => {
			cy.get('.toggleingredients').then(toggleNamesButton => {
				toggleNamesButton.click();

				expect(toggleNamesButton).to.have.text('Show names');

				cy.get('.ingredientdropdown .item .text').should(ingredientNames => {
					expect(ingredientNames).to.be.hidden;
				});
			});
		});
	});

	it('shows ingredient names when "Show names" button is clicked', () => {
		cy.get('#simulator').within(() => {
			cy.get('.toggleingredients').then(toggleNamesButton => {
				toggleNamesButton.click().click();

				expect(toggleNamesButton).to.have.text('Icons only');

				cy.get('.ingredientdropdown .item .text').should(ingredientNames => {
					expect(ingredientNames).to.be.visible;
				});
			});
		});
	});
});
