import {food} from '../../html/food';

function formatBonus(bonus, withLeadingPlus = true) {
	if (typeof bonus === 'undefined') {
		return '';
	}

	return withLeadingPlus && bonus > 0  ? `+${bonus}` : `${bonus}`;
}

function getCookedIngredient(ingredientId) {
	const ingredient = food[ingredientId];

	if (ingredient.cook) {
		return food[ingredient.cook];
	}

	return food[`${ingredientId}_cooked`];
}

function getRawIngredient(ingredientId) {
	if (!ingredientId.endsWith('_cooked')) {
		return undefined;
	}

	const idSplit = ingredientId.split('_');
	idSplit.pop();
	const rawId = idSplit.join('_');
	
	return food[rawId];
}

function getDryIngredient(ingredientId) {
	const ingredient = food[ingredientId];

	if (!ingredient.dry) {
		return undefined;
	}

	return food[ingredient.dry];
}

function formatBonusWithCooked(ingredientId, prop) {
	const ingredient = food[ingredientId];

	const shouldHaveLeadingPlus = prop !== 'sanity';
	let bonus = formatBonus(ingredient[prop], shouldHaveLeadingPlus);

	const cooked = getCookedIngredient(ingredientId);

	if (cooked && typeof cooked[prop] !== 'undefined') {
		const baseProp = ingredient[prop] || 0;
		const diff = cooked[prop] - baseProp;

		if (diff !== 0) {
			bonus+= ` (${formatBonus(diff)})`;
		}
	}

	return bonus;
}

function gameTimeToDays(gameTime) {
	return gameTime / 16 / 30;
}

function formatPerishTime(ingredient) {
	if (!ingredient.perish) {
		return 'Never';
	}

	const perishDays = gameTimeToDays(ingredient.perish);
	const perishSuffix = perishDays === 1 ? 'day' : 'days';

	return `${perishDays} ${perishSuffix}`;
}

function formatDryTime(ingredient) {
	if (!ingredient.drytime) {
		return undefined;
	}

	const dryDays = gameTimeToDays(ingredient.drytime);
	const drySuffix = dryDays === 1 ? 'day' : 'days';

	return `dry in ${dryDays} ${drySuffix}`;
}

