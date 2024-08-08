const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const ExcelJS = require("exceljs");

const app = express();

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Pranshu25@",
  database: "consolidation_db",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to database");
});

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(flash());

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.flash("message", "Please login first.");
    res.redirect("/");
  }
};

// Routes
app.get("/", (req, res) => {
  res.render("home", { message: req.flash("message") });
});

app.get("/login", (req, res) => {
  res.render("login", { message: req.flash("message") });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], (err, results) => {
    if (err) throw err;
    if (results.length === 0) {
      req.flash("message", "Username not found. Please register.");
      res.redirect("/");
    } else {
      const user = results[0];
      if (user.password === password) {
        req.session.user = user;
        res.redirect("/dashboard");
      } else {
        req.flash("message", "Incorrect password.");
        res.redirect("/");
      }
    }
  });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const query = "INSERT INTO users (username, password) VALUES (?, ?)";
  db.query(query, [username, password], (err, result) => {
    if (err) throw err;
    req.flash("message", "Registration successful. Please login.");
    res.redirect("/login");
  });
});

app.get("/dashboard", isAuthenticated, (req, res) => {
  res.render("dashboard", { user: req.session.user });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/");
  });
});

app.get("/welc", isAuthenticated, (req, res) => {
  res.render("welc", { user: req.session.user });
});

app.get("/provisional", isAuthenticated, (req, res) => {
  const query = "SELECT * FROM companies";
  db.query(query, (err, results) => {
    if (err) throw err;
    res.render("provisional", { user: req.session.user, companies: results });
  });
});

app.post("/deleteCompany/:id", isAuthenticated, (req, res) => {
  const companyId = req.params.id;

  // Delete related records from the `capex` table first
  const deleteCapexRecordsQuery =
    "DELETE FROM capex WHERE case_id IN (SELECT id FROM cases WHERE company_id = ?)";
  db.query(deleteCapexRecordsQuery, [companyId], (err, results) => {
    if (err) throw err;

    // Delete related records from the `opex` table
    const deleteOpexRecordsQuery =
      "DELETE FROM opex WHERE case_id IN (SELECT id FROM cases WHERE company_id = ?)";
    db.query(deleteOpexRecordsQuery, [companyId], (err, results) => {
      if (err) throw err;

      // Delete related records from the `cases` table
      const deleteCaseRecordsQuery = "DELETE FROM cases WHERE company_id = ?";
      db.query(deleteCaseRecordsQuery, [companyId], (err, results) => {
        if (err) throw err;

        // Finally, delete the company from the `comp_disc` table
        const deleteCompanyQuery = "DELETE FROM companies WHERE id = ?";
        db.query(deleteCompanyQuery, [companyId], (err, results) => {
          if (err) throw err;
          res.redirect("/provisional");
        });
      });
    });
  });
});

app.get("/provCapex", isAuthenticated, (req, res) => {
  const query = "SELECT * FROM companies";
  db.query(query, (err, results) => {
    if (err) throw err;
    res.render("provCapex", { user: req.session.user, companies: results });
  });
});

app.post("/removeCompanyCapex/:id", isAuthenticated, (req, res) => {
  const companyId = req.params.id;

  // Delete related records from the `capex` table first
  const deleteCapexRecordsQuery =
    "DELETE FROM capex WHERE case_id IN (SELECT id FROM cases WHERE company_id = ?)";
  db.query(deleteCapexRecordsQuery, [companyId], (err, results) => {
    if (err) throw err;

    // Delete related records from the `opex` table
    const deleteOpexRecordsQuery =
      "DELETE FROM opex WHERE case_id IN (SELECT id FROM cases WHERE company_id = ?)";
    db.query(deleteOpexRecordsQuery, [companyId], (err, results) => {
      if (err) throw err;

      // Delete related records from the `cases` table
      const deleteCaseRecordsQuery = "DELETE FROM cases WHERE company_id = ?";
      db.query(deleteCaseRecordsQuery, [companyId], (err, results) => {
        if (err) throw err;

        // Finally, delete the company from the `comp_disc` table
        const deleteCompanyQuery = "DELETE FROM companies WHERE id = ?";
        db.query(deleteCompanyQuery, [companyId], (err, results) => {
          if (err) throw err;
          res.redirect("/provCapex");
        });
      });
    });
  });
});

app.get("/provOpex", isAuthenticated, (req, res) => {
  const query = "SELECT * FROM companies";
  db.query(query, (err, results) => {
    if (err) throw err;
    res.render("provOpex", { user: req.session.user, companies: results });
  });
});

app.post("/deleteCompanyOpex/:id", isAuthenticated, (req, res) => {
  const companyId = req.params.id;

  // Delete related records from the `capex` table first
  const deleteCapexRecordsQuery =
    "DELETE FROM capex WHERE case_id IN (SELECT id FROM cases WHERE company_id = ?)";
  db.query(deleteCapexRecordsQuery, [companyId], (err, results) => {
    if (err) throw err;

    // Delete related records from the `opex` table
    const deleteOpexRecordsQuery =
      "DELETE FROM opex WHERE case_id IN (SELECT id FROM cases WHERE company_id = ?)";
    db.query(deleteOpexRecordsQuery, [companyId], (err, results) => {
      if (err) throw err;

      // Delete related records from the `cases` table
      const deleteCaseRecordsQuery = "DELETE FROM cases WHERE company_id = ?";
      db.query(deleteCaseRecordsQuery, [companyId], (err, results) => {
        if (err) throw err;

        // Finally, delete the company from the `comp_disc` table
        const deleteCompanyQuery = "DELETE FROM companies WHERE id = ?";
        db.query(deleteCompanyQuery, [companyId], (err, results) => {
          if (err) throw err;
          res.redirect("/provOpex");
        });
      });
    });
  });
});

app.get("/provSummary", isAuthenticated, (req, res) => {
  const query = "SELECT * FROM companies";
  db.query(query, (err, results) => {
    if (err) throw err;
    res.render("provSummary", { user: req.session.user, companies: results });
  });
});

app.post("/addCompany", isAuthenticated, (req, res) => {
  const { name } = req.body;
  const query = "INSERT INTO companies (name) VALUES (?)";
  db.query(query, [name], (err, result) => {
    if (err) throw err;
    res.redirect("/provisional");
  });
});

app.post("/addCompanyCapex", isAuthenticated, (req, res) => {
  const { name } = req.body;
  const query = "INSERT INTO companies (name) VALUES (?)";
  db.query(query, [name], (err, result) => {
    if (err) throw err;
    res.redirect("/provCapex");
  });
});

app.post("/addCompanyOpex", isAuthenticated, (req, res) => {
  const { name } = req.body;
  const query = "INSERT INTO companies (name) VALUES (?)";
  db.query(query, [name], (err, result) => {
    if (err) throw err;
    res.redirect("/provOpex");
  });
});

app.get(
  "/proposedDashboard/:companyId/:caseId",
  isAuthenticated,
  (req, res) => {
    const { companyId, caseId } = req.params;

    const companyQuery = "SELECT name FROM companies WHERE id = ?";
    const caseQuery = "SELECT case_name FROM cases WHERE id = ?";
    const capexQuery =
      "SELECT * FROM capex WHERE company_id = ? AND case_id = ?";
    const opexQuery = "SELECT * FROM opex WHERE company_id = ? AND case_id = ?";

    db.query(companyQuery, [companyId], (companyErr, companyResults) => {
      if (companyErr) throw companyErr;
      const companyName = companyResults[0].name;

      db.query(caseQuery, [caseId], (caseErr, caseResults) => {
        if (caseErr) throw caseErr;
        const caseName = caseResults[0].case_name;

        db.query(capexQuery, [companyId, caseId], (capexErr, capexResults) => {
          if (capexErr) throw capexErr;

          db.query(opexQuery, [companyId, caseId], (opexErr, opexResults) => {
            if (opexErr) throw opexErr;

            // Calculate the Capex totals for each year
            const capexTotal = capexResults.reduce(
              (acc, item) => {
                acc.year1 += item.rate * item.quantity;
                acc.year2 += 0;
                acc.year3 += 0;
                acc.year4 += 0;
                acc.year5 += 0;
                return acc;
              },
              { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 }
            );

            // Calculate the Opex totals for each year
            const opexTotal = opexResults.reduce(
              (acc, item) => {
                acc.year1 += item.year1;
                acc.year2 += item.year2;
                acc.year3 += item.year3;
                acc.year4 += item.year4;
                acc.year5 += item.year5;
                return acc;
              },
              { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 }
            );

            res.render("proposedDashboard", {
              user: req.session.user,
              companyName: companyName,
              caseName: caseName,
              capex: capexResults,
              opex: opexResults,
              capexTotal: capexTotal,
              opexTotal: opexTotal,
              companyId: companyId,
              caseId: caseId,
            });
          });
        });
      });
    });
  }
);

