import {
  Page,
  Layout,
  Card,
  Text,
  Stack,
  DataTable
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [stats, setStats] = useState({
    total_courses: 0,
    total_students: 0,
    total_enrollments: 0,
    completed_enrollments: 0,
    active_enrollments: 0,
    recent_enrollments: []
  });
  const [shopInfo, setShopInfo] = useState(null);
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
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const recentRows = (stats.recent_enrollments || []).map((enrollment) => [
    enrollment.name,
    enrollment.title,
    new Date(enrollment.enrollment_date).toLocaleDateString()
  ]);

  return (
    <Page fullWidth>
      <TitleBar title="Shopify LMS Dashboard" primaryAction={null} />
      <Layout>
        {shopInfo && (
          <Layout.Section>
            <Card sectioned>
              <Stack vertical spacing="tight">
                <Text as="h2" variant="headingLg">
                  Welcome to {shopInfo.name}'s Learning Management System
                </Text>
                <Text as="p" color="subdued">
                  Connected Store Email: {shopInfo.email} | Domain: {shopInfo.primaryDomain?.url}
                </Text>
              </Stack>
            </Card>
          </Layout.Section>
        )}

        <Layout.Section oneThird>
          <Card sectioned>
            <Stack vertical spacing="extraTight">
              <Text as="h3" variant="headingSm" color="subdued">Total Courses</Text>
              <Text as="p" variant="heading3xl">{isLoading ? "-" : stats.total_courses}</Text>
            </Stack>
          </Card>
        </Layout.Section>
        
        <Layout.Section oneThird>
          <Card sectioned>
            <Stack vertical spacing="extraTight">
              <Text as="h3" variant="headingSm" color="subdued">Total Students</Text>
              <Text as="p" variant="heading3xl">{isLoading ? "-" : stats.total_students}</Text>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section oneThird>
          <Card sectioned>
            <Stack vertical spacing="extraTight">
              <Text as="h3" variant="headingSm" color="subdued">Total Enrollments</Text>
              <Text as="p" variant="heading3xl">{isLoading ? "-" : stats.total_enrollments}</Text>
              <Text as="p" color="subdued" variant="bodySm">
                 Active: {isLoading ? "-" : stats.active_enrollments} | Completed: {isLoading ? "-" : stats.completed_enrollments}
              </Text>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Recently Enrolled Students" sectioned>
             {recentRows.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'text']}
                  headings={['Student Name', 'Course', 'Date']}
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
