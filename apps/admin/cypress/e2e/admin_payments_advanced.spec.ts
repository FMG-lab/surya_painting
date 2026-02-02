describe('Admin payments advanced scenarios', () => {
  it('shows only pending_review payments and hides confirmed/rejected', () => {
    cy.visit('/payments');
    cy.contains('Pending Payments');

    // page should render only pending_review entries (we have 3 pending in fixture)
    cy.get('[data-cy^="chk-"]').should('have.length', 3);

    // Confirm that confirmed/rejected entries are not shown
    cy.contains('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee').should('not.exist');
    cy.contains('ffffffff-ffff-ffff-ffff-ffffffffffff').should('not.exist');
  });

  it('handles image and pdf proofs, and missing proof', () => {
    // Intercept proof endpoint to return image for pay-1, pdf for pay-2, and 404 for pay-3
    cy.intercept('GET', '/api/admin/payments/proof?payment_id=11111111-1111-1111-1111-111111111111', { statusCode: 200, body: { url: 'https://example.com/proof1.jpg' } }).as('proof1');
    cy.intercept('GET', '/api/admin/payments/proof?payment_id=22222222-2222-2222-2222-222222222222', { statusCode: 200, body: { url: 'https://example.com/doc.pdf' } }).as('proof2');
    cy.intercept('GET', '/api/admin/payments/proof?payment_id=33333333-3333-3333-3333-333333333333', { statusCode: 404, body: { error: 'No proof file attached' } }).as('proof3');

    cy.visit('/payments');
    cy.contains('Pending Payments');

    // view image proof (first payment id 111...)
    cy.get('[data-cy^="chk-"]').first().click();
    cy.get('[data-cy="btn-view-proof-11111111-1111-1111-1111-111111111111"]').click();
    cy.wait('@proof1');
    cy.get('img[alt="proof"]').should('exist');
    cy.get('button').contains('Close').click();

    // view pdf proof (second payment id 222...)
    cy.get('[data-cy^="chk-"]').eq(1).click();
    cy.get('[data-cy="btn-view-proof-22222222-2222-2222-2222-222222222222"]').click();
    cy.wait('@proof2');
    cy.get('iframe').should('exist');
    cy.get('button').contains('Close').click();

    // view missing proof (third payment id 333...)
    cy.get('[data-cy^="chk-"]').eq(2).click();
    cy.get('[data-cy="btn-view-proof-33333333-3333-3333-3333-333333333333"]').click();
    cy.wait('@proof3');
    cy.contains('No proof file attached').should('exist');
    cy.get('button').contains('Close').click();
  });

  it('batch confirm selected payments', () => {
    cy.intercept('POST', '/api/admin/payments/verify-batch', (req) => {
      req.reply({ results: req.body.payment_ids.map((id: string) => ({ id, success: true, queue_no: 1 })) });
    }).as('batchVerify');

    cy.visit('/payments');
    cy.contains('Pending Payments');

    // select first two pending payments and confirm
    cy.get('[data-cy^="chk-"]').first().click();
    cy.get('[data-cy^="chk-"]').eq(1).click();

    cy.get('[data-cy="btn-confirm-selected"]').click();
    cy.get('[data-cy="confirm-modal-confirm"]').click();

    cy.wait('@batchVerify').its('request.body').then((body: any) => {
      expect(body).to.have.property('payment_ids');
      expect(body.payment_ids).to.include.members(['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222']);
    });
  });
});