app.get("/addCase/:companyId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const queryCompany = "SELECT name FROM companies WHERE id = ?";
  const queryCases = "SELECT * FROM cases WHERE company_id = ?";

  db.query(queryCompany, [companyId], (err, companyResults) => {
    if (err) throw err;

    const companyName = companyResults[0].name;

    db.query(queryCases, [companyId], (err, caseResults) => {
      if (err) throw err;
      res.render("addCase", {
        user: req.session.user,
        companyId: companyId,
        companyName: companyName,
        cases: caseResults,
      });
    });
  });
});

app.post("/deleteCase/:companyId/:caseId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const caseId = req.params.caseId;

  // First, delete all related records from the capex table
  const deleteCapexRecordsQuery = "DELETE FROM capex WHERE case_id = ?";
  db.query(deleteCapexRecordsQuery, [caseId], (err, results) => {
    if (err) throw err;

    // Then, delete all related records from the opex table
    const deleteOpexRecordsQuery = "DELETE FROM opex WHERE case_id = ?";
    db.query(deleteOpexRecordsQuery, [caseId], (err, results) => {
      if (err) throw err;

      // Finally, delete the case from the cases table
      const deleteCaseQuery =
        "DELETE FROM cases WHERE id = ? AND company_id = ?";
      db.query(deleteCaseQuery, [caseId, companyId], (err, results) => {
        if (err) throw err;
        res.redirect(`/addCase/${companyId}`);
      });
    });
  });
});

// Add CaseCapex Route
app.get("/addCaseCapex/:companyId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const queryCompany = "SELECT name FROM companies WHERE id = ?";
  const queryCases = "SELECT * FROM cases WHERE company_id = ?";

  db.query(queryCompany, [companyId], (err, companyResults) => {
    if (err) throw err;

    const companyName = companyResults[0].name;

    db.query(queryCases, [companyId], (err, caseResults) => {
      if (err) throw err;
      res.render("addCaseCapex", {
        user: req.session.user,
        companyId: companyId,
        companyName: companyName,
        cases: caseResults,
      });
    });
  });
});

// Delete Case Route
app.post("/deleteCaseCapex/:companyId/:caseId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const caseId = req.params.caseId;

  // First, delete all related records from the capex table
  const deleteCapexRecordsQuery = "DELETE FROM capex WHERE case_id = ?";
  db.query(deleteCapexRecordsQuery, [caseId], (err, results) => {
    if (err) throw err;

    // Then, delete all related records from the opex table
    const deleteOpexRecordsQuery = "DELETE FROM opex WHERE case_id = ?";
    db.query(deleteOpexRecordsQuery, [caseId], (err, results) => {
      if (err) throw err;

      // Finally, delete the case from the cases table
      const deleteCaseQuery =
        "DELETE FROM cases WHERE id = ? AND company_id = ?";
      db.query(deleteCaseQuery, [caseId, companyId], (err, results) => {
        if (err) throw err;
        res.redirect(`/addCaseCapex/${companyId}`);
      });
    });
  });
});

app.get("/addCaseOpex/:companyId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const queryCompany = "SELECT name FROM companies WHERE id = ?";
  const queryCases = "SELECT * FROM cases WHERE company_id = ?";

  db.query(queryCompany, [companyId], (err, companyResults) => {
    if (err) throw err;

    const companyName = companyResults[0].name;

    db.query(queryCases, [companyId], (err, caseResults) => {
      if (err) throw err;
      res.render("addCaseOpex", {
        user: req.session.user,
        companyId: companyId,
        companyName: companyName,
        cases: caseResults,
      });
    });
  });
});

app.post("/deleteCaseOpex/:companyId/:caseId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const caseId = req.params.caseId;

  // First, delete all related records from the capex table
  const deleteCapexRecordsQuery = "DELETE FROM capex WHERE case_id = ?";
  db.query(deleteCapexRecordsQuery, [caseId], (err, results) => {
    if (err) throw err;

    // Then, delete all related records from the opex table
    const deleteOpexRecordsQuery = "DELETE FROM opex WHERE case_id = ?";
    db.query(deleteOpexRecordsQuery, [caseId], (err, results) => {
      if (err) throw err;

      // Finally, delete the case from the cases table
      const deleteCaseQuery =
        "DELETE FROM cases WHERE id = ? AND company_id = ?";
      db.query(deleteCaseQuery, [caseId, companyId], (err, results) => {
        if (err) throw err;
        res.redirect(`/addCaseOpex/${companyId}`);
      });
    });
  });
});

app.get("/addCaseSummary/:companyId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const queryCompany = "SELECT name FROM companies WHERE id = ?";
  const queryCases = "SELECT * FROM cases WHERE company_id = ?";

  db.query(queryCompany, [companyId], (err, companyResults) => {
    if (err) throw err;

    const companyName = companyResults[0].name;

    db.query(queryCases, [companyId], (err, caseResults) => {
      if (err) throw err;
      res.render("addCaseSummary", {
        user: req.session.user,
        companyId: companyId,
        companyName: companyName,
        cases: caseResults,
      });
    });
  });
});

app.post("/addCase/:companyId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const { caseName } = req.body;
  const query = "INSERT INTO cases (company_id, case_name) VALUES (?, ?)";
  db.query(query, [companyId, caseName], (err, result) => {
    if (err) throw err;
    res.redirect(`/addCase/${companyId}`);
  });
});

app.post("/addCaseCapex/:companyId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const { caseName } = req.body;
  const query = "INSERT INTO cases (company_id, case_name) VALUES (?, ?)";
  db.query(query, [companyId, caseName], (err, result) => {
    if (err) throw err;
    res.redirect(`/addCaseCapex/${companyId}`);
  });
});

app.post("/addCaseOpex/:companyId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const { caseName } = req.body;
  const query = "INSERT INTO cases (company_id, case_name) VALUES (?, ?)";
  db.query(query, [companyId, caseName], (err, result) => {
    if (err) throw err;
    res.redirect(`/addCaseOpex/${companyId}`);
  });
});

app.get("/addCapex/:companyId/:caseId", isAuthenticated, (req, res) => {
  const { companyId, caseId } = req.params;

  // Query to get the company and case names
  const getNamesQuery = `
    SELECT companies.name AS companyName, cases.case_name AS caseName
    FROM companies
    JOIN cases ON companies.id = cases.company_id
    WHERE companies.id = ? AND cases.id = ?
  `;

  // Query to get the capex data
  const capexQuery = "SELECT * FROM capex WHERE company_id = ? AND case_id = ?";

  db.query(getNamesQuery, [companyId, caseId], (err, namesResult) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (namesResult.length === 0) {
      return res.status(404).send("Company or Case not found");
    }

    const companyName = namesResult[0].companyName;
    const caseName = namesResult[0].caseName;

    db.query(capexQuery, [companyId, caseId], (err, capexResult) => {
      if (err) {
        console.error("Error executing query:", err);
        return res.status(500).send("Internal Server Error");
      }

      res.render("addCapex", {
        user: req.session.user,
        companyId: companyId, // Include companyId
        caseId: caseId, // Include caseId
        companyName: companyName,
        caseName: caseName,
        capex: capexResult,
      });
    });
  });
});

app.post("/addCapex/:companyId/:caseId", isAuthenticated, (req, res) => {
  const { companyId, caseId } = req.params;
  const { item, rate, quantity } = req.body;
  const query =
    "INSERT INTO capex (company_id, case_id, item, rate, quantity) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [companyId, caseId, item, rate, quantity], (err, result) => {
    if (err) throw err;
    console.log("data saved");
    res.redirect(`/addCapex/${companyId}/${caseId}`);
  });
});

