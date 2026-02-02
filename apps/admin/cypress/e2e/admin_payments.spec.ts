describe('Admin payments flow', () => {

  it('allows super admin to view payments and view proof', () => {
    // deterministic: stub fixtures used by the mock Supabase client
    cy.intercept('GET', '/fixtures/payments.json', { fixture: 'payments.json' }).as('getPayments');
    cy.intercept('GET', '/fixtures/branches.json', { fixture: 'branches.json' }).as('getBranches');

    // intercept proof endpoint
    cy.intercept('GET', '/api/admin/payments/proof*', {
      statusCode: 200,
      body: { url: 'https://example.com/proof.jpg' }
    }).as('getProof');

    // visit payments page and wait for the UI to render and fixtures to load
    cy.visit('/payments');

    // wait for fixture requests to complete so UI is deterministic
    cy.wait(['@getPayments', '@getBranches']);

    // ensure page header rendered
    cy.contains('Pending Payments');

    // ensure loading indicator cleared
    cy.contains('Loading...').should('not.exist');

    // we expect at least one pending payment from fixture
    cy.get('[data-cy^="chk-"]', { timeout: 10000 }).should('have.length.at.least', 1).first().click();

    // view proof of first item
    cy.get('button').contains('View Proof').first().click();
    cy.wait('@getProof');
  });

  it('batch confirm sends request', () => {
    // deterministic: ensure payments/branches fixtures are stubbed
    cy.intercept('GET', '/fixtures/payments.json', { fixture: 'payments.json' }).as('getPayments');
    cy.intercept('GET', '/fixtures/branches.json', { fixture: 'branches.json' }).as('getBranches');

    // prepare intercept for batch verify
    cy.intercept('POST', '/api/admin/payments/verify-batch', (req) => {
      req.reply({ results: req.body.payment_ids.map((id: string) => ({ id, success: true, queue_no: 1 })) });
    }).as('batchVerify');

    cy.visit('/payments');
    cy.wait(['@getPayments', '@getBranches']);
    cy.contains('Pending Payments');
    cy.contains('Loading...').should('not.exist');

    // select first payment and confirm
    cy.get('[data-cy^="chk-"]', { timeout: 10000 }).should('have.length.at.least', 1).first().click();
    cy.get('button').contains('Confirm Selected').click();
    // confirm modal
    cy.get('button').contains('Confirm').click();

    cy.wait('@batchVerify').its('request.body').should('have.property', 'payment_ids');
  });
});
