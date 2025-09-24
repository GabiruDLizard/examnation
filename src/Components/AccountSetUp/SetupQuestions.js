const questions = [
    {
        id: 1,
        key: "role",
        text: "Occupation",
        type: "select",
        options: ["Student", "Parent", "Educator"],
        roles: ["student", "parent", "educator"],
        required: true
    },
    {
        id: 2,
        key: "DOB",
        text: "Date of Birth",
        type: "date",
        roles: ["student", "parent", "educator"],
        required: true
    },
    {
        id: 3,
        key: "Subjects",
        text: "Which subjects are you most involved with?",
        type: "multiselect",
        options: ["Math", "English", "Science", "Social Studies", "Other"],
        roles: ["student", "educator"],
        required: false
    },
    {
        id: 4,
        key: "NationalExams",
        text: "Are you preparing for national exams this year?",
        type: "boolean",
        roles: ["student"],
        required: true
    },
    {
        id: 5,
        key: "grade",
        text: "Which grade level do you teach or attend?",
        type: "select",
        options: ["Primary", "Junior High", "Senior High", "College/University"],
        roles: ["student", "educator"],
        required: false
    },
    {
        id: 6,
        key: "educatororparent",
        text: "Do you manage or monitor student performance?",
        type: "boolean",
        roles: ["parent", "educator"],
        required: false
    },
    {
        id: 7,
        key: "learningformat",
        text: "Preferred learning format",
        type: "select",
        options: ["Self-paced", "Classroom", "Online Tutoring"],
        roles: ["student", "educator"],
        required: true
    },
    {
        id: 8,
        key: "analytics",
        text: "Do you want performance analytics and reports?",
        type: "boolean",
        roles: ["student", "parent", "educator"],
        required: true
    },
    {
        id: 9,
        key: "school",
        text: "School/Institution Name",
        type: "text",
        roles: ["student", "educator"],
        required: true
    },
    {
        id: 10,
        key: "numofstudents",
        text: "Number of students you manage",
        type: "number",
        roles: ["educator", "parent"],
        required: false
    }
];

export default questions