app.get("/editCapex/:id", isAuthenticated, (req, res) => {
  const capexId = req.params.id;
  const query = `
    SELECT capex.*, companies.name AS company_name, cases.case_name
    FROM capex
    JOIN companies ON capex.company_id = companies.id
    JOIN cases ON capex.case_id = cases.id
    WHERE capex.id = ?`;

  db.query(query, [capexId], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.render("editCapex", {
        user: req.session.user,
        companyName: results[0].company_name,
        caseName: results[0].case_name, // Include case name
        capex: results[0],
      });
    } else {
      res.status(404).send("Capex item not found");
    }
  });
});

app.post("/editCapex/:id", isAuthenticated, (req, res) => {
  const capexId = req.params.id;
  const { companyId, caseId, item, rate, quantity } = req.body; // Include caseId
  const query =
    "UPDATE capex SET item = ?, rate = ?, quantity = ? WHERE id = ?";
  db.query(query, [item, rate, quantity, capexId], (err, results) => {
    if (err) throw err;
    res.redirect(`/addCapex/${companyId}/${caseId}`); // Redirect to the correct case
  });
});

app.get("/deleteCapex/:id", isAuthenticated, (req, res) => {
  const id = req.params.id;
  const { companyId, caseId } = req.query;

  if (!companyId || !caseId) {
    console.error("Missing companyId or caseId in query parameters");
    return res.status(400).send("Bad Request: Missing companyId or caseId");
  }

  console.log(
    `Deleting Capex with id: ${id} for companyId: ${companyId}, caseId: ${caseId}`
  );

  const query = "DELETE FROM capex WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }
    if (result.affectedRows === 0) {
      console.error(`No Capex found with id: ${id}`);
      return res
        .status(404)
        .send("Not Found: No Capex found with the given id");
    }
    res.redirect(`/addCapex/${companyId}/${caseId}`);
  });
});

app.get("/addOpex/:companyId/:caseId", isAuthenticated, (req, res) => {
  const { companyId, caseId } = req.params;

  // Query to get company and case names
  const companyQuery = "SELECT name FROM companies WHERE id = ?";
  const caseQuery = "SELECT case_name FROM cases WHERE id = ?";

  // Query to get opex records
  const opexQuery = "SELECT * FROM opex WHERE company_id = ? AND case_id = ?";

  db.query(companyQuery, [companyId], (err, companyResult) => {
    if (err) throw err;
    const companyName = companyResult[0].name;

    db.query(caseQuery, [caseId], (err, caseResult) => {
      if (err) throw err;
      const caseName = caseResult[0].case_name;

      db.query(opexQuery, [companyId, caseId], (err, opexResults) => {
        if (err) throw err;
        res.render("addOpex", {
          user: req.session.user,
          companyName: companyName,
          caseName: caseName,
          companyId: companyId,
          caseId: caseId,
          opex: opexResults,
        });
      });
    });
  });
});

