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

function checkDiscover(n = 1) {
	cy.get('#discover').then(discover => {
		if (discover.find('tr').length < n + 1) {
			cy.get('.ingredientdropdown .item').then(ingredients => {
				return Cypress._.sample(ingredients.toArray());
			}).then(anotherRandomIngredient => {
				cy.wrap(anotherRandomIngredient).click();
			});

			checkDiscover(n);
		}
	});
};

describe('Discovery', () => {
	before(() => {
		cy.visit('http://localhost:3000');

		// because the app saves menu state to local storage on beforeunload
		// we have to clear it in beforeload so that we can have pristine state for each test case
		cy.on('window:before:load', () => {
			localStorage.clear();
		});

		cy.get('#navbar .listmenu [data-tab="discovery"]').click();
	});

	beforeEach(() => {
		cy.get('#discovery .clearingredients').click();
	});

	it('shows the blank discovery screen by default', () => {
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
			expect(item).to.not.have.class('selected');
		});
		cy.get('[data-tab="discovery"]').should(item => {
			expect(item).to.have.lengthOf(1);
			expect(item).to.have.class('selected');
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
		cy.get('#discovery').within(() => {
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
		});
	});

	it('adds an ingredient to the list when clicked and populates the results', () => {
		cy.get('#discovery').within(() => {
			cy.get('.ingredientdropdown .item').then(ingredients => {
				return Cypress._.sample(ingredients.toArray());
			}).then(randomIngredient => {
				cy.wrap(randomIngredient).click();

				cy.get('#inventory .ingredient:first').should(firstIngredient => {
					expect(firstIngredient).to.have.attr('data-id', randomIngredient.attr('data-id'));
				});

				cy.get('#discoverfood tr').should(results => {
					expect(results).to.have.length.of.at.least(2);
				});

				checkDiscover(1);

				cy.get('#discover tr').should(results => {
					expect(results).to.have.length.of.at.least(2);
				});

				cy.get('#makable .makablebutton').should(makableButton => {
					expect(makableButton).to.have.lengthOf(1);
				});
			});
		});
	});

	it('removes an ingredient from the list when it is clicked in the list', () => {
		cy.get('#discovery').within(() => {
			cy.get('.ingredientdropdown .item').then(ingredients => {
				return Cypress._.sample(ingredients.toArray());
			}).then(randomIngredient => {
				cy.wrap(randomIngredient).click();

				cy.get('#inventory .ingredient:first').should(firstIngredient => {
					expect(firstIngredient).to.have.attr('data-id', randomIngredient.attr('data-id'));
				}).click();

				cy.get('#inventory').should(inventory => {
					expect(inventory).to.be.empty;
				});
			});
		});
	});

	it('shows calculation results when "Calculate efficient recipes" button is clicked', () => {
		cy.get('#discovery').within(() => {
			cy.get('.ingredientdropdown .item').then(ingredients => {
				return Cypress._.sample(ingredients.toArray());
			}).then(randomIngredient => {
				cy.wrap(randomIngredient).click();

				checkDiscover(2);

				cy.get('#makable .makablebutton').click();

				cy.get('#makable .makablebutton').should(makableButton => {
					expect(makableButton).to.not.exist;
				});

				cy.get('#makable .recipeFilter img').each(recipeFilterButton => {
					cy.get('#discover table').then(discover => {
						expect(discover).to.contain(recipeFilterButton.attr('title'));	
					});

					cy.get('#makable table').then(makableTable => {
						expect(makableTable).to.contain(recipeFilterButton.attr('title'));	
					});
				});
			});
		});
	});

	it('removes a recipe from the efficient recipes list when its filter button is right-clicked and unremoves it if it is clicked again', () => {
		cy.get('#discovery').within(() => {
			cy.get('.ingredientdropdown .item').then(ingredients => {
				return Cypress._.sample(ingredients.toArray());
			}).then(randomIngredient => {
				cy.wrap(randomIngredient).click();

				checkDiscover(2);

				cy.get('#makable .makablebutton').click();

				cy.get('#makable .recipeFilter img').then(recipeFilterButtons => {
					return Cypress._.sample(recipeFilterButtons.toArray());
				}).then(randomRecipeFilterButton => {
					cy.wrap(randomRecipeFilterButton).rightclick();

					cy.get('#discover table').then(discover => {
						expect(discover).to.contain(randomRecipeFilterButton.attr('title'));	
					});

					cy.get('#makable table').then(makableTable => {
						expect(makableTable).to.not.contain(randomRecipeFilterButton.attr('title'));	
					});

					cy.wrap(randomRecipeFilterButton).rightclick();

					cy.get('#discover table').then(discover => {
						expect(discover).to.contain(randomRecipeFilterButton.attr('title'));	
					});

					cy.get('#makable table').then(makableTable => {
						expect(makableTable).to.contain(randomRecipeFilterButton.attr('title'));	
					});
				});
			});
		});
	});

	it('does not add an ingredient more than once', () => {
		cy.get('#discovery').within(() => {
			cy.get('.ingredientdropdown .item').then(ingredients => {
				return Cypress._.sample(ingredients.toArray());
			}).then(randomIngredient => {
				cy.wrap(randomIngredient).click();

				cy.get('#inventory .ingredient').should('have.length', 1);

				cy.wrap(randomIngredient).click();

				cy.get('#inventory .ingredient').should('have.length', 1);
			});
		});
	});
});