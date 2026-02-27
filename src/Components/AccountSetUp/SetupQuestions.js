const questions = [
    {
        id: 1,
        key: "role",
        text: "Occupation",
        type: "select",
        options: ["Student", "Educator"],
        roles: ["student", "educator"],
        required: true
    },
    {
        id: 2,
        key: "DOB",
        text: "Date of Birth",
        type: "date",
        roles: ["student", "educator"],
        required: true
    },
    {
        id: 3,
        key: "school",
        text: "School/Institution Name",
        type: "text",
        roles: ["student", "educator"],
        required: true
    }
];

export default questions