app.post("/addOpex/:companyId/:caseId", isAuthenticated, (req, res) => {
  const { companyId, caseId } = req.params;
  const { item, rate, quantity, payment_year } = req.body;
  let year1 = 0,
    year2 = 0,
    year3 = 0,
    year4 = 0,
    year5 = 0;

  if (payment_year == 0) {
    year1 = year2 = year3 = year4 = year5 = rate * quantity;
  } else {
    if (payment_year <= 4) year5 = rate * quantity;
    if (payment_year <= 3) year4 = rate * quantity;
    if (payment_year <= 2) year3 = rate * quantity;
    if (payment_year <= 1) year2 = rate * quantity;
  }

  const query = `
    INSERT INTO opex (company_id, case_id, item, rate, quantity, payment_year, year1, year2, year3, year4, year5)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    query,
    [
      companyId,
      caseId,
      item,
      rate,
      quantity,
      payment_year,
      year1,
      year2,
      year3,
      year4,
      year5,
    ],
    (err, result) => {
      if (err) throw err;
      res.redirect(`/addOpex/${companyId}/${caseId}`);
    }
  );
});

app.get("/editOpex/:id", isAuthenticated, (req, res) => {
  const opexId = req.params.id;
  const query = `
    SELECT opex.*, companies.name AS company_name, cases.case_name
    FROM opex
    JOIN companies ON opex.company_id = companies.id
    JOIN cases ON opex.case_id = cases.id
    WHERE opex.id = ?`;

  db.query(query, [opexId], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.render("editOpex", {
        user: req.session.user,
        companyName: results[0].company_name,
        caseName: results[0].case_name,
        opex: results[0],
      });
    } else {
      res.status(404).send("Opex item not found");
    }
  });
});

app.post("/editOpex/:id", isAuthenticated, (req, res) => {
  const opexId = req.params.id;
  const { companyId, caseId, item, rate, quantity, payment_year } = req.body;
  let year1 = 0,
    year2 = 0,
    year3 = 0,
    year4 = 0,
    year5 = 0;

  if (payment_year == 0) {
    year1 = year2 = year3 = year4 = year5 = rate * quantity;
  } else {
    if (payment_year <= 4) year5 = rate * quantity;
    if (payment_year <= 3) year4 = rate * quantity;
    if (payment_year <= 2) year3 = rate * quantity;
    if (payment_year <= 1) year2 = rate * quantity;
  }

  const query =
    "UPDATE opex SET item = ?, rate = ?, quantity = ?, payment_year = ?, year1 = ?, year2 = ?, year3 = ?, year4 = ?, year5 = ? WHERE id = ? AND company_id = ? AND case_id = ?";
  db.query(
    query,
    [
      item,
      rate,
      quantity,
      payment_year,
      year1,
      year2,
      year3,
      year4,
      year5,
      opexId,
      companyId,
      caseId,
    ],
    (err, results) => {
      if (err) throw err;
      res.redirect(`/addOpex/${companyId}/${caseId}`);
    }
  );
});

app.get("/deleteOpex/:id", isAuthenticated, (req, res) => {
  const id = req.params.id;
  const { companyId, caseId } = req.query; // Extract query parameters
  const query =
    "DELETE FROM opex WHERE id = ? AND company_id = ? AND case_id = ?";
  db.query(query, [id, companyId, caseId], (err, result) => {
    if (err) throw err;
    res.redirect(`/addOpex/${companyId}/${caseId}`);
  });
});

// View summary route
app.get("/viewSummary/:companyId/:caseId", isAuthenticated, (req, res) => {
  const { companyId, caseId } = req.params;

  const companyQuery = "SELECT name FROM companies WHERE id = ?";
  const caseQuery = "SELECT case_name FROM cases WHERE id = ?";
  const capexQuery = "SELECT * FROM capex WHERE company_id = ? AND case_id = ?";
  const opexQuery = "SELECT * FROM opex WHERE company_id = ? AND case_id = ?";

  db.query(companyQuery, [companyId], (companyErr, companyResults) => {
    if (companyErr) throw companyErr;

    const companyName = companyResults[0].name;

    db.query(caseQuery, [caseId], (caseErr, caseResults) => {
      if (caseErr) throw caseErr;

      const caseName = caseResults[0].case_name;

      db.query(capexQuery, [companyId, caseId], (capexErr, capexResults) => {
        if (capexErr) throw capexErr;

        db.query(opexQuery, [companyId, caseId], (opexErr, opexResults) => {
          if (opexErr) throw opexErr;

          const capexTotal = capexResults.reduce(
            (acc, item) => {
              acc.year1 += item.rate * item.quantity;
              acc.year2 += 0;
              acc.year3 += 0;
              acc.year4 += 0;
              acc.year5 += 0;
              return acc;
            },
            { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 }
          );

          const opexTotal = opexResults.reduce(
            (acc, item) => {
              acc.year1 += item.year1;
              acc.year2 += item.year2;
              acc.year3 += item.year3;
              acc.year4 += item.year4;
              acc.year5 += item.year5;
              return acc;
            },
            { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 }
          );

          res.render("viewSummary", {
            companyName,
            caseName,
            capex: capexResults,
            opex: opexResults,
            capexTotal,
            opexTotal,
          });
        });
      });
    });
  });
});

app.get("/disc", isAuthenticated, (req, res) => {
  const query = "SELECT * FROM comp_disc";
  db.query(query, (err, results) => {
    if (err) throw err;
    res.render("disc", { user: req.session.user, companies: results });
  });
});

app.post("/deleteCompanyDisc/:id", isAuthenticated, (req, res) => {
  const companyId = req.params.id;

  // First, delete all related records from the `capex_disc` table
  const deleteCapexDiscRecordsQuery =
    "DELETE FROM capex_disc WHERE company_id = ?";
  db.query(deleteCapexDiscRecordsQuery, [companyId], (err, results) => {
    if (err) throw err;

    // Then, delete all related records from the `case_disc` table
    const deleteCaseDiscRecordsQuery =
      "DELETE FROM case_disc WHERE company_id = ?";
    db.query(deleteCaseDiscRecordsQuery, [companyId], (err, results) => {
      if (err) throw err;

      // Then, delete all related records from the `opex_disc` table
      const deleteOpexDiscRecordsQuery =
        "DELETE FROM opex_disc WHERE company_id = ?";
      db.query(deleteOpexDiscRecordsQuery, [companyId], (err, results) => {
        if (err) throw err;

        // Finally, delete the company from the `comp_disc` table
        const deleteCompanyQuery = "DELETE FROM comp_disc WHERE id = ?";
        db.query(deleteCompanyQuery, [companyId], (err, results) => {
          if (err) throw err;
          res.redirect("/disc");
        });
      });
    });
  });
});

app.get("/discCapex", isAuthenticated, (req, res) => {
  const query = "SELECT * FROM comp_disc";
  db.query(query, (err, results) => {
    if (err) throw err;
    res.render("discCapex", { user: req.session.user, companies: results });
  });
});

app.post("/addCompanyDiscCapex", isAuthenticated, (req, res) => {
  const { name } = req.body;
  const query = "INSERT INTO comp_disc (name) VALUES (?)";
  db.query(query, [name], (err, result) => {
    if (err) throw err;
    res.redirect("/discCapex");
  });
});

app.post("/deleteCompanyDiscCapex/:id", isAuthenticated, (req, res) => {
  const companyId = req.params.id;

  // First, delete all related records from the `capex_disc` table
  const deleteCapexDiscRecordsQuery =
    "DELETE FROM capex_disc WHERE company_id = ?";
  db.query(deleteCapexDiscRecordsQuery, [companyId], (err, results) => {
    if (err) throw err;

    // Then, delete all related records from the `case_disc` table
    const deleteCaseDiscRecordsQuery =
      "DELETE FROM case_disc WHERE company_id = ?";
    db.query(deleteCaseDiscRecordsQuery, [companyId], (err, results) => {
      if (err) throw err;

      // Then, delete all related records from the `opex_disc` table
      const deleteOpexDiscRecordsQuery =
        "DELETE FROM opex_disc WHERE company_id = ?";
      db.query(deleteOpexDiscRecordsQuery, [companyId], (err, results) => {
        if (err) throw err;

        // Finally, delete the company from the `comp_disc` table
        const deleteCompanyQuery = "DELETE FROM comp_disc WHERE id = ?";
        db.query(deleteCompanyQuery, [companyId], (err, results) => {
          if (err) throw err;
          res.redirect("/discCapex");
        });
      });
    });
  });
});

app.get("/discOpex", isAuthenticated, (req, res) => {
  const query = "SELECT * FROM comp_disc";
  db.query(query, (err, results) => {
    if (err) throw err;
    res.render("discOpex", { user: req.session.user, companies: results });
  });
});

app.post("/addCompanyDiscOpex", isAuthenticated, (req, res) => {
  const { name } = req.body;
  const query = "INSERT INTO comp_disc (name) VALUES (?)";
  db.query(query, [name], (err, result) => {
    if (err) throw err;
    res.redirect("/discOpex");
  });
});

app.post("/deleteCompanyDiscOpex/:id", isAuthenticated, (req, res) => {
  const companyId = req.params.id;

  // First, delete all related records from the `capex_disc` table
  const deleteCapexDiscRecordsQuery =
    "DELETE FROM capex_disc WHERE company_id = ?";
  db.query(deleteCapexDiscRecordsQuery, [companyId], (err, results) => {
    if (err) throw err;

    // Then, delete all related records from the `case_disc` table
    const deleteCaseDiscRecordsQuery =
      "DELETE FROM case_disc WHERE company_id = ?";
    db.query(deleteCaseDiscRecordsQuery, [companyId], (err, results) => {
      if (err) throw err;

      // Then, delete all related records from the `opex_disc` table
      const deleteOpexDiscRecordsQuery =
        "DELETE FROM opex_disc WHERE company_id = ?";
      db.query(deleteOpexDiscRecordsQuery, [companyId], (err, results) => {
        if (err) throw err;

        // Finally, delete the company from the `comp_disc` table
        const deleteCompanyQuery = "DELETE FROM comp_disc WHERE id = ?";
        db.query(deleteCompanyQuery, [companyId], (err, results) => {
          if (err) throw err;
          res.redirect("/discOpex");
        });
      });
    });
  });
});

app.get("/discSummary", isAuthenticated, (req, res) => {
  const query = "SELECT * FROM comp_disc";
  db.query(query, (err, results) => {
    if (err) throw err;
    res.render("discSummary", { user: req.session.user, companies: results });
  });
});

app.post("/addCompanyDisc", isAuthenticated, (req, res) => {
  const { name } = req.body;
  const query = "INSERT INTO comp_disc (name) VALUES (?)";
  db.query(query, [name], (err, result) => {
    if (err) throw err;
    res.redirect("/disc");
  });
});

app.get("/discDashboard/:companyId/:caseId", isAuthenticated, (req, res) => {
  const { companyId, caseId } = req.params;

  const companyQuery = "SELECT name FROM comp_disc WHERE id = ?";
  const caseQuery = "SELECT case_name FROM case_disc WHERE id = ?";
  const capexQuery =
    "SELECT * FROM capex_disc WHERE company_id = ? AND case_id = ?";
  const opexQuery =
    "SELECT * FROM opex_disc WHERE company_id = ? AND case_id = ?";

  db.query(companyQuery, [companyId], (companyErr, companyResults) => {
    if (companyErr) throw companyErr;
    const companyName = companyResults[0].name;

    db.query(caseQuery, [caseId], (caseErr, caseResults) => {
      if (caseErr) throw caseErr;
      const caseName = caseResults[0].case_name;

      db.query(capexQuery, [companyId, caseId], (capexErr, capexResults) => {
        if (capexErr) throw capexErr;

        db.query(opexQuery, [companyId, caseId], (opexErr, opexResults) => {
          if (opexErr) throw opexErr;

          // Calculate the Capex totals for each year
          const capexTotal = capexResults.reduce(
            (acc, item) => {
              acc.year1 += item.rate * item.quantity;
              acc.year2 += 0;
              acc.year3 += 0;
              acc.year4 += 0;
              acc.year5 += 0;
              return acc;
            },
            { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 }
          );

          // Calculate the Opex totals for each year
          const opexTotal = opexResults.reduce(
            (acc, item) => {
              acc.year1 += item.year1;
              acc.year2 += item.year2;
              acc.year3 += item.year3;
              acc.year4 += item.year4;
              acc.year5 += item.year5;
              return acc;
            },
            { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 }
          );

          res.render("discDashboard", {
            user: req.session.user,
            companyName: companyName,
            caseName: caseName,
            capex: capexResults,
            opex: opexResults,
            capexTotal: capexTotal,
            opexTotal: opexTotal,
            companyId: companyId,
            caseId: caseId,
          });
        });
      });
    });
  });
});

app.get("/addCaseDisc/:companyId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const queryCompany = "SELECT name FROM comp_disc WHERE id = ?";
  const queryCases = "SELECT * FROM case_disc WHERE company_id = ?";

  db.query(queryCompany, [companyId], (err, companyResults) => {
    if (err) throw err;

    const companyName = companyResults[0].name;

    db.query(queryCases, [companyId], (err, caseResults) => {
      if (err) throw err;
      res.render("addCaseDisc", {
        user: req.session.user,
        companyId: companyId,
        companyName: companyName,
        cases: caseResults,
      });
    });
  });
});

app.post("/deleteCaseDisc/:companyId/:caseId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const caseId = req.params.caseId;

  // First, delete all related records from the capex_disc table
  const deleteCapexDiscRecordsQuery =
    "DELETE FROM capex_disc WHERE case_id = ?";
  db.query(deleteCapexDiscRecordsQuery, [caseId], (err, results) => {
    if (err) throw err;

    // Then, delete all related records from the opex_disc table
    const deleteOpexDiscRecordsQuery =
      "DELETE FROM opex_disc WHERE case_id = ?";
    db.query(deleteOpexDiscRecordsQuery, [caseId], (err, results) => {
      if (err) throw err;

      // Finally, delete the case from the case_disc table
      const deleteCaseQuery =
        "DELETE FROM case_disc WHERE id = ? AND company_id = ?";
      db.query(deleteCaseQuery, [caseId, companyId], (err, results) => {
        if (err) throw err;
        res.redirect(`/addCaseDisc/${companyId}`);
      });
    });
  });
});

// Add CaseDiscCapex Route
app.get("/addCaseDiscCapex/:companyId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const queryCompany = "SELECT name FROM comp_disc WHERE id = ?";
  const queryCases = "SELECT * FROM case_disc WHERE company_id = ?";

  db.query(queryCompany, [companyId], (err, companyResults) => {
    if (err) throw err;

    const companyName = companyResults[0].name;

    db.query(queryCases, [companyId], (err, caseResults) => {
      if (err) throw err;
      res.render("addCaseDiscCapex", {
        user: req.session.user,
        companyId: companyId,
        companyName: companyName,
        cases: caseResults,
      });
    });
  });
});

// Delete Case Route

app.post(
  "/deleteCaseCapexDisc/:companyId/:caseId",
  isAuthenticated,
  (req, res) => {
    const companyId = req.params.companyId;
    const caseId = req.params.caseId;

    // First, delete all related records from the capex_disc table
    const deleteCapexDiscRecordsQuery =
      "DELETE FROM capex_disc WHERE case_id = ?";
    db.query(deleteCapexDiscRecordsQuery, [caseId], (err, results) => {
      if (err) throw err;

      // Then, delete all related records from the opex_disc table
      const deleteOpexDiscRecordsQuery =
        "DELETE FROM opex_disc WHERE case_id = ?";
      db.query(deleteOpexDiscRecordsQuery, [caseId], (err, results) => {
        if (err) throw err;

        // Finally, delete the case from the case_disc table
        const deleteCaseQuery =
          "DELETE FROM case_disc WHERE id = ? AND company_id = ?";
        db.query(deleteCaseQuery, [caseId, companyId], (err, results) => {
          if (err) throw err;
          res.redirect(`/addCaseDiscCapex/${companyId}`);
        });
      });
    });
  }
); // delete case capex

app.post("/addCaseCapexDisc/:companyId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const { caseName } = req.body;
  const query = "INSERT INTO case_disc (company_id, case_name) VALUES (?, ?)";
  db.query(query, [companyId, caseName], (err, result) => {
    if (err) throw err;
    res.redirect(`/addCaseDiscCapex/${companyId}`);
  });
});

app.get("/addCaseDiscOpex/:companyId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const queryCompany = "SELECT name FROM comp_disc WHERE id = ?";
  const queryCases = "SELECT * FROM case_disc WHERE company_id = ?";

  db.query(queryCompany, [companyId], (err, companyResults) => {
    if (err) throw err;

    const companyName = companyResults[0].name;

    db.query(queryCases, [companyId], (err, caseResults) => {
      if (err) throw err;
      res.render("addCaseDiscOpex", {
        user: req.session.user,
        companyId: companyId,
        companyName: companyName,
        cases: caseResults,
      });
    });
  });
});

app.post(
  "/deleteCaseOpexDisc/:companyId/:caseId",
  isAuthenticated,
  (req, res) => {
    const companyId = req.params.companyId;
    const caseId = req.params.caseId;

    // First, delete all related records from the capex_disc table
    const deleteCapexDiscRecordsQuery =
      "DELETE FROM capex_disc WHERE case_id = ?";
    db.query(deleteCapexDiscRecordsQuery, [caseId], (err, results) => {
      if (err) throw err;

      // Then, delete all related records from the opex_disc table
      const deleteOpexDiscRecordsQuery =
        "DELETE FROM opex_disc WHERE case_id = ?";
      db.query(deleteOpexDiscRecordsQuery, [caseId], (err, results) => {
        if (err) throw err;

        // Finally, delete the case from the case_disc table
        const deleteCaseQuery =
          "DELETE FROM case_disc WHERE id = ? AND company_id = ?";
        db.query(deleteCaseQuery, [caseId, companyId], (err, results) => {
          if (err) throw err;
          res.redirect(`/addCaseDiscOpex/${companyId}`);
        });
      });
    });
  }
);

app.post("/addCaseOpexDisc/:companyId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const { caseName } = req.body;
  const query = "INSERT INTO case_disc (company_id, case_name) VALUES (?, ?)";
  db.query(query, [companyId, caseName], (err, result) => {
    if (err) throw err;
    res.redirect(`/addCaseDiscOpex/${companyId}`);
  });
});

app.get("/addCaseDiscSummary/:companyId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const queryCompany = "SELECT name FROM comp_disc WHERE id = ?";
  const queryCases = "SELECT * FROM case_disc WHERE company_id = ?";

  db.query(queryCompany, [companyId], (err, companyResults) => {
    if (err) throw err;

    const companyName = companyResults[0].name;

    db.query(queryCases, [companyId], (err, caseResults) => {
      if (err) throw err;
      res.render("addCaseDiscSummary", {
        user: req.session.user,
        companyId: companyId,
        companyName: companyName,
        cases: caseResults,
      });
    });
  });
});

app.post("/addCaseDisc/:companyId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const { caseName } = req.body;
  const query = "INSERT INTO case_disc (company_id, case_name) VALUES (?, ?)";
  db.query(query, [companyId, caseName], (err, result) => {
    if (err) throw err;
    res.redirect(`/addCaseDisc/${companyId}`);
  });
});

app.get("/addCapexDisc/:companyId/:caseId", isAuthenticated, (req, res) => {
  const { companyId, caseId } = req.params;

  const companyQuery = "SELECT name FROM comp_disc WHERE id = ?";
  const caseQuery = "SELECT case_name FROM case_disc WHERE id = ?";

  const capexQuery =
    "SELECT * FROM capex_disc WHERE company_id = ? AND case_id = ?";

  db.query(companyQuery, [companyId], (err, companyResult) => {
    if (err) throw err;

    db.query(caseQuery, [caseId], (err, caseResult) => {
      if (err) throw err;

      db.query(capexQuery, [companyId, caseId], (err, capexResults) => {
        if (err) throw err;

        res.render("addCapexDisc", {
          user: req.session.user,
          companyId: companyId,
          caseId: caseId,
          companyName: companyResult[0].company_name,
          caseName: caseResult[0].case_name,
          capex: capexResults,
        });
      });
    });
  });
});

app.post("/addCapexDisc/:companyId/:caseId", isAuthenticated, (req, res) => {
  const { companyId, caseId } = req.params;
  const { item, rate, quantity } = req.body;
  const query =
    "INSERT INTO capex_disc (company_id, case_id, item, rate, quantity) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [companyId, caseId, item, rate, quantity], (err, result) => {
    if (err) throw err;
    console.log("data saved");
    res.redirect(`/addCapexDisc/${companyId}/${caseId}`);
  });
});

// Edit and delete routes

app.get("/editCapexDisc/:id", isAuthenticated, (req, res) => {
  const capexId = req.params.id;
  const query = `
    SELECT capex_disc.*, comp_disc.name AS company_name, case_disc.case_name
    FROM capex_disc
    JOIN comp_disc ON capex_disc.company_id = comp_disc.id
    JOIN case_disc ON capex_disc.case_id = case_disc.id
    WHERE capex_disc.id = ?`;

  db.query(query, [capexId], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.render("editCapexDisc", {
        user: req.session.user,
        companyName: results[0].company_name,
        caseName: results[0].case_name,
        capex: results[0],
      });
    } else {
      res.status(404).send("Capex item not found");
    }
  });
});

app.post("/editCapexDisc/:id", isAuthenticated, (req, res) => {
  const capexId = req.params.id;
  const { companyId, caseId, item, rate, quantity } = req.body; // Include caseId
  const query =
    "UPDATE capex_disc SET item = ?, rate = ?, quantity = ? WHERE id = ?";
  db.query(query, [item, rate, quantity, capexId], (err, results) => {
    if (err) throw err;
    res.redirect(`/addCapexDisc/${companyId}/${caseId}`); // Redirect to the correct case
  });
});

app.get("/deleteCapexDisc/:id", isAuthenticated, (req, res) => {
  const id = req.params.id;
  const { companyId, caseId } = req.query;

  if (!companyId || !caseId) {
    console.error("Missing companyId or caseId in query parameters");
    return res.status(400).send("Bad Request: Missing companyId or caseId");
  }

  console.log(
    `Deleting Capex with id: ${id} for companyId: ${companyId}, caseId: ${caseId}`
  );

  const query = "DELETE FROM capex_disc WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }
    if (result.affectedRows === 0) {
      console.error(`No Capex found with id: ${id}`);
      return res
        .status(404)
        .send("Not Found: No Capex found with the given id");
    }
    res.redirect(`/addCapexDisc/${companyId}/${caseId}`);
  });
});

app.get("/addOpexDisc/:companyId/:caseId", isAuthenticated, (req, res) => {
  const { companyId, caseId } = req.params;

  const companyQuery = "SELECT name FROM comp_disc WHERE id = ?";
  const caseQuery = "SELECT case_name FROM case_disc WHERE id = ?";
  const opexQuery =
    "SELECT * FROM opex_disc WHERE company_id = ? AND case_id = ?";

  db.query(companyQuery, [companyId], (companyErr, companyResult) => {
    if (companyErr) throw companyErr;

    db.query(caseQuery, [caseId], (caseErr, caseResult) => {
      if (caseErr) throw caseErr;

      db.query(opexQuery, [companyId, caseId], (opexErr, opexResults) => {
        if (opexErr) throw opexErr;

        res.render("addOpexDisc", {
          user: req.session.user,
          companyId: companyId,
          caseId: caseId,
          companyName: companyResult[0].name,
          caseName: caseResult[0].case_name,
          opex: opexResults,
        });
      });
    });
  });
});

app.post("/addOpexDisc/:companyId/:caseId", isAuthenticated, (req, res) => {
  const { companyId, caseId } = req.params;
  const { item, rate, quantity, payment_year } = req.body;
  let year1 = 0,
    year2 = 0,
    year3 = 0,
    year4 = 0,
    year5 = 0;

  if (payment_year == 0) {
    year1 = year2 = year3 = year4 = year5 = rate * quantity;
  } else {
    if (payment_year <= 4) year5 = rate * quantity;
    if (payment_year <= 3) year4 = rate * quantity;
    if (payment_year <= 2) year3 = rate * quantity;
    if (payment_year <= 1) year2 = rate * quantity;
  }

  const query = `
    INSERT INTO opex_disc (company_id, case_id, item, rate, quantity, payment_year, year1, year2, year3, year4, year5)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    query,
    [
      companyId,
      caseId,
      item,
      rate,
      quantity,
      payment_year,
      year1,
      year2,
      year3,
      year4,
      year5,
    ],
    (err, result) => {
      if (err) throw err;
      res.redirect(`/addOpexDisc/${companyId}/${caseId}`);
    }
  );
});

