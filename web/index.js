// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import db from "./db.js";
import PrivacyWebhookHandlers from "./privacy.js";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// Public App Proxy Route (No Admin Auth Required)
app.get("/api/proxy/dashboard", async (req, res) => {
  const customerId = req.query.logged_in_customer_id;
  
  if (!customerId) {
    return res.status(200).set("Content-Type", "application/liquid").send("<div>Please log in to view your courses.</div>");
  }

  try {
    const [students] = await db.query("SELECT * FROM students WHERE shopify_customer_id = ?", [customerId]);
    let studentId = students.length > 0 ? students[0].id : null;

    let enrollmentsHtml = "<p>You are not enrolled in any courses yet.</p>";
    if (studentId) {
      const [enrollments] = await db.query(`
        SELECT c.title, e.enrollment_date, e.status, c.duration
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = ?
        ORDER BY e.id DESC
      `, [studentId]);

      if (enrollments.length > 0) {
        enrollmentsHtml = `
          <table style="width: 100%; text-align: left; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #ddd;">
                <th style="padding: 10px;">Course Name</th>
                <th style="padding: 10px;">Duration</th>
                <th style="padding: 10px;">Status</th>
                <th style="padding: 10px;">Enrolled On</th>
              </tr>
            </thead>
            <tbody>
              ${enrollments.map(e => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 10px; font-weight: bold;">${e.title}</td>
                  <td style="padding: 10px;">${e.duration}</td>
                  <td style="padding: 10px;">
                    <span style="background: ${e.status === 'Completed' ? '#c0eb75' : '#ffd43b'}; padding: 4px 8px; border-radius: 12px; font-size: 12px;">${e.status}</span>
                  </td>
                  <td style="padding: 10px;">${new Date(e.enrollment_date).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
    }

    const html = `
      <div style="max-width: 800px; margin: 40px auto; font-family: sans-serif;">
        <h1 style="font-size: 2em; margin-bottom: 5px;">My Learning Dashboard</h1>
        <p style="color: #666; margin-bottom: 30px;">Welcome back! Here are your active and completed courses.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          ${enrollmentsHtml}
        </div>
      </div>
    `;

    res.status(200).set("Content-Type", "application/liquid").send(html);
  } catch (error) {
    res.status(200).set("Content-Type", "application/liquid").send("<div>Error loading dashboard.</div>");
  }
});

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

// LMS API Routes

app.get("/api/stats", async (_req, res) => {
  try {
    const [courses] = await db.query("SELECT COUNT(*) as count FROM courses");
    const [students] = await db.query("SELECT COUNT(*) as count FROM students");
    const [enrollments] = await db.query("SELECT COUNT(*) as count FROM enrollments");
    const [completed] = await db.query("SELECT COUNT(*) as count FROM enrollments WHERE status = 'Completed'");
    const [active] = await db.query("SELECT COUNT(*) as count FROM enrollments WHERE status = 'In Progress'");
    const [recent] = await db.query(`
      SELECT s.name, c.title, e.enrollment_date 
      FROM enrollments e 
      JOIN students s ON e.student_id = s.id 
      JOIN courses c ON e.course_id = c.id 
      ORDER BY e.id DESC LIMIT 5
    `);
    
    res.status(200).send({
      total_courses: courses[0].count,
      total_students: students[0].count,
      total_enrollments: enrollments[0].count,
      completed_enrollments: completed[0].count,
      active_enrollments: active[0].count,
      recent_enrollments: recent
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/api/courses", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM courses ORDER BY id DESC");
    res.status(200).send(rows);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post("/api/courses", async (req, res) => {
  const { title, description, instructor_name, category, duration, status } = req.body;
  if (!title || !instructor_name) {
    return res.status(400).send({ error: "Title and Instructor Name are required" });
  }
  try {
    const [result] = await db.query(
      "INSERT INTO courses (title, description, instructor_name, category, duration, status) VALUES (?, ?, ?, ?, ?, ?)",
      [title, description, instructor_name, category, duration, status || 'Active']
    );
    res.status(201).send({ id: result.insertId });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.put("/api/courses/:id", async (req, res) => {
  const { title, description, instructor_name, category, duration, status } = req.body;
  if (!title || !instructor_name) {
    return res.status(400).send({ error: "Title and Instructor Name are required" });
  }
  try {
    await db.query(
      "UPDATE courses SET title = ?, description = ?, instructor_name = ?, category = ?, duration = ?, status = ? WHERE id = ?",
      [title, description, instructor_name, category, duration, status, req.params.id]
    );
    res.status(200).send({ success: true });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.delete("/api/courses/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM courses WHERE id = ?", [req.params.id]);
    res.status(200).send({ success: true });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/api/students", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM students ORDER BY id DESC");
    res.status(200).send(rows);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/api/enrollments", async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.id, e.enrollment_date, e.status, s.name as student_name, c.title as course_title, e.student_id, e.course_id
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN courses c ON e.course_id = c.id
      ORDER BY e.id DESC
    `);
    res.status(200).send(rows);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post("/api/enrollments", async (req, res) => {
  const { student_id, course_id, status } = req.body;
  try {
    const [existing] = await db.query("SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?", [student_id, course_id]);
    if (existing.length > 0) {
      return res.status(409).send({ error: "Student is already enrolled in this course." });
    }
    
    const [result] = await db.query(
      "INSERT INTO enrollments (student_id, course_id, enrollment_date, status) VALUES (?, ?, NOW(), ?)",
      [student_id, course_id, status || 'In Progress']
    );
    res.status(201).send({ id: result.insertId });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.put("/api/enrollments/:id", async (req, res) => {
  const { status } = req.body;
  try {
    await db.query("UPDATE enrollments SET status = ? WHERE id = ?", [status, req.params.id]);
    res.status(200).send({ success: true });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/api/shop", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  try {
    const shopData = await client.request(`
      query {
        shop {
          name
          email
          primaryDomain {
            url
            host
          }
        }
      }
    `);
    res.status(200).send(shopData.data.shop);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT);