describe('Food List', () => {
	before(() => {
		cy.visit('http://localhost:3000');

		// because the app saves menu state to local storage on beforeunload
		// we have to clear it in beforeload so that we can have pristine state for each test case
		cy.on('window:before:load', () => {
			localStorage.clear();
		});

		cy.get('#navbar .listmenu [data-tab="foodlist"]').click();
	});

	it('shows the expected number of ingredients in the table', () => {
		cy.get('#navbar .mode-button.enabled').then(modes => {
			return modes.map(i => Cypress.$(modes[i]).attr('data-mode')).get();
		}).should(modes => {
			cy.get('#food > table > tr').should('have.length', Object.values(food).filter(ingredient => !ingredient.mode || modes.includes(ingredient.mode)).length + 1);
		});
	});

	it('shows a random ingredient correctly', () => {
		cy.get('#food > table > tr:not(:first-child)').then(ingredientRows => {
			return Cypress._.sample(ingredientRows.toArray());
		}).should(randomIngredientRow => {
			const ingredientName = randomIngredientRow.find('a').first().text();
			const ingredientId = Object.keys(food).find(id => food[id].name === ingredientName);
			const ingredientDef = food[ingredientId];

			cy.log(`Picked ${ingredientName}`);

			cy.wrap(randomIngredientRow).find('td:nth-child(3)').should('have.text', formatBonusWithCooked(ingredientId, 'health'));
			cy.wrap(randomIngredientRow).find('td:nth-child(4)').should('have.text', formatBonusWithCooked(ingredientId, 'hunger'));
			cy.wrap(randomIngredientRow).find('td:nth-child(5)').should('have.text', formatBonusWithCooked(ingredientId, 'sanity'));
			cy.wrap(randomIngredientRow).find('td:nth-child(6)').should('have.text', formatPerishTime(ingredientDef));
			cy.wrap(randomIngredientRow).find('td:nth-child(7)').within(cell => {
				if (ingredientDef.veggie) {
					cy.get('[data-link="tag:veggie"]').should('exist');
				}
				if (ingredientDef.fruit) {
					cy.get('[data-link="tag:fruit"]').should('exist');
				}
				if (ingredientDef.bug) {
					cy.get('[data-link="tag:bug"]').should('exist');
				}
				if (ingredientDef.dairy) {
					cy.get('[data-link="tag:dairy"]').should('exist');
				}
				if (ingredientDef.fat) {
					cy.get('[data-link="tag:fat"]').should('exist');
				}
				if (ingredientDef.meat) {
					cy.get('[data-link="tag:meat"]').should('exist');
				}
				if (ingredientDef.fish) {
					cy.get('[data-link="tag:fish"]').should('exist');
				}
				if (ingredientDef.monster) {
					cy.get('[data-link="tag:monster"]').should('exist');
				}
				if (ingredientDef.decoration) {
					cy.get('[data-link="tag:decoration"]').should('exist');
				}
				if (ingredientDef.sweetener) {
					cy.get('[data-link="tag:sweetener"]').should('exist');
				}
				if (ingredientDef.jellyfish) {
					cy.get('[data-link="tag:jellyfish"]').should('exist');
				}
				if (ingredientDef.magic) {
					cy.get('[data-link="tag:magic"]').should('exist');
				}
				if (ingredientDef.antihistamine) {
					cy.get('[data-link="tag:antihistamine"]').should('exist');
				}
				if (ingredientDef.inedible) {
					cy.get('[data-link="tag:inedible"]').should('exist');
				}

				const cooked = getCookedIngredient(ingredientId);
				if (cooked) {
					expect(cell).to.contain('cook');
					cy.get(`[data-link="*${cooked.name}"]`).should('exist');
				}

				const raw = getRawIngredient(ingredientId);
				if (raw) {
					expect(cell).to.contain('from');
					cy.get(`[data-link="*${raw.name}"]`).should('exist');
				}

				const dry = getDryIngredient(ingredientId);
				if (dry) {
					expect(cell).to.contain(formatDryTime(ingredientDef));
					cy.get(`[data-link="*${dry.name}"]`).should('exist');
				}

				if (ingredientDef.mode) {
					expect(cell).to.contain('requires');
					cy.get(`[data-link="tag:${ingredientDef.mode}"]`).should('exist');
				}

				if (ingredientDef.uncookable) {
					expect(cell).to.contain('cannot be added to crock pot');
				}
			});
		});
	});

	it('shows a vegetable from Hamlet correctly', () => {
		cy.get('#food > table').contains('Aloe').closest('tr').within(() => {
			const INGREDIENT_ID = 'aloe';

			cy.get('td:nth-child(3)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'health'));
			cy.get('td:nth-child(4)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'hunger'));
			cy.get('td:nth-child(5)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'sanity'));
			cy.get('td:nth-child(6)').should('have.text', formatPerishTime(food[INGREDIENT_ID]));

			cy.get('td:nth-child(7)').within(lastCell => {
				const cooked = getCookedIngredient(INGREDIENT_ID);

				cy.get('[data-link="tag:veggie"]').should('exist');
				expect(lastCell).to.contain('cook');
				cy.get(`[data-link="*${cooked.name}"]`).should('exist');
				expect(lastCell).to.contain('requires');
				cy.get(`[data-link="tag:${food[INGREDIENT_ID].mode}"]`).should('exist');
			});
		});
	});

	it('shows a cooked vegetable from Hamlet correctly', () => {
		cy.get('#food > table').contains('Cooked Aloe').closest('tr').within(() => {
			const INGREDIENT_ID = 'aloe_cooked';

			cy.get('td:nth-child(3)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'health'));
			cy.get('td:nth-child(4)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'hunger'));
			cy.get('td:nth-child(5)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'sanity'));
			cy.get('td:nth-child(6)').should('have.text', formatPerishTime(food[INGREDIENT_ID]));

			cy.get('td:nth-child(7)').within(lastCell => {
				const raw = getRawIngredient(INGREDIENT_ID);

				cy.get('[data-link="tag:veggie"]').should('exist');
				expect(lastCell).to.contain('from');
				cy.get(`[data-link="*${raw.name}"]`).should('exist');
				expect(lastCell).to.contain('requires');
				cy.get(`[data-link="tag:${food[INGREDIENT_ID].mode}"]`).should('exist');
			});
		});
	});

	it('shows a fruit correctly', () => {
		cy.get('#food > table').contains('Banana').closest('tr').within(() => {
			const INGREDIENT_ID = 'cavebanana';

			cy.get('td:nth-child(3)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'health'));
			cy.get('td:nth-child(4)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'hunger'));
			cy.get('td:nth-child(5)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'sanity'));
			cy.get('td:nth-child(6)').should('have.text', formatPerishTime(food[INGREDIENT_ID]));

			cy.get('td:nth-child(7)').within(lastCell => {
				const cooked = getCookedIngredient(INGREDIENT_ID);

				cy.get('[data-link="tag:fruit"]').should('exist');
				expect(lastCell).to.contain('cook');
				cy.get(`[data-link="*${cooked.name}"]`).should('exist');
			});
		});
	});

	it('shows a dryable, uncookable ingredient correctly', () => {
		cy.get('#food > table').contains('Batilisk Wing').closest('tr').within(() => {
			const INGREDIENT_ID = 'batwing';

			cy.get('td:nth-child(3)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'health'));
			cy.get('td:nth-child(4)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'hunger'));
			cy.get('td:nth-child(5)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'sanity'));
			cy.get('td:nth-child(6)').should('have.text', formatPerishTime(food[INGREDIENT_ID]));

			cy.get('td:nth-child(7)').within(lastCell => {
				const cooked = getCookedIngredient(INGREDIENT_ID);

				expect(lastCell).to.contain('cook');
				cy.get(`[data-link="*${cooked.name}"]`).should('exist');

				const dry = getDryIngredient(INGREDIENT_ID);

				expect(lastCell).to.contain(formatDryTime(food[INGREDIENT_ID]));
				cy.get(`[data-link="*${dry.name}"]`).should('exist');

				expect(lastCell).to.contain('cannot be added to crock pot');
			});
		});
	});

	it('shows a bug correctly', () => {
		cy.get('#food > table').contains('Bean Bugs').closest('tr').within(() => {
			const INGREDIENT_ID = 'jellybug';

			cy.get('td:nth-child(3)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'health'));
			cy.get('td:nth-child(4)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'hunger'));
			cy.get('td:nth-child(5)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'sanity'));
			cy.get('td:nth-child(6)').should('have.text', formatPerishTime(food[INGREDIENT_ID]));

			cy.get('td:nth-child(7)').within(lastCell => {
				const cooked = getCookedIngredient(INGREDIENT_ID);

				cy.get('[data-link="tag:bug"]').should('exist');
				expect(lastCell).to.contain('cook');
				cy.get(`[data-link="*${cooked.name}"]`).should('exist');
				expect(lastCell).to.contain('requires');
				cy.get(`[data-link="tag:${food[INGREDIENT_ID].mode}"]`).should('exist');
			});
		});
	});

	it('shows an imperishable ingredient from Shipwrecked correctly', () => {
		cy.get('#food > table').contains('Bile-Covered Slop').closest('tr').within(() => {
			const INGREDIENT_ID = 'mysterymeat';

			cy.get('td:nth-child(3)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'health'));
			cy.get('td:nth-child(4)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'hunger'));
			cy.get('td:nth-child(5)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'sanity'));
			cy.get('td:nth-child(6)').should('have.text', 'Never');

			cy.get('td:nth-child(7)').within(lastCell => {
				expect(lastCell).to.contain('requires');
				cy.get(`[data-link="tag:${food[INGREDIENT_ID].mode}"]`).should('exist');
			});
		});
	});

	it('shows an unconsumable ingredient from Reign of Giants correctly', () => {
		cy.get('#food > table').contains('Birchnut').closest('tr').within(() => {
			const INGREDIENT_ID = 'acorn';

			cy.get('td:nth-child(3)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'health'));
			cy.get('td:nth-child(4)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'hunger'));
			cy.get('td:nth-child(5)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'sanity'));
			cy.get('td:nth-child(6)').should('have.text', formatPerishTime(food[INGREDIENT_ID]));

			cy.get('td:nth-child(7)').within(lastCell => {
				const cooked = getCookedIngredient(INGREDIENT_ID);

				expect(lastCell).to.contain('cook');
				cy.get(`[data-link="*${cooked.name}"]`).should('exist');
				expect(lastCell).to.contain('requires');
				cy.get(`[data-link="tag:${food[INGREDIENT_ID].mode}"]`).should('exist');
			});
		});
	});

	it('shows a fat and dairy ingredient (Butter) correctly', () => {
		cy.get('#food > table').contains('Butter').closest('tr').within(() => {
			const INGREDIENT_ID = 'butter';

			cy.get('td:nth-child(3)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'health'));
			cy.get('td:nth-child(4)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'hunger'));
			cy.get('td:nth-child(5)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'sanity'));
			cy.get('td:nth-child(6)').should('have.text', formatPerishTime(food[INGREDIENT_ID]));

			cy.get('td:nth-child(7)').within(lastCell => {
				cy.get('[data-link="tag:fat"]').should('exist');
				cy.get('[data-link="tag:dairy"]').should('exist');
			});
		});
	});

	it('shows a decoration ingredient correctly', () => {
		cy.get('#food > table').contains('Butterfly Wings').closest('tr').within(() => {
			const INGREDIENT_ID = 'butterflywings';

			cy.get('td:nth-child(3)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'health'));
			cy.get('td:nth-child(4)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'hunger'));
			cy.get('td:nth-child(5)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'sanity'));
			cy.get('td:nth-child(6)').should('have.text', formatPerishTime(food[INGREDIENT_ID]));

			cy.get('td:nth-child(7)').within(lastCell => {
				cy.get('[data-link="tag:decoration"]').should('exist');
			});
		});
	});

	it('shows an egg correctly', () => {
		cy.get('#food > table').contains('Doydoy Egg').closest('tr').within(() => {
			const INGREDIENT_ID = 'doydoyegg';

			cy.get('td:nth-child(3)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'health'));
			cy.get('td:nth-child(4)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'hunger'));
			cy.get('td:nth-child(5)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'sanity'));
			cy.get('td:nth-child(6)').should('have.text', formatPerishTime(food[INGREDIENT_ID]));

			cy.get('td:nth-child(7)').within(lastCell => {
				const cooked = getCookedIngredient(INGREDIENT_ID);

				cy.get('[data-link="tag:egg"]').should('exist');
				expect(lastCell).to.contain('cook');
				cy.get(`[data-link="*${cooked.name}"]`).should('exist');
				expect(lastCell).to.contain('requires');
				cy.get(`[data-link="tag:${food[INGREDIENT_ID].mode}"]`).should('exist');
			});
		});
	});

	it('shows a monster ingredient correctly', () => {
		cy.get('#food > table').contains('Durian').closest('tr').within(() => {
			const INGREDIENT_ID = 'durian';

			cy.get('td:nth-child(3)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'health'));
			cy.get('td:nth-child(4)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'hunger'));
			cy.get('td:nth-child(5)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'sanity'));
			cy.get('td:nth-child(6)').should('have.text', formatPerishTime(food[INGREDIENT_ID]));

			cy.get('td:nth-child(7)').within(lastCell => {
				const cooked = getCookedIngredient(INGREDIENT_ID);

				cy.get('[data-link="tag:fruit"]').should('exist');
				cy.get('[data-link="tag:monster"]').should('exist');
				expect(lastCell).to.contain('cook');
				cy.get(`[data-link="*${cooked.name}"]`).should('exist');
			});
		});
	});

	it('shows a sweetener correctly', () => {
		cy.get('#food > table').contains('Honey').closest('tr').within(() => {
			const INGREDIENT_ID = 'honey';

			cy.get('td:nth-child(3)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'health'));
			cy.get('td:nth-child(4)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'hunger'));
			cy.get('td:nth-child(5)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'sanity'));
			cy.get('td:nth-child(6)').should('have.text', formatPerishTime(food[INGREDIENT_ID]));

			cy.get('td:nth-child(7)').within(lastCell => {
				cy.get('[data-link="tag:sweetener"]').should('exist');
			});
		});
	});

	it('shows a jellyfish correctly', () => {
		cy.get('#food > table').contains('Jellyfish').closest('tr').within(() => {
			const INGREDIENT_ID = 'jellyfish';

			cy.get('td:nth-child(3)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'health'));
			cy.get('td:nth-child(4)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'hunger'));
			cy.get('td:nth-child(5)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'sanity'));
			cy.get('td:nth-child(6)').should('have.text', formatPerishTime(food[INGREDIENT_ID]));

			cy.get('td:nth-child(7)').within(lastCell => {
				const cooked = getCookedIngredient(INGREDIENT_ID);

				cy.get('[data-link="tag:fish"]').should('exist');
				cy.get('[data-link="tag:monster"]').should('exist');
				cy.get('[data-link="tag:jellyfish"]').should('exist');
				expect(lastCell).to.contain('cook');
				cy.get(`[data-link="*${cooked.name}"]`).should('exist');
				expect(lastCell).to.contain('requires');
				cy.get(`[data-link="tag:${food[INGREDIENT_ID].mode}"]`).should('exist');
			});
		});
	});

	it('shows a magical ingredient correctly', () => {
		cy.get('#food > table').contains('Mandrake').closest('tr').within(() => {
			const INGREDIENT_ID = 'mandrake';

			cy.get('td:nth-child(3)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'health'));
			cy.get('td:nth-child(4)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'hunger'));
			cy.get('td:nth-child(5)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'sanity'));
			cy.get('td:nth-child(6)').should('have.text', formatPerishTime(food[INGREDIENT_ID]));

			cy.get('td:nth-child(7)').within(lastCell => {
				const cooked = getCookedIngredient(INGREDIENT_ID);

				cy.get('[data-link="tag:veggie"]').should('exist');
				cy.get('[data-link="tag:magic"]').should('exist');
				expect(lastCell).to.contain('cook');
				cy.get(`[data-link="*${cooked.name}"]`).should('exist');
			});
		});
	});

	it('shows a meat ingredient correctly', () => {
		cy.get('#food > table').contains('Cooked Meat').closest('tr').within(() => {
			const INGREDIENT_ID = 'meat_cooked';

			cy.get('td:nth-child(3)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'health'));
			cy.get('td:nth-child(4)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'hunger'));
			cy.get('td:nth-child(5)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'sanity'));
			cy.get('td:nth-child(6)').should('have.text', formatPerishTime(food[INGREDIENT_ID]));

			cy.get('td:nth-child(7)').within(lastCell => {
				const raw = getRawIngredient(INGREDIENT_ID);

				cy.get('[data-link="tag:meat"]').should('exist');
				expect(lastCell).to.contain('from');
				cy.get(`[data-link="*${raw.name}"]`).should('exist');
			});
		});
	});

	it('shows an antihistamine ingredient correctly', () => {
		cy.get('#food > table').contains('Nettle').closest('tr').within(() => {
			const INGREDIENT_ID = 'cutnettle';

			cy.get('td:nth-child(3)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'health'));
			cy.get('td:nth-child(4)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'hunger'));
			cy.get('td:nth-child(5)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'sanity'));
			cy.get('td:nth-child(6)').should('have.text', formatPerishTime(food[INGREDIENT_ID]));

			cy.get('td:nth-child(7)').within(lastCell => {
				cy.get('[data-link="tag:antihistamine"]').should('exist');
				expect(lastCell).to.contain('requires');
				cy.get(`[data-link="tag:${food[INGREDIENT_ID].mode}"]`).should('exist');
			});
		});
	});

	it('shows an inedible ingredient correctly', () => {
		cy.get('#food > table').contains('Twigs').closest('tr').within(() => {
			const INGREDIENT_ID = 'twigs';

			cy.get('td:nth-child(3)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'health'));
			cy.get('td:nth-child(4)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'hunger'));
			cy.get('td:nth-child(5)').should('have.text', formatBonusWithCooked(INGREDIENT_ID, 'sanity'));
			cy.get('td:nth-child(6)').should('have.text', formatPerishTime(food[INGREDIENT_ID]));

			cy.get('td:nth-child(7)').within(lastCell => {
				cy.get('[data-link="tag:inedible"]').should('exist');
			});
		});
	});

	it('highlights all ingredients with a tag when a tag is clicked', () => {
		cy.get('#food > table [data-link^="tag:"]').then(allTags => {
			return Cypress._.sample(allTags.toArray());
		}).then(randomTag => {
			cy.log(`Picked ${randomTag.attr('data-link')}`);

			cy.wrap(randomTag).click();

			return cy.get(`#food > table > tr:has([data-link="${randomTag.attr('data-link')}"])`);
		}).should(allRowsWithTagSameAsClickedTag => {
			expect(allRowsWithTagSameAsClickedTag).to.have.class('highlighted');
		});
	});

	it('highlights an ingredient when a link to that ingredient is clicked', () => {
		cy.get('#food > table [data-link^="*"]').then(allLinks => {
			return Cypress._.sample(allLinks.toArray());
		}).then(randomLink => {
			cy.log(`Picked ${randomLink.attr('data-link')}`);

			cy.wrap(randomLink).click();

			return cy.get(`#food > table`).contains(new RegExp(`^${randomLink.attr('data-link').substr(1)}$`));
		}).should(clickedIngredientRow => {
			expect(clickedIngredientRow).to.have.length(1);
			expect(clickedIngredientRow.closest('tr')).to.have.class('highlighted');
		});
	})
});
