import { allowRecorder } from '../../support/recorder';

describe('05 — Lab edge cases', () => {
  beforeEach(() => {
    allowRecorder();
    cy.visit('/lab');
    cy.clearRecorderState();
    cy.startRecording();
  });

  // AC-25
  it('selector with apostrophe is correctly escaped in the generated command', () => {
    cy.get('[data-cy="o\'brien-btn"]').click();
    cy.openCommandsPanel();
    cy.get('lib-e2e-test-previsualizer').shadow().find('[data-ref="cmds"]').invoke('text').then(text => {
      expect(text).to.include("o'brien-btn");
      expect(text).not.to.match(/cy\.get\('[^']*'[^']*'\)/);
    });
  });

  // AC-26
  it('selector with double quotes is correctly escaped in the generated command', () => {
    cy.get('[data-cy=\'say "hello"\']').click();
    cy.openCommandsPanel();
    cy.get('lib-e2e-test-previsualizer').shadow().find('[data-ref="cmds"]').invoke('text').then(text => {
      expect(text).to.include('say');
      expect(text).to.include('hello');
      expect(text).not.to.match(/cy\.get\("[^"]*"[^"]*"\)/);
    });
  });

  // AC-27
  it('typing text with apostrophes generates a valid .type(…) command', () => {
    cy.get('[data-cy="apostrophe-input"]').clear().type("it's a valid input");
    cy.openCommandsPanel();
    cy.commandShouldContain('.type(');
    cy.commandShouldContain('valid input');
  });

  // AC-28
  it('GET response with sensitive token is redacted in the interceptor body', () => {
    cy.get('[data-cy="btn-sensitive-get"]').click();
    cy.openCommandsPanel();
    cy.get('lib-e2e-test-previsualizer').shadow().find('[data-action="toggle-icp"]').click();
    cy.get('lib-e2e-test-previsualizer').shadow().find('[data-section="interceptors"]').invoke('text').then(text => {
      expect(text).not.to.match(/eyJ[A-Za-z0-9_-]{10,}/);
      expect(text).not.to.match(/"token"\s*:\s*"[^"]{8,}"/);
    });
  });

  // AC-29
  it('POST response with password and access_token is redacted in the interceptor body', () => {
    cy.get('[data-cy="btn-sensitive-post"]').click();
    cy.openCommandsPanel();
    cy.get('lib-e2e-test-previsualizer').shadow().find('[data-action="toggle-icp"]').click();
    cy.get('lib-e2e-test-previsualizer').shadow().find('[data-section="interceptors"]').invoke('text').then(text => {
      expect(text).not.to.match(/"password"\s*:\s*"[^"]{3,}"/);
      expect(text).not.to.match(/"access_token"\s*:\s*"[^"]{8,}"/);
    });
  });
});
