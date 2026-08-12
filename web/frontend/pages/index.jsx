import {
  Page,
  Layout,
  Card,
  Text,
  Stack,
  DataTable,
  Badge,
  Button,
  ProgressBar
} from "@shopify/polaris";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const MOCK_STATS = {
  total_courses: 4,
  total_students: 8,
  total_enrollments: 12,
  completed_enrollments: 5,
  active_enrollments: 7,
  recent_enrollments: [
    { name: "Alice Smith", title: "Intro to Shopify App Development", enrollment_date: "2026-08-10", status: "In Progress" },
    { name: "Bob Johnson", title: "Advanced Polaris UI Mastery", enrollment_date: "2026-08-09", status: "Completed" },
    { name: "Charlie Davis", title: "GraphQL Admin API Deep Dive", enrollment_date: "2026-08-08", status: "In Progress" },
    { name: "Diana Prince", title: "Liquid Storefront Customization", enrollment_date: "2026-08-07", status: "Completed" }
  ]
};

const MOCK_SHOP = {
  name: "Vinupriya's Dev Store",
  email: "vinupriyaenova@gmail.com",
  primaryDomain: { url: "vinupriya-sybft323.myshopify.com" }
};

export default function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(MOCK_STATS);
  const [shopInfo, setShopInfo] = useState(MOCK_SHOP);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, shopRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/shop")
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (shopRes.ok) setShopInfo(await shopRes.json());
      } catch (error) {
        console.log("Using Mock Data for Vercel Standalone Preview");
        setStats(MOCK_STATS);
        setShopInfo(MOCK_SHOP);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  // test llog
  const totalEnrollments = stats?.total_enrollments || 1;
  const completedEnrollments = stats?.completed_enrollments || 0;
  const completionRate = Math.round((completedEnrollments / totalEnrollments) * 100);

  const recentRows = (stats?.recent_enrollments || MOCK_STATS.recent_enrollments).map((enrollment) => [
    enrollment.name,
    enrollment.title,
    new Date(enrollment.enrollment_date).toLocaleDateString(),
    <Badge status={enrollment.status === 'Completed' ? 'success' : 'attention'}>{enrollment.status || 'Active'}</Badge>
  ]);

  return (
    <Page fullWidth>
      <Layout>
        {/* Welcome Header Banner */}
        <Layout.Section>
          <div style={{
            background: "linear-gradient(135deg, #111827 0%, #1F2937 100%)",
            borderRadius: "12px",
            padding: "24px 32px",
            color: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
            marginBottom: "10px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px" }}>
                    {shopInfo ? `${shopInfo.name} Overview` : "LMS Control Center"}
                  </span>
                  <span style={{
                    background: "rgba(150, 191, 72, 0.2)",
                    color: "#96bf48",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600",
                    border: "1px solid rgba(150, 191, 72, 0.4)"
                  }}>
                    🟢 Live API & GraphQL Connected
                  </span>
                </div>
                <p style={{ color: "#9CA3AF", fontSize: "14px", margin: 0 }}>
                  Connected Email: <strong style={{ color: "#E5E7EB" }}>{shopInfo?.email}</strong> | Domain: <strong style={{ color: "#E5E7EB" }}>{shopInfo?.primaryDomain?.url}</strong>
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Button primary onClick={() => navigate("/courses")}>Manage Courses</Button>
                <Button onClick={() => navigate("/students")}>Manage Enrollments</Button>
              </div>
            </div>
          </div>
        </Layout.Section>

        {/* Metric Cards */}
        <Layout.Section oneThird>
          <Card sectioned>
            <Stack vertical spacing="extraTight">
              <Text as="h3" variant="headingSm" color="subdued">Total Courses Offered</Text>
              <Text as="p" variant="heading3xl">{isLoading ? "-" : stats.total_courses}</Text>
              <Text color="subdued" variant="bodySm">Active catalog courses</Text>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section oneThird>
          <Card sectioned>
            <Stack vertical spacing="extraTight">
              <Text as="h3" variant="headingSm" color="subdued">Total Students Registered</Text>
              <Text as="p" variant="heading3xl">{isLoading ? "-" : stats.total_students}</Text>
              <Text color="subdued" variant="bodySm">Active learners in database</Text>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section oneThird>
          <Card sectioned>
            <Stack vertical spacing="extraTight">
              <Text as="h3" variant="headingSm" color="subdued">Overall Completion Rate</Text>
              <Text as="p" variant="heading3xl">{isLoading ? "-" : `${completionRate}%`}</Text>
              <div style={{ marginTop: "8px" }}>
                <ProgressBar progress={completionRate} status="primary" size="small" />
              </div>
              <Text color="subdued" variant="bodySm">
                {stats.completed_enrollments} Completed of {stats.total_enrollments} Total
              </Text>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Recent Activity Table */}
        <Layout.Section>
          <Card title="Recent Student Enrollments" sectioned>
            {recentRows.length > 0 ? (
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text']}
                headings={['Student Name', 'Course Enrolled', 'Date', 'Status']}
                rows={recentRows}
              />
            ) : (
              <Text as="p" color="subdued">No recent enrollments to show.</Text>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
