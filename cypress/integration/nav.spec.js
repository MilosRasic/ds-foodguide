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

describe('Nav', () => {
	beforeEach(() => {
		cy.visit('http://localhost:3000');

		// because the app saves menu state to local storage on beforeunload
		// we have to clear it in beforeload so that we can have pristine state for each test case
		cy.on('window:before:load', () => {
			localStorage.clear();
		});
	});

	it('shows the initial nav by default', () => {
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
});
