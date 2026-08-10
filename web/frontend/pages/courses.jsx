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
  TextField,
  Select,
  ButtonGroup,
  Pagination
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useState, useEffect, useCallback } from "react";

// Standard SVG Icons
const EditIcon = () => (
  <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
    <path d="M13.875 2.5a2.125 2.125 0 0 1 3 3l-9.5 9.5-3.625.625.625-3.625 9.5-9.5z"/>
  </svg>
);

const DeleteIcon = () => (
  <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
    <path d="M6 7v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7H6zm4-3a1 1 0 0 0-1 1v1h4V5a1 1 0 0 0-1-1h-2z"/>
  </svg>
);

export default function CoursesPage() {
  const shopify = useAppBridge();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, title: '', instructor_name: '', category: '', duration: '', status: 'Active' });
  const [formErrors, setFormErrors] = useState({});

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error("Failed to fetch courses", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter & Paginate
  const filteredCourses = courses.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.instructor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage) || 1;
  const paginatedCourses = filteredCourses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(paginatedCourses);

  const openCreateModal = () => {
    setFormData({ id: null, title: '', instructor_name: '', category: '', duration: '', status: 'Active' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (course) => {
    setFormData({ ...course });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setFormErrors({});
  }, []);

  const handleSave = async () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Course title is required";
    if (!formData.instructor_name.trim()) errors.instructor_name = "Instructor name is required";
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const method = formData.id ? "PUT" : "POST";
      const url = formData.id ? `/api/courses/${formData.id}` : "/api/courses";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Failed to save course");

      shopify.toast.show(`Course successfully ${formData.id ? 'updated' : 'created'}!`);
      handleModalClose();
      fetchCourses();
    } catch (error) {
      shopify.toast.show(error.message, { isError: true });
    }
  };

  const handleDelete = async (id) => {
    if(confirm("Are you sure you want to delete this course?")) {
      try {
        const response = await fetch(`/api/courses/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete course");
        shopify.toast.show("Course deleted");
        fetchCourses();
      } catch(error) {
        shopify.toast.show(error.message, { isError: true });
      }
    }
  };

  const resourceName = { singular: 'course', plural: 'courses' };

  const rowMarkup = paginatedCourses.map(
    (course, index) => (
      <IndexTable.Row id={course.id.toString()} key={course.id} position={index} selected={selectedResources.includes(course.id.toString())}>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">{course.title}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{course.instructor_name}</IndexTable.Cell>
        <IndexTable.Cell>{course.category || 'General'}</IndexTable.Cell>
        <IndexTable.Cell>{course.duration || 'N/A'}</IndexTable.Cell>
        <IndexTable.Cell>
          <Badge status={course.status === 'Active' ? 'success' : 'attention'}>{course.status}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <ButtonGroup title="Actions">
             <Button icon={EditIcon} onClick={() => openEditModal(course)} accessibilityLabel="Edit course" />
             <Button icon={DeleteIcon} destructive onClick={() => handleDelete(course.id)} accessibilityLabel="Delete course" />
          </ButtonGroup>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <Page fullWidth title="Courses">
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
                  placeholder="Search courses by title, instructor, or category..."
                  clearButton
                  onClearButtonClick={() => setSearchQuery('')}
                  autoComplete="off"
                />
              </div>
              <Button primary onClick={openCreateModal}>Create Course</Button>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <IndexTable
              resourceName={resourceName}
              itemCount={filteredCourses.length}
              selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: 'Title' },
                { title: 'Instructor' },
                { title: 'Category' },
                { title: 'Duration' },
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
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={isModalOpen}
        onClose={handleModalClose}
        title={formData.id ? "Edit Course" : "Create New Course"}
        primaryAction={{ content: 'Save Course', onAction: handleSave }}
        secondaryActions={[{ content: 'Cancel', onAction: handleModalClose }]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField 
              label="Course Title" 
              value={formData.title} 
              onChange={(val) => setFormData({...formData, title: val})} 
              error={formErrors.title} 
              autoComplete="off" 
            />
            <TextField 
              label="Instructor Name" 
              value={formData.instructor_name} 
              onChange={(val) => setFormData({...formData, instructor_name: val})} 
              error={formErrors.instructor_name} 
              autoComplete="off" 
            />
            <FormLayout.Group>
               <TextField label="Category" value={formData.category} onChange={(val) => setFormData({...formData, category: val})} autoComplete="off" />
               <TextField label="Duration (e.g. 5 Hours)" value={formData.duration} onChange={(val) => setFormData({...formData, duration: val})} autoComplete="off" />
            </FormLayout.Group>
            <Select
              label="Status"
              options={[
                {label: 'Active', value: 'Active'},
                {label: 'Draft', value: 'Draft'},
                {label: 'Archived', value: 'Archived'}
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
