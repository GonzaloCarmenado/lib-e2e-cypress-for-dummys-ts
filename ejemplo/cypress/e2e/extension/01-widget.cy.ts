import { allowRecorder } from '../../support/recorder';

describe('01 — Widget mount and controls', () => {
  beforeEach(() => {
    allowRecorder();
    cy.visit('/');
    cy.clearRecorderState();
    cy.get('lib-e2e-recorder').shadow().find('[data-action="toggle"]').should('exist');
  });

  // AC-01
  it('lib-e2e-recorder is present in the DOM after page load', () => {
    cy.get('lib-e2e-recorder').should('exist');
  });

  // AC-02
  it('toggle button is reachable via shadow DOM and is visible', () => {
    cy.get('lib-e2e-recorder').shadow().find('[data-action="toggle"]').should('be.visible');
  });

  // AC-03
  it('clicking toggle starts recording (⏹) and clicking again stops it (⏺)', () => {
    cy.get('lib-e2e-recorder').shadow().find('[data-action="toggle"]').should('contain.text', '⏺');
    cy.startRecording();
    cy.get('lib-e2e-recorder').shadow().find('[data-action="toggle"]').should('contain.text', '⏹');
    cy.stopRecording();
    cy.get('lib-e2e-recorder').shadow().find('[data-action="toggle"]').should('contain.text', '⏺');
  });

  // AC-04
  it('commands button opens the previsualizer panel inside a Swal2 modal', () => {
    cy.startRecording();
    cy.openCommandsPanel();
    cy.get('lib-e2e-test-previsualizer').should('exist');
    cy.get('lib-e2e-test-previsualizer').shadow().find('[data-ref="cmds"]').should('exist');
  });

  // AC-05
  it('configuration button opens the Swal2 configuration modal', () => {
    cy.get('lib-e2e-recorder').shadow().find('[data-action="config"]').click({ force: true });
    cy.get('.swal2-popup').should('be.visible');
    cy.get('lib-e2e-configuration').should('exist');
  });

  // AC-06
  it('help button opens the help panel inside a Swal2 modal', () => {
    cy.get('lib-e2e-recorder').shadow().find('[data-action="help"]').click({ force: true });
    cy.get('.swal2-popup').should('be.visible');
    cy.get('lib-e2e-help-panel').should('exist');
  });
});
