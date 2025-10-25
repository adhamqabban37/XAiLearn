describe("Responsive layouts", () => {
  const viewports: Array<Cypress.ViewportPreset | [number, number]> = [
    "iphone-5",
    "iphone-6",
    "iphone-x",
    "ipad-2",
    "ipad-mini",
    [1024, 768],
    [1280, 800],
  ];

  it("renders core pages without overflow and with reachable nav", () => {
    cy.visit("/");
    viewports.forEach((vp) => {
      if (Array.isArray(vp)) cy.viewport(vp[0], vp[1]);
      else cy.viewport(vp);
      cy.findByRole("banner").should("exist");
      cy.findByRole("main").should("exist");
      cy.window().then((win) => {
        const hasHScroll =
          win.document.documentElement.scrollWidth >
          win.document.documentElement.clientWidth + 2;
        expect(hasHScroll).to.eq(false);
      });
    });
  });
});
