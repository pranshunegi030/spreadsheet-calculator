const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");

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
    res.redirect("/login");
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
      res.redirect("/login");
    } else {
      const user = results[0];
      if (user.password === password) {
        req.session.user = user;
        res.redirect("/dashboard");
      } else {
        req.flash("message", "Incorrect password.");
        res.redirect("/login");
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

app.get("/provisional", isAuthenticated, (req, res) => {
  const query = "SELECT * FROM companies";
  db.query(query, (err, results) => {
    if (err) throw err;
    res.render("provisional", { user: req.session.user, companies: results });
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

app.get(
  "/proposedDashboard/:companyId/:caseId",
  isAuthenticated,
  (req, res) => {
    const { companyId, caseId } = req.params;
    const capexQuery =
      "SELECT * FROM capex WHERE company_id = ? AND case_id = ?";
    const opexQuery = "SELECT * FROM opex WHERE company_id = ? AND case_id = ?";

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
          companyId: companyId,
          caseId: caseId,
          capex: capexResults,
          opex: opexResults,
          capexTotal: capexTotal,
          opexTotal: opexTotal,
        });
      });
    });
  }
);

app.get("/addCase/:companyId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const query = "SELECT * FROM cases WHERE company_id = ?";
  db.query(query, [companyId], (err, results) => {
    if (err) throw err;
    res.render("addCase", {
      user: req.session.user,
      companyId: companyId,
      cases: results,
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

app.get("/addCapex/:companyId/:caseId", isAuthenticated, (req, res) => {
  const { companyId, caseId } = req.params;
  const query = "SELECT * FROM capex WHERE company_id = ? AND case_id = ?";
  db.query(query, [companyId, caseId], (err, results) => {
    if (err) throw err;
    res.render("addCapex", {
      user: req.session.user,
      companyId: companyId,
      caseId: caseId,
      capex: results,
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
  const query = "SELECT * FROM capex WHERE id = ?";
  db.query(query, [capexId], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.render("editCapex", {
        user: req.session.user,
        companyId: results[0].company_id,
        caseId: results[0].case_id, // Include caseId
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
  const query = "SELECT * FROM opex WHERE company_id = ? AND case_id = ?";
  db.query(query, [companyId, caseId], (err, results) => {
    if (err) throw err;
    res.render("addOpex", {
      user: req.session.user,
      companyId: companyId,
      caseId: caseId,
      opex: results,
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

  if (payment_year <= 4) year5 = (rate * quantity) / (5 - payment_year);
  if (payment_year <= 3) year4 = (rate * quantity) / (5 - payment_year);
  if (payment_year <= 2) year3 = (rate * quantity) / (5 - payment_year);
  if (payment_year <= 1) year2 = (rate * quantity) / (5 - payment_year);

  // Ensure all values are correctly included
  const query =
    "INSERT INTO opex (company_id, case_id, item, rate, quantity, payment_year, year1, year2, year3, year4, year5) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
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
  const { companyId, caseId } = req.query; // Extract query parameters
  const query =
    "SELECT * FROM opex WHERE id = ? AND company_id = ? AND case_id = ?";
  db.query(query, [opexId, companyId, caseId], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.render("editOpex", {
        user: req.session.user,
        companyId: results[0].company_id,
        caseId: results[0].case_id,
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

  if (payment_year <= 4) year5 = (rate * quantity) / (5 - payment_year);
  if (payment_year <= 3) year4 = (rate * quantity) / (5 - payment_year);
  if (payment_year <= 2) year3 = (rate * quantity) / (5 - payment_year);
  if (payment_year <= 1) year2 = (rate * quantity) / (5 - payment_year);

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
app.get("/viewSummary/:companyId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const capexQuery = "SELECT * FROM capex WHERE company_id = ?";
  const opexQuery = "SELECT * FROM opex WHERE company_id = ?";

  db.query(capexQuery, [companyId], (capexErr, capexResults) => {
    if (capexErr) throw capexErr;

    db.query(opexQuery, [companyId], (opexErr, opexResults) => {
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

      res.render("viewSummary", {
        user: req.session.user,
        companyId: companyId,
        capex: capexResults,
        opex: opexResults,
        capexTotal: capexTotal,
        opexTotal: opexTotal,
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
  const capexQuery =
    "SELECT * FROM capex_disc WHERE company_id = ? AND case_id = ?";
  const opexQuery =
    "SELECT * FROM opex_disc WHERE company_id = ? AND case_id = ?";

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
        companyId: companyId,
        caseId: caseId,
        capex: capexResults,
        opex: opexResults,
        capexTotal: capexTotal,
        opexTotal: opexTotal,
      });
    });
  });
});

app.get("/addCaseDisc/:companyId", isAuthenticated, (req, res) => {
  const companyId = req.params.companyId;
  const query = "SELECT * FROM case_disc WHERE company_id = ?";
  db.query(query, [companyId], (err, results) => {
    if (err) throw err;
    res.render("addCaseDisc", {
      user: req.session.user,
      companyId: companyId,
      cases: results,
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
  const query = "SELECT * FROM capex_disc WHERE company_id = ? AND case_id = ?";
  db.query(query, [companyId, caseId], (err, results) => {
    if (err) throw err;
    res.render("addCapexDisc", {
      user: req.session.user,
      companyId: companyId,
      caseId: caseId,
      capex: results,
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
  const query = "SELECT * FROM capex_disc WHERE id = ?";
  db.query(query, [capexId], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.render("editCapexDisc", {
        user: req.session.user,
        companyId: results[0].company_id,
        caseId: results[0].case_id, // Include caseId
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
  const query = "SELECT * FROM opex_disc WHERE company_id = ? AND case_id = ?";
  db.query(query, [companyId, caseId], (err, results) => {
    if (err) throw err;
    res.render("addOpexDisc", {
      user: req.session.user,
      companyId: companyId,
      caseId: caseId,
      opex: results,
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
    year1 = year2 = year3 = year4 = year5 = (rate * quantity) / 5;
  } else {
    if (payment_year <= 4) year5 = (rate * quantity) / (5 - payment_year);
    if (payment_year <= 3) year4 = (rate * quantity) / (5 - payment_year);
    if (payment_year <= 2) year3 = (rate * quantity) / (5 - payment_year);
    if (payment_year <= 1) year2 = (rate * quantity) / (5 - payment_year);
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
  const { companyId, caseId } = req.query; // Extract query parameters
  const query =
    "SELECT * FROM opex_disc WHERE id = ? AND company_id = ? AND case_id = ?";
  db.query(query, [opexId, companyId, caseId], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.render("editOpexDisc", {
        user: req.session.user,
        companyId: results[0].company_id,
        caseId: results[0].case_id,
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
    year1 = year2 = year3 = year4 = year5 = (rate * quantity) / 5;
  } else {
    if (payment_year <= 4) year5 = (rate * quantity) / (5 - payment_year);
    if (payment_year <= 3) year4 = (rate * quantity) / (5 - payment_year);
    if (payment_year <= 2) year3 = (rate * quantity) / (5 - payment_year);
    if (payment_year <= 1) year2 = (rate * quantity) / (5 - payment_year);
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
  const companyId = req.params.companyId;
  const caseId = req.params.caseId;
  const capexQuery =
    "SELECT * FROM capex_disc WHERE company_id = ? AND case_id = ?";
  const opexQuery =
    "SELECT * FROM opex_disc WHERE company_id = ? AND case_id = ?";

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
        companyId: companyId,
        caseId: caseId,
        capex: capexResults,
        opex: opexResults,
        capexTotal: capexTotal,
        opexTotal: opexTotal,
      });
    });
  });
});

app.get("/compare", isAuthenticated, (req, res) => {
  const query = `
    SELECT name
    FROM companies
    WHERE id IN (SELECT company_id FROM cases)
       OR id IN (SELECT company_id FROM case_disc)
  `;
  db.query(query, (err, results) => {
    if (err) throw err;
    res.render("compare", { user: req.session.user, companies: results });
  });
});

app.get("/compare/:companyName", isAuthenticated, (req, res) => {
  const companyName = req.params.companyName;
  const casesQuery = `
    SELECT case_name
    FROM cases
    WHERE company_id = (SELECT id FROM companies WHERE name = ?)
    UNION
    SELECT case_name
    FROM case_disc
    WHERE company_id = (SELECT id FROM companies WHERE name = ?)
  `;
  db.query(casesQuery, [companyName, companyName], (err, results) => {
    if (err) throw err;
    res.render("compareCases", {
      user: req.session.user,
      companyName: companyName,
      cases: results,
    });
  });
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

app.get("/styles.css", function (req, res) {
  res.setHeader("Content-Type", "text/css");
  res.sendFile(path.join(__dirname, "/public/css/styles.css"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
