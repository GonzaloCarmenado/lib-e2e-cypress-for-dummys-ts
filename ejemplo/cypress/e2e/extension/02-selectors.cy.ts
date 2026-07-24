import { allowRecorder } from '../../support/recorder';

describe('02 — Selector strategies', () => {
  beforeEach(() => {
    allowRecorder();
    cy.visit('/store');
    cy.clearRecorderState();
  });

  // AC-07
  it('data-cy element generates cy.get("[data-cy=…]").click()', () => {
    cy.startRecording();
    cy.get('[data-cy="btn-click"]').click();
    cy.openCommandsPanel();
    cy.commandShouldContain('btn-click');
    cy.commandShouldContain('.click()');
  });

  // AC-08
  it('data-testid element generates cy.get("[data-testid=…]").click()', () => {
    cy.setRecorderStrategy('data-testid');
    cy.startRecording();
    cy.get('[data-testid="testid-btn"]').click();
    cy.openCommandsPanel();
    cy.commandShouldContain('testid-btn');
    cy.commandShouldContain('.click()');
  });

  // AC-09
  it('aria-label element generates cy.get("[aria-label=…]").click()', () => {
    cy.setRecorderStrategy('aria-label');
    cy.startRecording();
    cy.get('[aria-label="Botón accesible"]').click();
    cy.openCommandsPanel();
    cy.commandShouldContain('Botón accesible');
    cy.commandShouldContain('.click()');
  });

  // AC-10
  it('clean id element generates cy.get("#id").click()', () => {
    cy.setRecorderStrategy('id');
    cy.startRecording();
    cy.get('#submit-order').click();
    cy.openCommandsPanel();
    cy.commandShouldContain('#submit-order');
    cy.commandShouldContain('.click()');
  });

  // AC-11
  it('framework-prefixed ids (mat-, cdk-) are not used as selectors', () => {
    cy.setRecorderStrategy('id');
    cy.startRecording();
    cy.get('#cdk-overlay-1').click({ force: true });
    cy.get('#mat-tab-0').click({ force: true });
    cy.openCommandsPanel();
    cy.commandShouldNotContain('#cdk-overlay-1');
    cy.commandShouldNotContain('#mat-tab-0');
  });

  // AC-12
  it('double-click generates .dblclick()', () => {
    cy.startRecording();
    cy.get('[data-cy="btn-dblclick"]').dblclick();
    cy.openCommandsPanel();
    cy.commandShouldContain('.dblclick()');
  });

  // AC-13
  it('right-click generates .rightclick()', () => {
    cy.startRecording();
    cy.get('[data-cy="btn-rightclick"]').rightclick();
    cy.openCommandsPanel();
    cy.commandShouldContain('.rightclick()');
  });
});