app.get("/editOpexDisc/:id", isAuthenticated, (req, res) => {
  const opexId = req.params.id;
  const query = `
    SELECT opex_disc.*, comp_disc.name AS company_name, case_disc.case_name
    FROM opex_disc
    JOIN comp_disc ON opex_disc.company_id = comp_disc.id
    JOIN case_disc ON opex_disc.case_id = case_disc.id
    WHERE opex_disc.id = ?`;

  db.query(query, [opexId], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.render("editOpexDisc", {
        user: req.session.user,
        companyName: results[0].company_name,
        caseName: results[0].case_name,
        opex: results[0],
      });
    } else {
      res.status(404).send("Opex item not found");
    }
  });
});

app.post("/editOpexDisc/:id", isAuthenticated, (req, res) => {
  const opexId = req.params.id;
  const { companyId, caseId, item, rate, quantity, payment_year } = req.body;
  let year1 = 0,
    year2 = 0,
    year3 = 0,
    year4 = 0,
    year5 = 0;

  if (payment_year == 0) {
    year1 = year2 = year3 = year4 = year5 = rate * quantity;
  } else {
    if (payment_year <= 4) year5 = rate * quantity;
    if (payment_year <= 3) year4 = rate * quantity;
    if (payment_year <= 2) year3 = rate * quantity;
    if (payment_year <= 1) year2 = rate * quantity;
  }

  const query =
    "UPDATE opex_disc SET item = ?, rate = ?, quantity = ?, payment_year = ?, year1 = ?, year2 = ?, year3 = ?, year4 = ?, year5 = ? WHERE id = ? AND company_id = ? AND case_id = ?";
  db.query(
    query,
    [
      item,
      rate,
      quantity,
      payment_year,
      year1,
      year2,
      year3,
      year4,
      year5,
      opexId,
      companyId,
      caseId,
    ],
    (err, results) => {
      if (err) throw err;
      res.redirect(`/addOpexDisc/${companyId}/${caseId}`);
    }
  );
});

