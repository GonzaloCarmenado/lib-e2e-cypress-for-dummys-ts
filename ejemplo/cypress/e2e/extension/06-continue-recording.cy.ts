import { allowRecorder } from '../../support/recorder';

describe('06 — Continue recording after Stop (spec 024)', () => {
  beforeEach(() => {
    allowRecorder();
    cy.visit('/store');
    cy.clearRecorderState();
  });

  // AC-30
  it('"Continue recording" in the ask step resumes recording with commands intact', () => {
    cy.startRecording();
    cy.get('[data-cy="btn-click"]').click();
    cy.stopRecording(); // opens the save dialog
    cy.get('.swal2-popup').should('be.visible');
    cy.get('lib-e2e-save-test').shadow().find('#btn-continue-recording').click({ force: true });

    cy.get('lib-e2e-recorder').shadow().find('[data-action="toggle"]').should('contain.text', '⏹');
    cy.get('[data-cy="btn-dblclick"]').click();

    cy.openCommandsPanel();
    cy.commandShouldContain('btn-click');
    cy.commandShouldContain('btn-dblclick');
  });

  // AC-31
  it('"Continue recording" in the confirm-discard step also resumes recording', () => {
    cy.startRecording();
    cy.get('[data-cy="btn-click"]').click();
    cy.stopRecording();
    cy.get('.swal2-popup').should('be.visible');
    cy.get('lib-e2e-save-test').shadow().find('#btn-no').click({ force: true });
    cy.get('lib-e2e-save-test').shadow().find('#btn-continue-recording').click({ force: true });

    cy.get('lib-e2e-recorder').shadow().find('[data-action="toggle"]').should('contain.text', '⏹');
    cy.openCommandsPanel();
    cy.commandShouldContain('btn-click');
  });

  // AC-32
  it('"↺ Recover" restores the discarded recording and resumes recording mode', () => {
    cy.startRecording();
    cy.get('[data-cy="btn-click"]').click();
    cy.stopRecording();
    cy.get('.swal2-popup').should('be.visible');
    cy.get('lib-e2e-save-test').shadow().find('#btn-no').click({ force: true });
    cy.get('lib-e2e-save-test').shadow().find('#btn-confirm-discard').click({ force: true });

    cy.get('lib-e2e-recorder').shadow().find('[data-action="toggle"]').should('contain.text', '⏺');
    cy.get('lib-e2e-recorder').shadow().find('[data-action="recover"]').should('exist').click({ force: true });

    cy.get('lib-e2e-recorder').shadow().find('[data-action="toggle"]').should('contain.text', '⏹');
    cy.openCommandsPanel();
    cy.commandShouldContain('btn-click');
  });
});
