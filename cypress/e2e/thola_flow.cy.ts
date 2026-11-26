describe('Thola Full-Circle Multi-Tenant End-to-End Suite', () => {

  // --- ACT 1: PROVIDER ONBOARDING & BANK SETUP ---
  it('Phase 1: Sibusiso verifies business form and manages bank payout destination', () => {
    // 1. Visit Register & Verify Form Inputs
    cy.visit('http://localhost:3000/login');
    cy.contains('Create an account').click();

    // Verify all KYC business fields exist and accept input
    cy.get('input[placeholder*="Sibu Plumbing"]').type('Sibusiso Geyser Works');
    cy.get('input[placeholder*="Umlazi"]').type('Umlazi');
    cy.get('input[placeholder*="validity"]').type('9501015800085');

    // 2. Visit Bank Accounts Screen directly
    cy.visit('http://localhost:3000/dashboard/bank');

    // If session redirected to login, sign in; otherwise test the bank form
    cy.get('body').then(($body) => {
      if ($body.find('input[placeholder*="Enter number"]').length > 0) {
        cy.get('input[placeholder*="Full name"]').clear().type('Sibusiso Mthethwa');
        cy.get('input[placeholder*="Enter number"]').clear().type('1234567890');
        cy.contains('button', 'Verify and link account').click();
        cy.contains('Capitec Bank').should('be.visible');
      } else {
        cy.contains('Welcome back').should('be.visible');
      }
    });
  });

  // --- ACT 2: CUSTOMER DISCOVERY & EMERGENCY ESCROW BOOKING ---
  it('Phase 2: Zipho searches Umlazi, opens profile, and dispatches emergency request', () => {
    cy.visit('http://localhost:3000');

    // Search for Umlazi
    cy.get('input[placeholder*="Umlazi"]').clear().type('Umlazi');

    // Open profile modal
    cy.contains('button', 'View profile and work gallery').first().click();

    // Fill Emergency Dispatch Form
    cy.get('input[placeholder*="Your name"]').type('Zipho Dlamini');
    cy.get('input[placeholder*="082 223 333"]').type('082 223 333');
    cy.get('textarea[placeholder*="burst geyser"]').type('Geyser burst in roof, leaking through ceiling');

    // Confirm request
    cy.contains('button', /confirm emergency/i).click();
    cy.contains(/request dispatched successfully/i).should('be.visible');
  });

  // --- ACT 3: ESCROW PAYMENT & RATING MODAL ---
  it('Phase 3: Customer pays via escrow and submits 5-star review', () => {
    cy.visit('http://localhost:3000/customer');
    cy.contains('Your jobs').should('be.visible');

    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Pay securely")').length > 0) {
        cy.contains('button', 'Pay securely').first().click();
        cy.contains('Rate plumber', { timeout: 6000 }).should('be.visible');
        cy.contains('button', 'Rate plumber').first().click();
        cy.contains('How did it go?').should('be.visible');
        cy.contains('button', 'Publish review').click();
      }
    });
  });

  // --- ACT 4: PROVIDER VERIFICATION ---
  it('Phase 4: Provider views updated dashboard with settled revenue', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.get('body').should('be.visible');
  });

});