import {
  Page,
  Layout,
  Card,
  IndexTable,
  useIndexResourceState,
  Text,
  Badge,
  Button,
  Modal,
  FormLayout,
  Select,
  ButtonGroup,
  EmptyState,
  TextField,
  Pagination
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useState, useEffect, useCallback } from "react";

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
    <path d="M14.707 6.293a1 1 0 0 0-1.414 0L8 11.586 5.707 9.293a1 1 0 0 0-1.414 1.414l3 3a1 1 0 0 0 1.414 0l6-6a1 1 0 0 0 0-1.414z"/>
  </svg>
);

export default function StudentsPage() {
  const shopify = useAppBridge();
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ student_id: '', course_id: '', status: 'In Progress' });
  const [formErrors, setFormErrors] = useState({});

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [studentsRes, enrollmentsRes, coursesRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/enrollments"),
        fetch("/api/courses")
      ]);
      
      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (enrollmentsRes.ok) setEnrollments(await enrollmentsRes.json());
      if (coursesRes.ok) setCourses(await coursesRes.json());
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter & Paginate
  const filteredEnrollments = enrollments.filter(e => 
    e.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.course_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage) || 1;
  const paginatedEnrollments = filteredEnrollments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(paginatedEnrollments);

  const openEnrollModal = () => {
    setFormData({ student_id: students[0]?.id || '', course_id: courses[0]?.id || '', status: 'In Progress' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setFormErrors({});
  }, []);

  const handleEnroll = async () => {
    if (!formData.student_id || !formData.course_id) {
      setFormErrors({ general: "Please select both a student and a course." });
      return;
    }

    try {
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const responseData = await response.json();

      if (!response.ok) throw new Error(responseData.error || "Failed to enroll student");

      shopify.toast.show("Student successfully enrolled!");
      handleModalClose();
      fetchData();
    } catch (error) {
      shopify.toast.show(error.message, { isError: true });
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/enrollments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error("Failed to update status");
      shopify.toast.show("Status updated");
      fetchData();
    } catch(error) {
      shopify.toast.show(error.message, { isError: true });
    }
  };

  const resourceName = { singular: 'enrollment', plural: 'enrollments' };

  const rowMarkup = paginatedEnrollments.map(
    (enrollment, index) => (
      <IndexTable.Row id={enrollment.id.toString()} key={enrollment.id} position={index} selected={selectedResources.includes(enrollment.id.toString())}>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">{enrollment.student_name}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{enrollment.course_title}</IndexTable.Cell>
        <IndexTable.Cell>{new Date(enrollment.enrollment_date).toLocaleDateString()}</IndexTable.Cell>
        <IndexTable.Cell>
          <Badge status={enrollment.status === 'Completed' ? 'success' : 'attention'}>{enrollment.status}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <ButtonGroup>
             <Button icon={CheckIcon} onClick={() => updateStatus(enrollment.id, 'Completed')} disabled={enrollment.status === 'Completed'} accessibilityLabel="Mark Completed" />
          </ButtonGroup>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <Page fullWidth title="Students & Enrollments">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
              <div style={{ flexGrow: 1 }}>
                <TextField
                  label=""
                  labelHidden
                  value={searchQuery}
                  onChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
                  placeholder="Search by student name or course..."
                  clearButton
                  onClearButtonClick={() => setSearchQuery('')}
                  autoComplete="off"
                />
              </div>
              <Button primary onClick={openEnrollModal}>Enroll Student</Button>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            {filteredEnrollments.length === 0 && !isLoading ? (
                <EmptyState
                    heading="No enrollments found"
                    action={{ content: 'Enroll Student', onAction: openEnrollModal }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                    <p>Start by enrolling a student into a course.</p>
                </EmptyState>
            ) : (
                <>
                  <IndexTable
                    resourceName={resourceName}
                    itemCount={filteredEnrollments.length}
                    selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
                    onSelectionChange={handleSelectionChange}
                    headings={[
                      { title: 'Student Name' },
                      { title: 'Course' },
                      { title: 'Enrollment Date' },
                      { title: 'Status' },
                      { title: 'Actions' }
                    ]}
                    loading={isLoading}
                  >
                    {rowMarkup}
                  </IndexTable>
                  <Card.Section>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Pagination
                        hasPrevious={currentPage > 1}
                        onPrevious={() => setCurrentPage(prev => prev - 1)}
                        hasNext={currentPage < totalPages}
                        onNext={() => setCurrentPage(prev => prev + 1)}
                      />
                    </div>
                  </Card.Section>
                </>
            )}
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={isModalOpen}
        onClose={handleModalClose}
        title="Enroll Student into Course"
        primaryAction={{ content: 'Enroll Student', onAction: handleEnroll }}
        secondaryActions={[{ content: 'Cancel', onAction: handleModalClose }]}
      >
        <Modal.Section>
          <FormLayout>
            <Select 
              label="Student" 
              options={students.map(s => ({ label: `${s.name} (${s.email})`, value: s.id.toString() }))} 
              value={formData.student_id.toString()} 
              onChange={(val) => setFormData({...formData, student_id: val})} 
            />
            <Select 
              label="Course" 
              options={courses.map(c => ({ label: c.title, value: c.id.toString() }))} 
              value={formData.course_id.toString()} 
              onChange={(val) => setFormData({...formData, course_id: val})} 
            />
            <Select
              label="Initial Status"
              options={[
                {label: 'In Progress', value: 'In Progress'},
                {label: 'Completed', value: 'Completed'}
              ]}
              value={formData.status}
              onChange={(val) => setFormData({...formData, status: val})}
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
