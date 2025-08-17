const questions = [
    {
        id: 1,
        text: "Occupation",
        type: "select",
        options: ["Student", "Parent", "Educator"],
        roles: ["student", "parent", "educator"]
    },
    {
        id: 2,
        text: "Date of Birth",
        type: "date",
        roles: ["student", "parent", "educator"]
    },
    {
        id: 3,
        text: "Which subjects are you most involved with?",
        type: "multiselect",
        options: ["Math", "English", "Science", "Social Studies", "Other"],
        roles: ["student", "educator"]
    },
    {
        id: 4,
        text: "Are you preparing for national exams this year?",
        type: "boolean",
        roles: ["student"]
    },
    {
        id: 5,
        text: "Which grade level do you teach or attend?",
        type: "select",
        options: ["Primary", "Junior High", "Senior High", "College/University"],
        roles: ["student", "educator"]
    },
    {
        id: 6,
        text: "Do you manage or monitor student performance?",
        type: "boolean",
        roles: ["parent", "educator"]
    },
    {
        id: 7,
        text: "Preferred learning format",
        type: "select",
        options: ["Self-paced", "Classroom", "Online Tutoring"],
        roles: ["student", "educator"]
    },
    {
        id: 8,
        text: "Do you want performance analytics and reports?",
        type: "boolean",
        roles: ["student", "parent", "educator"]
    },
    {
        id: 9,
        text: "School/Institution Name",
        type: "text",
        roles: ["student", "educator"]
    },
    {
        id: 10,
        text: "Number of students you manage",
        type: "number",
        roles: ["educator", "parent"]
    }
];
