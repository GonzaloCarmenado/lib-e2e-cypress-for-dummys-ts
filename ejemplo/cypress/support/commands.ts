/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    clearRecorderState(): Chainable<void>;
    setRecorderStrategy(strategy: string): Chainable<void>;
    startRecording(): Chainable<void>;
    stopRecording(): Chainable<void>;
    openCommandsPanel(): Chainable<void>;
    commandShouldContain(text: string): Chainable<void>;
    commandShouldNotContain(text: string): Chainable<void>;
    interceptorShouldContain(text: string): Chainable<void>;
    interceptorCountShouldBe(n: number): Chainable<void>;
  }
}