app.get("/deleteOpexDisc/:id", isAuthenticated, (req, res) => {
  const id = req.params.id;
  const { companyId, caseId } = req.query; // Extract query parameters
  const query =
    "DELETE FROM opex_disc WHERE id = ? AND company_id = ? AND case_id = ?";
  db.query(query, [id, companyId, caseId], (err, result) => {
    if (err) throw err;
    res.redirect(`/addOpexDisc/${companyId}/${caseId}`);
  });
});

app.get("/viewSummaryDisc/:companyId/:caseId", isAuthenticated, (req, res) => {
  const { companyId, caseId } = req.params;

  const companyQuery = "SELECT name FROM comp_disc WHERE id = ?";
  const caseQuery = "SELECT case_name FROM case_disc WHERE id = ?";

  const capexQuery =
    "SELECT * FROM capex_disc WHERE company_id = ? AND case_id = ?";
  const opexQuery =
    "SELECT * FROM opex_disc WHERE company_id = ? AND case_id = ?";

  db.query(companyQuery, [companyId], (err, companyResult) => {
    if (err) throw err;

    db.query(caseQuery, [caseId], (err, caseResult) => {
      if (err) throw err;

      db.query(capexQuery, [companyId, caseId], (capexErr, capexResults) => {
        if (capexErr) throw capexErr;

        db.query(opexQuery, [companyId, caseId], (opexErr, opexResults) => {
          if (opexErr) throw opexErr;

          // Calculate the Capex totals for each year
          const capexTotal = capexResults.reduce(
            (acc, item) => {
              acc.year1 += item.rate * item.quantity;
              acc.year2 += 0;
              acc.year3 += 0;
              acc.year4 += 0;
              acc.year5 += 0;
              return acc;
            },
            { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 }
          );

          // Calculate the Opex totals for each year
          const opexTotal = opexResults.reduce(
            (acc, item) => {
              acc.year1 +=
                item.payment_year === 1 ? item.rate * item.quantity : 0;
              acc.year2 +=
                item.payment_year === 2 ? item.rate * item.quantity : 0;
              acc.year3 +=
                item.payment_year === 3 ? item.rate * item.quantity : 0;
              acc.year4 +=
                item.payment_year === 4 ? item.rate * item.quantity : 0;
              acc.year5 +=
                item.payment_year === 5 ? item.rate * item.quantity : 0;
              return acc;
            },
            { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 }
          );

          res.render("viewSummaryDisc", {
            companyName: companyResult[0].name,
            caseName: caseResult[0].case_name,
            capex: capexResults,
            opex: opexResults,
            capexTotal: capexTotal,
            opexTotal: opexTotal,
          });
        });
      });
    });
  });
});

