describe("Upload flows including network interruption and server failure", () => {
  it("rejects missing file and shows a friendly error", () => {
    cy.visit("/");
    cy.findByRole("button", { name: /upload and parse/i }).click();
    cy.findByRole("alert").should("exist");
  });

  it("simulates server failure via header and shows error", () => {
    cy.intercept("POST", "/api/upload", (req) => {
      req.headers["x-test-fail"] = "1";
    }).as("uploadFail");
    cy.visit("/");
    const pdf = "cypress/fixtures/sample.pdf";
    cy.findByLabelText(/file/i).selectFile(pdf);
    cy.findByRole("button", { name: /upload and parse/i }).click();
    cy.wait("@uploadFail");
    cy.findByRole("alert").should("exist");
  });

  it("aborts request mid-flight to simulate network interruption", () => {
    cy.intercept("POST", "/api/upload", (req) => {
      // Delay then abort
      setTimeout(() => req.destroy(), 200);
    }).as("uploadAbort");
    cy.visit("/");
    const pdf = "cypress/fixtures/sample.pdf";
    cy.findByLabelText(/file/i).selectFile(pdf);
    cy.findByRole("button", { name: /upload and parse/i }).click();
    cy.wait("@uploadAbort");
    cy.findByRole("alert").should("exist");
  });
});
