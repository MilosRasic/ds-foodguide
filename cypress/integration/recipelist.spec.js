import {recipes} from '../../html/recipes';

function formatBonus(bonus, withLeadingPlus = true) {
	if (typeof bonus === 'undefined') {
		return '';
	}

	return withLeadingPlus && bonus > 0  ? `+${bonus}` : `${bonus}`;
}

function gameTimeToDays(gameTime) {
	return gameTime / 16 / 30;
}

function formatPerishTime(recipe) {
	if (!recipe.perish) {
		return 'Never';
	}

	const perishDays = gameTimeToDays(recipe.perish);
	const perishSuffix = perishDays === 1 ? 'day' : 'days';

	return `${perishDays} ${perishSuffix}`;
}

function formatCookTime(recipeDef) {
	const cookSecs = recipeDef.cooktime * 20;

	return `${cookSecs} secs`;
}

describe('Recipe List', () => {
	before(() => {
		cy.visit('http://localhost:3000');

		// because the app saves menu state to local storage on beforeunload
		// we have to clear it in beforeload so that we can have pristine state for each test case
		cy.on('window:before:load', () => {
			localStorage.clear();
		});

		cy.get('#navbar .listmenu [data-tab="crockpot"]').click();
	});

	it('shows the expected number of ingredients in the table', () => {
		cy.get('#navbar .mode-button.enabled').then(modes => {
			return modes.map(i => Cypress.$(modes[i]).attr('data-mode')).get();
		}).should(modes => {
			cy.get('#recipes > table > tr').should('have.length', Object.values(recipes).filter(recipe => !recipe.mode || modes.includes(recipe.mode)).length + 1);
		});
	});

	it('shows bonuses for a random recipe correctly', () => {
		cy.get('#recipes > table > tr:not(:first-child)').then(recipeRows => {
			return Cypress._.sample(recipeRows.toArray());
		}).should(randomRecipeRow => {
			const recipeName = randomRecipeRow.find('a').first().text();
			const recipeId = Object.keys(recipes).find(id => recipes[id].name === recipeName);
			const recipeDef = recipes[recipeId];

			cy.log(`Picked ${recipeName}`);

			cy.wrap(randomRecipeRow).find('td:nth-child(3)').should('have.text', formatBonus(recipeDef.health));
			cy.wrap(randomRecipeRow).find('td:nth-child(4)').should('have.text', formatBonus(recipeDef.hunger));
			cy.wrap(randomRecipeRow).find('td:nth-child(5)').should('have.text', formatBonus(recipeDef.sanity));
			cy.wrap(randomRecipeRow).find('td:nth-child(6)').should('have.text', formatPerishTime(recipeDef));
			cy.wrap(randomRecipeRow).find('td:nth-child(7)').should('have.text', formatCookTime(recipeDef));
			cy.wrap(randomRecipeRow).find('td:nth-child(8)').should('have.text', recipeDef.priority);
		});
	});

	it('shows Asparagus and veggie > 1 requirements and Hamlet mode for Asparagus Soup', () => {
		cy.get('#recipes > table').contains('Asparagus Soup').closest('tr').within(() => {
			cy.get('td:nth-child(9)').within(lastCell => {
				expect(lastCell).to.contain('Asparagus');
				cy.get('[data-link="*Asparagus"]').should('exist');
				cy.get('[data-link="*Cooked Asparagus"]').should('exist');

				expect(lastCell).to.contain('veggie>1');
				cy.get('[data-link="tag:veggie"]').should('exist');

				cy.get('[data-link="tag:hamlet"]').should('exist');
			});
		});
	});

	it('shows eggs > 1 and meat > 1 and no veggies requirements for Bacon and Eggs', () => {
		cy.get('#recipes > table').contains('Bacon and Eggs').closest('tr').within(() => {
			cy.get('td:nth-child(9)').within(lastCell => {
				expect(lastCell).to.contain('egg>1');
				cy.get('[data-link="tag:egg"]').should('exist');

				expect(lastCell).to.contain('meat>1');
				cy.get('[data-link="tag:meat"]').should('exist');

				expect(lastCell).to.contain('veggie');
				cy.get('[data-link="tag:veggie"]').should('have.class', 'strike');
			});
		});
	});

	it('shows Banana, frozen, inedible, no meat and no fish requirements, and Shipwrecked mode, for Banana Pop', () => {
		cy.get('#recipes > table').contains('Banana Pop').closest('tr').within(() => {
			cy.get('td:nth-child(9)').within(lastCell => {
				expect(lastCell).to.contain('Banana');
				cy.get('[data-link="*Banana"]').should('exist');

				expect(lastCell).to.contain('frozen');
				cy.get('[data-link="tag:frozen"]').should('exist');

				expect(lastCell).to.contain('inedible');
				cy.get('[data-link="tag:inedible"]').should('exist');

				expect(lastCell).to.contain('meat');
				cy.get('[data-link="tag:meat"]').should('have.class', 'strike');

				expect(lastCell).to.contain('fish');
				cy.get('[data-link="tag:fish"]').should('have.class', 'strike');

				cy.get('[data-link="tag:shipwrecked"]').should('exist');
			});
		});
	});

	it('shows 2 Seaweed and fish >= 1 requirements, and Shipwrecked mode, for California Roll', () => {
		cy.get('#recipes > table').contains('California Roll').closest('tr').within(() => {
			cy.get('td:nth-child(9)').within(lastCell => {
				expect(lastCell).to.contain('Seaweed=2');
				cy.get('[data-link="*Seaweed"]').should('exist');

				expect(lastCell).to.contain('fish>=1');
				cy.get('[data-link="tag:fish"]').should('exist');

				cy.get('[data-link="tag:shipwrecked"]').should('exist');
			});
		});
	});

	it('shows the weird Roe or 3 Cooked Roe and veggie requirements, and Shipwrecked mode, for Caviar', () => {
		cy.get('#recipes > table').contains('Caviar').closest('tr').within(() => {
			cy.get('td:nth-child(9)').within(lastCell => {
				expect(lastCell).to.contain('Roe or Cooked Roe=3');
				cy.get('[data-link="*Roe"]').should('exist');
				cy.get('[data-link="*Cooked Roe"]').should('exist');

				expect(lastCell).to.contain('veggie');
				cy.get('[data-link="tag:veggie"]').should('exist');

				cy.get('[data-link="tag:shipwrecked"]').should('exist');
			});
		});
	});

	it('shows the variable Coffee requirements, and Shipwrecked mode, correctly', () => {
		cy.get('#recipes > table').contains('Coffee').closest('tr').within(() => {
			cy.get('td:nth-child(9)').within(lastCell => {
				expect(lastCell).to.contain('Roasted Coffee Beans=4 or Roasted Coffee Beans=3 and dairy or sweetener');
				cy.get('[data-link="*Roasted Coffee Beans"]').should('have.length', 2);
				cy.get('[data-link="tag:dairy"]').should('exist');
				cy.get('[data-link="tag:sweetener"]').should('exist');

				cy.get('[data-link="tag:shipwrecked"]').should('exist');
			});
		});
	});

	it('shows fish, Twigs, inedible <= 1 requirements for Fishsticks', () => {
		cy.get('#recipes > table').contains('Fishsticks').closest('tr').within(() => {
			cy.get('td:nth-child(9)').within(lastCell => {
				expect(lastCell).to.contain('fish');
				cy.get('[data-link="tag:fish"]').should('exist');

				expect(lastCell).to.contain('Twigs');
				cy.get('[data-link="*Twigs"]').should('exist');

				expect(lastCell).to.contain('inedible; inedible<=1');
				cy.get('[data-link="tag:inedible"]').should('have.length', 2);
			});
		});
	});

	it('shows fruit and no meat, no veggies, no inedible requirements for Fist Full of Jam', () => {
		cy.get('#recipes > table').contains('Fist Full of Jam').closest('tr').within(() => {
			cy.get('td:nth-child(9)').within(lastCell => {
				expect(lastCell).to.contain('fruit');
				cy.get('[data-link="tag:fruit"]').should('exist');

				expect(lastCell).to.contain('meat');
				cy.get('[data-link="tag:meat"]').should('have.class', 'strike');

				expect(lastCell).to.contain('veggie');
				cy.get('[data-link="tag:veggie"]').should('have.class', 'strike');

				expect(lastCell).to.contain('inedible');
				cy.get('[data-link="tag:inedible"]').should('have.class', 'strike');
			});
		});
	});

	it('shows Cactus Flower, veggie >= 2, no meat, no inedibles, no eggs, no sweeteners and no fruit requirements, and RoG mode, for Flower Salad', () => {
		cy.get('#recipes > table').contains('Flower Salad').closest('tr').within(() => {
			cy.get('td:nth-child(9)').within(lastCell => {
				expect(lastCell).to.contain('Cactus Flower');
				cy.get('[data-link="*Cactus Flower"]').should('exist');

				expect(lastCell).to.contain('veggie>=2');
				cy.get('[data-link="tag:veggie"]').should('exist');

				expect(lastCell).to.contain('meat');
				cy.get('[data-link="tag:meat"]').should('have.class', 'strike');

				expect(lastCell).to.contain('inedible');
				cy.get('[data-link="tag:inedible"]').should('have.class', 'strike');

				expect(lastCell).to.contain('egg');
				cy.get('[data-link="tag:egg"]').should('have.class', 'strike');

				expect(lastCell).to.contain('sweetener');
				cy.get('[data-link="tag:sweetener"]').should('have.class', 'strike');

				expect(lastCell).to.contain('fruit');
				cy.get('[data-link="tag:fruit"]').should('have.class', 'strike');

				cy.get('[data-link="tag:giants"]').should('exist');
			});
		});
	});

	it('highlights all ingredients with a mode tag when a mode tag is clicked', () => {
		cy.get('#recipes > table').find('[data-link="tag:hamlet"],[data-link="tag:shipwrecked"],[data-link="tag:giants"]').then(allTags => {
			return Cypress._.sample(allTags.toArray());
		}).then(randomTag => {
			cy.log(`Picked ${randomTag.attr('data-link')}`);

			cy.wrap(randomTag).click();

			return cy.get(`#recipes > table > tr:has([data-link="${randomTag.attr('data-link')}"])`);
		}).should(allRowsWithTagSameAsClickedTag => {
			expect(allRowsWithTagSameAsClickedTag).to.have.class('highlighted');
		});
	});
});