app.get("/compare", isAuthenticated, (req, res) => {
  const query = `
    SELECT companies.name
    FROM companies
    INNER JOIN comp_disc ON companies.name = comp_disc.name
    WHERE companies.id IN (SELECT company_id FROM cases)
      AND comp_disc.id IN (SELECT company_id FROM case_disc)
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Internal Server Error");
    }
    console.log("Companies found:", results);
    res.render("compare", { user: req.session.user, companies: results });
  });
});
//   const companyName = req.params.companyName;
//   const casesQuery = `
//     SELECT case_name
//     FROM cases
//     WHERE company_id = (SELECT id FROM companies WHERE name = ?)
//     UNION
//     SELECT case_name
//     FROM case_disc
//     WHERE company_id = (SELECT id FROM companies WHERE name = ?)
//   `;
//   db.query(casesQuery, [companyName, companyName], (err, results) => {
//     if (err) throw err;
//     res.render("compareCases", {
//       user: req.session.user,
//       companyName: companyName,
//       cases: results,
//     });
//   });
// });

app.get("/compare/:companyName", isAuthenticated, (req, res) => {
  const companyName = req.params.companyName;
  const casesQuery = `
    SELECT case_name
    FROM cases
    WHERE company_id = (SELECT id FROM companies WHERE name = ?)
    AND case_name IN (
      SELECT case_name
      FROM case_disc
      WHERE company_id = (SELECT id FROM comp_disc WHERE name = ?)
    )
    UNION
    SELECT case_name
    FROM case_disc
    WHERE company_id = (SELECT id FROM comp_disc WHERE name = ?)
    AND case_name IN (
      SELECT case_name
      FROM cases
      WHERE company_id = (SELECT id FROM companies WHERE name = ?)
    )
  `;
  db.query(
    casesQuery,
    [companyName, companyName, companyName, companyName],
    (err, results) => {
      if (err) {
        console.error("Error executing query:", err);
        return res.status(500).send("Internal Server Error");
      }
      console.log("Cases found:", results);
      res.render("compareCases", {
        user: req.session.user,
        companyName: companyName,
        cases: results,
      });
    }
  );
});

app.get("/compare/:companyName/:caseName", isAuthenticated, (req, res) => {
  const companyName = req.params.companyName;
  const caseName = req.params.caseName;

  const capexQuery = `
    SELECT * 
    FROM capex 
    WHERE company_id = (SELECT id FROM companies WHERE name = ?)
      AND case_id = (SELECT id FROM cases WHERE case_name = ? AND company_id = (SELECT id FROM companies WHERE name = ?))
  `;
  const opexQuery = `
    SELECT * 
    FROM opex 
    WHERE company_id = (SELECT id FROM companies WHERE name = ?)
      AND case_id = (SELECT id FROM cases WHERE case_name = ? AND company_id = (SELECT id FROM companies WHERE name = ?))
  `;
  const capexDiscQuery = `
    SELECT * 
    FROM capex_disc 
    WHERE company_id = (SELECT id FROM comp_disc WHERE name = ?)
      AND case_id = (SELECT id FROM case_disc WHERE case_name = ? AND company_id = (SELECT id FROM comp_disc WHERE name = ?))
  `;
  const opexDiscQuery = `
    SELECT * 
    FROM opex_disc 
    WHERE company_id = (SELECT id FROM comp_disc WHERE name = ?)
      AND case_id = (SELECT id FROM case_disc WHERE case_name = ? AND company_id = (SELECT id FROM comp_disc WHERE name = ?))
  `;

  db.query(
    capexQuery,
    [companyName, caseName, companyName],
    (capexErr, capexResults) => {
      if (capexErr) throw capexErr;

      db.query(
        opexQuery,
        [companyName, caseName, companyName],
        (opexErr, opexResults) => {
          if (opexErr) throw opexErr;

          db.query(
            capexDiscQuery,
            [companyName, caseName, companyName],
            (capexDiscErr, capexDiscResults) => {
              if (capexDiscErr) throw capexDiscErr;

              db.query(
                opexDiscQuery,
                [companyName, caseName, companyName],
                (opexDiscErr, opexDiscResults) => {
                  if (opexDiscErr) throw opexDiscErr;

                  const capexTotal = capexResults.reduce(
                    (acc, item) => {
                      acc.year1 += item.rate * item.quantity;
                      acc.year2 += 0;
                      acc.year3 += 0;
                      acc.year4 += 0;
                      acc.year5 += 0;
                      return acc;
                    },
                    { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 }
                  );

                  const opexTotal = opexResults.reduce(
                    (acc, item) => {
                      acc.year1 += item.year1;
                      acc.year2 += item.year2;
                      acc.year3 += item.year3;
                      acc.year4 += item.year4;
                      acc.year5 += item.year5;
                      return acc;
                    },
                    { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 }
                  );

                  const capexDiscTotal = capexDiscResults.reduce(
                    (acc, item) => {
                      acc.year1 += item.rate * item.quantity;
                      acc.year2 += 0;
                      acc.year3 += 0;
                      acc.year4 += 0;
                      acc.year5 += 0;
                      return acc;
                    },
                    { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 }
                  );

                  const opexDiscTotal = opexDiscResults.reduce(
                    (acc, item) => {
                      acc.year1 += item.year1;
                      acc.year2 += item.year2;
                      acc.year3 += item.year3;
                      acc.year4 += item.year4;
                      acc.year5 += item.year5;
                      return acc;
                    },
                    { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 }
                  );

                  // Calculate differences
                  const diffYear1 =
                    capexTotal.year1 +
                    opexTotal.year1 -
                    (capexDiscTotal.year1 + opexDiscTotal.year1);
                  const diffYear2 =
                    capexTotal.year2 +
                    opexTotal.year2 -
                    (capexDiscTotal.year2 + opexDiscTotal.year2);
                  const diffYear3 =
                    capexTotal.year3 +
                    opexTotal.year3 -
                    (capexDiscTotal.year3 + opexDiscTotal.year3);
                  const diffYear4 =
                    capexTotal.year4 +
                    opexTotal.year4 -
                    (capexDiscTotal.year4 + opexDiscTotal.year4);
                  const diffYear5 =
                    capexTotal.year5 +
                    opexTotal.year5 -
                    (capexDiscTotal.year5 + opexDiscTotal.year5);

                  const discDiffYear1 = capexDiscTotal.year1 - capexTotal.year1;
                  const discDiffYear2 = capexDiscTotal.year2 - capexTotal.year2;
                  const discDiffYear3 = capexDiscTotal.year3 - capexTotal.year3;
                  const discDiffYear4 = capexDiscTotal.year4 - capexTotal.year4;
                  const discDiffYear5 = capexDiscTotal.year5 - capexTotal.year5;

                  res.render("compareSummary", {
                    user: req.session.user,
                    companyName: companyName,
                    caseName: caseName,
                    capex: capexResults,
                    opex: opexResults,
                    capexDisc: capexDiscResults,
                    opexDisc: opexDiscResults,
                    capexTotal: capexTotal,
                    opexTotal: opexTotal,
                    capexDiscTotal: capexDiscTotal,
                    opexDiscTotal: opexDiscTotal,
                    diffYear1: diffYear1,
                    diffYear2: diffYear2,
                    diffYear3: diffYear3,
                    diffYear4: diffYear4,
                    diffYear5: diffYear5,
                    discDiffYear1: discDiffYear1,
                    discDiffYear2: discDiffYear2,
                    discDiffYear3: discDiffYear3,
                    discDiffYear4: discDiffYear4,
                    discDiffYear5: discDiffYear5,
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

app.get(
  "/downloadExcel/:companyName/:caseName",
  isAuthenticated,
  (req, res) => {
    const companyName = req.params.companyName;
    const caseName = req.params.caseName;

    const capexQuery = `
    SELECT *
    FROM capex
    WHERE company_id = (SELECT id FROM companies WHERE name = ?)
      AND case_id = (SELECT id FROM cases WHERE case_name = ? AND company_id = (SELECT id FROM companies WHERE name = ?))
  `;
    const opexQuery = `
    SELECT *
    FROM opex
    WHERE company_id = (SELECT id FROM companies WHERE name = ?)
      AND case_id = (SELECT id FROM cases WHERE case_name = ? AND company_id = (SELECT id FROM companies WHERE name = ?))
  `;
    const capexDiscQuery = `
    SELECT *
    FROM capex_disc
    WHERE company_id = (SELECT id FROM comp_disc WHERE name = ?)
      AND case_id = (SELECT id FROM case_disc WHERE case_name = ? AND company_id = (SELECT id FROM comp_disc WHERE name = ?))
  `;
    const opexDiscQuery = `
    SELECT *
    FROM opex_disc
    WHERE company_id = (SELECT id FROM comp_disc WHERE name = ?)
      AND case_id = (SELECT id FROM case_disc WHERE case_name = ? AND company_id = (SELECT id FROM comp_disc WHERE name = ?))
  `;

    db.query(
      capexQuery,
      [companyName, caseName, companyName],
      (capexErr, capexResults) => {
        if (capexErr) {
          console.error("Error fetching capex data:", capexErr);
          res.status(500).send("Error fetching capex data");
          return;
        }

        db.query(
          opexQuery,
          [companyName, caseName, companyName],
          (opexErr, opexResults) => {
            if (opexErr) {
              console.error("Error fetching opex data:", opexErr);
              res.status(500).send("Error fetching opex data");
              return;
            }

            db.query(
              capexDiscQuery,
              [companyName, caseName, companyName],
              (capexDiscErr, capexDiscResults) => {
                if (capexDiscErr) {
                  console.error(
                    "Error fetching discounted capex data:",
                    capexDiscErr
                  );
                  res.status(500).send("Error fetching discounted capex data");
                  return;
                }

                db.query(
                  opexDiscQuery,
                  [companyName, caseName, companyName],
                  (opexDiscErr, opexDiscResults) => {
                    if (opexDiscErr) {
                      console.error(
                        "Error fetching discounted opex data:",
                        opexDiscErr
                      );
                      res
                        .status(500)
                        .send("Error fetching discounted opex data");
                      return;
                    }

                    const workbook = new ExcelJS.Workbook();
                    const sheet = workbook.addWorksheet("Summary");

                    const borderStyle = {
                      style: "thin",
                      color: { argb: "FF000000" },
                    };
                    const boldBorder = {
                      top: borderStyle,
                      left: borderStyle,
                      bottom: borderStyle,
                      right: borderStyle,
                    };

                    const columns = [
                      { header: "Item", key: "item", width: 45 },
                      { header: "Rate", key: "rate", width: 25 },
                      { header: "Quantity", key: "quantity", width: 25 },
                      { header: "Year 1", key: "year1", width: 25 },
                      { header: "Year 2", key: "year2", width: 25 },
                      { header: "Year 3", key: "year3", width: 25 },
                      { header: "Year 4", key: "year4", width: 25 },
                      { header: "Year 5", key: "year5", width: 25 },
                    ];

                    sheet.columns = columns;

                    const addTable = (title, data, totals) => {
                      sheet.addRow([title]).font = { bold: true };

                      sheet
                        .addRow([
                          "Item",
                          "Rate",
                          "Quantity",
                          "Year 1",
                          "Year 2",
                          "Year 3",
                          "Year 4",
                          "Year 5",
                        ])
                        .eachCell((cell) => {
                          cell.font = { bold: true };
                          cell.border = boldBorder;
                        });

                      data.forEach((item) => {
                        const row = sheet.addRow([
                          item.item,
                          Number(item.rate).toLocaleString(),
                          Number(item.quantity).toLocaleString(),
                          item.year1 !== undefined
                            ? item.year1.toLocaleString()
                            : "",
                          item.year2 !== undefined
                            ? item.year2.toLocaleString()
                            : "",
                          item.year3 !== undefined
                            ? item.year3.toLocaleString()
                            : "",
                          item.year4 !== undefined
                            ? item.year4.toLocaleString()
                            : "",
                          item.year5 !== undefined
                            ? item.year5.toLocaleString()
                            : "",
                        ]);
                        row.eachCell({ includeEmpty: true }, (cell) => {
                          cell.border = boldBorder;
                        });
                      });

                      sheet
                        .addRow([
                          `${title} Total`,
                          "",
                          "",
                          totals[0].year1.toLocaleString(),
                          totals[0].year2.toLocaleString(),
                          totals[0].year3.toLocaleString(),
                          totals[0].year4.toLocaleString(),
                          totals[0].year5.toLocaleString(),
                        ])
                        .eachCell({ includeEmpty: true }, (cell) => {
                          cell.border = boldBorder;
                        });

                      sheet.addRow([]);
                    };

                    const capexTotal = capexResults.reduce(
                      (acc, item) => {
                        acc.year1 += item.rate * item.quantity;
                        acc.year2 = 0;
                        acc.year3 = 0;
                        acc.year4 = 0;
                        acc.year5 = 0;
                        return acc;
                      },
                      { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 }
                    );

                    const opexTotal = opexResults.reduce(
                      (acc, item) => {
                        acc.year1 += item.year1 || 0;
                        acc.year2 += item.year2 || 0;
                        acc.year3 += item.year3 || 0;
                        acc.year4 += item.year4 || 0;
                        acc.year5 += item.year5 || 0;
                        return acc;
                      },
                      { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 }
                    );

                    const discCapexTotal = capexDiscResults.reduce(
                      (acc, item) => {
                        acc.year1 += item.rate * item.quantity;
                        acc.year2 = 0;
                        acc.year3 = 0;
                        acc.year4 = 0;
                        acc.year5 = 0;
                        return acc;
                      },
                      { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 }
                    );

                    const discOpexTotal = opexDiscResults.reduce(
                      (acc, item) => {
                        acc.year1 += item.year1 || 0;
                        acc.year2 += item.year2 || 0;
                        acc.year3 += item.year3 || 0;
                        acc.year4 += item.year4 || 0;
                        acc.year5 += item.year5 || 0;
                        return acc;
                      },
                      { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 }
                    );

                    // Update year values for capex and capex_disc
                    capexResults.forEach((item) => {
                      item.year1 = item.rate * item.quantity;
                      item.year2 = 0;
                      item.year3 = 0;
                      item.year4 = 0;
                      item.year5 = 0;
                    });

                    capexDiscResults.forEach((item) => {
                      item.year1 = item.rate * item.quantity;
                      item.year2 = 0;
                      item.year3 = 0;
                      item.year4 = 0;
                      item.year5 = 0;
                    });

                    addTable("Capex", capexResults, [capexTotal]);
                    addTable("Opex", opexResults, [opexTotal]);
                    addTable("Discounted Capex", capexDiscResults, [
                      discCapexTotal,
                    ]);
                    addTable("Discounted Opex", opexDiscResults, [
                      discOpexTotal,
                    ]);

                    // Calculate and add the difference table
                    const calculateDifference = (
                      capexTotal,
                      opexTotal,
                      discCapexTotal,
                      discOpexTotal
                    ) => {
                      return [
                        {
                          year1:
                            discCapexTotal.year1 +
                            discOpexTotal.year1 -
                            (capexTotal.year1 + opexTotal.year1),
                          year2:
                            discCapexTotal.year2 +
                            discOpexTotal.year2 -
                            (capexTotal.year2 + opexTotal.year2),
                          year3:
                            discCapexTotal.year3 +
                            discOpexTotal.year3 -
                            (capexTotal.year3 + opexTotal.year3),
                          year4:
                            discCapexTotal.year4 +
                            discOpexTotal.year4 -
                            (capexTotal.year4 + opexTotal.year4),
                          year5:
                            discCapexTotal.year5 +
                            discOpexTotal.year5 -
                            (capexTotal.year5 + opexTotal.year5),
                        },
                      ];
                    };

                    const difference = calculateDifference(
                      capexTotal,
                      opexTotal,
                      discCapexTotal,
                      discOpexTotal
                    );

                    sheet.addRow(["Difference"]).font = { bold: true };

                    sheet
                      .addRow([
                        "Year 1",
                        "Year 2",
                        "Year 3",
                        "Year 4",
                        "Year 5",
                      ])
                      .eachCell((cell) => {
                        cell.font = { bold: true };
                        cell.border = boldBorder;
                      });

                    sheet
                      .addRow([
                        Math.abs(difference[0].year1).toLocaleString(),
                        Math.abs(difference[0].year2).toLocaleString(),
                        Math.abs(difference[0].year3).toLocaleString(),
                        Math.abs(difference[0].year4).toLocaleString(),
                        Math.abs(difference[0].year5).toLocaleString(),
                      ])
                      .eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        cell.border = boldBorder;

                        if (difference[0][`year${colNumber}`] >= 0) {
                          cell.fill = {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: { argb: "FF00FF00" },
                          };
                          cell.font = { color: { argb: "FFFFFFFF" } };
                        } else {
                          cell.fill = {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: { argb: "FFFF0000" },
                          };
                          cell.font = { color: { argb: "FFFFFFFF" } };
                        }
                      });

                    res.setHeader(
                      "Content-Disposition",
                      `attachment; filename=${caseName}_summary.xlsx`
                    );

                    workbook.xlsx.write(res).then(() => {
                      res.status(200).end();
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  }
);

app.get("/styles.css", function (req, res) {
  res.setHeader("Content-Type", "text/css");
  res.sendFile(path.join(__dirname, "/public/css/styles.css"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
